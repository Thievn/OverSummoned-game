// The living city banner: one long street that scrolls evenly through every
// neighborhood, the player's heroes walking mostly one way on a shared ground
// line, and now and then two of them stopping for a quick chat.
// A hero who reaches the edge walks off and someone (maybe a hero who was waiting)
// comes back in from the other side, so the crowd keeps mixing. Chats come from
// the saved set the server hands over; nothing is written here.
// Everything moves from one requestAnimationFrame loop, so a repaint of the page
// never restarts it. Positions snap to whole pixels so the street never ripples.
// A hero that belongs to one account walks here only for that account, using the
// walk art it was sent.
import {walkSrc, hasWalk} from './art.js';
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
const FR = 64, FRAMES = 4;
// Native size of the joined street (10 neighborhoods, each 336 px of new ground).
const PAN_W = 3360, PAN_H = 200, PLACE_W = 336;
const SCROLL = 18;

let node = null, bgEl = null, placeEl = null, walkLayer = null;
let raf = 0, last = 0;
let W = 0, H = 0, k = 1.5, ground = 0, scale = 1, cam = 0;
let walkers = [], bench = [], ids = '', chats = [], recent = [], talk = null, chatAt = 0;
let place = -1, still = false, chatFrom = 0;

const rnd = (a, b) => a + Math.random() * (b - a);
const pairKey = (a, b) => (a < b ? a + '|' + b : b + '|' + a);

function build() {
  node = document.createElement('div');
  node.className = 'lc';
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = '<div class="lc-bg"></div><div class="lc-walk"></div><div class="lc-place"></div>';
  bgEl = node.querySelector('.lc-bg');
  bgEl.style.backgroundImage = 'url(/assets/city/panorama.png)';
  bgEl.style.opacity = '1';
  walkLayer = node.querySelector('.lc-walk');
  placeEl = node.querySelector('.lc-place');
}

function setPlaceName(i) {
  if (i === place) return;
  place = i;
  const p = PLACES[i] || PLACES[0];
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
  // Same visual scale as before: a 400 px street fills at least 1.25 of the banner width.
  scale = Math.max(W * 1.25, H * 2) / 400;
  for (const w of walkers) sizeWalker(w);
  return true;
}

function sizeWalker(w) {
  const s = w.el.querySelector('.lc-s');
  const frames = w.frames || FRAMES;
  s.style.width = FR * k + 'px'; s.style.height = FR * k + 'px';
  s.style.backgroundSize = `${FR * frames * k}px ${FR * k}px`;
  w.el.style.bottom = ground + 'px';
}

function attachSheet(w, src) {
  const s = w.el.querySelector('.lc-s');
  const img = new Image();
  img.onload = () => {
    w.frames = Math.max(1, Math.round(img.naturalWidth / FR));
    s.style.backgroundImage = `url(${src})`;
    sizeWalker(w);
  };
  img.src = src;
}

function gap() { return FR * k * 0.78; }

function setHeroes(list) {
  const want = list.filter(id => WALKERS.includes(id) || hasWalk(id));
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
    el.innerHTML = `<div class="lc-s"></div><div class="lc-b"></div>`;
    walkLayer.appendChild(el);
    const span = (W || 600) / (pick.length + 1);
    const screen = span * (i + 1) + rnd(-span * 0.2, span * 0.2);
    const dir = Math.random() < 0.85 ? 1 : -1;
    const w = {id, el, world: cam + screen, dir, v: rnd(26, 38), f: 0, ft: 0,
      st: 'on', leaveAt: performance.now() + rnd(18000, 70000), backAt: 0, frames: FRAMES};
    walkers.push(w);
    attachSheet(w, walkSrc(id));
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
  const mid = (a.world + b.world) / 2;
  const left = a.world < b.world ? a : b, right = left === a ? b : a;
  left.world = mid - g / 2; right.world = mid + g / 2;
  left.holdDir = left.dir; right.holdDir = right.dir;
  left.dir = 1; right.dir = -1;
  talk = {a, b, c, i: -1, next: now};
  recent.push(c); if (recent.length > 12) recent.shift();
}

function stepChat(now) {
  if (!talk || now < talk.next) return;
  const {a, b, c} = talk;
  a.el.querySelector('.lc-b').classList.remove('on'); b.el.querySelector('.lc-b').classList.remove('on');
  talk.i++;
  if (talk.i >= c.lines.length) {
    a.dir = a.holdDir || 1; b.dir = b.holdDir || 1;
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

// Keep everyone at least one step apart. No turning around, and no pinning
// anyone to the visible frame — standing or chatting heroes stay in the world
// so they travel with the ground as the street scrolls.
function separate(g) {
  const o = onStage().sort((p, q) => p.world - q.world);
  const talking = w => talk && (w === talk.a || w === talk.b);
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < o.length - 1; i++) {
      const a = o[i], b = o[i + 1], d = b.world - a.world;
      if (d >= g) continue;
      const fixA = talking(a), fixB = talking(b);
      const push = g - d;
      if (fixA && !fixB) b.world += push; else if (fixB && !fixA) a.world -= push; else { a.world -= push / 2; b.world += push / 2; }
    }
    for (let i = 1; i < o.length; i++) {
      if (talking(o[i])) continue;
      if (o[i].world - o[i - 1].world < g) o[i].world = o[i - 1].world + g;
    }
    for (let i = o.length - 2; i >= 0; i--) {
      if (talking(o[i])) continue;
      if (o[i + 1].world - o[i].world < g) o[i].world = o[i + 1].world - g;
    }
  }
}

const onStage = () => walkers.filter(w => w.st === 'on');

function comings(now) {
  const away = walkers.filter(w => w.st !== 'on').length;
  const room = Math.max(1, Math.floor(walkers.length / 3));
  for (const w of walkers) {
    const busy = talk && (w === talk.a || w === talk.b);
    if (w.st === 'on' && !busy && now > w.leaveAt && away < room && walkers.length > 1) {
      w.st = 'out'; w.v = rnd(30, 40);
      return;
    }
    if (w.st === 'off' && now > w.backAt) {
      if (bench.length && Math.random() < 0.7) {
        const j = Math.floor(Math.random() * bench.length);
        const next = bench[j]; bench[j] = w.id; w.id = next;
        attachSheet(w, walkSrc(next));
      }
      const half = FR * k / 2;
      if (w.dir >= 0) { w.world = cam - half; w.dir = 1; }
      else { w.world = cam + W + half; w.dir = -1; }
      w.v = rnd(26, 38);
      w.st = 'in'; w.el.style.visibility = '';
    }
  }
}

function frame(now) {
  raf = 0;
  if (!node || !node.isConnected) return;
  if (!measure()) { raf = requestAnimationFrame(frame); return; }
  const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;

  if (!still) cam += SCROLL * scale * dt;
  const dispW = PAN_W * scale, dispH = PAN_H * scale;
  const camPx = Math.round(cam);
  bgEl.style.backgroundSize = `${Math.round(dispW)}px ${Math.round(dispH)}px`;
  bgEl.style.backgroundPosition = `${-Math.round(((camPx % Math.round(dispW)) + Math.round(dispW)) % Math.round(dispW))}px ${Math.round(H - dispH)}px`;

  const mid = ((camPx % Math.round(dispW)) + Math.round(dispW)) % Math.round(dispW) + W / 2;
  const idx = ((Math.floor(mid / (PLACE_W * scale)) % PLACES.length) + PLACES.length) % PLACES.length;
  setPlaceName(idx);

  const g = gap(), edge = g * 0.55, left = Math.max(edge, W * chatFrom * 0.5), right = W - edge;
  if (!still) {
    stepChat(now);
    comings(now);
    if (!talk && chats.length && onStage().length > 1 && now > chatAt + 9000) {
      const o = onStage().sort((p, q) => p.world - q.world);
      for (let i = o.length - 2; i >= 0; i--) if (chatFor(o[i], o[i + 1])) { break; }
      chatAt = now;
    }
    const order = onStage().sort((p, q) => p.world - q.world);
    for (const w of walkers) {
      if (talk && (w === talk.a || w === talk.b)) { w.moving = false; continue; }
      if (w.st === 'off') { w.moving = false; continue; }
      if (w.st !== 'on') {
        w.world += w.dir * w.v * dt * (k / 1.5); w.moving = true;
        const half = FR * k / 2;
        const sx = w.world - cam;
        if (w.st === 'out' && (sx < -half * 1.2 || sx > W + half * 1.2)) {
          w.st = 'off'; w.el.style.visibility = 'hidden'; w.backAt = now + rnd(2500, 9000);
          w.el.querySelector('.lc-b').classList.remove('on');
        } else if (w.st === 'in' && sx > left + g * 0.2 && sx < right - g * 0.2) {
          w.st = 'on'; w.leaveAt = now + rnd(25000, 80000);
        }
        continue;
      }
      let v = w.v;
      for (const o of order) {
        if (o === w) continue;
        const ahead = (o.world - w.world) * w.dir;
        if (ahead <= 0 || ahead > g * 1.02) continue;
        const busy = talk && (o === talk.a || o === talk.b);
        if (!busy && !talk && now > chatAt && Math.abs((w.world + o.world) / 2 - cam) > Math.max(g, W * chatFrom * 0.85)) {
          const c = chatFor(w, o);
          if (c && Math.random() < 0.85) { startChat(w, o, c, now); break; }
          chatAt = now + 2500;
        }
        if (o.dir === w.dir && !busy) v = Math.min(v, o.v * 0.98);
        break;
      }
      if (talk && (w === talk.a || w === talk.b)) { w.moving = false; continue; }
      w.world += w.dir * v * dt * (k / 1.5);
      w.moving = true;
    }
    separate(g);
    const half = FR * k / 2;
    for (const w of onStage()) {
      const sx = w.world - cam;
      if (sx >= -half * 1.2 && sx <= W + half * 1.2) continue;
      if (talk && (w === talk.a || w === talk.b)) {
        talk.a.el.querySelector('.lc-b').classList.remove('on');
        talk.b.el.querySelector('.lc-b').classList.remove('on');
        talk.a.dir = talk.a.holdDir || talk.a.dir;
        talk.b.dir = talk.b.holdDir || talk.b.dir;
        talk = null;
      }
      w.st = 'off'; w.moving = false; w.el.style.visibility = 'hidden';
      w.backAt = now + rnd(2500, 9000);
      w.el.querySelector('.lc-b').classList.remove('on');
    }
  } else {
    const span = W / (walkers.length + 1);
    walkers.forEach((w, i) => { w.world = cam + span * (i + 1); w.moving = false; w.st = 'on'; w.el.style.visibility = ''; });
  }
  node.classList.toggle('talking', !!talk);
  for (const w of walkers) {
    const frames = w.frames || FRAMES;
    const step = frames > 4 ? 0.09 : 0.12;
    if (w.moving) { w.ft += dt; if (w.ft > step) { w.ft = 0; w.f = (w.f + 1) % frames; } } else w.f = 0;
    const s = w.el.firstChild;
    s.style.backgroundPosition = `${-Math.round(w.f * FR * k)}px 0`;
    s.style.transform = w.dir < 0 ? 'scaleX(-1)' : '';
    const sx = w.world - cam;
    w.el.style.transform = `translateX(${Math.round(sx - FR * k / 2)}px)`;
    const b = w.el.lastChild;
    if (b.classList.contains('on')) {
      const bwid = b.offsetWidth, lft = sx - bwid / 2;
      const shift = lft < 4 ? 4 - lft : (lft + bwid > W - 4 ? W - 4 - (lft + bwid) : 0);
      b.style.transform = `translateX(calc(-50% + ${Math.round(shift)}px))`;
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
