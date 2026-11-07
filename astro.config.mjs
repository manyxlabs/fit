import { renameSync, rmdirSync } from 'node:fs';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { LOCALES } from './src/i18n/locales';

export default defineConfig({
  site: 'https://fit.manyxlabs.com',
  devToolbar: { enabled: false },
  // The app reads its language's copy with a top-level await before it draws (src/app/i18n.ts).
  vite: { build: { target: 'es2022' } },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.endsWith('/404/') && !page.includes('/app/'),
      i18n: { defaultLocale: 'en', locales: Object.fromEntries(LOCALES.map((l) => [l, l])) },
    }),
    {
      // Cloudflare answers a missing page with the nearest 404.html up the path, so each language's
      // 404 goes where /<l>/no-such-page/ finds it; Astro builds only English's at /404.html.
      name: 'localized-404',
      hooks: {
        'astro:build:done': ({ dir }) => {
          for (const l of LOCALES.filter((l) => l !== 'en')) {
            renameSync(new URL(`${l}/404/index.html`, dir), new URL(`${l}/404.html`, dir));
            rmdirSync(new URL(`${l}/404/`, dir));
          }
        },
      },
    },
  ],
});
