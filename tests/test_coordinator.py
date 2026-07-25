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
)
from custom_components.linz_linien_austria.const import (
    BACKOFF_CAP_SECONDS,
    CONF_LINES,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DOMAIN,
)
from custom_components.linz_linien_austria.coordinator import (
    LinzLinienAustriaCoordinator,
    _line_dir_key,
)
from custom_components.linz_linien_austria.parser import (
    _normalise_departure,
    _parse_dm,
    _parse_stopfinder,
    _wgs84_from_coords,
)

from .conftest import (
    BASE_ENTRY_DATA,
    EXAMPLE_DM_RESPONSE,
    EXAMPLE_STOPFINDER,
    EXAMPLE_STOPFINDER_MULTI,
    EXAMPLE_STOPFINDER_SINGLE,
)


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


def test_parse_stopfinder_reads_nested_single_point() -> None:
    """`stopFinder.points.point` as a bare dict must yield one candidate.

    Regression guard: this is the shape the LINZ AG deployment returns
    for every query, and the parser used to look for `points` as a list
    and find nothing — so stop search returned zero hits and the config
    flow could not add a stop at all.
    """
    stops = _parse_stopfinder(EXAMPLE_STOPFINDER_SINGLE)
    assert [s["stop_id"] for s in stops] == ["60501720"]
    assert stops[0]["name"] == "Linz/Donau, Hauptbahnhof"
    assert stops[0]["latitude"] == pytest.approx(48.291028)


def test_parse_stopfinder_reads_nested_point_list() -> None:
    """The same wrapper with several candidates yields all of them."""
    stops = _parse_stopfinder(EXAMPLE_STOPFINDER_MULTI)
    assert [s["stop_id"] for s in stops] == ["60501720", "60501070"]


def test_parse_stopfinder_reads_wgs84_coords() -> None:
    """Candidates carry lat/lon; a candidate without coords omits both keys."""
    stops = {s["stop_id"]: s for s in _parse_stopfinder(EXAMPLE_STOPFINDER)}
    assert stops["60501720"]["latitude"] == pytest.approx(48.291028)
    assert stops["60501720"]["longitude"] == pytest.approx(14.291325)
    assert "latitude" not in stops["60501070"]


def test_wgs84_guard_rejects_projected_coords() -> None:
    """Projected NAV5 easting/northing must never pass as a lat/lon pair.

    Dropping `coordOutputFormat` from a request would silently reintroduce
    these; the range guard turns that into a missing position rather than
    a device pinned to the middle of the ocean.
    """
    assert _wgs84_from_coords("14.291325,48.291028") == pytest.approx(
        (48.291028, 14.291325)
    )
    assert _wgs84_from_coords("5447580,809422") is None
    assert _wgs84_from_coords("not,coords") is None
    assert _wgs84_from_coords("14.29") is None
    assert _wgs84_from_coords(None) is None


def test_parse_serving_lines_normalises_roster() -> None:
    """The roster keeps one entry per line+direction with a resolved code."""
    roster = _parse_dm(EXAMPLE_DM_RESPONSE)["served_lines"]
    assert [(r["line"], r["dir_code"]) for r in roster] == [
        ("2", "H"),
        ("2", "R"),
        ("3", "H"),
        ("17", "R"),  # recovered from `stateless`, no `diva.dir` present
    ]
    outbound = roster[0]
    assert outbound["destination"] == "solarCity"
    assert outbound["dest_id"] == "60500296"
    assert outbound["mot_name"] == "Tram"


def test_parse_serving_lines_handles_single_line_dict() -> None:
    """EFA collapses a one-element collection to a bare dict, not a list."""
    payload = {
        "servingLines": {
            "lines": {
                "mode": {
                    "number": "50",
                    "type": "8",
                    "destination": "Pöstlingberg",
                    "diva": {"dir": "H"},
                }
            }
        }
    }
    roster = _parse_dm(payload)["served_lines"]
    assert [(r["line"], r["dir_code"]) for r in roster] == [("50", "H")]


def test_parse_serving_lines_tolerates_missing_block() -> None:
    """No `servingLines` at all yields an empty roster, not a crash."""
    assert _parse_dm({"departureList": []})["served_lines"] == []


def test_normalise_departure_resolves_direction_code() -> None:
    """`liErgRiProj` wins; `stateless` is the fallback."""
    first, second = EXAMPLE_DM_RESPONSE["departureList"]
    assert _normalise_departure(first)["dir_code"] == "H"
    # Second row has no liErgRiProj — must fall back to the stateless id.
    assert _normalise_departure(second)["dir_code"] == "H"


def test_normalise_departure_omits_unresolvable_direction_code() -> None:
    """A row with neither source omits `dir_code` rather than inventing one."""
    normalised = _normalise_departure(
        {"countdown": 5, "servingLine": {"number": "9", "direction": "Test"}}
    )
    assert normalised is not None
    assert "dir_code" not in normalised


def test_normalise_departure_flattens_delay_hint() -> None:
    """Multi-line dot-matrix hints collapse to one line for a card row."""
    out = _normalise_departure(
        {
            "countdown": 5,
            "servingLine": {
                "number": "27",
                "direction": "Test",
                "hints": [
                    {"content": "Behinderung!\nVerspätung!\nBitte Geduld!"}
                ],
            },
        }
    )
    assert out is not None
    assert out["delay_hint"] == "Behinderung! Verspätung! Bitte Geduld!"


def test_normalise_departure_handles_single_hint_dict() -> None:
    """EFA collapses a one-element hints list to a bare dict."""
    out = _normalise_departure(
        {
            "countdown": 5,
            "servingLine": {
                "number": "27",
                "direction": "Test",
                "hints": {"content": "Umleitung"},
            },
        }
    )
    assert out is not None
    assert out["delay_hint"] == "Umleitung"


def test_normalise_departure_decodes_html_in_hint() -> None:
    """Hints share a CMS with the alerts feed, so entities can appear."""
    out = _normalise_departure(
        {
            "countdown": 5,
            "servingLine": {
                "number": "27",
                "direction": "Test",
                "hints": [{"content": "<strong>Versp&auml;tung</strong>"}],
            },
        }
    )
    assert out is not None
    assert out["delay_hint"] == "Verspätung"


def test_normalise_departure_dedupes_repeated_hints() -> None:
    """EFA sometimes lists the same hint twice on one row."""
    out = _normalise_departure(
        {
            "countdown": 5,
            "servingLine": {
                "number": "27",
                "direction": "Test",
                "hints": [{"content": "Stau"}, {"content": "Stau"}],
            },
        }
    )
    assert out is not None
    assert out["delay_hint"] == "Stau"


def test_normalise_departure_omits_empty_hint() -> None:
    """No hints, junk hints, or blank content → the key is absent."""
    for hints in (None, [], [{}], [{"content": "   "}], "nonsense", [123]):
        out = _normalise_departure(
            {
                "countdown": 5,
                "servingLine": {
                    "number": "27",
                    "direction": "Test",
                    "hints": hints,
                },
            }
        )
        assert out is not None
        assert "delay_hint" not in out, f"leaked for {hints!r}"


def test_normalise_departure_carries_bay_and_operator() -> None:
    """`nameWO` names the bay; `operator.name` identifies who runs it."""
    out = _normalise_departure(
        {
            "countdown": 5,
            "platform": "5",
            "nameWO": "Hauptbahnhof (Busterminal)",
            "operator": {"code": "1", "name": "Linz Linien GmbH"},
            "servingLine": {"number": "45", "direction": "Test"},
        }
    )
    assert out is not None
    assert out["stop_bay"] == "Hauptbahnhof (Busterminal)"
    assert out["operator"] == "Linz Linien GmbH"
    assert out["platform"] == "5"


def test_normalise_departure_tolerates_malformed_operator() -> None:
    """A non-dict `operator` must not raise or leak a stringified dict."""
    out = _normalise_departure(
        {
            "countdown": 5,
            "operator": "Linz Linien GmbH",
            "servingLine": {"number": "45", "direction": "Test"},
        }
    )
    assert out is not None
    assert "operator" not in out


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
    ), pytest.raises(UpdateFailed):
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


async def test_non_update_failed_error_still_notes_failure(
    hass: HomeAssistant,
) -> None:
    """A non-UpdateFailed error must still widen the backoff.

    `_fetch_departures` only maps the `Efa*Error` family to
    `UpdateFailed`; an unexpected error (e.g. a raise inside the deferred
    line-filter heal) would otherwise escape without touching the failure
    counter. The broad arm in `_async_update_data` keeps the "any refresh
    failure adjusts cadence" invariant and re-raises unchanged.
    """
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        side_effect=RuntimeError("unexpected"),
    ), pytest.raises(RuntimeError):
        await coordinator._async_update_data()

    assert coordinator._consecutive_failures == 1


# ---------------------------------------------------------------------
# Line filter + helper
# ---------------------------------------------------------------------


async def test_lines_filter_drops_unselected_routes(hass: HomeAssistant) -> None:
    """When CONF_LINES is set, only matching `<line>:<H|R>` rows survive."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        data=BASE_ENTRY_DATA,
        options={CONF_LINES: ["2:H"]},
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


async def test_lines_filter_survives_headsign_change(hass: HomeAssistant) -> None:
    """A branching terminus changes the headsign; the filter must not care.

    This is the bug the H/R key exists to fix. Line 2 towards a branching
    terminus reports "solarCity" on one vehicle and "Ebelsberg" on the
    next; keying the filter on that text dropped the whole line whenever
    the short-turn variant came up.
    """
    entry = MockConfigEntry(
        domain=DOMAIN,
        data=BASE_ENTRY_DATA,
        options={CONF_LINES: ["2:H"]},
        title=BASE_ENTRY_DATA[CONF_STOP_NAME],
        unique_id=f"stop_{BASE_ENTRY_DATA[CONF_STOP_ID]}",
    )
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    short_turn = {
        "stop": {"stop_id": "60501720", "name": "Hauptbahnhof", "place": "Linz"},
        "served_lines": [{"line": "2", "dir_code": "H", "destination": "solarCity"}],
        "departures": [
            # Same line, same direction, different published headsign.
            {"line": "2", "direction": "Ebelsberg", "dir_code": "H", "countdown": 4},
        ],
    }
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=short_turn,
    ):
        await coordinator.async_refresh()

    assert coordinator.data is not None
    assert len(coordinator.data["departures"]) == 1


def test_line_dir_key_format() -> None:
    """Helper returns `<line>:<H|R>` with empty fallbacks."""
    assert _line_dir_key({"line": "2", "dir_code": "H"}) == "2:H"
    # Headsign text must not leak into the key — that was the old bug.
    assert _line_dir_key({"line": "2", "direction": "solarCity"}) == "2:"
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


# ---------------------------------------------------------------------
# lines_at_stop from the upstream roster — feeds the card editor's picker
# ---------------------------------------------------------------------


async def test_lines_at_stop_comes_from_roster_not_live_window(
    hass: HomeAssistant,
) -> None:
    """The picker lists every line in the timetable, not just what's departing.

    Line 17 is in the fixture's `servingLines` roster but has no row in
    `departureList`. Deriving the picker from observed departures would
    hide it until one happened to show up; the roster has it on the
    first fetch.
    """
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

    assert coordinator.data is not None
    # Natural-sorted, one label per line despite line 2 having two
    # directions in the roster.
    assert coordinator.data["lines_at_stop"] == ["2", "3", "17"]
    assert {d["line"] for d in coordinator.data["departures"]} == {"2", "3"}


async def test_lines_at_stop_ignores_user_line_filter(
    hass: HomeAssistant,
) -> None:
    """The roster must not narrow when the user filters to one line.

    Otherwise deselecting a line in the options flow would remove it
    from the picker that put it there — a one-way door.
    """
    entry = MockConfigEntry(
        domain=DOMAIN,
        data=BASE_ENTRY_DATA,
        options={CONF_LINES: ["2:H"]},
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
    assert {d["line"] for d in coordinator.data["departures"]} == {"2"}
    assert coordinator.data["lines_at_stop"] == ["2", "3", "17"]


async def test_lines_at_stop_falls_back_to_observed_labels(
    hass: HomeAssistant,
) -> None:
    """An empty roster falls back to the lines seen in the departure list.

    A stop with departures but an empty picker is a worse failure than a
    picker that undercounts, so the fallback stays.
    """
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)

    no_roster = {
        "stop": {"stop_id": "60501720", "name": "Hauptbahnhof", "place": "Linz"},
        "served_lines": [],
        "departures": [
            {"line": "3", "direction": "Auwiesen", "dir_code": "H", "countdown": 2},
            {"line": "2", "direction": "solarCity", "dir_code": "H", "countdown": 5},
        ],
    }
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=no_roster,
    ):
        await coordinator.async_refresh()

    assert coordinator.data is not None
    assert coordinator.data["lines_at_stop"] == ["2", "3"]


async def test_coordinator_exposes_wgs84_stop_position(
    hass: HomeAssistant,
) -> None:
    """The resolved stop's WGS84 position is plucked onto the coordinator."""
    entry = _make_entry()
    entry.add_to_hass(hass)
    coordinator = LinzLinienAustriaCoordinator(hass, entry)
    assert coordinator.latitude is None

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        await coordinator.async_refresh()

    # EFA publishes lon,lat — the parser must not hand them back swapped.
    assert coordinator.latitude == pytest.approx(48.291028)
    assert coordinator.longitude == pytest.approx(14.291325)


async def test_coordinator_keeps_last_known_position_when_absent(
    hass: HomeAssistant,
) -> None:
    """A later response without coords must not blank an established position."""
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

    without_coords = {
        "stop": {"stop_id": "60501720", "name": "Hauptbahnhof", "place": "Linz"},
        "served_lines": [],
        "departures": [],
    }
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=without_coords,
    ):
        await coordinator.async_refresh()

    assert coordinator.latitude == pytest.approx(48.291028)


# Quiet timedelta import — avoids "imported but unused" if the test
# module is later trimmed.
assert timedelta is not None
