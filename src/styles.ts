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
    display: block;
  }

  ha-card {
    overflow: hidden;
    container-type: inline-size;
    container-name: linzcard;
    --linz-accent: #f08000;
    --linz-rt: #2e7d32;
    --linz-late: #c62828;
    --linz-early: #1565c0;
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--ha-space-2, 8px);
    padding: var(--ha-space-4, 16px) var(--ha-space-4, 16px) 0;
  }
  .header-icon {
    color: var(--linz-accent);
    --mdc-icon-size: 1.5rem;
  }
  .title {
    margin: 0;
    font-size: var(--ha-font-size-l, 1.125rem);
    font-weight: var(--ha-font-weight-medium, 600);
    line-height: 1.2;
  }

  /* Hero block — large countdown to next departure. */
  .hero {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--ha-space-3, 12px);
    align-items: center;
    padding: var(--ha-space-3, 12px) var(--ha-space-4, 16px);
    margin: var(--ha-space-2, 8px) var(--ha-space-4, 16px) 0;
    border-radius: var(--ha-border-radius-lg, 12px);
    background: color-mix(
      in srgb,
      var(--linz-accent) 12%,
      transparent
    );
  }
  .hero-time {
    display: flex;
    align-items: baseline;
    gap: 4px;
    color: var(--linz-accent);
  }
  .hero-min {
    font-size: 2.75rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .hero-unit {
    font-size: 1rem;
    font-weight: 600;
    color: var(--secondary-text-color);
  }
  .hero-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .hero-line {
    display: flex;
    align-items: center;
    gap: var(--ha-space-2, 8px);
    min-width: 0;
  }
  .hero-direction {
    font-weight: 500;
    color: var(--primary-text-color);
    overflow-wrap: anywhere;
  }
  .rt-pill {
    align-self: flex-start;
    font-size: 0.6875rem;
    font-weight: 600;
    color: white;
    background: var(--linz-rt);
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.04em;
  }

  /* Departures list. */
  .departures {
    list-style: none;
    margin: var(--ha-space-2, 8px) 0 0;
    padding: 0;
  }
  .row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--ha-space-2, 10px);
    padding: var(--ha-space-2, 10px) var(--ha-space-4, 16px);
    border-top: 1px solid var(--divider-color);
    min-height: 44px;
  }
  .row:first-child {
    border-top: none;
  }
  .row-direction {
    overflow-wrap: anywhere;
    color: var(--primary-text-color);
  }
  .row-time {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--secondary-text-color);
    white-space: nowrap;
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
  .row-rt .row-time {
    text-decoration: underline dotted var(--linz-rt) 1.5px;
    text-underline-offset: 3px;
  }

  /* Line badge — colored pill with mode icon and line number. */
  .line-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: color-mix(
      in srgb,
      var(--linz-accent) 14%,
      transparent
    );
    color: var(--primary-text-color);
    border-radius: 6px;
    padding: 4px 8px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    min-width: 56px;
    justify-content: center;
  }
  .line-icon {
    --mdc-icon-size: 1rem;
    color: var(--linz-accent);
    flex-shrink: 0;
  }
  .line-num {
    font-size: 0.875rem;
  }

  /* Mode-of-transport accent variants. */
  .line-badge[data-mot="2"] {
    background: color-mix(in srgb, #1565c0 14%, transparent);
  }
  .line-badge[data-mot="2"] .line-icon {
    color: #1565c0;
  }
  .line-badge[data-mot="4"] {
    background: color-mix(in srgb, var(--linz-accent) 14%, transparent);
  }
  .line-badge[data-mot="5"],
  .line-badge[data-mot="6"],
  .line-badge[data-mot="7"] {
    background: color-mix(in srgb, #6a1b9a 14%, transparent);
  }
  .line-badge[data-mot="5"] .line-icon,
  .line-badge[data-mot="6"] .line-icon,
  .line-badge[data-mot="7"] .line-icon {
    color: #6a1b9a;
  }

  .empty-state,
  .empty {
    padding: var(--ha-space-5, 20px) var(--ha-space-4, 16px);
    text-align: center;
    color: var(--secondary-text-color);
    font-style: italic;
  }

  .footer {
    padding: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
    color: var(--secondary-text-color);
    font-size: var(--ha-font-size-xs, 0.6875rem);
    text-align: right;
    overflow-wrap: anywhere;
  }

  /* Container queries — narrow column layouts. */
  @container linzcard (inline-size < 360px) {
    .hero-min {
      font-size: 2.25rem;
    }
    .hero {
      grid-template-columns: auto 1fr;
      padding: var(--ha-space-2, 10px) var(--ha-space-3, 12px);
    }
    .row {
      gap: 8px;
      padding: 8px var(--ha-space-3, 12px);
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
`;

/** Editor styles. HA form components ship their own theming — keep
 *  editor CSS to layout + spacing only. */
export const editorStyles = css`
  :host {
    display: block;
  }
  .editor {
    padding: var(--ha-space-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-3, 12px);
  }
`;
