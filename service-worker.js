const CACHE_NAME = 'zyvola-static-v1';
const OFFLINE_PAGE = '/offline.html';
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/calculator.html',
    '/calculadoras/',
    '/calculadoras/index.html',
    '/app.js',
    '/styles.css',
    '/manifest.json',
    '/cookie-consent.js',
    '/logo.png',
    '/assets/zyvola-logo.png',
    OFFLINE_PAGE,
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(PRECACHE_URLS);
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const requestUrl = new URL(event.request.url);
    const isSameOrigin = requestUrl.origin === self.location.origin;

    if (!isSameOrigin) return;

    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(event.request);
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            } catch (error) {
                const cached = await caches.match(event.request);
                if (cached) return cached;
                const offline = await caches.match(OFFLINE_PAGE);
                return offline || new Response('Offline', { status: 503 });
            }
        })());
        return;
    }

    event.respondWith((async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        try {
            const response = await fetch(event.request);
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, response.clone());
            return response;
        } catch (error) {
            return new Response('', { status: 504 });
        }
    })());
});
