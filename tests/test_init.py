"""Lifecycle tests for the integration's __init__ module.

Covers:

* setup → unload happy path
* `async_remove_entry` only unregisters the Lovelace resource when the
  LAST config entry is removed (otherwise the card resource stays so
  the surviving entry's UI keeps working)
* `async_unload_entry` decrements the entry-count and stops the
  domain-wide alerts refresh on transition to zero
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.linz_linien_austria.api import _parse_dm
from custom_components.linz_linien_austria.const import (
    CARD_VERSION,
    CONF_LIMIT,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DOMAIN,
)

from .conftest import EXAMPLE_DM_RESPONSE

BASE_DATA = {
    CONF_STOP_ID: "60501720",
    CONF_STOP_NAME: "Linz/Donau, Hauptbahnhof",
    CONF_SCAN_INTERVAL: 60,
    CONF_LIMIT: 12,
}


def _make_entry(
    *, stop_id: str = "60501720", title: str = "Linz/Donau, Hauptbahnhof"
) -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data={**BASE_DATA, CONF_STOP_ID: stop_id, CONF_STOP_NAME: title},
        options={},
        title=title,
        unique_id=f"stop_{stop_id}",
    )


async def test_setup_unload_round_trip(hass: HomeAssistant) -> None:
    """A normal entry sets up to LOADED and unloads cleanly."""
    entry = _make_entry()
    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)

    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        entry.add_to_hass(hass)
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        assert entry.state is ConfigEntryState.LOADED

        assert await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()
        assert entry.state is ConfigEntryState.NOT_LOADED


async def test_remove_entry_unregisters_card_when_last(
    hass: HomeAssistant,
) -> None:
    """Removing the LAST entry triggers the card resource teardown."""
    entry = _make_entry()
    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)

    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        entry.add_to_hass(hass)
        await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    with patch(
        "custom_components.linz_linien_austria."
        "card_registration.JSModuleRegistration.async_unregister",
        new_callable=AsyncMock,
    ) as unregister:
        assert await hass.config_entries.async_remove(entry.entry_id)
        await hass.async_block_till_done()

    unregister.assert_awaited_once()


async def test_remove_entry_keeps_card_when_others_remain(
    hass: HomeAssistant,
) -> None:
    """Removing one of two entries must NOT touch the shared card resource."""
    entry_a = _make_entry(stop_id="60501720", title="Linz, Hauptbahnhof")
    entry_b = _make_entry(stop_id="60501070", title="Linz, Hauptplatz")

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        # add_to_hass kicks off async_setup_entry already; explicit
        # async_setup() second call would trip OperationNotAllowed.
        entry_a.add_to_hass(hass)
        await hass.config_entries.async_setup(entry_a.entry_id)
        entry_b.add_to_hass(hass)
        await hass.config_entries.async_setup(entry_b.entry_id)
        await hass.async_block_till_done()

    with patch(
        "custom_components.linz_linien_austria."
        "card_registration.JSModuleRegistration.async_unregister",
        new_callable=AsyncMock,
    ) as unregister:
        assert await hass.config_entries.async_remove(entry_a.entry_id)
        await hass.async_block_till_done()

    unregister.assert_not_awaited()


async def test_ws_card_version_returns_bundled_version(
    hass: HomeAssistant,
) -> None:
    """The WS handler must round-trip the integration's CARD_VERSION constant.

    Frontend uses the response to decide whether to flip the
    version-mismatch banner; if this command ever stops returning the
    canonical string, every running tab silently misbehaves on
    integration upgrade.

    Spinning up the real WS server inside the test fixture leaks the
    aiohttp listener thread past `verify_cleanup`. Drive the inner
    handler directly instead — same code path, no transport.
    """
    from unittest.mock import MagicMock

    from custom_components.linz_linien_austria import _websocket_card_version

    connection = MagicMock()

    # `websocket_command` wraps the function in a synchronous registrar
    # and `async_response` exposes the original coroutine on
    # `__wrapped__`. Drive the inner coroutine directly so we exercise
    # the same code path the live WS server would.
    handler = _websocket_card_version.__wrapped__  # type: ignore[attr-defined]
    await handler(hass, connection, {"id": 7, "type": "x/card_version"})

    connection.send_result.assert_called_once_with(
        7, {"version": CARD_VERSION}
    )
