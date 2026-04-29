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
# than seeing the generic clientsession UA). Same scheme used across
# the author's other integrations for consistent audit trails.
USER_AGENT: Final = f"HomeAssistant/{_HA_VERSION} {DOMAIN}/{INTEGRATION_VERSION}"

# Config entry / options keys
CONF_STOP_ID: Final = "stop_id"
CONF_STOP_NAME: Final = "stop_name"
CONF_LIMIT: Final = "limit"
CONF_LINES: Final = "lines"  # optional filter — list of "<line>:<direction>"
CONF_SEARCH_QUERY: Final = "search_query"

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
# XSLT_ADDINFO_REQUEST returns the active line/stop-info notices that
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

# Mode of transport ID → category for the card / icon dispatch.
# Per the Mentz EFA spec page 52: 0=Zug, 1=S-Bahn, 2=U-Bahn, 3=Stadtbahn,
# 4=Straßen-/Trambahn, 5=Stadtbus, 6=Regionalbus, 7=Schnellbus,
# 8=Seil-/Zahnradbahn, 9=Schiff, 10=AST/Rufbus, 11=Sonstige.
MOT_TRAIN: Final = 0
MOT_S_BAHN: Final = 1
MOT_U_BAHN: Final = 2
MOT_STADTBAHN: Final = 3
MOT_TRAM: Final = 4
MOT_BUS_CITY: Final = 5
MOT_BUS_REGIONAL: Final = 6
MOT_BUS_EXPRESS: Final = 7
MOT_FUNICULAR: Final = 8
MOT_FERRY: Final = 9
MOT_AST: Final = 10
MOT_OTHER: Final = 11

# Lovelace card — the JS file at the top declares CARD_VERSION which must
# match this constant byte-for-byte, else the resource-version mismatch
# triggers a reload-banner loop. Bump both in the same commit.
CARD_VERSION: Final = "0.4.0"
CARD_URL_BASE: Final = "/linz-linien-austria"
CARD_FILENAME: Final = "linz-linien-austria-card.js"
