"""Lightweight client for the LINZ AG LINIEN EFA endpoints.

The Mentz EFA system used by LINZ AG (and many German-speaking transit
operators) supports JSON output via ``outputFormat=JSON``. We only ever
talk to two endpoints:

* ``XML_STOPFINDER_REQUEST`` — fuzzy stop name search (config-flow time)
* ``XML_DM_REQUEST`` — Departure Monitor (every refresh)

Stateless (``stateless=1``) is required since Dec 2015 — the EFA server
will otherwise drift session state across requests from the same client.
``locationServerActive=1`` enables stop-name resolution.

This module owns the HTTP transport and the request-parameter assembly
only; turning the raw JSON bodies into normalised shapes is
:mod:`.parser`'s job.

Reference: https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/fahrplan/EFA_XML_Schnittstelle_20151217.pdf
"""

from __future__ import annotations

from typing import Any

import aiohttp

from .const import (
    API_BASE_URL,
    COORD_OUTPUT_FORMAT,
    DM_ENDPOINT,
    STOPFINDER_ENDPOINT,
    USER_AGENT,
)
from .http import base_request_headers
from .parser import _parse_dm, _parse_stopfinder

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
        raise EfaPayloadError(f"expected dict, got {type(data).__name__}")
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
