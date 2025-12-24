const CACHE_NAME = 'qr-generator-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './script.js',
  './styles.css',
  './qrcode.min.js',
  './icon.svg',
  './favicon.svg',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS_TO_CACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => {
      if (name !== CACHE_NAME) return caches.delete(name);
      return undefined;
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle same-origin GET requests.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: prefer network, fall back to cached app shell.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResp = await fetch(req);
        if (networkResp && networkResp.status === 200 && networkResp.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', networkResp.clone());
        }
        return networkResp;
      } catch (_) {
        const cached = await caches.match('./index.html');
        return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  // Static assets: cache-first, update cache on successful network fetch.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const networkResp = await fetch(req);
      if (networkResp && networkResp.status === 200 && networkResp.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, networkResp.clone());
      }
      return networkResp;
    } catch (_) {
      // Minimal fallback: if we can't fetch and don't have cache, return 404-ish response.
      return new Response('', { status: 404 });
    }
  })());
});