import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { addFood, ARTIFACTS, breakfast, device, dinner, onboard, reopen, send, syncCard, synced, syncs, tab } from './helpers';

type Row = { id: string; at: number; dev: string; data: string };

test('two devices pair, stay in step through edits, deletions and time offline, and the server stays blind', async ({ browser, request }) => {
  test.setTimeout(120_000);
  mkdirSync(ARTIFACTS, { recursive: true });
  const a = await device(browser);
  const b = await device(browser, 360);

  const link = await test.step('A turns on sync and gets a QR code and a link', async () => {
    await onboard(a.page);
    await tab(a.page, 'More').click();
    await syncCard(a.page).getByRole('button', { name: 'Turn on sync' }).click();
    await synced(a.page);
    await expect(syncCard(a.page).getByRole('img', { name: 'QR code of the sync link' })).toBeVisible();
    const link = await syncCard(a.page).getByRole('textbox', { name: 'Sync link' }).inputValue();
    expect(link).toMatch(/\/app\/#join=[\w-]{43}$/);
    // The secret travels only in the fragment, so it never reaches the server; only a room id derived from it does.
    expect(a.wire.room).toBeDefined();
    expect(link).not.toContain(a.wire.room!);
    await syncCard(a.page).screenshot({ path: `${ARTIFACTS}/sync-pair.png` });
    return link;
  });

  await test.step('B, a fresh phone, opens the link and gets the plan without setting it up', async () => {
    await b.page.goto(link);
    await expect(b.page.getByRole('heading', { name: 'Sync with your other device' })).toBeVisible();
    await b.page.screenshot({ path: `${ARTIFACTS}/sync-join.png` });
    await b.page.getByRole('button', { name: 'Start syncing' }).click();
    // Joining pulls and decrypts the whole room from the Durable Object, which on a busy Pi outlasts the default 5s.
    await expect(b.page).toHaveURL(/\/app\/#more$/, { timeout: 20_000 });
    await synced(b.page);
    await tab(b.page, 'Today').click();
    await expect(b.page.getByRole('region', { name: 'Calories' }).getByText('2,672 kcal left')).toBeVisible();
  });

  await test.step('A logs a meal and B sees it; A deletes it and B sees that too', async () => {
    await addFood(a.page, 'Breakfast', 'roti', /^Roti/);
    await send(a.page);
    await reopen(b.page);
    await expect(breakfast(b.page).getByRole('button', { name: /^Remove Roti/ })).toBeVisible();

    await tab(a.page, 'Food').click();
    await breakfast(a.page).getByRole('button', { name: /^Remove Roti/ }).click();
    await send(a.page);
    await reopen(b.page);
    await expect(breakfast(b.page).getByRole('button', { name: /^Remove Roti/ })).toHaveCount(0);
  });

  await test.step('B logs water offline while A logs dinner; both have both once B is back', async () => {
    await b.context.setOffline(true);
    await tab(b.page, 'Today').click();
    const water = b.page.getByRole('region', { name: 'Water' });
    await water.getByRole('button', { name: /250/ }).last().click();
    await expect(water.getByText(/^0\.25/)).toBeVisible();
    await tab(b.page, 'More').click();
    await expect(syncCard(b.page).getByRole('status')).toHaveText(/^Offline/);
    await syncCard(b.page).screenshot({ path: `${ARTIFACTS}/sync-offline.png` });

    await addFood(a.page, 'Dinner', 'dal tadka', /^Dal tadka/);
    await send(a.page);
    await syncs(b.page, () => b.context.setOffline(false));
    await tab(b.page, 'Food').click();
    await expect(dinner(b.page).getByRole('button', { name: /^Remove Dal tadka/ })).toBeVisible();
    await send(a.page);
    await tab(a.page, 'Today').click();
    await expect(a.page.getByRole('region', { name: 'Water' }).getByText(/^0\.25/)).toBeVisible();
  });

  await test.step('Nothing the server saw or stores is readable', async () => {
    const res = await request.get(`/api/sync/${a.wire.room}`, { headers: { Authorization: a.wire.auth! } });
    expect(res.ok()).toBe(true);
    const stored = (await res.json()) as Row[];
    // Every request and response is an envelope of rows, and a row is an id, a version and ciphertext.
    const envelopes = [...a.wire.bodies, ...b.wire.bodies].map((t) => JSON.parse(t) as { put?: Row[]; rows?: Row[] });
    const rows = [...stored, ...envelopes.flatMap((e) => e.put ?? e.rows!)];
    for (const e of envelopes) expect(Object.keys(e).sort()).toEqual(e.put ? ['put', 'since'] : ['more', 'rows', 'seq']);
    for (const r of rows) expect(Object.keys(r).sort()).toEqual(['at', 'data', 'dev', 'id']);
    expect(stored.length).toBeGreaterThan(5);
    const plaintext = ['Roti', 'Dal tadka', 'breakfast', 'dinner', 'kcal', 'protein', 'waterMl', 'birthYear', 'profile', 'weights', '"kg"', 'Vegetarian', '{"s"'];
    for (const r of rows) {
      const bytes = Buffer.from(r.data, 'base64url');
      for (const t of plaintext) expect(bytes.includes(t), `"${t}" reached the server`).toBe(false);
    }
    writeFileSync(`${ARTIFACTS}/sync-server-rows.json`, JSON.stringify({ room: a.wire.room, checkedFor: plaintext, rowsOnTheWire: rows.length - stored.length, plaintextFound: false, stored }, null, 2));
  });

  await test.step('B removes itself: it keeps its data but no longer gets changes', async () => {
    await b.page.goto('/app/#more');
    await syncCard(b.page).getByRole('button', { name: 'Remove this device' }).click();
    await expect(syncCard(b.page).getByRole('button', { name: 'Turn on sync' })).toBeVisible();
    await addFood(a.page, 'Breakfast', 'poha', /^Poha/);
    await send(a.page);
    await b.page.reload();
    await tab(b.page, 'Food').click();
    await expect(dinner(b.page).getByRole('button', { name: /^Remove Dal tadka/ })).toBeVisible();
    await expect(breakfast(b.page).getByRole('button', { name: /^Remove Poha/ })).toHaveCount(0);
  });

  await test.step('A turns sync off: the encrypted copy is deleted from the server', async () => {
    await tab(a.page, 'More').click();
    await syncCard(a.page).getByRole('button', { name: 'Turn off sync' }).click();
    await expect(syncCard(a.page).getByRole('button', { name: 'Turn on sync' })).toBeVisible();
    const gone = await request.get(`/api/sync/${a.wire.room}`, { headers: { Authorization: a.wire.auth! } });
    expect(gone.status()).toBe(410);
    await tab(a.page, 'Food').click();
    await expect(breakfast(a.page).getByRole('button', { name: /^Remove Poha/ })).toBeVisible();
  });
});
