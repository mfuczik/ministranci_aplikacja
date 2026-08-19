// Service Worker — cache'uje aplikację, żeby otwierała się i działała bez internetu.
// Po zmianie index.html podbij CACHE_NAME (np. na 'v2'), żeby przeglądarka pobrała świeżą wersję.
const CACHE_NAME = 'ministranci-cache-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Dodajemy zasoby pojedynczo — jeśli jeden się nie uda (np. brak sieci przy instalacji),
      // reszta i tak zostanie zapisana, zamiast całej instalacji się wywalać.
      await Promise.all(APP_SHELL.map(url => cache.add(url).catch(() => {})));
      // Czcionka z ikonami (CDN) — najlepszy wysiłek; offline i tak zadziała, tylko bez ikonek.
      const iconsCdn = 'https://cdnjs.cloudflare.com/ajax/libs/tabler-icons/3.19.0/fonts/tabler-icons.min.css';
      await cache.add(iconsCdn).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
        }
        return res;
      }).catch(() => {
        // Brak sieci i nic w cache — dla nawigacji pokaż przynajmniej index.html
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
