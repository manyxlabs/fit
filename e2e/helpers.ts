import { expect, type Browser, type Page } from '@playwright/test';

export const ARTIFACTS = 'test-results/artifacts';
const year = new Date().getFullYear();
export const tab = (page: Page, name: string) => page.getByRole('navigation', { name: 'App' }).getByRole('link', { name });

/** The worked example from the guides: male, 25, 175 cm, 75 kg, moderately active. */
export async function onboard(page: Page, goal = 'Maintain', diet = 'Vegetarian') {
  await page.goto('/app/');
  await page.getByLabel('Male', { exact: true }).check();
  await page.getByLabel('Birth year').fill(String(year - 25));
  await page.getByLabel('Height (cm)').fill('175');
  await page.getByLabel('Weight (kg)').fill('75');
  await page.getByLabel('Activity, counting your whole day').selectOption({ label: 'Moderately active: Training 3-5 days a week' });
  await page.getByLabel('Goal').selectOption({ label: goal });
  await page.getByLabel('Diet').selectOption({ label: diet });
  await page.getByRole('button', { name: 'Build my plan' }).click();
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible();
}

/** Every row of one of the app's IndexedDB stores, as the page sees it. */
export const rows = (page: Page, store: string) =>
  page.evaluate(async (store) => {
    const open = indexedDB.open('fit');
    const db = await new Promise<IDBDatabase>((ok) => (open.onsuccess = () => ok(open.result)));
    const req = db.transaction(store).objectStore(store).getAll();
    return new Promise<Record<string, unknown>[]>((ok) => (req.onsuccess = () => ok(req.result)));
  }, store);

// Everything the server received from or sent to one device, and how it addressed the room.
export type Wire = { bodies: string[]; room?: string; auth?: string };

export async function device(browser: Browser, width = 1100) {
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

export const syncCard = (page: Page) => page.getByRole('region', { name: 'Sync' });
export const synced = (page: Page) => expect(syncCard(page).getByRole('status')).toHaveText(/^Synced at /, { timeout: 15_000 });
export const breakfast = (page: Page) => page.getByRole('region', { name: 'Breakfast' });
export const dinner = (page: Page) => page.getByRole('region', { name: 'Dinner' });

export async function addFood(page: Page, meal: 'Breakfast' | 'Dinner', search: string, name: RegExp) {
  await tab(page, 'Food').click();
  const card = page.getByRole('region', { name: meal });
  await card.getByRole('button', { name: '+ Add food' }).click();
  await card.getByLabel('Search foods').fill(search);
  await card.getByRole('button', { name }).first().click();
  await card.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(card.getByRole('button', { name: new RegExp(`^Remove ${name.source.slice(1)}`) })).toBeVisible();
}

/** Waits for a whole sync started by `action`, not the "Synced at" left from the one before. */
export async function syncs(page: Page, action: () => Promise<unknown>) {
  const sent = page.waitForResponse((r) => /\/api\/sync\//.test(r.url()) && r.request().method() === 'POST');
  await action();
  await sent;
  await synced(page);
}

/** Sends this device's changes now, with Sync now in More. */
export async function send(page: Page) {
  await tab(page, 'More').click();
  await syncs(page, () => syncCard(page).getByRole('button', { name: 'Sync now' }).click());
}

/** Reopens the app, as on picking the phone back up, and goes to Food once its startup sync is done. */
export async function reopen(page: Page) {
  await tab(page, 'More').click();
  await syncs(page, () => page.reload());
  await tab(page, 'Food').click();
}
