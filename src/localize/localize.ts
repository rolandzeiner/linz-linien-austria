import * as en from './languages/en.json';
import * as de from './languages/de.json';

const languages: Record<string, Record<string, unknown>> = {
  en: en,
  de: de,
};

function resolveTranslation(path: string, dictionary: Record<string, unknown>): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }

    return undefined;
  }, dictionary);

  return typeof value === 'string' ? value : undefined;
}

export function localize(string: string, search = '', replace = ''): string {
  const lang = (localStorage.getItem('selectedLanguage') || 'en').replace(/['"]+/g, '').replace('-', '_');

  // noUncheckedIndexedAccess narrows languages[k] to T | undefined; coerce
  // to the always-present `en` fallback at each lookup so resolveTranslation
  // sees a real Record, not Record | undefined.
  const dict = languages[lang] ?? languages.en ?? {};
  const enDict = languages.en ?? {};
  let translated = resolveTranslation(string, dict);

  if (translated === undefined) translated = resolveTranslation(string, enDict);
  if (translated === undefined) translated = string;

  if (search !== '' && replace !== '') {
    translated = translated.replace(search, replace);
  }
  return translated;
}
