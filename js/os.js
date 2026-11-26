// OverSummoned shared pieces: data loading, Smudge the puppet, cards, item slots, tooltips.
window.OS = (function () {
  const A = '/assets/v2/';
  const OS = { R: null, rig: null, voice: null, items: {}, heroes: {} };

  OS.VER = '?v=1126j';   // bump when art or data changes, so browsers drop their cached copies
  OS.load = async function () {
    const [R, rig, voice] = await Promise.all(['rules', 'rig', 'voice'].map(n => fetch('/data/' + n + '.json' + OS.VER).then(r => r.json())));
    OS.R = R; OS.rig = rig; OS.voice = voice; OS.items = R.items;
    R.heroes.forEach(h => OS.heroes[h.id] = h);
    return OS;
  };
  OS.img = (kind, id) => A + kind + '/' + id + '.webp' + OS.VER;
  OS.el = function (tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  OS.cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  OS.num = n => Math.floor(n).toLocaleString('en-US');

  // ------------------------------------------------------------------ Smudge
  // Same rig as the desktop app: real parts turning on their own joints, eyelids, a mouth.
  OS.Puppet = class {
    constructor(host, pose, scale) {
      // With the DragonBones player on the page, Smudge and the heroes are drawn by it (bones, bending
      // tails, named moves); this class then only keeps the old calls working. Without it: the simple rig below.
      if (window.DBCanvas && OS.rig[pose] && !OS.noBones) {
        const hero = pose.indexOf('h_') === 0;
        this.host = host; this.scale = scale; this.pose = pose; this.hero = hero; this.parts = {}; this.x = 0; this.y = 0;
        this.db = new DBCanvas.Puppet(host, hero ? pose.slice(2) : pose, scale, { hero, px: [0, 0], ver: OS.VER });
        return;
      }
      this.host = host; this.scale = scale; this.springs = {}; this.t = 0;
      this.blink = 0; this.blinkWait = 2; this.talk = 0; this.happy = 0; this.sleepy = 0; this.mouth = 0; this.look = 0; this.lookCur = 0; this.lookWait = 3; this.busy = 0;
      this.root = OS.el('div', 'puppet'); host.appendChild(this.root);
      this.setPose(pose);
      let last = performance.now();
      const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; this.step(dt); this.raf = requestAnimationFrame(loop); };
      this.raf = requestAnimationFrame(loop);
    }
    setPose(pose) {
      if (pose === this.pose) return;
      if (this.db) { this.db.destroy(); this.pose = pose; this.db = new DBCanvas.Puppet(this.host, pose, this.scale, { px: [this.x, this.y], ver: OS.VER }); return; }
      this.pose = pose; this.hero = pose.indexOf('h_') === 0; this.springs = {}; this.parts = {}; this.root.innerHTML = '';
      const e = OS.rig[pose], foot = e.foot;
      const add = p => {
        const d = OS.el('div', 'part'); d.style.left = (p.pivot[0] - foot[0]) + 'px'; d.style.top = (p.pivot[1] - foot[1]) + 'px';
        const im = new Image(); im.src = OS.img('puppet', pose + '_' + p.name); im.style.left = (p.offset[0] - p.pivot[0]) + 'px'; im.style.top = (p.offset[1] - p.pivot[1]) + 'px';
        d.appendChild(im); this.root.appendChild(d); this.parts[p.name] = { el: d, pivot: p.pivot };
      };
      e.parts.filter(p => p.mode === 'behind').forEach(add);
      const b = new Image(); b.className = 'base'; b.src = OS.img('puppet', pose + '_base'); b.style.left = -foot[0] + 'px'; b.style.top = -foot[1] + 'px'; this.root.appendChild(b);
      e.parts.filter(p => p.mode !== 'behind').forEach(add);
      this.lids = []; this.mouthEl = null;
      if (e.face && this.parts.head) {
        const head = this.parts.head, fur = 'rgb(' + e.face.fur.join(',') + ')';
        e.face.eyes.forEach(([cx, cy, rx, ry]) => {
          const l = OS.el('div', 'lid'); const w = rx * 2.5, h = ry * 2.6;
          Object.assign(l.style, { left: (cx - head.pivot[0] - w / 2) + 'px', top: (cy - head.pivot[1] - h / 2) + 'px', width: w + 'px', height: h + 'px', background: fur });
          head.el.appendChild(l); this.lids.push(l);
        });
        const [mx, my, mw, mh] = e.face.mouth; if (!mw) { this.place(); return; }
        const m = OS.el('div', 'mouth'); Object.assign(m.style, { left: (mx - head.pivot[0] - mw) + 'px', top: (my - head.pivot[1] - mh) + 'px', width: mw * 2 + 'px', height: mh * 2 + 'px' });
        head.el.appendChild(m); this.mouthEl = m;
      }
      this.place();
    }
    place(x, y) { if (x != null) { this.x = x; this.y = y; } if (this.db) { this.db.scale = this.scale; this.db.flip = !!this.flip; this.db.px = [this.x || 0, this.y || 0]; return; } this.root.style.transform = `translate(${this.x || 0}px,${this.y || 0}px) scale(${this.scale})`; }
    kick(part, v) { if (this.db) { if (Math.abs(v) >= 10) this.db.act(); return; } const s = this.springs[part] || (this.springs[part] = [0, 0]); s[1] += v; }
    say(sec) { if (this.db) return void this.db.say(sec); this.talk = sec; }
    cheer(sec) { if (this.db) return void this.db.cheer(sec); this.happy = sec; this.kick('tail', 8); }
    // a point on the pose picture, in the host's pixels
    point(ix, iy) { const f = OS.rig[this.pose].foot; return [this.x + (ix - f[0]) * this.scale, this.y + (iy - f[1]) * this.scale]; }
    named(key) { const p = OS.rig[this.pose][key] || OS.rig[this.pose].bag; return this.point(p[0], p[1]); }
    step(dt) {
      this.t += dt; const t = this.t;
      const steps = Math.max(1, Math.ceil(dt * 240)), h = dt / steps;
      for (const k in this.springs) { const s = this.springs[k]; for (let i = 0; i < steps; i++) { s[1] += (-300 * s[0] - 18 * s[1]) * h; s[0] += s[1] * h; } }
      this.lookWait -= dt; if (this.lookWait <= 0) { this.lookWait = 2.5 + Math.random() * 3.5; this.look = Math.random() < 0.7 ? (Math.random() - 0.5) * 0.14 : 0; }
      this.blink = Math.max(0, this.blink - dt * 7); this.blinkWait -= dt;
      if (this.blinkWait <= 0) { this.blinkWait = 2.2 + Math.random() * 3.3; this.blink = 1; if (Math.random() < 0.2) this.blinkWait = 0.25; }
      this.talk = Math.max(0, this.talk - dt); this.happy = Math.max(0, this.happy - dt);
      const target = this.talk > 0 ? 0.35 + 0.65 * Math.abs(Math.sin(t * 17) * Math.sin(t * 6.3 + 1)) : 0;
      this.mouth += (target - this.mouth) * (1 - Math.exp(-30 * dt));
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      for (const name in this.parts) {
        const p = this.parts[name]; let a = (this.springs[name] || [0])[0], tr = '';
        if (name === 'head') { const lim = this.hero ? 0.085 : 0.22; this.lookCur += (this.look * (this.hero ? 0.6 : 1) * (1 - this.busy) - this.lookCur) * (1 - Math.exp(-4 * dt)); a = clamp(a + this.lookCur, -lim, lim); }
        else if (name === 'tail') a = clamp(a + Math.sin(t * 1.3) * 0.06 + Math.sin(t * 2.9) * 0.025 + (this.happy > 0 ? Math.sin(t * 14) * 0.12 : 0), -0.5, 0.5);
        else if (name === 'feet') a += Math.sin(t * 1.5) * 0.09;
        else if (name === 'rod') a = clamp(a + Math.sin(t * 0.9) * 0.012, -0.3, 0.2);
        else if (name === 'arm') a = clamp(a, -0.2, 1.7);
        else if (name === 'shovel') a = clamp(a, -0.25, 0.45);
        else a = clamp(a, -0.3, 0.3);
        p.el.style.transform = tr + `rotate(${a}rad)`;
      }
      const lid = this.happy > 0 ? 1 : Math.max(this.blink, this.sleepy * 0.55);
      this.lids.forEach(l => l.style.transform = `scaleY(${lid.toFixed(3)})`);
      if (this.mouthEl) this.mouthEl.style.transform = `scaleY(${this.mouth.toFixed(3)})`;
    }
    destroy() { if (this.db) return void this.db.destroy(); cancelAnimationFrame(this.raf); this.root.remove(); }
  };

  // ------------------------------------------------------------------ items
  // a hero as a living puppet inside `host`, standing on the bottom middle, `h` pixels tall
  OS.heroPuppet = function (host, id, h) { const e = OS.rig['h_' + id]; if (!e) return null; const p = new OS.Puppet(host, 'h_' + id, h / e.size[1]); p.place(host.clientWidth / 2, host.clientHeight * 0.94); return p; };
  OS.statWord = { attack: 'Attack', defense: 'Defense', health: 'Health', speed: 'Speed', luck: 'Luck' };
  OS.tipHTML = function (id, opt) {
    opt = opt || {}; const it = OS.items[id], R = OS.R; if (!it) return '';
    let s = `<div class="tn" style="color:${R.rarity_color[it.rarity]}">${it.name}</div>`;
    if (it.kind === 'gear') {
      s += `<div class="sub"><span>${OS.cap(it.slot)}</span><span>${OS.cap(it.rarity)}</span></div>`;
      for (const k in it.stats) s += `<div>+${it.stats[k]} ${OS.statWord[k]}</div>`;
      if (it.equip) s += `<div class="eq">Equip: Increases ${it.equip.skill} speed by ${it.equip.speed}%.</div>`;
      const FX = { speed: 'work speed', luck: 'luck at jobs', ink: 'ink earned', xp: 'skill xp', raid: 'damage in raids' };
      if (it.special) s += `<div class="eq">Special: +${Math.round(it.special.amount * 100)}% ${FX[it.special.kind]}.</div>`;
      if (it.set) { const st = R.gear_sets[it.set], k = Object.keys(st.two)[0]; s += `<div class="eq">${st.name} set · 2 worn: +${st.two[k]} ${OS.statWord[k]} · all 3: +${Math.round(st.three.amount * 100)}% ${FX[st.three.kind]}.</div>`; }
      if (it.owner) s += `<div class="sig">Only ${OS.heroes[it.owner].name} can wear this.</div>`;
    } else s += `<div class="sub"><span>${it.junk ? 'Junk' : 'Treasure'}</span><span>${it.junk ? 'sells only' : OS.cap(it.rarity)}</span></div>`;
    s += `<div class="fl">"${it.flavor}"</div>`;
    const pl = R.places.find(p => p.id === it.place);
    if (pl) s += `<div class="src">Found at ${pl.name}, by ${pl.skill.toLowerCase()}${opt.chance ? ' · ' + opt.chance : ''}</div>`;
    s += `<div class="src">Sells for ${it.sell} gold${opt.have ? ' · you have ' + opt.have : ''}</div>`;
    return s;
  };
  let tipEl;
  OS.bindTip = function (node, html) {
    if (!tipEl) { tipEl = OS.el('div', 'tip'); document.body.appendChild(tipEl); }
    const show = ev => {
      tipEl.innerHTML = typeof html === 'function' ? html() : html; tipEl.style.display = 'block';
      const r = node.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      let x = r.right + 10; if (x + w > innerWidth - 8) x = r.left - w - 10; if (x < 8) x = Math.max(8, Math.min(innerWidth - w - 8, r.left));
      let y = r.top; if (y + h > innerHeight - 8) y = innerHeight - h - 8; if (x === Math.max(8, Math.min(innerWidth - w - 8, r.left)) && r.left - w - 10 < 8 && r.right + 10 + w > innerWidth - 8) y = r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8;
      tipEl.style.left = x + 'px'; tipEl.style.top = Math.max(8, y) + 'px';
    };
    node.addEventListener('mouseenter', show); node.addEventListener('focus', show);
    node.addEventListener('mouseleave', () => tipEl.style.display = 'none'); node.addEventListener('blur', () => tipEl.style.display = 'none');
    node.addEventListener('touchstart', show, { passive: true });
  };
  document.addEventListener('touchstart', e => { if (tipEl && !e.target.closest('.slot')) tipEl.style.display = 'none'; }, { passive: true });
  OS.slot = function (id, opt) {
    opt = opt || {};
    if (!id) return OS.el('div', 'slot empty');
    const it = OS.items[id], s = OS.el('div', 'slot has r-' + it.rarity + (opt.dim ? ' dim' : ''));
    s.tabIndex = 0;
    s.innerHTML = `<img src="${OS.img('loot', it.icon)}" alt="${opt.dim ? 'Undiscovered item' : it.name}">` + (opt.count > 1 ? `<span class="ct">${opt.count}</span>` : '');
    OS.bindTip(s, () => opt.dim ? `<div class="tn" style="color:${OS.R.rarity_color[it.rarity]}">???</div><div class="sub"><span>${OS.cap(it.rarity)}</span></div><div class="src">Not found yet${opt.chance ? ' · ' + opt.chance : ''}</div>` : OS.tipHTML(id, opt));
    return s;
  };

  // ------------------------------------------------------------------ cards
  // opt: owned (false = silhouette), level, stats (override), gear [ids or null x3], mini, noflip
  // the front of a card shows only whole sentences that fit its text box; the full bio is on the back
  OS.blurb = function (bio, room) {
    const parts = bio.match(/[^.!?]+[.!?]+['”\u2019]?\s*/g) || [bio]; let out = parts[0].trim();
    for (let i = 1; i < parts.length && (out + ' ' + parts[i].trim()).length <= (room || 112); i++) out += ' ' + parts[i].trim();
    return out;
  };
  OS.FX = { speed: 'work speed', luck: 'luck at jobs', ink: 'ink', xp: 'skill xp', raid: 'raid damage' };
  const SW = { attack: 'Atk', defense: 'Def', health: 'Hp', speed: 'Spd', luck: 'Lck' };
  // a short word for one of a hero's own pieces: "Lanyard of Mild Authority" -> "Lanyard"
  OS.shortName = n => { n = n.replace(/['‘’"“”][^'‘’"“”]*['‘’"“”]/g, '').replace(/\(.*?\)/g, '').trim(); if (n.indexOf(' of ') > 0) n = n.split(' of ')[0]; const w = n.split(/\s+/); return w[w.length - 1]; };
  /* A hero card.
     Front: name, picture, type line, the five numbers, power, and a dot per gear slot in its rarity colour.
     Back: the hero standing in the middle with gear down both sides (left: weapon, head, body, feet that
     anyone can wear; right: charm, then the hero's own three pieces), the bonuses, a slim stat line.
     opt: owned, mini, level, stats (totals), base (stats before gear), load { g: {slot: id}, own: [id x3],
     has(id), avail: {key: true}, lines: [html], copies: [have, need], charmOpen, power }, live (animate the
     back), onSlot(key), noflip. */
  OS.card = function (h, opt) {
    opt = opt || {}; const owned = opt.owned !== false, R = OS.R, L = opt.load || {}, g = L.g || {}, own = L.own || [null, null, null];
    const c = OS.el('div', 'card r-' + h.rarity + (owned ? '' : ' locked') + (opt.mini ? ' mini' : '') + (OS.founder && owned ? ' founder' : ''));
    const stats = opt.stats || h.stats, base = opt.base || stats, power = L.power != null ? L.power : stats.attack + stats.defense + stats.health;
    const col = id => id && OS.items[id] ? R.rarity_color[OS.items[id].rarity] : '';
    const GS = R.slots.general, keys = GS.concat(['own0', 'own1', 'own2']), at = k => k.indexOf('own') === 0 ? own[+k[3]] : g[k];
    const dots = keys.map((k, i) => (i === 5 ? '<u></u>' : '') + `<i class="${k === 'charm' ? 'o' : ''}" style="${at(k) ? 'background:' + col(at(k)) : ''}"></i>`).join('');
    const lv = opt.level > 1 ? `<span class="lv">Lv ${opt.level}</span>` : '';
    let front = `<div class="face front tcg">${OS.founder && owned ? '<span class="seal" title="Founding Clerk: this ledger was opened during the closed beta">FC</span>' : ''}
      <div class="nbar"><span class="nm">${owned ? h.name : '???'}</span>${lv}</div>
      <div class="win"><div class="bgi" style="background-image:url(/assets/v2/bg/${h.bg}.webp)"></div>
        <div class="art"><img src="${OS.img('heroes', h.id)}" alt="${owned ? h.name + ', ' + h.species + ' ' + h.title : 'A hero not yet summoned'}"></div></div>
      <div class="tline"><span>${owned ? h.species + ' · ' + h.title : 'Not yet summoned'}</span><b class="gem" title="${OS.cap(h.rarity)}"></b></div>
      <div class="nums">${R.stats.map(k => `<div><b>${owned ? stats[k] : '?'}</b><span>${OS.statWord[k]}</span></div>`).join('')}</div>
      <div class="foot"><span>Power <b>${owned ? power : '?'}</b></span><span class="dots">${dots}</span></div></div>`;
    let back = '';
    if (!opt.mini) {
      const cell = (k, label, id, cls) => `<div class="gs ${cls || ''}${id ? ' has' : ''}${L.avail && L.avail[k] ? ' avail' : ''}" data-slot="${k}" style="${id ? '--q:' + col(id) : ''}"><u>${label}</u>${id ? `<img src="${OS.img('loot', OS.items[id].icon)}" alt="${OS.items[id].name}">` : ''}</div>`;
      const charmOpen = L.charmOpen != null ? L.charmOpen : (opt.level || 1) >= R.slots.charm_level;
      const left = ['weapon', 'head', 'body', 'feet'].map(k => cell(k, OS.cap(k), g[k])).join('');
      const right = (charmOpen ? cell('charm', 'Charm', g.charm) : `<div class="gs lock" data-slot="charm"><u>Charm</u><em>Lv ${R.slots.charm_level}</em></div>`) +
        h.gear.map((gid, i) => { const worn = own[i] === gid, have = worn || (L.has ? L.has(gid) : false);
          return `<div class="gs own${worn ? ' has' : ''}${!worn && have ? ' avail' : ''}" data-slot="own${i}" style="${worn ? '--q:' + col(gid) : ''}"><u>${OS.shortName(OS.items[gid].name)}</u><img class="${worn ? '' : have ? 'ready' : 'sil'}" src="${OS.img('loot', OS.items[gid].icon)}" alt="${worn ? OS.items[gid].name : have ? OS.items[gid].name + ', in your armory' : 'Not found yet'}"></div>`; }).join('');
      const st = R.gear_sets['set_' + h.id], k2 = st ? Object.keys(st.two)[0] : '';
      const lines = L.lines || (st ? [`<s>${st.name} set · 2 worn: +${st.two[k2]} ${OS.statWord[k2]} · all 3: +${Math.round(st.three.amount * 100)}% ${OS.FX[st.three.kind]}</s>`, `<s>${h.name.split(' ')[0]}’s kit · 2 worn: +${Math.round(R.kit.two * 100)}% all stats · all 3: +${Math.round(R.kit.three * 100)}%</s>`] : []);
      const cp = L.copies ? `<span class="cl">Lv ${opt.level || 1} <i><b style="width:${Math.min(100, L.copies[0] / L.copies[1] * 100)}%"></b></i> ${L.copies[0]} / ${L.copies[1]} copies</span>` : `<span class="cl">Lv ${opt.level || 1}</span>`;
      back = `<div class="face back tcg bk">
        <div class="nbar"><span class="nm">${h.name}</span><button class="ib" type="button" aria-label="About ${h.name}">i</button></div>
        <div class="doll"><div class="bgi" style="background-image:url(/assets/v2/bg/${h.bg}.webp)"></div><div class="live"><img src="${OS.img('heroes', h.id)}" alt=""></div>
          <div class="gcol l">${left}</div><div class="gcol r">${right}</div></div>
        <div class="bon">${lines.slice(0, 3).join('<br>')}</div>
        <div class="strip">${R.stats.map(k => `<span>${SW[k]}<b>${stats[k]}</b>${stats[k] > base[k] ? `<em>+${stats[k] - base[k]}</em>` : ''}</span>`).join('')}</div>
        <div class="foot"><span>Power <b>${power}</b></span>${cp}</div>
        <div class="story"><h4>${h.title} · ${h.era}</h4><p>${h.bio}</p>${h.fact ? `<h4>True fact</h4><p>${h.fact}</p>` : ''}<h4>Smudge says</h4><p>“${h.lines[1]}”</p></div></div>`;
    }
    c.innerHTML = front + back;
    if (!opt.mini) {
      c.querySelectorAll('.gs').forEach(el => {
        const k = el.dataset.slot, id = k.indexOf('own') === 0 ? h.gear[+k[3]] : g[k], worn = k.indexOf('own') === 0 ? own[+k[3]] === id : !!id;
        if (id && (worn || (L.has && L.has(id)))) OS.bindTip(el, () => OS.tipHTML(id));
        else if (k.indexOf('own') === 0) OS.bindTip(el, () => `<div class="tn" style="color:${R.rarity_color[OS.items[id].rarity]}">???</div><div class="sub"><span>${OS.cap(OS.items[id].rarity)}</span></div><div class="src">One of ${h.name.split(' ')[0]}’s own three pieces. Not found yet.</div>`);
        if (opt.onSlot) el.addEventListener('click', e => { e.stopPropagation(); opt.onSlot(k); });
      });
      c.querySelector('.ib').addEventListener('click', e => { e.stopPropagation(); const bk = c.querySelector('.back'); bk.classList.toggle('info'); e.currentTarget.textContent = bk.classList.contains('info') ? '×' : 'i'; });
      // the hero stands idle on the back, but only once somebody is looking at it
      const wake = () => { if (!opt.live || c._pup || !window.DBCanvas || !OS.rig['h_' + h.id]) return; const host = c.querySelector('.live'), e = OS.rig['h_' + h.id]; if (!host.clientHeight) return;
        const sc = Math.min(host.clientHeight * 0.92 / e.size[1], host.clientWidth * 0.62 / e.size[0]); host.innerHTML = ''; c._pup = new DBCanvas.Puppet(host, h.id, sc, { hero: true, x: 0.5 - (e.size[0] / 2 - e.foot[0]) * sc / host.clientWidth, y: 0.995, ver: OS.VER }); };
      c.wake = wake; c.sleep = () => { if (c._pup) { c._pup.destroy(); c._pup = null; } };
      if (!opt.noflip && owned) c.addEventListener('click', e => { if (e.target.closest('.gs,.ib')) return; clearTimeout(c._ft);
        if (c.classList.contains('flip')) { c.classList.remove('flat'); void c.offsetWidth; c.classList.remove('flip'); }
        else { c.classList.add('flip'); setTimeout(wake, 350); c._ft = setTimeout(() => c.classList.add('flat'), 720); } });
      if (opt.back) { c.classList.add('flip', 'flat'); setTimeout(wake, 60); }
    }
    return c;
  };
  return OS;
})();
