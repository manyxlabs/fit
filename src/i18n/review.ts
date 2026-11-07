import { LOCALES, type Locale } from './locales';

/**
 * Health advice goes live in a language only once a native speaker has checked it: the guides, the
 * exercise how-tos, readiness, fasting and target warnings, supplement advice and the calculators'
 * explanations. Until then a language shows that copy in English, marked lang="en", and publishes no
 * guide or exercise pages of its own. Each language's review list is in .handoff/; once it is done,
 * set the language to true here and nothing else needs to change.
 */
export const REVIEWED: Record<Locale, boolean> = { en: true, hi: false, bn: false, mr: false, te: false, ta: false, gu: false, kn: false, ml: false };

/** The language health copy is shown in on a page in `locale`. */
export const healthLocale = (locale: Locale): Locale => (REVIEWED[locale] ? locale : 'en');

/** The languages whose health pages (guides, exercises) are published. */
export const HEALTH_LOCALES = LOCALES.filter((l) => REVIEWED[l]);
