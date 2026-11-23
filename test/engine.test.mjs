import test from 'node:test';
import assert from 'node:assert/strict';
import { bibleState, freshState, dispatch, tick, feedIsClean, welcomeIsClean } from '../js/engine.js';
import { DELVE_LENGTHS, mentionsHero } from '../js/catalog.js';

test('delve lengths are real walks, not a test label', () => {
  assert.deepEqual(DELVE_LENGTHS.map(d => d.m), [1, 15, 60, 240, 480]);
  assert.equal(DELVE_LENGTHS.some(d => /test/i.test(d.label)), false);
});

test('bible crier and welcome do not announce a hero find', () => {
  const s = bibleState();
  assert.equal(feedIsClean(s.crier), true);
  assert.equal(welcomeIsClean(s.welcome), true);
  assert.equal(s.welcome.lines.some(l => /new card/i.test(l.text)), false);
  assert.equal(s.crier.some(c => /pulled|unhinged card|slapton/i.test(c.msg)), false);
});

test('a hero grant stays off the paper', () => {
  const s = freshState('Dean');
  const before = s.crier.length;
  const r = dispatch(s, {type:'grant', hero:'will_slapton'});
  assert.equal(r.hero.id, 'will_slapton');
  assert.equal(s.crier.length, before);
  assert.equal(feedIsClean(s.crier), true);
  assert.equal(s.pool.includes('item_red_carpet_tux'), true);
});

test('crier refuses a hero announcement', () => {
  const s = freshState('Dean');
  const n = s.crier.length;
  dispatch(s, {type:'crier', tag:'Streets', msg:'Dean pulled Will Slapton'});
  assert.equal(s.crier.length, n);
});

test('mining grants ore and caps a long absence', () => {
  const s = freshState('Dean');
  s.skills.mining.hero = 'engineer';
  dispatch(s, {type:'skill', skill:'mining', node:'copper'});
  const start = s.bag.copper_ore || 0;
  tick(s, s.now + 60 * 1000);
  assert.ok((s.bag.copper_ore || 0) > start);
  const mid = s.bag.copper_ore;
  tick(s, s.now + 48 * 3600 * 1000);
  const gained = s.bag.copper_ore - mid;
  assert.ok(gained < 24 * 3600 / 2 + 5);
});

test('hustle can jail and does not name a find', () => {
  const s = freshState('Dean');
  s.daring = 25;
  s.seed = 1;
  dispatch(s, {type:'hustle', id:'pockets'});
  assert.ok(s.gold >= 250);
  assert.equal(feedIsClean(s.crier), true);
  assert.equal(mentionsHero('A party came up with a heavy pack'), false);
});

test('one minute delve is accepted', () => {
  const s = freshState('Dean');
  s.vigor = 100;
  const r = dispatch(s, {type:'delve', floor:1, minutes:1});
  assert.equal(r.toast, 'Down they go.');
  assert.equal(s.delve.minutes, 1);
});
