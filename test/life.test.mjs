import test from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';

const life = readFileSync('js/life.js', 'utf8');

test('the city banner uses one joined street that scrolls evenly', () => {
  assert.ok(existsSync('assets/city/panorama.png'), 'joined street art is in the repo');
  assert.ok(life.includes('/assets/city/panorama.png'));
  assert.ok(life.includes('PAN_W'), 'native street width is set');
  assert.ok(!life.includes('SWAP_MS'), 'streets no longer take turns fading in');
  assert.ok(!life.includes('FADE_MS'));
  assert.ok(!life.includes('Math.sin'), 'the street no longer sways');
});

test('walkers snap to whole pixels and do not turn around at the edges', () => {
  assert.ok(life.includes('Math.round(cam') || life.includes('camPx = Math.round'));
  assert.ok(life.includes('Math.round(sx'));
  // Old bounce: hitting the left or right edge flipped dir.
  assert.ok(!life.includes('w.dir = 1; }') || !/if \(w\.x < left\) \{[^}]*w\.dir = 1/.test(life));
  assert.ok(!life.includes('w.x = W - edge; w.dir = -1'));
  assert.ok(!life.includes('else w.dir = -w.dir'));
});

test('after a chat, each hero keeps the way they were already going', () => {
  assert.ok(life.includes('holdDir'));
  assert.ok(life.includes('a.dir = a.holdDir'));
});
