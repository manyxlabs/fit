import { expect, test, type Page } from '@playwright/test';
import { ARTIFACTS, onboard } from './helpers';

const PAGES = { home: '/', calculators: '/calculators/', tdee: '/calculators/tdee/', guide: '/guides/fat-loss/', exercise: '/exercises/back-squat/', privacy: '/privacy/' };
const INK = { light: 'rgb(245, 245, 247)', dark: 'rgb(5, 5, 6)' };
// Polled, because the background eases between the themes.
const ink = (page: Page, want: string) => expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(want);

test('a saved theme wins over the system one, the toggle saves the other, and with none saved the page follows the system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  // Saved by the site before the switch to the portfolio's dark class, under the same key.
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload();
  await ink(page, INK.dark);

  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await ink(page, INK.light);
  await page.reload();
  await ink(page, INK.light);
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible();

  await page.evaluate(() => localStorage.removeItem('theme'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await ink(page, INK.dark);
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
});

test('cards fade in as they scroll into view, and with reduced motion nothing ever waits hidden', async ({ page }) => {
  const hidden = () => page.locator('.reveal').evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  expect(await hidden()).toBeGreaterThan(0);
  for (const card of await page.locator('.reveal').all()) {
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveCSS('opacity', '1');
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  expect(await hidden()).toBe(0);
});

for (const width of [360, 432, 1280])
  test(`every page type in both themes at ${width}px, for comparing with the portfolio`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: width < 500 ? 740 : 900 });
    for (const [name, path] of Object.entries(PAGES)) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), name).toBe(0);
      for (const scheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: scheme });
        await page.screenshot({ path: `${ARTIFACTS}/ui/${name}-${width}-${scheme}.png`, fullPage: true });
      }
    }
    await onboard(page);
    for (const tab of ['today', 'food', 'train', 'progress', 'more']) {
      await page.goto(`/app/#${tab}`);
      await expect(page.locator('.tabs [aria-current=page]')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), tab).toBe(0);
      for (const scheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: scheme });
        await page.screenshot({ path: `${ARTIFACTS}/ui/app-${tab}-${width}-${scheme}.png`, fullPage: width < 500 });
      }
    }
  });
