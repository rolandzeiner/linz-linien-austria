"""DataUpdateCoordinator for Linz Linien Austria."""
from __future__ import annotations

import logging
import time
from collections.abc import Callable
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import (
    EfaApiError,
    EfaHttpError,
    EfaPayloadError,
    EfaTimeoutError,
    fetch_departures,
)
from .const import (
    CONF_LIMIT,
    CONF_LINES,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DEFAULT_LIMIT,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    DOMAIN_COOLDOWN_SECONDS,
    DOMAIN_LAST_CALL_KEY,
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

        scan_seconds = max(
            MIN_POLL_SECONDS,
            int(config.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)),
        )
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=DOMAIN,
            update_interval=timedelta(seconds=scan_seconds),
        )

    async def _async_setup(self) -> None:
        """One-shot async setup, invoked by HA inside async_config_entry_first_refresh."""
        return None

    @callback
    def async_teardown(self) -> None:
        """Cancel all listeners on unload."""
        for unsub in self._unsub:
            unsub()
        self._unsub.clear()

    # ------------------------------------------------------------------
    # Domain-wide cooldown
    # ------------------------------------------------------------------

    def _domain_cooldown_remaining(self) -> float:
        """Return seconds remaining until the next refresh is allowed.

        Multiple config entries share the same upstream EFA. Without a
        domain-wide floor, two stops polling at 30s independently can
        end up firing simultaneous requests every cycle. The shared
        timestamp lives in ``hass.data[DOMAIN]`` and is written *before*
        the refresh begins so a slow request still consumes the budget.
        """
        domain_data = self.hass.data.setdefault(DOMAIN, {})
        last = float(domain_data.get(DOMAIN_LAST_CALL_KEY, 0.0))
        now = time.monotonic()
        elapsed = now - last
        return max(0.0, DOMAIN_COOLDOWN_SECONDS - elapsed)

    def _stamp_domain_cooldown(self) -> None:
        domain_data = self.hass.data.setdefault(DOMAIN, {})
        domain_data[DOMAIN_LAST_CALL_KEY] = time.monotonic()

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
        """Fetch fresh departures from the upstream EFA endpoint."""
        # Domain cooldown: if a sibling entry just polled, defer to it
        # rather than stacking a second request inside the floor.
        wait = self._domain_cooldown_remaining()
        if wait > 0 and self.data is not None:
            _LOGGER.debug(
                "Skipping refresh — domain cooldown %.1fs remaining; "
                "reusing previous data",
                wait,
            )
            return self.data

        # Stamp before the request — failed calls "use up" the budget
        # like successful ones, so retries don't break the floor.
        self._stamp_domain_cooldown()

        try:
            payload = await fetch_departures(
                self._session, self._stop_id, limit=self._limit
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
        # Cap at MAX_DEPARTURES_IN_ATTRS so the recorder doesn't choke on
        # a stop like Hauptbahnhof that returns 40+ departures in a
        # single fetch.
        departures = departures[:MAX_DEPARTURES_IN_ATTRS]

        return {
            "stop_id": self._stop_id,
            "stop_name": self._stop_name,
            "resolved_stop": payload.get("stop") or {},
            "departures": departures,
            "departures_count": len(departures),
        }


def _line_dir_key(dep: dict[str, Any]) -> str:
    """Build the canonical key used in CONF_LINES filter entries."""
    return f"{dep.get('line', '')}:{dep.get('direction', '')}"
