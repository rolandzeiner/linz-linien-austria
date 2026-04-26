"""Lovelace JS module registration for Linz Linien Austria.

Canonical pattern from the HA developer community guide:
https://community.home-assistant.io/t/developer-guide-embedded-lovelace-card-in-a-home-assistant-integration/974909

Note for HA 2026+: the guide's code uses ``self.lovelace.mode`` but that
attribute was renamed. The ``LovelaceData`` dataclass (see
homeassistant/components/lovelace/__init__.py) exposes the storage/yaml
distinction via ``resource_mode``. The version here has been adjusted.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_call_later

from .const import CARD_VERSION

_LOGGER = logging.getLogger(__name__)

URL_BASE = "/linz-linien-austria"

JSMODULES: list[dict[str, str]] = [
    {
        "name": "Linz Linien Austria Card",
        "filename": "linz-linien-austria-card.js",
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
        self.lovelace = self.hass.data.get("lovelace")

    async def async_register(self) -> None:
        """Register frontend resources."""
        # `http` is a soft dependency via manifest `after_dependencies`, so
        # it may not be loaded in the pytest env (pytest-homeassistant-custom-
        # component does not bootstrap `http` automatically). Skip instead of
        # crashing when absent — production installs always have it loaded.
        if getattr(self.hass, "http", None) is None:
            _LOGGER.debug(
                "http component not available; skipping card registration"
            )
            return
        await self._async_register_path()
        if self.lovelace is not None and self.lovelace.resource_mode == "storage":
            await self._async_wait_for_lovelace_resources()

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

        async def _check_loaded(_now: Any) -> None:
            assert self.lovelace is not None
            if self.lovelace.resources.loaded:
                await self._async_register_modules()
            else:
                _LOGGER.debug("Lovelace resources not loaded, retrying in 5s")
                async_call_later(self.hass, 5, _check_loaded)

        await _check_loaded(0)

    async def _async_register_modules(self) -> None:
        """Register or update JavaScript modules."""
        assert self.lovelace is not None
        _LOGGER.debug("Installing JavaScript modules")
        existing_resources = [
            r
            for r in self.lovelace.resources.async_items()
            if r["url"].startswith(URL_BASE)
        ]
        for module in JSMODULES:
            url = f"{URL_BASE}/{module['filename']}"
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
                        await self.lovelace.resources.async_update_item(
                            resource["id"],
                            {
                                "res_type": "module",
                                "url": f"{url}?v={module['version']}",
                            },
                        )
                    break
            if not registered:
                _LOGGER.info(
                    "Registering %s version %s", module["name"], module["version"]
                )
                await self.lovelace.resources.async_create_item(
                    {
                        "res_type": "module",
                        "url": f"{url}?v={module['version']}",
                    }
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
        if self.lovelace is None or self.lovelace.resource_mode != "storage":
            return
        for module in JSMODULES:
            url = f"{URL_BASE}/{module['filename']}"
            resources = [
                r
                for r in self.lovelace.resources.async_items()
                if r["url"].startswith(url)
            ]
            for resource in resources:
                await self.lovelace.resources.async_delete_item(resource["id"])
