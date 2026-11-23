import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
    'assets/gen/sks/floor_mine.png', 'assets/gen/sks/floor_wood.png', 'assets/gen/sks/floor_fish.png',
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


test('mining and woodcutting can lay out a floor without a missing width', () => {
  const src = readFileSync('js/skillscene.js', 'utf8');
  const i = src.indexOf('const bgW = Math.round(lay.dw)');
  const j = src.indexOf('floorEl.style.backgroundSize');
  assert.ok(i >= 0 && j > i, 'floor width is declared before it is used');
  assert.doesNotMatch(src, /backgroundSize = '100% 100%'/);
  assert.match(src, /fitScale/);
});

test('a skill with no picked spot falls back to the first vein or grove', () => {
  const src = readFileSync('js/skillscene.js', 'utf8');
  assert.match(src, /mining:\s*'copper'/);
  assert.match(src, /woodcutting:\s*'ash'/);
  assert.match(src, /opts\.node \|\| FIRST/);
});

test('tree art has a transparent background', () => {
  const out = execFileSync('python3', ['-c',
    'from PIL import Image\n' +
    'for n in ["ash","ironbark","moonwood","emberroot","voidtrunk"]:\n' +
    '    im=Image.open("assets/gen/sks/tree_"+n+".png").convert("RGBA")\n' +
    '    a=im.split()[-1]\n' +
    '    pix=list(a.getdata())\n' +
    '    trans=sum(1 for v in pix if v==0)\n' +
    '    opaque=sum(1 for v in pix if v>10)\n' +
    '    assert trans>1000 and opaque>1000, n\n' +
    'print("ok")\n'
  ], {encoding: 'utf8'});
  assert.match(out, /ok/);
});

test('fishing has a shore for the hero to walk on', () => {
  assert.ok(existsSync('assets/gen/sks/floor_fish.png'));
  assert.match(readFileSync('js/skillscene.js', 'utf8'), /floor_fish/);
});

test('the forge armor stand stands to the side of the walking lane', () => {
  const src = readFileSync('js/skillscene.js', 'utf8');
  const m = src.match(/smith_armor\.png',\s*at:60,\s*x:([0-9.]+)/);
  assert.ok(m, 'armor placement is in the scene');
  assert.ok(Number(m[1]) >= 0.68, 'armor is on the right, out of the mid-floor lane');
});

test('props are looked up by skill, so a forge iron bar is not a mining rock', () => {
  const src = readFileSync('js/skillscene.js', 'utf8');
  assert.match(src, /mining:\s*\{/);
  assert.match(src, /woodcutting:\s*\{/);
  assert.match(src, /\(PROP\[sk\]\s*\|\|\s*\{\}\)\[id\]/);
  const smith = src.slice(src.indexOf('smithing: [') , src.indexOf('alchemy: ['));
  assert.doesNotMatch(smith, /rock_iron/);
});

test('hero size comes from the screen width, not the art', () => {
  const art = readFileSync('js/art.js', 'utf8');
  const scene = readFileSync('js/skillscene.js', 'utf8');
  const life = readFileSync('js/life.js', 'utf8');
  assert.match(art, /export function heroScale/);
  assert.match(art, /width >= 500 \? 2 : 1/);
  assert.match(scene, /k = heroScale\(W\)/);
  assert.match(life, /k = heroScale\(W\)/);
  assert.doesNotMatch(scene, /Math\.round\(lay\.s\)/);
});

test('rooms fill the box with a uniform cover scale, never a top letterbox', () => {
  const src = readFileSync('js/skillscene.js', 'utf8');
  const i = src.indexOf('function fitScale');
  const block = src.slice(i, i + 280);
  assert.match(block, /Math\.max\(W \/ rw, H \/ rh\)/);
  assert.doesNotMatch(block, /barH/);
  assert.match(src, /oy = H - dh/);
});

test('floor props and the hero share one walkable floor line', () => {
  const src = readFileSync('js/skillscene.js', 'utf8');
  assert.match(src, /ground:\s*true/);
  assert.match(src, /function footBottom/);
  assert.match(src, /FOOT_GAP/);
  assert.match(src, /art\.walk \|\| art\.floor/);
  const life = readFileSync('js/life.js', 'utf8');
  assert.match(life, /19 \* scale - FOOT_GAP \* k/);
});

test('tree and sawmill art is a cut-out, not a boxed crop', () => {
  const out = execFileSync('python3', ['-c', `
from PIL import Image
def check(path, min_trans=200):
    im=Image.open(path).convert("RGBA")
    a=im.split()[-1]; w,h=im.size
    pix=list(a.getdata())
    trans=sum(1 for v in pix if v<8)
    opaque=sum(1 for v in pix if v>10)
    assert trans>min_trans and opaque>400, path+" alpha"
    def frac(y0,y1):
        n=op=0
        for y in range(y0,y1):
            for x in range(w):
                n+=1
                if a.getpixel((x,y))>10: op+=1
        return op/max(n,1)
    top=frac(0,min(3,h)); bot=frac(max(0,h-3),h)
    assert top<=0.72, path+" flat top "+str(top)
    assert bot<=0.90, path+" full-width base "+str(bot)
for n in ["ash","ironbark","moonwood","emberroot","voidtrunk"]:
    check("assets/gen/sks/tree_"+n+".png")
check("assets/gen/sks/prop_sawmill.png")
print("ok")
`], {encoding: 'utf8'});
  assert.match(out, /ok/);
});

test('every fishing lake uses the same backdrop height', () => {
  const out = execFileSync('python3', ['-c', `
from PIL import Image
for n in ["eel","lantern","ashpond","deep"]:
    im=Image.open("assets/gen/sks/fishing_"+n+".png")
    assert im.size==(384,160), n+str(im.size)
print("ok")
`], {encoding: 'utf8'});
  assert.match(out, /ok/);
});
