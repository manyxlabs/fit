import { expect, type Page } from '@playwright/test';

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
