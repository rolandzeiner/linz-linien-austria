import type {
  HomeAssistant,
  LovelaceCard,
  LovelaceCardConfig,
  LovelaceCardEditor,
} from "custom-card-helpers";

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
   *  (already capped at 30). Useful for narrow column layouts. */
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
}
