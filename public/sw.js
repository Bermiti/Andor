const CACHE_PREFIX = 'andor-cache-';
const CACHE_NAME = 'andor-cache-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Intentionally no fetch handler: personalized HTML and API responses must never
// be stored by the service worker. Offline support can return after an explicit,
// privacy-reviewed cache allowlist exists.
