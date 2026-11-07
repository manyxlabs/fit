import { readdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { onboard, rows, tab } from './helpers';

const samsung = readdirSync('e2e/fixtures/samsung').map((f) => `e2e/fixtures/samsung/${f}`);
/** Field values by date, for the days and dates the fixtures cover. */
const byDate = async (page: Page, store: string, field: string) =>
  Object.fromEntries((await rows(page, store)).filter((r) => r[field] !== undefined && String(r.date) < '2026-11').map((r) => [r.date, r[field]]));

async function choose(page: Page, files: string | string[]) {
  await onboard(page);
  await tab(page, 'More').click();
  await page.getByRole('region', { name: 'Import from a health app' }).getByLabel(/Choose export files/).setInputFiles(files);
  return page.getByRole('form', { name: 'Import preview' });
}

test('an Apple Health export.zip is previewed and imported, skipping a type', async ({ page }) => {
  const preview = await choose(page, 'e2e/fixtures/apple-health-export.zip');
  await expect(preview).toContainText('From Apple Health:');
  await expect(preview.getByText(/^Weight: 3 days, 5 Oct 2026 to 7 Oct 2026$/)).toBeVisible();
  await expect(preview.getByText(/^Steps: 3 days/)).toBeVisible();
  await expect(preview.getByText(/^Sleep: 2 days, 6 Oct 2026 to 7 Oct 2026$/)).toBeVisible();
  await expect(preview.getByText(/^Body fat: 1 day, 5 Oct 2026$/)).toBeVisible();
  await expect(preview.getByText(/^Resting heart rate: 3 days/)).toBeVisible();
  await preview.getByLabel(/^Resting heart rate/).uncheck();
  await page.screenshot({ path: 'test-results/artifacts/import-preview.png', fullPage: true });
  await preview.getByRole('button', { name: 'Import' }).click();
  await expect(page.getByRole('status')).toHaveText('Imported 9 entries from Apple Health.');

  // The earliest weigh-in of the day, pounds converted.
  expect(await byDate(page, 'weights', 'kg')).toEqual({ '2026-10-05': 74.8, '2026-10-06': 74.84, '2026-10-07': 74.5 });
  // Watch and iPhone overlap in hours 8 and 9 on the 5th; the phone alone counts 18:00 while the watch charges.
  expect(await byDate(page, 'days', 'steps')).toEqual({ '2026-10-05': 4200, '2026-10-06': 3400, '2026-10-07': 1000 });
  // Asleep stages only, awake and in bed left out; the night belongs to the morning it ends on.
  expect(await byDate(page, 'days', 'sleep')).toEqual({ '2026-10-06': 7, '2026-10-07': 6 });
  expect(await byDate(page, 'measurements', 'bodyFat')).toEqual({ '2026-10-05': 21.5 });
  expect(await byDate(page, 'days', 'restingHr')).toEqual({});
});

test('Samsung Health CSVs are imported, using Samsung’s merged step count', async ({ page }) => {
  const preview = await choose(page, samsung);
  await expect(preview).toContainText('From Samsung Health:');
  await expect(preview.getByText(/^Resting heart rate/)).toHaveCount(0);
  await preview.getByRole('button', { name: 'Import' }).click();
  await expect(page.getByRole('status')).toHaveText('Imported 8 entries from Samsung Health.');

  // Times are UTC with the zone alongside: 20:00 UTC on the 2nd is 01:30 on the 3rd in India.
  expect(await byDate(page, 'weights', 'kg')).toEqual({ '2026-09-01': 80.2, '2026-09-02': 80, '2026-09-03': 79.9 });
  expect(await byDate(page, 'measurements', 'bodyFat')).toEqual({ '2026-09-01': 24.1 });
  expect(await byDate(page, 'days', 'steps')).toEqual({ '2026-09-01': 6500, '2026-09-02': 8000 });
  expect(await byDate(page, 'days', 'sleep')).toEqual({ '2026-09-01': 7, '2026-09-02': 6.5 });
});

test('a Google Fit Takeout import keeps what was already logged', async ({ page }) => {
  await (await choose(page, samsung)).getByRole('button', { name: 'Import' }).click();
  await page.getByLabel(/Choose export files/).setInputFiles('e2e/fixtures/google-fit-takeout.zip');
  const preview = page.getByRole('form', { name: 'Import preview' });
  await expect(preview.getByText(/^Weight: 2 days, 1 Sept 2026 to 4 Sept 2026 \(1 already logged\)$/)).toBeVisible();
  await expect(preview.getByText(/^Steps: 2 days, 1 Sept 2026 to 3 Sept 2026 \(1 already logged\)$/)).toBeVisible();
  await expect(preview.getByLabel('Keep mine')).toBeChecked();
  await page.screenshot({ path: 'test-results/artifacts/import-keep.png', fullPage: true });
  await preview.getByRole('button', { name: 'Import' }).click();
  await expect(page.getByRole('status')).toHaveText('Imported 2 entries from Google Fit.');

  expect(await byDate(page, 'weights', 'kg')).toEqual({ '2026-09-01': 80.2, '2026-09-02': 80, '2026-09-03': 79.9, '2026-09-04': 79.5 });
  expect(await byDate(page, 'days', 'steps')).toEqual({ '2026-09-01': 6500, '2026-09-02': 8000, '2026-09-03': 9000 });
});
