const CACHE = 'lottoai-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))) 
    .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      // Runtime cache for same-origin GETs
      try {
        const url = new URL(req.url);
        if (req.method === 'GET' && url.origin === location.origin) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
      } catch {}
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
