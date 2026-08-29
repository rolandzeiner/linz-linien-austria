"""Tests for the next-departure sensor.

The sensor's `extra_state_attributes` dict is a public contract: the
bundled card reads it, and user templates/automations read it. Every
key the card or the README promises is asserted here so a refactor
can't quietly drop one.
"""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.const import ATTR_ATTRIBUTION, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.linz_linien_austria.api import EfaTimeoutError
from custom_components.linz_linien_austria.const import (
    ALERTS_KEY,
    ATTRIBUTION,
    DOMAIN,
)
from custom_components.linz_linien_austria.parser import _parse_dm

from .conftest import BASE_ENTRY_DATA, EXAMPLE_DM_RESPONSE

ENTITY_ID = "sensor.linz_donau_hauptbahnhof_next_departure"


def _entry() -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data=BASE_ENTRY_DATA,
        options={},
        title="Linz/Donau, Hauptbahnhof",
        unique_id="stop_60501720",
    )


async def _setup(hass: HomeAssistant, payload: dict[str, Any]) -> MockConfigEntry:
    """Set an entry up with a canned coordinator payload."""
    entry = _entry()
    entry.add_to_hass(hass)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=payload,
    ):
        await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
    return entry


def _payload(**overrides: Any) -> dict[str, Any]:
    """A minimal coordinator payload; override individual keys per test."""
    base: dict[str, Any] = {
        "stop": {"stop_id": "60501720", "name": "Hauptbahnhof", "place": "Linz"},
        "served_lines": [],
        "departures": [],
    }
    base.update(overrides)
    return base


def _attrs(hass: HomeAssistant) -> dict[str, Any]:
    state = hass.states.get(ENTITY_ID)
    assert state is not None
    return dict(state.attributes)


# ---------------------------------------------------------------------
# State value
# ---------------------------------------------------------------------


async def test_state_prefers_realtime_countdown(hass: HomeAssistant) -> None:
    """countdown 3 + delay 1 → the sensor reads 4, not 3."""
    await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    state = hass.states.get(ENTITY_ID)
    assert state is not None
    assert state.state == "4"


async def test_state_falls_back_to_scheduled_countdown(
    hass: HomeAssistant,
) -> None:
    """With no realtime correction the scheduled countdown is the state."""
    await _setup(
        hass,
        _payload(departures=[{"line": "2", "direction": "X", "countdown": 7}]),
    )
    state = hass.states.get(ENTITY_ID)
    assert state is not None
    assert state.state == "7"


async def test_state_unknown_when_no_countdown_at_all(
    hass: HomeAssistant,
) -> None:
    """A row with neither countdown yields no state rather than a guess."""
    await _setup(hass, _payload(departures=[{"line": "2", "direction": "X"}]))
    state = hass.states.get(ENTITY_ID)
    assert state is not None
    assert state.state == STATE_UNKNOWN


async def test_state_unknown_with_empty_departure_list(
    hass: HomeAssistant,
) -> None:
    """No service in the window is a normal condition, not an error."""
    await _setup(hass, _payload())
    state = hass.states.get(ENTITY_ID)
    assert state is not None
    assert state.state == STATE_UNKNOWN
    assert state.attributes["departures_count"] == 0


# ---------------------------------------------------------------------
# Attribute contract
# ---------------------------------------------------------------------


async def test_core_attributes_present(hass: HomeAssistant) -> None:
    """The keys the card and README promise all exist on a normal refresh."""
    await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    attrs = _attrs(hass)

    assert attrs["stop_id"] == "60501720"
    assert attrs["stop_name"] == "Linz/Donau, Hauptbahnhof"
    assert attrs["resolved_stop"]["stop_id"] == "60501720"
    assert len(attrs["departures"]) == 2
    assert attrs["departures_count"] == 2
    assert attrs["alerts"] == []
    assert attrs["alerts_count"] == 0
    assert attrs[ATTR_ATTRIBUTION] == ATTRIBUTION
    assert attrs["unit_of_measurement"] == "min"
    assert attrs["device_class"] == SensorDeviceClass.DURATION


async def test_lines_at_stop_covers_whole_roster(hass: HomeAssistant) -> None:
    """Line 17 has no departure in the window but serves the stop."""
    await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    assert _attrs(hass)["lines_at_stop"] == ["2", "3", "17"]


async def test_next_convenience_fields(hass: HomeAssistant) -> None:
    """Top-level `next_*` mirrors of the first departure, for templates."""
    await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    attrs = _attrs(hass)
    assert attrs["next_line"] == "2"
    assert attrs["next_direction"] == "solarCity"
    assert attrs["next_mot"] == "Tram"
    assert attrs["next_delay_minutes"] == 1
    assert attrs["next_is_realtime"] is True
    assert attrs["next_is_cancelled"] is False
    assert attrs["next_scheduled"] == "2026-04-27T20:49:00"
    assert attrs["next_realtime"] == "2026-04-27T20:50:00"


async def test_next_delay_hint_and_bay_surface(hass: HomeAssistant) -> None:
    """The operator's delay reason and named bay reach the attributes."""
    await _setup(
        hass,
        _payload(
            departures=[
                {
                    "line": "27",
                    "direction": "Karlhof",
                    "countdown": 3,
                    "delay_hint": "Behinderung! Verspätung!",
                    "stop_bay": "Hauptbahnhof (Busterminal)",
                }
            ]
        ),
    )
    attrs = _attrs(hass)
    assert attrs["next_delay_hint"] == "Behinderung! Verspätung!"
    assert attrs["next_stop_bay"] == "Hauptbahnhof (Busterminal)"


async def test_optional_next_fields_omitted_when_absent(
    hass: HomeAssistant,
) -> None:
    """A punctual trip must not carry empty delay/hint keys.

    Templates test these with `is defined`, so emitting them as None
    would silently flip that check.
    """
    await _setup(
        hass,
        _payload(departures=[{"line": "2", "direction": "X", "countdown": 5}]),
    )
    attrs = _attrs(hass)
    for key in (
        "next_delay_minutes",
        "next_delay_hint",
        "next_stop_bay",
        "next_scheduled",
        "next_realtime",
    ):
        assert key not in attrs, f"{key} leaked onto a punctual departure"


async def test_next_fields_absent_without_departures(
    hass: HomeAssistant,
) -> None:
    """No departures → no `next_*` block at all."""
    await _setup(hass, _payload())
    assert not [k for k in _attrs(hass) if k.startswith("next_")]


async def test_position_attributes_present_and_paired(
    hass: HomeAssistant,
) -> None:
    """lat/lon appear together once a fetch resolves a position."""
    await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    attrs = _attrs(hass)
    assert attrs["latitude"] == pytest.approx(48.291028)
    assert attrs["longitude"] == pytest.approx(14.291325)


async def test_position_attributes_absent_without_coords(
    hass: HomeAssistant,
) -> None:
    """A stop the upstream gives no position for omits both keys."""
    await _setup(hass, _payload())
    attrs = _attrs(hass)
    assert "latitude" not in attrs
    assert "longitude" not in attrs


async def test_cancelled_next_departure_flagged(hass: HomeAssistant) -> None:
    """When every upcoming trip is cancelled, the flag says so.

    The countdown still reads as a number, so an automation that only
    looks at the state would otherwise treat a cancelled trip as
    catchable.
    """
    await _setup(
        hass,
        _payload(
            departures=[
                {
                    "line": "2",
                    "direction": "X",
                    "countdown": 4,
                    "is_cancelled": True,
                }
            ]
        ),
    )
    assert _attrs(hass)["next_is_cancelled"] is True


async def test_alerts_surface_on_attributes(hass: HomeAssistant) -> None:
    """Alerts are sliced from the domain cache by the lines actually served.

    Note the alerts on the entity do NOT come from the fetch payload —
    the coordinator re-derives them from the domain-wide cache against
    the lines left after the user's line filter, so seeding that cache
    is what this exercises.
    """
    matching = {
        "info_id": "match",
        "title": "Umleitung Linie 2",
        "affected_lines": ["2"],
        "priority": "high",
    }
    unrelated = {
        "info_id": "other",
        "title": "Linie 99",
        "affected_lines": ["99"],
        "priority": "normal",
    }
    hass.data.setdefault(DOMAIN, {})[ALERTS_KEY] = [matching, unrelated]

    await _setup(
        hass,
        _payload(departures=[{"line": "2", "direction": "X", "countdown": 2}]),
    )
    attrs = _attrs(hass)
    assert attrs["alerts"] == [matching]
    assert attrs["alerts_count"] == 1


# ---------------------------------------------------------------------
# Recorder exclusions
# ---------------------------------------------------------------------


async def test_bulky_attributes_excluded_from_recorder(
    hass: HomeAssistant,
) -> None:
    """Big/churny attributes stay out of history but reach the frontend.

    `departures` alone can approach HA's 16 KB attribute cap at a busy
    stop; recording it every tick would bloat the DB for no analytical
    value. `next_delay_minutes` deliberately stays recorded so the
    punctuality trend survives.
    """
    await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    excluded = _sensor_entity(hass)._unrecorded_attributes
    assert {
        "departures",
        "alerts",
        "next_scheduled",
        "next_realtime",
        "lines_at_stop",
    } <= set(excluded)
    assert "next_delay_minutes" not in excluded


def _sensor_entity(hass: HomeAssistant) -> Any:
    """Reach the live entity object for attributes HA doesn't expose in state."""
    component = hass.data["entity_components"]["sensor"]
    entity = component.get_entity(ENTITY_ID)
    assert entity is not None
    return entity


# ---------------------------------------------------------------------
# Registry identity — these formulas are frozen
# ---------------------------------------------------------------------


async def test_unique_id_formula_is_stable(hass: HomeAssistant) -> None:
    """Changing this wipes every existing install's entity registry row."""
    entry = await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    reg_entry = er.async_get(hass).async_get(ENTITY_ID)
    assert reg_entry is not None
    assert reg_entry.unique_id == f"{entry.entry_id}_next_departure"


async def test_device_registered_with_expected_identity(
    hass: HomeAssistant,
) -> None:
    """The device row carries the operator branding the README documents."""
    entry = await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    device = dr.async_get(hass).async_get_device_by_identifier(
        (DOMAIN, entry.entry_id), entry.entry_id
    )
    assert device is not None
    assert device.manufacturer == "LINZ AG LINIEN"
    assert device.model == "EFA Echtzeit"


async def test_entity_uses_translation_key(hass: HomeAssistant) -> None:
    """has_entity_name + translation_key drive the localised entity name."""
    await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    entity = _sensor_entity(hass)
    assert entity.has_entity_name is True
    assert entity.translation_key == "next_departure"


async def test_no_state_class_to_avoid_lts_noise(hass: HomeAssistant) -> None:
    """A sawtooth countdown has no meaningful long-term aggregate."""
    await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    assert "state_class" not in _attrs(hass)


# ---------------------------------------------------------------------
# Availability
# ---------------------------------------------------------------------


async def test_entity_goes_unavailable_on_refresh_failure(
    hass: HomeAssistant,
) -> None:
    """A failed poll after a good one marks the entity unavailable."""
    entry = await _setup(hass, _parse_dm(EXAMPLE_DM_RESPONSE))
    state = hass.states.get(ENTITY_ID)
    assert state is not None and state.state == "4"

    coordinator = entry.runtime_data
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaTimeoutError("upstream down"),
    ):
        await coordinator.async_refresh()
        await hass.async_block_till_done()

    state = hass.states.get(ENTITY_ID)
    assert state is not None and state.state == STATE_UNAVAILABLE
