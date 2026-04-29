"""Lightweight client for the LINZ AG LINIEN EFA endpoints.

The Mentz EFA system used by LINZ AG (and many German-speaking transit
operators) supports JSON output via ``outputFormat=JSON``. We only ever
talk to two endpoints:

* ``XML_STOPFINDER_REQUEST`` — fuzzy stop name search (config-flow time)
* ``XML_DM_REQUEST`` — Departure Monitor (every refresh)

Stateless (``stateless=1``) is required since Dec 2015 — the EFA server
will otherwise drift session state across requests from the same client.
``locationServerActive=1`` enables stop-name resolution.

Reference: https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/fahrplan/EFA_XML_Schnittstelle_20151217.pdf
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

import aiohttp

from .const import (
    API_BASE_URL,
    DM_ENDPOINT,
    STOPFINDER_ENDPOINT,
    USER_AGENT,
)
from .http import base_request_headers

_LOGGER = logging.getLogger(__name__)

REQUEST_TIMEOUT_SEC = 30


class EfaApiError(Exception):
    """Base exception for EFA API failures."""


class EfaTimeoutError(EfaApiError):
    """Request timed out."""


class EfaHttpError(EfaApiError):
    """Non-2xx HTTP response."""

    def __init__(self, status: int, reason: str) -> None:
        super().__init__(f"HTTP {status}: {reason}")
        self.status = status
        self.reason = reason


class EfaPayloadError(EfaApiError):
    """Malformed/unexpected JSON response."""


def _common_headers() -> dict[str, str]:
    """Headers sent on every DM_REQUEST / STOPFINDER_REQUEST call.

    Thin wrapper around the shared ``base_request_headers`` helper so a
    future header addition lands in one place.
    """
    return base_request_headers(USER_AGENT)


async def _get_json(
    session: aiohttp.ClientSession,
    url: str,
    params: dict[str, str],
) -> dict[str, Any]:
    """GET an EFA endpoint and parse its JSON body.

    All EFA-specific exceptions raised here are swapped for the integration's
    own ``EfaApiError`` subclasses so the coordinator's translated
    ``UpdateFailed`` raises don't have to know about aiohttp internals.
    """
    timeout = aiohttp.ClientTimeout(total=REQUEST_TIMEOUT_SEC)
    try:
        resp = await session.get(
            url, params=params, headers=_common_headers(), timeout=timeout
        )
        resp.raise_for_status()
        data = await resp.json(content_type=None)
    except asyncio.TimeoutError as err:
        raise EfaTimeoutError(f"timeout after {REQUEST_TIMEOUT_SEC}s") from err
    except aiohttp.ClientResponseError as err:
        raise EfaHttpError(err.status, err.message or "") from err
    except aiohttp.ClientError as err:
        raise EfaApiError(f"connection error: {err}") from err
    except (aiohttp.ContentTypeError, ValueError) as err:
        raise EfaPayloadError(f"invalid json: {err}") from err

    if not isinstance(data, dict):
        raise EfaPayloadError(
            f"expected dict, got {type(data).__name__}"
        )
    return data


async def search_stops(
    session: aiohttp.ClientSession, query: str, *, limit: int = 10
) -> list[dict[str, Any]]:
    """Search stops by name. Returns up to ``limit`` candidates.

    Each candidate has at minimum ``stop_id`` (the 6-digit stateless ID)
    and ``name`` (the human-readable label, e.g. "Linz/Donau, Hauptbahnhof").
    Coordinates are included when the upstream returns them.
    """
    params: dict[str, str] = {
        "outputFormat": "JSON",
        "locationServerActive": "1",
        "stateless": "1",
        "type_sf": "any",
        "name_sf": query,
        # Restrict to actual stops (bitmask: 2 = Haltestellen). The EFA
        # default returns addresses + POIs too, which we don't want for
        # a departure-monitor integration.
        "anyObjFilter_sf": "2",
    }
    data = await _get_json(session, f"{API_BASE_URL}{STOPFINDER_ENDPOINT}", params)
    return _parse_stopfinder(data)[:limit]


def _parse_stopfinder(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract stop candidates from a STOPFINDER_REQUEST JSON response.

    EFA returns one of two shapes depending on whether the input was an
    exact match or a list. Handle both.
    """
    out: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    # Shape 1: a "stopFinder" list of candidates.
    candidates = payload.get("stopFinder")
    if isinstance(candidates, list):
        for c in candidates:
            stop = _parse_one_stop(c)
            if stop and stop["stop_id"] not in seen_ids:
                seen_ids.add(stop["stop_id"])
                out.append(stop)

    # Shape 2: stopFinder is a dict containing "points" (a list of dicts) —
    # this is the case when the user typed an exact stop name. Some EFA
    # deployments use "stops" instead. Both are tolerated.
    if isinstance(candidates, dict):
        for key in ("points", "stops"):
            inner = candidates.get(key)
            if isinstance(inner, list):
                for c in inner:
                    stop = _parse_one_stop(c)
                    if stop and stop["stop_id"] not in seen_ids:
                        seen_ids.add(stop["stop_id"])
                        out.append(stop)

    return out


def _parse_one_stop(raw: Any) -> dict[str, Any] | None:
    """Normalise an EFA stop candidate to {stop_id, name, place, coords?}."""
    if not isinstance(raw, dict):
        return None
    # ``ref`` carries the stable stop ID; the top-level ``stateless`` carries
    # an indirection token that's only valid within the same session.
    # We want the persistent ID — so prefer ref.id over stateless.
    ref_raw = raw.get("ref")
    ref: dict[str, Any] = ref_raw if isinstance(ref_raw, dict) else {}
    stop_id = str(ref.get("id") or raw.get("stateless") or "").strip()
    if not stop_id or not stop_id.isdigit():
        return None
    name = str(raw.get("name") or raw.get("object") or "").strip()
    if not name:
        return None
    place = str(raw.get("posttown") or ref.get("place") or "").strip()
    coords_raw = ref.get("coords") if ref else None
    coords: tuple[float, float] | None = None
    if isinstance(coords_raw, str) and "," in coords_raw:
        try:
            x, y = coords_raw.split(",", 1)
            # EFA NAV5 / NAV4 coords are projected (not WGS84). Surface
            # them raw — the card / templates can decide whether to use
            # them and via what projection.
            coords = (float(x), float(y))
        except ValueError:
            coords = None

    out: dict[str, Any] = {
        "stop_id": stop_id,
        "name": name,
        "place": place,
    }
    if coords is not None:
        out["coords_x"] = coords[0]
        out["coords_y"] = coords[1]
    return out


async def fetch_departures(
    session: aiohttp.ClientSession,
    stop_id: str,
    *,
    limit: int = 12,
) -> dict[str, Any]:
    """Fetch the next ``limit`` departures from a verified stop.

    The DM_REQUEST always returns the *next* departures from "now"; passing
    ``itdDate``/``itdTime`` is only useful for offset queries. ``mode=direct``
    skips the line-selection step the EFA UI does — we want every line that
    serves the stop, not just one.
    """
    params: dict[str, str] = {
        "outputFormat": "JSON",
        "locationServerActive": "1",
        "stateless": "1",
        "type_dm": "any",
        "name_dm": stop_id,
        "limit": str(limit),
        "mode": "direct",
        # Show train lines too — the EFA default hides them. Linz Hauptbahnhof
        # has both city trams AND ÖBB trains; users picking the stop would be
        # surprised if S-Bahn departures vanished. excludedMeans is unset so
        # all 12 transport modes are included.
        "lsShowTrainsExplicit": "1",
        # Include realtime data when available (the live linzag.at JSON
        # endpoint, unlike the OGD XML mirror, still surfaces it).
        "useRealtime": "1",
    }
    data = await _get_json(session, f"{API_BASE_URL}{DM_ENDPOINT}", params)
    return _parse_dm(data)


def _parse_dm(payload: dict[str, Any]) -> dict[str, Any]:
    """Extract a normalised departures payload from a DM_REQUEST response.

    Returns a dict with ``stop`` (resolved metadata) and ``departures``
    (list of normalised entries, sorted by effective arrival time).

    Sort key explanation: the upstream returns departures in *scheduled*
    order, not realtime-corrected order. Two on-time-vs-late departures
    on adjacent rows therefore appear out of order to the user (a line
    delayed 12 min jumps ahead of an on-time line leaving in 0 min).
    Re-sort by ``countdown_rt`` (realtime-corrected) when present,
    falling back to ``countdown``. Cancelled rows are pinned to the
    bottom (they aren't going to leave at all). Rows missing both
    countdowns drop to the very bottom — typically transient parser
    artefacts that the user cares about least.
    """
    stop_meta = _resolve_stop_meta(payload)
    raw_departures = payload.get("departureList") or []
    if not isinstance(raw_departures, list):
        raw_departures = []

    departures: list[dict[str, Any]] = []
    for d in raw_departures:
        normalised = _normalise_departure(d)
        if normalised is not None:
            departures.append(normalised)

    departures.sort(key=_departure_sort_key)

    return {
        "stop": stop_meta,
        "departures": departures,
    }


def _departure_sort_key(dep: dict[str, Any]) -> tuple[int, int]:
    """Tuple sort key: (group, effective-countdown-minutes).

    Group 0 = active (live data), group 1 = cancelled, group 2 =
    countdown unknown. Within a group sort ascending by effective
    countdown — realtime when present, else scheduled.
    """
    if dep.get("is_cancelled"):
        return (1, int(dep.get("countdown") or 0))
    cd_rt = dep.get("countdown_rt")
    if isinstance(cd_rt, int):
        return (0, cd_rt)
    cd = dep.get("countdown")
    if isinstance(cd, int):
        return (0, cd)
    # Neither countdown — push to the very bottom but keep relative order
    # stable by returning the same large sentinel for everyone.
    return (2, 10_000)


def _resolve_stop_meta(payload: dict[str, Any]) -> dict[str, Any]:
    """Pull the resolved stop info out of an itdOdv-shaped payload."""
    odv = payload.get("dm", {}).get("points") if isinstance(payload.get("dm"), dict) else None
    # The "points" structure can be a dict (single stop) or list (ambiguous).
    if isinstance(odv, dict):
        point = odv.get("point") if isinstance(odv.get("point"), dict) else odv
    elif isinstance(odv, list) and odv and isinstance(odv[0], dict):
        point = odv[0]
    else:
        point = None

    stop_id = ""
    name = ""
    place = ""
    if isinstance(point, dict):
        ref_raw = point.get("ref")
        ref: dict[str, Any] = ref_raw if isinstance(ref_raw, dict) else {}
        stop_id = str(ref.get("id") or point.get("stateless") or "")
        name = str(point.get("name") or point.get("object") or "")
        place = str(point.get("posttown") or ref.get("place") or "")
    return {"stop_id": stop_id, "name": name, "place": place}


def _normalise_departure(raw: Any) -> dict[str, Any] | None:
    """Reduce one EFA departure entry to a flat dict.

    Schema (only fields with meaningful content set; missing → omitted):
        line:           "2"            # display number
        direction:      "solarCity"    # towards
        origin:         "JKU"          # initial origin (for context)
        platform:       "1"            # bay/platform if known
        mot:            4              # mode-of-transport id (see const.py)
        mot_name:       "Tram"         # human-readable mode
        countdown:      3              # planned, in minutes
        countdown_rt:   4              # realtime if available
        delay_minutes:  1              # negative = early
        scheduled:      "2026-04-27T20:49:00"  # ISO local
        realtime:       "2026-04-27T20:50:00"  # ISO local, when available
        is_realtime:    True
    """
    if not isinstance(raw, dict):
        return None

    line_info_raw = raw.get("servingLine")
    line_info: dict[str, Any] = (
        line_info_raw if isinstance(line_info_raw, dict) else {}
    )
    line = str(line_info.get("number") or line_info.get("symbol") or "").strip()
    direction = str(line_info.get("direction") or "").strip()
    origin = str(line_info.get("directionFrom") or "").strip()

    mot_raw = line_info.get("motType")
    try:
        mot = int(mot_raw) if mot_raw is not None else None
    except (TypeError, ValueError):
        mot = None

    countdown_raw = raw.get("countdown")
    try:
        countdown = int(countdown_raw) if countdown_raw is not None else None
    except (TypeError, ValueError):
        countdown = None

    scheduled = _iso_from_efa_datetime(raw.get("dateTime"))
    realtime = _iso_from_efa_datetime(raw.get("realDateTime"))

    delay_minutes: int | None = None
    delay_raw = line_info.get("delay")
    if delay_raw is not None and delay_raw != "":
        try:
            # EFA returns "0", "-1", "5" etc. Negative delays = early.
            # Skip "-9999" (sentinel = unknown).
            delay_int = int(delay_raw)
            if delay_int != -9999:
                delay_minutes = delay_int
        except (TypeError, ValueError):
            delay_minutes = None

    countdown_rt: int | None = None
    if countdown is not None and delay_minutes is not None:
        countdown_rt = max(0, countdown + delay_minutes)

    platform = str(raw.get("platform") or raw.get("platformName") or "").strip()

    # `realtimeTripStatus` is an enum that includes MONITORED (normal)
    # and TRIP_CANCELLED among other values. Surface only the cancellation
    # signal to the card — the other states are operator-side and don't
    # affect the user-facing readout.
    trip_status = str(raw.get("realtimeTripStatus") or "").upper()
    is_cancelled = trip_status == "TRIP_CANCELLED"

    if not line and not direction and countdown is None:
        # Pure noise row — skip.
        return None

    out: dict[str, Any] = {
        "line": line,
        "direction": direction,
    }
    if origin:
        out["origin"] = origin
    if platform:
        out["platform"] = platform
    if mot is not None:
        out["mot"] = mot
        out["mot_name"] = _mot_name(mot)
    if countdown is not None:
        out["countdown"] = countdown
    if countdown_rt is not None:
        out["countdown_rt"] = countdown_rt
    if delay_minutes is not None:
        out["delay_minutes"] = delay_minutes
    if scheduled:
        out["scheduled"] = scheduled
    if realtime:
        out["realtime"] = realtime
    out["is_realtime"] = realtime is not None
    if is_cancelled:
        out["is_cancelled"] = True
    if trip_status:
        out["trip_status"] = trip_status
    return out


def _iso_from_efa_datetime(raw: Any) -> str | None:
    """Convert an EFA itdDateTime dict to an ISO-8601 local string.

    EFA shapes vary: ``{ "year": "2026", "month": "4", "day": "27",
    "hour": "20", "minute": "49" }``. Some installs zero-pad, some don't.
    We return ``YYYY-MM-DDTHH:MM:00`` (no timezone — Linz local time).
    """
    if not isinstance(raw, dict):
        return None
    try:
        year = int(raw.get("year") or 0)
        month = int(raw.get("month") or 0)
        day = int(raw.get("day") or 0)
        hour = int(raw.get("hour") or 0)
        minute = int(raw.get("minute") or 0)
    except (TypeError, ValueError):
        return None
    if not (year and month and day):
        return None
    return f"{year:04d}-{month:02d}-{day:02d}T{hour:02d}:{minute:02d}:00"


_MOT_NAMES: dict[int, str] = {
    0: "Train",
    1: "S-Bahn",
    2: "U-Bahn",
    3: "Stadtbahn",
    4: "Tram",
    5: "City Bus",
    6: "Regional Bus",
    7: "Express Bus",
    8: "Funicular",
    9: "Ferry",
    10: "Demand Bus",
    11: "Other",
}


def _mot_name(mot: int) -> str:
    """Return a human-readable name for a Mentz mode-of-transport id."""
    return _MOT_NAMES.get(mot, "Other")
