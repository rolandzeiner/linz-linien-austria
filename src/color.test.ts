/**
 * @vitest-environment happy-dom
 *
 * The colour input that needs CSSOM: a hand-written `line_colors` override
 * can carry `rgb()` or a value the engine rejects, and parseColor runs both
 * through a detached element's `style.color`. happy-dom serialises a
 * well-formed comma `rgb()` / `rgba()` the way browsers do and yields "" for
 * a non-colour, but it neither converts named or `hsl()` colours to `rgb()`
 * nor rejects or re-serialises a malformed or slash-alpha `rgb()`: those
 * come back verbatim. The slash-alpha and short / non-numeric cases below
 * therefore exercise parseColor's own channel guards, not the engine's
 * rejection, and named and `hsl()` input is left to a real browser.
 */
import { describe, expect, it } from "vite-plus/test";

import { accentTextColor } from "./color";

describe("accentTextColor with CSSOM input", () => {
  it("reads rgb() and rgba() like the hex form", () => {
    expect(accentTextColor("rgb(106, 27, 154)", "dark")).toBe(accentTextColor("#6a1b9a", "dark"));
    expect(accentTextColor("rgba(240, 128, 0, 0.5)", "light")).toBe(
      accentTextColor("#f08000", "light"),
    );
  });

  it("ignores a slash alpha", () => {
    expect(accentTextColor("rgb(10 20 30 / 50%)", "light")).toBe(
      accentTextColor("#0a141e", "light"),
    );
  });

  it("passes an in-band colour through as #rrggbb", () => {
    expect(accentTextColor("rgb(106, 27, 154)", "light")).toBe("#6a1b9a");
  });

  it("is null for a value the engine rejects", () => {
    expect(accentTextColor("not-a-colour", "dark")).toBeNull();
  });

  it("is null for fewer than three channels or a non-numeric one", () => {
    expect(accentTextColor("rgb(1, 2)", "dark")).toBeNull();
    expect(accentTextColor("rgb(a, b, c)", "dark")).toBeNull();
  });
});
