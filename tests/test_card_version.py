"""Lock the byte-for-byte version sync between manifest, Python, and TS.

Without this assertion, a maintainer can silently bump one side and ship
a release whose CARD_VERSION mismatch triggers HA's reload-banner loop
(banner → reload → same JS → banner again, forever).

Expected value is derived from ``INTEGRATION_VERSION`` — i.e. from
``manifest.json`` — so a manifest-only bump that forgets the TS side
also trips this test. Python's ``CARD_VERSION`` is wired to
``INTEGRATION_VERSION`` in ``const.py``; the assertion below catches
both halves of the chain in one go.
"""
from __future__ import annotations

import re
from pathlib import Path

from custom_components.linz_linien_austria.const import (
    CARD_VERSION,
    INTEGRATION_VERSION,
)

_SRC_CONST_TS = (
    Path(__file__).resolve().parent.parent / "src" / "const.ts"
)
# `\b` on both sides excludes accidental matches inside other identifiers
# (e.g. RETRO_CARD_VERSION) — `_` is a word character so the literal
# CARD_VERSION token stays unambiguous.
_RX = re.compile(r'\bCARD_VERSION\b\s*=\s*"([^"]+)"')


def test_card_version_matches_manifest_and_ts() -> None:
    """manifest.json → INTEGRATION_VERSION → CARD_VERSION → src/const.ts.

    All four must be byte-identical. A manifest-only bump propagates
    automatically to ``CARD_VERSION`` (wired in ``const.py``); the TS
    bundle still has to be bumped by hand and rebuilt, which is what
    this test guards.
    """
    text = _SRC_CONST_TS.read_text(encoding="utf-8")
    match = _RX.search(text)
    assert match, (
        f"CARD_VERSION literal not found in {_SRC_CONST_TS} — regex stale?"
    )
    assert CARD_VERSION == INTEGRATION_VERSION, (
        "Python CARD_VERSION should be aliased to INTEGRATION_VERSION; "
        f"got CARD_VERSION={CARD_VERSION!r}, "
        f"INTEGRATION_VERSION={INTEGRATION_VERSION!r}."
    )
    assert match.group(1) == INTEGRATION_VERSION, (
        f"Version drift: manifest.json={INTEGRATION_VERSION!r} vs "
        f"src/const.ts={match.group(1)!r} — bump both in the same commit."
    )
