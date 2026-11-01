/**
 * @vitest-environment happy-dom
 *
 * Snapshots of the card's rendered markup across the configs that steer
 * render(): header and maps link, the card-side line / direction /
 * walk-time filters, the hero, the list cap, alerts and the empty states.
 * They pin what the card draws, so a restructuring of render() that keeps
 * every snapshot unchanged has kept the output unchanged for these configs.
 *
 * Lit's comment markers and the whitespace between tags are stripped, so
 * moving a template around does not show up as a change; attribute order
 * and text do.
 */
import { afterEach, beforeAll, describe, expect, it } from "vite-plus/test";

import type { HomeAssistant } from "./types";

beforeAll(async () => {
  await import("./linz-linien-austria-card");
});

afterEach(() => {
  document.body.replaceChildren();
});

type Card = HTMLElement & {
  hass: HomeAssistant;
  setConfig(config: unknown): void;
  updateComplete: Promise<boolean>;
};

const dep = (extra: Record<string, unknown>) => ({
  line: "2",
  direction: "Universität",
  dir_code: "H",
  mot: 4,
  countdown: 3,
  scheduled: "2026-10-23T10:00:00+02:00",
  platform: "B",
  ...extra,
});

const departures = [
  dep({}),
  dep({ direction: "solarCity", dir_code: "R", countdown: 5 }),
  dep({ line: "17", mot: 5, direction: "Hart", dir_code: "H", countdown: 7, platform: "3" }),
  dep({ line: "17", mot: 5, direction: "Linz Hbf", dir_code: "R", countdown: 12, platform: "4" }),
  dep({ line: "SEV", mot: 5, direction: "Ersatz", dir_code: undefined, countdown: 15 }),
];

const alert = (info_id: string, title: string, affected_lines: string[], priority: string) => ({
  info_id,
  title,
  description: `${title}: Umleitung`,
  description_html: "",
  affected_lines,
  info_type: "lineInfo",
  priority,
});

// The integration always sends `affected_lines`; empty means system-wide.
const alerts = [
  alert("a1", "Netzweit", [], "normal"),
  alert("a2", "Linie 2", ["2"], "veryHigh"),
  alert("a3", "Linie 99", ["99"], "normal"),
];

const stop = (attrs: Record<string, unknown> = {}, state = "5"): HomeAssistant => ({
  language: "en",
  states: {
    "sensor.hbf": {
      entity_id: "sensor.hbf",
      state,
      attributes: {
        stop_name: "Hauptbahnhof",
        friendly_name: "Hbf sensor",
        latitude: 48.29,
        longitude: 14.29,
        departures,
        alerts,
        ...attrs,
      },
    },
  },
});

async function markup(config: Record<string, unknown>, h: HomeAssistant): Promise<string> {
  const el = document.createElement("linz-linien-austria-card") as Card;
  el.setConfig({ type: "custom:linz-linien-austria-card", entity: "sensor.hbf", ...config });
  el.hass = h;
  document.body.append(el);
  await el.updateComplete;
  return (el.shadowRoot?.innerHTML ?? "")
    .replace(/<!--[^]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

describe("render", () => {
  it.each<[string, Record<string, unknown>, Record<string, unknown>?, string?]>([
    ["defaults", {}],
    ["platform and a user title", { show_platform: true, name: "Home" }],
    [
      "hidden header, no hero, no pulse",
      { hide_header: true, show_hero: false, pulse_live: false },
    ],
    ["animations on", { enable_animations: true }],
    ["alerts off", { show_alerts: false }],
    ["line filter", { lines: [" 17 ", ""] }],
    [
      "per-line direction filter, normalised and with junk",
      { line_directions: { "2": "h ", "17": true, " SEV ": "R" } },
    ],
    ["walk-time filter", { walk_times: { "2": 4, "17": 0 } }],
    ["filters that remove everything", { lines: ["99"] }],
    ["a stale zero walk time on an empty stop", { walk_times: { "2": 0 } }, { departures: [] }],
    ["hero only", { max_departures: 0 }],
    ["capped list", { max_departures: 1 }],
    ["negative cap", { max_departures: -3 }],
    ["hero takes the only departure", {}, { departures: [departures[0]] }],
    ["no hero and an empty stop", { show_hero: false }, { departures: [] }],
    ["maps link by name", {}, { latitude: undefined, longitude: undefined }],
    [
      "maps link by a name that already says Linz",
      {},
      { latitude: undefined, longitude: undefined, stop_name: "Linz/Donau Hbf" },
    ],
    [
      "no maps link without position or name",
      {},
      { latitude: undefined, longitude: undefined, stop_name: "", friendly_name: "" },
    ],
    [
      "platform without a direction",
      { show_platform: true },
      { departures: [dep({ direction: "" })] },
    ],
    ["unavailable sensor", {}, { departures: undefined }, "unavailable"],
  ])("%s", async (_, config, attrs, state) => {
    expect(await markup(config, stop(attrs, state))).toMatchSnapshot();
  });
});
