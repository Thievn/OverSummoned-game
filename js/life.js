// The living city banner: hero-themed streets that drift and change, the player's own heroes
// strolling on one shared ground line, and now and then two of them stopping for a quick chat.
// Now and then a hero wanders off one side and someone (maybe a hero who was waiting) walks back in,
// so the crowd keeps mixing. Chats come from the saved set the server hands over; nothing is written here.
// Everything moves from one requestAnimationFrame loop, so a repaint of the page never restarts it.
const WALKERS = ['office_worker', 'delivery_rider', 'paramedic', 'hunter', 'legionary', 'engineer', 'plague_doctor', 'gangster', 'will_slapton'];
export const PLACES = [
  {id: 'aldermere', name: 'Aldermere Square'},
  {id: 'will_slapton', name: 'Starlight Boulevard'},
  {id: 'legionary', name: 'The Old Forum'},
  {id: 'delivery_rider', name: 'Noodle Row'},
  {id: 'engineer', name: 'Foghaven Works'},
  {id: 'gangster', name: 'Speakeasy Street'},
  {id: 'hunter', name: 'Frostcamp'},
  {id: 'office_worker', name: 'The Glass District'},
  {id: 'plague_doctor', name: 'Lantern Alley'},
  {id: 'paramedic', name: 'Mercy Street'}
];
const SWAP_MS = 26000, FADE_MS = 1400, PAN_MS = 70000;
const FR = 64, FRAMES = 4;

let node = null, layers = [], placeEl = null, walkLayer = null;
let raf = 0, last = 0, t0 = 0;
let W = 0, H = 0, k = 1.5, ground = 0;
let walkers = [], bench = [], ids = '', chats = [], recent = [], talk = null, chatAt = 0;
let place = 0, swapAt = 0, still = false, chatFrom = 0;

const rnd = (a, b) => a + Math.random() * (b - a);
const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

function build() {
  node = document.createElement('div');
  node.className = 'lc';
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = '<div class="lc-bg"></div><div class="lc-bg"></div><div class="lc-walk"></div><div class="lc-place"></div>';
  layers = [...node.querySelectorAll('.lc-bg')];
  walkLayer = node.querySelector('.lc-walk');
  placeEl = node.querySelector('.lc-place');
  place = Math.floor(Math.random() * PLACES.length);
  setPlace(place, true);
}

function setPlace(i, now) {
  const p = PLACES[i];
  const [a, b] = node.dataset.top === '1' ? [layers[0], layers[1]] : [layers[1], layers[0]];
  // b is the layer that fades in
  b.style.backgroundImage = `url(/assets/city/${p.id}.png)`;
  b.style.transition = now ? 'none' : `opacity ${FADE_MS}ms ease`;
  a.style.transition = now ? 'none' : `opacity ${FADE_MS}ms ease`;
  b.style.opacity = '1'; a.style.opacity = '0';
  node.dataset.top = node.dataset.top === '1' ? '0' : '1';
  placeEl.textContent = p.name;
  placeEl.classList.remove('on'); void placeEl.offsetWidth; placeEl.classList.add('on');
}

function measure() {
  const r = node.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  if (r.width === W && r.height === H) return true;
  W = r.width; H = r.height;
  k = Math.max(1, Math.min(2.4, H * 0.4 / FR));
  ground = Math.round(H * 0.07);
  for (const w of walkers) sizeWalker(w);
  return true;
}

function sizeWalker(w) {
  const s = w.el.querySelector('.lc-s');
  s.style.width = FR * k + 'px'; s.style.height = FR * k + 'px';
  s.style.backgroundSize = `${FR * FRAMES * k}px ${FR * k}px`;
  w.el.style.bottom = ground + 'px';
}

function gap() { return FR * k * 0.78; }

function setHeroes(list) {
  const want = list.filter(id => WALKERS.includes(id));
  const key = want.join(',');
  if (key === ids && walkers.length) return;
  ids = key;
  walkLayer.textContent = '';
  walkers = [];
  talk = null;
  const room = Math.max(1, Math.floor(((W || 600) * (1 - chatFrom * 0.5) - gap()) / (gap() * 1.2)));
  const mixed = want.slice().sort(() => Math.random() - 0.5);
  const pick = mixed.slice(0, Math.min(8, room));
  bench = mixed.slice(pick.length);
  pick.forEach((id, i) => {
    const el = document.createElement('div');
    el.className = 'lc-w';
    el.innerHTML = `<div class="lc-s" style="background-image:url(/assets/walk/${id}.png)"></div><div class="lc-b"></div>`;
    walkLayer.appendChild(el);
    const span = (W || 600) / (pick.length + 1);
    const w = {id, el, x: span * (i + 1) + rnd(-span * 0.2, span * 0.2), dir: Math.random() < 0.5 ? -1 : 1, v: rnd(26, 38), f: 0, ft: 0, stop: 0, say: null,
      st: 'on', leaveAt: performance.now() + rnd(18000, 70000), backAt: 0};
    walkers.push(w);
    sizeWalker(w);
  });
}

function chatFor(a, b) {
  const key = pairKey(a.id, b.id);
  const opts = chats.filter(c => pairKey(c.a, c.b) === key && !recent.includes(c));
  return opts.length ? opts[Math.floor(Math.random() * opts.length)] : null;
}

function startChat(a, b, c, now) {
  const g = gap();
  // face each other, a little apart, both fully inside the banner
  const mid = Math.max(Math.max(g, W * chatFrom) + g / 2, Math.min(W - g, (a.x + b.x) / 2));
  const left = a.x < b.x ? a : b, right = left === a ? b : a;
  left.x = mid - g / 2; right.x = mid + g / 2; left.dir = 1; right.dir = -1;
  talk = {a, b, c, i: -1, next: now};
  recent.push(c); if (recent.length > 12) recent.shift();
}

function stepChat(now) {
  if (!talk || now < talk.next) return;
  const {a, b, c} = talk;
  a.el.querySelector('.lc-b').classList.remove('on'); b.el.querySelector('.lc-b').classList.remove('on');
  talk.i++;
  if (talk.i >= c.lines.length) {
    a.dir = a.x < b.x ? -1 : 1; b.dir = -a.dir;
    talk = null; chatAt = now + rnd(9000, 16000);
    return;
  }
  const line = c.lines[talk.i];
  const who = line.who === a.id ? a : b;
  const bub = who.el.querySelector('.lc-b');
  bub.textContent = line.text;
  bub.classList.add('on');
  talk.next = now + 1900 + line.text.length * 55;
}

// Keep everyone at least one step apart, inside the banner. Anyone pushed from the front turns around.
function separate(g, edge) {
  const o = onStage().sort((p, q) => p.x - q.x);
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < o.length - 1; i++) {
      const a = o[i], b = o[i + 1], d = b.x - a.x;
      if (d >= g) continue;
      const fixA = talk && (a === talk.a || a === talk.b), fixB = talk && (b === talk.a || b === talk.b);
      const push = g - d;
      if (fixA && !fixB) b.x += push; else if (fixB && !fixA) a.x -= push; else { a.x -= push / 2; b.x += push / 2; }
      if (!fixA && a.dir === 1) a.dir = -1;
      if (!fixB && b.dir === -1) b.dir = 1;
    }
    if (o.length) { const lb = Math.max(edge, W * chatFrom * 0.5); if (o[0].x < lb) o[0].x = lb; if (o[o.length - 1].x > W - edge) o[o.length - 1].x = W - edge; }
    for (let i = 1; i < o.length; i++) if (o[i].x - o[i - 1].x < g) o[i].x = Math.min(W - edge, o[i - 1].x + g);
    for (let i = o.length - 2; i >= 0; i--) if (o[i + 1].x - o[i].x < g) o[i].x = Math.max(Math.max(edge, W * chatFrom * 0.5), o[i + 1].x - g);
  }
}

const onStage = () => walkers.filter(w => w.st === 'on');

// Comings and goings: one hero at a time (a few in a big crowd) heads off the nearest side,
// waits a moment off screen, then a hero walks in from either side. If some of your heroes
// were waiting for room, one of them may take the turn.
function comings(now) {
  const away = walkers.filter(w => w.st !== 'on').length;
  const room = Math.max(1, Math.floor(walkers.length / 3));
  for (const w of walkers) {
    const busy = talk && (w === talk.a || w === talk.b);
    if (w.st === 'on' && !busy && now > w.leaveAt && away < room && walkers.length > 1) {
      w.st = 'out'; w.dir = w.x < W / 2 ? -1 : 1; w.v = rnd(30, 40);
      return;
    }
    if (w.st === 'off' && now > w.backAt) {
      if (bench.length && Math.random() < 0.7) {
        const j = Math.floor(Math.random() * bench.length);
        const next = bench[j]; bench[j] = w.id; w.id = next;
        w.el.firstChild.style.backgroundImage = `url(/assets/walk/${next}.png)`;
      }
      const fromLeft = Math.random() < 0.5, half = FR * k / 2;
      w.x = fromLeft ? -half : W + half; w.dir = fromLeft ? 1 : -1; w.v = rnd(26, 38);
      w.st = 'in'; w.el.style.visibility = '';
    }
  }
}

function frame(now) {
  raf = 0;
  if (!node || !node.isConnected) return;
  if (!measure()) { raf = requestAnimationFrame(frame); return; }
  const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
  if (!t0) t0 = now;
  if (now > swapAt) { if (swapAt) { place = (place + 1) % PLACES.length; setPlace(place, false); } swapAt = now + SWAP_MS; }
  // the street drifts slowly left and right, ground kept at the bottom
  const bw = Math.max(W * 1.25, H * 2), bh = bw / 2;
  const pan = still ? 0.5 : (Math.sin((now - t0) / PAN_MS * Math.PI * 2) + 1) / 2;
  for (const l of layers) { l.style.backgroundSize = `${bw}px ${bh}px`; l.style.backgroundPosition = `${-(bw - W) * pan}px ${H - bh}px`; }

  const g = gap(), edge = g * 0.55, left = Math.max(edge, W * chatFrom * 0.5);
  if (!still) {
    stepChat(now);
    // a quiet street for a while: the two nearest heroes on the right side turn to face each other
    comings(now);
    if (!talk && chats.length && onStage().length > 1 && now > chatAt + 9000) {
      const o = onStage().sort((p, q) => p.x - q.x);
      for (let i = o.length - 2; i >= 0; i--) if (chatFor(o[i], o[i + 1])) { o[i].dir = 1; o[i + 1].dir = -1; break; }
      chatAt = now;
    }
    const order = onStage().sort((p, q) => p.x - q.x);
    for (const w of walkers) {
      if (talk && (w === talk.a || w === talk.b)) { w.moving = false; continue; }
      if (w.st === 'off') { w.moving = false; continue; }
      if (w.st !== 'on') {
        // on the way out or in: just keep walking, past the crowd
        w.x += w.dir * w.v * dt * (k / 1.5); w.moving = true;
        const half = FR * k / 2;
        if (w.st === 'out' && (w.x < -half * 1.2 || w.x > W + half * 1.2)) {
          w.st = 'off'; w.el.style.visibility = 'hidden'; w.backAt = now + rnd(2500, 9000);
          w.el.querySelector('.lc-b').classList.remove('on');
        } else if (w.st === 'in' && w.x > left + g * 0.2 && w.x < W - edge - g * 0.2) {
          w.st = 'on'; w.leaveAt = now + rnd(25000, 80000);
        }
        continue;
      }
      let v = w.v;
      for (const o of order) {
        if (o === w) continue;
        const d = (o.x - w.x) * w.dir;
        if (d <= 0 || d > g * 1.02) continue;
        const busy = talk && (o === talk.a || o === talk.b);
        if (!busy && o.dir === -w.dir && !talk && now > chatAt && (w.x + o.x) / 2 > Math.max(g, W * chatFrom * 0.85) && Math.max(w.x, o.x) < W - g) {
          const c = chatFor(w, o);
          if (c && Math.random() < 0.85) { startChat(w, o, c, now); break; }
          chatAt = now + 2500;
        }
        if (o.dir === w.dir && !busy) v = Math.min(v, o.v * 0.98);
        else w.dir = -w.dir;
        break;
      }
      if (talk && (w === talk.a || w === talk.b)) { w.moving = false; continue; }
      w.x += w.dir * v * dt * (k / 1.5);
      if (w.x < left) { w.x = left; w.dir = 1; }
      if (w.x > W - edge) { w.x = W - edge; w.dir = -1; }
      w.moving = true;
    }
    separate(g, edge);
  } else {
    const span = W / (walkers.length + 1);
    walkers.forEach((w, i) => { w.x = span * (i + 1); w.moving = false; w.dir = i % 2 ? -1 : 1; w.st = 'on'; w.el.style.visibility = ''; });
  }
  node.classList.toggle('talking', !!talk);
  for (const w of walkers) {
    if (w.moving) { w.ft += dt; if (w.ft > 0.14) { w.ft = 0; w.f = (w.f + 1) % FRAMES; } } else w.f = 0;
    const s = w.el.firstChild;
    s.style.backgroundPosition = `${-w.f * FR * k}px 0`;
    s.style.transform = w.dir < 0 ? 'scaleX(-1)' : '';
    w.el.style.transform = `translateX(${Math.round(w.x - FR * k / 2)}px)`;
    const b = w.el.lastChild;
    if (b.classList.contains('on')) {
      const bwid = b.offsetWidth, lft = w.x - bwid / 2;
      const shift = lft < 4 ? 4 - lft : (lft + bwid > W - 4 ? W - 4 - (lft + bwid) : 0);
      b.style.transform = `translateX(calc(-50% + ${shift}px))`;
      b.style.bottom = FR * k * 0.9 + 'px';
    }
  }
  if (!still || !document.hidden) raf = requestAnimationFrame(frame);
}

// Put the banner in a placeholder after each repaint. The same node is reused, so nothing restarts.
export function mountLife(el, opts) {
  if (!el) { if (raf) cancelAnimationFrame(raf); raf = 0; return; }
  if (!node) build();
  still = !!opts.still;
  chatFrom = opts.chatFrom || 0;
  if (node.parentNode !== el) el.appendChild(node);
  measure();
  setHeroes(opts.heroes || []);
  if (opts.chats) chats = opts.chats;
  last = 0;
  if (!raf) raf = requestAnimationFrame(frame);
}
export function setChats(list) { chats = Array.isArray(list) ? list : []; }
