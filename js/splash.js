// Launch splash: a short pixel summoning circle, only when OverSummoned is opened as an installed app.
// Tap or press any key to skip. Plays once per launch and never with reduced motion.
(function () {
  var q = location.search;
  var force = /[?&]splash=1/.test(q);
  var app = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (!force && !app) return;
  try { if (!force && sessionStorage.getItem('os_splash')) return; sessionStorage.setItem('os_splash', '1'); } catch (e) {}
  if (!force && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var N = 96, C = N / 2, DUR = 2000;
  var el = document.createElement('div');
  el.className = 'os-splash';
  el.setAttribute('role', 'presentation');
  el.innerHTML = '<canvas width="' + N + '" height="' + N + '" aria-hidden="true"></canvas>' +
    '<img class="lg" src="/assets/logo.svg" alt="OverSummoned" width="606" height="100">' +
    '<button class="skip" type="button">Tap to skip</button>';
  (document.body || document.documentElement).appendChild(el);
  var cv = el.querySelector('canvas'), x = cv.getContext('2d');
  var t0 = performance.now(), gone = false, raf = 0;

  var V = '#1E2A47', CY = '#12B5A2', PK = '#FF5B47', GD = '#FFC83D', W = '#FFFBF2';
  function px(a, b, c) { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), 1, 1); }
  function ring(r, upto, c, rot) {
    var n = Math.ceil(2 * Math.PI * r * 1.3);
    for (var i = 0; i < n * upto; i++) { var a = rot + i / n * 2 * Math.PI - Math.PI / 2; px(C + Math.cos(a) * r, C + Math.sin(a) * r, c); }
  }
  function line(a, b, c, d, upto, col) {
    var n = Math.max(Math.abs(c - a), Math.abs(d - b)) | 0;
    for (var i = 0; i <= n * upto; i++) px(a + (c - a) * i / n, b + (d - b) * i / n, col);
  }
  function ease(v) { v = Math.max(0, Math.min(1, v)); return 1 - Math.pow(1 - v, 3); }
  var sparks = [];
  for (var s = 0; s < 26; s++) sparks.push({a: Math.random() * 6.283, r: 6 + Math.random() * 24, v: 8 + Math.random() * 20, d: Math.random() * 0.5, c: [CY, PK, GD, V][s % 4]});

  function frame(now) {
    if (gone) return;
    var t = (now - t0) / DUR;
    x.clearRect(0, 0, N, N);
    var glow = ease((t - 0.45) / 0.45);
    if (glow > 0) {
      var g = x.createRadialGradient(C, C, 0, C, C, 44);
      g.addColorStop(0, 'rgba(255,200,61,' + (0.55 * glow) + ')'); g.addColorStop(1, 'rgba(255,200,61,0)');
      x.fillStyle = g; x.fillRect(0, 0, N, N);
    }
    var rot = t * 1.4;
    ring(42, ease(t / 0.3), V, 0);
    ring(40, ease((t - 0.08) / 0.3), CY, 0);
    ring(30, ease((t - 0.18) / 0.3), V, -rot * 0.6);
    for (var i = 0; i < 12; i++) {
      if (t < 0.25 + i * 0.02) continue;
      var a = rot + i * Math.PI / 6, len = i % 3 ? 2 : 4;
      for (var k = 0; k < len; k++) px(C + Math.cos(a) * (33 + k), C + Math.sin(a) * (33 + k), i % 3 ? CY : GD);
    }
    var pts = [];
    for (var j = 0; j < 5; j++) { var b = -Math.PI / 2 + j * 2 * Math.PI / 5 + rot * 0.25; pts.push([C + Math.cos(b) * 28, C + Math.sin(b) * 28]); }
    for (var m = 0; m < 5; m++) {
      var p = pts[(m * 2) % 5], q2 = pts[(m * 2 + 2) % 5];
      line(p[0], p[1], q2[0], q2[1], ease((t - 0.35 - m * 0.06) / 0.18), PK);
    }
    var core = ease((t - 0.55) / 0.3) * 5;
    for (var yy = -6; yy <= 6; yy++) for (var xx = -6; xx <= 6; xx++) if (xx * xx + yy * yy <= core * core) px(C + xx, C + yy, xx * xx + yy * yy < core * core * 0.35 ? W : GD);
    if (t > 0.6) sparks.forEach(function (sp) {
      var u = t - 0.6 - sp.d; if (u <= 0) return;
      px(C + Math.cos(sp.a) * sp.r, C + Math.sin(sp.a) * sp.r * 0.5 - u * sp.v * 3, sp.c);
    });
    if (t > 0.82) { x.fillStyle = 'rgba(255,251,242,' + Math.min(0.9, (t - 0.82) / 0.12) * (t > 0.94 ? Math.max(0, 1 - (t - 0.94) / 0.06) : 1) + ')'; x.fillRect(0, 0, N, N); }
    if (t >= 1) { close(); return; }
    raf = requestAnimationFrame(frame);
  }
  function close() {
    if (gone) return; gone = true; cancelAnimationFrame(raf);
    el.classList.add('out');
    setTimeout(function () { el.remove(); }, 400);
    removeEventListener('keydown', close, true);
  }
  el.addEventListener('pointerdown', close);
  addEventListener('keydown', close, true);
  requestAnimationFrame(function () { el.classList.add('on'); });
  raf = requestAnimationFrame(frame);
  window.osSplash = {close: close};
})();
