const CACHE_NAME = 'andor-cache-v1';
const STATIC_ASSETS = [
  '/my-trips',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Focus caching on same-origin resources
  if (requestUrl.origin === self.location.origin) {
    // Network-first policy with offline fallback for HTML document requests (pages)
    if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
            return response;
          })
          .catch(() => {
            return caches.match(event.request).then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              // Fallback to cached /my-trips if page not in cache
              return caches.match('/my-trips');
            });
          })
      );
      return;
    }

    // Cache-first policy for static assets (js, css, images, json)
    if (
      event.request.destination === 'style' ||
      event.request.destination === 'script' ||
      event.request.destination === 'image' ||
      requestUrl.pathname.startsWith('/_next/')
    ) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then((response) => {
            if (response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, copy);
              });
            }
            return response;
          });
        })
      );
      return;
    }
  }
});
