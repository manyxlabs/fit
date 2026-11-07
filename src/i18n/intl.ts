import { intlTag, type Locale } from './locales';

/** Number, plural and date formatting for one language, as used in India. */
export function intl(locale: Locale) {
  const tag = intlTag(locale);
  const rules = new Intl.PluralRules(tag);
  const num = (n: number, digits = 0) => n.toLocaleString(tag, { maximumFractionDigits: digits, minimumFractionDigits: digits });
  return {
    tag,
    num,
    /** The form for `n`, with `#` standing for the number: `plural(n, { one: '# set', other: '# sets' })`. */
    plural: (n: number, forms: Plural, digits = 0) => ((rules.select(n) === 'one' && forms.one) || forms.other).replaceAll('#', num(n, digits)),
    date: (d: Date | number | string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(tag, options).format(typeof d === 'string' ? new Date(`${d}T12:00:00`) : d),
  };
}

export type Plural = { one?: string; other: string };

/** Fills a catalogue string's {placeholders}; a missing value is a bug, so it throws. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in vars)) throw new Error(`No value for {${key}} in "${template}"`);
    return String(vars[key]);
  });
}
