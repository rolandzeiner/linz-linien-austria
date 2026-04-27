"""Tests for the alerts parser + per-line filter."""
from custom_components.linz_linien_austria.alerts import (
    _decode_html,
    _parse_addinfo,
    _parse_alert,
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
