import { LitElement, html, TemplateResult, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  HomeAssistant,
  fireEvent,
  LovelaceCardEditor,
} from "custom-card-helpers";

import type { HaFormSchema, LinzLinienAustriaCardConfig } from "./types";
import { editorStyles } from "./styles";
import { localize } from "./localize/localize";

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

  /** Pin the integration filter on the entity selector so users only see
   *  the next-departure sensors created by this integration — no risk of
   *  picking an unrelated `sensor.*` and getting a confusing card. */
  private _schema(): ReadonlyArray<HaFormSchema> {
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
    ];
  }

  private _computeLabel = (field: { name: string }): string => {
    const key = `editor.${field.name}`;
    const localised = localize(key);
    return localised === key ? field.name : localised;
  };

  private _computeHelper = (field: { name: string }): string | undefined => {
    const key = `editor.${field.name}_helper`;
    const localised = localize(key);
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
