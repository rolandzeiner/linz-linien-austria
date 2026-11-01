"""Regression tests for outbound HTTP headers.

Header guarantees the integration relies on:

1. ``User-Agent`` — identifies this integration to LINZ AG so operators
   can rate-limit / contact us specifically. Malformed UA is silent
   failure (the integration still works, only the upstream's log parser
   breaks). Nothing flags this at build time, so we guard at test time.
2. No ``Accept-Encoding``. aiohttp's own offer (``gzip, deflate, zstd``)
   already gets the EFAController's ~7× gzip compression; passing the
   header would replace that offer instead of adding to it.

Every outbound call site gets a parametrised test that asserts both.
``api.py::request_headers`` is the single source of truth; if a future call
site reaches for ``session.get`` directly without going through it, this
test will catch the drift.
"""

from __future__ import annotations

import re
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from homeassistant.core import HomeAssistant

from custom_components.linz_linien_austria.alerts import async_fetch_alerts
from custom_components.linz_linien_austria.api import (
    fetch_departures,
    request_headers,
    search_stops,
)
from custom_components.linz_linien_austria.const import (
    DOMAIN,
    INTEGRATION_VERSION,
    USER_AGENT,
)

from .conftest import make_response_cm

_UA_PATTERN = re.compile(
    r"^HomeAssistant/[0-9.]+(?:[a-zA-Z0-9.\-+]+)?\s"
    rf"{re.escape(DOMAIN)}/{re.escape(INTEGRATION_VERSION)}\s"
    r"\(\+https://github\.com/rolandzeiner/linz-linien-austria\)$"
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


def test_base_headers_carry_both_guards() -> None:
    """Single source of truth for outbound headers."""
    headers = request_headers(USER_AGENT)
    assert headers == {"User-Agent": USER_AGENT, "Accept": "application/json"}


# --- Per-call-site assertion helpers -----------------------------------------


async def _call_dm(session: Any) -> None:
    await fetch_departures(session, "60501720", user_agent=USER_AGENT, limit=1)


async def _call_stopfinder(session: Any) -> None:
    await search_stops(session, "Hauptbahnhof", user_agent=USER_AGENT)


async def _call_alerts(session: Any) -> None:
    await async_fetch_alerts(session)


_BODIES: dict[str, dict[str, Any]] = {
    "dm": {"dm": {}, "departureList": []},
    "stopfinder": {"stopFinder": []},
    "alerts": {"additionalInformation": {"travelInformations": {}}},
}


@pytest.mark.parametrize(
    ("call_site", "caller", "body_key"),
    [
        ("DM_REQUEST", _call_dm, "dm"),
        ("STOPFINDER_REQUEST", _call_stopfinder, "stopfinder"),
        ("ADDINFO_REQUEST (alerts)", _call_alerts, "alerts"),
    ],
)
async def test_outbound_call_sends_required_headers(
    hass: HomeAssistant,
    call_site: str,
    caller: Any,
    body_key: str,
) -> None:
    """Every outbound call site carries the UA and leaves Accept-Encoding to aiohttp.

    Adding a new caller? Append a row above. The test fails if the new
    code path bypasses ``request_headers``.
    """
    session = MagicMock()
    # Production sites use `async with session.get(...)`. `session.get`
    # itself is the SYNC factory that returns the context manager;
    # MagicMock(return_value=...) gives us that sync-call shape.
    session.get = MagicMock(return_value=make_response_cm(_ok_resp(_BODIES[body_key])))
    await caller(session)
    sent = session.get.call_args.kwargs["headers"]
    assert sent["User-Agent"] == USER_AGENT, (
        f"{call_site}: missing or malformed User-Agent"
    )
    assert "Accept-Encoding" not in sent, (
        f"{call_site}: Accept-Encoding would narrow aiohttp's own offer"
    )
