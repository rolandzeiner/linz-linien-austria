"""Config flow for Linz Linien Austria.

Two-step flow:
    1. ``user`` — type a search query, see candidate stops, pick one.
    2. ``stop`` — review the resolved stop, set scan interval / limit.

The flow performs a real STOPFINDER + DM probe before saving so the
``test-before-configure`` Quality-Scale rule is satisfied.
"""
from __future__ import annotations

import logging
from collections.abc import Mapping
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.const import CONF_SCAN_INTERVAL
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
)

from .api import (
    EfaApiError,
    fetch_departures,
    search_stops,
)
from .const import (
    CONF_LIMIT,
    CONF_LINES,
    CONF_SEARCH_QUERY,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DEFAULT_LIMIT,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    MAX_POLL_SECONDS,
    MIN_POLL_SECONDS,
)

_LOGGER = logging.getLogger(__name__)


def _settings_schema(
    defaults: Mapping[str, Any],
    *,
    extra: Mapping[Any, Any] | None = None,
) -> vol.Schema:
    """Build the shared scan-interval / departure-limit schema.

    The config-flow's ``settings`` and ``reconfigure`` steps consume the
    base shape; the options flow passes ``extra`` to splice in its
    line-filter selector without re-declaring the two number selectors.
    """
    fields: dict[Any, Any] = {
        vol.Required(
            CONF_SCAN_INTERVAL,
            default=defaults.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL),
        ): NumberSelector(
            NumberSelectorConfig(
                min=MIN_POLL_SECONDS,
                max=MAX_POLL_SECONDS,
                step=5,
                unit_of_measurement="s",
                mode=NumberSelectorMode.BOX,
            )
        ),
        vol.Required(
            CONF_LIMIT,
            default=defaults.get(CONF_LIMIT, DEFAULT_LIMIT),
        ): NumberSelector(
            NumberSelectorConfig(
                min=1,
                max=30,
                step=1,
                mode=NumberSelectorMode.BOX,
            )
        ),
    }
    if extra:
        fields.update(extra)
    return vol.Schema(fields)


class LinzLinienAustriaConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Linz Linien Austria."""

    # Bump VERSION + add async_migrate_entry when entry.data shape changes
    # in a non-additive way (renames, removals, type changes). MINOR_VERSION
    # bumps for additive changes that older HA versions can still load.
    # Tracks the config-entry schema, NOT the integration release version.
    VERSION = 1
    MINOR_VERSION = 1

    def __init__(self) -> None:
        """Initialise transient state held across the multi-step flow."""
        self._search_query: str = ""
        self._candidates: list[dict[str, Any]] = []
        self._selected_stop: dict[str, Any] | None = None

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: ConfigEntry,
    ) -> LinzLinienAustriaOptionsFlow:
        """Return the options flow handler."""
        return LinzLinienAustriaOptionsFlow()

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Step 1 — type a search query, see suggested stops."""
        errors: dict[str, str] = {}
        if user_input is not None:
            query = str(user_input.get(CONF_SEARCH_QUERY, "")).strip()
            if len(query) < 2:
                errors[CONF_SEARCH_QUERY] = "search_too_short"
            else:
                session = async_get_clientsession(self.hass)
                try:
                    candidates = await search_stops(session, query, limit=10)
                except EfaApiError as err:
                    _LOGGER.warning("Stop search failed: %s", err)
                    errors["base"] = "cannot_connect"
                else:
                    if not candidates:
                        errors[CONF_SEARCH_QUERY] = "no_results"
                    else:
                        self._search_query = query
                        self._candidates = candidates
                        return await self.async_step_pick()

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {vol.Required(CONF_SEARCH_QUERY): TextSelector()}
            ),
            errors=errors,
            description_placeholders={"example": "Hauptbahnhof"},
        )

    async def async_step_pick(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Step 2 — select one of the matched stops."""
        errors: dict[str, str] = {}
        if user_input is not None:
            stop_id = str(user_input.get(CONF_STOP_ID, ""))
            self._selected_stop = next(
                (c for c in self._candidates if c["stop_id"] == stop_id), None
            )
            if self._selected_stop is None:
                errors["base"] = "no_results"
            else:
                # Test-before-configure: probe the DM endpoint to make
                # sure the stop actually answers — a stale stop ID from a
                # bookmark would otherwise create a permanently-broken
                # entry.
                session = async_get_clientsession(self.hass)
                try:
                    await fetch_departures(
                        session, self._selected_stop["stop_id"], limit=1
                    )
                except EfaApiError as err:
                    _LOGGER.warning("DM probe failed: %s", err)
                    errors["base"] = "cannot_connect"
                else:
                    await self.async_set_unique_id(
                        f"stop_{self._selected_stop['stop_id']}"
                    )
                    self._abort_if_unique_id_configured()
                    return await self.async_step_settings()

        options = [
            SelectOptionDict(
                value=c["stop_id"],
                label=_format_candidate_label(c),
            )
            for c in self._candidates
        ]
        return self.async_show_form(
            step_id="pick",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_STOP_ID): SelectSelector(
                        SelectSelectorConfig(
                            options=options,
                            mode=SelectSelectorMode.DROPDOWN,
                        )
                    )
                }
            ),
            errors=errors,
            description_placeholders={"query": self._search_query},
        )

    async def async_step_settings(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Step 3 — configure scan interval and departure limit."""
        assert self._selected_stop is not None  # guarded by step_pick
        if user_input is not None:
            stop = self._selected_stop
            data = {
                CONF_STOP_ID: stop["stop_id"],
                CONF_STOP_NAME: stop["name"],
                CONF_SCAN_INTERVAL: int(user_input[CONF_SCAN_INTERVAL]),
                CONF_LIMIT: int(user_input[CONF_LIMIT]),
            }
            return self.async_create_entry(title=stop["name"], data=data)

        return self.async_show_form(
            step_id="settings",
            data_schema=_settings_schema({}),
            description_placeholders={"stop_name": self._selected_stop["name"]},
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Reconfigure scan interval and limit on an existing entry.

        We deliberately do NOT allow changing the stop here — that would
        require recomputing the unique_id and re-creating entities. Users
        who want a different stop should add a new config entry.
        """
        entry = self._get_reconfigure_entry()
        if user_input is not None:
            new_data = {
                **entry.data,
                CONF_SCAN_INTERVAL: int(user_input[CONF_SCAN_INTERVAL]),
                CONF_LIMIT: int(user_input[CONF_LIMIT]),
            }
            return self.async_update_reload_and_abort(entry, data=new_data)

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_settings_schema(entry.data),
        )


def _format_candidate_label(candidate: dict[str, Any]) -> str:
    """Build the dropdown label for one search hit."""
    name = candidate.get("name") or "—"
    place = candidate.get("place") or ""
    if place and place not in name:
        return f"{name} ({place})"
    return str(name)


class LinzLinienAustriaOptionsFlow(OptionsFlow):
    """Options flow — adjust scan interval, limit, line filter."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show / save options for an existing entry."""
        config = {**self.config_entry.data, **self.config_entry.options}
        existing_lines = sorted(_known_lines_from_runtime(self.config_entry))

        if user_input is not None:
            return self.async_create_entry(
                data={
                    CONF_SCAN_INTERVAL: int(user_input[CONF_SCAN_INTERVAL]),
                    CONF_LIMIT: int(user_input[CONF_LIMIT]),
                    CONF_LINES: list(user_input.get(CONF_LINES) or []),
                }
            )

        lines_field = {
            vol.Optional(
                CONF_LINES,
                default=config.get(CONF_LINES) or [],
            ): SelectSelector(
                SelectSelectorConfig(
                    options=[
                        SelectOptionDict(value=line_dir, label=line_dir)
                        for line_dir in existing_lines
                    ],
                    multiple=True,
                    custom_value=True,
                    mode=SelectSelectorMode.DROPDOWN,
                )
            ),
        }
        return self.async_show_form(
            step_id="init",
            data_schema=_settings_schema(config, extra=lines_field),
        )


def _known_lines_from_runtime(entry: ConfigEntry) -> set[str]:
    """Pull the set of "<line>:<direction>" pairs from the live coordinator.

    Best-effort: if the coordinator hasn't fetched yet (e.g. the entry is
    paused) the user gets an empty list and can still type custom values
    via SelectSelector(custom_value=True).
    """
    coordinator = getattr(entry, "runtime_data", None)
    if coordinator is None or coordinator.data is None:
        return set()
    out: set[str] = set()
    for dep in coordinator.data.get("departures") or []:
        line = dep.get("line", "")
        direction = dep.get("direction", "")
        if line:
            out.add(f"{line}:{direction}")
    return out
