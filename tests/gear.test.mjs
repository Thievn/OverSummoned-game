import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { combineGear, overstatRows } from '../src/gear.js';
import loadouts, { SLOT_FAMILY } from '../src/loadouts.js';

const cards = JSON.parse(readFileSync(new URL('../public/assets/oversummoned/cards.json', import.meta.url)));
const items = JSON.parse(readFileSync(new URL('../public/assets/oversummoned/items.json', import.meta.url)));
const byId = Object.fromEntries(items.map((item) => [item.id, item]));

function equipped(cardId) {
  return Object.entries(loadouts[cardId])
    .filter(([slot]) => slot !== 'belt')
    .map(([, id]) => (id ? byId[id] : null))
    .filter(Boolean);
}

test('a legionary in a hi-vis vest and a shield adds the gear up', () => {
  const card = cards.find((entry) => entry.id === 'legionary');
  const gear = combineGear(equipped('legionary'));
  const rows = Object.fromEntries(overstatRows(card, gear).map((row) => [row.key, row]));
  assert.equal(rows.guard.gear, 23);
  assert.equal(rows.guard.total, 38);
  assert.equal(rows.might.gear, 11);
  assert.equal(rows.might.total, 23);
  assert.equal(rows.knack.gear, 4);
  assert.equal(rows.knack.total, 12);
});

test('every launch card has a loadout and items sit in their own slots', () => {
  assert.deepEqual(
    Object.keys(loadouts).sort(),
    cards.map((card) => card.id).sort(),
  );
  const seen = new Set();
  for (const [cardId, loadout] of Object.entries(loadouts)) {
    assert.equal(loadout.belt.length, 4);
    for (const [slot, id] of Object.entries(loadout)) {
      if (slot === 'belt') {
        for (const beltId of id) assert.equal(beltId, null);
        continue;
      }
      assert.ok(slot in SLOT_FAMILY, slot);
      if (!id) continue;
      const item = byId[id];
      assert.ok(item, `${cardId} ${id}`);
      assert.equal(item.slot, SLOT_FAMILY[slot], `${cardId} ${slot} ${item.name}`);
      seen.add(id);
    }
  }
  assert.equal(seen.size, items.length);
});
