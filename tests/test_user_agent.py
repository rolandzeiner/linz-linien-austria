"""Regression test — every outbound request carries the canonical User-Agent.

A malformed UA is silent failure: the integration still works, only the
upstream operator's log parser breaks. Nothing flags this at build time,
so guard both call sites (DM_REQUEST + STOPFINDER_REQUEST).
"""
from __future__ import annotations

import re
from unittest.mock import AsyncMock, MagicMock

from homeassistant.core import HomeAssistant

from custom_components.linz_linien_austria.api import (
    fetch_departures,
    search_stops,
)
from custom_components.linz_linien_austria.const import (
    DOMAIN,
    INTEGRATION_VERSION,
    USER_AGENT,
)


_UA_PATTERN = re.compile(
    r"^HomeAssistant/[0-9.]+(?:[a-zA-Z0-9.\-+]+)?\s"
    rf"{re.escape(DOMAIN)}/{re.escape(INTEGRATION_VERSION)}$"
)


def _ok_resp(body: object) -> MagicMock:
    resp = MagicMock()
    resp.status = 200
    resp.raise_for_status = MagicMock()
    resp.json = AsyncMock(return_value=body)
    return resp


def test_user_agent_follows_canonical_format() -> None:
    """USER_AGENT honours the slash-separated HA convention."""
    assert _UA_PATTERN.match(USER_AGENT), USER_AGENT


async def test_dm_request_sends_canonical_user_agent(hass: HomeAssistant) -> None:
    """DM_REQUEST outbound carries the canonical User-Agent."""
    session = MagicMock()
    session.get = AsyncMock(
        return_value=_ok_resp({"dm": {}, "departureList": []})
    )
    await fetch_departures(session, "60501720", limit=1)
    sent = session.get.call_args.kwargs["headers"]
    assert sent["User-Agent"] == USER_AGENT
    # Belt-and-braces — the Accept-Encoding header should ride along too.
    assert sent["Accept-Encoding"] == "gzip"


async def test_stopfinder_request_sends_canonical_user_agent(
    hass: HomeAssistant,
) -> None:
    """STOPFINDER_REQUEST outbound carries the canonical User-Agent."""
    session = MagicMock()
    session.get = AsyncMock(return_value=_ok_resp({"stopFinder": []}))
    await search_stops(session, "Hauptbahnhof")
    sent = session.get.call_args.kwargs["headers"]
    assert sent["User-Agent"] == USER_AGENT
