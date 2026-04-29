"""Tests for the Linz Linien Austria coordinator + EFA payload normalisation."""
from datetime import timedelta
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import UpdateFailed
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.linz_linien_austria.api import (
    EfaApiError,
    EfaHttpError,
    EfaPayloadError,
    EfaTimeoutError,
    _normalise_departure,
    _parse_dm,
    _parse_stopfinder,
)
from custom_components.linz_linien_austria.const import (
    BACKOFF_CAP_SECONDS,
    CONF_LIMIT,
    CONF_LINES,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DOMAIN,
)
from custom_components.linz_linien_austria.coordinator import (
    LinzLinienAustriaCoordinator,
    _line_dir_key,
)

from .conftest import EXAMPLE_DM_RESPONSE, EXAMPLE_STOPFINDER

BASE_ENTRY_DATA = {
    CONF_STOP_ID: "60501720",
    CONF_STOP_NAME: "Linz/Donau, Hauptbahnhof",
    CONF_SCAN_INTERVAL: 60,
    CONF_LIMIT: 12,
}


def _make_entry(data: dict | None = None) -> MockConfigEntry:
    entry_data = {**BASE_ENTRY_DATA, **(data or {})}
    return MockConfigEntry(
        domain=DOMAIN,
        data=entry_data,
        options={},
        title=entry_data[CONF_STOP_NAME],
        unique_id=f"stop_{entry_data[CONF_STOP_ID]}",
    )


# ---------------------------------------------------------------------
# Pure-function payload parsing tests — no HA / aiohttp involvement.
# ---------------------------------------------------------------------


def test_parse_stopfinder_extracts_stable_ids() -> None:
    """STOPFINDER results expose persistent ref.id values, not session ones."""
    stops = _parse_stopfinder(EXAMPLE_STOPFINDER)
    assert {s["stop_id"] for s in stops} == {"60501720", "60501070"}
    assert all(s["place"] == "Linz/Donau" for s in stops)


def test_normalise_departure_carries_realtime_correction() -> None:
    """A 1-minute delay shifts countdown_rt above the scheduled countdown."""
    raw = EXAMPLE_DM_RESPONSE["departureList"][0]
    normalised = _normalise_departure(raw)
    assert normalised is not None
    assert normalised["line"] == "2"
    assert normalised["direction"] == "solarCity"
    assert normalised["countdown"] == 3
    assert normalised["countdown_rt"] == 4
    assert normalised["delay_minutes"] == 1
    assert normalised["is_realtime"] is True
    assert normalised["mot"] == 4
    assert normalised["mot_name"] == "Tram"


def test_normalise_departure_drops_unknown_delay_sentinel() -> None:
    """`-9999` is an EFA sentinel for unknown — must not show as -9999 min."""
    raw = {
        "countdown": 5,
        "servingLine": {
            "number": "9",
            "direction": "Test",
            "delay": "-9999",
            "motType": "5",
        },
    }
    out = _normalise_departure(raw)
    assert out is not None
    assert "delay_minutes" not in out
    assert "countdown_rt" not in out


def test_parse_dm_resolves_stop_metadata() -> None:
    """DM response carries the canonical stop name on its outer point block."""
    payload = _parse_dm(EXAMPLE_DM_RESPONSE)
    assert payload["stop"]["stop_id"] == "60501720"
    assert payload["stop"]["place"] == "Linz/Donau"
    assert len(payload["departures"]) == 2
    assert payload["departures"][1]["line"] == "3"


def test_parse_dm_sorts_by_realtime_countdown() -> None:
    """Upstream returns scheduled-order; we re-sort by realtime arrival."""
    payload = {
        "departureList": [
            # scheduled-order: a delayed line listed before an on-time one
            # whose realtime puts it ahead.
            {
                "countdown": 1,
                "servingLine": {
                    "number": "17",
                    "direction": "Hitzing",
                    "delay": "12",
                    "motType": "4",
                },
            },
            {
                "countdown": 0,
                "servingLine": {
                    "number": "2",
                    "direction": "solarCity",
                    "delay": "0",
                    "motType": "4",
                },
            },
            # cancelled — must sink below all live rows regardless of cd.
            {
                "countdown": 2,
                "realtimeTripStatus": "TRIP_CANCELLED",
                "servingLine": {
                    "number": "12",
                    "direction": "Karlhof",
                    "delay": "0",
                    "motType": "5",
                },
            },
        ]
    }
    out = _parse_dm(payload)["departures"]
    # Effective ordering: line 2 (0 min, no delay) → line 17 (13 min) →
    # line 12 cancelled (always sinks).
    assert [d["line"] for d in out] == ["2", "17", "12"]
    assert out[-1].get("is_cancelled") is True


# ---------------------------------------------------------------------
# Coordinator integration tests
# ---------------------------------------------------------------------


async def test_fetch_success(hass: HomeAssistant) -> None:
    """The coordinator surfaces a normalised payload after a successful fetch."""
    entry = _make_entry()
    entry.add_to_hass(hass)

    coordinator = LinzLinienAustriaCoordinator(hass, entry)
    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        await coordinator.async_refresh()
    assert coordinator.last_update_success
    data = coordinator.data
    assert data is not None
    assert data["stop_id"] == "60501720"
    assert data["departures_count"] == 2
    assert data["departures"][0]["line"] == "2"


async def test_timeout_raises_translated_update_failed(hass: HomeAssistant) -> None:
    """Upstream timeout → UpdateFailed with translation_key=api_timeout."""
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaTimeoutError("timeout"),
    ):
        with pytest.raises(UpdateFailed) as excinfo:
            await coordinator._async_update_data()
        assert excinfo.value.translation_key == "api_timeout"


async def test_rate_limit_raises_repair_issue(hass: HomeAssistant) -> None:
    """HTTP 429 raises a per-entry rate-limit Repairs issue."""
    from homeassistant.helpers import issue_registry as ir

    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaHttpError(429, "Too Many Requests"),
    ):
        with pytest.raises(UpdateFailed):
            await coordinator._async_update_data()

    registry = ir.async_get(hass)
    issue = registry.async_get_issue(DOMAIN, f"rate_limited_{entry.entry_id}")
    assert issue is not None

    # On recovery the issue is cleared.
    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        await coordinator._async_update_data()
    assert registry.async_get_issue(
        DOMAIN, f"rate_limited_{entry.entry_id}"
    ) is None


async def test_config_entry_not_ready_on_first_refresh_failure(
    hass: HomeAssistant,
) -> None:
    """Setup retries when the first refresh fails."""
    entry = _make_entry()
    entry.add_to_hass(hass)

    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaTimeoutError("boom"),
    ):
        await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    assert entry.state is ConfigEntryState.SETUP_RETRY


async def test_min_poll_interval_enforced(hass: HomeAssistant) -> None:
    """A user-supplied interval below the floor is clamped to MIN_POLL_SECONDS."""
    entry = _make_entry({CONF_SCAN_INTERVAL: 5})  # below the floor
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)
    assert coordinator.update_interval is not None
    # Floor is 30 s — see const.py::MIN_POLL_SECONDS.
    assert coordinator.update_interval.total_seconds() == 30


# ---------------------------------------------------------------------
# Exponential-backoff ladder
# ---------------------------------------------------------------------


async def test_first_failure_keeps_normal_cadence(hass: HomeAssistant) -> None:
    """A single transient failure must NOT widen the poll interval."""
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    coordinator._note_failure()
    assert coordinator.update_interval == coordinator._normal_interval


async def test_repeated_failures_back_off_then_cap(hass: HomeAssistant) -> None:
    """Successive failures double the cadence, capped at BACKOFF_CAP_SECONDS."""
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    # Bury the cadence past the cap; the cap clamps it.
    for _ in range(20):
        coordinator._note_failure()
    assert coordinator.update_interval is not None
    assert (
        coordinator.update_interval.total_seconds() == BACKOFF_CAP_SECONDS
    )


async def test_recovery_restores_normal_cadence(hass: HomeAssistant) -> None:
    """First success after a streak resets the failure counter and cadence."""
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    coordinator._note_failure()
    coordinator._note_failure()
    coordinator._note_failure()
    assert coordinator.update_interval != coordinator._normal_interval

    coordinator._note_success()
    assert coordinator.update_interval == coordinator._normal_interval
    assert coordinator._consecutive_failures == 0


# ---------------------------------------------------------------------
# UpdateFailed translation keys
# ---------------------------------------------------------------------


async def test_http_error_uses_translated_update_failed(
    hass: HomeAssistant,
) -> None:
    """A non-429 HTTP error surfaces translation_key=api_http_error."""
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaHttpError(503, "Service Unavailable"),
    ):
        with pytest.raises(UpdateFailed) as excinfo:
            await coordinator._async_update_data()
        assert excinfo.value.translation_key == "api_http_error"


async def test_payload_error_uses_translated_update_failed(
    hass: HomeAssistant,
) -> None:
    """Malformed JSON surfaces translation_key=api_invalid_response."""
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaPayloadError("garbage"),
    ):
        with pytest.raises(UpdateFailed) as excinfo:
            await coordinator._async_update_data()
        assert excinfo.value.translation_key == "api_invalid_response"


async def test_generic_api_error_uses_connection_translation(
    hass: HomeAssistant,
) -> None:
    """A bare EfaApiError surfaces translation_key=api_connection_error."""
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaApiError("connection refused"),
    ):
        with pytest.raises(UpdateFailed) as excinfo:
            await coordinator._async_update_data()
        assert excinfo.value.translation_key == "api_connection_error"


# ---------------------------------------------------------------------
# Line filter + helper
# ---------------------------------------------------------------------


async def test_lines_filter_drops_unselected_routes(hass: HomeAssistant) -> None:
    """When CONF_LINES is set, only matching `<line>:<direction>` rows survive."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        data=BASE_ENTRY_DATA,
        options={CONF_LINES: ["2:solarCity"]},
        title=BASE_ENTRY_DATA[CONF_STOP_NAME],
        unique_id=f"stop_{BASE_ENTRY_DATA[CONF_STOP_ID]}",
    )
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        await coordinator.async_refresh()

    assert coordinator.data is not None
    departures = coordinator.data["departures"]
    assert {d["line"] for d in departures} == {"2"}


def test_line_dir_key_format() -> None:
    """Helper returns `<line>:<direction>` with empty fallbacks."""
    assert _line_dir_key({"line": "2", "direction": "solarCity"}) == "2:solarCity"
    assert _line_dir_key({}) == ":"


# ---------------------------------------------------------------------
# Teardown — async_teardown is safe when no listeners are registered
# ---------------------------------------------------------------------


async def test_teardown_is_safe_when_empty(hass: HomeAssistant) -> None:
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)
    coordinator.async_teardown()  # must not raise
    assert coordinator._unsub == []


async def test_teardown_invokes_registered_unsubs(hass: HomeAssistant) -> None:
    """Each callback in `_unsub` is invoked exactly once and the list cleared."""
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    calls = {"a": 0, "b": 0}

    def _unsub_a() -> None:
        calls["a"] += 1

    def _unsub_b() -> None:
        calls["b"] += 1

    coordinator._unsub.extend([_unsub_a, _unsub_b])
    coordinator.async_teardown()
    assert calls == {"a": 1, "b": 1}
    assert coordinator._unsub == []


# Quiet timedelta import — avoids "imported but unused" if the test
# module is later trimmed.
assert timedelta is not None
