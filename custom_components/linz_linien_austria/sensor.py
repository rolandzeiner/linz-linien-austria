"""Sensor platform for Linz Linien Austria.

Each config entry produces:

* one ``next_departure`` sensor whose state is the countdown (in minutes)
  to the next departure from the configured stop, with the full departure
  list surfaced via ``extra_state_attributes`` for the card/templates.
"""
from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import ATTRIBUTION, DOMAIN
from .coordinator import LinzLinienAustriaConfigEntry, LinzLinienAustriaCoordinator

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: LinzLinienAustriaConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up sensor entities from a config entry."""
    coordinator = entry.runtime_data
    async_add_entities([NextDepartureSensor(coordinator, entry)])


class NextDepartureSensor(
    CoordinatorEntity[LinzLinienAustriaCoordinator], SensorEntity
):
    """Countdown to the next departure from the configured stop."""

    _attr_has_entity_name = True
    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = "min"
    # Deliberately no state_class: countdown-to-next-departure is a
    # sawtooth that resets every time a vehicle departs — the hourly
    # LTS mean/min/max carries no analytical signal. Dropping
    # state_class stops new long-term statistics; existing orphan
    # buckets clear via Settings → System → Statistics.
    _attr_attribution = ATTRIBUTION

    # Excluded from the recorder: combined size at busy stops trips the
    # 16 KB attribute cap. Frontend still receives them in real time —
    # only history is skipped, mirroring weather.forecast. The two ISO
    # timestamps change every poll, so recording them adds a fresh row
    # per tick for no analytical value; next_delay_minutes +
    # next_is_realtime stay recorded so the punctuality trend survives.
    _unrecorded_attributes = frozenset(
        {
            "departures",
            "alerts",
            "next_scheduled",
            "next_realtime",
            # Static-ish: only mutates when a previously-unseen line shows
            # up at this stop (typically once on first install, rarely
            # again). Keeping it out of the recorder avoids logging the
            # same list every poll.
            "lines_at_stop",
        }
    )

    def __init__(
        self,
        coordinator: LinzLinienAustriaCoordinator,
        entry: LinzLinienAustriaConfigEntry,
    ) -> None:
        """Initialise the sensor."""
        super().__init__(coordinator)
        self._entry = entry
        # KEEP THIS FORMAT STABLE — changes wipe existing registry rows.
        self._attr_unique_id = f"{entry.entry_id}_next_departure"
        self._attr_translation_key = "next_departure"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            manufacturer="LINZ AG LINIEN",
            model="EFA Echtzeit",
            configuration_url="https://www.linzag.at/portal/de/privatkunden/unterwegs/linzmobil/",
        )

    @property
    def native_value(self) -> int | None:
        """Return the realtime-aware countdown of the first departure."""
        first = self._first_departure()
        if first is None:
            return None
        # Prefer the realtime-corrected countdown; fall back to scheduled.
        if "countdown_rt" in first:
            return int(first["countdown_rt"])
        if "countdown" in first:
            return int(first["countdown"])
        return None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the full departure list and resolved-stop metadata.

        Consumed by the Lovelace card and by user templates. Schema:

        - ``departures``: list of normalised departures (see api.py).
        - ``departures_count``: int.
        - ``stop_id`` / ``stop_name``: the configured stop.
        - ``resolved_stop``: the stop metadata as returned by EFA on the
          last successful refresh (may differ in casing/place suffix).
        - Convenience top-level fields for template ergonomics:
          ``next_line``, ``next_direction``, ``next_mot``,
          ``next_delay_minutes``, ``next_is_realtime``,
          ``next_is_cancelled``, ``next_scheduled``, ``next_realtime``.
        """
        data = self.coordinator.data or {}
        first = self._first_departure()
        attrs: dict[str, Any] = {
            "stop_id": data.get("stop_id"),
            "stop_name": data.get("stop_name"),
            "resolved_stop": data.get("resolved_stop") or {},
            "departures": data.get("departures") or [],
            "departures_count": data.get("departures_count", 0),
            # Service-disruption notices that affect at least one of the
            # lines serving this stop (or any system-wide notices). The
            # card surfaces them as a banner; templates/automations can
            # filter on `info_id` / `priority` / `affected_lines`.
            "alerts": data.get("alerts") or [],
            "alerts_count": data.get("alerts_count", 0),
            # Persistent union of every line label ever observed here.
            # The card editor's line-filter picker reads this so users
            # can opt into rush-hour / seasonal lines that don't have a
            # departure inside the current live window.
            "lines_at_stop": data.get("lines_at_stop") or [],
        }
        if first is not None:
            attrs["next_line"] = first.get("line")
            attrs["next_direction"] = first.get("direction")
            attrs["next_mot"] = first.get("mot_name")
            # Departures are sorted active-first, cancelled last
            # (api.py::_departure_sort_key), so the first row is only
            # cancelled when *every* upcoming departure is. Surface a
            # plain bool so templates/automations don't treat the
            # countdown as a catchable trip.
            attrs["next_is_cancelled"] = bool(first.get("is_cancelled"))
            if "delay_minutes" in first:
                attrs["next_delay_minutes"] = first["delay_minutes"]
            if "is_realtime" in first:
                attrs["next_is_realtime"] = first["is_realtime"]
            if "scheduled" in first:
                attrs["next_scheduled"] = first["scheduled"]
            if "realtime" in first:
                attrs["next_realtime"] = first["realtime"]
        return attrs

    def _first_departure(self) -> dict[str, Any] | None:
        """Return the first upcoming departure (None if list empty)."""
        data = self.coordinator.data or {}
        departures = data.get("departures") or []
        if not departures:
            return None
        first = departures[0]
        return first if isinstance(first, dict) else None
