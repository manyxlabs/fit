// Inter has no Indic glyphs, so each language's script gets a Noto Sans face of its own, declared
// only on that language's pages and only for its script's characters, so no page fetches another's.
import bengali from '@fontsource-variable/noto-sans-bengali/files/noto-sans-bengali-bengali-wght-normal.woff2?url';
import bengaliRange from '@fontsource-variable/noto-sans-bengali/unicode.json';
import devanagari from '@fontsource-variable/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-wght-normal.woff2?url';
import devanagariRange from '@fontsource-variable/noto-sans-devanagari/unicode.json';
import gujarati from '@fontsource-variable/noto-sans-gujarati/files/noto-sans-gujarati-gujarati-wght-normal.woff2?url';
import gujaratiRange from '@fontsource-variable/noto-sans-gujarati/unicode.json';
import kannada from '@fontsource-variable/noto-sans-kannada/files/noto-sans-kannada-kannada-wght-normal.woff2?url';
import kannadaRange from '@fontsource-variable/noto-sans-kannada/unicode.json';
import malayalam from '@fontsource-variable/noto-sans-malayalam/files/noto-sans-malayalam-malayalam-wght-normal.woff2?url';
import malayalamRange from '@fontsource-variable/noto-sans-malayalam/unicode.json';
import tamil from '@fontsource-variable/noto-sans-tamil/files/noto-sans-tamil-tamil-wght-normal.woff2?url';
import tamilRange from '@fontsource-variable/noto-sans-tamil/unicode.json';
import telugu from '@fontsource-variable/noto-sans-telugu/files/noto-sans-telugu-telugu-wght-normal.woff2?url';
import teluguRange from '@fontsource-variable/noto-sans-telugu/unicode.json';
import type { Locale } from './locales';

export type Font = { family: string; url: string; range: string };

const DEVANAGARI = { family: 'Noto Sans Devanagari', url: devanagari, range: devanagariRange.devanagari };

export const FONTS: Record<Exclude<Locale, 'en'>, Font> = {
  hi: DEVANAGARI,
  mr: DEVANAGARI,
  bn: { family: 'Noto Sans Bengali', url: bengali, range: bengaliRange.bengali },
  te: { family: 'Noto Sans Telugu', url: telugu, range: teluguRange.telugu },
  ta: { family: 'Noto Sans Tamil', url: tamil, range: tamilRange.tamil },
  gu: { family: 'Noto Sans Gujarati', url: gujarati, range: gujaratiRange.gujarati },
  kn: { family: 'Noto Sans Kannada', url: kannada, range: kannadaRange.kannada },
  ml: { family: 'Noto Sans Malayalam', url: malayalam, range: malayalamRange.malayalam },
};

export const fontFace = ({ family, url, range }: Font) =>
  `@font-face{font-family:'${family}';font-style:normal;font-display:swap;font-weight:100 900;src:url(${url}) format('woff2-variations');unicode-range:${range}}`;
