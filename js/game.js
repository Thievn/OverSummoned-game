// OverSummoned, the browser game. Every number comes from /data/rules.json,
// the same rulebook the desktop pet reads. Progress is saved to your account.
(async function () {
  const me = await Cloud.require();
  const OS = await window.OS.load(), R = OS.R, $ = id => document.getElementById(id), el = OS.el, now = () => Date.now();
  const MODES = ['sweet', 'salty', 'unhinged'], RAR = R.rarities, rr = r => RAR.indexOf(r);
  const places = {}; R.places.forEach(p => places[p.id] = p);
  const workPlaces = R.places.filter(p => p.skill !== 'Summoning');
  const fresh = () => ({ v: 2, ink: R.summon.base_ink + R.summon.per_unique, gold: 0, xp: { Summoning: 0, Fishing: 0, Lockpicking: 0, Digging: 0 }, bag: {}, roster: { kevin: 1 }, equip: {}, gearLv: {}, jobs: [], mastery: {}, trained: {},
    energy: R.energy.max, energyT: now(), tickets: R.raids.tickets, ticketT: now(), tonics: {}, crateT: 0, autoCrate: false, sold: 0, day: '', mode: (me.profile && me.profile.voice) || 'salty', actions: 0, summons: 0, raids: {}, guide: 0, last: now() });
  let S = Object.assign(fresh(), (await Cloud.load()) || {}); S.mode = MODES.includes(S.mode) ? S.mode : 'salty';

  // ------------------------------------------------------------------ rules
  const level = sk => { let l = 1; const x = S.xp[sk] || 0; while (l < 99 && x >= R.xp_table[l]) l++; return l; };
  const lvlOf = x => { let l = 1; while (l < 99 && x >= R.xp_table[l]) l++; return l; };
  const perk = (sk, key) => { const l = level(sk); let t = 0; R.perks.forEach(p => { if (l >= p.level && p[key]) t = key === 'double' ? Math.max(t, p[key]) : t + p[key]; }); return t; };
  const cardLevel = n => { let l = 1; while (l < R.card.max_level && n - 1 >= l * (l + 1) / 2) l++; return l; };
  const copiesFor = l => 1 + l * (l + 1) / 2;
  const unlocked = p => level(p.skill) >= p.level;
  const summonCost = () => R.summon.base_ink + R.summon.per_unique * Object.keys(S.roster).length;
  const totalLevel = () => R.skills.reduce((a, s) => a + level(s), 0);
  const jobSlots = () => R.jobs.slots.filter(t => totalLevel() >= t).length;
  const sellCap = () => R.gold.daily_sell_cap_base + R.gold.daily_sell_cap_per_level * totalLevel();
  const rollDay = () => { const d = new Date().toISOString().slice(0, 10); if (S.day !== d) { S.day = d; S.sold = 0; } };
  const tonic = eff => (S.tonics[eff] || 0) > now() ? R.tonics.find(t => t.effect === eff).amount : 0;
  const gearMult = (g, hero) => (1 + R.gear_up.per_level * (S.gearLv[g] || 0)) * (OS.items[g].owner === hero ? 1 + R.gear.signature_bonus : 1);
  const trainCap = id => R.energy.cap_base + R.energy.cap_per_card_level * cardLevel(S.roster[id] || 1);
  function heroStats(id) {
    const h = OS.heroes[id], mult = 1 + R.card.stat_per_level * (cardLevel(S.roster[id] || 1) - 1), out = {}, tr = S.trained[id] || {};
    R.stats.forEach(k => out[k] = h.stats[k] * mult + (tr[k] || 0));
    (S.equip[id] || []).forEach(g => { if (!g) return; const it = OS.items[g], m = gearMult(g, id); for (const k in it.stats) out[k] += it.stats[k] * m; });
    R.stats.forEach(k => out[k] = Math.round(out[k])); return out;
  }
  const power = id => { const s = heroStats(id); return s.attack + s.defense + s.health; };
  const mastery = (id, sk) => Math.min(R.jobs.mastery_cap, lvlOf(((S.mastery[id] || {})[sk]) || 0) - 1);
  function jobSpeed(j) {
    const p = places[j.place], st = heroStats(j.hero); let gear = 0;
    (S.equip[j.hero] || []).forEach(g => { const it = g && OS.items[g]; if (it && it.equip && it.equip.skill === p.skill) gear += it.equip.speed * gearMult(g, j.hero) / 100; });
    return 1 + st.speed / R.jobs.speed_div + mastery(j.hero, p.skill) * R.jobs.mastery_speed + perk(p.skill, 'speed') + tonic('speed') + gear;
  }
  const jobTime = j => R.tier[places[j.place].tier].seconds / jobSpeed(j);
  const jobLuck = j => heroStats(j.hero).luck / R.jobs.luck_div + tonic('luck');
  function weights(p, extra) { const luck = level(p.skill) * R.loot.luck_per_level + perk(p.skill, 'luck') + extra; return p.loot.map(([id, w]) => OS.items[id].rarity === 'common' ? w : w * (1 + luck)); }
  function rollLoot(p, extra) { const ws = weights(p, extra), tot = ws.reduce((a, b) => a + b, 0); let r = Math.random() * tot; for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return p.loot[i][0]; } return p.loot[0][0]; }
  const dropChance = (p, id, extra) => { const ws = weights(p, extra || 0), c = ws[p.loot.findIndex(r => r[0] === id)] / ws.reduce((a, b) => a + b, 0) * 100; return (c >= 1 ? c.toFixed(1) : c.toFixed(2)) + '% of finds'; };
  const give = (id, n) => S.bag[id] = (S.bag[id] || 0) + (n || 1);
  const owns = id => (S.bag[id] || 0) > 0 || Object.values(S.equip).some(e => e.includes(id));
  function gainXP(sk, n, quiet) {
    const b = level(sk); S.xp[sk] = (S.xp[sk] || 0) + n; const a = level(sk);
    if (a > b && !quiet) { toast(`${sk} is now level ${a}`); R.perks.forEach(p => { if (p.level > b && p.level <= a) toast(`New perk: ${p.name}. ${p.text}.`); }); R.places.forEach(p => { if (p.skill === sk && p.level > b && p.level <= a) toast(`New place open: ${p.name}`); }); }
  }
  // one finished action of one job
  function doAction(j, quiet) {
    const p = places[j.place], t = R.tier[p.tier], drops = [];
    S.actions++; S.ink += t.ink * R.web.ink_mult; gainXP(p.skill, Math.round(t.xp * R.web.xp_mult * (1 + tonic('xp'))), quiet);
    const m = S.mastery[j.hero] || (S.mastery[j.hero] = {}); m[p.skill] = (m[p.skill] || 0) + R.jobs.mastery_xp;
    if (Math.random() < R.web.loot_chance) { const n = Math.random() < perk(p.skill, 'double') ? 2 : 1; for (let i = 0; i < n; i++) { const id = rollLoot(p, jobLuck(j)); give(id); drops.push(id); } }
    return drops;
  }
  function tickMeters() {
    const e = R.energy.regen_seconds * 1000; while (S.energy < R.energy.max && now() - S.energyT >= e) { S.energy++; S.energyT += e; } if (S.energy >= R.energy.max) S.energyT = now();
    const t = R.raids.regen_minutes * 60000; while (S.tickets < R.raids.tickets && now() - S.ticketT >= t) { S.tickets++; S.ticketT += t; } if (S.tickets >= R.raids.tickets) S.ticketT = now();
  }
  function advance(dt, quiet) {
    const found = [];
    S.jobs.forEach((j, i) => { if (!j || !S.roster[j.hero] || !places[j.place]) return; const t = jobTime(j); j.prog = (j.prog || 0) + dt; let g = 0; while (j.prog >= t && g++ < 20000) { j.prog -= t; doAction(j, quiet).forEach(id => found.push([i, id])); } });
    S.crateT += dt; const every = R.crate.minutes * 60; while (S.crateT >= every) { S.crateT -= every; if (S.autoCrate && !quiet) openCrate(true); else give('x_crate'); if (!quiet) toast(line('crate')); }
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
    ['Give them a job', 'Open Jobs, pick an empty slot and send an arrival somewhere.', 'jobs', () => S.jobs.some(j => j)],
    ['Dress them', 'When gear turns up, open an arrival from Arrivals and tap a slot under Wearing.', 'heroes', () => Object.values(S.equip).some(e => e.some(g => g))]];
  function renderHome() {
    const hr = new Date().getHours(); $('h-day').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    $('h-hi').textContent = (hr < 12 ? 'Morning' : hr < 18 ? 'Afternoon' : 'Evening') + ', ' + me.profile.username; $('h-sub').textContent = line('idle');
    $('adminbtn').hidden = !me.admin;
    const g = $('guide'), left = GUIDE.filter(s => !s[3]()); g.hidden = !left.length;
    if (left.length) { g.innerHTML = '<div class="tag">Getting started</div>' + GUIDE.map((s, i) => `<div class="gstep ${s[3]() ? 'done' : ''}"><i>${s[3]() ? '✓' : i + 1}</i><div><b>${s[0]}</b><span>${s[1]}</span></div><button class="btn small ${s[3]() ? 'ghost' : ''}" data-go="${s[2]}">${s[3]() ? 'Done' : 'Go'}</button></div>`).join(''); }
    $('h-stats').innerHTML = [['Arrivals', Object.keys(S.roster).length + ' / ' + R.heroes.length], ['Total level', totalLevel()], ['Hauls', OS.num(S.actions)], ['Raid tickets', S.tickets + ' / ' + R.raids.tickets], ['Crates', S.bag.x_crate || 0]].map(([a, b]) => `<div class="stat"><b>${b}</b><span>${a}</span></div>`).join('');
    const box = $('h-jobs'); box.innerHTML = '';
    const act = S.jobs.filter(j => j); if (!act.length) box.appendChild(el('p', 'mut', 'Nobody is working. The arrivals are standing around eating your snacks.'));
    S.jobs.forEach((j, i) => { if (!j) return; const p = places[j.place], h = OS.heroes[j.hero], row = el('div', 'hjob');
      row.innerHTML = `<img src="${OS.img('heroes', j.hero)}" alt=""><div><b>${h.name}</b><span class="mut">${p.skill} at ${p.name}</span><div class="bar"><i data-job="${i}"></i></div></div>`; box.appendChild(row); });
    const cost = summonCost(); $('h-inkbar').style.width = pct(S.ink, cost); $('h-inkpct').textContent = Math.floor(Math.min(1, S.ink / cost) * 100) + '%';
    $('h-inktext').textContent = S.ink >= cost ? 'The bottle is full. Somebody is about to have a very strange day.' : `${OS.num(cost - S.ink)} more ink until the next stranger.`;
    const tl = R.tonics.filter(t => (S.tonics[t.effect] || 0) > now()); $('h-tonics').innerHTML = tl.length ? tl.map(t => `<div class="spread"><span><b style="color:#fff">${t.name}</b> · ${t.text}</span><b>${fmt((S.tonics[t.effect] - now()) / 1000)}</b></div>`).join('') : 'None. Brew one in the Workshop.';
    $('t-raids').textContent = S.tickets ? `${S.tickets} ticket${S.tickets > 1 ? 's' : ''} ready.` : 'Next ticket in ' + fmt((R.raids.regen_minutes * 60000 - (now() - S.ticketT)) / 1000);
  }

  // ------------------------------------------------------------------ jobs
  function renderJobs() {
    const n = jobSlots(), box = $('joblist'); box.innerHTML = ''; $('j-slots').textContent = `${S.jobs.filter(j => j).length} of ${n} slots working`;
    for (let i = 0; i < R.jobs.slots.length; i++) {
      const j = S.jobs[i], card = el('div', 'job');
      if (i >= n) { card.classList.add('lock'); card.innerHTML = `<div class="jl"><b>Locked slot</b><span class="mut">Opens at total level ${R.jobs.slots[i]}. You are at ${totalLevel()}.</span></div>`; }
      else if (!j) { card.classList.add('empty'); card.innerHTML = `<div class="jl"><b>Empty slot</b><span class="mut">Tap to send somebody to work.</span></div>`; card.onclick = () => jobSheet(i); }
      else {
        const p = places[j.place], h = OS.heroes[j.hero], t = jobTime(j);
        card.innerHTML = `<div class="jscene"><img class="sc" src="${OS.img('scenes', p.id)}" alt=""><img class="who" src="${OS.img('heroes', j.hero)}" alt="${h.name}" data-who="${i}"><div class="jpop" data-pop="${i}"></div></div>
          <div class="jl"><div class="tag">${p.era} · ${p.skill}</div><b>${h.name} at ${p.name}</b><div class="bar"><i data-job="${i}"></i></div>
          <div class="spread mut"><span>one haul every ${t.toFixed(1)}s · mastery ${mastery(j.hero, p.skill)}</span><span data-next="${i}"></span></div></div>`;
        card.onclick = () => jobSheet(i);
      }
      box.appendChild(card);
    }
  }
  function jobSheet(i) {
    const j = S.jobs[i] || { hero: null, place: null, prog: 0 }, d = el('div', '', `<h3 style="font-size:1.5rem">${S.jobs[i] ? 'Change this job' : 'Send somebody to work'}</h3>`);
    d.appendChild(el('div', 'tag', 'Who'));
    const hs = el('div', 'heroes pick'), busy = id => S.jobs.some((x, k) => x && k !== i && x.hero === id);
    Object.keys(S.roster).forEach(id => { const c = OS.card(OS.heroes[id], { mini: true, level: cardLevel(S.roster[id]) }); if (busy(id)) c.classList.add('busy'); if (j.hero === id) c.classList.add('sel'); c.onclick = () => { if (busy(id)) return; j.hero = id; upd(); }; c.dataset.id = id; hs.appendChild(c); });
    d.appendChild(hs); d.appendChild(el('div', 'tag', 'Where')).style.marginTop = '1rem';
    const ps = el('div', 'plist');
    workPlaces.forEach(p => { const open = unlocked(p), row = el('div', 'prow' + (open ? '' : ' lock'));
      row.innerHTML = `<img src="${OS.img('scenes', p.id)}" alt=""><div><div class="tag">${p.era} · ${p.skill}</div><h3>${p.name}</h3><p>${open ? p.blurb : 'Needs ' + p.skill + ' level ' + p.level + '.'}</p></div>`;
      const acts = el('div', 'row acts'); acts.appendChild(btn('small ghost', 'What drops here', e => { e.stopPropagation(); lootSheet(p, () => jobSheet(i)); })); row.appendChild(acts);
      if (open) row.onclick = () => { j.place = p.id; upd(); }; row.dataset.id = p.id; ps.appendChild(row); });
    d.appendChild(ps);
    const info = el('p', 'mut', ''), row = el('div', 'row'), go = btn('', 'Start', () => { if (!j.hero || !j.place) return; j.prog = 0; S.jobs[i] = j; save(true); modal.close(); render(); toast(`${OS.heroes[j.hero].name} is off to ${places[j.place].name}.`); });
    row.appendChild(go); if (S.jobs[i]) row.appendChild(btn('ghost', 'Call them home', () => { S.jobs[i] = null; save(true); modal.close(); render(); }));
    d.append(info, row);
    function upd() { hs.querySelectorAll('.card').forEach(c => c.classList.toggle('sel', c.dataset.id === j.hero)); ps.querySelectorAll('.prow').forEach(r => r.classList.toggle('here', r.dataset.id === j.place)); go.disabled = !(j.hero && j.place);
      info.innerHTML = j.hero && j.place ? `One haul every <b style="color:#fff">${jobTime(j).toFixed(1)}s</b> · +${Math.round(jobLuck(j) * 100)}% luck from ${OS.heroes[j.hero].name}` : 'Pick who, then where.'; }
    upd(); modal.open(d);
  }
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
  function summon() {
    const cost = summonCost(); if (S.ink < cost || summoning) return; summoning = true;
    S.ink -= cost; S.summons++; const w = R.summon.weights; let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0), rar = 'common'; for (const k of RAR) { r -= w[k]; if (r <= 0) { rar = k; break; } }
    let pool = R.heroes.filter(h => h.rarity === rar); if (!pool.length) pool = R.heroes.filter(h => h.rarity === 'common');
    const h = pool[Math.floor(Math.random() * pool.length)], had = S.roster[h.id] || 0, before = cardLevel(had || 1);
    S.roster[h.id] = had + 1; if (had && before >= R.card.max_level) give('x_shard'); gainXP('Summoning', Math.round(cost * R.summon.xp_per_ink)); Cloud.log('summon', h.id); save(true);
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
  function stamp() { const t = performance.now(); if (summoning || t - lastStamp < 1000 / R.max_keys_per_second) return; lastStamp = t; S.ink += R.web.stamp_ink; sfx.stamp(); renderTop(); renderSummon(); }
  $('s-go').onclick = summon; $('s-stamp').onclick = stamp; sstage.addEventListener('pointerdown', stamp);

  // ------------------------------------------------------------------ arrivals
  function renderHeroes() { const g = $('hgrid'); g.innerHTML = ''; $('h-count').textContent = `${Object.keys(S.roster).length} of ${R.heroes.length} met, and counting`;
    R.heroes.slice().sort((a, b) => rr(b.rarity) - rr(a.rarity)).forEach(h => { const n = S.roster[h.id] || 0, c = OS.card(h, { owned: n > 0, mini: true, level: cardLevel(n) }); if (n) c.onclick = () => heroSheet(h.id); g.appendChild(c); }); }
  function heroSheet(id) {
    const h = OS.heroes[id], n = S.roster[id], lv = cardLevel(n), st = heroStats(id), eq = S.equip[id] || (S.equip[id] = [null, null, null]);
    const d = el('div', 'herosheet'), left = el('div'), right = el('div'), job = S.jobs.find(j => j && j.hero === id);
    left.appendChild(OS.card(h, { level: lv, stats: st, gear: h.gear, dimGear: h.gear.map(g => !owns(g)) }));
    right.innerHTML = `<div class="tag r-${h.rarity}" style="color:var(--rc)">${h.rarity} · ${h.species} · ${h.era}</div><h3 style="font-size:1.7rem">${h.name}</h3>
      <p class="mut" style="font-size:.9rem;margin:.2rem 0 .6rem">Card level ${lv}${lv < R.card.max_level ? ` · ${n} of ${copiesFor(lv)} copies for level ${lv + 1}` : ' · as high as it goes'}. ${job ? 'Working at ' + places[job.place].name + '.' : 'Not working.'}</p>` +
      R.stats.map(s => `<div class="statline"><span>${OS.statWord[s]}</span><div class="bar"><i style="width:${Math.min(100, st[s] / 90 * 100)}%"></i></div><b>${st[s]}</b></div>`).join('') + `<div class="tag" style="margin-top:.8rem">Wearing</div><div class="gear3"></div><div class="row"><span class="mut">Power ${power(id)}</span></div>`;
    const g3 = right.querySelector('.gear3');
    ['weapon', 'armor', 'trinket'].forEach((slot, i) => { const w = el('div', 'g'), s = eq[i] ? OS.slot(eq[i]) : OS.slot(null); s.style.cursor = 'pointer'; s.onclick = () => gearPicker(id, i, slot); w.append(s, el('div', '', slot + (eq[i] && S.gearLv[eq[i]] ? ' +' + S.gearLv[eq[i]] : ''))); g3.appendChild(w); });
    right.querySelector('.row').prepend(btn('small', 'Train', () => { modal.close(); show('training'); }));
    d.append(left, right); modal.open(d);
  }
  function gearPicker(id, i, slot) {
    const eq = S.equip[id], d = el('div', '', `<h3 style="font-size:1.4rem">Choose a ${slot} for ${OS.heroes[id].name}</h3><p class="mut">Their own signature items work half again as well.</p>`), g = el('div', 'itemrow');
    const opts = Object.keys(S.bag).filter(x => S.bag[x] > 0 && OS.items[x] && OS.items[x].kind === 'gear' && OS.items[x].slot === slot);
    opts.sort((a, b) => (OS.items[b].owner === id) - (OS.items[a].owner === id) || rr(OS.items[b].rarity) - rr(OS.items[a].rarity));
    opts.forEach(x => { const s = OS.slot(x, { count: S.bag[x] }); s.onclick = () => { if (eq[i]) give(eq[i]); S.bag[x]--; eq[i] = x; save(true); render(); heroSheet(id); }; g.appendChild(s); });
    if (!opts.length) d.appendChild(el('p', 'mut', `No ${slot}s in the bag yet. Each place lists the gear that turns up there, and raid bosses carry the best of it.`));
    d.appendChild(g); const row = el('div', 'row'); row.style.marginTop = '1rem';
    if (eq[i]) row.appendChild(btn('small ghost', 'Take it off', () => { give(eq[i]); eq[i] = null; save(true); render(); heroSheet(id); }));
    row.appendChild(btn('small ghost', 'Back', () => heroSheet(id))); d.appendChild(row); modal.open(d);
  }

  // ------------------------------------------------------------------ bag, crates, tonics
  function renderBag() {
    rollDay(); const g = $('bgrid'); g.innerHTML = ''; const ids = Object.keys(S.bag).filter(i => S.bag[i] > 0 && OS.items[i]);
    const ord = { crate: 0, tonic: 1, gear: 2, loot: 3 }; ids.sort((a, b) => ord[OS.items[a].kind] - ord[OS.items[b].kind] || rr(OS.items[b].rarity) - rr(OS.items[a].rarity) || OS.items[a].name.localeCompare(OS.items[b].name));
    ids.forEach(id => { const it = OS.items[id], s = OS.slot(id, { count: S.bag[id], have: S.bag[id] }); if (it.kind === 'crate') { s.classList.add('pulse'); s.onclick = () => openCrate(); } if (it.kind === 'tonic') s.onclick = () => drink(id); g.appendChild(s); });
    for (let i = ids.length; i < Math.max(24, Math.ceil(ids.length / 12) * 12); i++) g.appendChild(OS.slot(null));
    $('b-cap').textContent = `Sold today: ${OS.num(S.sold)} of ${OS.num(sellCap())} gold`;
  }
  function openCrate(quiet) {
    if (!quiet) { if (!(S.bag.x_crate > 0)) return; S.bag.x_crate--; }
    const open = workPlaces.filter(unlocked), got = []; for (let i = 0; i < R.crate.rolls; i++) { const id = rollLoot(open[Math.floor(Math.random() * open.length)], R.crate.luck); give(id); got.push(id); }
    const gold = R.crate.gold[0] + Math.floor(Math.random() * (R.crate.gold[1] - R.crate.gold[0] + 1)); S.gold += gold; S.ink += R.crate.ink; Cloud.log('crate'); save(true);
    if (quiet) { toast(`Crate opened: ${gold} gold, ${got.map(x => OS.items[x].name).join(', ')}`); return; }
    const d = el('div', 'reveal', `<img src="${OS.img('loot', 'x_crate_open')}" alt="" style="width:150px" class="popin"><h3 style="font-size:1.6rem">Something fell out of time</h3><p class="mut">${gold} gold, ${R.crate.ink} ink, and these.</p>`);
    const g = el('div', 'row'); g.style.justifyContent = 'center'; got.forEach(x => g.appendChild(OS.slot(x))); d.appendChild(g); d.appendChild(el('p', '', `<b>Smudge:</b> “${line('crate')}”`));
    const row = el('div', 'row'); if (S.bag.x_crate > 0) row.appendChild(btn('', `Open another (${S.bag.x_crate} left)`, () => openCrate())); row.appendChild(btn('ghost', 'Into the bag', modal.close)); d.appendChild(row); modal.open(d); render();
  }
  function drink(id) { const t = R.tonics.find(x => x.id === id); if (!t || !(S.bag[id] > 0)) return; S.bag[id]--; S.tonics[t.effect] = Math.max(now(), S.tonics[t.effect] || 0) + t.minutes * 60000; save(true); render(); toast(`${t.name}: ${t.text}`); }
  $('b-sell').onclick = () => { rollDay(); let room = sellCap() - S.sold, earned = 0;
    Object.keys(S.bag).forEach(id => { const it = OS.items[id]; if (!it || it.kind !== 'loot') return; while (S.bag[id] > 1 && earned + it.sell <= room) { S.bag[id]--; earned += it.sell; } });
    S.gold += earned; S.sold += earned; save(true); render(); toast(earned ? `Sold the spares for ${earned} gold.` : room <= 0 ? 'The market has had enough of you today.' : 'No spare treasure to sell. One of each is kept.'); };

  // ------------------------------------------------------------------ workshop
  const spare = rar => Object.keys(S.bag).filter(id => OS.items[id] && OS.items[id].kind === 'loot' && OS.items[id].rarity === rar && id !== 'x_shard').reduce((a, id) => a + Math.max(0, S.bag[id] - 1), 0);
  function renderWorkshop() {
    const tb = $('w-tonics'); tb.innerHTML = '';
    R.tonics.forEach(t => { const have = spare(t.cost.rarity), row = el('div', 'exrow'); row.innerHTML = `<div class="slot has r-uncommon"><img src="${OS.img('loot', t.id)}" alt=""></div><div><b>${t.name}</b><div class="mut" style="font-size:.85rem">${t.text} Costs ${t.cost.n} spare ${t.cost.rarity} treasures. You have ${have} spare.</div></div>`;
      const b = btn('small', 'Brew', () => { let need = t.cost.n; Object.keys(S.bag).sort((a, b) => S.bag[b] - S.bag[a]).forEach(id => { const it = OS.items[id]; if (!it || it.kind !== 'loot' || it.rarity !== t.cost.rarity || id === 'x_shard') return; const use = Math.min(need, Math.max(0, S.bag[id] - 1)); S.bag[id] -= use; need -= use; }); give(t.id); save(true); render(); toast(`Brewed a ${t.name}. It is in the bag.`); }); b.disabled = have < t.cost.n; row.appendChild(b); tb.appendChild(row); });
    const gb = $('w-gear'); gb.innerHTML = ''; const all = new Set(); Object.keys(S.bag).forEach(id => { if (S.bag[id] > 0 && OS.items[id] && OS.items[id].kind === 'gear') all.add(id); }); Object.values(S.equip).forEach(e => e.forEach(g => g && all.add(g)));
    if (!all.size) gb.appendChild(el('p', 'mut', 'No gear yet. It turns up at jobs and falls out of raid bosses.'));
    [...all].sort((a, b) => rr(OS.items[b].rarity) - rr(OS.items[a].rarity)).forEach(id => { const it = OS.items[id], lv = S.gearLv[id] || 0, worn = Object.values(S.equip).some(e => e.includes(id)), copies = (S.bag[id] || 0) - (worn ? 0 : 1), cost = R.gear_up.gold[lv], row = el('div', 'exrow');
      row.appendChild(OS.slot(id)); row.appendChild(el('div', '', `<b style="color:${R.rarity_color[it.rarity]}">${it.name}${lv ? ' +' + lv : ''}</b><div class="mut" style="font-size:.85rem">${lv >= R.gear_up.max ? 'As good as it gets.' : `Next level: 1 spare copy and ${OS.num(cost)} gold. Spare copies: ${Math.max(0, copies)}.`}</div>`));
      const b = btn('small', 'Upgrade', () => { S.bag[id]--; S.gold -= cost; S.gearLv[id] = lv + 1; save(true); render(); toast(`${it.name} is now +${lv + 1}.`); }); b.disabled = lv >= R.gear_up.max || copies < 1 || S.gold < cost; row.appendChild(b); gb.appendChild(row); });
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
    const t = teamStats(team), log = []; let hp = t.health * R.raids.hp_mult, bhp = b.hp, win = false; const maxhp = hp;
    for (let r = 1; r <= R.raids.rounds && hp > 0 && bhp > 0; r++) {
      const who = OS.heroes[team[(r - 1) % team.length]].name, crit = Math.random() < Math.min(.5, t.luck / 300), twice = Math.random() < Math.min(.5, t.speed / 400);
      let dmg = Math.max(2, Math.round(t.attack * (.8 + Math.random() * .4) - b.defense * .5)) * (crit ? 2 : 1) * (twice ? 2 : 1); bhp -= dmg;
      log.push({ t: `${who} ${crit ? 'lands a huge hit' : twice ? 'strikes twice' : 'hits'} for ${dmg}.`, hp, bhp: Math.max(0, bhp), cls: crit ? 'crit' : '' }); if (bhp <= 0) { win = true; break; }
      const hit = Math.max(1, Math.round(b.attack * (.8 + Math.random() * .4) - t.defense / 3)); hp -= hit; log.push({ t: `${b.name} hits back for ${hit}.`, hp: Math.max(0, hp), bhp, cls: 'foe' });
    }
    const p = places[b.place], got = [];
    if (win) { for (let i = 0; i < R.raids.loot_rolls; i++) { const id = rollLoot(p, R.raids.loot_luck + t.luck / 100); give(id); got.push(id); } const gear = p.loot.filter(([id]) => OS.items[id].kind === 'gear'); if (gear.length) { const id = gear[Math.floor(Math.random() * gear.length)][0]; give(id); got.push(id); }
      S.gold += b.gold; S.raids[b.id] = (S.raids[b.id] || 0) + 1; gainXP(p.skill, R.tier[p.tier].xp * 5); } else S.gold += Math.round(b.gold * .1);
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
    $('ac-stats').innerHTML = R.skills.map(s => `<div class="kv"><span>${s}</span><b>Level ${level(s)}</b></div>`).join('') + `<div class="kv"><span>Hauls</span><b>${OS.num(S.actions)}</b></div><div class="kv"><span>Summons</span><b>${S.summons}</b></div>`;
  }
  $('ac-out').onclick = async () => { await save(true); Cloud.signOut(); };
  $('ac-reset').onclick = async () => { if (confirm('Wipe this ledger and start again? This cannot be undone.')) { S = fresh(); await Cloud.save(S, summary()); location.reload(); } };

  const renderers = { home: renderHome, jobs: renderJobs, summon: renderSummon, heroes: renderHeroes, bag: renderBag, workshop: renderWorkshop, training: renderTraining, raids: renderRaids, board: renderBoard, shop: renderShop, account: renderAccount };
  function render() { renderTop(); renderers[current](); }

  // ------------------------------------------------------------------ the clock
  (function offline() { const away = Math.min((now() - S.last) / 1000, R.crew.offline_hours * 3600); if (away > 60 && S.jobs.some(j => j)) { const ink0 = S.ink, got = advance(away, true); toast(`While you were away (${fmt(away)}): ${got.length} finds and ${OS.num(S.ink - ink0)} ink.`); } else tickMeters(); })();
  let lastT = performance.now(), uiT = 0, slow = 0;
  function frame(t) {
    const dt = Math.min(2, (t - lastT) / 1000); lastT = t; const got = advance(dt, false);
    got.forEach(([i, id]) => { const pop = document.querySelector(`[data-pop="${i}"]`), who = document.querySelector(`[data-who="${i}"]`), it = OS.items[id]; if (who) { who.classList.remove('hop'); void who.offsetWidth; who.classList.add('hop'); }
      if (pop) { const d = el('div', 'drop', `<img src="${OS.img('loot', it.icon)}" alt=""><span style="color:${R.rarity_color[it.rarity]}">${it.name}</span>`); pop.appendChild(d); setTimeout(() => d.remove(), 1900); } if (rr(it.rarity) >= 2) toast(`${OS.heroes[S.jobs[i].hero].name} found: ${it.name}`); });
    uiT -= dt; if (uiT <= 0) { uiT = .1; renderTop(); S.jobs.forEach((j, i) => { if (!j) return; const tt = jobTime(j); document.querySelectorAll(`[data-job="${i}"]`).forEach(b => b.style.width = pct(j.prog, tt)); const nx = document.querySelector(`[data-next="${i}"]`); if (nx) nx.textContent = 'next in ' + Math.max(0, tt - j.prog).toFixed(1) + 's'; });
      if (current === 'summon') renderSummon(); slow -= .1; if (slow <= 0) { slow = 1; if (['training', 'raids', 'home'].includes(current) && !$('modal').classList.contains('on')) renderers[current](); if (got.length && current === 'bag') renderBag(); } }
    requestAnimationFrame(frame);
  }
  addEventListener('keydown', e => { if (e.repeat || e.metaKey || e.ctrlKey || $('modal').classList.contains('on') || (e.target.closest && e.target.closest('input,select,textarea'))) return; if (current === 'summon') stamp(); });
  setInterval(() => { if (dirty) save(true); }, 20000);
  addEventListener('visibilitychange', () => { if (document.hidden) save(true); else { const away = (now() - S.last) / 1000; if (away > 5) advance(Math.min(away, R.crew.offline_hours * 3600), true); lastT = performance.now(); render(); } });
  addEventListener('pagehide', () => save(true));
  Cloud.track(); $('boot').remove(); show('home'); requestAnimationFrame(frame);
  window.__os = { S: () => S, summon, show, advance, give, save, heroSheet, lootSheet, places, openCrate, render };   // for testing
})();
