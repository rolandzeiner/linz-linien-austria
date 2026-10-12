"""Service-disruption / line-info alerts from XML_ADDINFO_REQUEST.

LINZ AG LINIEN's EFA stack exposes editorial notices (line detours, stop
relocations, schedule changes) via a separate ``XML_ADDINFO_REQUEST``
endpoint. The DM_REQUEST does NOT carry them inline — fetching them is
its own request, with a different cache lifetime than departures.

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
* While the feed is failing, the tick skips itself until a not-before
  time that doubles with each failure in a row (see
  ``ALERTS_REFRESH_SECONDS``), and a failed fetch never overwrites the
  cache.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from datetime import timedelta
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
    BACKOFF_CAP_SECONDS,
    BASE_REQUEST_HEADERS,
    DOMAIN,
)
from .parser import _iso_local
from .rate_limit import async_enforce_domain_cooldown
from .text import decode_html

_LOGGER = logging.getLogger(__name__)

REQUEST_TIMEOUT_SEC = 30


@dataclass(slots=True)
class TrafficInfo:
    """One LINZ AG LINIEN service-disruption notice."""

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


def _iso_from_efa_dt(raw: Any) -> str | None:
    """Parse an EFA itdDateTime / nested date+time pair to ISO local.

    A malformed *time* block degrades to midnight rather than dropping
    the stamp — an alert's validity window is meaningful at day
    resolution. An incomplete *date* is unusable, so `_iso_local`
    returns None for it.
    """
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
    hour = minute = 0
    if isinstance(time_block, dict):
        try:
            hour = int(time_block.get("hour") or 0)
            minute = int(time_block.get("minute") or 0)
        except (TypeError, ValueError):
            hour = minute = 0
    return _iso_local(year, month, day, hour, minute)


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
    info_link_raw = raw.get("infoLink")
    info_link: dict[str, Any] = info_link_raw if isinstance(info_link_raw, dict) else {}
    title = str(
        info_link.get("infoLinkText") or info_link.get("subtitle") or ""
    ).strip()
    if not title:
        return None
    html_body = str(info_link.get("content") or "").strip()
    description = decode_html(html_body) if html_body else ""

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
) -> list[TrafficInfo] | None:
    """Fetch the current addinfo list from LINZ AG.

    Failures are swallowed and surfaced as ``None`` — the alerts feed
    is best-effort decoration on top of departures, not a critical data
    path. Don't block the integration's setup or refresh cycle on it.

    ``None`` and the empty list are different answers. An empty list is
    the upstream saying there are no notices (measured 2026-10-12: the
    full envelope with ``"travelInformation": []``), and the caller
    clears its cache on it. ``None`` says nothing was learned.
    """
    url = f"{API_BASE_URL}{ADDINFO_ENDPOINT}"
    params = {
        "outputFormat": "JSON",
        "filterPublicationStatus": "current",
    }
    timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT_SEC)
    try:
        # `async with` pairs the response with deterministic release of
        # the underlying connection slot. See api.py::_get_json for the
        # detailed rationale; same pool-management concern applies here.
        async with session.get(
            url, params=params, headers=BASE_REQUEST_HEADERS, timeout=timeout
        ) as resp:
            resp.raise_for_status()
            data = await resp.json(content_type=None)
    except aiohttp.ClientError as err:
        _LOGGER.debug("alerts fetch failed (network): %s", err)
        return None
    except (ValueError, TimeoutError) as err:
        _LOGGER.debug("alerts fetch failed (parse): %s", err)
        return None

    if not isinstance(data, dict):
        _LOGGER.debug("alerts fetch returned non-dict payload: %r", type(data))
        return None
    return _parse_addinfo(data)


async def async_refresh_alerts(hass: HomeAssistant) -> bool:
    """Refresh the cached alerts list and push it into hass.data.

    Two callers, neither of which awaits this on a critical path: the
    5-minute domain tick, and a background task the first entry's setup
    spawns (``__init__.py``). Both are fire-and-forget by design — see
    ``async_fetch_alerts`` for why alerts must never gate departures.

    A failed fetch leaves the cache exactly as it was. Only a real
    answer overwrites it, an empty one included: one timeout used to
    take every notice off the cards until the next good answer.

    Returns False for a failed fetch, which is what the tick backs off
    on, and True for an answer.
    """
    # Alerts share the same 15 s domain-wide floor as the departure
    # polls. Without this, the 5-min alerts tick can collide with a
    # departure refresh and burn two slots in one second.
    await async_enforce_domain_cooldown(hass)
    session = async_get_clientsession(hass)
    alerts = await async_fetch_alerts(session)
    if alerts is None:
        _LOGGER.debug("alerts fetch failed; cache left as it was")
        return False
    domain_data = hass.data.setdefault(DOMAIN, {})
    domain_data[ALERTS_KEY] = [a.to_dict() for a in alerts]
    _LOGGER.debug("alerts cache refreshed: %d entries", len(alerts))
    return True


def served_lines_from_data(
    data: dict[str, Any] | None, *, strip: bool = False
) -> set[str]:
    """Extract the set of line numbers from a departures payload.

    Three call sites share this: the coordinator harvests the unfiltered
    ``lines_at_stop`` universe (``strip=True``, since those labels feed
    the card editor's picker and a stray space would split a line in
    two), then the coordinator and diagnostics both slice the alerts
    cache via ``get_alerts_for_lines``. Centralising the field name +
    truthy filter here keeps the call sites from drifting apart.

    ``strip`` trims surrounding whitespace off each label; the empty
    string the trim can leave behind is dropped by the truthy filter.
    """
    if not isinstance(data, dict):
        return set()
    out: set[str] = set()
    for d in data.get("departures") or []:
        if not isinstance(d, dict) or not d.get("line"):
            continue
        line = str(d.get("line") or "")
        if strip:
            line = line.strip()
        if line:
            out.add(line)
    return out


def get_alerts_for_lines(hass: HomeAssistant, lines: set[str]) -> list[dict[str, Any]]:
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


def _backoff_seconds(failures: int) -> int:
    """Wait after ``failures`` failed fetches in a row: 5, 10, 20, then 30 min."""
    return min(ALERTS_REFRESH_SECONDS << (failures - 1), BACKOFF_CAP_SECONDS)


@callback
def async_start_alerts_refresh(hass: HomeAssistant) -> CALLBACK_TYPE | None:
    """Schedule the domain-wide alerts refresh, idempotent."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    existing: CALLBACK_TYPE | None = domain_data.get(ALERTS_REFRESH_UNSUB_KEY)
    if existing is not None:
        return existing

    # Backoff state. In the closure, so it goes away with the timer: the
    # last entry's unload drops it and a re-add starts clean.
    failures = 0
    not_before = 0.0

    async def _tick(_now: Any) -> None:
        nonlocal failures, not_before
        # Backing off (see ALERTS_REFRESH_SECONDS). Checked above the
        # refresh, which is what takes the shared cooldown slot: a tick
        # that asks nothing must not hold a departure poll up either.
        started = time.monotonic()
        if started < not_before:
            return
        if await async_refresh_alerts(hass):
            if failures > 1:
                _LOGGER.info("Alerts feed recovered; restoring normal refresh cadence")
            failures, not_before = 0, 0.0
            return
        failures += 1
        delay = _backoff_seconds(failures)
        # Counted from the tick, not from the failure: the request can
        # take most of a minute to fail (cooldown queue plus timeout).
        # And set half a tick early, because ticks are only nominally
        # one interval apart and the tick due at the not-before must not
        # lose a coin toss against it. That margin is also what keeps a
        # single failure from costing a tick: its 5 min is the next one.
        not_before = started + delay - ALERTS_REFRESH_SECONDS / 2
        if failures > 1 and delay != _backoff_seconds(failures - 1):
            _LOGGER.info(
                "%d consecutive alerts failures; backing off to %d min between tries",
                failures,
                delay // 60,
            )

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
