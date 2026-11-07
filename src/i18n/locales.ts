// Every public page is published in each language whose copy it needs; English keeps the unprefixed
// URLs it always had, and every other language mirrors them under /<code>/. The app, behind one
// address that is never indexed, switches language in the browser instead.
export const LOCALES = ['en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'kn', 'ml'] as const;
export type Locale = (typeof LOCALES)[number];

/** Each language in its own script, as the language menu lists it. */
export const NAMES: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
  mr: 'मराठी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  gu: 'ગુજરાતી',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
};

export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);

/** For Intl: Indian conventions, but with the digits 0-9 that apps use even where a language has its own. */
export const intlTag = (locale: Locale) => `${locale}-IN-u-nu-latn`;

export const localePath = (locale: Locale, path: string) => (locale === 'en' ? path : `/${locale}${path}`);

/** The language a path is in, and the path English has for the same page. */
export function parsePath(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split('/');
  const locale = LOCALES.find((l) => l !== 'en' && l === first);
  return locale ? { locale, path: `/${rest.join('/')}` } : { locale: 'en', path: pathname };
}

/** The `lang` param of a `[...lang]` route in each of these languages: none for English. */
export const langParams = (locales: readonly Locale[] = LOCALES) => locales.map((locale) => (locale === 'en' ? undefined : locale));

/** Where the app keeps the language last picked, on the site or in the app. */
export const LANG_KEY = 'fit:lang';

/** The app from a page in `locale`: it opens in that language, which it then remembers. */
export const appHref = (locale: Locale) => (locale === 'en' ? '/app/' : `/app/?lang=${locale}`);
