"""Config-entry schema migration tests (v1 → v2).

v1 keyed the ``CONF_LINES`` filter on the destination *text*
(``"2:solarCity"``); v2 keys it on the stable EFA Hin/Rück code
(``"2:H"``). The remap needs the stop's line roster, so the migration
makes one DM request — which is also the thing most likely to fail in
the field, hence the retry-path coverage below.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.linz_linien_austria import _remap_line_keys
from custom_components.linz_linien_austria.api import EfaTimeoutError, _parse_dm
from custom_components.linz_linien_austria.const import (
    CONF_LINES,
    CONF_LINES_LEGACY,
    CONF_STOP_ID,
    CONF_STOP_NAME,
    DOMAIN,
)

from .conftest import BASE_ENTRY_DATA, EXAMPLE_DM_RESPONSE

ROSTER = _parse_dm(EXAMPLE_DM_RESPONSE)["served_lines"]


def _v1_entry(
    *, data_lines: list[str] | None = None, option_lines: list[str] | None = None
) -> MockConfigEntry:
    """Build a pre-migration (schema v1) entry."""
    data: dict[str, object] = {**BASE_ENTRY_DATA}
    if data_lines is not None:
        data[CONF_LINES] = data_lines
    return MockConfigEntry(
        domain=DOMAIN,
        data=data,
        options={CONF_LINES: option_lines} if option_lines is not None else {},
        title=str(BASE_ENTRY_DATA[CONF_STOP_NAME]),
        unique_id=f"stop_{BASE_ENTRY_DATA[CONF_STOP_ID]}",
        version=1,
        minor_version=1,
    )


# ---------------------------------------------------------------------
# The remap helper — pure function, no HA involvement
# ---------------------------------------------------------------------


def test_remap_matches_on_destination_text() -> None:
    """A v1 key whose destination still matches maps to that direction."""
    assert _remap_line_keys(["2:solarCity"], ROSTER, "Hbf") == ["2:H"]
    assert _remap_line_keys(["2:Universität"], ROSTER, "Hbf") == ["2:R"]


def test_remap_is_case_insensitive() -> None:
    """Stored casing drifts over timetable revisions; matching must not care."""
    assert _remap_line_keys(["2:SOLARCITY"], ROSTER, "Hbf") == ["2:H"]


def test_remap_falls_back_for_single_direction_line() -> None:
    """A line running one direction here is unambiguous even on a text miss.

    This is the branching-terminus case the whole change exists for: the
    stored headsign is exactly what drifted, so a mismatch must not cost
    the user their filter when there is only one direction to pick.
    """
    assert _remap_line_keys(["3:SomeOldHeadsign"], ROSTER, "Hbf") == ["3:H"]


def test_remap_drops_unmatchable_ambiguous_key() -> None:
    """A bad headsign on a two-direction line is dropped, not guessed.

    Guessing would silently filter the user's departures to the wrong
    direction. Dropping widens the filter, which is visible and fixable
    in the options flow.
    """
    assert _remap_line_keys(["2:NoSuchPlace"], ROSTER, "Hbf") == []


def test_remap_drops_key_for_unknown_line() -> None:
    """A line no longer serving the stop has no direction to map onto."""
    assert _remap_line_keys(["99:Anywhere"], ROSTER, "Hbf") == []


def test_remap_dedupes_collapsing_keys() -> None:
    """Two v1 keys can collapse onto one v2 key; the result stays unique."""
    assert _remap_line_keys(["3:Auwiesen", "3:StaleName"], ROSTER, "Hbf") == ["3:H"]


# ---------------------------------------------------------------------
# End-to-end migration through the config-entries machinery
# ---------------------------------------------------------------------


async def test_migration_rewrites_data_and_option_keys(
    hass: HomeAssistant,
) -> None:
    """Both entry.data and entry.options carry filters; both get rewritten."""
    entry = _v1_entry(data_lines=["2:solarCity"], option_lines=["3:Auwiesen"])
    entry.add_to_hass(hass)

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ), patch(
        "custom_components.linz_linien_austria.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    assert entry.state is ConfigEntryState.LOADED
    assert entry.version == 2
    assert entry.data[CONF_LINES] == ["2:H"]
    assert entry.options[CONF_LINES] == ["3:H"]


async def test_migration_skips_fetch_when_no_filter_stored(
    hass: HomeAssistant,
) -> None:
    """An entry with no line filter must not spend a request to migrate.

    Most entries are in this state, so the common upgrade path should be
    free — and must not fail when the upstream is down.
    """
    entry = _v1_entry()
    entry.add_to_hass(hass)

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ), patch(
        "custom_components.linz_linien_austria.fetch_departures",
        new_callable=AsyncMock,
        side_effect=AssertionError("migration must not fetch without a filter"),
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    assert entry.version == 2


async def test_migration_survives_upstream_failure(
    hass: HomeAssistant,
) -> None:
    """An outage at upgrade time must not brick the entry.

    HA wraps async_migrate_entry in `except Exception: return False`, and
    False is terminal (MIGRATION_ERROR — user has to delete and re-add).
    There is no retry path, so a failed roster fetch must park the keys
    and let the entry reach v2 rather than raise.
    """
    entry = _v1_entry(data_lines=["2:solarCity"])
    entry.add_to_hass(hass)

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaTimeoutError("upstream down"),
    ), patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    assert entry.state is not ConfigEntryState.MIGRATION_ERROR
    assert entry.version == 2


async def test_deferred_remap_completes_on_first_poll(
    hass: HomeAssistant,
) -> None:
    """Keys parked by a failed migration are healed once the roster arrives."""
    entry = _v1_entry(data_lines=["2:solarCity"])
    entry.add_to_hass(hass)

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaTimeoutError("upstream down"),
    ), patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    # The coordinator's first successful poll had the roster in hand.
    assert entry.data[CONF_LINES] == ["2:H"]
    assert CONF_LINES_LEGACY not in entry.data


async def test_parked_keys_do_not_filter_everything_away(
    hass: HomeAssistant,
) -> None:
    """Between a failed migration and the healing poll, nothing is hidden.

    A v1 key matches no v2 departure, so leaving it live would blank the
    stop. The migration clears the live filter and parks the originals.
    """
    entry = _v1_entry(data_lines=["2:solarCity"])
    entry.add_to_hass(hass)

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.fetch_departures",
        new_callable=AsyncMock,
        side_effect=EfaTimeoutError("upstream down"),
    ), patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    coordinator = entry.runtime_data
    assert coordinator.data is not None
    assert coordinator.data["departures_count"] > 0


async def test_migration_removes_legacy_store(hass: HomeAssistant) -> None:
    """The orphaned lines_at_stop Store file is deleted on migration."""
    entry = _v1_entry()
    entry.add_to_hass(hass)

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ), patch(
        "custom_components.linz_linien_austria.Store.async_remove",
        new_callable=AsyncMock,
    ) as store_remove:
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    store_remove.assert_awaited_once()


async def test_migration_is_idempotent_on_current_version(
    hass: HomeAssistant,
) -> None:
    """A v2 entry passes straight through without a fetch."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        data={**BASE_ENTRY_DATA, CONF_LINES: ["2:H"]},
        options={},
        title=str(BASE_ENTRY_DATA[CONF_STOP_NAME]),
        unique_id=f"stop_{BASE_ENTRY_DATA[CONF_STOP_ID]}",
        version=2,
        minor_version=1,
    )
    entry.add_to_hass(hass)

    parsed = _parse_dm(EXAMPLE_DM_RESPONSE)
    with patch(
        "custom_components.linz_linien_austria.coordinator.fetch_departures",
        new_callable=AsyncMock,
        return_value=parsed,
    ), patch(
        "custom_components.linz_linien_austria.fetch_departures",
        new_callable=AsyncMock,
        side_effect=AssertionError("a v2 entry must not re-migrate"),
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()

    assert entry.data[CONF_LINES] == ["2:H"]


async def test_migration_refuses_downgrade_from_future_version(
    hass: HomeAssistant,
) -> None:
    """An entry written by a newer release must not be silently downgraded."""
    entry = MockConfigEntry(
        domain=DOMAIN,
        data=dict(BASE_ENTRY_DATA),
        options={},
        title=str(BASE_ENTRY_DATA[CONF_STOP_NAME]),
        unique_id=f"stop_{BASE_ENTRY_DATA[CONF_STOP_ID]}",
        version=3,
        minor_version=1,
    )
    entry.add_to_hass(hass)

    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    assert entry.state is ConfigEntryState.MIGRATION_ERROR
