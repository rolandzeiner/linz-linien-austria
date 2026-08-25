"""Text normalisation shared by the EFA payload parsers.

The upstream emits operator-authored prose in two places — the alerts
feed (``XML_ADDINFO_REQUEST``) and the per-departure ``servingLine.hints``
— and both come out of the same editorial CMS, so both can carry the same
small HTML vocabulary. Keeping the decoder here means `alerts.py` and
`parser.py` share one implementation instead of drifting apart, without
`parser.py` (the lowest layer) having to import from `alerts.py`.
"""

from __future__ import annotations

import re
from html import unescape

_BR_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)
_HTML_TAG_RE = re.compile(r"<[^>]+>")

# Junk a malformed numeric ref can leave behind. C0 control characters
# corrupt the recorder row and the card's text rendering; tab, newline
# and carriage return are kept, the first two because they are
# meaningful in alert prose and CR because it has to survive to
# `splitlines` below so a CRLF upstream still splits rather than gluing
# two lines together.
#
# U+FFFD is in the set because `html.unescape` follows the HTML5 spec
# for invalid character references: `&#0;` decodes to the replacement
# character rather than to NUL, so stripping the C0 range alone would
# let a NUL reference through as visible mojibake.
_JUNK_STRIP: dict[int, None] = {
    c: None for c in range(0x20) if c not in (0x09, 0x0A, 0x0D)
} | {0xFFFD: None}


def decode_html(html: str) -> str:
    """Strip HTML tags + decode the entities the EFA emits.

    A full HTML parser would be overkill for the limited tag set the
    upstream uses (`<p>`, `<strong>`, `<em>`, `<br />`). Convert `<br>`
    family to newlines first, then strip everything else, then hand the
    remainder to `html.unescape`.

    Order matters: tags are stripped *before* unescaping, so an escaped
    `&lt;p&gt;` in the source survives as literal text instead of being
    decoded into a tag and then eaten by the tag stripper.

    Newlines are preserved — callers that need a single line should pass
    the result through `flatten_lines`.
    """
    text = _BR_RE.sub("\n", html)
    text = _HTML_TAG_RE.sub("", text)
    text = unescape(text).translate(_JUNK_STRIP)
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
