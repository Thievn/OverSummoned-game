// OverSummoned, the browser game. Every number comes from /data/rules.json,
// the same rulebook the desktop pet reads. Progress is saved to your account.
(async function () {
  const me = await Cloud.require();
  const OS = await window.OS.load(), R = OS.R, $ = id => document.getElementById(id), el = OS.el, now = () => Date.now();
  const MODES = ['sweet', 'salty', 'unhinged'], RAR = R.rarities, rr = r => RAR.indexOf(r);
  const places = {}; R.places.forEach(p => places[p.id] = p);
  const workPlaces = R.places.filter(p => p.skill !== 'Summoning');
  const fresh = () => ({ v: 2, ink: R.summon.base_ink + R.summon.per_unique, gold: 0, xp: { Summoning: 0, Fishing: 0, Lockpicking: 0, Digging: 0 }, bag: {}, roster: { kevin: 1 }, equip: {}, gearLv: {}, jobs: [], mastery: {}, trained: {},
    energy: R.energy.max, energyT: now(), tickets: R.raids.tickets, ticketT: now(), tonics: {}, crateT: 0, autoCrate: false, autoSummon: false, gear: {}, crew: [null, null, null], exped: [], parts: 0, make: null, cabinet: {}, rest: 0, restDay: '', rebirth: {}, contracts: null, sold: 0, day: '', mode: (me.profile && me.profile.voice) || 'salty', actions: 0, summons: 0, raids: {}, guide: 0, last: now() });
  let S = Object.assign(fresh(), (await Cloud.load()) || {}); S.mode = MODES.includes(S.mode) ? S.mode : 'salty';
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
  const rollDay = () => { const d = new Date().toISOString().slice(0, 10); if (S.day !== d) { S.day = d; S.sold = 0; } };
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
    return (1 + sp + perk(p.skill, 'speed') + tonic('speed') + (cabSet(p.id) ? CAB.set_speed : 0)) * R.jobs.solo_mult;
  }
  const jobTime = j => R.tier[places[j.place].tier].seconds / jobSpeed(j);
  const jobLuck = () => crew().reduce((t, id) => t + heroStats(id).luck / R.jobs.crew_luck_div + fx(id, 'luck'), 0) + tonic('luck');
  const crewFx = kind => crew().reduce((t, id) => t + fx(id, kind), 0);
  function weights(p, extra) { const luck = level(p.skill) * R.loot.luck_per_level + perk(p.skill, 'luck') + extra; return p.loot.map(([id, w]) => OS.items[id].rarity === 'common' ? w : w * (1 + luck)); }
  function rollLoot(p, extra) { const ws = weights(p, extra), tot = ws.reduce((a, b) => a + b, 0); let r = Math.random() * tot; for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return p.loot[i][0]; } return p.loot[0][0]; }
  const dropChance = (p, id, extra) => { const ws = weights(p, extra || 0), c = ws[p.loot.findIndex(r => r[0] === id)] / ws.reduce((a, b) => a + b, 0) * 100; return (c >= 1 ? c.toFixed(1) : c.toFixed(2)) + '% of finds'; };
  const give = (id, n) => S.bag[id] = (S.bag[id] || 0) + (n || 1);
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
  function callByName(id) {
    const h = OS.heroes[id], cost = SH.cost[h.rarity], have = S.bag.x_shard || 0; if (S.roster[id] || have < cost) return;
    S.bag.x_shard = have - cost; S.roster[id] = 1; Cloud.log('shard_call', id); save(true); modal.close(); render();
    const d = el('div', 'reveal'); d.innerHTML = `<div class="tag" style="font-size:1rem;color:${R.rarity_color[h.rarity]}">Called by name · ${OS.cap(h.rarity)}</div>`; d.appendChild(OS.card(h, { level: 1, stats: heroStats(id) })); d.appendChild(el('p', '', `<b>Smudge:</b> “${h.lines[MODES.indexOf(S.mode)]}”`)); d.appendChild(btn('', 'Find them somewhere to stand', modal.close)); modal.open(d);
  }
  function lockedSheet(id) {
    const h = OS.heroes[id], cost = SH.cost[h.rarity], have = S.bag.x_shard || 0, d = el('div', '');
    d.innerHTML = `<h3 style="font-size:1.5rem">Somebody you have not met</h3><p class="mut">A ${OS.cap(h.rarity)} stranger. Summoning might turn them up. Or spend shards and call them by name: the book hates that, but it works.</p>
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
    if (a > b && !quiet) { toast(`${sk} is now level ${a}`); R.perks.forEach(p => { if (p.level > b && p.level <= a) toast(`New perk: ${p.name}. ${p.text}.`); }); R.places.forEach(p => { if (p.skill === sk && p.level > b && p.level <= a) toast(`New place open: ${p.name}`); }); }
  }
  // one finished action of one job
  function doAction(j, quiet) {
    const p = places[j.place], t = R.tier[p.tier], drops = [];
    if (CT) contracts().forEach(c => { if (c.place === j.place && c.have < c.need) c.have++; });
    const inkGot = t.ink * R.web.ink_mult * inkBonus() * (1 + crewFx('ink')); bump('hauls_' + p.skill); bump('ink', inkGot);
    S.actions++; S.ink += inkGot; gainXP(p.skill, Math.round(t.xp * R.web.xp_mult * (1 + tonic('xp') + crewFx('xp'))), quiet);
    crew().forEach(id => { const m = S.mastery[id] || (S.mastery[id] = {}); m[p.skill] = (m[p.skill] || 0) + R.jobs.mastery_xp; });
    if (Math.random() < R.web.loot_chance) { const n = Math.random() < perk(p.skill, 'double') ? 2 : 1; for (let i = 0; i < n; i++) { const id = rollLoot(p, jobLuck(j)); give(id); drops.push(id); bump('finds'); bump('finds_' + OS.items[id].rarity); if (OS.items[id].kind === 'gear') bump('gear_found'); } }
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
  let autoGot = [];
  function autoSummon(quiet) {
    if (summoning || S.ink < summonCost()) return;
    if (!quiet && current === 'summon') { summon(); return; }
    const names = []; let n = 0; while (S.ink >= summonCost() && n++ < 25) { const r = rollSummon(true); names.push(r.h.name + (r.had ? '' : ' (new)')); }
    autoGot = autoGot.concat(names); save(true);
    if (!quiet) { toast(`Smudge went home and summoned ${names.join(', ')}.`); render(); }
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
    S.crateT += dt; const every = R.crate.minutes * 60; while (S.crateT >= every) { S.crateT -= every; if (S.autoCrate && !quiet) openCrate(true); else give('x_crate'); if (!quiet) toast(line('crate')); }
    if (S.autoSummon) autoSummon(quiet);
    tickMeters(); return found;
  }

  // ------------------------------------------------------------------ small UI helpers
  const toasts = []; let toasting = false;
  function toast(msg) { if (toasts.length < 6) toasts.push(msg); if (!toasting) nextToast(); }
  function nextToast() { const m = toasts.shift(); if (!m) { toasting = false; return; } toasting = true; const t = $('toast'); t.textContent = m; t.classList.add('on'); setTimeout(() => { t.classList.remove('on'); setTimeout(nextToast, 260); }, 2200); }
  const modal = { open(node) { $('modal-body').innerHTML = ''; $('modal-body').appendChild(node); $('modal').classList.add('on'); }, close() { $('modal').classList.remove('on'); } };
  $('modal-x').onclick = modal.close; $('modal').addEventListener('click', e => { if (e.target === $('modal')) modal.close(); });
  const line = ev => { const l = OS.voice[S.mode][ev] || OS.voice[S.mode].idle; return l[Math.floor(Math.random() * l.length)]; };
  const fmt = s => s >= 3600 ? Math.floor(s / 3600) + 'h ' + Math.floor(s % 3600 / 60) + 'm' : s >= 60 ? Math.floor(s / 60) + 'm ' + Math.floor(s % 60) + 's' : Math.ceil(s) + 's';
  const pct = (a, b) => Math.max(0, Math.min(100, a / b * 100)) + '%';
  const summary = () => ({ heroes: Object.keys(S.roster).length, total_level: totalLevel(), gold: Math.floor(S.gold), ink: Math.floor(S.ink), summons: S.summons });
  let dirty = false, saving = false;
  async function save(force) { S.last = now(); dirty = true; if (!force || saving) return; saving = true; dirty = false; await Cloud.save(S, summary()); saving = false; }
  const btn = (cls, text, fn) => { const b = el('button', 'btn ' + cls, text); b.onclick = fn; return b; };

  // ------------------------------------------------------------------ navigation
  let current = 'home';
  function show(v) {
    current = v; document.querySelectorAll('.view').forEach(n => n.classList.toggle('on', n.id === 'v-' + v)); document.querySelectorAll('#gnav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    render(); if (v === 'summon') sfx.layout(); scrollTo(0, 0);
  }
  $('gnav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.v); });
  document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) show(b.dataset.go); });
  $('go-account').onclick = () => show('account');
  function renderTop() { $('r-ink').textContent = OS.num(S.ink); $('r-gold').textContent = OS.num(S.gold); $('r-energy').textContent = S.energy; }

  // ------------------------------------------------------------------ home (the dashboard)
  const GUIDE = [['Summon somebody', 'Smudge has enough ink for one stranger. Go to the Archive and press Summon.', 'summon', () => S.summons > 0],
    ['Put Smudge to work', 'Open Work, send Smudge somewhere, and stand an arrival behind him as crew.', 'jobs', () => S.jobs.some(j => j)],
    ['Dress them', 'When gear turns up, open an arrival from Arrivals and tap a glowing slot on the back of their card.', 'heroes', () => Object.values(S.equip).some(e => e.some(g => g)) || Object.values(S.gear).some(g => Object.values(g).some(x => x))]];
  function renderHome() {
    const hr = new Date().getHours(); $('h-day').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    $('h-hi').textContent = (hr < 12 ? 'Morning' : hr < 18 ? 'Afternoon' : 'Evening') + ', ' + me.profile.username; $('h-sub').textContent = line('idle');
    $('adminbtn').hidden = !me.admin;
    const g = $('guide'), left = GUIDE.filter(s => !s[3]()); g.hidden = !left.length;
    if (left.length) { g.innerHTML = '<div class="tag">Getting started</div>' + GUIDE.map((s, i) => `<div class="gstep ${s[3]() ? 'done' : ''}"><i>${s[3]() ? '✓' : i + 1}</i><div><b>${s[0]}</b><span>${s[1]}</span></div><button class="btn small ${s[3]() ? 'ghost' : ''}" data-go="${s[2]}">${s[3]() ? 'Done' : 'Go'}</button></div>`).join(''); }
    $('h-stats').innerHTML = [['Arrivals', Object.keys(S.roster).length + ' / ' + R.heroes.length], ['Total level', totalLevel()], ['Hauls', OS.num(S.actions)], ['Raid tickets', S.tickets + ' / ' + R.raids.tickets], ['Crates', S.bag.x_crate || 0]].map(([a, b]) => `<div class="stat"><b>${b}</b><span>${a}</span></div>`).join('');
    const comp = (() => { const g = Object.values(OS.items).filter(i => i.kind === 'gear'), parts = [[Object.keys(S.roster).length, R.heroes.length], [Object.keys(S.cabinet).length, treasures.length], [g.filter(i => owns(i.id)).length, g.length], [Object.keys(S.raids).length, R.raids.bosses.length], [Math.min(99 * 4, totalLevel()), 99 * 4]]; return parts.reduce((t, [a, b]) => t + a / b, 0) / parts.length * 100; })();
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
    const box = $('joblist'); jobPups.forEach(p => p && p.destroy()); jobPups = []; box.innerHTML = ''; const j = S.jobs[0], n = crewSlots();
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
      const host = card.querySelector('.who'), sp = STAND[p.id] || [.5, .8, 2], H = host.clientHeight, sh = H * 1.12, gx = host.clientWidth / 2 + (sp[0] - .5) * sh * sp[2], gy = -H * .06 + sp[1] * sh;
      crew().forEach((id, k) => { const e = OS.rig['h_' + id], hh = Math.min(H * .4, H * .5 * e.size[1] / Math.max(e.size[0], e.size[1]) + H * .1), pp = OS.heroPuppet(host, id, hh); if (pp) { pp.place(gx - sh * (.14 + k * .1) * (k === 1 ? -1.1 : 1) + (k === 2 ? -sh * .1 : 0), gy - H * (.035 + .015 * k)); jobPups.push(pp); } });
      const pose = POSE[p.skill] || 'stamp', se = OS.rig[pose], sm = new OS.Puppet(host, pose, H * .5 / se.size[1]); sm.place(gx + (se.foot[0] - se.size[0] / 2) * 0, gy + H * .03); jobPups.unshift(sm);
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
    const ex = el('div', 'panel'); ex.innerHTML = `<div class="spread"><h3 style="margin:0">Expeditions</h3><span class="mut">${S.exped.length} of ${expSlots()} away</span></div><p class="mut" style="margin:.3rem 0 .7rem;font-size:.9rem">Anybody not in the crew can go home to their own time for a while and bring back whatever they find there.</p><div class="exlist"></div>`;
    const xl = ex.querySelector('.exlist');
    S.exped.forEach((e, i) => { const h = OS.heroes[e.hero], left = (e.end - now()) / 1000, row = el('div', 'exrow2 r-' + h.rarity);
      row.innerHTML = `<img src="${OS.img('heroes', e.hero)}" alt=""><div><b>${h.name}</b><span class="mut">${left > 0 ? h.era + ' · back in <span data-exleft="' + i + '">' + fmt(left) + '</span>' : 'Back from ' + h.era}</span><div class="bar"><i data-ex="${i}" style="width:${pct(e.dur - Math.max(0, left), e.dur)}"></i></div></div>`;
      const b = btn('small' + (left > 0 ? ' ghost' : ''), left > 0 ? 'Call back' : 'See what they found', () => left > 0 ? recall(i) : collect(i)); row.appendChild(b); xl.appendChild(row); });
    if (!expSlots()) xl.appendChild(el('p', 'mut', `Opens at total level ${R.exped.slots.find(t => t > 0)}.`));
    else if (S.exped.length < expSlots()) { const r = el('div', 'row'); r.appendChild(btn('small', 'Send somebody', expedSheet)); xl.appendChild(r); }
    box.appendChild(ex);
  }
  let jobPups = [];
  const STAND = { dock: [.45, .6, 1.99], bondi: [.3, .54, 1.99], fjord: [.42, .64, 2.12], speakeasy: [.42, .8, 1.28], vault: [.42, .8, 1.91], closet: [.42, .8, 1.87], outback: [.3, .74, 2.05], blackforest: [.36, .78, 1.95] };
  function placeSheet() {
    const j = Object.assign({ place: null, prog: 0, order: 'stay', since: 0 }, S.jobs[0] || {}), d = el('div', '', `<h3 style="font-size:1.5rem">Where should Smudge work?</h3>`);
    const ps = el('div', 'plist');
    workPlaces.forEach(p => { const open = unlocked(p), row = el('div', 'prow' + (open ? '' : ' lock'));
      row.innerHTML = `<img src="${OS.img('scenes', p.id)}" alt=""><div><div class="tag">${p.era} · ${p.skill}</div><h3>${p.name}</h3><p>${open ? p.blurb : 'Needs ' + p.skill + ' level ' + p.level + '.'}</p></div>`;
      const acts = el('div', 'row acts'); acts.appendChild(btn('small ghost', 'What drops here', e => { e.stopPropagation(); lootSheet(p, placeSheet); })); row.appendChild(acts);
      if (open) row.onclick = () => { j.place = p.id; upd(); }; row.dataset.id = p.id; ps.appendChild(row); });
    d.appendChild(ps);
    d.appendChild(el('div', 'tag', 'Standing orders')).style.marginTop = '1rem';
    const os = el('div', 'orders'), oh = el('p', 'mut', ''); oh.style.cssText = 'margin:.4rem 0 0;font-size:.9rem'; os.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap';
    Object.keys(ORDERS).forEach(k => { const b = el('button', 'btn small ghost', ORDERS[k][0]); b.type = 'button'; b.dataset.o = k; b.onclick = () => { j.order = k; upd(); }; os.appendChild(b); });
    d.append(os, oh);
    const go = btn('', 'Send him', () => { if (!j.place) return; j.prog = 0; j.since = 0; if (j.order === 'hunt') j.place = huntPlace(j); S.jobs = [j]; save(true); modal.close(); render(); toast(`Smudge is off to ${places[j.place].name}.`); }), row = el('div', 'row'); row.style.marginTop = '1rem'; row.appendChild(go); d.appendChild(row);
    function upd() { const ord = j.order || 'stay'; os.querySelectorAll('button').forEach(b => { const on = b.dataset.o === ord; b.classList.toggle('ghost', !on); b.setAttribute('aria-pressed', on); }); oh.textContent = ORDERS[ord][1];
      ps.querySelectorAll('.prow').forEach(r => r.classList.toggle('here', r.dataset.id === j.place)); go.disabled = !j.place; }
    upd(); modal.open(d);
  }
  function heroPick(title, sub, ok, onPick, extra) {
    const d = el('div', '', `<h3 style="font-size:1.5rem">${title}</h3><p class="mut">${sub}</p>`), hs = el('div', 'heroes pick');
    Object.keys(S.roster).sort((a, c) => power(c) - power(a)).forEach(id => { const c = OS.card(OS.heroes[id], { mini: true, level: cardLevel(S.roster[id]) }), why = ok(id); if (why) { c.classList.add('busy'); c.title = why; } c.onclick = () => { if (!why) onPick(id); else toast(why); }; hs.appendChild(c); });
    d.appendChild(hs); if (extra) d.appendChild(extra); modal.open(d);
  }
  function crewSheet(i) {
    const cur = S.crew[i], row = el('div', 'row'); row.style.marginTop = '1rem'; if (cur) row.appendChild(btn('small ghost', 'Stand them down', () => { S.crew[i] = null; save(true); modal.close(); render(); }));
    heroPick('Who stands here?', 'Speed makes Smudge faster. Luck brings up better things. Their gear bonuses count, and they get better at each trade the longer they stand at it.',
      id => away(id) ? 'Away on an expedition.' : S.crew.some((x, k) => x === id && k !== i) ? 'Already in the crew.' : '', id => { S.crew[i] = id; save(true); modal.close(); render(); }, row);
  }
  function expedSheet() {
    let hours = R.exped.hours[1]; const row = el('div', 'row'); row.style.cssText = 'margin-top:1rem;flex-wrap:wrap;gap:.5rem';
    R.exped.hours.forEach(h => { const b = btn('small' + (h === hours ? '' : ' ghost'), h + (h === 1 ? ' hour' : ' hours'), () => { hours = h; row.querySelectorAll('button').forEach(x => x.classList.toggle('ghost', x !== b)); }); row.appendChild(b); });
    heroPick('Send somebody home for a while', 'They go back to their own time and return with treasure, junk and gear from there. Longer trips bring more. Luck helps.',
      id => S.crew.includes(id) ? 'In the crew. Stand them down first.' : away(id) ? 'Already away.' : '', id => { const dur = hours * 3600; S.exped.push({ hero: id, end: now() + dur * 1000, dur }); save(true); modal.close(); render(); toast(`${OS.heroes[id].name} has gone back to ${OS.heroes[id].era}.`); }, row);
  }
  function haul(e, frac) {
    const h = OS.heroes[e.hero], p = places[h.place], hrs = e.dur / 3600 * frac, st = heroStats(e.hero), luck = st.luck / R.jobs.luck_div + fx(e.hero, 'luck'), got = [];
    const n = Math.max(frac >= 1 ? 1 : 0, Math.round(hrs * R.exped.rolls_per_hour * (1 + st.speed / 200))); for (let i = 0; i < n; i++) { const id = rollLoot(p, luck); give(id); got.push(id); bump('finds'); }
    const ink = Math.round(hrs * R.exped.ink_per_hour * inkBonus() * (1 + fx(e.hero, 'ink'))); S.ink += ink; bump('ink', ink); bump('expeditions');
    const m = S.mastery[e.hero] || (S.mastery[e.hero] = {}); m[p.skill] = (m[p.skill] || 0) + Math.round(hrs * R.exped.mastery_per_hour);
    return { got, ink, h, p };
  }
  function showHaul(r, early) {
    const d = el('div', '', `<h3 style="font-size:1.5rem">${r.h.name} is back from ${r.h.era}</h3><p class="mut">${early ? 'Called back early, so a lighter load. ' : ''}${r.got.length} things and ${OS.num(r.ink)} ink.</p>`), g = el('div', 'itemrow'), cnt = {};
    r.got.forEach(id => cnt[id] = (cnt[id] || 0) + 1); Object.keys(cnt).sort((a, c) => rr(OS.items[c].rarity) - rr(OS.items[a].rarity) || (OS.items[a].junk ? 1 : 0) - (OS.items[c].junk ? 1 : 0)).forEach(id => g.appendChild(OS.slot(id, { count: cnt[id] })));
    d.appendChild(g); const row = el('div', 'row'); row.style.marginTop = '1rem'; row.appendChild(btn('', 'Good', modal.close)); d.appendChild(row); modal.open(d);
  }
  function collect(i) { const e = S.exped[i]; if (!e || e.end > now()) return; S.exped.splice(i, 1); const r = haul(e, 1); save(true); render(); showHaul(r); }
  function recall(i) { const e = S.exped[i]; if (!e) return; const frac = Math.max(0, 1 - (e.end - now()) / 1000 / e.dur) * .8; S.exped.splice(i, 1); const r = haul(e, frac); save(true); render(); showHaul(r, true); }
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
  function renderSummon() {
    const cost = summonCost(), l = level('Summoning'), f = Math.min(1, S.ink / cost);
    $('s-bar').style.width = f * 100 + '%'; $('s-ink').textContent = `${OS.num(S.ink)} / ${OS.num(cost)} ink`; $('s-met').textContent = `${Object.keys(S.roster).length} of ${R.heroes.length} met`; $('s-lvl').textContent = '· level ' + l;
    $('s-go').disabled = S.ink < cost || summoning; $('s-prog').setAttribute('stroke-dasharray', f * 100 + ' 100'); if (!summoning) $('s-glow').setAttribute('opacity', Math.max(0, (f - .6) * .9).toFixed(2));
    if (!$('s-odds').children.length) { const w = R.summon.weights, tot = Object.values(w).reduce((a, b) => a + b, 0), mx = Math.max(...Object.values(w));
      $('s-odds').innerHTML = RAR.map(r => `<span class="r-${r}" style="color:var(--rc)">${OS.cap(r)}</span><i class="r-${r}"><b style="width:${Math.sqrt(w[r] / mx) * 100}%"></b></i><span>${(w[r] / tot * 100).toFixed(w[r] < 1 ? 2 : 1)}%</span>`).join(''); }
  }
  let summoning = false, lastStamp = 0;
  // the roll itself: spend the ink, pick a rarity by the published odds, pick anybody of that rarity
  function rollSummon(quiet) {
    const cost = summonCost(); S.ink -= cost; S.summons++; const w = R.summon.weights; let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0), rar = 'common'; for (const k of RAR) { r -= w[k]; if (r <= 0) { rar = k; break; } }
    let pool = R.heroes.filter(h => h.rarity === rar); if (!pool.length) pool = R.heroes.filter(h => h.rarity === 'common');
    const h = pool[Math.floor(Math.random() * pool.length)], had = S.roster[h.id] || 0, before = cardLevel(had || 1);
    bump(had ? 'dupes' : 'new_heroes'); bump('ink_spent', cost); S.roster[h.id] = had + 1; if (had) give('x_shard', SH.per_dupe + (before >= R.card.max_level ? 1 : 0)); gainXP('Summoning', Math.round(cost * R.summon.xp_per_ink), quiet); Cloud.log('summon', h.id);
    return { h, had, before, rar, cost };
  }
  function summon() {
    if (S.ink < summonCost() || summoning) return; summoning = true;
    const { h, had, before, rar } = rollSummon(); save(true);
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
  function stamp() { const t = performance.now(); if (summoning || t - lastStamp < 1000 / R.max_keys_per_second) return; lastStamp = t; S.ink += R.web.stamp_ink * inkBonus(); bump('stamps'); bump('ink', R.web.stamp_ink * inkBonus()); sfx.stamp(); renderTop(); renderSummon(); }
  $('s-go').onclick = summon; $('s-stamp').onclick = stamp; sstage.addEventListener('pointerdown', stamp);

  // ------------------------------------------------------------------ arrivals
  function renderHeroes() { const g = $('hgrid'); g.innerHTML = ''; $('h-count').textContent = `${Object.keys(S.roster).length} of ${R.heroes.length} met, and counting`;
    R.heroes.slice().sort((a, b) => rr(b.rarity) - rr(a.rarity)).forEach(h => { const n = S.roster[h.id] || 0, c = OS.card(h, { owned: n > 0, mini: true, level: cardLevel(n) }); c.onclick = () => n ? heroSheet(h.id) : lockedSheet(h.id); g.appendChild(c); });
    $('h-count').textContent += ` · ${S.bag.x_shard || 0} shards`; }
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
    side.appendChild(row); d.append(card, side); modal.open(d);
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
    rollDay(); const g = $('bgrid'); g.innerHTML = ''; const ids = Object.keys(S.bag).filter(i => S.bag[i] > 0 && OS.items[i] && OS.items[i].kind !== 'gear');
    const ord = { crate: 0, tonic: 1, gear: 2, loot: 3 }; ids.sort((a, b) => ord[OS.items[a].kind] - ord[OS.items[b].kind] || rr(OS.items[b].rarity) - rr(OS.items[a].rarity) || OS.items[a].name.localeCompare(OS.items[b].name));
    ids.forEach(id => { const it = OS.items[id], s = OS.slot(id, { count: S.bag[id], have: S.bag[id] }); if (it.kind === 'crate') { s.classList.add('pulse'); s.onclick = () => openCrate(); } if (it.kind === 'tonic') s.onclick = () => drink(id); g.appendChild(s); });
    for (let i = ids.length; i < Math.max(24, Math.ceil(ids.length / 12) * 12); i++) g.appendChild(OS.slot(null));
    // ---- the armory: every piece of gear you own, sorted, with who is wearing it
    let arm = $('armory'); if (!arm) { arm = el('div', 'panel'); arm.id = 'armory'; arm.style.marginTop = '1rem'; g.parentNode.parentNode.appendChild(arm); arm.addEventListener('click', e => { const b = e.target.closest('[data-af]'); if (b) { armF = b.dataset.af; renderBag(); } }); }
    const wearer = {}; Object.keys(S.gear).forEach(hid => Object.values(S.gear[hid]).forEach(x => { if (x) wearer[x] = hid; })); Object.keys(S.equip).forEach(hid => (S.equip[hid] || []).forEach(x => { if (x) wearer[x] = hid; }));
    const mine = Object.values(OS.items).filter(i => i.kind === 'gear' && owns(i.id)), tabs = [['all', 'All'], ['weapon', 'Weapons'], ['head', 'Head'], ['body', 'Body'], ['feet', 'Feet'], ['charm', 'Charms'], ['own', 'Hero’s own']];
    const pick = mine.filter(i => armF === 'all' ? true : armF === 'own' ? !!i.owner : !i.owner && i.slot === armF).sort((a, c) => rr(c.rarity) - rr(a.rarity) || (a.set || 'zz').localeCompare(c.set || 'zz') || a.name.localeCompare(c.name));
    arm.innerHTML = `<div class="spread"><h3 style="margin:0">The armory</h3><span class="mut">${mine.length} of ${Object.values(OS.items).filter(i => i.kind === 'gear').length} pieces found</span></div>
      <div class="row" style="flex-wrap:wrap;gap:.4rem;margin:.6rem 0">${tabs.map(([k, t]) => `<button class="btn small ${armF === k ? '' : 'ghost'}" data-af="${k}">${t}</button>`).join('')}</div><div class="armgrid"></div>`;
    const ag = arm.querySelector('.armgrid'); if (!pick.length) ag.appendChild(el('p', 'mut', 'Nothing here yet.'));
    pick.forEach(it => { const row = el('div', 'armrow r-' + it.rarity), sl = OS.slot(it.id, { count: S.bag[it.id] }); row.appendChild(sl);
      row.appendChild(el('div', '', `<b style="color:var(--rc)">${it.name}</b><span class="mut">${OS.cap(it.rarity)} · ${it.owner ? OS.heroes[it.owner].name + ' only' : OS.cap(it.slot)}${it.set ? ' · ' + R.gear_sets[it.set].name + ' set' : ''}</span><span class="mut">${wearer[it.id] ? 'Worn by ' + OS.heroes[wearer[it.id]].name + (S.bag[it.id] > 0 ? ' · ' + S.bag[it.id] + ' spare' : '') : 'In the armory' + (S.bag[it.id] > 1 ? ' · ' + S.bag[it.id] : '')}</span>`)); ag.appendChild(row); });
    $('b-cap').textContent = `${OS.num(Object.keys(S.bag).reduce((t, id) => { const it = OS.items[id]; return t + (it && it.kind === 'loot' && id !== 'x_shard' ? Math.max(0, S.bag[id] - (it.junk ? 0 : 1)) * it.sell : 0); }, 0))} gold of junk and spares`;
    let cab = $('cabinet'); if (!cab) { cab = el('div', 'panel'); cab.id = 'cabinet'; cab.style.marginTop = '1rem'; g.parentNode.parentNode.appendChild(cab); }
    const shown = Object.keys(S.cabinet).length, ready = cabReady().length;
    cab.innerHTML = `<div class="spread"><h3 style="margin:0">The cabinet</h3><span class="mut">${shown} of ${treasures.length} on display · ink worth +${Math.round((inkBonus() - 1) * 1000) / 10}%</span></div>
      <p class="mut" style="margin:.4rem 0 .7rem">Put one of each treasure on display. Every piece makes all ink worth ${CAB.ink_per * 100}% more, for good. Finish a place's set and everybody works ${CAB.set_speed * 100}% faster there.</p>
      <div class="row" style="flex-wrap:wrap;gap:.4rem;margin-bottom:.7rem">${R.places.filter(p => treasures.some(i => i.place === p.id)).map(p => { const set = treasures.filter(i => i.place === p.id), n = set.filter(i => S.cabinet[i.id]).length; return `<span class="chip${n === set.length ? ' done' : ''}" style="border:1px solid ${n === set.length ? '#3fe0c5' : '#2a3761'};border-radius:999px;padding:.2em .7em;font-size:.82rem;color:${n === set.length ? '#3fe0c5' : '#aab6d6'}">${p.name} ${n}/${set.length}${n === set.length ? ' ✓' : ''}</span>`; }).join('')}</div>`;
    const cb = btn('small', ready ? `Put ${ready} new ${ready === 1 ? 'piece' : 'pieces'} on display` : 'Nothing new to display', fillCabinet); cb.disabled = !ready; cab.appendChild(cb);
  }
  function openCrate(quiet) {
    if (!quiet) { if (!(S.bag.x_crate > 0)) return; S.bag.x_crate--; }
    const open = workPlaces.filter(unlocked), got = []; for (let i = 0; i < R.crate.rolls; i++) { const id = rollLoot(open[Math.floor(Math.random() * open.length)], R.crate.luck); give(id); got.push(id); }
    const gold = R.crate.gold[0] + Math.floor(Math.random() * (R.crate.gold[1] - R.crate.gold[0] + 1)); S.gold += gold; S.ink += R.crate.ink; bump('crates'); bump('gold', gold); bump('ink', R.crate.ink); Cloud.log('crate'); save(true);
    if (quiet) { toast(`Crate opened: ${gold} gold, ${got.map(x => OS.items[x].name).join(', ')}`); return; }
    const d = el('div', 'reveal', `<img src="${OS.img('loot', 'x_crate_open')}" alt="" style="width:150px" class="popin"><h3 style="font-size:1.6rem">Something fell out of time</h3><p class="mut">${gold} gold, ${R.crate.ink} ink, and these.</p>`);
    const g = el('div', 'row'); g.style.justifyContent = 'center'; got.forEach(x => g.appendChild(OS.slot(x))); d.appendChild(g); d.appendChild(el('p', '', `<b>Smudge:</b> “${line('crate')}”`));
    const row = el('div', 'row'); if (S.bag.x_crate > 0) row.appendChild(btn('', `Open another (${S.bag.x_crate} left)`, () => openCrate())); row.appendChild(btn('ghost', 'Into the bag', modal.close)); d.appendChild(row); modal.open(d); render();
  }
  function drink(id) { const t = R.tonics.find(x => x.id === id); if (!t || !(S.bag[id] > 0)) return; bump('tonics'); S.bag[id]--; S.tonics[t.effect] = Math.max(now(), S.tonics[t.effect] || 0) + t.minutes * 60000; save(true); render(); toast(`${t.name}: ${t.text}`); }
  $('b-sell').onclick = () => { let room = Infinity, earned = 0;
    Object.keys(S.bag).forEach(id => { const it = OS.items[id]; if (!it || it.kind !== 'loot') return; while (S.bag[id] > (it.junk ? 0 : 1) && earned + it.sell <= room) { S.bag[id]--; earned += it.sell; } });
    S.gold += earned; S.sold += earned; bump('gold', earned); bump('gold_sold', earned); save(true); render(); toast(earned ? `Sold the spares for ${earned} gold.` : false ? 'The market has had enough of you today.' : 'Nothing to sell. Junk all goes; one of each treasure is kept.'); };

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
    R.tonics.forEach(t => { const have = spare(t.cost.rarity), row = el('div', 'exrow'); row.innerHTML = `<div class="slot has r-uncommon"><img src="${OS.img('loot', t.id)}" alt=""></div><div><b>${t.name}</b><div class="mut" style="font-size:.85rem">${t.text} Costs ${t.cost.n} spare ${t.cost.rarity} treasures. You have ${have} spare.</div></div>`;
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
    const box = $('rd-list'); if (box.dataset.sig === S.tickets + JSON.stringify(S.raids) + totalLevel()) return; box.dataset.sig = S.tickets + JSON.stringify(S.raids) + totalLevel(); box.innerHTML = '';
    R.raids.bosses.forEach(b => { const p = places[b.place], open = unlocked(p), row = el('div', 'prow' + (open ? '' : ' lock'));
      row.innerHTML = `<img src="${OS.img('scenes', p.id)}" alt=""><div><div class="tag">${p.name} · beaten ${S.raids[b.id] || 0} times</div><h3>${b.name}</h3><p>${open ? b.text : 'Needs ' + p.skill + ' level ' + p.level + '.'}</p><p class="mut" style="font-size:.8rem">Health ${OS.num(b.hp)} · Attack ${b.attack} · Defense ${b.defense} · ${b.gold} gold</p></div>`;
      const acts = el('div', 'row acts'), go = btn('small', 'Raid', () => raidSheet(b)); go.disabled = !open || S.tickets < 1; acts.appendChild(go); row.appendChild(acts); box.appendChild(row); });
  }
  function raidSheet(b) {
    const team = [], d = el('div', '', `<h3 style="font-size:1.5rem">${b.name}</h3><p class="mut">${b.text} Pick three.</p>`), hs = el('div', 'heroes pick'), info = el('p', '', '');
    Object.keys(S.roster).sort((a, c) => power(c) - power(a)).forEach(id => { const c = OS.card(OS.heroes[id], { mini: true, level: cardLevel(S.roster[id]) }); c.onclick = () => { const k = team.indexOf(id); if (k >= 0) team.splice(k, 1); else if (team.length < 3) team.push(id); c.classList.toggle('sel', team.includes(id)); upd(); }; hs.appendChild(c); });
    const go = btn('', 'Send them in', () => fight(b, team.slice())); d.append(hs, info, go);
    function upd() { const t = teamStats(team); info.innerHTML = team.length ? `Team: Attack <b>${t.attack}</b> · Defense <b>${t.defense}</b> · Health <b>${t.health * R.raids.hp_mult}</b> · Speed <b>${t.speed}</b> · Luck <b>${t.luck}</b>` : 'Nobody picked yet.'; go.disabled = !team.length; }
    upd(); modal.open(d);
  }
  const teamStats = team => { const t = { attack: 0, defense: 0, health: 0, speed: 0, luck: 0 }; team.forEach(id => { const s = heroStats(id); R.stats.forEach(k => t[k] += s[k]); }); return t; };
  function fight(b, team) {
    S.tickets--; if (S.tickets === R.raids.tickets - 1) S.ticketT = now();
    const raidUp = 1 + team.reduce((a, id) => a + fx(id, 'raid'), 0) / Math.max(1, team.length);
    const t = teamStats(team), log = []; let hp = t.health * R.raids.hp_mult, bhp = b.hp, win = false; const maxhp = hp;
    for (let r = 1; r <= R.raids.rounds && hp > 0 && bhp > 0; r++) {
      const who = OS.heroes[team[(r - 1) % team.length]].name, crit = Math.random() < Math.min(.5, t.luck / 300), twice = Math.random() < Math.min(.5, t.speed / 400);
      let dmg = Math.round(Math.max(2, Math.round(t.attack * (.8 + Math.random() * .4) - b.defense * .5)) * (crit ? 2 : 1) * (twice ? 2 : 1) * raidUp); bhp -= dmg;
      log.push({ t: `${who} ${crit ? 'lands a huge hit' : twice ? 'strikes twice' : 'hits'} for ${dmg}.`, hp, bhp: Math.max(0, bhp), cls: crit ? 'crit' : '' }); if (bhp <= 0) { win = true; break; }
      const hit = Math.max(1, Math.round(b.attack * (.8 + Math.random() * .4) - t.defense / 3)); hp -= hit; log.push({ t: `${b.name} hits back for ${hit}.`, hp: Math.max(0, hp), bhp, cls: 'foe' });
    }
    const p = places[b.place], got = [];
    if (win) { for (let i = 0; i < R.raids.loot_rolls; i++) { const id = rollLoot(p, R.raids.loot_luck + t.luck / 100); give(id); got.push(id); } const gear = p.loot.filter(([id]) => OS.items[id].kind === 'gear'); if (gear.length) { const id = gear[Math.floor(Math.random() * gear.length)][0]; give(id); got.push(id); }
      bump('raids_won'); bump('gold', b.gold); S.gold += b.gold; S.raids[b.id] = (S.raids[b.id] || 0) + 1; gainXP(p.skill, R.tier[p.tier].xp * 5); } else S.gold += Math.round(b.gold * .1);
    Cloud.log('raid', b.id, win ? 1 : 0); save(true);
    const d = el('div', 'fight', `<h3 style="font-size:1.5rem">${b.name}</h3><div class="hpbars"><div><span>Your three</span><div class="bar"><i id="f-hp" style="width:100%;background:linear-gradient(90deg,#1f9a49,#6fe394)"></i></div></div><div><span>${b.name}</span><div class="bar"><i id="f-bhp" style="width:100%;background:linear-gradient(90deg,#b3261e,#ff7a70)"></i></div></div></div><div class="flog" id="f-log"></div>`); modal.open(d);
    let i = 0; const step = () => { if (!$('f-log')) return; if (i < log.length) { const L = log[i++], row = el('div', L.cls, L.t); $('f-log').prepend(row); $('f-hp').style.width = pct(L.hp, maxhp); $('f-bhp').style.width = pct(L.bhp, b.hp); setTimeout(step, 380); return; }
      const end = el('div', 'reveal', `<h3 style="font-size:1.6rem;color:${win ? 'var(--gold2)' : '#ff7a70'}">${win ? 'Down it goes' : 'They limped home'}</h3><p class="mut">${win ? `${b.gold} gold and everything below.` : `${Math.round(b.gold * .1)} gold for the trouble. Train them, dress them, or bring luckier friends.`}</p>`);
      const g = el('div', 'row'); g.style.justifyContent = 'center'; got.forEach(x => g.appendChild(OS.slot(x))); end.append(g, btn('', 'Good', modal.close)); d.appendChild(end); render(); }; setTimeout(step, 400);
  }

  // ------------------------------------------------------------------ the city, shop, account
  async function renderBoard() { const box = $('bd-list'); if (box.dataset.t && now() - box.dataset.t < 30000) return; box.dataset.t = now(); const rows = await Cloud.board();
    box.innerHTML = rows.length ? rows.map((r, i) => `<div class="brow ${r.username === me.profile.username ? 'me' : ''}"><i>${i + 1}</i><b>${r.username}</b><span>Total level ${r.total_level}</span><span>${r.heroes} arrivals</span><span>${r.summons} summons</span></div>`).join('') : '<p class="mut">Nobody yet. Be the first name in the book.</p>'; }
  function renderShop() { if ($('shoplist').children.length) return; [['A dry hood', 'An outfit for Smudge.'], ['Gilded frames', 'A card frame set.'], ['Midnight Archive', 'A new look for the cellar.'], ['Supporter badge', 'Next to your name in the city.']].forEach(([a, b]) => $('shoplist').appendChild(el('div', 'tile soon', `<b>${a}</b><span>${b}</span><em>Opening soon</em>`))); }
  function renderAccount() {
    $('ac-you').innerHTML = `<div class="kv"><span>Username</span><b>${me.profile.username}</b></div><div class="kv"><span>Email</span><b>${me.email || ''}</b></div><div class="kv"><span>Joined</span><b>${me.profile.created_at ? new Date(me.profile.created_at).toLocaleDateString() : 'today'}</b></div>`;
    const has = p => (me.providers || []).includes(p); $('ac-logins').innerHTML = `<div class="kv"><span>Password</span><b>${has('email') ? 'Set' : 'Not set'}</b></div><div class="kv"><span>Google</span><b>${has('google') ? 'Connected' : 'Not connected'}</b></div><div class="kv"><span>Steam</span><b>${me.profile.steam_id ? 'Connected' : 'Not connected'}</b></div>
      <p class="mut" style="font-size:.85rem;margin:.6rem 0 0">Connecting Steam opens when the game reaches Steam. Until then the desktop pet and Steam items stay switched off for this account, and nothing else is affected.</p>`;
    const st = $('ac-settings'); st.innerHTML = ''; const voice = el('div', 'kv', '<span>Smudge\'s voice</span>'), sel = el('select'); MODES.forEach(m => sel.appendChild(new Option(m === 'unhinged' ? 'Unhinged (18+)' : OS.cap(m), m))); sel.value = S.mode;
    sel.onchange = () => { if (sel.value === 'unhinged' && !confirm('Unhinged Smudge swears. A lot. Adults only. Turn it on?')) { sel.value = S.mode; return; } S.mode = sel.value; Cloud.setProfile({ voice: S.mode }); save(true); toast(line('idle')); }; voice.appendChild(sel); st.appendChild(voice);
    const ac = el('label', 'kv', '<span>Open crates the moment they land</span>'), cb = el('input'); cb.type = 'checkbox'; cb.checked = !!S.autoCrate; cb.onchange = () => { S.autoCrate = cb.checked; save(true); }; ac.appendChild(cb); st.appendChild(ac);
    const as = el('label', 'kv', '<span>Smudge summons by himself when the ink is full</span>'), ab = el('input'); ab.type = 'checkbox'; ab.checked = !!S.autoSummon; ab.onchange = () => { S.autoSummon = ab.checked; save(true); }; as.appendChild(ab); st.appendChild(as);
    $('ac-stats').innerHTML = R.skills.map(s => `<div class="kv"><span>${s}${rebirths(s) ? ' ' + '★'.repeat(rebirths(s)) : ''}</span><b>Level ${level(s)}${level(s) >= 99 && rebirths(s) < RB.max ? ` <button class="btn small" data-rb="${s}">Rebirth</button>` : ''}</b></div>`).join('') + `<div class="kv"><span>Hauls</span><b>${OS.num(S.actions)}</b></div><div class="kv"><span>Summons</span><b>${S.summons}</b></div>`;
    const L = S.life || {}, best = Object.keys(S.roster).sort((x, y) => power(y) - power(x))[0], mTot = Object.values(S.mastery).reduce((t, m) => t + Object.values(m).reduce((q, x) => q + lvlOf(x) - 1, 0), 0);
    const gearOwned = Object.values(OS.items).filter(i => i.kind === 'gear' && owns(i.id)).length, gearAll = Object.values(OS.items).filter(i => i.kind === 'gear').length, kits = Object.keys(S.roster).filter(id => kitCount(id) >= 3).length;
    const groups = [
      ['Collection', [['Heroes met', Object.keys(S.roster).length + ' / ' + R.heroes.length], ['Cards at top level', Object.keys(S.roster).filter(id => cardLevel(S.roster[id]) >= R.card.max_level).length], ['Cabinet pieces', Object.keys(S.cabinet).length + ' / ' + treasures.length], ['Gear found', gearOwned + ' / ' + gearAll], ['Full kits worn', kits], ['Duplicate summons', L.dupes || 0], ['Shards in hand', S.bag.x_shard || 0]]],
      ['Work', [['Total level', totalLevel()], ['Rebirths', rebirthTotal()], ['Hauls', OS.num(S.actions)]].concat(R.skills.filter(k => k !== 'Summoning').map(k => [k + ' hauls', OS.num(L['hauls_' + k] || 0)])).concat([['Things found', OS.num(L.finds || 0)], ['Expeditions', L.expeditions || 0], ['Things made', L.made || 0]].concat(MK.skills.map(k => [k, 'Level ' + level(k)])).concat([ ['Rare or better found', OS.num(RAR.slice(2).reduce((t, r) => t + (L['finds_' + r] || 0), 0))], ['Mastery levels', mTot], ['Contracts done', L.contracts || 0]]))],
      ['Ink and gold', [['Ink earned', OS.num(L.ink || 0)], ['Ink spent summoning', OS.num(L.ink_spent || 0)], ['Ink bonus', '+' + Math.round((inkBonus() - 1) * 1000) / 10 + '%'], ['Stamps', OS.num(L.stamps || 0)], ['Summons', S.summons], ['Gold earned', OS.num(L.gold || 0)], ['Gold from selling', OS.num(L.gold_sold || 0)]]],
      ['Fights and extras', [['Raids won', L.raids_won || 0], ['Bosses beaten', Object.keys(S.raids).length + ' / ' + R.raids.bosses.length], ['Strongest hero', best ? OS.heroes[best].name + ' (' + power(best) + ')' : 'nobody'], ['Crates opened', L.crates || 0], ['Tonics drunk', L.tonics || 0], ['Time played', fmt(L.seconds || 0)]]]];
    $('ac-stats').innerHTML += groups.map(([t, rows]) => `<div class="tag" style="margin-top:.9rem">${t}</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.5rem;margin-top:.4rem">${rows.map(([a, v]) => `<div class="stat" style="padding:.55rem .6rem"><b style="font-size:1.05rem">${v}</b><span>${a}</span></div>`).join('')}</div>`).join('') + '<p class="mut" style="font-size:.8rem;margin-top:.7rem">Counting started when this page was added, so older ledgers begin part-way.</p>';
  }
  $('ac-stats').addEventListener('click', e => { const b = e.target.closest('[data-rb]'); if (b) rebirth(b.dataset.rb); });
  $('ac-out').onclick = async () => { await save(true); Cloud.signOut(); };
  $('ac-reset').onclick = async () => { if (confirm('Wipe this ledger and start again? This cannot be undone.')) { S = fresh(); await Cloud.save(S, summary()); location.reload(); } };

  const renderers = { home: renderHome, jobs: renderJobs, summon: renderSummon, heroes: renderHeroes, bag: renderBag, workshop: renderWorkshop, training: renderTraining, raids: renderRaids, board: renderBoard, shop: renderShop, account: renderAccount };
  function render() { renderTop(); renderers[current](); }

  // ------------------------------------------------------------------ the clock
  (function offline() { const gone = Math.min((now() - S.last) / 1000, R.crew.offline_hours * 3600); if (gone > 60 && S.jobs.some(j => j)) { const ink0 = S.ink, got = advance(gone, true); toast(`While you were away (${fmt(gone)}): ${got.length} finds` + (autoGot.length ? `, and Smudge summoned ${autoGot.length} (${autoGot.slice(0, 4).join(', ')}${autoGot.length > 4 ? '…' : ''}).` : ` and ${OS.num(S.ink - ink0)} ink.`)); autoGot = []; } else tickMeters(); })();
  let lastT = performance.now(), uiT = 0, slow = 0;
  function frame(t) {
    const dt = Math.min(2, (t - lastT) / 1000); lastT = t; bump('seconds', dt); const got = advance(dt, false);
    if (jobsMoved) { jobsMoved = false; if (current === 'jobs' && !$('modal').classList.contains('on')) renderJobs(); }
    got.forEach(([i, id]) => { const pop = document.querySelector(`[data-pop="${i}"]`), who = document.querySelector(`[data-who="${i}"]`), it = OS.items[id]; const pp = jobPups[0]; if (pp) pp.kick('arm', 30);
      if (pop) { const d = el('div', 'drop', `<img src="${OS.img('loot', it.icon)}" alt=""><span style="color:${R.rarity_color[it.rarity]}">${it.name}</span>`); pop.appendChild(d); setTimeout(() => d.remove(), 1900); } if (rr(it.rarity) >= 2 && !it.junk) toast(`Smudge found: ${it.name}`); });
    uiT -= dt; if (uiT <= 0) { uiT = .1; renderTop(); S.jobs.forEach((j, i) => { if (!j) return; const tt = jobTime(j); document.querySelectorAll(`[data-job="${i}"]`).forEach(b => b.style.width = pct(j.prog, tt)); const nx = document.querySelector(`[data-next="${i}"]`); if (nx) nx.textContent = 'next in ' + Math.max(0, tt - j.prog).toFixed(1) + 's'; });
      if (S.make && $('mk-bar')) { $('mk-bar').style.width = pct(S.make.t, S.make.need); $('mk-left').textContent = fmt(Math.max(0, S.make.need - S.make.t)); }
      if (current === 'jobs') S.exped.forEach((e, i) => { const left = (e.end - now()) / 1000, b = document.querySelector(`[data-ex="${i}"]`), tx = document.querySelector(`[data-exleft="${i}"]`); if (b) b.style.width = pct(e.dur - Math.max(0, left), e.dur); if (tx) { if (left > 0) tx.textContent = fmt(left); else if (!$('modal').classList.contains('on')) renderJobs(); } });
      if (current === 'summon') renderSummon(); slow -= .1; if (slow <= 0) { slow = 1; if (['training', 'raids', 'home'].includes(current) && !$('modal').classList.contains('on')) renderers[current](); if (got.length && current === 'bag') renderBag(); } }
    requestAnimationFrame(frame);
  }
  addEventListener('keydown', e => { if (e.repeat || e.metaKey || e.ctrlKey || $('modal').classList.contains('on') || (e.target.closest && e.target.closest('input,select,textarea'))) return; if (current === 'summon') stamp(); });
  setInterval(() => { if (dirty) save(true); }, 20000);
  addEventListener('visibilitychange', () => { if (document.hidden) save(true); else { const gone = (now() - S.last) / 1000; if (gone > 5) advance(Math.min(gone, R.crew.offline_hours * 3600), true); lastT = performance.now(); render(); } });
  addEventListener('pagehide', () => save(true));
  Cloud.track(); $('boot').remove(); show('home'); requestAnimationFrame(frame);
  window.__os = { S: () => S, crew, collect, haul, placeSheet, startMake: id => startMake(id), heroStats, fx, cardLoad, rebirth, contracts, claim, callByName, worked, huntPlace, nextPlace, fillCabinet, inkBonus, summon, show, advance, give, save, heroSheet, lootSheet, places, openCrate, render };   // for testing
})();
