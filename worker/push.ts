import { DurableObject } from 'cloudflare:workers';
import { message, next, parseSchedule, validTimeZone, type Kind, type Schedule } from '../src/lib/reminders';
import { EMAIL } from '../src/site';
import { unb64 } from './b64';
import type { Env } from './index';
import { send, type Subscription } from './webpush';

// One Durable Object per subscription, woken by its own alarm at its next reminder, rather than a
// cron every 5 minutes. The work is then one wake-up per reminder actually sent, on the minute it is
// due, and it spreads over as many objects as there are people. A cron would wake 288 times a day
// whether or not anything is due, and need one store of every subscription to search each time,
// which becomes the bottleneck as people join.

type Saved = { sub: Subscription; tz: string; schedule: Schedule; due: { at: number; kinds: Kind[] } | null };
/** A reminder later than this is dropped rather than sent, and push services drop it once this old. */
const STALE = 30 * 60_000;
const MAX_BODY = 4096;
// Every browser's push service; anything else would let the Worker be used to post at any URL.
const SERVICES = /^(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|[\w-]+\.push\.apple\.com|[\w-]+\.notify\.windows\.com)$/;

/** Holds one browser's subscription, timezone and schedule, nothing else, and sends its reminders. */
export class Reminder extends DurableObject<Env> {
  async set(saved: Omit<Saved, 'due'>) {
    await this.plan(saved, Date.now());
  }

  saved() {
    return this.ctx.storage.kv.get<Saved>('saved') ?? null;
  }

  async clear() {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  async alarm() {
    const saved = this.ctx.storage.kv.get<Saved>('saved');
    if (!saved) return;
    const now = Date.now();
    if (saved.due && now - saved.due.at < STALE) {
      for (const kind of saved.due.kinds) {
        try {
          const res = await send(saved.sub, JSON.stringify({ title: 'Fit', tag: kind, ...message(kind) }), {
            vapid: { publicKey: this.env.VAPID_PUBLIC_KEY!, privateKey: this.env.VAPID_PRIVATE_KEY! },
            subject: `mailto:${EMAIL}`,
            topic: kind,
            ttl: STALE / 1000,
          });
          // The browser unsubscribed or the subscription expired: it will never be valid again.
          if (res.status === 404 || res.status === 410) return this.clear();
          if (!res.ok) console.warn('push refused', res.status, await res.text());
        } catch (e) {
          // Not thrown on: a retried alarm would send the kinds already sent again.
          console.warn('push failed', e);
        }
      }
    }
    await this.plan(saved, Math.max(now, saved.due?.at ?? 0));
  }

  private async plan(saved: Omit<Saved, 'due'>, after: number) {
    const due = next(saved.schedule, saved.tz, after);
    this.ctx.storage.kv.put('saved', { ...saved, due } satisfies Saved);
    if (due) await this.ctx.storage.setAlarm(due.at);
    else await this.ctx.storage.deleteAlarm();
  }
}

function endpointOk(endpoint: unknown, env: Env): endpoint is string {
  if (typeof endpoint !== 'string' || endpoint.length > 1024 || !URL.canParse(endpoint)) return false;
  const url = new URL(endpoint);
  if (env.DEV === '1' && url.protocol === 'http:' && url.hostname === 'localhost') return true;
  return url.protocol === 'https:' && !url.port && SERVICES.test(url.hostname);
}

const keyOk = (s: unknown, length: number) => typeof s === 'string' && /^[\w-]+$/.test(s) && unb64(s).byteLength === length;

async function reminder(env: Env, endpoint: string) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint)));
  return env.REMINDERS.getByName(Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join(''));
}

/** `GET /api/push` gives the VAPID public key (in development, `?endpoint=` gives what is stored for it), `PUT` saves a subscription's schedule and `DELETE` removes it. */
export async function handlePush(request: Request, env: Env) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return new Response('Reminders are not set up', { status: 503 });
  if (request.method === 'GET') {
    const endpoint = new URL(request.url).searchParams.get('endpoint');
    if (endpoint === null || env.DEV !== '1') return Response.json({ publicKey: env.VAPID_PUBLIC_KEY });
    const saved = await (await reminder(env, endpoint)).saved();
    return saved ? Response.json(saved) : new Response('Not found', { status: 404 });
  }
  if (request.method !== 'PUT' && request.method !== 'DELETE') return new Response('Method not allowed', { status: 405 });
  const length = Number(request.headers.get('Content-Length'));
  if (!request.headers.has('Content-Length') || !Number.isSafeInteger(length)) return new Response('Length required', { status: 411 });
  if (length > MAX_BODY) return new Response('Too large', { status: 413 });
  let body: { subscription?: Subscription; endpoint?: string; tz?: unknown; schedule?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (request.method === 'DELETE') {
    if (!endpointOk(body.endpoint, env)) return new Response('Bad request', { status: 400 });
    await (await reminder(env, body.endpoint)).clear();
    return new Response(null, { status: 204 });
  }
  const sub = body.subscription;
  const schedule = parseSchedule(body.schedule);
  if (!sub || !endpointOk(sub.endpoint, env) || !keyOk(sub.keys?.p256dh, 65) || !keyOk(sub.keys?.auth, 16) || !validTimeZone(body.tz) || !schedule)
    return new Response('Bad request', { status: 400 });
  // Rebuilt from the checked fields, so nothing else a client sends is ever stored.
  await (await reminder(env, sub.endpoint)).set({ sub: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, tz: body.tz, schedule });
  return new Response(null, { status: 204 });
}
