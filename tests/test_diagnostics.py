"""Tests for the Linz Linien Austria diagnostics module."""
import json
from unittest.mock import AsyncMock, patch

from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.linz_linien_austria.const import (
    CONF_LIMIT,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DOMAIN,
)
from custom_components.linz_linien_austria.diagnostics import (
    async_get_config_entry_diagnostics,
)

from .conftest import EXAMPLE_DM_RESPONSE

BASE_DATA = {
    CONF_STOP_ID: "60501720",
    CONF_STOP_NAME: "Linz/Donau, Hauptbahnhof",
    CONF_SCAN_INTERVAL: 60,
    CONF_LIMIT: 12,
}

# Distinctive sentinel for the full-blob redaction grep — it would leak
# into diagnostics if a future maintainer forgets to add a new
# credential field to TO_REDACT.
SECRET_TOKEN = "ZZZ-SUPER-SECRET-LEAK-CANARY-ZZZ"


async def test_diagnostics_emits_payload(hass: HomeAssistant) -> None:
    """Diagnostics surface the entry, coordinator state, and live data."""
    from custom_components.linz_linien_austria.api import _parse_dm

    entry = MockConfigEntry(
        domain=DOMAIN,
        data={**BASE_DATA, "token": SECRET_TOKEN},
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

    diag = await async_get_config_entry_diagnostics(hass, entry)

    assert diag["entry"]["title"] == "Linz/Donau, Hauptbahnhof"
    assert diag["entry"]["data"][CONF_STOP_ID] == "60501720"
    # `token` was added to `data` above and must come back redacted.
    assert diag["entry"]["data"]["token"] == "**REDACTED**"
    assert diag["coordinator"]["last_update_success"] is True
    assert diag["coordinator"]["departures_count"] == 2

    # Belt-and-braces: full-blob scan catches any future field that
    # forgets to wire a new credential through TO_REDACT.
    assert SECRET_TOKEN not in json.dumps(diag, default=str)
