// Installable app: manifest, icons, screenshots, service worker rules and page wiring.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const R = new URL('..', import.meta.url).pathname;
const man = JSON.parse(readFileSync(R + 'site.webmanifest', 'utf8'));
const sw = readFileSync(R + 'sw.js', 'utf8');
function pngSize(f) { const b = readFileSync(R + f.replace(/^\//, '')); return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`; }

test('manifest opens the game full screen with real icons and screenshots', () => {
  assert.equal(man.start_url, '/play'); assert.equal(man.id, '/play'); assert.equal(man.scope, '/'); assert.equal(man.display, 'standalone');
  assert.equal(man.name, 'OverSummoned');
  const mask = man.icons.filter(i => i.purpose === 'maskable');
  assert.ok(mask.some(i => i.sizes === '512x512') && mask.some(i => i.sizes === '192x192'));
  for (const i of [...man.icons, ...man.screenshots]) { assert.ok(existsSync(R + i.src.slice(1)), i.src); assert.equal(pngSize(i.src), i.sizes, i.src); }
  assert.ok(man.screenshots.some(s => s.form_factor === 'narrow') && man.screenshots.some(s => s.form_factor === 'wide'));
});

test('service worker version follows the update log', () => {
  const v = JSON.parse(readFileSync(R + 'updates.json', 'utf8')).entries[0].v;
  assert.ok(sw.includes(`const VERSION = '${v}';`));
});

test('service worker never stores sign-in, server or update answers', () => {
  assert.match(sw, /req\.method !== 'GET' \|\| req\.headers\.has\('Authorization'\)\) return;/);
  assert.match(sw, /url\.origin !== self\.location\.origin\) \{\n\s+if \(url\.href === LIB\)/);
  assert.ok(/SKIP = \/\^\\\/\(updates\\\.json\|ledger\|gm\|api/.test(sw), 'skip list');
  assert.ok(!/supabase\.co/.test(sw), 'no game server URLs in the worker');
  assert.match(sw, /no-store\|private/);
  for (const f of sw.match(/'\/(css|js|assets)\/[^']+'/g)) assert.ok(existsSync(R + f.slice(2, -1)), 'precache file ' + f);
});

test('every page wires the app in, and the offline page stays out of search', () => {
  for (const f of ['index.html', 'story.html', 'privacy.html', 'terms.html', 'updates.html', 'play.html']) {
    const s = readFileSync(R + f, 'utf8');
    assert.ok(s.includes('/js/pwa.js') && s.includes('/css/pwa.css') && s.includes('rel="manifest"'), f);
  }
  assert.ok(readFileSync(R + 'play.html', 'utf8').includes('<script src="/js/splash.js"></script>'));
  const off = readFileSync(R + 'offline.html', 'utf8');
  assert.ok(off.includes('noindex') && !readFileSync(R + 'sitemap.xml', 'utf8').includes('/offline'));
  const v = JSON.parse(readFileSync(R + 'vercel.json', 'utf8'));
  assert.ok(v.headers.some(h => h.source === '/sw.js' && h.headers.some(x => x.key === 'Cache-Control' && /no-cache/.test(x.value))));
  assert.ok(readFileSync(R + '.vercelignore', 'utf8').split('\n').includes('docs'));
});
