// Duels, the practice table (O9). The rules live in duel-engine.mjs; this file only draws them.
// game.js calls DuelUI.init(ctx) once, DuelUI.lobby() when the Duels screen opens.
// Plan: PLAN-CITY-DUELS.md 3.7. Words: data/duel_words.json (stand-ins until F7).
(function () {
  let E = null, W = null, X = null;         // the engine module, the words, the game's helpers
  let st = null, lvl = 1, mine = [], busy = false, info = null, tick = null, deckSel = null, tableOpen = false;
  const $ = id => document.getElementById(id);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const fill = (t, o) => t.replace(/\{(\w+)\}/g, (_, k) => o && o[k] != null ? o[k] : '');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const first = n => (n || '').split(' ')[0];
  const buzz = ms => { try { if (navigator.vibrate && !matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate(ms); } catch (e) { } };
  const nm = id => (X.R.duel.short || {})[id] || first(hero(id).name);
  const STATK = ['attack', 'defense', 'health', 'speed', 'luck'];
  const SHORT = { attack: 'Atk', defense: 'Def', health: 'Hp', speed: 'Spd', luck: 'Lck' };
  // each arena fights to the battle theme nearest its era (missing files fall back to the raid theme)
  // two tracks per arena: the duel opens on the first and moves to the second at round three, so the back
  // half of a long duel does not sound like the front. Missing files fall back to the raid theme in sound.js.
  const TUNE = {
    dock: ['b_ancient', 'd_ancient'], speakeasy: ['b_noir', 'd_noir'], vault: ['d_noir', 'b_noir'],
    fjord: ['b_north', 'd_north'], blackforest: ['b_gothic', 'd_gothic'], outback: ['d_sun', 'b_romp'],
    bondi: ['b_romp', 'd_sun'], closet: ['d_neon', 'b_romp'], archive: ['d_neon', 'b_gothic'],
  };
  const tuneFor = () => { const t = TUNE[st.arena] || ['battle']; return t[st.round >= 3 ? 1 : 0] || t[0]; };

  async function load() {
    if (!E) E = await import('/js/duel-engine.mjs' + X.OS.VER);
    if (!W) W = await (await fetch('/data/duel_words.json' + X.OS.VER)).json();
  }
  const R = () => X.R, D = () => X.R.duel, S = () => X.S();
  const hero = id => X.OS.heroes[id];
  const rec = () => { const s = S(); s.duel = s.duel || { deck: [], rec: [[0, 0], [0, 0], [0, 0]], day: '', paid: 0 }; const d = s.duel; if (!d.rec) d.rec = [[0, 0], [0, 0], [0, 0]]; if (d.lesson == null) d.lesson = 1; if (d.coach == null) d.coach = D().coach_duels || 3; return d; };
  const owned = () => Object.keys(S().roster).filter(id => hero(id));
  const minDeck = () => D().practice.min_deck || D().deck;

  // ------------------------------------------------------------------ the Duels screen
  async function lobby() {
    const box = $('du-body'); if (!box) return; await load();
    const d = rec(), have = owned(), need = minDeck(), max = D().deck;
    d.deck = (d.deck || []).filter(id => have.includes(id)).slice(0, max);
    if (d.captain && !d.deck.includes(d.captain)) d.captain = null;
    if (!d.captain && d.deck.length) d.captain = d.deck[0];
    box.innerHTML = '';
    if (have.length < need) {
      box.innerHTML = `<div class="panel"><p>Smudge needs ${need} arrivals to make a deck. You have ${have.length}. Summon a few more and come back.</p></div>`; return;
    }
    // ---- the road
    const road = D().road, lvlNow = roadLevel(d.xp || 0);
    const rp = X.el('div', 'panel duroad');
    const need2 = roadNeed(lvlNow), had = roadNeed(lvlNow - 1);
    rp.innerHTML = `<div class="spread"><h3>Duelist ${lvlNow}</h3><span class="mut">${d.xp || 0} / ${need2}</span></div>
      <div class="bar"><i style="width:${Math.min(100, ((d.xp || 0) - had) / Math.max(1, need2 - had) * 100)}%;background:linear-gradient(90deg,#2c7a49,#6fe394)"></i></div>
      <p class="mut" style="font-size:.86rem;margin:.4rem 0 0">${nextPrize(lvlNow)}</p>`;
    box.appendChild(rp);
    // ---- the ladder
    const lp = X.el('div', 'panel duladder'); lp.innerHTML = '<h3>Who wants a game</h3>';
    const row = X.el('div', 'dulv');
    D().levels.forEach((L, i) => { const b2 = X.el('button', 'dulvb' + (lvl === i ? ' on' : ''), `<b>${L.name}</b><span>${W.level_text[i]}</span>`);
      b2.onclick = () => { lvl = i; X.SND('tab'); lobby(); }; row.appendChild(b2); });
    lp.appendChild(row);
    const grid = X.el('div', 'durivals');
    D().rivals.forEach(r => {
      const beat = ((d.beat || {})[r.id] || []), done = beat.includes(lvl);
      const c = X.el('button', 'durival' + (done ? ' done' : ''));
      const place = X.R.places.find(p => p.id === r.arena) || {};
      c.innerHTML = `<i class="drbg" style="background-image:url(/assets/v2/bg/${bgFor(r.arena)}.webp)"></i>
        <span class="drname">${r.name}</span><span class="drplace">${place.name || ''}</span>
        <span class="drtxt">${r.text}</span>
        <span class="drpips">${D().levels.map((L, i) => `<i class="${beat.includes(i) ? 'on' : ''}" title="${L.name}"></i>`).join('')}</span>
        <span class="drgo">${done ? `Beaten \u00b7 ${OSnum(repeatFor(r, D().levels[lvl]))} gold a win` : `First win: ${OSnum(payFor(r, D().levels[lvl]))} gold`}</span>`;
      c.onclick = () => { if (d.deck.length < need) return X.toast(`Pick ${need - d.deck.length} more card${need - d.deck.length > 1 ? 's' : ''} first.`); open(false, r.id); };
      grid.appendChild(c);
    });
    lp.appendChild(grid); box.appendChild(lp);
    // ---- the deck
    const dp = X.el('div', 'panel dudeck');
    const cost = d.deck.reduce((t, id) => t + D().cost[hero(id).rarity], 0);
    dp.innerHTML = `<div class="spread"><h3>Your deck <span class="mut">${d.deck.length} / ${max}</span></h3><span class="row"><button class="btn small ghost" id="du-auto">Pick for me</button><button class="btn small ghost" id="du-clear">Clear</button></span></div>
      <p class="mut" style="font-size:.9rem;margin:.2rem 0 .6rem">At least ${need}, up to ${max}. Mix cheap and dear: seven energy left with nothing to spend it on is seven wasted.${d.deck.length ? ' Average cost ' + (cost / d.deck.length).toFixed(1) + '.' : ''}
      Tap a card in your deck again to make it <b>captain</b>: once a duel you can call on them, and they score far more that turn.</p>`;
    const grid2 = X.el('div', 'dugrid');
    have.slice().sort((a2, b2) => (d.deck.includes(b2) - d.deck.includes(a2)) || (D().cost[hero(a2).rarity] - D().cost[hero(b2).rarity]) || hero(a2).name.localeCompare(hero(b2).name)).forEach(id => {
      const c = miniCard(id, null), inDeck = d.deck.includes(id);
      c.classList.toggle('in', inDeck); c.classList.toggle('cap', d.captain === id);
      if (d.captain === id) c.insertAdjacentHTML('beforeend', '<em class="capmark">Captain</em>');
      c.onclick = () => {
        const i = d.deck.indexOf(id);
        if (i < 0) { if (d.deck.length >= max) return X.toast(`A deck holds ${max}. Take one out first.`); d.deck.push(id); if (!d.captain) d.captain = id; }
        else if (d.captain !== id) d.captain = id;                       // already in: tap again to make captain
        else { d.deck.splice(i, 1); d.captain = d.deck[0] || null; }      // captain tapped again: out it goes
        X.SND('click'); X.save(); lobby();
      };
      grid2.appendChild(c);
    });
    dp.appendChild(grid2); box.appendChild(dp);
    $('du-auto').onclick = () => { d.deck = autoDeck(have, max); d.captain = d.deck[d.deck.length - 1]; X.SND('confirm'); X.save(); lobby(); };
    $('du-clear').onclick = () => { d.deck = []; d.captain = null; X.save(); lobby(); };
    // ---- how it works
    const how = X.el('div', 'panel duhow');
    how.innerHTML = `<div class="spread"><h3>How a duel goes</h3><button class="btn small ghost" id="du-lesson">Show me again</button></div><ul>
      <li>Both sides pick up to three cards a turn and reveal together.</li>
      <li>Each turn calls one stat. A card scores that stat, so a slow tank is useless on a Speed call and a monster on a Health one.</li>
      <li>Energy: ${D().energy.start} to start, ${D().energy.per_turn} more each turn, up to ${D().energy.max}. What you do not spend carries over.</li>
      <li><b>Swap two:</b> before the first turn you may put two cards back and draw again.</li>
      <li><b>Stand down:</b> sit out the rest of a round and start the next one with ${D().stand_down_energy} extra energy. Losing a round on purpose is often the right move.</li>
      <li><b>Captain's Call:</b> once a duel, your captain scores far more on that turn.</li>
      <li>Three turns make a round. Most points takes it. First to ${D().rounds_to_win} rounds wins.</li></ul>`;
    box.appendChild(how);
    $('du-lesson').onclick = () => { d.lesson = 1; X.save(); X.toast('Smudge will walk you through the next duel.'); };
  }
  const OSnum = n => X.OS.num(n);
  const bgFor = arena => ({ dock: 'rome', fjord: 'norway', vault: 'venice', speakeasy: 'chicago', closet: 'office',
    outback: 'outback', bondi: 'beach', blackforest: 'forest', archive: 'beyond' })[arena] || 'city';
  function roadNeed(l) { const R2 = D().road; let t = 0, step = R2.xp; for (let i = 1; i < Math.max(1, l + 1); i++) { t += Math.round(step); step *= R2.step; } return t; }
  function roadLevel(xp) { const R2 = D().road; let l = 1; while (l < R2.max && xp >= roadNeed(l)) l++; return l; }
  function nextPrize(l) { const P = D().road.prizes, nxt = Object.keys(P).map(Number).filter(n => n > l).sort((a, b) => a - b)[0];
    if (!nxt) return 'Every prize claimed.'; const [kind, what] = P[nxt].split(':');
    return `Duelist ${nxt}: ${kind === 'title' ? 'the title \u201c' + what + '\u201d' : kind === 'back' ? 'a new card back' : 'a new table'}.`; }

  // a sensible deck from what you own: the best points per energy, with the cost curve kept mixed
  function autoDeck(have, max) {
    const val = id => { const c = E.makeCard(R(), id, X.own(id), D().practice.bracket); return STATK.reduce((t, k) => t + c.st[k], 0) / 5 / c.cost; };
    const by = {}; have.forEach(id => { const c = D().cost[hero(id).rarity]; (by[c] = by[c] || []).push(id); });
    Object.values(by).forEach(a => a.sort((x, y) => val(y) - val(x)));
    const out = [], keys = Object.keys(by).sort((a, b) => a - b);
    while (out.length < Math.min(max, have.length)) { let added = false; for (const k of keys) { if (by[k].length && out.length < max) { out.push(by[k].shift()); added = true; } } if (!added) break; }
    return out;
  }
  // a rival's deck: drawn from the groups that rival is about, topped up from everyone else, then levelled
  // to the difficulty. Seeded by nothing, so no two matches play the same cards.
  function rivalDeck(r, n) {
    const all = X.R.heroes, lv = D().levels[lvl], out = [];
    (r.pool || []).forEach(g => all.filter(h => h[g[0]] === g[1] && !out.includes(h.id)).sort(() => Math.random() - .5).forEach(h => { if (out.length < n) out.push(h.id); }));
    all.map(h => h.id).sort(() => Math.random() - .5).forEach(id => { if (out.length < n && !out.includes(id)) out.push(id); });
    if (r.captain && !out.includes(r.captain)) out[out.length - 1] = r.captain;
    return out.map(id => { const tr = {}; STATK.forEach(k => { tr[k] = Math.floor(Math.random() * (lv.train + 1)); });
      return E.makeCard(R(), id, { level: Math.max(1, lv.level - Math.floor(Math.random() * 2)), trained: tr, kit: 0 }, D().practice.bracket); });
  }
  const rivalOf = id => D().rivals.find(r => r.id === id) || D().rivals[0];
  const payFor = (r, L) => Math.round(L.gold * ((D().tier_pay || [])[r.tier] || 1));
  const repeatFor = (r, L) => Math.max(D().practice.gold, Math.round(payFor(r, L) * (D().practice.repeat_share || 0.2) / 10) * 10);
  const xpFor = (r, L) => Math.round(L.xp * ((D().tier_pay || [])[r.tier] || 1));

  // ------------------------------------------------------------------ cards
  function miniCard(id, opt) {
    const h = hero(id), o = opt || {}, c = X.el('div', 'dc r-' + h.rarity), m = D().moves[id];
    c.style.setProperty('--rc', X.R.rarity_color[h.rarity]);
    c.dataset.id = id;
    c.innerHTML = `<i class="dcbg" style="background-image:url(/assets/v2/bg/${h.bg}.webp)"></i><img class="dcart" src="${X.OS.img('heroes', id)}" alt="" draggable="false">
      <b class="dccost">${D().cost[h.rarity]}</b>${o.val != null ? `<b class="dcval">${o.val}</b>` : ''}
      ${m ? `<span class="dctag"><i>${m.icon}</i>${m.tag}</span>` : ''}<span class="dcname">${nm(id)}</span>`;
    if (o.val != null) c.querySelector('.dcval').style.setProperty('--sc', statColor());
    return c;
  }
  const statColor = k => (D().stat_color || {})[k || (st ? E.call(st) : 'attack')] || '#ffd35c';
  const downCard = () => { const c = X.el('div', 'dc down'); c.innerHTML = '<i class="dcback"></i>'; return c; };

  // ------------------------------------------------------------------ the table
  let rival = null;
  async function open(again, rivalId) {
    await load(); const d = rec(); if (d.deck.length < minDeck()) return;
    rival = rivalOf(rivalId || (rival && rival.id));
    const mineCards = d.deck.map(id => E.makeCard(R(), id, X.own(id), D().practice.bracket));
    const theirs = rivalDeck(rival, mineCards.length);
    st = E.newDuel(R(), [mineCards, theirs], { seed: (Math.random() * 4294967295) >>> 0, arena: rival.arena,
      captains: [d.captain || d.deck[0], rival.captain] });
    mine = []; busy = false; tableOpen = true;
    const t = $('duel'); t.hidden = false; document.body.classList.add('induel');
    setBackdrop(st.arena);
    $('dt-them').textContent = rival.name + ' \u00b7 ' + D().levels[lvl].name;
    if (!again) history.pushState({ v: 'duels', duel: 1 }, '', '#duels');
    if (X.OS.Sound) X.OS.Sound.music(tuneFor());
    pose('walk'); drawTrail(true); drawAll(); say(rival.text);
    if (lessonOn()) { st.swap = false; setTimeout(lessonStart, 1200); }
    else setTimeout(offerSwap, 900);
  }

  // the arena's own picture, in the cut that fits the screen; the old card picture if it is not there yet
  function setBackdrop(arena) {
    const n = $('duel').querySelector('.dtbg'), wide = innerWidth > innerHeight;
    const want = `/assets/v2/duel/arena_${arena}${wide ? '_w' : ''}.webp${X.OS.VER}`;
    const img = new Image();
    img.onload = () => { n.style.backgroundImage = `url(${want})`; n.classList.add('painted'); };
    img.onerror = () => { n.style.backgroundImage = `url(/assets/v2/bg/${bgFor(arena)}.webp)`; n.classList.remove('painted'); };
    img.src = want;
  }

  // ---- swap two, before the first turn
  let swapPicks = [];
  function offerSwap() {
    if (!st || !st.swap) return;
    swapPicks = []; const box = $('dt-swap'); box.hidden = false; drawSwap();
  }
  function drawSwap() {
    const max = D().swap || 2, box = $('dt-swap');
    box.innerHTML = `<div class="dswin"><h3>Put back up to ${max}</h3>
      <p class="mut">A card you put back goes under your deck and comes round again later.</p>
      <div class="dsrow" id="ds-row"></div>
      <div class="row"><button class="btn" id="ds-go">${swapPicks.length ? 'Swap ' + swapPicks.length : 'Keep this hand'}</button></div></div>`;
    const row = $('ds-row');
    st.sides[0].hand.forEach(id => { const c = miniCard(id, { val: E.cardValue(R(), st, 0, id) });
      c.classList.toggle('picked', swapPicks.includes(id));
      c.onclick = () => { const i = swapPicks.indexOf(id); if (i >= 0) swapPicks.splice(i, 1); else if (swapPicks.length < max) swapPicks.push(id); X.SND('click'); drawSwap(); };
      row.appendChild(c); });
    $('ds-go').onclick = () => { if (swapPicks.length) { E.swapTwo(R(), st, 0, swapPicks); X.SND('flip'); }
      st.swap = false; box.hidden = true; drawAll();
      say(fill(pick(W.round_start), { n: st.round, calls: st.calls.map(k => W.calls[k]).join(', ') })); };
  }
  function close(silent) {
    if (!tableOpen) return; tableOpen = false; $('duel').hidden = true; document.body.classList.remove('induel'); st = null;
    clearTimeout(tick); X.tune(); X.render();
    if (!silent && history.state && history.state.duel) history.back();
  }

  function drawAll() { drawTop(); drawSlots(); drawHand(); drawBars(); drawCalls(); drawEnergy(); }
  function drawTop() {
    const pip = (n, cls) => Array.from({ length: D().rounds_to_win }, (_, i) => `<i class="${i < n ? cls : ''}"></i>`).join('');
    $('dt-rounds').innerHTML = `<span class="rp you">${pip(st.sides[0].rounds, 'on')}</span><span class="rn">Round ${st.round}</span><span class="rp them">${pip(st.sides[1].rounds, 'on')}</span>`;
    $('dt-arena').textContent = 'Arena: ' + (X.R.places.find(p => p.id === st.arena) || {}).name;
  }
  function drawCalls() {
    const k = E.call(st);
    $('dt-calls').innerHTML = st.calls.map((kk, i) => `<span class="${i === st.turn ? 'now' : i < st.turn ? 'done' : ''}" style="--sc:${statColor(kk)}">${W.calls[kk]}</span>`).join('');
    const b = $('dt-call'); b.textContent = W.calls[k] || ''; b.style.setProperty('--sc', statColor(k));
    $('duel').style.setProperty('--call', statColor(k));
  }
  function drawBars() {
    const [a, b] = st.sides.map(p => p.pts);
    $('dt-you-pts').textContent = a; $('dt-them-pts').textContent = b;
    moveMarker(a - b, a + b);
  }
  function drawEnergy() {
    const p = st.sides[0], spent = mine.reduce((t, id) => t + E.costOf(R(), st, 0, id), 0), left = p.energy - spent, mx = D().energy.max;
    $('dt-you-en').innerHTML = `<b>${left}</b><small>+${D().energy.per_turn}</small>`;
    $('dt-them-en').innerHTML = `<b>${st.sides[1].energy}</b><small>+${D().energy.per_turn}</small>`;
    $('dt-pips').innerHTML = Array.from({ length: mx }, (_, i) => `<i class="${i < left ? 'on' : i < p.energy ? 'used' : ''}"></i>`).join('');
    $('dt-ready').textContent = mine.length ? 'Ready' : 'Pass';
    const d2 = rec(), capId = d2.captain || st.sides[0].captain;
    const cb = $('dt-captain'), dn = $('dt-down');
    cb.hidden = st.sides[0].calledCaptain || st.sides[0].down;
    cb.classList.toggle('armed', !!st.sides[0].callNow);
    cb.textContent = st.sides[0].callNow ? `${nm(capId)} is called` : `Captain's Call`;
    dn.hidden = st.sides[0].down;
    const sum = mine.reduce((t, id) => t + E.cardValue(R(), st, 0, id), 0);
    $('dt-sum').innerHTML = st.sides[0].down
      ? `<span class="mut">You stood down. ${D().stand_down_energy} extra energy next round.</span>`
      : mine.length
      ? `Playing <b>${mine.length}</b>: <b style="color:${statColor()}">${sum}</b> on ${W.calls[E.call(st)]} for <b>${spent}</b> energy`
      : `<span class="mut">Tap a card to play it. This turn counts <b style="color:${statColor()}">${W.calls[E.call(st)]}</b>.</span>`;
  }
  function drawSlots() {
    ['dt-slots-you', 'dt-slots-them'].forEach((sid, side) => {
      const box = $(sid); box.innerHTML = '';
      for (let i = 0; i < D().per_turn; i++) { const s = X.el('div', 'dslot'); box.appendChild(s);
        if (side === 0 && mine[i]) { const c = miniCard(mine[i], { val: E.cardValue(R(), st, 0, mine[i]) }); c.onclick = () => unplace(mine[i]); c.onmouseenter = () => showInfo(mine[i]); s.appendChild(c); } }
    });
  }
  // the coach: for a new player's first few duels, the best-value card it can afford gets a soft glow
  function coachId() {
    const d = rec(); if (!d.coach || busy) return null;
    const p = st.sides[0], spent = mine.reduce((t, id) => t + E.costOf(R(), st, 0, id), 0);
    let best = null, bv = 0;
    p.hand.forEach(id => { if (mine.includes(id) || p.locked.includes(id)) return;
      const c = E.costOf(R(), st, 0, id); if (c > p.energy - spent) return;
      const v = E.cardValue(R(), st, 0, id) / c; if (v > bv) { bv = v; best = id; } });
    return best;
  }
  function drawHand() {
    const p = st.sides[0], box = $('dt-hand'); box.innerHTML = '';
    const spent = mine.reduce((t, id) => t + E.costOf(R(), st, 0, id), 0);
    p.hand.forEach(id => {
      if (mine.includes(id)) { box.appendChild(X.el('div', 'dc gap')); return; }
      const c = miniCard(id, { val: E.cardValue(R(), st, 0, id) }), cost = E.costOf(R(), st, 0, id);
      if (cost > p.energy - spent) { c.classList.add('cant'); c.insertAdjacentHTML('beforeend', `<em class="need">need ${cost}</em>`); }
      if (p.locked.includes(id)) { c.classList.add('lock'); c.insertAdjacentHTML('beforeend', '<em class="need">locked</em>'); }
      if (cost !== D().cost[hero(id).rarity]) c.querySelector('.dccost').classList.add('taxed');
      bindDrag(c, id); box.appendChild(c);
    });
    const co = coachId(); if (co) { const n = box.querySelector(`.dc[data-id="${co}"]`); if (n) n.classList.add('coach'); }
    $('dt-deck').textContent = p.deck.length;
  }

  // tap to place, tap again to take back; or drag a card up out of the hand
  function bindDrag(c, id) {
    let sx = 0, sy = 0, ghost = null, moved = false, eat = false;
    c.addEventListener('pointerdown', e => { if (busy) return; sx = e.clientX; sy = e.clientY; moved = false; eat = false; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', e => { if (!c.hasPointerCapture(e.pointerId)) return; const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 12) { moved = true; ghost = c.cloneNode(true); ghost.classList.add('ghost'); document.body.appendChild(ghost); c.classList.add('lift'); }
      if (ghost) { const r = c.getBoundingClientRect(); ghost.style.left = (r.left + dx) + 'px'; ghost.style.top = (r.top + dy) + 'px'; ghost.style.width = r.width + 'px'; } });
    c.addEventListener('pointerup', e => { const dy = e.clientY - sy; if (ghost) { ghost.remove(); ghost = null; c.classList.remove('lift'); }
      if (moved) { eat = true; if (dy < -40) place(id); } });
    c.addEventListener('click', () => { if (eat) { eat = false; return; } showInfo(id); place(id); });
    c.addEventListener('pointercancel', () => { if (ghost) { ghost.remove(); ghost = null; c.classList.remove('lift'); } });
  }
  function place(id) {
    if (busy || mine.includes(id)) return;
    const name = nm(id);
    if (st.sides[0].locked.includes(id)) { X.SND('deny'); return say(fill(W.cant_lock, { you: name })); }
    if (mine.length >= D().per_turn) { X.SND('deny'); return say(W.cant_three); }
    if (!E.legal(R(), st, 0, mine.concat(id))) { X.SND('deny'); return say(fill(W.cant_energy, { you: name })); }
    mine.push(id); X.SND('flip'); buzz(8); drawSlots(); drawHand(); drawEnergy(); lessonDid('placed');
  }
  function unplace(id) { if (busy) return; mine = mine.filter(x => x !== id); X.SND('back'); drawSlots(); drawHand(); drawEnergy(); }

  function showInfo(id) {
    const h = hero(id), c = st.cards['0:' + id] || st.cards['1:' + id] || E.makeCard(R(), id, X.own(id), D().practice.bracket), m = D().moves[id], k = E.call(st);
    $('dt-info').innerHTML = `<button class="dix" aria-label="Close">×</button><b>${h.name}</b> <span class="mut">${X.OS.cap(h.rarity)} · costs ${c.cost}</span>
      <div class="dist">${STATK.map(s2 => `<span class="${s2 === k ? 'now' : ''}" ${s2 === k ? `style="--sc:${statColor(k)}"` : ''}>${SHORT[s2]} <b>${c.st[s2]}</b></span>`).join('')}</div>
      ${m ? `<div class="dimv"><i>${m.icon}</i> <b>${m.name}.</b> ${m.text}</div>` : ''}`;
    $('dt-info').classList.add('on'); clearTimeout(info);
  }
  function say(t) { const n = $('dt-say'); n.classList.remove('in'); void n.offsetWidth; n.textContent = t; n.classList.add('in'); }

  // ------------------------------------------------------------------ Smudge the referee
  // Six drawings, same size and feet position, so swapping one for another reads as a pose change.
  // Everything but `walk` goes back to `walk` after a moment.
  const POSE = { walk: 'walk', you: 'point_you', them: 'point_them', cheer: 'cheer', sulk: 'sulk', stamp: 'stamp' };
  let poseT = null;
  function pose(name, hold) {
    const img = $('dt-smudge').querySelector('img'), f = POSE[name] || POSE.walk;
    const src = `/assets/v2/duel/smudge_${f}.webp${X.OS.VER}`;
    const box = $('dt-smudge');
    if (img.getAttribute('src') !== src) { img.src = src; box.classList.remove('hop'); void box.offsetWidth; box.classList.add('hop'); }
    box.className = 'dsmudge p-' + name + (box.classList.contains('lean') ? ' lean' : '');
    clearTimeout(poseT); if (hold) poseT = setTimeout(() => pose('walk'), hold);
  }

  // ------------------------------------------------------------------ the ink trail and Smudge on it
  // The trail is drawn in the box's own pixels (not stretched), so the ink stays round and the split between
  // the two colours can be set in real lengths.
  let path = null, plen = 0, markerF = 0.5, tw = 100, th = 100;
  function drawTrail(fresh) {
    const svg = $('dt-trail'), r = svg.getBoundingClientRect(); tw = Math.max(80, r.width); th = Math.max(80, r.height);
    const rad = Math.min(th / 10, tw * 0.09), x0 = rad + 6, x1 = tw - rad - 6, mid = tw / 2;
    const rows = th < 150 ? 2 : th < 220 ? 3 : 4;      // a short screen gets fewer bends, so the ink has room
    const top = th * 0.08, step = (th * 0.84) / rows;
    let d = `M${mid} 0 V${top} H${x1}`;
    for (let i = 0; i < rows; i++) { const y = top + step * (i + 1), right = i % 2 === 0;
      d += ` C${(right ? x1 : x0) + (right ? 1 : -1) * step * 0.7} ${y - step} ${(right ? x1 : x0) + (right ? 1 : -1) * step * 0.7} ${y} ${right ? x1 : x0} ${y}`;
      d += i < rows - 1 ? ` H${right ? x0 : x1}` : ` H${mid}`; }
    d += ` V${th}`;
    svg.setAttribute('viewBox', `0 0 ${tw} ${th}`); svg.setAttribute('preserveAspectRatio', 'none');
    svg.innerHTML = `<path class="ink edge" d="${d}"/><path class="ink them" d="${d}"/><path class="ink you" d="${d}"/>`;
    path = svg.querySelector('.ink.you'); plen = path.getTotalLength();
    if (fresh) {                                       // ink runs out from where Smudge stands, both ways at once
      const half = plen / 2;
      svg.querySelectorAll('.ink').forEach(n => { n.style.transition = 'none'; n.style.strokeDasharray = `0 ${half} 0 ${plen}`; });
      requestAnimationFrame(() => { svg.querySelectorAll('.ink').forEach(n => { n.style.transition = 'stroke-dasharray .6s ease-out'; n.style.strokeDasharray = `${half} 0 ${half} 0`; });
        setTimeout(() => { svg.querySelectorAll('.ink').forEach(n => { n.style.transition = ''; n.style.strokeDasharray = ''; }); setMarker(markerF, st ? st.sides[0].pts - st.sides[1].pts : 0); }, 640); });
    }
    setMarker(fresh ? 0.5 : markerF, st ? st.sides[0].pts - st.sides[1].pts : 0);
  }
  function moveMarker(gap, total) { const scale = Math.max(30, total * 0.6); const f = 0.5 - Math.max(-0.46, Math.min(0.46, gap / scale * 0.5)); setMarker(f, gap); }
  // he points at whoever just scored, cheers a round won, despairs at one lost, slams the stamp at the end
  function setMarker(f, gap) {
    if (!path) return; markerF = f; const L = plen * f, p = path.getPointAtLength(L), m = $('dt-smudge');
    const svg = $('dt-trail'); m.style.left = (svg.offsetLeft + p.x * svg.clientWidth / tw) + 'px'; m.style.top = (svg.offsetTop + p.y * svg.clientHeight / th) + 'px';
    svg.querySelector('.ink.you').style.strokeDasharray = `0 ${L} ${plen - L + 2}`;   // gold from Smudge down to your cards
    svg.querySelector('.ink.them').style.strokeDasharray = `${L} ${plen + 2}`;          // violet from their cards down to Smudge
    const sign = $('dt-sign'); sign.textContent = Math.abs(gap); sign.className = 'sign ' + (gap > 0 ? 'you' : gap < 0 ? 'them' : '');
    m.classList.toggle('lean', gap !== 0); m.style.setProperty('--lean', gap > 0 ? '-8deg' : '8deg');
  }

  // ------------------------------------------------------------------ a turn
  async function ready() {
    if (busy || !st || st.over) return; busy = true; $('dt-ready').disabled = true; $('dt-info').classList.remove('on'); lessonDid('ready');
    const ai = D().levels[lvl].ai;
    if (E.wantsDown(R(), st, 1, ai)) { E.standDown(R(), st, 1); say(`${rival.name} stands down.`); banner('They stood down', 'them'); await wait(900); }
    if (E.wantsCaptain(R(), st, 1, ai)) { const g = E.captainCall(R(), st, 1); if (g) { say(`${rival.name} calls on ${nm(g)}.`); await wait(700); } }
    const theirs = E.choose(R(), st, 1, ai), picks = [mine.slice(), theirs];
    if (!picks[0].length) say(pick(W.pass));
    X.SND('confirm');
    // their cards land face down
    const tb = $('dt-slots-them').children; theirs.forEach((_, i) => { tb[i].innerHTML = ''; const dc = downCard(); dc.classList.add('drop'); tb[i].appendChild(dc); });
    await wait(450);
    const ev = E.play(R(), st, picks);
    const flip = ev.find(e => e.t === 'flip');
    // turn them over, fastest first
    const order = [];
    flip.board.forEach((b, side) => b.forEach((x, i) => order.push({ side, i, id: x.id, val: x.val, sp: st.cards[side + ':' + x.id].st.speed })));
    order.sort((a, b) => b.sp - a.sp);
    for (const o of order) {
      const slot = $(o.side ? 'dt-slots-them' : 'dt-slots-you').children[o.i]; const c = miniCard(o.id, { val: o.val }); c.classList.add('flipin'); c.onclick = () => showInfo(o.id); c.addEventListener('mouseenter', () => showInfo(o.id));
      if (o.side) c.onclick = () => { const h = hero(o.id), m = D().moves[o.id]; $('dt-info').innerHTML = `<b>${h.name}</b>${m ? `<div class="dimv"><b>${m.name}.</b> ${m.text}</div>` : ''}`; $('dt-info').classList.add('on'); };
      slot.innerHTML = ''; slot.appendChild(c); X.SND('flip', { vol: .5 }); await wait(240);
    }
    // the Moves, in the order they went off
    for (const e of ev.filter(e => e.t === 'captain')) {
      const c = cardIn(e.side, e.id); if (!c) continue;
      c.insertAdjacentHTML('beforeend', '<em class="stampmv cap">Captain</em>'); c.classList.add('fired', 'capfire'); X.SND('levelup', { vol: .7 }); await wait(620);
    }
    for (const e of ev.filter(e => e.t === 'move')) {
      const c = cardIn(e.side, e.id); if (!c) continue; const m = D().moves[e.id];
      c.insertAdjacentHTML('beforeend', `<em class="stampmv">${m ? m.name : W.fx[e.fx]}</em>`); c.classList.add('fired'); X.SND('stamp', { vol: .6 }); await wait(520);
    }
    // the numbers settle, then fly into the bars
    const sc = ev.find(e => e.t === 'score');
    if (!sc) { busy = false; $('dt-ready').disabled = false; return; }
    sc.board.forEach((b, side) => b.forEach(x => { const c = cardIn(side, x.id); if (!c) return; const v = c.querySelector('.dcval'); if (v) { v.textContent = x.val; v.classList.toggle('up', x.up); v.classList.toggle('down', x.down); } }));
    const sum = sc.board.map(b => b.reduce((t, x) => t + x.val, 0));
    sum.forEach((s, side) => { if (s > sc.add[side]) floatText(side, '-' + (s - sc.add[side]) + ' burn', 'down'); });
    await wait(500);
    if (sc.add[0] !== sc.add[1]) pose(sc.add[0] > sc.add[1] ? 'you' : 'them', 1800);
    await countUp(sc.pts.map((p, i) => p - sc.add[i]), sc.pts);
    const bestMine = sc.board[0].reduce((b, x) => !b || x.val > b.val ? x : b, null);
    if (bestMine && bestMine.val >= 30) say(fill(pick(W.big), { you: nm(bestMine.id), n: bestMine.val }));
    else if (sc.board[0].some(x => x.down)) say(fill(pick(W.sapped), { you: nm(sc.board[0].find(x => x.down).id) }));
    X.SND('coin', { vol: .4 });
    await wait(650);
    const rd = ev.find(e => e.t === 'round'), end = ev.find(e => e.t === 'end');
    if (rd) {
      X.SND('stamp'); buzz(rd.winner === 0 ? [20, 60, 30] : 40); pose(rd.winner === 0 ? 'cheer' : 'sulk', 2200);
      say(pick(rd.winner === 0 ? W.you_round : W.them_round));
      banner(rd.winner === 0 ? 'Round to you' : 'Round to the house', rd.winner === 0 ? 'you' : 'them');
      drawTop(); if (X.OS.Sound) X.OS.Sound.music(tuneFor()); await wait(1500);
    }
    if (end) return finish(end.winner === 0);
    // clear the table and deal
    document.querySelectorAll('#duel .dslot .dc').forEach(c => c.classList.add('away')); await wait(300);
    mine = []; drawAll(); if (rd) { drawTrail(true); say(fill(pick(W.round_start), { n: st.round, calls: st.calls.map(k => W.calls[k]).join(', ') })); } else say(fill(pick(W.your_turn), { call: W.calls[E.call(st)] }));
    busy = false; $('dt-ready').disabled = false;
  }
  const cardIn = (side, id) => $(side ? 'dt-slots-them' : 'dt-slots-you').querySelector(`.dc[data-id="${id}"]`);
  function floatText(side, t, cls) { const box = $(side ? 'dt-them-bar' : 'dt-you-bar'), f = X.el('em', 'fl ' + (cls || ''), t); box.appendChild(f); setTimeout(() => f.remove(), 1400); }
  async function countUp(from, to) {
    const t0 = performance.now(), dur = 700;
    await new Promise(res => { const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = from.map((f, i) => Math.round(f + (to[i] - f) * e));
      $('dt-you-pts').textContent = v[0]; $('dt-them-pts').textContent = v[1]; moveMarker(v[0] - v[1], v[0] + v[1]); if (k < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
    to.forEach((v, i) => { if (v > from[i]) floatText(i, '+' + (v - from[i])); });
    ['dt-you-bar', 'dt-them-bar'].forEach((b, i) => { if (to[i] > from[i]) { $(b).classList.remove('pop'); void $(b).offsetWidth; $(b).classList.add('pop'); } });
  }
  function banner(t, cls) { const b = $('dt-banner'); b.textContent = t; b.className = 'dbanner ' + cls; void b.offsetWidth; b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 1400); }

  function finish(won) {
    const d = rec(), today = new Date().toISOString().slice(0, 10), P = D().practice, L = D().levels[lvl];
    if (d.day !== today) { d.day = today; d.paid = 0; }
    d.rec[lvl] = d.rec[lvl] || [0, 0]; d.rec[lvl][won ? 0 : 1]++; if (d.coach > 0) d.coach--;
    d.beat = d.beat || {}; const beat = d.beat[rival.id] = d.beat[rival.id] || [];
    const firstWin = won && !beat.includes(lvl);
    const was = roadLevel(d.xp || 0);
    let pay = 0, lines = [];
    if (won) {
      if (firstWin) { const g = payFor(rival, L); beat.push(lvl); pay += g; lines.push(`First win against ${rival.name} on ${L.name}: <b>${OSnum(g)} gold</b>.`); }
      else if (d.paid < P.paid_per_day) { const g = repeatFor(rival, L); d.paid++; pay += g; lines.push(fill(W.paid, { n: OSnum(g), max: P.paid_per_day })); }
      else lines.push(fill(W.unpaid, { max: P.paid_per_day }));
      d.xp = (d.xp || 0) + xpFor(rival, L);
    }
    if (pay) X.award(pay);
    const now2 = roadLevel(d.xp || 0);
    if (now2 > was) { lines.push(`<b>Duelist ${now2}.</b> ${nextPrize(now2)}`); }
    X.bump(won ? 'duels_won' : 'duels_lost'); X.save(true);
    X.SND(won ? 'win' : 'deny'); buzz(won ? [30, 50, 30, 50, 60] : 90); pose('stamp');
    const left = D().levels.length * D().rivals.length - Object.values(d.beat).reduce((t, a) => t + a.length, 0);
    const box = $('dt-end'); box.hidden = false;
    box.innerHTML = `<div class="dendin ${won ? 'won' : 'lost'}"><img src="/assets/v2/smudge/${won ? 'boot' : 'sleep'}.webp${X.OS.VER}" alt="">
      <h2>${won ? pick(W.win) : `${rival.name} wins this one.`}</h2><p class="score">${st.sides[0].rounds} rounds to ${st.sides[1].rounds} \u00b7 ${rival.name}</p>
      <p class="mut">${won ? lines.join('<br>') : `Against ${rival.name} on ${L.name}: won ${d.rec[lvl][0]}, lost ${d.rec[lvl][1]}. ${left} first wins still out there.`}</p>
      <div class="row"><button class="btn" id="dt-again">Play again</button><button class="btn ghost" id="dt-leave">Back to Duels</button></div></div>`;
    $('dt-again').onclick = () => { box.hidden = true; open(true); };
    $('dt-leave').onclick = () => { box.hidden = true; close(); };
  }

  // ------------------------------------------------------------------ the first duel is a lesson
  // Five steps, in order. Steps 1, 2 and 5 are read-and-tap; steps 3 and 4 wait for the player to do the thing.
  // Skippable at any point, and replayable from the Duels screen. Wording is a stand-in until F7.
  const STEPS = [
    { sel: '#dt-you-en', text: 'This is your energy. Seven more arrive every turn, and whatever you do not spend carries over to the next one.' },
    { sel: '#dt-call', text: 'Every turn calls one number. Only that number on a card counts, so a fast card is worthless on a Health turn.' },
    { sel: '#dt-hand', text: 'Tap a card to play it. The yellow corner is what it scores this turn; the blue circle is what it costs.', until: 'placed', top: true },
    { sel: '#dt-ready', text: 'Now press Ready. Both sides turn over at the same moment.', until: 'ready', top: true },
    { sel: '#dt-smudge', text: 'Smudge keeps the score and drifts toward whoever is behind. Three turns make a round, and three rounds win the duel.', last: true },
  ];
  let step = -1;
  function lessonOn() { return rec().lesson !== 0; }
  function lessonStart() { if (!lessonOn()) return; step = -1; lessonNext(); }
  function lessonNext() {
    step++;
    if (step >= STEPS.length) return lessonEnd();
    const sp = STEPS[step], box = $('dt-lesson'), t = document.querySelector(sp.sel);
    document.querySelectorAll('.dpoint').forEach(n => n.classList.remove('dpoint'));
    if (t) t.classList.add('dpoint');
    box.hidden = false; box.classList.toggle('attop', !!sp.top);
    box.innerHTML = `<div class="dlbox"><img src="/assets/v2/smudge/boot.webp${X.OS.VER}" alt="">
      <div><p>${sp.text}</p><div class="row">${sp.until ? '' : `<button class="btn small" id="dl-next">${sp.last ? 'Let me play' : 'Next'}</button>`}<button class="btn small ghost" id="dl-skip">Skip</button></div></div></div>`;
    if (!sp.until) $('dl-next').onclick = () => lessonNext();
    $('dl-skip').onclick = () => lessonEnd();
    if (sp.until) box.classList.add('waiting'); else box.classList.remove('waiting');
  }
  // the player did something: if the current step was waiting for it, move on
  function lessonDid(what) {
    if (step < 0 || step >= STEPS.length) return;
    if (STEPS[step].until === what) lessonNext();
  }
  function lessonEnd() { rec().lesson = 0; step = -1; $('dt-lesson').hidden = true; document.querySelectorAll('.dpoint').forEach(n => n.classList.remove('dpoint')); X.save(); }

  function wire() {
    $('dt-ready').onclick = ready;
    $('dt-down').onclick = () => { if (busy || !st || st.sides[0].down) return;
      E.standDown(R(), st, 0); mine = []; X.SND('back'); say('You stood down. The round is theirs, the energy is yours.');
      drawAll(); ready(); };
    $('dt-captain').onclick = () => { if (busy || !st) return;
      const got = E.captainCall(R(), st, 0); if (!got) return;
      X.SND('levelup'); banner(`${nm(got)} is called`, 'you'); say(`${nm(got)} steps up. Play them this turn and they will be worth far more.`);
      drawAll(); };
    $('dt-quit').onclick = () => { if (busy) return; if (st && !st.over && (st.round > 1 || st.turn > 0) && !confirm('Leave this duel? Practice keeps no score of it.')) return; close(); };
    $('dt-info').onclick = e => { if (e.target.closest('.dix') || e.target === $('dt-info')) $('dt-info').classList.remove('on'); };
    $('duel').addEventListener('pointerdown', e => { if (!e.target.closest('.dinfo,.dc')) $('dt-info').classList.remove('on'); }, true);
    addEventListener('resize', () => { if (tableOpen && path) { drawTrail(false); setBackdrop(st.arena); } });
  }

  window.DuelUI = {
    init(ctx) { X = ctx; wire(); },
    lobby,
    isOpen: () => tableOpen,
    close: () => { $('dt-end').hidden = true; close(true); },
  };
})();
