"""Lock the byte-for-byte version sync between Python and TypeScript.

Without this assertion, a maintainer can silently bump one side and ship
a release whose CARD_VERSION mismatch triggers HA's reload-banner loop
(banner → reload → same JS → banner again, forever).
"""
from __future__ import annotations

import re
from pathlib import Path

from custom_components.linz_linien_austria.const import CARD_VERSION

_SRC_CONST_TS = (
    Path(__file__).resolve().parent.parent / "src" / "const.ts"
)
# `\b` on both sides excludes accidental matches inside other identifiers
# (e.g. RETRO_CARD_VERSION) — `_` is a word character so the literal
# CARD_VERSION token stays unambiguous.
_RX = re.compile(r'\bCARD_VERSION\b\s*=\s*"([^"]+)"')


def test_card_version_matches_ts() -> None:
    """const.py CARD_VERSION must match src/const.ts byte-for-byte."""
    text = _SRC_CONST_TS.read_text(encoding="utf-8")
    match = _RX.search(text)
    assert match, (
        f"CARD_VERSION literal not found in {_SRC_CONST_TS} — regex stale?"
    )
    assert match.group(1) == CARD_VERSION, (
        f"CARD_VERSION drift: const.py={CARD_VERSION!r} vs "
        f"src/const.ts={match.group(1)!r} — bump both in the same commit."
    )
