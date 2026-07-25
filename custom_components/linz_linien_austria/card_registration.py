"""Lovelace JS module registration for Linz Linien Austria.

Canonical pattern from the HA developer community guide:
https://community.home-assistant.io/t/developer-guide-embedded-lovelace-card-in-a-home-assistant-integration/974909

Storage-vs-yaml detection — the LovelaceData field name varies across
HA versions:

  * HA ≤ 2026.1: ``LovelaceData.mode: str``
    https://github.com/home-assistant/core/blob/2026.1.0/homeassistant/components/lovelace/__init__.py
  * HA ≥ 2026.2: ``LovelaceData.resource_mode: str``
    https://github.com/home-assistant/core/blob/2026.2.0/homeassistant/components/lovelace/__init__.py

``_is_storage_mode`` reads whichever attribute is present, preferring
``resource_mode`` when both happen to be defined — duck-typed by design
so we don't have to track every micro-rename across HA versions.
``resources`` itself is a
``ResourceYAMLCollection | ResourceStorageCollection`` union; the
type-only import + ``cast`` below narrow it for the storage-only
mutation calls without a runtime dependency on the typed class
existing on every HA version.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any, cast

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import CALLBACK_TYPE, HomeAssistant
from homeassistant.helpers.event import async_call_later

from .const import CARD_FILENAME, CARD_URL_BASE, CARD_VERSION

# Typed access to LovelaceData via the public HassKey HA exposes since
# 2024.x. The string fallback covers HA versions that pre-date the key
# (very old installs that would also be missing other modern API surfaces
# we depend on, but the lookup itself shouldn't crash on import).
try:
    # Compound ignore covers both:
    #   - attr-defined: HA versions before LOVELACE_DATA shipped
    #   - unused-ignore: HA versions where the symbol IS exported and
    #     local mypy would otherwise grumble that the ignore is unused.
    from homeassistant.components.lovelace.const import (  # type: ignore[attr-defined,unused-ignore]
        LOVELACE_DATA,
    )
except ImportError:  # pragma: no cover — fallback for HA before LOVELACE_DATA shipped
    LOVELACE_DATA = None  # type: ignore[assignment,unused-ignore]

# `lovelace.resources` is a union of ResourceYAMLCollection (read-only)
# and ResourceStorageCollection (exposes async_create_item /
# async_update_item / async_delete_item). _is_storage_mode gates the
# branches that need the storage shape; the cast() at each call site
# narrows the union for mypy. Type-only import — the symbol is only
# referenced in the cast string literal, never at runtime, so older HA
# installs without this submodule layout still work.
if TYPE_CHECKING:
    from homeassistant.components.lovelace.resources import (
        ResourceStorageCollection,
    )

_LOGGER = logging.getLogger(__name__)

# Single source of truth is const.py — these must match the static path
# the card bundle is actually served from and the URL the user copies
# onto their dashboard.
URL_BASE = CARD_URL_BASE

# Cap on _async_wait_for_lovelace_resources retry ticks. Each tick is 5s,
# so 60 ticks = 5 min. Reaching the cap means Lovelace's resource loader
# never flipped `loaded` — broken storage, YAML-mode race during reload,
# or future Lovelace internals change. Cheaper to surface the bad state
# with one warning than poll forever.
_LOVELACE_LOAD_RETRY_MAX = 60
_LOVELACE_LOAD_RETRY_INTERVAL_S = 5

JSMODULES: list[dict[str, str]] = [
    {
        "name": "Linz Linien Austria Card",
        "filename": CARD_FILENAME,
        "version": CARD_VERSION,
    },
]


class JSModuleRegistration:
    """Register JavaScript modules for Lovelace.

    Storage mode: resources are created/updated via the Lovelace resources API.
    YAML mode: users must add the resource manually — registration is skipped.
    """

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the registrar."""
        self.hass = hass
        # Prefer the typed HassKey introduced in HA 2024.x — the bare
        # string lookup is what HA core can rename without notice (see
        # the LovelaceData `mode` → `resource_mode` rename across
        # HA 2026.1 → 2026.2 documented in the module docstring).
        if LOVELACE_DATA is not None:
            self.lovelace = self.hass.data.get(LOVELACE_DATA)
        else:
            self.lovelace = self.hass.data.get("lovelace")
        # Cancel handle for the in-flight `_check_loaded` retry tick. We
        # capture it so `async_unregister` can cancel a pending retry
        # (otherwise the tick fires post-removal against a now-stale
        # lovelace handle). Cancelled at the top of every fresh schedule
        # too — `_check_loaded` is the only scheduler, so a previous
        # handle could only persist if a second scheduler raced ahead.
        self._retry_unsub: CALLBACK_TYPE | None = None

    async def async_register(self) -> None:
        """Register frontend resources."""
        # `http` is a soft dependency via manifest `after_dependencies`, so
        # it may not be loaded in the pytest env (pytest-homeassistant-custom-
        # component does not bootstrap `http` automatically). Skip instead of
        # crashing when absent — production installs always have it loaded.
        if getattr(self.hass, "http", None) is None:
            _LOGGER.debug("http component not available; skipping card registration")
            return
        await self._async_register_path()
        if self.lovelace is not None and self._is_storage_mode():
            await self._async_wait_for_lovelace_resources()

    def _is_storage_mode(self) -> bool:
        """Read the LovelaceData storage-vs-yaml field.

        The field was renamed across HA versions:
          - HA ≤ 2026.1: ``mode``
          - HA ≥ 2026.2: ``resource_mode``
        Whichever is present, we read it; the other won't exist on
        that HA version. See the module docstring for source links.
        """
        assert self.lovelace is not None
        for attr in ("resource_mode", "mode"):
            value = getattr(self.lovelace, attr, None)
            if value is not None:
                return bool(value == "storage")
        return False

    async def _async_register_path(self) -> None:
        """Register the static HTTP path that serves the JS bundle.

        The ``ha-lovelace-card`` skill's Rollup config writes the bundle to
        ``custom_components/<domain>/www/<filename>``; serving that ``www``
        subdirectory under URL_BASE keeps the resource URL flat
        (``URL_BASE/<filename>``) — no ``/www`` segment in the URL the user
        copies onto their dashboard, and the JS file actually exists where
        Rollup put it.
        """
        www_dir = Path(__file__).parent / "www"
        try:
            await self.hass.http.async_register_static_paths(
                [StaticPathConfig(URL_BASE, str(www_dir), False)]
            )
            _LOGGER.debug("Path registered: %s -> %s", URL_BASE, www_dir)
        except RuntimeError:
            _LOGGER.debug("Path already registered: %s", URL_BASE)

    async def _async_wait_for_lovelace_resources(self) -> None:
        """Wait for Lovelace resources to load, then register modules."""
        # Guarded by async_register(); narrow the Optional for mypy --strict.
        assert self.lovelace is not None
        attempts = 0

        async def _check_loaded(_now: Any) -> None:
            nonlocal attempts
            # The previous schedule has fired; clear the cancel slot so
            # async_unregister doesn't try to cancel an already-fired
            # handle (HA's CALLBACK_TYPE is idempotent enough but the
            # bookkeeping stays accurate).
            self._retry_unsub = None
            assert self.lovelace is not None
            if self.lovelace.resources.loaded:
                await self._async_register_modules()
                return
            attempts += 1
            if attempts >= _LOVELACE_LOAD_RETRY_MAX:
                _LOGGER.warning(
                    "Lovelace resources never reported `loaded` after %d × %ds "
                    "(broken storage, YAML-mode race, or Lovelace internals "
                    "change?). Giving up — users on storage mode will need to "
                    "reload the integration once Lovelace is back online.",
                    _LOVELACE_LOAD_RETRY_MAX,
                    _LOVELACE_LOAD_RETRY_INTERVAL_S,
                )
                return
            _LOGGER.debug(
                "Lovelace resources not loaded, retrying in %ds (%d/%d)",
                _LOVELACE_LOAD_RETRY_INTERVAL_S,
                attempts,
                _LOVELACE_LOAD_RETRY_MAX,
            )
            # Defensive: if a previous handle somehow still exists
            # (shouldn't — _check_loaded just cleared its own), drop it
            # before scheduling the next so we don't leak the prior tick.
            if self._retry_unsub is not None:
                self._retry_unsub()
            self._retry_unsub = async_call_later(
                self.hass, _LOVELACE_LOAD_RETRY_INTERVAL_S, _check_loaded
            )

        await _check_loaded(0)

    async def _async_register_modules(self) -> None:
        """Register or update JavaScript modules."""
        assert self.lovelace is not None
        # async_register() gates this method behind _is_storage_mode(),
        # so the resources collection is always the StorageCollection
        # variant. cast() tells mypy to treat the union as the narrow
        # type; runtime safety is the caller's _is_storage_mode() check.
        resources = cast("ResourceStorageCollection", self.lovelace.resources)
        _LOGGER.debug("Installing JavaScript modules")
        existing_resources = [
            r for r in resources.async_items() if r["url"].startswith(URL_BASE)
        ]
        for module in JSMODULES:
            url = f"{URL_BASE}/{module['filename']}"
            versioned_url = f"{url}?v={module['version']}"
            registered = False
            for resource in existing_resources:
                if self._get_path(resource["url"]) == url:
                    registered = True
                    if self._get_version(resource["url"]) != module["version"]:
                        _LOGGER.info(
                            "Updating %s to version %s",
                            module["name"],
                            module["version"],
                        )
                        try:
                            await resources.async_update_item(
                                resource["id"],
                                {"res_type": "module", "url": versioned_url},
                            )
                        except Exception as update_err:  # noqa: BLE001
                            # Broad catch is deliberate. async_update_item
                            # can fail with HomeAssistantError, KeyError
                            # (row evicted between async_items() and the
                            # update call), or another concrete class that
                            # has shifted across HA core versions. The
                            # recovery is the same regardless: drop and
                            # recreate. Same observable state for the
                            # dashboard, fresh resource id (which the
                            # dashboard never holds externally).
                            _LOGGER.debug(
                                "async_update_item failed (%s), trying delete+recreate",
                                update_err,
                            )
                            await resources.async_delete_item(resource["id"])
                            await resources.async_create_item(
                                {"res_type": "module", "url": versioned_url}
                            )
                    break
            if not registered:
                _LOGGER.info(
                    "Registering %s version %s", module["name"], module["version"]
                )
                await resources.async_create_item(
                    {"res_type": "module", "url": versioned_url}
                )

    def _get_path(self, url: str) -> str:
        """Extract path without version parameter."""
        return url.split("?")[0]

    def _get_version(self, url: str) -> str:
        """Extract version from URL query string."""
        parts = url.split("?")
        if len(parts) > 1 and parts[1].startswith("v="):
            return parts[1].replace("v=", "")
        return "0"

    async def async_unregister(self) -> None:
        """Remove Lovelace resources owned by this integration."""
        # Cancel any in-flight retry tick first — it's safe to call this
        # before the storage-mode gate because the unsub closure doesn't
        # depend on lovelace state. A pending tick that fires post-
        # unregister would touch a stale lovelace reference.
        if self._retry_unsub is not None:
            self._retry_unsub()
            self._retry_unsub = None
        if self.lovelace is None or not self._is_storage_mode():
            return
        resources = cast("ResourceStorageCollection", self.lovelace.resources)
        for module in JSMODULES:
            url = f"{URL_BASE}/{module['filename']}"
            existing = [r for r in resources.async_items() if r["url"].startswith(url)]
            for resource in existing:
                await resources.async_delete_item(resource["id"])
