"""Diagnostics support for Linz Linien Austria."""
from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from .coordinator import LinzLinienAustriaConfigEntry

# Defensive redaction set. The integration has no credentials or per-user
# secrets — but we still over-redact to harden against future field
# additions and to scrub anything the upstream might surface in the
# resolved-stop block (street-level coordinates of the configured stop
# are still PII for a single-user dashboard).
TO_REDACT = {
    "api_key",
    "password",
    "token",
    "latitude",
    "longitude",
    "lat",
    "lon",
    "coords_x",
    "coords_y",
    "Referer",
}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: LinzLinienAustriaConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    coordinator = entry.runtime_data
    data = coordinator.data or {}
    return {
        "entry": {
            "title": entry.title,
            "version": entry.version,
            "data": async_redact_data(dict(entry.data), TO_REDACT),
            "options": async_redact_data(dict(entry.options), TO_REDACT),
        },
        "coordinator": {
            "last_update_success": coordinator.last_update_success,
            "update_interval": str(coordinator.update_interval),
            "data_keys": sorted(data.keys()) if isinstance(data, dict) else None,
            "departures_count": (
                int(data.get("departures_count", 0))
                if isinstance(data, dict)
                else 0
            ),
        },
        # Surface the full live coordinator payload (with redaction) so a
        # bug report can be reproduced without asking the user to run a
        # debug build.
        "data": async_redact_data(
            data if isinstance(data, dict) else {}, TO_REDACT
        ),
    }
