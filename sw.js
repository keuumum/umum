// Service worker: aplikasi bisa dibuka cepat & tetap tampil walau sinyal lemah.
// File aplikasi: ambil dari jaringan dulu (selalu versi terbaru), cadangan dari cache bila offline.
// Naikkan V setiap kali mengubah file aplikasi agar HP menawarkan "Perbarui".
const V = 'umum-app-1.0-11251900';
const SHELL = ['./', './index.html', './app.js', './api.js', './demo.js', './app.css', './config.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './header.jpg'];

self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
  }
});
