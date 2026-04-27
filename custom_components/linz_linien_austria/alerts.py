"""Service-disruption / line-info alerts from XML_ADDINFO_REQUEST.

LINZ AG LINIEN's EFA stack exposes editorial notices (line detours, stop
relocations, schedule changes) via a separate ``XML_ADDINFO_REQUEST``
endpoint. The DM_REQUEST does NOT carry them inline — fetching them is
its own request, with a different cache lifetime than departures.

Pattern mirrors wiener-linien-austria's ``alerts.py``:

* One domain-wide refresh task, 5-min cadence, shared across all
  entries. Cache lives in ``hass.data[DOMAIN][ALERTS_KEY]`` and each
  entry's coordinator copies the slice it cares about into its own
  payload at refresh time.
* Per-entry filtering happens at *read* time on the entity (cheap dict
  lookup), so adding a new entry doesn't multiply the upstream request
  rate.
* Refresh task is started when the first entry sets up and torn down
  when the last entry is removed (entry-count refcount in
  ``hass.data[DOMAIN][ENTRY_COUNT_KEY]``).
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Any

import aiohttp
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_track_time_interval

from .const import (
    ADDINFO_ENDPOINT,
    ALERTS_KEY,
    ALERTS_REFRESH_SECONDS,
    ALERTS_REFRESH_UNSUB_KEY,
    API_BASE_URL,
    DOMAIN,
    USER_AGENT,
)

_LOGGER = logging.getLogger(__name__)

REQUEST_TIMEOUT_SEC = 30


@dataclass(slots=True)
class TrafficInfo:
    """One LINZ AG LINIEN service-disruption notice.

    Schema deliberately matches the same-named dataclass in
    wiener-linien-austria so a future shared card library would only need
    to bridge the field names — same attributes, same downstream UI.
    """

    info_id: str  # stable upstream id
    title: str
    description: str  # plain text (HTML stripped)
    description_html: str  # original HTML if you want to render it
    affected_lines: list[str] = field(default_factory=list)
    info_type: str = ""  # "lineInfo", "stopInfo", ...
    priority: str = "normal"
    valid_from: str | None = None  # ISO local
    valid_to: str | None = None
    created: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "info_id": self.info_id,
            "title": self.title,
            "description": self.description,
            "description_html": self.description_html,
            "affected_lines": list(self.affected_lines),
            "info_type": self.info_type,
            "priority": self.priority,
            "valid_from": self.valid_from,
            "valid_to": self.valid_to,
            "created": self.created,
        }


_HTML_TAG_RE = re.compile(r"<[^>]+>")
_HTML_ENTITY_RE = re.compile(r"&([a-zA-Z]+|#\d+);")
_HTML_ENTITIES: dict[str, str] = {
    "nbsp": " ",
    "amp": "&",
    "lt": "<",
    "gt": ">",
    "quot": '"',
    "apos": "'",
    "auml": "ä",
    "ouml": "ö",
    "uuml": "ü",
    "Auml": "Ä",
    "Ouml": "Ö",
    "Uuml": "Ü",
    "szlig": "ß",
}


def _decode_html(html: str) -> str:
    """Strip HTML tags + decode the handful of entities the EFA emits.

    A full HTML parser would be overkill for the limited tag set the
    upstream uses (`<p>`, `<strong>`, `<em>`, `<br />`). Convert `<br>`
    family to newlines first, then strip everything else, then decode
    the entity vocabulary (German umlauts + the canonical five).
    """
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    text = _HTML_TAG_RE.sub("", text)

    def _replace(match: re.Match[str]) -> str:
        token = match.group(1)
        if token.startswith("#"):
            try:
                return chr(int(token[1:]))
            except (ValueError, OverflowError):
                return match.group(0)
        return _HTML_ENTITIES.get(token, match.group(0))

    text = _HTML_ENTITY_RE.sub(_replace, text)
    # Collapse runs of whitespace inside paragraphs but keep newlines.
    return "\n".join(line.strip() for line in text.splitlines() if line.strip())


def _iso_from_efa_dt(raw: Any) -> str | None:
    """Parse an EFA itdDateTime / nested date+time pair to ISO local."""
    if not isinstance(raw, dict):
        return None
    date = raw.get("itdDate")
    time_block = raw.get("itdTime")
    if not isinstance(date, dict):
        return None
    try:
        year = int(date.get("year") or 0)
        month = int(date.get("month") or 0)
        day = int(date.get("day") or 0)
    except (TypeError, ValueError):
        return None
    if not (year and month and day):
        return None
    hour = minute = 0
    if isinstance(time_block, dict):
        try:
            hour = int(time_block.get("hour") or 0)
            minute = int(time_block.get("minute") or 0)
        except (TypeError, ValueError):
            hour = minute = 0
    return f"{year:04d}-{month:02d}-{day:02d}T{hour:02d}:{minute:02d}:00"


def _parse_alert(raw: dict[str, Any]) -> TrafficInfo | None:
    """Convert one travelInformation entry into a TrafficInfo dataclass."""
    if not isinstance(raw, dict):
        return None
    if str(raw.get("deactivated")) == "true":
        return None
    if str(raw.get("publish")) != "1":
        return None
    info_id = str(raw.get("infoID") or "").strip()
    if not info_id:
        return None
    info_link = raw.get("infoLink") if isinstance(raw.get("infoLink"), dict) else {}
    title = str(info_link.get("infoLinkText") or info_link.get("subtitle") or "").strip()
    if not title:
        return None
    html_body = str(info_link.get("content") or "").strip()
    description = _decode_html(html_body) if html_body else ""

    affected: list[str] = []
    concerned = raw.get("concernedLines")
    if isinstance(concerned, list):
        for line in concerned:
            if isinstance(line, dict):
                num = line.get("number")
                if num:
                    affected.append(str(num))
    affected = sorted(set(affected))

    valid_from = None
    valid_to = None
    validity = raw.get("validityPeriod")
    if isinstance(validity, list) and validity:
        first = validity[0]
        if isinstance(first, dict):
            valid_from = _iso_from_efa_dt(first.get("itdDateTime_From"))
            valid_to = _iso_from_efa_dt(first.get("itdDateTime_To"))
    elif isinstance(validity, dict):
        valid_from = _iso_from_efa_dt(validity.get("itdDateTime_From"))
        valid_to = _iso_from_efa_dt(validity.get("itdDateTime_To"))

    return TrafficInfo(
        info_id=info_id,
        title=title,
        description=description,
        description_html=html_body,
        affected_lines=affected,
        info_type=str(raw.get("type") or ""),
        priority=str(raw.get("priority") or "normal"),
        valid_from=valid_from,
        valid_to=valid_to,
        created=_iso_from_efa_dt(raw.get("creationTime")),
    )


def _parse_addinfo(payload: dict[str, Any]) -> list[TrafficInfo]:
    """Reduce a XML_ADDINFO_REQUEST JSON payload to a flat list."""
    out: list[TrafficInfo] = []
    additional = payload.get("additionalInformation")
    if not isinstance(additional, dict):
        return out
    travel = additional.get("travelInformations")
    if not isinstance(travel, dict):
        return out
    items = travel.get("travelInformation")
    if not isinstance(items, list):
        return out
    for raw in items:
        info = _parse_alert(raw)
        if info is not None:
            out.append(info)
    return out


async def async_fetch_alerts(
    session: aiohttp.ClientSession,
) -> list[TrafficInfo]:
    """Fetch the current addinfo list from LINZ AG.

    Failures are swallowed and surfaced as an empty list — the alerts
    feed is best-effort decoration on top of departures, not a critical
    data path. Don't block the integration's setup or refresh cycle on
    it.
    """
    url = f"{API_BASE_URL}{ADDINFO_ENDPOINT}"
    params = {
        "outputFormat": "JSON",
        "filterPublicationStatus": "current",
    }
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
    }
    timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT_SEC)
    try:
        resp = await session.get(url, params=params, headers=headers, timeout=timeout)
        resp.raise_for_status()
        data = await resp.json(content_type=None)
    except aiohttp.ClientError as err:
        _LOGGER.debug("alerts fetch failed (network): %s", err)
        return []
    except (ValueError, TimeoutError) as err:
        _LOGGER.debug("alerts fetch failed (parse): %s", err)
        return []

    if not isinstance(data, dict):
        _LOGGER.debug("alerts fetch returned non-dict payload: %r", type(data))
        return []
    return _parse_addinfo(data)


async def async_refresh_alerts(hass: HomeAssistant) -> None:
    """Refresh the cached alerts list and push it into hass.data."""
    session = async_get_clientsession(hass)
    alerts = await async_fetch_alerts(session)
    domain_data = hass.data.setdefault(DOMAIN, {})
    domain_data[ALERTS_KEY] = [a.to_dict() for a in alerts]
    _LOGGER.debug("alerts cache refreshed: %d entries", len(alerts))


def get_alerts_for_lines(
    hass: HomeAssistant, lines: set[str]
) -> list[dict[str, Any]]:
    """Return the cached alerts whose ``affected_lines`` overlap ``lines``.

    A `system-wide notice (no `affected_lines`)` falls through unfiltered
    so users see disruptions that don't pin to a specific route.
    """
    domain_data = hass.data.get(DOMAIN, {})
    alerts: list[dict[str, Any]] = list(domain_data.get(ALERTS_KEY) or [])
    if not alerts:
        return []
    if not lines:
        return alerts
    out: list[dict[str, Any]] = []
    for a in alerts:
        affected = a.get("affected_lines") or []
        if not affected or any(line in lines for line in affected):
            out.append(a)
    return out


@callback
def async_start_alerts_refresh(hass: HomeAssistant) -> CALLBACK_TYPE | None:
    """Schedule the domain-wide alerts refresh, idempotent.

    Returns the existing unsub when the refresh is already running, so
    the caller can register it as the entry's teardown without
    accidentally double-cancelling.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    if ALERTS_REFRESH_UNSUB_KEY in domain_data:
        return domain_data[ALERTS_REFRESH_UNSUB_KEY]

    async def _tick(_now: Any) -> None:
        await async_refresh_alerts(hass)

    from datetime import timedelta

    unsub = async_track_time_interval(
        hass, _tick, timedelta(seconds=ALERTS_REFRESH_SECONDS)
    )
    domain_data[ALERTS_REFRESH_UNSUB_KEY] = unsub
    return unsub


@callback
def async_stop_alerts_refresh(hass: HomeAssistant) -> None:
    """Tear down the domain-wide alerts refresh."""
    domain_data = hass.data.get(DOMAIN, {})
    unsub = domain_data.pop(ALERTS_REFRESH_UNSUB_KEY, None)
    if unsub is not None:
        unsub()
    domain_data.pop(ALERTS_KEY, None)
