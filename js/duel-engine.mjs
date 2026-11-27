// Duels: the whole rule book in one pure file (O8). No DOM, no network, no clock, no Math.random.
// The same file runs the practice table in the browser, the ranked edge function (O10) and the balance sim
// (rules/sim_duel.mjs), so a duel replayed anywhere from the same seed and the same picks comes out the same.
// Rules: PLAN-CITY-DUELS.md section 3. Numbers: R.duel in rules.json (rules/duel.py).

export const STATS = ['attack', 'defense', 'health', 'speed', 'luck'];

// ---- seeded dice (mulberry32). The state is a number kept on the duel, so a duel can be saved and resumed.
function rand(st) { st.rng = (st.rng + 0x6D2B79F5) >>> 0; let t = st.rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pickW = (st, w) => { const tot = w.reduce((a, b) => a + b, 0); let r = rand(st) * tot; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; } return w.length - 1; };
function shuffle(st, a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand(st) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---- a hero as a duel card. own = { level, trained: {stat: n}, kit: 0|2|3 }. The bracket caps what counts.
export function makeCard(R, heroId, own, bracketId) {
  const D = R.duel, h = (R.heroes.find ? R.heroes.find(x => x.id === heroId) : R.heroes[heroId]);
  if (!h) throw new Error('no hero ' + heroId);
  const br = D.brackets.find(b => b.id === bracketId) || D.brackets[D.brackets.length - 1];
  const lvl = Math.min(own && own.level || 1, br.level), mult = 1 + R.card.stat_per_level * (lvl - 1);
  const kit = own && own.kit >= 3 ? D.kit.three : own && own.kit >= 2 ? D.kit.two : 0, tr = (own && own.trained) || {}, st = {};
  const rs = D.rarity_scale[h.rarity] || 1, cost = D.cost[h.rarity];
  const soft = D.train_soft || 1e9, after = D.train_after == null ? 1 : D.train_after;
  const eff = t => { t = Math.min(t || 0, br.train); return Math.min(t, soft) + Math.max(0, t - soft) * after; };   // points past `soft` count less
  STATS.forEach(k => { st[k] = Math.round((h.stats[k] * mult * rs + eff(tr[k]) * D.train_weight * cost / 2) * (1 + kit)); });
  return { id: h.id, cost, rarity: h.rarity, st, g: { age: h.age, kin: h.kin, arch: h.arch }, move: D.moves[h.id] || null };
}

const best = c => STATS.reduce((b, k) => c.st[k] > c.st[b] ? k : b, 'attack');
const inGroup = (c, g) => !!g && c.g[g[0]] === g[1];

// ---- a new duel. decks: [cardsA, cardsB] (arrays of makeCard results). opts: { seed, arena }.
export function newDuel(R, decks, opts) {
  const D = R.duel, st = { rng: (opts && opts.seed) >>> 0 || 1 };
  const arenas = Object.keys(D.arenas);
  const arena = opts && opts.arena && D.arenas[opts.arena] ? opts.arena : arenas[Math.floor(rand(st) * arenas.length)];
  const s = {
    v: 1, rng: st.rng, arena, round: 1, turn: 0, calls: [], called: [], over: false, winner: -1, log: [],
    cards: {}, sides: decks.map(deck => ({ deck: [], hand: [], energy: D.energy.start, pts: 0, rounds: 0, plays: {}, burn: [], locked: [], lockNext: 0, taxNext: 0, tax: 0, sparkNext: 0, peek: 0 })),
  };
  decks.forEach((deck, i) => { deck.forEach(c => { s.cards[i + ':' + c.id] = c; }); s.sides[i].deck = shuffle(s, deck.map(c => c.id)); });
  s.sides.forEach((p, i) => draw(R, s, i));
  startRound(R, s);
  return s;
}

function draw(R, s, i) {
  const p = s.sides[i];
  while (p.hand.length < R.duel.hand && p.deck.length) {
    const id = p.deck.shift(); p.hand.push(id);
    const m = s.cards[i + ':' + id].move;
    if (m && m.on === 'drawn' && m.fx === 'spark') p.sparkNext += m.x || 0;
  }
}

function startRound(R, s) {
  const w = R.duel.arenas[s.arena].w, calls = [];
  for (let t = 0; t < R.duel.turns_per_round; t++) {
    let k; do { k = pickW(s, w); } while (calls.length === 2 && calls[0] === k && calls[1] === k);
    calls.push(k);
  }
  s.calls = calls.map(k => STATS[k]); s.turn = 0; s.sides.forEach(p => { p.pts = 0; p.burn = []; });
}

export const call = s => s.calls[s.turn];
export const costOf = (R, s, i, id) => { const p = s.sides[i], c = s.cards[i + ':' + id]; return c.cost + (p.tax && id === dearest(s, i) ? p.tax : 0); };
function dearest(s, i) { const p = s.sides[i]; return p.hand.reduce((b, id) => !b || s.cards[i + ':' + id].cost > s.cards[i + ':' + b].cost ? id : b, null); }

// can side i play these cards (hero ids from its hand) this turn?
export function legal(R, s, i, ids) {
  const p = s.sides[i];
  if (s.over || !Array.isArray(ids) || ids.length > R.duel.per_turn || new Set(ids).size !== ids.length) return false;
  if (ids.some(id => !p.hand.includes(id) || p.locked.includes(id))) return false;
  return ids.reduce((t, id) => t + costOf(R, s, i, id), 0) <= p.energy;
}

// what one played card is worth before the other side's moves. arena bonus multiplies the stat; moves add after.
function baseOf(R, s, i, c, k) {
  const ar = R.duel.arenas[s.arena], g = ar.bonus;
  const stat = c.move && c.move.fx === 'twist' ? c.st[best(c)] : c.st[k];
  return stat * (inGroup(c, g) ? 1 + R.duel.arena_bonus : 1);
}

// ---- play one turn. picks: [idsA, idsB]. Returns the events, in order, for the table to draw.
export function play(R, s, picks) {
  if (s.over) return [];
  const D = R.duel, k = call(s), ev = [];
  picks = picks.map((ids, i) => legal(R, s, i, ids) ? ids : []);
  const before = s.sides.map(p => p.pts);
  const board = s.sides.map((p, i) => picks[i].map(id => {
    const c = s.cards[i + ':' + id]; p.energy -= costOf(R, s, i, id);
    return { side: i, id, c, val: baseOf(R, s, i, c, k), add: 0, mult: 1, notes: [] };
  }));
  ev.push({ t: 'flip', call: k, board: board.map(b => b.map(x => ({ id: x.id, val: Math.round(x.val) }))) });
  const guard = [false, false];
  // moves, fastest card first (a coin decides a tie in speed)
  const order = board.flat().filter(x => x.c.move).map(x => ({ x, r: rand(s) })).sort((a, b) => (b.x.c.st.speed - a.x.c.st.speed) || (a.r - b.r)).map(o => o.x);
  for (const x of order) {
    const m = x.c.move, i = x.side, o = 1 - i, me = s.sides[i], them = s.sides[o];
    const on = m.on || 'play';
    if (on === 'drawn' || on === 'exit') { if (m.plus && m.plus.stat === k) { x.add += m.plus.x; ev.push({ t: 'move', side: i, id: x.id, fx: 'boost' }); } continue; }
    if (on === 'ahead' && !(before[i] > before[o])) continue;
    if (on === 'behind' && !(before[i] < before[o])) continue;
    const mine = board[i].filter(y => y !== x), theirs = board[o];
    let did = true;
    switch (m.fx) {
      case 'boost': if (!m.stat || m.stat === k) x.add += m.x; else did = false; break;
      case 'ramp': x.add += m.x * (me.plays[x.id] || 0); did = (me.plays[x.id] || 0) > 0; break;
      case 'rally': { const hit = mine.filter(y => inGroup(y.c, m.group)); hit.forEach(y => { y.add += m.x; }); did = hit.length > 0; break; }
      case 'lift': mine.forEach(y => { y.add += m.x; }); did = mine.length > 0; break;
      case 'mend': me.burn = []; mine.forEach(y => { y.add += m.x; }); break;
      case 'guard': guard[i] = true; break;
      case 'sap': {
        if (guard[o] || !theirs.length) { did = false; break; }
        const tgt = theirs.reduce((b, y) => (y.val + y.add) > (b.val + b.add) ? y : b);
        tgt.add -= m.x; tgt.notes.push('sapped'); break;
      }
      case 'burn': if (guard[o]) did = false; else them.burn.push({ x: m.x, n: m.n || 2 }); break;
      case 'lock': them.lockNext += m.n || 1; break;
      case 'spark': me.sparkNext += m.x || 0; break;
      case 'tax': them.taxNext += m.x || 1; break;
      case 'twist': break;
      case 'peek': me.peek = m.n || 2; if (m.stat) { if (m.stat === k) x.add += m.x; } else if (m.x) mine.forEach(y => { y.add += m.x; }); break;
      case 'gamble': { const ch = Math.min(D.gamble.cap, x.c.st.luck / D.gamble.div); if (rand(s) < ch) x.mult = D.gamble.mult; else did = false; break; }
      default: did = false;
    }
    if (m.plus && m.plus.stat === k) { x.add += m.plus.x; did = true; }
    if (did) ev.push({ t: 'move', side: i, id: x.id, fx: m.fx });
  }
  // add it up
  const tot = [0, 1].map(i => {
    let t = board[i].reduce((a, x) => a + Math.max(0, Math.round((x.val + x.add) * x.mult)), 0);
    const p = s.sides[i];
    if (!guard[i]) p.burn.forEach(b => { t -= b.x; });
    p.burn = p.burn.map(b => ({ x: b.x, n: b.n - 1 })).filter(b => b.n > 0);
    return Math.max(0, t);
  });
  tot.forEach((t, i) => { s.sides[i].pts += t; });
  ev.push({ t: 'score', call: k, add: tot, pts: s.sides.map(p => p.pts), board: board.map(b => b.map(x => ({ id: x.id, val: Math.max(0, Math.round((x.val + x.add) * x.mult)), up: x.add > 0 || x.mult > 1, down: x.add < 0 }))) });
  // played cards go back under the deck in the order played (or on top, for the ones that say so)
  s.sides.forEach((p, i) => {
    picks[i].forEach(id => { p.hand.splice(p.hand.indexOf(id), 1); p.plays[id] = (p.plays[id] || 0) + 1; const m = s.cards[i + ':' + id].move; if (m && m.on === 'exit' && m.fx === 'top') p.deck.unshift(id); else p.deck.push(id); });
  });
  s.log.push(picks); s.called.push(k);
  // end of the turn, then maybe the end of the round
  s.turn++;
  if (s.turn >= s.calls.length) {
    const [a, b] = s.sides.map(p => p.pts);
    if (a === b) {
      if (s.calls.length < D.turns_per_round + 6) s.calls.push(STATS[pickW(s, D.arenas[s.arena].w)]);
      else { const w = rand(s) < 0.5 ? 0 : 1; s.sides[w].pts++; }
    }
    if (s.turn >= s.calls.length) {
      const w = s.sides[0].pts > s.sides[1].pts ? 0 : 1; s.sides[w].rounds++;
      ev.push({ t: 'round', winner: w, rounds: s.sides.map(p => p.rounds), round: s.round });
      if (s.sides[w].rounds >= D.rounds_to_win) { s.over = true; s.winner = w; ev.push({ t: 'end', winner: w }); return ev; }
      s.round++; startRound(R, s);
    }
  }
  // next turn: energy, draw, and what the other side did to this one
  s.sides.forEach((p, i) => {
    p.energy = Math.min(D.energy.max, p.energy + D.energy.per_turn + p.sparkNext); p.sparkNext = 0;
    draw(R, s, i);
    p.tax = p.taxNext; p.taxNext = 0;
    p.locked = shuffle(s, p.hand.slice()).slice(0, Math.min(p.lockNext, Math.max(0, p.hand.length - 1))); p.lockNext = 0;
  });
  return ev;
}

// ---- the house player. level: 0 easy, 1 normal, 2 hard.
// Scores every set of up to three playable cards: points this turn, minus what the energy would have been worth later.
export function choose(R, s, i, level) {
  const D = R.duel, p = s.sides[i], k = call(s), o = 1 - i;
  const hand = p.hand.filter(id => !p.locked.includes(id));
  if (level === 0 && rand(s) < 0.35) { const pick = []; let e = p.energy; shuffle(s, hand.slice()).forEach(id => { const c = costOf(R, s, i, id); if (pick.length < D.per_turn && c <= e) { pick.push(id); e -= c; } }); return pick; }
  const cards = hand.map(id => s.cards[i + ':' + id]);
  const ppe = cards.length ? cards.reduce((a, c) => a + avgVal(R, s, i, c) / c.cost, 0) / cards.length : 3;
  const lam = ppe * 0.7, later = s.calls.slice(s.turn + 1);
  // careful: a card that will score much better on a call still to come in this round is worth holding
  const hold = id => { if (level < 2 || !later.length) return 0; const c = s.cards[i + ':' + id], now = baseOf(R, s, i, c, k), fut = Math.max(...later.map(kk => baseOf(R, s, i, c, kk))); return Math.max(0, fut - now) * 0.5; };
  let bestSet = [], bestV = 0, bestPts = 0;
  for (const pick of subsets(hand)) {
    if (pick.length > D.per_turn || !legal(R, s, i, pick)) continue;
    const pts = estimate(R, s, i, pick, k);
    const v = pts - lam * pick.reduce((t, id) => t + costOf(R, s, i, id), 0) - pick.reduce((t, id) => t + hold(id), 0);
    if (v > bestV + 1e-9) { bestV = v; bestSet = pick; bestPts = pts; }
  }
  if (level >= 2 && s.turn === s.calls.length - 1) {
    const gap = s.sides[o].pts - p.pts;
    if (gap > 0 && bestPts * 0.35 < gap) return [];      // this round is gone: keep the energy for the next one
    if (gap < 0 && -gap > bestPts * 1.6) return [];      // this round is won: same
  }
  return bestSet;
}
function subsets(set) { const out = []; for (let m = 1; m < (1 << set.length); m++) out.push(set.filter((_, j) => m & (1 << j))); return out; }
function avgVal(R, s, i, c) { const w = R.duel.arenas[s.arena].w, tot = w.reduce((a, b) => a + b, 0); return STATS.reduce((a, k, j) => a + baseOf(R, s, i, c, k) * w[j] / tot, 0); }
function estimate(R, s, i, ids, k) {
  const p = s.sides[i], cs = ids.map(id => s.cards[i + ':' + id]), D = R.duel;
  let t = cs.reduce((a, c) => a + baseOf(R, s, i, c, k), 0), lam = 3;
  for (const c of cs) {
    const m = c.move; if (!m) continue; const others = cs.filter(y => y !== c);
    const on = m.on || 'play', gap = p.pts - s.sides[1 - i].pts;
    if (on === 'ahead' && !(gap > 0)) continue; if (on === 'behind' && !(gap < 0)) continue;
    switch (m.fx) {
      case 'boost': if (!m.stat || m.stat === k) t += m.x; break;
      case 'ramp': t += m.x * (p.plays[c.id] || 0); break;
      case 'rally': t += m.x * others.filter(y => inGroup(y, m.group)).length; break;
      case 'lift': case 'mend': t += m.x * others.length + (m.fx === 'mend' ? p.burn.reduce((a, b) => a + b.x, 0) : 0); break;
      case 'sap': t += m.x * 0.8; break;
      case 'burn': t += m.x * (m.n || 2) * 0.7; break;
      case 'lock': t += 4 * (m.n || 1); break;
      case 'spark': t += (m.x || 0) * lam; break;
      case 'tax': t += (m.x || 1) * lam * 0.7; break;
      case 'guard': t += 3; break;
      case 'peek': if (m.stat) { if (m.stat === k) t += m.x; } else if (m.x) t += m.x * others.length; break;
      case 'gamble': t += baseOf(R, s, i, c, k) * (D.gamble.mult - 1) * Math.min(D.gamble.cap, c.st.luck / D.gamble.div); break;
    }
  }
  return t;
}

// ---- play a whole duel between two house players (the sim, and a quick check in the console).
export function runDuel(R, decks, opts) {
  const s = newDuel(R, decks, opts), lv = (opts && opts.levels) || [1, 1];
  let guard = 0;
  while (!s.over && guard++ < 200) play(R, s, [choose(R, s, 0, lv[0]), choose(R, s, 1, lv[1])]);
  return s;
}
