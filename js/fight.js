// OverSummoned game math. Pure functions, no DOM. The server runs the same
// formulas (os_hero_stats / os_fight_sim) and the tests check both agree.
import { GEAR, ERA_SETS, HERO_BASE, STAT_KEYS, GEAR_SLOTS, BELT_SLOTS, HERO_PERK_FX, slotKind } from './gear.js';

export const ROOMS = {1:1, 15:3, 60:5, 240:8, 480:12};
export function roomsFor(minutes) { return ROOMS[minutes] || 3; }
export const r0 = (x) => Math.floor(x + 0.5);

// MINSTD: the same sequence in the browser and on the server.
export function makeRng(seed) {
  let s = Math.floor(Math.abs(Number(seed) || 1)) % 2147483647;
  if (s <= 0) s += 2147483646;
  const next = () => { s = (s * 48271) % 2147483647; return s / 2147483647; };
  next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return next;
}

export function levelMult(level) { return 1 + 0.05 * (Math.max(1, level || 1) - 1); }

function addFx(into, fx) { for (const k in (fx || {})) into[k] = (into[k] || 0) + Number(fx[k]); }

// Card totals: base x level, plus worn gear, plus the era set when all three are on their own hero.
export function heroTotals(heroId, level, gear) {
  const hb = HERO_BASE[heroId] || {base:{atk:8, def:8, hp:104, spd:10, crit:5, luck:2}, fx:{}};
  const m = levelMult(level);
  const base = {};
  for (const k of STAT_KEYS) base[k] = (k === 'crit' || k === 'luck') ? hb.base[k] : Math.floor(hb.base[k] * m);
  const g = {atk:0, def:0, hp:0, spd:0, crit:0, luck:0};
  const fx = {}; addFx(fx, hb.fx);
  let armor = 0, lo = 1, hi = 3, swing = 2.0;
  const worn = [];
  for (const slot of GEAR_SLOTS) {
    const id = gear && gear[slot]; const it = id && GEAR[id];
    if (!it) continue;
    worn.push(id);
    for (const k in (it.stats || {})) g[k] += it.stats[k];
    armor += it.armor || 0;
    addFx(fx, it.fx);
    if (slot === 'main' && it.dmg) { lo = it.dmg[0]; hi = it.dmg[1]; swing = it.speed || 2.0; }
  }
  const set = ERA_SETS[heroId];
  const setCount = set ? set.items.filter(x => worn.includes(x)).length : 0;
  const setOn = !!set && setCount === set.items.length;
  if (setOn) { for (const k in set.stats) g[k] += set.stats[k]; addFx(fx, set.fx); }
  const total = {};
  for (const k of STAT_KEYS) total[k] = base[k] + g[k];
  const uses = [];
  for (const slot of ['trinket1','trinket2']) { const id = gear && gear[slot]; if (id && GEAR[id] && GEAR[id].use) uses.push(id); }
  const belt = BELT_SLOTS.map(s => (gear && gear[s]) || null);
  return {base, gear:g, total, armor, lo, hi, swing, fx, setCount, setOn, uses, belt};
}

export function defEff(def, armor) { return def + Math.floor((armor || 0) / 20); }
export function swingTime(swing, spd) { return swing / (1 + spd / 100); }

// Damage for one hit, before on-hit extras. Uses three rolls: damage, crit, variance.
export function hitDamage(rng, a, targetDef, mult) {
  const raw = rng.int(a.lo, a.hi) + a.atk;
  const mit = raw * 100 / (100 + Math.max(0, targetDef));
  const crit = rng() < Math.min(60, a.crit) / 100;
  const v = 0.95 + rng() * 0.10;
  return {d: Math.max(1, r0(mit * (crit ? 1.5 : 1) * mult * v)), crit};
}

export const FOE_KINDS = [['Cellar Rat',0],['Ash Ghoul',1],['Skeleton',1],['Mushroom Brute',0],['Tunnel Goblin',0],['Drip Slime',0]];

export function makeFoe(name, undead, lvl, boss) {
  const f = {name, undead:!!undead, hp:r0(30 + 18 * lvl), atk:r0(2 + 2.2 * lvl), def:r0(2 + 2 * lvl), spd:r0(5 + lvl), crit:5, lo:r0(1 + lvl), hi:r0(3 + 1.5 * lvl), swing:2.2};
  if (boss) { f.hp *= 4; f.atk = r0(f.atk * 1.3); f.def = r0(f.def * 1.2); }
  return f;
}

export function genFoes(rng, floor, r, R) {
  if (floor % 10 === 0 && r === R) return [makeFoe('Hollow Bishop', 1, floor + (r - 1) * 0.25, true)];
  const n = floor >= 5 ? 1 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 2);
  const out = [];
  for (let i = 0; i < n; i++) { const k = FOE_KINDS[Math.floor(rng() * FOE_KINDS.length)]; out.push(makeFoe(k[0], k[1], floor + (r - 1) * 0.25, false)); }
  return out;
}

const USE_OF = (id) => (GEAR[id] && GEAR[id].use) || null;
const LOG_CAP = 260;

// The fight. party: [{id, name, total, armor, lo, hi, swing, fx, uses, belt}] (heroTotals + id/name).
// stock: {itemId: qty in the bank}. rules: {heal, retreat} in percent.
export function simulate({party, floor, minutes, seed, rules, stock}) {
  const rng = makeRng(seed);
  const R = roomsFor(minutes);
  const heal = Math.max(0, Math.min(100, Number(rules && rules.heal) || 0));
  const retreat = Math.max(0, Math.min(100, Number(rules && rules.retreat) || 0));
  const st = Object.assign({}, stock || {});
  const H = party.map(p => ({id:p.id, name:p.name, atk:p.total.atk, def:p.total.def, max:p.total.hp, hp:p.total.hp, spd:p.total.spd, crit:p.total.crit,
    armor:p.armor || 0, lo:p.lo, hi:p.hi, swing:p.swing, fx:p.fx || {}, uses:p.uses || [], belt:p.belt || [], cd:{}, hot:0, hotT:0, acts:0, reviveUsed:false}));
  const used = {}; const log = []; const rooms = [];
  let t = 0, cleared = 0, result = 'won';
  let slapAoeUsed = false, reviveFirstUsed = false;
  const partyHas = (k) => H.some(h => h.hp > 0 && h.fx[k]);
  const push = (r, a, x, v, c, foes) => {
    if (log.length >= LOG_CAP && c !== 'room' && c !== 'end') return;
    log.push({t:Math.round(t * 10) / 10, r, a, x, v, c, hp:H.map(h => h.hp), fh:foes ? foes.map(f => f.hp) : []});
  };
  for (let r = 1; r <= R; r++) {
    const F = genFoes(rng, floor, r, R).map(f => Object.assign(f, {max:f.hp, shredUntil:-1, mark:0, stun:0}));
    rooms.push(F.map(f => ({name:f.name, max:f.max})));
    push(r, '', F.length === 1 ? `Room ${r}. ${/^[AEIOU]/.test(F[0].name) ? 'An' : 'A'} ${F[0].name} steps out of the dark.` : `Room ${r}. ${F.length === 2 ? 'Two' : 'Three'} shapes step out of the dark.`, '', 'room', F);
    const rs = {first:H.map(() => true), firstHit:H.map(() => false), guard:H.map(() => 0), downDef:H.map(() => 0), testudo:false, rallyUntil:-1, rallyV:0, hasteUntil:-1};
    H.forEach((h, i) => {
      if (h.hp <= 0) return;
      for (const id of h.uses) {
        const u = USE_OF(id); if (!u || (u.k !== 'rally' && u.k !== 'haste')) continue;
        if ((h.cd[id] ?? -1) > t) continue;
        h.cd[id] = t + u.cds;
        if (u.k === 'rally') { rs.rallyUntil = t + 15; rs.rallyV = u.v; push(r, h.name, `${h.name} raises the ${GEAR[id].name}. The squad hits harder.`, '', 'buff', F); }
        else { rs.hasteUntil = t + 10; push(r, h.name, `${h.name} sends one message. Everyone moves faster.`, '', 'buff', F); }
      }
    });
    const hSwing = (h) => swingTime(h.swing, h.spd) / (t < rs.hasteUntil ? 1.3 : 1);
    H.forEach(h => { h.tn = t + hSwing(h); });
    F.forEach(f => { f.tn = t + swingTime(f.swing, f.spd); });
    let actions = 0, end = '';
    for (;;) {
      if (!F.some(f => f.hp > 0)) { end = 'clear'; break; }
      if (!H.some(h => h.hp > 0)) { end = 'wipe'; break; }
      if (actions >= 400) { end = 'stall'; break; }
      let best = null, bh = true, bi = -1;
      H.forEach((h, i) => { if (h.hp > 0 && (!best || h.tn < best.tn || (h.tn === best.tn && h.spd > best.spd))) { best = h; bh = true; bi = i; } });
      F.forEach((f, i) => { if (f.hp > 0 && (!best || f.tn < best.tn || (f.tn === best.tn && f.spd > best.spd))) { best = f; bh = false; bi = i; } });
      t = best.tn; actions++;
      if (bh) {
        const h = best, hi = bi;
        if (h.hot > 0) { const gain = Math.floor(h.hot * (t - h.hotT)); if (gain > 0) { h.hp = Math.min(h.max, h.hp + gain); h.hotT = t; } }
        const pp = 1 + ((h.fx.potion_plus || 0)) / 100;
        if (h.hp < heal / 100 * h.max) {
          let pick = null, fromBelt = false;
          for (const id of h.belt) { const u = id && USE_OF(id); if (!u || (st[id] || 0) <= 0 || (h.cd[id] ?? -1) > t) continue; if (u.k === 'heal' || (u.k === 'hot' && h.hot === 0)) { pick = id; fromBelt = true; break; } }
          if (!pick) for (const id of h.uses) { const u = USE_OF(id); if (u && u.k === 'heal' && (h.cd[id] ?? -1) <= t) { pick = id; break; } }
          if (!pick) for (const id of h.belt) { const u = id && USE_OF(id); if (u && u.k === 'guard' && (st[id] || 0) > 0 && (h.cd[id] ?? -1) <= t && rs.guard[hi] === 0) { pick = id; fromBelt = true; break; } }
          if (pick) {
            const u = USE_OF(pick);
            if (fromBelt) { st[pick] -= 1; used[pick] = (used[pick] || 0) + 1; }
            h.cd[pick] = t + u.cds;
            if (u.k === 'heal') { const amt = r0(u.v * pp); h.hp = Math.min(h.max, h.hp + amt); push(r, h.name, `${h.name} uses the ${GEAR[pick].name}.`, `+${amt}`, 'heal', F); }
            else if (u.k === 'hot') { h.hot = u.v / 3 * pp; h.hotT = t; push(r, h.name, `${h.name} drinks a ${GEAR[pick].name}. Warmth spreads slowly.`, '', 'heal', F); }
            else { rs.guard[hi] = u.v; push(r, h.name, `${h.name} rubs ${GEAR[pick].name} on their armor.`, `+${u.v} Defense`, 'buff', F); }
            h.tn += hSwing(h); continue;
          }
        }
        if (h.fx.triage && h.acts % 3 === 2) {
          let low = null;
          H.forEach(a => { if (a.hp > 0 && a.hp < 0.6 * a.max && (!low || a.hp / a.max < low.hp / low.max)) low = a; });
          if (low) { const amt = r0(h.fx.triage / 100 * low.max); low.hp = Math.min(low.max, low.hp + amt); h.acts++; push(r, h.name, low === h ? `${h.name} patches herself up.` : `${h.name} patches up ${low.name}.`, `+${amt}`, 'heal', F); h.tn += hSwing(h); continue; }
        }
        if (h.fx.reply_all && rs.first[hi]) {
          const turns = h.fx.reply_all + (h.fx.mark_plus || 0);
          F.forEach(f => { if (f.hp > 0) f.mark = turns; });
          rs.first[hi] = false; h.acts++;
          push(r, h.name, `${h.name} hits Reply All. Every enemy is marked.`, `${turns} turns`, 'buff', F);
          h.tn += hSwing(h); continue;
        }
        const first = rs.first[hi];
        let targets;
        const lowest = () => { let b = null; F.forEach(f => { if (f.hp > 0 && (!b || f.hp < b.hp)) b = f; }); return b; };
        const aoe = first && (h.fx.first_aoe || (h.fx.slap_aoe_once && !slapAoeUsed));
        if (aoe) { if (!h.fx.first_aoe) slapAoeUsed = true; targets = F.filter(f => f.hp > 0); }
        else targets = [lowest()];
        const swings = first && h.fx.first_double ? 2 : 1;
        const strike = (f, extra) => {
          if (!f || f.hp <= 0) return;
          const mult = (t < rs.rallyUntil ? 1 + rs.rallyV / 100 : 1) * (f.mark > 0 ? 1.15 : 1) * (f.undead && h.fx.undead ? 1 + h.fx.undead / 100 : 1);
          const hd = hitDamage(rng, h, f.def - (t < f.shredUntil ? 20 : 0), mult);
          let d = hd.d;
          if (!extra && h.fx.first_fire && !rs.firstHit[hi]) d += h.fx.first_fire;
          rs.firstHit[hi] = true;
          if (h.fx.steam && rng() < h.fx.steam / 100) d += 30;
          if (h.fx.shred && rng() < h.fx.shred / 100) f.shredUntil = t + 6;
          f.hp = Math.max(0, f.hp - d);
          push(r, h.name, hd.crit ? `${h.name} lands a huge hit on the ${f.name}.` : `${h.name} hits the ${f.name}.`, `${d} damage${hd.crit ? '!' : ''}`, hd.crit ? 'crit' : 'hit', F);
          if (f.hp <= 0) push(r, '', `The ${f.name} goes down.`, '', 'down', F);
        };
        for (const f of targets) for (let s = 0; s < swings; s++) strike(f, false);
        if (h.fx.slap && first && targets[0] && targets[0].hp > 0) {
          targets[0].stun = h.fx.slap + (h.fx.stun_plus || 0);
          push(r, h.name, `${h.name} slaps the ${targets[0].name} silly.`, `${targets[0].stun} turns`, 'buff', F);
        }
        if (h.fx.double_shot && rng() < h.fx.double_shot / 100) { const f = lowest(); if (f) { push(r, h.name, `${h.name}'s contraption fires again.`, '', 'buff', F); strike(f, true); } }
        rs.first[hi] = false; h.acts++;
        h.tn += hSwing(h);
      } else {
        const f = best;
        if (f.stun > 0) { f.stun--; push(r, '', `The ${f.name} is still seeing stars.`, '', 'miss', F); f.tn += swingTime(f.swing, f.spd); continue; }
        if (f.mark > 0) f.mark--;
        const alive = H.filter(h => h.hp > 0);
        let tg = alive.find(h => h.fx.aggro);
        if (!tg) tg = alive[Math.floor(rng() * alive.length)];
        const ti = H.indexOf(tg);
        if (tg.fx.dodge && rng() < tg.fx.dodge / 100) { push(r, tg.name, `${tg.name} slips the ${f.name}'s swing.`, 'Miss', 'miss', F); f.tn += swingTime(f.swing, f.spd); continue; }
        const dEff = defEff(tg.def, tg.armor) + (tg.fx.formation ? tg.fx.formation * (alive.length - 1) : 0) + rs.guard[ti] + rs.downDef[ti];
        const half = !rs.testudo && partyHas('testudo');
        const mult = (half ? 0.5 : 1) * (tg.fx.dr ? 1 - tg.fx.dr / 100 : 1);
        if (half) rs.testudo = true;
        const hd = hitDamage(rng, f, dEff, mult);
        tg.hp = Math.max(0, tg.hp - hd.d);
        push(r, f.name, hd.crit ? `The ${f.name} catches ${tg.name} hard.` : `The ${f.name} hits ${tg.name}.`, `-${hd.d}`, 'hurt', F);
        if (tg.hp <= 0) {
          push(r, tg.name, `${tg.name} is down.`, '', 'down', F);
          const reviver = H.find(a => a.hp > 0 && a.fx.revive_first);
          if (reviver && !reviveFirstUsed) { reviveFirstUsed = true; tg.hp = r0(reviver.fx.revive_first / 100 * tg.max); push(r, tg.name, `Golden Hour. ${tg.name} gets back up.`, `+${tg.hp}`, 'heal', F); }
          else { const d = H.find(a => a.hp > 0 && a.fx.revive_once && !a.reviveUsed); if (d) { d.reviveUsed = true; tg.hp = r0(d.fx.revive_once / 100 * tg.max); push(r, d.name, `${d.name} shocks ${tg.name} back to life.`, `+${tg.hp}`, 'heal', F); } }
          if (tg.hp <= 0) H.forEach((a, i) => { if (a.hp > 0 && a.fx.ally_down_def) rs.downDef[i] += a.fx.ally_down_def; });
        }
        f.tn += swingTime(f.swing, f.spd);
      }
    }
    if (end === 'clear') {
      cleared++;
      if (r < R) {
        H.forEach(h => { if (h.hp > 0) h.hp = Math.min(h.max, h.hp + r0(0.1 * h.max)); });
        const sh = H.reduce((a, h) => a + h.hp, 0), sm = H.reduce((a, h) => a + h.max, 0);
        if (sh * 100 < retreat * sm) { result = 'retreat'; push(r, '', 'Health is low. The squad backs out with what they carry.', '', 'end', null); break; }
      }
    } else if (end === 'wipe') { result = 'wiped'; push(r, '', 'The whole squad is down. Someone carries them out.', '', 'end', null); break; }
    else { result = 'retreat'; push(r, '', 'Nobody is winning this one. The squad backs out.', '', 'end', null); break; }
  }
  if (result === 'won') push(R, '', floor % 10 === 0 ? 'The Hollow Bishop falls. The floor is clear.' : 'The floor is clear. Time to head home.', '', 'end', null);
  return {rooms:R, cleared, result, t:Math.round(t * 10) / 10, hp:H.map(h => h.hp), max:H.map(h => h.max), names:H.map(h => h.name), ids:H.map(h => h.id),
    downed:H.filter(h => h.hp <= 0).map(h => h.id), used, log, foes:rooms};
}

// Party snapshot for a fight: heroes = [{id, level}], gear = {heroId: {slot: itemId}}.
export function partyFor(heroes, gear, names) {
  return heroes.map(h => Object.assign({id:h.id, name:(names && names[h.id]) || (HERO_BASE[h.id] && HERO_BASE[h.id].short) || h.id}, heroTotals(h.id, h.level, (gear && gear[h.id]) || {})));
}

export function partyFx(party) { const fx = {}; party.forEach(p => addFx(fx, p.fx)); return fx; }

// Luck: 1 + party Luck / 100 (Luck counts up to 100). Rarer drops get the most out of it.
export function luckWeights(rates, partyLuck, floorMult, night) {
  const L = 1 + Math.min(100, Math.max(0, partyLuck)) / 100;
  const nr = 1 + (night || 0) / 100;
  return {
    common: rates.common,
    uncommon: rates.uncommon * Math.sqrt(L),
    rare: rates.rare * L * nr,
    epic: rates.epic * L * nr,
    legendary: rates.legendary * L * nr,
    absurd: rates.absurd * L * floorMult * nr,
    unhinged: rates.unhinged * L * floorMult * nr
  };
}

// Out-of-fight speed: percent faster from perks, gear and sets, capped at 30%.
export function fasterMult(pct) { return 1 - Math.min(30, Math.max(0, pct || 0)) / 100; }
export function heroOutFx(heroId, level, gear) { const t = heroTotals(heroId, level, gear || {}); const fx = Object.assign({}, t.fx); addFx(fx, HERO_PERK_FX[heroId]); return fx; }

// Coins: 100 copper = 1 silver, 100 silver = 1 gold.
export function coins(copper) {
  const c = Math.max(0, Math.floor(copper || 0));
  return {g:Math.floor(c / 10000), s:Math.floor(c / 100) % 100, c:c % 100};
}

// Can this item go in this slot on this hero? Returns '' when it can, or a short reason.
export function canEquip(itemId, slot, heroId, level, gear) {
  const it = GEAR[itemId];
  if (!it) return 'That is not something you can wear.';
  const kind = slotKind(slot);
  if (it.slot !== kind) return 'That does not go there.';
  if ((it.req || 1) > (level || 1)) return `Needs card level ${it.req}.`;
  const g = gear || {};
  if (kind === 'off' && g.main && GEAR[g.main] && GEAR[g.main].hand === 'Two-Hand') return 'Both hands are busy with a two-handed weapon.';
  if (it.unique && kind !== 'belt') { for (const s in g) if (s !== slot && g[s] === itemId) return 'You can only wear one of these.'; }
  return '';
}
