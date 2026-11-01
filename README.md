# <sub><sub><img src="https://raw.githubusercontent.com/rolandzeiner/linz-linien-austria/main/custom_components/linz_linien_austria/brand/icon.png" width="40" height="40" alt=""></sub></sub> Linz Linien Austria

[![Marketplace](https://img.shields.io/badge/Marketplace-Catalog-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HA min version](https://img.shields.io/badge/Home%20Assistant-%3E%3D2025.1-blue.svg)](https://www.home-assistant.io/)
[![Version](https://img.shields.io/github/v/release/rolandzeiner/linz-linien-austria?label=version&color=blue)](https://github.com/rolandzeiner/linz-linien-austria/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![vibe-coded](https://img.shields.io/badge/vibe-coded-ff69b4?logo=musicbrainz&logoColor=white)](https://en.wikipedia.org/wiki/Vibe_coding)
[![Live demo](https://img.shields.io/badge/live-demo-2196F3.svg)](https://demo.rolandzeiner.at/#linz)

Live departures for any stop in and around Linz, from the [LINZ AG LINIEN](https://www.linzag.at/) timetable service (EFA, the same source the LinzMobil app uses). You get a countdown sensor per stop with realtime delays, cancellations and disruption notices, plus a matching Lovelace card.

## Screenshots

<table>
  <tr>
    <td align="center"><img src="https://raw.githubusercontent.com/rolandzeiner/linz-linien-austria/main/screenshots/card.webp" height="320" alt="Lovelace card" /></td>
    <td align="center"><img src="https://raw.githubusercontent.com/rolandzeiner/linz-linien-austria/main/screenshots/card-config.webp" height="320" alt="Card editor" /></td>
    <td align="center"><img src="https://raw.githubusercontent.com/rolandzeiner/linz-linien-austria/main/screenshots/config-flow.webp" height="320" alt="Config flow" /></td>
  </tr>
  <tr>
    <td align="center"><em>Lovelace card</em></td>
    <td align="center"><em>Card editor</em></td>
    <td align="center"><em>Config flow</em></td>
  </tr>
</table>

## Features

- One entry per stop, found by searching its name. No stop IDs to look up.
- A countdown sensor to the next departure, with realtime delays, cancellations and the full departure list for templates.
- Service-disruption notices for the lines at your stop, shown as a collapsible banner on the card.
- Optional onward stops: the rest of each trip, with a live predicted arrival at every stop.
- A departure-board card with a large next-departure countdown and line badges coloured by mode of transport.
- Card filters per line: which lines, which direction, and your walk time, so departures you can't catch disappear.
- A Repairs notice when the LINZ AG LINIEN departure service is down, so you know the fault isn't on your side.
- The card speaks German and English, reads well in light and dark themes, works by keyboard and respects reduced motion.

## Requirements

- Home Assistant **2025.1.0** or newer.
- Internet access to `https://www.linzag.at/static`. The service is open: no account or API key.

## Installation

### Marketplace (recommended)

The Marketplace is HACS, built into Home Assistant since 2026.11.

1. In Home Assistant, go to **Settings → Marketplace** and search for **Linz Linien Austria**.
2. Select it, then select **Install**. The setup starts right away, no restart needed.

[![Open this repository in the Marketplace of your Home Assistant.](https://my.home-assistant.io/badges/marketplace_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=rolandzeiner&repository=linz-linien-austria&category=integration)

On Home Assistant older than 2026.11, use HACS instead: search for **Linz Linien Austria**, select **Download**, then restart Home Assistant.

### Manual

1. Download `linz_linien_austria.zip` from the [latest release](https://github.com/rolandzeiner/linz-linien-austria/releases/latest).
2. Unpack it into `config/custom_components/linz_linien_austria/`.
3. Restart Home Assistant.

## Setup

[![Open your Home Assistant instance and start setting up a new integration.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=linz_linien_austria)

1. Go to **Settings → Devices & services → Add integration** and search for **Linz Linien Austria**.
2. Type part of a stop name, for example `Hauptbahnhof`.
3. Pick your stop from the matches.
4. Set the polling interval and how many departures to fetch, then select **Submit**.

Add one entry per stop. To change an entry's settings later, use **Reconfigure** (the same three fields as the last step) or the options below.

| Field | Default | Description |
|---|---|---|
| **Stop name** | — | At least two characters. Up to 10 matching stops come back. |
| **Stop** | — | The stop to monitor. Each stop can be added once. |
| **Polling interval (seconds)** | `60` | 30 to 600, in steps of 5. |
| **Departures to fetch** | `20` | 1 to 30. How many departures to ask for per refresh; the integration asks for a few extra so the realtime sort stays complete. Raise it if a tight card filter leaves too few rows. |
| **Show onward stops** | off | Adds each trip's remaining stops with live arrival times. Roughly triples the data per refresh, so the departure list is shortened to 10 while it is on. |

## Options

Open **Settings → Devices & services → Linz Linien Austria → Configure**.

| Field | Default | Description |
|---|---|---|
| **Polling interval (seconds)** | `60` | As in *Setup*. |
| **Departures to fetch** | `20` | As in *Setup*. |
| **Lines to keep (empty = all)** | empty | The lines and directions to keep, listed by destination ("2 → solarCity"). Other departures never reach the sensor. The list fills once the stop has been fetched. |
| **Show onward stops** | off | As in *Setup*. |

## Entities

### Sensor

| Entity | Example | State |
|---|---|---|
| Next departure | `sensor.linz_donau_hauptbahnhof_next_departure` | Minutes until the next departure (device class duration), realtime-corrected where the upstream has realtime data, scheduled otherwise. |

The sensor has no state class, so Home Assistant keeps no long-term statistics for it. Each entry is one device, made by **LINZ AG LINIEN**, model **EFA Echtzeit**.

### Attributes

| Attribute | Description |
|---|---|
| `departures` | Upcoming departures, sorted by realtime arrival with cancelled trips last, at most 45. See the table below. |
| `departures_count` | Number of departures in the list. |
| `next_line`, `next_direction`, `next_mot` | Line, destination and mode of transport of the first departure. |
| `next_delay_minutes`, `next_delay_hint` | Its delay, and the operator's reason when one is published. |
| `next_is_realtime`, `next_is_cancelled` | Whether it is realtime-tracked, and whether it is cancelled (true only when every departure is). |
| `next_scheduled`, `next_realtime` | Its scheduled and predicted departure time (ISO). |
| `next_stop_bay` | Its named bay, for example `Hauptbahnhof (Busterminal)`. |
| `alerts`, `alerts_count` | Disruption notices affecting a line at this stop, plus system-wide notices. |
| `lines_at_stop` | Every line in the stop's current timetable, including night, rush-hour and seasonal lines with nothing due right now. |
| `line_destinations` | The same per direction: `{"2": {"H": "solarCity", "R": "Universität"}}`. A direction appears only if it runs from this stop. |
| `stop_id`, `stop_name`, `resolved_stop` | The configured stop, and the stop as the upstream last returned it. |
| `latitude`, `longitude` | The stop's position, once the first fetch has returned it. |
| `attribution` | `Datenquelle: LINZ AG LINIEN (data.linz.gv.at), CC BY 4.0` |

`departures`, `alerts`, `lines_at_stop`, `line_destinations`, `next_scheduled` and `next_realtime` are not written to the recorder.

Each item in `departures`:

| Key | Description |
|---|---|
| `line`, `direction`, `origin` | Line number, destination and origin. |
| `dir_code` | The operator's direction code, `H` or `R`, defined per line. Missing on replacement services. |
| `mot`, `mot_name` | Mode of transport, as number and name. |
| `countdown`, `countdown_rt` | Minutes until departure: scheduled, and realtime-corrected. |
| `scheduled`, `realtime`, `is_realtime` | Departure times (ISO) and whether a realtime prediction exists. |
| `delay_minutes`, `delay_hint` | Delay and the operator's reason for it. |
| `platform`, `stop_bay`, `operator` | Platform number, named bay and operating company. |
| `is_cancelled`, `trip_status` | Cancellation flag and the upstream's trip status. |
| `stops_ahead` | With **Show onward stops** on: the remaining stops, each with `name`, `stop_id`, `arrival` and `delay_minutes`. |

Each item in `alerts` carries `info_id`, `title`, `description`, `description_html`, `affected_lines`, `info_type`, `priority`, `valid_from`, `valid_to` and `created`.

## Cards

The integration registers the card resource itself. If your dashboards run in YAML mode, add it by hand:

```yaml
resources:
  - url: /linz-linien-austria/linz-linien-austria-card.js
    type: module
```

Minimal card:

```yaml
type: custom:linz-linien-austria-card
entity: sensor.linz_donau_hauptbahnhof_next_departure
```

| Option | Default | Description |
|---|---|---|
| `entity` | required | A `sensor.*_next_departure` from this integration. |
| `name` | stop name | Card heading. |
| `lines` | all | Lines to show, for example `["2", "45"]`. |
| `line_directions` | both | One direction per line, for example `{"2": "H"}`. The editor labels each button with its destination. Departures without a direction code always show. |
| `walk_times` | none | Your walk to the stop in minutes per line, for example `{"2": 5}`. Departures you can't reach in time are hidden. |
| `line_colors` | mode colour | Badge colour per line, for example `{"2": "#1565c0"}`. |
| `max_departures` | all | Rows to show. `0` shows only the next-departure block. Filters apply first. |
| `show_hero` | `true` | Show the large next-departure countdown. |
| `show_platform` | `false` | Show the platform (Steig, or Gleis for trains). |
| `show_absolute_time` | `false` | Show the departure time next to the countdown. |
| `show_delay_colors` | `true` | Colour times red when late and blue when early. Cancelled trips stay red. |
| `show_alerts` | `true` | Show the disruption banner, limited to lines visible on the card. |
| `hide_header` | `false` | Hide the stop name and icon row. |
| `pulse_live` | `true` | Pulse the realtime dot. Reduced motion turns it off. |
| `enable_animations` | `false` | Fade the card in and animate colour changes. |

With **Show onward stops** on, select a departure (or press Enter or Space on it) to unfold the rest of its trip.

## Data updates

- Each stop is polled at its polling interval (see *Setup*). All entries share one 15-second cooldown, so stops are fetched one after another, never at once.
- After a second failed poll in a row, the interval doubles on every further failure, up to 30 minutes. The first successful poll restores your interval.
- After 10 minutes of errors from the departure service, a Repairs issue says the fault is on LINZ AG LINIEN's side. It clears itself once departures return. A rate-limit reply raises its own Repairs issue.
- Disruption notices are fetched every 5 minutes in one request for all stops. If that fails, the notices already shown stay, and the wait between tries doubles from the second failure, up to 30 minutes.
- Saving options or editing a dashboard triggers at most one extra refresh per 15 seconds.
- Responses arrive gzip-compressed. Requests identify themselves as `HomeAssistant/<version> linz_linien_austria/<version>`.

## Examples

- Show the countdown on a glance dashboard: "when does the next tram leave?"
- Get a notification when your line is a few minutes away, so you leave on time.
- Put the card next to your weather card as a departure board by the door.
- Get told when a disruption notice affects the line you take to work.

Notify when tram 2 towards solarCity is less than 4 minutes away:

```yaml
triggers:
  - trigger: numeric_state
    entity_id: sensor.linz_donau_hauptbahnhof_next_departure
    below: 4
conditions:
  - condition: template
    value_template: >-
      {{ state_attr('sensor.linz_donau_hauptbahnhof_next_departure', 'next_line') == '2'
         and state_attr('sensor.linz_donau_hauptbahnhof_next_departure', 'next_direction') == 'solarCity' }}
actions:
  - action: notify.mobile_app_phone
    data:
      title: "Tram 2 in {{ states('sensor.linz_donau_hauptbahnhof_next_departure') }} min"
      message: Time to head out.
```

<details>
<summary>Notify when a disruption notice affects line 2</summary>

```yaml
triggers:
  - trigger: state
    entity_id: sensor.linz_donau_hauptbahnhof_next_departure
    attribute: alerts_count
conditions:
  - condition: template
    value_template: >-
      {{ state_attr('sensor.linz_donau_hauptbahnhof_next_departure', 'alerts')
         | selectattr('affected_lines', 'contains', '2') | list | count > 0 }}
actions:
  - action: notify.mobile_app_phone
    data:
      title: Line 2 disruption
      message: >-
        {{ (state_attr('sensor.linz_donau_hauptbahnhof_next_departure', 'alerts')
            | selectattr('affected_lines', 'contains', '2') | first).title }}
```

</details>

<details>
<summary>A card with filters, walk times and a custom line colour</summary>

```yaml
type: custom:linz-linien-austria-card
entity: sensor.linz_donau_hauptbahnhof_next_departure
show_platform: true
show_absolute_time: true
max_departures: 8
lines: ["2", "3", "45"]
line_directions:
  "2": "H"
walk_times:
  "2": 4
  "45": 6
line_colors:
  "2": "#1565c0"
```

</details>

## Known limitations

- An entry covers one stop. To monitor a different stop, add a new entry; **Reconfigure** can't change the stop.
- Every stop is a request of its own, since the service can't return several stops at once. With the shared 15-second cooldown, four or more stops at the default interval are polled less often than you set; raise the interval to match.
- `departures` holds at most 45 entries. At a busy stop like Hauptbahnhof that covers only a few minutes.
- With **Show onward stops** on, at most 10 departures are fetched.
- Realtime data, delay reasons and named bays appear only where LINZ AG LINIEN publishes them. Other departures show scheduled times.
- Replacement services carry no direction code, so the card's direction filter always shows them.

## Troubleshooting

- **"Could not reach LINZ AG LINIEN" during setup.** The service sometimes fails during maintenance. Try again in a minute; if it persists, check that Home Assistant can reach `https://www.linzag.at/static`.
- **Repairs shows "Linz Linien Austria rate limit hit".** Too many entries poll too often. Raise the polling interval or remove stops you don't need. The issue clears after the next successful poll.
- **Sensors appear one after another after a restart.** Each stop's first poll waits its turn behind the shared 15-second cooldown, so the third stop lands about 30 seconds in. Only the first round is staggered.
- **The card shows "Can't reach LINZ AG LINIEN".** The last poll failed, or none has worked since Home Assistant started. If **Settings → Repairs** has the outage issue, the fault is upstream and departures return on their own. If not, check your Home Assistant host's internet connection.
- **The card shows fewer rows than `max_departures`.** Card filters remove rows before the limit applies, and the sensor holds only what **Departures to fetch** asked for. Raise **Departures to fetch**.
- **The direction filter still shows the other direction.** Those rows carry no direction code (replacement services). The filter is per line: a direction set on the 2 doesn't affect the 46.
- **The line filter looks empty after an update from a version before 0.7.0.** The filter is migrated on update. If LINZ AG LINIEN was unreachable then, it finishes on the next successful poll. A line whose destination has changed since can't be matched and is dropped (the log says which); select it again under **Options**.
- **The card shows "No upcoming departures".** Nothing is scheduled at the stop soon (Linz at 03:00). If the LinzMobil app shows departures, open an issue and attach diagnostics.

To download diagnostics, go to **Settings → Devices & services → Linz Linien Austria**, open the entry's ⋮ menu and select **Download diagnostics**. Stop coordinates are redacted.

To turn on debug logging, add this to `configuration.yaml` and restart:

```yaml
logger:
  logs:
    custom_components.linz_linien_austria: debug
```

## Removal

1. Go to **Settings → Devices & services → Linz Linien Austria**, open each entry's ⋮ menu and select **Delete**. Deleting the last entry also removes the card resource.
2. In **Settings → Marketplace**, open **Linz Linien Austria**, then ⋮ → **Uninstall**. If an entry is still set up, the Marketplace offers **Delete and uninstall**, and a Repairs issue asks you to restart.

On Home Assistant older than 2026.11, remove it in HACS instead and restart. For a manual install, delete `config/custom_components/linz_linien_austria/` and restart.

## Attribution

Departure, stop and disruption data: LINZ AG LINIEN GmbH, [Elektronische Fahrplanauskunft der LINZ AG LINIEN](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The sensor carries `Datenquelle: LINZ AG LINIEN (data.linz.gv.at), CC BY 4.0` in its `attribution` attribute, and the card shows it in its footer. Full wording: [ATTRIBUTION](https://github.com/rolandzeiner/linz-linien-austria/blob/main/ATTRIBUTION).

Icon: Font Awesome Free, CC BY 4.0.

## License

MIT, see [LICENSE](https://github.com/rolandzeiner/linz-linien-austria/blob/main/LICENSE).

Development setup and the verification gate: [CONTRIBUTING.md](https://github.com/rolandzeiner/linz-linien-austria/blob/main/CONTRIBUTING.md).

## Disclaimer

This integration is not affiliated with or endorsed by LINZ AG LINIEN GmbH. Departure, stop and disruption data comes from the [LINZ AG LINIEN timetable service](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/) under CC BY 4.0. **Departures, delays and cancellations can change at short notice; check the display at the stop or the LinzMobil app before you rely on a connection.** The developer assumes no liability for the accuracy, completeness or timeliness of the displayed data. Use at your own risk.

---

Diese Integration steht in keiner Verbindung zur LINZ AG LINIEN GmbH und wird von ihr nicht unterstützt. Abfahrts-, Haltestellen- und Störungsdaten stammen von der [Fahrplanauskunft der LINZ AG LINIEN](https://data.linz.gv.at/katalog/linz_ag/linz_ag_linien/) und stehen unter CC BY 4.0. **Abfahrten, Verspätungen und Ausfälle können sich kurzfristig ändern; prüf die Anzeige an der Haltestelle oder die LinzMobil-App, bevor du dich auf eine Verbindung verlässt.** Für die Richtigkeit, Vollständigkeit und Aktualität der angezeigten Daten wird keine Haftung übernommen. Nutzung auf eigene Verantwortung.
