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

import type {
  AlertInfo,
  Departure,
  LinzLinienAustriaCardConfig,
} from "./types";
import { CARD_VERSION } from "./const";
import { translate } from "./localize/localize";
import { cardStyles } from "./styles";

// Eagerly register the editor so HA can grab it synchronously from
// `getConfigElement`. With `inlineDynamicImports: true` the editor is
// already in this bundle.
import "./editor";

// Console banner — fixed-language because we don't have a hass instance
// at module-load time. The user-visible card strings flow through
// `translate()` with the active HA language.
console.info(
  `%c  Linz Linien Austria Card  %c  v${CARD_VERSION}  `,
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

  /** Stub returned to the HA card picker. Auto-pick the first sensor
   *  produced by this integration so the picker's preview tile renders
   *  a live card instead of the empty-state branch. We identify "our"
   *  sensors by the marker attributes the integration always emits
   *  (`stop_id` + `departures`) — works even when the user customised
   *  the entity_id, and doesn't depend on the `attribution` string
   *  being present at the exact moment the picker probes states. */
  public static getStubConfig(hass?: HomeAssistant): Record<string, unknown> {
    const stub: Record<string, unknown> = { show_hero: true };
    if (!hass) return stub;
    const match = Object.keys(hass.states).find((id) => {
      if (!id.startsWith("sensor.")) return false;
      const attrs = hass.states[id]?.attributes;
      return (
        attrs !== undefined &&
        typeof attrs.stop_id === "string" &&
        Array.isArray(attrs.departures)
      );
    });
    if (match) {
      stub.entity = match;
    }
    return stub;
  }

  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private config!: LinzLinienAustriaCardConfig;

  public setConfig(config: LinzLinienAustriaCardConfig): void {
    // Only validate the *shape* (must be an object). Missing `entity`
    // is normal when the user just added the card from the picker —
    // the empty-state branch in render() handles it and the visual
    // editor lets them pick one. Throwing here would surface as
    // "Konfigurationsfehler" before the editor ever opens.
    if (!config || typeof config !== "object") {
      throw new Error("Invalid configuration / Ungültige Konfiguration");
    }
    this.config = {
      show_hero: true,
      ...config,
    };
  }

  /** Pull the active HA language from the live `hass` instance — same
   *  pattern wiener-linien-austria uses. `this.hass.language` is
   *  authoritative even when the user is on the default "Auto" profile,
   *  unlike `localStorage.selectedLanguage` (which HA only writes when
   *  the user picks a language *explicitly*). */
  private _t(
    key: string,
    replacements?: Record<string, string | number>,
  ): string {
    return translate(
      key,
      {
        configLanguage: (this.config as { language?: string } | undefined)
          ?.language,
        hassLanguage: this.hass?.language,
      },
      replacements,
    );
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
          ${this._t("common.no_entity_picked")}
        </div>
      </ha-card>`;
    }

    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) {
      return html`<ha-card>
        <div class="card-content empty-state" role="status">
          ${this._t("common.entity_unavailable")}
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

    // Card-side line filter — applied BEFORE the max-departures cap so
    // capping doesn't accidentally hide everything that matched the
    // user's selected lines. Empty set means "no filter, pass through".
    const lineFilter = new Set(
      (this.config.lines ?? []).map((l) => l.trim()).filter(Boolean),
    );
    const filtered =
      lineFilter.size === 0
        ? allDepartures
        : allDepartures.filter((d) => lineFilter.has(d.line));

    const max =
      typeof this.config.max_departures === "number"
        ? Math.max(1, this.config.max_departures)
        : filtered.length;
    const departures = filtered.slice(0, max);
    const next = departures[0];
    const alerts =
      (stateObj.attributes.alerts as AlertInfo[] | undefined) ?? [];

    const subtitle = next?.direction || "";

    return html`
      <ha-card>
        <header class="head">
          <span class="icon-tile" aria-hidden="true">
            <ha-icon icon="mdi:tram"></ha-icon>
          </span>
          <div class="title-block">
            <h3 class="title">${stopName}</h3>
            ${subtitle
              ? html`<p class="subtitle">${subtitle}</p>`
              : nothing}
          </div>
        </header>
        ${alerts.length > 0 ? this._renderAlerts(alerts) : nothing}
        ${this.config.show_hero && next
          ? this._renderHero(next)
          : nothing}
        <ul class="departures" role="list">
          ${departures.length === 0
            ? html`<li class="empty">
                ${lineFilter.size > 0 && allDepartures.length > 0
                  ? this._t("card.no_matches_for_filter")
                  : this._t("card.no_departures")}
              </li>`
            : departures.map((d) => this._renderRow(d))}
        </ul>
        <div class="foot">
          <span class="timestamp">${this._t("card.attribution")}</span>
        </div>
      </ha-card>
    `;
  }

  private _renderAlerts(alerts: AlertInfo[]): TemplateResult {
    // Sort high-priority alerts first so the most actionable ones don't
    // get hidden behind the <details> fold.
    const sorted = [...alerts].sort((a, b) => {
      const av = a.priority === "high" ? 0 : 1;
      const bv = b.priority === "high" ? 0 : 1;
      return av - bv;
    });
    const summary = this._t("card.alerts_summary", {
      count: sorted.length,
    });
    return html`
      <section class="alerts" role="region" aria-label=${summary}>
        <details>
          <summary class="alerts-summary">
            <ha-icon
              class="alerts-icon"
              icon="mdi:alert-outline"
              aria-hidden="true"
            ></ha-icon>
            <span>${summary}</span>
            <ha-icon
              class="alerts-chevron"
              icon="mdi:chevron-down"
              aria-hidden="true"
            ></ha-icon>
          </summary>
          <ul class="alerts-list" role="list">
            ${sorted.map(
              (a) => html`
                <li
                  class=${classMap({
                    alert: true,
                    "alert-high": a.priority === "high",
                  })}
                >
                  <div class="alert-title">${a.title}</div>
                  ${a.description
                    ? html`<div class="alert-body">${a.description}</div>`
                    : nothing}
                  ${a.affected_lines.length
                    ? html`<div class="alert-lines">
                        ${this._t("card.affected_lines")}:
                        ${a.affected_lines.join(", ")}
                      </div>`
                    : nothing}
                </li>
              `,
            )}
          </ul>
        </details>
      </section>
    `;
  }

  private _renderHero(d: Departure): TemplateResult {
    const minutes = this._countdownFor(d);
    const minutesLabel =
      minutes === null
        ? "—"
        : minutes <= 0
          ? this._t("card.now")
          : `${minutes}`;
    const ariaLabel = `${this._t("card.next_departure_label")}: ${
      d.line
    } ${d.direction}, ${
      minutes === null
        ? this._t("card.unknown")
        : minutes <= 0
          ? this._t("card.now")
          : `${minutes} ${this._t("card.minutes")}`
    }${d.is_realtime ? `, ${this._t("card.realtime")}` : ""}`;

    return html`
      <section class="hero" aria-label=${ariaLabel}>
        <div class="hero-time">
          <span class="hero-min" aria-live="polite">${minutesLabel}</span>
          ${minutes !== null && minutes > 0
            ? html`<span class="hero-unit"
                >${this._t("card.minutes_short")}</span
              >`
            : nothing}
        </div>
        <div class="hero-meta">
          <div class="hero-line">
            ${this._renderLineBadge(d)}
            <span class="hero-direction">${d.direction || ""}</span>
          </div>
          ${d.is_realtime
            ? html`<span class="rt-pill" title=${this._t("card.realtime")}>
                ${this._t("card.realtime")}
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
          ? this._t("card.now")
          : `${minutes} ${this._t("card.minutes_short")}`;

    return html`
      <li
        class=${classMap({
          row: true,
          "row-rt": !!d.is_realtime,
          "row-cancelled": !!d.is_cancelled,
        })}
        aria-label="${d.line} ${d.direction} ${
          d.is_cancelled ? this._t("card.cancelled") : timeLabel
        }${d.is_realtime ? ` ${this._t("card.realtime")}` : ""}"
      >
        ${this._renderLineBadge(d)}
        <span class="row-direction">${d.direction || ""}</span>
        <span
          class=${classMap({
            "row-time": true,
            late: isLate && !d.is_cancelled,
            early: isEarly && !d.is_cancelled,
            now: minutes !== null && minutes <= 0 && !d.is_cancelled,
          })}
        >
          ${d.is_cancelled ? this._t("card.cancelled") : timeLabel}
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
