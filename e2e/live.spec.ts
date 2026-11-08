import { mkdirSync } from 'node:fs';
import { chromium, expect, test, type Page } from '@playwright/test';
import { addFood, breakfast, device, onboard, reopen, send, syncCard, synced, tab } from './helpers';

// The deployed site. Every check cleans up what it made on the server: the sync room is deleted
// with Turn off sync, the push subscription with Turn off reminders.
const LIVE = 'test-results/artifacts/live';
mkdirSync(LIVE, { recursive: true });

/** Collects everything a page reports as broken: console errors, uncaught exceptions and failed requests. */
function problems(page: Page) {
  const seen: string[] = [];
  page.on('console', (m) => void (m.type() === 'error' && seen.push(`console: ${m.text()}`)));
  page.on('pageerror', (e) => void seen.push(`exception: ${e.message}`));
  page.on('requestfailed', (r) => void seen.push(`request failed: ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => void (r.status() >= 400 && seen.push(`HTTP ${r.status()}: ${r.url()}`)));
  return seen;
}

const PAGES = [
  ['home', '/', 'en'],
  ['hi-home', '/hi/', 'hi'],
  ['ta-home', '/ta/', 'ta'],
  ['ta-tdee', '/ta/calculators/tdee/', 'ta'],
  ['hi-privacy', '/hi/privacy/', 'hi'],
  ['app', '/app/', 'en'],
] as const;

for (const [name, path, lang] of PAGES)
  test(`${path} loads in its language at phone and desktop width, light and dark, with nothing broken`, async ({ browser }) => {
    for (const width of [360, 1280])
      for (const scheme of ['light', 'dark'] as const) {
        const context = await browser.newContext({ viewport: { width, height: 800 }, colorScheme: scheme });
        const page = await context.newPage();
        const broken = problems(page);
        expect((await page.goto(path))?.status()).toBe(200);
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth), `${path} ${width}`).toBeLessThanOrEqual(width);
        // Sections fade in as they scroll into view, so each is brought into view before the whole page is shot.
        for (const card of await page.locator('.reveal').all()) {
          await card.scrollIntoViewIfNeeded();
          await expect(card).toHaveCSS('opacity', '1');
        }
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: `${LIVE}/${name}-${width}-${scheme}.png`, fullPage: true });
        expect(broken, `${path} at ${width}px, ${scheme}`).toEqual([]);
        await context.close();
      }
  });

test('two devices sync through the production Worker, which only ever sees ciphertext, and the room is deleted after', async ({ browser, request }) => {
  test.setTimeout(180_000);
  const a = await device(browser);
  const b = await device(browser, 360);
  const broken = [...problems(a.page), ...problems(b.page)];

  await onboard(a.page);
  await tab(a.page, 'More').click();
  await syncCard(a.page).getByRole('button', { name: 'Turn on sync' }).click();
  await synced(a.page);
  try {
    const link = await syncCard(a.page).getByRole('textbox', { name: 'Sync link' }).inputValue();
    expect(link).toMatch(/^https:\/\/fit\.manyxlabs\.com\/app\/#join=[\w-]{43}$/);

    await b.page.goto(link);
    await b.page.getByRole('button', { name: 'Start syncing' }).click();
    await expect(b.page).toHaveURL(/\/app\/#more$/, { timeout: 30_000 });
    await synced(b.page);

    await addFood(a.page, 'Breakfast', 'roti', /^Roti/);
    await send(a.page);
    await reopen(b.page);
    await expect(breakfast(b.page).getByRole('button', { name: /^Remove Roti/ })).toBeVisible();
    await b.page.screenshot({ path: `${LIVE}/sync-second-device-360.png`, fullPage: true });

    await tab(a.page, 'Food').click();
    await breakfast(a.page).getByRole('button', { name: /^Remove Roti/ }).click();
    await send(a.page);
    await reopen(b.page);
    await expect(breakfast(b.page).getByRole('button', { name: /^Remove Roti/ })).toHaveCount(0);

    // Everything on the wire is an envelope of opaque rows; none of what was logged appears in it.
    for (const body of [...a.wire.bodies, ...b.wire.bodies])
      for (const plain of ['Roti', 'breakfast', 'kcal', 'birthYear', 'Vegetarian']) expect(body.includes(plain), `"${plain}" reached the server`).toBe(false);
  } finally {
    // Always, so a failed run never leaves a room on the production server.
    await tab(a.page, 'More').click();
    await syncCard(a.page).getByRole('button', { name: 'Turn off sync' }).click();
    await expect(syncCard(a.page).getByRole('button', { name: 'Turn on sync' })).toBeVisible();
    // The room is gone for good: even its own access token now gets 410.
    const gone = await request.post(`/api/sync/${a.wire.room}`, { headers: { Authorization: a.wire.auth! }, data: { since: 0, put: [] } });
    expect(gone.status()).toBe(410);
  }
  expect(broken).toEqual([]);
});

test('a reminder set in a real browser is sent by the production Worker through a real push service and shown', async () => {
  test.setTimeout(240_000);
  // Push needs a real, headed browser with its own push service connection; the headless shell has none.
  expect(process.env.DISPLAY, 'run with DISPLAY set, e.g. DISPLAY=:99').toBeTruthy();
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: false,
    baseURL: test.info().project.use.baseURL,
    timezoneId: 'Asia/Kolkata',
    permissions: ['notifications'],
    viewport: { width: 360, height: 800 },
  });
  const page = await context.newPage();
  const broken = problems(page);
  const puts: string[] = [];
  page.on('request', (r) => void (r.url().endsWith('/api/push') && r.method() === 'PUT' && puts.push(r.postData()!)));

  await onboard(page);
  await tab(page, 'More').click();
  const card = page.getByRole('region', { name: 'Reminders' });
  for (const name of ['Morning weigh-in', 'Log breakfast', 'Log dinner', 'Workout days']) await card.getByRole('checkbox', { name }).uncheck();
  const saveWith = async (button: string) => {
    const saved = page.waitForResponse((r) => r.url().endsWith('/api/push') && r.request().method() === 'PUT', { timeout: 90_000 });
    await card.getByRole('button', { name: button }).click();
    const res = await saved;
    // 204 No Content on success; the reason is in the body only when it is refused.
    expect(res.ok(), res.ok() ? '' : await res.text()).toBe(true);
    await expect(card.getByRole('status')).toHaveText('Reminders are on.');
  };
  // Subscribed first: a browser's first subscription registers with its push service, which can
  // take half a minute, and a reminder time that passes meanwhile is rightly due tomorrow.
  await saveWith('Turn on reminders');
  try {
    // The next whole minute in India, with time to save it.
    let at = Math.ceil(Date.now() / 60_000) * 60_000;
    if (at - Date.now() < 20_000) at += 60_000;
    const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
    await card.getByLabel('Lunch time').fill(hhmm);
    await saveWith('Save reminders');
    expect(Date.now(), 'saved before the reminder was due').toBeLessThan(at);
    const sent = JSON.parse(puts.at(-1)!);
    expect(Object.keys(sent).sort()).toEqual(['lang', 'schedule', 'subscription', 'tz']);
    expect(sent.schedule).toEqual({ meals: { lunch: hhmm } });

    const sw = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    type Scope = { registration: ServiceWorkerRegistration };
    await expect
      .poll(() => sw.evaluate(async () => (await (self as unknown as Scope).registration.getNotifications()).map((n) => ({ title: n.title, body: n.body, tag: n.tag }))), {
        timeout: at + 90_000 - Date.now(),
        intervals: [2000],
      })
      .toEqual([{ title: 'Fit', body: 'Time to log lunch', tag: 'lunch' }]);
    await page.screenshot({ path: `${LIVE}/reminder-delivered-360.png` });
  } finally {
    // Always, so a failed run never leaves a subscription on the production server.
    await card.getByRole('button', { name: 'Turn off reminders' }).click();
    await expect(card.getByRole('status')).toHaveText('Reminders are off.');
  }
  expect(broken).toEqual([]);
  await context.close();
});
