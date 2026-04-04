const CACHE_NAME = 'jiff-v23';

const STATIC_ASSETS = [
  '/',
  '/app',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// External origins the SW should NEVER intercept — let browser handle them directly
// This avoids CSP connect-src violations from the SW fetching cross-origin resources
const PASSTHROUGH_ORIGINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.googletagmanager.com',
  'tagmanager.google.com',
  'www.google-analytics.com',
  'analytics.google.com',
  'checkout.razorpay.com',
  'api.razorpay.com',
  'www.youtube.com',
  'i.ytimg.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Let the browser handle external origins directly — don't intercept
  if (PASSTHROUGH_ORIGINS.includes(url.hostname)) return;

  // Never cache API calls — always go to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for same-origin requests with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // Return a proper error response instead of undefined (fixes TypeError)
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
