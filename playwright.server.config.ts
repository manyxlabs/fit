import { generateKeyPairSync } from 'node:crypto';
import { defineConfig } from '@playwright/test';
import base, { SERVER_SPECS } from './playwright.config';

// Sync and reminders run against the real Worker, its Durable Objects emulated by wrangler, with
// development mode on (localhost push endpoints, and a read of what a room stores) and a VAPID
// key pair of its own. PORT lets checkouts run at once.
const port = Number(process.env.PORT ?? 8793);
const jwk = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ format: 'jwk' });
const publicKey = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x!, 'base64url'), Buffer.from(jwk.y!, 'base64url')]).toString('base64url');
const vars = `--var DEV:1 --var VAPID_PUBLIC_KEY:${publicKey} --var VAPID_PRIVATE_KEY:${jwk.d}`;

export default defineConfig({
  ...base,
  testIgnore: undefined,
  testMatch: SERVER_SPECS,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/server' }]] : 'list',
  use: { ...base.use, baseURL: process.env.BASE_URL ?? `http://localhost:${port}` },
  webServer: process.env.BASE_URL
    ? undefined
    : { command: `npm run build && npx wrangler dev --port ${port} --persist-to test-results/wrangler ${vars}`, port, reuseExistingServer: false, timeout: 180_000 },
});
