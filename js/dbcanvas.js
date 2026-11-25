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
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
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
  class Puppet {
    constructor(host, pose, scale, opt) {
      opt = opt || {}; this.host = host; this.pose = pose; this.scale = scale; this.fx = opt.x == null ? 0.5 : opt.x; this.fy = opt.y == null ? 0.9 : opt.y;
      this.stem = opt.hero ? 'hero_' + pose : 'smudge_' + pose;          // which files: smudge_<pose> or hero_<id>
      this.px = opt.px || null;                                            // [x, y] in host pixels for the feet, instead of the fractions
      // the canvas goes in straight away, so anything added to the host later sits on top of him
      const cv = this.cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none'; host.appendChild(cv);
      this.bones = false; this.dead = false; this.ready = this.load(opt.base || '/assets/v2/db/', opt.ver || '');
    }
    async load(base, ver) {
      const d = await fetchPose(this.stem, base, ver); if (this.dead) return;
      const f = this.factory = new Factory(); f.parseDragonBonesData(d.ske); f.parseTextureAtlasData(d.tex, d.img);
      this.p = f.build(this.pose, this.stem); this.an = this.p.animation; this.an.play('idle', 0);
      const cv = this.cv, ctx = cv.getContext('2d');
      const blink = () => { if (this.dead) return; this.over('blink', 1, 3); this.bt = setTimeout(blink, 2200 + Math.random() * 3300); }; blink();
      // little fidgets some poses have (a sleeping snout twitch, now and then a dream)
      const fidget = () => { if (this.dead) return; if (Math.random() < 0.22) this.over('act', 1, 1); else this.over('twitch', 1, 5); this.ft = setTimeout(fidget, 3500 + Math.random() * 5500); };
      if (this.an.hasAnimation('twitch')) this.ft = setTimeout(fidget, 2500);
      let last = performance.now();
      const frame = now => {
        if (this.dead) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; f.advance(dt);
        const w = this.host.clientWidth, h = this.host.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
        draw(ctx, this.p, this.px ? this.px[0] : w * this.fx, this.px ? this.px[1] : h * this.fy, this.scale, { bones: this.bones });
        this.raf = requestAnimationFrame(frame);
      };
      this.raf = requestAnimationFrame(frame);
    }
    // play an animation on top of whatever is running; it fades itself out when done
    over(name, times, layer) {
      if (!this.an || !this.an.hasAnimation(name)) return null;
      const s = this.an.fadeIn(name, 0.06, times, layer, name); if (s) { s.resetToPose = false; s.autoFadeOutTime = 0.08; } return s;
    }
    act() { return this.over('act', 1, 1); }
    cheer(sec) { return this.over('cheer', Math.max(1, Math.round((sec || 2) * 2)), 2); }
    say(sec) { return this.over('talk', Math.max(1, Math.round((sec || 2) * 1.5)), 4); }
    destroy() { this.dead = true; cancelAnimationFrame(this.raf); clearTimeout(this.bt); clearTimeout(this.ft); if (this.cv) this.cv.remove(); if (this.p) this.p.dispose(); }
  }

  window.DBCanvas = { Factory, draw, Puppet };
})();
