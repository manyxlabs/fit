// Fit's mark: the Manyx Labs X as a figure mid star-jump, the X's accent dot become its head.
// Same 48-unit grid, stroke and round caps as the Manyx mark, so the two read as siblings.

const LIMBS = ['M9 15 C 22 24, 26 30, 37 42', 'M39 15 C 26 24, 22 30, 11 42'];

/**
 * pad widens (or, negative, tightens) the frame around the 48-unit mark; bg fills it.
 * css may restyle .ink and .dot, which overrides the colours given, for a theme-aware favicon.
 */
export function markSvg(o: { ink: string; accent: string; size?: number; pad?: number; bg?: string; rx?: number; css?: string }) {
  const pad = o.pad ?? 0;
  const s = 48 + 2 * pad;
  const size = o.size ? ` width="${o.size}" height="${o.size}"` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${s} ${s}"${size} aria-hidden="true">` +
    (o.css ? `<style>${o.css}</style>` : '') +
    (o.bg ? `<rect x="${-pad}" y="${-pad}" width="${s}" height="${s}" rx="${o.rx ?? 0}" fill="${o.bg}"/>` : '') +
    `<g class="ink" fill="none" stroke="${o.ink}" stroke-width="4.5" stroke-linecap="round">${LIMBS.map((d) => `<path d="${d}"/>`).join('')}</g>` +
    `<circle class="dot" cx="24" cy="8" r="5" fill="${o.accent}"/></svg>`
  );
}

/** The dark theme's colours, which the app icons use on every system. */
export const ICON = { bg: '#050506', ink: '#f5f5f7', accent: '#34d399' };
