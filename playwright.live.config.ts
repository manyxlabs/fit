import { defineConfig } from '@playwright/test';
import base, { LIVE_SPECS } from './playwright.config';

// The deployed site, end to end: its pages in each theme and size, sync through the production
// Worker, and a reminder delivered by a real push service. Run after each deploy:
// `DISPLAY=:99 npx playwright test -c playwright.live.config.ts` (the push check needs a headed browser).
export default defineConfig({
  ...base,
  testIgnore: undefined,
  testMatch: LIVE_SPECS,
  workers: 1,
  use: { ...base.use, baseURL: process.env.BASE_URL ?? 'https://fit.manyxlabs.com' },
  webServer: undefined,
});
