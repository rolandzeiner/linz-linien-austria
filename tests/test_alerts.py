"""Tests for the alerts parser + per-line filter."""
from __future__ import annotations

from typing import Any, Self
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest
from homeassistant.core import HomeAssistant

from custom_components.linz_linien_austria import alerts as alerts_mod
from custom_components.linz_linien_austria.alerts import (
    _decode_html,
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
    ALERTS_KEY,
    ALERTS_REFRESH_UNSUB_KEY,
    DOMAIN,
)

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
                    "concernedLines": [
                        {"number": "191", "name": "Stadtteilbus 191"}
                    ],
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


def test_decode_html_strips_tags_and_decodes_german_entities() -> None:
    text = _decode_html(
        "<p>Ab <strong>1.5.</strong></p><p>L191 wird "
        "umgeleitet.&nbsp;Sch&ouml;n!</p>"
    )
    assert "<" not in text
    assert ">" not in text
    assert "Schön!" in text


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
# _decode_html — entity edge cases
# ---------------------------------------------------------------------


def test_decode_html_resolves_numeric_entities() -> None:
    """Numeric entities like `&#252;` must decode via chr()."""
    assert "ü" in _decode_html("Gr&#252;n")


def test_decode_html_leaves_unknown_entity_intact() -> None:
    """Unknown named entities pass through verbatim (don't crash)."""
    out = _decode_html("a&unknownEntity;b")
    assert "&unknownEntity;" in out


def test_decode_html_leaves_overflow_numeric_entity_intact() -> None:
    """An out-of-range numeric entity is rejected by `chr()` — pass through."""
    out = _decode_html("a&#9999999999999;b")
    assert "&#9999999999999;" in out


def test_decode_html_drops_control_character_numeric_entity() -> None:
    """A C0 control char (`&#0;` NUL) is dropped, not injected into prose."""
    out = _decode_html("a&#0;b")
    assert "\x00" not in out
    assert out == "ab"


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
        _iso_from_efa_dt(
            {"itdDate": {"year": "abc", "month": "5", "day": "1"}}
        )
        is None
    )


def test_iso_from_efa_dt_rejects_zero_date_components() -> None:
    assert (
        _iso_from_efa_dt(
            {"itdDate": {"year": "0", "month": "0", "day": "0"}}
        )
        is None
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
    out = _iso_from_efa_dt(
        {"itdDate": {"year": "2026", "month": "5", "day": "1"}}
    )
    assert out == "2026-05-01T00:00:00"


# ---------------------------------------------------------------------
# _parse_alert — early-return branches
# ---------------------------------------------------------------------


def test_parse_alert_rejects_non_dict() -> None:
    assert _parse_alert("not a dict") is None  # type: ignore[arg-type]


def test_parse_alert_rejects_publish_zero() -> None:
    assert (
        _parse_alert(
            {"infoID": "x", "publish": "0", "deactivated": "false"}
        )
        is None
    )


def test_parse_alert_rejects_missing_info_id() -> None:
    assert (
        _parse_alert(
            {"infoID": "", "publish": "1", "deactivated": "false"}
        )
        is None
    )


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
    assert out == []


async def test_async_fetch_alerts_swallows_value_error() -> None:
    """Bad JSON → ValueError → empty list, not propagated."""
    session = _FakeSession(exc=ValueError("invalid json"))
    out = await async_fetch_alerts(session)  # type: ignore[arg-type]
    assert out == []


async def test_async_fetch_alerts_rejects_non_dict_body() -> None:
    session = _FakeSession(body=["not", "a", "dict"])
    out = await async_fetch_alerts(session)  # type: ignore[arg-type]
    assert out == []


async def test_async_fetch_alerts_returns_parsed_list_on_success() -> None:
    session = _FakeSession(body=EXAMPLE_ADDINFO)
    out = await async_fetch_alerts(session)  # type: ignore[arg-type]
    ids = {a.info_id for a in out}
    assert "11892_LL_ICSLAG" in ids


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
