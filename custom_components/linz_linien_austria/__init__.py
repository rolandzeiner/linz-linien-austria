"""Linz Linien Austria integration."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from homeassistant.components.websocket_api import async_register_command
from homeassistant.components.websocket_api.connection import ActiveConnection
from homeassistant.components.websocket_api.decorators import (
    async_response,
    websocket_command,
)
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import CoreState, Event, HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.storage import Store

from .alerts import (
    async_refresh_alerts,
    async_start_alerts_refresh,
    async_stop_alerts_refresh,
)
from .card_registration import JSModuleRegistration
from .const import (
    CARD_VERSION,
    CONF_LINES,
    CONF_LINES_LEGACY,
    DOMAIN,
    ENTRY_COUNT_KEY,
    LINES_AT_STOP_STORAGE_KEY_PREFIX,
    LINES_AT_STOP_STORAGE_VERSION,
)
from .coordinator import LinzLinienAustriaConfigEntry, LinzLinienAustriaCoordinator
from .migration import _remap_line_keys, _try_fetch_roster

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

PLATFORMS: list[Platform] = [Platform.SENSOR]


@websocket_command({vol.Required("type"): "linz_linien_austria/card_version"})
@async_response
async def _websocket_card_version(
    hass: HomeAssistant,
    connection: ActiveConnection,
    msg: dict[str, Any],
) -> None:
    """Return the bundled card version so the frontend can detect mismatches.

    The frontend bundle hard-codes ``CARD_VERSION`` at build time. When HA
    updates the integration but the user is still running a tab that
    cached the old bundle, this probe lets the card surface a reload
    banner instead of silently misbehaving.
    """
    connection.send_result(msg["id"], {"version": CARD_VERSION})


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Set up the Linz Linien Austria component (domain-level init).

    Card registration runs once per HA process — not per config entry. We
    defer it to ``EVENT_HOMEASSISTANT_STARTED`` if HA is still starting up
    so the Lovelace resources are loaded by the time we touch them.
    """
    hass.data.setdefault(DOMAIN, {})

    # WS commands registered here survive integration removal — HA's
    # websocket_api has no public deregister hook. Same caveat as the
    # static path registration in card_registration.py: pragmatic given
    # the API surface, harmless in practice (a stray handler that no
    # caller invokes once the bundle is gone). Behaviour on duplicate
    # registration is HA core internal; we never reach that branch
    # since `async_setup` only runs once per HA startup.
    async_register_command(hass, _websocket_card_version)

    registration = JSModuleRegistration(hass)

    async def _register_card(_event: Event | None = None) -> None:
        await registration.async_register()

    if hass.state == CoreState.running:
        await _register_card()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register_card)

    return True


async def async_migrate_entry(
    hass: HomeAssistant, entry: LinzLinienAustriaConfigEntry
) -> bool:
    """Migrate a config entry to the current schema version.

    v1 → v2: rewrite ``CONF_LINES`` filter keys from
    ``"<line>:<destination text>"`` to ``"<line>:<H|R>"``, and delete the
    orphaned ``lines_at_stop`` Store file (superseded by the upstream
    ``servingLines`` roster).

    The remap needs the stop's line roster, which costs one DM request.
    That request must never be allowed to fail the migration: HA wraps
    this call in a bare ``except Exception: return False``, and a
    ``False`` return puts the entry in ``MIGRATION_ERROR`` — a terminal
    state the user can only escape by deleting and re-adding the entry.
    There is no retry path out of here, not even via
    ``ConfigEntryNotReady``.

    So the fetch is best-effort. When it succeeds (the overwhelmingly
    common case) the filter is fully remapped before setup continues.
    When it fails, the legacy keys are parked in ``CONF_LINES_LEGACY``
    and the coordinator finishes the job on its first successful poll,
    where a failure is an ordinary retry. Either way the entry reaches
    v2 and stays loadable.
    """
    if entry.version > 2:
        # Downgrade from a future version — nothing sensible to do.
        return False
    if entry.version == 2:
        return True

    new_data = {**entry.data}
    new_options = {**entry.options}
    legacy_lines = [str(x) for x in (entry.data.get(CONF_LINES) or []) if x]
    legacy_option_lines = [str(x) for x in (entry.options.get(CONF_LINES) or []) if x]

    if legacy_lines or legacy_option_lines:
        roster = await _try_fetch_roster(hass, entry)
        if roster is not None:
            if legacy_lines:
                new_data[CONF_LINES] = _remap_line_keys(
                    legacy_lines, roster, entry.title
                )
            if legacy_option_lines:
                new_options[CONF_LINES] = _remap_line_keys(
                    legacy_option_lines, roster, entry.title
                )
        else:
            # Park the originals for the coordinator to heal. Clearing
            # the live keys is deliberate: a v1 key matches nothing under
            # v2, so leaving them in place would filter every departure
            # away until the first poll. An unfiltered stop for one tick
            # is the better failure.
            _LOGGER.info(
                "Line roster unavailable while migrating %s; the line filter "
                "will be remapped on the next successful update",
                entry.title,
            )
            if legacy_lines:
                new_data[CONF_LINES] = []
                new_data[CONF_LINES_LEGACY] = legacy_lines
            if legacy_option_lines:
                new_options[CONF_LINES] = []
                new_options[CONF_LINES_LEGACY] = legacy_option_lines

    # The Store file is per-entry and nothing reads it any more.
    legacy_store: Store[dict[str, Any]] = Store(
        hass,
        LINES_AT_STOP_STORAGE_VERSION,
        f"{LINES_AT_STOP_STORAGE_KEY_PREFIX}.{entry.entry_id}",
    )
    await legacy_store.async_remove()

    hass.config_entries.async_update_entry(
        entry, data=new_data, options=new_options, version=2, minor_version=1
    )
    return True


async def async_setup_entry(
    hass: HomeAssistant, entry: LinzLinienAustriaConfigEntry
) -> bool:
    """Set up Linz Linien Austria from a config entry."""
    domain_data = hass.data.setdefault(DOMAIN, {})

    coordinator = LinzLinienAustriaCoordinator(hass, entry)
    # HA auto-invokes coordinator._async_setup() inside this call before the
    # first fetch; raises ConfigEntryNotReady on fetch failure.
    #
    # Bootstrap the entry-count + alerts task ONLY after first_refresh
    # succeeds. If the very first refresh raises ConfigEntryNotReady, HA
    # never calls async_unload_entry, so any work we did here would never
    # be undone — the counter would drift up on every retry and the alerts
    # task would never stop on the last entry's failure cascade.
    await coordinator.async_config_entry_first_refresh()

    # Domain-wide alerts refresh — start lazily when the first entry
    # comes up. Order matters: refresh+start must run before the count
    # increments so the "first entry" branch fires exactly once per
    # zero→non-zero transition, regardless of how many flapping retries
    # the coordinator went through to reach this point.
    if not domain_data.get(ENTRY_COUNT_KEY):
        await async_refresh_alerts(hass)
        async_start_alerts_refresh(hass)
    domain_data[ENTRY_COUNT_KEY] = (domain_data.get(ENTRY_COUNT_KEY) or 0) + 1

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
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        domain_data = hass.data.setdefault(DOMAIN, {})
        remaining = max(0, (domain_data.get(ENTRY_COUNT_KEY) or 1) - 1)
        domain_data[ENTRY_COUNT_KEY] = remaining
        if remaining == 0:
            async_stop_alerts_refresh(hass)
    return unloaded


async def async_remove_entry(
    hass: HomeAssistant, entry: LinzLinienAustriaConfigEntry
) -> None:
    """Drop the Lovelace resource once the last entry of this domain is gone.

    The card resource is registered once globally per integration, so reloading or
    removing a single entry must not remove it; only when no other entries of this
    domain remain do we unregister.

    No per-entry persisted state is left to clean up: the ``lines_at_stop`` Store
    this used to remove is gone as of entry schema v2 (``async_migrate_entry``
    deletes any file left behind by v1).
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
