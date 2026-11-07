// Serves the static site, plus what a browser cannot do alone, under /api: relaying end-to-end
// encrypted sync between one person's devices (sync.ts) and sending reminders by Web Push (push.ts).
import { handlePush, Reminder } from './push';
import { handleSync, Room } from './sync';

export interface Env {
  ASSETS: Fetcher;
  ROOMS: DurableObjectNamespace<Room>;
  REMINDERS: DurableObjectNamespace<Reminder>;
  LIMITER: RateLimit;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  /** "1" only in local development: allows a localhost push endpoint and a read of what a room or a reminder stores, for the tests. */
  DEV?: string;
}

export { Reminder, Room };

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const { success } = await env.LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? '' });
    if (!success) return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60' } });
    const sync = /^\/api\/sync\/([^/]+)$/.exec(pathname);
    if (sync) return handleSync(request, env, sync[1]!);
    if (pathname === '/api/push') return handlePush(request, env);
    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
