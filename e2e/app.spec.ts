import { expect, test, type Page } from '@playwright/test';
import foods from '../src/data/foods.json' with { type: 'json' };
import { onboard, tab } from './helpers';

test('a new user gets maintenance calories and macros from their details', async ({ page }) => {
  await onboard(page);
  // BMR 1,723.75 × 1.55 = 2,672 kcal; protein 1.6 g/kg × 75 = 120 g.
  const calories = page.getByRole('region', { name: 'Calories' });
  await expect(calories.getByText('2,672 kcal left')).toBeVisible();
  await expect(calories.getByRole('progressbar', { name: 'Protein' })).toHaveAttribute('aria-valuemax', '120');
  await page.screenshot({ path: 'test-results/artifacts/today.png', fullPage: true });
});

test('logging Indian food in household units updates the day', async ({ page }) => {
  await onboard(page);
  await tab(page, 'Food').click();
  const breakfast = page.getByRole('region', { name: 'Breakfast' });
  await breakfast.getByRole('button', { name: '+ Add food' }).click();
  await breakfast.getByLabel('Search foods').fill('roti');
  await breakfast.getByRole('button', { name: /^Roti/ }).first().click();
  await breakfast.getByLabel('Amount').fill('2');
  await breakfast.getByRole('button', { name: 'Add', exact: true }).click();
  // Two rotis are about 200-260 kcal.
  await expect.poll(async () => Number((await breakfast.locator('header .num').innerText()).replace(/\D/g, ''))).toBeGreaterThan(180);
  expect(Number((await breakfast.locator('header .num').innerText()).replace(/\D/g, ''))).toBeLessThan(300);

  // A vegetarian is never offered meat.
  const lunch = page.getByRole('region', { name: 'Lunch' });
  await lunch.getByRole('button', { name: '+ Add food' }).click();
  await lunch.getByLabel('Search foods').fill('chicken');
  await expect(lunch.getByText('No match.')).toBeVisible();

  await lunch.getByRole('button', { name: 'Add your own food' }).click();
  await lunch.getByLabel('Name').fill('Protein bar');
  await lunch.getByLabel('Serving (g)').fill('60');
  await lunch.getByLabel('kcal').fill('240');
  await lunch.getByLabel('Protein (g)').fill('20');
  await lunch.getByRole('button', { name: 'Save food' }).click();
  await lunch.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(lunch.locator('header .num')).toHaveText('400 kcal'); // 100 g of a 240 kcal / 60 g bar

  await breakfast.getByRole('button', { name: /^Remove Roti/ }).click();
  await expect(breakfast.locator('header .num')).toHaveText('0 kcal');
  await page.screenshot({ path: 'test-results/artifacts/food.png', fullPage: true });
});

test('a workout is logged, and the next session asks for more', async ({ page }) => {
  await onboard(page);
  await tab(page, 'Train').click();
  const first = await page.getByRole('heading', { name: /^Next: / }).innerText();
  await page.getByRole('button', { name: 'Start workout' }).click();
  const card = page.locator('section.card').first();
  const range = (await card.getByText(/^Target: /).innerText()).match(/(\d+) sets/)!;
  const sets = Number(range[1]);
  for (let i = 0; i < sets; i++) {
    await card.getByLabel('kg', { exact: true }).fill('60');
    await card.getByLabel('Reps', { exact: true }).fill('30');
    await card.getByRole('button', { name: 'Log' }).click();
    await expect(card.locator('li.done')).toHaveCount(i + 1);
  }
  await expect(page.getByRole('timer')).toBeVisible();
  await page.reload(); // the workout in progress survives a reload
  await expect(card.locator('li.done')).toHaveCount(sets);
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('heading', { name: /^Next: / })).not.toHaveText(first);
  await expect(page.getByRole('region', { name: 'Recent workouts' }).getByText(`${sets} sets`)).toBeVisible();

  // Every set hit the top of the range, so next time on that day the load goes up.
  await page.getByLabel('Train a different day').selectOption({ label: first.replace('Next: ', '') });
  await expect(page.locator('section.card').first().getByText(/^Target: 6[2-5](\.\d+)? kg/)).toBeVisible();
});

test('a fever turns the day into rest', async ({ page }) => {
  await onboard(page);
  await page.getByLabel('Feeling unwell?').selectOption('belowNeck');
  await expect(page.getByText(/skip training/)).toBeVisible();
  await tab(page, 'Train').click();
  await expect(page.getByRole('button', { name: 'Start workout' })).toHaveCount(0);
});

test('a backup restores everything after the data is deleted', async ({ page }) => {
  await onboard(page);
  await tab(page, 'More').click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  const file = await (await download).path();

  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.getByRole('heading', { name: 'Set up your plan' })).toBeVisible();

  await page.goto('/app/#more');
  await expect(page.getByRole('heading', { name: 'Set up your plan' })).toBeVisible();
  await onboard(page, 'Lose fat');
  await tab(page, 'More').click();
  await page.locator('input[type=file]').setInputFiles(file);
  await tab(page, 'Today').click();
  await expect(page.getByRole('region', { name: 'Calories' }).getByText('2,672 kcal left')).toBeVisible();
});

test.describe('meal plans and fasting', () => {
  // Fixed clocks below are Indian times, whatever zone the machine running the tests is in.
  test.use({ timezoneId: 'Asia/Kolkata' });
  const vratFoods = new Set(foods.filter((f) => 'vrat' in f && f.vrat).map((f) => f.name));
  const totalsBar = (page: Page, name: string) => page.getByRole('region', { name: 'Totals' }).getByRole('progressbar', { name });

  test('a vegetarian day plan meets the targets and logs in one tap', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-07T09:00:00+05:30'));
    await onboard(page);
    await tab(page, 'Food').click();
    const plan = page.getByRole('region', { name: 'Plan my day' });
    const meals = plan.locator('.plan-meal h3');
    await expect(meals).toHaveText([/^Breakfast: /, /^Lunch: /, /^Snacks: /, /^Dinner: /]);
    const first = await meals.allInnerTexts();
    for (const name of await plan.locator('.entries strong').allInnerTexts()) expect(['vegan', 'veg']).toContain(foods.find((f) => f.name === name)?.diet);

    await plan.getByRole('button', { name: 'Log whole day' }).click();
    await expect(plan.getByRole('button', { name: 'Whole day logged' })).toBeDisabled();
    // 2,672 kcal within 5%, and at least 95% of 120 g protein.
    const kcal = Number(await totalsBar(page, 'Calories').getAttribute('aria-valuenow'));
    expect(kcal).toBeGreaterThanOrEqual(2538);
    expect(kcal).toBeLessThanOrEqual(2806);
    expect(Number(await totalsBar(page, 'Protein').getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(114);
    await page.screenshot({ path: 'test-results/artifacts/plan.png', fullPage: true });

    // The plan and its logged state survive a reload, so nothing can be logged twice.
    await page.reload();
    await expect(meals).toHaveText(first);
    await expect(plan.getByRole('button', { name: 'Logged', exact: true })).toHaveCount(4);
    await expect(totalsBar(page, 'Calories')).toHaveAttribute('aria-valuenow', String(kcal));

    await plan.getByRole('button', { name: 'Shuffle' }).click();
    await expect.poll(() => meals.allInnerTexts()).not.toEqual(first);
    await expect(plan.getByRole('button', { name: 'Log whole day' })).toBeEnabled();
  });

  test('a vrat day offers only vrat foods', async ({ page }) => {
    await onboard(page);
    const vrat = page.getByLabel('Vrat today (Ekadashi or another fast day)');
    // The box reflects the saved day, so it ticks once the write lands rather than on the click itself.
    await vrat.click();
    await expect(vrat).toBeChecked();
    await tab(page, 'Food').click();
    const plan = page.getByRole('region', { name: 'Plan my day' });
    await expect(plan.getByText('Vrat: only vrat foods.')).toBeVisible();
    const planned = await plan.locator('.entries strong').allInnerTexts();
    expect(planned.length).toBeGreaterThan(0);
    for (const name of planned) expect(vratFoods).toContain(name);

    const breakfast = page.getByRole('region', { name: 'Breakfast' });
    await breakfast.getByRole('button', { name: '+ Add food' }).click();
    await expect(breakfast.getByText('Vrat: showing vrat foods only.')).toBeVisible();
    for (const query of ['roti', 'paneer', 'aloo']) {
      await breakfast.getByLabel('Search foods').fill(query);
      const found = await breakfast.locator('.results button > span:first-child').allInnerTexts();
      expect(found.length).toBeGreaterThan(0);
      for (const name of found) expect(vratFoods).toContain(name);
    }
    await page.screenshot({ path: 'test-results/artifacts/vrat.png', fullPage: true });

    // The toggle lasts one day.
    await tab(page, 'Today').click();
    await page.getByRole('button', { name: 'Previous day', exact: true }).click();
    await expect(vrat).not.toBeChecked();
  });

  test('Today shows whether the intermittent fasting window is open', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-07T14:00:00+05:30'));
    await onboard(page);
    await tab(page, 'More').click();
    await page.getByRole('combobox', { name: 'Fasting', exact: true }).selectOption({ label: 'Intermittent fasting' });
    await page.getByLabel('Eating window').selectOption({ label: '16:8: eat within 8 hours' });
    await page.getByLabel('First meal at').fill('12:00');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await tab(page, 'Today').click();
    const card = page.getByRole('region', { name: 'Fasting' });
    await expect(card.getByRole('status')).toHaveText('Eating window open, closes at 8:00 pm');
    await page.screenshot({ path: 'test-results/artifacts/fasting-open.png', fullPage: true });

    await page.clock.setFixedTime(new Date('2026-11-07T22:00:00+05:30'));
    await page.reload();
    await expect(card.getByRole('status')).toHaveText('Fasting, eating window opens at 12:00 pm');
    await page.screenshot({ path: 'test-results/artifacts/fasting-closed.png', fullPage: true });
  });
});
