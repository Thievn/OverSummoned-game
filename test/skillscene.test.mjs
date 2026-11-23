import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { NODES, ITEMS } from '../js/catalog.js';

const life = readFileSync('js/life.js', 'utf8');
const scene = readFileSync('js/skillscene.js', 'utf8');
const ui = readFileSync('js/ui.js', 'utf8');

test('city street is one looping panorama, no scene swap or sine pan', () => {
  assert.match(life, /panorama\.png/);
  assert.match(life, /Math\.round\(cam\)/);
  assert.doesNotMatch(life, /SWAP_MS|FADE_MS|Math\.sin/);
});

test('skill scene mounts from the skill view and snaps to whole pixels', () => {
  assert.match(ui, /data-sks/);
  assert.match(scene, /Math\.round/);
  assert.match(readFileSync('js/play.js', 'utf8'), /mountSkillScene/);
});

test('fishing spots keep their ids and yield their own fish', () => {
  const f = Object.fromEntries(NODES.fishing.map(n => [n.id, n]));
  assert.equal(f.eel.item, 'raw_eel');
  assert.equal(f.lantern.item, 'ash_perch');
  assert.equal(f.ashpond.item, 'moon_trout');
  assert.equal(f.deep.item, 'deep_pike');
  assert.equal(f.lantern.name, 'Ash pond');
  assert.equal(f.ashpond.name, 'Moonlit lake');
  for (const id of ['ash_perch', 'moon_trout', 'deep_pike', 'perch_supper', 'moon_bake', 'pike_feast']) {
    assert.ok(ITEMS[id], id);
    assert.ok(existsSync('assets/gen/' + ITEMS[id].icon + '.png'), id + ' icon');
  }
  const c = Object.fromEntries(NODES.cooking.map(n => [n.id, n]));
  assert.equal(c.perch.item, 'perch_supper');
  assert.equal(c.moonbake.item, 'moon_bake');
  assert.equal(c.pike.item, 'pike_feast');
  assert.ok(c.stew && c.feast && c.broth);
});

test('workshops gain furniture every ten levels', () => {
  for (const sk of ['cooking', 'smithing', 'alchemy']) {
    const ats = [...scene.matchAll(new RegExp(`src:'/assets/gen/sks/[^']+', at:(\\d+)`, 'g'))]
      .map(m => +m[1]);
    // per-skill blocks each have 10,20,...,90
  }
  for (const at of [10, 20, 30, 40, 50, 60, 70, 80, 90]) {
    const n = [...scene.matchAll(new RegExp(`at:${at}\\b`, 'g'))].length;
    assert.ok(n >= 3, 'furniture at ' + at + ' for each workshop, got ' + n);
  }
});

test('trees, rocks, lakes and floors are in the pack', () => {
  const files = [
    'assets/city/panorama.png',
    'assets/walk/will_slapton.png',
    'assets/gen/sks/bg_mine.png', 'assets/gen/sks/bg_wood.png',
    'assets/gen/sks/floor_mine.png', 'assets/gen/sks/floor_wood.png',
    'assets/gen/sks/tree_ash.png', 'assets/gen/sks/tree_ironbark.png',
    'assets/gen/sks/tree_moonwood.png', 'assets/gen/sks/tree_emberroot.png',
    'assets/gen/sks/tree_voidtrunk.png',
    'assets/gen/rock_iron.png', 'assets/gen/rock_star.png',
    'assets/gen/sks/crit.png',
    'assets/gen/sks/fishing_eel.png', 'assets/gen/sks/fishing_lantern.png',
    'assets/gen/sks/fishing_ashpond.png', 'assets/gen/sks/fishing_deep.png',
    'assets/gen/sks/cook_pantry.png', 'assets/gen/sks/smith_armor.png',
    'assets/gen/sks/alch_books.png'
  ];
  for (const f of files) assert.ok(existsSync(f), f);
});

test('rarity rule for new cards is written down', () => {
  const md = readFileSync('docs/art-rarity.md', 'utf8');
  assert.match(md, /2–4/);
  assert.match(md, /12–20/);
  assert.match(md, /new cards only|Existing heroes/i);
  assert.match(md, /fronts stay still/i);
});
