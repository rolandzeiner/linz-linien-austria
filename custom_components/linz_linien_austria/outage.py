"""Sustained-outage detection for the upstream API.

When the upstream goes down, every entry fails its first refresh and sits in
setup retry, its entities go unavailable, and the log stays quiet because
each failure is an ordinary ``UpdateFailed``. From the user's side that looks
exactly like a broken install. This module tells the two apart: once the
upstream has failed *on its own side* at least ``OUTAGE_MIN_FAILURES`` times
over at least ``OUTAGE_MIN_SECONDS``, it raises one Repairs issue saying so,
and clears it on the first answer that shows the service is back.

Every outcome falls in one of three classes, and only the first may claim the
fault is upstream's:

- ``Fault.OUTAGE`` — the server provably answered, and answered broken: a
  5xx, a 2xx whose body isn't usable, or the API's own "backend down" signal.
- ``Fault.INCONCLUSIVE`` — a timeout, DNS failure, refused or reset
  connection, or any error ``classify`` doesn't recognise. That can just as
  well be the user's own network, so it neither starts nor stops the clock.
- ``Fault.ANSWERED`` — a success, and every other reply (4xx, rate limit,
  auth failure, unknown stop). A working service sent a real answer, which
  ends any outage.

The state is domain-wide (one clock per ``scope``, ``""`` by default) and
never tied to a coordinator, because during an outage the failures arrive
through each entry's first refresh, where no coordinator timer is running.
Feed it from the one function every real request goes through, setup retries
included, and never from a path that answered without a request.

It lives under its own ``HassKey``, not ``hass.data[DOMAIN]``, and survives
domain teardown on purpose: the entry count can reach zero mid-outage while
HA keeps retrying. Only the last ``async_remove_entry`` calls
``async_clear_outage``.

This file is copied between the portfolio's integrations. Everything above
the ``classify`` section is generic and stays identical across repos; only
``classify`` is repo-specific.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Final

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.util import dt as dt_util
from homeassistant.util.hass_dict import HassKey

from .api import EfaHttpError, EfaPayloadError
from .const import DOMAIN

# The Repairs issue id (suffixed with the scope when there is one) and its
# translation key under `issues` in strings.json.
OUTAGE_ISSUE_ID: Final = "upstream_unavailable"
# Both must hold before the issue appears. The count keeps a burst of setup
# retries after a restart (about 5 s, 10 s, 20 s apart) from raising it in
# seconds; the time keeps a short blip or an upstream deploy from raising it
# at all, while someone staring at an empty card still gets an answer.
OUTAGE_MIN_FAILURES: Final = 2
OUTAGE_MIN_SECONDS: Final = 600


class Fault(Enum):
    """What one request outcome says about the upstream."""

    OUTAGE = "outage"
    INCONCLUSIVE = "inconclusive"
    ANSWERED = "answered"


@dataclass(slots=True)
class OutageState:
    """When the current outage began, how often it failed, and if reported."""

    since: datetime | None = None
    failures: int = 0
    raised: bool = False


OUTAGE_DATA: HassKey[dict[str, OutageState]] = HassKey(f"{DOMAIN}_upstream_outage")


def _issue_id(scope: str) -> str:
    return f"{OUTAGE_ISSUE_ID}_{scope}" if scope else OUTAGE_ISSUE_ID


@callback
def async_note_fault(
    hass: HomeAssistant,
    fault: Fault,
    scope: str = "",
    placeholders: dict[str, str] | None = None,
) -> None:
    """Record one request outcome; raise or clear the issue as it warrants."""
    if fault is Fault.INCONCLUSIVE:
        return
    if fault is Fault.ANSWERED:
        ended = hass.data.get(OUTAGE_DATA, {}).pop(scope, None)
        if ended is not None and ended.raised:
            ir.async_delete_issue(hass, DOMAIN, _issue_id(scope))
        return

    state = hass.data.setdefault(OUTAGE_DATA, {}).setdefault(scope, OutageState())
    now = dt_util.utcnow()
    if state.since is None:
        state.since = now
    state.failures += 1
    if state.raised or state.failures < OUTAGE_MIN_FAILURES:
        return
    if (now - state.since).total_seconds() < OUTAGE_MIN_SECONDS:
        return
    state.raised = True
    ir.async_create_issue(
        hass,
        DOMAIN,
        _issue_id(scope),
        is_fixable=False,
        severity=ir.IssueSeverity.WARNING,
        translation_key=OUTAGE_ISSUE_ID,
        translation_placeholders=placeholders,
    )


@callback
def async_clear_outage(hass: HomeAssistant, scope: str | None = None) -> None:
    """Forget an outage and drop its issue; ``None`` clears every scope."""
    states = hass.data.get(OUTAGE_DATA)
    if not states:
        return
    scopes = list(states) if scope is None else [scope]
    for key in scopes:
        if (state := states.pop(key, None)) is not None and state.raised:
            ir.async_delete_issue(hass, DOMAIN, _issue_id(key))
    if not states:
        hass.data.pop(OUTAGE_DATA, None)


# ---------------------------------------------------------------------------
# classify — repo-specific: LINZ AG LINIEN EFA departure monitor
# ---------------------------------------------------------------------------


def classify(err: Exception) -> Fault:
    """Map a failed DM request to what it says about LINZ AG LINIEN.

    A 200 JSON object without ``departureList`` parses as zero departures, so
    it counts as an answer. That gap is accepted: telling "no departures" from
    "broken body" would mean second-guessing a valid payload.
    """
    if isinstance(err, EfaHttpError):
        return Fault.OUTAGE if err.status >= 500 else Fault.ANSWERED
    if isinstance(err, EfaPayloadError):
        return Fault.OUTAGE
    # EfaTimeoutError, the bare EfaApiError for connection failures, and
    # anything unforeseen: none of these proves the server is at fault.
    return Fault.INCONCLUSIVE
