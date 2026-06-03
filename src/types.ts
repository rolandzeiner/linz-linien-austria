// Local mirror of the HA / Lovelace types this card actually uses.
// We only depend on a handful of fields, so pinning a local shape is
// cheaper than carrying a transitive npm dep that drifts behind
// HA-internal types.

/** Single entity in `hass.states`. The attributes bag is open-ended —
 *  the integration's coordinator emits the keys this card reads
 *  (`departures`, `stop_id`, `attribution`, …). */
export interface HassEntity {
  state: string;
  attributes: Record<string, unknown> & {
    friendly_name?: string;
    attribution?: string;
    departures?: unknown;
    stop_id?: string | number;
    /** Canonical stop label from the EFA upstream — used for the card
     *  title and the Google Maps query. */
    stop_name?: string;
    alerts?: unknown;
    /** Persistent union of every line label the integration has
     *  observed at this stop. Surfaced so the card editor's line-filter
     *  picker can offer rush-hour / seasonal lines that aren't in the
     *  current departure window. Empty list while the integration has
     *  never seen a departure (fresh install before first refresh). */
    lines_at_stop?: unknown;
  };
  last_changed?: string;
  last_updated?: string;
  entity_id?: string;
}

/** Minimal HA shape — only the fields this card touches. `language` is
 *  the user-profile locale; `callWS` powers the card-version probe;
 *  `localize` is HA's own UI translation lookup (the editor reuses it
 *  for built-in field names so we don't carry duplicates); `themes.darkMode`
 *  would drive future adaptive-logo work. Anything beyond these lives
 *  untyped and is read with a cast at the call site. */
export interface HomeAssistant {
  states: Record<string, HassEntity>;
  /** Entity registry, keyed by entity_id. The card-picker's
   *  `getEntitySuggestion` reads `platform` to suggest only entities
   *  owned by this integration. */
  entities?: Record<string, { platform?: string } & Record<string, unknown>>;
  language?: string;
  themes?: { darkMode?: boolean } & Record<string, unknown>;
  config?: { time_zone?: string } & Record<string, unknown>;
  localize?: (key: string, ...args: unknown[]) => string;
  callWS?<T = unknown>(msg: { type: string; [key: string]: unknown }): Promise<T>;
}

/** Marker every card config extends. */
export interface LovelaceCardConfig {
  type: string;
  [key: string]: unknown;
}

/** Custom-card editor contract — Lovelace expects an HTMLElement that
 *  accepts `setConfig(config)` and reads `hass`. */
export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: LovelaceCardConfig): void;
}

/** `LovelaceCard` is only referenced as the `hui-error-card` tag-map
 *  entry below, so an HTMLElement alias suffices. */
export type LovelaceCard = HTMLElement;

/** `bubbles: true` + `composed: true` are required so the event crosses
 *  the editor's shadow boundary and reaches the dashboard's
 *  card-editor listener. */
export function fireEvent<T>(
  node: HTMLElement,
  type: string,
  detail: T,
): void {
  node.dispatchEvent(
    new CustomEvent(type, { detail, bubbles: true, composed: true }),
  );
}

declare global {
  interface HTMLElementTagNameMap {
    "linz-linien-austria-card-editor": LovelaceCardEditor;
    "hui-error-card": LovelaceCard;
    "ha-form": HaFormElement;
    "ha-selector": HaSelectorElement;
  }
}

interface HaFormElement extends HTMLElement {
  hass?: HomeAssistant;
  data?: Record<string, unknown>;
  schema?: ReadonlyArray<HaFormSchema>;
  computeLabel?: (field: { name: string }) => string;
  computeHelper?: (field: { name: string }) => string | undefined;
}

interface HaSelectorElement extends HTMLElement {
  hass?: HomeAssistant;
  selector?: HASelector;
  value?: unknown;
  label?: string;
  required?: boolean;
}

export type HASelector =
  | { entity: { domain?: string | string[]; integration?: string; multiple?: boolean } }
  | { area: { multiple?: boolean } }
  | { device: { integration?: string; multiple?: boolean } }
  | { boolean: Record<string, never> }
  | { text: { type?: "text" | "password" | "url" | "email"; multiline?: boolean } }
  | {
      number: {
        min?: number;
        max?: number;
        step?: number;
        mode?: "box" | "slider";
        unit_of_measurement?: string;
      };
    }
  | {
      select: {
        mode?: "dropdown" | "list";
        multiple?: boolean;
        custom_value?: boolean;
        options: ReadonlyArray<{ value: string; label: string }>;
      };
    }
  | { color_rgb: Record<string, never> }
  | { icon: Record<string, never> };

export interface HaFormBaseSchema {
  name: string;
  required?: boolean;
}
export interface HaFormSelectorSchema extends HaFormBaseSchema {
  selector: HASelector;
}
export interface HaFormGridSchema {
  type: "grid";
  name: "";
  schema: ReadonlyArray<HaFormSchema>;
}
export interface HaFormExpandableSchema {
  type: "expandable";
  name: string;
  title?: string;
  /** When true, ha-form keeps the inner schema's values flat in
   *  `data` (i.e. `data.show_hero` rather than `data.display.show_hero`).
   *  Required for cards whose render() reads flat config keys —
   *  forgetting it silently leaves every flag at its default. */
  flatten?: boolean;
  schema: ReadonlyArray<HaFormSchema>;
}
export type HaFormSchema =
  | HaFormSelectorSchema
  | HaFormGridSchema
  | HaFormExpandableSchema;

/** A single normalised departure as surfaced in sensor attributes by the
 *  Python coordinator. Optional fields are dropped when not present in
 *  the upstream payload — see api.py::_normalise_departure. */
export interface Departure {
  line: string;
  direction: string;
  origin?: string;
  platform?: string;
  mot?: number;
  mot_name?: string;
  countdown?: number;
  countdown_rt?: number;
  delay_minutes?: number;
  scheduled?: string;
  realtime?: string;
  is_realtime?: boolean;
  is_cancelled?: boolean;
  trip_status?: string;
}

/** One service-disruption / line-info notice as published by LINZ AG
 *  LINIEN's XML_ADDINFO_REQUEST endpoint, normalised by the integration's
 *  `alerts.py`. Plain-text `description` is stripped of HTML; the
 *  `description_html` is kept verbatim if a future card variant wants
 *  to render it. */
export interface AlertInfo {
  info_id: string;
  title: string;
  description: string;
  description_html: string;
  affected_lines: string[];
  info_type: string;
  priority: string;
  valid_from?: string | null;
  valid_to?: string | null;
  created?: string | null;
}

/** The card config saved into `_config`. `entity` is the only required
 *  field and must point at a `sensor.*_next_departure` entity produced
 *  by this integration. */
export interface LinzLinienAustriaCardConfig extends LovelaceCardConfig {
  type: string;
  /** Sensor entity. Required. */
  entity?: string;
  /** Optional override for the card title. Defaults to the entity's
   *  friendly_name (i.e. the configured stop name). */
  name?: string;
  /** Whether to render the big "next departure" hero block. Defaults true. */
  show_hero?: boolean;
  /** Cap the rendered list. Defaults to whatever the integration delivers
   *  (the `departures` attribute, capped at 45 — MAX_DEPARTURES_IN_ATTRS
   *  in const.py). Useful for narrow column layouts. */
  max_departures?: number;
  /** Card-side filter: only render departures whose ``line`` is in this
   *  set. Empty / missing means "show every line". This is independent
   *  of the integration's options-flow line filter — that one trims the
   *  upstream payload, this one trims what the card displays from
   *  whatever the sensor publishes. */
  lines?: string[];
  /** When true, surface the platform / bay number in the header
   *  subtitle and at the trailing edge of each departure row. Useful
   *  at multi-platform stops (Hauptbahnhof, Bulgariplatz). Defaults
   *  off so single-platform stops stay clutter-free. */
  show_platform?: boolean;
  /** When false, hide the collapsible service-disruption banner
   *  (XML_ADDINFO_REQUEST data) above the departure list. Defaults
   *  true — alerts are user-facing operational info and disabling
   *  them is the unusual case. */
  show_alerts?: boolean;
  /** Walk time (Fußweg) to the stop, per line, in minutes. Departures
   *  whose effective countdown is less than this value are dropped from
   *  the visible list — the user couldn't catch them anyway. Keyed by
   *  the line number string ("2", "45", "191"); a missing or zero
   *  entry means "no walk-time filter for that line". */
  walk_times?: Record<string, number>;
  /** Per-line badge colour override, keyed by line number string. The
   *  value is any CSS colour string (typically a `#rrggbb` hex). When
   *  set, replaces the default mode-of-transport tint on both the
   *  badge and (for the next departure's line) the header / hero
   *  accent. Missing entries fall back to the MoT default. */
  line_colors?: Record<string, string>;
  /** Subtle pulse animation on the green "Live" bullet that
   *  prefixes realtime-corrected times. Defaults true. Set false
   *  for users who find motion distracting (the prefers-reduced-
   *  motion catch-all already suppresses it system-side; this is
   *  the opt-out for users who haven't set the OS preference but
   *  still want a static dot). */
  pulse_live?: boolean;
  /** Master CSS-animation toggle. Defaults OFF. When on, adds a
   *  one-shot card-mount fade-in plus longer-duration transitions
   *  on colour / background changes (line-badge recolour as MoT
   *  rotates, hero accent shift, row-time late/early/now state
   *  changes). Static feel by default; opt-in for a more lively
   *  card. ``prefers-reduced-motion`` overrides regardless. */
  enable_animations?: boolean;
  /** Hide the card header (icon-tile + stop name + subtitle + maps link).
   *  Defaults to false (header shown). Useful for stripped-down dashboards
   *  where the user only wants the hero + departure rows. */
  hide_header?: boolean;
}
