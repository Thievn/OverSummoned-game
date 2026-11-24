// OverSummoned, the browser game. Every number comes from /data/rules.json,
// the same rulebook the desktop app reads.
(async function () {
  const OS = await window.OS.load(), R = OS.R, $ = id => document.getElementById(id), el = OS.el;
  const KEY = 'os_fable_save_v1', MODES = ['sweet', 'salty', 'unhinged'];
  const VIEW = { // where Smudge sits in each painted scene (scene pixels), same as the desktop app
    archive: { s: .6, p: .27, a: [453, 255] }, dock: { s: .62, p: .35, a: [610, 300], bob: [765, 358] }, bondi: { s: .6, p: .34, a: [425, 314], bob: [640, 360] },
    fjord: { s: .6, p: .34, a: [585, 235], bob: [667, 245] }, speakeasy: { s: .5, p: .38, a: [470, 600] }, vault: { s: .6, p: .34, a: [500, 370] },
    closet: { s: .6, p: .34, a: [500, 330] }, outback: { s: .6, p: .34, a: [355, 354] }, blackforest: { s: .6, p: .34, a: [415, 354] },
  };
  const POSE = { Summoning: 'stamp', Fishing: 'fish', Lockpicking: 'pick', Digging: 'dig' };
  const places = {}; R.places.forEach(p => places[p.id] = p);
  const fresh = () => ({ v: 1, place: 'dock', prog: 0, ink: 0, gold: 0, xp: { Summoning: 0, Fishing: 0, Lockpicking: 0, Digging: 0 }, bag: {}, roster: {}, equip: {}, crew: [], ex: [], crateT: 0, crateReady: false, last: Date.now(), sold: 0, day: '', mode: 'salty', actions: 0, summons: 0 });
  let S = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { }
  const save = () => { S.last = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };

  // ------------------------------------------------------------------ rules
  const level = sk => { let l = 1; const x = S.xp[sk] || 0; while (l < 99 && x >= R.xp_table[l]) l++; return l; };
  const perk = (sk, key) => { const l = level(sk); let t = 0; R.perks.forEach(p => { if (l >= p.level && p[key]) t = key === 'double' ? Math.max(t, p[key]) : t + p[key]; }); return t; };
  const cardLevel = n => { let l = 1; while (l < R.card.max_level && n - 1 >= l * (l + 1) / 2) l++; return l; };
  const copiesFor = l => 1 + l * (l + 1) / 2;   // copies needed to reach level l+1
  const unlocked = p => level(p.skill) >= p.level;
  const summonCost = () => R.summon.base_ink + R.summon.per_unique * Object.keys(S.roster).length;
  const totalLevel = () => R.skills.reduce((a, s) => a + level(s), 0);
  const sellCap = () => R.gold.daily_sell_cap_base + R.gold.daily_sell_cap_per_level * totalLevel();
  const rollDay = () => { const d = new Date().toISOString().slice(0, 10); if (S.day !== d) { S.day = d; S.sold = 0; } };
  function heroStats(id) {
    const h = OS.heroes[id], mult = 1 + R.card.stat_per_level * (cardLevel(S.roster[id] || 1) - 1), out = {};
    R.stats.forEach(k => out[k] = h.stats[k] * mult);
    (S.equip[id] || []).forEach(g => { if (!g) return; const it = OS.items[g], b = it.owner === id ? 1 + R.gear.signature_bonus : 1; for (const k in it.stats) out[k] += it.stats[k] * b; });
    R.stats.forEach(k => out[k] = Math.round(out[k])); return out;
  }
  const power = id => { const s = heroStats(id); return s.attack + s.defense + s.health; };
  function crewBonus(skill) {
    let spd = 0, lck = 0, gear = 0;
    S.crew.forEach(id => { const s = heroStats(id); spd += s.speed; lck += s.luck; (S.equip[id] || []).forEach(g => { const it = g && OS.items[g]; if (it && it.equip && it.equip.skill === skill) gear += it.equip.speed * (it.owner === id ? 1 + R.gear.signature_bonus : 1) / 100; }); });
    return { speed: Math.min(R.crew.speed_cap, spd / R.crew.speed_div) + gear, luck: lck / R.crew.luck_div };
  }
  const actionTime = p => R.tier[p.tier].seconds / (1 + perk(p.skill, 'speed') + crewBonus(p.skill).speed);
  function rollLoot(p, extraLuck) {
    const luck = level(p.skill) * R.loot.luck_per_level + perk(p.skill, 'luck') + extraLuck;
    const ws = p.loot.map(([id, w]) => OS.items[id].rarity === 'common' ? w : w * (1 + luck)), tot = ws.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot; for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return p.loot[i][0]; } return p.loot[0][0];
  }
  const dropChance = (p, id) => { const luck = level(p.skill) * R.loot.luck_per_level + perk(p.skill, 'luck') + crewBonus(p.skill).luck; const ws = p.loot.map(([i, w]) => OS.items[i].rarity === 'common' ? w : w * (1 + luck)); const c = ws[p.loot.findIndex(r => r[0] === id)] / ws.reduce((a, b) => a + b, 0) * 100; return (c >= 1 ? c.toFixed(1) : c.toFixed(2)) + '% of finds'; };
  const give = (id, n) => S.bag[id] = (S.bag[id] || 0) + (n || 1);
  function gainXP(sk, n, quiet) {
    const b = level(sk); S.xp[sk] = (S.xp[sk] || 0) + n; const a = level(sk);
    if (a > b && !quiet) {
      toast(`${sk} is now level ${a}`); fx.burst();
      R.perks.forEach(p => { if (p.level > b && p.level <= a) toast(`New perk: ${p.name}. ${p.text}.`); });
      R.places.forEach(p => { if (p.skill === sk && p.level > b && p.level <= a) toast(`New place open: ${p.name}`); });
    }
    return a > b;
  }
  // one finished action at a place. Returns what dropped.
  function doAction(p, quiet) {
    const t = R.tier[p.tier], drops = [];
    S.actions++; S.ink += t.ink * R.web.ink_mult; gainXP(p.skill, Math.round(t.xp * R.web.xp_mult), quiet);
    if (Math.random() < R.web.loot_chance) {
      const n = Math.random() < perk(p.skill, 'double') ? 2 : 1;
      for (let i = 0; i < n; i++) { const id = rollLoot(p, crewBonus(p.skill).luck); give(id); drops.push(id); }
    }
    return drops;
  }

  // ------------------------------------------------------------------ small UI helpers
  const toasts = []; let toasting = false;
  function toast(msg) { toasts.push(msg); if (!toasting) nextToast(); }
  function nextToast() { const m = toasts.shift(); if (!m) { toasting = false; return; } toasting = true; const t = $('toast'); t.textContent = m; t.classList.add('on'); setTimeout(() => { t.classList.remove('on'); setTimeout(nextToast, 260); }, 2200); }
  const modal = { open(node) { $('modal-body').innerHTML = ''; $('modal-body').appendChild(node); $('modal').classList.add('on'); }, close() { $('modal').classList.remove('on'); } };
  $('modal-x').onclick = modal.close; $('modal').addEventListener('click', e => { if (e.target === $('modal')) modal.close(); });
  const say = (bubble, text, pup) => { bubble.textContent = text; bubble.classList.add('on'); if (pup) pup.say(Math.min(2.6, .5 + text.length * .035)); clearTimeout(bubble._t); bubble._t = setTimeout(() => bubble.classList.remove('on'), 4500); };
  const line = ev => { const l = OS.voice[S.mode][ev] || OS.voice[S.mode].idle; return l[Math.floor(Math.random() * l.length)]; };
  const fmt = s => s >= 3600 ? Math.floor(s / 3600) + 'h ' + Math.floor(s % 3600 / 60) + 'm' : s >= 60 ? Math.floor(s / 60) + 'm ' + Math.floor(s % 60) + 's' : Math.ceil(s) + 's';

  // ------------------------------------------------------------------ the work stage
  const stage = $('stage'); let pup = null, k = 1, top = 0;
  const fx = {
    pt(sx, sy) { return [stage.clientWidth * .01 + sx * k, top + sy * k]; },
    layout() {
      const p = places[S.place], v = VIEW[p.id], img = $('scene');
      if (img.dataset.id !== p.id) { img.dataset.id = p.id; img.src = OS.img('scenes', p.id); img.alt = p.name; }
      k = stage.clientWidth * .98 / 910; const hgt = (img.naturalHeight || 460) * (910 / (img.naturalWidth || 910)) * k; top = stage.clientHeight - hgt;
      const pose = POSE[p.skill]; if (!pup) pup = new OS.Puppet(stage, pose, 1); pup.setPose(pose);
      pup.scale = v.p / v.s * k; const [x, y] = fx.pt(v.a[0], v.a[1]); pup.place(x, y);
    },
    source() { const p = places[S.place], v = VIEW[p.id]; if (p.skill === 'Fishing') return fx.pt(v.bob[0], v.bob[1]); return pup.named(p.skill === 'Digging' ? 'blade' : 'hands'); },
    drop(id, i) {
      const [x, y] = fx.source(), [bx, by] = pup.named('bag'), d = el('div', 'pop', `<img src="${OS.img('loot', OS.items[id].icon)}" alt="">`);
      d.style.left = (x - 32 + i * 26) + 'px'; d.style.top = (y - 32) + 'px'; d.style.transform = 'translateY(0) scale(.2)'; d.style.opacity = '0'; d.style.transition = 'transform .35s cubic-bezier(.2,1.6,.4,1),opacity .2s'; stage.appendChild(d);
      requestAnimationFrame(() => requestAnimationFrame(() => { d.style.transform = 'translateY(-54px) scale(1)'; d.style.opacity = '1'; }));
      setTimeout(() => { d.style.transition = 'transform .6s cubic-bezier(.5,0,.8,.4),opacity .6s'; d.style.transform = `translate(${bx - x - i * 26}px,${by - y}px) scale(.15)`; d.style.opacity = '.2'; }, 800);
      setTimeout(() => { d.remove(); pup.kick('head', -1.6); }, 1420);
      const it = OS.items[id], f = el('div', 'ftxt', it.name); f.style.left = x + 'px'; f.style.top = (y - 96 - i * 20) + 'px'; f.style.color = R.rarity_color[it.rarity]; stage.appendChild(f); setTimeout(() => f.remove(), 1800);
    },
    burst() { const f = el('div', 'ftxt', 'Level up!'); f.style.left = '50%'; f.style.top = '30%'; f.style.color = '#ffd35c'; f.style.fontSize = '1.6rem'; stage.appendChild(f); setTimeout(() => f.remove(), 1800); if (pup) pup.cheer(1.6); },
    work() { // one visible swing of whatever he is doing
      if (!pup) return; const sk = places[S.place].skill; pup.busy = 1;
      if (sk === 'Fishing') pup.kick('rod', 4); else if (sk === 'Lockpicking') { fx.flip = !fx.flip; pup.kick(fx.flip ? 'hand_a' : 'hand_b', fx.flip ? -6.5 : 6.5); pup.kick('head', 1.5); } else if (sk === 'Digging') { pup.kick('shovel', 10); pup.kick('head', 2); }
    },
  };
  $('scene').addEventListener('load', fx.layout); addEventListener('resize', () => { fx.layout(); sfx.layout(); });

  // ------------------------------------------------------------------ the summon stage
  const sstage = $('sstage'); let spup = null;
  const sfx = {
    layout() { if (!sstage.clientWidth) return; const kk = sstage.clientWidth * .98 / 910, v = VIEW.archive; if (!spup) spup = new OS.Puppet(sstage, 'stamp', 1); spup.scale = v.p / v.s * kk; spup.place(sstage.clientWidth * .01 + v.a[0] * kk, sstage.clientHeight - 459 * kk + v.a[1] * kk); },
    stamp() { if (spup) { spup.kick('arm', 30); spup.kick('head', 2.2); } },
  };

  // ------------------------------------------------------------------ renderers
  function renderTop() { $('r-ink').textContent = OS.num(S.ink); $('r-gold').textContent = OS.num(S.gold); }
  function renderWork() {
    const p = places[S.place], sk = p.skill, l = level(sk), t = actionTime(p), cb = crewBonus(sk);
    $('w-era').textContent = p.era; $('w-name').textContent = p.name; $('w-skill').textContent = `${sk} · level ${l}`;
    const a = R.xp_table[l - 1], b = R.xp_table[Math.min(98, l)];
    $('w-xp').style.width = (l >= 99 ? 100 : (S.xp[sk] - a) / (b - a) * 100) + '%';
    $('w-xptext').textContent = l >= 99 ? 'Mastered' : `${OS.num(S.xp[sk] - a)} / ${OS.num(b - a)} xp to level ${l + 1}`;
    $('w-rate').textContent = `one haul every ${t.toFixed(1)}s`;
    $('w-perks').innerHTML = R.perks.map(pk => `<span class="perk ${l >= pk.level ? 'on' : ''}" title="${pk.text}">Lv ${pk.level} · ${pk.name}</span>`).join('');
    $('crew-bonus').textContent = `+${Math.round(cb.speed * 100)}% speed · +${Math.round(cb.luck * 100)}% luck`;
    const crew = $('crew'); crew.innerHTML = '';
    for (let i = 0; i < R.crew.slots; i++) {
      const id = S.crew[i], d = el('div', 'crewslot' + (id ? ' has r-' + OS.heroes[id].rarity : ''));
      d.innerHTML = id ? `<img src="${OS.img('heroes', id)}" alt="${OS.heroes[id].name}">` : 'Empty<br>tap to add';
      d.onclick = () => id ? heroSheet(id) : pickHero(h => { S.crew.push(h); save(); renderAll(); }, 'Who joins the crew?'); crew.appendChild(d);
    }
    renderEx();
  }
  function renderEx() {
    const slots = R.expedition.slots.filter(s => totalLevel() >= s.total_level).length, box = $('exlist'); box.innerHTML = '';
    $('ex-slots').textContent = `${S.ex.length} of ${slots} out`;
    S.ex.forEach((e, i) => {
      const left = (e.end - Date.now()) / 1000, row = el('div', 'exrow'), h = OS.heroes[e.hero];
      row.innerHTML = `<img class="h" src="${OS.img('heroes', e.hero)}" alt=""><div><b>${h.name}</b><div class="mut" style="font-size:.85rem">${places[e.place].name} · ${Math.round(e.chance * 100)}% odds</div></div>`;
      const b = el('button', 'btn small' + (left > 0 ? ' ghost' : ''), left > 0 ? fmt(left) : 'Welcome back'); b.disabled = left > 0; b.onclick = () => finishEx(i); row.appendChild(b); box.appendChild(row);
    });
    $('ex-new').disabled = S.ex.length >= slots;
  }
  function renderPlaces() {
    const box = $('plist'); box.innerHTML = '';
    R.places.filter(p => p.skill !== 'Summoning').forEach(p => {
      const open = unlocked(p), here = S.place === p.id, row = el('div', 'prow' + (here ? ' here' : '') + (open ? '' : ' lock'));
      row.innerHTML = `<img src="${OS.img('scenes', p.id)}" alt=""><div><div class="tag">${p.era} · ${p.skill}</div><h3>${p.name}</h3><p>${p.blurb}</p></div>`;
      const acts = el('div', 'row acts'), go = el('button', 'btn small', here ? 'Working here' : open ? 'Work here' : `Needs ${p.skill} ${p.level}`);
      go.disabled = here || !open; go.onclick = () => { S.place = p.id; S.prog = 0; save(); show('work'); toast(line('move')); };
      const lb = el('button', 'btn small ghost', 'What drops here'); lb.onclick = () => lootSheet(p);
      acts.append(go, lb); row.appendChild(acts); box.appendChild(row);
    });
  }
  function lootSheet(p) {
    const d = el('div', '', `<div class="tag">${p.era} · ${p.skill}</div><h3 style="font-size:1.6rem">${p.name}</h3><p class="mut">Everything that can turn up here. Things you have not found yet stay in shadow. Skill level, perks and a lucky crew all push the odds toward the good stuff.</p>`);
    ['Treasure', 'Signature gear'].forEach((title, gi) => {
      const rows = p.loot.filter(([id]) => (OS.items[id].kind === 'gear') === !!gi); if (!rows.length) return;
      d.appendChild(el('div', 'tag', title)); const g = el('div', 'itemrow'); g.style.margin = '.4rem 0 1rem';
      rows.forEach(([id]) => g.appendChild(OS.slot(id, { dim: !S.bag[id] && !Object.values(S.equip).some(e => e.includes(id)), chance: dropChance(p, id), have: S.bag[id] }))); d.appendChild(g);
    });
    modal.open(d);
  }
  function renderSummon() {
    const cost = summonCost(), l = level('Summoning'), f = Math.min(1, S.ink / cost), a = R.xp_table[l - 1], b = R.xp_table[Math.min(98, l)];
    $('s-bar').style.width = f * 100 + '%'; $('s-ink').textContent = `${OS.num(S.ink)} / ${OS.num(cost)} ink`;
    $('s-met').textContent = `${Object.keys(S.roster).length} of ${R.heroes.length} met`; $('s-lvl').textContent = '· level ' + l;
    $('s-go').disabled = S.ink < cost; $('s-prog').setAttribute('stroke-dasharray', f * 100 + ' 100'); $('s-glow').setAttribute('opacity', Math.max(0, (f - .6) * .9).toFixed(2));
    $('s-xp').style.width = (l >= 99 ? 100 : (S.xp.Summoning - a) / (b - a) * 100) + '%';
    const w = R.summon.weights, ws = {}; let tot = 0; for (const r in w) { ws[r] = w[r] + (['rare', 'epic', 'legendary'].includes(r) ? R.summon.luck_per_level * l : 0); tot += ws[r]; }
    $('s-odds').innerHTML = 'Odds at this level: ' + R.rarities.map(r => `<b style="color:${R.rarity_color[r]}">${OS.cap(r)} ${(ws[r] / tot * 100).toFixed(1)}%</b>`).join(' · ');
    $('s-buy').textContent = `Buy ${R.gold.ink_pack.ink} ink for ${R.gold.ink_pack.gold} gold`; $('s-buy').disabled = S.gold < R.gold.ink_pack.gold;
  }
  function renderHeroes() {
    const g = $('hgrid'); g.innerHTML = ''; $('h-count').textContent = `${Object.keys(S.roster).length} of ${R.heroes.length} met`;
    R.heroes.forEach(h => { const n = S.roster[h.id] || 0, c = OS.card(h, { owned: n > 0, mini: true, level: cardLevel(n) }); if (n) c.onclick = () => heroSheet(h.id); g.appendChild(c); });
  }
  function renderBag() {
    rollDay(); const g = $('bgrid'); g.innerHTML = ''; const ids = Object.keys(S.bag).filter(i => S.bag[i] > 0 && OS.items[i]);
    ids.sort((a, b) => R.rarities.indexOf(OS.items[b].rarity) - R.rarities.indexOf(OS.items[a].rarity) || OS.items[a].name.localeCompare(OS.items[b].name));
    ids.forEach(id => { const s = OS.slot(id, { count: S.bag[id], have: S.bag[id] }); g.appendChild(s); });
    for (let i = ids.length; i < Math.max(24, Math.ceil(ids.length / 12) * 12); i++) g.appendChild(OS.slot(null));
    $('b-cap').textContent = `Sold today: ${OS.num(S.sold)} of ${OS.num(sellCap())} gold`;
    $('profile').innerHTML = R.skills.map(s => `<b style="color:#fff">${s}</b> level ${level(s)}`).join(' · ') + `<br>${OS.num(S.actions)} hauls · ${S.summons} summons · ${ids.length} kinds of thing in the bag<br>Saved in this browser. Copy the save code to move it or keep a spare.`;
    $('p-mode').textContent = 'Smudge is ' + S.mode;
  }
  const renderers = { work: renderWork, places: renderPlaces, summon: renderSummon, heroes: renderHeroes, bag: renderBag };
  let current = 'work';
  function renderAll() { renderTop(); renderers[current](); }
  function show(v) {
    current = v; document.querySelectorAll('.view').forEach(n => n.classList.toggle('on', n.id === 'v-' + v)); document.querySelectorAll('#gnav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    renderAll(); if (v === 'work') fx.layout(); if (v === 'summon') sfx.layout(); scrollTo(0, 0);
  }
  $('gnav').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.v); });

  // ------------------------------------------------------------------ heroes: sheet, gear, pickers
  const busyHero = id => S.crew.includes(id) || S.ex.some(e => e.hero === id);
  function pickHero(cb, title, filter) {
    const d = el('div', '', `<h3 style="font-size:1.5rem;margin-bottom:.8rem">${title}</h3>`), g = el('div', 'heroes');
    const list = Object.keys(S.roster).filter(id => !busyHero(id) && (!filter || filter(id)));
    if (!list.length) d.appendChild(el('p', 'mut', 'Nobody is free. Summon someone at the Archive, or call somebody back from the crew.'));
    list.forEach(id => { const c = OS.card(OS.heroes[id], { mini: true, level: cardLevel(S.roster[id]) }); c.onclick = () => { modal.close(); cb(id); }; g.appendChild(c); });
    d.appendChild(g); modal.open(d);
  }
  function heroSheet(id) {
    const h = OS.heroes[id], n = S.roster[id], lv = cardLevel(n), st = heroStats(id), eq = S.equip[id] || (S.equip[id] = [null, null, null]);
    const d = el('div', 'herosheet'), left = el('div'), right = el('div');
    left.appendChild(OS.card(h, { level: lv, stats: st, gear: h.gear, dimGear: h.gear.map(g => !S.bag[g] && !eq.includes(g)) }));
    right.innerHTML = `<div class="tag">${h.rarity} · ${h.species} · ${h.era}</div><h3 style="font-size:1.7rem">${h.name}</h3>
      <p class="mut" style="font-size:.9rem;margin:.2rem 0 .6rem">Card level ${lv}${lv < R.card.max_level ? ` · ${n} of ${copiesFor(lv)} copies for level ${lv + 1}` : ' · as high as it goes'}. Each level adds ${R.card.stat_per_level * 100}% to every number.</p>` +
      R.stats.map(s => `<div class="statline"><span>${OS.statWord[s]}</span><div class="bar"><i style="width:${Math.min(100, st[s] / 70 * 100)}%"></i></div><b>${st[s]}</b></div>`).join('') +
      `<div class="tag" style="margin-top:.8rem">Wearing</div><div class="gear3"></div><div class="row"></div>`;
    const g3 = right.querySelector('.gear3');
    ['weapon', 'armor', 'trinket'].forEach((slot, i) => {
      const w = el('div', 'g'), s = eq[i] ? OS.slot(eq[i]) : OS.slot(null); s.style.cursor = 'pointer';
      s.onclick = () => gearPicker(id, i, slot); w.append(s, el('div', '', slot)); g3.appendChild(w);
    });
    const row = right.querySelector('.row'), inCrew = S.crew.includes(id), away = S.ex.some(e => e.hero === id);
    const b = el('button', 'btn small', away ? 'Away on an expedition' : inCrew ? 'Leave the crew' : 'Join the crew'); b.disabled = away || (!inCrew && S.crew.length >= R.crew.slots);
    b.onclick = () => { if (inCrew) S.crew = S.crew.filter(x => x !== id); else S.crew.push(id); save(); renderAll(); heroSheet(id); };
    row.append(b, el('span', 'mut', `Power ${power(id)}`));
    d.append(left, right); modal.open(d);
  }
  function gearPicker(id, i, slot) {
    const eq = S.equip[id], d = el('div', '', `<h3 style="font-size:1.4rem">Choose a ${slot} for ${OS.heroes[id].name}</h3><p class="mut">Their own signature items work half again as well.</p>`), g = el('div', 'itemrow');
    const opts = Object.keys(S.bag).filter(x => S.bag[x] > 0 && OS.items[x].kind === 'gear' && OS.items[x].slot === slot);
    opts.sort((a, b) => (OS.items[b].owner === id) - (OS.items[a].owner === id) || R.rarities.indexOf(OS.items[b].rarity) - R.rarities.indexOf(OS.items[a].rarity));
    opts.forEach(x => { const s = OS.slot(x, { count: S.bag[x] }); s.onclick = () => { if (eq[i]) give(eq[i]); S.bag[x]--; eq[i] = x; save(); renderAll(); heroSheet(id); }; g.appendChild(s); });
    if (!opts.length) d.appendChild(el('p', 'mut', `No ${slot}s in the bag yet. Each place lists the gear that turns up there.`));
    d.appendChild(g);
    const row = el('div', 'row'); row.style.marginTop = '1rem';
    if (eq[i]) { const u = el('button', 'btn small ghost', 'Take it off'); u.onclick = () => { give(eq[i]); eq[i] = null; save(); renderAll(); heroSheet(id); }; row.appendChild(u); }
    const back = el('button', 'btn small ghost', 'Back'); back.onclick = () => heroSheet(id); row.appendChild(back); d.appendChild(row); modal.open(d);
  }

  // ------------------------------------------------------------------ summoning
  function summon() {
    const cost = summonCost(); if (S.ink < cost) return;
    S.ink -= cost; S.summons++; const l = level('Summoning'), w = R.summon.weights, ws = [];
    R.rarities.forEach(r => ws.push(w[r] + (['rare', 'epic', 'legendary'].includes(r) ? R.summon.luck_per_level * l : 0)));
    let r = Math.random() * ws.reduce((a, b) => a + b, 0), rar = 'common'; for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) { rar = R.rarities[i]; break; } }
    const pool = R.heroes.filter(h => h.rarity === rar), h = pool[Math.floor(Math.random() * pool.length)], had = S.roster[h.id] || 0, before = cardLevel(had || 1);
    S.roster[h.id] = had + 1; if (had && before >= R.card.max_level) give('x_shard');
    gainXP('Summoning', Math.round(cost * R.summon.xp_per_ink)); save();
    const lv = cardLevel(had + 1), d = el('div', 'reveal');
    d.innerHTML = `<div class="tag" style="font-size:1rem;color:${R.rarity_color[rar]}">${had ? (lv > before ? 'Another copy. Card level ' + lv + '!' : 'Another copy of an old friend') : 'A new arrival'}</div>`;
    d.appendChild(OS.card(h, { level: lv, stats: heroStats(h.id) }));
    d.appendChild(el('p', '', `<b>Smudge:</b> “${h.lines[MODES.indexOf(S.mode)]}”`));
    const ok = el('button', 'btn', had ? 'Welcome back' : 'Find them somewhere to stand'); ok.onclick = modal.close; d.appendChild(ok);
    modal.open(d); if (spup) spup.cheer(2); renderAll();
  }
  let lastStamp = 0;
  function stamp() { const now = performance.now(); if (now - lastStamp < 1000 / R.max_keys_per_second) return; lastStamp = now; S.ink += 5; sfx.stamp(); renderTop(); renderSummon(); }
  $('s-go').onclick = summon; $('s-stamp').onclick = stamp; sstage.addEventListener('pointerdown', stamp);
  $('s-buy').onclick = () => { const p = R.gold.ink_pack; if (S.gold >= p.gold) { S.gold -= p.gold; S.ink += p.ink; save(); renderAll(); } };

  // ------------------------------------------------------------------ expeditions
  $('ex-new').onclick = () => pickHero(id => {
    const d = el('div', '', `<h3 style="font-size:1.5rem">Where is ${OS.heroes[id].name} going?</h3><p class="mut">Power ${power(id)}. Harder places want more of it. Fail and they limp home with a quarter of the gold and nothing else.</p>`);
    const sel = el('select'), len = el('select');
    R.places.filter(p => p.skill !== 'Summoning' && unlocked(p)).forEach(p => sel.appendChild(new Option(`${p.name} (needs ${R.expedition.power_needed[p.tier]} power)`, p.id)));
    R.expedition.lengths.forEach(x => len.appendChild(new Option(`${x.name} · ${fmt(x.minutes * 60)} · ${x.rolls} finds`, x.id)));
    const info = el('p', '', ''), go = el('button', 'btn', 'Send them off'), row = el('div', 'row'); row.append(sel, len);
    const chance = () => Math.max(R.expedition.min_chance, Math.min(R.expedition.max_chance, power(id) / R.expedition.power_needed[places[sel.value].tier]));
    const upd = () => info.innerHTML = `Odds of a clean run: <b style="color:var(--gold2)">${Math.round(chance() * 100)}%</b>`;
    sel.onchange = upd; upd();
    go.onclick = () => { const L = R.expedition.lengths.find(x => x.id === len.value); S.crew = S.crew.filter(x => x !== id); S.ex.push({ hero: id, place: sel.value, len: L.id, end: Date.now() + L.minutes * 60000, chance: chance() }); save(); modal.close(); renderAll(); toast(`${OS.heroes[id].name} has left for ${places[sel.value].name}.`); };
    d.append(row, info, go); modal.open(d);
  }, 'Who is going?');
  function finishEx(i) {
    const e = S.ex[i]; if (!e || e.end > Date.now()) return; S.ex.splice(i, 1);
    const L = R.expedition.lengths.find(x => x.id === e.len), p = places[e.place], h = OS.heroes[e.hero], win = Math.random() < e.chance;
    const d = el('div', 'reveal'), got = [];
    if (win) { for (let j = 0; j < L.rolls; j++) { const id = rollLoot(p, R.expedition.luck + heroStats(e.hero).luck / R.crew.luck_div); give(id); got.push(id); } S.gold += L.gold; S.ink += R.tier[p.tier].ink * L.rolls * .5; gainXP(p.skill, Math.round(R.tier[p.tier].xp * L.rolls * .25)); }
    else S.gold += Math.round(L.gold * .25);
    d.innerHTML = `<img src="${OS.img('heroes', e.hero)}" alt="" style="height:170px"><h3 style="font-size:1.6rem">${win ? h.name + ' is back, pockets full' : h.name + ' came back empty-handed'}</h3><p class="mut">${win ? `${L.gold} gold and everything below, from ${p.name}.` : `${p.name} got the better of them. ${Math.round(L.gold * .25)} gold for the trouble. More Attack, Defense and Health would help.`}</p>`;
    const g = el('div', 'itemrow'); g.style.width = '100%'; const count = {}; got.forEach(x => count[x] = (count[x] || 0) + 1); Object.keys(count).forEach(x => g.appendChild(OS.slot(x, { count: count[x] }))); d.appendChild(g);
    const ok = el('button', 'btn', 'Good'); ok.onclick = modal.close; d.appendChild(ok); save(); modal.open(d); renderAll();
  }

  // ------------------------------------------------------------------ crate, selling, profile
  function openCrate() {
    S.crateReady = false; const c = stage.querySelector('.crate'); if (c) c.remove();
    const open = R.places.filter(p => p.loot.length && unlocked(p)), got = [];
    for (let i = 0; i < R.crate.rolls; i++) { const p = open[Math.floor(Math.random() * open.length)], id = rollLoot(p, R.crate.luck); give(id); got.push(id); }
    const gold = R.crate.gold[0] + Math.floor(Math.random() * (R.crate.gold[1] - R.crate.gold[0] + 1)); S.gold += gold; S.ink += R.crate.ink; save();
    const d = el('div', 'reveal', `<img src="${OS.img('loot', 'x_crate_open')}" alt="" style="width:150px"><h3 style="font-size:1.6rem">Something fell out of time</h3><p class="mut">${gold} gold, ${R.crate.ink} ink, and these.</p>`);
    const g = el('div', 'row'); g.style.justifyContent = 'center'; got.forEach(x => g.appendChild(OS.slot(x))); d.appendChild(g);
    d.appendChild(el('p', '', `<b>Smudge:</b> “${line('crate')}”`)); const ok = el('button', 'btn', 'Into the bag'); ok.onclick = modal.close; d.appendChild(ok); modal.open(d); renderAll();
  }
  function showCrate() { if (stage.querySelector('.crate')) return; const c = new Image(); c.className = 'crate'; c.src = OS.img('loot', 'x_crate'); c.alt = 'A rift crate. Tap to open.'; c.onclick = e => { e.stopPropagation(); openCrate(); }; stage.appendChild(c); }
  $('b-sell').onclick = () => {
    rollDay(); let room = sellCap() - S.sold, earned = 0;
    Object.keys(S.bag).forEach(id => { const it = OS.items[id]; if (!it || it.kind !== 'loot') return; while (S.bag[id] > 1 && earned + it.sell <= room) { S.bag[id]--; earned += it.sell; } });
    S.gold += earned; S.sold += earned; save(); renderAll(); toast(earned ? `Sold the spares for ${earned} gold.` : room <= 0 ? 'The market has had enough of you today.' : 'No spare treasure to sell. One of each is kept.');
  };
  $('p-export').onclick = () => { const code = btoa(unescape(encodeURIComponent(JSON.stringify(S)))); (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => toast('Save code copied.'), () => prompt('Copy your save code:', code)); };
  $('p-import').onclick = () => { const code = prompt('Paste a save code:'); if (!code) return; try { S = Object.assign(fresh(), JSON.parse(decodeURIComponent(escape(atob(code.trim()))))); save(); location.reload(); } catch (e) { toast('That code did not work.'); } };
  $('p-mode').onclick = () => { const next = MODES[(MODES.indexOf(S.mode) + 1) % 3]; if (next === 'unhinged' && !confirm('Unhinged Smudge swears. A lot. Adults only. Turn it on?')) { S.mode = 'sweet'; } else S.mode = next; save(); renderAll(); toast(line('idle')); };
  $('p-reset').onclick = () => { if (confirm('Wipe everything and start again?')) { localStorage.removeItem(KEY); location.reload(); } };

  // ------------------------------------------------------------------ the clock
  function advance(dt, quiet) {
    const p = places[S.place], t = actionTime(p), gotAll = [];
    S.prog += dt; let guard = 0;
    while (S.prog >= t && guard++ < 5000) { S.prog -= t; const drops = doAction(p, quiet); gotAll.push(...drops); if (!quiet) drops.forEach((id, i) => fx.drop(id, i)); }
    if (!S.crateReady) { S.crateT += dt; if (S.crateT >= R.crate.minutes * 60) { S.crateT = 0; S.crateReady = true; if (!quiet) toast(line('crate')); } }
    return gotAll;
  }
  // catch up on time away (the crew keeps working, up to the cap)
  (function offline() {
    const away = Math.min((Date.now() - S.last) / 1000, R.crew.offline_hours * 3600);
    if (away > 60 && S.actions > 0) {
      const ink0 = S.ink, got = advance(away, true);
      toast(`While you were away (${fmt(away)}): ${got.length} finds and ${OS.num(S.ink - ink0)} ink.`);
    }
  })();
  let lastT = performance.now(), swing = 0, lastHelp = 0, uiT = 0, chat = 40;
  function frame(now) {
    const dt = Math.min(1, (now - lastT) / 1000); lastT = now;
    const got = advance(dt, false);
    swing -= dt; if (swing <= 0 && current === 'work') { swing = .55; fx.work(); }
    if (got.length && current === 'work') { const best = got.sort((a, b) => R.rarities.indexOf(OS.items[b].rarity) - R.rarities.indexOf(OS.items[a].rarity))[0], it = OS.items[best]; if (it.rarity !== 'common') { say($('bubble'), it.flavor, pup); pup.cheer(1.4); } }
    chat -= dt; if (chat <= 0) { chat = 60 + Math.random() * 60; if (current === 'work') say($('bubble'), line('busy'), pup); }
    uiT -= dt;
    if (uiT <= 0) {
      uiT = .1; const p = places[S.place], t = actionTime(p);
      $('w-bar').style.width = S.prog / t * 100 + '%'; $('w-next').textContent = 'next in ' + Math.max(0, t - S.prog).toFixed(1) + 's';
      $('crate-bar').style.width = (S.crateReady ? 100 : S.crateT / (R.crate.minutes * 60) * 100) + '%'; $('crate-time').textContent = S.crateReady ? 'It is here. Tap it!' : fmt(R.crate.minutes * 60 - S.crateT);
      if (S.crateReady) showCrate(); renderTop();
      if (got.length || Math.random() < .02) { if (current === 'work') renderWork(); else if (current !== 'summon') renderers[current](); }
      if (current === 'summon') renderSummon();
      if (current === 'work' && S.ex.length) renderEx();
    }
    requestAnimationFrame(frame);
  }
  // helping: every key or tap on the work view shaves time off the current haul
  function help() { const now = performance.now(); if (now - lastHelp < 1000 / R.max_keys_per_second) return; lastHelp = now; S.prog += .25; swing = .3; fx.work(); }
  addEventListener('keydown', e => { if (e.repeat || e.metaKey || e.ctrlKey || $('modal').classList.contains('on') || (e.target.closest && e.target.closest('input,select,textarea'))) return; if (current === 'work') help(); else if (current === 'summon') stamp(); });
  stage.addEventListener('pointerdown', e => { if (!e.target.closest('.crate')) help(); });
  setInterval(save, 10000); addEventListener('visibilitychange', () => { if (document.hidden) save(); else { const away = (Date.now() - S.last) / 1000; if (away > 5) advance(Math.min(away, R.crew.offline_hours * 3600), true); lastT = performance.now(); renderAll(); } });
  addEventListener('beforeunload', save);

  // first visit: a short welcome instead of a manual
  if (!S.actions && !Object.keys(S.roster).length) {
    S.ink = summonCost(); // the first summon is on the house
    const d = el('div', 'reveal', `<img src="/assets/v2/smudge/stamp.webp" alt="" style="height:150px"><h3 style="font-size:1.7rem">The ledger is open</h3><p class="mut" style="max-width:32em">Smudge has started fishing off a Roman dock, because that is apparently his job now. He will keep at it whether you watch or not. Tap the scene or type to hurry him along. There is enough ink in the bottle for one summoning, and the Archive is waiting.</p>`);
    const ok = el('button', 'btn', 'Go and summon somebody'); ok.onclick = () => { modal.close(); show('summon'); }; d.appendChild(ok); modal.open(d);
  }
  show('work'); requestAnimationFrame(frame);
  window.__os = { S: () => S, summon, show, advance, give, save, heroSheet, lootSheet, places, openCrate };   // for testing
})();
