/* OverSummoned: a small canvas renderer for the DragonBones core.
   The official core (js/vendor/dragonBones.core.js) does the bones, skinning and animation;
   this draws the result with plain 2D canvas. No WebGL, no eval, so it runs under the site's
   Content-Security-Policy and on any phone.

   const f = new DBCanvas.Factory();
   f.parseDragonBonesData(ske); f.parseTextureAtlasData(tex, image);
   const p = f.build('stamp', 'smudge');      // p.animation, p.armature
   f.advance(dt); DBCanvas.draw(ctx, p, x, y, scale, { bones: false });
*/
(function () {
  'use strict';
  const db = dragonBones, borrow = c => db.BaseObject.borrowObject(c);

  class Tex extends db.TextureData { static toString() { return '[class DBCanvas.Tex]'; } }
  class Atlas extends db.TextureAtlasData {
    static toString() { return '[class DBCanvas.Atlas]'; }
    _onClear() { super._onClear(); this.image = null; }
    createTexture() { return borrow(Tex); }
  }

  class Slot extends db.Slot {
    static toString() { return '[class DBCanvas.Slot]'; }
    _onClear() { super._onClear(); this.verts = null; this.uvs = null; this.tris = null; this.alpha = 1; this.shown = true; }
    _initDisplay() { } _disposeDisplay() { } _onUpdateDisplay() { } _addDisplay() { } _replaceDisplay() { } _removeDisplay() { }
    _updateZOrder() { } _updateBlendMode() { } _updateTransform() { } _identityTransform() { }
    _updateVisible() { this.shown = this._parent.visible && this._visible; }
    _updateColor() { this.alpha = this._colorTransform.alphaMultiplier * this._globalAlpha; }
    _updateFrame() {
      const g = this._geometryData; this.verts = this.uvs = this.tris = null;
      if (!g || !this._textureData) return;
      const ia = g.data.intArray, fa = g.data.floatArray, n = ia[g.offset + 0], t = ia[g.offset + 1];
      let vo = ia[g.offset + 2]; if (vo < 0) vo += 65536;
      const scale = this._armature._armatureData.scale;
      this.verts = new Float32Array(n * 2); this.uvs = new Float32Array(n * 2); this.tris = new Uint16Array(t * 3);
      for (let i = 0; i < n * 2; i++) { this.verts[i] = fa[vo + i] * scale; this.uvs[i] = fa[vo + n * 2 + i]; }
      for (let i = 0; i < t * 3; i++) this.tris[i] = ia[g.offset + 4 + i];
    }
    _updateMesh() {
      const g = this._geometryData, w = g.weight, out = this.verts; if (!out) return;
      const ia = g.data.intArray, fa = g.data.floatArray, n = ia[g.offset + 0], scale = this._armature._armatureData.scale;
      const def = this._displayFrame.deformVertices, hasDef = def.length > 0 && g.inheritDeform;
      if (w) {
        const bones = this._geometryBones; let fo = ia[w.offset + 1]; if (fo < 0) fo += 65536;
        for (let i = 0, d = 0, b = w.offset + 2 + bones.length, v = fo, f = 0; i < n; i++) {
          const count = ia[b++]; let x = 0, y = 0;
          for (let j = 0; j < count; j++) {
            const bone = bones[ia[b++]];
            if (bone) {
              const m = bone.globalTransformMatrix, k = fa[v++]; let lx = fa[v++] * scale, ly = fa[v++] * scale;
              if (hasDef) { lx += def[f++]; ly += def[f++]; }
              x += (m.a * lx + m.c * ly + m.tx) * k; y += (m.b * lx + m.d * ly + m.ty) * k;
            }
          }
          out[d++] = x; out[d++] = y;
        }
      } else {
        let vo = ia[g.offset + 2]; if (vo < 0) vo += 65536;
        for (let i = 0; i < n * 2; i++) out[i] = fa[vo + i] * scale + (hasDef ? def[i] : 0);
      }
    }
  }

  // what the core calls "the display": here it only carries the armature and events
  class Display {
    constructor() { this._armature = null; this._l = {}; }
    dbInit(a) { this._armature = a; } dbClear() { this._armature = null; } dbUpdate() { }
    dispose() { if (this._armature) { this._armature.dispose(); this._armature = null; } }
    hasDBEventListener(t) { return !!(this._l[t] && this._l[t].length); }
    dispatchDBEvent(t, e) { (this._l[t] || []).slice().forEach(fn => fn(e)); }
    addDBEventListener(t, fn) { (this._l[t] || (this._l[t] = [])).push(fn); }
    removeDBEventListener(t, fn) { const a = this._l[t]; if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } }
    get armature() { return this._armature; }
    get animation() { return this._armature.animation; }
  }

  class Factory extends db.BaseFactory {
    constructor() { super(); this._dragonBones = new db.DragonBones(new Display()); }
    _buildTextureAtlasData(data, image) { if (data) data.image = image; else data = borrow(Atlas); return data; }
    _buildArmature(pkg) { const a = borrow(db.Armature), d = new Display(); a.init(pkg.armature, d, d, this._dragonBones); return a; }
    _buildSlot(pkg, slotData, armature) { const s = borrow(Slot); s.init(slotData, armature, {}, {}); return s; }
    build(armatureName, dataName) {
      const a = this.buildArmature(armatureName, dataName || '', '', '');
      if (!a) return null; this._dragonBones.clock.add(a); return a.display;
    }
    advance(dt) { this._dragonBones.advanceTime(dt); }
  }

  // one textured triangle: clip to it, then draw the picture through the matching affine map
  function tri(ctx, img, r, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
    const den = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1); if (Math.abs(den) < 1e-6) return;
    const a = (x0 * (v1 - v2) + x1 * (v2 - v0) + x2 * (v0 - v1)) / den, c = (x0 * (u2 - u1) + x1 * (u0 - u2) + x2 * (u1 - u0)) / den;
    const b = (y0 * (v1 - v2) + y1 * (v2 - v0) + y2 * (v0 - v1)) / den, d = (y0 * (u2 - u1) + y1 * (u0 - u2) + y2 * (u1 - u0)) / den;
    const e = x0 - a * u0 - c * v0, f = y0 - b * u0 - d * v0;
    // grow the clip a touch so neighbours overlap and no hairline shows between them
    const cx = (x0 + x1 + x2) / 3, cy = (y0 + y1 + y2) / 3, g = (x, y) => { const dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1; return [x + dx / l * 0.7, y + dy / l * 0.7]; };
    const p0 = g(x0, y0), p1 = g(x1, y1), p2 = g(x2, y2);
    ctx.save(); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.closePath(); ctx.clip();
    ctx.transform(a, b, c, d, e, f); ctx.drawImage(img, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height); ctx.restore();
  }

  function draw(ctx, display, x, y, scale, opt) {
    const arm = display.armature; if (!arm) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(opt && opt.flip ? -scale : scale, scale);
    for (const s of arm.getSlots()) {
      const td = s._textureData; if (!s.shown || s._displayIndex < 0 || !td || s.alpha <= 0.003) continue;
      const img = td.parent.image, r = td.region; if (!img) continue;
      ctx.globalAlpha = s.alpha;
      if (s._geometryData && s.verts) {
        const v = s.verts, uv = s.uvs, t = s.tris, w = r.width, h = r.height;
        for (let i = 0; i < t.length; i += 3) {
          const i0 = t[i] * 2, i1 = t[i + 1] * 2, i2 = t[i + 2] * 2;
          tri(ctx, img, r, v[i0], v[i0 + 1], v[i1], v[i1 + 1], v[i2], v[i2 + 1], uv[i0] * w, uv[i0 + 1] * h, uv[i1] * w, uv[i1 + 1] * h, uv[i2] * w, uv[i2 + 1] * h);
        }
      } else {
        const m = s.globalTransformMatrix;
        ctx.save(); ctx.transform(m.a, m.b, m.c, m.d, m.tx, m.ty);
        ctx.drawImage(img, r.x, r.y, r.width, r.height, -s._pivotX, -s._pivotY, r.width, r.height); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    if (opt && opt.after) opt.after(ctx);
    if (opt && opt.bones) {
      ctx.lineWidth = 3 / scale; ctx.lineCap = 'round';
      for (const b of arm.getBones()) {
        const m = b.globalTransformMatrix, L = Math.max(b.boneData.length, 6);
        ctx.strokeStyle = '#19e0c3'; ctx.beginPath(); ctx.moveTo(m.tx, m.ty); ctx.lineTo(m.tx + m.a * L, m.ty + m.b * L); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(m.tx, m.ty, 4 / scale, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ a ready-made Smudge
  // new DBCanvas.Puppet(host, 'fish', 0.5, { x: 0.5, y: 0.9 })  ->  .act() .cheer(sec) .say(sec) .bones = true
  // new DBCanvas.Puppet(host, 'kevin', 0.4, { hero: true })      ->  any hero, same moves
  const files = {};
  function fetchPose(stem, base, ver) {
    const k = base + stem;
    if (!files[k]) {
      const u = base + stem, img = new Image();
      // onload, not decode(): decode() can sit unresolved while the tab is in the background
      const pic = new Promise((ok, bad) => { img.onload = ok; img.onerror = () => bad(new Error('picture missing: ' + stem)); }); img.src = u + '_tex.webp' + ver;
      files[k] = Promise.all([fetch(u + '_ske.json' + ver).then(r => r.json()), fetch(u + '_tex.json' + ver).then(r => r.json()), pic]).then(([ske, tex]) => ({ ske, tex, img }));
    }
    return files[k];
  }
  // ------------------------------------------------------------------ the wardrobe
  // Where things sit on Smudge in each pose, in picture pixels: [x, y, tilt in degrees, width]. head_top is the top of the hood,
  // face is between the eyes. A new hat or pair of glasses is ONE picture drawn to the template in art2/slots/, never a cut.
  const ANCHOR = {
    stamp: { foot: [300, 520], head_top: [262, 30, -8, 118], face: [304, 137, 5, 118, 'front'] },
    fish:  { foot: [250, 355], head_top: [200, 24, 8, 92],   face: [204, 80, 4, 96, 'side'] },
    pick:  { foot: [257, 522], head_top: [305, 34, 6, 98],   face: [340, 115, 4, 96, 'side'] },
    dig:   { foot: [300, 535], head_top: [312, 22, 10, 98],  face: [330, 101, 4, 96, 'side'] },
  };
  // fur and cloak colours: every pixel of that colour family is moved to the new colour, keeping its light and shade
  function hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; }
  function rgb(h, s, l) { h = ((h % 360) + 360) % 360 / 360; if (!s) return [l * 255, l * 255, l * 255]; const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return 255 * (t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p); }; return [f(h + 1 / 3), f(h), f(h - 1 / 3)]; }
  const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const FUR = { h: [14, 42], s: [.2, .8], l: [.1, .8], ref: hsl(150, 96, 57) }, CLOAK = { h: [168, 222], s: [.12, 1], l: [.06, .85], ref: hsl(32, 92, 104) };
  function recolor(img, fur, cloak, mask) {
    const c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0); if (!fur && !cloak) return c;
    const d = x.getImageData(0, 0, c.width, c.height), a = d.data, tf = fur && hsl(...hex(fur)), tc = cloak && hsl(...hex(cloak));
    let M = null; if (mask) { const mc = document.createElement('canvas'); mc.width = c.width; mc.height = c.height; const mx = mc.getContext('2d'); mx.drawImage(mask, 0, 0, c.width, c.height); M = mx.getImageData(0, 0, c.width, c.height).data; }
    const inn = (v, r) => v >= r[0] && v <= r[1];
    for (let i = 0; i < a.length; i += 4) {
      if (a[i + 3] < 8) continue; const [h, s, l] = hsl(a[i], a[i + 1], a[i + 2]); let t = null, R = null;
      const isFur = M ? M[i] > 128 : inn(h, FUR.h) && inn(s, FUR.s) && inn(l, FUR.l), isCloak = M ? M[i + 1] > 128 : inn(h, CLOAK.h) && inn(s, CLOAK.s) && inn(l, CLOAK.l);
      if (tf && isFur) { t = tf; R = FUR.ref; } else if (tc && isCloak) { t = tc; R = CLOAK.ref; }
      if (!t) continue;
      // move the mid-tones toward the new colour's lightness and leave the deepest shadows and brightest highlights where they were
      const L = Math.max(0, Math.min(.98, l + (t[2] - R[2]) * (l < .5 ? l / .5 : (1 - l) / .5)));
      const o = rgb(t[0], Math.min(1, s * t[1] / Math.max(.05, R[1])), L); a[i] = o[0]; a[i + 1] = o[1]; a[i + 2] = o[2];
    }
    x.putImageData(d, 0, 0); return c;
  }
  const pics = {}; const pic = u => pics[u] || (pics[u] = new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = u; }));

  // ------------------------------------------------------------------ the mind: small, constant signs of life
  // Everyone breathes and glances about. Smudge also follows your pointer, yawns and dozes when nobody does anything,
  // startles awake, looks at whoever is talking, cheers and sulks. All on random timers, so no two puppets move in step.
  const INPUT = { t: performance.now(), x: -1, y: -1, burst: 0, bt: 0 };
  if (typeof addEventListener === 'function') {
    const poke = () => { INPUT.t = performance.now(); };
    addEventListener('pointermove', e => { INPUT.x = e.clientX; INPUT.y = e.clientY; poke(); }, { passive: true });
    addEventListener('pointerdown', poke, { passive: true }); addEventListener('scroll', poke, { passive: true });
    addEventListener('keydown', () => { const n = performance.now(); INPUT.burst = n - INPUT.bt < 180 ? INPUT.burst + 1 : 0; INPUT.bt = n; poke(); });
  }
  const DOZE_AFTER = 40000, ease = (c, t, k, dt) => c + (t - c) * Math.min(1, k * dt);

  class Puppet {
    constructor(host, pose, scale, opt) {
      opt = opt || {}; this.host = host; this.pose = pose; this.scale = scale; this.fx = opt.x == null ? 0.5 : opt.x; this.fy = opt.y == null ? 0.9 : opt.y;
      this.stem = opt.hero ? 'hero_' + pose : 'smudge_' + pose;          // which files: smudge_<pose> or hero_<id>
      this.px = opt.px || null;                                            // [x, y] in host pixels for the feet, instead of the fractions
      // the canvas goes in straight away, so anything added to the host later sits on top of him
      const cv = this.cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none'; host.appendChild(cv);
      this.bones = false; this.dead = false; this.base = opt.base || '/assets/v2/db/'; this.ver = opt.ver || ''; this.ready = this.load(this.base, this.ver);
    }
    async load(base, ver) {
      const d = await fetchPose(this.stem, base, ver); if (this.dead) return;
      const f = this.factory = new Factory(); f.parseDragonBonesData(d.ske); f.parseTextureAtlasData(d.tex, d.img);
      this.p = f.build(this.pose, this.stem); this.an = this.p.animation;
      f.advance(0); this.img0 = d.img; this.atlas = f.getTextureAtlasData(d.tex.name || this.stem); this.bindWear(); this.bindMind();
      this.an.play('idle', 0);
      const cv = this.cv, ctx = cv.getContext('2d');
      const blink = () => { if (this.dead) return; this.over('blink', 1, 3); this.bt = setTimeout(blink, 2200 + Math.random() * 3300); }; blink();
      // little fidgets some poses have (a sleeping snout twitch, now and then a dream)
      const fidget = () => { if (this.dead) return; if (Math.random() < 0.22) this.over('act', 1, 1); else this.over('twitch', 1, 5); this.ft = setTimeout(fidget, 3500 + Math.random() * 5500); };
      if (this.an.hasAnimation('twitch')) this.ft = setTimeout(fidget, 2500);
      let last = performance.now();
      const frame = now => {
        if (this.dead) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; this.think(dt, now); f.advance(dt);
        if (this._q) { const st = this.an.getState('act'); if (!st || st.isCompleted || !st.isPlaying) { const s2 = this.over('act', 1, 1); if (s2) s2.timeScale = this._q; this._q = 0; } }
        const w = this.host.clientWidth, h = this.host.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
        const ox = this.px ? this.px[0] : w * this.fx, oy = this.px ? this.px[1] : h * this.fy; this.at = [ox, oy];
        draw(ctx, this.p, ox, oy, this.scale, { bones: this.bones, flip: this.flip, after: this.worn ? c => this.paintWear(c) : null });
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    }
    // ---------------- wardrobe: dress({ head_top: url, face: url, fur: '#hex', cloak: '#hex' }); null takes a thing off
    bindWear() {
      const A = ANCHOR[this.pose], head = this.p.armature.getBone('head'); this.wearAt = {}; this.worn = null; if (!A || !head || this.stem.indexOf('hero_') === 0) return;
      const m = head.globalTransformMatrix, det = m.a * m.d - m.b * m.c, ang0 = Math.atan2(m.b, m.a), sc0 = Math.hypot(m.a, m.b);
      ['head_top', 'face'].forEach(k => { const v = A[k]; if (!v) return; const ax = v[0] - A.foot[0], ay = v[1] - A.foot[1], dx = ax - m.tx, dy = ay - m.ty;
        this.wearAt[k] = { lx: (m.d * dx - m.c * dy) / det, ly: (-m.b * dx + m.a * dy) / det, rot: v[2] * Math.PI / 180 - ang0, w: v[3] / sc0, view: v[4] || '' }; });
      this.head = head;
    }
    async dress(o) {
      const w = this.worn || {}; this.dressing = o;
      for (const k of ['head_top', 'face']) if (k in o) { if (!o[k]) delete w[k]; else { const u = typeof o[k] === 'string' ? o[k] : o[k][this.wearAt[k] && this.wearAt[k].view] || o[k].front; const im = await pic(u); if (im) w[k] = im; } }
      if (('fur' in o || 'cloak' in o) && this.atlas) { this.tint = Object.assign(this.tint || {}, { fur: 'fur' in o ? o.fur : (this.tint || {}).fur, cloak: 'cloak' in o ? o.cloak : (this.tint || {}).cloak });
        const mask = ANCHOR[this.pose] && this.stem.indexOf('smudge_') === 0 ? await pic(this.base + this.stem + '_mask.webp' + this.ver) : null; const c = recolor(this.img0, this.tint.fur, this.tint.cloak, mask); (Array.isArray(this.atlas) ? this.atlas : [this.atlas]).forEach(a => a.image = c); }
      this.worn = Object.keys(w).length ? w : null; return this;
    }
    paintWear(ctx) {
      const m = this.head && this.head.globalTransformMatrix; if (!m) return;
      for (const k of ['head_top', 'face']) { const im = this.worn[k], q = this.wearAt[k]; if (!im || !q) continue;
        const x = m.a * q.lx + m.c * q.ly + m.tx, y = m.b * q.lx + m.d * q.ly + m.ty, sc = Math.hypot(m.a, m.b), W = q.w * sc, H = W * im.height / im.width;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(m.b, m.a) + q.rot); ctx.drawImage(im, -W / 2, -H / 2, W, H); ctx.restore(); }
    }
    // ---------------- mind
    bindMind() {
      const a = this.p.armature, B = n => a.getBone(n); this.mb = { head: B('head'), body: B('body'), tail: B('tail2'), lids: [B('lid0'), B('lid1')].filter(Boolean) };
      this.mood = { tilt: 0, want: 0, breath: Math.random() * 6, rate: 1.4 + Math.random() * .5, lid: 0, lidWant: 0, tail: Math.random() * 6, glance: 0, until: 0, state: 'awake' };
      this.smudge = this.stem.indexOf('smudge_') === 0 && this.pose !== 'sleep';
    }
    think(dt, now) {
      const M = this.mood, b = this.mb; if (!M) return;
      const idle = now - INPUT.t;
      if (this.smudge) {
        if (M.state === 'awake' && idle > DOZE_AFTER) { M.state = 'yawn'; M.until = now + 1600; this.say && this.over('talk', 1, 4); }
        else if (M.state === 'yawn' && now > M.until) M.state = 'doze';
        else if ((M.state === 'doze' || M.state === 'yawn') && idle < 400) { M.state = 'awake'; M.tilt = -0.16; M.lid = 0; if (this.over) this.over('blink', 1, 3); }
        if (INPUT.burst > 6 && M.state === 'awake') { INPUT.burst = 0; M.tilt -= 0.1; }      // a flurry of typing makes him jump
      }
      if (now < (M.forceUntil || 0)) M.want = M.force;
      else if (M.state === 'yawn') M.want = -0.14;
      else if (M.state === 'doze') M.want = 0.09 + Math.sin(now / 1900) * 0.015;
      else if (this.follow && this.smudge && INPUT.x >= 0 && this.at && this.cv) {
        const r = this.cv.getBoundingClientRect(), hm = b.head && b.head.globalTransformMatrix, sx = this.flip ? -1 : 1;
        const hx = r.left + this.at[0] + sx * (hm ? hm.tx : 0) * this.scale, hy = r.top + this.at[1] + (hm ? hm.ty : 0) * this.scale;
        let dx = (INPUT.x - hx) * sx, dy = INPUT.y - hy; if (dx < 20) dx = 20 + Math.abs(dx) * .3;
        M.want = Math.max(-0.13, Math.min(0.13, Math.atan2(dy, dx) * 0.32));
      } else { if (now > M.glance) { M.glance = now + 2500 + Math.random() * 5000; M.gw = (Math.random() - .5) * 0.12; } M.want = M.gw || 0; }
      M.lidWant = M.state === 'doze' ? 1 : 0;
      M.tilt = ease(M.tilt, M.want, M.state === 'awake' ? 5 : 1.6, dt); M.lid = ease(M.lid, M.lidWant, 2, dt);
      M.breath += dt * M.rate * (M.state === 'doze' ? 0.6 : 1); M.tail += dt * 0.9;
      if (b.head) { b.head.offset.rotation = M.tilt; b.head.invalidUpdate(); }
      if (b.body) { b.body.offset.scaleY = 1 + Math.sin(M.breath) * 0.011; b.body.offset.scaleX = 1 - Math.sin(M.breath) * 0.004; b.body.invalidUpdate(); }
      if (b.tail) { b.tail.offset.rotation = Math.sin(M.tail) * 0.05; b.tail.invalidUpdate(); }
      b.lids.forEach(l => { l.offset.scaleY = 1 + M.lid * 95; l.invalidUpdate(); });
    }
    // look toward a point on the page (a crew member who is talking) for a moment
    lookAt(clientX, clientY, sec) { const M = this.mood, hm = this.mb && this.mb.head && this.mb.head.globalTransformMatrix; if (!M || !this.cv || !this.at) return;
      const r = this.cv.getBoundingClientRect(), sx = this.flip ? -1 : 1, hx = r.left + this.at[0] + sx * (hm ? hm.tx : 0) * this.scale, hy = r.top + this.at[1] + (hm ? hm.ty : 0) * this.scale;
      const dx = Math.max(30, (clientX - hx) * sx), dy = clientY - hy; M.force = Math.max(-0.12, Math.min(0.12, Math.atan2(dy, dx) * 0.4)); M.forceUntil = performance.now() + (sec || 2) * 1000; }
    sulk(sec) { const M = this.mood; if (!M) return; M.force = 0.12; M.forceUntil = performance.now() + (sec || 1.6) * 1000; }
    hello() { if (this.an) { this.over('cheer', 2, 2); if (this.mood) { this.mood.force = -0.1; this.mood.forceUntil = performance.now() + 900; } } }
    // play an animation on top of whatever is running; it fades itself out when done
    over(name, times, layer) {
      if (!this.an || !this.an.hasAnimation(name)) return null;
      const s = this.an.fadeIn(name, 0.06, times, layer, name); if (s) { s.resetToPose = false; s.autoFadeOutTime = 0.08; } return s;
    }
    // One swing per press, however fast the presses come. A swing already under way is never restarted (that is what used to
    // leave the arm stuck in the air); it is hurried along instead, and one more is queued behind it.
    act() {
      if (!this.an) return null;            // pressed before the puppet finished loading
      const now = performance.now(), gap = (now - (this._at || 0)) / 1000; this._at = now;
      const st = this.an.getState('act'), len = st ? st.totalTime : 0.58, fast = gap < 0.7 ? Math.min(7, Math.max(1, len / Math.max(gap, 0.07))) : 1;
      if (st && st.isPlaying && !st.isCompleted) { st.timeScale = Math.max(st.timeScale, fast); this._q = fast; return st; }
      const s = this.over('act', 1, 1); if (s) s.timeScale = fast; return s;
    }
    cheer(sec) { return this.over('cheer', Math.max(1, Math.round((sec || 2) * 2)), 2); }
    say(sec) { return this.over('talk', Math.max(1, Math.round((sec || 2) * 1.5)), 4); }
    destroy() { this.dead = true; cancelAnimationFrame(this.raf); clearTimeout(this.bt); clearTimeout(this.ft); if (this.cv) this.cv.remove(); if (this.p) this.p.dispose(); }
  }

  window.DBCanvas = { Factory, draw, Puppet, ANCHOR, INPUT };
})();
