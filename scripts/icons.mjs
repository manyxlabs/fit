// Renders the app icons in public/ from src/mark.ts, with the Chromium Playwright already uses.
// Run as `npm run icons` after changing the mark.
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { ICON, markSvg } from '../src/mark.ts';

const tile = { ...ICON, bg: ICON.bg };
const icons = {
  // iOS rounds the corners itself.
  'apple-touch-icon.png': [180, markSvg({ ...tile, pad: 8 })],
  'icon-192.png': [192, markSvg({ ...tile, pad: 6, rx: 14 })],
  'icon-512.png': [512, markSvg({ ...tile, pad: 6, rx: 14 })],
  // Launchers may crop to a circle 80% wide; the mark stays well inside it.
  'icon-maskable-512.png': [512, markSvg({ ...tile, pad: 10 })],
  'ico-16': [16, markSvg({ ...tile, pad: 1, rx: 10 })],
  'ico-32': [32, markSvg({ ...tile, pad: 1, rx: 10 })],
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const png = {};
try {
  const page = await browser.newPage();
  for (const [name, [size, svg]] of Object.entries(icons)) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" style="display:block" `)}</body>`);
    png[name] = await page.screenshot({ omitBackground: true });
    if (!name.startsWith('ico-')) writeFileSync(new URL(`../public/${name}`, import.meta.url), png[name]);
  }
} finally {
  await browser.close();
}

// An .ico that holds PNGs, which every browser since IE 11 reads.
const images = [png['ico-16'], png['ico-32']];
const head = Buffer.alloc(6 + 16 * images.length);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(images.length, 4);
let offset = head.length;
images.forEach((img, i) => {
  const e = 6 + 16 * i;
  head[e] = head[e + 1] = [16, 32][i];
  head.writeUInt16LE(1, e + 4);
  head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(img.length, e + 8);
  head.writeUInt32LE(offset, e + 12);
  offset += img.length;
});
writeFileSync(new URL('../public/favicon.ico', import.meta.url), Buffer.concat([head, ...images]));
console.log('Icons written to public/');
