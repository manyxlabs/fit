// Lets the app open offline. Pages are fetched fresh when online and fall back to the copy
// cached on the last visit; fingerprinted bundles never change, so they are served from cache.
const CACHE = 'fit-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_astro/')) {
    e.respondWith(caches.open(CACHE).then(async (c) => (await c.match(e.request)) ?? fetch(e.request).then((r) => (r.ok && c.put(e.request, r.clone()), r))));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        // Cloned now: the page reads the original before the cache opens.
        if (r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return r;
      })
      .catch(async () => (await caches.match(e.request)) ?? Response.error()),
  );
});

// Reminders: the Worker sends only a generic line and the tab it is about (src/lib/reminders.ts).
self.addEventListener('push', (e) => {
  const m = e.data?.json() ?? {};
  e.waitUntil(self.registration.showNotification(m.title ?? 'Fit', { body: m.body, tag: m.tag, icon: '/apple-touch-icon.png', data: { tab: m.tab } }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(`/app/#${e.notification.data?.tab ?? 'today'}`, location.origin).href;
  e.waitUntil(
    (async () => {
      const open = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).find((c) => new URL(c.url).pathname === '/app/');
      if (!open) return self.clients.openWindow(url);
      // The app follows its hash, so this switches tabs without a reload.
      const moved = await open.navigate(url).catch(() => null);
      return (moved ?? open).focus();
    })(),
  );
});
