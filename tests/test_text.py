"""Tests for the shared EFA text normalisers.

`decode_html` moved here out of `alerts.py` when `api.py` needed it too
(departure delay hints come from the same editorial CMS as the alerts
feed), so these tests moved with it.
"""

from __future__ import annotations

from custom_components.linz_linien_austria.text import decode_html, flatten_lines

# ---------------------------------------------------------------------
# decode_html
# ---------------------------------------------------------------------


def test_decode_html_strips_tags_and_decodes_german_entities() -> None:
    text = decode_html(
        "<p>Ab <strong>1.5.</strong></p><p>L191 wird umgeleitet.&nbsp;Sch&ouml;n!</p>"
    )
    assert "<" not in text
    assert ">" not in text
    assert "Schön!" in text


def test_decode_html_resolves_numeric_entities() -> None:
    """Numeric entities like `&#252;` must decode via chr()."""
    assert "ü" in decode_html("Gr&#252;n")


def test_decode_html_leaves_unknown_entity_intact() -> None:
    """Unknown named entities pass through verbatim (don't crash)."""
    out = decode_html("a&unknownEntity;b")
    assert "&unknownEntity;" in out


def test_decode_html_leaves_overflow_numeric_entity_intact() -> None:
    """An out-of-range numeric entity is rejected by `chr()` — pass through."""
    out = decode_html("a&#9999999999999;b")
    assert "&#9999999999999;" in out


def test_decode_html_drops_control_character_numeric_entity() -> None:
    """A C0 control char (`&#0;` NUL) is dropped, not injected into prose."""
    out = decode_html("a&#0;b")
    assert "\x00" not in out
    assert out == "ab"


def test_decode_html_converts_br_to_newline() -> None:
    """`<br>` marks a real line break; it must survive tag stripping."""
    assert decode_html("eins<br/>zwei<BR>drei").splitlines() == [
        "eins",
        "zwei",
        "drei",
    ]


# ---------------------------------------------------------------------
# flatten_lines
# ---------------------------------------------------------------------


def test_flatten_lines_joins_dot_matrix_breaks() -> None:
    """Hints are newline-separated for a 3-line display; a row is 1 line."""
    assert (
        flatten_lines("Behinderung!\nVerspätung!\nBitte Geduld!")
        == "Behinderung! Verspätung! Bitte Geduld!"
    )


def test_flatten_lines_drops_blank_segments() -> None:
    """Consecutive breaks must not produce double spaces."""
    assert flatten_lines("eins\n\n  \nzwei") == "eins zwei"


def test_flatten_lines_passes_single_line_through() -> None:
    assert flatten_lines("nur eine Zeile") == "nur eine Zeile"


def test_flatten_lines_honours_custom_separator() -> None:
    assert flatten_lines("a\nb", separator=" · ") == "a · b"
