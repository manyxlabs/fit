import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { ARTIFACTS, onboard, tab } from './helpers';

// Everything the server received from or sent to one device, and how it addressed the room.
type Wire = { bodies: string[]; room?: string; auth?: string };
type Row = { id: string; at: number; dev: string; data: string };

async function device(browser: Browser, width = 1100) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  const wire: Wire = { bodies: [] };
  page.on('dialog', (d) => void d.accept());
  page.on('request', (r) => {
    const m = /\/api\/sync\/([\w-]{22})$/.exec(r.url());
    if (!m) return;
    wire.room = m[1];
    wire.auth = r.headers().authorization;
    wire.bodies.push(r.postData() ?? '');
  });
  page.on('response', async (r) => {
    if (/\/api\/sync\//.test(r.url()) && r.request().method() === 'POST' && r.ok()) wire.bodies.push(await r.text());
  });
  return { context, page, wire };
}

const syncCard = (page: Page) => page.getByRole('region', { name: 'Sync' });
const synced = (page: Page) => expect(syncCard(page).getByRole('status')).toHaveText(/^Synced at /, { timeout: 15_000 });
const breakfast = (page: Page) => page.getByRole('region', { name: 'Breakfast' });
const dinner = (page: Page) => page.getByRole('region', { name: 'Dinner' });

async function addFood(page: Page, meal: 'Breakfast' | 'Dinner', search: string, name: RegExp) {
  await tab(page, 'Food').click();
  const card = page.getByRole('region', { name: meal });
  await card.getByRole('button', { name: '+ Add food' }).click();
  await card.getByLabel('Search foods').fill(search);
  await card.getByRole('button', { name }).first().click();
  await card.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(card.getByRole('button', { name: new RegExp(`^Remove ${name.source.slice(1)}`) })).toBeVisible();
}

/** Waits for a whole sync started by `action`, not the "Synced at" left from the one before. */
async function syncs(page: Page, action: () => Promise<unknown>) {
  const sent = page.waitForResponse((r) => /\/api\/sync\//.test(r.url()) && r.request().method() === 'POST');
  await action();
  await sent;
  await synced(page);
}

/** Sends this device's changes now, with Sync now in More. */
async function send(page: Page) {
  await tab(page, 'More').click();
  await syncs(page, () => syncCard(page).getByRole('button', { name: 'Sync now' }).click());
}

/** Reopens the app, as on picking the phone back up, and goes to Food once its startup sync is done. */
async function reopen(page: Page) {
  await tab(page, 'More').click();
  await syncs(page, () => page.reload());
  await tab(page, 'Food').click();
}

test('two devices pair, stay in step through edits, deletions and time offline, and the server stays blind', async ({ browser, request }) => {
  test.setTimeout(120_000);
  mkdirSync(ARTIFACTS, { recursive: true });
  const a = await device(browser);
  const b = await device(browser, 360);

  const link = await test.step('A turns on sync and gets a QR code and a link', async () => {
    await onboard(a.page);
    await tab(a.page, 'More').click();
    await syncCard(a.page).getByRole('button', { name: 'Turn on sync' }).click();
    await synced(a.page);
    await expect(syncCard(a.page).getByRole('img', { name: 'QR code of the sync link' })).toBeVisible();
    const link = await syncCard(a.page).getByRole('textbox', { name: 'Sync link' }).inputValue();
    expect(link).toMatch(/\/app\/#join=[\w-]{43}$/);
    // The secret travels only in the fragment, so it never reaches the server; only a room id derived from it does.
    expect(a.wire.room).toBeDefined();
    expect(link).not.toContain(a.wire.room!);
    await syncCard(a.page).screenshot({ path: `${ARTIFACTS}/sync-pair.png` });
    return link;
  });

  await test.step('B, a fresh phone, opens the link and gets the plan without setting it up', async () => {
    await b.page.goto(link);
    await expect(b.page.getByRole('heading', { name: 'Sync with your other device' })).toBeVisible();
    await b.page.screenshot({ path: `${ARTIFACTS}/sync-join.png` });
    await b.page.getByRole('button', { name: 'Start syncing' }).click();
    await expect(b.page).toHaveURL(/\/app\/#more$/);
    await synced(b.page);
    await tab(b.page, 'Today').click();
    await expect(b.page.getByRole('region', { name: 'Calories' }).getByText('2,672 kcal left')).toBeVisible();
  });

  await test.step('A logs a meal and B sees it; A deletes it and B sees that too', async () => {
    await addFood(a.page, 'Breakfast', 'roti', /^Roti/);
    await send(a.page);
    await reopen(b.page);
    await expect(breakfast(b.page).getByRole('button', { name: /^Remove Roti/ })).toBeVisible();

    await tab(a.page, 'Food').click();
    await breakfast(a.page).getByRole('button', { name: /^Remove Roti/ }).click();
    await send(a.page);
    await reopen(b.page);
    await expect(breakfast(b.page).getByRole('button', { name: /^Remove Roti/ })).toHaveCount(0);
  });

  await test.step('B logs water offline while A logs dinner; both have both once B is back', async () => {
    await b.context.setOffline(true);
    await tab(b.page, 'Today').click();
    const water = b.page.getByRole('region', { name: 'Water' });
    await water.getByRole('button', { name: /250/ }).last().click();
    await expect(water.getByText(/^0\.25/)).toBeVisible();
    await tab(b.page, 'More').click();
    await expect(syncCard(b.page).getByRole('status')).toHaveText(/^Offline/);
    await syncCard(b.page).screenshot({ path: `${ARTIFACTS}/sync-offline.png` });

    await addFood(a.page, 'Dinner', 'dal tadka', /^Dal tadka/);
    await send(a.page);
    await syncs(b.page, () => b.context.setOffline(false));
    await tab(b.page, 'Food').click();
    await expect(dinner(b.page).getByRole('button', { name: /^Remove Dal tadka/ })).toBeVisible();
    await send(a.page);
    await tab(a.page, 'Today').click();
    await expect(a.page.getByRole('region', { name: 'Water' }).getByText(/^0\.25/)).toBeVisible();
  });

  await test.step('Nothing the server saw or stores is readable', async () => {
    const res = await request.get(`/api/sync/${a.wire.room}`, { headers: { Authorization: a.wire.auth! } });
    expect(res.ok()).toBe(true);
    const stored = (await res.json()) as Row[];
    // Every request and response is an envelope of rows, and a row is an id, a version and ciphertext.
    const envelopes = [...a.wire.bodies, ...b.wire.bodies].map((t) => JSON.parse(t) as { put?: Row[]; rows?: Row[] });
    const rows = [...stored, ...envelopes.flatMap((e) => e.put ?? e.rows!)];
    for (const e of envelopes) expect(Object.keys(e).sort()).toEqual(e.put ? ['put', 'since'] : ['more', 'rows', 'seq']);
    for (const r of rows) expect(Object.keys(r).sort()).toEqual(['at', 'data', 'dev', 'id']);
    expect(stored.length).toBeGreaterThan(5);
    const plaintext = ['Roti', 'Dal tadka', 'breakfast', 'dinner', 'kcal', 'protein', 'waterMl', 'birthYear', 'profile', 'weights', '"kg"', 'Vegetarian', '{"s"'];
    for (const r of rows) {
      const bytes = Buffer.from(r.data, 'base64url');
      for (const t of plaintext) expect(bytes.includes(t), `"${t}" reached the server`).toBe(false);
    }
    writeFileSync(`${ARTIFACTS}/sync-server-rows.json`, JSON.stringify({ room: a.wire.room, checkedFor: plaintext, rowsOnTheWire: rows.length - stored.length, plaintextFound: false, stored }, null, 2));
  });

  await test.step('B removes itself: it keeps its data but no longer gets changes', async () => {
    await b.page.goto('/app/#more');
    await syncCard(b.page).getByRole('button', { name: 'Remove this device' }).click();
    await expect(syncCard(b.page).getByRole('button', { name: 'Turn on sync' })).toBeVisible();
    await addFood(a.page, 'Breakfast', 'poha', /^Poha/);
    await send(a.page);
    await b.page.reload();
    await tab(b.page, 'Food').click();
    await expect(dinner(b.page).getByRole('button', { name: /^Remove Dal tadka/ })).toBeVisible();
    await expect(breakfast(b.page).getByRole('button', { name: /^Remove Poha/ })).toHaveCount(0);
  });

  await test.step('A turns sync off: the encrypted copy is deleted from the server', async () => {
    await tab(a.page, 'More').click();
    await syncCard(a.page).getByRole('button', { name: 'Turn off sync' }).click();
    await expect(syncCard(a.page).getByRole('button', { name: 'Turn on sync' })).toBeVisible();
    const gone = await request.get(`/api/sync/${a.wire.room}`, { headers: { Authorization: a.wire.auth! } });
    expect(gone.status()).toBe(410);
    await tab(a.page, 'Food').click();
    await expect(breakfast(a.page).getByRole('button', { name: /^Remove Poha/ })).toBeVisible();
  });
});
