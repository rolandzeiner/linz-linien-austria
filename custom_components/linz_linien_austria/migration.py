"""Config-entry migration helpers (v1 → v2 line-filter remap).

These three helpers are shared by two callers that must not import each
other:

* :func:`async_migrate_entry` in :mod:`.__init__`, which runs at upgrade
  time and remaps the filter up front when the upstream is reachable.
* :meth:`LinzLinienAustriaCoordinator._heal_legacy_line_filter`, which
  finishes the job on the first successful poll when the migration-time
  fetch failed.

Housing them here — rather than in ``__init__`` — is what lets the
coordinator import :func:`_remap_line_keys` at module scope instead of
the function-local ``from . import _remap_line_keys`` circular-import
dodge it used before.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import EfaApiError, fetch_departures
from .const import CONF_LINES_LEGACY, CONF_STOP_ID

if TYPE_CHECKING:
    from .coordinator import LinzLinienAustriaConfigEntry

_LOGGER = logging.getLogger(__name__)


def _has_legacy_line_filter(entry: LinzLinienAustriaConfigEntry) -> bool:
    """True while an entry still carries un-remapped v1 line-filter keys."""
    return bool(
        entry.data.get(CONF_LINES_LEGACY) or entry.options.get(CONF_LINES_LEGACY)
    )


async def _try_fetch_roster(
    hass: HomeAssistant, entry: LinzLinienAustriaConfigEntry
) -> list[dict[str, Any]] | None:
    """Fetch the stop's line roster, or None if the upstream can't be reached.

    ``limit=1`` because only the ``servingLines`` block matters here —
    the departure rows are discarded.
    """
    session = async_get_clientsession(hass)
    try:
        payload = await fetch_departures(
            session, str(entry.data[CONF_STOP_ID]), limit=1
        )
    except EfaApiError as err:
        _LOGGER.debug("Roster fetch during migration failed: %s", err)
        return None
    return list(payload.get("served_lines") or [])


def _remap_line_keys(
    legacy: list[str], roster: list[dict[str, Any]], entry_title: str
) -> list[str]:
    """Map v1 ``"<line>:<destination>"`` keys onto v2 ``"<line>:<H|R>"``.

    Matching is on the destination text the v1 key recorded against the
    roster's headsign for that line and direction, case-insensitively.
    Two keys that can't be matched are handled differently on purpose:

    * A line that runs in exactly ONE direction through this stop is
      unambiguous — take that direction regardless of whether the
      headsign matches, since a branching terminus is precisely the case
      where the stored text has drifted.
    * Anything still unmatched is dropped, with a warning naming the
      entry. Keeping an unmatchable key would filter every departure
      away and read as "the integration broke"; dropping it widens the
      filter, which is visible and self-correcting in the options flow.
    """
    by_line: dict[str, list[dict[str, Any]]] = {}
    for item in roster:
        line = str(item.get("line") or "").strip()
        if line and item.get("dir_code"):
            by_line.setdefault(line, []).append(item)

    out: list[str] = []
    for key in legacy:
        line, _, destination = key.partition(":")
        line = line.strip()
        candidates = by_line.get(line) or []
        match: dict[str, Any] | None = None
        if destination:
            wanted = destination.strip().casefold()
            match = next(
                (
                    c
                    for c in candidates
                    if str(c.get("destination") or "").strip().casefold() == wanted
                ),
                None,
            )
        if match is None and len(candidates) == 1:
            match = candidates[0]
        if match is None:
            _LOGGER.warning(
                "Dropping line filter %r on %s: no matching direction in the "
                "current timetable. Re-select the line in the integration "
                "options if you still want it filtered",
                key,
                entry_title,
            )
            continue
        new_key = f"{line}:{match['dir_code']}"
        if new_key not in out:
            out.append(new_key)
    return out
