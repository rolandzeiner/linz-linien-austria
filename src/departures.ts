/**
 * The card's departure and alert selection, with no templates of its own:
 * which departures survive the card-side filters, which alerts concern
 * them, and where the header's maps link points.
 */
import { safeHttpsUri } from "./shared-render";
import type { AlertInfo, Departure, LinzLinienAustriaCardConfig } from "./types";

/** Minutes until departure: the realtime countdown when the integration
 *  sent one, else the scheduled one; null when neither is a number. The
 *  card's `_clockTimeFor` gates on the same field so the countdown and the
 *  clock beside it agree. */
export function countdownFor(d: Departure): number | null {
  if (typeof d.countdown_rt === "number") return d.countdown_rt;
  if (typeof d.countdown === "number") return d.countdown;
  return null;
}

/** Direction filter, per line — keyed on the stable `dir_code`, never
 *  on the headsign. The upstream rewrites `direction` for branching
 *  termini (a short-turning line 2 reads "Simonystraße", not
 *  "Universität"), so filtering on it would drop trips that do serve
 *  the direction the user asked for.
 *
 *  Per line rather than card-wide because `dir_code` is scoped to a
 *  line's own route: "H" on line 2 and "H" on line 46 point in
 *  unrelated directions, so one card-wide code cannot express "only
 *  the way I travel" at a multi-line stop.
 *
 *  Normalised because YAML is hand-written: "h" and "H " behave like
 *  "H". Anything that is not a known code is dropped, so a typo
 *  degrades to "no filter for that line" rather than to "filter
 *  everything out". The typeof guard keeps a non-string value
 *  (`line_directions: {"2": true}`) from throwing during render and
 *  blanking the whole card. */
function parseLineDirections(raw: unknown): Map<string, "H" | "R"> {
  const dirFilter = new Map<string, "H" | "R">();
  if (raw && typeof raw === "object") {
    for (const [line, code] of Object.entries(raw)) {
      const norm = typeof code === "string" ? code.trim().toUpperCase() : "";
      if (norm === "H" || norm === "R") dirFilter.set(line.trim(), norm);
    }
  }
  return dirFilter;
}

/** Apply the card-side line, direction and walk-time filters. Must be
 *  applied before the max-departures cap, so capping doesn't hide
 *  everything that matched the user's selected lines.
 *
 *  `anyFilterActive` says whether any filter is in a position to remove
 *  rows. It is derived here beside the filters themselves, rather than
 *  re-stated in render()'s empty-state branch — restating it is exactly how the
 *  walk-time filter came to be missing from that check: the list
 *  dropped rows the message then denied having dropped, so a stop that
 *  was merely out of reach on foot reported itself as having no service
 *  at all. A non-positive walk time is a no-op in the filter and must
 *  not count here either, or a stale `"2": 0` left in saved YAML would
 *  permanently change the empty-state wording. */
export function filterDepartures(
  all: Departure[],
  config: LinzLinienAustriaCardConfig,
): { filtered: Departure[]; anyFilterActive: boolean } {
  // Empty set means "no filter, pass through".
  const lineFilter = new Set((config.lines ?? []).map((l) => l.trim()).filter(Boolean));
  const dirFilter = parseLineDirections(config.line_directions);
  // Walk-time (Fußweg) filter — drop any departure whose effective
  // countdown is less than the configured walk time for that line.
  // Keyed by the bare line number; a missing or non-positive entry
  // means "no walk-time filter for this line".
  const walkTimes = config.walk_times ?? {};
  const anyFilterActive =
    lineFilter.size > 0 ||
    dirFilter.size > 0 ||
    Object.values(walkTimes).some((w) => typeof w === "number" && w > 0);
  const filtered = all.filter((d) => {
    if (lineFilter.size > 0 && !lineFilter.has(d.line)) return false;
    // A row without a `dir_code` passes regardless of the filter:
    // the upstream omits the code on replacement services, and
    // hiding a Schienenersatzverkehr is a worse failure than showing
    // one surplus row of the opposite direction. A line with no entry
    // in the map shows both directions.
    const wantDir = dirFilter.get(d.line);
    if (wantDir && d.dir_code && d.dir_code !== wantDir) return false;
    const walk = walkTimes[d.line];
    if (typeof walk === "number" && walk > 0) {
      const cd = countdownFor(d);
      if (cd === null || cd < walk) return false;
    }
    return true;
  });
  return { filtered, anyFilterActive };
}

/** Only the notices whose `affected_lines` overlap a line among
 *  `departures`: the rows that survived the card-side line, direction
 *  and walk-time filters, before the list cap. System-wide
 *  notices (no `affected_lines`) fall through unfiltered. The
 *  integration-side alerts list is broader — it includes every line
 *  that serves the stop, even ones not currently departing — so this
 *  trim avoids surfacing detours for routes the user doesn't care
 *  about right now. */
export function visibleAlerts(all: AlertInfo[], departures: Departure[]): AlertInfo[] {
  const visibleLines = new Set(departures.map((d) => d.line).filter(Boolean));
  return all.filter((a) => {
    const affected = a.affected_lines || [];
    if (affected.length === 0) return true; // system-wide
    return affected.some((line) => visibleLines.has(line));
  });
}

/** Maps URL — prefer the stop's WGS84 position, which the integration
 *  gets straight from the EFA (`coordOutputFormat=WGS84`). A lat/lon
 *  query lands on the actual bay; the name query can only land on
 *  whatever Google decides the name means. The name path stays as the
 *  fallback for entries whose first fetch hasn't resolved a position
 *  yet, and appends ", Linz" to names that don't already contain it, so
 *  a stop name can't resolve to a same-named place elsewhere. */
export function mapsUrlFor(lat: unknown, lon: unknown, stopName: string): string | null {
  const mapsQuery =
    typeof lat === "number" && typeof lon === "number"
      ? `${lat},${lon}`
      : stopName
        ? encodeURIComponent(/Linz/i.test(stopName) ? stopName : `${stopName}, Linz`)
        : "";
  // Self-built URL — still passed through `safeHttpsUri` so a future
  // contributor can't route an upstream attribute into it and bypass the
  // allowlist.
  return mapsQuery
    ? safeHttpsUri(`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`)
    : null;
}
