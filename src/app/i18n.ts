import enApp, { type App } from '../i18n/en/app';
import enData, { dayPart, type Data } from '../i18n/en/data';
import enHealth, { type Health } from '../i18n/en/health';
import { fontFace, FONTS } from '../i18n/fonts';
import { fill, intl } from '../i18n/intl';
import { isLocale, LANG_KEY, LOCALES, type Locale } from '../i18n/locales';
import { healthLocale } from '../i18n/review';

// The app lives at one address for every language, so it picks one in the browser: the one a link
// from a page in that language names (?lang=), else the one last picked, else the browser's.
// Only that language's copy is fetched, before anything is drawn.

function saved(): Locale | undefined {
  try {
    const l = localStorage.getItem(LANG_KEY);
    return isLocale(l) ? l : undefined;
  } catch {
    return undefined;
  }
}

function remember(l: Locale) {
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    // Not remembered; this visit is still in the language picked.
  }
}

function resolve(): Locale {
  const asked = new URLSearchParams(location.search).get('lang');
  if (isLocale(asked)) {
    remember(asked);
    history.replaceState(null, '', `${location.pathname}${location.hash}`);
    return asked;
  }
  return saved() ?? navigator.languages.map((l) => l.toLowerCase().split('-')[0]).find(isLocale) ?? 'en';
}

const parts = {
  app: import.meta.glob<{ default: App }>('../i18n/*/app.ts'),
  data: import.meta.glob<{ default: Data }>('../i18n/*/data.ts'),
  health: import.meta.glob<{ default: Health }>('../i18n/*/health.ts'),
};
const load = async <T>(files: Record<string, () => Promise<{ default: T }>>, name: string, l: Locale) => (await files[`../i18n/${l}/${name}.ts`]!()).default;

export const lang = resolve();
/** The language health copy is in: English until a native speaker has checked this language's (see review.ts). */
const healthLang = healthLocale(lang);
/** For a lang attribute on health copy that is not in the page's language. */
export const adviceLang = healthLang === lang ? undefined : healthLang;

const [app, data, health] = await Promise.all([
  lang === 'en' ? enApp : load(parts.app, 'app', lang),
  lang === 'en' ? enData : load(parts.data, 'data', lang),
  healthLang === 'en' ? enHealth : load(parts.health, 'health', lang),
]);
/** The app's copy, the shared data labels, and the health advice (see adviceLang). */
export { app as t, data as d, health as h };
export const { num, plural, date } = intl(lang);
export { fill };

document.documentElement.lang = lang;
if (lang !== 'en') {
  const font = FONTS[lang];
  const style = document.createElement('style');
  style.textContent = `${fontFace(font)}:root{--script:'${font.family}'}`;
  document.head.append(style);
}

/** Switches the app's language and remembers it; a reload, so every module reads the new copy. */
export function choose(l: Locale) {
  remember(l);
  location.reload();
}
export { LOCALES };

/** A program day as stored ('Week 3 · Upper B', 'Week 1 · Run 2', 'Full body A'), in this language. */
export function dayLabel(name: string) {
  const week = /^Week (\d+) · /.exec(name)?.[1];
  const letter = / ([A-C])$/.exec(name)?.[1];
  const run = /(?:^| · )Run (\d+)$/.exec(name)?.[1];
  const part = dayPart(name);
  const label = run ? fill(data.runDay, { n: run }) : (data.days[part] ?? part) + (letter ? ` ${letter}` : '');
  return week ? `${fill(data.week, { n: week })} · ${label}` : label;
}

/** A saved program's name in this language; one saved before programs had ids keeps the name it has. */
export const programName = (p: { id?: keyof Data['programs']; name: string }) => (p.id ? data.programs[p.id].name : p.name);
