/* Cambiar esta versión cada vez que se modifiquen recursos publicados. */
const CACHE_NAME = 'fuerza75-static-v4';
const CORE = [
  './', './index.html', './app.js', './styles.css', './manifest.webmanifest',
  './icon-192.png', './icon-1024.png', './apple-touch-icon.png'
];
const CACHEABLE = new Set(CORE.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('fuerza75-static-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
    return;
  }
  if (CACHEABLE.has(url.href)) event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request)));
});
