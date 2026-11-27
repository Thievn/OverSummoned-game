// Duel balance check (O8). Runs the real engine (js/duel-engine.mjs) house AI against house AI.
//   node rules/sim_duel.mjs            all tests, 10,000 duels each
//   node rules/sim_duel.mjs 2000       quicker
// Pass marks are PLAN-CITY-DUELS.md 3.3. Exits 1 if any mark fails.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as E from '../js/duel-engine.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const R = JSON.parse(fs.readFileSync(path.join(here, '../data/rules.json')));
const N = +process.argv[2] || 10000;
const H = R.heroes, ids = H.map(h => h.id), byId = Object.fromEntries(H.map(h => [h.id, h]));
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const sample = (a, n) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b.slice(0, n); };
const D = R.duel, DECK = D.deck;

// a typical owner: some levels, some training, sometimes a kit
const typical = () => { const tr = {}; E.STATS.forEach(k => { tr[k] = Math.floor(rnd() * 31); }); return { level: 1 + Math.floor(rnd() * 10), trained: tr, kit: rnd() < 0.2 ? 3 : rnd() < 0.3 ? 2 : 0 }; };
const deckOf = (list, bracket, own) => list.map(id => E.makeCard(R, id, own ? own(id) : typical(), bracket));

function duel(a, b, levels) {
  const s = E.runDuel(R, [a, b], { seed: Math.floor(rnd() * 4294967295), levels: levels || [1, 1] });
  return s;
}

const marks = []; const mark = (name, ok, detail) => { marks.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };
const pct = x => (100 * x).toFixed(1) + '%';

// ---- 1. random mixed decks against each other: length, calls, heroes and moves
{
  const calls = Object.fromEntries(E.STATS.map(k => [k, 0])); let rounds = 0, turns = 0, cards = 0, spent = 0, energyTurns = 0;
  const inDeck = Object.fromEntries(ids.map(id => [id, [0, 0]]));
  const fired = {};
  for (let n = 0; n < N; n++) {
    const la = sample(ids, DECK), lb = sample(ids, DECK);
    const s = duel(deckOf(la, 'silver'), deckOf(lb, 'silver'));
    rounds += s.sides[0].rounds + s.sides[1].rounds;
    s.log.forEach(p => { turns++; cards += p[0].length + p[1].length; });
    [la, lb].forEach((l, side) => l.forEach(id => { inDeck[id][0]++; if (s.winner === side) inDeck[id][1]++; }));
    s.called.forEach(k => calls[k]++);
  }
  const avgR = rounds / N; mark('average duel is 3.6 to 4.4 rounds', avgR >= 3.6 && avgR <= 4.4, avgR.toFixed(2) + ' rounds, ' + (turns / N).toFixed(1) + ' turns, ' + (cards / turns / 2).toFixed(2) + ' cards a side a turn');
  const tot = Object.values(calls).reduce((a, b) => a + b, 0);
  const share = Object.fromEntries(E.STATS.map(k => [k, calls[k] / tot]));
  mark('every stat is called 15% to 25% of turns', Object.values(share).every(v => v >= 0.15 && v <= 0.25), E.STATS.map(k => k + ' ' + pct(share[k])).join(', '));
  const rates = ids.map(id => ({ id, r: inDeck[id][1] / inDeck[id][0], rar: byId[id].rarity })).sort((a, b) => b.r - a.r);
  const hi = rates.filter(x => x.r > 0.58), lo = rates.filter(x => x.r < 0.42);
  mark('no hero wins over 58% or under 42% of the duels they are in', !hi.length && !lo.length, 'top: ' + rates.slice(0, 5).map(x => `${x.id} ${pct(x.r)}`).join(', ') + ' | bottom: ' + rates.slice(-5).map(x => `${x.id} ${pct(x.r)}`).join(', '));
  // the plan's mark: no Move appears in over 70% of winning decks. With random decks that is automatic, so this reads the stronger version above.
  fs.writeFileSync(path.join(here, 'sim_duel_heroes.json'), JSON.stringify(rates.map(x => ({ id: x.id, rarity: x.rar, win: +x.r.toFixed(3), move: D.moves[x.id].fx })), null, 1));
}

// ---- 2. decks built from one end of the rarity scale against mixed decks, same bracket
const by = r => ids.filter(id => byId[id].rarity === r);
const cheap = [...by('common'), ...by('uncommon')].sort((a, b) => D.cost[byId[a].rarity] - D.cost[byId[b].rarity]);
const dear = ids.slice().sort((a, b) => D.cost[byId[b].rarity] - D.cost[byId[a].rarity]);
const skew = { 'common and uncommon only': () => sample(cheap, DECK), 'rare only': () => sample(by('rare'), DECK), 'the twelve dearest': () => sample(dear.slice(0, 16), DECK) };
for (const [name, mk] of Object.entries(skew)) {
  for (const br of ['copper', 'silver', 'open']) {
    let w = 0; const n = Math.max(1000, N / 3);
    for (let i = 0; i < n; i++) { const side = i % 2; const a = deckOf(mk(), br), b = deckOf(sample(ids, DECK), br); const s = side ? duel(b, a) : duel(a, b); if (s.winner === side) w++; }
    mark(`${name} vs mixed, ${br}: no more than 55%`, w / n <= 0.55, pct(w / n) + (w / n < 0.4 ? '  (weak: a deck all one price wastes energy; that is deck-building, not rarity)' : ''));
  }
}

// ---- 3. tall against wide: the same 300 training points, on one hero or spread over twelve (Open bracket, level 10)
{
  let w = 0; const n = Math.max(1000, N / 3);
  for (let i = 0; i < n; i++) {
    const la = sample(ids, DECK), lb = sample(ids, DECK), star = la[0];
    const tall = id => ({ level: 10, kit: 0, trained: id === star ? Object.fromEntries(E.STATS.map(k => [k, 60])) : {} });
    const wide = () => ({ level: 10, kit: 0, trained: Object.fromEntries(E.STATS.map(k => [k, 5])) });
    const side = i % 2, a = deckOf(la, 'open', tall), b = deckOf(lb, 'open', wide);
    const s = side ? duel(b, a) : duel(a, b); if (s.winner === side) w++;
  }
  mark('one maxed hero does not beat the same training spread wide (tall wins 50% or less)', w / n <= 0.5, 'tall wins ' + pct(w / n));
}

// ---- 4. skill matters: the careful house player against the plain one
{
  let w = 0; const n = Math.max(1000, N / 3);
  for (let i = 0; i < n; i++) { const side = i % 2; const a = deckOf(sample(ids, DECK), 'silver'), b = deckOf(sample(ids, DECK), 'silver'); const lv = side ? [1, 2] : [2, 1]; const s = duel(a, b, lv); if (s.winner === side) w++; }
  mark('a careful player beats a plain one more often than not (over 53%)', w / n > 0.53, 'careful wins ' + pct(w / n));
  let e = 0;
  for (let i = 0; i < n; i++) { const side = i % 2; const a = deckOf(sample(ids, DECK), 'silver'), b = deckOf(sample(ids, DECK), 'silver'); const lv = side ? [0, 1] : [1, 0]; const s = duel(a, b, lv); if (s.winner === side) e++; }
  mark('practice "easy" is beatable (normal beats easy over 60%)', e / n > 0.6, 'normal wins ' + pct(e / n));
}

// ---- 5. the new mechanics: stand down, swap two, the captain
{
  let downs = 0, rounds = 0, caps = 0, duels = 0, swapped = 0; const n = Math.max(1500, N / 3);
  for (let i = 0; i < n; i++) {
    const s = duel(deckOf(sample(ids, DECK), 'silver'), deckOf(sample(ids, DECK), 'silver'), [2, 2]);
    downs += s.stats.down; rounds += s.stats.rounds * 2; caps += s.stats.captain; swapped += s.stats.swapped[0] + s.stats.swapped[1]; duels++;
  }
  const rate = downs / rounds;
  mark('a careful player stands down in 10% to 35% of its rounds', rate >= 0.10 && rate <= 0.35, pct(rate) + ` (${(caps / duels / 2).toFixed(2)} captain calls a side a duel, ${(swapped / duels / 2).toFixed(2)} cards swapped a side)`);
}

// ---- 6. swap two actually rescues a bad hand
{
  let wWith = 0, wWithout = 0; const n = Math.max(1500, N / 3);
  for (const useSwap of [true, false]) {
    for (let i = 0; i < n; i++) {
      const side = i % 2, a = deckOf(sample(ids, DECK), 'silver'), b = deckOf(sample(ids, DECK), 'silver');
      const s = E.newDuel(R, side ? [b, a] : [a, b], { seed: Math.floor(rnd() * 4294967295) });
      if (useSwap) { const sw = E.wantsSwap(R, s, side, 2); if (sw.length) E.swapTwo(R, s, side, sw); }
      s.swap = false; s.stats = { down: 0, rounds: 0, swapped: [0, 0], captain: 0 };
      let guard = 0;
      while (!s.over && guard++ < 300) {
        [0, 1].forEach(j => { if (E.wantsDown(R, s, j, 1)) E.standDown(R, s, j); });
        E.play(R, s, [E.choose(R, s, 0, 1), E.choose(R, s, 1, 1)]);
      }
      if (s.winner === side) { if (useSwap) wWith++; else wWithout++; }
    }
  }
  const lift = (wWith - wWithout) / n;
  mark('swapping two helps, and never hurts (at least +1 point)', lift >= 0.01, `with ${pct(wWith / n)} vs without ${pct(wWithout / n)} (+${pct(lift)})`);
}

// ---- 7. being captain should not decide the duel.
// The earlier version of this mark compared heroes against each other, which only measured how strong the hero
// was, not what the captaincy did. This measures the right thing: the same hero, in the same decks, captain or not.
{
  const asCap = {}, asNot = {}; const n = Math.max(2500, N);
  for (let i = 0; i < n; i++) {
    const la = sample(ids, DECK), lb = sample(ids, DECK), side = i % 2;
    const cap = la[Math.floor(rnd() * la.length)], other = la.find(x => x !== cap);
    const seed = Math.floor(rnd() * 4294967295);
    for (const [who, book] of [[cap, asCap], [other, asNot]]) {
      const a = deckOf(la, 'silver'), b = deckOf(lb, 'silver');
      const caps = side ? [lb[0], who] : [who, lb[0]];
      const s2 = E.runDuel(R, side ? [b, a] : [a, b], { seed, levels: [2, 2], captains: caps });
      const w = book[cap] || (book[cap] = [0, 0]); w[0]++; if (s2.winner === side) w[1]++;
    }
  }
  const capW = Object.values(asCap).reduce((a, v) => [a[0] + v[0], a[1] + v[1]], [0, 0]);
  const notW = Object.values(asNot).reduce((a, v) => [a[0] + v[0], a[1] + v[1]], [0, 0]);
  const lift = capW[1] / capW[0] - notW[1] / notW[0];
  const per = Object.keys(asCap).filter(k => asCap[k][0] >= 25 && asNot[k][0] >= 25)
    .map(k => ({ id: k, d: asCap[k][1] / asCap[k][0] - asNot[k][1] / asNot[k][0] })).sort((a, b) => b.d - a.d);
  // Per-hero numbers here are noisy (about 90 duels an arm), so the mark is the average effect plus a
  // noise-aware check: no hero may sit more than 2.5 standard errors from no effect at all.
  const se = id => Math.sqrt(0.25 / asCap[id][0] + 0.25 / asNot[id][0]);
  const odd = per.filter(x => Math.abs(x.d) > 2.5 * se(x.id));
  mark('captaincy is close to even across heroes', Math.abs(lift) < 0.03 && odd.length === 0,
    `average ${pct(lift)}; spread ${per.length ? pct(per[0].d) + ' to ' + pct(per[per.length - 1].d) : '-'}; ${odd.length} hero(es) beyond noise${odd.length ? ': ' + odd.map(x => x.id).join(', ') : ''}`);
}

// ---- 8. which Move kinds pull their weight (read, not a mark)
{
  const f = JSON.parse(fs.readFileSync(path.join(here, 'sim_duel_heroes.json')));
  const by = {}; f.forEach(x => { (by[x.move] = by[x.move] || []).push(x.win); });
  console.log('\nMove kinds, average win rate of the heroes who have one:');
  Object.entries(by).sort((a, b) => avg(b[1]) - avg(a[1])).forEach(([k, v]) => console.log(`  ${k.padEnd(7)} ${pct(avg(v))}  (${v.length})`));
  const rr = {}; f.forEach(x => { (rr[x.rarity] = rr[x.rarity] || []).push(x.win); });
  console.log('By rarity:'); Object.entries(rr).forEach(([k, v]) => console.log(`  ${k.padEnd(10)} ${pct(avg(v))}  (${v.length})`));
}
function avg(a) { return a.reduce((x, y) => x + y, 0) / a.length; }

const failed = marks.filter(m => !m.ok).length;
console.log(`\n${marks.length - failed} of ${marks.length} marks pass.`);
process.exit(failed ? 1 : 0);
