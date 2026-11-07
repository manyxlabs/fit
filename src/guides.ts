import type { MarkdownInstance } from 'astro';

type Front = { title: string; description: string; order: number };
const files = import.meta.glob<MarkdownInstance<Front>>('./guides/*.md', { eager: true });

export const GUIDES = Object.entries(files)
  .map(([path, m]) => ({ slug: path.slice('./guides/'.length, -'.md'.length), ...m.frontmatter, Content: m.Content }))
  .sort((a, b) => a.order - b.order);

/** Throws on an unknown slug, so a link to a guide that does not exist fails the build. */
export function guideTitle(slug: string) {
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) throw new Error(`No guide "${slug}"`);
  return g.title;
}
