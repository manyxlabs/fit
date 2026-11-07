import { createServer, type IncomingHttpHeaders } from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { ARTIFACTS, onboard, tab } from './helpers';
import { decryptPush, subscriptionKeys, verifyVapid } from './push';

type Delivery = { path: string; headers: IncomingHttpHeaders; body: Buffer };
// The part of a service worker's scope used here; the app's tsconfig has DOM types, not WebWorker ones.
type Scope = { registration: ServiceWorkerRegistration; dispatchEvent(e: Event): boolean; NotificationEvent: new (type: string, init: { notification: Notification }) => Event };
const TZ = 'Asia/Kolkata';
// Full Chromium: the headless shell grants notification permission when asked but then refuses to show any.
test.use({ channel: 'chromium' });

const hhmm = (at: number) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);

test('reminders: the server keeps only a schedule, sends an encrypted generic push on time, and forgets a dead subscription', async ({ browser, request }) => {
  test.setTimeout(240_000);
  mkdirSync(ARTIFACTS, { recursive: true });

  // A push service that accepts the first message and then reports the subscription gone.
  const deliveries: Delivery[] = [];
  const push = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      deliveries.push({ path: req.url!, headers: req.headers, body: Buffer.concat(chunks) });
      res.writeHead(deliveries.length === 1 ? 201 : 410).end();
    });
  });
  await new Promise<void>((done) => push.listen(0, 'localhost', done));
  const origin = `http://localhost:${(push.address() as AddressInfo).port}`;
  const endpoint = `${origin}/push/x`;
  const keys = subscriptionKeys();

  const context = await browser.newContext({ timezoneId: TZ, permissions: ['notifications'], viewport: { width: 360, height: 800 } });
  // Headless Chromium cannot reach a real push service, so the browser's subscription is the mock's.
  await context.addInitScript(
    ({ endpoint, p256dh, auth }) => {
      let subscribed = false;
      const sub = {
        endpoint,
        toJSON: () => ({ endpoint, expirationTime: null, keys: { p256dh, auth } }),
        unsubscribe: async () => !(subscribed = false),
      };
      PushManager.prototype.getSubscription = async () => (subscribed ? (sub as unknown as PushSubscription) : null);
      PushManager.prototype.subscribe = async (options) => {
        (window as unknown as { serverKey: unknown }).serverKey = Array.from(new Uint8Array(options!.applicationServerKey as ArrayBuffer));
        subscribed = true;
        return sub as unknown as PushSubscription;
      };
    },
    { endpoint, p256dh: keys.publicKey.toString('base64url'), auth: keys.auth.toString('base64url') },
  );
  const page = await context.newPage();
  const puts: string[] = [];
  page.on('request', (r) => void (r.url().endsWith('/api/push') && r.method() === 'PUT' && puts.push(r.postData()!)));
  const { publicKey } = (await (await request.get('/api/push')).json()) as { publicKey: string };

  // The next whole minute in India with time to set it up, and dinner a minute after.
  let at = Math.ceil(Date.now() / 60_000) * 60_000;
  if (at - Date.now() < 20_000) at += 60_000;
  const lunch = hhmm(at);
  const dinner = hhmm(at + 60_000);

  await onboard(page);
  await tab(page, 'More').click();
  const card = page.getByRole('region', { name: 'Reminders' });
  await expect(card.getByText('iOS 16.4 or later')).toBeVisible();
  for (const name of ['Morning weigh-in', 'Log breakfast', 'Workout days']) await card.getByRole('checkbox', { name }).uncheck();
  await card.getByLabel('Lunch time').fill(lunch);
  await card.getByLabel('Dinner time').fill(dinner);
  await card.getByRole('button', { name: 'Turn on reminders' }).click();
  await expect(card.getByRole('status')).toHaveText('Reminders are on.');
  await card.screenshot({ path: `${ARTIFACTS}/reminders-on.png` });

  await test.step('The server is told only where to send, the timezone and the times', async () => {
    expect(await page.evaluate(() => (window as unknown as { serverKey: number[] }).serverKey)).toEqual([...Buffer.from(publicKey, 'base64url')]);
    expect(puts).toHaveLength(1);
    const sent = JSON.parse(puts[0]!);
    expect(Object.keys(sent).sort()).toEqual(['schedule', 'subscription', 'tz']);
    // Chromium may name India's zone by its older alias, Asia/Calcutta; what matters is that the browser's own zone is sent.
    const zone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    const canonical = (tz: string) => new Intl.DateTimeFormat('en', { timeZone: tz }).resolvedOptions().timeZone;
    expect(canonical(zone)).toBe(canonical(TZ));
    expect(sent.tz).toBe(zone);
    expect(sent.schedule).toEqual({ meals: { lunch, dinner } });
    const stored = await request.get(`/api/push?endpoint=${encodeURIComponent(endpoint)}`);
    expect(await stored.json()).toEqual({
      sub: { endpoint, keys: sent.subscription.keys },
      tz: zone,
      schedule: { meals: { lunch, dinner } },
      due: { at, kinds: ['lunch'] },
    });
  });

  const payload = await test.step('Lunch arrives on the minute, encrypted for this browser and signed with the VAPID key', async () => {
    await expect.poll(() => deliveries.length, { timeout: at + 45_000 - Date.now(), intervals: [1000] }).toBeGreaterThan(0);
    const [d] = deliveries as [Delivery];
    expect(Date.now()).toBeGreaterThanOrEqual(at);
    expect(d.path).toBe('/push/x');
    expect(d.headers['content-encoding']).toBe('aes128gcm');
    expect(d.headers.ttl).toBe('1800');
    expect(d.headers.topic).toBe('lunch');
    const vapid = verifyVapid(d.headers.authorization!, origin);
    expect(vapid.publicKey).toBe(publicKey);
    const { plaintext, rs } = decryptPush(d.body, keys);
    const payload = JSON.parse(plaintext.toString());
    expect(payload).toEqual({ title: 'Fit', tag: 'lunch', body: 'Time to log lunch', tab: 'food' });
    writeFileSync(
      `${ARTIFACTS}/reminders-push.json`,
      JSON.stringify({ headers: { ...d.headers, authorization: '(verified)' }, vapid, recordSize: rs, bodyBytes: d.body.length, decrypted: payload }, null, 2),
    );
    return plaintext.toString();
  });

  await test.step('The service worker shows it, and a click opens the Food tab', async () => {
    await tab(page, 'Today').click();
    const cdp = await context.newCDPSession(page);
    const registration = new Promise<string>((resolve) =>
      cdp.on('ServiceWorker.workerRegistrationUpdated', ({ registrations }) => {
        const r = registrations.find((r) => !r.isDeleted);
        if (r) resolve(r.registrationId);
      }),
    );
    await cdp.send('ServiceWorker.enable');
    await cdp.send('ServiceWorker.deliverPushMessage', { origin: new URL(page.url()).origin, registrationId: await registration, data: payload });
    const sw = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await expect
      .poll(() => sw.evaluate(async () => (await (self as unknown as Scope).registration.getNotifications()).map((n) => ({ title: n.title, body: n.body, tag: n.tag }))), {
        // A loaded Pi can take seconds to wake the service worker for the push.
        timeout: 15_000,
      })
      .toEqual([{ title: 'Fit', body: 'Time to log lunch', tag: 'lunch' }]);
    // A synthetic click: its waitUntil throws, but the handler has already started opening the tab.
    await sw.evaluate(async () => {
      const scope = self as unknown as Scope;
      const [notification] = await scope.registration.getNotifications();
      scope.dispatchEvent(new scope.NotificationEvent('notificationclick', { notification: notification! }));
    });
    await expect(page).toHaveURL(/\/app\/#food$/);
    await expect(page.getByRole('region', { name: 'Lunch' })).toBeVisible();
  });

  await test.step('Dinner finds the subscription gone (410), so the server deletes it', async () => {
    await expect.poll(() => deliveries.length, { timeout: at + 105_000 - Date.now(), intervals: [1000] }).toBe(2);
    expect(deliveries[1]!.headers.topic).toBe('dinner');
    await expect.poll(async () => (await request.get(`/api/push?endpoint=${encodeURIComponent(endpoint)}`)).status()).toBe(404);
  });
  await context.close();
  push.close();
});
