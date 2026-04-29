import { css } from "lit";

/** Card styles — live in the shadow root. CSS custom properties pierce
 *  the boundary so `var(--primary-color)` etc. resolve to the user's
 *  active HA theme.
 *
 *  Container queries gate density tiers because the card commonly lives
 *  in section-view grid columns of 280–1200 px on the same screen.
 *  WCAG 1.4.10 reflow + 1.4.12 text spacing tolerated by intrinsic
 *  sizing — no fixed heights on text containers, no white-space:nowrap
 *  on user-visible strings. Touch targets ≥44 px (WCAG 2.5.8 AA via
 *  the AAA-grade 44 default).
 */
export const cardStyles = css`
  :host {
    /* color-scheme enables light-dark() and steers forced-colors
       palette selection (WCAG 1.4.11). HA's active theme drives the
       resolution; the card just opts in. */
    color-scheme: light dark;
    display: block;
  }

  :host {
    /* Brand accent — domain-specific, no HA equivalent. */
    --linz-accent: #f08000;

    /* Semantic state tokens layered over HA's official semantic
       palette (--ha-color-success / -error / -info). HA themes can
       recolour the whole portfolio in one place; the hard-coded
       values are the fallback for older HA versions. */
    --linz-rt:    var(--ha-color-success, #2e7d32);
    --linz-late:  var(--ha-color-error,   #c62828);
    --linz-early: var(--ha-color-info,    #1565c0);

    /* Spacing / radius / sizing — layered over the HA Design System
       so the card moves with HA when tokens evolve. Values match
       wiener-linien-austria so a stacked dashboard reads as one
       family. */
    --linz-radius-md: var(--ha-radius-md, 10px);
    --linz-pad-x:     var(--ha-spacing-4, 16px);
    --linz-pad-y:     var(--ha-spacing-3, 14px);
    --linz-row-gap:   var(--ha-spacing-3, 12px);
    --linz-tile-size: 40px;
    /* Hero countdown size — bumped at wide widths, scaled down at
       cramped widths via the container queries at the bottom of this
       stylesheet. Matches the wiener-linien-card responsive pattern. */
    --linz-metric-size: 2.75rem;
  }

  ha-card {
    overflow: hidden;
    container-type: inline-size;
    container-name: linzcard;
  }

  /* Header row — icon tile + title block.
     Matches the wiener-linien card layout (40 px tinted icon tile,
     12 px gap, two-line title-block) so a stacked dashboard reads as
     one visual family. The card sets a --header-color CSS variable on
     .head from the next departure's MoT (tram = orange default,
     U-Bahn = blue, bus = plum, train = grey) — icon-tile's tint and
     icon colour both inherit, so the header recolours every refresh. */
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: var(--linz-pad-y) var(--linz-pad-x) 0;
    --header-color: var(--linz-accent);
  }
  .icon-tile {
    width: var(--linz-tile-size);
    height: var(--linz-tile-size);
    border-radius: var(--linz-radius-md);
    background: color-mix(in srgb, var(--header-color) 18%, transparent);
    color: var(--header-color);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    forced-color-adjust: none;
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
  }
  .icon-tile ha-icon {
    --mdc-icon-size: 22px;
  }
  .title-block {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .title {
    margin: 0;
    font-size: var(--ha-font-size-m, 0.9375rem);
    font-weight: 600;
    color: var(--primary-text-color);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .subtitle {
    margin: 2px 0 0;
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Header right-side actions (maps link). Same affordance + sizing as
     wiener-linien-austria's .icon-action so a stacked dashboard reads
     as one visual family. min-width/min-height meet WCAG 2.5.8 AA. */
  .head-actions {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .icon-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
    color: var(--secondary-text-color);
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
  }
  .icon-action:hover {
    background: color-mix(
      in srgb,
      var(--primary-text-color) 8%,
      transparent
    );
    color: var(--primary-text-color);
  }
  .icon-action:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .icon-action ha-icon {
    --mdc-icon-size: 22px;
  }

  /* Hero block — large countdown to next departure.
     The hero hosts a --hero-color CSS variable that the card sets on
     the element via inline style based on the next departure's MoT.
     Tram/default use --linz-accent; U-Bahn / bus / train get their own
     hue so the big number visually agrees with the line badge below. */
  .hero {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--ha-spacing-3, 12px);
    align-items: center;
    padding: var(--ha-spacing-3, 12px) var(--linz-pad-x);
    margin: var(--ha-spacing-3, 12px) var(--linz-pad-x) 0;
    border-radius: var(--ha-radius-lg, 12px);
    --hero-color: var(--linz-accent);
    background: color-mix(in srgb, var(--hero-color) 12%, transparent);
  }
  .hero-time {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--hero-color);
  }
  .hero-min {
    font-size: var(--linz-metric-size);
    font-weight: var(--ha-font-weight-bold, 600);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .hero-unit {
    font-size: 1rem;
    font-weight: 600;
    color: var(--secondary-text-color);
  }
  /* Hero meta — column of (badge + direction + flags) rows. One row
     per departure in the group; almost always 1 entry, occasionally
     2+ when several lines share the same arrival minute (e.g. tram 2
     and tram 4 both at "Jetzt" on Hauptbahnhof). Each row uses the
     same flex-wrap-row treatment as before so tags spill to a second
     line on narrow column widths. */
  .hero-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .hero-entry {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .hero-direction {
    font-weight: 500;
    color: var(--primary-text-color);
    overflow-wrap: anywhere;
    flex: 1 1 auto;
    min-width: 0;
  }
  .hero-platform {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--primary-text-color);
    font-variant-numeric: tabular-nums;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--primary-text-color) 10%,
      transparent
    );
  }

  /* Cancelled hero — recolour to the late/cancel red so the user
     reads the state at a glance, dim the line badge + direction with
     strikethrough so it matches the row treatment, and shrink the
     "Entfällt" label since it no longer competes with a giant
     numeric countdown. */
  .hero-cancelled {
    --hero-color: var(--linz-late);
    background: color-mix(in srgb, var(--linz-late) 12%, transparent);
  }
  .hero-cancelled .hero-min {
    font-size: 1.25rem;
    font-weight: var(--ha-font-weight-bold, 600);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .hero-cancelled .line-badge,
  .hero-cancelled .hero-direction {
    text-decoration: line-through;
    opacity: 0.7;
  }
  .rt-pill {
    font-size: 0.6875rem;
    font-weight: 600;
    color: white;
    background: var(--linz-rt);
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }

  /* Departures list — tightened to match the wiener-linien tile-card
     row density. 6 px vertical padding, hairline divider, no border on
     last child. The list itself sits inside the same horizontal padding
     as the header so badges align with the icon-tile. */
  .departures {
    list-style: none;
    margin: var(--ha-spacing-2, 8px) 0 0;
    padding: 0 var(--linz-pad-x);
    display: flex;
    flex-direction: column;
  }
  .row {
    display: grid;
    /* Three columns: badge | direction | tail. The tail is a single
       flex container that holds the optional platform pill and the
       time. Collapsing platform+time into one trailing column keeps
       the time anchored at the row's right edge regardless of whether
       platform is present, so minute values line up vertically across
       rows even when only some have a platform set. */
    grid-template-columns: max-content 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 6px 2px;
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
  }
  .row-tail {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    /* Reserve a fixed minimum so the time text right-aligns inside a
       consistent slot. Long values ("12 Min") and short ones ("Jetzt")
       both end at the same right edge across rows. */
    min-width: 3.6em;
    justify-content: flex-end;
  }
  .row:last-child {
    border-bottom: none;
  }
  .row-direction {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--primary-text-color);
  }
  .row-time {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--secondary-text-color);
    white-space: nowrap;
  }
  /* Trailing platform marker — small, muted, monospace digits so
     "Steig 7" / "Steig 12" line up visually across rows. */
  .row-platform {
    font-size: 0.7rem;
    color: var(--secondary-text-color);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    padding: 1px 6px;
    border-radius: 4px;
    background: color-mix(
      in srgb,
      var(--secondary-text-color) 12%,
      transparent
    );
  }
  .row-time.now {
    color: var(--linz-accent);
  }
  .row-time.late {
    color: var(--linz-late);
  }
  .row-time.early {
    color: var(--linz-early);
  }
  /* Realtime cue — leading green bullet on the time cell. Pairs with
     the green colour to satisfy WCAG 1.4.1 (use of colour) without
     adding visual weight. aria-hidden on the pseudo-element is implicit
     since ::before content isn't read by screen readers; the row's
     existing aria-label already says "live" when realtime. */
  .row-rt .row-time::before {
    content: "•";
    color: var(--linz-rt);
    margin-right: 4px;
    font-size: 1.1em;
    line-height: 1;
    vertical-align: middle;
    /* Subtle "live" pulse — slow, low-amplitude, eased — to signal
       that this row's time is currently realtime-corrected.
       Suppressed by the prefers-reduced-motion catch-all near the
       end of this stylesheet, so users who opted out get a static
       bullet. transform-origin centres the scale on the dot itself. */
    display: inline-block;
    transform-origin: center;
    animation: linzLivePulse 2s ease-in-out infinite;
  }

  @keyframes linzLivePulse {
    0%, 100% {
      opacity: 0.55;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.18);
    }
  }

  /* Opt-out: card-config pulse_live=false lands a no-pulse class
     on the ha-card. Static dot, full opacity, no scale. */
  ha-card.no-pulse .row-rt .row-time::before {
    animation: none;
    opacity: 1;
    transform: none;
  }

  /* === Master CSS-animation suite — opt-in via enable_animations.
     Off by default (most users prefer a calm dashboard). When on,
     adds a one-shot card-mount fade-in plus longer-duration colour /
     background transitions on the elements that recolour during a
     refresh: line badge, hero accent, row-time state classes, alerts
     banner. The prefers-reduced-motion catch-all later in this
     stylesheet overrides every rule below regardless of the toggle. */

  /* One-shot card mount — Lit doesn't re-mount <ha-card> on hass
     updates, so this fires once and stays still. Subtle: 6px upward
     translate fading from 0 → 1 over 400ms ease-out. */
  ha-card.with-animations {
    animation: linzCardEnter 0.4s ease-out;
  }
  @keyframes linzCardEnter {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Smoothed transitions on the surfaces that recolour during the
     normal refresh cycle. The 0.4s window is long enough that the
     change is "noticed" rather than jumping, short enough that the
     user isn't waiting on it. */
  ha-card.with-animations .icon-tile,
  ha-card.with-animations .hero,
  ha-card.with-animations .hero-min,
  ha-card.with-animations .hero-unit,
  ha-card.with-animations .line-badge,
  ha-card.with-animations .line-icon,
  ha-card.with-animations .row-time {
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease),
      box-shadow var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
  }

  /* Hero block recolour stays in sync with its background tint by
     piping the same transition window onto its background. */
  ha-card.with-animations .hero {
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
  }

  /* Row hover — soft tint that fades in/out so brushing the cursor
     across the list doesn't feel snappy. Pairs with the existing
     focus-visible outline (which is intentionally instant). */
  ha-card.with-animations .row {
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
  }
  ha-card.with-animations .row:hover {
    background: color-mix(
      in srgb,
      var(--primary-text-color) 4%,
      transparent
    );
  }

  /* Alerts banner — soft fade-in on first render of the section.
     The collapse/expand animation already exists via the
     grid-template-rows pattern below; the wrapper fade adds polish
     to the very first time a notice appears. */
  ha-card.with-animations .alerts {
    animation: linzAlertsFadeIn 0.5s ease-out;
  }
  @keyframes linzAlertsFadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Departure-row enter — fires when a NEW row is mounted, not on
     every refresh. Lit's repeat() with a stable key reuses the DOM
     for entries that survive a refresh, so this animation only
     plays for genuinely new arrivals (a previously hidden line
     coming back into the visible window, or the user expanding
     max_departures). The slight horizontal slide makes the
     direction-of-travel "from outside" without overdoing it. */
  ha-card.with-animations .row {
    animation: linzRowEnter 0.32s ease-out backwards;
  }
  @keyframes linzRowEnter {
    from {
      opacity: 0;
      transform: translateX(-6px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Hero-entry enter — fires when a departure is promoted into the
     hero (its countdown ticks down enough to make it the soonest, OR
     a tied second arrival joins the existing Jetzt group). Same
     repeat()-with-stable-key trick keeps existing hero members from
     replaying the animation each tick. The slight upward slide +
     scale-up reads as "entering centre stage" while staying calm. */
  ha-card.with-animations .hero-entry {
    animation: linzHeroEntryEnter 0.42s ease-out backwards;
  }
  @keyframes linzHeroEntryEnter {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Cancelled trip — strike through the line + direction, dim the row. */
  .row-cancelled .line-badge,
  .row-cancelled .row-direction {
    text-decoration: line-through;
    opacity: 0.7;
  }
  .row-cancelled .row-time {
    color: var(--linz-late);
    font-weight: var(--ha-font-weight-bold, 600);
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
  }
  .row-cancelled .row-time::before {
    content: none;
  }

  /* Alerts banner — collapsible <details>, dimmed accent surface,
     amber/red tint for high-priority items. Sits between the header
     and the hero block when there is at least one matching alert. */
  .alerts {
    margin: 8px var(--linz-pad-x) 0;
    background: color-mix(
      in srgb,
      var(--warning-color, #ff9800) 14%,
      transparent
    );
    border-radius: var(--linz-radius-md);
    forced-color-adjust: none;
  }
  .alerts details {
    padding: 8px 12px;
  }
  .alerts-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--primary-text-color);
    list-style: none;
    /* Reasonable touch target — WCAG 2.5.8 AA. */
    min-height: 32px;
  }
  .alerts-summary::-webkit-details-marker {
    display: none;
  }
  .alerts-summary::marker {
    content: "";
  }
  .alerts-summary > span {
    flex: 1;
    min-width: 0;
  }
  .alerts-icon {
    --mdc-icon-size: 18px;
    color: var(--warning-color, #ff9800);
    flex-shrink: 0;
  }
  /* Chevron — rotates 180° when the <details> element is open. Same
     pattern wiener-linien-austria uses, but driven by native
     details[open] instead of a hand-managed _expanded set. */
  .alerts-chevron {
    margin-left: auto;
    --mdc-icon-size: 20px;
    color: var(--secondary-text-color);
    transition: transform var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
    flex-shrink: 0;
  }
  .alerts details[open] .alerts-chevron,
  details[open] > .alerts-summary .alerts-chevron {
    transform: rotate(180deg);
  }
  .alerts-list {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .alert {
    background: var(--card-background-color, #fff);
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 0.8rem;
    color: var(--primary-text-color);
  }
  .alert-high {
    border-left: 3px solid var(--linz-late);
  }
  .alert-title {
    font-weight: 600;
    margin-bottom: 4px;
  }
  .alert-body {
    color: var(--secondary-text-color);
    white-space: pre-line;
    overflow-wrap: anywhere;
    margin-bottom: 4px;
  }
  .alert-lines {
    color: var(--secondary-text-color);
    font-size: 0.7rem;
  }

  /* Line badge — compact pill, accent-tinted, FIXED width so 1-digit
     ("2"), 2-digit ("45"), and 3-digit ("191") line numbers all occupy
     the same horizontal slot and the row text columns line up. The
     icon is fixed-size; the number column gets centered inside the
     remaining space via justify-content: center. */
  .line-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    text-align: center;
    font-weight: var(--ha-font-weight-bold, 600);
    font-variant-numeric: tabular-nums;
    color: #fff;
    background: var(--linz-accent);
    border-radius: 6px;
    padding: 3px 6px;
    /* Width sized for icon + 3 digits. Use 'width' (not just min-width)
       so all badges share the same footprint regardless of line number
       length. box-sizing default of content-box would have the padding
       expand the visual width — keep border-box explicit. */
    box-sizing: border-box;
    width: 3.6em;
    font-size: 0.85rem;
    box-shadow: inset 0 -2px 0 color-mix(in srgb, #000 18%, transparent);
    forced-color-adjust: none;
    flex-shrink: 0;
  }
  .line-icon {
    --mdc-icon-size: 1rem;
    color: inherit;
    flex-shrink: 0;
  }
  .line-num {
    font-size: 0.85rem;
  }

  /* Mode-of-transport variants — solid badge fills.
     Tram / Stadtbahn (3, 4) keep the LINZ orange. U-Bahn (2) reads as
     blue, buses (5–7) as plum, train/S-Bahn (0, 1) as steel grey. */
  .line-badge[data-mot="0"],
  .line-badge[data-mot="1"] {
    background: #455a64;
  }
  .line-badge[data-mot="2"] {
    background: #1565c0;
  }
  .line-badge[data-mot="5"],
  .line-badge[data-mot="6"],
  .line-badge[data-mot="7"] {
    background: #6a1b9a;
  }

  .empty-state,
  .empty {
    padding: var(--ha-spacing-5, 20px) var(--ha-spacing-4, 16px);
    text-align: center;
    color: var(--secondary-text-color);
    font-style: italic;
  }

  /* Footer — same shape as wiener-linien-austria's .foot. Hairline
     divider, small text, right-pinned timestamp/attribution. Sits
     inside the card's horizontal padding so it lines up with the
     departure rows above. NOTE: never use backticks inside this CSS
     template — the whole string is wrapped in css''...'' (tagged
     template), so any inner backtick terminates the literal early. */
  .foot {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 var(--linz-pad-x);
    padding: 8px 0;
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
    font-size: 0.7rem;
    color: var(--secondary-text-color);
  }
  .timestamp {
    margin-left: auto;
    overflow-wrap: anywhere;
  }

  /* Container queries — narrow column layouts. */
  @container linzcard (inline-size < 360px) {
    .hero-min {
      font-size: 2.25rem;
    }
    .hero {
      grid-template-columns: auto 1fr;
      padding: var(--ha-spacing-2, 10px) var(--ha-spacing-3, 12px);
    }
    .row {
      gap: 8px;
      padding: 8px var(--ha-spacing-3, 12px);
    }
  }

  /* Reduced motion: catch every transition / animation we might add later. */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Version-mismatch banner — surfaced when the WS probe reports a
     different CARD_VERSION than the bundle in the user's tab. Sits at
     the top of <ha-card>, full-bleed (the card has no horizontal
     padding on its root). The reload button does a cache-wipe + hard
     reload via shared-render::reloadAfterCacheWipe. */
  .version-notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: var(--linz-warning, #f59e0b);
    color: #fff;
    padding: 10px 14px;
    font-size: 0.8125rem;
    font-weight: 500;
  }
  .version-reload-btn {
    flex-shrink: 0;
    background: #fff;
    color: var(--linz-warning, #f59e0b);
    border: none;
    border-radius: 999px;
    padding: 6px 14px;
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
  }
  .version-reload-btn:hover {
    background: rgba(255, 255, 255, 0.92);
  }
  .version-reload-btn:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
`;

/** Editor styles. HA form components ship their own theming — keep
 *  editor CSS to layout + spacing only. The per-line widgets at the
 *  bottom mirror wiener-linien-austria's editor section pattern. */
export const editorStyles = css`
  :host {
    display: block;
  }
  .editor {
    padding: var(--ha-spacing-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-spacing-3, 12px);
  }

  .editor-section {
    background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
    border-radius: var(--ha-radius-lg, 12px);
    padding: var(--ha-spacing-3, 14px) var(--ha-spacing-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-spacing-2, 10px);
  }
  .section-header {
    font-size: var(--ha-font-size-xs, 11px);
    font-weight: 600;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--secondary-text-color);
  }
  .editor-hint {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
    line-height: 1.4;
  }

  /* Line-filter chip grid — visual replacement for the ha-form select
     dropdown, since the dropdown can't render MDI icons in options.
     Chip drives the badge colour from --chip-color (set inline by
     editor.ts based on the line's MoT). Selected chips fill, unselected
     keep an outlined treatment so the active set is clear. */
  .line-chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .line-chip {
    --chip-color: var(--linz-accent, #f08000);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    height: 28px;
    border-radius: 999px;
    border: 1.5px solid var(--chip-color);
    background: transparent;
    color: var(--primary-text-color);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
    forced-color-adjust: none;
  }
  .line-chip ha-icon {
    --mdc-icon-size: 16px;
    color: var(--chip-color);
    flex-shrink: 0;
    transition: color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
  }
  .line-chip:hover {
    background: color-mix(in srgb, var(--chip-color) 16%, transparent);
  }
  .line-chip.is-selected {
    background: var(--chip-color);
    color: #fff;
    border-color: var(--chip-color);
  }
  .line-chip.is-selected ha-icon {
    color: #fff;
  }
  .line-chip:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .line-chip-add {
    display: flex;
    gap: 6px;
  }
  .line-chip-input {
    flex: 1;
    box-sizing: border-box;
    padding: 6px 10px;
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    background: var(--card-background-color, transparent);
    color: var(--primary-text-color);
    font-size: 0.85rem;
  }
  .line-chip-input:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
    border-color: transparent;
  }

  .per-line-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  /* Row layout: badge | walk-group | (1fr spacer) | colour-chip | clear.
     Walk group is fixed-width and visually one unit (no internal gap).
     Spacer (1fr) absorbs slack so the colour chip sits flush at the
     right edge regardless of badge width. The clear button collapses
     to a small × that doesn't dominate the row. */
  .per-line-row {
    display: grid;
    grid-template-columns: 3.6em auto 1fr auto 24px;
    align-items: center;
    gap: 10px;
    min-height: 36px;
  }
  .per-line-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--primary-text-color) 12%, transparent);
    border-radius: 6px;
    padding: 3px 8px;
    font-weight: var(--ha-font-weight-bold, 600);
    font-variant-numeric: tabular-nums;
    color: var(--primary-text-color);
    font-size: 0.85rem;
  }

  /* Walk-time group — input + unit pinned together so they read as one
     widget, no whitespace gap between them. */
  .per-line-walk-group {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    overflow: hidden;
    background: var(--card-background-color, transparent);
    height: 28px;
  }
  .per-line-walk {
    width: 3.5em;
    box-sizing: border-box;
    padding: 0 4px 0 8px;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .per-line-walk::-webkit-outer-spin-button,
  .per-line-walk::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }
  .per-line-walk:focus {
    outline: none;
  }
  .per-line-walk-group:focus-within {
    outline: 2px solid var(--primary-color);
    outline-offset: 1px;
  }
  .per-line-walk-unit {
    display: inline-flex;
    align-items: center;
    padding: 0 8px;
    font-size: 0.7rem;
    color: var(--secondary-text-color);
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    border-left: 1px solid var(--divider-color);
  }

  /* Colour pill — the wiener-linien chip pattern: tinted pill with
     icon + hex text, the actual <input type=color> sits invisibly on
     top so the OS picker opens on click anywhere on the chip. */
  .per-line-color-chip {
    --swatch-color: var(--linz-accent, #f08000);
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--swatch-color) 22%, transparent);
    color: var(--primary-text-color);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), transform var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
    min-width: 0;
    height: 28px;
    box-sizing: border-box;
  }
  .per-line-color-chip:hover {
    background: color-mix(in srgb, var(--swatch-color) 30%, transparent);
  }
  .per-line-color-chip:active {
    transform: translateY(1px);
  }
  .per-line-color-chip:focus-within {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .per-line-color-chip ha-icon {
    --mdc-icon-size: 16px;
    color: var(--swatch-color);
    flex-shrink: 0;
  }
  .per-line-color-hex {
    font-family: ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }
  /* The actual <input type="color"> covers the chip at opacity 0 so
     clicking anywhere on the chip opens the OS picker. */
  .per-line-color-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    border: 0;
    padding: 0;
    margin: 0;
    cursor: pointer;
    overflow: hidden;
  }

  /* Clear (×) button — small, circular, only visually present when a
     custom colour is set. Stays in the layout (the is-hidden class
     keeps the grid stable) but goes invisible + non-interactive
     otherwise. */
  .per-line-clear {
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--secondary-text-color);
    font-size: 1.1rem;
    line-height: 1;
    padding: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease), color var(--ha-transition-duration-fast, 160ms) var(--ha-transition-easing-standard, ease);
  }
  .per-line-clear.is-hidden {
    visibility: hidden;
    pointer-events: none;
  }
  .per-line-clear:hover {
    color: var(--linz-late, #c62828);
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
  }
  .per-line-clear:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
`;
