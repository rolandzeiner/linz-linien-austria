// Single source of truth for the Mentz EFA mode-of-transport tables
// the card and the editor both consume. Numbers match the spec page 52
// of the Mentz EFA documentation that the Python side mirrors in
// `custom_components/linz_linien_austria/parser.py::_MOT_NAMES`.
//
// Kept deliberately small — these are lookup tables, not classes.
// The card's CSS in `styles.ts` declares the same hex values via
// `[data-mot="N"]` selectors; if you tweak a colour here, mirror it
// there (Lit `css` literals can't read TS consts at parse time).

/** Material icon for each mode of transport. Falls back via the
 *  helper to the caller-supplied default when the upstream sends an
 *  unknown id. */
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

/** Default badge / accent colour per MoT. The "tram default"
 *  ``#f08000`` doubles as the card's `--linz-accent`; we return it
 *  for any id not in the table so callers don't need a separate
 *  fallback path. */
const MOT_COLOR_DEFAULT = "#f08000";

const MOT_COLORS: Record<number, string> = {
  0: "#455a64", // train
  1: "#455a64", // S-Bahn
  2: "#1565c0", // U-Bahn
  5: "#6a1b9a", // city bus
  6: "#6a1b9a", // regional bus
  7: "#6a1b9a", // express bus
};

/** Look up the icon for a MoT id, returning ``fallback`` for
 *  unknowns (or the tram icon if no fallback is supplied). */
export function motIcon(
  mot: number | undefined,
  fallback = "mdi:tram",
): string {
  if (mot === undefined) return fallback;
  return MOT_ICON[mot] ?? fallback;
}

/** The card's hero / header treatment uses ``null`` for "fall back to
 *  the tram default via CSS custom properties"; the editor swatch
 *  needs a concrete colour. ``motColor`` returns ``null`` for the
 *  tram default; ``motColorOrDefault`` returns the hex. */
export function motColor(mot: number | undefined): string | null {
  if (mot === undefined) return null;
  return MOT_COLORS[mot] ?? null;
}

export function motColorOrDefault(mot: number | undefined): string {
  return motColor(mot) ?? MOT_COLOR_DEFAULT;
}
