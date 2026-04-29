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

from .alerts import get_alerts_for_lines
from .api import (
    EfaApiError,
    EfaHttpError,
    EfaPayloadError,
    EfaTimeoutError,
    fetch_departures,
)
from .rate_limit import async_enforce_domain_cooldown
from .const import (
    BACKOFF_CAP_SECONDS,
    CONF_LIMIT,
    CONF_LINES,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DEFAULT_LIMIT,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    MAX_DEPARTURES_IN_ATTRS,
    MIN_POLL_SECONDS,
)

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
        self._session = async_get_clientsession(hass)

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
            # Absorb request storms (options-flow save, manual reload,
            # dashboard edit-mode flip) so the EFA endpoint isn't hit
            # 3-4× in quick succession. Cooldown matches the existing
            # DOMAIN_COOLDOWN_SECONDS fair-use floor — first call goes
            # through, subsequent calls within the window piggy-back.
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
    # Backoff bookkeeping
    # ------------------------------------------------------------------

    def _note_success(self) -> None:
        """Reset the failure counter and restore the normal cadence."""
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
        try:
            payload = await fetch_departures(
                self._session, self._stop_id, limit=upstream_limit
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
        served_lines = {
            str(d.get("line") or "")
            for d in departures
            if d.get("line")
        }
        alerts = get_alerts_for_lines(self.hass, served_lines)

        return {
            "stop_id": self._stop_id,
            "stop_name": self._stop_name,
            "resolved_stop": payload.get("stop") or {},
            "departures": departures,
            "departures_count": len(departures),
            "alerts": alerts,
            "alerts_count": len(alerts),
        }


def _line_dir_key(dep: dict[str, Any]) -> str:
    """Build the canonical key used in CONF_LINES filter entries."""
    return f"{dep.get('line', '')}:{dep.get('direction', '')}"
