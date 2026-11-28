// Landing page: the live desk demo and the five sample cards.
(async function () {
  // reveal on scroll (an extra: sections are visible without this script)
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(n => io.observe(n));
  // in case the observer never fires (screenshot tools, odd browsers), show everything anyway
  setTimeout(() => document.querySelectorAll('.rv:not(.in)').forEach(n => n.classList.add('in')), 4000);
  const OS = await window.OS.load(), R = OS.R, $ = id => document.getElementById(id);

  // ---------------------------------------------------------------- the desk
  const desk = $('desk-demo'), prog = $('prog'), glow = $('glow');
  let smudge, k = 1, ink = 0, busy = false, taps = 0, lastTap = 0;
  const NEED = 28, SAMPLE = ['kevin', 'lola', 'cleocatra', 'florida', 'raspawtin']   // only the five shown below; the rest stay secret;
  function layout() {
    k = desk.clientWidth / 910;
    if (!smudge) smudge = new OS.Puppet(desk, 'stamp', 0.45 * k);
    smudge.scale = 0.45 * k; smudge.place(453 * k, (61 + 255) * k);
  }
  layout(); addEventListener('resize', layout);
  // Smudge talks in the same bubble as the game, kept off his face and off the hint
  let lastB = null;
  function say(text) {
    if (lastB) lastB.remove();
    const [x, y] = smudge.point(430, 40), dr = desk.getBoundingClientRect(), hr = $('hint').getBoundingClientRect();
    const hint = $('hint').style.opacity === '0' ? [] : [{ x0: hr.left - dr.left, x1: hr.right - dr.left, y0: hr.top - dr.top, y1: hr.bottom - dr.top }];
    const hold = OS.Stage.holdFor(text);
    lastB = OS.Stage.say(desk, { x, top: y, h: desk.clientHeight * .42, name: 'Smudge' }, text, hold, hint);
    smudge.say(Math.min(2.6, 0.5 + text.length * 0.035));
  }
  function summon() {
    busy = true; const h = OS.heroes[SAMPLE[Math.floor(Math.random() * SAMPLE.length)]];
    const card = OS.card(h, { mini: true }); card.classList.add('summoned');
    const size = Math.max(90, 150 * k); card.style.width = size + 'px';
    card.style.left = (453 * k - size / 2) + 'px'; card.style.top = (400 * k - size * 1.44) + 'px';
    card.style.transition = 'transform .9s cubic-bezier(.2,1.4,.4,1),opacity .5s'; card.style.transform = 'translateY(60px) scale(.2) rotateY(180deg)'; card.style.opacity = '0';
    desk.appendChild(card); glow.setAttribute('opacity', '.55');
    requestAnimationFrame(() => requestAnimationFrame(() => { card.style.transform = 'none'; card.style.opacity = '1'; }));
    smudge.cheer(2); say(h.lines[1]);
    setTimeout(() => { card.style.opacity = '0'; card.style.transform = 'translateY(-30px) scale(.8)'; glow.setAttribute('opacity', '0'); }, 3600);
    setTimeout(() => { card.remove(); ink = 0; prog.setAttribute('stroke-dasharray', '0 100'); busy = false; }, 4200);
  }
  function tap() {
    const now = performance.now(); if (busy || now - lastTap < 70) return; lastTap = now;
    smudge.kick('arm', 30); smudge.kick('head', 2.2); taps++; ink++;
    if (taps === 1) $('hint').style.opacity = '0';
    if (taps === 6) say("Oh, you're helping. Don't make it weird.");
    prog.setAttribute('stroke-dasharray', Math.min(100, ink / NEED * 100) + ' 100');
    glow.setAttribute('opacity', Math.max(0, (ink / NEED - 0.6) * 0.8).toFixed(2));
    if (ink >= NEED) summon();
  }
  addEventListener('keydown', e => { if (!e.repeat && !e.metaKey && !e.ctrlKey && !(e.target.closest && e.target.closest('input,textarea'))) tap(); });
  desk.addEventListener('pointerdown', tap);
  setTimeout(() => { if (!taps) say('Three hundred years guarding a book. Great career move, Smudge.'); }, 2500);

  // ---------------------------------------------------------------- cards
  const show = ['kevin', 'lola', 'cleocatra', 'florida', 'raspawtin'];
  // dress each sample card differently, with random pieces, so the backs show what gear looks like
  const GEAR = Object.values(OS.items).filter(i => i.kind === 'gear' && !i.owner), RAR = R.rarities;
  const pickGear = (slot, minR) => { const pool = GEAR.filter(i => i.slot === slot && RAR.indexOf(i.rarity) >= RAR.indexOf(minR || 'common')); return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null; };
  const LOOKS = [                                                   // [general slots, how many of their own pieces, lowest rarity]
    [['weapon', 'feet'], 0, 'common'],                             // a couple of plain pieces
    [['head'], 3, 'uncommon'],                                     // their own full kit
    [['weapon', 'head', 'body', 'feet'], 1, 'uncommon'],
    [['weapon', 'body', 'charm'], 2, 'rare'],
    [['weapon', 'head', 'body', 'feet', 'charm'], 3, 'epic']];      // fully dressed
  LOOKS.sort(() => Math.random() - .5);
  show.forEach((id, n) => {
    const h = OS.heroes[id], [slots, nOwn, minR] = LOOKS[n], g = {}, own = [null, null, null];
    slots.forEach(k => g[k] = pickGear(k, minR));
    [0, 1, 2].sort(() => Math.random() - .5).slice(0, nOwn).forEach(i => own[i] = h.gear[i]);
    const st = Object.assign({}, h.stats), add = it => it && Object.entries(OS.items[it].stats || {}).forEach(([k, v]) => { if (k in st) st[k] += v; });
    Object.values(g).forEach(add); own.forEach(add);
    const kit = nOwn >= 3 ? R.kit.three : nOwn >= 2 ? R.kit.two : 0;
    if (kit) Object.keys(st).forEach(k => st[k] = Math.round(st[k] * (1 + kit)));
    $('cards').appendChild(OS.card(h, { live: true, stats: st, base: h.stats, load: { g, own, charmOpen: slots.includes('charm'), has: () => false } }));
  });
  setTimeout(() => { const c = $('cards').children[2]; if (c) { c.classList.add('flip'); setTimeout(() => c.classList.remove('flip'), 2600); } }, 1800);
  setTimeout(() => { if (window.Cloud) Cloud.track(); else if (window.supabase) { const s = document.createElement('script'); s.src = '/js/cloud.js'; s.onload = () => Cloud.track(); document.body.appendChild(s); } }, 1500);
})();
