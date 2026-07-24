"""DataUpdateCoordinator for Linz Linien Austria."""
from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.debounce import Debouncer
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .alerts import get_alerts_for_lines, served_lines_from_data
from .api import (
    EfaApiError,
    EfaHttpError,
    EfaPayloadError,
    EfaTimeoutError,
    fetch_departures,
)
from .const import (
    BACKOFF_CAP_SECONDS,
    CONF_LIMIT,
    CONF_LINES,
    CONF_LINES_LEGACY,
    CONF_SHOW_STOP_SEQUENCE,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DEFAULT_LIMIT,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    MAX_DEPARTURES_IN_ATTRS,
    MIN_POLL_SECONDS,
    SEQUENCE_UPSTREAM_LIMIT,
)
from .rate_limit import async_enforce_domain_cooldown

_LOGGER = logging.getLogger(__name__)

# Typed ConfigEntry alias for runtime-data. Required by the Platinum
# strict-typing rule when runtime-data is also satisfied.
type LinzLinienAustriaConfigEntry = ConfigEntry["LinzLinienAustriaCoordinator"]


class LinzLinienAustriaCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Poll the LINZ AG LINIEN EFA Departure Monitor for one stop."""

    config_entry: LinzLinienAustriaConfigEntry

    def __init__(
        self, hass: HomeAssistant, entry: LinzLinienAustriaConfigEntry
    ) -> None:
        """Initialise the coordinator."""
        config = {**entry.data, **entry.options}
        self._entry = entry
        self._stop_id: str = str(config[CONF_STOP_ID])
        self._stop_name: str = str(config.get(CONF_STOP_NAME, entry.title))
        self._limit: int = int(config.get(CONF_LIMIT, DEFAULT_LIMIT))
        # Optional line filter — a list of "<line>:<direction>" strings.
        # Empty/missing means "no filter, surface every departure".
        lines_raw = config.get(CONF_LINES) or []
        self._lines_filter: set[str] = {str(x) for x in lines_raw if x}
        self._show_stop_sequence: bool = bool(
            config.get(CONF_SHOW_STOP_SEQUENCE, False)
        )
        self._session = async_get_clientsession(hass)

        # Resolved stop position (WGS84), plucked from the DM response on
        # every refresh. None until the first successful fetch.
        self._latitude: float | None = None
        self._longitude: float | None = None

        self._rate_limited: bool = False
        self._unsub: list[Callable[[], None]] = []

        # Exponential-backoff bookkeeping for sustained API outages.
        # ``self._normal_interval`` is the immutable user-configured
        # cadence; ``self.update_interval`` is what HA actually polls
        # at. After a failure the latter doubles per consecutive miss
        # up to BACKOFF_CAP_SECONDS, restored to ``_normal_interval``
        # on the first success.
        self._consecutive_failures = 0
        scan_seconds = max(
            MIN_POLL_SECONDS,
            int(config.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)),
        )
        self._normal_interval = timedelta(seconds=scan_seconds)
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=DOMAIN,
            update_interval=self._normal_interval,
            # Absorb request-refresh storms (options-flow save, manual
            # reload, dashboard edit-mode flip). 15 s matches the
            # domain-wide cooldown floor.
            request_refresh_debouncer=Debouncer(
                hass,
                _LOGGER,
                cooldown=15,
                immediate=False,
            ),
        )

    @callback
    def async_teardown(self) -> None:
        """Cancel all listeners on unload."""
        for unsub in self._unsub:
            unsub()
        self._unsub.clear()

    # ------------------------------------------------------------------
    # Properties surfaced to the sensor platform and diagnostics
    # ------------------------------------------------------------------

    @property
    def latitude(self) -> float | None:
        """Stop latitude from the resolved DM stop (None before first fetch)."""
        return self._latitude

    @property
    def longitude(self) -> float | None:
        """Stop longitude from the resolved DM stop (None before first fetch)."""
        return self._longitude

    # ------------------------------------------------------------------
    # Backoff bookkeeping
    # ------------------------------------------------------------------

    def _note_success(self) -> None:
        """Reset the failure counter and restore the normal cadence.

        This is an outage detector, not a flap detector — a single
        successful refresh fully clears the state. A flapping endpoint
        that alternates success/failure intentionally never accumulates
        backoff: we only want to slow down on sustained outages, not
        on transient hiccups that the user-configured cadence can
        already absorb.
        """
        if self._consecutive_failures == 0:
            return
        self._consecutive_failures = 0
        if self.update_interval != self._normal_interval:
            _LOGGER.info(
                "Recovered from outage; restoring normal poll cadence"
            )
            self.update_interval = self._normal_interval

    def _note_failure(self) -> None:
        """Bump the failure counter and apply exponential backoff.

        First failure stays at the user-configured cadence (transient
        hiccups shouldn't slow down the loop). From the second failure
        onwards, the update interval doubles each time, capped at
        BACKOFF_CAP_SECONDS so a sustained outage settles into a slow
        poll instead of hammering the upstream.
        """
        self._consecutive_failures += 1
        if self._consecutive_failures < 2:
            return
        normal_secs = self._normal_interval.total_seconds()
        backoff_secs = min(
            normal_secs * (2 ** (self._consecutive_failures - 1)),
            BACKOFF_CAP_SECONDS,
        )
        new_interval = timedelta(seconds=backoff_secs)
        if self.update_interval != new_interval:
            _LOGGER.info(
                "%d consecutive failures; backing off to %ds poll cadence",
                self._consecutive_failures,
                int(backoff_secs),
            )
            self.update_interval = new_interval

    # ------------------------------------------------------------------
    # Deferred v1 → v2 line-filter migration
    # ------------------------------------------------------------------

    def _heal_legacy_line_filter(self, roster: list[dict[str, Any]]) -> None:
        """Remap parked v1 line keys now that the roster is available.

        Only reached when `async_migrate_entry` couldn't fetch the roster
        at upgrade time. Rewrites both `data` and `options`, drops the
        holding key, and refreshes this coordinator's in-memory filter so
        the current tick already honours it — updating the entry triggers
        a reload, but the reload races the rest of this parse.
        """
        # Imported here rather than at module scope: __init__ imports the
        # coordinator, so a top-level import would be circular.
        from . import _remap_line_keys

        data = {**self._entry.data}
        options = {**self._entry.options}
        healed: list[str] = []
        for container in (data, options):
            legacy = [str(x) for x in (container.pop(CONF_LINES_LEGACY, None) or []) if x]
            if not legacy:
                continue
            remapped = _remap_line_keys(legacy, roster, self._entry.title)
            container[CONF_LINES] = remapped
            healed.extend(remapped)

        self._lines_filter = set(healed)
        _LOGGER.info(
            "Remapped the line filter on %s to the new direction-code format",
            self._entry.title,
        )
        self.hass.config_entries.async_update_entry(
            self._entry, data=data, options=options
        )

    # ------------------------------------------------------------------
    # Repair issues
    # ------------------------------------------------------------------

    def _raise_rate_limit_issue(self) -> None:
        if self._rate_limited:
            return
        self._rate_limited = True
        ir.async_create_issue(
            self.hass,
            DOMAIN,
            f"rate_limited_{self._entry.entry_id}",
            is_fixable=False,
            severity=ir.IssueSeverity.WARNING,
            translation_key="rate_limited",
            translation_placeholders={"entry_title": self._entry.title},
        )

    def _clear_rate_limit_issue(self) -> None:
        if not self._rate_limited:
            return
        self._rate_limited = False
        ir.async_delete_issue(
            self.hass, DOMAIN, f"rate_limited_{self._entry.entry_id}"
        )

    # ------------------------------------------------------------------
    # Core data fetch
    # ------------------------------------------------------------------

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch fresh departures with backoff + cooldown wrappers.

        Two layers around the actual fetch:

        1. ``async_enforce_domain_cooldown`` — lock-serialised 15 s
           floor across every entry + the alerts refresh. Concurrent
           callers queue inside the lock; the first one fires
           immediately, subsequent callers wait their slice.
        2. ``_note_success`` / ``_note_failure`` — exponential-backoff
           bookkeeping. The user-configured cadence is preserved as
           ``self._normal_interval``; ``self.update_interval`` widens
           on consecutive failures and snaps back on first success.
        """
        try:
            data = await self._fetch_departures()
        except UpdateFailed:
            self._note_failure()
            raise
        self._note_success()
        return data

    async def _fetch_departures(self) -> dict[str, Any]:
        """Inner fetch — separated so the backoff wrapper stays clean."""
        await async_enforce_domain_cooldown(self.hass)

        # Pad the upstream limit a bit beyond the user's configured
        # display count so the realtime sort has headroom. Without the
        # padding, the upstream's scheduled-order tail can hide a row
        # whose realtime would have ranked above the cap. EFA accepts
        # 100+ readily; we cap at MAX_DEPARTURES_IN_ATTRS + 15 so the
        # recorder cap stays the binding constraint and there's still
        # room for entries that get dropped by `_normalise_departure`.
        upstream_limit = min(
            MAX_DEPARTURES_IN_ATTRS + 15,
            max(self._limit + 5, self._limit * 2),
        )
        if self._show_stop_sequence:
            # Each row now drags its whole trip's stop list along, so the
            # padding above would triple an already-tripled response. Trade
            # depth of list for depth of detail — the user asked for the
            # latter by enabling the option, and the option's own help text
            # says the list gets shorter.
            upstream_limit = min(upstream_limit, SEQUENCE_UPSTREAM_LIMIT)
        try:
            payload = await fetch_departures(
                self._session,
                self._stop_id,
                limit=upstream_limit,
                include_stop_sequence=self._show_stop_sequence,
            )
        except EfaTimeoutError as err:
            raise UpdateFailed(
                translation_domain=DOMAIN,
                translation_key="api_timeout",
                translation_placeholders={"seconds": "30"},
            ) from err
        except EfaHttpError as err:
            if err.status == 429:
                self._raise_rate_limit_issue()
                raise UpdateFailed(
                    translation_domain=DOMAIN,
                    translation_key="api_rate_limited",
                ) from err
            raise UpdateFailed(
                translation_domain=DOMAIN,
                translation_key="api_http_error",
                translation_placeholders={
                    "status": str(err.status),
                    "reason": err.reason,
                },
            ) from err
        except EfaPayloadError as err:
            raise UpdateFailed(
                translation_domain=DOMAIN,
                translation_key="api_invalid_response",
                translation_placeholders={"error": str(err)},
            ) from err
        except EfaApiError as err:
            raise UpdateFailed(
                translation_domain=DOMAIN,
                translation_key="api_connection_error",
                translation_placeholders={
                    "error_type": type(err).__name__,
                    "error": str(err),
                },
            ) from err

        # Successful refresh — clear any rate-limit banner.
        self._clear_rate_limit_issue()

        resolved_stop = payload.get("stop") or {}
        latitude = resolved_stop.get("latitude")
        longitude = resolved_stop.get("longitude")
        if isinstance(latitude, float) and isinstance(longitude, float):
            self._latitude = latitude
            self._longitude = longitude

        # The stop's full line roster, straight from the timetable — see
        # api.py::_parse_serving_lines. Complete on the first fetch, so
        # unlike the label-accumulation it replaced it needs no
        # persistence and is never stale after a reconfigure. Read from
        # the FULL payload, before the user's line filter narrows it:
        # the card editor's picker has to offer lines the user has
        # currently filtered *out*, or deselecting one would be a
        # one-way door.
        served_lines = payload.get("served_lines") or []
        # `served_lines` arrives natural-sorted ("2" before "12") and
        # carries one entry per direction; dict.fromkeys collapses the
        # H/R pair back to one label while keeping that order, so no
        # second sort key is needed here.
        lines_at_stop = list(
            dict.fromkeys(
                label
                for item in served_lines
                if (label := str(item.get("line") or "").strip())
            )
        )
        # Fall back to the observed labels only when the upstream sent no
        # roster at all (empty `servingLines` block). Rare, but a stop
        # with departures and an empty picker is a worse failure than a
        # picker that undercounts.
        if not lines_at_stop:
            lines_at_stop = sorted(served_lines_from_data(payload, strip=True))

        # Finish a migration that couldn't reach the upstream at upgrade
        # time (see __init__.py::async_migrate_entry). Runs at most once
        # per entry; the roster it needs is in hand right now.
        if served_lines and _has_legacy_line_filter(self._entry):
            self._heal_legacy_line_filter(served_lines)

        # Apply the optional line filter (if the user picked specific
        # line+direction tuples, drop everything else).
        departures = payload.get("departures") or []
        if self._lines_filter:
            departures = [
                d for d in departures if _line_dir_key(d) in self._lines_filter
            ]
        # Cap only at MAX_DEPARTURES_IN_ATTRS (45) — the recorder hard
        # limit. We deliberately do NOT trim to ``self._limit`` here:
        # that's the *upstream fetch* size, not a display cap. Card-side
        # filters (lines, max_departures) need a deeper pool than the
        # display count to find enough matching rows. Bumping the
        # integration's `limit` raises the upstream fetch; rendering
        # is capped per-card via ``max_departures`` on the card config.
        departures = departures[:MAX_DEPARTURES_IN_ATTRS]

        # Slice the domain-wide alerts cache to alerts whose
        # `affected_lines` overlap any line currently serving this stop
        # (or system-wide alerts with no affected_lines list).
        visible_lines = served_lines_from_data({"departures": departures})
        alerts = get_alerts_for_lines(self.hass, visible_lines)

        return {
            "stop_id": self._stop_id,
            "stop_name": self._stop_name,
            "resolved_stop": resolved_stop,
            "departures": departures,
            "departures_count": len(departures),
            "alerts": alerts,
            "alerts_count": len(alerts),
            "lines_at_stop": lines_at_stop,
            # Per-direction roster behind `lines_at_stop`. The options
            # flow reads it to label the filter picker ("2 → solarCity"
            # rather than the opaque "2:H"); the card only needs the
            # plain labels above.
            "served_lines": served_lines,
        }


def _has_legacy_line_filter(entry: LinzLinienAustriaConfigEntry) -> bool:
    """True while an entry still carries un-remapped v1 line-filter keys."""
    return bool(
        entry.data.get(CONF_LINES_LEGACY) or entry.options.get(CONF_LINES_LEGACY)
    )


def _line_dir_key(dep: dict[str, Any]) -> str:
    """Build the canonical key used in CONF_LINES filter entries.

    Keyed on the stable Hin/Rück code, not the destination text — see
    api.py::_direction_code for why the text form was a bug. A departure
    with no resolvable code (replacement service) yields "<line>:", which
    matches nothing in a v2 filter and so is dropped when a filter is
    active; that is the safe direction to fail, since the alternative
    would be surfacing a row the user explicitly filtered away.
    """
    return f"{dep.get('line', '')}:{dep.get('dir_code', '')}"
