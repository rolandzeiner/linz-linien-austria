"""Tests for the opt-in onward stop sequence.

The feature roughly triples the upstream response, so the things worth
guarding are: it stays off unless asked for, the request carries the
right flags, the clamp bounds the cost, and `prevStopSeq` — half the
payload and useless here — never reaches the attributes.
"""
from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, patch

from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.linz_linien_austria.api import fetch_departures
from custom_components.linz_linien_austria.const import (
    CONF_LIMIT,
    CONF_SHOW_STOP_SEQUENCE,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DOMAIN,
    MAX_STOPS_AHEAD,
    SEQUENCE_UPSTREAM_LIMIT,
)
from custom_components.linz_linien_austria.coordinator import (
    LinzLinienAustriaCoordinator,
)
from custom_components.linz_linien_austria.parser import (
    _iso_from_efa_compact,
    _parse_dm,
    _parse_onward_stops,
)

from .conftest import (
    BASE_ENTRY_DATA,
    EXAMPLE_DM_RESPONSE,
    EXAMPLE_DM_WITH_SEQUENCE,
)


def _entry(**data: Any) -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data={**BASE_ENTRY_DATA, **data},
        options={},
        title=str(BASE_ENTRY_DATA[CONF_STOP_NAME]),
        unique_id=f"stop_{BASE_ENTRY_DATA[CONF_STOP_ID]}",
        version=2,
        minor_version=1,
    )


# ---------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------


def test_sequence_absent_unless_requested() -> None:
    """A payload parsed without the flag carries no stops_ahead."""
    parsed = _parse_dm(EXAMPLE_DM_WITH_SEQUENCE)
    assert all("stops_ahead" not in d for d in parsed["departures"])


def test_onward_stops_parsed_in_order() -> None:
    """Stops come out nearest-first with names, ids and arrival times."""
    parsed = _parse_dm(EXAMPLE_DM_WITH_SEQUENCE, include_stop_sequence=True)
    stops = parsed["departures"][0]["stops_ahead"]
    assert [s["name"] for s in stops] == [
        "Waldeggstraße",
        "Sophiengutstraße",
        "Kudlichstraße",
    ]
    assert stops[0]["stop_id"] == "60500910"
    assert stops[0]["arrival"] == "2026-07-24T18:58:00"


def test_prev_stop_seq_never_reaches_output() -> None:
    """The stops already behind the vehicle are dropped on receipt.

    They are 53% of the sequence payload and meaningless for a departure
    monitor; the upstream offers no flag to suppress them, so this is the
    only place it can happen.
    """
    parsed = _parse_dm(EXAMPLE_DM_WITH_SEQUENCE, include_stop_sequence=True)
    stops = parsed["departures"][0]["stops_ahead"]
    assert all(s["name"] != "Bereits vorbei" for s in stops)
    assert len(stops) == 3


def test_delay_only_surfaces_when_realtime_valid() -> None:
    """EFA emits arrDelay on scheduled stops too; arrValid gates it.

    Surfacing a scheduled stop's leftover "+0" would imply live tracking
    the upstream is not claiming.
    """
    parsed = _parse_dm(EXAMPLE_DM_WITH_SEQUENCE, include_stop_sequence=True)
    waldegg, sophien, kudlich = parsed["departures"][0]["stops_ahead"]
    assert waldegg["delay_minutes"] == 1  # arrValid = 1
    assert "delay_minutes" not in sophien  # arrValid = 0
    # Third stop has no arrival at all — the departure side is used, and
    # depValid gates its delay.
    assert kudlich["arrival"] == "2026-07-24T19:00:00"
    assert kudlich["delay_minutes"] == 2


def test_onward_stops_capped() -> None:
    """A pathological upstream list is bounded before it hits attributes."""
    raw = [
        {"nameWO": f"Stop {i}", "ref": {"id": str(i)}}
        for i in range(MAX_STOPS_AHEAD + 20)
    ]
    assert len(_parse_onward_stops(raw)) == MAX_STOPS_AHEAD


def test_onward_stops_tolerate_junk() -> None:
    """Non-dict rows and nameless stops are skipped, not crashed on."""
    stops = _parse_onward_stops(
        ["nonsense", 42, {}, {"nameWO": "   "}, {"nameWO": "Real", "ref": {}}]
    )
    assert [s["name"] for s in stops] == ["Real"]


def test_onward_stops_handles_single_dict() -> None:
    """One remaining stop collapses to a bare dict, as EFA always does."""
    stops = _parse_onward_stops(
        {"nameWO": "Endstation", "ref": {"id": "1", "arrDateTime": "20260724 19:30"}}
    )
    assert [s["name"] for s in stops] == ["Endstation"]
    assert stops[0]["arrival"] == "2026-07-24T19:30:00"


def test_onward_stops_absent_when_empty() -> None:
    """An empty sequence must not leave an empty list on the departure."""
    payload = {
        "departureList": [
            {
                "countdown": 3,
                "servingLine": {"number": "2", "direction": "X"},
                "onwardStopSeq": [],
            }
        ]
    }
    parsed = _parse_dm(payload, include_stop_sequence=True)
    assert "stops_ahead" not in parsed["departures"][0]


def test_compact_datetime_parser() -> None:
    """The sequence block uses "YYYYMMDD HH:MM", not the nested dict form."""
    assert _iso_from_efa_compact("20260724 18:54") == "2026-07-24T18:54:00"
    assert _iso_from_efa_compact("20260724 9:05") == "2026-07-24T09:05:00"
    for junk in (None, "", "20260724", "not a date", "2026072 18:54", 42):
        assert _iso_from_efa_compact(junk) is None, junk


# ---------------------------------------------------------------------
# Request shape
# ---------------------------------------------------------------------


async def test_request_omits_sequence_flags_by_default() -> None:
    """The default request must not pay for a sequence nobody asked for."""
    with patch(
        "custom_components.linz_linien_austria.api._get_json",
        new_callable=AsyncMock,
        return_value={"departureList": []},
    ) as get_json:
        await fetch_departures(AsyncMock(), "60501720", limit=20)
    params = get_json.await_args.args[2]
    assert "depType" not in params
    assert "includeCompleteStopSeq" not in params


async def test_request_carries_sequence_flags_when_enabled() -> None:
    """Both flags are needed — stopEvents alone returns no stop list."""
    with patch(
        "custom_components.linz_linien_austria.api._get_json",
        new_callable=AsyncMock,
        return_value={"departureList": []},
    ) as get_json:
        await fetch_departures(
            AsyncMock(), "60501720", limit=10, include_stop_sequence=True
        )
    params = get_json.await_args.args[2]
    assert params["depType"] == "stopEvents"
    assert params["includeCompleteStopSeq"] == "1"


# ---------------------------------------------------------------------
# Coordinator wiring + the cost clamp
# ---------------------------------------------------------------------


async def test_coordinator_does_not_request_sequence_by_default(
    hass: HomeAssistant,
) -> None:
    entry = _entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=_parse_dm(EXAMPLE_DM_RESPONSE),
    ) as fetch:
        await coordinator.async_refresh()
    assert fetch.await_args.kwargs["include_stop_sequence"] is False


async def test_coordinator_clamps_upstream_limit_with_sequence(
    hass: HomeAssistant,
) -> None:
    """Enabling the option must shrink the fetch, not multiply the cost.

    Without the clamp the existing padding (limit*2, capped at 60) would
    be applied on top of an already-tripled response.
    """
    entry = _entry(**{CONF_LIMIT: 25, CONF_SHOW_STOP_SEQUENCE: True})
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=_parse_dm(
            EXAMPLE_DM_WITH_SEQUENCE, include_stop_sequence=True
        ),
    ) as fetch:
        await coordinator.async_refresh()
    assert fetch.await_args.kwargs["include_stop_sequence"] is True
    assert fetch.await_args.kwargs["limit"] == SEQUENCE_UPSTREAM_LIMIT


async def test_clamp_never_raises_a_smaller_limit(
    hass: HomeAssistant,
) -> None:
    """A user asking for fewer departures keeps their smaller fetch."""
    entry = _entry(**{CONF_LIMIT: 2, CONF_SHOW_STOP_SEQUENCE: True})
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=_parse_dm(
            EXAMPLE_DM_WITH_SEQUENCE, include_stop_sequence=True
        ),
    ) as fetch:
        await coordinator.async_refresh()
    assert fetch.await_args.kwargs["limit"] < SEQUENCE_UPSTREAM_LIMIT


async def test_option_reaches_departures_end_to_end(
    hass: HomeAssistant,
) -> None:
    """With the option on, the sensor's departures carry stops_ahead."""
    entry = _entry(**{CONF_SHOW_STOP_SEQUENCE: True, CONF_SCAN_INTERVAL: 60})
    entry.add_to_hass(hass)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=_parse_dm(
            EXAMPLE_DM_WITH_SEQUENCE, include_stop_sequence=True
        ),
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    state = hass.states.get("sensor.linz_donau_hauptbahnhof_next_departure")
    assert state is not None
    stops = state.attributes["departures"][0]["stops_ahead"]
    assert [s["name"] for s in stops][:1] == ["Waldeggstraße"]
