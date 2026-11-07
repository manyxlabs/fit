import { expect, test, type Page } from '@playwright/test';
import { LOCALES, NAMES, type Locale } from '../src/i18n/locales';
import { REVIEWED } from '../src/i18n/review';
import enSite from '../src/i18n/en/site';
import enApp from '../src/i18n/en/app';
import { onboard } from './helpers';

const OTHERS = LOCALES.filter((l) => l !== 'en');
const prefix = (l: Locale) => (l === 'en' ? '' : `/${l}`);

/** Every English catalogue string of more than one word, for spotting copy left untranslated. */
function strings(o: unknown): string[] {
  if (typeof o === 'string') return o.includes(' ') ? [o.replace(/<\/?\w+>|\{\w+\}/g, '').trim()] : [];
  if (Array.isArray(o)) return o.flatMap(strings);
  if (o && typeof o === 'object') return Object.values(o).flatMap(strings);
  return [];
}

/** Visible text outside anything marked lang="en" (health copy waiting for its review). */
const ownText = (page: Page) =>
  page.evaluate(() => {
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const out: string[] = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement!;
      if (el.closest('[lang="en"], script, style, svg, [hidden]') || !el.checkVisibility()) continue;
      out.push(n.textContent!);
    }
    return out.join('\n');
  });

/** Elements reaching past the right edge of a 360px screen, to name what makes a page scroll sideways. */
const pastEdge = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((e) => e.checkVisibility() && e.getBoundingClientRect().right > 361 && ![...e.children].some((c) => c.getBoundingClientRect().right > 361))
      .map((e) => `${e.tagName.toLowerCase()}.${e.className}: ${e.textContent!.trim().slice(0, 40)}`),
  );

/** Elements whose text does not fit inside them at this width: buttons, tabs, links and headings. */
const overflowing = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, .btn, a, h1, h2, h3, label, select, summary, .tabs a')]
      .filter((e) => e.checkVisibility() && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible')
      .map((e) => e.textContent!.trim().slice(0, 60)),
  );

async function shoot(page: Page, name: string) {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    // Finishes the eased change of theme, which would otherwise be caught halfway.
    await page.screenshot({ path: `test-results/artifacts/i18n/${name}-${scheme}.png`, fullPage: true, animations: 'disabled' });
  }
  await page.emulateMedia({ colorScheme: 'light' });
}

for (const l of OTHERS) {
  test(`${NAMES[l]}: public pages are in ${l}, list every language, fit a phone and leak no English`, async ({ page }) => {
    const english = new Set(strings(enSite).filter((s) => s.length > 12));
    for (const path of ['/', '/calculators/', '/calculators/tdee/', '/privacy/']) {
      await page.setViewportSize({ width: 360, height: 740 });
      const res = await page.goto(`${prefix(l)}${path}`);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', l);
      const alternates = await page.locator('link[rel=alternate][hreflang]').evaluateAll((ls) => ls.map((x) => x.getAttribute('hreflang')));
      expect(alternates.sort()).toEqual([...LOCALES, 'x-default'].sort());
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://fit.manyxlabs.com${prefix(l)}${path}`);
      expect(await pastEdge(page), path).toEqual([]);
      expect(await overflowing(page), path).toEqual([]);
      const text = await ownText(page);
      expect([...english].filter((s) => text.includes(s)), path).toEqual([]);
    }
    await page.goto(`${prefix(l)}/calculators/tdee/`);
    await shoot(page, `${l}-tdee-360`);
    await page.setViewportSize({ width: 1280, height: 800 });
    await shoot(page, `${l}-tdee-desktop`);
  });
}

test('the language menu lists each language in its own script and keeps you on the same page', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/calculators/bmi/');
  const menu = page.locator('details.lang');
  await menu.locator('summary').click();
  await expect(menu.getByRole('link')).toHaveText(LOCALES.map((l) => NAMES[l]));
  await page.screenshot({ path: 'test-results/artifacts/i18n/menu-360.png' });
  await menu.getByRole('link', { name: NAMES.ta }).click();
  await expect(page).toHaveURL(/\/ta\/calculators\/bmi\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ta');

  // From the keyboard: Escape closes it and gives the focus back.
  await page.locator('details.lang summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details.lang')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('details.lang')).not.toHaveAttribute('open', '');
  await expect(page.locator('details.lang summary')).toBeFocused();

  // A guide is published in a language only once its health advice is reviewed; until then the menu leads to that language's home.
  const unreviewed = OTHERS.find((l) => !REVIEWED[l]);
  if (unreviewed) {
    await page.goto('/guides/fat-loss/');
    await page.locator('details.lang summary').click();
    await page.locator('details.lang').getByRole('link', { name: NAMES[unreviewed] }).click();
    await expect(page).toHaveURL(new RegExp(`/${unreviewed}/$`));
    expect((await page.request.get(`/${unreviewed}/guides/fat-loss/`)).status()).toBe(404);
  }
});

test('the app opens in the language of the page it was opened from, remembers it, and switches back', async ({ page }) => {
  await page.goto('/hi/');
  await page.locator('a[href="/app/?lang=hi"]').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(page).toHaveURL(/\/app\/$/);
  await page.goto('/app/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
});

for (const l of OTHERS) {
  test(`${NAMES[l]}: the app's tabs fit a phone, nothing is left in English, and food is found by its name in ${l}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/app/');
    await onboard(page);
    await page.evaluate((l) => localStorage.setItem('fit:lang', l), l);
    const english = new Set(strings(enApp).filter((s) => s.length > 12));
    for (const tab of ['today', 'food', 'train', 'progress', 'more']) {
      await page.goto(`/app/#${tab}`);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('lang', l);
      await expect(page.locator('.tabs [aria-current=page]')).toBeVisible();
      expect(await pastEdge(page), tab).toEqual([]);
      expect(await overflowing(page), tab).toEqual([]);
      const text = await ownText(page);
      expect([...english].filter((s) => text.includes(s)), tab).toEqual([]);
      if (tab === 'today' || tab === 'train') await shoot(page, `${l}-app-${tab}-360`);
    }
  });
}

test('food search finds a dish typed in any Indian script, whatever the app language', async ({ page }) => {
  await onboard(page);
  await page.goto('/app/#food');
  const lunch = page.getByRole('region', { name: 'Lunch' });
  await lunch.getByRole('button', { name: '+ Add food' }).click();
  for (const name of ['रोटी', 'রুটি', 'ரொட்டி', 'ರೊಟ್ಟಿ', 'రోటీ', 'રોટલી', 'ചപ്പാത്തി', 'पोळी']) {
    await lunch.getByLabel('Search foods').fill(name);
    await expect(lunch.getByRole('button', { name: /^Roti\b/ }).first(), name).toBeVisible();
  }
  await lunch.screenshot({ path: 'test-results/artifacts/i18n/food-search.png' });
});
