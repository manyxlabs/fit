// Screenshots the share card of every image a built page names (see src/pages/og/[slug].astro)
// into public/og/. Run as `npm run og`, which builds first, so no named image is missed.
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { dev } from 'astro';

const root = new URL('..', import.meta.url);
const pages = readdirSync(new URL('dist/', root), { recursive: true }).filter((f) => f.endsWith('.html'));
const slugs = new Set(pages.flatMap((f) => [...readFileSync(new URL(`dist/${f}`, root), 'utf8').matchAll(/\/og\/([\w-]+)\.png/g)].map((m) => m[1])));
if (!slugs.size) throw new Error('No page names a share image; build first');

const out = new URL('public/og/', root);
mkdirSync(out, { recursive: true });
// Port 0: the OS picks a free one.
const server = await dev({ root, server: { port: 0 }, logLevel: 'warn', devToolbar: { enabled: false } });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const slug of slugs) {
    const res = await page.goto(`http://localhost:${server.address.port}/og/${slug}/`);
    if (!res?.ok()) throw new Error(`/og/${slug}/ answered ${res?.status()}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: new URL(`${slug}.png`, out).pathname });
    console.log(`og/${slug}.png`);
  }
} finally {
  await browser.close();
  await server.stop();
}
