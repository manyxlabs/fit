import { expect, test, type Page } from '@playwright/test';

/** Typing before the island hydrates is lost when React takes over the inputs. */
async function calculator(page: Page, slug: string) {
  await page.goto(`/calculators/${slug}/`);
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}

test('the BMI calculator uses the Asian cut-offs by default', async ({ page }) => {
  await calculator(page, 'bmi');
  await page.getByLabel('Weight (kg)').fill('75');
  await page.getByLabel('Height (cm)').fill('175');
  await expect(page.locator('.stat').first()).toContainText('24.5');
  await expect(page.locator('.stat').first()).toContainText('Overweight');
  await page.getByLabel(/Asian cut-offs/).uncheck();
  await expect(page.locator('.stat').first()).toContainText('Healthy');
});

test('the TDEE calculator matches the worked example', async ({ page }) => {
  await calculator(page, 'tdee');
  await page.getByLabel('Age', { exact: true }).fill('25');
  await page.getByLabel('Weight (kg)').fill('75');
  await page.getByLabel('Height (cm)').fill('175');
  await expect(page.getByText('1,724 kcal')).toBeVisible();
  await expect(page.getByText('2,672 kcal')).toBeVisible();
});

test('every page in the sitemap loads, links only to pages that exist, fits a phone and has a share image', async ({ page, request }) => {
  test.setTimeout(300_000); // well over a hundred pages, each with a full-page screenshot
  const index = await (await request.get('/sitemap-index.xml')).text();
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const pages = (await Promise.all(maps.map(async (m) => [...(await (await request.get(m)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => new URL(x[1]).pathname)))).flat();
  expect(pages.length).toBeGreaterThan(20);
  // Each page is loaded and screenshotted, so the time needed grows with the site; a fixed limit flakes on slow machines.
  test.setTimeout(10_000 + pages.length * 3_000);

  await page.setViewportSize({ width: 360, height: 740 });
  const links = new Set<string>();
  const images = new Set<string>();
  for (const path of pages) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(360);
    await expect(page.locator('meta[name="twitter:card"]'), path).toHaveAttribute('content', 'summary_large_image');
    images.add(new URL((await page.locator('meta[property="og:image"]').getAttribute('content'))!).pathname);
    for (const href of await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) links.add(href.split('#')[0]);
    await page.screenshot({ path: `test-results/artifacts/pages${path === '/' ? '/home' : path.replace(/\/$/, '')}.png`, fullPage: true });
  }
  for (const href of links) expect((await request.get(href)).status(), href).toBe(200);
  for (const src of images) {
    const res = await request.get(src);
    expect(res.status(), src).toBe(200);
    // A PNG's IHDR chunk holds the width and height at bytes 16 and 20.
    const png = await res.body();
    expect([png.toString('latin1', 12, 16), png.readUInt32BE(16), png.readUInt32BE(20)], src).toEqual(['IHDR', 1200, 630]);
  }
});

test('the app stays out of search results', async ({ page }) => {
  await page.goto('/app/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
