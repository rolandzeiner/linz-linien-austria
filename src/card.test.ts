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

  it("follows the card's language over Home Assistant's", async () => {
    const el = await mount({ language: "de" }, hass());
    expect(text(el)).toContain("Keine Entität ausgewählt.");
  });
});
