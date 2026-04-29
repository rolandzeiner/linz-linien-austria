import * as de from "./languages/de.json";
import * as en from "./languages/en.json";

type Dict = Record<string, unknown>;

const languages: Record<string, Dict> = {
  de: de as unknown as Dict,
  en: en as unknown as Dict,
};

function resolvePath(path: string, dictionary: Dict): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Dict)) {
      return (acc as Dict)[key];
    }
    return undefined;
  }, dictionary);
}

function resolveString(path: string, dictionary: Dict): string | undefined {
  const v = resolvePath(path, dictionary);
  return typeof v === "string" ? v : undefined;
}

export interface TranslateContext {
  /** Optional override from card config (`config.language`). */
  configLanguage?: string | undefined;
  /** The active HA frontend language — pass `this.hass?.language`. */
  hassLanguage?: string | undefined;
}

/** Pick the catalogue to use. Same shape as the wiener-linien helper:
 *  config override beats HA's active language; final fallback is English.
 *  Strip any region suffix (`de-AT` → `de`) so we don't need a separate
 *  catalogue per region. */
export function resolveLang(ctx: TranslateContext): string {
  const raw = ctx.configLanguage || ctx.hassLanguage || "en";
  const code = raw.replace("-", "_").split("_")[0];
  return code === "de" ? "de" : "en";
}

/** Translate `key` against the active language. `replacements` substitutes
 *  every `{name}` placeholder in the resolved string. Unknown keys fall
 *  through to the literal key name so missing translations are visible
 *  in dev. */
// Static guarantee: `en` is declared as a top-level import + populated in
// the `languages` map at module load. `noUncheckedIndexedAccess` widens
// every index access to `… | undefined`, so we narrow once here for the
// lookup chain. Empty-object fallback covers the impossible-but-typed
// case of the `en` slot being absent.
const enDict: Dict = languages.en ?? {};

export function translate(
  key: string,
  ctx: TranslateContext,
  replacements?: Record<string, string | number>,
): string {
  const lang = resolveLang(ctx);
  let s = resolveString(key, languages[lang] ?? enDict);
  if (s === undefined) s = resolveString(key, enDict);
  if (s === undefined) return key;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      s = s.replace(`{${k}}`, String(v));
    }
  }
  return s;
}
