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

  /** Lines available for the picker dropdown — drawn from the picked
   *  entity's live ``departures`` attribute, plus any line the user
   *  already configured. Sorted natural-numerically with case-
   *  insensitive tiebreaker. */
  private _allKnownLines(): string[] {
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
    for (const l of this._config.lines ?? []) {
      if (l) seen.add(l);
    }
    return this._sortLines(Array.from(seen));
  }

  /** Lines surfaced in the per-line walk-time / colour widgets. When
   *  the user has set a card-side ``lines`` filter, those are the
   *  ONLY lines the card will display, so showing colour controls for
   *  lines the user explicitly excluded is just clutter. Without a
   *  filter, fall back to every known line. */
  private _availableLines(): string[] {
    const filterLines = (this._config.lines ?? [])
      .map((l) => l.trim())
      .filter(Boolean);
    if (filterLines.length > 0) {
      return this._sortLines(filterLines);
    }
    return this._allKnownLines();
  }

  private _sortLines(lines: string[]): string[] {
    return Array.from(new Set(lines)).sort((a, b) => {
      const an = parseInt(a, 10);
      const bn = parseInt(b, 10);
      if (!Number.isNaN(an) && !Number.isNaN(bn) && an !== bn) {
        return an - bn;
      }
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }

  /** Look up the mode-of-transport id the upstream reported for a
   *  given line (e.g. "2" → 4 for tram, "17" → 5 for bus). Falls
   *  back to ``undefined`` when the live snapshot doesn't contain
   *  the line yet — the colour picker uses the orange Linz default
   *  in that case. */
  private _motForLine(line: string): number | undefined {
    const entityId = this._config.entity;
    if (!entityId || !this.hass) return undefined;
    const stateObj = this.hass.states[entityId];
    const deps = stateObj?.attributes?.departures as
      | Departure[]
      | undefined;
    if (!Array.isArray(deps)) return undefined;
    for (const d of deps) {
      if (d.line === line && typeof d.mot === "number") {
        return d.mot;
      }
    }
    return undefined;
  }

  /** Default badge colour for a given line, derived from its
   *  mode-of-transport. Same table as the card's ``motColor`` —
   *  duplicated here to keep the editor independent of the card's
   *  internal helpers (single import surface, ~5 LOC duplication
   *  not worth a shared utility). Returns a hex string the
   *  ``<input type="color">`` understands directly. */
  private _defaultColorForLine(line: string): string {
    const mot = this._motForLine(line);
    if (mot === 0 || mot === 1) return "#455a64"; // train / S-Bahn
    if (mot === 2) return "#1565c0"; // U-Bahn
    if (mot === 5 || mot === 6 || mot === 7) return "#6a1b9a"; // bus
    return "#f08000"; // tram default + everything else
  }

  /** MDI icon for a given line, derived from its mode-of-transport.
   *  Same table as the card's MOT_ICON, kept in sync by hand. */
  private _iconForLine(line: string): string {
    const mot = this._motForLine(line);
    if (mot === 0 || mot === 1) return "mdi:train";
    if (mot === 2) return "mdi:subway-variant";
    if (mot === 3 || mot === 4) return "mdi:tram";
    if (mot === 5 || mot === 6) return "mdi:bus";
    if (mot === 7) return "mdi:bus-clock";
    if (mot === 8) return "mdi:gondola";
    if (mot === 9) return "mdi:ferry";
    if (mot === 10) return "mdi:bus-multiple";
    return "mdi:tram";
  }

  /** Toggle a line in the ``lines`` config field. Drops the field
   *  entirely when the toggle empties the list — keeps the saved
   *  config tidy. */
  private _toggleLine(line: string): void {
    const current = new Set(this._config.lines ?? []);
    if (current.has(line)) {
      current.delete(line);
    } else {
      current.add(line);
    }
    const next = { ...this._config };
    if (current.size === 0) {
      delete next.lines;
    } else {
      next.lines = this._sortLines(Array.from(current));
    }
    this._config = next;
    fireEvent(this, "config-changed", { config: next });
  }

  private _onCustomLineSubmit(input: HTMLInputElement): void {
    const raw = input.value.trim();
    if (!raw) return;
    const current = new Set(this._config.lines ?? []);
    current.add(raw);
    const next = {
      ...this._config,
      lines: this._sortLines(Array.from(current)),
    };
    input.value = "";
    this._config = next;
    fireEvent(this, "config-changed", { config: next });
  }

  /** Render the line-filter chip section. One chip per known line,
   *  plus any user-configured custom values that aren't currently in
   *  the live snapshot. Selected chips fill in the line's MoT colour;
   *  unselected stay outlined. Custom-value escape hatch sits below
   *  for rush-hour-only routes that don't appear in today's data. */
  private _renderLinesFilter(): TemplateResult {
    const known = this._allKnownLines();
    const selected = new Set(this._config.lines ?? []);
    return html`
      <div class="editor-section">
        <div class="section-header">
          ${translate("editor.lines", {
            hassLanguage: this.hass?.language,
          })}
        </div>
        <div class="editor-hint">
          ${translate("editor.lines_helper", {
            hassLanguage: this.hass?.language,
          })}
        </div>
        ${known.length === 0
          ? html`<div class="editor-hint">
              ${translate("editor.per_line_no_data", {
                hassLanguage: this.hass?.language,
              })}
            </div>`
          : html`<div class="line-chip-grid">
              ${known.map((line) => {
                const colour = this._defaultColorForLine(line);
                const icon = this._iconForLine(line);
                const isSelected = selected.has(line);
                return html`
                  <button
                    type="button"
                    class=${`line-chip${isSelected ? " is-selected" : ""}`}
                    style=${`--chip-color: ${colour};`}
                    aria-pressed=${isSelected ? "true" : "false"}
                    aria-label="${translate("editor.lines", {
                      hassLanguage: this.hass?.language,
                    })}: ${line}"
                    @click=${() => this._toggleLine(line)}
                  >
                    <ha-icon icon=${icon} aria-hidden="true"></ha-icon>
                    <span>${line}</span>
                  </button>
                `;
              })}
            </div>`}
        <div class="line-chip-add">
          <input
            class="line-chip-input"
            type="text"
            inputmode="text"
            placeholder=${translate("editor.lines_custom_placeholder", {
              hassLanguage: this.hass?.language,
            })}
            aria-label=${translate("editor.lines_custom_placeholder", {
              hassLanguage: this.hass?.language,
            })}
            @keydown=${(ev: KeyboardEvent) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                this._onCustomLineSubmit(ev.currentTarget as HTMLInputElement);
              }
            }}
          />
        </div>
      </div>
    `;
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
      // Toggles stacked vertically — ha-form's default layout. Putting
      // each on its own row leaves room for the helper text under each
      // label without crowding. Order is by salience: hero first
      // (biggest visual element), then platform (per-row decoration),
      // then alerts (the optional disruption banner).
      { name: "show_hero", selector: { boolean: {} } },
      { name: "show_platform", selector: { boolean: {} } },
      { name: "show_alerts", selector: { boolean: {} } },
      { name: "pulse_live", selector: { boolean: {} } },
      { name: "enable_animations", selector: { boolean: {} } },
      {
        // max_departures gets its own row so the number-box widget
        // doesn't get squeezed against the toggles. Min 0 = hero-only
        // mode (just the next-departure block, no row list below it).
        // The integration still fetches the full pool so `next` has
        // something to point at.
        name: "max_departures",
        selector: { number: { min: 0, max: 30, step: 1, mode: "box" } },
      },
    ];
  }

  private _computeLabel = (field: { name: string }): string => {
    // 1. Try HA's own translations first — common field names ("name",
    //    "entity", "icon") are localised by HA core in every supported
    //    language. Reusing those means the card only needs to translate
    //    its bespoke fields. `hass.localize` returns "" for misses, not
    //    the lookup key, so a falsy check is the right miss signal.
    const haKey = `ui.panel.lovelace.editor.card.generic.${field.name}`;
    const ha = this.hass?.localize?.(haKey);
    if (ha) return ha;

    // 2. Fall back to the card's own translation bundle.
    const key = `editor.${field.name}`;
    const localised = translate(key, {
      hassLanguage: this.hass?.language,
    });
    if (localised !== key) return localised;

    // 3. Last resort: raw field name (editor still works, dev sees the gap).
    return field.name;
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

  /** Helper for the bespoke per-line widgets below: persist a single
   *  key/value into a Record-typed config field and fire the standard
   *  `config-changed`. Removing an entry by passing `undefined` keeps
   *  the saved config tidy (no empty objects, no `null` values). */
  private _patchRecord<K extends "walk_times" | "line_colors">(
    field: K,
    line: string,
    value: NonNullable<LinzLinienAustriaCardConfig[K]>[string] | undefined,
  ): void {
    const current = { ...(this._config[field] ?? {}) } as Record<
      string,
      NonNullable<LinzLinienAustriaCardConfig[K]>[string]
    >;
    if (value === undefined || value === null || value === "") {
      delete current[line];
    } else {
      current[line] = value;
    }
    const next = { ...this._config };
    if (Object.keys(current).length === 0) {
      delete next[field];
    } else {
      next[field] = current as LinzLinienAustriaCardConfig[K];
    }
    this._config = next;
    fireEvent(this, "config-changed", { config: next });
  }

  private _onWalkTimeChange = (line: string, ev: Event): void => {
    const target = ev.target as HTMLInputElement;
    const raw = target.value.trim();
    if (raw === "") {
      this._patchRecord("walk_times", line, undefined);
      return;
    }
    const minutes = Number(raw);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      this._patchRecord("walk_times", line, undefined);
      return;
    }
    this._patchRecord("walk_times", line, Math.round(minutes));
  };

  private _onLineColorChange = (line: string, ev: Event): void => {
    const target = ev.target as HTMLInputElement;
    this._patchRecord("line_colors", line, target.value);
  };

  private _onLineColorClear = (line: string): void => {
    this._patchRecord("line_colors", line, undefined);
  };

  /** Render the per-line walk-time + colour-picker widgets. Lives below
   *  the schema-driven `<ha-form>` because dynamic key→value maps
   *  don't fit ha-form's static schema model. */
  private _renderPerLineSection(): TemplateResult {
    const lines = this._availableLines();
    if (lines.length === 0) {
      return html`<div class="editor-hint">
        ${translate("editor.per_line_no_data", {
          hassLanguage: this.hass?.language,
        })}
      </div>`;
    }
    const walkTimes = this._config.walk_times ?? {};
    const colors = this._config.line_colors ?? {};
    return html`
      <div class="editor-section">
        <div class="section-header">
          ${translate("editor.section_per_line", {
            hassLanguage: this.hass?.language,
          })}
        </div>
        <div class="editor-hint">
          ${translate("editor.per_line_hint", {
            hassLanguage: this.hass?.language,
          })}
        </div>
        <div class="per-line-list">
          ${lines.map((line) => {
            const wt = walkTimes[line];
            const colour = colors[line] ?? "";
            // Default = the mode-of-transport tint for that line.
            // Effective = user override if any, else the MoT default.
            const defaultColour = this._defaultColorForLine(line);
            const effectiveColour = colour || defaultColour;
            return html`
              <div class="per-line-row">
                <span class="per-line-badge">${line}</span>
                <label class="per-line-walk-group">
                  <input
                    class="per-line-walk"
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    inputmode="numeric"
                    .value=${wt !== undefined ? String(wt) : ""}
                    placeholder=${translate(
                      "editor.walk_time_placeholder",
                      { hassLanguage: this.hass?.language },
                    )}
                    aria-label="${translate("editor.walk_time", {
                      hassLanguage: this.hass?.language,
                    })}: ${line}"
                    @change=${(ev: Event) => this._onWalkTimeChange(line, ev)}
                  />
                  <span class="per-line-walk-unit">
                    ${translate("editor.minutes_short", {
                      hassLanguage: this.hass?.language,
                    })}
                  </span>
                </label>
                <label
                  class="per-line-color-chip"
                  style=${`--swatch-color: ${effectiveColour};`}
                >
                  <ha-icon
                    icon="mdi:palette-swatch-variant"
                    aria-hidden="true"
                  ></ha-icon>
                  <span class="per-line-color-hex">
                    ${effectiveColour.toUpperCase()}
                  </span>
                  <input
                    class="per-line-color-input"
                    type="color"
                    .value=${effectiveColour}
                    aria-label="${translate("editor.line_color", {
                      hassLanguage: this.hass?.language,
                    })}: ${line}"
                    title="${translate("editor.line_color", {
                      hassLanguage: this.hass?.language,
                    })}: ${line}"
                    @input=${(ev: Event) =>
                      this._onLineColorChange(line, ev)}
                    @change=${(ev: Event) =>
                      this._onLineColorChange(line, ev)}
                  />
                </label>
                <button
                  class=${`per-line-clear${colour ? "" : " is-hidden"}`}
                  type="button"
                  title=${translate("editor.line_color_clear", {
                    hassLanguage: this.hass?.language,
                  })}
                  aria-label="${translate("editor.line_color_clear", {
                    hassLanguage: this.hass?.language,
                  })}: ${line}"
                  ?disabled=${!colour}
                  @click=${() => this._onLineColorClear(line)}
                >
                  ×
                </button>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

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
        ${this._renderLinesFilter()}
        ${this._renderPerLineSection()}
      </div>
    `;
  }

  static styles: CSSResultGroup = editorStyles;
}
