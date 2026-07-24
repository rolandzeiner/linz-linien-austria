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

import logging
from typing import Any

import aiohttp

from .const import (
    API_BASE_URL,
    COORD_OUTPUT_FORMAT,
    DM_ENDPOINT,
    MAX_STOPS_AHEAD,
    STOPFINDER_ENDPOINT,
    USER_AGENT,
)
from .http import base_request_headers
from .text import decode_html, flatten_lines

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
    headers = base_request_headers(USER_AGENT)
    try:
        # `async with session.get(...)` releases the connection slot to
        # aiohttp's pool deterministically on every exit branch (success,
        # raise_for_status raise, json() decode error, timeout). A bare
        # `await session.get(...)` leaves it pinned until garbage
        # collection picks the response up — which under load means the
        # connection limiter throttles needlessly.
        async with session.get(
            url, params=params, headers=headers, timeout=timeout
        ) as resp:
            resp.raise_for_status()
            data = await resp.json(content_type=None)
    except TimeoutError as err:
        raise EfaTimeoutError(f"timeout after {REQUEST_TIMEOUT_SEC}s") from err
    except aiohttp.ClientResponseError as err:
        raise EfaHttpError(err.status, err.message or "") from err
    except aiohttp.ClientError as err:
        raise EfaApiError(f"connection error: {err}") from err
    except ValueError as err:
        # ValueError only — a genuine JSON-decode failure. An
        # aiohttp.ContentTypeError is a ClientResponseError subclass,
        # already caught above; json(content_type=None) suppresses it
        # anyway.
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
        "coordOutputFormat": COORD_OUTPUT_FORMAT,
    }
    data = await _get_json(session, f"{API_BASE_URL}{STOPFINDER_ENDPOINT}", params)
    return _parse_stopfinder(data)[:limit]


def _parse_stopfinder(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract stop candidates from a STOPFINDER_REQUEST JSON response.

    EFA publishes the candidate list in one of two shapes, and the
    LINZ AG deployment nests the second one a level deeper than the bare
    "list of points" the name suggests:

        stopFinder: [ {point}, {point} ]                     # shape 1
        stopFinder: { points: { point: {…} | [ {…}, … ] } }  # shape 2

    In shape 2 the inner ``point`` collapses to a bare dict whenever the
    query resolved to a single best match — which, on this deployment,
    is *every* query, exact or partial. Some EFA installs name the keys
    ``stops``/``stop`` instead; both spellings are tolerated.
    """
    out: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    def _collect(raw: Any) -> None:
        for candidate in _as_list(raw):
            stop = _parse_one_stop(candidate)
            if stop and stop["stop_id"] not in seen_ids:
                seen_ids.add(stop["stop_id"])
                out.append(stop)

    candidates = payload.get("stopFinder")
    if isinstance(candidates, list):
        _collect(candidates)
    elif isinstance(candidates, dict):
        for outer_key, inner_key in (("points", "point"), ("stops", "stop")):
            container = candidates.get(outer_key)
            if isinstance(container, dict) and inner_key in container:
                _collect(container[inner_key])
            else:
                # Already the candidate collection itself (or a lone
                # point dict) rather than a wrapper around it.
                _collect(container)

    return out


def _wgs84_from_coords(raw: Any) -> tuple[float, float] | None:
    """Parse an EFA ``coords`` string into ``(latitude, longitude)``.

    Every request this module makes sends
    ``coordOutputFormat=WGS84[dd.ddddd]``, so the server emits decimal
    degrees in **longitude,latitude** order (EFA's x,y convention —
    note it is the reverse of the lat,lon order HA expects). Without
    that parameter the same field carries projected NAV5/NAV4
    coordinates, which are numerically plausible but ~6 orders of
    magnitude off; the range guard below rejects those rather than
    handing a garbage location to the device registry.
    """
    if not isinstance(raw, str) or "," not in raw:
        return None
    lon_str, lat_str = raw.split(",", 1)
    try:
        lon = float(lon_str)
        lat = float(lat_str)
    except ValueError:
        return None
    if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
        return None
    return (lat, lon)


def _unwrap_efa_point(raw: Any) -> dict[str, Any] | None:
    """Pull {stop_id, name, place, latitude?, longitude?} out of an EFA point.

    Both stop-shaped payloads — the STOPFINDER candidate and the
    DM_REQUEST resolved stop — wrap the same fields: ``ref`` holds the
    stable stop ID (the top-level ``stateless`` is only a per-session
    indirection token, so prefer ``ref.id``), ``name``/``object`` the
    label, ``posttown``/``ref.place`` the locality, ``ref.coords`` the
    WGS84 position. Returns ``None`` for a non-dict input so callers can
    short-circuit. String values are returned *un*-stripped; the
    stopfinder path tightens (strip + digit-check) on top, the DM path
    takes them as-is. Lat/lon keys are omitted entirely when the
    upstream sent no usable position.
    """
    if not isinstance(raw, dict):
        return None
    ref_raw = raw.get("ref")
    ref: dict[str, Any] = ref_raw if isinstance(ref_raw, dict) else {}
    out: dict[str, Any] = {
        "stop_id": str(ref.get("id") or raw.get("stateless") or ""),
        "name": str(raw.get("name") or raw.get("object") or ""),
        "place": str(raw.get("posttown") or ref.get("place") or ""),
    }
    coords = _wgs84_from_coords(ref.get("coords"))
    if coords is not None:
        out["latitude"], out["longitude"] = coords
    return out


def _parse_one_stop(raw: Any) -> dict[str, Any] | None:
    """Normalise an EFA stop candidate to {stop_id, name, place, lat/lon?}."""
    point = _unwrap_efa_point(raw)
    if point is None:
        return None
    stop_id = point["stop_id"].strip()
    if not stop_id or not stop_id.isdigit():
        return None
    name = point["name"].strip()
    if not name:
        return None
    point["stop_id"] = stop_id
    point["name"] = name
    point["place"] = point["place"].strip()
    return point


async def fetch_departures(
    session: aiohttp.ClientSession,
    stop_id: str,
    *,
    limit: int = 12,
    include_stop_sequence: bool = False,
) -> dict[str, Any]:
    """Fetch the next ``limit`` departures from a verified stop.

    The DM_REQUEST always returns the *next* departures from "now"; passing
    ``itdDate``/``itdTime`` is only useful for offset queries. ``mode=direct``
    skips the line-selection step the EFA UI does — we want every line that
    serves the stop, not just one.

    ``include_stop_sequence`` asks for each trip's full stop list, which
    roughly triples the response. Callers are expected to have clamped
    ``limit`` accordingly — see ``SEQUENCE_UPSTREAM_LIMIT``.
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
        # Decimal-degree WGS84 instead of the projected NAV5 default, so
        # the resolved stop carries a position usable for map links and
        # the device registry without a client-side transform.
        "coordOutputFormat": COORD_OUTPUT_FORMAT,
    }
    if include_stop_sequence:
        # `stopEvents` switches each row from a bare departure to a trip
        # event, which is what makes the stop list available at all;
        # `includeCompleteStopSeq` then attaches it.
        params["depType"] = "stopEvents"
        params["includeCompleteStopSeq"] = "1"
    data = await _get_json(session, f"{API_BASE_URL}{DM_ENDPOINT}", params)
    return _parse_dm(data, include_stop_sequence=include_stop_sequence)


def _parse_dm(
    payload: dict[str, Any], *, include_stop_sequence: bool = False
) -> dict[str, Any]:
    """Extract a normalised departures payload from a DM_REQUEST response.

    Returns a dict with ``stop`` (resolved metadata), ``departures``
    (list of normalised entries, sorted by effective arrival time) and
    ``served_lines`` (the timetable's complete line roster for the stop,
    independent of what happens to be departing right now).

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
        normalised = _normalise_departure(
            d, include_stop_sequence=include_stop_sequence
        )
        if normalised is not None:
            departures.append(normalised)

    departures.sort(key=_departure_sort_key)

    return {
        "stop": stop_meta,
        "departures": departures,
        "served_lines": _parse_serving_lines(payload),
    }


def _parse_serving_lines(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract the stop's full line roster from the ``servingLines`` block.

    Every DM response carries this alongside the departures: one entry
    per line *and direction* that the current timetable period runs
    through this stop — including rush-hour, seasonal and nightline
    routes with no departure anywhere near the live window. That makes
    it strictly better than harvesting labels off ``departureList`` over
    time, which only ever converges on the subset that happened to be
    observed.

    Normalised shape (fields with no content are omitted):
        line:        "2"            # display number
        dir_code:    "H"            # Hin/Rück, the stable direction key
        destination: "solarCity"    # headsign for this direction
        dest_id:     "60500296"     # terminus stop id
        desc:        "Linz JKU | Universität - Linz solarCity"
        mot:         4              # mode-of-transport id
    """
    block = payload.get("servingLines")
    if not isinstance(block, dict):
        return []
    out: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for entry in _as_list(block.get("lines")):
        mode_raw = entry.get("mode") if isinstance(entry, dict) else None
        if not isinstance(mode_raw, dict):
            continue
        diva_raw = mode_raw.get("diva")
        diva: dict[str, Any] = diva_raw if isinstance(diva_raw, dict) else {}
        line = str(mode_raw.get("number") or "").strip()
        if not line:
            continue
        dir_code = _direction_code(diva.get("dir"), diva.get("stateless"))
        # A line that serves the stop in both directions produces two
        # entries; the same (line, direction) twice is upstream noise.
        key = (line, dir_code or "")
        if key in seen:
            continue
        seen.add(key)
        item: dict[str, Any] = {"line": line}
        if dir_code:
            item["dir_code"] = dir_code
        for field_name, raw in (
            ("destination", mode_raw.get("destination")),
            ("dest_id", mode_raw.get("destID")),
            ("desc", mode_raw.get("desc")),
        ):
            value = str(raw or "").strip()
            if value:
                item[field_name] = value
        mot = _int_or_none(mode_raw.get("type"))
        if mot is not None:
            item["mot"] = mot
            item["mot_name"] = _mot_name(mot)
        out.append(item)
    out.sort(key=lambda item: (_natural_line_key(item["line"]), item.get("dir_code", "")))
    return out


def _as_list(raw: Any) -> list[Any]:
    """Coerce an EFA field that is a list of N, or a bare dict when N == 1.

    EFA collapses single-element collections to the element itself
    rather than emitting a one-item list, so every repeated field has to
    be normalised before iterating or a single-line stop silently
    iterates over dict *keys*.
    """
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict):
        return [raw]
    return []


def _natural_line_key(line: str) -> tuple[int, str]:
    """Sort "2" before "12" before "45A", with non-numeric labels last."""
    digits = ""
    for char in line:
        if not char.isdigit():
            break
        digits += char
    if not digits:
        return (10**6, line.casefold())
    return (int(digits), line.casefold())


def _direction_code(raw_dir: Any, raw_stateless: Any) -> str | None:
    """Resolve the stable "H"/"R" direction code for a line.

    ``liErgRiProj.direction`` (departures) and ``diva.dir``
    (servingLines) are the primary sources. Both are absent on some
    replacement-service rows, where the same code is still recoverable
    from the 5-segment ``stateless`` line id
    (``esg:02012:E:R:e25`` → ``R``).

    Why this matters: the user-facing line filter used to key on the
    *destination text*, which is unstable for branching termini — the
    same line reports a different headsign depending on which vehicle
    is next, so a text-keyed filter intermittently dropped the whole
    line. The H/R code is per-direction and does not move.
    """
    code = str(raw_dir or "").strip().upper()
    if code in ("H", "R"):
        return code
    parts = str(raw_stateless or "").split(":")
    if len(parts) >= 4:
        candidate = parts[3].strip().upper()
        if candidate in ("H", "R"):
            return candidate
    return None


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

    # DM resolved-stop fields go through untouched (no strip / digit-check
    # the stopfinder path applies) — the EFA already vetted this id.
    return _unwrap_efa_point(point) or {"stop_id": "", "name": "", "place": ""}


def _int_or_none(raw: Any) -> int | None:
    """Lenient int coercion — returns None on TypeError/ValueError/empty.

    EFA emits string-typed ints with the occasional empty string and
    unknown-sentinel ``-9999``. Centralise the try/except so callers
    can stay focused on the field-specific semantics.
    """
    if raw is None or raw == "":
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def _normalise_departure(
    raw: Any, *, include_stop_sequence: bool = False
) -> dict[str, Any] | None:
    """Reduce one EFA departure entry to a flat dict.

    Schema (only fields with meaningful content set; missing → omitted):
        line:           "2"            # display number
        direction:      "solarCity"    # towards (display text, unstable)
        dir_code:       "H"            # Hin/Rück — the stable filter key
        origin:         "JKU"          # initial origin (for context)
        platform:       "1"            # bay/platform if known
        stop_bay:       "Hauptbahnhof (Kärntnerstraße)"  # named bay
        operator:       "Linz Linien GmbH"
        delay_hint:     "Behinderung! Verspätung! Bitte Geduld!"
        mot:            4              # mode-of-transport id (see const.py)
        stops_ahead:    [{...}]        # opt-in; see _parse_onward_stops
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

    proj_raw = line_info.get("liErgRiProj")
    proj: dict[str, Any] = proj_raw if isinstance(proj_raw, dict) else {}
    dir_code = _direction_code(proj.get("direction"), line_info.get("stateless"))

    mot = _int_or_none(line_info.get("motType"))
    countdown = _int_or_none(raw.get("countdown"))

    scheduled = _iso_from_efa_datetime(raw.get("dateTime"))
    realtime = _iso_from_efa_datetime(raw.get("realDateTime"))

    # EFA returns "0", "-1", "5" etc. Negative delays = early.
    # ``-9999`` is the sentinel for "unknown"; skip it.
    delay_int = _int_or_none(line_info.get("delay"))
    delay_minutes: int | None = (
        delay_int if delay_int is not None and delay_int != -9999 else None
    )

    countdown_rt: int | None = None
    if countdown is not None and delay_minutes is not None:
        countdown_rt = max(0, countdown + delay_minutes)

    platform = str(raw.get("platform") or raw.get("platformName") or "").strip()

    # The named bay this departure actually leaves from. At a multi-bay
    # stop these differ per row ("Hauptbahnhof (Kärntnerstraße)" vs
    # "(Busterminal)" vs "(Tiefgeschoß)") and carry far more meaning than
    # the bare platform digit sitting next to them.
    stop_bay = str(raw.get("nameWO") or "").strip()

    operator_raw = raw.get("operator")
    operator = (
        str((operator_raw or {}).get("name") or "").strip()
        if isinstance(operator_raw, dict)
        else ""
    )

    delay_hint = _hint_text(line_info.get("hints"))

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
    if dir_code:
        out["dir_code"] = dir_code
    if origin:
        out["origin"] = origin
    if platform:
        out["platform"] = platform
    if stop_bay:
        out["stop_bay"] = stop_bay
    if operator:
        out["operator"] = operator
    if delay_hint:
        out["delay_hint"] = delay_hint
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
    if include_stop_sequence:
        # `prevStopSeq` is deliberately never read: it lists the stops the
        # vehicle has already left, which a departure monitor has no use
        # for, and it is over half the sequence payload. The upstream has
        # no flag to suppress it, so dropping it here is the only lever.
        stops_ahead = _parse_onward_stops(raw.get("onwardStopSeq"))
        if stops_ahead:
            out["stops_ahead"] = stops_ahead
    return out


def _parse_onward_stops(raw: Any) -> list[dict[str, Any]]:
    """Reduce ``onwardStopSeq`` to the stops still ahead on this trip.

    Each entry keeps only what a card row needs, because this list is
    repeated for every departure and is the reason the opt-in exists:

        name:           "Waldeggstraße"          # nameWO, no place prefix
        stop_id:        "60500910"
        arrival:        "2026-07-24T18:54:00"    # ISO local
        delay_minutes:  2                        # only when realtime-valid

    Times arrive in EFA's compact ``"YYYYMMDD HH:MM"`` form here, not the
    nested dict the departure rows use. Arrival wins over departure —
    a rider tracking a vehicle cares when it reaches their stop — with
    departure as the fallback for the first entry, which sometimes
    carries no arrival.

    `arrValid`/`depValid` gate the delay: EFA emits ``arrDelay`` even for
    purely scheduled stops, where it is a leftover rather than a
    prediction, and surfacing that as "+0" would imply live tracking the
    upstream isn't claiming.
    """
    out: list[dict[str, Any]] = []
    for entry in _as_list(raw):
        if not isinstance(entry, dict):
            continue
        ref_raw = entry.get("ref")
        ref: dict[str, Any] = ref_raw if isinstance(ref_raw, dict) else {}

        name = str(entry.get("nameWO") or entry.get("name") or "").strip()
        if not name:
            continue

        arrival = _iso_from_efa_compact(
            ref.get("arrDateTime") or ref.get("depDateTime")
        )
        used_arrival = bool(ref.get("arrDateTime"))
        valid = ref.get("arrValid") if used_arrival else ref.get("depValid")
        delay = _int_or_none(
            ref.get("arrDelay") if used_arrival else ref.get("depDelay")
        )

        stop: dict[str, Any] = {"name": name}
        stop_id = str(ref.get("id") or "").strip()
        if stop_id:
            stop["stop_id"] = stop_id
        if arrival:
            stop["arrival"] = arrival
        if delay is not None and delay != -9999 and str(valid) == "1":
            stop["delay_minutes"] = delay
        out.append(stop)
        if len(out) >= MAX_STOPS_AHEAD:
            break
    return out


def _iso_from_efa_compact(raw: Any) -> str | None:
    """Parse EFA's compact ``"YYYYMMDD HH:MM"`` stamp to ISO-8601 local.

    The stop-sequence block uses this form, unlike the departure rows'
    nested ``{year, month, …}`` dict that `_iso_from_efa_datetime`
    handles. Seconds are dropped — the ``*Sec`` variants exist but
    minute resolution is what the rest of the payload speaks.
    """
    if not isinstance(raw, str):
        return None
    parts = raw.split()
    if len(parts) != 2 or len(parts[0]) != 8:
        return None
    date, time = parts
    hour, _, minute = time.partition(":")
    try:
        return (
            f"{int(date[0:4]):04d}-{int(date[4:6]):02d}-{int(date[6:8]):02d}"
            f"T{int(hour):02d}:{int(minute):02d}:00"
        )
    except ValueError:
        return None


def _hint_text(raw: Any) -> str:
    """Flatten ``servingLine.hints`` into one line of plain text.

    The upstream publishes the live reason a trip is running late —
    "Behinderung!\\nVerspätung!\\nBitte Geduld!" — as a list of
    ``{content}`` dicts, collapsing to a bare dict when there is exactly
    one (the usual EFA single-element shape). The newlines are there to
    fill a three-line dot-matrix display, so they become spaces on a
    one-line card row.

    Content comes from the same editorial CMS as the alerts feed, so it
    runs through the shared HTML decoder — the hints observed in the
    field are plain text, but `lineInfos` from that CMS is not, and an
    unescaped `&auml;` in the middle of a German word is exactly the
    kind of thing nobody notices until a user reports it.

    Duplicates are dropped: several departures of the same line repeat
    the identical hint, and EFA sometimes lists it twice on one row.
    """
    parts: list[str] = []
    for hint in _as_list(raw):
        content = hint.get("content") if isinstance(hint, dict) else hint
        if not isinstance(content, str):
            continue
        flattened = flatten_lines(decode_html(content))
        if flattened and flattened not in parts:
            parts.append(flattened)
    return " ".join(parts)


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
