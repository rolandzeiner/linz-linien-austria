/**
 * One table of defaults, shared by the card and its editor.
 *
 * ha-form knows nothing about a card's defaults. Given a config without a
 * key, it draws a boolean as OFF, a dropdown as blank and a slider at its
 * minimum. So an editor fed the raw config shows every default-on option
 * switched off while the card renders it on. This card shipped that bug
 * twice: first for every default-on toggle, then — after a hand-kept list
 * of default-on keys in the editor — for `show_hero`, which the list
 * omitted while the card defaulted it on.
 *
 * The rule: every optional field's default lives in DEFAULTS and nowhere
 * else. The card reads its config through normaliseConfig() and never
 * writes an inline default (a `!== false` read, a `?? 6` fallback) — an
 * inline default is invisible to the editor, which is exactly how the two
 * drift apart. The editor shows normaliseConfig(config) and saves
 * tidyConfig(next). Verification gate:
 *   rg -n 'config\.\w+ (!== false|\?\? (true|false|-?[0-9]))' src/
 * should find nothing.
 *
 * Not in the table, on purpose: `max_departures` (unset means "no cap",
 * which no number can stand for), `name` (falls back to the stop's own
 * name, which only the entity knows) and the per-line Records and lists
 * (`lines`, `line_directions`, `walk_times`, `line_colors`), whose
 * absence already means "no filter / no override".
 */
import type { LinzLinienAustriaCardConfig } from "./types";

export const DEFAULTS = {
  hide_header: false,
  show_hero: true,
  show_platform: false,
  show_absolute_time: false,
  show_delay_colors: true,
  show_alerts: true,
  pulse_live: true,
  enable_animations: false,
} as const satisfies Partial<LinzLinienAustriaCardConfig>;

/** "" is what a cleared text field or dropdown hands back. */
const isUnset = (value: unknown): boolean =>
  value === undefined || value === null || value === "";

/** The config with every default filled in: what the card renders and what
 *  the editor shows. Unset values (undefined, null, "") fall back to the
 *  default instead of blanking it out. The user's keys keep their order and
 *  the defaults follow them: ha-form saves back in this order, so filling
 *  defaults in first would move every changed option above `entity` in
 *  the saved YAML. */
export function normaliseConfig(
  config: LinzLinienAustriaCardConfig,
): LinzLinienAustriaCardConfig {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (!isUnset(value)) out[key] = value;
  }
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (!(key in out)) out[key] = value;
  }
  return out as LinzLinienAustriaCardConfig;
}

/** The config as the editor saves it: only what differs from DEFAULTS,
 *  cleared fields dropped, `type` first. Two reasons to leave defaults out:
 *  the YAML stays as short as the user wrote it, and a default saved into
 *  the config is pinned — a later change to DEFAULTS would never reach
 *  that card. Records and lists are never equal to a default, so the
 *  per-line sections round-trip untouched. */
export function tidyConfig(
  config: LinzLinienAustriaCardConfig,
): LinzLinienAustriaCardConfig {
  const defaults: Record<string, unknown> = DEFAULTS;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (isUnset(value)) continue;
    if (key in defaults && defaults[key] === value) continue;
    out[key] = value;
  }
  const { type, ...rest } = out;
  return { type, ...rest } as LinzLinienAustriaCardConfig;
}
