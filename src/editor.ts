import { LitElement, html, TemplateResult, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  HomeAssistant,
  fireEvent,
  LovelaceCardEditor,
} from "custom-card-helpers";

import type {
  Departure,
  HaFormSchema,
  LinzLinienAustriaCardConfig,
} from "./types";
import { editorStyles } from "./styles";
import { translate } from "./localize/localize";

@customElement("linz-linien-austria-card-editor")
export class LinzLinienAustriaCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config: LinzLinienAustriaCardConfig = {
    type: "linz-linien-austria-card",
  };

  public setConfig(config: LinzLinienAustriaCardConfig): void {
    this._config = { ...config };
  }

  /** Build the available-lines option list from the picked entity's
   *  live `departures` attribute. Sorted natural-numerically (so "2"
   *  comes before "10") with case-insensitive tiebreaker for letter
   *  lines (e.g. "L161" / "S2"). Falls back to whatever the user
   *  already configured if no entity is picked yet. */
  private _availableLines(): string[] {
    const seen = new Set<string>();
    const entityId = this._config.entity;
    if (entityId && this.hass) {
      const stateObj = this.hass.states[entityId];
      const deps = stateObj?.attributes?.departures as
        | Departure[]
        | undefined;
      if (Array.isArray(deps)) {
        for (const d of deps) {
          if (d.line) seen.add(d.line);
        }
      }
    }
    // Always include any lines the user already configured but that
    // happen to not be in the live snapshot (rush-hour-only routes,
    // etc.) so the dropdown shows them as already-selected.
    for (const l of this._config.lines ?? []) {
      if (l) seen.add(l);
    }
    return Array.from(seen).sort((a, b) => {
      const an = parseInt(a, 10);
      const bn = parseInt(b, 10);
      if (!Number.isNaN(an) && !Number.isNaN(bn) && an !== bn) {
        return an - bn;
      }
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }

  /** Pin the integration filter on the entity selector so users only see
   *  the next-departure sensors created by this integration — no risk of
   *  picking an unrelated `sensor.*` and getting a confusing card. */
  private _schema(): ReadonlyArray<HaFormSchema> {
    const lineOptions = this._availableLines().map((l) => ({
      value: l,
      label: l,
    }));
    return [
      {
        name: "entity",
        required: true,
        selector: {
          entity: { domain: "sensor", integration: "linz_linien_austria" },
        },
      },
      { name: "name", selector: { text: {} } },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "show_hero", selector: { boolean: {} } },
          {
            name: "max_departures",
            selector: { number: { min: 1, max: 30, step: 1, mode: "box" } },
          },
        ],
      },
      {
        name: "lines",
        // `custom_value: true` lets the user type a line number that's
        // not in the upstream's current snapshot (rush-only routes,
        // typo-free additions before service starts).
        selector: {
          select: {
            multiple: true,
            custom_value: true,
            mode: "dropdown",
            options: lineOptions,
          },
        },
      },
    ];
  }

  private _computeLabel = (field: { name: string }): string => {
    const key = `editor.${field.name}`;
    const localised = translate(key, {
      hassLanguage: this.hass?.language,
    });
    return localised === key ? field.name : localised;
  };

  private _computeHelper = (field: { name: string }): string | undefined => {
    const key = `editor.${field.name}_helper`;
    const localised = translate(key, {
      hassLanguage: this.hass?.language,
    });
    return localised === key ? undefined : localised;
  };

  private _onFormChanged = (
    ev: CustomEvent<{ value: LinzLinienAustriaCardConfig }>,
  ): void => {
    const next = { ...ev.detail.value };
    this._config = next;
    fireEvent(this, "config-changed", { config: next });
  };

  protected render(): TemplateResult {
    return html`
      <div class="editor">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${this._schema()}
          .computeLabel=${this._computeLabel}
          .computeHelper=${this._computeHelper}
          @value-changed=${this._onFormChanged}
        ></ha-form>
      </div>
    `;
  }

  static styles: CSSResultGroup = editorStyles;
}
