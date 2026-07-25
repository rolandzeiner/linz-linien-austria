"""Tests for the Linz Linien Austria config flow.

Covers the three-step flow (search → pick → settings), the duplicate-stop
abort, the no-results / search-too-short error branches, and the
reconfigure flow.
"""
from unittest.mock import AsyncMock, patch

from homeassistant import config_entries
from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType

from custom_components.linz_linien_austria.const import (
    CONF_LIMIT,
    CONF_SEARCH_QUERY,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DOMAIN,
)


def _patch_search(candidates):
    return patch(
        "custom_components.linz_linien_austria.config_flow.search_stops",
        new_callable=AsyncMock,
        return_value=candidates,
    )


def _patch_dm(payload):
    return patch(
        "custom_components.linz_linien_austria.config_flow.fetch_departures",
        new_callable=AsyncMock,
        return_value=payload,
    )


SAMPLE_CANDIDATES = [
    {"stop_id": "60501720", "name": "Linz/Donau, Hauptbahnhof", "place": "Linz/Donau"},
    {"stop_id": "60501070", "name": "Linz/Donau, Hauptplatz", "place": "Linz/Donau"},
]


async def test_form_shows(hass: HomeAssistant) -> None:
    """Initial step renders the search form."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "user"


async def test_search_too_short_shows_error(hass: HomeAssistant) -> None:
    """A 1-character query produces a search_too_short error inline."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_SEARCH_QUERY: "h"}
    )
    assert result["type"] == FlowResultType.FORM
    assert result["errors"][CONF_SEARCH_QUERY] == "search_too_short"


async def test_no_results_shows_error(hass: HomeAssistant) -> None:
    """An empty candidate list produces a no_results error."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    with _patch_search([]):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_SEARCH_QUERY: "nonexistent"}
        )
    assert result["type"] == FlowResultType.FORM
    assert result["errors"][CONF_SEARCH_QUERY] == "no_results"


async def test_full_flow_creates_entry(hass: HomeAssistant) -> None:
    """Search → pick → settings creates an entry with the stop ID + name."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    with _patch_search(SAMPLE_CANDIDATES):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_SEARCH_QUERY: "Hauptbahnhof"}
        )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "pick"

    with _patch_dm({"stop": {"stop_id": "60501720"}, "departures": []}):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_STOP_ID: "60501720"}
        )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "settings"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_SCAN_INTERVAL: 60, CONF_LIMIT: 12}
    )
    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["title"] == "Linz/Donau, Hauptbahnhof"
    assert result["data"][CONF_STOP_ID] == "60501720"
    assert result["data"][CONF_STOP_NAME] == "Linz/Donau, Hauptbahnhof"
    assert result["data"][CONF_SCAN_INTERVAL] == 60
    assert result["data"][CONF_LIMIT] == 12


async def test_duplicate_stop_aborted(hass: HomeAssistant) -> None:
    """Picking the same stop twice aborts the second flow."""
    for _ in range(2):
        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": config_entries.SOURCE_USER}
        )
        with _patch_search(SAMPLE_CANDIDATES):
            result = await hass.config_entries.flow.async_configure(
                result["flow_id"], {CONF_SEARCH_QUERY: "Hauptbahnhof"}
            )
        with _patch_dm({"stop": {"stop_id": "60501720"}, "departures": []}):
            result = await hass.config_entries.flow.async_configure(
                result["flow_id"], {CONF_STOP_ID: "60501720"}
            )
        if result["type"] == FlowResultType.FORM:
            result = await hass.config_entries.flow.async_configure(
                result["flow_id"], {CONF_SCAN_INTERVAL: 60, CONF_LIMIT: 12}
            )
    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_search_failure_surfaces_cannot_connect(
    hass: HomeAssistant,
) -> None:
    """An EFA failure during stop search yields a cannot_connect error."""
    from custom_components.linz_linien_austria.api import EfaApiError

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    with patch(
        "custom_components.linz_linien_austria.config_flow.search_stops",
        new_callable=AsyncMock,
        side_effect=EfaApiError("upstream down"),
    ):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_SEARCH_QUERY: "Hauptbahnhof"}
        )
    assert result["type"] == FlowResultType.FORM
    assert result["errors"]["base"] == "cannot_connect"


async def test_options_flow_allows_lines_filter(hass: HomeAssistant) -> None:
    """The options flow surfaces scan_interval / limit / lines filter."""
    from custom_components.linz_linien_austria.const import CONF_LINES

    # Bootstrap a real entry first.
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    with _patch_search(SAMPLE_CANDIDATES):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_SEARCH_QUERY: "Hauptbahnhof"}
        )
    with _patch_dm({"stop": {"stop_id": "60501720"}, "departures": []}):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_STOP_ID: "60501720"}
        )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_SCAN_INTERVAL: 60, CONF_LIMIT: 12}
    )
    entry = hass.config_entries.async_entries(DOMAIN)[0]

    # Now the options flow.
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "init"

    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            CONF_SCAN_INTERVAL: 90,
            CONF_LIMIT: 8,
            CONF_LINES: ["2:H"],
        },
    )
    assert result["type"] == FlowResultType.CREATE_ENTRY
    refreshed = hass.config_entries.async_get_entry(entry.entry_id)
    assert refreshed is not None
    assert refreshed.options[CONF_SCAN_INTERVAL] == 90
    assert refreshed.options[CONF_LINES] == ["2:H"]


async def test_reconfigure_updates_settings(hass: HomeAssistant) -> None:
    """Reconfigure updates scan_interval/limit but preserves the stop id."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    with _patch_search(SAMPLE_CANDIDATES):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_SEARCH_QUERY: "Hauptbahnhof"}
        )
    with _patch_dm({"stop": {"stop_id": "60501720"}, "departures": []}):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_STOP_ID: "60501720"}
        )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_SCAN_INTERVAL: 60, CONF_LIMIT: 12}
    )
    entry = hass.config_entries.async_entries(DOMAIN)[0]

    flow = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={
            "source": config_entries.SOURCE_RECONFIGURE,
            "entry_id": entry.entry_id,
        },
    )
    result = await hass.config_entries.flow.async_configure(
        flow["flow_id"],
        {CONF_SCAN_INTERVAL: 120, CONF_LIMIT: 6},
    )
    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"

    refreshed = hass.config_entries.async_get_entry(entry.entry_id)
    assert refreshed is not None
    assert refreshed.data[CONF_STOP_ID] == "60501720"  # preserved
    assert refreshed.data[CONF_SCAN_INTERVAL] == 120


# ---------------------------------------------------------------------
# Pick step — the test-before-configure probe and its failure branches
# ---------------------------------------------------------------------


async def test_pick_probe_failure_surfaces_cannot_connect(
    hass: HomeAssistant,
) -> None:
    """A stop that search found but the DM endpoint rejects must not save.

    Without the probe a stale bookmarked stop id would create a
    permanently broken entry that never produces a departure.
    """
    from custom_components.linz_linien_austria.api import EfaApiError

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    with _patch_search(SAMPLE_CANDIDATES):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_SEARCH_QUERY: "Hauptbahnhof"}
        )
    with patch(
        "custom_components.linz_linien_austria.config_flow.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaApiError("stop gone"),
    ):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_STOP_ID: "60501720"}
        )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "pick"
    assert result["errors"]["base"] == "cannot_connect"
    assert not hass.config_entries.async_entries(DOMAIN)



async def test_whitespace_only_query_is_too_short(hass: HomeAssistant) -> None:
    """The length check runs after trimming, so spaces don't pass it."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_SEARCH_QUERY: "     "}
    )
    assert result["errors"][CONF_SEARCH_QUERY] == "search_too_short"


# ---------------------------------------------------------------------
# Entry schema version
# ---------------------------------------------------------------------


async def test_new_entry_is_created_at_current_schema_version(
    hass: HomeAssistant,
) -> None:
    """A fresh entry must not immediately look like it needs migrating."""
    await _bootstrap_entry(hass)
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    assert entry.version == 2
    assert entry.minor_version == 1


# ---------------------------------------------------------------------
# Options flow — line-filter picker sourced from the upstream roster
# ---------------------------------------------------------------------


async def _bootstrap_entry(hass: HomeAssistant, coordinator_payload=None):
    """Run the full flow once and return the loaded entry.

    Creating the entry makes HA set it up immediately, so the
    coordinator's fetch has to be patched for the whole flow — otherwise
    the entry lands in SETUP_RETRY and a later explicit setup call
    raises OperationNotAllowed.
    """
    payload = coordinator_payload or {
        "stop": {"stop_id": "60501720", "name": "Hbf", "place": "Linz"},
        "served_lines": [],
        "departures": [],
    }
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=payload,
    ):
        result = await hass.config_entries.flow.async_init(
            DOMAIN, context={"source": config_entries.SOURCE_USER}
        )
        with _patch_search(SAMPLE_CANDIDATES):
            result = await hass.config_entries.flow.async_configure(
                result["flow_id"], {CONF_SEARCH_QUERY: "Hauptbahnhof"}
            )
        with _patch_dm({"stop": {"stop_id": "60501720"}, "departures": []}):
            result = await hass.config_entries.flow.async_configure(
                result["flow_id"], {CONF_STOP_ID: "60501720"}
            )
        await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_SCAN_INTERVAL: 60, CONF_LIMIT: 12}
        )
        await hass.async_block_till_done()
    return hass.config_entries.async_entries(DOMAIN)[0]


def _lines_selector_options(result) -> list[dict[str, str]]:
    """Dig the line-filter selector's options out of a rendered options form."""
    from custom_components.linz_linien_austria.const import CONF_LINES

    schema = result["data_schema"].schema
    for key, selector in schema.items():
        if str(key) == CONF_LINES:
            return list(selector.config["options"])
    raise AssertionError("no lines field in the options schema")


async def test_options_picker_labels_directions_readably(
    hass: HomeAssistant,
) -> None:
    """The picker offers `2:H` as the value but shows `2 → solarCity`.

    The H/R code is what makes the filter stable, but it means nothing
    to a user — the label has to carry the destination instead.
    """
    from custom_components.linz_linien_austria.parser import _parse_dm

    from .conftest import EXAMPLE_DM_RESPONSE

    entry = await _bootstrap_entry(hass, _parse_dm(EXAMPLE_DM_RESPONSE))

    result = await hass.config_entries.options.async_init(entry.entry_id)
    options = _lines_selector_options(result)

    assert {"value": "2:H", "label": "2 → solarCity"} in options
    assert {"value": "2:R", "label": "2 → Universität"} in options
    # Line 17 has no live departure but is in the roster — it must still
    # be offered, which is the entire point of the roster-backed picker.
    assert any(o["value"] == "17:R" for o in options)


async def test_options_picker_empty_before_first_fetch(
    hass: HomeAssistant,
) -> None:
    """An entry that never fetched yields an empty picker, not a crash.

    `custom_value=True` on the selector means the user can still type a
    raw key, so an empty list is a degraded but usable state.
    """
    entry = await _bootstrap_entry(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert _lines_selector_options(result) == []


async def test_options_picker_skips_roster_rows_without_direction(
    hass: HomeAssistant,
) -> None:
    """A roster row with no resolvable H/R code can't form a valid key."""
    entry = await _bootstrap_entry(
        hass,
        {
            "stop": {"stop_id": "60501720", "name": "Hbf", "place": "Linz"},
            "served_lines": [
                {"line": "2", "dir_code": "H", "destination": "solarCity"},
                {"line": "X", "destination": "Nowhere"},  # no dir_code
            ],
            "departures": [],
        },
    )

    result = await hass.config_entries.options.async_init(entry.entry_id)
    values = [o["value"] for o in _lines_selector_options(result)]
    assert values == ["2:H"]


async def test_options_picker_falls_back_to_line_when_no_destination(
    hass: HomeAssistant,
) -> None:
    """No headsign → label is just the line, never a dangling arrow."""
    entry = await _bootstrap_entry(
        hass,
        {
            "stop": {"stop_id": "60501720", "name": "Hbf", "place": "Linz"},
            "served_lines": [{"line": "45", "dir_code": "R"}],
            "departures": [],
        },
    )

    result = await hass.config_entries.options.async_init(entry.entry_id)
    assert _lines_selector_options(result) == [{"value": "45:R", "label": "45"}]


# ---------------------------------------------------------------------
# Candidate label formatting
# ---------------------------------------------------------------------


def test_candidate_label_appends_place_when_not_redundant() -> None:
    from custom_components.linz_linien_austria.config_flow import (
        _format_candidate_label,
    )

    assert (
        _format_candidate_label({"name": "Hauptbahnhof", "place": "Linz/Donau"})
        == "Hauptbahnhof (Linz/Donau)"
    )


def test_candidate_label_omits_place_already_in_name() -> None:
    """EFA names usually embed the locality; repeating it reads as noise."""
    from custom_components.linz_linien_austria.config_flow import (
        _format_candidate_label,
    )

    assert (
        _format_candidate_label(
            {"name": "Linz/Donau, Hauptbahnhof", "place": "Linz/Donau"}
        )
        == "Linz/Donau, Hauptbahnhof"
    )


def test_candidate_label_handles_missing_name() -> None:
    from custom_components.linz_linien_austria.config_flow import (
        _format_candidate_label,
    )

    assert _format_candidate_label({}) == "—"


# ---------------------------------------------------------------------
# show_stop_sequence — opt-in, and reachable from all three surfaces
# ---------------------------------------------------------------------


async def test_stop_sequence_defaults_off_on_new_entry(
    hass: HomeAssistant,
) -> None:
    """The option roughly triples upstream traffic, so it must be opt-in."""
    from custom_components.linz_linien_austria.const import (
        CONF_SHOW_STOP_SEQUENCE,
    )

    entry = await _bootstrap_entry(hass)
    assert entry.data[CONF_SHOW_STOP_SEQUENCE] is False


async def test_stop_sequence_can_be_enabled_at_setup(
    hass: HomeAssistant,
) -> None:
    from custom_components.linz_linien_austria.const import (
        CONF_SHOW_STOP_SEQUENCE,
    )

    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": config_entries.SOURCE_USER}
    )
    with _patch_search(SAMPLE_CANDIDATES):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_SEARCH_QUERY: "Hauptbahnhof"}
        )
    with _patch_dm({"stop": {"stop_id": "60501720"}, "departures": []}):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {CONF_STOP_ID: "60501720"}
        )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {CONF_SCAN_INTERVAL: 60, CONF_LIMIT: 12, CONF_SHOW_STOP_SEQUENCE: True},
    )
    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert result["data"][CONF_SHOW_STOP_SEQUENCE] is True


async def test_stop_sequence_toggled_via_options(hass: HomeAssistant) -> None:
    """Options is where a user flips it after seeing the traffic cost."""
    from custom_components.linz_linien_austria.const import (
        CONF_LINES,
        CONF_SHOW_STOP_SEQUENCE,
    )

    entry = await _bootstrap_entry(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            CONF_SCAN_INTERVAL: 60,
            CONF_LIMIT: 12,
            CONF_LINES: [],
            CONF_SHOW_STOP_SEQUENCE: True,
        },
    )
    assert result["type"] == FlowResultType.CREATE_ENTRY
    refreshed = hass.config_entries.async_get_entry(entry.entry_id)
    assert refreshed is not None
    assert refreshed.options[CONF_SHOW_STOP_SEQUENCE] is True


async def test_stop_sequence_toggled_via_reconfigure(
    hass: HomeAssistant,
) -> None:
    from custom_components.linz_linien_austria.const import (
        CONF_SHOW_STOP_SEQUENCE,
    )

    entry = await _bootstrap_entry(hass)
    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={"source": config_entries.SOURCE_RECONFIGURE, "entry_id": entry.entry_id},
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {CONF_SCAN_INTERVAL: 90, CONF_LIMIT: 6, CONF_SHOW_STOP_SEQUENCE: True},
    )
    assert result["type"] == FlowResultType.ABORT
    refreshed = hass.config_entries.async_get_entry(entry.entry_id)
    assert refreshed is not None
    assert refreshed.data[CONF_SHOW_STOP_SEQUENCE] is True
    # The stop itself must survive a reconfigure untouched.
    assert refreshed.data[CONF_STOP_ID] == "60501720"
