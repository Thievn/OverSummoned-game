// OverSummoned service worker. Keeps a small offline shell so the app opens without a signal,
// and never stores sign-in, account or game-server answers: only same-site pages, styles,
// scripts and art, plus the one pinned client library from jsDelivr.
// VERSION is stamped by scripts/build-updates.mjs from the newest updates.json entry.
const VERSION = '2026.11.23.6';
const SHELL = 'os-shell-' + VERSION;
const ART = 'os-art-v1';
const ART_MAX = 400;
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/dist/umd/supabase.min.js';

// Pages kept for offline reading. /play itself needs the game server, so offline it gets /offline.
const PAGES = ['/', '/story', '/updates', '/privacy', '/terms'];
const PRECACHE = PAGES.concat([
  '/offline', '/site.webmanifest', '/favicon.ico', '/favicon_32.png', '/icon-192.png', '/icon-512.png',
  '/assets/logo.svg', '/assets/pwa/maskable-192.png',
  '/css/mocks.css', '/css/game.css', '/css/cards3d.css', '/css/collect.css', '/css/updates.css', '/css/land.css',
  '/css/home.css', '/css/story.css', '/css/faq.css', '/css/pwa.css',
  '/js/analytics.js', '/js/updates.js', '/js/pwa.js', '/js/splash.js', '/js/public.js', '/js/home.js',
  '/js/play.js', '/js/catalog.js', '/js/art.js', '/js/engine.js', '/js/ui.js', '/js/gearui.js', '/js/gear.js', '/js/fight.js', '/js/life.js', '/js/banter-preview.js',
  LIB
]);

// Never touched by the worker, not even read from cache.
const SKIP = /^\/(updates\.json|ledger|gm|api\/|auth|sw\.js|\.well-known\/)/;

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(SHELL).then((c) => Promise.all(PRECACHE.map((u) =>
    fetch(new Request(u, {cache: 'reload', mode: u === LIB ? 'cors' : 'same-origin', credentials: 'omit'}))
      .then((r) => (keep(r) ? c.put(u, r) : null)).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('os-shell-') && k !== SHELL).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', (ev) => { if (ev.data && ev.data.type === 'skip') self.skipWaiting(); });

function keep(r) {
  if (!r || !r.ok || r.status !== 200 || r.redirected) return false;
  if (r.type !== 'basic' && r.type !== 'cors') return false;
  const cc = r.headers.get('Cache-Control') || '';
  return !/no-store|private/i.test(cc);
}

function pageKey(url) {
  let p = url.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
  return p === '' ? '/' : p;
}

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

async function page(req, url) {
  const key = pageKey(url);
  try {
    const r = await fetch(req);
    if (keep(r) && PAGES.includes(key) && !url.search) {
      const copy = r.clone();
      caches.open(SHELL).then((c) => c.put(key, copy));
    }
    return r;
  } catch (e) {
    const c = await caches.open(SHELL);
    return (PAGES.includes(key) && (await c.match(key))) || (await c.match('/offline')) ||
      new Response('You are offline.', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
  }
}

// Code and styles: always the newest from the network, the stored copy only when offline,
// so a new version never runs half old and half new.
async function fresh(req, url) {
  try {
    const r = await fetch(req);
    if (keep(r)) { const copy = r.clone(); caches.open(SHELL).then((c) => c.put(url.pathname, copy)); }
    return r;
  } catch (e) {
    const hit = await caches.match(url.pathname, {cacheName: SHELL});
    if (hit) return hit;
    throw e;
  }
}

// Art: show the stored copy at once and refresh it in the background.
async function art(req, url, ev) {
  const c = await caches.open(ART);
  const hit = await c.match(url.pathname + url.search);
  const net = fetch(req).then((r) => {
    if (keep(r)) { c.put(url.pathname + url.search, r.clone()); trim(ART, ART_MAX); }
    return r;
  }).catch(() => null);
  if (hit) { ev.waitUntil(net); return hit; }
  return (await net) || (await caches.match(url.pathname, {cacheName: SHELL})) || Response.error();
}

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET' || req.headers.has('Authorization')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    if (url.href === LIB) ev.respondWith(caches.match(LIB, {cacheName: SHELL}).then((hit) => hit || fetch(req)));
    return; // game server, sign-in, analytics and fonts go straight to the network
  }
  if (SKIP.test(url.pathname)) return;
  if (req.mode === 'navigate') { ev.respondWith(page(req, url)); return; }
  if (/^\/(css|js)\//.test(url.pathname) || url.pathname === '/site.webmanifest') { ev.respondWith(fresh(req, url)); return; }
  if (/^\/(assets|card_backs)\//.test(url.pathname) || /\.(png|svg|webp|jpg|ico|gif)$/.test(url.pathname)) { ev.respondWith(art(req, url, ev)); return; }
});
