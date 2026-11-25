// OverSummoned shared pieces: data loading, Smudge the puppet, cards, item slots, tooltips.
window.OS = (function () {
  const A = '/assets/v2/';
  const OS = { R: null, rig: null, voice: null, items: {}, heroes: {} };

  OS.VER = '?v=1124r';   // bump when art or data changes, so browsers drop their cached copies
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
    place(x, y) { if (x != null) { this.x = x; this.y = y; } if (this.db) { this.db.scale = this.scale; this.db.px = [this.x || 0, this.y || 0]; return; } this.root.style.transform = `translate(${this.x || 0}px,${this.y || 0}px) scale(${this.scale})`; }
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
      s += `<div class="sig">Signature item: ${OS.heroes[it.owner].name}. Half again as strong in their hands.</div>`;
    } else s += `<div class="sub"><span>Treasure</span><span>${OS.cap(it.rarity)}</span></div>`;
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
  OS.card = function (h, opt) {
    opt = opt || {}; const owned = opt.owned !== false, R = OS.R;
    const c = OS.el('div', 'card r-' + h.rarity + (owned ? '' : ' locked') + (opt.mini ? ' mini' : ''));
    const stats = opt.stats || h.stats, max = 60;
    let back = '';
    if (!opt.mini) {
      back = `<div class="face back"><i class="frame"></i><div><div class="nm">${h.name}</div><div class="ti">${h.title} · ${h.era}</div></div>
        <div class="bio">${h.bio}</div>
        <div class="stats">${R.stats.map(k => `<span>${OS.statWord[k]}</span><i><b style="width:${Math.min(100, stats[k] / max * 100)}%"></b></i><span>${stats[k]}</span>`).join('')}</div>
        <div class="slots"></div></div>`;
    }
    // trading-card layout: name bar, art window, type line, text box. One calm frame in the rarity's colour.
    const lv = opt.level > 1 ? `<span class="lv">Lv ${opt.level}</span>` : '';
    c.innerHTML = `<div class="face front tcg">
      <div class="nbar"><span class="nm">${owned ? h.name : '???'}</span>${lv}</div>
      <div class="win"><div class="bgi" style="background-image:url(/assets/v2/bg/${h.bg}.webp)"></div>
        <div class="art"><img src="${OS.img('heroes', h.id)}" alt="${owned ? h.name + ', ' + h.species + ' ' + h.title : 'A hero not yet summoned'}"></div></div>
      <div class="tline"><span>${owned ? h.species + ' · ' + h.title : 'Not yet summoned'}</span><b class="gem" title="${OS.cap(h.rarity)}"></b></div>
      <div class="tbox"><div class="era">${OS.cap(h.rarity)}${owned ? ' · ' + h.era : ''}</div><div class="fl">${owned ? OS.blurb(h.bio) : 'Somebody the book has not coughed up yet.'}</div></div></div>` + back;
    if (!opt.mini) {
      const slots = c.querySelector('.slots'), gear = opt.gear || h.gear;
      gear.forEach((g, i) => slots.appendChild(g ? OS.slot(g, { dim: opt.dimGear && opt.dimGear[i] }) : OS.el('div', 'slot empty')));
      if (!opt.noflip && owned) c.addEventListener('click', e => { if (!e.target.closest('.slot')) c.classList.toggle('flip'); });
    }
    return c;
  };
  return OS;
})();
