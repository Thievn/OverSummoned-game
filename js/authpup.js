// Smudge on the sign-in page: the stamping rig instead of a floating picture.
// He blinks on his own, stamps now and then, and stamps along while you type.
(function () {
  const host = document.getElementById('authpup');
  if (!host || !window.DBCanvas) return;
  let pup = null;
  function layout() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const scale = w / 560;                       // fills the box without touching the edges
    if (!pup) pup = new DBCanvas.Puppet(host, 'stamp', scale, { px: [w * 0.5, h * 0.93] });
    pup.scale = scale; pup.px = [w * 0.5, h * 0.93];
  }
  layout(); addEventListener('resize', layout);

  // an unhurried stamp every few seconds so he is never completely still
  const idle = () => { if (pup) pup.act(); setTimeout(idle, 3600 + Math.random() * 3200); };
  setTimeout(idle, 1400);

  // and one swing per key while you fill the form: the whole game, at the door
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') && pup) pup.act();
  }, { passive: true });
})();
