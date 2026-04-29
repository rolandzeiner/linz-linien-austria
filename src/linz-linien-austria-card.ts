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
import { repeat } from "lit/directives/repeat.js";
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
import {
  checkCardVersionWS,
  renderVersionBanner,
} from "./shared-render";
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

/** Mode-of-transport → solid badge background, mirroring the rules in
 *  styles.ts. Returned as a colour string suitable for inline style so
 *  the hero countdown can adopt the same hue as the line badge.
 *  Returning `null` means "use the default --linz-accent". */
function motColor(mot: number | undefined): string | null {
  if (mot === 0 || mot === 1) return "#455a64";
  if (mot === 2) return "#1565c0";
  if (mot === 5 || mot === 6 || mot === 7) return "#6a1b9a";
  return null;
}

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

  // Reload-banner state — flipped once the WS card-version probe sees
  // a mismatch between the bundled CARD_VERSION and what HA reports.
  @state() private _versionMismatch: string | null = null;
  // Single-fire guard so `render()` doesn't kick a probe on every
  // hass-tick. Reset on entity change is unnecessary — version drift
  // is a process-wide property, not per-entity.
  private _versionCheckDone = false;

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
    // Fire the WS card-version probe once on first render where hass
    // is available. Mismatch flips _versionMismatch which Lit treats
    // as a reactive state property → next render shows the banner.
    if (!this._versionCheckDone && this.hass) {
      this._versionCheckDone = true;
      void checkCardVersionWS(this.hass).then((mismatch) => {
        if (mismatch) this._versionMismatch = mismatch;
      });
    }

    const ctx = {
      configLanguage: (this.config as { language?: string } | undefined)
        ?.language,
      hassLanguage: this.hass?.language,
    };

    if (!this.hass) {
      return html`<ha-card><div class="card-content">…</div></ha-card>`;
    }

    if (!this.config.entity) {
      return html`<ha-card>
        ${renderVersionBanner(this._versionMismatch, ctx)}
        <div class="card-content empty-state" role="status">
          ${this._t("common.no_entity_picked")}
        </div>
      </ha-card>`;
    }

    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) {
      return html`<ha-card>
        ${renderVersionBanner(this._versionMismatch, ctx)}
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

    // Maps URL — uses the upstream-canonical stop name (which already
    // carries the place suffix, e.g. "Linz/Donau, Hauptbahnhof") plus
    // an explicit "Linz" so non-Linz stops can't collide with same-
    // named stops elsewhere. EFA NAV5 coords ARE in
    // `resolved_stop.coords_x/y` but they are projected (not WGS84)
    // and would need a transform to be useful for Google Maps.
    const resolvedStopName =
      (stateObj.attributes.stop_name as string | undefined) ||
      stopName;
    const mapsQuery = resolvedStopName
      ? encodeURIComponent(
          /Linz/i.test(resolvedStopName)
            ? resolvedStopName
            : `${resolvedStopName}, Linz`,
        )
      : "";
    const mapsUrl = mapsQuery
      ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`
      : null;
    const openInMapsLabel = this._t("card.open_in_maps");
    // NOTE: header icon + accent are derived from `next` further down,
    // after `next` has been assigned. Don't reference it here — `const`
    // TDZ would throw at render time and silently blank the card.

    const allDepartures =
      (stateObj.attributes.departures as Departure[] | undefined) ?? [];

    // Card-side line filter — applied BEFORE the max-departures cap so
    // capping doesn't accidentally hide everything that matched the
    // user's selected lines. Empty set means "no filter, pass through".
    const lineFilter = new Set(
      (this.config.lines ?? []).map((l) => l.trim()).filter(Boolean),
    );
    // Walk-time (Fußweg) filter — drop any departure whose effective
    // countdown is less than the configured walk time for that line.
    // Mirrors wiener-linien-austria's `walk_times` behaviour. Keyed
    // by the bare line number; a missing or non-positive entry means
    // "no walk-time filter for this line". The user can raise the
    // integration's `limit` setting if a long Fußweg is leaving them
    // with too few visible rows.
    const walkTimes = this.config.walk_times ?? {};
    const filtered = allDepartures.filter((d) => {
      if (lineFilter.size > 0 && !lineFilter.has(d.line)) return false;
      const walk = walkTimes[d.line];
      if (typeof walk === "number" && walk > 0) {
        const cd = this._countdownFor(d);
        if (cd === null || cd < walk) return false;
      }
      return true;
    });

    // The hero always uses filtered[0] regardless of `max_departures`
    // so a setting of 0 ("hero only, no list") can still pick a next
    // departure. The list slice is computed separately and may be empty.
    const max =
      typeof this.config.max_departures === "number"
        ? Math.max(0, this.config.max_departures)
        : filtered.length;
    // Hero group — every NON-CANCELLED departure that shares the
    // soonest effective countdown. At Hauptbahnhof two trams can
    // leave at the same minute on different platforms; surfacing
    // both in the hero saves the user reading the row list.
    // Falls back to a single cancelled entry when every visible
    // departure is cancelled, so the hero still shows _something_
    // (rendered as the cancelled treatment).
    const heroGroup = this._computeHeroGroup(filtered);
    const next = heroGroup[0];

    // When the hero is on, the entries it shows are dropped from the
    // row list so they don't appear twice. Object identity works as
    // the dedupe key because heroGroup members are references into
    // the same `filtered` array. The post-dedupe list is then capped
    // at max_departures, so "max 10" continues to mean "10 rendered
    // rows" rather than "10 rows including any duplicates of the
    // hero". When show_hero is off the dedupe is skipped.
    const heroDedupe = this.config.show_hero !== false
      ? new Set(heroGroup)
      : new Set<Departure>();
    const remaining = filtered.filter((d) => !heroDedupe.has(d));
    const departures = max === 0 ? [] : remaining.slice(0, max);

    // Header icon + accent track the next departing line's
    // mode-of-transport. Same mechanic as wiener-linien-austria — the
    // header reads as one with the hero block (which already adopts
    // the line colour). Falls back to the tram default when the next
    // departure has no MoT or there is no `next` (empty stop). User
    // line-colour override (if set for the next line) wins over the
    // MoT default.
    const headerIcon =
      next?.mot !== undefined ? MOT_ICON[next.mot] ?? "mdi:tram" : "mdi:tram";
    const headerColor =
      this._userLineColor(next?.line) ?? motColor(next?.mot);
    const headerStyle = headerColor ? `--header-color: ${headerColor};` : "";

    // Alerts pre-filter: only show notices whose `affected_lines` overlap
    // a line we are *actually about to display* (i.e. survived the
    // card-side `lines` filter and is in the upcoming-departures
    // snapshot). System-wide notices (no `affected_lines`) fall through
    // unfiltered. The integration-side alerts list is broader — it
    // includes every line that serves the stop, even ones not currently
    // departing — so this trim avoids surfacing detours for routes the
    // user doesn't care about right now.
    const visibleLines = new Set(filtered.map((d) => d.line).filter(Boolean));
    const allAlerts =
      (stateObj.attributes.alerts as AlertInfo[] | undefined) ?? [];
    const alerts = allAlerts.filter((a) => {
      const affected = a.affected_lines || [];
      if (affected.length === 0) return true; // system-wide
      return affected.some((line) => visibleLines.has(line));
    });

    // Subtitle: "<direction>" by default. With show_platform on, append
    // a platform marker so multi-platform stops get the next-departure
    // bay/Steig at a glance. Falls back to direction-only when the
    // upstream didn't return a platform for that row (some stops emit
    // platform "0" / "" for non-platformed terminals).
    const directionText = next?.direction || "";
    const platformText = this.config.show_platform
      ? this._platformText(next)
      : "";
    const subtitle = platformText
      ? `${directionText} · ${this._platformLabel(next, true)} ${platformText}`
      : directionText;

    // Pulse on the green Live bullet defaults on; users who haven't
    // set the OS prefers-reduced-motion preference but still find the
    // animation distracting can flip ``pulse_live: false`` in card
    // config. The class lands on <ha-card> so the descendant selector
    // in styles.ts can disable the animation everywhere it appears.
    const pulseLive = this.config.pulse_live !== false;
    // Master CSS-animation toggle defaults OFF. When ON, the
    // ``with-animations`` class lights up longer-duration transitions
    // (mounted-card fade-in, line-badge recolour, hero state
    // changes, alerts banner). Static look by default keeps the card
    // calm; users who want a more lively feel opt in. The
    // prefers-reduced-motion catch-all overrides regardless.
    const enableAnimations = !!this.config.enable_animations;

    return html`
      <ha-card
        class=${classMap({
          "no-pulse": !pulseLive,
          "with-animations": enableAnimations,
        })}
      >
        ${renderVersionBanner(this._versionMismatch, ctx)}
        ${this.config.hide_header
          ? nothing
          : html`<header class="head" style=${headerStyle}>
              <span class="icon-tile" aria-hidden="true">
                <ha-icon icon=${headerIcon}></ha-icon>
              </span>
              <div class="title-block">
                <h3 class="title">${stopName}</h3>
                ${subtitle
                  ? html`<p class="subtitle">${subtitle}</p>`
                  : nothing}
              </div>
              ${mapsUrl
                ? html`<div class="head-actions">
                    <a
                      class="icon-action"
                      href=${mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title=${openInMapsLabel}
                      aria-label="${openInMapsLabel}: ${stopName}"
                      @click=${(ev: Event) => ev.stopPropagation()}
                    >
                      <ha-icon
                        icon="mdi:map-marker"
                        aria-hidden="true"
                      ></ha-icon>
                    </a>
                  </div>`
                : nothing}
            </header>`}
        ${this.config.show_alerts !== false && alerts.length > 0
          ? this._renderAlerts(alerts)
          : nothing}
        ${this.config.show_hero && heroGroup.length > 0
          ? this._renderHero(heroGroup)
          : nothing}
        ${max === 0
          ? nothing
          : departures.length === 0 && heroDedupe.size > 0
            ? // Hero already shows the only departure(s); no need
              // for an empty placeholder row underneath.
              nothing
            : html`<ul class="departures" role="list">
                ${departures.length === 0
                  ? html`<li class="empty">
                      ${lineFilter.size > 0 && allDepartures.length > 0
                        ? this._t("card.no_matches_for_filter")
                        : this._t("card.no_departures")}
                    </li>`
                  : repeat(
                      departures,
                      (d) => this._depKey(d),
                      (d) => this._renderRow(d),
                    )}
              </ul>`}
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

  /** Build the set of departures shown in the hero. Returns either:
   *  - every non-cancelled departure within the hero "imminent
   *    window" (see below), OR
   *  - a single cancelled entry when every visible departure is
   *    cancelled, so the hero still has something to render in
   *    cancelled-state styling, OR
   *  - the empty array when there are no departures at all (hero is
   *    skipped by render).
   *
   *  Imminent window: when the soonest non-cancelled departure is at
   *  "Jetzt" (cd ≤ 0), also include anything else with cd ≤ 1 so a
   *  bus arriving in 1 minute joins the immediate one rather than
   *  staying buried in the row list. Catches the natural pattern at
   *  Hauptbahnhof where two lines often arrive within a minute of
   *  each other and the user is standing at the stop deciding which
   *  to take. Outside the Jetzt case, fall back to strict tie-only
   *  grouping so a 5-min lead doesn't pull a 6-min entry into the
   *  hero (would overshare for the "next departure" semantic). */
  private _computeHeroGroup(filtered: Departure[]): Departure[] {
    if (filtered.length === 0) return [];
    const live = filtered.filter((d) => !d.is_cancelled);
    if (live.length === 0) {
      const first = filtered[0];
      return first ? [first] : [];
    }
    const cdOf = (d: Departure): number => {
      if (typeof d.countdown_rt === "number") return d.countdown_rt;
      if (typeof d.countdown === "number") return d.countdown;
      return Number.POSITIVE_INFINITY;
    };
    let minCd = Number.POSITIVE_INFINITY;
    for (const d of live) {
      const cd = cdOf(d);
      if (cd < minCd) minCd = cd;
    }
    if (!Number.isFinite(minCd)) {
      const first = live[0];
      return first ? [first] : [];
    }
    // When the lead is at Jetzt, group every entry that is also at
    // Jetzt (cd <= 0). A bus can sit at "Jetzt" for longer than the
    // upstream's tick resolution while it dwells at the platform; in
    // that window a second arrival can also reach Jetzt and the hero
    // should contain both. Outside the Jetzt case, fall back to
    // strict tie-only grouping so a 5-min lead doesn't pull a 6-min
    // entry into the hero.
    if (minCd <= 0) {
      return live.filter((d) => cdOf(d) <= 0);
    }
    return live.filter((d) => cdOf(d) === minCd);
  }

  private _renderHero(group: Departure[]): TemplateResult {
    // Group is guaranteed non-empty by the caller. Lead member drives
    // the countdown text + header colour + cancellation styling;
    // every member contributes its own (badge + direction + flags) row
    // so a tied-arrival pair (e.g. line 2 and line 4 both at "Jetzt")
    // both surface in the big block instead of one being relegated to
    // the row list.
    const lead = group[0]!;
    const minutes = this._countdownFor(lead);
    const minutesLabel = lead.is_cancelled
      ? this._t("card.cancelled")
      : minutes === null
        ? "—"
        : minutes <= 0
          ? this._t("card.now")
          : `${minutes}`;

    // aria-label enumerates every grouped departure so AT users hear
    // "Tram 2 solarCity and Tram 4 Landgutstraße, 0 min, Live"
    // instead of just the lead's identification.
    const ariaParts = group.map(
      (d) =>
        `${d.mot_name ? `${d.mot_name} ` : ""}${d.line} ${d.direction}`,
    );
    const minutesText = lead.is_cancelled
      ? this._t("card.cancelled")
      : minutes === null
        ? this._t("card.unknown")
        : minutes <= 0
          ? this._t("card.now")
          : `${minutes} ${this._t("card.minutes")}`;
    const ariaSep = ` ${this._t("card.and_separator")} `;
    const ariaLabel = `${this._t("card.next_departure_label")}: ${ariaParts.join(
      ariaSep,
    )}, ${minutesText}${lead.is_realtime && !lead.is_cancelled ? `, ${this._t("card.realtime")}` : ""}`;

    // Header colour comes from the lead — user override beats MoT
    // default; both fall back to --linz-accent (the tram default).
    const heroColor =
      this._userLineColor(lead.line) ?? motColor(lead.mot);
    const heroStyle = heroColor
      ? `--hero-color: ${heroColor};`
      : "";

    return html`
      <section
        class=${classMap({
          hero: true,
          "hero-cancelled": !!lead.is_cancelled,
          "hero-multi": group.length > 1,
        })}
        aria-label=${ariaLabel}
        style=${heroStyle}
      >
        <div class="hero-time">
          <span class="hero-min" aria-live="polite">${minutesLabel}</span>
          ${!lead.is_cancelled && minutes !== null && minutes > 0
            ? html`<span class="hero-unit"
                >${this._t("card.minutes_short")}</span
              >`
            : nothing}
        </div>
        <div class="hero-meta">
          ${repeat(
            group,
            (d) => this._depKey(d),
            (d) => this._renderHeroEntry(d),
          )}
        </div>
      </section>
    `;
  }

  /** One row inside the hero meta column — line badge, direction, and
   *  per-departure flags (Live pill, Steig). One row when the group
   *  has a single entry; stacks cleanly when two or more arrive at
   *  the same minute. */
  private _renderHeroEntry(d: Departure): TemplateResult {
    const platform = this.config.show_platform
      ? this._platformText(d)
      : "";
    return html`
      <div class="hero-entry">
        ${this._renderLineBadge(d)}
        <span class="hero-direction">${d.direction || ""}</span>
        ${!d.is_cancelled && platform
          ? html`<span class="hero-platform"
              >${this._platformLabel(d, true)} ${platform}</span
            >`
          : nothing}
        ${d.is_realtime && !d.is_cancelled
          ? html`<span class="rt-pill" title=${this._t("card.realtime")}>
              ${this._t("card.realtime")}
            </span>`
          : nothing}
      </div>
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
        aria-label="${d.mot_name ? `${d.mot_name} ` : ""}${d.line} ${
          d.direction
        } ${d.is_cancelled ? this._t("card.cancelled") : timeLabel}${
          d.is_realtime ? ` ${this._t("card.realtime")}` : ""
        }"
      >
        ${this._renderLineBadge(d)}
        <span class="row-direction">${d.direction || ""}</span>
        <span class="row-tail">
          ${this.config.show_platform &&
          !d.is_cancelled &&
          this._platformText(d)
            ? html`<span
                class="row-platform"
                aria-label="${this._platformLabel(d, false)} ${this._platformText(d)}"
                title="${this._platformLabel(d, false)} ${this._platformText(d)}"
                >${this._platformLabel(d, true)}
                ${this._platformText(d)}</span
              >`
            : nothing}
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
        </span>
      </li>
    `;
  }

  private _renderLineBadge(d: Departure): TemplateResult {
    const icon = MOT_ICON[d.mot ?? -1] ?? "mdi:bus";
    const userColor = this._userLineColor(d.line);
    // User override beats MoT default. Inline style on the badge keeps
    // the override per-element (no need to spam custom-properties).
    // Empty string when no override = no inline style added.
    const style = userColor ? `background: ${userColor};` : "";
    return html`
      <span
        class="line-badge"
        data-mot=${d.mot ?? ""}
        style=${style}
      >
        <ha-icon
          class="line-icon"
          icon=${icon}
          aria-hidden="true"
        ></ha-icon>
        <span class="line-num">${d.line || "—"}</span>
      </span>
    `;
  }

  /** User-configured colour for a given line. Returns `null` when no
   *  override exists, letting downstream code fall back to the
   *  mode-of-transport default in the stylesheet. Lookup is
   *  case-insensitive on the line number ("U2" === "u2"). */
  private _userLineColor(line: string | undefined): string | null {
    if (!line) return null;
    const overrides = this.config.line_colors ?? {};
    return overrides[line] ?? overrides[line.toUpperCase()] ?? null;
  }

  /** Stable identity for a departure across consecutive refreshes.
   *  Used by ``repeat()`` so Lit reuses DOM for entries that survive
   *  a refresh — only genuinely new entries get a fresh element and
   *  therefore re-trigger the entry animation. The countdown changes
   *  every tick, so we key off the trip's stable identifiers
   *  (line + direction + platform + scheduled time) instead. */
  private _depKey(d: Departure): string {
    const parts = [
      d.line ?? "",
      d.direction ?? "",
      d.platform ?? "",
      d.scheduled ?? "",
    ];
    return parts.join("|");
  }

  /** Return the platform / bay marker if it's actually meaningful.
   *  EFA emits "0" or "" for stops that don't have numbered bays —
   *  surfacing that as "Steig 0" in the UI is noise. */
  private _platformText(d: Departure | undefined): string {
    if (!d) return "";
    const raw = (d.platform ?? "").trim();
    if (!raw || raw === "0") return "";
    return raw;
  }

  /** Pick "Gleis"/"Track" for ÖBB-style heavy rail (Train, S-Bahn) and
   *  "Steig"/"Pl." for everything municipal (U-Bahn, Stadtbahn, Tram,
   *  Bus, Funicular, Ferry, Other). Austrian municipal operators
   *  (Wiener Linien, LINZ Linien, etc.) use "Steig" on signage even for
   *  rail-bound trams; only ÖBB-style modes get "Gleis" by convention.
   *  Mode codes match Mentz EFA — see api.py. */
  private _isRailMot(mot: number | undefined): boolean {
    return mot === 0 || mot === 1;
  }
  private _platformLabel(d: Departure | undefined, short: boolean): string {
    const rail = this._isRailMot(d?.mot);
    const key = rail
      ? short ? "card.platform_rail_short" : "card.platform_rail"
      : short ? "card.platform_short" : "card.platform";
    return this._t(key);
  }

  private _countdownFor(d: Departure): number | null {
    if (typeof d.countdown_rt === "number") return d.countdown_rt;
    if (typeof d.countdown === "number") return d.countdown;
    return null;
  }

  static styles: CSSResultGroup = cardStyles;
}
