import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { checkSlop } from '../src/slopFilter.js';
import * as copy from '../src/copy.js';

const cards = JSON.parse(readFileSync(new URL('../public/assets/oversummoned/cards.json', import.meta.url)));
const items = JSON.parse(readFileSync(new URL('../public/assets/oversummoned/items.json', import.meta.url)));

function walk(value, out) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const entry of value) walk(entry, out);
  else if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) walk(entry, out);
  }
}

test('site copy passes the slop filter', () => {
  const strings = [];
  walk(copy, strings);
  for (const card of cards) {
    walk(
      {
        name: card.name,
        title: card.title,
        rarity: card.rarity,
        era: card.era,
        knowhow: card.knowhow,
      },
      strings,
    );
  }
  for (const item of items) {
    walk(
      {
        name: item.name,
        rarity: item.rarity,
        slot: item.slot,
        type: item.type,
        era: item.era,
        primary: item.primary,
        secondary: item.secondary,
        effect: item.effect,
        flavor: item.flavor,
        trade: item.trade,
        durability: item.durability,
      },
      strings,
    );
  }
  const bad = strings
    .map((text) => ({ text, result: checkSlop(text) }))
    .filter((entry) => entry.result.verdict !== 'ok');
  assert.deepEqual(
    bad.map((entry) => ({ text: entry.text, ...entry.result })),
    [],
  );
});

test('the name is spelled OverSummoned when it appears', () => {
  const strings = [];
  walk(copy, strings);
  for (const text of strings) {
    const hits = text.match(/over\s*summoned/gi) || [];
    for (const hit of hits) assert.equal(hit, 'OverSummoned');
    assert.equal(text.includes('\u2014') || text.includes('\u2013'), false);
  }
});

test('feature blurbs stay short', () => {
  for (const blurb of copy.featureBlurbs) {
    const words = blurb.text.trim().split(/\s+/);
    assert.ok(words.length <= 15, blurb.text);
    assert.equal(blurb.text.endsWith('.'), true);
  }
});

test('visible copy does not name the plumbing', () => {
  const strings = [];
  walk(copy, strings);
  const leak = /\b(resend|vercel|endpoint|segment|backend|supabase|hexagon|torn|api)\b/i;
  const hits = strings.filter((text) => leak.test(text));
  assert.deepEqual(hits, []);
});

test('flavor lines stay in range', () => {
  for (const item of items) {
    const words = item.flavor.trim().split(/\s+/);
    assert.ok(words.length >= 12 && words.length <= 30, `${item.id} ${words.length}`);
  }
});

test('every fight move names an enemy in its room, and every enemy has a move', () => {
  for (const room of copy.rooms) {
    for (const move of room.moves) assert.ok(room.foes.includes(move.foe), `${room.id} ${move.label}`);
    for (const foe of room.foes) assert.ok(room.moves.some((move) => move.foe === foe), `${room.id} ${foe}`);
  }
});
