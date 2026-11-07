import type { Calc } from './en/calc';
import type { Data } from './en/data';
import type { Health } from './en/health';
import type { Howto } from './en/howto';
import type { Site } from './en/site';
import { intl } from './intl';
import { LOCALES, localePath, parsePath, type Locale } from './locales';
import { healthLocale } from './review';
import { sameShape } from './shape';

// Every language's copy for the static build; the app loads only its own language's parts
// (src/app/i18n.ts), so the offline bundle never carries the others.
type Parts = { site: Site; calc: Calc; data: Data; health: Health; howto: Howto };
const files = {
  site: import.meta.glob<{ default: Site }>('./*/site.ts', { eager: true }),
  calc: import.meta.glob<{ default: Calc }>('./*/calc.ts', { eager: true }),
  data: import.meta.glob<{ default: Data }>('./*/data.ts', { eager: true }),
  health: import.meta.glob<{ default: Health }>('./*/health.ts', { eager: true }),
  howto: import.meta.glob<{ default: Howto }>('./*/howto.ts', { eager: true }),
};

function part<K extends keyof Parts>(name: K) {
  const en = files[name][`./en/${name}.ts`]!.default;
  return Object.fromEntries(
    LOCALES.map((l) => {
      const file = files[name][`./${l}/${name}.ts`];
      if (!file) throw new Error(`No src/i18n/${l}/${name}.ts`);
      sameShape(en, file.default, `${l}/${name}`);
      return [l, file.default];
    }),
  ) as Record<Locale, Parts[K]>;
}
export const catalogues = { site: part('site'), calc: part('calc'), data: part('data'), health: part('health'), howto: part('howto') };

/**
 * The language of the page at `url`, its copy and formatting, and its links. `health` is the
 * language its health copy is shown in, English until that language's review (see review.ts).
 */
export function pageLocale(url: URL) {
  const { locale, path } = parsePath(url.pathname);
  const health = healthLocale(locale);
  return {
    locale,
    path,
    health,
    t: catalogues.site[locale],
    calc: catalogues.calc[locale],
    data: catalogues.data[locale],
    advice: catalogues.health[health],
    howto: catalogues.howto[health],
    ...intl(locale),
    href: (to: string) => localePath(locale, to),
  };
}
