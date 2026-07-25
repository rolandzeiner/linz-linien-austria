"""Diagnostics support for Linz Linien Austria.

Diagnostics dumps end up pasted into public GitHub issues, so the rule
is **principle of least disclosure**: surface the metadata a maintainer
needs to triage (config shape, last-refresh status, counts), but NOT
the live coordinator payload by default. Live data is reproducible
from a one-shot debug log enable; over-publishing it via diagnostics
just leaks "user X catches their bus at stop Y at HH:MM" patterns into
search-indexed issue bodies.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.core import HomeAssistant

from .alerts import get_alerts_for_lines, served_lines_from_data
from .const import ATTRIBUTION
from .coordinator import LinzLinienAustriaConfigEntry

# Defensive redaction set. The integration has no credentials or
# per-user secrets, but we still over-redact to harden against future
# field additions and to scrub anything the upstream might surface in
# the resolved-stop block (street-level coordinates of the configured
# stop are still PII for a single-user dashboard).
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
    """Return diagnostics for a config entry.

    Surfaces:
      * ``entry`` — title + version + redacted data/options.
      * ``coordinator`` — refresh status + update interval + a
        ``departures_count`` so a maintainer can tell whether the
        parser produced rows; the rows themselves stay out (they're
        reproducible from one debug-log session and over-publishing
        them leaks user routine).
      * ``alerts`` — the active service-disruption notices that affect
        the lines this entry's stop currently sees. Public CC-BY data
        and useful for triaging "alerts banner missed/showed
        unexpectedly" reports.
    """
    coordinator = entry.runtime_data
    data = coordinator.data or {}
    served_lines = served_lines_from_data(data)
    alerts = get_alerts_for_lines(hass, served_lines)

    return {
        "attribution": ATTRIBUTION,
        "entry": {
            "title": entry.title,
            "version": entry.version,
            "data": async_redact_data(dict(entry.data), TO_REDACT),
            "options": async_redact_data(dict(entry.options), TO_REDACT),
        },
        "coordinator": {
            "last_update_success": coordinator.last_update_success,
            # `last_exception` is the most useful triage signal when
            # `last_update_success=False`. `repr()` gives the class +
            # args without leaking response-body strings the way
            # `str()` of an aiohttp ClientResponseError does.
            "last_exception": repr(coordinator.last_exception),
            "update_interval": str(coordinator.update_interval),
            "departures_count": (
                int(data.get("departures_count", 0)) if isinstance(data, dict) else 0
            ),
            "alerts_count": len(alerts),
        },
        "alerts": alerts,
    }
