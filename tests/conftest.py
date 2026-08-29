"""Shared pytest fixtures for Linz Linien Austria tests."""

from collections.abc import Generator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import CONF_SCAN_INTERVAL
from pytest_homeassistant_custom_component.syrupy import HomeAssistantSnapshotExtension
from pytest_homeassistant_custom_component.test_util.aiohttp import (
    AiohttpClientMocker,
)
from syrupy.assertion import SnapshotAssertion

from custom_components.linz_linien_austria import rate_limit
from custom_components.linz_linien_austria.const import (
    CONF_LIMIT,
    CONF_STOP_ID,
    CONF_STOP_NAME,
)

pytest_plugins = "pytest_homeassistant_custom_component"


@pytest.fixture(autouse=True)
def _collapse_domain_cooldown(request: pytest.FixtureRequest) -> Generator[None]:
    """Zero the domain cooldown so tests don't pay it in wall clock.

    `rate_limit.async_enforce_domain_cooldown` sleeps for real, so any
    test that fetches twice would sit out `DOMAIN_COOLDOWN_SECONDS`.
    Autouse rather than per-test because the cost is invisible at the
    call site: a test looks fast and only shows up in `--durations`.

    Patches the constant, not `asyncio.sleep`: patching
    `rate_limit.asyncio.sleep` resolves the singleton asyncio module and
    silences every sleep in the process, HA core's included.

    Zeroing it makes the `0 < elapsed < DOMAIN_COOLDOWN_SECONDS` guard
    false for any elapsed, so the sleep branch is never entered.

    Opt out with `@pytest.mark.real_domain_cooldown` when asserting the
    cooldown arithmetic.
    """
    if "real_domain_cooldown" in request.keywords:
        yield
        return
    with patch.object(rate_limit, "DOMAIN_COOLDOWN_SECONDS", 0):
        yield


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
    return


@pytest.fixture(autouse=True)
def mock_aiohttp_session(aioclient_mock: AiohttpClientMocker) -> Generator[None]:
    """Guarantee no test reaches the network, and stub the alerts refresh.

    `aioclient_mock` is PHACC's own HTTP mock (`plugins.py` ->
    `AiohttpClientMocker`). Depending on it patches
    `homeassistant.helpers.aiohttp_client._async_create_clientsession`, so
    no real ClientSession is ever built and pycares' DNS-resolver thread —
    which pytest-HACC's `verify_cleanup` fails the run over — never starts.
    It also raises `AssertionError: No mock registered for ...` on any
    unmatched request, so a test that forgets to stub a fetch fails loudly
    instead of quietly hitting the live EFA endpoint.

    Preferred over a hand-rolled session mock: `AiohttpClientMocker`
    already models aiohttp's sync `raise_for_status` / async `json()`
    split correctly, which is easy to get wrong by hand.

    The alerts patches are a separate concern — function-level, not
    HTTP-level — so that config-entry setup doesn't schedule the
    domain-wide ADDINFO refresh during unrelated tests.
    """
    with (
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

# The shape the LINZ AG deployment actually returns: `stopFinder` is a
# dict, `points` wraps a `point`, and `point` collapses to a bare dict
# whenever the query resolved to a single best match — which is every
# query on this deployment. Parsing this as a list yielded zero
# candidates and made the config flow unable to add any stop.
EXAMPLE_STOPFINDER_SINGLE = {
    "stopFinder": {
        "input": {"input": "Hauptbahnhof"},
        "points": {
            "point": {
                "usage": "sf",
                "type": "any",
                "name": "Linz/Donau, Hauptbahnhof",
                "object": "Hauptbahnhof",
                "anyType": "stop",
                "stateless": "60501720",
                "ref": {
                    "id": "60501720",
                    "place": "Linz/Donau",
                    "coords": "14.291325,48.291028",
                },
            }
        },
    }
}

# Same wrapper, but `point` is a list — EFA's ambiguous-match shape.
EXAMPLE_STOPFINDER_MULTI = {
    "stopFinder": {
        "points": {
            "point": [
                {
                    "name": "Linz/Donau, Hauptbahnhof",
                    "object": "Hauptbahnhof",
                    "stateless": "60501720",
                    "ref": {"id": "60501720", "place": "Linz/Donau"},
                },
                {
                    "name": "Linz/Donau, Hauptplatz",
                    "object": "Hauptplatz",
                    "stateless": "60501070",
                    "ref": {"id": "60501070", "place": "Linz/Donau"},
                },
            ]
        }
    }
}

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


# One departure carrying both sequence blocks, as returned when
# `depType=stopEvents&includeCompleteStopSeq=1` is requested. `prevStopSeq`
# is present on purpose: the parser must ignore it, and it is over half
# the sequence payload the upstream bills us for.
EXAMPLE_DM_WITH_SEQUENCE = {
    "dm": {
        "points": {
            "point": {
                "name": "Linz/Donau, Hauptbahnhof",
                "ref": {"id": "60501720", "place": "Linz/Donau"},
                "stateless": "60501720",
            }
        }
    },
    "departureList": [
        {
            "countdown": 2,
            "dateTime": {
                "year": "2026",
                "month": "7",
                "day": "24",
                "hour": "18",
                "minute": "56",
            },
            "servingLine": {
                "number": "12",
                "direction": "Auwiesen",
                "motType": "5",
                "delay": "1",
                "liErgRiProj": {"direction": "H"},
            },
            "prevStopSeq": [
                {
                    "nameWO": "Bereits vorbei",
                    "ref": {"id": "99999999", "arrDateTime": "20260724 18:50"},
                }
            ],
            "onwardStopSeq": [
                {
                    "name": "Linz/Donau Waldeggstraße",
                    "nameWO": "Waldeggstraße",
                    "ref": {
                        "id": "60500910",
                        "arrDateTime": "20260724 18:58",
                        "arrDelay": "1",
                        "arrValid": "1",
                        "depDateTime": "20260724 18:58",
                        "depDelay": "1",
                        "depValid": "1",
                    },
                },
                {
                    "name": "Linz/Donau Sophiengutstraße",
                    "nameWO": "Sophiengutstraße",
                    "ref": {
                        # Scheduled-only stop: EFA still emits arrDelay,
                        # but arrValid says it isn't a live prediction.
                        "id": "60500920",
                        "arrDateTime": "20260724 18:59",
                        "arrDelay": "0",
                        "arrValid": "0",
                    },
                },
                {
                    # No arrival at all — falls back to the departure time.
                    "name": "Linz/Donau Kudlichstraße",
                    "nameWO": "Kudlichstraße",
                    "ref": {
                        "id": "60500930",
                        "depDateTime": "20260724 19:00",
                        "depDelay": "2",
                        "depValid": "1",
                    },
                },
            ],
        }
    ],
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


@pytest.fixture(autouse=True)
def no_deprecated_ha_api(
    request: pytest.FixtureRequest, caplog: pytest.LogCaptureFixture
) -> Generator[None]:
    """Fail any test that trips Home Assistant's deprecation channel.

    `frame.report_usage` logs through `_LOGGER.warning` and never calls
    `warnings.warn`, so `pytest.ini`'s `error::DeprecationWarning` filter
    cannot see it. This is that filter's counterpart for HA's own channel,
    and it runs on every test rather than on one.

    HA emits two message shapes and picks the severity tier from whichever
    applies (`homeassistant/helpers/frame.py`):

    - "Detected that custom integration '<x>' ..." when the stack walk finds
      our integration. Governed by `custom_integration_behavior`, the most
      lenient tier — it is still LOG long after core has moved on.
    - "Detected code that ..." when HA cannot attribute the call to any
      integration, which is exactly what happens for a call made from a
      *test* file. Governed by `core_behavior`, the strictest tier, and so
      the first to turn a warning into a `RuntimeError`.

    Watching only the first shape is what let `device_registry.async_get_device`
    reach a hard CI failure on 2026-08-29. The deprecation had been logging
    since HA 2026.7, but only ever from the test file, so the old single-test
    tripwire never saw it. Catching both shapes means a deprecation fails the
    build while it is still a warning in our tier, which makes the eventual
    flip to ERROR a no-op.

    Records are read per phase via `get_records`, not from `caplog.text`:
    pytest installs a fresh handler for each of setup/call/teardown, so by
    the time this finaliser runs `caplog.text` holds teardown records only
    and would miss everything the test body logged.

    Opt out for a test that asserts deprecation behaviour on purpose:

        @pytest.mark.allow_deprecated_ha_api
    """
    yield
    if request.node.get_closest_marker("allow_deprecated_ha_api"):
        return
    hits = [
        message
        for phase in ("setup", "call")
        for record in caplog.get_records(phase)
        if (message := record.getMessage()).startswith(
            ("Detected that ", "Detected code that ")
        )
    ]
    if hits:
        pytest.fail(
            "Home Assistant reported deprecated API use:\n  " + "\n  ".join(hits),
            pytrace=False,
        )
