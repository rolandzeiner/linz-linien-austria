/**
 * The card's pure helpers: config defaults, translation lookup, the
 * mode-of-transport tables and the accent-text contrast clamp. They run in
 * plain node; only colour input that needs CSSOM (named, rgb(), hsl()) is
 * out of reach here.
 */
import { describe, expect, it } from "vite-plus/test";

import { accentTextColor } from "./color";
import { normaliseConfig, tidyConfig } from "./config";
import { translate } from "./localize/localize";
import { motColor, motColorOrDefault, motIcon } from "./mot";
import type { LinzLinienAustriaCardConfig } from "./types";

const base = { type: "custom:linz-linien-austria-card", entity: "sensor.stop" };
const config = (extra: Record<string, unknown> = {}): LinzLinienAustriaCardConfig => ({
  ...base,
  ...extra,
});

describe("normaliseConfig", () => {
  it("fills in every default after the user's keys", () => {
    const out = normaliseConfig(config({ show_alerts: false }));
    expect(Object.keys(out).slice(0, 3)).toEqual(["type", "entity", "show_alerts"]);
    expect(out.show_alerts).toBe(false);
    expect(out.show_hero).toBe(true);
    expect(out.enable_animations).toBe(false);
  });

  it("treats a cleared field as unset", () => {
    const out = normaliseConfig(config({ show_hero: "", hide_header: null }));
    expect(out.show_hero).toBe(true);
    expect(out.hide_header).toBe(false);
  });
});

describe("tidyConfig", () => {
  it("drops defaults and cleared fields and puts type first", () => {
    const out = tidyConfig({
      entity: "sensor.stop",
      show_hero: true,
      show_alerts: false,
      language: "",
      type: "custom:linz-linien-austria-card",
    });
    expect(out).toEqual({ ...base, show_alerts: false });
    expect(Object.keys(out)[0]).toBe("type");
  });

  it("round-trips per-line records untouched", () => {
    const lines = { line_directions: { "1": "H" } };
    expect(tidyConfig(config(lines))).toEqual(config(lines));
  });
});

describe("translate", () => {
  it("prefers the card's language over Home Assistant's", () => {
    expect(translate("card.at_time", { configLanguage: "de", hassLanguage: "en" })).toBe(
      "um {time}",
    );
  });

  it("strips a region suffix and falls back to English", () => {
    expect(translate("card.at_time", { hassLanguage: "de-AT" })).toBe("um {time}");
    expect(translate("card.at_time", { hassLanguage: "fr" })).toBe("at {time}");
    expect(translate("card.at_time", {})).toBe("at {time}");
  });

  it("fills placeholders and returns unknown keys as they are", () => {
    expect(translate("card.at_time", {}, { time: "12:05" })).toBe("at 12:05");
    expect(translate("card.no_such_key", {})).toBe("card.no_such_key");
  });
});

describe("mode of transport", () => {
  it("maps known ids and falls back for unknown ones", () => {
    expect(motIcon(5)).toBe("mdi:bus");
    expect(motIcon(99)).toBe("mdi:tram");
    expect(motIcon(undefined, "mdi:train")).toBe("mdi:train");
  });

  it("leaves the tram default to CSS unless a concrete colour is asked for", () => {
    expect(motColor(5)).toBe("#6a1b9a");
    expect(motColor(4)).toBeNull();
    expect(motColor(undefined)).toBeNull();
    expect(motColorOrDefault(4)).toBe("#f08000");
  });
});

describe("accentTextColor", () => {
  it("lifts bus purple in dark mode and keeps it in light mode", () => {
    expect(accentTextColor("#6a1b9a", "dark")?.toLowerCase()).toBe("#c67eff");
    expect(accentTextColor("#6a1b9a", "light")?.toLowerCase()).toBe("#6a1b9a");
  });

  it("deepens tram orange in light mode and barely moves it in dark mode", () => {
    expect(accentTextColor("#f08000", "light")?.toLowerCase()).toBe("#972d00");
    expect(accentTextColor("#f08000", "dark")?.toLowerCase()).toBe("#f3830a");
  });

  it("expands three- and four-digit hex", () => {
    expect(accentTextColor("#fff", "dark")).toBe(accentTextColor("#ffffff", "dark"));
    expect(accentTextColor("#fff8", "dark")).toBe(accentTextColor("#ffffff", "dark"));
  });

  it("returns null when it cannot or need not resolve a colour", () => {
    expect(accentTextColor("#6a1b9a", undefined)).toBeNull();
    expect(accentTextColor("var(--accent)", "dark")).toBeNull();
    expect(accentTextColor("", "dark")).toBeNull();
    expect(accentTextColor("#12345", "dark")).toBeNull();
  });
});
