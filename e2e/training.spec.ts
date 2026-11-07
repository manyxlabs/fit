import { expect, test, type Page } from '@playwright/test';
import { onboard, tab } from './helpers';

const program = (page: Page) => page.getByRole('region', { name: /^Your program/ }).getByRole('combobox', { name: 'Program', exact: true });
const step = (page: Page) => page.locator('.interval-step');

test('an exercise page shows the muscles it works and links to its swaps', async ({ page }) => {
  await page.goto('/exercises/barbell-bench-press/');
  const map = page.getByRole('img', { name: /^Muscles worked: Chest; assisting: Triceps, Front delts/ });
  await expect(map).toBeVisible();
  await expect(map.locator('[data-muscle=chest].main')).toHaveCount(2); // one per side
  await expect(map.locator('[data-muscle=triceps].assist')).toHaveCount(2);
  await expect(map.locator('[data-muscle=quads].main, [data-muscle=quads].assist')).toHaveCount(0);

  const howTo = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(howTo['@type']).toBe('HowTo');
  expect(howTo.step.length).toBeGreaterThanOrEqual(4);

  await page.screenshot({ path: 'test-results/artifacts/exercise-page.png', fullPage: true });
  await page.getByRole('link', { name: 'Dumbbell bench press' }).click();
  await expect(page).toHaveURL(/\/exercises\/dumbbell-bench-press\/$/);
  await expect(page.getByRole('heading', { name: 'Dumbbell bench press', level: 1 })).toBeVisible();
});

test('the first 5K plan runs week 1 day 1 on the interval timer and logs it', async ({ page }) => {
  await page.clock.install();
  await onboard(page);
  await tab(page, 'More').click();
  await page.getByRole('combobox', { name: 'Program', exact: true }).selectOption({ label: 'First 5K, run/walk (3 days, beginner)' });
  await page.getByRole('button', { name: 'Save changes' }).click();
  await tab(page, 'Train').click();
  await expect(page.getByRole('region', { name: 'Next: Week 1 · Run 1' }).getByText('5:00 walk, 8 × (1:00 run, 1:30 walk), 5:00 walk, 30 min')).toBeVisible();

  await page.getByRole('button', { name: 'Start run' }).click();
  await expect(step(page)).toHaveText('Walk');
  await page.clock.fastForward('05:01');
  await expect(step(page)).toHaveText('Run');
  await page.clock.fastForward('01:00');
  await expect(step(page)).toHaveText('Walk');
  await page.screenshot({ path: 'test-results/artifacts/first-5k-timer.png', fullPage: true });
  await page.reload(); // the session in progress survives a reload
  await expect(step(page)).toHaveText('Walk');
  await page.clock.fastForward('24:00');
  await expect(step(page)).toHaveText('Done');

  await page.getByLabel('Distance (km)').fill('3');
  await expect(page.getByLabel('Minutes')).toHaveValue('30');
  await expect(page.getByText('Pace 10:00 per km')).toBeVisible();
  await page.screenshot({ path: 'test-results/artifacts/first-5k-log.png', fullPage: true });
  await page.getByRole('button', { name: 'Save run' }).click();

  await expect(page.getByRole('heading', { name: 'Next: Week 1 · Run 2' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Recent workouts' }).getByText('Week 1 · Run 1')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Cardio and sport today' }).getByText(/3\.00 km at 10:00 per km/)).toBeVisible();
});

test('a yoga routine runs on the hold timer and is logged', async ({ page }) => {
  await page.clock.install();
  await onboard(page);
  await tab(page, 'Train').click();
  await program(page).selectOption({ label: 'Yoga and mobility (3 days, any level)' });
  await expect(page.getByRole('heading', { name: 'Next: Week 1 · Hips and hamstrings' })).toBeVisible();

  await page.getByRole('button', { name: 'Start routine' }).click();
  await expect(step(page)).toHaveText('Get ready: Cat-cow');
  await page.clock.fastForward('00:06');
  await expect(step(page)).toHaveText('Cat-cow');
  await expect(page.getByText(/^On all fours, breathe in/)).toBeVisible();
  await page.screenshot({ path: 'test-results/artifacts/yoga-timer.png', fullPage: true });
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.clock.fastForward('10:00');
  await expect(step(page)).toHaveText('Cat-cow'); // a paused hold stays put
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.clock.fastForward('12:00');
  await expect(step(page)).toHaveText('Done');

  await page.getByRole('button', { name: 'Save session' }).click();
  await expect(page.getByRole('heading', { name: 'Next: Week 1 · Spine and shoulders' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Recent workouts' }).getByText('Week 1 · Hips and hamstrings')).toBeVisible();
});

test('the strength program prescribes the next load from the logged estimated max', async ({ page }) => {
  await onboard(page);
  await tab(page, 'Train').click();
  await program(page).selectOption({ label: 'Strength, upper / lower (4 days, intermediate)' });
  await expect(page.getByRole('heading', { name: 'Next: Week 1 · Upper A' })).toBeVisible();

  await page.getByRole('button', { name: 'Start workout' }).click();
  const bench = page.getByRole('region', { name: 'Barbell bench press' });
  await expect(bench.getByText(/^Target: 5 reps, 3 sets, 3 reps in reserve/)).toBeVisible();
  await bench.getByLabel('kg', { exact: true }).fill('100');
  await bench.getByLabel('Reps', { exact: true }).fill('5');
  await bench.getByLabel('Reps in reserve').selectOption('3');
  await bench.getByRole('button', { name: 'Log' }).click();
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('heading', { name: 'Next: Week 1 · Lower A' })).toBeVisible();

  // 100 kg × 5 with 3 in reserve estimates 126.7 kg; 4 reps with 2 in reserve is 126.7 / 1.2 = 105.6, rounded to the 2.5 kg step.
  await page.getByLabel('Train a different day').selectOption({ label: 'Week 2 · Upper A' });
  await expect(page.getByRole('region', { name: 'Barbell bench press' }).getByText(/^Target: 105\.0 kg × 4 reps, 4 sets, 2 reps in reserve/)).toBeVisible();
  await page.screenshot({ path: 'test-results/artifacts/strength-target.png', fullPage: true });
});

test('at home, bar moves are offered only with a bar, and bodyweight moves progress by reps and harder variations', async ({ page }) => {
  await onboard(page);
  await tab(page, 'More').click();
  await page.getByLabel('Where you train').selectOption({ label: 'Bodyweight only' });
  await page.getByLabel('Training days a week').selectOption('3');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await tab(page, 'Train').click();
  const plan = page.getByRole('region', { name: /^Your program/ });
  await plan.getByText('Days and exercises').click();
  await expect(plan.getByRole('combobox', { name: 'Swap Inverted row' }).first()).toBeVisible();
  await expect(plan).not.toContainText(/Pull-up|Chin-up|\bDip\b|Hanging leg raise/);
  await page.screenshot({ path: 'test-results/artifacts/program-no-bar.png', fullPage: true });

  await tab(page, 'More').click();
  await page.getByLabel('I have a pull-up bar or dip station').check();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await tab(page, 'Train').click();
  await plan.getByText('Days and exercises').click();
  await expect(plan.getByRole('combobox', { name: 'Swap Pull-up' })).toBeVisible();
  await expect(plan.getByRole('combobox', { name: 'Swap Dip' })).toBeVisible();

  // Every set at the top of the range with no weight to add: the next target is a harder variation, never more kg.
  const pullUp = page.getByRole('region', { name: 'Pull-up', exact: true });
  for (const round of [1, 2]) {
    await page.getByLabel('Train a different day').selectOption('Full body B');
    if (round === 2) break;
    for (let i = 0; i < 3; i++) {
      await pullUp.getByLabel('Reps', { exact: true }).fill('10');
      await pullUp.getByRole('button', { name: 'Log' }).click();
      await expect(pullUp.locator('li.done')).toHaveCount(i + 1);
    }
    await page.getByRole('button', { name: 'Finish workout' }).click();
  }
  await expect(pullUp.getByText('Move to a harder variation')).toBeVisible();
  await expect(pullUp.getByText(/Target: 10 reps, 3 sets/)).toBeVisible();
  await expect(pullUp).not.toContainText(/Add [\d.]+ kg/);
  await pullUp.screenshot({ path: 'test-results/artifacts/bodyweight-progression.png' });
});
