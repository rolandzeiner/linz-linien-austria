# Linz Linien Austria

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![HA min version](https://img.shields.io/badge/Home%20Assistant-%3E%3D2025.1-blue.svg)](https://www.home-assistant.io/)
[![Quality Scale](https://img.shields.io/badge/quality%20scale-platinum-e5e4e2.svg)](https://developers.home-assistant.io/docs/core/integration-quality-scale/)

Live LINZ AG LINIEN departure monitor for Home Assistant — with a
matching Lit 3 Lovelace card. Polls the same EFA (Elektronische
Fahrplanauskunft) endpoint the official LinzMobil app uses, including
realtime delays and trip cancellations where the upstream provides
them.

## Features

### Integration

- **One config entry per stop.** Search-by-name flow — no hunting for
  stop IDs.
- **Realtime-aware countdown sensor** (`SensorDeviceClass.DURATION`,
  unit minutes). The full upcoming departure list, sorted by realtime
  arrival time, lives on `extra_state_attributes` for templates and
  the bundled card.
- **Trip cancellations.** `realtimeTripStatus == TRIP_CANCELLED` is
  surfaced as `departures[].is_cancelled`; cancelled rows render
  visually as "Entfällt" with strikethrough on both card and rows.
- **Service-disruption alerts** (XML_ADDINFO_REQUEST). Fetched once on
  a 5-minute domain-wide cadence and sliced per stop. Each entry's
  sensor exposes alerts via the `alerts` attribute; the card renders
  them as a collapsible banner with high-priority items pinned to the
  top.
- **Platinum quality-scale.** Typed coordinator + runtime_data,
  reconfigure flow, repair issues on rate-limit, full translations
  (de + en), diagnostics with defensive redaction.
- **Conservative polling.** 60 s default, 30 s per-entry floor, lock-
  serialised 15 s domain-wide cooldown across every entry + the
  alerts feed. Exponential backoff on consecutive failures (caps at
  30 min) so a sustained outage settles into a slow poll instead of
  hammering the upstream.
- **gzip-compressed responses.** Every outbound call sends
  `Accept-Encoding: gzip`; the EFAController honours it (~7× saving
  on departure responses, similar on the alerts feed).

### Bundled Lovelace card (`linz-linien-austria-card`)

- **Hero block** — large countdown for the next non-cancelled
  departure, MoT-tinted (orange tram, blue U-Bahn, plum bus, grey
  train) with a Live pill and optional Steig (platform) marker on
  one row. Skips cancelled trips when picking the hero so the big
  number always reads as a real ETA.
- **Realtime cue** — small green bullet leading the time on rows
  where realtime data was available (WCAG 1.4.1: redundant cue for
  colour-blind / sunlight-glare users).
- **Trip cancellations** — strikethrough line + direction, "Entfällt"
  label, no platform shown.
- **Line badge** — fixed-width pill, MoT-tinted, with mode icon
  (`mdi:tram`, `mdi:bus`, `mdi:subway-variant`, `mdi:train`).
- **Header** — icon-tile + stop name + direction subtitle. Tile icon
  and accent recolour to match the next departing line's MoT. Maps
  icon-link on the right opens Google Maps for the stop.
- **Service-disruption banner** — collapsible `<details>` with chevron
  affordance. Pre-filtered to alerts whose `affected_lines` overlap a
  line currently visible in the card (post-card-filter). Toggle on/off
  via *Show traffic info* in the editor.
- **Card-side line filter** — chip widget with MDI-iconed chips
  (mode-of-transport icon + line number, MoT-coloured). Click to
  toggle. Custom-value text input for rush-hour-only routes.
- **Per-line walk time (Fußweg)** — drop departures that you couldn't
  catch given your walk to the stop. Per-line minutes input in the
  editor; each line's walk time is independent.
- **Per-line colour override** — pill-style colour picker per line in
  the editor; the chosen colour replaces the MoT default on the
  badge, in the hero accent, and in the header tile when that line
  is the next departure.
- **Optional Steig display** — toggle in the editor; appears in the
  hero subtitle and at the right edge of each row when the upstream
  reports a non-zero platform.
- **Hero-only mode** — `max_departures: 0` renders the hero block
  with no row list below.
- **A11y-first** — `prefers-reduced-motion` catch-all, focus rings,
  ≥44 px touch targets, container queries for narrow column layouts,
  `aria-pressed` on chip toggles, MoT name in row aria-labels for
  screen readers.

## Requirements

- Home Assistant **2025.1** or newer.
- Outbound connectivity to `https://www.linzag.at/static` (the EFA
  endpoint is open and unauthenticated).

## Installation

### HACS (recommended)

1. HACS → **Integrations** → ⋯ → **Custom repositories**.
2. Add `https://github.com/rolandzeiner/linz-linien-austria` as type
   **Integration**.
3. Search for "Linz Linien Austria" and install.
4. Restart Home Assistant.

### Manual

1. Copy `custom_components/linz_linien_austria/` into your HA
   `config/custom_components/`.
2. Restart Home Assistant.

## Setup

1. **Settings → Devices & Services → + Add Integration**.
2. Search for **Linz Linien Austria**.
3. Type part of a stop name (e.g. `Hauptbahnhof`). The flow returns
   matching stops directly from LINZ AG.
4. Pick the stop, set the polling cadence (default 60 s) and how
   many departures to fetch (default 20).
5. The card resource is auto-registered the first time an entry is
   added — if you run Lovelace in YAML mode, add the line manually:
   ```yaml
   resources:
     - url: /linz-linien-austria/linz-linien-austria-card.js
       type: module
   ```

## Data updates

- The EFA Departure Monitor (`XML_DM_REQUEST?outputFormat=JSON`) is
  polled at the configured cadence. The integration enforces a
  30-second per-entry floor and a lock-serialised 15-second
  domain-wide cooldown so parallel entries can't collectively flood
  the upstream.
- Departures are sorted by realtime-corrected arrival before being
  exposed on the sensor — cancelled trips sink to the bottom.
- A successful poll updates the `next_departure` sensor's state (the
  realtime-corrected countdown in minutes) and refreshes the
  `departures` attribute (full upcoming list, capped at 45 entries
  for HA recorder safety).
- Service-disruption alerts (`XML_ADDINFO_REQUEST`) refresh on an
  independent 5-min domain-wide cadence; the cache is shared across
  all entries.
- Every outbound request carries a canonical `User-Agent` of the
  form `HomeAssistant/<ha_ver> linz_linien_austria/<int_ver>` so
  LINZ AG's log parser can identify this integration specifically,
  plus `Accept-Encoding: gzip` for compressed responses.
- All public response strings are passed through unchanged (CC BY
  4.0 attribution shipped on every entity via the standard
  `attribution` state attribute).

## Configuration parameters

### Integration

| Field | Default | Notes |
|---|---|---|
| Stop name (search) | — | Partial match; LINZ AG returns up to 10 candidates. |
| Polling interval | `60` s | Minimum 30 s; 15 s domain-wide cooldown still applies. |
| Departures to fetch | `20` | The upstream fetch size. The integration also fetches some extra headroom so the realtime sort stays stable. The sensor exposes the full sorted result (capped at 45 for the HA recorder). **Raise this value if you use a tight card-side `lines` filter** so the card has enough pre-filter rows to pick from. |
| Lines filter (options) | empty | List of `line:direction` keys. Empty = all. |

### Card

| Field | Default | Notes |
|---|---|---|
| `entity` | required | Pick a `sensor.*_next_departure` from this integration. |
| `name` | (auto) | Optional override for the card heading. |
| `lines` | (none) | Card-side line filter — array of line numbers, e.g. `["2", "45"]`. Empty = no filter. |
| `walk_times` | (none) | Per-line walk time in minutes, e.g. `{"2": 5}`. Departures whose effective countdown is below this value are dropped. |
| `line_colors` | (none) | Per-line colour override, e.g. `{"2": "#1565c0"}`. |
| `show_hero` | `true` | Show the big "next departure" countdown block. |
| `show_platform` | `false` | Show the Steig in the subtitle and at the right edge of each row. |
| `show_alerts` | `true` | Show the collapsible service-disruption banner. |
| `max_departures` | (none) | Cap rendered rows. `0` = hero-only mode. Card-side filters trim BEFORE this cap. |

## Use cases

- "When does the next tram leave?" — show the bare countdown on a
  glance dashboard.
- "Should I leave now?" — automation that sends a notification when a
  specific line is N minutes away.
- "Live departure board" — drop the bundled card next to your weather
  card and you've got a station monitor.

## Lovelace card example

```yaml
type: custom:linz-linien-austria-card
entity: sensor.linz_donau_hauptbahnhof_next_departure
show_hero: true
show_platform: true
max_departures: 8
lines: ["2", "3", "45"]
walk_times:
  "2": 4
  "45": 6
line_colors:
  "2": "#1565c0"
```

## Automation example

```yaml
# Notify when the next tram 2 toward solarCity is 3 minutes out.
trigger:
  - platform: numeric_state
    entity_id: sensor.linz_donau_hauptbahnhof_next_departure
    below: 4
condition:
  - condition: template
    value_template: >-
      {{ state_attr('sensor.linz_donau_hauptbahnhof_next_departure',
                    'next_line') == '2' and
         state_attr('sensor.linz_donau_hauptbahnhof_next_departure',
                    'next_direction') == 'solarCity' }}
action:
  - service: notify.mobile_app_phone
    data:
      title: Tram 2 in {{ states('sensor.linz_donau_hauptbahnhof_next_departure') }} min
      message: Time to head out.
```

## Service-disruption alerts

Active line-info / stop-info notices are fetched from
`XML_ADDINFO_REQUEST` on a domain-wide 5-minute cadence (one shared
request, regardless of how many entries you have). Each
`next_departure` sensor surfaces the alerts whose `affected_lines`
overlap the lines currently serving its stop, plus any system-wide
notices, via the `alerts` state attribute.

The bundled card renders them as a collapsible banner above the
departure list. Click the chevron to expand. The banner is
pre-filtered to alerts that touch a line you'll actually see in the
card (after your `lines` filter), so disruptions for routes you've
narrowed away don't surface.

## Troubleshooting

- **"Cannot connect" during setup.** The EFA endpoint occasionally
  returns 5xx during scheduled maintenance windows. Retry in a
  minute. If it persists, verify connectivity to
  `https://www.linzag.at/static/XML_DM_REQUEST?outputFormat=JSON`.
- **Sensor unavailable, banner says "rate limit hit".** The
  integration has hit the upstream's rate floor — usually because
  too many entries are polling on a tight interval. Raise the scan
  interval in the options flow or remove redundant entries. The
  banner clears automatically on the next successful refresh. The
  coordinator's exponential backoff also widens the polling cadence
  on consecutive failures so a sustained outage doesn't keep
  hammering.
- **Card shows fewer rows than `max_departures`.** Card-side filters
  (`lines`, `walk_times`) trim rows BEFORE the display cap, and the
  integration only fetches `Departures to fetch` rows from upstream.
  Raise the integration's `Departures to fetch` so the card has more
  pre-filter rows to draw from. (Editor helper text spells this out
  in both the lines-filter and max-departures fields.)
- **Card shows "No upcoming departures."** The stop has no scheduled
  service in the next ~2 hours (Linz at 03:00). Confirm via the
  LinzMobil app; if real departures exist there, file a bug with a
  diagnostics download attached.
- **Diagnostics for bug reports.** Settings → Devices & Services →
  Linz Linien Austria → ⋯ → Download diagnostics. Coordinate strings
  are redacted automatically.
- **Debug logs.**
  ```yaml
  # configuration.yaml
  logger:
    default: info
    logs:
      custom_components.linz_linien_austria: debug
  ```

## Known limitations

- The OGD XML mirror at `data.linz.gv.at` no longer surfaces realtime
  data (since Dec 2015). This integration uses the live JSON endpoint
  at `linzag.at/static` which still does — same one the LinzMobil
  app hits. If LINZ AG changes that, realtime would degrade
  gracefully to scheduled-only and the `is_realtime` flag on each
  departure would flip to `false`.
- **Accessibility info not available.** Unlike Wiener Linien (whose
  monitor API publishes a per-departure `barrierFree` boolean), LINZ
  AG LINIEN's EFA `XML_DM_REQUEST` does not expose a low-floor /
  wheelchair-accessibility flag — `attrs[]` on each departure
  carries only an internal trip identifier. If/when the upstream
  starts publishing the flag, this integration will surface it as
  `departures[].barrier_free` automatically.
- **HTTP cache validators not supported.** The Mentz EFAController
  returns `Cache-Control: no-cache`, no `ETag`, no `Last-Modified` —
  `If-Modified-Since` / `If-None-Match` requests come back as 200
  with the full body. We rely on `Accept-Encoding: gzip` instead
  (~87 % saving on departure responses).
- Stop search is fuzzy but case-sensitive on diacritics — type
  `Mühlkreis` not `muhlkreis`.

## Events

This integration does not currently fire HA bus events. State-change
triggers on the sensor itself are sufficient for typical automations.

## Removal

1. **Settings → Devices & Services** → find Linz Linien Austria → ⋯
   → **Delete**.
2. The bundled Lovelace card resource is auto-removed when the
   *last* config entry is deleted.
3. Remove `custom_components/linz_linien_austria/` from the HA
   config (manual installs only; HACS removes it automatically).

## License & attribution

This integration is licensed under [MIT](LICENSE).

Data is sourced from LINZ AG LINIEN's open EFA endpoint, which
carries a CC BY 4.0 attribution requirement. See
[ATTRIBUTION](ATTRIBUTION) for the contractual wording. The
integration emits this string on every sensor via the `attribution`
state attribute, and the bundled card displays it in its footer.

This integration is **not** affiliated with or endorsed by LINZ AG
LINIEN.
