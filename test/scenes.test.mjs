import test from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
test('every skill has its own scene art', () => {
  const scene = readFileSync('js/skillscene.js', 'utf8');
  const ui = readFileSync('js/ui.js', 'utf8');
  assert.ok(ui.includes('data-sks'), 'skill view hosts a walking scene');
  assert.ok(scene.includes("scene_' + sk"), 'the scene picks art by skill');
  assert.ok(scene.includes('FISH_BG'), 'lakes are picked by fishing spot');
  for (const k of ['woodcutting','fishing','cooking','smithing','alchemy','summoning']) assert.ok(existsSync(`assets/gen/scene_${k}.png`), k);
  assert.ok(existsSync('assets/gen/mine_bg.png'));
});
