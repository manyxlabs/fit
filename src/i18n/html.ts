const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ESC[c]!);

/**
 * A catalogue string with marked parts, `Use <strong>More</strong>`, as HTML for set:html: the text is
 * escaped and each tag drawn by `tags`, or as itself where it is plain markup (strong, em, code).
 * Translations move tags with the words they mark, so word order is theirs.
 */
export function richHtml(text: string, tags: Record<string, (inner: string) => string> = {}) {
  return text.split(/(<(\w+)>.*?<\/\2>)/s).map((part, i) => {
    if (i % 3 === 2) return '';
    const [, tag, inner] = /^<(\w+)>(.*)<\/\1>$/s.exec(part) ?? [];
    if (!tag) return esc(part);
    if (tags[tag]) return tags[tag](esc(inner!));
    if (['strong', 'em', 'code'].includes(tag)) return `<${tag}>${esc(inner!)}</${tag}>`;
    throw new Error(`No way to draw <${tag}> in "${text}"`);
  }).join('');
}

export const link = (href: string) => (inner: string) => `<a href="${esc(href)}">${inner}</a>`;
