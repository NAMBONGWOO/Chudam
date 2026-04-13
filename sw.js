// ── Service Worker for 추담공원 PWA ──────────────
const CACHE_NAME = 'choodam-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/firebase-config.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/matching.js',
  '/js/tree.js',
  '/js/app.js',
  '/manifest.json'
];

// 설치: 정적 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 오래된 캐시 제거
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: 캐시 우선, 네트워크 폴백
self.addEventListener('fetch', event => {
  // Firebase API 요청은 캐시하지 않음
  if (event.request.url.includes('firestore') || event.request.url.includes('firebase')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
