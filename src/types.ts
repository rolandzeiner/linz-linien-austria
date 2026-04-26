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
}
