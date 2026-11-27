// OverSummoned, the browser game. Every number comes from /data/rules.json,
// the same rulebook the desktop pet reads. Progress is saved to your account.
(async function () {
  const me = await Cloud.require();
  const OS = await window.OS.load(), R = OS.R, $ = id => document.getElementById(id), el = OS.el, now = () => Date.now();
  const MODES = ['sweet', 'salty', 'unhinged'], RAR = R.rarities, rr = r => RAR.indexOf(r);
  const places = {}; R.places.forEach(p => places[p.id] = p);
  const workPlaces = R.places.filter(p => p.skill !== 'Summoning');
  // the rift's own treasure (the neon decades): turns up in rift crates and comes home with the later arrivals
  const RIFT = R.rift && R.places.find(p => p.id === 'archive' && p.loot.length);
  const fresh = () => ({ v: 2, ink: R.summon.base_ink + R.summon.per_unique, gold: 0, xp: { Summoning: 0, Fishing: 0, Lockpicking: 0, Digging: 0 }, bag: {}, roster: { kevin: 1 }, equip: {}, gearLv: {}, jobs: [], mastery: {}, trained: {},
    energy: R.energy.max, energyT: now(), tickets: R.raids.tickets, ticketT: now(), tonics: {}, crateT: 0, autoCrate: false, autoSummon: false, gear: {}, crew: [null, null, null], exped: [], parts: 0, make: null, cabinet: {}, rest: 0, restDay: '', rebirth: {}, contracts: null, sold: 0, day: '', bagBuys: 0, mode: (me.profile && me.profile.voice) || 'salty', actions: 0, summons: 0, raids: {}, guide: 0, last: now() });
  let S = Object.assign(fresh(), (await Cloud.load()) || {}); S.mode = MODES.includes(S.mode) ? S.mode : 'salty';
  S.v = 3;      // v3: nothing is added to the bag or the roster except by the server; the save check holds this game to that
  // older ledgers had heroes holding jobs. Now Smudge works one place and heroes stand crew: keep the first place, move the workers into the crew.
  if (!S.work3) { const old = (S.jobs || []).filter(j => j && j.place); S.crew = [0, 1, 2].map(i => (old[i] && old[i].hero) || null); S.jobs = old.length ? [{ place: old[0].place, prog: 0, order: old[0].order || 'stay', since: 0 }] : []; S.work3 = 1; }

  // ------------------------------------------------------------------ rules
  const level = sk => { let l = 1; const x = S.xp[sk] || 0; while (l < 99 && x >= R.xp_table[l]) l++; return l; };
  const lvlOf = x => { let l = 1; while (l < 99 && x >= R.xp_table[l]) l++; return l; };
  const perk = (sk, key) => { const l = level(sk); let t = 0; R.perks.forEach(p => { if (l >= p.level && p[key]) t = key === 'double' ? Math.max(t, p[key]) : t + p[key]; }); return t; };
  const cardLevel = n => { let l = 1; while (l < R.card.max_level && n - 1 >= l * (l + 1) / 2) l++; return l; };
  const copiesFor = l => 1 + l * (l + 1) / 2;
  const unlocked = p => level(p.skill) >= p.level;
  const summonCost = () => R.summon.base_ink + R.summon.per_unique * Object.keys(S.roster).length;
  const totalLevel = () => R.skills.reduce((a, s) => a + level(s), 0);
  const crewSlots = () => R.jobs.crew_slots.filter(t => totalLevel() >= t).length;
  const crew = () => (S.crew || []).slice(0, crewSlots()).filter(id => id && S.roster[id]);
  const expSlots = () => R.exped.slots.filter(t => totalLevel() >= t).length;
  const away = id => S.exped.some(e => e.hero === id);
  const sellCap = () => R.gold.daily_sell_cap_base + R.gold.daily_sell_cap_per_level * totalLevel();
  const rollDay = () => { const d = new Date().toISOString().slice(0, 10); if (S.day !== d) { S.day = d; S.sold = 0; S.packs = 0; } };
  const tonic = eff => (S.tonics[eff] || 0) > now() ? R.tonics.find(t => t.effect === eff).amount : 0;
  const gearMult = (g, hero) => (1 + R.gear_up.per_level * (S.gearLv[g] || 0)) * (OS.items[g].owner === hero ? 1 + R.gear.signature_bonus : 1);
  const trainCap = id => R.energy.cap_base + R.energy.cap_per_card_level * cardLevel(S.roster[id] || 1);
  // the full kit: how many of a hero's own three signature pieces they are wearing
  const KIT = R.kit || { two: 0.1, three: 0.25, speed: 0.1 };
  const kitCount = id => (S.equip[id] || []).filter(g => g && OS.items[g] && OS.items[g].owner === id).length;
  const kitBonus = id => { const n = kitCount(id); return n >= 3 ? KIT.three : n === 2 ? KIT.two : 0; };
  // lifetime numbers for the stats page
  const bump = (k, n) => { const L = S.life || (S.life = {}); L[k] = (L[k] || 0) + (n == null ? 1 : n); };
  // ---- gear anyone can wear: S.gear[hero] = { weapon, head, body, feet, charm }. The hero's own three stay in S.equip[hero].
  const wornG = id => S.gear[id] || (S.gear[id] = {});
  const charmOpen = id => cardLevel(S.roster[id] || 1) >= R.slots.charm_level;
  const liveG = id => { const w = wornG(id), out = []; R.slots.general.forEach(k => { if (w[k] && OS.items[w[k]] && (k !== 'charm' || charmOpen(id))) out.push(w[k]); }); return out; };
  const setCount = id => { const c = {}; liveG(id).forEach(g => { const it = OS.items[g]; if (it.set) c[it.set] = (c[it.set] || 0) + 1; }); return c; };
  // everything a hero's gear adds of one kind: speed, luck, ink, xp, raid
  const fx = (id, kind) => { let t = 0; liveG(id).forEach(g => { const sp = OS.items[g].special; if (sp && sp.kind === kind) t += sp.amount; }); const sc = setCount(id); for (const k in sc) if (sc[k] >= 3 && R.gear_sets[k].three.kind === kind) t += R.gear_sets[k].three.amount; return t; };
  const baseStats = id => { const h = OS.heroes[id], mult = 1 + R.card.stat_per_level * (cardLevel(S.roster[id] || 1) - 1), out = {}, tr = S.trained[id] || {}; R.stats.forEach(k => out[k] = Math.round(h.stats[k] * mult + (tr[k] || 0))); return out; };
  function heroStats(id) {
    const h = OS.heroes[id], mult = 1 + R.card.stat_per_level * (cardLevel(S.roster[id] || 1) - 1), out = {}, tr = S.trained[id] || {};
    R.stats.forEach(k => out[k] = h.stats[k] * mult + (tr[k] || 0));
    (S.equip[id] || []).forEach(g => { if (!g) return; const it = OS.items[g], m = gearMult(g, id); for (const k in it.stats) out[k] += it.stats[k] * m; });
    liveG(id).forEach(g => { const it = OS.items[g], m = 1 + R.gear_up.per_level * (S.gearLv[g] || 0); for (const k in it.stats) out[k] += it.stats[k] * m; });
    const sc = setCount(id); for (const k in sc) if (sc[k] >= 2) { const two = R.gear_sets[k].two; for (const q in two) out[q] += two[q]; }
    const kb = 1 + kitBonus(id); R.stats.forEach(k => out[k] = Math.round(out[k] * kb)); return out;
  }
  const power = id => { const s = heroStats(id); return s.attack + s.defense + s.health; };
  const mastery = (id, sk) => Math.min(R.jobs.mastery_cap, lvlOf(((S.mastery[id] || {})[sk]) || 0) - 1);
  function jobSpeed(j) {
    const p = places[j.place]; let sp = 0;
    crew().forEach(id => { sp += heroStats(id).speed / R.jobs.crew_speed_div + mastery(id, p.skill) * R.jobs.mastery_speed + fx(id, 'speed') + (kitCount(id) >= 3 ? KIT.speed : 0);
      (S.equip[id] || []).forEach(g => { const it = g && OS.items[g]; if (it && it.equip && it.equip.skill === p.skill) sp += it.equip.speed * gearMult(g, id) / 100; }); });
    return (1 + softCap(sp + perk(p.skill, 'speed') + tonic('speed') + (cabSet(p.id) ? CAB.set_speed : 0))) * R.jobs.solo_mult;
  }
  // every speed bonus is added up first, then bent by one curve: the first bonuses count almost in full, stacking more gives less and less
  const softCap = b => { const c = R.jobs.speed_cap; return c ? c * (1 - Math.exp(-b / c)) : b; };
  const jobTime = j => R.tier[places[j.place].tier].seconds / jobSpeed(j);
  const jobLuck = () => crew().reduce((t, id) => t + heroStats(id).luck / R.jobs.crew_luck_div + fx(id, 'luck'), 0) + tonic('luck');
  const crewFx = kind => crew().reduce((t, id) => t + fx(id, kind), 0);
  function weights(p, extra) { const luck = level(p.skill) * R.loot.luck_per_level + perk(p.skill, 'luck') + extra; return p.loot.map(([id, w]) => OS.items[id].rarity === 'common' ? w : w * (1 + luck)); }
  function rollLootLocal(p, luck) { const ws = p.loot.map(([id, w]) => OS.items[id].rarity === 'common' ? w : w * (1 + luck)), tot0 = 0; return pickW(p, ws); }
  function pickW(p, ws) { const tot = ws.reduce((a, b) => a + b, 0); let r = Math.random() * tot; for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return p.loot[i][0]; } return p.loot[0][0]; }
  function rollLootOld(p, extra) { const ws = weights(p, extra), tot = ws.reduce((a, b) => a + b, 0); let r = Math.random() * tot; for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return p.loot[i][0]; } return p.loot[0][0]; }
  const dropChance = (p, id, extra) => { const ws = weights(p, extra || 0), c = ws[p.loot.findIndex(r => r[0] === id)] / ws.reduce((a, b) => a + b, 0) * 100; return (c >= 1 ? c.toFixed(1) : c.toFixed(2)) + '% of finds'; };
  // ---- how full the bag is. A stack is one slot however deep it is, and gear lives in the armory, not here.
  const BAG = R.bag || { slots: 90, per_buy: 10, max_buys: 12, cost_base: 400, cost_step: 1.4 };
  const bagSlot = id => { const it = OS.items[id]; return !!it && it.kind !== 'gear'; };
  const bagUsed = () => Object.keys(S.bag).filter(id => S.bag[id] > 0 && bagSlot(id)).length;
  const bagMax = () => BAG.slots + BAG.per_buy * (S.bagBuys || 0);
  const bagCost = () => Math.round(BAG.cost_base * Math.pow(BAG.cost_step, S.bagBuys || 0) / 10) * 10;
  // Anything already in the bag can always grow. When there is no room left, junk Smudge has not seen before
  // is left where it lies and he says so; treasure, crates, tonics and shards always come home.
  function give(id, n) {
    const it = OS.items[id];
    if (!S.bag[id] && it && it.junk && bagUsed() >= bagMax()) { bagFull(it); return false; }
    S.bag[id] = (S.bag[id] || 0) + (n || 1); return true;
  }
  let fullSaid = 0;
  function bagFull(it) { if (now() - fullSaid < 20000) return; fullSaid = now();
    toast(`The bag is full, so Smudge left the ${(it.name || 'junk').toLowerCase()} where it was. Sell something, or buy more room in the bag.`); }
  // ---- the cabinet: one of each treasure on display. Every piece makes all ink worth a little more, for good;
  //      finish a place's set and everybody works faster there.
  const CAB = R.cabinet || { ink_per: 0.005, set_speed: 0.1 };
  // ---- pacing: fresh crew, rebirth, shards, weekly contracts
  const REST = R.rested || { hours: 4, mult: 2, base: 0.65 }, RB = R.rebirth || { max: 10, xp_per: 0.1, ink_per: 0.03 }, SH = R.shards, CT = R.contracts;
  const rebirths = sk => (S.rebirth && S.rebirth[sk]) || 0, rebirthTotal = () => R.skills.reduce((a, k) => a + rebirths(k), 0);
  function freshUp() { const d = new Date().toISOString().slice(0, 10); if (S.restDay !== d) { S.restDay = d; S.rest = REST.hours * 3600; } }
  // how much work `dt` seconds is worth: double while the crew is fresh, plain after
  function worked(dt) { freshUp(); if (!S.jobs.some(j => j)) return 0; const f = Math.min(dt, S.rest || 0); S.rest -= f; return (f * REST.mult + (dt - f)) * REST.base; }
  function rebirth(sk) {
    if (level(sk) < 99 || rebirths(sk) >= RB.max) return;
    if (!confirm(`Rebirth ${sk}? It goes back to level 1 and its places lock again until you re-earn them. In return: +${RB.xp_per * 100}% ${sk} xp and +${RB.ink_per * 100}% ink, for good.`)) return;
    S.rebirth[sk] = rebirths(sk) + 1; S.xp[sk] = 0;
    S.jobs.forEach((j, i) => { if (j && places[j.place] && !unlocked(places[j.place])) { const o = openPlaces().find(p => p.skill === sk) || openPlaces()[0]; if (o) j.place = o.id; else S.jobs[i] = null; } });
    Cloud.log('rebirth', sk); save(true); render(); toast(`${sk} reborn. That is rebirth ${S.rebirth[sk]}. The book pretends not to be impressed.`);
  }
  const week = () => { const d = new Date(); const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); return Math.floor((t / 86400000 + 3) / 7); };
  function contracts() {
    const w = week(); if (S.contracts && S.contracts.week === w) return S.contracts.list;
    const open = workPlaces.filter(unlocked), list = []; let seed = w * 7919 + 13; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < CT.count && open.length; i++) { const p = open.splice(Math.floor(rnd() * open.length), 1)[0]; list.push({ place: p.id, need: CT.need[i % CT.need.length], have: 0, paid: false, shards: CT.shards[i % CT.shards.length] }); }
    S.contracts = { week: w, list }; return list;
  }
  function claim(i) { const c = contracts()[i]; if (!c || c.paid || c.have < c.need) return; c.paid = true; bump('contracts'); give('x_shard', c.shards); give('x_crate'); save(true); render(); toast(`Contract done: ${c.shards} shards and a crate.`); }
  async function callByName(id) {
    const h = OS.heroes[id], cost = SH.cost[h.rarity], have = S.bag.x_shard || 0; if (S.roster[id] || have < cost) return;
    if (Cloud.dev) S.bag.x_shard = have - cost; else { const r = await srv(() => Cloud.call(id)); if (r.r !== 'ok') { toast(r.r); return; } }
    S.roster[id] = 1; Cloud.log('shard_call', id); save(true); modal.close(); render();
    const d = el('div', 'reveal'); d.innerHTML = `<div class="tag" style="font-size:1rem;color:${R.rarity_color[h.rarity]}">Called by name · ${OS.cap(h.rarity)}</div>`; d.appendChild(OS.card(h, { level: 1, stats: heroStats(id) })); d.appendChild(el('p', '', `<b>Smudge:</b> “${h.lines[MODES.indexOf(S.mode)]}”`)); d.appendChild(btn('', 'Find them somewhere to stand', modal.close)); modal.open(d);
  }
  function lockedSheet(id) {
    const h = OS.heroes[id], cost = SH.cost[h.rarity], have = S.bag.x_shard || 0, d = el('div', '');
    d.innerHTML = `<h3 style="font-size:1.5rem">Somebody you have not met</h3><p class="mut">A ${OS.cap(h.rarity)} stranger. Summoning might turn them up. Or spend shards and call them by name. Smudge calls it cheating, but it works.</p>
      <div class="kv"><span>Shards needed</span><b>${cost}</b></div><div class="kv"><span>Shards you have</span><b>${have}</b></div>
      <p class="mut" style="font-size:.85rem">Every duplicate summon gives ${SH.per_dupe} shard. Weekly contracts pay shards too.</p>`;
    const b = btn('', have >= cost ? `Call them by name (${cost} shards)` : `${cost - have} more shards needed`, () => callByName(id)); b.disabled = have < cost; d.appendChild(b); modal.open(d);
  }
  const treasures = Object.values(OS.items).filter(i => i.kind === 'loot' && !i.junk && i.id.indexOf('x_') !== 0);
  const inkBonus = () => 1 + Object.keys(S.cabinet || {}).length * CAB.ink_per + rebirthTotal() * RB.ink_per;
  const cabSet = pid => { const set = treasures.filter(i => i.place === pid); return set.length > 0 && set.every(i => S.cabinet[i.id]); };
  const cabReady = () => treasures.filter(i => !S.cabinet[i.id] && S.bag[i.id] > 0);
  function fillCabinet() { const add = cabReady(); add.forEach(i => { S.bag[i.id]--; S.cabinet[i.id] = 1; }); if (add.length) { save(true); render(); toast(`${add.length} new ${add.length === 1 ? 'piece' : 'pieces'} on display. Ink is now worth ${Math.round((inkBonus() - 1) * 1000) / 10}% more.`); } }
  const owns = id => (S.bag[id] || 0) > 0 || Object.values(S.equip).some(e => e.includes(id)) || Object.values(S.gear).some(g => Object.values(g).includes(id));
  function gainXP(sk, n, quiet) {
    const b = level(sk); S.xp[sk] = (S.xp[sk] || 0) + Math.round(n * (1 + rebirths(sk) * RB.xp_per)); const a = level(sk);
    if (a >= 99 && b < 99 && !quiet && rebirths(sk) < RB.max) toast(`${sk} has hit 99. Rebirth is open in your account.`);
    if (a > b && !quiet) { SND('levelup'); toast(`${sk} is now level ${a}`); R.perks.forEach(p => { if (p.level > b && p.level <= a) toast(`New perk: ${p.name}. ${p.text}.`); }); R.places.forEach(p => { if (p.skill === sk && p.level > b && p.level <= a) toast(`New place open: ${p.name}`); }); }
  }
  // one finished action of one job
  function doAction(j, quiet) {
    const p = places[j.place], t = R.tier[p.tier], drops = [];
    if (CT) contracts().forEach(c => { if (c.place === j.place && c.have < c.need) c.have++; });
    const inkGot = t.ink * R.web.ink_mult * inkBonus() * (1 + crewFx('ink')); bump('hauls_' + p.skill); bump('ink', inkGot);
    S.actions++; S.ink += inkGot; gainXP(p.skill, Math.round(t.xp * R.web.xp_mult * (1 + tonic('xp') + crewFx('xp'))), quiet);
    crew().forEach(id => { const m = S.mastery[id] || (S.mastery[id] = {}); m[p.skill] = (m[p.skill] || 0) + R.jobs.mastery_xp; });
    PEND.push([p.id, fullLuck(p, jobLuck(j)), 1, Math.round(perk(p.skill, 'double') * 100) / 100]);   // the server decides whether this haul found anything, and what
    return drops;
  }
  const WANDER = (R.jobs.wander_minutes || 15) * 60; let jobsMoved = false;
  const ORDERS = { stay: ['Stay', 'Keeps working this spot.'], wander: ['Wander', `Moves to the next open place every ${R.jobs.wander_minutes || 15} minutes, so every skill gets a turn.`], hunt: ['Hunt', `Goes wherever the things you still lack are most likely to turn up, and looks again every ${R.jobs.wander_minutes || 15} minutes.`] };
  const openPlaces = () => workPlaces.filter(unlocked);
  function nextPlace(j) { const o = openPlaces(); if (!o.length) return j.place; return o[(o.findIndex(p => p.id === j.place) + 1) % o.length].id; }
  const owned = id => S.cabinet[id] || owns(id);
  function huntPlace(j) {
    let best = j.place, top = 0;
    openPlaces().forEach(p => { const luck = jobLuck(); let sc = 0; p.loot.forEach(([id]) => { const it = OS.items[id]; if (it && !it.junk && !owned(id)) sc += dropChance(p, id, luck) * (it.owner && S.roster[it.owner] ? 3 : 1); }); if (sc > top + 1e-9) { top = sc; best = p.id; } });
    return best;
  }
  // when the ink is full, Smudge goes home and summons on his own (a setting)
  let autoGot = [], autoBusy = false, autoWait = 0;
  function autoSummon(quiet) {
    if (summoning || S.ink < summonCost()) return;
    if (!quiet && current === 'summon') { summon(); return; }
    if (autoBusy || now() < autoWait) return; autoBusy = true;
    drawSummons(25, true).then(res => { autoBusy = false; if (!res.length) { autoWait = now() + 30000; return; } save(true);
      toast(`Smudge went home and summoned ${res.slice(0, 6).map(r => r.h.name + (r.had ? '' : ' (new)')).join(', ')}${res.length > 6 ? ' and ' + (res.length - 6) + ' more' : ''}.`); render(); }, () => { autoBusy = false; autoWait = now() + 30000; });
  }
  function tickMeters() {
    const e = R.energy.regen_seconds * 1000; while (S.energy < R.energy.max && now() - S.energyT >= e) { S.energy++; S.energyT += e; } if (S.energy >= R.energy.max) S.energyT = now();
    const t = R.raids.regen_minutes * 60000; while (S.tickets < R.raids.tickets && now() - S.ticketT >= t) { S.tickets++; S.ticketT += t; } if (S.tickets >= R.raids.tickets) S.ticketT = now();
  }
  function advance(dt, quiet) {
    const found = [], wdt = worked(dt);
    S.jobs.forEach((j, i) => { if (!j || !places[j.place]) return;
      // standing orders: Wander moves on every so often, Hunt goes where the missing things are
      if (j.order && j.order !== 'stay') { j.since = (j.since || 0) + dt; let hops = 0; while (j.since >= WANDER && hops++ < 400) { j.since -= WANDER; const to = j.order === 'wander' ? nextPlace(j) : huntPlace(j); if (to && to !== j.place) { j.place = to; jobsMoved = true; } } }
      const t = jobTime(j); j.prog = (j.prog || 0) + wdt; let g = 0; while (j.prog >= t && g++ < 20000) { j.prog -= t; doAction(j, quiet).forEach(id => found.push([i, id])); } });
    tickMake(dt, quiet);
    S.crateT += dt; const every = R.crate.minutes * 60; while (S.crateT >= every) { S.crateT -= every; give('x_crate'); if (S.autoCrate && !quiet) openCrate(true); if (!quiet) toast(line('crate')); }
    if (S.autoSummon) autoSummon(quiet);
    tickMeters(); return found;
  }

  // ------------------------------------------------------------------ small UI helpers
  const toasts = []; let toasting = false;
  function toast(msg) { if (toasts.length < 6) toasts.push(msg); if (OS.Sound) OS.Sound.play('toast'); if (!toasting) nextToast(); }
  function nextToast() { const m = toasts.shift(); if (!m) { toasting = false; return; } toasting = true; const t = $('toast'); t.textContent = m; t.classList.add('on'); setTimeout(() => { t.classList.remove('on'); setTimeout(nextToast, 260); }, 2200); }
  // a sheet is a step in history too, so Back closes it
  const sheetEl = () => document.querySelector('#modal .sheet');
  const modal = { open(node, cls) { $('modal-body').innerHTML = ''; $('modal-body').appendChild(node); sheetEl().className = 'sheet' + (cls ? ' ' + cls : ''); sheetEl().scrollTop = 0; if (!$('modal').classList.contains('on')) { $('modal').classList.add('on'); history.pushState({ v: (history.state && history.state.v) || 'home', sheet: 1 }, ''); } },
    close() { if (!$('modal').classList.contains('on')) return; $('modal').classList.remove('on'); if (inRaid) { inRaid = null; tune(); } if (history.state && history.state.sheet) { closing = true; history.back(); } } };
  $('modal-x').onclick = modal.close; $('modal').addEventListener('click', e => { if (e.target === $('modal')) modal.close(); });
  const line = ev => { const l = OS.voice[S.mode][ev] || OS.voice[S.mode].idle; return l[Math.floor(Math.random() * l.length)]; };
  const fmt = s => s >= 3600 ? Math.floor(s / 3600) + 'h ' + Math.floor(s % 3600 / 60) + 'm' : s >= 60 ? Math.floor(s / 60) + 'm ' + Math.floor(s % 60) + 's' : Math.ceil(s) + 's';
  const pct = (a, b) => Math.max(0, Math.min(100, a / b * 100)) + '%';
  const summary = () => ({ heroes: Object.keys(S.roster).length, total_level: totalLevel(), gold: Math.floor(S.gold), ink: Math.floor(S.ink), summons: S.summons });
  let dirty = false, saving = false;
  // The server checks every save. If it refuses one (opened elsewhere, or numbers that could not have been earned) it sends back the last page it accepts.
  let busy = false;
  async function save(force) { S.last = now(); dirty = true; if (!force || saving || busy) return; saving = true; dirty = false; let r = null; try { r = await Cloud.save(S, summary()); } catch (e) { } saving = false; if (!r) dirty = true; else if (r.ok === false) refused(r); }
  function refused(r) { if (r.why === 'size') return; S = Object.assign(fresh(), r.data || {}); S.v = 3; S.mode = MODES.includes(S.mode) ? S.mode : 'salty'; S.last = now(); dirty = false;
    toast(r.why === 'stale' ? 'Smudge kept working on your other device. Caught up to the newest page.' : 'The ledger did not balance, so the last checked page was loaded.'); render(); }
  // Two devices, one ledger. Whenever this page comes back into view, and every 25 seconds while it is open, ask the
  // server which page it is on. If another device has played since, load its page quietly, so a phone never shows
  // crates the desktop already opened.
  async function sync() {
    if (Cloud.dev || saving || busy || document.hidden || $('modal').classList.contains('on')) return false;
    let rev = null; try { rev = await Cloud.peekRev(); } catch (e) { } if (rev == null || rev <= Cloud.rev) return false;
    let d = null; try { d = await Cloud.load(); } catch (e) { } if (!d) return false;
    S = Object.assign(fresh(), d); S.v = 3; S.mode = MODES.includes(S.mode) ? S.mode : 'salty'; dirty = false; render(); return true;
  }
  setInterval(sync, 25000); addEventListener('focus', sync);
  async function flush() { while (saving) await new Promise(r => setTimeout(r, 80)); await save(true); while (saving) await new Promise(r => setTimeout(r, 80)); }
  // anything that moves between players happens on the server's copy; it answers with the new numbers and we take them as they are
  async function srv(fn) { await flush(); busy = true; try { const r = await fn(); if (r && r.set) { Object.keys(r.set.bag || {}).forEach(k => S.bag[k] = r.set.bag[k]); if (r.set.gold != null) S.gold = r.set.gold; } return r || { r: 'Already done.' }; } catch (e) { return { r: 'Smudge cannot reach the city right now.' }; } finally { busy = false; } }
  Cloud.devS = () => S;
  // ---- the server rolls the dice. Every find, crate, expedition and raid prize is drawn on the server and put in its copy of the bag
  //      first; the game only shows what came back. (Local testing has no server, so it rolls here.)
  const fullLuck = (p, extra) => Math.round((level(p.skill) * R.loot.luck_per_level + perk(p.skill, 'luck') + (extra || 0)) * 100) / 100;
  const flat = add => Object.keys(add || {}).reduce((a, k) => a.concat(Array(add[k]).fill(k)), []);
  async function roll(list, cost) {
    list = list.filter(x => x && (x.n > 0 || x.hauls > 0)); if (!list.length && !cost) return { ids: [], add: {}, total: 0 };
    let r;
    if (Cloud.dev) { const add = {}, ids = []; list.forEach(x => { const p = places[x.place] || RIFT; const n0 = (x.n || 0) + Array.from({ length: x.hauls || 0 }).reduce(t => t + (Math.random() < R.web.loot_chance ? (Math.random() < (x.dbl || 0) ? 2 : 1) : 0), 0); for (let i = 0; i < n0; i++) { const gear = x.gear && p.loot.filter(([id]) => OS.items[id].kind === 'gear'); const id = gear && gear.length ? gear[Math.floor(Math.random() * gear.length)][0] : rollLootLocal(p, x.luck); add[id] = (add[id] || 0) + 1; if (ids.length < 80) ids.push([0, id]); } }); r = { r: 'ok', add, list: ids }; }
    else { if (cost) await flush(); while (saving || busy) await new Promise(k => setTimeout(k, 80)); busy = true; try { r = await Cloud.roll(list, cost); } catch (e) { r = null; } finally { busy = false; } }
    if (!r) return { ids: [], add: {}, total: 0, err: 'down' }; if (r.r !== 'ok') return { ids: [], add: {}, total: 0, err: r.r };
    let total = 0; Object.keys(r.add).forEach(k => { if (OS.items[k]) { give(k, r.add[k]); total += r.add[k]; } }); if (cost) S.bag[cost.item] = Math.max(0, (S.bag[cost.item] || 0) - 1);
    return { ids: (r.list || []).map(x => x[1]).filter(k => OS.items[k]), add: r.add, total };
  }
  // finds from work wait here for a second or two and go to the server in one batch
  const PEND = []; let rolling = false, rollWait = 0;
  async function pumpRolls() {
    if (rolling || busy || saving || !PEND.length) return; rolling = true; const take = PEND.splice(0), m = {};
    take.forEach(([pl, lk, n, dbl]) => { const k = pl + '|' + lk + '|' + dbl; (m[k] || (m[k] = { place: pl, luck: lk, dbl: dbl || 0, hauls: 0 })).hauls += n; });
    const r = await roll(Object.values(m).slice(0, 60)); rolling = false;
    if (r.err === 'down') { take.forEach(x => PEND.push(x)); rollWait = 15; return; } if (r.err) return;
    bump('finds', r.total); Object.keys(r.add).forEach(id => { const it = OS.items[id]; if (!it) return; bump('finds_' + it.rarity, r.add[id]); if (it.kind === 'gear') bump('gear_found', r.add[id]); });
    r.ids.slice(0, 6).forEach((id, k) => setTimeout(() => dropPop(id), k * 160));
    Object.keys(r.add).filter(id => OS.items[id] && rr(OS.items[id].rarity) >= 2 && !OS.items[id].junk).slice(0, 4).forEach(id => toast(`Smudge found: ${OS.items[id].name}${r.add[id] > 1 ? ' ×' + r.add[id] : ''}`));
    if (current === 'bag' || current === 'home') render();
  }
  const SND = (n, o) => { if (OS.Sound) OS.Sound.play(n, o); };
  const WORKSND = { Fishing: 'splash', Lockpicking: 'lock', Digging: 'dig' }, RAREUP = ['rare', 'epic', 'legendary', 'absurd', 'unhinged'];
  function dropPop(id) { const pop = document.querySelector('[data-pop="0"]'), it = OS.items[id]; if (!it) return;
    { const sm = jobPups.find(q => q && q.me); if (sm && RAREUP.includes(it.rarity)) sm.cheer(2); else if (sm && it.junk && Math.random() < .35) sm.sulk(1.4); }
    if (RAREUP.includes(it.rarity)) SND('rare'); else if (current === 'jobs' && S.jobs[0]) SND(WORKSND[places[S.jobs[0].place].skill] || 'haul', { vol: .7 }); const pp = jobPups[0]; if (pp) pp.kick('arm', 30); if (FX) FX.splash(); if (crewPups.length && !it.junk) crewPups[Math.floor(Math.random() * crewPups.length)].kick('arm', 30);
    if (pop) { const d = el('div', 'drop', `<img src="${OS.img('loot', it.icon)}" alt=""><span style="color:${R.rarity_color[it.rarity]}">${it.name}</span>`); pop.appendChild(d); setTimeout(() => d.remove(), 1900); } }
  const btn = (cls, text, fn) => { const b = el('button', 'btn ' + cls, text); b.onclick = fn; return b; };

  // ------------------------------------------------------------------ navigation
  // Every screen is a step in the browser's history, so Back and Forward (the browser's own, the phone's swipe-back,
  // and the arrow in the top bar) move between screens instead of leaving the game. An open sheet is a step too.
  let current = 'home', closing = false, queued = null;
  const START = (location.hash || '').slice(1);
  const VIEWS = ['home', 'jobs', 'summon', 'heroes', 'bag', 'workshop', 'training', 'raids', 'board', 'shop', 'account'], TABS = VIEWS.slice(0, 5);
  function show(v, how) {
    if (closing) { queued = [v, how]; return; }      // a sheet is still stepping back out of history: go there once it has
    if (!VIEWS.includes(v)) v = 'home'; how = how || {};
    const dir = how.dir || 0, was = current; current = v;
    document.querySelectorAll('.view').forEach(n => { n.classList.remove('fromL', 'fromR'); n.classList.toggle('on', n.id === 'v-' + v); });
    const el2 = $('v-' + v); if (dir) { void el2.offsetWidth; el2.classList.add(dir > 0 ? 'fromR' : 'fromL'); }
    document.querySelectorAll('#gnav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    $('go-back').hidden = v === 'home';
    if (!how.silent && v !== was) history.pushState({ v }, '', '#' + v);
    tune();
    render(); if (v === 'summon') sfx.layout(); scrollTo(0, 0);
  }
  // the music follows where you are: a battle theme on Raids, the place's own tune while watching Smudge work, the archive theme elsewhere
  const PLACETUNE = { dock: 'med', vault: 'med', bondi: 'sun', outback: 'sun', fjord: 'north', blackforest: 'north', speakeasy: 'jazz', closet: 'jazz' };
  // each boss fights to its own era: picked when you go in, back to the shuffled battle pool when you come out
  const BOSSTUNE = { tiber: 'b_ancient', tony: 'b_noir', vanguard: 'b_romp', gary: 'b_romp', nephew: 'b_noir', well: 'b_gothic', antlers: 'b_north', brenda: 'b_romp' };
  let inRaid = null;
  function tune() { if (!OS.Sound) return; const j = S.jobs[0];
    OS.Sound.music(inRaid ? (BOSSTUNE[inRaid] || 'battle') : current === 'raids' ? 'battle' : current === 'jobs' && j && PLACETUNE[j.place] ? PLACETUNE[j.place] : 'home'); }
  history.replaceState({ v: 'home' }, '', location.pathname + location.search + '#home');
  addEventListener('popstate', e => {
    if (closing) { closing = false; const q = queued; queued = null; if (q) show(q[0], q[1]); return; }
    if ($('modal').classList.contains('on')) { $('modal').classList.remove('on'); return; }      // Back closes an open sheet first
    show((e.state && e.state.v) || (location.hash || '#home').slice(1), { silent: true });
  });
  $('go-back').onclick = () => history.back();
  $('gnav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.v, { dir: Math.sign(VIEWS.indexOf(b.dataset.v) - VIEWS.indexOf(current)) }); });
  document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) show(b.dataset.go, { dir: b.dataset.go === 'home' ? -1 : 1 }); });
  // One thumb: swipe left or right anywhere on the page to move between the five main screens.
  (() => { let sx = 0, sy = 0, ok = false;
    addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
      ok = e.touches.length === 1 && !$('modal').classList.contains('on') && !e.target.closest('input,textarea,select,.noswipe,.plist,.chat,[data-noswipe]') && !(() => { for (let n = e.target; n && n !== document.body; n = n.parentElement) if (n.scrollWidth > n.clientWidth + 4 && /auto|scroll/.test(getComputedStyle(n).overflowX)) return true; return false; })(); }, { passive: true });
    addEventListener('touchend', e => { if (!ok) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * .6) return; const i = TABS.indexOf(current); if (i < 0) return;
      const k = i + (dx < 0 ? 1 : -1); if (k >= 0 && k < TABS.length) show(TABS[k], { dir: dx < 0 ? 1 : -1 }); }, { passive: true });
  })();
  OS.founder = !!(me.profile && me.profile.founder);   // the beta mark, worn on every card
  $('go-account').onclick = () => show('account');
  // beta: a note straight to the owner
  $('go-feedback').onclick = () => { const d = el('div', '');
    d.innerHTML = `<div class="tag">Closed beta</div><h3 style="font-size:1.5rem;margin:.2rem 0 .4rem">Got an idea, or found something broken?</h3><p class="mut">Tell Smudge. He passes every note to the person who makes the game, and it gets written down so we can get back to you. Be as blunt as you like.</p>
      <div class="seg" style="grid-template-columns:repeat(3,1fr);margin-top:.8rem"><button class="on" data-k="idea">An idea</button><button data-k="bug">Something broke</button><button data-k="other">Something else</button></div>
      <textarea id="fb-body" rows="6" maxlength="2000" placeholder="What happened, or what would you add?" style="width:100%;font:inherit;color:#fff;background:#0b1020;border:2px solid var(--line);border-radius:12px;padding:.7em .8em"></textarea><p class="ferr" id="fb-err" role="alert"></p>`;
    let kind = 'idea'; d.querySelectorAll('.seg button').forEach(b => b.onclick = () => { kind = b.dataset.k; d.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b)); });
    const row = el('div', 'row'); row.style.justifyContent = 'center';
    row.appendChild(btn('', 'Send it', async e => { const body = d.querySelector('#fb-body').value.trim(), er = d.querySelector('#fb-err'); if (body.length < 3) { er.textContent = 'Write a little more than that.'; return; }
      e.target.disabled = true; let r; try { const q = await Cloud.sb.rpc('os2_feedback_send', { p_kind: kind, p_body: body }); r = q.error ? { ok: false, why: 'Smudge cannot reach the city right now.' } : q.data; } catch (x) { r = { ok: false, why: 'Smudge cannot reach the city right now.' }; }
      if (r && r.ok) { modal.close(); toast('Sent. Thank you. Smudge has filed it under Important.'); } else { er.textContent = (r && r.why) || 'That did not send.'; e.target.disabled = false; } }));
    row.appendChild(btn('ghost', 'Never mind', () => modal.close())); d.appendChild(row); modal.open(d); };
  function renderTop() { $('r-ink').textContent = OS.num(S.ink); $('r-gold').textContent = OS.num(S.gold); $('r-energy').textContent = S.energy; }

  // ------------------------------------------------------------------ home (the dashboard)
  const GUIDE = [['Summon somebody', 'Smudge has enough ink for one stranger. Go to the Archive and press Summon.', 'summon', () => S.summons > 0],
    ['Put Smudge to work', 'Open Work, send Smudge somewhere, and stand an arrival behind him as crew.', 'jobs', () => S.jobs.some(j => j)],
    ['Dress them', 'When gear turns up, open an arrival from Arrivals and tap a glowing slot on the back of their card.', 'heroes', () => Object.values(S.equip).some(e => e.some(g => g)) || Object.values(S.gear).some(g => Object.values(g).some(x => x))]];
  function renderHome() {
    const hr = new Date().getHours(); $('h-day').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    $('h-hi').textContent = (hr < 12 ? 'Morning' : hr < 18 ? 'Afternoon' : 'Evening') + ', ' + me.profile.username; if (!renderHome.at || now() - renderHome.at > 20000) { renderHome.at = now(); $('h-sub').textContent = line('idle'); }
    $('adminbtn').hidden = !me.admin;
    const g = $('guide'), left = GUIDE.filter(s => !s[3]()); g.hidden = !left.length;
    if (left.length) { g.innerHTML = '<div class="tag">Getting started</div>' + GUIDE.map((s, i) => `<div class="gstep ${s[3]() ? 'done' : ''}"><i>${s[3]() ? '✓' : i + 1}</i><div><b>${s[0]}</b><span>${s[1]}</span></div><button class="btn small ${s[3]() ? 'ghost' : ''}" data-go="${s[2]}">${s[3]() ? 'Done' : 'Go'}</button></div>`).join(''); }
    $('h-stats').innerHTML = [['Arrivals met', Object.keys(S.roster).length], ['Total level', totalLevel()], ['Hauls', OS.num(S.actions)], ['Raid tickets', S.tickets + ' / ' + R.raids.tickets], ['Crates', S.bag.x_crate || 0]].map(([a, b]) => `<div class="stat"><b>${b}</b><span>${a}</span></div>`).join('');
    const comp = (() => { const g = Object.values(OS.items).filter(i => i.kind === 'gear' && (!i.retired || owns(i.id))), parts = [[Object.keys(S.roster).length, R.heroes.length], [Object.keys(S.cabinet).length, treasures.length], [g.filter(i => owns(i.id)).length, g.length], [Object.keys(S.raids).length, R.raids.bosses.length], [Math.min(99 * 4, totalLevel()), 99 * 4]]; return parts.reduce((t, [a, b]) => t + a / b, 0) / parts.length * 100; })();
    let cp = $('h-comp'); if (!cp) { cp = el('div', 'panel'); cp.id = 'h-comp'; cp.style.marginBottom = '1rem'; $('h-stats').after(cp); }
    cp.innerHTML = `<div class="spread"><h3 style="margin:0">The whole ledger</h3><b style="font:400 1.5rem 'Lilita One';color:#f3b930">${comp.toFixed(1)}%</b></div><div class="bar" style="margin-top:.5rem"><i style="width:${comp}%;background:linear-gradient(90deg,#c98a18,#f3b930)"></i></div><p class="mut" style="margin:.4rem 0 0;font-size:.85rem">Heroes met, cabinet, gear found, bosses beaten and levels, all in one number.</p>`;
    freshUp(); let pc = $('h-pace'); if (!pc) { pc = el('div', 'panel'); pc.id = 'h-pace'; pc.style.marginBottom = '1rem'; $('h-stats').after(pc); pc.addEventListener('click', e => { const b = e.target.closest('[data-claim]'); if (b) claim(+b.dataset.claim); }); }
    const fr = S.rest > 0, list = CT ? contracts() : [];
    pc.innerHTML = `<div class="spread"><h3 style="margin:0">${fr ? 'The crew is fresh' : 'The crew is at a steady pace'}</h3><span class="mut">${fr ? 'double speed for ' + fmt(S.rest) + ' more of work' : 'fresh again tomorrow'}</span></div>
      <div class="bar" style="margin:.5rem 0 .9rem"><i style="width:${pct(S.rest, REST.hours * 3600)}"></i></div>
      <div class="tag">This week's contracts</div>` + (list.length ? list.map((c, i) => `<div class="spread" style="margin-top:.45rem;gap:.8rem"><span style="flex:1"><b style="color:#fff">${Math.min(c.have, c.need)} / ${c.need}</b> hauls at ${places[c.place].name}<div class="bar" style="margin-top:.25rem"><i style="width:${pct(c.have, c.need)}"></i></div></span>${c.paid ? '<span class="mut">Paid</span>' : `<button class="btn small" data-claim="${i}" ${c.have < c.need ? 'disabled' : ''}>${c.shards} shards + crate</button>`}</div>`).join('') : '<p class="mut">Contracts open once a work place is unlocked.</p>');
    const box = $('h-jobs'); box.innerHTML = '';
    const jw = S.jobs[0]; if (!jw) box.appendChild(el('p', 'mut', 'Smudge is not working. He is reading. That is not the same thing.'));
    else { const p = places[jw.place], row = el('div', 'hjob'); row.innerHTML = `<img src="/assets/v2/smudge/stamp.webp${OS.VER}" alt=""><div><b>Smudge</b><span class="mut">${p.skill} at ${p.name} · crew of ${crew().length}</span><div class="bar"><i data-job="0"></i></div></div>`; box.appendChild(row); }
    S.exped.forEach(e => { const h = OS.heroes[e.hero], row = el('div', 'hjob'), left = (e.end - now()) / 1000; row.innerHTML = `<img src="${OS.img('heroes', e.hero)}" alt=""><div><b>${h.name}</b><span class="mut">${left > 0 ? 'Away in ' + h.era + ' · back in ' + fmt(left) : 'Back from ' + h.era + ', with things'}</span><div class="bar"><i style="width:${pct(e.dur - Math.max(0, left), e.dur)}"></i></div></div>`; box.appendChild(row); });
    const cost = summonCost(); $('h-inkbar').style.width = pct(S.ink, cost); $('h-inkpct').textContent = Math.floor(Math.min(1, S.ink / cost) * 100) + '%';
    $('h-inktext').textContent = S.ink >= cost ? 'The bottle is full. Somebody is about to have a very strange day.' : `${OS.num(cost - S.ink)} more ink until the next stranger.`;
    const tl = R.tonics.filter(t => (S.tonics[t.effect] || 0) > now()); $('h-tonics').innerHTML = tl.length ? tl.map(t => `<div class="spread"><span><b style="color:#fff">${t.name}</b> · ${t.text}</span><b>${fmt((S.tonics[t.effect] - now()) / 1000)}</b></div>`).join('') : 'None. Brew one in the Workshop.';
    $('t-raids').textContent = S.tickets ? `${S.tickets} ticket${S.tickets > 1 ? 's' : ''} ready.` : 'Next ticket in ' + fmt((R.raids.regen_minutes * 60000 - (now() - S.ticketT)) / 1000);
  }

  // ------------------------------------------------------------------ jobs
  const POSE = { Fishing: 'fish', Lockpicking: 'pick', Digging: 'dig' };
  function renderJobs() {
    const box = $('joblist'); jobPups.forEach(p => p && p.destroy()); jobPups = []; crewPups = []; if (FX) { FX.destroy(); FX = null; } box.innerHTML = ''; const j = S.jobs[0], n = crewSlots();
    $('j-slots').textContent = j ? `crew ${crew().length} of ${n} · away ${S.exped.length} of ${expSlots()}` : 'Smudge is idle';
    // ---- Smudge at work
    const card = el('div', 'job work');
    if (!j) { card.classList.add('empty'); card.innerHTML = `<div class="jl"><b>Smudge is not working</b><span class="mut">Tap to send him somewhere. He does the fishing, the lockpicking and the digging himself, one place at a time.</span></div>`; card.onclick = placeSheet; box.appendChild(card); }
    else {
      const p = places[j.place], t = jobTime(j);
      card.innerHTML = `<div class="jscene big"><img class="sc" src="${OS.img('scenes', p.id)}" alt=""><div class="who" data-who="0"></div><div class="jpop" data-pop="0"></div></div>
        <div class="jl"><div class="tag">${p.era} · ${p.skill}${j.order === 'wander' ? ' · wandering' : j.order === 'hunt' ? ' · hunting' : ''}</div><b>Smudge at ${p.name}</b><div class="bar"><i data-job="0"></i></div>
        <div class="spread mut"><span>one haul every ${t.toFixed(1)}s${S.rest > 0 ? ' · crew is fresh' : ''}</span><span data-next="0"></span></div>
        <div class="row" style="margin-top:.6rem;flex-wrap:wrap"></div></div>`;
      const r = card.querySelector('.row'); r.append(btn('small', 'Move him', placeSheet), btn('small ghost', 'What drops here', () => lootSheet(p, modal.close)), btn('small ghost', 'Bring him home', () => { S.jobs = []; save(true); render(); }));
      box.appendChild(card);
      // everybody's spot and size come from the stage (js/stage.js), the same table the dashboard uses
      const host = card.querySelector('.who'), H = host.clientHeight, pose = POSE[p.skill] || 'stamp', lay = OS.Stage.layout(p.id, OS.Stage.rect(p.id, host.clientWidth, H), pose);
      const rect = OS.Stage.rect(p.id, host.clientWidth, H); FX = new OS.SceneFX(host, p.id, rect);
      // back to front, so whoever stands lower in the picture is drawn in front
      const cast = crew().map((id, k) => ({ id, q: lay.crew[k] })).concat([{ q: lay.smudge }]).sort((a, c) => a.q.at[1] - c.q.at[1]);
      cast.forEach(m => { const [x, y] = m.q.at;
        if (m.id) { const pp = OS.heroPuppet(host, m.id, m.q.h); if (pp) { pp.flip = OS.Stage.flip(m.id, m.q.face); pp.place(x, y); jobPups.push(pp); pp.id = m.id; pp.tall = m.q.h; pp.wide = m.q.h * OS.rig['h_' + m.id].size[0] / OS.rig['h_' + m.id].size[1]; crewPups.push(pp); } }
        else { const se = OS.rig[pose], sm = new OS.Puppet(host, pose, m.q.h / se.size[1]); sm.place(x, y); sm.me = true; sm.tall = m.q.h; sm.wide = m.q.h; jobPups.push(sm); if (!hiDone) { hiDone = true; sm.hello(); } } });
      if (p.skill === 'Fishing') FX.rod(OS.Stage.rodTip('fish', lay.smudge.at, lay.smudge.h, OS.rig));
      if (lay.crate) FX.crate([lay.smudge.at[0] - lay.smudge.h * .29, lay.smudge.at[1] - lay.smudge.h * .11], lay.smudge.h * .6);
      jobPups.sort((a, c) => (c.me ? 1 : 0) - (a.me ? 1 : 0));
    }
    // ---- the crew
    const cw = el('div', 'panel crewp'); cw.innerHTML = `<div class="spread"><h3 style="margin:0">Crew</h3><span class="mut">They stand behind him. They do not do the work; they make him better at it.</span></div><div class="cw3"></div>`;
    const cr = cw.querySelector('.cw3');
    R.jobs.crew_slots.forEach((need, i) => { const id = S.crew[i], open = i < n, c = el('button', 'cwslot' + (open ? '' : ' lock')); c.type = 'button';
      if (!open) c.innerHTML = `<span class="mut">Opens at total level ${need}</span>`;
      else if (id && S.roster[id]) { const h = OS.heroes[id], st = heroStats(id), pl = j && places[j.place]; c.classList.add('r-' + h.rarity);
        c.innerHTML = `<img src="${OS.img('heroes', id)}" alt=""><span><b>${h.name}</b><em>+${Math.round(st.speed / R.jobs.crew_speed_div * 100)}% speed · +${Math.round(st.luck / R.jobs.crew_luck_div * 100)}% luck${pl ? ' · mastery ' + mastery(id, pl.skill) : ''}</em></span>`; }
      else c.innerHTML = `<i>+</i><span><b>Empty</b><em>Tap to stand somebody here</em></span>`;
      if (open) c.onclick = () => crewSheet(i); cr.appendChild(c); });
    box.appendChild(cw);
    // ---- expeditions
    const ex = el('div', 'panel'); ex.innerHTML = `<div class="spread"><h3 style="margin:0">Expeditions</h3><span class="mut">${S.exped.length} of ${expSlots()} away</span></div><p class="mut" style="margin:.3rem 0 .7rem;font-size:.9rem">Anybody not in the crew can go back through the rift for a while and bring home whatever they find, plus the story of how they found it.</p><div class="exlist"></div>`;
    const xl = ex.querySelector('.exlist');
    S.exped.forEach((e, i) => { const h = OS.heroes[e.hero], left = (e.end - now()) / 1000, row = el('div', 'exrow2 r-' + h.rarity);
      row.innerHTML = `<img src="${OS.img('heroes', e.hero)}" alt=""><div><b>${h.name}</b><span class="mut">${left > 0 ? h.era + ' · back in <span data-exleft="' + i + '">' + fmt(left) + '</span>' : 'Back from ' + h.era}</span><div class="bar"><i data-ex="${i}" style="width:${pct(e.dur - Math.max(0, left), e.dur)}"></i></div></div>`;
      const b = btn('small' + (left > 0 ? ' ghost' : ''), left > 0 ? 'Call back' : 'See what they found', () => left > 0 ? recall(i) : collect(i)); row.appendChild(b); xl.appendChild(row); });
    if (!expSlots()) xl.appendChild(el('p', 'mut', `Opens at total level ${R.exped.slots.find(t => t > 0)}.`));
    else if (S.exped.length < expSlots()) { const r = el('div', 'row'); r.appendChild(btn('small', 'Send somebody', expedSheet)); xl.appendChild(r); }
    box.appendChild(ex);
  }
  let jobPups = [], crewPups = [], chatT = 6, FX = null, hiDone = false;
  // ---- crew chatter: one voice at a time. Somebody says a line; now and then one other answers. Never a pile-up.
  let CHAT = {}; fetch('/data/chatter.json' + OS.VER).then(r => r.json()).then(j => CHAT = j).catch(() => { });
  const pickLine = (id, kind) => { const l = (CHAT[id] || {})[kind]; return l && l.length ? l[Math.floor(Math.random() * l.length)] : null; };
  function crewSay(pp, text, hold) {
    const host = document.querySelector('[data-who="0"]'); if (!host || !text) return;
    const box = q => ({ x0: q.x - q.wide * .4, x1: q.x + q.wide * .4, y0: q.y - q.tall, y1: q.y });
    OS.Stage.say(host, { x: pp.x, top: pp.y - pp.tall }, text, hold, jobPups.filter(q => q !== pp).map(box));
    pp.say((hold || OS.Stage.holdFor(text)) / 1000 - .3);
    // Smudge turns to whoever is talking
    const me = jobPups.find(q => q && q.me), r = host.getBoundingClientRect(); if (me && me !== pp) me.lookAt(r.left + pp.x, r.top + pp.y - pp.tall * .8, Math.min(4, (hold || OS.Stage.holdFor(text)) / 1000));
  }
  function chatter(dt) {
    if (current !== 'jobs' || !crewPups.length || $('modal').classList.contains('on')) return; chatT -= dt; if (chatT > 0) return; chatT = 11 + Math.random() * 10;
    const a = crewPups[Math.floor(Math.random() * crewPups.length)]; crewSay(a, pickLine(a.id, 'say'));
    const others = crewPups.filter(x => x !== a); if (others.length && Math.random() < 0.45) { const b = others[Math.floor(Math.random() * others.length)]; setTimeout(() => { if (current === 'jobs') crewSay(b, pickLine(b.id, 'reply')); }, 5200); chatT += 7; }
  }
  function placeSheet() {
    const j = Object.assign({ place: null, prog: 0, order: 'stay', since: 0 }, S.jobs[0] || {}), d = el('div', '', `<h3 style="font-size:1.5rem">Where should Smudge work?</h3>`);
    const ps = el('div', 'plist');
    workPlaces.forEach(p => { const open = unlocked(p), row = el('div', 'prow' + (open ? '' : ' lock'));
      row.innerHTML = `<img src="${OS.img('scenes', p.id)}" alt=""><div><div class="tag">${p.era} · ${p.skill}</div><h3>${p.name}</h3><p>${open ? p.blurb : 'Needs ' + p.skill + ' level ' + p.level + '.'}</p></div>`;
      const acts = el('div', 'row acts'); if (open) acts.appendChild(btn('small', 'Send now', e => { e.stopPropagation(); j.place = p.id; upd(); go.click(); }));
      acts.appendChild(btn('small ghost', 'What drops here', e => { e.stopPropagation(); lootSheet(p, placeSheet); })); row.appendChild(acts);
      if (open) row.onclick = () => { j.place = p.id; upd(); }; row.dataset.id = p.id; ps.appendChild(row); });
    d.appendChild(ps);
    d.appendChild(el('div', 'tag', 'Standing orders')).style.marginTop = '1rem';
    const os = el('div', 'orders'), oh = el('p', 'mut', ''); oh.style.cssText = 'margin:.4rem 0 0;font-size:.9rem'; os.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap';
    Object.keys(ORDERS).forEach(k => { const b = el('button', 'btn small ghost', ORDERS[k][0]); b.type = 'button'; b.dataset.o = k; b.onclick = () => { j.order = k; upd(); }; os.appendChild(b); });
    d.append(os, oh);
    const go = btn('', 'Send him', () => { if (!j.place) return; j.prog = 0; j.since = 0; if (j.order === 'hunt') j.place = huntPlace(j); S.jobs = [j]; save(true); modal.close(); render(); tune(); SND('confirm'); toast(`Smudge is off to ${places[j.place].name}.`); }), row = el('div', 'row'); row.style.marginTop = '1rem'; row.appendChild(go); d.appendChild(row);
    function upd() { const ord = j.order || 'stay'; os.querySelectorAll('button').forEach(b => { const on = b.dataset.o === ord; b.classList.toggle('ghost', !on); b.setAttribute('aria-pressed', on); }); oh.textContent = ORDERS[ord][1];
      ps.querySelectorAll('.prow').forEach(r => r.classList.toggle('here', r.dataset.id === j.place)); go.disabled = !j.place; }
    upd(); modal.open(d);
  }
  // Picking anyone, anywhere: the cards carry their real numbers, so the choice can be made from the card itself.
  // `hi` marks a stat green or red when something about the job cares about it.
  function heroPick(title, sub, ok, onPick, extra, hi) {
    const d = el('div', '', `<h3 style="font-size:1.5rem">${title}</h3><p class="mut">${sub}</p>`), hs = el('div', 'heroes pick');
    Object.keys(S.roster).sort((a, c) => power(c) - power(a)).forEach(id => { const c = OS.card(OS.heroes[id], { mini: true, level: cardLevel(S.roster[id]), stats: heroStats(id), hi }), why = ok(id);
      if (why) { c.classList.add('busy'); c.title = why; const lb = el('span', 'restlbl', why); if (resting(id)) { lb.dataset.rest = id; restTick(lb); } else if (away(id)) { lb.dataset.away = id; restTick(lb); } c.appendChild(lb); } c.onclick = () => { if (!why) onPick(id); else toast(why); }; hs.appendChild(c); });
    d.appendChild(hs); if (extra) d.appendChild(extra); modal.open(d);
  }
  function crewSheet(i) {
    const cur = S.crew[i], row = el('div', 'row'); row.style.marginTop = '1rem'; if (cur) row.appendChild(btn('small ghost', 'Stand them down', () => { S.crew[i] = null; save(true); modal.close(); render(); }));
    heroPick('Who stands here?', 'Speed makes Smudge faster. Luck brings up better things. Their gear bonuses count, and they get better at each trade the longer they stand at it.',
      id => away(id) ? 'Away on an expedition.' : S.crew.some((x, k) => x === id && k !== i) ? 'Already in the crew.' : '', id => { S.crew[i] = id; save(true); modal.close(); render(); }, row, { speed: 'good', luck: 'good' });
  }
  // everything this one has done: expeditions and raids, newest first
  function journalSheet(id) {
    const h = OS.heroes[id], log = ((S.journal || {})[id] || []).slice().reverse();
    const d = el('div', '', `<div class="tag">${h.era} · ${h.species}</div><h3 style="font-size:1.5rem;margin:.1rem 0 .2rem">${h.name}'s journal</h3>
      <p class="mut">What Smudge has written down about them. Expeditions and raids both end up here.</p>`);
    if (!log.length) d.appendChild(el('p', 'mut', 'Nothing yet. Send them home on an expedition, or take them on a raid.'));
    else { const list = el('div', 'jlog'); log.forEach(x => { const r = el('div', 'jent ' + (x.k === 'raid' ? 'raid' : 'exp'));
      r.innerHTML = `<time>${new Date(x.d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time><p></p>`;
      r.querySelector('p').textContent = x.t; list.appendChild(r); }); d.appendChild(list); }
    const row = el('div', 'row'); row.style.marginTop = '1rem'; row.appendChild(btn('small ghost', 'Back', () => heroSheet(id))); d.appendChild(row); modal.open(d);
  }

  function expedSheet() {
    let hours = R.exped.hours[1]; const row = el('div', 'row'); row.style.cssText = 'margin-top:1rem;flex-wrap:wrap;gap:.5rem';
    R.exped.hours.forEach(h => { const b = btn('small' + (h === hours ? '' : ' ghost'), h + (h === 1 ? ' hour' : ' hours'), () => { hours = h; row.querySelectorAll('button').forEach(x => x.classList.toggle('ghost', x !== b)); }); row.appendChild(b); });
    heroPick('Send somebody through the rift', 'Each of them has a place the ledger keeps pulling them back to. They go there alone and return with treasure, junk and gear from it, and a story. Longer trips bring more. Luck helps.',
      id => S.crew.includes(id) ? 'In the crew. Stand them down first.' : away(id) ? 'Already away.' : '', id => { const dur = hours * 3600; S.exped.push({ hero: id, end: now() + dur * 1000, dur }); save(true); modal.close(); render(); toast(`${OS.heroes[id].name} has gone to ${places[OS.heroes[id].place].name}.`); }, row, { luck: 'good', speed: 'good' });
  }
  async function haul(e, frac) {
    const h = OS.heroes[e.hero], p = places[h.place], hrs = e.dur / 3600 * frac, st = heroStats(e.hero), luck = st.luck / R.jobs.luck_div + fx(e.hero, 'luck');
    const n = Math.max(frac >= 1 ? 1 : 0, Math.round(hrs * R.exped.rolls_per_hour * (1 + st.speed / 200))); let k = 0; if (RIFT && h.rift) for (let i = 0; i < n; i++) if (Math.random() < R.rift.exped_chance) k++;
    const r = await roll([{ place: p.id, n: n - k, luck: fullLuck(p, luck) }, { place: 'archive', n: k, luck: fullLuck(RIFT || p, luck) }]); if (r.err) return null;
    bump('finds', r.total); const got = flat(r.add).filter(id => OS.items[id]);
    const ink = Math.round(hrs * R.exped.ink_per_hour * inkBonus() * (1 + fx(e.hero, 'ink'))); S.ink += ink; bump('ink', ink); bump('expeditions');
    const m = S.mastery[e.hero] || (S.mastery[e.hero] = {}); m[p.skill] = (m[p.skill] || 0) + Math.round(hrs * R.exped.mastery_per_hour);
    return { got, ink, h, p };
  }
  // ---- what happened while they were away. Three beats from the place they went to, picked once and written
  //      into their journal, so the story in the sheet and the story in the journal are the same story.
  function expStory(e, r, early) {
    const B = (EXP && EXP.beats[r.p.id]) || (EXP && EXP.beats.archive) || null, T = (EXP && EXP.tone) || {};
    const rare = r.got.some(id => RAREUP.includes(OS.items[id].rarity));
    const rich = r.got.length >= Math.max(4, Math.round(e.dur / 3600 * R.exped.rolls_per_hour * .7));
    const fill = t => fillIn(t, { name: short(e.hero), place: r.p.name, era: r.h.era, n: r.got.length, ink: OS.num(r.ink) });
    const lines = [];
    if (B) { lines.push(fill(pick1(B.open))); lines.push(fill(pick1(B.turn))); lines.push(fill(pick1((rich ? B.end.good : B.end.poor)))); }
    const v = EXP && EXP.voice && EXP.voice[e.hero]; if (v && v.length) lines.push(short(e.hero) + ': ' + fill(pick1(v)));
    const tone = early ? T.early : rare ? T.rare : rich ? T.rich : r.got.every(id => OS.items[id].junk) ? T.junk : T.thin;
    if (tone && tone.length) lines.push(fill(pick1(tone)));
    return lines;
  }
  // every hero keeps a journal: expeditions and raids, newest last, capped so a save cannot grow forever
  function journal(id, text, kind) {
    S.journal = S.journal || {}; const j = S.journal[id] || (S.journal[id] = []);
    j.push({ d: Date.now(), t: text, k: kind || 'exp' }); while (j.length > 40) j.shift();
  }
  function showHaul(r, early, lines) {
    const d = el('div', 'expback', `<div class="raidhead small" style="background-image:url(${OS.img('scenes', r.p.id)})"><div><div class="tag">${r.p.name} · ${r.p.era}</div><h3>${r.h.name} is back</h3></div></div>`);
    const story = el('div', 'rstory exps'); d.appendChild(story);
    const tail = el('div'); d.appendChild(tail);
    modal.open(d);
    const wait = ms => new Promise(ok => setTimeout(ok, ms));
    (async () => {
      for (const t of (lines || [])) {
        if (!document.body.contains(story)) return;
        const pp = el('p', 'rline scene', t); story.appendChild(pp); story.scrollTop = story.scrollHeight;
        requestAnimationFrame(() => pp.classList.add('in')); await wait(RD.line_ms || 1300);
      }
      if (!document.body.contains(story)) return;
      tail.innerHTML = `<p class="mut" style="margin:.8rem 0 .4rem">${early ? 'Called back early, so a lighter load. ' : ''}${r.got.length} things and ${OS.num(r.ink)} ink.</p>`;
      const g = el('div', 'itemrow'), cnt = {};
      r.got.forEach(id => cnt[id] = (cnt[id] || 0) + 1);
      Object.keys(cnt).sort((a, c) => rr(OS.items[c].rarity) - rr(OS.items[a].rarity) || (OS.items[a].junk ? 1 : 0) - (OS.items[c].junk ? 1 : 0)).forEach(id => g.appendChild(OS.slot(id, { count: cnt[id] })));
      tail.appendChild(g); const row = el('div', 'row'); row.style.marginTop = '1rem'; row.appendChild(btn('', 'Good', modal.close)); tail.appendChild(row);
      SND(r.got.length ? 'haul' : 'toast');
    })();
  }
  const noLedger = () => toast('Could not reach the ledger just now. Nothing was lost; try again in a moment.');
  async function finishExped(e, frac, early) {
    e.busy = 1; const r = await haul(e, frac); delete e.busy; if (!r) return noLedger();
    await expReady; const lines = expStory(e, r, early);
    journal(e.hero, `${early ? 'Called home early from' : 'Back from'} ${r.p.name}: ${r.got.length} things, ${OS.num(r.ink)} ink. ${lines[lines.length - 1] || ''}`.trim(), 'exp');
    S.exped.splice(S.exped.indexOf(e), 1); save(true); render(); showHaul(r, early, lines);
  }
  async function collect(i) { const e = S.exped[i]; if (!e || e.end > now() || e.busy) return; await finishExped(e, 1, false); }
  async function recall(i) { const e = S.exped[i]; if (!e || e.busy) return; await finishExped(e, Math.max(0, 1 - (e.end - now()) / 1000 / e.dur) * .8, true); }
  function lootSheet(p, back) {
    const d = el('div', '', `<div class="tag">${p.era} · ${p.skill}</div><h3 style="font-size:1.6rem">${p.name}</h3><p class="mut">Everything that can turn up here. Things you have not found yet stay in shadow. Skill level, perks, a lucky arrival and the right tonic all push the odds toward the good stuff.</p>`);
    ['Treasure', 'Signature gear'].forEach((title, gi) => { const rows = p.loot.filter(([id]) => (OS.items[id].kind === 'gear') === !!gi); if (!rows.length) return; d.appendChild(el('div', 'tag', title)); const g = el('div', 'itemrow'); g.style.margin = '.4rem 0 1rem'; rows.forEach(([id]) => g.appendChild(OS.slot(id, { dim: !owns(id), chance: dropChance(p, id), have: S.bag[id] }))); d.appendChild(g); });
    if (back) d.appendChild(btn('small ghost', 'Back', back)); modal.open(d);
  }

  // ------------------------------------------------------------------ summoning (Smudge only)
  const sstage = $('sstage'); let spup = null;
  const sfx = {
    layout() { if (!sstage.clientWidth) return; const kk = sstage.clientWidth * .98 / 910; if (!spup) spup = new OS.Puppet(sstage, 'stamp', 1); spup.scale = .45 * kk; spup.place(sstage.clientWidth * .01 + 453 * kk, sstage.clientHeight - 459 * kk + 255 * kk); },
    stamp() { if (spup) { spup.kick('arm', 30); spup.kick('head', 2.2); } },
  };
  addEventListener('resize', () => sfx.layout());
  // published odds, plus a small open bonus to rare-or-better for every 10 Summoning levels (the server rolls with the same rule)
  const luckSteps = () => Math.floor(level('Summoning') / 10), oddsBump = () => (R.summon.luck_per_10 || 0) * luckSteps();
  function summonWeights() { const w = {}, b = 1 + oddsBump(); RAR.forEach(r => w[r] = R.summon.weights[r] * (r === 'common' || r === 'uncommon' ? 1 : b)); return w; }
  let oddsAt = -1;
  function renderSummon() {
    const cost = summonCost(), l = level('Summoning'), f = Math.min(1, S.ink / cost);
    $('s-bar').style.width = f * 100 + '%'; $('s-ink').textContent = `${OS.num(S.ink)} / ${OS.num(cost)} ink`; $('s-met').textContent = `${Object.keys(S.roster).length} met so far`; $('s-lvl').textContent = '· level ' + l;
    $('s-go').disabled = S.ink < cost || summoning; $('s-prog').setAttribute('stroke-dasharray', f * 100 + ' 100'); if (!summoning) $('s-glow').setAttribute('opacity', Math.max(0, (f - .6) * .9).toFixed(2));
    if (oddsAt !== luckSteps()) { oddsAt = luckSteps(); const w = summonWeights(), tot = Object.values(w).reduce((a, b) => a + b, 0), mx = Math.max(...Object.values(w));
      $('s-odds').innerHTML = RAR.map(r => `<span class="r-${r}" style="color:var(--rc)">${OS.cap(r)}</span><i class="r-${r}"><b style="width:${Math.sqrt(w[r] / mx) * 100}%"></b></i><span>${(w[r] / tot * 100).toFixed(w[r] < 1 ? 2 : 1)}%</span>`).join('') + (oddsBump() ? `<p class="odds-note">Summoning level ${l}: rare or better is ${Math.round(oddsBump() * 100)}% more likely than the base odds.</p>` : `<p class="odds-note">Every 10 Summoning levels makes rare or better ${Math.round((R.summon.luck_per_10 || 0) * 100)}% more likely.</p>`); }
  }
  // ---- gold for ink (O6 gold sink): the rate was always in the rules; capped a day so it cannot undo the summon pacing
  function inkTrade() {
    rollDay(); const P = R.gold.ink_pack, left = Math.max(0, P.daily - (S.packs || 0)), can = Math.min(left, Math.floor(S.gold / P.gold));
    const d = el('div', '', `<h3 style="font-size:1.4rem">Buy ink with gold</h3>
      <p class="mut" style="font-size:.9rem;margin:.3rem 0 .8rem">${OS.num(P.gold)} gold buys a pot of ${OS.num(P.ink)} ink. Smudge's ink-seller parts with ${P.daily} pots a day and not one more. ${left ? `${left} left today` : 'Sold out. Fresh pots tomorrow'}. You have <b style="color:var(--gold)">${OS.num(S.gold)} gold</b>.</p>`);
    const row = el('div', 'row'); row.style.flexWrap = 'wrap';
    [1, 5, 10, can].filter((n, i, a) => n > 0 && a.indexOf(n) === i && n <= can).forEach(n => row.appendChild(btn(n === can && n > 10 ? '' : 'small', `${n === can && n > 10 ? 'All ' + n + ' pots' : n === 1 ? '1 pot' : n + ' pots'} · ${OS.num(n * P.gold)} gold for ${OS.num(n * P.ink)} ink`, () => {
      S.gold -= n * P.gold; S.ink += n * P.ink; S.packs = (S.packs || 0) + n; bump('gold_spent', n * P.gold); SND('coin'); save(true); render(); toast(`${OS.num(n * P.ink)} ink. Smudge is already eyeing the summoning circle.`); inkTrade(); })));
    if (!can) row.appendChild(el('p', 'mut', left ? 'Not enough gold for a lot.' : ''));
    d.appendChild(row); modal.open(d);
  }
  let summoning = false, lastStamp = 0;
  // the roll itself: spend the ink, pick a rarity by the published odds, pick anybody of that rarity
  function rollSummonLocal(quiet) {
    const cost = summonCost(); S.ink -= cost; S.summons++; const w = summonWeights(); let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0), rar = 'common'; for (const k of RAR) { r -= w[k]; if (r <= 0) { rar = k; break; } }
    let pool = R.heroes.filter(h => h.rarity === rar); if (!pool.length) pool = R.heroes.filter(h => h.rarity === 'common');
    const h = pool[Math.floor(Math.random() * pool.length)], had = S.roster[h.id] || 0, before = cardLevel(had || 1);
    bump(had ? 'dupes' : 'new_heroes'); bump('ink_spent', cost); S.roster[h.id] = had + 1; if (had) give('x_shard', SH.per_dupe + (before >= R.card.max_level ? 1 : 0)); gainXP('Summoning', Math.round(cost * R.summon.xp_per_ink), quiet); Cloud.log('summon', h.id);
    return { h, had, before, rar, cost };
  }
  // the server draws the card, takes the ink and updates the roster; the game plays the reveal from what it sends back
  async function drawSummons(n, quiet) {
    if (Cloud.dev) { const out = []; while (out.length < n && S.ink >= summonCost()) out.push(rollSummonLocal(quiet)); return out; }
    const r = await srv(() => Cloud.summon(n)); if (!r || r.r !== 'ok') { if (r && r.r && !quiet) toast(r.r); return []; }
    const out = r.got.filter(g => OS.heroes[g.id]).map(g => { const h = OS.heroes[g.id]; bump(g.had ? 'dupes' : 'new_heroes'); bump('ink_spent', g.cost); Cloud.log('summon', g.id); return { h, had: g.had, before: cardLevel(g.had || 1), rar: h.rarity, cost: g.cost }; });
    S.ink = r.set.ink; S.summons = r.set.summons; Object.assign(S.roster, r.set.roster); S.bag.x_shard = r.set.shards; S.xp.Summoning = r.set.sxp; return out;
  }
  async function summon() {
    if (S.ink < summonCost() || summoning) return; summoning = true;
    const res = await drawSummons(1); if (!res.length) { summoning = false; return; }
    const { h, had, before, rar } = res[0]; save(true); SND('summon');
    // the ring fills, floods with the rarity's colour, and the card climbs out of it
    const col = R.rarity_color[rar], glow = $('s-glow'), flash = $('s-flash'), prog = $('s-prog'); renderTop(); $('s-go').disabled = true;
    prog.setAttribute('stroke-dasharray', '100 100'); prog.style.transition = 'stroke .5s'; prog.setAttribute('stroke', col); glow.style.transition = 'opacity .6s,fill .6s'; glow.setAttribute('fill', col); glow.setAttribute('opacity', '.75');
    flash.setAttribute('stroke', col); flash.animate([{ opacity: 0, transform: 'scale(1)' }, { opacity: 1, offset: .3 }, { opacity: 0, transform: 'scale(1.5)' }], { duration: 900, iterations: rr(rar) >= 4 ? 3 : 1 }); flash.style.transformOrigin = '453px 390px';
    if (spup) { for (let i = 0; i < 4; i++) setTimeout(sfx.stamp, i * 140); }
    const kk = sstage.clientWidth * .98 / 910, card = OS.card(h, { mini: true }), size = Math.max(96, 170 * kk); card.classList.add('rising'); card.style.cssText += `;position:absolute;z-index:6;width:${size}px;left:${sstage.clientWidth * .01 + 453 * kk - size / 2}px;top:${sstage.clientHeight - 459 * kk + 390 * kk - size * 1.44}px`;
    setTimeout(() => { sstage.appendChild(card); if (spup) spup.cheer(2.5); }, 650 + (rr(rar) >= 4 ? 900 : 0));
    setTimeout(() => {
      card.remove(); prog.setAttribute('stroke', '#9ffff0'); glow.setAttribute('fill', '#3fe0c5'); summoning = false;
      const lv = cardLevel(had + 1), d = el('div', 'reveal'); d.innerHTML = `<div class="tag" style="font-size:1rem;color:${col}">${had ? (lv > before ? 'Another copy. Card level ' + lv + '!' : 'Another copy of an old friend') : 'A new arrival · ' + OS.cap(rar)}</div>`;
      d.appendChild(OS.card(h, { level: lv, stats: heroStats(h.id) })); d.appendChild(el('p', '', `<b>Smudge:</b> “${h.lines[MODES.indexOf(S.mode)]}”`));
      d.appendChild(btn('', had ? 'Welcome back' : 'Find them somewhere to stand', modal.close)); modal.open(d); render();
    }, 2300 + (rr(rar) >= 4 ? 900 : 0));
  }
  function stamp() { const t = performance.now(); if (summoning || t - lastStamp < 1000 / R.max_keys_per_second) return; lastStamp = t; SND('stamp'); S.ink += R.web.stamp_ink * inkBonus(); bump('stamps'); bump('ink', R.web.stamp_ink * inkBonus()); sfx.stamp(); renderTop(); renderSummon(); }
  $('s-go').onclick = summon; $('s-stamp').onclick = stamp; $('s-trade').onclick = inkTrade; sstage.addEventListener('pointerdown', stamp);

  // ------------------------------------------------------------------ arrivals
  // ---- finding things: one search box, one sort, a row of filter chips, on the arrivals and in the bag
  const FIND = { hq: '', hsort: 'rarity', hf: 'all', bq: '', bsort: 'kind', bf: 'all' };
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hits = (q, ...fields) => { const w = norm(q).split(/\s+/).filter(Boolean), hay = norm(fields.join(' ')); return w.every(x => hay.includes(x)); };
  const chipRow = (box, list, cur, key) => { box.innerHTML = list.map(([k, t, n]) => `<button type="button" class="chip${cur === k ? ' on' : ''}" data-${key}="${k}">${t}${n != null ? ` <i>${n}</i>` : ''}</button>`).join(''); };
  function renderHeroes() {
    const g = $('hgrid'); g.innerHTML = ''; const met = Object.keys(S.roster).length;
    $('h-count').textContent = `${met} met, and counting · ${S.bag.x_shard || 0} shards`;
    const metN = id => S.roster[id] || 0, place = h => (places[h.place] || {}).name || '';
    const rars = RAR.filter(r => R.heroes.some(h => h.rarity === r));
    chipRow($('h-chips'), [['all', 'Everyone', null], ['met', 'Met', met], ['new', 'Not met yet', null], ['crew', 'On the crew', crew().length]].concat(rars.map(r => [r, OS.cap(r), R.heroes.filter(h => h.rarity === r && metN(h.id)).length])), FIND.hf, 'hf');
    const list = R.heroes.filter(h => {
      const f = FIND.hf, n = metN(h.id);
      if (f === 'met' && !n) return false; if (f === 'new' && n) return false; if (f === 'crew' && !crew().includes(h.id)) return false; if (RAR.includes(f) && h.rarity !== f) return false;
      // strangers you have not met keep their names hidden, so search can only find them by rarity, place or era
      return !FIND.hq || (n ? hits(FIND.hq, h.name, h.title, h.species, h.era, h.rarity, place(h)) : hits(FIND.hq, h.rarity, place(h), h.era));
    });
    const by = { rarity: (a, b) => rr(b.rarity) - rr(a.rarity) || a.name.localeCompare(b.name), name: (a, b) => a.name.localeCompare(b.name),
      power: (a, b) => (metN(b.id) ? power(b.id) : -1) - (metN(a.id) ? power(a.id) : -1), level: (a, b) => cardLevel(metN(b.id)) - cardLevel(metN(a.id)) || metN(b.id) - metN(a.id) || rr(b.rarity) - rr(a.rarity),
      era: (a, b) => a.era.localeCompare(b.era) || a.name.localeCompare(b.name) };
    list.sort((a, b) => (!!metN(b.id) - !!metN(a.id)) * (FIND.hsort === 'rarity' || FIND.hsort === 'era' ? 0 : 1) || by[FIND.hsort](a, b));
    list.forEach(h => { const n = metN(h.id), c = OS.card(h, { owned: n > 0, mini: true, level: cardLevel(n) }); c.onclick = () => n ? heroSheet(h.id) : lockedSheet(h.id); g.appendChild(c); });
    $('h-none').hidden = list.length > 0;
  }
  $('h-q').addEventListener('input', e => { FIND.hq = e.target.value; renderHeroes(); });
  $('h-sort').addEventListener('change', e => { FIND.hsort = e.target.value; renderHeroes(); });
  $('h-chips').addEventListener('click', e => { const b = e.target.closest('[data-hf]'); if (b) { FIND.hf = b.dataset.hf; renderHeroes(); } });
  $('b-q').addEventListener('input', e => { FIND.bq = e.target.value; renderBag(); });
  $('b-sort').addEventListener('change', e => { FIND.bsort = e.target.value; renderBag(); });
  $('b-chips').addEventListener('click', e => { const b = e.target.closest('[data-bf]'); if (b) { FIND.bf = b.dataset.bf; renderBag(); } });
  // what a slot on a card can take, from the bag
  const slotOf = k => k.indexOf('own') === 0 ? R.slots.own[+k[3]] : k;
  const fits = (id, k) => Object.keys(S.bag).filter(x => S.bag[x] > 0 && OS.items[x] && OS.items[x].kind === 'gear' && (k.indexOf('own') === 0 ? x === OS.heroes[id].gear[+k[3]] : (!OS.items[x].owner && OS.items[x].slot === k)));
  const FXW = OS.FX;
  function cardLoad(id) {
    const h = OS.heroes[id], w = wornG(id), eq = S.equip[id] || (S.equip[id] = [null, null, null]), g = {}, avail = {}, lines = [];
    R.slots.general.forEach(k => { g[k] = w[k] || null; if (!w[k] && (k !== 'charm' || charmOpen(id)) && fits(id, k).length) avail[k] = true; });
    const sc = setCount(id), top = Object.keys(sc).sort((a, c) => sc[c] - sc[a])[0];
    if (top) { const st = R.gear_sets[top], k2 = Object.keys(st.two)[0], n = sc[top]; lines.push(`<b>${st.name} set ${n} / 3</b>${n >= 2 ? ` · +${st.two[k2]} ${OS.statWord[k2]}` : ''}${n >= 3 ? ` · +${Math.round(st.three.amount * 100)}% ${FXW[st.three.kind]}` : ` <s>${n < 2 ? '2: +' + st.two[k2] + ' ' + OS.statWord[k2] + ' · ' : ''}3: +${Math.round(st.three.amount * 100)}% ${FXW[st.three.kind]}</s>`}`); }
    else lines.push('<s>No set pieces worn. Head, body and feet from one era make a set.</s>');
    const wp = w.weapon && OS.items[w.weapon]; lines.push(wp ? `<b>${wp.name}</b> · ${OS.cap(wp.rarity)}${wp.special ? ` · +${Math.round(wp.special.amount * 100)}% ${FXW[wp.special.kind]}` : ''}` : '<s>No weapon. Any weapon will do; it need not match.</s>');
    const kc = kitCount(id); lines.push(`<i>${h.name.split(' ')[0]}’s kit ${kc} / 3</i>${kc >= 3 ? ` · +${KIT.three * 100}% all stats · +${KIT.speed * 100}% work speed` : kc === 2 ? ` · +${KIT.two * 100}% all stats <s>3: +${KIT.three * 100}%</s>` : ` <s>2: +${KIT.two * 100}% all stats · 3: +${KIT.three * 100}%</s>`}`);
    const n = S.roster[id], lv = cardLevel(n);
    return { g, own: eq.map((x, i) => x === h.gear[i] ? x : null), has: owns, avail, lines, charmOpen: charmOpen(id), power: power(id), copies: lv < R.card.max_level ? [n, copiesFor(lv)] : null };
  }
  function heroSheet(id, back) {
    const h = OS.heroes[id], n = S.roster[id], lv = cardLevel(n), st = heroStats(id), job = S.crew.includes(id) && S.jobs[0] ? S.jobs[0] : null, gone = away(id);
    const eq = S.equip[id] || (S.equip[id] = [null, null, null]); eq.forEach((x, i) => { if (x && x !== h.gear[i]) { give(x); eq[i] = null; } });      // older saves: anything that was not their own piece goes back to the armory
    const d = el('div', 'herosheet2'), card = OS.card(h, { level: lv, stats: st, base: baseStats(id), load: cardLoad(id), live: true, back: back !== false, onSlot: k => gearPicker(id, k) });
    const side = el('div', 'hs-side');
    side.innerHTML = `<div class="tag r-${h.rarity}" style="color:var(--rc)">${h.rarity} · ${h.species} · ${h.era}</div><h3 style="font-size:1.6rem;margin:.1rem 0 .3rem">${h.name}</h3>
      <p class="mut" style="font-size:.9rem;margin:0 0 .8rem">${gone ? 'Away on an expedition.' : job ? 'Standing crew at ' + places[job.place].name + '.' : S.crew.includes(id) ? 'In the crew.' : 'At a loose end.'} Tap a slot on the card to change what is in it. A glowing slot means something in your armory fits.</p>`;
    const row = el('div', 'row'); row.style.flexWrap = 'wrap';
    row.append(btn('small', 'Flip the card', () => card.click()), btn('small ghost', 'Train', () => { modal.close(); show('training'); }), btn('small ghost', 'Armory', () => { modal.close(); show('bag'); }));
    const log = ((S.journal || {})[id] || []);
    row.appendChild(btn('small ghost', `Journal${log.length ? ' · ' + log.length : ''}`, () => journalSheet(id)));
    const fr = OS.frameOf(id); row.appendChild(btn('small ghost', `Frame${fr ? ' · ' + FR.find(f => f.id === fr).name : ''}`, () => frameSheet(id)));
    side.appendChild(row); d.append(card, side); modal.open(d);
  }
  // ---- card frames (O6). S.frames[id] = [best frame bought, frame shown], both indexes into R.frames, -1 for none.
  // Buying a frame unlocks every frame below it for that hero. Gold only; nothing about a frame changes a number.
  const FR = R.frames || [];
  const frameRec = id => (S.frames || {})[id] || [-1, -1];
  OS.frameOf = id => { const f = frameRec(id); return S.roster[id] && f[1] >= 0 && FR[f[1]] ? FR[f[1]].id : null; };
  function frameSheet(id, armed) {
    const h = OS.heroes[id], lv = cardLevel(S.roster[id]), [own, on] = frameRec(id), first = short(id);
    const d = el('div', '', `<h3 style="font-size:1.4rem">Frame ${h.name}</h3>
      <p class="mut" style="margin:.2rem 0 0;font-size:.9rem">Purely for showing off. Buy a frame and ${first} gets every frame below it too. The fancy ones wait for a higher card level, so they prove you two go back. You have <b style="color:var(--gold)">${OS.num(S.gold)} gold</b>.</p>`);
    const g = el('div', 'frpick');
    const set = i => { S.frames = S.frames || {}; S.frames[id] = [Math.max(own, i), i]; save(true); render(); };
    const opt = (i) => {
      const f = FR[i], w = el('div', 'fopt' + (i === on ? ' on' : ''));
      const card = OS.card(h, { mini: true, level: lv, frame: f ? f.id : null, noflip: true });
      let label, act = null, why = '';
      if (i === on) label = 'Wearing it';
      else if (i < 0 || i <= own) { label = 'Put it on'; act = () => { set(i); frameSheet(id); }; }
      else if (lv < f.level) { label = `Needs card level ${f.level}`; w.classList.add('lockd'); }
      else if (S.gold < f.gold) { label = `${OS.num(f.gold)} gold`; why = `${OS.num(f.gold - S.gold)} short`; }
      else if (armed === i) { label = `Sure? ${OS.num(f.gold)} gold`; act = () => { S.gold -= f.gold; set(i); SND('coin'); bump('gold_spent', f.gold); toast(`${first} is framed in ${f.name}. Smudge approves.`); frameSheet(id); }; }
      else { label = `Buy · ${OS.num(f.gold)} gold`; act = () => frameSheet(id, i); }
      const b = btn('small' + (armed === i ? '' : ' ghost'), label, act || (() => {})); b.disabled = !act;
      const note = i < 0 ? 'Just the card.' : i <= own ? 'Paid for.' : `Card level ${f.level}${why ? ' · <b>' + why + '</b>' : ''}`;
      w.append(card, el('div', 'fn', i < 0 ? 'Bare' : f.name), el('div', 'fp', note), b); g.appendChild(w);
    };
    opt(-1); FR.forEach((_, i) => opt(i));
    d.append(g, el('div', 'row', '')); d.lastChild.style.marginTop = '.9rem'; d.lastChild.appendChild(btn('small ghost', 'Back to the card', () => heroSheet(id)));
    modal.open(d);
  }
  function gearPicker(id, k) {
    const h = OS.heroes[id], own = k.indexOf('own') === 0, i = own ? +k[3] : 0, w = wornG(id), eq = S.equip[id], cur = own ? eq[i] : w[k];
    if (k === 'charm' && !charmOpen(id)) { toast(`The charm slot opens when ${h.name.split(' ')[0]}'s card reaches level ${R.slots.charm_level}.`); return; }
    const put = x => { if (cur) give(cur); if (x) S.bag[x]--; if (own) eq[i] = x; else w[k] = x; save(true); render(); heroSheet(id); };
    const d = el('div', '', `<h3 style="font-size:1.4rem">${own ? h.name.split(' ')[0] + '’s own ' + OS.shortName(OS.items[h.gear[i]].name).toLowerCase() : 'Choose ' + (k === 'feet' ? 'something for the feet' : 'a ' + k)}</h3>`), g = el('div', 'itemrow');
    const opts = fits(id, k).sort((a, c) => rr(OS.items[c].rarity) - rr(OS.items[a].rarity));
    opts.forEach(x => { const sl = OS.slot(x, { count: S.bag[x] }); sl.onclick = () => put(x); g.appendChild(sl); });
    if (!opts.length) d.appendChild(el('p', 'mut', own ? (cur ? 'This is the only one of these.' : `Not found yet. It turns up at ${places[OS.items[h.gear[i]].place].name}, and nobody but ${h.name.split(' ')[0]} can wear it.`) : `Nothing for this slot in the armory yet. Every place lists the gear that turns up there.`));
    d.appendChild(g); const row = el('div', 'row'); row.style.marginTop = '1rem';
    if (cur) row.appendChild(btn('small ghost', 'Take it off', () => put(null)));
    row.appendChild(btn('small ghost', 'Back', () => heroSheet(id))); d.appendChild(row); modal.open(d);
  }

  // ------------------------------------------------------------------ bag, crates, tonics
  let armF = 'all';
  function renderBag() {
    rollDay(); const g = $('bgrid'); g.innerHTML = ''; const all = Object.keys(S.bag).filter(i => S.bag[i] > 0 && OS.items[i] && OS.items[i].kind !== 'gear');
    const kindOf = id => { const it = OS.items[id]; return it.kind === 'crate' || it.kind === 'tonic' ? 'use' : it.junk ? 'junk' : 'treasure'; };
    chipRow($('b-chips'), [['all', 'Everything', all.length], ['use', 'Crates and tonics', all.filter(i => kindOf(i) === 'use').length], ['treasure', 'Treasure', all.filter(i => kindOf(i) === 'treasure').length], ['junk', 'Junk', all.filter(i => kindOf(i) === 'junk').length], ['gear', 'Gear only', null]], FIND.bf, 'bf');
    const ids = FIND.bf === 'gear' ? [] : all.filter(id => (FIND.bf === 'all' || kindOf(id) === FIND.bf) && (!FIND.bq || hits(FIND.bq, OS.items[id].name, OS.items[id].rarity, OS.items[id].flavor, (places[OS.items[id].place] || {}).name)));
    const ord = { crate: 0, tonic: 1, gear: 2, loot: 3 }, bySort = { kind: (a, b) => ord[OS.items[a].kind] - ord[OS.items[b].kind] || rr(OS.items[b].rarity) - rr(OS.items[a].rarity), rarity: (a, b) => rr(OS.items[b].rarity) - rr(OS.items[a].rarity), name: () => 0, count: (a, b) => S.bag[b] - S.bag[a], value: (a, b) => (OS.items[b].sell || 0) - (OS.items[a].sell || 0) };
    ids.sort((a, b) => bySort[FIND.bsort](a, b) || OS.items[a].name.localeCompare(OS.items[b].name));
    ids.forEach(id => { const it = OS.items[id], s = OS.slot(id, { count: S.bag[id], have: S.bag[id] }); if (it.kind === 'crate') { s.classList.add('pulse'); s.onclick = () => openCrate(); } if (it.kind === 'tonic') s.onclick = () => drink(id); g.appendChild(s); });
    for (let i = ids.length; i < Math.max(24, Math.ceil(ids.length / 12) * 12); i++) g.appendChild(OS.slot(null));
    // ---- the armory: every piece of gear you own, sorted, with who is wearing it
    let arm = $('armory'); if (!arm) { arm = el('div', 'panel'); arm.id = 'armory'; arm.style.marginTop = '1rem'; g.parentNode.parentNode.appendChild(arm); arm.addEventListener('click', e => { const b = e.target.closest('[data-af]'); if (b) { armF = b.dataset.af; renderBag(); } }); }
    const wearer = {}; Object.keys(S.gear).forEach(hid => Object.values(S.gear[hid]).forEach(x => { if (x) wearer[x] = hid; })); Object.keys(S.equip).forEach(hid => (S.equip[hid] || []).forEach(x => { if (x) wearer[x] = hid; }));
    const mine = Object.values(OS.items).filter(i => i.kind === 'gear' && owns(i.id)), tabs = [['all', 'All'], ['weapon', 'Weapons'], ['head', 'Head'], ['body', 'Body'], ['feet', 'Feet'], ['charm', 'Charms'], ['own', 'Hero’s own']];
    const pick = mine.filter(i => (armF === 'all' ? true : armF === 'own' ? !!i.owner : !i.owner && i.slot === armF) && (!FIND.bq || hits(FIND.bq, i.name, i.rarity, i.slot, i.owner ? OS.heroes[i.owner].name : '', i.set ? R.gear_sets[i.set].name : ''))).sort((a, c) => rr(c.rarity) - rr(a.rarity) || (a.set || 'zz').localeCompare(c.set || 'zz') || a.name.localeCompare(c.name));
    arm.innerHTML = `<div class="spread"><h3 style="margin:0">The armory</h3><span class="mut">${mine.length} of ${Object.values(OS.items).filter(i => i.kind === 'gear' && (!i.retired || owns(i.id))).length} pieces found</span></div>
      <div class="row" style="flex-wrap:wrap;gap:.4rem;margin:.6rem 0">${tabs.map(([k, t]) => `<button class="btn small ${armF === k ? '' : 'ghost'}" data-af="${k}">${t}</button>`).join('')}</div><div class="armgrid"></div>`;
    arm.hidden = FIND.bf !== 'all' && FIND.bf !== 'gear';
    const ag = arm.querySelector('.armgrid'); if (!pick.length) ag.appendChild(el('p', 'mut', 'Nothing here yet.'));
    pick.forEach(it => { const row = el('div', 'armrow r-' + it.rarity), sl = OS.slot(it.id, { count: S.bag[it.id] }); row.appendChild(sl);
      row.appendChild(el('div', '', `<b style="color:var(--rc)">${it.name}</b><span class="mut">${OS.cap(it.rarity)} · ${it.owner ? OS.heroes[it.owner].name + ' only' : OS.cap(it.slot)}${it.set ? ' · ' + R.gear_sets[it.set].name + ' set' : ''}</span><span class="mut">${wearer[it.id] ? 'Worn by ' + OS.heroes[wearer[it.id]].name + (S.bag[it.id] > 0 ? ' · ' + S.bag[it.id] + ' spare' : '') : 'In the armory' + (S.bag[it.id] > 1 ? ' · ' + S.bag[it.id] : '')}</span>`)); ag.appendChild(row); });
    $('b-cap').textContent = `${OS.num(Object.keys(S.bag).reduce((t, id) => { const it = OS.items[id]; return t + (it && it.kind === 'loot' && id !== 'x_shard' ? Math.max(0, S.bag[id] - (it.junk ? 0 : 1)) * it.sell : 0); }, 0))} gold of junk and spares`;
    // ---- how full it is, and the one button that fixes it
    const used = bagUsed(), max = bagMax(), pc = Math.min(100, used / max * 100), room = $('b-room');
    const state = used >= max ? 'full' : pc > 85 ? 'tight' : '';
    room.className = 'bagroom ' + state;
    room.innerHTML = `<div class="bagbar"><i style="width:${pc}%"></i></div>
      <span class="bagn"><b>${used} / ${max}</b> different things${state === 'full' ? ' · no room left' : state === 'tight' ? ' · nearly full' : ''}</span>`;
    const buys = S.bagBuys || 0;
    if (buys < BAG.max_buys) {
      const c = bagCost(), bb = btn('small' + (S.gold < c ? ' ghost' : ''), `Buy ${BAG.per_buy} more · ${OS.num(c)} gold`, () => {
        const cost = bagCost(); if (S.gold < cost) return toast(`That takes ${OS.num(cost)} gold.`);
        S.gold -= cost; S.bagBuys = (S.bagBuys || 0) + 1; bump('gold_spent', cost); SND('coin'); save(true); render();
        toast(`Smudge stitched another ${BAG.per_buy} pockets on. ${BAG.max_buys - S.bagBuys} more he can manage.`); });
      bb.disabled = S.gold < c; room.appendChild(bb);
    } else room.appendChild(el('span', 'mut', 'Smudge cannot sew another pocket on this bag.'));
    let cab = $('cabinet'); if (!cab) { cab = el('div', 'panel'); cab.id = 'cabinet'; cab.style.marginTop = '1rem'; g.parentNode.parentNode.appendChild(cab); }
    const shown = Object.keys(S.cabinet).length, ready = cabReady().length;
    cab.innerHTML = `<div class="spread"><h3 style="margin:0">The cabinet</h3><span class="mut">${shown} of ${treasures.length} on display · ink worth +${Math.round((inkBonus() - 1) * 1000) / 10}%</span></div>
      <p class="mut" style="margin:.4rem 0 .7rem">Put one of each treasure on display. Every piece makes all ink worth ${CAB.ink_per * 100}% more, for good. Finish a place's set and everybody works ${CAB.set_speed * 100}% faster there.</p>
      <div class="row" style="flex-wrap:wrap;gap:.4rem;margin-bottom:.7rem">${R.places.filter(p => treasures.some(i => i.place === p.id)).map(p => { const set = treasures.filter(i => i.place === p.id), n = set.filter(i => S.cabinet[i.id]).length; return `<span class="chip${n === set.length ? ' done' : ''}" style="border:1px solid ${n === set.length ? '#3fe0c5' : '#2a3761'};border-radius:999px;padding:.2em .7em;font-size:.82rem;color:${n === set.length ? '#3fe0c5' : '#aab6d6'}">${p.name} ${n}/${set.length}${n === set.length ? ' ✓' : ''}</span>`; }).join('')}</div>`;
    const cb = btn('small', ready ? `Put ${ready} new ${ready === 1 ? 'piece' : 'pieces'} on display` : 'Nothing new to display', fillCabinet); cb.disabled = !ready; cab.appendChild(cb);
  }
  let crating = false;
  async function openCrate(quiet) {
    if (!(S.bag.x_crate > 0) || crating) return; crating = true; if (!quiet) SND('crate');
    const open = workPlaces.filter(unlocked), list = []; for (let i = 0; i < R.crate.rolls; i++) { const p = RIFT && Math.random() < R.rift.crate_chance ? RIFT : open[Math.floor(Math.random() * open.length)]; if (p) list.push({ place: p.id, n: 1, luck: fullLuck(p, R.crate.luck) }); }
    const r = await roll(list, { item: 'x_crate', qty: 1 }); crating = false; if (r.err) { if (!quiet) { if (r.err === 'down') noLedger(); else toast(r.err); } return; }
    const got = flat(r.add).filter(id => OS.items[id]);
    const gold = R.crate.gold[0] + Math.floor(Math.random() * (R.crate.gold[1] - R.crate.gold[0] + 1)); S.gold += gold; S.ink += R.crate.ink; bump('crates'); bump('gold', gold); bump('ink', R.crate.ink); Cloud.log('crate'); save(true);
    if (quiet) { toast(`Crate opened: ${gold} gold, ${got.map(x => OS.items[x].name).join(', ')}`); return; }
    const d = el('div', 'reveal', `<img src="${OS.img('loot', 'x_crate_open')}" alt="" style="width:150px" class="popin"><h3 style="font-size:1.6rem">Something fell out of time</h3><p class="mut">${gold} gold, ${R.crate.ink} ink, and these.</p>`);
    const g = el('div', 'row'); g.style.justifyContent = 'center'; got.forEach(x => g.appendChild(OS.slot(x))); d.appendChild(g); d.appendChild(el('p', '', `<b>Smudge:</b> “${line('crate')}”`));
    const row = el('div', 'row'); if (S.bag.x_crate > 0) row.appendChild(btn('', `Open another (${S.bag.x_crate} left)`, () => openCrate())); row.appendChild(btn('ghost', 'Into the bag', modal.close)); d.appendChild(row); modal.open(d); render();
  }
  function drink(id) { const pt = (R.potions || []).find(x => x.id === id); if (pt) return toast(`${pt.name}: ${pt.text} Pack it in a potion slot when you start a raid.`); const t = R.tonics.find(x => x.id === id); if (!t || !(S.bag[id] > 0)) return; bump('tonics'); S.bag[id]--; S.tonics[t.effect] = Math.max(now(), S.tonics[t.effect] || 0) + t.minutes * 60000; save(true); render(); toast(`${t.name}: ${t.text}`); }
  $('b-sell').onclick = async () => { const map = {}; let earned = 0;
    Object.keys(S.bag).forEach(id => { const it = OS.items[id]; if (!it || it.kind !== 'loot' || id === 'x_shard') return; const n = S.bag[id] - (it.junk ? 0 : 1); if (n > 0) { map[id] = n; earned += n * it.sell; } });
    if (!earned) return toast('Nothing to sell. Junk all goes; one of each treasure is kept.');
    if (Cloud.dev) { Object.keys(map).forEach(id => S.bag[id] -= map[id]); S.gold += earned; } else { const r = await srv(() => Cloud.sell(map)); if (r.r !== 'ok') return toast(r.r); earned = r.earned; }
    SND('coin'); S.sold += earned; bump('gold', earned); bump('gold_sold', earned); save(true); render(); toast(`Sold the spares for ${earned} gold.`); };

  // ------------------------------------------------------------------ workshop
  const spare = rar => Object.keys(S.bag).filter(id => OS.items[id] && OS.items[id].kind === 'loot' && !OS.items[id].junk && OS.items[id].rarity === rar && id !== 'x_shard').reduce((a, id) => a + Math.max(0, S.bag[id] - 1), 0);
  // ---- making: Cooking, Tinkering, Restoring. One thing on the bench at a time, with a bar.
  const MK = R.making, isFish = id => /^j_(dock|bondi|fjord)_[123]$/.test(id);
  const stock = kind => Object.keys(S.bag).reduce((t, id) => { const it = OS.items[id]; if (!it || it.kind !== 'loot' || id === 'x_shard' || !(S.bag[id] > 0)) return t;
    return t + (kind === 'fish' ? (isFish(id) ? S.bag[id] : 0) : kind === 'junk' ? (it.junk ? S.bag[id] : 0) : (!it.junk ? Math.max(0, S.bag[id] - 1) : 0)); }, 0);
  function spend(kind, n) { Object.keys(S.bag).sort((a, c) => (OS.items[a] ? OS.items[a].sell : 0) - (OS.items[c] ? OS.items[c].sell : 0)).forEach(id => { const it = OS.items[id]; if (n <= 0 || !it || it.kind !== 'loot' || id === 'x_shard') return;
    const can = kind === 'fish' ? (isFish(id) ? S.bag[id] : 0) : kind === 'junk' ? (it.junk ? S.bag[id] : 0) : (!it.junk ? Math.max(0, S.bag[id] - 1) : 0), use = Math.min(n, can); S.bag[id] -= use; n -= use; }); }
  const canMake = r => level(r.skill) >= r.level && Object.keys(r.need).every(k => k === 'gold' ? S.gold >= r.need.gold : stock(k) >= r.need[k]) && (!r.gives.cabinet || treasures.some(i => !S.cabinet[i.id]));
  const makeTime = r => r.seconds / (1 + (level(r.skill) - 1) * MK.speed_per_level);
  function startMake(id) { const r = MK.recipes.find(x => x.id === id); if (!r || S.make || !canMake(r)) return false; Object.keys(r.need).forEach(k => k === 'gold' ? S.gold -= r.need.gold : spend(k, r.need[k])); S.make = { id, t: 0, need: makeTime(r) }; save(true); render(); return true; }
  function finishMake(quiet) {
    const r = MK.recipes.find(x => x.id === S.make.id); S.make = null; if (!r) return; gainXP(r.skill, r.xp, quiet); bump('made'); let msg = r.name + ' done.';
    if (r.gives.energy) { S.energy = Math.min(R.energy.max, S.energy + r.gives.energy); msg = `Supper is served. +${r.gives.energy} energy.`; }
    if (r.gives.ticket) { S.tickets = Math.min(R.raids.tickets + 2, S.tickets + 1); msg = 'The feast is laid. One raid ticket.'; }
    if (r.gives.parts) { S.parts += r.gives.parts; msg = `+${r.gives.parts} spare ${r.gives.parts > 1 ? 'parts' : 'part'}.`; }
    if (r.gives.shard) { give('x_shard', r.gives.shard); msg = 'One card shard, pieced together.'; }
    if (r.gives.cabinet) { const miss = treasures.filter(i => !S.cabinet[i.id]); if (miss.length) { const it = miss[Math.floor(Math.random() * miss.length)]; S.cabinet[it.id] = 1; msg = `Restored: ${it.name}. It is in the cabinet.`; } }
    if (!quiet) { toast(msg); if (current === 'workshop') render(); }
  }
  function tickMake(dt, quiet) { if (!S.make) return; S.make.t += dt; if (S.make.t >= S.make.need) finishMake(quiet); }
  const NEEDW = { fish: 'fish', junk: 'junk', treasure: 'spare treasure', gold: 'gold' };
  function renderMaking() {
    let mk = $('w-making'); if (!mk) { mk = el('div', 'panel'); mk.id = 'w-making'; mk.style.marginBottom = '.9rem'; $('w-tonics').parentNode.before(mk); mk.addEventListener('click', e => { const b = e.target.closest('[data-mk]'); if (b) startMake(b.dataset.mk); }); }
    const cur = S.make && MK.recipes.find(x => x.id === S.make.id);
    mk.innerHTML = `<div class="spread"><h3 style="margin:0">The bench</h3><span class="mut">${S.parts} spare parts · ${stock('fish')} fish · ${stock('junk')} junk · ${stock('treasure')} spare treasure</span></div>
      <div class="mkskills">${MK.skills.map(k => { const l = level(k), a = R.xp_table[l - 1] || 0, b = R.xp_table[l] || a + 1; return `<div><span>${k}</span><b>${l}</b><div class="bar"><i style="width:${pct((S.xp[k] || 0) - a, b - a)}"></i></div></div>`; }).join('')}</div>
      ${cur ? `<div class="mknow"><b>${cur.name}</b><div class="bar"><i id="mk-bar" style="width:${pct(S.make.t, S.make.need)}"></i></div><span class="mut" id="mk-left">${fmt(Math.max(0, S.make.need - S.make.t))}</span></div>` : ''}
      <div class="mklist">${MK.recipes.map(r => { const ok = canMake(r), locked = level(r.skill) < r.level; return `<div class="mkrow${locked ? ' lock' : ''}"><div><div class="tag">${r.skill}${locked ? ' · level ' + r.level : ''}</div><b>${r.name}</b><span class="mut">${r.text}</span><span class="mut">Needs ${Object.keys(r.need).map(k => r.need[k] + ' ' + NEEDW[k]).join(', ')} · ${fmt(makeTime(r))}</span></div><button class="btn small" data-mk="${r.id}" ${ok && !S.make ? '' : 'disabled'}>${locked ? 'Locked' : S.make ? 'Busy' : 'Make'}</button></div>`; }).join('')}</div>`;
  }
  function renderWorkshop() {
    renderMaking();
    const tb = $('w-tonics'); tb.innerHTML = '';
    R.tonics.concat(R.potions || []).forEach(t => { const have = spare(t.cost.rarity), row = el('div', 'exrow'); row.innerHTML = `<div class="slot has r-uncommon"><img src="${OS.img('loot', t.id)}" alt=""></div><div><b>${t.name}</b><div class="mut" style="font-size:.85rem">${t.text} Costs ${t.cost.n} spare ${t.cost.rarity} treasures. You have ${have} spare.</div></div>`;
      const b = btn('small', 'Brew', () => { let need = t.cost.n; Object.keys(S.bag).sort((a, b) => S.bag[b] - S.bag[a]).forEach(id => { const it = OS.items[id]; if (!it || it.kind !== 'loot' || it.rarity !== t.cost.rarity || id === 'x_shard') return; const use = Math.min(need, Math.max(0, S.bag[id] - 1)); S.bag[id] -= use; need -= use; }); give(t.id); save(true); render(); toast(`Brewed a ${t.name}. It is in the bag.`); }); b.disabled = have < t.cost.n; row.appendChild(b); tb.appendChild(row); });
    const gb = $('w-gear'); gb.innerHTML = ''; const all = new Set(); Object.keys(S.bag).forEach(id => { if (S.bag[id] > 0 && OS.items[id] && OS.items[id].kind === 'gear') all.add(id); }); Object.values(S.equip).forEach(e => e.forEach(g => g && all.add(g))); Object.values(S.gear).forEach(w => Object.values(w).forEach(g => g && all.add(g)));
    if (!all.size) gb.appendChild(el('p', 'mut', 'No gear yet. It turns up at jobs and falls out of raid bosses.'));
    [...all].sort((a, b) => rr(OS.items[b].rarity) - rr(OS.items[a].rarity)).forEach(id => { const it = OS.items[id], lv = S.gearLv[id] || 0, worn = Object.values(S.equip).some(e => e.includes(id)) || Object.values(S.gear).some(w => Object.values(w).includes(id)), copies = (S.bag[id] || 0) - (worn ? 0 : 1), cost = R.gear_up.gold[lv], pts = R.gear_up.parts[lv], row = el('div', 'exrow');
      row.appendChild(OS.slot(id)); row.appendChild(el('div', '', `<b style="color:${R.rarity_color[it.rarity]}">${it.name}${lv ? ' +' + lv : ''}</b><div class="mut" style="font-size:.85rem">${lv >= R.gear_up.max ? 'As good as it gets.' : `Next level: ${pts} spare ${pts > 1 ? 'parts' : 'part'} and ${OS.num(cost)} gold. You have ${S.parts} parts.`}</div>`));
      const b = btn('small', 'Upgrade', () => { S.parts -= pts; S.gold -= cost; S.gearLv[id] = lv + 1; save(true); render(); toast(`${it.name} is now +${lv + 1}.`); }); b.disabled = lv >= R.gear_up.max || S.parts < pts || S.gold < cost; row.appendChild(b); gb.appendChild(row); });
  }

  // ------------------------------------------------------------------ training
  function renderTraining() {
    $('tr-energy').textContent = `Energy ${S.energy} / ${R.energy.max}`; $('tr-bar').style.width = pct(S.energy, R.energy.max); $('tr-next').textContent = S.energy >= R.energy.max ? 'Full' : 'next point in ' + fmt((R.energy.regen_seconds * 1000 - (now() - S.energyT)) / 1000);
    const box = $('tr-list'); if (box.dataset.sig === Object.keys(S.roster).join() + S.energy + JSON.stringify(S.trained)) return; box.dataset.sig = Object.keys(S.roster).join() + S.energy + JSON.stringify(S.trained); box.innerHTML = '';
    Object.keys(S.roster).sort((a, b) => power(b) - power(a)).forEach(id => { const h = OS.heroes[id], st = heroStats(id), tr = S.trained[id] || {}, cap = trainCap(id), row = el('div', 'panel trow');
      row.innerHTML = `<img src="${OS.img('heroes', id)}" alt=""><div class="tname"><b>${h.name}</b><span class="mut">Trained up to +${cap} each</span></div>`; const bs = el('div', 'tbtns');
      R.stats.forEach(s => { const b = btn('small ghost', `${OS.statWord[s]} <b>${st[s]}</b><small>+${tr[s] || 0}</small>`, () => { if (S.energy < R.energy.train_cost) return; if (S.energy >= R.energy.max) S.energyT = now(); S.energy -= R.energy.train_cost; (S.trained[id] || (S.trained[id] = {}))[s] = (tr[s] || 0) + 1; save(true); render(); }); b.disabled = S.energy < R.energy.train_cost || (tr[s] || 0) >= cap; bs.appendChild(b); }); row.appendChild(bs); box.appendChild(row); });
  }

  // ------------------------------------------------------------------ raids
  function renderRaids() {
    $('rd-tix').innerHTML = `Tickets ${S.tickets} / ${R.raids.tickets}` + (S.tickets < R.raids.tickets ? ` <span class="mut" style="font-weight:700">· next in ${fmt((R.raids.regen_minutes * 60000 - (now() - S.ticketT)) / 1000)}</span>` : '');
    const box = $('rd-list'); if (!RAIDS) { raidsReady.then(renderRaids); return; } if (box.dataset.sig === S.tickets + JSON.stringify(S.raids) + totalLevel()) return; box.dataset.sig = S.tickets + JSON.stringify(S.raids) + totalLevel(); box.innerHTML = '';
    R.raids.bosses.forEach(b => { const p = places[b.place], open = unlocked(p), row = el('div', 'prow' + (open ? '' : ' lock'));
      const B = bossOf(b); row.innerHTML = `<img src="${OS.img('scenes', p.id)}" alt=""><div><div class="tag">${p.name} · beaten ${S.raids[b.id] || 0} times</div><h3>${b.name}</h3><p>${open ? b.text : 'Needs ' + p.skill + ' level ' + p.level + '.'}</p><p class="mut" style="font-size:.8rem">Health ${OS.num(b.hp)} · Attack ${b.attack} · Defense ${b.defense} · ${b.gold} gold${B.weak ? ' · weak to ' + STATW[B.weak].toLowerCase() : ''}</p></div>`;
      const acts = el('div', 'row acts'), go = btn('small', 'Raid', () => raidSheet(b)); go.disabled = !open || S.tickets < 1; acts.appendChild(go); row.appendChild(acts); box.appendChild(row); });
  }
  // ---- raids you play: pick three and two potions, walk three rooms, then fight the boss at reading speed.
  //      Room choices roll one team stat; wounds carry into the boss fight; a lost raid sends the team to rest.
  //      The words live in data/raids.json (Fable writes them); this is only the engine.
  let EXP = null; const expReady = fetch('/data/expeditions.json' + OS.VER).then(r => r.json()).then(j => EXP = j).catch(() => EXP = { beats: {}, tone: {}, voice: {} });
  const RD = R.raids; let RAIDS = null; const raidsReady = fetch('/data/raids.json' + OS.VER).then(r => r.json()).then(j => RAIDS = j).catch(() => RAIDS = { room_pool: [], bosses: {}, reactions: { default: {} } });
  const STATW = { attack: 'Attack', defense: 'Defense', health: 'Health', speed: 'Speed', luck: 'Luck' };
  // What it costs to wake one hero early: a share of what the boss pays, so patching up is never worse value
  // than the fight itself. Rounded up to ten so the number reads cleanly.
  const patchOne = (b, id) => { const left = resting(id); if (!left) return 0;
    const share = (b && b.gold ? b.gold : 400) * (RD.patch_share || .2) * Math.min(1, left / 60000 / RD.recover_minutes);
    return Math.max(10, Math.ceil(share / 10) * 10); };
  // every label with data-rest or data-away counts itself down, wherever it is on screen
  function restTick(lb) {
    const id = lb.dataset.rest, aw = lb.dataset.away;
    if (aw) { const e = S.exped.find(x => x.hero === aw); lb.textContent = e ? 'Back in ' + fmt(Math.max(0, (e.end - now()) / 1000)) : 'Back now'; return; }
    const left = resting(id); if (!left) { lb.textContent = 'Ready'; return; }
    const b = lb.dataset.boss ? RD.bosses.find(x => x.id === lb.dataset.boss) : null;
    lb.innerHTML = `Back in ${fmt(left / 1000)}${b ? ` <i>${OS.num(patchOne(b, id))}g to wake</i>` : ''}`;
  }
  const resting = id => Math.max(0, ((S.recover || {})[id] || 0) - now());
  const fillIn = (t, o) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => o[k] != null ? o[k] : m);
  const pick1 = a => a && a.length ? a[Math.floor(Math.random() * a.length)] : '';
  const TITLES = ['Captain', 'Doctor', 'Dr.', 'General', 'Sgt.', 'Frau', 'Inspector', 'Agent', 'President', 'Pharaoh', 'Mad', 'El', 'Commander', 'Pixel', 'Unit', 'Lady', 'Sir'];
  const short = id => { const w = OS.heroes[id].name.split(' '); return (TITLES.includes(w[0]) && w[1] ? w[1] : w[0]).replace(/[,;:]+$/, ''); };
  const bossOf = b => Object.assign({ weak: null, resist: null, rooms: [], lines: {}, intro: b.text }, RAIDS && RAIDS.bosses[b.id]);
  function react(id, tag) { const r = (RAIDS && RAIDS.reactions) || {}, pool = (r[id] && r[id][tag]) || (r.default && r.default[tag]); return pool ? fillIn(pick1(pool), { name: short(id) }) : ''; }
  const teamStats = team => { const t = { attack: 0, defense: 0, health: 0, speed: 0, luck: 0 }; team.forEach(id => { const s = heroStats(id); R.stats.forEach(k => t[k] += s[k]); }); return t; };
  // the team's stats as this boss sees them: its weakness counts half again, what it shrugs off counts for less
  function effStats(team, B) { const t = teamStats(team), raidUp = 1 + team.reduce((a, id) => a + fx(id, 'raid'), 0) / Math.max(1, team.length);
    R.stats.forEach(k => t[k] = Math.round(t[k] * (k === B.weak ? RD.weak_mult : k === B.resist ? RD.resist_mult : 1))); t.raidUp = raidUp; return t; }
  // one exchange: the team strikes, then the boss. Shared by the real fight and by the odds estimate, so they always agree.
  function exchange(st, b, t, who) {
    const crit = Math.random() < Math.min(.5, t.luck / 300), twice = Math.random() < Math.min(.5, t.speed / 400), fury = st.fury > 0 ? 1 + st.furyAmt : 1;
    const dmg = Math.round(Math.max(2, Math.round(t.attack * (.8 + Math.random() * .4) - b.defense * .5)) * (crit ? 2 : 1) * (twice ? 2 : 1) * t.raidUp * fury); st.bhp -= dmg; if (st.fury > 0) st.fury--;
    const out = [{ kind: crit ? 'crit' : 'hit', who, dmg, crit, twice }]; if (st.bhp <= 0) return out;
    const shield = st.shield > 0 ? 1 - st.shieldAmt : 1, hit = Math.max(1, Math.round((b.attack * (.8 + Math.random() * .4) - t.defense / 3) * shield)); st.hp -= hit; if (st.shield > 0) st.shield--;
    out.push({ kind: 'foe', dmg: hit, shielded: shield < 1 }); return out;
  }
  function odds(b, t, hp, bhp, n) { let w = 0; for (let i = 0; i < (n || 160); i++) { const st = { hp, bhp, fury: 0, shield: 0 }; for (let r = 0; r < RD.rounds && st.hp > 0 && st.bhp > 0; r++) exchange(st, b, t, ''); if (st.bhp <= 0) w++; } return w / (n || 160); }
  function attackNeeded(b, t, hp) { for (let m = 1.1; m <= 6; m += .1) { const tt = Object.assign({}, t, { attack: Math.round(t.attack * m) }); if (odds(b, tt, hp, b.hp, 80) >= .5) return tt.attack; } return null; }
  const potionsHave = () => R.potions.filter(p => (S.bag[p.id] || 0) > 0);

  // The raid sheet: the boss on the left, your three on the right, and the odds pinned to the bottom so they are
  // always in sight. Each card shows the stats that decide the fight, with the boss's weak and strong stats marked.
  async function raidSheet(b) {
    await raidsReady; const B = bossOf(b), p = places[b.place], team = [], pots = [];
    const beat = S.raids[b.id] || 0, hi = {}; if (B.weak) hi[B.weak] = 'good'; if (B.resist) hi[B.resist] = 'bad';
    const d = el('div', 'raidset two'), L = el('div', 'rleft'), Rt = el('div', 'rright'), bar = el('div', 'rbar');
    const heroes = el('div', 'heroes pick'), info = el('div', 'raidodds', ''), potRow = el('div', 'potrow', '');
    const tile = (k, lab, v) => `<div class="btile ${k}"><b>${v}</b><span>${lab}</span></div>`;
    const up = Math.round((RD.weak_mult - 1) * 100), down = Math.round((1 - RD.resist_mult) * 100);
    L.innerHTML = `<div class="raidhead" style="background-image:url(${OS.img('scenes', p.id)})"><div>
        <div class="tag">${p.name} · ${p.era}</div><h3>${b.name}</h3>
        <span class="beat${beat ? '' : ' new'}">${beat ? 'Beaten ' + beat + ' time' + (beat > 1 ? 's' : '') : 'Never beaten'}</span></div></div>
      <p class="raidintro">${B.intro || b.text}</p>
      <div class="btiles">${tile('life', 'Health', OS.num(b.hp))}${tile('atk', 'Attack', b.attack)}${tile('def', 'Defense', b.defense)}</div>
      ${B.weak ? `<p class="rnote good"><i>↑</i><span><b>Weak to ${STATW[B.weak]}.</b> Your team's ${STATW[B.weak].toLowerCase()} counts for ${up}% more here.</span></p>` : ''}
      ${B.resist ? `<p class="rnote bad"><i>↓</i><span><b>Shrugs off ${STATW[B.resist]}.</b> Your team's ${STATW[B.resist].toLowerCase()} counts for ${down}% less here.</span></p>` : ''}
      <p class="rnote"><i>⌛</i><span>${RD.rooms} rooms on the way in, then up to ${RD.rounds} rounds with ${b.name}. Losing sends everyone who went to bed for ${RD.recover_minutes} minutes.</span></p>
      <div class="spoils"><div class="tag">If you win</div><ul>
        <li><b>${OS.num(Math.round(b.gold * (beat ? 1 : (RD.first_kill_mult || 1))))} gold</b>${beat ? ', straight into your pocket' : ', five times the usual for a first kill'}</li>
        <li><b>${(RD.rolls_by_tier || {})[p.tier] || RD.loot_rolls} rolls</b> on everything ${p.name} hides</li>
        ${+p.tier >= (RD.crate_from_tier || 9) ? '<li>A <b>crate</b>, unopened</li>' : ''}
        ${+p.tier >= (RD.shards_from_tier || 9) ? `<li><b>${RD.shards} shards</b> toward calling someone by name</li>` : ''}
        <li>Smudge writes the win in the ledger${beat ? ' again' : ' for the first time'}</li></ul></div>`;
    Rt.innerHTML = `<h4 style="margin-top:0">Pick your three</h4><p class="pickhint">Everyone you send adds their stats to one pile. Green numbers hit this boss harder; red ones barely tickle it.</p>`;
    const cards = {};
    Object.keys(S.roster).sort((a, c) => power(c) - power(a)).forEach(id => {
      const rest = resting(id), c = OS.card(OS.heroes[id], { mini: true, level: cardLevel(S.roster[id]), stats: heroStats(id), hi });
      cards[id] = c;
      if (rest) { c.classList.add('resting'); const lb = el('span', 'restlbl'); lb.dataset.rest = id; lb.dataset.boss = b.id; c.appendChild(lb); restTick(lb); }
      c.onclick = () => {
        if (resting(id)) return toast(`${short(id)} is still sleeping off the last one.`);
        const k = team.indexOf(id);
        if (k >= 0) team.splice(k, 1);
        else if (team.length < 3) team.push(id); else return toast('Three is the most Smudge can keep track of. Tap one to drop them.');
        SND('click'); marks(); upd();
      };
      heroes.appendChild(c);
    });
    function marks() {
      heroes.classList.toggle('full', team.length >= 3);
      Object.keys(cards).forEach(id => { const c = cards[id], k = team.indexOf(id), old = c.querySelector('.pickn');
        c.classList.toggle('sel', k >= 0); if (old) old.remove();
        if (k >= 0) c.appendChild(el('span', 'pickn', String(k + 1))); });
    }
    const tired = Object.keys(S.roster).filter(id => resting(id)), patchCost = () => tired.reduce((a, id) => a + patchOne(b, id), 0);
    if (tired.length) { const c0 = patchCost();
      const patch = btn('small ghost', `Wake ${tired.length === 1 ? short(tired[0]) : tired.length === 2 ? 'both of them' : 'all ' + tired.length} · ${OS.num(c0)} gold`, () => {
        const c = patchCost(); if (S.gold < c) return toast(`That takes ${OS.num(c)} gold.`); S.gold -= c; tired.forEach(id => S.recover[id] = 0); bump('gold_spent', c); SND('coin'); save(true); render(); toast('Patched up, fed, and only slightly grumbling.'); raidSheet(b); });
      patch.disabled = S.gold < c0; patch.style.margin = '0 0 .7rem'; Rt.appendChild(patch); }
    Rt.append(heroes, el('h4', '', `Potions (${RD.potion_slots} slots)`), potRow);
    const go = btn('', 'Go in · 1 ticket', () => { if (S.tickets < 1) return toast('No tickets left. One comes back every ' + RD.regen_minutes / 60 + ' hours.'); runRaid(b, B, team.slice(), pots.slice()); });
    bar.append(info, go);
    d.append(L, Rt, bar);
    function drawPots() {
      const have = potionsHave(); potRow.innerHTML = have.length ? '' : `<p class="mut">No potions packed. Brew them in the Workshop: ${R.potions.map(x => x.name).join(', ')}.</p>`;
      have.forEach(x => { const used = pots.filter(q => q === x.id).length, left = S.bag[x.id] - used, bt = el('button', 'potbtn' + (used ? ' on' : ''), `<img src="${OS.img('loot', x.id)}" alt=""><span><b>${x.name}</b>${x.text}</span><i>${used ? used + ' packed · ' : ''}${left} left</i>`); bt.type = 'button';
        bt.onclick = () => { if (left > 0 && pots.length < RD.potion_slots) pots.push(x.id); else { const k = pots.indexOf(x.id); if (k >= 0) pots.splice(k, 1); } drawPots(); }; potRow.appendChild(bt); });
    }
    function upd() {
      go.disabled = team.length < 1 || S.tickets < 1;
      if (!team.length) { info.innerHTML = `<p class="mut" style="margin:0">Nobody picked yet. Smudge is holding the door.</p>`; return; }
      const t = effStats(team, B), hp = teamStats(team).health * RD.hp_mult * (B.weak === 'health' ? RD.weak_mult : B.resist === 'health' ? RD.resist_mult : 1);
      const o = odds(b, t, hp, b.hp), pc = Math.round(o * 100), need = o < .5 ? attackNeeded(b, t, hp) : null;
      const cls = pc < 35 ? 'thin' : pc < 65 ? 'fair' : 'good';
      const says = pc < 20 ? 'Smudge would not send them.' : pc < 40 ? 'Smudge is pulling a face.' : pc < 65 ? 'Could go either way.' : pc < 85 ? 'Smudge likes these three.' : 'Smudge is already writing the win down.';
      info.innerHTML = `<p class="odds"><b class="${cls}">${pc}%</b> <span>to win, before the rooms on the way. ${says}</span></p>
        <div class="oddbar"><i class="${cls}" style="width:${pc}%"></i></div>
        <p class="tstats">${R.stats.map(k => `<span>${STATW[k]} <b${k === B.weak ? ' class="good"' : k === B.resist ? ' class="bad"' : ''}>${t[k] == null ? '' : k === 'health' ? Math.round(hp) : t[k]}</b></span>`).join('')}${need ? `<span>Wants about <b>${need}</b> attack</span>` : ''}</p>`;
    }
    drawPots(); marks(); upd(); modal.open(d, 'wide');
  }

  // the three you sent, named like people rather than a headcount: "Astrid", "Astrid & Kevin", "Astrid & co."
  const teamName = t => t.length < 2 ? (t.length ? short(t[0]) : 'Nobody') : t.length === 2 ? short(t[0]) + ' & ' + short(t[1]) : short(t[0]) + ' & co.';
  function runRaid(b, B, team, pots) {
    inRaid = b.id; tune();
    S.tickets--; if (S.tickets === RD.tickets - 1) S.ticketT = now(); save(true);
    const p = places[b.place], t = effStats(team, B), maxhp = Math.round(teamStats(team).health * RD.hp_mult * (B.weak === 'health' ? RD.weak_mult : B.resist === 'health' ? RD.resist_mult : 1));
    const st = { hp: maxhp, bhp: b.hp, fury: 0, furyAmt: 0, shield: 0, shieldAmt: 0, round: 0 }, diff = RD.room_diff[p.tier] || 100, lineMs = RD.line_ms || 1300;
    const pool = (B.rooms && B.rooms.length >= RD.rooms ? B.rooms : (B.rooms || []).concat(RAIDS.room_pool || [])).slice(), rooms = []; while (rooms.length < RD.rooms && pool.length) rooms.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    const say = (t2) => fillIn(t2, { boss: b.name, place: p.name });
    const d = el('div', 'raidrun'); d.innerHTML = `<div class="raidhead small" style="background-image:url(${OS.img('scenes', p.id)})"><div><div class="tag">${p.name}</div><h3>${b.name}</h3></div></div>
      <div class="hpbars"><div><span>${teamName(team)} <em id="r-hpn"></em></span><div class="bar"><i id="r-hp" style="width:100%;background:linear-gradient(90deg,#1f9a49,#6fe394)"></i></div></div><div><span>${b.name} <em id="r-bhpn"></em></span><div class="bar"><i id="r-bhp" style="width:100%;background:linear-gradient(90deg,#b3261e,#ff7a70)"></i></div></div></div>
      <div class="rteam">${team.map(id => `<img src="${OS.img('heroes', id)}" alt="${OS.heroes[id].name}" title="${OS.heroes[id].name}">`).join('')}</div>
      <div class="rstory" id="r-story" aria-live="polite"></div><div class="rchoices" id="r-choices"></div><div class="rpots" id="r-pots"></div>`;
    modal.open(d); let live = true; const story = $('r-story'), choices = $('r-choices');
    const gone = () => !live || !document.body.contains(story);
    const bars = () => { $('r-hp').style.width = pct(st.hp, maxhp); $('r-bhp').style.width = pct(st.bhp, b.hp); $('r-hpn').textContent = Math.max(0, Math.round(st.hp)) + ' / ' + maxhp; $('r-bhpn').textContent = Math.max(0, Math.round(st.bhp)) + ' / ' + b.hp; };
    const line = (text, cls) => { if (!text) return; const r = el('p', 'rline ' + (cls || ''), text); story.appendChild(r); story.scrollTop = story.scrollHeight; requestAnimationFrame(() => r.classList.add('in')); };
    const wait = ms => new Promise(ok => setTimeout(ok, ms));
    const voice = (tag, id) => { id = id || pick1(team); const l = react(id, tag); if (l) line(l, 'voice'); };
    bars();

    async function room(i) {
      const rm = rooms[i]; if (!rm) return fightBoss();
      line(`Room ${i + 1} of ${rooms.length}`, 'tag'); await wait(250); if (gone()) return; line(say(rm.text), 'scene'); await wait(900); if (gone()) return;
      choices.innerHTML = '';
      rm.choices.forEach(c => { const ch = Math.max(.1, Math.min(.95, t[c.stat] / (t[c.stat] + diff))), bt = el('button', 'btn rchoice', `${c.label}<span>${STATW[c.stat]} · ${Math.round(ch * 100)}%</span>`);
        bt.onclick = async () => { choices.innerHTML = ''; SND('click'); const ok = Math.random() < ch;
          line(`${c.label}.`, 'you'); await wait(600); if (gone()) return;
          if (ok) { line(say(c.ok), 'good'); st.bhp = Math.round(st.bhp * (1 - RD.room_bonus)); voice('ok'); }
          else { const hurt = Math.round(maxhp * RD.room_hurt); st.hp = Math.max(1, st.hp - hurt); SND('hit'); line(say(c.bad) + ` (−${hurt} health)`, 'bad'); voice(st.hp < maxhp * .5 ? 'hurt' : 'fail'); }
          bars(); await wait(lineMs); if (!gone()) room(i + 1); };
        choices.appendChild(bt); });
    }
    function drawPots() {
      const box = $('r-pots'); if (!box) return; box.innerHTML = ''; if (!pots.length) return;
      pots.forEach((id, k) => { const x = R.potions.find(q => q.id === id), bt = el('button', 'potbtn small', `<img src="${OS.img('loot', id)}" alt=""><span><b>${x.name}</b></span>`); bt.type = 'button';
        bt.onclick = () => { if (!(S.bag[id] > 0)) return; S.bag[id]--; pots.splice(k, 1); bump('tonics');
          if (x.effect === 'heal') { const g = Math.round(maxhp * x.amount); st.hp = Math.min(maxhp, st.hp + g); line(`The team drinks a ${x.name}. +${g} health.`, 'good'); }
          if (x.effect === 'shield') { st.shield = x.rounds; st.shieldAmt = x.amount; line(`The team drinks an ${x.name}. The next ${x.rounds} hits do half damage.`, 'good'); }
          if (x.effect === 'fury') { st.fury = x.rounds; st.furyAmt = x.amount; line(`The team drinks a ${x.name}. The next ${x.rounds} blows land harder.`, 'good'); }
          SND('confirm'); bars(); drawPots(); save(true); };
        box.appendChild(bt); });
      box.prepend(el('span', 'mut', 'Drink:'));
    }
    async function fightBoss() {
      choices.innerHTML = ''; line(B.lines.open ? say(B.lines.open) : `${b.name} attacks.`, 'scene'); await wait(500); voice('boss'); drawPots(); await wait(lineMs); let lowSaid = false;
      while (!gone() && st.hp > 0 && st.bhp > 0 && st.round < RD.rounds) {
        st.round++; const who = team[(st.round - 1) % team.length], ev = exchange(st, b, t, who), nm = short(who);
        for (const e of ev) {
          if (gone()) return;
          if (e.kind === 'foe') { SND('hit', { vol: .8 }); line((B.lines.hit ? say(pick1(B.lines.hit)) : `${b.name} hits back.`) + ` (−${e.dmg}${e.shielded ? ', shielded' : ''})`, 'foe'); if (st.hp < maxhp * .3 && Math.random() < .5) voice('hurt'); }
          else { SND('hit'); line(`${nm} ${e.crit ? 'lands a huge hit' : e.twice ? 'strikes twice' : 'hits'} for ${e.dmg}.`, e.crit ? 'crit' : 'hit'); }
          bars(); await wait(lineMs);
        }
        if (!lowSaid && st.bhp > 0 && st.bhp < b.hp * .3 && B.lines.low) { lowSaid = true; line(say(B.lines.low), 'scene'); await wait(lineMs); }
      }
      if (gone()) return; finish(st.bhp <= 0);
    }
    function finish(win) {
      live = false; $('r-pots').innerHTML = ''; const got = [];
      if (win) { line(B.lines.win ? say(B.lines.win) : `${b.name} goes down.`, 'good'); voice('win'); SND('win');
        const first = !S.raids[b.id], rolls = (RD.rolls_by_tier || {})[p.tier] || RD.loot_rolls, pay = Math.round(b.gold * (first ? (RD.first_kill_mult || 1) : 1));
        roll([{ place: p.id, n: rolls, luck: fullLuck(p, RD.loot_luck + t.luck / 100) }, { place: p.id, n: 1, luck: 0, gear: true }]).then(r => { flat(r.add).forEach(x => { if (OS.items[x]) got.push(x); }); showGot(); save(true); });
        if (+p.tier >= (RD.crate_from_tier || 9)) { give('x_crate'); got.push('x_crate'); }
        if (+p.tier >= (RD.shards_from_tier || 9)) { for (let i = 0; i < (RD.shards || 0); i++) give('x_shard'); got.push('x_shard'); }
        bump('raids_won'); bump('gold', pay); S.gold += pay; S.raids[b.id] = (S.raids[b.id] || 0) + 1; gainXP(p.skill, R.tier[p.tier].xp * 5);
        team.forEach(id => journal(id, `Beat ${b.name} at ${p.name}.`, 'raid'));
      } else { line(B.lines.lose ? say(B.lines.lose) : 'The team limps home.', 'bad'); voice('lose'); SND('deny'); const cons = Math.round(b.gold * .1); S.gold += cons;
        S.recover = S.recover || {}; team.forEach(id => S.recover[id] = now() + RD.recover_minutes * 60000); }
      Cloud.log('raid', b.id, win ? 1 : 0); save(true);
      const tips = [`Put gear on them: open an arrival and tap the glowing slots on the back of the card.`,
        `Train the stat this one is weak to. ${B.weak ? STATW[B.weak] + ' counts for ' + Math.round((RD.weak_mult - 1) * 100) + '% more against ' + b.name + '.' : 'Training lifts every fight.'}`,
        `Pack both potion slots. A Healing Draught alone has turned a loss around.`,
        `Level their cards. Another copy of the same hero makes every number bigger.`,
        `Bring someone else. The pile of stats is what fights, not the names.`];
      const end = el('div', 'reveal', `<h3 style="font-size:1.5rem;color:${win ? 'var(--gold2)' : '#ff7a70'}">${win ? 'Down it goes' : 'They limped home'}</h3>` +
        (win ? `<p class="mut">${OS.num(Math.round(b.gold * (S.raids[b.id] === 1 ? (RD.first_kill_mult || 1) : 1)))} gold${S.raids[b.id] === 1 ? ', five times over for the first kill' : ''}, and whatever it was guarding.</p>`
             : `<p class="mut">${Math.round(b.gold * .1)} gold for the trouble, and ${teamName(team)} ${team.length > 1 ? 'are' : 'is'} asleep for ${RD.recover_minutes} minutes.</p>
                <div class="spoils" style="text-align:left"><div class="tag">Smudge's advice</div><ul>${tips.sort(() => Math.random() - .5).slice(0, 3).map(t => `<li>${t}</li>`).join('')}</ul></div>`));
      const g = el('div', 'row'); g.style.justifyContent = 'center'; const showGot = () => { g.innerHTML = ''; got.forEach(x => g.appendChild(OS.slot(x))); }; end.append(g, btn('', 'Good', modal.close)); choices.innerHTML = ''; choices.appendChild(end); render();
    }
    // closing the sheet mid-raid is a retreat: the ticket is spent, nobody is hurt, nothing is won
    const obs = new MutationObserver(() => { if (!document.body.contains(story) || !$('modal').classList.contains('on')) { if (live) { live = false; Cloud.log('raid', b.id, 0); } obs.disconnect(); } }); obs.observe($('modal'), { attributes: true, childList: true, subtree: true });
    room(0);
  }
  // ------------------------------------------------------------------ the city, shop, account
  // ---- the city: rankings, friends, guilds, the market stall and the mailbox
  let cityTab = 'ranks', citySkill = '', soc = null, socAt = 0, mkt = null, mktFilter = '';
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tradable = id => { const it = OS.items[id]; return it && S.bag[id] > 0 && !it.junk && !it.owner && (it.kind === 'gear' || it.kind === 'loot' || it.kind === 'crate'); };
  const itName = id => OS.items[id] ? OS.items[id].name : 'Something odd';
  const guildGoal = g => 1500 * Math.max(1, g.members.length);
  async function loadSoc(force) { if (!force && soc && now() - socAt < 20000) return soc; try { soc = await Cloud.social(); socAt = now(); } catch (e) { soc = soc || { friends: [], mail: [], guild: null, guilds: [], down: true }; }
    const n = soc.mail.length; const dot = document.querySelector('[data-go="board"] .dot'); if (dot) dot.hidden = !n; return soc; }
  const say = r => { if (r && r !== 'ok') toast(r); return r === 'ok' || r === 'Asked.' || r === 'Friends now.'; };
  async function renderBoard() { const tabs = $('city-tabs'), box = $('city-body'); await loadSoc();
    const T = [['ranks', 'Rankings'], ['friends', 'Friends' + (soc.friends.filter(f => f.status !== 'ok' && !f.mine).length ? ' (' + soc.friends.filter(f => f.status !== 'ok' && !f.mine).length + ')' : '')], ['guild', 'Guild'], ['market', 'Market'], ['mail', 'Mailbox' + (soc.mail.length ? ' (' + soc.mail.length + ')' : '')]];
    tabs.innerHTML = ''; T.forEach(([k, n]) => { const b = el('button', cityTab === k ? 'on' : '', n); b.onclick = () => { cityTab = k; renderBoard(); }; tabs.appendChild(b); });
    if (box.dataset.tab === cityTab && box.dataset.t && now() - box.dataset.t < 15000) return; box.dataset.tab = cityTab; box.dataset.t = now();
    ({ ranks: cityRanks, friends: cityFriends, guild: cityGuild, market: cityMarket, mail: cityMail })[cityTab](box); }
  const cityAgain = force => { $('city-body').dataset.t = 0; if (force) socAt = 0; renderBoard(); };
  const nameBtn = n => `<b class="who2" data-peek="${esc(n)}">${esc(n)}</b>`;
  // a name as other players see it: the title they are wearing, in the colour they picked
  const PTITLES = R.titles || [], TITLE = {}; PTITLES.forEach(t => TITLE[t.id] = t);
  const FLAIRS = ['gold', 'teal', 'violet', 'ember', 'rose', 'foil'];
  const titleOwned = id => ({
    founder: () => !!(me.profile && me.profile.founder),
    collector: () => Object.keys(S.cabinet || {}).length >= 20,
    summoner: () => (S.summons || 0) >= 250,
    slayer: () => Object.keys(S.raids || {}).length >= RD.bosses.length,
    rich: () => ((S.life || {}).gold || 0) >= 1e6,
    digger: () => (S.actions || 0) >= 50000,
    complete: () => Object.keys(S.roster || {}).length >= Object.keys(OS.heroes).length,
  }[id] || (() => false))();
  const flairOwned = f => PTITLES.some(t => t.flair === f && titleOwned(t.id));
  function nameTag(n, title, flair) {
    const t = TITLE[title], f = FLAIRS.includes(flair) ? ' f f-' + flair : '';
    return `<span class="pname${f}">${nameBtn(n)}${t ? `<em class="ttl">${t.name}</em>` : ''}</span>`;
  }
  function wirePeek(box) { box.querySelectorAll('[data-peek]').forEach(b => b.onclick = () => peek(b.dataset.peek)); }
  async function cityRanks(box) { box.innerHTML = '<div class="panel"><div class="chips" id="rk-sk"></div><div id="rk-list"><p class="mut">Counting.</p></div></div>';
    [''].concat(R.skills).forEach(k => { const b = el('button', 'chip' + (citySkill === k ? ' on' : ''), k || 'Total level'); b.onclick = () => { citySkill = k; cityAgain(); }; $('rk-sk').appendChild(b); });
    let rows = []; try { rows = citySkill ? await Cloud.boardSkill(citySkill) : await Cloud.board(); } catch (e) { }
    $('rk-list').innerHTML = rows.length ? rows.map((r, i) => `<div class="brow ${r.username === me.profile.username ? 'me' : ''}"><i>${i + 1}</i>${nameTag(r.username, r.title, r.flair)}` + (citySkill ? `<span>Level ${lvlOf(r.xp)}${r.rebirth ? ' ' + '★'.repeat(r.rebirth) : ''}</span><span>${OS.num(r.xp)} xp</span>` : `<span>Total level ${r.total_level}</span><span>${r.heroes} arrivals</span><span>${r.summons} summons</span>`) + '</div>').join('') : '<p class="mut">Nobody yet. Be the first name in the book.</p>'; wirePeek(box); }
  function cityFriends(box) { box.innerHTML = `<div class="panel"><div class="addrow"><input type="text" id="fr-name" maxlength="24" placeholder="A name from the rankings"><button class="btn small" id="fr-add">Add friend</button></div><div id="fr-list"></div></div>`;
    $('fr-add').onclick = async () => { const n = $('fr-name').value.trim(); if (!n) return; try { toast(await Cloud.friendAdd(n)); } catch (e) { toast('Smudge cannot reach the city right now.'); } cityAgain(true); };
    const L = $('fr-list'); if (!soc.friends.length) { L.innerHTML = '<p class="mut" style="margin:.8rem 0 0">No friends yet. Tap any name in the rankings to look at their ledger and add them. Friends can send each other things.</p>'; return; }
    soc.friends.forEach(f => { const row = el('div', 'frow', `<div><i class="face sm" style="${faceStyle(f.avatar)}"></i>${nameTag(f.username, f.title, f.flair)}<span class="mut">${f.status === 'ok' ? 'Total level ' + f.total_level + ' · ' + f.heroes + ' arrivals' : f.mine ? 'Asked. Waiting on them.' : 'Wants to be friends.'}</span></div>`), acts = el('div', 'facts');
      if (f.status === 'ok') acts.appendChild(btn('small', 'Send a gift', () => giftSheet(f.username))); else if (!f.mine) acts.appendChild(btn('small', 'Accept', async () => { await Cloud.friendAdd(f.username); cityAgain(true); }));
      acts.appendChild(btn('small ghost', f.status === 'ok' ? 'Remove' : f.mine ? 'Cancel' : 'No', async () => { await Cloud.friendDrop(f.username); cityAgain(true); })); row.appendChild(acts); L.appendChild(row); }); wirePeek(box); }
  async function peek(n) { let p; try { p = await Cloud.peek(n); } catch (e) { } if (!p) { toast('That ledger is shut.'); return; }
    const d = el('div', 'peek'), top = Object.keys(p.xp).sort((a, c) => p.xp[c] - p.xp[a]).slice(0, 4), own = Object.keys(p.roster);
    d.innerHTML = `<div class="tag">Somebody else’s ledger</div><h3 style="margin:.2rem 0 .1rem;display:flex;align-items:center;gap:.6rem"><i class="face md" style="${faceStyle(p.avatar)}"></i><span class="pname${FLAIRS.includes(p.flair) ? ' f f-' + p.flair : ''}"><b>${esc(p.username)}</b>${TITLE[p.title] ? `<em class="ttl">${TITLE[p.title].name}</em>` : ''}</span></h3><p class="mut" style="margin:0 0 .7rem">${p.guild ? 'Guild: ' + esc(p.guild) + ' · ' : ''}Total level ${p.total_level} · ${own.length} arrivals met · ${p.cabinet} treasures on display</p>
      <div class="pkstats">${top.map(k => `<div class="stat"><b>${lvlOf(p.xp[k])}${p.rebirth[k] ? '<small> ' + '★'.repeat(p.rebirth[k]) + '</small>' : ''}</b><span>${k}</span></div>`).join('')}</div><div class="tag" style="margin-top:.8rem">${(p.crew || []).some(x => x) ? 'Their crew' : 'Their best cards'}</div><div class="pkcards"></div>`;
    const show = ((p.crew || []).filter(x => x && OS.heroes[x]).length ? p.crew.filter(x => x && OS.heroes[x]) : own.filter(x => OS.heroes[x]).sort((a, c) => p.roster[c] - p.roster[a]).slice(0, 3));
    show.forEach(id => d.querySelector('.pkcards').appendChild(OS.card(OS.heroes[id], { mini: true, level: p.roster[id] || 1, noflip: true })));
    const acts = el('div', 'facts'); acts.style.marginTop = '.9rem';
    if (p.username !== me.profile.username) { if (p.friend === 'ok') acts.appendChild(btn('', 'Send a gift', () => giftSheet(p.username))); else if (!p.friend) acts.appendChild(btn('', 'Add friend', async () => { toast(await Cloud.friendAdd(p.username)); socAt = 0; modal.close(); cityAgain(true); })); else acts.appendChild(el('span', 'mut', 'Friend request pending.')); }
    acts.appendChild(btn('ghost', 'Close', modal.close)); d.appendChild(acts); modal.open(d); }
  function pickItem(title, note, go) { const d = el('div', ''), ids = Object.keys(S.bag).filter(tradable); d.innerHTML = `<div class="tag">${title}</div><p class="mut" style="margin:.3rem 0 .8rem">${note}</p>`;
    if (!ids.length) d.appendChild(el('p', 'mut', 'Nothing spare in the bag. Junk and a hero’s own gear stay with you.')); const g = el('div', 'itemrow'); ids.forEach(id => { const sl = OS.slot(id, { count: S.bag[id] }); sl.onclick = () => go(id); g.appendChild(sl); }); d.appendChild(g); d.appendChild(btn('ghost', 'Never mind', modal.close)); modal.open(d); }
  function giftSheet(n) { pickItem('A gift for ' + esc(n), 'Pick one thing. It leaves your bag now and waits in their mailbox.', async id => { const r = await srv(() => Cloud.gift(n, id, 1));
      if (r.r !== 'ok') toast(r.r); else { bump('gifts'); toast(`${itName(id)} is on its way to ${n}.`); } modal.close(); render(); }); }
  function cityMail(box) { box.innerHTML = '<div class="panel" id="ml"></div>'; const L = $('ml'); if (!soc.mail.length) { L.innerHTML = '<p class="mut" style="margin:0">Empty. Gifts from friends and gold from your market stall arrive here.</p>'; return; }
    soc.mail.forEach(m => { const pl = m.payload || {}, row = el('div', 'frow'); const sl = OS.items[pl.item] ? OS.slot(pl.item, { count: pl.qty > 1 ? pl.qty : 0 }) : el('div', ''); sl.classList.add('msl'); row.appendChild(sl);
      row.appendChild(el('div', '', m.kind === 'sale' ? `<b>${OS.num(pl.gold)} gold</b><span class="mut">${esc(m.from)} bought your ${itName(pl.item)}.</span>` : `<b>${itName(pl.item)}${pl.qty > 1 ? ' ×' + pl.qty : ''}</b><span class="mut">A gift from ${esc(m.from)}.</span>`));
      row.appendChild(btn('small', 'Collect', async () => { const r = await srv(() => Cloud.mailClaim(m.id)); if (r.r !== 'ok') toast(r.r); else if (r.kind === 'sale') { const q = (r.payload || {}).gold || 0; bump('gold', q); bump('gold_market', q); } render(); cityAgain(true); })); L.appendChild(row); }); }
  function cityGuild(box) { const g = soc.guild; if (!g) { box.innerHTML = `<div class="panel"><h3 style="margin-top:0">Guilds</h3><p class="mut">Up to thirty players working toward one shared goal each week, with a room to talk in. Every haul any of you brings in counts.</p><div class="addrow"><input type="text" id="gd-name" maxlength="24" placeholder="Name a new guild"><button class="btn small" id="gd-new">Found it</button></div><div class="tag" style="margin-top:1rem">Busiest this week</div><div id="gd-list"></div></div>`;
      $('gd-new').onclick = async () => { const n = $('gd-name').value.trim(); if (n && say(await Cloud.guildCreate(n))) cityAgain(true); };
      $('gd-list').innerHTML = soc.guilds.length ? '' : '<p class="mut">None yet. Yours could be the first.</p>'; soc.guilds.forEach(x => { const row = el('div', 'frow', `<div><b>${esc(x.name)}</b><span class="mut">${x.members} of 30 · ${OS.num(x.hauls)} hauls this week</span></div>`); row.appendChild(btn('small', 'Join', async () => { if (say(await Cloud.guildJoin(x.name))) cityAgain(true); })); $('gd-list').appendChild(row); }); return; }
    const goal = guildGoal(g), pct = Math.min(100, g.hauls / goal * 100), done = g.hauls >= goal, got = S.guildWk === 'w' + g.week;
    box.innerHTML = `<div class="panel"><div class="ghead"><div><div class="tag">Your guild</div><h3 style="margin:.1rem 0">${esc(g.name)}</h3></div><button class="btn small ghost" id="gd-leave">Leave</button></div>
      <div class="tag" style="margin-top:.7rem">This week’s goal</div><div class="guildbar"><i style="width:${pct}%"></i><span>${OS.num(g.hauls)} / ${OS.num(goal)} hauls</span></div>
      <p class="mut" style="margin:.4rem 0 .6rem">${done ? 'Done. Everyone in the guild gets 3 crates and 5 shards.' : 'Reach it together and everyone who brought in 100 hauls gets 3 crates and 5 shards. Resets every Monday.'}</p><div id="gd-claim"></div>
      <div class="tag" style="margin-top:.6rem">Members</div><div id="gd-mem"></div></div><div class="panel" style="margin-top:.9rem"><div class="tag">Guild room</div><div class="chat" id="gd-chat"></div><div class="addrow"><input type="text" id="gd-say" maxlength="200" placeholder="Say something"><button class="btn small" id="gd-send">Send</button></div></div>`;
    if (done) { const b = btn('', got ? 'Collected' : 'Collect the reward', async () => { const r = await srv(() => Cloud.guildClaim()); if (r.r === 'ok') { S.guildWk = 'w' + g.week; bump('guild_goals'); toast('3 crates and 5 shards are in your bag.'); } else { toast(r.r); if (/Already/.test(r.r)) S.guildWk = 'w' + g.week; } render(); cityAgain(); }); b.disabled = got; $('gd-claim').appendChild(b); }
    $('gd-mem').innerHTML = g.members.map(m => `<div class="brow g ${m.username === me.profile.username ? 'me' : ''}">${nameTag(m.username, m.title, m.flair)}<span>Level ${m.total_level}</span><span>${OS.num(m.hauls)} hauls</span></div>`).join('');
    const ch = $('gd-chat'); ch.innerHTML = g.chat.length ? g.chat.map(c => `<p><b>${esc(c.username)}</b> ${esc(c.body)}</p>`).join('') : '<p class="mut">Quiet in here.</p>'; ch.scrollTop = 1e6;
    const send = async () => { const t = $('gd-say').value.trim(); if (!t) return; $('gd-say').value = ''; try { say(await Cloud.guildSay(t)); } catch (e) { toast('Smudge cannot reach the city right now.'); } cityAgain(true); };
    $('gd-send').onclick = send; $('gd-say').onkeydown = e => { if (e.key === 'Enter') send(); };
    $('gd-leave').onclick = async () => { await Cloud.guildLeave(); cityAgain(true); }; wirePeek(box); }
  async function cityMarket(box) { box.innerHTML = '<div class="panel"><p class="mut">Opening the shutters.</p></div>'; try { mkt = await Cloud.market(); } catch (e) { mkt = { open: [], mine: [] }; }
    box.innerHTML = `<div class="panel"><div class="ghead"><div><div class="tag">Your stall</div><span class="mut">${mkt.mine.length} of 10 spots. The market keeps one coin in twenty.</span></div><button class="btn small" id="mk-sell">Sell something</button></div><div id="mk-mine"></div></div>
      <div class="panel" style="margin-top:.9rem"><div class="ghead"><div class="tag">For sale</div><input type="text" id="mk-find" placeholder="Search" value="${esc(mktFilter)}" style="max-width:11rem"></div><div id="mk-open"></div></div>`;
    $('mk-sell').onclick = () => pickItem('Put something on your stall', 'It leaves your bag until it sells or you take it back.', listSheet);
    mkt.mine.forEach(l => { const row = el('div', 'frow'); const sl = OS.items[l.item] ? OS.slot(l.item, {}) : el('div', ''); sl.classList.add('msl'); row.appendChild(sl); row.appendChild(el('div', '', `<b>${itName(l.item)}</b><span class="mut">${OS.num(l.price)} gold</span>`));
      row.appendChild(btn('small ghost', 'Take back', async () => { await srv(() => Cloud.marketCancel(l.id)); render(); cityAgain(); })); $('mk-mine').appendChild(row); });
    const draw = () => { const O = $('mk-open'), f = mktFilter.toLowerCase(), rows = mkt.open.filter(l => OS.items[l.item] && (!f || itName(l.item).toLowerCase().includes(f))).sort((a, c) => a.price - c.price); O.innerHTML = rows.length ? '' : '<p class="mut" style="margin:.6rem 0 0">Nothing on the stalls right now.</p>';
      rows.forEach(l => { const it = OS.items[l.item], row = el('div', 'frow r-' + it.rarity); const sl = OS.slot(l.item, {}); sl.classList.add('msl'); row.appendChild(sl); row.appendChild(el('div', '', `<b style="color:var(--rc)">${it.name}</b><span class="mut">${OS.cap(it.rarity || it.kind)} · from ${esc(l.seller)}</span>`));
        const b = btn('small', OS.num(l.price) + ' gold', async () => { if (S.gold < l.price) return toast('Not enough gold.'); const r = await srv(() => Cloud.marketBuy(l.id)); if (r.r !== 'ok') toast(r.r); else { bump('market_buys'); bump('gold_spent', l.price); toast(`Bought ${itName(l.item)}.`); } render(); cityAgain(); }); b.disabled = S.gold < l.price; row.appendChild(b); O.appendChild(row); }); };
    draw(); $('mk-find').oninput = e => { mktFilter = e.target.value; draw(); }; }
  function listSheet(id) { const it = OS.items[id], d = el('div', ''), base = Math.max(5, (it.sell || 20) * 3); d.innerHTML = `<div class="tag">Set a price</div><h3 style="margin:.2rem 0 .6rem">${it.name}</h3><div class="addrow"><input type="text" id="ls-price" inputmode="numeric" value="${base}"><span class="mut">gold</span></div><p class="mut" id="ls-note" style="margin:.5rem 0 .8rem"></p>`;
    const note = () => { const v = Math.floor(+d.querySelector('#ls-price').value || 0); d.querySelector('#ls-note').textContent = v >= 1 && v <= 100000 ? `You get ${OS.num(v - Math.ceil(v * .05))} gold when it sells. Selling it for scrap pays ${it.sell || 0}.` : 'Between 1 and 100,000 gold.'; return v; };
    d.appendChild(btn('', 'Put it on the stall', async () => { const v = note(); if (v < 1 || v > 100000 || !(S.bag[id] > 0)) return; const r = await srv(() => Cloud.marketList(id, 1, v)); if (r.r !== 'ok') toast(r.r); else bump('market_lists'); modal.close(); render(); cityAgain(); }));
    d.appendChild(btn('ghost', 'Never mind', modal.close)); modal.open(d); d.querySelector('#ls-price').oninput = note; note(); }
  function renderShop() { if ($('shoplist').children.length) return; [['A dry hood', 'An outfit for Smudge.'], ['Gilded frames', 'A card frame set.'], ['Midnight Archive', 'A new look for the cellar.'], ['Supporter badge', 'Next to your name in the city.']].forEach(([a, b]) => $('shoplist').appendChild(el('div', 'tile soon', `<b>${a}</b><span>${b}</span><em>Opening soon</em>`))); }
  // a pet opened this page asking to be linked: show its four-letter check and ask
  function petAsk() { const req = Cloud.petWaiting(); if (!req) return; const d = el('div', 'reveal');
    d.innerHTML = `<div class="tag">Desktop pet</div><h3 style="font-size:1.5rem;margin:.2rem 0 .5rem">Link this desktop pet to ${esc(me.profile.username)}?</h3><p class="mut">The pet on your screen should be showing this check. If it is not, or you did not just press Link in your own pet, press No.</p><div class="petcode" style="align-items:center"><b>${esc(req.slice(0, 4).toUpperCase())}</b></div>`;
    const row = el('div', 'row'); row.style.justifyContent = 'center';
    row.appendChild(btn('', 'Yes, link it', async () => { let r; try { r = await Cloud.linkApprove(req, 'Desktop pet'); } catch (e) { r = 'Smudge cannot reach the city right now.'; } Cloud.petDone(); modal.close(); toast(r === 'ok' ? 'Linked. The pet will pick it up in a moment.' : r); renderPet(true); }));
    row.appendChild(btn('ghost', 'No', () => { Cloud.petDone(); modal.close(); })); d.appendChild(row); modal.open(d); }
  // the desktop pet: linked from the pet itself through the browser; here, the list of pets already linked
  let petCode = null, petList = null, petAt = 0;
  async function renderPet(force) { const box = $('ac-pet'); if (!box) return; if (force || !petList || now() - petAt > 30000) { try { petList = await Cloud.devices() || []; } catch (e) { petList = petList || []; } petAt = now(); }
    box.innerHTML = ''; box.appendChild(el('p', 'mut', 'To link a desktop pet, open its Settings and press <i>Link in browser</i>. This page will ask you to confirm.'));
    petList.forEach(d => { const row = el('div', 'frow', `<div><b>${esc(d.name)}</b><span class="mut">Linked ${new Date(d.linked).toLocaleDateString()}${d.seen ? ' · last seen ' + new Date(d.seen).toLocaleDateString() : ' · not used yet'}</span></div>`);
      row.appendChild(btn('small ghost', 'Unlink', async () => { try { await Cloud.deviceDrop(d.id); } catch (e) { } renderPet(true); })); box.appendChild(row); }); }
  let NOTES = [];   // the update notes, newest first (loaded further down)
  let acTab = 'you';
  function renderAccount() {
    renderPet();
    const P = me.profile, L = S.life || {};
    // ---- the header: who you are, as everyone else sees you, with the four numbers worth bragging about
    $('ac-face').style.cssText = faceStyle(P.avatar);
    $('ac-name').innerHTML = `<span class="pname${FLAIRS.includes(P.flair) ? ' f f-' + P.flair : ''}"><b>${esc(P.username)}</b>${TITLE[P.title] ? `<em class="ttl">${TITLE[P.title].name}</em>` : ''}</span>`;
    $('ac-sub').textContent = [P.founder ? 'Founding Clerk' : null, 'Joined ' + (P.created_at ? new Date(P.created_at).toLocaleDateString() : 'today'),
      P.avatar && OS.heroes[P.avatar] ? 'Wearing ' + short(P.avatar) + '’s face' : 'Wearing Smudge’s face'].filter(Boolean).join(' · ');
    const look = $('ac-look'); look.innerHTML = '';
    look.append(btn('small ghost', 'Change picture', faceSheet), btn('small ghost', 'Title and colour', lookSheet));
    const tile = (k, v, lab) => `<div class="actile ${k}"><b>${v}</b><span>${lab}</span></div>`;
    $('ac-top').innerHTML = tile('lvl', totalLevel(), 'Total level') + tile('her', Object.keys(S.roster).length + ' / ' + Object.keys(OS.heroes).length, 'Arrivals met')
      + tile('sum', OS.num(S.summons || 0), 'Summons') + tile('tim', fmt(L.seconds || 0), 'Time played');

    // ---- tabs, so nothing is three screens down
    const T = [['you', 'You'], ['set', 'Settings'], ['stats', 'Your ledger']];
    $('ac-tabs').innerHTML = ''; T.forEach(([k, n]) => { const b = el('button', 'chip' + (acTab === k ? ' on' : ''), n); b.onclick = () => { acTab = k; renderAccount(); }; $('ac-tabs').appendChild(b); });
    T.forEach(([k]) => $('acp-' + k).hidden = acTab !== k);

    if (acTab === 'you') {
      $('ac-you').innerHTML = `<div class="kv"><span>Name</span><b>${esc(P.username)}</b></div><div class="kv"><span>Email</span><b>${esc(me.email || '')}</b></div>
        <div class="kv"><span>Joined</span><b>${P.created_at ? new Date(P.created_at).toLocaleDateString() : 'today'}</b></div>
        ${P.founder ? '<div class="kv"><span>Title held for good</span><b style="color:var(--gold)">Founding Clerk</b></div>' : ''}`;
      const has = q => (me.providers || []).includes(q);
      $('ac-logins').innerHTML = `<div class="kv"><span>Password</span><b>${has('email') ? 'Set' : 'Not set'}</b></div><div class="kv"><span>Google</span><b>${has('google') ? 'Connected' : 'Not connected'}</b></div>
        <div class="kv soon"><span>Steam</span><b>${P.steam_id ? 'Connected' : 'Coming soon'}</b></div>
        <p class="mut" style="font-size:.85rem;margin:.6rem 0 0">Steam opens when the game reaches Steam. Until then the desktop pet links through your browser.</p>`;
    }

    if (acTab === 'set') {
      const st = $('ac-settings'); st.innerHTML = '';
      const voice = el('div', 'kv', '<span>Smudge’s voice</span>'), sel = el('select');
      MODES.forEach(m => sel.appendChild(new Option(m === 'unhinged' ? 'Unhinged (18+)' : OS.cap(m), m))); sel.value = S.mode;
      sel.onchange = () => { if (sel.value === 'unhinged' && !confirm('Unhinged Smudge swears. A lot. Adults only. Turn it on?')) { sel.value = S.mode; return; } S.mode = sel.value; Cloud.setProfile({ voice: S.mode }); save(true); toast(line('idle')); };
      voice.appendChild(sel); st.appendChild(voice);
      if (OS.Sound) { const c0 = OS.Sound.config();
        const tog = (label, key) => { const l = el('label', 'kv', `<span>${label}</span>`), i = el('input'); i.type = 'checkbox'; i.checked = !!c0[key]; i.onchange = () => OS.Sound.config({ [key]: i.checked }); l.appendChild(i); st.appendChild(l); };
        const sld = (label, key) => { const l = el('label', 'kv', `<span>${label}</span>`), i = el('input'); i.type = 'range'; i.min = 0; i.max = 100; i.value = Math.round(c0[key] * 100); i.oninput = () => OS.Sound.config({ [key]: i.value / 100 }); i.onchange = () => OS.Sound.play('click'); l.appendChild(i); st.appendChild(l); };
        tog('Sound effects', 'sfx'); sld('Sound volume', 'vol'); tog('Music', 'music'); sld('Music volume', 'mvol'); }
      const ac = el('label', 'kv', '<span>Open crates the moment they land</span>'), cb = el('input'); cb.type = 'checkbox'; cb.checked = !!S.autoCrate; cb.onchange = () => { S.autoCrate = cb.checked; save(true); }; ac.appendChild(cb); st.appendChild(ac);
      const as = el('label', 'kv', '<span>Smudge summons by himself when the ink is full</span>'), ab = el('input'); ab.type = 'checkbox'; ab.checked = !!S.autoSummon; ab.onchange = () => { S.autoSummon = ab.checked; save(true); }; as.appendChild(ab); st.appendChild(as);
      $('ac-ver').textContent = NOTES[0] ? 'Beta ' + NOTES[0].v : '';
      const up = $('ac-up'); up.innerHTML = '';
      const em = el('label', 'kv', '<span>Email me update notes</span>'), eb = el('input'); eb.type = 'checkbox'; eb.checked = !!P.email_updates;
      eb.onchange = async () => { const on = eb.checked, ok = await Cloud.setProfile({ email_updates: on }); if (!ok) { eb.checked = !on; return toast('That did not save. Try again.'); } P.email_updates = on; toast(on ? 'Done. Smudge writes when the game updates, and only then.' : 'No more update emails.'); };
      em.appendChild(eb); up.appendChild(em);
      const note = el('p', 'mut', 'A short note from Smudge when the game updates. Nothing else, ever.'); note.style.cssText = 'font-size:.85rem;margin:.3rem 0 .7rem'; up.appendChild(note);
      up.appendChild(btn('small ghost', 'What changed lately', () => notesSheet()));
    }

    if (acTab !== 'stats') return;
    // ---- the ledger: skills with their own bars, then everything counted, in colour
    const box = $('ac-stats'); box.innerHTML = '';
    const skills = el('div', 'panel'); skills.innerHTML = '<h3>Trades</h3>';
    const sg = el('div', 'skgrid');
    R.skills.forEach(k => {
      const lv = level(k), rb = rebirths(k), cur = S.xp[k] || 0, at = lv > 1 ? R.xp_table[lv - 1] : 0, next = R.xp_table[lv] || cur, pc = lv >= 99 ? 100 : Math.max(0, Math.min(100, (cur - at) / Math.max(1, next - at) * 100));
      const w = el('div', 'skrow'); w.innerHTML = `<div class="spread"><b>${k}${rb ? ' <em>' + '★'.repeat(rb) + '</em>' : ''}</b><span>Level ${lv}</span></div>
        <div class="skbar"><i style="width:${pc}%"></i></div><span class="mut">${OS.num(Math.floor(cur))} xp</span>`;
      if (lv >= 99 && rb < RB.max) w.appendChild(btn('small', 'Rebirth', () => rebirth(k)));
      sg.appendChild(w);
    });
    skills.appendChild(sg); box.appendChild(skills);

    const best = Object.keys(S.roster).sort((a, c) => power(c) - power(a))[0], mTot = Object.values(S.mastery).reduce((t, m) => t + Object.values(m).reduce((q, x) => q + lvlOf(x) - 1, 0), 0);
    const gearOwned = Object.values(OS.items).filter(i => i.kind === 'gear' && owns(i.id)).length, gearAll = Object.values(OS.items).filter(i => i.kind === 'gear').length, kits = Object.keys(S.roster).filter(id => kitCount(id) >= 3).length;
    const groups = [
      ['Collection', 'col', [['Arrivals', Object.keys(S.roster).length], ['Maxed cards', Object.keys(S.roster).filter(id => cardLevel(S.roster[id]) >= R.card.max_level).length],
        ['Cabinet', Object.keys(S.cabinet).length + ' / ' + treasures.length], ['Gear found', gearOwned + ' / ' + gearAll], ['Full kits', kits],
        ['Duplicates', L.dupes || 0], ['Shards', S.bag.x_shard || 0], ['Strongest', best ? short(best) : '—']]],
      ['Work', 'wrk', [['Hauls', OS.num(S.actions)], ['Finds', OS.num(L.finds || 0)], ['Expeditions', L.expeditions || 0], ['Crafted', L.made || 0],
        ['Rare+ found', OS.num(RAR.slice(2).reduce((t, r) => t + (L['finds_' + r] || 0), 0))], ['Mastery', mTot], ['Contracts', L.contracts || 0], ['Rebirths', rebirthTotal()]]],
      ['Ink and gold', 'gld', [['Ink earned', OS.num(L.ink || 0)], ['Ink spent', OS.num(L.ink_spent || 0)], ['Ink bonus', '+' + Math.round((inkBonus() - 1) * 1000) / 10 + '%'],
        ['Stamps', OS.num(L.stamps || 0)], ['Summons', OS.num(S.summons)], ['Gold earned', OS.num(L.gold || 0)], ['Sold for', OS.num(L.gold_sold || 0)], ['Gold spent', OS.num(L.gold_spent || 0)]]],
      ['Fights', 'fgt', [['Raids won', L.raids_won || 0], ['Bosses', Object.keys(S.raids).length + ' / ' + RD.bosses.length], ['Crates', L.crates || 0],
        ['Tonics', L.tonics || 0], ['Gifts', L.gifts || 0], ['Time played', fmt(L.seconds || 0)]]]];
    groups.forEach(([t, cls, rows]) => {
      const pan = el('div', 'panel ' + cls); pan.style.marginTop = '.9rem'; pan.innerHTML = `<h3>${t}</h3>`;
      const g = el('div', 'statgrid');
      rows.forEach(([a, v]) => g.appendChild(el('div', 'stat', `<b>${v}</b><span>${a}</span>`)));
      pan.appendChild(g); box.appendChild(pan);
    });
    const foot = el('p', 'mut'); foot.style.cssText = 'font-size:.8rem;margin:.7rem 0 0';
    foot.textContent = 'Counting started when this page was added, so an older ledger begins part-way.';
    box.appendChild(foot);
  }
  $('ac-stats').addEventListener('click', e => { const b = e.target.closest('[data-rb]'); if (b) rebirth(b.dataset.rb); });
  $('ac-out').onclick = async () => { await save(true); Cloud.signOut(); };
  // No "start over" in here on purpose: a wipe goes through the owner, who can do it from the Players tab.

  const renderers = { home: renderHome, jobs: renderJobs, summon: renderSummon, heroes: renderHeroes, bag: renderBag, workshop: renderWorkshop, training: renderTraining, raids: renderRaids, board: renderBoard, shop: renderShop, account: renderAccount };
  function render() { renderTop(); renderers[current](); }

  // ------------------------------------------------------------------ the clock
  (function offline() { const gone = Math.min((now() - S.last) / 1000, R.crew.offline_hours * 3600); if (gone > 60 && S.jobs.some(j => j)) { const ink0 = S.ink, got = advance(gone, true); toast(`While you were away (${fmt(gone)}): ${PEND.reduce((t, x) => t + x[2], 0)} hauls and ${OS.num(Math.max(0, S.ink - ink0))} ink.`); } else tickMeters(); })();
  setTimeout(petAsk, 900);
  let lastT = performance.now(), uiT = 0, slow = 0;
  function frame(t) {
    const dt = Math.min(2, (t - lastT) / 1000); lastT = t; bump('seconds', dt); const got = advance(dt, false);
    chatter(dt);
    if (jobsMoved) { jobsMoved = false; if (current === 'jobs' && !$('modal').classList.contains('on')) renderJobs(); }
    rollWait -= dt; if (rollWait <= 0 && PEND.length) { rollWait = 0.7; pumpRolls(); }
    uiT -= dt; if (uiT <= 0) { uiT = .1; renderTop(); document.querySelectorAll('.restlbl[data-rest],.restlbl[data-away]').forEach(restTick); S.jobs.forEach((j, i) => { if (!j) return; const tt = jobTime(j); document.querySelectorAll(`[data-job="${i}"]`).forEach(b => b.style.width = pct(j.prog, tt)); const nx = document.querySelector(`[data-next="${i}"]`); if (nx) nx.textContent = 'next in ' + Math.max(0, tt - j.prog).toFixed(1) + 's'; });
      if (S.make && $('mk-bar')) { $('mk-bar').style.width = pct(S.make.t, S.make.need); $('mk-left').textContent = fmt(Math.max(0, S.make.need - S.make.t)); }
      if (current === 'jobs') S.exped.forEach((e, i) => { const left = (e.end - now()) / 1000, b = document.querySelector(`[data-ex="${i}"]`), tx = document.querySelector(`[data-exleft="${i}"]`); if (b) b.style.width = pct(e.dur - Math.max(0, left), e.dur); if (tx) { if (left > 0) tx.textContent = fmt(left); else if (!$('modal').classList.contains('on')) renderJobs(); } });
      if (current === 'summon') renderSummon(); slow -= .1; if (slow <= 0) { slow = 1; if (['training', 'raids', 'home'].includes(current) && !$('modal').classList.contains('on')) renderers[current](); if (got.length && current === 'bag') renderBag(); } }
    requestAnimationFrame(frame);
  }
  addEventListener('keydown', e => { if (e.repeat || e.metaKey || e.ctrlKey || $('modal').classList.contains('on') || (e.target.closest && e.target.closest('input,select,textarea'))) return; if (current === 'summon') stamp(); });
  setInterval(() => { if (dirty) save(true); }, 20000);
  addEventListener('visibilitychange', () => { if (document.hidden) save(true); else sync().then(() => { const gone = (now() - S.last) / 1000; if (gone > 5) advance(Math.min(gone, R.crew.offline_hours * 3600), true); lastT = performance.now(); render(); }); });
  addEventListener('pagehide', () => save(true));
  Cloud.track(); $('boot').remove(); show('home', { silent: true }); if (START && START !== 'home' && VIEWS.includes(START)) show(START); requestAnimationFrame(frame);
  // ---- the first time a ledger is opened (a new player, or one the owner has reset): a welcome, once
  function welcome() {
    if (S.welcomed) return;
    if ($('modal').classList.contains('on')) return setTimeout(welcome, 1500);   // let an "while you were away" sheet go first
    const name = me.profile && me.profile.username ? ', ' + me.profile.username : '';
    const d = el('div', 'welcome');
    d.innerHTML = `<div class="who"><img src="/assets/v2/smudge/stamp.webp${OS.VER}" alt=""><div><div class="tag">A word from Smudge</div><h3>You made it${name}!</h3></div></div>
      <p>Thank you for being here. I mean that. One person builds this whole game, I do the summoning, and you are one of the very first people to see any of it. That makes you important. Sorry, no pressure.</p>
      <p><b>Now the honest part: things will break.</b> This is a closed beta, and I summoned the wrong hero four times before breakfast. If something looks wrong, it probably is, and it is never your fault.</p>
      <p>When it happens, press <b>Ideas or feedback?</b> up top and tell us. Bugs, ideas, complaints, all of it. Every note is read and written down, so nothing gets lost and we can get back to you.</p>
      ${OS.founder ? '<div class="note"><b>You are a Founding Clerk.</b> First players keep the title for good, and nobody who turns up later can ever wear it. Put it under your name from your account page whenever you like.</div>' : ''}`;
    const row = el('div', 'row'); row.style.cssText = 'justify-content:center;flex-wrap:wrap;margin-top:1rem';
    const close = () => modal.close();
    row.appendChild(btn('', "Let's summon someone", () => { close(); show('summon'); }));
    row.appendChild(btn('ghost', 'Show me that button', () => { close(); const f = $('go-feedback'); f.classList.add('pulse'); setTimeout(() => f.classList.remove('pulse'), 4200); }));
    d.appendChild(row); S.welcomed = Date.now(); save(true); modal.open(d);   // seen once it opens, however it is closed
  }
  setTimeout(welcome, 900);

  // ---- profile picture: Smudge, or the face of any hero you have met. The hero art is a full figure, so the
  // face is found from the rig (the eyes if it has them, the head part if not) and shown by background position.
  function faceStyle(id) {
    const e = id && OS.heroes[id] && OS.rig['h_' + id];
    if (!e || !e.avatar) return `background-image:url(/assets/v2/smudge/stamp.webp${OS.VER});background-size:215% auto;background-position:56% 6%`;
    const [cx, cy, s, ar] = e.avatar, sh = s * ar, px = s < 1 ? (cx - s / 2) / (1 - s) * 100 : 50, py = sh < 1 ? (cy - sh / 2) / (1 - sh) * 100 : 50;
    const cl = v => Math.min(100, Math.max(0, v)).toFixed(1);
    return `background-image:url(${OS.img('heroes', id)});background-size:${(100 / s).toFixed(1)}% auto;background-position:${cl(px)}% ${cl(py)}%`;
  }
  const setFace = () => { $('av-face').style.cssText = faceStyle(me.profile.avatar); };
  setFace();
  // the title under your name and the colour it is written in. Both are earned; both are optional.
  function lookSheet() {
    const d = el('div', ''), cur = me.profile.title, curF = me.profile.flair;
    d.innerHTML = `<h3 style="font-size:1.4rem">How other players see you</h3>
      <p class="mut" style="margin:.2rem 0 .7rem;font-size:.9rem">Your name turns up in the rankings, in guilds and in other people's friend lists. This is what it looks like when it does.</p>
      <div class="lookprev"><span class="tag">Preview</span><span class="pname${FLAIRS.includes(curF) ? ' f f-' + curF : ''}"><b>${esc(me.profile.username)}</b>${TITLE[cur] ? `<em class="ttl">${TITLE[cur].name}</em>` : ''}</span></div>
      <div class="tag">Title</div>`;
    const set = async (patch, say) => { const ok = await Cloud.setProfile(patch); if (!ok) return toast('That did not save. Try again.'); Object.assign(me.profile, patch); lookSheet(); if (current === 'account') renderAccount(); if (say) toast(say); };
    const g = el('div', 'lookgrid');
    const opt = (id, name, how, flair, has) => { const bt = el('button', 'lookpick' + (cur === id ? ' on' : '') + (has ? '' : ' lockd'), `<b>${has ? '' : '<i class="lk">🔒</i>'}${name}</b>${how}`); bt.type = 'button';
      if (flair) bt.style.setProperty('--fc', ''); bt.classList.add(flair ? 'f-' + flair : 'f-none');
      bt.onclick = () => has ? set({ title: id }, id ? `You are wearing "${name}" now.` : 'Title off. Just the name.') : toast('Not yours yet. ' + how); g.appendChild(bt); };
    opt(null, 'No title', 'Your name on its own.', null, true);
    PTITLES.forEach(t => opt(t.id, t.name, t.how, t.flair, titleOwned(t.id)));
    d.appendChild(g);
    d.appendChild(el('div', 'tag', 'Name colour'));
    d.appendChild(el('p', 'mut', 'Every title you earn unlocks its colour. Wear any colour you have earned, with any title.')).style.cssText = 'font-size:.85rem;margin:.1rem 0 .2rem';
    const fr = el('div', 'flairrow');
    const dot = (f, has) => { const bt = el('button', 'flairdot' + (f ? ' f-' + f : '') + (curF === f ? ' on' : '') + (has ? '' : ' lockd')); bt.type = 'button';
      bt.title = f ? OS.cap(f) : 'Plain'; bt.setAttribute('aria-label', bt.title);
      if (!f) bt.style.setProperty('--fc', '#9aa6c4');
      bt.onclick = () => has ? set({ flair: f }) : toast('Earn the title that comes with this colour first.'); fr.appendChild(bt); };
    dot(null, true); FLAIRS.forEach(f => dot(f, flairOwned(f)));
    d.appendChild(fr);
    const row = el('div', 'row'); row.style.cssText = 'justify-content:center;margin-top:.9rem'; row.appendChild(btn('', 'Done', modal.close)); d.appendChild(row);
    modal.open(d);
  }

  function faceSheet() {
    const d = el('div', ''), own = Object.keys(S.roster).filter(id => OS.heroes[id]).sort((a, c) => rr(OS.heroes[c].rarity) - rr(OS.heroes[a].rarity) || OS.heroes[a].name.localeCompare(OS.heroes[c].name));
    d.innerHTML = `<h3 style="font-size:1.4rem">Pick your picture</h3><p class="mut" style="margin:.2rem 0 .8rem;font-size:.9rem">Smudge, or any hero you have met. Friends and guildmates see it next to your name.</p>`;
    const g = el('div', 'facegrid'), cur = me.profile.avatar && OS.heroes[me.profile.avatar] ? me.profile.avatar : null;
    [null].concat(own).forEach(id => { const b = el('button', 'facepick' + (id === cur ? ' on' : ''), `<i class="face" style="${faceStyle(id)}"></i><span>${id ? short(id) : 'Smudge'}</span>`); b.type = 'button';
      b.onclick = async () => { const ok = await Cloud.setProfile({ avatar: id }); if (!ok) return toast('That did not save. Try again.'); me.profile.avatar = id; setFace(); modal.close(); if (current === 'account') renderAccount(); toast(id ? `You are ${short(id)} now. Smudge is trying not to take it personally.` : 'Back to Smudge. He knew you would be.'); };
      g.appendChild(b); });
    d.appendChild(g); if (!own.length) d.appendChild(el('p', 'mut', 'Summon a hero and their face turns up here.'));
    modal.open(d);
  }

  // ---- the bell: friend requests and things waiting in the mailbox. Checked once a minute while the game is open;
  // anything new gets a toast, a number on the bell and the app icon, and a system alert if the game is in the background.
  let seenAl = []; try { seenAl = JSON.parse(localStorage.getItem('os2_alseen') || '[]'); } catch (e) { }
  const alertList = () => soc ? soc.friends.filter(f => f.status !== 'ok' && !f.mine).map(f => ({ k: 'f:' + f.username, t: `${f.username} wants to be friends.`, f })).concat(soc.mail.map(m => ({ k: 'm:' + m.id, t: `${m.from || 'Someone'} sent you something. It is in your mailbox.`, m }))) : [];
  function sysAlert(t) { try { if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted' || !navigator.serviceWorker) return;
      navigator.serviceWorker.ready.then(r => r.showNotification('OverSummoned', { body: t, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'os-alert', renotify: true, data: { url: '/play#board' } })); } catch (e) { } }
  async function checkAlerts(force, force2) {
    await loadSoc(force); const L = alertList(), n = L.length;
    $('bell-n').hidden = !n; $('bell-n').textContent = n > 9 ? '9+' : n; $('go-bell').classList.toggle('has', !!n);
    try { if (n && navigator.setAppBadge) navigator.setAppBadge(n); else if (!n && navigator.clearAppBadge) navigator.clearAppBadge(); } catch (e) { }
    const fresh = $('modal').classList.contains('on') && !force2 ? [] : L.filter(a => !seenAl.includes(a.k));   // never talk over an open sheet; the next check says it
    if (fresh.length) { fresh.forEach(a => seenAl.push(a.k)); const say = fresh.length === 1 ? fresh[0].t : `${fresh.length} new alerts. Tap the bell.`; toast(say); sysAlert(say); seenAl = seenAl.slice(-200); try { localStorage.setItem('os2_alseen', JSON.stringify(seenAl)); } catch (e) { }
      const b = $('go-bell'); b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); if (OS.Sound) OS.Sound.play('toast'); }
    return L;
  }
  async function bellSheet() {
    const L = await checkAlerts(true, true), d = el('div', 'bellsheet'); d.innerHTML = `<h3 style="font-size:1.4rem;margin-bottom:.6rem">Alerts</h3>`;
    if (!L.length) d.appendChild(el('p', 'mut', 'Nothing new. Smudge rings this bell when a friend request or a gift turns up.'));
    L.forEach(a => { const row = el('div', 'frow'), acts = el('div', 'facts');
      if (a.f) { row.innerHTML = `<div><i class="face sm" style="${faceStyle(a.f.avatar)}"></i>${nameTag(a.f.username, a.f.title, a.f.flair)}<span class="mut">wants to be friends</span></div>`;
        acts.appendChild(btn('small', 'Accept', async () => { try { toast(await Cloud.friendAdd(a.f.username)); } catch (e) { toast('That did not go through. Try again.'); } socAt = 0; bellSheet(); if (current === 'board') render(); }));
        acts.appendChild(btn('small ghost', 'No thanks', async () => { try { await Cloud.friendDrop(a.f.username); } catch (e) { } socAt = 0; bellSheet(); if (current === 'board') render(); })); }
      else { row.innerHTML = `<div><b>${esc(a.m.from || 'Someone')}</b><span class="mut">sent you something</span></div>`; acts.appendChild(btn('small', 'Open mailbox', () => { modal.close(); cityTab = 'mail'; show('board'); })); }
      row.appendChild(acts); d.appendChild(row); });
    if ('Notification' in window && navigator.serviceWorker) { const p = el('div', 'bellperm'), st = Notification.permission;
      if (st === 'granted') p.innerHTML = '<span class="mut">Alerts are on for this device. They reach you while the game is open, even in another tab or minimised.</span>';
      else if (st === 'denied') p.innerHTML = '<span class="mut">Alerts are blocked for this site in your browser settings.</span>';
      else { p.innerHTML = '<span class="mut">Want a nudge when the game is in another tab or minimised?</span>'; p.appendChild(btn('small ghost', 'Turn on alerts', async () => { try { await Notification.requestPermission(); } catch (e) { } bellSheet(); })); }
      d.appendChild(p); }
    modal.open(d);
  }
  $('go-bell').onclick = bellSheet;
  setTimeout(() => checkAlerts(true).catch(() => { }), 2500); setInterval(() => checkAlerts(true).catch(() => { }), 60000);

  // ---- updates: a bar when a newer build is out (it waits five minutes, then saves and reloads by itself),
  // and short notes per version. /version.json is the build that is live; /data/notes.json is the list.
  const BUILD = OS.VER.replace('?v=', ''); let pending = null, upT = 0;
  const notesReady = fetch('/data/notes.json' + OS.VER).then(r => r.json()).then(j => { NOTES = j; if (current === 'account') renderAccount(); }).catch(() => { });
  const day = s => { const t = new Date(s + 'T12:00:00'); return isNaN(t) ? '' : t.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); };
  function notesSheet(list, head) {
    const L = list || NOTES, d = el('div', 'notes'); d.innerHTML = `<div class="tag">${head || 'Update notes'}</div>` + (L.length ? L.map(n => `<div class="nver"><h3>Beta ${esc(n.v)}${n.title ? ' · ' + esc(n.title) : ''}</h3><span class="mut">${day(n.date)}</span>` +
      [['New', n.added], ['Fixed', n.fixed], ['Still on Smudge’s list', n.known]].filter(x => x[1] && x[1].length).map(([h, a]) => `<b>${h}</b><ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('') + '</div>').join('') : '<p class="mut">No notes yet.</p>');
    const row = el('div', 'row'); row.style.cssText = 'justify-content:center;margin-top:.8rem'; row.appendChild(btn('', 'Got it', modal.close)); d.appendChild(row); modal.open(d);
  }
  async function applyUpdate() { $('upbar').innerHTML = '<span>Saving, then updating…</span>'; try { await save(true); } catch (e) { }
    try { const r = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (r) await r.update(); } catch (e) { } location.reload(); }
  function showUpdate() {
    const bar = $('upbar'); bar.hidden = false; bar.innerHTML = `<span><b>Update ready${pending.v ? ': Beta ' + esc(pending.v) : ''}.</b> <i id="up-left"></i></span>`;
    bar.appendChild(btn('small ghost', 'What’s new', async () => { let L = NOTES; try { L = await (await fetch('/data/notes.json?t=' + now(), { cache: 'no-store' })).json(); } catch (e) { } notesSheet(L.slice(0, 1), 'Coming in this update'); }));
    bar.appendChild(btn('small', 'Update now', applyUpdate));
    let left = 300; const tk = () => { if (left <= 0) { clearInterval(upT); return applyUpdate(); } const e = $('up-left'); if (e) e.textContent = `Smudge updates it for you in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}.`; left--; }; tk(); upT = setInterval(tk, 1000);
  }
  async function checkUpdate() { if (pending || document.hidden) return; try { const j = await (await fetch('/version.json?t=' + now(), { cache: 'no-store' })).json(); if (j && j.build && j.build !== BUILD) { pending = j; showUpdate(); } } catch (e) { } }
  setTimeout(checkUpdate, 20000); setInterval(checkUpdate, 180000); addEventListener('visibilitychange', () => { if (!document.hidden) { checkUpdate(); checkAlerts(true).catch(() => { }); } });
  // the first time a ledger opens on a new build, show what changed (new players get the welcome instead)
  notesReady.then(() => { if (S.build === BUILD) return; const had = S.build; S.build = BUILD; save(true); if (!had || !S.welcomed || !NOTES[0] || NOTES[0].build !== BUILD) return;
    const go = () => $('modal').classList.contains('on') ? setTimeout(go, 1500) : notesSheet(NOTES.slice(0, 1), 'You are up to date'); setTimeout(go, 1800); });
  window.__os = { openCrate, summon, pend: () => PEND.length, S: () => S, crew, collect, haul, placeSheet, startMake: id => startMake(id), heroStats, fx, cardLoad, rebirth, contracts, claim, callByName, worked, huntPlace, nextPlace, fillCabinet, inkBonus, summon, show, advance, give, save, heroSheet, lootSheet, places, openCrate, render, frameSheet, inkTrade, raidSheet };   // for testing
})();
