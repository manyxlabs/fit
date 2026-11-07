import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results/playwright',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4350',
    // Set CHROMIUM to a system browser where Playwright's own download is unavailable.
    launchOptions: { executablePath: process.env.CHROMIUM || undefined },
  },
  // BASE_URL runs the suite against the deployed site instead.
  webServer: process.env.BASE_URL ? undefined : { command: 'npm run build && npx astro preview --port 4350 --ignore-lock', port: 4350, reuseExistingServer: false },
});
