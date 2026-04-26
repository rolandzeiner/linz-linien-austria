"""Tests for the next-departure sensor."""
from unittest.mock import AsyncMock, patch

from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.linz_linien_austria.api import _parse_dm
from custom_components.linz_linien_austria.const import (
    CONF_LIMIT,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DOMAIN,
)

from .conftest import EXAMPLE_DM_RESPONSE


async def test_sensor_state_and_attributes(hass: HomeAssistant) -> None:
    """The sensor surfaces realtime countdown + the full departure list."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        data={
            CONF_STOP_ID: "60501720",
            CONF_STOP_NAME: "Linz/Donau, Hauptbahnhof",
            CONF_SCAN_INTERVAL: 60,
            CONF_LIMIT: 12,
        },
        options={},
        title="Linz/Donau, Hauptbahnhof",
        unique_id="stop_60501720",
    )
    entry.add_to_hass(hass)

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    state = hass.states.get(
        "sensor.linz_donau_hauptbahnhof_next_departure"
    )
    assert state is not None
    # First departure: countdown 3, delay 1, so countdown_rt = 4.
    assert state.state == "4"
    assert state.attributes["next_line"] == "2"
    assert state.attributes["next_direction"] == "solarCity"
    assert state.attributes["next_is_realtime"] is True
    assert state.attributes["next_delay_minutes"] == 1
    assert len(state.attributes["departures"]) == 2
    assert state.attributes["unit_of_measurement"] == "min"


async def test_sensor_returns_none_with_empty_departures(
    hass: HomeAssistant,
) -> None:
    """An empty departure list yields a None state, not a crash."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        data={
            CONF_STOP_ID: "60501720",
            CONF_STOP_NAME: "Linz/Donau, Hauptbahnhof",
            CONF_SCAN_INTERVAL: 60,
            CONF_LIMIT: 12,
        },
        options={},
        title="Linz/Donau, Hauptbahnhof",
        unique_id="stop_60501720",
    )
    entry.add_to_hass(hass)

    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value={"stop": {"stop_id": "60501720"}, "departures": []},
    ):
        await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    state = hass.states.get(
        "sensor.linz_donau_hauptbahnhof_next_departure"
    )
    assert state is not None
    # No upcoming departures → state is "unknown" (HA renders None as such).
    assert state.state in ("unknown", "unavailable")
    assert state.attributes["departures_count"] == 0
