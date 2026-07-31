"""Text normalisation shared by the EFA payload parsers.

The upstream emits operator-authored prose in two places — the alerts
feed (``XML_ADDINFO_REQUEST``) and the per-departure ``servingLine.hints``
— and both come out of the same editorial CMS, so both can carry the same
small HTML vocabulary. Keeping the decoder here means `alerts.py` and
`api.py` share one entity table instead of drifting apart, without
`api.py` (the lowest layer) having to import from `alerts.py`.
"""

from __future__ import annotations

import re

_HTML_TAG_RE = re.compile(r"<[^>]+>")
_HTML_ENTITY_RE = re.compile(r"&([a-zA-Z]+|#\d+);")
_HTML_ENTITIES: dict[str, str] = {
    "nbsp": " ",
    "amp": "&",
    "lt": "<",
    "gt": ">",
    "quot": '"',
    "apos": "'",
    "auml": "ä",
    "ouml": "ö",
    "uuml": "ü",
    "Auml": "Ä",
    "Ouml": "Ö",
    "Uuml": "Ü",
    "szlig": "ß",
}


def decode_html(html: str) -> str:
    """Strip HTML tags + decode the handful of entities the EFA emits.

    A full HTML parser would be overkill for the limited tag set the
    upstream uses (`<p>`, `<strong>`, `<em>`, `<br />`). Convert `<br>`
    family to newlines first, then strip everything else, then decode
    the entity vocabulary (German umlauts + the canonical five).

    Newlines are preserved — callers that need a single line should pass
    the result through `flatten_lines`.
    """
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    text = _HTML_TAG_RE.sub("", text)

    def _replace(match: re.Match[str]) -> str:
        token = match.group(1)
        if token.startswith("#"):
            try:
                decoded = chr(int(token[1:]))
            except (ValueError, OverflowError):
                return match.group(0)
            # Drop C0 control characters (a malformed `&#0;` etc.) —
            # they corrupt the recorder row and the card's text
            # rendering. Tab and newline are the only control chars
            # worth keeping in alert prose.
            if decoded < " " and decoded not in "\t\n":
                return ""
            return decoded
        return _HTML_ENTITIES.get(token, match.group(0))

    text = _HTML_ENTITY_RE.sub(_replace, text)
    # Collapse runs of whitespace inside paragraphs but keep newlines.
    return "\n".join(line.strip() for line in text.splitlines() if line.strip())


def flatten_lines(text: str, *, separator: str = " ") -> str:
    """Join a multi-line string onto one line.

    Departure hints arrive newline-separated for a three-line dot-matrix
    display ("Behinderung!\\nVerspätung!\\nBitte Geduld!"). A card row is
    one line, so the breaks become spaces rather than being rendered as
    literal escapes or silently truncating the tail.
    """
    return separator.join(part for part in text.splitlines() if part.strip())
