# Linz Linien Austria

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![HA min version](https://img.shields.io/badge/Home%20Assistant-%3E%3D2025.1-blue.svg)](https://www.home-assistant.io/)
[![Quality Scale](https://img.shields.io/badge/quality%20scale-platinum-e5e4e2.svg)](https://developers.home-assistant.io/docs/core/integration-quality-scale/)

Live LINZ AG LINIEN departure monitor for Home Assistant — with a
matching Lit 3 Lovelace card. Polls the same EFA (Elektronische
Fahrplanauskunft) endpoint the official LinzMobil app uses, including
realtime delays where the upstream provides them.

## Features

- One config entry per stop. Add as many as you like.
- Search-by-name config flow — no hunting for stop IDs.
- Realtime-aware countdown sensor (`SensorDeviceClass.DURATION`,
  unit minutes), with the full upcoming departure list as
  `extra_state_attributes` for templates and the bundled card.
- Optional line filter (e.g. only tram 2 toward solarCity).
- Bundled Lovelace card (`linz-linien-austria-card`) — registered
  automatically; reload-banner-safe versioning.
- Platinum quality-scale: typed coordinator, runtime_data,
  reconfigure flow, repair issues on rate-limit, full translations
  (de + en), diagnostics with defensive redaction.
- Conservative polling defaults (60 s, 30 s floor, 15 s domain-wide
  cooldown across multiple entries) so multi-stop installs don't
  collectively flood the upstream.

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
   many departures to surface (default 12).
5. The card resource is auto-registered the first time an entry is
   added — if you run Lovelace in YAML mode, add the line manually:
   ```yaml
   resources:
     - url: /linz-linien-austria/linz-linien-austria-card.js
       type: module
   ```

## Data Updates

- The EFA Departure Monitor (`XML_DM_REQUEST?outputFormat=JSON`) is
  polled at the configured cadence. The integration enforces a 30-second
  per-entry floor and an additional 15-second domain-wide cooldown so
  parallel entries can't collectively flood the upstream.
- A successful poll updates the `next_departure` sensor's state (the
  realtime-corrected countdown in minutes) and refreshes the
  `departures` attribute (full upcoming list).
- Every outbound request carries a `User-Agent` of the form
  `HomeAssistant/<ha_ver> linz_linien_austria/<int_ver>` so LINZ AG's
  log parser can identify this integration specifically.
- All public response strings are passed through unchanged (CC BY 4.0
  attribution shipped on every entity via the standard `attribution`
  state attribute).

## Configuration parameters

| Field | Default | Notes |
|---|---|---|
| Stop name (search) | — | Partial match; LINZ AG returns up to 10 candidates. |
| Polling interval | `60` s | Minimum 30 s; 15 s domain-wide cooldown still applies. |
| Departures to fetch | `12` | EFA returns up to ~40; we cap at 30 in the attribute. |
| Lines filter (options) | empty | List of `line:direction` keys (e.g. `2:solarCity`). Empty = all. |

## Use cases

- "When does the next tram leave?" — show the bare countdown on a
  glance dashboard.
- "Should I leave now?" — automation that sends a notification when a
  specific line is N minutes away.
- "Live departure board" — drop the bundled card next to your weather
  card and you've got a station monitor.

## Lovelace card

```yaml
type: custom:linz-linien-austria-card
entity: sensor.linz_donau_hauptbahnhof_next_departure
show_hero: true
max_departures: 8
```

The card consumes the sensor's `departures` attribute directly. It
honours the user's HA language setting (de/en out of the box), uses
container queries for narrow column layouts, ships WCAG 2.2 A+AA
patterns (focus rings, reduced-motion catch-all, ≥44 px touch
targets), and tints the line badge per Mentz mode-of-transport id
(tram / bus / U-Bahn / etc.).

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

## Troubleshooting

- **"Cannot connect" during setup.** The EFA endpoint occasionally
  returns 5xx during scheduled maintenance windows. Retry in a minute.
  If it persists, verify connectivity to
  `https://www.linzag.at/static/XML_DM_REQUEST?outputFormat=JSON`.
- **Sensor unavailable, banner says "rate limit hit".** The integration
  has hit the upstream's rate floor — usually because too many entries
  are polling on a tight interval. Raise the scan interval in the
  options flow or remove redundant entries. The banner clears
  automatically on the next successful refresh.
- **Card shows "No upcoming departures."** The stop has no scheduled
  service in the next ~2 hours (Linz at 03:00). Confirm via the
  LinzMobil app; if real departures exist there, file a bug with a
  diagnostics download attached.
- **Diagnostics for bug reports.** Settings → Devices & Services →
  Linz Linien Austria → ⋯ → Download diagnostics. Coordinate strings
  and the rate-limit canary are redacted automatically.
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
  at `linzag.at/static` which still does — same one the LinzMobil app
  hits. If LINZ AG changes that, realtime would degrade gracefully to
  scheduled-only and the `is_realtime` flag on each departure would
  flip to `false`.
- **Accessibility info not available.** Unlike Wiener Linien (whose
  monitor API publishes a per-departure `barrierFree` boolean), LINZ
  AG LINIEN's EFA `XML_DM_REQUEST` does not expose a low-floor /
  wheelchair-accessibility flag — `attrs[]` on each departure carries
  only an internal trip identifier. If/when the upstream starts
  publishing the flag, this integration will surface it as
  `departures[].barrier_free` automatically.
- Stop search is fuzzy but case-sensitive on diacritics — type
  `Mühlkreis` not `muhlkreis`.

## Service-disruption alerts

Active line-info / stop-info notices are fetched from
`XML_ADDINFO_REQUEST` on a domain-wide 5-minute cadence (one shared
request, regardless of how many entries you have). Each
`next_departure` sensor surfaces the alerts whose `affected_lines`
overlap the lines currently serving its stop, plus any system-wide
notices, via the `alerts` state attribute. The bundled card renders
them as a collapsible banner above the departure list.

The `is_cancelled` flag on a departure is derived from the EFA
`realtimeTripStatus` enum (set when upstream reports
`TRIP_CANCELLED`). Cancelled rows are visually struck through and
labelled "Entfällt" / "Cancelled" instead of a countdown.

## Events

This integration does not currently fire HA bus events. State-change
triggers on the sensor itself are sufficient for typical automations.

## Removal

1. **Settings → Devices & Services** → find Linz Linien Austria → ⋯ →
   **Delete**.
2. The bundled Lovelace card resource is auto-removed when the *last*
   config entry is deleted.
3. Remove `custom_components/linz_linien_austria/` from the HA config
   (manual installs only; HACS removes it automatically).

## License & attribution

This integration is licensed under [MIT](LICENSE).

Data is sourced from LINZ AG LINIEN's open EFA endpoint, which carries
a CC BY 4.0 attribution requirement. See [ATTRIBUTION](ATTRIBUTION) for
the contractual wording. The integration emits this string on every
sensor via the `attribution` state attribute, and the bundled card
displays it in its footer.

This integration is **not** affiliated with or endorsed by LINZ AG
LINIEN.
