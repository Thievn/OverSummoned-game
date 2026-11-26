// Life in the scenes: water that shimmers and ripples, a fishing line with a bobber, flames, bubbles,
// smoke, fireflies, dust. All drawn in code on a canvas over the scene picture, so no art is re-cut.
// Regions are fractions of the scene picture, the same frame js/stage.js uses.
(function () {
  const FX = {
    // water: [x0,y0,x1,y1] of the open water, with the fishing spot inside it
    dock: { water: [.42, .64, 1, .95], bob: [.72, .79], tint: [120, 220, 205], dust: 0 },
    bondi: { water: [.52, .55, 1, .95], bob: [.78, .71], tint: [110, 215, 240] },
    fjord: { water: [.63, .46, .79, .58], bob: [.71, .52], tint: [120, 200, 235], fire: [[.26, .45, 26]], snow: 1 },
    speakeasy: { lamp: [[.79, .3, 40]], dust: 1 },
    vault: { lamp: [[.11, .13, 30]], dust: .5 },
    closet: { bubbles: [.535, .17, .575, .30] },
    outback: { dust: 1.4 },
    blackforest: { lamp: [[.79, .35, 26]], smoke: [.3, .2], fireflies: 1 } };

  // host: the box the puppets live in. rect(): the scene picture's box, from OS.Stage.rect.
  class SceneFX {
    constructor(host, place, rect) {
      this.place = place; this.cfg = FX[place] || {}; this.rect = rect; this.t = 0; this.rings = []; this.dead = false;
      const c = this.cv = document.createElement('canvas');
      c.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1';
      host.insertBefore(c, host.firstChild); this.host = host;
      const t = this.topcv = document.createElement('canvas');   // the rod line goes over everybody
      t.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:7'; host.appendChild(t);
      this.bits = []; const n = Math.round(26 * (this.cfg.dust || 0));
      for (let i = 0; i < n; i++) this.bits.push({ x: Math.random(), y: Math.random(), s: .3 + Math.random() * .7, v: .004 + Math.random() * .01 });
      this.flies = this.cfg.fireflies ? Array.from({ length: 11 }, () => ({ x: .15 + Math.random() * .7, y: .45 + Math.random() * .4, p: Math.random() * 7 })) : [];
      this.bub = this.cfg.bubbles ? Array.from({ length: 7 }, () => ({ y: Math.random(), x: Math.random(), v: .1 + Math.random() * .2 })) : [];
      this.flake = this.cfg.snow ? Array.from({ length: 24 }, () => ({ x: Math.random(), y: Math.random(), v: .02 + Math.random() * .03, s: Math.random() })) : [];
      let last = performance.now();
      const frame = now => { if (this.dead) return; const dt = Math.min(.05, (now - last) / 1000); last = now; this.t += dt; this.draw(dt); this.raf = requestAnimationFrame(frame); };
      this.raf = requestAnimationFrame(frame);
    }
    // Where Smudge's rod tip is: told to us once he is placed, as [x, y] in host pixels.
    rod(xy) { this.tip = xy; }
    // Scenes with no edge to sit on get a crate under him. top-centre at [x, y], h tall.
    crate(xy, h) { this.crt = { x: xy[0], y: xy[1], h };
      if (!SceneFX.img) { const i = SceneFX.img = new Image(); i.src = '/assets/v2/scenes/prop_crate.webp' + (OS.VER || ''); } }
    at(f) { const r = this.rect; return [r.x + f[0] * r.w, r.y + f[1] * r.h]; }
    // a haul: the bobber dips and a ring spreads
    splash() { if (!this.cfg.bob) return; this.rings.push({ a: 0 }); this.dip = 1; }
    // a key press or click: a small ring, wherever the water is
    tap() { if (this.cfg.bob) this.rings.push({ a: .45 }); }
    // where the bobber sits right now, so the line can be drawn to it
    bobAt() { if (!this.cfg.bob) return null; const [x, y] = this.at(this.cfg.bob); return [x, y + Math.sin(this.t * 2.1) * this.rect.h * .006 + (this.dip || 0) * this.rect.h * .02]; }
    draw(dt) {
      const cv = this.cv, w = this.host.clientWidth, h = this.host.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      const r = this.rect, c = this.cfg, T = this.t;
      if (this.dip) this.dip = Math.max(0, this.dip - dt * 2.5);
      if (c.water) {                                                     // slow bands of light sliding over the water
        const [x0, y0, x1, y1] = c.water, X = r.x + x0 * r.w, Y = r.y + y0 * r.h, W = (x1 - x0) * r.w, H = (y1 - y0) * r.h;
        g.save(); g.beginPath(); g.ellipse(X + W / 2, Y + H / 2, W / 2, H / 2, 0, 0, 7); g.clip();
        const t3 = c.tint.join(',');
        for (let i = 0; i < 4; i++) { const p = ((T * .07 + i * .25) % 1);
          g.fillStyle = `rgba(${t3},${.05 + .04 * Math.sin(T + i)})`; g.fillRect(X, Y + p * H - H * .05, W, H * .09); }
        this.rings = this.rings.filter(k => (k.a += dt * .55) < 1);
        const b = this.bobAt();
        this.rings.forEach(k => { g.strokeStyle = `rgba(255,255,255,${(1 - k.a) * .5})`; g.lineWidth = 1.6;
          g.beginPath(); g.ellipse(b[0], b[1], k.a * r.w * .07, k.a * r.h * .028, 0, 0, 7); g.stroke(); });
        g.restore();
      }
      const ci = SceneFX.img;
      if (this.crt && ci && ci.complete && ci.naturalWidth) { const k = this.crt.h / ci.naturalHeight, w2 = ci.naturalWidth * k;
        g.drawImage(ci, this.crt.x - w2 / 2, this.crt.y, w2, this.crt.h); }
      if (c.lamp) c.lamp.forEach(([lx, ly, rad]) => { const [x, y] = this.at([lx, ly]), R = rad * r.h / 460 * 3.2, f = .55 + .45 * (0.5 + 0.5 * Math.sin(T * 2.3) * Math.sin(T * 1.1));
        const gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, `rgba(255,214,140,${.3 * f})`); gr.addColorStop(1, 'rgba(255,200,120,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); });
      if (c.fire) c.fire.forEach(([fx, fy, rad]) => { const [x, y] = this.at([fx, fy]), R = rad * r.h / 460 * 3.4, f = .6 + .4 * Math.sin(T * 9.3) * Math.sin(T * 4.1);
        const gr = g.createRadialGradient(x, y, 0, x, y, R * (.85 + .25 * f)); gr.addColorStop(0, `rgba(255,180,70,${.34 + .12 * f})`); gr.addColorStop(1, 'rgba(255,120,40,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); });
      if (c.smoke) { const [sx, sy] = this.at(c.smoke);                   // a thin curl from the chimney
        for (let i = 0; i < 7; i++) { const p = ((T * .14 + i / 7) % 1), yy = sy - p * r.h * .3, xx = sx + Math.sin(p * 5 + i) * r.w * .016;
          g.fillStyle = `rgba(210,215,230,${(1 - p) * .14})`; g.beginPath(); g.arc(xx, yy, r.h * (.012 + p * .03), 0, 7); g.fill(); } }
      if (this.bub.length) { const [bx0, by0, bx1, by1] = c.bubbles;      // the water cooler
        this.bub.forEach(b => { b.y -= dt * b.v; if (b.y < 0) { b.y = 1; b.x = Math.random(); }
          const x = r.x + (bx0 + b.x * (bx1 - bx0)) * r.w, y = r.y + (by0 + b.y * (by1 - by0)) * r.h;
          g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(x, y, Math.max(1, r.h * .006), 0, 7); g.fill(); }); }
      this.flake.forEach(f => { f.y += dt * f.v; f.x += dt * .006 * Math.sin(T + f.s * 7); if (f.y > 1) { f.y = 0; f.x = Math.random(); }
        g.fillStyle = `rgba(255,255,255,${.25 + f.s * .35})`; g.beginPath(); g.arc(r.x + f.x * r.w, r.y + f.y * r.h, 1 + f.s, 0, 7); g.fill(); });
      this.bits.forEach(b => { b.y -= dt * b.v; b.x += dt * .004 * Math.sin(T * .7 + b.s * 9); if (b.y < 0) { b.y = 1; b.x = Math.random(); }
        g.fillStyle = `rgba(255,236,200,${.05 + b.s * .14})`; g.beginPath(); g.arc(r.x + b.x * r.w, r.y + b.y * r.h, .7 + b.s, 0, 7); g.fill(); });
      this.flies.forEach(f => { const x = r.x + (f.x + Math.sin(T * .6 + f.p) * .02) * r.w, y = r.y + (f.y + Math.cos(T * .8 + f.p * 1.7) * .02) * r.h;
        const a = Math.max(0, Math.sin(T * 1.9 + f.p)); g.fillStyle = `rgba(190,255,150,${a * .75})`; g.beginPath(); g.arc(x, y, 1.7, 0, 7); g.fill(); });
      const tc = this.topcv; if (tc.width !== cv.width) { tc.width = cv.width; tc.height = cv.height; }
      const gt = tc.getContext('2d'); gt.setTransform(dpr, 0, 0, dpr, 0, 0); gt.clearRect(0, 0, w, h); if (this.tip) this.line(gt, this.tip);
    }
    // the rod line, drawn over everybody: from the rod tip to the bobber
    line(g, tip) { const b = this.bobAt(); if (!b || !tip) return;
      g.strokeStyle = 'rgba(240,248,255,.78)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(tip[0], tip[1]);
      g.quadraticCurveTo((tip[0] + b[0]) / 2, (tip[1] + b[1]) / 2 + this.rect.h * .035, b[0], b[1]); g.stroke();
      g.fillStyle = '#e8453c'; g.strokeStyle = '#1e2a47'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(b[0], b[1] - 3, Math.max(3, this.rect.h * .012), 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(b[0], b[1] - 3, Math.max(3, this.rect.h * .012), Math.PI, 7); g.fill(); g.stroke(); }
    destroy() { this.dead = true; cancelAnimationFrame(this.raf); this.cv.remove(); this.topcv.remove(); }
  }
  ((typeof OS !== 'undefined' ? OS : (window.OS = window.OS || {}))).SceneFX = SceneFX;
  window.SceneFX = SceneFX;
})();
