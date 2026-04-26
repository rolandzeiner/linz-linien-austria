"""Linz Linien Austria integration."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import CoreState, Event, HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr

from .card_registration import JSModuleRegistration
from .const import DOMAIN
from .coordinator import LinzLinienAustriaConfigEntry, LinzLinienAustriaCoordinator

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

_LOGGER = logging.getLogger(__name__)
PLATFORMS: list[Platform] = [Platform.SENSOR]


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Set up the Linz Linien Austria component (domain-level init).

    Card registration runs once per HA process — not per config entry. We
    defer it to ``EVENT_HOMEASSISTANT_STARTED`` if HA is still starting up
    so the Lovelace resources are loaded by the time we touch them.
    """
    hass.data.setdefault(DOMAIN, {})

    registration = JSModuleRegistration(hass)

    async def _register_card(_event: Event | None = None) -> None:
        await registration.async_register()

    if hass.state == CoreState.running:
        await _register_card()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register_card)

    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: LinzLinienAustriaConfigEntry
) -> bool:
    """Set up Linz Linien Austria from a config entry."""
    coordinator = LinzLinienAustriaCoordinator(hass, entry)
    # HA auto-invokes coordinator._async_setup() inside this call before the
    # first fetch; raises ConfigEntryNotReady on fetch failure.
    await coordinator.async_config_entry_first_refresh()

    # Register teardown only after first_refresh succeeded — running it on a
    # half-initialised coordinator that raised ConfigEntryNotReady leaks
    # listeners.
    entry.async_on_unload(coordinator.async_teardown)

    entry.runtime_data = coordinator

    # Register a device explicitly so the Devices panel shows the entry
    # even before any entity reports state.
    dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, entry.entry_id)},
        name=entry.title,
        manufacturer="LINZ AG LINIEN",
        model="EFA Echtzeit",
        configuration_url=(
            "https://www.linzag.at/portal/de/privatkunden/unterwegs/linzmobil/"
        ),
    )

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_reload_entry))
    return True


async def _async_reload_entry(
    hass: HomeAssistant, entry: LinzLinienAustriaConfigEntry
) -> None:
    """Reload the config entry when options are updated."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(
    hass: HomeAssistant, entry: LinzLinienAustriaConfigEntry
) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(
    hass: HomeAssistant, entry: LinzLinienAustriaConfigEntry
) -> None:
    """Drop the Lovelace resource when the LAST config entry is removed.

    The card resource is registered once globally per integration, so
    reloading or removing a single entry must not remove it. Only when no
    other entries of this domain remain do we unregister.
    """
    remaining = [
        e
        for e in hass.config_entries.async_entries(DOMAIN)
        if e.entry_id != entry.entry_id
    ]
    if remaining:
        return
    registration = JSModuleRegistration(hass)
    await registration.async_unregister()
