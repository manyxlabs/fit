import { expect, test } from '@playwright/test';
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
