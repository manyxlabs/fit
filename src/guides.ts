import type { MarkdownInstance } from 'astro';
import type { Locale } from './i18n/locales';

type Front = { title: string; description: string; order: number };
type Guide = Front & { slug: string; Content: MarkdownInstance<Front>['Content']; headings: ReturnType<MarkdownInstance<Front>['getHeadings']> };

// English at src/guides/<slug>.md; every other language at src/guides/<locale>/<slug>.md, the same slugs.
const files = import.meta.glob<MarkdownInstance<Front>>('./guides/**/*.md', { eager: true });

const byLocale = new Map<string, Guide[]>();
for (const [path, m] of Object.entries(files)) {
  const [, locale = 'en', slug] = /^\.\/guides\/(?:(\w+)\/)?([\w-]+)\.md$/.exec(path)!;
  byLocale.set(locale, [...(byLocale.get(locale) ?? []), { slug: slug!, ...m.frontmatter, Content: m.Content, headings: m.getHeadings() }]);
}
const english = byLocale.get('en')!.sort((a, b) => a.order - b.order);
for (const [locale, list] of byLocale) {
  const missing = english.filter((g) => !list.some((x) => x.slug === g.slug)).map((g) => g.slug);
  if (missing.length) throw new Error(`src/guides/${locale}/ has no ${missing.join(', ')}`);
}

export const GUIDES = english;

/** The guides in a language, in English's order; only languages whose health copy is reviewed ask. */
export function guides(locale: Locale): Guide[] {
  const list = byLocale.get(locale);
  if (!list) throw new Error(`No guides in ${locale}`);
  return english.map((g) => list.find((x) => x.slug === g.slug)!);
}

/** Throws on an unknown slug, so a link to a guide that does not exist fails the build. */
export function guideTitle(slug: string, locale: Locale = 'en') {
  const g = guides(locale).find((x) => x.slug === slug);
  if (!g) throw new Error(`No guide "${slug}"`);
  return g.title;
}
