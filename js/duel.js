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
  const nm = id => (X.R.duel.short || {})[id] || first(hero(id).name);
  const STATK = ['attack', 'defense', 'health', 'speed', 'luck'];
  const SHORT = { attack: 'Atk', defense: 'Def', health: 'Hp', speed: 'Spd', luck: 'Lck' };
  // each arena fights to the battle theme nearest its era (missing files fall back to the raid theme)
  const TUNE = { dock: 'b_ancient', speakeasy: 'b_noir', vault: 'b_noir', fjord: 'b_north', blackforest: 'b_gothic', outback: 'b_romp', bondi: 'b_romp' };

  async function load() {
    if (!E) E = await import('/js/duel-engine.mjs' + X.OS.VER);
    if (!W) W = await (await fetch('/data/duel_words.json' + X.OS.VER)).json();
  }
  const R = () => X.R, D = () => X.R.duel, S = () => X.S();
  const hero = id => X.OS.heroes[id];
  const rec = () => { const s = S(); s.duel = s.duel || { deck: [], rec: [[0, 0], [0, 0], [0, 0]], day: '', paid: 0 }; if (!s.duel.rec) s.duel.rec = [[0, 0], [0, 0], [0, 0]]; return s.duel; };
  const owned = () => Object.keys(S().roster).filter(id => hero(id));
  const minDeck = () => D().practice.min_deck || D().deck;

  // ------------------------------------------------------------------ the Duels screen
  async function lobby() {
    const box = $('du-body'); if (!box) return; await load();
    const d = rec(), have = owned(), need = minDeck(), max = D().deck;
    d.deck = (d.deck || []).filter(id => have.includes(id)).slice(0, max);
    box.innerHTML = '';
    if (have.length < need) {
      box.innerHTML = `<div class="panel"><p>Smudge needs ${need} arrivals to make a deck. You have ${have.length}. Summon a few more and come back.</p></div>`; return;
    }
    // opponent
    const opp = X.el('div', 'panel duopp'); opp.innerHTML = '<h3>Who to play</h3>';
    const row = X.el('div', 'dulv');
    W.level.forEach((n, i) => { const r = d.rec[i] || [0, 0], b = X.el('button', 'dulvb' + (lvl === i ? ' on' : ''), `<b>${n}</b><span>${W.level_text[i]}</span><em>Won ${r[0]} · lost ${r[1]}</em>`);
      b.onclick = () => { lvl = i; X.SND('tab'); lobby(); }; row.appendChild(b); });
    opp.appendChild(row); box.appendChild(opp);
    // deck
    const dp = X.el('div', 'panel dudeck');
    const cost = d.deck.reduce((t, id) => t + D().cost[hero(id).rarity], 0);
    dp.innerHTML = `<div class="spread"><h3>Your deck <span class="mut">${d.deck.length} / ${max}</span></h3><span class="row"><button class="btn small ghost" id="du-auto">Pick for me</button><button class="btn small ghost" id="du-clear">Clear</button></span></div>
      <p class="mut" style="font-size:.88rem;margin:.2rem 0 .6rem">At least ${need}, up to ${max}. Mix cheap and dear: five energy left with nothing to spend it on is five wasted.${d.deck.length ? ' Average cost ' + (cost / d.deck.length).toFixed(1) + '.' : ''}</p>`;
    const grid = X.el('div', 'dugrid');
    have.slice().sort((a, b) => (d.deck.includes(b) - d.deck.includes(a)) || (D().cost[hero(a).rarity] - D().cost[hero(b).rarity]) || hero(a).name.localeCompare(hero(b).name)).forEach(id => {
      const c = miniCard(id, null); c.classList.toggle('in', d.deck.includes(id));
      c.onclick = () => { const i = d.deck.indexOf(id); if (i >= 0) d.deck.splice(i, 1); else if (d.deck.length < max) d.deck.push(id); else return X.toast(`A deck holds ${max}. Take one out first.`); X.SND('click'); X.save(); lobby(); };
      grid.appendChild(c);
    });
    dp.appendChild(grid); box.appendChild(dp);
    $('du-auto').onclick = () => { d.deck = autoDeck(have, max); X.SND('confirm'); X.save(); lobby(); };
    $('du-clear').onclick = () => { d.deck = []; X.save(); lobby(); };
    // go
    const go = X.el('div', 'panel dugo');
    const today = new Date().toISOString().slice(0, 10); const paidLeft = d.day === today ? Math.max(0, D().practice.paid_per_day - d.paid) : D().practice.paid_per_day;
    go.innerHTML = `<button class="btn big" id="du-play" ${d.deck.length < need ? 'disabled' : ''}>Play ${W.level[lvl].toLowerCase()}</button>
      <p class="mut" style="font-size:.85rem;margin-top:.5rem">${d.deck.length < need ? `Pick ${need - d.deck.length} more.` : paidLeft ? `${paidLeft} more paid win${paidLeft > 1 ? 's' : ''} today, ${D().practice.gold} gold each.` : 'No more paid wins today. Play on for the fun of it.'} Practice uses Silver rules for everyone: card level counts up to 5, training up to 25.</p>`;
    box.appendChild(go);
    $('du-play').onclick = () => open();
    const how = X.el('div', 'panel duhow');
    how.innerHTML = `<h3>How a duel goes</h3><ul>
      <li>Both sides pick up to three cards a turn and reveal together.</li>
      <li>Each turn calls one stat. A card scores that stat, so a slow tank is useless on a Speed call and a monster on a Health one.</li>
      <li>Energy: ${D().energy.start} to start, ${D().energy.per_turn} more each turn, up to ${D().energy.max}. What you do not spend carries over.</li>
      <li>Three turns make a round. Most points takes it. First to ${D().rounds_to_win} rounds wins.</li>
      <li>Played cards go to the bottom of your deck in the order you played them, so a good pair comes round again.</li>
      <li>Every arrival has a Move. Tap a card to read it.</li></ul>`;
    box.appendChild(how);
  }

  // a sensible deck from what you own: the best points per energy, with the cost curve kept mixed
  function autoDeck(have, max) {
    const val = id => { const c = E.makeCard(R(), id, X.own(id), D().practice.bracket); return STATK.reduce((t, k) => t + c.st[k], 0) / 5 / c.cost; };
    const by = {}; have.forEach(id => { const c = D().cost[hero(id).rarity]; (by[c] = by[c] || []).push(id); });
    Object.values(by).forEach(a => a.sort((x, y) => val(y) - val(x)));
    const out = [], keys = Object.keys(by).sort((a, b) => a - b);
    while (out.length < Math.min(max, have.length)) { let added = false; for (const k of keys) { if (by[k].length && out.length < max) { out.push(by[k].shift()); added = true; } } if (!added) break; }
    return out;
  }
  // the house: a random mixed deck from all fifty, levelled to the difficulty
  function houseDeck(n) {
    const ids = X.R.heroes.map(h => h.id).sort(() => Math.random() - .5).slice(0, n);
    return ids.map(id => { const tr = {}, top = [0, 12, 22][lvl]; STATK.forEach(k => { tr[k] = Math.floor(Math.random() * (top + 1)); });
      return E.makeCard(R(), id, { level: [1 + Math.floor(Math.random() * 3), 3 + Math.floor(Math.random() * 3), 5][lvl], trained: tr, kit: 0 }, D().practice.bracket); });
  }

  // ------------------------------------------------------------------ cards
  function miniCard(id, opt) {
    const h = hero(id), o = opt || {}, c = X.el('div', 'dc r-' + h.rarity);
    c.style.setProperty('--rc', X.R.rarity_color[h.rarity]);
    c.dataset.id = id;
    c.innerHTML = `<i class="dcbg" style="background-image:url(/assets/v2/bg/${h.bg}.webp)"></i><img class="dcart" src="${X.OS.img('heroes', id)}" alt="" draggable="false">
      <b class="dccost">${D().cost[h.rarity]}</b>${o.val != null ? `<b class="dcval">${o.val}</b>` : ''}<span class="dcname">${nm(id)}</span>${D().moves[id] ? '<i class="dcmv">✦</i>' : ''}`;
    return c;
  }
  const downCard = () => { const c = X.el('div', 'dc down'); c.innerHTML = '<i class="dcback"></i>'; return c; };

  // ------------------------------------------------------------------ the table
  async function open(again) {
    await load(); const d = rec(); if (d.deck.length < minDeck()) return;
    const mineCards = d.deck.map(id => E.makeCard(R(), id, X.own(id), D().practice.bracket));
    st = E.newDuel(R(), [mineCards, houseDeck(mineCards.length)], { seed: (Math.random() * 4294967295) >>> 0 });
    mine = []; busy = false; tableOpen = true;
    const t = $('duel'); t.hidden = false; document.body.classList.add('induel');
    const pool = Object.keys(st.cards).map(k => hero(k.split(':')[1]).bg);
    t.querySelector('.dtbg').style.backgroundImage = `url(/assets/v2/bg/${pick(pool)}.webp)`;
    $('dt-them').textContent = W.house[0] + ' · ' + W.level[lvl];
    if (!again) history.pushState({ v: 'duels', duel: 1 }, '', '#duels');
    if (X.OS.Sound) X.OS.Sound.music(TUNE[st.arena] || 'battle');
    drawTrail(true); drawAll(); say(pick(W.start));
    setTimeout(() => say(fill(pick(W.round_start), { n: st.round, calls: st.calls.map(k => W.calls[k]).join(', ') })), 2600);
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
    $('dt-calls').innerHTML = st.calls.map((k, i) => `<span class="${i === st.turn ? 'now' : i < st.turn ? 'done' : ''}">${W.calls[k]}</span>`).join('');
    $('dt-call').textContent = W.calls[E.call(st)] || '';
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
  }
  function drawSlots() {
    ['dt-slots-you', 'dt-slots-them'].forEach((sid, side) => {
      const box = $(sid); box.innerHTML = '';
      for (let i = 0; i < D().per_turn; i++) { const s = X.el('div', 'dslot'); box.appendChild(s);
        if (side === 0 && mine[i]) { const c = miniCard(mine[i], { val: E.cardValue(R(), st, 0, mine[i]) }); c.onclick = () => unplace(mine[i]); c.onmouseenter = () => showInfo(mine[i]); s.appendChild(c); } }
    });
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
    mine.push(id); X.SND('flip'); drawSlots(); drawHand(); drawEnergy();
  }
  function unplace(id) { if (busy) return; mine = mine.filter(x => x !== id); X.SND('back'); drawSlots(); drawHand(); drawEnergy(); }

  function showInfo(id) {
    const h = hero(id), c = st.cards['0:' + id] || E.makeCard(R(), id, X.own(id), D().practice.bracket), m = D().moves[id], k = E.call(st);
    $('dt-info').innerHTML = `<b>${h.name}</b> <span class="mut">${X.OS.cap(h.rarity)} · costs ${c.cost}</span>
      <div class="dist">${STATK.map(s => `<span class="${s === k ? 'now' : ''}">${SHORT[s]} <b>${c.st[s]}</b></span>`).join('')}</div>
      ${m ? `<div class="dimv"><b>${m.name}.</b> ${m.text}</div>` : ''}`;
    $('dt-info').classList.add('on'); clearTimeout(info); info = setTimeout(() => $('dt-info').classList.remove('on'), 6000);
  }
  function say(t) { const n = $('dt-say'); n.classList.remove('in'); void n.offsetWidth; n.textContent = t; n.classList.add('in'); }

  // ------------------------------------------------------------------ the ink trail and Smudge on it
  // The trail is drawn in the box's own pixels (not stretched), so the ink stays round and the split between
  // the two colours can be set in real lengths.
  let path = null, plen = 0, markerF = 0.5, tw = 100, th = 100;
  function drawTrail(fresh) {
    const svg = $('dt-trail'), r = svg.getBoundingClientRect(); tw = Math.max(80, r.width); th = Math.max(80, r.height);
    const rad = Math.min(th / 10, tw * 0.09), x0 = rad + 6, x1 = tw - rad - 6, mid = tw / 2;
    const rows = 4, top = th * 0.08, step = (th * 0.84) / rows;
    let d = `M${mid} 0 V${top} H${x1}`;
    for (let i = 0; i < rows; i++) { const y = top + step * (i + 1), right = i % 2 === 0;
      d += ` C${(right ? x1 : x0) + (right ? 1 : -1) * step * 0.7} ${y - step} ${(right ? x1 : x0) + (right ? 1 : -1) * step * 0.7} ${y} ${right ? x1 : x0} ${y}`;
      d += i < rows - 1 ? ` H${right ? x0 : x1}` : ` H${mid}`; }
    d += ` V${th}`;
    svg.setAttribute('viewBox', `0 0 ${tw} ${th}`); svg.setAttribute('preserveAspectRatio', 'none');
    svg.innerHTML = `<path class="ink edge" d="${d}"/><path class="ink them" d="${d}"/><path class="ink you" d="${d}"/>`;
    path = svg.querySelector('.ink.you'); plen = path.getTotalLength();
    if (fresh) { svg.classList.remove('draw'); void svg.getBoundingClientRect(); svg.classList.add('draw'); }
    setMarker(fresh ? 0.5 : markerF, st ? st.sides[0].pts - st.sides[1].pts : 0);
  }
  function moveMarker(gap, total) { const scale = Math.max(30, total * 0.6); const f = 0.5 - Math.max(-0.46, Math.min(0.46, gap / scale * 0.5)); setMarker(f, gap); }
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
    if (busy || !st || st.over) return; busy = true; $('dt-ready').disabled = true; $('dt-info').classList.remove('on');
    const theirs = E.choose(R(), st, 1, lvl), picks = [mine.slice(), theirs];
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
    for (const e of ev.filter(e => e.t === 'move')) {
      const c = cardIn(e.side, e.id); if (!c) continue; const m = D().moves[e.id];
      c.insertAdjacentHTML('beforeend', `<em class="stampmv">${m ? m.name : W.fx[e.fx]}</em>`); c.classList.add('fired'); X.SND('stamp', { vol: .6 }); await wait(520);
    }
    // the numbers settle, then fly into the bars
    const sc = ev.find(e => e.t === 'score');
    sc.board.forEach((b, side) => b.forEach(x => { const c = cardIn(side, x.id); if (!c) return; const v = c.querySelector('.dcval'); if (v) { v.textContent = x.val; v.classList.toggle('up', x.up); v.classList.toggle('down', x.down); } }));
    const sum = sc.board.map(b => b.reduce((t, x) => t + x.val, 0));
    sum.forEach((s, side) => { if (s > sc.add[side]) floatText(side, '-' + (s - sc.add[side]) + ' burn', 'down'); });
    await wait(500);
    await countUp(sc.pts.map((p, i) => p - sc.add[i]), sc.pts);
    const bestMine = sc.board[0].reduce((b, x) => !b || x.val > b.val ? x : b, null);
    if (bestMine && bestMine.val >= 30) say(fill(pick(W.big), { you: nm(bestMine.id), n: bestMine.val }));
    else if (sc.board[0].some(x => x.down)) say(fill(pick(W.sapped), { you: nm(sc.board[0].find(x => x.down).id) }));
    X.SND('coin', { vol: .4 });
    await wait(650);
    const rd = ev.find(e => e.t === 'round'), end = ev.find(e => e.t === 'end');
    if (rd) {
      X.SND('stamp'); $('dt-smudge').classList.add('stampit'); setTimeout(() => $('dt-smudge').classList.remove('stampit'), 700);
      say(pick(rd.winner === 0 ? W.you_round : W.them_round));
      banner(rd.winner === 0 ? 'Round to you' : 'Round to the house', rd.winner === 0 ? 'you' : 'them');
      drawTop(); await wait(1500);
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
    const d = rec(), today = new Date().toISOString().slice(0, 10), P = D().practice;
    if (d.day !== today) { d.day = today; d.paid = 0; }
    d.rec[lvl] = d.rec[lvl] || [0, 0]; d.rec[lvl][won ? 0 : 1]++;
    let pay = 0; if (won && d.paid < P.paid_per_day) { d.paid++; pay = P.gold; X.award(pay); }
    X.bump(won ? 'duels_won' : 'duels_lost'); X.save(true);
    X.SND(won ? 'win' : 'deny');
    const box = $('dt-end'); box.hidden = false;
    box.innerHTML = `<div class="dendin ${won ? 'won' : 'lost'}"><img src="/assets/v2/smudge/${won ? 'boot' : 'sleep'}.webp${X.OS.VER}" alt="">
      <h2>${pick(won ? W.win : W.lose)}</h2><p class="score">${st.sides[0].rounds} rounds to ${st.sides[1].rounds}</p>
      <p class="mut">${won ? (pay ? fill(W.paid, { n: pay, max: P.paid_per_day }) : fill(W.unpaid, { max: P.paid_per_day })) : `Against ${W.level[lvl].toLowerCase()}: won ${d.rec[lvl][0]}, lost ${d.rec[lvl][1]}.`}</p>
      <div class="row"><button class="btn" id="dt-again">Play again</button><button class="btn ghost" id="dt-leave">Back to Duels</button></div></div>`;
    $('dt-again').onclick = () => { box.hidden = true; open(true); };
    $('dt-leave').onclick = () => { box.hidden = true; close(); };
  }

  function wire() {
    $('dt-ready').onclick = ready;
    $('dt-quit').onclick = () => { if (busy) return; if (st && !st.over && (st.round > 1 || st.turn > 0) && !confirm('Leave this duel? Practice keeps no score of it.')) return; close(); };
    $('dt-info').onclick = () => $('dt-info').classList.remove('on');
    addEventListener('resize', () => { if (tableOpen && path) drawTrail(false); });
  }

  window.DuelUI = {
    init(ctx) { X = ctx; wire(); },
    lobby,
    isOpen: () => tableOpen,
    close: () => { $('dt-end').hidden = true; close(true); },
  };
})();
