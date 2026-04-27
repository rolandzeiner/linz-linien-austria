"""Shared HTTP plumbing for outbound LINZ AG LINIEN API calls.

Every outbound request — DM_REQUEST, STOPFINDER_REQUEST, ADDINFO_REQUEST —
should go through ``base_request_headers`` so a future call-site addition
can't silently drop the canonical headers. Pair this module with the
regression test in ``tests/test_user_agent.py`` (which also asserts the
gzip header) so drift is caught at CI time, not at the next bandwidth
audit.
"""
from __future__ import annotations


def base_request_headers(user_agent: str) -> dict[str, str]:
    """Headers sent on every outbound request.

    * ``User-Agent`` — identifies this integration to LINZ AG's log
      parsers so they can rate-limit / contact us specifically rather
      than blanket-blocking every HA install. Format documented in the
      ``ha-integration-platinum`` skill.
    * ``Accept`` — every endpoint here is queried via
      ``outputFormat=JSON`` so JSON is what we expect.
    * ``Accept-Encoding: gzip`` — the EFAController honours it and
      compresses bodies ~7×. ``aiohttp`` decompresses transparently
      on the response side, so no parsing change is needed. Without
      this header the server defaults to identity encoding.
    """
    return {
        "User-Agent": user_agent,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
    }
