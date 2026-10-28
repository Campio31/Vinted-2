/* Fonctionnement hors-ligne : les fichiers de l'appli sont gardés en cache. Change VERSION à chaque mise à jour. */
const VERSION = 'stock-v19';
const FILES = ['./', './index.html', './manifest.webmanifest', './vendor/xlsx.full.min.js', './vendor/supabase.js', './vendor/qrcode.js', './vendor/jsQR.js', './config.js', './fonts/Archivo-latin.woff2', './fonts/Archivo-latin-ext.woff2', './fonts/JetBrainsMono-latin.woff2', './fonts/JetBrainsMono-latin-ext.woff2', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

/* Une nouvelle version attend que l'utilisateur touche « Mettre à jour » dans l'appli (message SKIP_WAITING). */
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;
  if (fonts) {
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => {
      if (r.ok) caches.open(VERSION).then(c => c.put(req, r.clone()));
      return r;
    }).catch(() => hit || caches.match('./index.html'));
    return hit || net;
  }));
});

