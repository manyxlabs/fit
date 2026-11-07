import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://fit.manyxlabs.com',
  devToolbar: { enabled: false },
  integrations: [react(), sitemap({ filter: (page) => !page.endsWith('/404/') && !page.includes('/app/') })],
});
