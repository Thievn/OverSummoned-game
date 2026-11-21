import assert from 'node:assert/strict';
import test from 'node:test';
import { enemyIntent, resolveTurn, startFight } from '../src/combat.js';

test('two attacks finish the cellar rat before it swings on the killing turn', () => {
  let state = startFight('cellar_rat');
  const first = resolveTurn(state, 'attack', 'hunter');
  assert.equal(first.state.enemyHp, 4);
  assert.equal(first.state.playerHp, 11);
  assert.equal(first.state.over, null);
  assert.ok(first.events.includes('enemy-attack'));

  const second = resolveTurn(first.state, 'attack', 'hunter');
  assert.equal(second.state.enemyHp, 0);
  assert.equal(second.state.over, 'win');
  assert.equal(second.events.includes('enemy-attack'), false);
});

test('fire-craft burns the rat down in one exchange', () => {
  const state = startFight('cellar_rat');
  const result = resolveTurn(state, 'know', 'hunter');
  assert.equal(result.state.over, 'win');
  assert.equal(result.state.enemyHp, 0);
  assert.equal(result.state.knowHowUsed, true);
});

test('paperwork denies the incoming hit', () => {
  const state = startFight('ghoul');
  const intent = enemyIntent(state);
  assert.equal(intent.name, 'Wail');
  const result = resolveTurn(state, 'know', 'office_worker');
  assert.equal(result.state.playerHp, state.playerHp);
  assert.equal(result.events.includes('enemy-attack'), false);
  assert.ok(result.events.includes('enemy-stalled'));
});

test('defend spends the bite', () => {
  const state = startFight('cellar_rat');
  const result = resolveTurn(state, 'defend', 'legionary');
  assert.equal(result.state.playerHp, state.playerHp);
  assert.equal(result.state.enemyHp, state.enemyHp);
});

test('know-how is once', () => {
  const state = startFight('ghoul');
  const first = resolveTurn(state, 'know', 'paramedic');
  const second = resolveTurn(first.state, 'know', 'paramedic');
  assert.deepEqual(second.events, []);
  assert.equal(second.state, first.state);
});
