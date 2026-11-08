import { defineConfig } from '@playwright/test';

/** Specs that need the Worker run with playwright.server.config.ts, against `wrangler dev`. */
export const SERVER_SPECS = /(sync|reminders|webpush)\.spec\.ts$/;
/** Checks of the deployed site, with real push services and sync, run with playwright.live.config.ts. */
export const LIVE_SPECS = /live\.spec\.ts$/;

export default defineConfig({
  testDir: 'e2e',
  testIgnore: [SERVER_SPECS, LIVE_SPECS],
  outputDir: 'test-results/playwright',
  // CI keeps an HTML report as an artifact, traces and screenshots included, to read a failure from.
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4350',
    // Set CHROMIUM to a system browser where Playwright's own download is unavailable.
    launchOptions: { executablePath: process.env.CHROMIUM || undefined },
  },
  // BASE_URL runs the suite against the deployed site instead.
  webServer: process.env.BASE_URL ? undefined : { command: 'npm run build && npx astro preview --port 4350 --ignore-lock', port: 4350, reuseExistingServer: false },
});
