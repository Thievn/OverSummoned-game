import test from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
test('every skill has its own scene art', () => {
  const ui = readFileSync('js/ui.js', 'utf8');
  assert.ok(ui.includes("'scene_' + id"), 'skill view picks a scene per skill');
  for (const k of ['woodcutting','fishing','cooking','smithing','alchemy','summoning']) assert.ok(existsSync(`assets/gen/scene_${k}.png`), k);
  assert.ok(existsSync('assets/gen/mine_bg.png'));
});
