"""Tests for the alerts parser + per-line filter."""

from __future__ import annotations

import logging
from collections.abc import Generator
from datetime import timedelta
from typing import Any, Self
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import async_fire_time_changed
from pytest_homeassistant_custom_component.test_util.aiohttp import (
    AiohttpClientMocker,
)

from custom_components.linz_linien_austria import alerts as alerts_mod
from custom_components.linz_linien_austria.alerts import (
    _iso_from_efa_dt,
    _parse_addinfo,
    _parse_alert,
    async_fetch_alerts,
    async_refresh_alerts,
    async_start_alerts_refresh,
    async_stop_alerts_refresh,
    get_alerts_for_lines,
)
from custom_components.linz_linien_austria.const import (
    ADDINFO_ENDPOINT,
    ALERTS_KEY,
    ALERTS_REFRESH_SECONDS,
    ALERTS_REFRESH_UNSUB_KEY,
    API_BASE_URL,
    DOMAIN,
)

ADDINFO_URL = f"{API_BASE_URL}{ADDINFO_ENDPOINT}"

EXAMPLE_ADDINFO = {
    "additionalInformation": {
        "travelInformations": {
            "travelInformation": [
                {
                    "infoID": "11892_LL_ICSLAG",
                    "deactivated": "false",
                    "publish": "1",
                    "priority": "normal",
                    "type": "lineInfo",
                    "infoLink": {
                        "infoLinkText": "L 191 — Verlegung Hauptplatz",
                        "content": "<p><strong>Ab 1.5.</strong></p><p>L191 wird umgeleitet.</p>",
                    },
                    "concernedLines": [{"number": "191", "name": "Stadtteilbus 191"}],
                    "validityPeriod": [
                        {
                            "itdDateTime_From": {
                                "itdDate": {"year": "2026", "month": "5", "day": "1"},
                                "itdTime": {"hour": "5", "minute": "0"},
                            },
                            "itdDateTime_To": {
                                "itdDate": {"year": "2026", "month": "5", "day": "10"},
                                "itdTime": {"hour": "23", "minute": "59"},
                            },
                        }
                    ],
                },
                {
                    "infoID": "deactivated_one",
                    "deactivated": "true",  # must be filtered out
                    "publish": "1",
                    "infoLink": {"infoLinkText": "ignored"},
                },
                {
                    "infoID": "high_prio",
                    "deactivated": "false",
                    "publish": "1",
                    "priority": "high",
                    "type": "stopInfo",
                    "infoLink": {
                        "infoLinkText": "Hauptbahnhof — gesperrt",
                        "content": "Aufgrund eines Polizeieinsatzes",
                    },
                    "concernedLines": [],
                },
            ]
        }
    }
}

# What the EFA answers when no notice is current (measured 2026-10-12):
# the full envelope around an empty list, not a missing key.
EMPTY_ADDINFO = {
    "additionalInformation": {
        "date": "12.10.2026",
        "time": "12:06",
        "travelInformations": {"status": "current", "travelInformation": []},
    }
}


def test_parse_alert_skips_deactivated() -> None:
    out = _parse_alert(
        {"infoID": "x", "deactivated": "true", "publish": "1", "infoLink": {}}
    )
    assert out is None


def test_parse_alert_extracts_lines_and_dates() -> None:
    raw = EXAMPLE_ADDINFO["additionalInformation"]["travelInformations"][
        "travelInformation"
    ][0]
    out = _parse_alert(raw)
    assert out is not None
    assert out.info_id == "11892_LL_ICSLAG"
    assert out.title == "L 191 — Verlegung Hauptplatz"
    assert "L191 wird umgeleitet." in out.description
    assert out.affected_lines == ["191"]
    assert out.valid_from == "2026-05-01T05:00:00"
    assert out.valid_to == "2026-05-10T23:59:00"
    assert out.priority == "normal"


def test_parse_addinfo_drops_deactivated_keeps_active() -> None:
    out = _parse_addinfo(EXAMPLE_ADDINFO)
    ids = [a.info_id for a in out]
    assert "11892_LL_ICSLAG" in ids
    assert "high_prio" in ids
    assert "deactivated_one" not in ids
    high = next(a for a in out if a.info_id == "high_prio")
    assert high.priority == "high"
    # No concerned lines on this one — should propagate as empty list.
    assert high.affected_lines == []


# ---------------------------------------------------------------------
# _iso_from_efa_dt — invalid-input branches
# ---------------------------------------------------------------------


def test_iso_from_efa_dt_rejects_non_dict() -> None:
    assert _iso_from_efa_dt(None) is None
    assert _iso_from_efa_dt("2026-05-01") is None


def test_iso_from_efa_dt_rejects_missing_itd_date_dict() -> None:
    assert _iso_from_efa_dt({"itdDate": "not-a-dict"}) is None


def test_iso_from_efa_dt_rejects_unparseable_date_components() -> None:
    assert (
        _iso_from_efa_dt({"itdDate": {"year": "abc", "month": "5", "day": "1"}}) is None
    )


def test_iso_from_efa_dt_rejects_zero_date_components() -> None:
    assert (
        _iso_from_efa_dt({"itdDate": {"year": "0", "month": "0", "day": "0"}}) is None
    )


def test_iso_from_efa_dt_zeroes_unparseable_time_components() -> None:
    """Bad time block keeps the date but zeros the H:M, doesn't crash."""
    out = _iso_from_efa_dt(
        {
            "itdDate": {"year": "2026", "month": "5", "day": "1"},
            "itdTime": {"hour": "abc", "minute": "xyz"},
        }
    )
    assert out == "2026-05-01T00:00:00"


def test_iso_from_efa_dt_handles_missing_time_block() -> None:
    """No `itdTime` at all → 00:00 fallback (not a crash)."""
    out = _iso_from_efa_dt({"itdDate": {"year": "2026", "month": "5", "day": "1"}})
    assert out == "2026-05-01T00:00:00"


# ---------------------------------------------------------------------
# _parse_alert — early-return branches
# ---------------------------------------------------------------------


def test_parse_alert_rejects_non_dict() -> None:
    assert _parse_alert("not a dict") is None  # type: ignore[arg-type]


def test_parse_alert_rejects_publish_zero() -> None:
    assert _parse_alert({"infoID": "x", "publish": "0", "deactivated": "false"}) is None


def test_parse_alert_rejects_missing_info_id() -> None:
    assert _parse_alert({"infoID": "", "publish": "1", "deactivated": "false"}) is None


def test_parse_alert_rejects_missing_title() -> None:
    """`infoLink.infoLinkText` and `subtitle` both empty → drop the entry."""
    assert (
        _parse_alert(
            {
                "infoID": "x",
                "publish": "1",
                "deactivated": "false",
                "infoLink": {"infoLinkText": "", "subtitle": ""},
            }
        )
        is None
    )


def test_parse_alert_handles_dict_validity_period() -> None:
    """Some EFA installs return validityPeriod as dict, not list."""
    raw: dict[str, Any] = {
        "infoID": "dict-validity",
        "publish": "1",
        "deactivated": "false",
        "infoLink": {"infoLinkText": "Title", "content": "body"},
        "validityPeriod": {
            "itdDateTime_From": {
                "itdDate": {"year": "2026", "month": "5", "day": "1"},
                "itdTime": {"hour": "0", "minute": "0"},
            },
            "itdDateTime_To": {
                "itdDate": {"year": "2026", "month": "5", "day": "2"},
                "itdTime": {"hour": "0", "minute": "0"},
            },
        },
    }
    out = _parse_alert(raw)
    assert out is not None
    assert out.valid_from == "2026-05-01T00:00:00"
    assert out.valid_to == "2026-05-02T00:00:00"


def test_parse_alert_skips_concerned_line_without_number() -> None:
    """Entries with `concernedLines` items that lack `number` are dropped."""
    out = _parse_alert(
        {
            "infoID": "missing-number",
            "publish": "1",
            "deactivated": "false",
            "infoLink": {"infoLinkText": "Title"},
            "concernedLines": [{"name": "no number here"}, {"number": "2"}],
        }
    )
    assert out is not None
    assert out.affected_lines == ["2"]


# ---------------------------------------------------------------------
# _parse_addinfo — defensive guards
# ---------------------------------------------------------------------


@pytest.mark.parametrize(
    "payload",
    [
        {},  # missing additionalInformation
        {"additionalInformation": "not a dict"},
        {"additionalInformation": {"travelInformations": "not a dict"}},
        {
            "additionalInformation": {
                "travelInformations": {"travelInformation": "not a list"}
            }
        },
    ],
)
def test_parse_addinfo_rejects_malformed_envelopes(
    payload: dict[str, Any],
) -> None:
    assert _parse_addinfo(payload) == []


# ---------------------------------------------------------------------
# async_fetch_alerts — three error paths + non-dict body
# ---------------------------------------------------------------------


class _FakeSession:
    def __init__(self, *, exc: Exception | None = None, body: Any = None) -> None:
        self._exc = exc
        self._body = body

    def get(self, *_a: Any, **_kw: Any) -> _FakeResp:
        if self._exc is not None:
            raise self._exc
        return _FakeResp(self._body)


class _FakeResp:
    def __init__(self, body: Any) -> None:
        self._body = body

    def raise_for_status(self) -> None:
        return None

    async def json(self, **_kw: Any) -> Any:
        return self._body

    # `async with session.get(...) as resp:` requires the object the
    # synchronous `get()` returns to be an async context manager. The
    # production code wraps every fetch in this CM since the audit fix
    # for deterministic connection-pool release.
    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *_exc: object) -> None:
        return None


async def test_async_fetch_alerts_swallows_client_error() -> None:
    session = _FakeSession(exc=aiohttp.ClientError("boom"))
    out = await async_fetch_alerts(session)  # type: ignore[arg-type]
    assert out is None


async def test_async_fetch_alerts_swallows_value_error() -> None:
    """Bad JSON → ValueError → None, not propagated."""
    session = _FakeSession(exc=ValueError("invalid json"))
    out = await async_fetch_alerts(session)  # type: ignore[arg-type]
    assert out is None


async def test_async_fetch_alerts_rejects_non_dict_body() -> None:
    session = _FakeSession(body=["not", "a", "dict"])
    out = await async_fetch_alerts(session)  # type: ignore[arg-type]
    assert out is None


async def test_async_fetch_alerts_returns_parsed_list_on_success() -> None:
    session = _FakeSession(body=EXAMPLE_ADDINFO)
    out = await async_fetch_alerts(session)  # type: ignore[arg-type]
    assert out is not None
    ids = {a.info_id for a in out}
    assert "11892_LL_ICSLAG" in ids


async def test_async_fetch_alerts_tells_an_empty_answer_from_a_failure() -> None:
    """No current notices is `[]`; only a failed fetch is `None`."""
    session = _FakeSession(body=EMPTY_ADDINFO)
    out = await async_fetch_alerts(session)  # type: ignore[arg-type]
    assert out == []


# ---------------------------------------------------------------------
# async_refresh_alerts + cooldown wrapper
# ---------------------------------------------------------------------


async def test_async_refresh_alerts_writes_to_hass_data(
    hass: HomeAssistant,
) -> None:
    """The refresh helper must dump the parsed dicts under ALERTS_KEY."""
    fake_session = MagicMock()
    with (
        patch(
            "custom_components.linz_linien_austria.alerts.async_get_clientsession",
            return_value=fake_session,
        ),
        patch(
            "custom_components.linz_linien_austria.alerts.async_fetch_alerts",
            new_callable=AsyncMock,
            return_value=[
                alerts_mod.TrafficInfo(
                    info_id="X",
                    title="t",
                    description="d",
                    description_html="<p>d</p>",
                )
            ],
        ),
        patch(
            "custom_components.linz_linien_austria."
            "alerts.async_enforce_domain_cooldown",
            new_callable=AsyncMock,
        ),
    ):
        await async_refresh_alerts(hass)

    cache = hass.data[DOMAIN][ALERTS_KEY]
    assert isinstance(cache, list)
    assert cache[0]["info_id"] == "X"


@pytest.mark.parametrize(
    "failure",
    [
        {"exc": TimeoutError()},
        {"status": 503},
        {"text": "<html>Wartung</html>"},
        {"json": ["not", "a", "dict"]},
    ],
    ids=["timeout", "http-503", "html-body", "non-dict-json"],
)
async def test_async_refresh_alerts_keeps_the_cache_on_a_failed_fetch(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    failure: dict[str, Any],
) -> None:
    """One bad answer must not take the notices off the cards."""
    aioclient_mock.get(ADDINFO_URL, json=EXAMPLE_ADDINFO)
    await async_refresh_alerts(hass)
    before = list(hass.data[DOMAIN][ALERTS_KEY])
    assert [a["info_id"] for a in before] == ["11892_LL_ICSLAG", "high_prio"]

    aioclient_mock.clear_requests()
    aioclient_mock.get(ADDINFO_URL, **failure)
    assert await async_refresh_alerts(hass) is False

    assert aioclient_mock.call_count == 1
    assert hass.data[DOMAIN][ALERTS_KEY] == before
    assert len(get_alerts_for_lines(hass, {"191"})) == 2


async def test_async_refresh_alerts_clears_the_cache_on_an_empty_answer(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker
) -> None:
    """No current notices is an answer, and the cache has to follow it."""
    aioclient_mock.get(ADDINFO_URL, json=EXAMPLE_ADDINFO)
    await async_refresh_alerts(hass)
    assert hass.data[DOMAIN][ALERTS_KEY]

    aioclient_mock.clear_requests()
    aioclient_mock.get(ADDINFO_URL, json=EMPTY_ADDINFO)
    assert await async_refresh_alerts(hass) is True

    assert hass.data[DOMAIN][ALERTS_KEY] == []


# ---------------------------------------------------------------------
# get_alerts_for_lines — overlap, system-wide, empty cache
# ---------------------------------------------------------------------


def test_get_alerts_for_lines_returns_empty_when_cache_empty(
    hass: HomeAssistant,
) -> None:
    hass.data[DOMAIN] = {}
    assert get_alerts_for_lines(hass, {"2"}) == []


def test_get_alerts_for_lines_returns_all_when_lines_empty(
    hass: HomeAssistant,
) -> None:
    """Empty `lines` set means caller wants every cached alert."""
    hass.data[DOMAIN] = {
        ALERTS_KEY: [
            {"info_id": "a", "affected_lines": ["1"]},
            {"info_id": "b", "affected_lines": []},
        ]
    }
    out = get_alerts_for_lines(hass, set())
    assert {a["info_id"] for a in out} == {"a", "b"}


def test_get_alerts_for_lines_filters_by_overlap(hass: HomeAssistant) -> None:
    """Only alerts whose affected_lines overlap or are empty pass through."""
    hass.data[DOMAIN] = {
        ALERTS_KEY: [
            {"info_id": "match", "affected_lines": ["2", "3"]},
            {"info_id": "miss", "affected_lines": ["7"]},
            {"info_id": "system", "affected_lines": []},
        ]
    }
    out = get_alerts_for_lines(hass, {"2"})
    ids = {a["info_id"] for a in out}
    assert ids == {"match", "system"}


# ---------------------------------------------------------------------
# async_start_alerts_refresh / async_stop_alerts_refresh lifecycle
# ---------------------------------------------------------------------


async def test_start_alerts_refresh_is_idempotent(hass: HomeAssistant) -> None:
    """Starting twice must return the same unsub and not double-schedule."""
    hass.data.setdefault(DOMAIN, {})
    first = async_start_alerts_refresh(hass)
    second = async_start_alerts_refresh(hass)
    assert first is second
    # Stop teardown so the test doesn't leak the timer.
    async_stop_alerts_refresh(hass)


async def test_stop_alerts_refresh_clears_keys(hass: HomeAssistant) -> None:
    """After stop, both ALERTS_KEY and the unsub key are cleared."""
    hass.data.setdefault(DOMAIN, {})[ALERTS_KEY] = [{"info_id": "x"}]
    async_start_alerts_refresh(hass)
    async_stop_alerts_refresh(hass)
    domain_data = hass.data.get(DOMAIN, {})
    assert ALERTS_KEY not in domain_data
    assert ALERTS_REFRESH_UNSUB_KEY not in domain_data


async def test_stop_alerts_refresh_is_safe_when_not_started(
    hass: HomeAssistant,
) -> None:
    """Calling stop without a prior start must not raise."""
    hass.data.pop(DOMAIN, None)
    async_stop_alerts_refresh(hass)  # must not raise


# ---------------------------------------------------------------------
# The tick's failure backoff
# ---------------------------------------------------------------------


class _Clock:
    """Stands in for the `time` module the alerts tick reads."""

    def __init__(self) -> None:
        self.now = 50_000.0

    def monotonic(self) -> float:
        return self.now


@pytest.fixture
def ticking(hass: HomeAssistant) -> Generator[_Clock]:
    """Start the real 5-minute timer, on a monotonic clock the test moves.

    Only the alerts module's `time` is swapped. Patching
    `alerts.time.monotonic` would resolve the singleton `time` module
    and move the event loop's clock as well.
    """
    clock = _Clock()
    with patch.object(alerts_mod, "time", clock):
        async_start_alerts_refresh(hass)
        yield clock
        async_stop_alerts_refresh(hass)


async def _tick(
    hass: HomeAssistant, clock: _Clock, seconds: float = ALERTS_REFRESH_SECONDS
) -> None:
    """Fire the next tick, `seconds` after the last one on the tick's clock."""
    clock.now += seconds
    async_fire_time_changed(
        hass, dt_util.utcnow() + timedelta(seconds=ALERTS_REFRESH_SECONDS)
    )
    await hass.async_block_till_done()


def _feed(mock: AiohttpClientMocker, **answer: Any) -> None:
    """Point the ADDINFO endpoint at one answer. Restarts `call_count`."""
    mock.clear_requests()
    mock.get(ADDINFO_URL, **answer)


async def test_alerts_tick_backs_off_while_the_feed_is_failing(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    ticking: _Clock,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """A failing feed is asked 5, 10, 20, then every 30 minutes apart."""
    caplog.set_level(logging.INFO)
    _feed(aioclient_mock, exc=TimeoutError())

    asked_at: list[int] = []
    for minute in range(5, 135, 5):
        await _tick(hass, ticking)
        if aioclient_mock.call_count > len(asked_at):
            asked_at.append(minute)

    # 12 requests in the first hour before the backoff, 4 with it, and 2
    # an hour from then on.
    assert asked_at == [5, 10, 20, 40, 70, 100, 130]
    # One line per step of the curve, none once it sits at the cap.
    assert [
        r.getMessage() for r in caplog.records if r.name == alerts_mod.__name__
    ] == [
        "2 consecutive alerts failures; backing off to 10 min between tries",
        "3 consecutive alerts failures; backing off to 20 min between tries",
        "4 consecutive alerts failures; backing off to 30 min between tries",
    ]


async def test_skipped_alerts_tick_takes_no_cooldown_slot(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, ticking: _Clock
) -> None:
    """A tick that is backing off returns before the shared 15 s slot."""
    _feed(aioclient_mock, exc=TimeoutError())

    with patch.object(
        alerts_mod, "async_enforce_domain_cooldown", new_callable=AsyncMock
    ) as cooldown:
        await _tick(hass, ticking)
        await _tick(hass, ticking)
        assert cooldown.await_count == 2
        assert aioclient_mock.call_count == 2

        # Two failures in a row: the next tick asks nothing and waits
        # for nothing.
        await _tick(hass, ticking)
        assert cooldown.await_count == 2
        assert aioclient_mock.call_count == 2

        await _tick(hass, ticking)
        assert cooldown.await_count == 3
        assert aioclient_mock.call_count == 3


async def test_one_failed_alerts_fetch_keeps_the_cadence(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, ticking: _Clock
) -> None:
    """A single failure costs no tick, even when the next one fires early.

    Ticks are 5 minutes apart only nominally, so the not-before of a
    first failure must not sit exactly on the next tick.
    """
    _feed(aioclient_mock, exc=TimeoutError())
    await _tick(hass, ticking)
    assert aioclient_mock.call_count == 1

    _feed(aioclient_mock, json=EXAMPLE_ADDINFO)
    await _tick(hass, ticking, ALERTS_REFRESH_SECONDS - 0.5)
    assert aioclient_mock.call_count == 1
    assert len(hass.data[DOMAIN][ALERTS_KEY]) == 2


async def test_alerts_backoff_counts_from_the_tick_not_the_failure(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker, ticking: _Clock
) -> None:
    """A request that is slow to fail must not push the retry out.

    The wait in the cooldown queue and the timeout both pass before the
    failure is known. Counted from there, the not-before would land
    past the tick it is meant to allow.
    """
    _feed(aioclient_mock, exc=TimeoutError())

    async def _slow_queue(_hass: HomeAssistant) -> None:
        ticking.now += 200

    with patch.object(
        alerts_mod, "async_enforce_domain_cooldown", side_effect=_slow_queue
    ):
        await _tick(hass, ticking)
        assert aioclient_mock.call_count == 1
        # 200 s of the interval are gone, so the next tick is 100 s away.
        await _tick(hass, ticking, ALERTS_REFRESH_SECONDS - 200)
        assert aioclient_mock.call_count == 2


async def test_alerts_tick_resets_on_the_first_answer(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    ticking: _Clock,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """One answer ends the backoff, and the next outage starts from 5 min."""
    caplog.set_level(logging.INFO)
    _feed(aioclient_mock, exc=TimeoutError())
    for _ in range(4):  # 5, 10, (15 skipped), 20: three failures
        await _tick(hass, ticking)
    assert aioclient_mock.call_count == 3

    # The feed is back, but nothing asks until the not-before at 40 min.
    _feed(aioclient_mock, json=EXAMPLE_ADDINFO)
    for _ in range(3):  # 25, 30, 35
        await _tick(hass, ticking)
    assert aioclient_mock.call_count == 0
    await _tick(hass, ticking)  # 40
    assert aioclient_mock.call_count == 1
    assert "Alerts feed recovered" in caplog.text

    # Back on every tick.
    await _tick(hass, ticking)
    await _tick(hass, ticking)
    assert aioclient_mock.call_count == 3

    # A new outage counts from one again: after a single failure the
    # next tick still asks. A counter that had kept its 3 would wait
    # 30 minutes here.
    _feed(aioclient_mock, exc=TimeoutError())
    await _tick(hass, ticking)
    await _tick(hass, ticking)
    assert aioclient_mock.call_count == 2
