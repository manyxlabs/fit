import { expect, test } from '@playwright/test';

test('the BMI calculator uses the Asian cut-offs by default', async ({ page }) => {
  await page.goto('/calculators/bmi/');
  await page.getByLabel('Weight (kg)').fill('75');
  await page.getByLabel('Height (cm)').fill('175');
  await expect(page.locator('.stat').first()).toContainText('24.5');
  await expect(page.locator('.stat').first()).toContainText('Overweight');
  await page.getByLabel(/Asian cut-offs/).uncheck();
  await expect(page.locator('.stat').first()).toContainText('Healthy');
});

test('the TDEE calculator matches the worked example', async ({ page }) => {
  await page.goto('/calculators/tdee/');
  await page.getByLabel('Age').fill('25');
  await page.getByLabel('Weight (kg)').fill('75');
  await page.getByLabel('Height (cm)').fill('175');
  await expect(page.getByText('1,724 kcal')).toBeVisible();
  await expect(page.getByText('2,672 kcal')).toBeVisible();
});

test('every page in the sitemap loads, links only to pages that exist, and fits a phone', async ({ page, request }) => {
  const index = await (await request.get('/sitemap-index.xml')).text();
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const pages = (await Promise.all(maps.map(async (m) => [...(await (await request.get(m)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => new URL(x[1]).pathname)))).flat();
  expect(pages.length).toBeGreaterThan(20);

  await page.setViewportSize({ width: 360, height: 740 });
  const links = new Set<string>();
  for (const path of pages) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(360);
    for (const href of await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) links.add(href.split('#')[0]);
    await page.screenshot({ path: `test-results/artifacts/pages${path === '/' ? '/home' : path.replace(/\/$/, '')}.png`, fullPage: true });
  }
  for (const href of links) expect((await request.get(href)).status(), href).toBe(200);
});
