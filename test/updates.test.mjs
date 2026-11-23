// The update log: well formed, newest first, game-only words, and linked from every public page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const R = new URL('..', import.meta.url).pathname;
const data = JSON.parse(readFileSync(R + 'updates.json', 'utf8'));

test('update log entries are complete, unique and newest first', () => {
  assert.ok(data.entries.length >= 1);
  const vs = new Set();
  let prev = null;
  for (const e of data.entries) {
    assert.match(e.v, /^\d{4}\.\d{2}\.\d{2}\.\d+$/); assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(e.v.startsWith(e.date.replaceAll('-', '.')), e.v + ' matches its date');
    assert.ok(!vs.has(e.v)); vs.add(e.v);
    assert.ok(e.title && e.items.length >= 1 && e.items.length <= 5);
    if (prev) assert.ok(prev.localeCompare(e.v, undefined, {numeric: true}) > 0, 'newest first at ' + e.v);
    prev = e.v;
  }
});

test('update log words stay in the game', () => {
  const text = JSON.stringify(data.entries);
  const banned = /\b(dean|admin|owner|poppy|server|database|backend|supabase|api|security|secure|hack|exploit|money|payment|price ?change|bug|deploy|migration|code|patch|sql)\b/i;
  assert.ok(!banned.test(text), 'found: ' + (text.match(banned) || [])[0]);
  assert.ok(!/Oversummoned|Over Summoned|OVERSUMMONED/.test(text), 'spell it OverSummoned');
  for (const e of data.entries) for (const i of e.items) assert.ok(i.length <= 160 && /[.!]$/.test(i), 'short full sentence: ' + i);
});

test('the update log page is built from the file, indexable, in the sitemap and in every footer', () => {
  const page = readFileSync(R + 'updates.html', 'utf8');
  for (const e of data.entries) assert.ok(page.includes(`id="v${e.v}"`), 'page has ' + e.v);
  assert.ok(page.includes('content="index,follow'));
  assert.ok(readFileSync(R + 'sitemap.xml', 'utf8').includes('https://oversummoned.com/updates'));
  for (const f of ['index.html', 'story.html', 'privacy.html', 'terms.html', 'updates.html']) {
    const s = readFileSync(R + f, 'utf8');
    assert.ok(s.includes('<a href="/updates">Update log</a>'), f + ' footer');
    assert.ok(s.includes('/js/updates.js'), f + ' loads the update bar');
    assert.ok(s.includes('G-R4C4V95HD5') && s.includes('GTM-NN244PNK'), f + ' keeps analytics');
  }
  assert.ok(readFileSync(R + 'play.html', 'utf8').includes('/js/updates.js'));
});

test('signed-in players can read the update log', () => {
  const pub = readFileSync(R + 'js/public.js', 'utf8');
  assert.match(pub, /path === '\/updates'/);
  // A signed-in visit to /updates must not bounce into the game.
  const admit = pub.slice(pub.indexOf('function admit'), pub.indexOf('function admit') + 700);
  assert.match(admit, /if \(path === '\/updates'\) return/);
});
