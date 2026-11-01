/**
 * @vitest-environment happy-dom
 *
 * The editor's own widgets below ha-form: the line-filter chips, built from
 * the stop's roster, the live departures and the saved `lines`; and the
 * per-line rows with walk time, H / R / both direction buttons and colour;
 * plus the ha-form wiring: the missing-entity warning, the label fallback
 * order and saving without defaults.
 * `ha-form`, `ha-icon` and `ha-alert` don't exist here and render as inert
 * containers.
 */
import { afterEach, beforeAll, describe, expect, it } from "vite-plus/test";

import type { HomeAssistant, LinzLinienAustriaCardConfig } from "./types";

beforeAll(async () => {
  await import("./editor");
});

afterEach(() => {
  document.body.replaceChildren();
});

type Editor = HTMLElement & {
  hass: HomeAssistant;
  setConfig(config: LinzLinienAustriaCardConfig): void;
  updateComplete: Promise<boolean>;
};

const stop = (attrs: Record<string, unknown>): HomeAssistant => ({
  language: "en",
  states: { "sensor.hbf": { entity_id: "sensor.hbf", state: "3", attributes: attrs } },
});

const liveDepartures = [
  { line: "2", direction: "Universität", dir_code: "H", mot: 4 },
  { line: "2", direction: "Simonystraße", dir_code: "H", mot: 4 },
  { line: "2", direction: "solarCity", dir_code: "R", mot: 4 },
  { line: "17", direction: "Hart", dir_code: "H", mot: 5 },
  { line: "N82", direction: " ", dir_code: "R" },
  { line: "", direction: "Nowhere", dir_code: "H" },
  { line: "SEV", direction: "Ersatz" },
];

async function mount(
  config: Record<string, unknown>,
  h: HomeAssistant,
): Promise<{ el: Editor; events: LinzLinienAustriaCardConfig[] }> {
  const el = document.createElement("linz-linien-austria-card-editor") as Editor;
  el.setConfig({
    type: "custom:linz-linien-austria-card",
    entity: "sensor.hbf",
    ...config,
  });
  el.hass = h;
  const events: LinzLinienAustriaCardConfig[] = [];
  el.addEventListener("config-changed", (ev) =>
    events.push((ev as CustomEvent<{ config: LinzLinienAustriaCardConfig }>).detail.config),
  );
  document.body.append(el);
  await el.updateComplete;
  return { el, events };
}

const root = (el: Editor): ShadowRoot => el.shadowRoot!;
const chips = (el: Editor): string[] =>
  [...root(el).querySelectorAll(".line-chip span")].map((s) => s.textContent ?? "");
const rows = (el: Editor): string[] =>
  [...root(el).querySelectorAll(".per-line-badge")].map((s) => s.textContent ?? "");
const dirButtons = (el: Editor, line: string): HTMLButtonElement[] => {
  const row = [...root(el).querySelectorAll(".per-line-row")].find(
    (r) => r.querySelector(".per-line-badge")?.textContent === line,
  );
  return [...(row?.querySelectorAll<HTMLButtonElement>(".per-line-dir") ?? [])];
};

describe("line chips", () => {
  it("unions the roster, the live departures and the saved lines, sorted", async () => {
    const { el } = await mount(
      { lines: ["99", ""] },
      stop({ lines_at_stop: ["17", "2", "", 7], departures: liveDepartures }),
    );
    expect(chips(el)).toEqual(["2", "17", "99", "N82", "SEV"]);
  });

  it("colours a chip by its line's mode of transport", async () => {
    const { el } = await mount({}, stop({ departures: liveDepartures }));
    const tram = root(el).querySelector<HTMLElement>(".line-chip");
    expect(tram?.getAttribute("style")).toBe("--chip-color: #f08000;");
    expect(tram?.querySelector("ha-icon")?.getAttribute("icon")).toBe("mdi:tram");
  });

  it("shows only the saved lines without an entity", async () => {
    const { el } = await mount({ entity: undefined, lines: ["3"] }, stop({}));
    expect(chips(el)).toEqual(["3"]);
  });

  it("says there is no data yet when nothing is known", async () => {
    const { el } = await mount({}, stop({}));
    expect(chips(el)).toEqual([]);
    expect(root(el).querySelectorAll(".per-line-row")).toHaveLength(0);
    expect(root(el).textContent).toContain("Pick an entity above to see its lines here.");
  });

  it("toggles a line in and out of the filter", async () => {
    const { el, events } = await mount({ lines: ["17"] }, stop({ departures: liveDepartures }));
    root(el).querySelector<HTMLButtonElement>(".line-chip")!.click();
    expect(events.at(-1)?.lines).toEqual(["2", "17"]);
    await el.updateComplete;
    root(el).querySelector<HTMLButtonElement>(".line-chip")!.click();
    root(el).querySelectorAll<HTMLButtonElement>(".line-chip")[1]!.click();
    expect(events.at(-1)).not.toHaveProperty("lines");
  });

  it("adds a custom line on Enter and ignores a blank one", async () => {
    const { el, events } = await mount({}, stop({ departures: liveDepartures }));
    const input = root(el).querySelector<HTMLInputElement>(".line-chip-input")!;
    input.value = "  ";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(events).toHaveLength(0);
    input.value = " 45 ";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(events.at(-1)?.lines).toEqual(["45"]);
    expect(input.value).toBe("");
  });
});

describe("per-line rows", () => {
  it("lists only the filtered lines when a filter is set", async () => {
    const { el } = await mount({ lines: ["17", "2"] }, stop({ departures: liveDepartures }));
    expect(rows(el)).toEqual(["2", "17"]);
  });

  it("labels the directions from the roster and greys a direction it doesn't list", async () => {
    const { el } = await mount(
      {},
      stop({
        line_destinations: {
          "2": { H: " Universität ", R: "solarCity" },
          "17": { H: "Hart" },
          bad: null,
        },
        departures: liveDepartures,
      }),
    );
    const [h2, r2, both2] = dirButtons(el, "2");
    expect(h2?.title).toBe("Outbound → Universität");
    expect(r2?.title).toBe("Inbound → solarCity");
    expect(both2?.title).toBe("Both directions: Universität ↔ solarCity");
    expect(both2?.getAttribute("aria-pressed")).toBe("true");

    const [h17, r17, both17] = dirButtons(el, "17");
    expect(h17?.disabled).toBe(false);
    expect(r17?.disabled).toBe(true);
    expect(r17?.title).toContain("Inbound");
    expect(both17?.title).toBe("Only runs towards Hart from here");
    expect(both17?.disabled).toBe(true);
  });

  it("keeps a saved filter for an unserved direction clearable", async () => {
    const { el } = await mount(
      { line_directions: { "17": "R" } },
      stop({ line_destinations: { "17": { H: "Hart" } }, departures: liveDepartures }),
    );
    const [, r17, both17] = dirButtons(el, "17");
    expect(r17?.disabled).toBe(false);
    expect(r17?.getAttribute("aria-pressed")).toBe("true");
    expect(both17?.disabled).toBe(false);
  });

  it("names a one-way line without a known terminus", async () => {
    const { el } = await mount({}, stop({ line_destinations: { "5": {} }, lines_at_stop: ["5"] }));
    const [, , both] = dirButtons(el, "5");
    expect(both?.title).toBe("Only one direction runs from this stop");
  });

  it("falls back to the first live headsign without a roster and never disables", async () => {
    const { el } = await mount({}, stop({ departures: liveDepartures }));
    const [h2, r2, both2] = dirButtons(el, "2");
    expect(h2?.title).toBe("Outbound → Universität");
    expect(r2?.title).toBe("Inbound → solarCity");
    expect(both2?.title).toBe("Both directions: Universität ↔ solarCity");
    const [h17, r17, both17] = dirButtons(el, "17");
    expect(r17?.title).toBe("Inbound");
    expect(both17?.title).toBe("Both directions");
    expect([h17, r17, both17].every((b) => !b?.disabled)).toBe(true);
    expect(dirButtons(el, "N82")[1]?.title).toBe("Inbound");
  });

  it("stores a direction and drops the map once it empties", async () => {
    const { el, events } = await mount({}, stop({ departures: liveDepartures }));
    dirButtons(el, "2")[0]!.click();
    expect(events.at(-1)?.line_directions).toEqual({ "2": "H" });
    await el.updateComplete;
    dirButtons(el, "2")[2]!.click();
    expect(events.at(-1)).not.toHaveProperty("line_directions");
  });

  it("saves a walk time rounded and clears a non-positive one", async () => {
    const { el, events } = await mount(
      { walk_times: { "17": 5 } },
      stop({ departures: liveDepartures }),
    );
    const walk = root(el).querySelector<HTMLInputElement>(".per-line-walk")!;
    walk.value = "3.6";
    walk.dispatchEvent(new Event("change"));
    expect(events.at(-1)?.walk_times).toEqual({ "17": 5, "2": 4 });
    walk.value = "-1";
    walk.dispatchEvent(new Event("change"));
    expect(events.at(-1)?.walk_times).toEqual({ "17": 5 });
    walk.value = "";
    walk.dispatchEvent(new Event("change"));
    expect(events.at(-1)?.walk_times).toEqual({ "17": 5 });
  });

  it("sets and clears a line colour, defaulting to the mode-of-transport tint", async () => {
    const { el, events } = await mount({}, stop({ departures: liveDepartures }));
    const swatch = root(el).querySelector<HTMLInputElement>(".per-line-color-input")!;
    expect(swatch.value).toBe("#f08000");
    swatch.value = "#123456";
    swatch.dispatchEvent(new Event("input"));
    expect(events.at(-1)?.line_colors).toEqual({ "2": "#123456" });
    await el.updateComplete;
    root(el).querySelector<HTMLButtonElement>(".per-line-clear")!.click();
    expect(events.at(-1)).not.toHaveProperty("line_colors");
  });
});

describe("form wiring", () => {
  it("warns when the saved entity is gone", async () => {
    const { el } = await mount({ entity: "sensor.gone" }, stop({}));
    expect(root(el).querySelector("ha-alert")?.textContent).toContain("sensor.gone");
  });

  it("labels fields from HA first, then its own strings, then the raw name", async () => {
    const { el } = await mount(
      {},
      {
        ...stop({}),
        localize: (key: string) => (key.endsWith(".entity") ? "Entity (HA)" : ""),
      },
    );
    const form = root(el).querySelector("ha-form") as unknown as {
      computeLabel: (f: { name: string }) => string;
      computeHelper: (f: { name: string }) => string | undefined;
      data: Record<string, unknown>;
    };
    expect(form.computeLabel({ name: "entity" })).toBe("Entity (HA)");
    expect(form.computeLabel({ name: "show_hero" })).not.toBe("show_hero");
    expect(form.computeLabel({ name: "nonsense" })).toBe("nonsense");
    expect(form.computeHelper({ name: "nonsense" })).toBeUndefined();
    expect(form.data.show_hero).toBe(true);
  });

  it("saves the form's value without defaults", async () => {
    const { el, events } = await mount({}, stop({}));
    root(el)
      .querySelector("ha-form")!
      .dispatchEvent(
        new CustomEvent("value-changed", {
          detail: {
            value: {
              type: "custom:linz-linien-austria-card",
              entity: "sensor.hbf",
              show_hero: true,
              show_alerts: false,
            },
          },
        }),
      );
    expect(events.at(-1)).toEqual({
      type: "custom:linz-linien-austria-card",
      entity: "sensor.hbf",
      show_alerts: false,
    });
  });
});
