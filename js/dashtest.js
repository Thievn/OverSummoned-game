// Dashboard mockup: fake numbers, but the live bits are live — the rigs move, the bars fill,
// the sparkline is drawn, and the haul timer runs. Nothing here touches a save.
(function () {
  const $ = id => document.getElementById(id), V = '?v=1126d';

  // ---- the desk: Smudge at work with a crew of three, on the scene he is working
  const scene = $('scene'), crew = $('crew');
  const CREW = ['astrid', 'gaius', 'blackbear'];
  function placeRigs() {
    const w = crew.clientWidth, h = crew.clientHeight; if (!w) return;
    if (crew._done) { crew._done.forEach(p => p.destroy()); }
    const k = h / 290, made = [];
    made.push(new DBCanvas.Puppet(crew, 'fish', 0.42 * k, { px: [w * 0.60, h * 0.95], ver: V }));
    CREW.forEach((id, i) => made.push(new DBCanvas.Puppet(crew, id, 0.30 * k, { hero: true, px: [w * (0.72 + i * 0.09), h * (0.90 + i * 0.03)], ver: V })));
    crew._done = made;
  }
  placeRigs(); addEventListener('resize', () => { clearTimeout(crew._t); crew._t = setTimeout(placeRigs, 250); });

  // ---- the haul timer, so the strip is never still
  let t = 0; const HAUL = 9;
  setInterval(() => {
    t = (t + 0.1) % HAUL; const p = t / HAUL;
    $('runbar').style.width = (p * 100).toFixed(1) + '%';
    $('runtxt').textContent = 'Next haul in ' + Math.max(1, Math.ceil(HAUL - t)) + 's';
    if (p < 0.012) { const n = $('hauls'); n.textContent = (+n.textContent.replace(/,/g, '') + 1).toLocaleString(); bump(n); }
  }, 100);
  const bump = n => { n.style.transform = 'scale(1.25)'; n.style.color = '#9ffff0'; setTimeout(() => { n.style.transition = 'transform .3s,color .3s'; n.style.transform = ''; n.style.color = ''; }, 60); };

  // ---- ink creeping up, energy ticking
  let ink = 68, en = 64;
  setInterval(() => {
    ink = ink >= 100 ? 0 : ink + 0.35; $('ink-bar').style.width = ink + '%'; $('ink-pct').textContent = Math.floor(ink) + '%';
    $('ink-sub').textContent = ink >= 100 ? 'The bottle is full. Somebody is about to have a very strange day.' : Math.round((100 - ink) * 58).toLocaleString() + ' more until the next stranger';
    $('m-ink').classList.toggle('ready', ink >= 100);
    en = Math.min(100, en + 0.08); $('en-bar').style.width = en + '%'; $('en-pct').innerHTML = Math.floor(en) + '<i>/100</i>';
    $('r-energy').textContent = Math.floor(en);
  }, 900);

  // ---- a sparkline behind the ink meter: ink earned per hour, last 24
  (function spark() {
    const host = $('sp-ink'), w = host.clientWidth || 220, h = 34, d = [];
    for (let i = 0; i < 24; i++) d.push(20 + Math.sin(i / 2.4) * 14 + Math.random() * 16 + (i > 16 ? 18 : 0));
    const mx = Math.max(...d), x = i => i / (d.length - 1) * w, y = v => h - 3 - (v / mx) * (h - 7);
    const line = d.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" aria-label="Ink earned each hour for the last day">
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fe0c5" stop-opacity=".45"/><stop offset="1" stop-color="#3fe0c5" stop-opacity="0"/></linearGradient></defs>
      <path d="${line} L${w} ${h} L0 ${h}Z" fill="url(#sg)"/><path d="${line}" fill="none" stroke="#3fe0c5" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="${x(d.length - 1)}" cy="${y(d[d.length - 1])}" r="3.5" fill="#9ffff0"/></svg>`;
  })();

  // ---- the four trades as rings
  const SK = [['Summoning', 47, 0.62, 1], ['Fishing', 61, 0.28, 0], ['Lockpicking', 34, 0.81, 0], ['Digging', 52, 0.44, 0]];
  $('skills').innerHTML = SK.map(([name, lvl, frac, rb]) => {
    const C = 2 * Math.PI * 30;
    return `<div class="skill"><svg viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="30" fill="none" stroke="#0b1020" stroke-width="8"/>
      <circle cx="36" cy="36" r="30" fill="none" stroke="${rb ? '#f3b930' : '#3fe0c5'}" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}" transform="rotate(-90 36 36)"/>
      <text x="36" y="41" text-anchor="middle" font-family="Lilita One" font-size="20" fill="#fff">${lvl}</text></svg>
      <b>${name}</b><span>${Math.round(frac * 100)}% to ${lvl + 1}</span>${rb ? `<span class="rb">Rebirth ${rb}</span>` : ''}</div>`;
  }).join('');

  // ---- who is away
  $('away').innerHTML = [
    ['cleocatra', 'Cleocatra', 'Back in 12m · Alexandria, 40 BC', ''],
    ['napoleon', 'Napoleon Bone-apart', 'Home. Carrying 3 things.', 'back'],
    ['emu', 'General Emu', 'Back in 1h 48m · Australia, 1932', ''],
  ].map(([id, n, s, c]) => `<div class="ex ${c}"><img src="/assets/v2/heroes/thumb/${id}.webp" alt=""><div><b>${n}</b><span>${s}</span></div></div>`).join('');

  // ---- what happened while you were out
  $('feed').innerHTML = [
    ['x_crate', 'A rift crate fell out of a hole in time.', '14m ago', 1],
    ['x_sword', 'Astrid Ironhowl pulled up a <b>Captured Lewis Gun</b>.', '38m ago', 1],
    ['x_gold', 'Your stall sold 4 Ostrich Feather Fans for 880 gold.', '1h ago', 0],
    ['x_friends', 'Pemberton sent you a gift.', '2h ago', 0],
    ['x_trophy', 'The Damp Cellar passed 8,000 hauls this week.', '3h ago', 0],
    ['x_stamp', 'Smudge summoned <b>Frau Troffea</b>. She has not stopped moving.', '4h ago', 0],
    ['x_energy', 'Energy filled up while you were gone.', '5h ago', 0],
  ].map(([i, t, w, n]) => `<li class="${n ? 'new' : ''}"><img src="/assets/v2/loot/${i}.webp" alt=""><div>${t}<time>${w}</time></div></li>`).join('');
})();
