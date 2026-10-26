"""Tests for the domain-wide upstream-outage Repairs issue (outage.py)."""

from __future__ import annotations

from contextlib import suppress
from datetime import timedelta
from typing import Any
from unittest.mock import patch

import aiohttp
import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.update_coordinator import UpdateFailed
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import (
    AiohttpClientMocker,
)

from custom_components.linz_linien_austria.api import (
    EfaApiError,
    EfaHttpError,
    EfaPayloadError,
    EfaTimeoutError,
)
from custom_components.linz_linien_austria.const import (
    API_BASE_URL,
    DM_ENDPOINT,
    DOMAIN,
)
from custom_components.linz_linien_austria.coordinator import (
    LinzLinienAustriaCoordinator,
)
from custom_components.linz_linien_austria.outage import (
    OUTAGE_DATA,
    OUTAGE_ISSUE_ID,
    OUTAGE_MIN_SECONDS,
    Fault,
    async_clear_outage,
    async_note_fault,
    classify,
)

from .conftest import BASE_ENTRY_DATA, EXAMPLE_DM_RESPONSE

DM_URL = f"{API_BASE_URL}{DM_ENDPOINT}"
_PAST_THRESHOLD = timedelta(seconds=OUTAGE_MIN_SECONDS + 1)


def _make_entry() -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data=dict(BASE_ENTRY_DATA),
        options={},
        title="Linz/Donau, Hauptbahnhof",
        unique_id="stop_60501720",
    )


def _coordinator(hass: HomeAssistant) -> LinzLinienAustriaCoordinator:
    entry = _make_entry()
    entry.add_to_hass(hass)
    return LinzLinienAustriaCoordinator(hass, entry)


async def _fetch(
    coordinator: LinzLinienAustriaCoordinator,
    aioclient_mock: AiohttpClientMocker,
    **response: Any,
) -> None:
    """One real DM request through the coordinator, answering with `response`."""
    aioclient_mock.clear_requests()
    aioclient_mock.get(DM_URL, **response)
    with suppress(UpdateFailed):
        await coordinator._async_update_data()


def _issue(hass: HomeAssistant) -> ir.IssueEntry | None:
    return ir.async_get(hass).async_get_issue(DOMAIN, OUTAGE_ISSUE_ID)


@pytest.mark.parametrize(
    ("err", "expected"),
    [
        (EfaHttpError(502, "Bad Gateway"), Fault.OUTAGE),
        (EfaHttpError(500, ""), Fault.OUTAGE),
        (EfaHttpError(503, "Service Unavailable"), Fault.OUTAGE),
        (EfaPayloadError("invalid json"), Fault.OUTAGE),
        (EfaHttpError(404, "Not Found"), Fault.ANSWERED),
        (EfaHttpError(429, "Too Many Requests"), Fault.ANSWERED),
        (EfaTimeoutError("timeout after 30s"), Fault.INCONCLUSIVE),
        (EfaApiError("connection error: refused"), Fault.INCONCLUSIVE),
        (RuntimeError("unforeseen"), Fault.INCONCLUSIVE),
    ],
)
def test_classify(err: Exception, expected: Fault) -> None:
    """Only failures that prove a broken server count against LINZ AG LINIEN."""
    assert classify(err) is expected


async def test_issue_appears_only_after_the_threshold(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """A 502 starts the clock; the issue waits until it has run out."""
    coordinator = _coordinator(hass)
    await _fetch(coordinator, aioclient_mock, status=502)
    assert _issue(hass) is None

    freezer.tick(timedelta(seconds=OUTAGE_MIN_SECONDS - 60))
    await _fetch(coordinator, aioclient_mock, status=502)
    assert _issue(hass) is None

    freezer.tick(timedelta(seconds=61))
    await _fetch(coordinator, aioclient_mock, status=502)
    issue = _issue(hass)
    assert issue is not None
    assert issue.translation_key == OUTAGE_ISSUE_ID
    assert issue.severity is ir.IssueSeverity.WARNING
    assert issue.is_fixable is False
    assert issue.is_persistent is False


async def test_one_fault_never_raises_however_long_ago_it_began(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """The time alone isn't enough; the outage needs a second fault."""
    async_note_fault(hass, Fault.OUTAGE)
    freezer.tick(_PAST_THRESHOLD * 10)
    assert _issue(hass) is None
    assert hass.data[OUTAGE_DATA][""].failures == 1


async def test_two_faults_inside_the_window_raise_nothing(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """Back-to-back setup retries after a restart must not raise the issue."""
    async_note_fault(hass, Fault.OUTAGE)
    freezer.tick(timedelta(seconds=10))
    async_note_fault(hass, Fault.OUTAGE)
    freezer.tick(timedelta(seconds=20))
    async_note_fault(hass, Fault.OUTAGE)
    assert _issue(hass) is None


async def test_recovery_clears_the_issue(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """The first good answer ends the outage and removes the issue."""
    coordinator = _coordinator(hass)
    await _fetch(coordinator, aioclient_mock, status=503)
    freezer.tick(_PAST_THRESHOLD)
    await _fetch(coordinator, aioclient_mock, status=503)
    assert _issue(hass) is not None

    await _fetch(coordinator, aioclient_mock, json=EXAMPLE_DM_RESPONSE)
    assert _issue(hass) is None
    assert "" not in hass.data[OUTAGE_DATA]

    # The next outage has to earn its own threshold again.
    await _fetch(coordinator, aioclient_mock, status=503)
    assert _issue(hass) is None


async def test_an_unreadable_body_counts_as_an_outage(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """A 200 whose body isn't a JSON object is a fault on LINZ AG's side."""
    coordinator = _coordinator(hass)
    await _fetch(coordinator, aioclient_mock, text="<html>Wartung</html>")
    freezer.tick(_PAST_THRESHOLD)
    await _fetch(coordinator, aioclient_mock, json=["not", "an", "object"])
    assert _issue(hass) is not None


async def test_network_errors_never_start_the_clock(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """Timeouts and connection errors can be the user's own network."""
    coordinator = _coordinator(hass)
    await _fetch(coordinator, aioclient_mock, exc=TimeoutError())
    freezer.tick(_PAST_THRESHOLD)
    await _fetch(
        coordinator, aioclient_mock, exc=aiohttp.ClientConnectionError("refused")
    )
    await _fetch(coordinator, aioclient_mock, status=502)
    assert _issue(hass) is None


async def test_network_errors_keep_a_running_outage_going(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """A timeout in the middle of an outage doesn't reset its clock."""
    coordinator = _coordinator(hass)
    await _fetch(coordinator, aioclient_mock, status=502)
    freezer.tick(_PAST_THRESHOLD)
    await _fetch(coordinator, aioclient_mock, exc=TimeoutError())
    await _fetch(coordinator, aioclient_mock, status=502)
    assert _issue(hass) is not None


async def test_a_real_client_error_answer_ends_the_outage(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """A 4xx comes from a working server, so the clock starts over."""
    coordinator = _coordinator(hass)
    await _fetch(coordinator, aioclient_mock, status=502)
    freezer.tick(timedelta(seconds=OUTAGE_MIN_SECONDS - 60))
    await _fetch(coordinator, aioclient_mock, status=404)
    freezer.tick(timedelta(seconds=120))
    await _fetch(coordinator, aioclient_mock, status=502)
    assert _issue(hass) is None


async def test_a_rate_limit_answer_ends_the_outage(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """A 429 is a working server telling us to slow down, not an outage."""
    coordinator = _coordinator(hass)
    await _fetch(coordinator, aioclient_mock, status=502)
    freezer.tick(_PAST_THRESHOLD)
    await _fetch(coordinator, aioclient_mock, status=429)
    await _fetch(coordinator, aioclient_mock, status=502)
    assert _issue(hass) is None


async def test_a_local_parse_bug_is_not_an_outage(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """A crash after the request succeeded must not read as LINZ AG's fault."""
    coordinator = _coordinator(hass)
    async_note_fault(hass, Fault.OUTAGE)
    freezer.tick(_PAST_THRESHOLD)
    with (
        patch(
            "custom_components.linz_linien_austria.coordinator.fetch_departures",
            side_effect=KeyError("departureList"),
        ),
        pytest.raises(KeyError),
    ):
        await coordinator._async_update_data()
    assert _issue(hass) is None
    assert hass.data[OUTAGE_DATA][""].failures == 1


async def test_issue_is_created_once(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """Later failures leave the raised issue alone instead of re-creating it."""
    async_note_fault(hass, Fault.OUTAGE)
    freezer.tick(_PAST_THRESHOLD)
    with patch(
        "custom_components.linz_linien_austria.outage.ir.async_create_issue"
    ) as create:
        async_note_fault(hass, Fault.OUTAGE)
        async_note_fault(hass, Fault.OUTAGE)
    assert create.call_count == 1


async def test_scopes_keep_separate_clocks_and_issues(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """A scoped outage gets its own issue id and doesn't touch the others."""
    async_note_fault(hass, Fault.OUTAGE, scope="a", placeholders={"name": "A"})
    async_note_fault(hass, Fault.OUTAGE, scope="b")
    freezer.tick(_PAST_THRESHOLD)
    async_note_fault(hass, Fault.OUTAGE, scope="a", placeholders={"name": "A"})
    registry = ir.async_get(hass)
    issue = registry.async_get_issue(DOMAIN, f"{OUTAGE_ISSUE_ID}_a")
    assert issue is not None
    assert issue.translation_placeholders == {"name": "A"}
    assert registry.async_get_issue(DOMAIN, f"{OUTAGE_ISSUE_ID}_b") is None

    async_clear_outage(hass, "a")
    assert registry.async_get_issue(DOMAIN, f"{OUTAGE_ISSUE_ID}_a") is None
    assert set(hass.data[OUTAGE_DATA]) == {"b"}


async def test_clear_outage_forgets_state_and_issue(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    """Removing the last entry drops both the clock and the issue."""
    async_note_fault(hass, Fault.OUTAGE)
    freezer.tick(_PAST_THRESHOLD)
    async_note_fault(hass, Fault.OUTAGE)
    assert _issue(hass) is not None

    async_clear_outage(hass)
    assert _issue(hass) is None
    assert OUTAGE_DATA not in hass.data


async def test_removing_the_last_entry_clears_the_outage(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """The issue can't outlive the integration: the last removal drops it."""
    aioclient_mock.get(DM_URL, status=502)
    entry = _make_entry()
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    freezer.tick(_PAST_THRESHOLD)
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert _issue(hass) is not None

    with patch(
        "custom_components.linz_linien_austria."
        "card_registration.JSModuleRegistration.async_unregister",
    ):
        assert await hass.config_entries.async_remove(entry.entry_id)
        await hass.async_block_till_done()
    assert _issue(hass) is None
    assert OUTAGE_DATA not in hass.data


async def test_entries_in_setup_retry_raise_and_clear_the_issue(
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """An upstream outage, end to end through real config-entry setups.

    The shape of the 2026-10-21 Wiener Linien incident: the DM endpoint
    answers 503 for as long as it lasts, so every entry sits in setup retry
    and no coordinator timer runs. The setup attempts themselves have to feed
    the clock, or the issue never appears in exactly the case it was built
    for. Pinned here because nobody can stage a real outage to check.
    """
    aioclient_mock.get(DM_URL, status=503)
    entry = _make_entry()
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.SETUP_RETRY
    assert _issue(hass) is None

    freezer.tick(_PAST_THRESHOLD)
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.SETUP_RETRY
    assert _issue(hass) is not None

    aioclient_mock.clear_requests()
    aioclient_mock.get(DM_URL, json=EXAMPLE_DM_RESPONSE)
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.LOADED
    assert _issue(hass) is None
