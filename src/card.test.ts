/**
 * @vitest-environment happy-dom
 *
 * Component tests for the departure card and its editor.
 *
 * The decorator check is the job a green build does not do on its own.
 * Rolldown lowers Lit's legacy decorators per tsconfig.json, and so does
 * vitest's Vite for these tests; nothing here runs the built bundle. It can
 * regress two ways, both with the build still green. The decorators stop
 * running: reading `elementProperties` back off the constructor catches
 * that. Or class fields overwrite Lit's accessors and the card stops
 * re-rendering: mounting a card catches that, through Lit's dev-mode check
 * or, failing that, the own-property assertion.
 *
 * `ha-card` is an HA element that does not exist here; happy-dom renders it
 * as an inert container, which is all these tests need.
 */
import { beforeAll, afterEach, describe, expect, it } from "vite-plus/test";

import type { HomeAssistant } from "./types";

type WindowWithCustomCards = Window & { customCards: Array<{ type: string }> };

/** Custom-element names recorded as the card module registers them. */
const registered: string[] = [];

beforeAll(async () => {
  // happy-dom keeps its registry private, so record names as they arrive.
  const realDefine = customElements.define.bind(customElements);
  customElements.define = (
    name: string,
    ctor: CustomElementConstructor,
    options?: ElementDefinitionOptions,
  ) => {
    registered.push(name);
    return realDefine(name, ctor, options);
  };
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

const hass = (states: HomeAssistant["states"] = {}): HomeAssistant => ({
  states,
  language: "en",
});

async function mount(config: Record<string, unknown>, h: HomeAssistant): Promise<Card> {
  const el = document.createElement("linz-linien-austria-card") as Card;
  el.setConfig({ type: "custom:linz-linien-austria-card", ...config });
  el.hass = h;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

const text = (el: Card): string => (el.shadowRoot?.textContent ?? "").replace(/\s+/g, " ").trim();

describe("registration", () => {
  it("defines the card and its editor", () => {
    expect(registered).toEqual(
      expect.arrayContaining(["linz-linien-austria-card", "linz-linien-austria-card-editor"]),
    );
  });

  it("offers the card in the card picker", () => {
    const cards = (window as unknown as WindowWithCustomCards).customCards;
    expect(cards.map((c) => c.type)).toContain("linz-linien-austria-card");
  });
});

describe("decorators", () => {
  const reactive = ["hass", "config", "_versionMismatch", "_expandedStops"];

  it("keeps Lit's reactive properties through decorator lowering", () => {
    const ctor = customElements.get("linz-linien-austria-card") as unknown as {
      elementProperties: Map<PropertyKey, unknown>;
    };
    const props = [...ctor.elementProperties.keys()].map(String);
    for (const name of reactive) {
      expect(props).toContain(name);
    }
  });

  it("leaves a mounted card's reactive properties to Lit's accessors", async () => {
    // A class field would define an own property on the instance,
    // shadowing the accessor Lit put on the prototype.
    const el = await mount({}, hass());
    for (const name of reactive) {
      expect(Object.hasOwn(el, name)).toBe(false);
    }
  });
});

describe("card API", () => {
  it.each([null, "nope"])("rejects the config %j", (config) => {
    const el = document.createElement("linz-linien-austria-card") as Card;
    expect(() => el.setConfig(config)).toThrow("Invalid configuration");
  });

  it("accepts a config without an entity, as the card picker adds it", () => {
    const el = document.createElement("linz-linien-austria-card") as Card;
    expect(() => el.setConfig({ type: "custom:linz-linien-austria-card" })).not.toThrow();
  });
});

describe("empty states", () => {
  it("asks for an entity when none is picked", async () => {
    const el = await mount({}, hass());
    expect(text(el)).toContain("No entity selected.");
  });

  it("says when the picked entity is missing", async () => {
    const el = await mount({ entity: "sensor.gone" }, hass());
    expect(text(el)).toContain("The selected entity is not available right now.");
  });

  // An outage used to read as "No upcoming departures", which is what a quiet
  // stop says too, so a dead API looked like a broken install.
  const unavailable = (): HomeAssistant =>
    hass({
      "sensor.hbf": {
        entity_id: "sensor.hbf",
        state: "unavailable",
        attributes: { friendly_name: "Linz Hauptbahnhof" },
      },
    });

  it("says it can't reach LINZ AG LINIEN when the sensor is unavailable", async () => {
    const el = await mount({ entity: "sensor.hbf" }, unavailable());
    const notice = el.shadowRoot!.querySelector(".empty");
    expect(notice?.querySelector(".empty-title")?.textContent?.trim()).toBe(
      "Can't reach LINZ AG LINIEN",
    );
    expect(notice?.getAttribute("role")).toBe("status");
    expect(text(el)).not.toContain("No upcoming departures");
  });

  it("shows the notice on a hero-only card too", async () => {
    const el = await mount({ entity: "sensor.hbf", max_departures: 0 }, unavailable());
    expect(text(el)).toContain("Can't reach LINZ AG LINIEN");
  });

  // Without max_departures the cap used to fall back to the departure count,
  // 0 on an empty stop, which hid the list and its empty row with it.
  it.each([
    ["set", { max_departures: 5 }],
    ["unset", {}],
  ])(
    "still says no departures for an available, empty stop (max_departures %s)",
    async (_, cap) => {
      const el = await mount(
        { entity: "sensor.hbf", ...cap },
        hass({
          "sensor.hbf": {
            entity_id: "sensor.hbf",
            state: "unknown",
            attributes: { stop_name: "Linz Hauptbahnhof", departures: [] },
          },
        }),
      );
      expect(text(el)).toContain("No upcoming departures");
      expect(text(el)).not.toContain("Can't reach");
    },
  );

  it("follows the card's language over Home Assistant's", async () => {
    const el = await mount({ language: "de" }, hass());
    expect(text(el)).toContain("Keine Entität ausgewählt.");
  });

  // A profile language switch hands the card a new hass whose states are
  // unchanged; the re-render gate used to skip it and keep the old text.
  it.each([
    ["no entity", {}, "Keine Entität ausgewählt."],
    ["a missing entity", { entity: "sensor.gone" }, "Die ausgewählte Entität"],
  ])("repaints on a language switch with %s", async (_, config, german) => {
    const h = hass();
    const el = await mount(config, h);
    el.hass = { ...h, language: "de" };
    await el.updateComplete;
    expect(text(el)).toContain(german);
  });
});

describe("language of parts", () => {
  const departure = (direction: string, countdown: number, scheduled: string) => ({
    line: "2",
    direction,
    countdown,
    scheduled,
    is_realtime: true,
  });
  const stop = (): HomeAssistant =>
    hass({
      "sensor.hbf": {
        entity_id: "sensor.hbf",
        state: "3",
        attributes: {
          stop_name: "Linz Hauptbahnhof",
          departures: [
            departure("Universität", 3, "2026-10-23T10:00:00+02:00"),
            departure("Solarcity", 8, "2026-10-23T10:05:00+02:00"),
          ],
        },
      },
    });

  // WCAG 3.1.2: upstream German names keep a German voice on an English
  // dashboard; the card's own localised labels must not be tagged.
  it("marks upstream stop names and destinations as German", async () => {
    const el = await mount({ entity: "sensor.hbf" }, stop());
    const root = el.shadowRoot!;
    expect(root.querySelector(".title")?.getAttribute("lang")).toBe("de");
    for (const sel of [".hero-direction", ".row-direction"]) {
      const node = root.querySelector(sel);
      expect(node, sel).not.toBeNull();
      expect(node?.getAttribute("lang"), sel).toBe("de");
    }
  });

  it("leaves a user-entered title untagged", async () => {
    const el = await mount({ entity: "sensor.hbf", name: "Home stop" }, stop());
    expect(el.shadowRoot!.querySelector(".title")?.hasAttribute("lang")).toBe(false);
  });
});
