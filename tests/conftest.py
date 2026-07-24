"""Shared pytest fixtures for Linz Linien Austria tests."""
from collections.abc import Generator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import CONF_SCAN_INTERVAL
from pytest_homeassistant_custom_component.syrupy import HomeAssistantSnapshotExtension
from syrupy.assertion import SnapshotAssertion

from custom_components.linz_linien_austria.const import (
    CONF_LIMIT,
    CONF_STOP_ID,
    CONF_STOP_NAME,
)

pytest_plugins = "pytest_homeassistant_custom_component"


def make_response_cm(resp: Any) -> MagicMock:
    """Build an async-context-manager wrapper around a fake response.

    Production sites switched from `await session.get(...)` to
    `async with session.get(...) as resp:` for deterministic
    connection-pool release. Tests that mocked `session.get =
    AsyncMock(return_value=resp)` need to switch to a sync-call
    factory whose return value is itself an async CM:
    `session.get = MagicMock(return_value=make_response_cm(resp))`.
    """
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=resp)
    cm.__aexit__ = AsyncMock(return_value=None)
    return cm

# Canonical entry-data shape used across the test suite. Individual
# tests can splat overrides via ``{**BASE_ENTRY_DATA, ...}``.
BASE_ENTRY_DATA: dict[str, object] = {
    CONF_STOP_ID: "60501720",
    CONF_STOP_NAME: "Linz/Donau, Hauptbahnhof",
    CONF_SCAN_INTERVAL: 60,
    CONF_LIMIT: 12,
}


@pytest.fixture
def snapshot(snapshot: SnapshotAssertion) -> SnapshotAssertion:
    """Use the HA snapshot extension so diagnostics dumps diff cleanly."""
    return snapshot.use_extension(HomeAssistantSnapshotExtension)


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(
    enable_custom_integrations: None,
) -> None:
    """Enable custom integrations for all tests in this package."""
    return None


@pytest.fixture(autouse=True)
def mock_aiohttp_session() -> Generator[None, None, None]:
    """Mock every clientsession so pycares' DNS thread never starts AND
    every outbound network attempt during setup is a no-op.

    pytest-homeassistant-custom-component's verify_cleanup fixture
    asserts no stray threads at teardown — the resolver thread violates
    that. Also patch the alerts refresh helpers so config-entry setup
    doesn't try to fetch the live ADDINFO endpoint.
    """
    with (
        patch(
            "custom_components.linz_linien_austria.coordinator.async_get_clientsession",
        ),
        patch(
            "custom_components.linz_linien_austria.config_flow.async_get_clientsession",
        ),
        patch(
            "custom_components.linz_linien_austria.alerts.async_get_clientsession",
        ),
        patch(
            "custom_components.linz_linien_austria.async_refresh_alerts",
            new_callable=AsyncMock,
        ),
        patch(
            "custom_components.linz_linien_austria.async_start_alerts_refresh",
        ),
        patch(
            "custom_components.linz_linien_austria.async_stop_alerts_refresh",
        ),
    ):
        yield


# Sample upstream payloads — close enough to a real EFA JSON response
# that the parsers exercise the real code paths. Coordinates are decimal
# WGS84 in EFA's lon,lat order, matching what the server returns for the
# `coordOutputFormat=WGS84[dd.ddddd]` every request sends.

EXAMPLE_STOPFINDER = {
    "stopFinder": [
        {
            "name": "Linz/Donau, Hauptbahnhof",
            "object": "Hauptbahnhof",
            "posttown": "Linz/Donau",
            "ref": {
                "id": "60501720",
                "place": "Linz/Donau",
                "coords": "14.291325,48.291028",
            },
            "stateless": "60501720",
        },
        {
            "name": "Linz/Donau, Hauptplatz",
            "object": "Hauptplatz",
            "posttown": "Linz/Donau",
            "ref": {"id": "60501070", "place": "Linz/Donau"},
            "stateless": "60501070",
        },
    ]
}


EXAMPLE_DM_RESPONSE = {
    "dm": {
        "points": {
            "point": {
                "name": "Linz/Donau, Hauptbahnhof",
                "object": "Hauptbahnhof",
                "posttown": "Linz/Donau",
                "ref": {
                    "id": "60501720",
                    "place": "Linz/Donau",
                    "coords": "14.291325,48.291028",
                },
                "stateless": "60501720",
            }
        }
    },
    # The stop's full timetable roster. Carries line 17 — which has no
    # departure in `departureList` below — so tests can assert that the
    # roster, not the live window, is what drives `lines_at_stop`.
    "servingLines": {
        "lines": [
            {
                "mode": {
                    "number": "2",
                    "type": "4",
                    "destination": "solarCity",
                    "destID": "60500296",
                    "desc": "Linz JKU | Universität - Linz solarCity",
                    "diva": {"dir": "H", "stateless": "esg:01002:E:H:e25"},
                }
            },
            {
                "mode": {
                    "number": "2",
                    "type": "4",
                    "destination": "Universität",
                    "destID": "60500920",
                    "desc": "Linz solarCity - Linz JKU | Universität",
                    "diva": {"dir": "R", "stateless": "esg:01002:E:R:e25"},
                }
            },
            {
                "mode": {
                    "number": "3",
                    "type": "4",
                    "destination": "Auwiesen",
                    "diva": {"dir": "H", "stateless": "esg:01003:E:H:e25"},
                }
            },
            {
                "mode": {
                    "number": "17",
                    "type": "5",
                    "destination": "Karlhof",
                    # No `diva.dir` — the code must recover "R" from the
                    # 4th segment of the stateless line id.
                    "diva": {"stateless": "esg:02017:E:R:e25"},
                }
            },
        ]
    },
    "departureList": [
        {
            "countdown": 3,
            "dateTime": {
                "year": "2026",
                "month": "4",
                "day": "27",
                "hour": "20",
                "minute": "49",
            },
            "realDateTime": {
                "year": "2026",
                "month": "4",
                "day": "27",
                "hour": "20",
                "minute": "50",
            },
            "platform": "1",
            "servingLine": {
                "number": "2",
                "direction": "solarCity",
                "directionFrom": "JKU",
                "motType": "4",
                "delay": "1",
                "liErgRiProj": {"direction": "H"},
                "stateless": "esg:01002:E:H:e25",
            },
        },
        {
            "countdown": 8,
            "dateTime": {
                "year": "2026",
                "month": "4",
                "day": "27",
                "hour": "20",
                "minute": "54",
            },
            "platform": "2",
            "servingLine": {
                "number": "3",
                "direction": "Auwiesen",
                "motType": "4",
                "delay": "0",
                # No `liErgRiProj` — direction code falls back to the
                # stateless line id, as it does on replacement services.
                "stateless": "esg:01003:E:H:e25",
            },
        },
    ],
}
