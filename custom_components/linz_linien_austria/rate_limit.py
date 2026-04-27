"""Domain-wide rate limiting for LINZ AG LINIEN API calls.

Both the per-entry departure polls (coordinator.py) and the domain-wide
alerts refresh (alerts.py) must stay above the 15 s fair-use floor *in
aggregate*. An ``asyncio.Lock`` serialises the check-then-update so two
concurrent callers can't both observe the same ``last_call_ts`` and
skip the wait — same pattern wiener-linien-austria uses.

The previous timestamp-only check (kept in this codebase until the lock
landed) was vulnerable to that exact race: two entries firing at the
same tick would both read ``last_call=0`` before either had a chance to
write, so both would skip the cooldown and fire simultaneously. The
lock removes that footgun.
"""
from __future__ import annotations

import asyncio
import logging
import time

from homeassistant.core import HomeAssistant

from .const import DOMAIN, DOMAIN_COOLDOWN_SECONDS, DOMAIN_LAST_CALL_KEY

_LOCK_KEY = "cooldown_lock"
_LOGGER = logging.getLogger(__name__)


async def async_enforce_domain_cooldown(hass: HomeAssistant) -> None:
    """Serialise outbound calls across all entries under the 15 s floor.

    The ``asyncio.sleep`` runs *inside* the lock — that's by design.
    Concurrent callers queue up and each waits its full slice, so N
    simultaneous callers take ~N × 15 s to drain. That's exactly the
    fair-use floor, not a bug.

    Practical implication: at the default 60 s scan + 15 s floor the
    queue drains comfortably for ~3 entries (3 × 15 = 45 < 60). With
    more entries the slowest coordinator's wait may exceed its 30 s
    request timeout — users with 4+ stops should bump the interval.
    The coordinator's exponential backoff handles sustained queue
    overruns by widening the cadence on consecutive failures.
    """
    domain_data = hass.data.setdefault(DOMAIN, {})
    lock: asyncio.Lock = domain_data.setdefault(_LOCK_KEY, asyncio.Lock())
    async with lock:
        last = float(domain_data.get(DOMAIN_LAST_CALL_KEY) or 0.0)
        now = time.monotonic()
        elapsed = now - last
        if 0 < elapsed < DOMAIN_COOLDOWN_SECONDS:
            wait = DOMAIN_COOLDOWN_SECONDS - elapsed
            _LOGGER.debug("domain cooldown: waiting %.1fs", wait)
            await asyncio.sleep(wait)
        # Stamp BEFORE returning — failed calls "use up" the budget like
        # successful ones, so a flurry of retries can't bypass the floor.
        domain_data[DOMAIN_LAST_CALL_KEY] = time.monotonic()
