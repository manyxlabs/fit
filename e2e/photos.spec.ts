import { expect, test } from '@playwright/test';
import { onboard, tab } from './helpers';

const iso = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('progress photos are stored small and without EXIF, compared, backed up and deleted', async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  await onboard(page);
  await tab(page, 'Progress').click();
  const card = page.getByRole('region', { name: 'Progress photos' });
  const date = card.getByLabel('Date', { exact: true });
  /** Shrinking a 3200 x 2400 photo takes the CPU it takes; the slot is busy until it is stored. */
  const stored = async (photos: number) => {
    await expect(card.locator('.shot[aria-busy=true], .shot img')).not.toHaveCount(0);
    await expect(card.locator('.shot[aria-busy=true]')).toHaveCount(0, { timeout: 30_000 });
    await expect(card.getByRole('img')).toHaveCount(photos);
  };

  await date.fill(iso(28));
  // 3200 x 2400 pixels, EXIF-rotated to portrait, with a GPS position.
  await card.getByLabel('Choose front photo').setInputFiles('e2e/fixtures/photo-before.jpg');
  await stored(1);
  await expect(card.getByRole('img', { name: /^front on/ })).toBeVisible();
  const saved = await page.evaluate(async () => {
    const req = indexedDB.open('fit');
    const db = await new Promise<IDBDatabase>((ok) => (req.onsuccess = () => ok(req.result)));
    const get = db.transaction('photos').objectStore('photos').getAll();
    const [photo] = await new Promise<{ blob: Blob }[]>((ok) => (get.onsuccess = () => ok(get.result)));
    const bmp = await createImageBitmap(photo.blob);
    return { type: photo.blob.type, w: bmp.width, h: bmp.height, exif: (await photo.blob.text()).includes('Exif') };
  });
  expect(saved).toEqual({ type: 'image/jpeg', w: 1200, h: 1600, exif: false });

  await date.fill(iso(0));
  await card.getByLabel('Take front photo').setInputFiles('e2e/fixtures/photo-after.jpg');
  await card.getByLabel('Choose side photo').setInputFiles('e2e/fixtures/photo-after.jpg');
  await stored(2);

  const compare = page.getByRole('region', { name: 'Compare photos' });
  await expect(compare.getByRole('img', { name: /^Before/ })).toBeVisible();
  await expect(compare.getByRole('img', { name: /^After/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/artifacts/photos-side-by-side.png', fullPage: true });
  await compare.getByLabel('Slider').check();
  await compare.getByLabel('Before or after').fill('35');
  await compare.screenshot({ path: 'test-results/artifacts/photos-slider.png' });

  await expect(page.getByRole('region', { name: 'Photo storage' })).toContainText(/3 photos use \d/);

  // A backup with photos brings them back after they are deleted.
  await tab(page, 'More').click();
  await expect(page.getByLabel(/Include progress photos/)).toBeChecked();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  const file = await (await download).path();
  await tab(page, 'Progress').click();
  await card.getByRole('button', { name: 'Delete side photo' }).click();
  await expect(card.getByRole('img')).toHaveCount(1);
  await card.getByRole('button', { name: 'Delete this date' }).click();
  await expect(card.getByRole('img')).toHaveCount(0);
  await expect(compare).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete all photos' }).click();
  await expect(card.getByRole('group', { name: 'Dates with photos' })).toHaveCount(0);

  await tab(page, 'More').click();
  await page.locator('input[type=file][accept*=json]').setInputFiles(file);
  // Decoding the photos takes a moment; the app says when the restore is done.
  await expect(page.getByRole('region', { name: 'Your data' }).getByRole('status')).toHaveText('Backup restored.', { timeout: 15_000 });
  await tab(page, 'Progress').click();
  await expect(card.getByRole('img')).toHaveCount(2);
  await card.getByRole('button', { name: /^\d+ \w+ \d{4}$/ }).first().click();
  await expect(card.getByRole('img')).toHaveCount(1);
});
