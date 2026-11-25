// OverSummoned app shell. Pages and code come from the network first (so updates show at once) and
// fall back to the last copy when offline; pictures are kept, since their links carry a version.
const V = 'os-1125w';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(['/offline', '/css/os.css', '/assets/fonts/LilitaOne.ttf', '/assets/fonts/Nunito.ttf']).catch(() => { }))); });
self.addEventListener('activate', e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== V) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  const keep = async res => { if (res && res.ok) { const c = await caches.open(V); c.put(r, res.clone()); } return res; };
  if (u.pathname.startsWith('/assets/')) { e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(keep))); return; }
  e.respondWith(fetch(r).then(keep).catch(async () => (await caches.match(r)) || (r.mode === 'navigate' ? caches.match('/offline') : Response.error())));
});
