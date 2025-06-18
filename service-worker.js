const CACHE_NAME = 'qr-generator-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/script.js',
  '/styles.css',
  '/qrcode.min.js',
  '/icon.svg',
  '/manifest.json'
];

// List of external resources that should be allowed to pass through
const EXTERNAL_RESOURCES = [
  'https://www.google-analytics.com/analytics.js',
  'https://www.googletagmanager.com/gtag/js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and external resources
  if (!event.request.url.startsWith(self.location.origin) || 
      EXTERNAL_RESOURCES.some(url => event.request.url.startsWith(url))) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a success response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Return a fallback response for failed requests
            if (event.request.url.endsWith('.png') || event.request.url.endsWith('.ico')) {
              return new Response('', { status: 404 });
            }
            return new Response('Offline - Please check your connection', { 
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
}); 