// Minimal i18n without dependencies: flat dictionaries per language, {var} interpolation.
export type Language = 'en' | 'es';
export const LANGUAGES: Language[] = ['en', 'es'];

type Dict = Record<string, string>;
const messages: Record<Language, Dict> = { en: {}, es: {} };
let lang: Language = 'en';

/** Add translations. Later registrations override earlier keys. */
export function registerMessages(dicts: Partial<Record<Language, Dict>>): void {
  for (const l of LANGUAGES) Object.assign(messages[l], dicts[l] ?? {});
}

export function setLanguage(l: Language): void {
  lang = l;
}

export function language(): Language {
  return lang;
}

/** BCP 47 locale for Intl formatting. */
export function locale(): string {
  return lang === 'es' ? 'es-ES' : 'en-GB';
}

/** Translate `key`; falls back to English, then to the key itself. */
export function t(key: string, vars?: Record<string, string | number>): string {
  let s = messages[lang][key] ?? messages.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Plural helper: picks `${key}.one` or `${key}.other`. */
export function tn(key: string, n: number, vars?: Record<string, string | number>): string {
  return t(`${key}.${n === 1 ? 'one' : 'other'}`, { n, ...vars });
}
