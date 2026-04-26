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
            CONF_LINES: ["2:solarCity"],
        },
    )
    assert result["type"] == FlowResultType.CREATE_ENTRY
    refreshed = hass.config_entries.async_get_entry(entry.entry_id)
    assert refreshed is not None
    assert refreshed.options[CONF_SCAN_INTERVAL] == 90
    assert refreshed.options[CONF_LINES] == ["2:solarCity"]


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
