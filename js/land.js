// Landing page: the live desk demo, sample cards, items, places, voices.
(async function () {
  const OS = await window.OS.load(), R = OS.R, $ = id => document.getElementById(id);

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(n => io.observe(n));

  // ---------------------------------------------------------------- the desk
  const desk = $('desk-demo'), bubble = $('bubble'), prog = $('prog'), glow = $('glow');
  let smudge, k = 1, ink = 0, busy = false, taps = 0, lastTap = 0;
  const NEED = 28, SAMPLE = ['kevin', 'emu', 'napoleon', 'lola', 'blackbear', 'chad', 'cleocatra', 'florida', 'sable', 'bella'];
  function layout() {
    k = desk.clientWidth / 910;
    if (!smudge) smudge = new OS.Puppet(desk, 'stamp', 0.45 * k);
    smudge.scale = 0.45 * k; smudge.place(453 * k, (61 + 255) * k);
  }
  layout(); addEventListener('resize', layout);
  let bubbleTimer;
  function say(text) {
    bubble.textContent = text; const [x, y] = smudge.point(430, 40);
    bubble.style.left = Math.min(x, desk.clientWidth * 0.52) + 'px'; bubble.style.top = Math.max(0, y - 10) + 'px';
    bubble.classList.add('on'); smudge.say(Math.min(2.6, 0.5 + text.length * 0.035));
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => bubble.classList.remove('on'), 4200);
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
  const show = ['kevin', 'emu', 'lola', 'cleocatra', 'florida'];
  show.forEach(id => $('cards').appendChild(OS.card(OS.heroes[id])));
  setTimeout(() => { const c = $('cards').children[2]; if (c) { c.classList.add('flip'); setTimeout(() => c.classList.remove('flip'), 2600); } }, 1800);
  R.heroes.filter(h => !show.includes(h.id)).forEach(h => { const i = new Image(); i.src = OS.img('heroes', h.id); i.alt = 'A hero not yet summoned'; $('shadows').appendChild(i); });

  // ---------------------------------------------------------------- items
  ['napoleon_trinket', 'chad_trinket', 'emu_weapon', 'morwenna_trinket', 'closet_8', 'lola_weapon', 'kenji_weapon', 'blackforest_5'].forEach(id => {
    const it = OS.items[id], box = OS.el('div', 'tip tipcard');
    box.style.borderColor = R.rarity_color[it.rarity];
    box.innerHTML = `<div style="display:flex;gap:.6rem;align-items:center;margin-bottom:.3rem"><div class="slot has r-${it.rarity}"><img src="${OS.img('loot', it.icon)}" alt=""></div></div>` + OS.tipHTML(id);
    $('items').appendChild(box);
  });

  // ---------------------------------------------------------------- places
  R.places.forEach(p => {
    const d = OS.el('div', 'place rv');
    d.innerHTML = `<img src="${OS.img('scenes', p.id)}" alt="${p.name}"><div class="era">${p.era} · ${p.skill}</div><h3>${p.name}</h3><p>${p.blurb}</p>`;
    $('placelist').appendChild(d); io.observe(d);
  });

  // ---------------------------------------------------------------- voices
  let mode = 'salty', qi = 0, adult = false, qt;
  const pool = m => [].concat(OS.voice[m].idle, OS.voice[m].summon, OS.voice[m].unlock, OS.voice[m].busy);
  function quote() {
    const p = pool(mode); qi = (qi + 1) % p.length;
    $('quote').innerHTML = '“' + p[qi] + '”<small>Smudge, ' + (mode === 'unhinged' ? 'unhinged' : mode) + '</small>';
    clearTimeout(qt); qt = setTimeout(quote, 4200);
  }
  $('voicepick').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.v === 'unhinged' && !adult) { if (!confirm('Unhinged Smudge swears. A lot. Adults only. Show it?')) return; adult = true; }
    mode = b.dataset.v; [...$('voicepick').children].forEach(x => x.classList.toggle('on', x === b)); qi = -1; quote();
  });
  quote();
})();
