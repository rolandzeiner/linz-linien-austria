import { LitElement, html, TemplateResult, CSSResultGroup } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
  fireEvent,
  type Departure,
  type HaFormSchema,
  type HomeAssistant,
  type LinzLinienAustriaCardConfig,
  type LovelaceCardEditor,
} from "./types";
import { editorStyles } from "./styles";
import { translate } from "./localize/localize";
import { motColorOrDefault, motIcon } from "./mot";

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

  /** Translate `key` against the active HA language. Centralises the
   *  `{ hassLanguage }` ctx so call sites don't repeat it. */
  private _t(
    key: string,
    replacements?: Record<string, string | number>,
  ): string {
    return translate(
      key,
      { hassLanguage: this.hass?.language },
      replacements,
    );
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
   *  mode-of-transport. Returns a hex string ``<input type="color">``
   *  understands directly. The lookup table lives in `src/mot.ts` so
   *  the card and editor can't drift. */
  private _defaultColorForLine(line: string): string {
    return motColorOrDefault(this._motForLine(line));
  }

  /** MDI icon for a given line, derived from its mode-of-transport. */
  private _iconForLine(line: string): string {
    return motIcon(this._motForLine(line));
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
        <div class="section-header">${this._t("editor.lines")}</div>
        <div class="editor-hint">${this._t("editor.lines_helper")}</div>
        ${known.length === 0
          ? html`<div class="editor-hint">
              ${this._t("editor.per_line_no_data")}
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
                    aria-label="${this._t("editor.lines")}: ${line}"
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
            placeholder=${this._t("editor.lines_custom_placeholder")}
            aria-label=${this._t("editor.lines_custom_placeholder")}
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
      // Order by salience: header first, then hero, then per-row
      // decorations, then alerts banner, then animation toggles.
      { name: "hide_header", selector: { boolean: {} } },
      { name: "show_hero", selector: { boolean: {} } },
      { name: "show_platform", selector: { boolean: {} } },
      { name: "show_alerts", selector: { boolean: {} } },
      { name: "pulse_live", selector: { boolean: {} } },
      { name: "enable_animations", selector: { boolean: {} } },
      {
        // Min 0 = hero-only mode. The integration still fetches the
        // full pool so `next` has something to point at.
        name: "max_departures",
        selector: { number: { min: 0, max: 30, step: 1, mode: "box" } },
      },
    ];
  }

  private _computeLabel = (field: { name: string }): string => {
    // Try HA's generic-card translations first so the card doesn't ship
    // duplicates of "name", "entity", etc. `hass.localize` returns ""
    // (not the key) on misses, so a falsy check is the miss signal.
    const haKey = `ui.panel.lovelace.editor.card.generic.${field.name}`;
    const ha = this.hass?.localize?.(haKey);
    if (ha) return ha;

    const key = `editor.${field.name}`;
    const localised = translate(key, {
      hassLanguage: this.hass?.language,
    });
    if (localised !== key) return localised;

    // Last resort: raw field name keeps the editor usable + visible gap.
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
        ${this._t("editor.per_line_no_data")}
      </div>`;
    }
    const walkTimes = this._config.walk_times ?? {};
    const colors = this._config.line_colors ?? {};
    return html`
      <div class="editor-section">
        <div class="section-header">${this._t("editor.section_per_line")}</div>
        <div class="editor-hint">${this._t("editor.per_line_hint")}</div>
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
                    placeholder=${this._t("editor.walk_time_placeholder")}
                    aria-label="${this._t("editor.walk_time")}: ${line}"
                    @change=${(ev: Event) => this._onWalkTimeChange(line, ev)}
                  />
                  <span class="per-line-walk-unit">
                    ${this._t("editor.minutes_short")}
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
                    aria-label="${this._t("editor.line_color")}: ${line}"
                    title="${this._t("editor.line_color")}: ${line}"
                    @input=${(ev: Event) =>
                      this._onLineColorChange(line, ev)}
                    @change=${(ev: Event) =>
                      this._onLineColorChange(line, ev)}
                  />
                </label>
                <button
                  class=${`per-line-clear${colour ? "" : " is-hidden"}`}
                  type="button"
                  title=${this._t("editor.line_color_clear")}
                  aria-label="${this._t("editor.line_color_clear")}: ${line}"
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
