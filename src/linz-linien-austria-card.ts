// Linz Linien Austria — Lovelace custom card
// https://github.com/rolandzeiner/linz-linien-austria
//
// Lit 3 + Shadow DOM + Rollup, single-file HACS bundle.

import {
  LitElement,
  html,
  TemplateResult,
  PropertyValues,
  CSSResultGroup,
  nothing,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import {
  HomeAssistant,
  LovelaceCardEditor,
} from "custom-card-helpers";

import type { Departure, LinzLinienAustriaCardConfig } from "./types";
import { CARD_VERSION } from "./const";
import { localize } from "./localize/localize";
import { cardStyles } from "./styles";

// Eagerly register the editor so HA can grab it synchronously from
// `getConfigElement`. With `inlineDynamicImports: true` the editor is
// already in this bundle.
import "./editor";

console.info(
  `%c  Linz Linien Austria Card  %c  ${localize("common.version")} ${CARD_VERSION}  `,
  "color: white; font-weight: bold; background: #F08000",
  "color: white; font-weight: bold; background: dimgray",
);

interface WindowWithCustomCards extends Window {
  customCards: Array<{
    type: string;
    name: string;
    description: string;
    preview?: boolean;
    documentationURL?: string;
  }>;
}

(window as unknown as WindowWithCustomCards).customCards =
  (window as unknown as WindowWithCustomCards).customCards || [];
(window as unknown as WindowWithCustomCards).customCards.push({
  type: "linz-linien-austria-card",
  name: "Linz Linien Austria",
  description: "Live LINZ AG LINIEN departure monitor.",
  preview: true,
  documentationURL: "https://github.com/rolandzeiner/linz-linien-austria",
});

/** Mapping from Mentz EFA mode-of-transport id to a Material icon.
 *  Same numbers as defined in const.py::MOT_*; see EFA spec page 52. */
const MOT_ICON: Record<number, string> = {
  0: "mdi:train",
  1: "mdi:train",
  2: "mdi:subway-variant",
  3: "mdi:tram",
  4: "mdi:tram",
  5: "mdi:bus",
  6: "mdi:bus-side",
  7: "mdi:bus-clock",
  8: "mdi:gondola",
  9: "mdi:ferry",
  10: "mdi:bus-multiple",
  11: "mdi:dots-horizontal",
};

@customElement("linz-linien-austria-card")
export class LinzLinienAustriaCard extends LitElement {
  public static getConfigElement(): LovelaceCardEditor {
    return document.createElement(
      "linz-linien-austria-card-editor",
    ) as LovelaceCardEditor;
  }

  public static getStubConfig(): Record<string, unknown> {
    return { show_hero: true };
  }

  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: LinzLinienAustriaCardConfig;

  public setConfig(config: LinzLinienAustriaCardConfig): void {
    if (!config || typeof config !== "object") {
      throw new Error(localize("common.invalid_configuration"));
    }
    if (typeof config.entity !== "string" || !config.entity) {
      throw new Error(localize("common.entity_required"));
    }
    this.config = {
      show_hero: true,
      ...config,
    };
  }

  /** Custom shouldUpdate — `hasConfigOrEntityChanged` only watches the
   *  singular `config.entity`, but our card *only* uses that one entity.
   *  Use identity comparison: HA state objects are immutable, so a
   *  different reference means a real update. */
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) return false;
    if (changedProps.has("config")) return true;
    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
    if (!oldHass) return true;
    if (!this.config.entity) return false;
    return (
      oldHass.states[this.config.entity] !==
      this.hass.states[this.config.entity]
    );
  }

  public getCardSize(): number {
    return 6;
  }

  public getGridOptions(): {
    columns: number | "full";
    rows: number | "auto";
    min_columns: number;
    min_rows: number;
  } {
    return { columns: 12, rows: "auto", min_columns: 6, min_rows: 4 };
  }

  protected render(): TemplateResult {
    if (!this.hass) {
      return html`<ha-card><div class="card-content">…</div></ha-card>`;
    }

    if (!this.config.entity) {
      return html`<ha-card>
        <div class="card-content empty-state" role="status">
          ${localize("common.no_entity_picked")}
        </div>
      </ha-card>`;
    }

    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) {
      return html`<ha-card>
        <div class="card-content empty-state" role="status">
          ${localize("common.entity_unavailable")}
        </div>
      </ha-card>`;
    }

    const stopName =
      this.config.name ||
      (stateObj.attributes.stop_name as string | undefined) ||
      stateObj.attributes.friendly_name ||
      "";

    const allDepartures =
      (stateObj.attributes.departures as Departure[] | undefined) ?? [];
    const max =
      typeof this.config.max_departures === "number"
        ? Math.max(1, this.config.max_departures)
        : allDepartures.length;
    const departures = allDepartures.slice(0, max);
    const next = departures[0];

    return html`
      <ha-card>
        <header class="header">
          <ha-icon class="header-icon" icon="mdi:tram" aria-hidden="true"></ha-icon>
          <h2 class="title">${stopName}</h2>
        </header>
        ${this.config.show_hero && next
          ? this._renderHero(next)
          : nothing}
        <ul class="departures" role="list">
          ${departures.length === 0
            ? html`<li class="empty">${localize("card.no_departures")}</li>`
            : departures.map((d) => this._renderRow(d))}
        </ul>
        <footer class="footer">
          <span>${localize("card.attribution")}</span>
        </footer>
      </ha-card>
    `;
  }

  private _renderHero(d: Departure): TemplateResult {
    const minutes = this._countdownFor(d);
    const minutesLabel =
      minutes === null
        ? "—"
        : minutes <= 0
          ? localize("card.now")
          : `${minutes}`;
    const ariaLabel = `${localize("card.next_departure_label")}: ${
      d.line
    } ${d.direction}, ${
      minutes === null
        ? localize("card.unknown")
        : minutes <= 0
          ? localize("card.now")
          : `${minutes} ${localize("card.minutes")}`
    }${d.is_realtime ? `, ${localize("card.realtime")}` : ""}`;

    return html`
      <section class="hero" aria-label=${ariaLabel}>
        <div class="hero-time">
          <span class="hero-min" aria-live="polite">${minutesLabel}</span>
          ${minutes !== null && minutes > 0
            ? html`<span class="hero-unit"
                >${localize("card.minutes_short")}</span
              >`
            : nothing}
        </div>
        <div class="hero-meta">
          <div class="hero-line">
            ${this._renderLineBadge(d)}
            <span class="hero-direction">${d.direction || ""}</span>
          </div>
          ${d.is_realtime
            ? html`<span class="rt-pill" title=${localize("card.realtime")}>
                ${localize("card.realtime")}
              </span>`
            : nothing}
        </div>
      </section>
    `;
  }

  private _renderRow(d: Departure): TemplateResult {
    const minutes = this._countdownFor(d);
    const isLate =
      typeof d.delay_minutes === "number" && d.delay_minutes > 0;
    const isEarly =
      typeof d.delay_minutes === "number" && d.delay_minutes < 0;
    const timeLabel =
      minutes === null
        ? "—"
        : minutes <= 0
          ? localize("card.now")
          : `${minutes} ${localize("card.minutes_short")}`;

    return html`
      <li
        class=${classMap({
          row: true,
          "row-rt": !!d.is_realtime,
        })}
        aria-label="${d.line} ${d.direction} ${timeLabel}${
          d.is_realtime ? ` ${localize("card.realtime")}` : ""
        }"
      >
        ${this._renderLineBadge(d)}
        <span class="row-direction">${d.direction || ""}</span>
        <span
          class=${classMap({
            "row-time": true,
            late: isLate,
            early: isEarly,
            now: minutes !== null && minutes <= 0,
          })}
        >
          ${timeLabel}
        </span>
      </li>
    `;
  }

  private _renderLineBadge(d: Departure): TemplateResult {
    const icon = MOT_ICON[d.mot ?? -1] ?? "mdi:bus";
    return html`
      <span class="line-badge" data-mot=${d.mot ?? ""}>
        <ha-icon
          class="line-icon"
          icon=${icon}
          aria-hidden="true"
        ></ha-icon>
        <span class="line-num">${d.line || "—"}</span>
      </span>
    `;
  }

  private _countdownFor(d: Departure): number | null {
    if (typeof d.countdown_rt === "number") return d.countdown_rt;
    if (typeof d.countdown === "number") return d.countdown;
    return null;
  }

  static styles: CSSResultGroup = cardStyles;
}
