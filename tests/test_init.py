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
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.linz_linien_austria.api import EfaTimeoutError
from custom_components.linz_linien_austria.const import (
    CARD_VERSION,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DOMAIN,
    ENTRY_COUNT_KEY,
)
from custom_components.linz_linien_austria.parser import _parse_dm

from .conftest import BASE_ENTRY_DATA, EXAMPLE_DM_RESPONSE


def _make_entry(
    *, stop_id: str = "60501720", title: str = "Linz/Donau, Hauptbahnhof"
) -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data={**BASE_ENTRY_DATA, CONF_STOP_ID: stop_id, CONF_STOP_NAME: title},
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


async def test_failed_first_refresh_does_not_drift_entry_count(
    hass: HomeAssistant,
) -> None:
    """A first-refresh failure must not bump ENTRY_COUNT_KEY.

    Regression guard for the audit fix: previously the counter was
    bumped (and the alerts task started) BEFORE
    ``async_config_entry_first_refresh()``. A
    ``ConfigEntryNotReady`` raise from the first refresh skips
    ``async_unload_entry`` entirely, so on every flapping retry the
    counter would drift up and the alerts task would never stop on
    the last entry's failure cascade. Both stay quiet now.
    """
    entry = _make_entry()
    entry.add_to_hass(hass)

    # Drive setup through hass.config_entries — calling
    # `async_setup_entry` directly here would put the coordinator's
    # `async_config_entry_first_refresh` into a state HA 2026.x
    # rejects (it must run from SETUP_IN_PROGRESS, which only the
    # config-entries machinery transitions through).
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaTimeoutError("boom"),
    ):
        await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    assert entry.state is ConfigEntryState.SETUP_RETRY
    domain_data = hass.data.get(DOMAIN, {})
    # Counter must be 0 (or absent) — the bump is gated on a
    # successful first refresh now.
    assert (domain_data.get(ENTRY_COUNT_KEY) or 0) == 0
