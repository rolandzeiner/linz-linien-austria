"""Constants for Linz Linien Austria."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Final

from homeassistant.const import __version__ as _HA_VERSION

DOMAIN: Final = "linz_linien_austria"

# Integration version — read from manifest.json at module import so the
# string can never drift from HACS's authoritative source. Sync read of a
# ~600-byte file happens once per process; the manifest is required for
# HACS anyway. Release workflow: bump only manifest.json "version".
INTEGRATION_VERSION: Final = json.loads(
    (Path(__file__).parent / "manifest.json").read_text(encoding="utf-8")
)["version"]

# User-Agent sent on every outbound HTTP request. HA convention is
# "HomeAssistant/{ha_ver} {domain}/{int_ver}" so log parsers on the
# upstream side can identify this integration specifically (rather
# than seeing the generic clientsession UA). The trailing
# "(+<repo-url>)" comment follows RFC-9110 product-token-comment
# convention so the upstream operator (LINZ AG) has a direct contact
# point for abuse / coordination without having to find the repo by
# guessing. Same scheme used across the author's other integrations
# for consistent audit trails.
USER_AGENT: Final = (
    f"HomeAssistant/{_HA_VERSION} {DOMAIN}/{INTEGRATION_VERSION} "
    f"(+https://github.com/rolandzeiner/linz-linien-austria)"
)

# Config entry / options keys
CONF_STOP_ID: Final = "stop_id"
CONF_STOP_NAME: Final = "stop_name"
CONF_LIMIT: Final = "limit"
# Optional filter — list of "<line>:<H|R>" keys, e.g. "2:H". Entry
# schema v1 keyed the second segment on the destination *text*
# ("2:solarCity"), which is unstable for branching termini; v2 keys it
# on the EFA Hin/Rück code instead. `async_migrate_entry` rewrites v1
# keys in place — see __init__.py.
CONF_LINES: Final = "lines"
# Transient holding pen for v1 keys the migration could not remap because
# the upstream was unreachable at upgrade time. The coordinator drains it
# on its first successful poll and removes the key — see
# `_heal_legacy_line_filter`. Never written by the config flow.
CONF_LINES_LEGACY: Final = "lines_legacy_v1"
CONF_SEARCH_QUERY: Final = "search_query"
# Opt-in: ask the DM endpoint for each trip's onward stop list.
CONF_SHOW_STOP_SEQUENCE: Final = "show_stop_sequence"

# --- Onward stop sequence (opt-in) -----------------------------------
# `depType=stopEvents&includeCompleteStopSeq=1` makes each departure
# carry the full stop list of the trip it belongs to, with per-stop
# realtime arrival and delay. That is strictly richer than the sibling
# wiener-linien integration's `stops_ahead`, which has to be synthesised
# from a locally-built GTFS trip-pattern index and carries no per-stop
# delay — but here it is paid for on every single poll.
#
# Measured at Hauptbahnhof, gzipped (2026-07-24):
#
#     limit   with seq   without   ratio
#       6      14.9 KB    6.8 KB    2.2x
#       8      20.1 KB    7.1 KB    2.8x
#      10      22.8 KB    7.9 KB    2.9x
#      12      27.2 KB    8.1 KB    3.3x
#      20      41.4 KB   10.3 KB    4.0x
#
# The marginal cost per departure jumps past 10 (8→10 costs 2.7 KB for
# two more rows; 10→12 costs 4.4 KB for two), so 10 is where the curve
# stops being efficient. At the 60 s default that is ~33 MB/day/stop
# against ~15 MB without — hence opt-in, and hence the clamp.
#
# Half of what we pay for is waste: the response also carries
# `prevStopSeq` (the stops already behind the vehicle), which is 53% of
# the sequence volume and useless for a departure monitor. No EFA
# parameter suppresses it, so it is dropped client-side on receipt.
SEQUENCE_UPSTREAM_LIMIT: Final = 10

# Hard cap on onward stops kept per departure. The longest Linz routes
# run ~30 stops end to end, so a vehicle leaving its first stop can
# legitimately carry near that many; 25 keeps the common case whole
# while bounding the attribute payload if the upstream ever returns
# something pathological.
MAX_STOPS_AHEAD: Final = 25

# Polling policy
# Linz AG Linien EFA fair-use: keep aggregate request rate well below the
# rate the live mobile/web frontends drive. 30 s minimum lets users with
# multiple stops tighten their poll cadence; the 15 s domain-wide cooldown
# ensures concurrent entries don't collectively breach the floor. Default
# 60 s matches the cadence Linz AG's own departure boards refresh at.
MIN_POLL_SECONDS: Final = 30
DEFAULT_SCAN_INTERVAL: Final = 60  # seconds
MAX_POLL_SECONDS: Final = 600

# Domain-wide cooldown across all entries. Keys live under hass.data[DOMAIN].
DOMAIN_LAST_CALL_KEY: Final = "last_call_ts"
DOMAIN_COOLDOWN_SECONDS: Final = 15

# Exponential-backoff ceiling for sustained API outages. Keep updates
# visible without amplifying load — 30 min is well below "user thinks the
# integration is broken" yet far above any realistic transient hiccup.
BACKOFF_CAP_SECONDS: Final = 1800

# Upstream API — EFA (Elektronische Fahrplanauskunft) by Mentz GmbH.
# Same Mentz EFA endpoint the official LinzMobil app and the linzag.at
# website query. JSON output is supported via outputFormat=JSON.
# Reference: https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/fahrplan/
#            EFA_XML_Schnittstelle_20151217.pdf (Dec 2015)
API_BASE_URL: Final = "https://www.linzag.at/static"
DM_ENDPOINT: Final = "/XML_DM_REQUEST"  # Departure Monitor
STOPFINDER_ENDPOINT: Final = "/XML_STOPFINDER_REQUEST"  # Stop search

# Ask the EFA for decimal-degree WGS84 instead of its projected NAV5
# default. Sent on every request that can return a position; without it
# `ref.coords` carries Gauss-Krüger easting/northing that looks like a
# plausible float pair but is unusable as a geographic location.
COORD_OUTPUT_FORMAT: Final = "WGS84[dd.ddddd]"

# --- Two upstream capabilities this deployment does NOT have ----------
# Both were probed directly against EFAController/10.6.30.4 (2026-07-24).
# Recorded here because both are patterns the sibling wiener-linien
# integration uses, and re-deriving "why doesn't Linz do that too?" costs
# an afternoon each time.
#
# 1. No multi-stop batching. XML_DM_REQUEST serves exactly one stop per
#    request. Repeated `name_dm` params return only the first stop;
#    `name_dm=A,B` and `mergeDep=1` + `name_dm_1`/`name_dm_2` both return
#    zero departures. There is no equivalent of wiener-linien's
#    `batch.py`, so N configured stops means N requests — the 15 s
#    DOMAIN_COOLDOWN_SECONDS below is the only aggregate throttle.
#
# 2. No conditional GET. The EFAController sends neither `ETag` nor
#    `Last-Modified` on any endpoint, so there is nothing to revalidate
#    against and a 304 fast path is impossible. `Accept-Encoding: gzip`
#    is honoured and is the only transfer saving available (see http.py).
# ----------------------------------------------------------------------
# XML_ADDINFO_REQUEST returns the active line/stop-info notices that
# the LinzMobil app surfaces in its alerts banner. Refreshed on a
# domain-wide 5-min cadence — these don't change any faster than
# operator-side editorial activity (typically a few times an hour) and
# hammering the endpoint per-entry would waste fair-use budget.
ADDINFO_ENDPOINT: Final = "/XML_ADDINFO_REQUEST"

# Alerts (line/stop info) — domain-wide cadence shared across all entries.
# 5 min is plenty: editorial events arrive a few times per hour at most
# and per-entry polling would burn fair-use budget for no benefit.
ALERTS_REFRESH_SECONDS: Final = 300
ALERTS_KEY: Final = "alerts"
ALERTS_REFRESH_UNSUB_KEY: Final = "alerts_refresh_unsub"
ENTRY_COUNT_KEY: Final = "entry_count"

# Cap on how many departures we surface in sensor attributes. Sized
# against HA's 16 KB recorder attribute limit: each normalised
# departure averages ~310 bytes (line + direction + mot + countdowns +
# scheduled/realtime ISO + flags), so 45 entries take ~14 KB and
# leave ~2 KB margin for the variable `alerts` attribute and the
# stop-metadata block. Raise carefully — once you pass ~50, the
# recorder starts logging "State attributes ... exceed maximum size"
# warnings on busy stops with active disruptions.
#
# Why 45 (and not, say, 60): big multi-line stops like Hauptbahnhof
# fit ~3-4 minutes of upcoming departures into 30 entries, so 45 buys
# the user a meaningful 5-7 minute window for filtered views (per-line
# Fußweg, line filter at narrow scope) without flirting with the
# recorder cap. Users who need more rendered rows should pair
# `max_departures` (display cap on the card) with the integration's
# `limit` (upstream fetch size) — they don't both have to track this
# attribute cap.
MAX_DEPARTURES_IN_ATTRS: Final = 45
DEFAULT_LIMIT: Final = 20

# CC-BY 4.0 attribution mandated by the OGD Linz dataset terms.
# https://data.linz.gv.at/ — see ATTRIBUTION file.
ATTRIBUTION: Final = "Datenquelle: LINZ AG LINIEN (data.linz.gv.at), CC BY 4.0"

# Mode-of-transport IDs follow the Mentz EFA spec page 52 (0=Zug,
# 1=S-Bahn, 2=U-Bahn, 3=Stadtbahn, 4=Straßen-/Trambahn, 5=Stadtbus,
# 6=Regionalbus, 7=Schnellbus, 8=Seil-/Zahnradbahn, 9=Schiff,
# 10=AST/Rufbus, 11=Sonstige). The integration consumes these as raw
# ints (api.py::_MOT_NAMES) and the card maps them via its own table —
# no Python constant is needed.

# Lovelace card — pinned to ``INTEGRATION_VERSION`` so the manifest is
# the single source of truth. ``src/const.ts`` carries the same string
# as the bundle's compile-time constant; ``tests/test_card_version.py``
# locks them together byte-for-byte against ``INTEGRATION_VERSION`` so
# a manifest-only bump still trips CI if the TS side falls behind.
CARD_VERSION: Final = INTEGRATION_VERSION
CARD_URL_BASE: Final = "/linz-linien-austria"
CARD_FILENAME: Final = "linz-linien-austria-card.js"

# LEGACY (entry schema v1 only). Up to 0.6.0 the coordinator accumulated
# every line label it had ever observed at the stop into this Store,
# because there was no known way to ask the upstream for the stop's full
# roster. There is: every DM response carries a `servingLines` block with
# the complete timetable roster (api.py::_parse_serving_lines), which is
# both immediately complete and correct after a reconfigure. The Store is
# no longer written or read — these constants survive only so
# `async_migrate_entry` can delete the orphaned file. Remove both once
# entry schema v1 is no longer in the field.
LINES_AT_STOP_STORAGE_VERSION: Final = 1
LINES_AT_STOP_STORAGE_KEY_PREFIX: Final = f"{DOMAIN}.lines_at_stop"
