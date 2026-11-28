// OverSummoned app shell. Pages and code come from the network first (so updates show at once) and
// fall back to the last copy when offline; pictures with a version in their link are kept.
const V = 'os-1127r';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(['/offline', '/css/os.css', '/assets/fonts/LilitaOne.ttf', '/assets/fonts/Nunito.ttf']).catch(() => { }))); });
self.addEventListener('activate', e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== V) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  const keep = async res => { if (res && res.ok) { const c = await caches.open(V); c.put(r, res.clone()); } return res; };
  // A picture whose link carries a version (?v=) never changes, so the kept copy is used. One without a version
  // (the hero and place pages link pictures plainly) is checked with the server every time, so redrawn art shows at once.
  if (u.pathname.startsWith('/assets/')) {
    if (u.searchParams.has('v')) e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(keep)));
    else e.respondWith(fetch(r, { cache: 'no-cache' }).then(keep).catch(async () => (await caches.match(r)) || Response.error()));
    return;
  }
  e.respondWith(fetch(r).then(keep).catch(async () => (await caches.match(r)) || (r.mode === 'navigate' ? caches.match('/offline') : Response.error())));
});
// A tap on a system alert brings the game forward (or opens it).
self.addEventListener('notificationclick', e => { e.notification.close(); const url = (e.notification.data && e.notification.data.url) || '/play';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { const c = cs.find(x => new URL(x.url).pathname.startsWith('/play')); return c ? c.focus() : self.clients.openWindow(url); })); });
