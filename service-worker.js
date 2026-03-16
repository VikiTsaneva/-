const CACHE_NAME = 'parkly-v4';
// ВАЖНО: Кешираме само локални ресурси.
// Опитът да кешираме CDN ресурси в install често проваля инсталацията на SW (CORS/opaque),
// което пък пречи приложението да стане "installable" и beforeinstallprompt да се появи.
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './img/logo.svg',
  './img/icon-192.png',
  './img/icon-512.png',
  './css/style.css',
  './js/script.js'
];

// Инсталиране на service worker
self.addEventListener('install', event => {
  console.log('Service Worker инсталиране...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кеширане на файлове');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Активиране на service worker
self.addEventListener('activate', event => {
  console.log('Service Worker активиране...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Изтриване на стар кеш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Стратегия за кеширане: Cache First, then Network
self.addEventListener('fetch', event => {
  // Пропускаме Firebase и EmailJS заявките (не ги кешираме)
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('emailjs') ||
      event.request.url.includes('googleapis')) {
    event.respondWith(fetch(event.request));
    return;
  }

  const url = new URL(event.request.url);

  // За основните локални assets (JS/CSS) ползваме Network First, за да не "залепват" стари версии.
  const isSameOrigin = url.origin === self.location.origin;
  const isJsOrCss =
    url.pathname.endsWith('/js/script.js') ||
    url.pathname.endsWith('/css/style.css');

  if (isSameOrigin && isJsOrCss) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default: Cache First, then Network
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Синхронизация при възстановяване на връзката
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('Синхронизиране на данни...');
    // Тук може да добавите логика за синхронизация
  }
});
