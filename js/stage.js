// OverSummoned stage: the one place that says where everybody stands in every scene, how big they are, and
// how a speech bubble is drawn. The game's Work view and the dashboard both use it, so the two can never disagree.
(function () {
  // Spots are fractions of the scene picture (x across, y down to the FEET). s = Smudge, who works at the edge of the
  // water, in front of the safe, beside the hole. c = three crew spots, each wholly on one surface, clear of the props
  // and a body's width apart. The third letter is the way that spot faces. w = picture width / height.
  // k (optional) scales everybody in a scene that is drawn closer up.
  const STAND = {
    dock: { w: 1.99, s: [.47, .665], c: [[.33, .53, 'r'], [.6, .51, 'l'], [.74, .575, 'l']] },
    bondi: { w: 1.99, s: [.43, .655], c: [[.23, .71, 'r'], [.33, .655, 'r'], [.61, .5, 'l']] },
    fjord: { w: 2.12, s: [.6, .6], c: [[.15, .57, 'r'], [.43, .57, 'r'], [.88, .51, 'l']] },
    speakeasy: { w: 2.01, s: [.62, .62], c: [[.22, .78, 'r'], [.36, .7, 'r'], [.8, .72, 'l']] },
    vault: { w: 1.91, s: [.58, .78], c: [[.2, .78, 'r'], [.31, .72, 'r'], [.42, .8, 'r']] },
    closet: { w: 1.87, s: [.55, .75], c: [[.2, .75, 'r'], [.31, .69, 'r'], [.41, .8, 'r']] },
    outback: { w: 2.05, s: [.46, .71], c: [[.1, .74, 'r'], [.21, .67, 'r'], [.32, .78, 'r']] },
    blackforest: { w: 1.95, s: [.5, .8], c: [[.22, .77, 'r'], [.35, .65, 'r'], [.9, .7, 'l']] } };
  // heroes whose picture looks to one side; everyone else looks out at you and is never mirrored
  const LOOKS = { albrecht: 'l', astrid: 'l', marco: 'r', emu: 'r' };
  // where Smudge's rod tip is in the fishing picture, so the line starts from the rod and not from thin air
  const ROD = { fish: [452, 62] };
  const HERO = 0.357, SMUDGE = 0.41;      // how tall a hero and Smudge stand, as a share of the scene picture's height

  const Stage = {
    STAND, LOOKS,
    // The scene picture's box inside a host W wide and H tall: a little taller than the host, bottom tucked under.
    // cx = where its middle sits (0.5 = centred).
    rect(place, W, H, cx) { const sp = STAND[place] || STAND.dock, h = H * 1.12, w = h * sp.w; return { x: W * (cx == null ? .5 : cx) - w / 2, y: -H * .06, w, h }; },
    // Everybody's feet in host pixels, and their heights. r = the picture's box from rect().
    layout(place, r) {
      const sp = STAND[place] || STAND.dock, k = sp.k || 1, at = q => [r.x + q[0] * r.w, r.y + q[1] * r.h];
      return { smudge: { at: at(sp.s), h: SMUDGE * r.h * k }, crew: sp.c.map(q => ({ at: at(q), h: HERO * r.h * k, face: q[2] })) };
    },
    // the rod tip in host pixels for a pose placed at `at` and `h` tall
    rodTip(pose, at, h, rig) { const t = ROD[pose], e = rig[pose]; if (!t || !e) return null; const k = h / e.size[1];
      return [at[0] + (t[0] - e.foot[0]) * k, at[1] + (t[1] - e.foot[1]) * k]; },
    flip(id, face) { return !!(LOOKS[id] && LOOKS[id] !== face); },
    // A speech bubble with a tail that points at whoever is talking. who = { x, top } in host pixels (the middle of the
    // head and its top edge); others = [{ x0, y0, x1, y1 }] boxes of everyone else, which the bubble keeps off.
    say(host, who, text, hold, others) {
      if (!host || !text) return null;
      const b = document.createElement('div'); b.className = 'osb'; b.textContent = text; host.appendChild(b);
      const W = host.clientWidth, H = host.clientHeight, bw = b.offsetWidth, bh = b.offsetHeight, pad = 6, tail = 9;
      const clampX = x => Math.max(pad, Math.min(W - bw - pad, x));
      const hit = (x, y) => (others || []).reduce((n, o) => n + Math.max(0, Math.min(x + bw, o.x1) - Math.max(x, o.x0)) * Math.max(0, Math.min(y + bh, o.y1) - Math.max(y, o.y0)), 0);
      let best = null;
      const tryAt = (x, y, side) => { x = clampX(x); y = Math.max(pad, Math.min(H - bh - pad, y)); const cost = hit(x, y) + (side ? 40 : 0) + Math.abs(x + bw / 2 - who.x) * .2; if (!best || cost < best.cost) best = { x, y, side, cost }; };
      const above = who.top - bh - tail - 2;
      if (above >= pad) [0, -.25, .25, -.5, .5].forEach(f => tryAt(who.x - bw / 2 + f * bw, above, ''));
      else { const y = who.top + 2; tryAt(who.x + 26 + tail, y, 'l'); tryAt(who.x - 26 - tail - bw, y, 'r'); }      // no room overhead: beside the head
      b.style.left = best.x + 'px'; b.style.top = best.y + 'px';
      if (best.side) { b.classList.add('side-' + best.side); b.style.setProperty('--ty', Math.max(8, Math.min(bh - 8, who.top + 14 - best.y)) + 'px'); }
      else b.style.setProperty('--tx', Math.max(12, Math.min(bw - 12, who.x - best.x)) + 'px');
      requestAnimationFrame(() => b.classList.add('on'));
      setTimeout(() => { b.classList.remove('on'); setTimeout(() => b.remove(), 250); }, hold || 3200);
      return b;
    } };
  (typeof OS !== "undefined" ? OS : (window.OS = window.OS || {})).Stage = Stage;
})();
