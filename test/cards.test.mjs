// Card faces: the front is a still picture, gear icons on the back never move by themselves,
// the back art is not dimmed, and only the visible face takes clicks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const R = new URL('..', import.meta.url).pathname;
const css = readFileSync(R + 'css/cards3d.css', 'utf8') + readFileSync(R + 'css/mocks.css', 'utf8');

test('front portraits are still images', () => {
  for (const f of readdirSync(R + 'assets/portrait').filter(f => f.endsWith('.png'))) {
    const b = readFileSync(R + 'assets/portrait/' + f);
    assert.ok(!b.subarray(0, 8192).includes(Buffer.from('acTL')), f + ' is animated');
  }
  assert.match(css, /\.face\.card,\.face\.card \*\{animation:none!important\}/);
});

test('gear icons on the card back have no idle motion', () => {
  assert.ok(!/@keyframes (shine|pulse|hue|drop|found)\b/.test(css), 'old idle keyframes are gone');
  assert.ok(!/\.gs[^{]*\{[^}]*animation:(?!none)/.test(css), 'no animation on gear sockets');
  assert.ok(!/cubic-bezier\(\.3,1\.6,\.5,1\)/.test(css), 'no bounce on the gear stagger');
  assert.match(css, /\.gs,\.gs img,\.gs::before,\.gs::after,\.ls,\.ls \.sock,\.ls img\{animation:none!important\}/);
});

test('card back art is bright and the visible face takes the clicks', () => {
  assert.ok(!/brightness\(\.5\)/.test(css), 'no half-brightness dim on the back');
  assert.match(css, /\.flip3d\.flipped \.f3>\.face\.front,\.flip3d:not\(\.flipped\) \.f3>\.face\.back\{pointer-events:none\}/);
  assert.match(css, /\.flip3d\.flipped \.tilt\{transform:none!important\}/);
});
