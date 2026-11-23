import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeRng, heroTotals, hitDamage, defEff, swingTime, simulate, partyFor, luckWeights, coins, canEquip, roomsFor, levelMult, fasterMult, heroOutFx } from '../js/fight.js';
import { GEAR, ERA_SETS, HERO_BASE, EXAMPLE_GEAR } from '../js/gear.js';
import { cases } from '../scripts/parity-cases.mjs';
import { freshState, bibleState, dispatch, fightAt, intervalMs } from '../js/engine.js';

test('the dice are the same sequence every time', () => {
  const a = makeRng(42), b = makeRng(42);
  const xs = Array.from({length: 5}, () => a()), ys = Array.from({length: 5}, () => b());
  assert.deepEqual(xs, ys);
  assert.equal(makeRng(1)(), 48271 / 2147483647);
  const r = makeRng(9); for (let i = 0; i < 200; i++) { const n = r.int(3, 7); assert.ok(n >= 3 && n <= 7); }
});

test('card totals: base times level, plus gear, plus the set', () => {
  assert.equal(levelMult(1), 1); assert.equal(levelMult(5), 1.2);
  const bare = heroTotals('legionary', 5, {});
  assert.deepEqual(bare.total, {atk: 14, def: 18, hp: 192, spd: 9, crit: 5, luck: 1});
  const two = heroTotals('legionary', 5, {head: 'galea_helmet', main: 'rusty_gladius'});
  assert.equal(two.setOn, false); assert.equal(two.setCount, 2);
  assert.equal(two.total.def, 18 + 6 + 3); assert.equal(two.armor, 188); assert.equal(two.lo, 41); assert.equal(two.swing, 1.8);
  const full = heroTotals('legionary', 5, {head: 'galea_helmet', main: 'rusty_gladius', off: 'shield_lost_ninth'});
  assert.equal(full.setOn, true); assert.equal(full.total.def, 18 + 6 + 3 + 14 + 15); assert.equal(full.fx.testudo, 1);
  // the same pieces on someone else do not switch the bonus on
  const other = heroTotals('paramedic', 5, {head: 'galea_helmet', main: 'rusty_gladius', off: 'shield_lost_ninth'});
  assert.equal(other.setOn, false);
  // belt slots never add stats
  assert.deepEqual(heroTotals('legionary', 5, {belt1: 'potion_pink'}).total, bare.total);
});

test('damage, defense and turn time follow the written formulas', () => {
  assert.equal(defEff(10, 1840), 10 + 92);
  assert.equal(swingTime(2, 0), 2); assert.equal(swingTime(2, 100), 1);
  const rng = makeRng(5);
  const a = {lo: 10, hi: 10, atk: 10, crit: 0};
  const d = hitDamage(rng, a, 0, 1);
  assert.ok(d.d >= 19 && d.d <= 21, 'variance stays inside 0.95 to 1.05');
  const big = hitDamage(makeRng(5), a, 100, 1);
  assert.ok(big.d >= 9 && big.d <= 11, 'Defense 100 halves the hit');
  const always = hitDamage(makeRng(5), {lo: 10, hi: 10, atk: 10, crit: 100}, 0, 1);
  assert.equal(always.crit, true, 'Crit Chance is capped at 60, so 100 still crits on a low roll');
  assert.ok(hitDamage(makeRng(5), {lo: 1, hi: 1, atk: 0, crit: 0}, 9999, 1).d >= 1, 'every hit does at least 1');
});

test('rooms scale with the delve length', () => {
  assert.deepEqual([1, 15, 60, 240, 480].map(roomsFor), [1, 3, 5, 8, 12]);
});

test('a fight is deterministic and spends potions from the belt', () => {
  const party = partyFor([{id: 'legionary', level: 3}, {id: 'paramedic', level: 3}], {legionary: {belt1: 'potion_pink'}, paramedic: {belt1: 'eel_stew'}});
  const a = simulate({party, floor: 4, minutes: 60, seed: 77, rules: {heal: 60, retreat: 0}, stock: {potion_pink: 2, eel_stew: 3}});
  const b = simulate({party, floor: 4, minutes: 60, seed: 77, rules: {heal: 60, retreat: 0}, stock: {potion_pink: 2, eel_stew: 3}});
  assert.deepEqual(a, b);
  assert.ok((a.used.potion_pink || 0) <= 2 && (a.used.eel_stew || 0) <= 3);
  assert.ok(a.log.length > 3 && a.log.every(e => typeof e.x === 'string'));
  assert.ok(['won', 'retreat', 'wiped'].includes(a.result));
});

test('better gear wins more fights', () => {
  let bare = 0, geared = 0;
  for (let s = 1; s <= 30; s++) {
    const ids = [{id: 'legionary', level: 6}, {id: 'paramedic', level: 6}, {id: 'engineer', level: 6}];
    bare += simulate({party: partyFor(ids, {}), floor: 6, minutes: 60, seed: s * 101, rules: {heal: 40, retreat: 0}, stock: {}}).cleared;
    geared += simulate({party: partyFor(ids, EXAMPLE_GEAR), floor: 6, minutes: 60, seed: s * 101, rules: {heal: 40, retreat: 0}, stock: {}}).cleared;
  }
  assert.ok(geared > bare, `geared ${geared} should beat bare ${bare}`);
});

test('the browser fight matches the server fight exactly', () => {
  const golden = JSON.parse(readFileSync(new URL('./fight-golden.json', import.meta.url)));
  const all = cases();
  assert.ok(golden.length >= 5);
  for (const g of golden) assert.deepEqual(JSON.parse(JSON.stringify(simulate(all[g.i]))), g.server, 'case ' + g.i);
});

test('luck lifts the rare drops most', () => {
  const rates = {common: 50, uncommon: 25, rare: 14, epic: 7, legendary: 3, absurd: 0.8, unhinged: 0.2};
  const w0 = luckWeights(rates, 0, 1, 0), w = luckWeights(rates, 44, 1, 0);
  assert.equal(w0.rare, 14); assert.equal(w.common, 50);
  assert.ok(Math.abs(w.rare - 14 * 1.44) < 1e-9); assert.ok(Math.abs(w.uncommon - 25 * 1.2) < 1e-9);
  assert.ok(Math.abs(luckWeights(rates, 500, 1, 0).rare - 28) < 1e-9, 'Luck counts up to 100');
  assert.ok(luckWeights(rates, 0, 1, 10).rare > 14, 'night bonus');
});

test('coins and speed bonuses', () => {
  assert.deepEqual(coins(184210), {g: 18, s: 42, c: 10});
  assert.equal(fasterMult(20), 0.8); assert.equal(fasterMult(500), 0.4);
  assert.equal(heroOutFx('engineer', 1, {head: 'brass_goggles'}).mining, 20);
});

test('equip rules: slot, level, two hands, unique', () => {
  assert.equal(canEquip('galea_helmet', 'head', 'legionary', 3, {}), '');
  assert.match(canEquip('galea_helmet', 'chest', 'legionary', 3, {}), /does not go/);
  assert.match(canEquip('second_moon', 'ring1', 'legionary', 3, {}), /level 9/);
  assert.match(canEquip('medic_bag', 'off', 'paramedic', 5, {main: 'violin_case'}), /two-handed/);
  assert.match(canEquip('second_moon', 'ring2', 'gangster', 9, {ring1: 'second_moon'}), /only wear one/);
});

test('every set has three real pieces and every hero has base stats', () => {
  for (const [id, s] of Object.entries(ERA_SETS)) {
    assert.equal(s.items.length, 3, id);
    s.items.forEach(x => { assert.ok(GEAR[x], x); assert.equal(GEAR[x].set, id, x); assert.equal(GEAR[x].hero, id, x); });
    assert.ok(HERO_BASE[id], id);
  }
});

test('equipping in the game moves the item out of the bank and back', () => {
  const s = freshState('Dean');
  s.heroes.legionary = {level: 6, dupes: 0};
  s.bag.galea_helmet = 1;
  const before = s.lifeMax;
  s.party = ['legionary'];
  dispatch(s, {type: 'equip', hero: 'legionary', slot: 'head', item: 'galea_helmet'});
  assert.equal(s.gear.legionary.head, 'galea_helmet'); assert.equal(s.bag.galea_helmet, undefined);
  assert.equal(s.lifeMax, heroTotals('legionary', 6, {head: 'galea_helmet'}).total.hp);
  dispatch(s, {type: 'equip', hero: 'legionary', slot: 'head', item: ''});
  assert.equal(s.bag.galea_helmet, 1); assert.ok(before > 0);
});

test('a delve carries a real fight and pays for what it cleared', () => {
  const s = freshState('Dean');
  s.vigor = 100;
  dispatch(s, {type: 'delve', floor: 1, minutes: 15});
  assert.ok(s.delve.fight && s.delve.fight.log.length > 0);
  const mid = fightAt(s.delve, s.delve.started + (s.delve.ends - s.delve.started) / 2);
  assert.ok(mid.seen.length <= s.delve.fight.log.length);
  s.now = s.delve.ends + 1;
  const r = dispatch(s, {type: 'claim'});
  assert.ok(r.report && r.report.rooms === 3);
});

test('the preview delve log is the real fight, not a fixed script', () => {
  const s = bibleState();
  assert.ok(s.delve.fight.log.length > 5);
  assert.ok(fightAt(s.delve, s.now).seen.length > 0);
  assert.ok(intervalMs(s, 'mining', 'moonsilver') < 3000);
});

test('every era set switches on its own bonus and it changes something real', async () => {
  const { partyFx } = await import('../js/fight.js');
  for (const [id, S] of Object.entries(ERA_SETS)) {
    const g = {}; S.items.forEach(x => { const k = GEAR[x].slot; const slot = (k === 'ring' || k === 'trinket') ? (g[k + '1'] ? k + '2' : k + '1') : k; assert.ok(!g[slot], id + ': two set pieces want the same slot'); g[slot] = x; });
    assert.equal(Object.keys(g).length, 3, id + ' set fits on one hero');
    S.items.forEach(x => assert.ok(GEAR[x].req <= 10, x + ' can be worn by a max-level card'));
    const on = heroTotals(id, 10, g), two = heroTotals(id, 10, Object.fromEntries(Object.entries(g).slice(0, 2)));
    assert.equal(on.setOn, true, id); assert.equal(two.setOn, false, id);
    for (const [k, v] of Object.entries(S.stats || {})) assert.ok(on.total[k] >= v, id + ' adds ' + k);
    const keys = Object.keys(S.fx || {});
    assert.ok(keys.length, id + ' has a bonus effect');
    keys.forEach(k => assert.ok(on.fx[k] > 0, id + ' fx ' + k));
    // The effect must show up somewhere: a fight, a skill timer, hustles or delve time.
    const party = partyFor([{id, level: 10}], {[id]: g}), base = partyFor([{id, level: 10}], {[id]: Object.fromEntries(Object.entries(g).slice(0, 2))});
    let differs = false;
    for (let seed = 1; seed <= 12 && !differs; seed++) {
      const a = simulate({party, floor: 5, minutes: 60, seed, rules: {heal: 40, retreat: 0}, stock: {}});
      const b = simulate({party: base, floor: 5, minutes: 60, seed, rules: {heal: 40, retreat: 0}, stock: {}});
      if (JSON.stringify(a.log) !== JSON.stringify(b.log)) differs = true;
    }
    const fx = partyFx(party);
    if (!differs) differs = (fx.hustle_gold || 0) > 0 || (fx.delve_speed || 0) > 0 || (heroOutFx(id, 10, g).mining || 0) > (heroOutFx(id, 10, {}).mining || 0);
    assert.ok(differs, id + ' set bonus changes the game');
  }
});

test('finds are remembered for Collections', () => {
  const s = freshState('Dean');
  s.vigor = 100;
  dispatch(s, {type: 'delve', floor: 1, minutes: 15});
  s.now = s.delve.ends + 1;
  const r = dispatch(s, {type: 'claim'});
  for (const id of Object.keys(r.report.loot)) assert.ok(s.found.includes(id), id);
});

test('timers in the browser follow the server once it is in charge', () => {
  const s = bibleState();
  s.serverAuth = true;
  s.skills.mining.hero = 'engineer';
  const lv = s.heroes.engineer.level;
  const want = Math.round(3.0 * fasterMult(heroOutFx('engineer', lv, s.gear.engineer).mining) * 1000);
  assert.equal(intervalMs(s, 'mining', 'moonsilver'), Math.max(400, want));
});

test('sigil rite: one sigil per 4 actions, leftovers carry over (same as the server)', async () => {
  const { tick } = await import('../js/engine.js');
  const s = freshState('T'); s.preview = true;
  s.skills.summoning.xp = 9000000; s.active = 'summoning'; s.skills.summoning.node = 'sigil';
  const iv = intervalMs(s, 'summoning', 'sigil');
  const before = s.sigils || 0;
  s.lastTick = 1e12; tick(s, 1e12 + iv * 6 + 5);
  assert.equal((s.sigils || 0) - before + ((s.bag || {}).summon_sigil || 0), 1);
  assert.equal(s.skills.summoning.part, 2);
  tick(s, s.lastTick + iv * 2 + 5);
  assert.equal((s.sigils || 0) - before + ((s.bag || {}).summon_sigil || 0), 2);
});
