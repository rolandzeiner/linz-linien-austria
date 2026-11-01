// One config for the whole card toolchain under Vite+ (`vp`): build (Vite 8
// library mode on Rolldown), test (Vitest), lint + type-check (Oxlint with
// tsgolint) and format (Oxfmt). Replaces rolldown.config.mjs.
//
// Decorators are deliberately not configured here. Rolldown reads
// tsconfig.json itself and turns on Lit's legacy (experimental) decorators
// from it.
import { defineConfig } from "vite-plus";

// MUST be a legal comment — `/*! ... */` — not `//`. The minifier strips
// ordinary comments including a `//` banner, silently. `comments: { legal:
// true }` below is the other half of the same requirement.
const banner =
  "/*! Linz Linien Austria Card — bundled by Rolldown. Edit sources in src/, then `npm run build`. */";

// Dev vs prod comes from Vite's mode, not from a watch env var: `npm run dev`
// passes `--mode development`, a plain `vp build` is production.
export default defineConfig(({ mode }) => {
  const dev = mode === "development";
  return {
    build: {
      // Library mode: one ES module, no index.html, no hashed file name.
      lib: {
        entry: "src/linz-linien-austria-card.ts",
        formats: ["es"],
        fileName: () => "linz-linien-austria-card.js",
      },
      outDir: "custom_components/linz_linien_austria/www",
      // www/ sits inside the integration package; never let Vite wipe it.
      emptyOutDir: false,
      copyPublicDir: false,
      target: "es2022",
      sourcemap: dev,
      rolldownOptions: {
        output: {
          banner,
          // HACS users get a single .js file, not a chunked dist/. The
          // editor's dynamic import (getConfigElement) is inlined.
          codeSplitting: false,
          comments: { legal: true },
          // Set on the Rolldown output, not `build.minify`: Vite's library
          // mode skips whitespace minification for ES output. Keep console.*
          // (dropConsole: false): the cards' console calls are their only
          // client-side failure signal, and the console.info banner shows
          // which bundle loaded.
          minify: dev ? false : { compress: { dropConsole: false }, mangle: true, codegen: true },
        },
      },
    },
    fmt: {
      // Leave Lit html/css templates alone. Formatting them rewrites the
      // whitespace inside rendered elements, which changes the DOM.
      embeddedLanguageFormatting: "off",
      // Format the card source only. The bundle is build output; Markdown,
      // YAML and TOML keep their hand formatting.
      ignorePatterns: [
        "custom_components/**",
        "**/*.md",
        ".github/**",
        "*.toml",
        "**/__snapshots__/**",
      ],
    },
    lint: {
      ignorePatterns: ["custom_components/**/www/**"],
      // Oxlint's default plugins plus vitest; listing plugins replaces the
      // defaults, so all four are named.
      plugins: ["typescript", "unicorn", "oxc", "vitest"],
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: {
        "vite-plus/prefer-vite-plus-imports": "error",
        // Opt-in rules from the `suspicious` category; the rest of that
        // category is mostly noise for Lit code (e.g. `_private` names).
        "typescript/no-unnecessary-type-assertion": "error",
        "eslint/no-shadow": "error",
        "unicorn/no-array-sort": "error",
        // Test hygiene, from the vitest plugin enabled below: a committed
        // .only or .skip quietly drops tests, a test without an assertion
        // passes whatever the code does, and a duplicate title makes a
        // failure ambiguous to read.
        "vitest/no-focused-tests": "error",
        "vitest/no-disabled-tests": "error",
        "vitest/no-identical-title": "error",
        "vitest/expect-expect": "error",
        "vitest/no-standalone-expect": "error",
        "vitest/no-conditional-expect": "error",
        "vitest/no-commented-out-tests": "error",
        "vitest/valid-title": "error",
        // expect(value, message) is Vitest API; the rule's default of one
        // argument is Jest's.
        "vitest/valid-expect": ["error", { maxArgs: 2 }],
        // On by default with the plugin; wants a type on every vi.fn().
        // About 60 untyped mocks across the portfolio, no bug behind any.
        "vitest/require-mock-type-parameters": "off",
      },
      // typeCheck makes `vp check` report tsc's errors (strict tsconfig
      // included), so it can stand in for `tsc --noEmit`.
      // denyWarnings: a warning fails `vp check` (and CI) instead of
      // scrolling past with exit 0.
      options: {
        typeAware: true,
        typeCheck: true,
        denyWarnings: true,
        reportUnusedDisableDirectives: "error",
      },
    },
  };
});
