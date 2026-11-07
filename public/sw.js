// Lets the app open offline. Pages are fetched fresh when online and fall back to the copy
// cached on the last visit; fingerprinted bundles never change, so they are served from cache.
const CACHE = 'fit-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
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
