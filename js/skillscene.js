// A walking skill scene: a looping backdrop and floor, a hero on the ground,
// unique trees or rocks for the spot you picked, a room that gains furniture
// as you level, and a short flash when you find something good.
// Positions snap to whole pixels so nothing ripples. Room art keeps square
// pixels: it is scaled evenly, then letterboxed or cropped, never stretched.
import {walkSrc} from './art.js';

const FR = 64, FALLBACK = 'engineer';
const SCROLL = 16;
const FIRST = {
  mining: 'copper', woodcutting: 'ash', fishing: 'eel',
  cooking: 'stew', smithing: 'iron', alchemy: 'draught', summoning: 'whisper'
};

const HERO_FOR = {
  mining: 'engineer', woodcutting: 'hunter', fishing: 'delivery_rider',
  cooking: 'paramedic', smithing: 'legionary', alchemy: 'plague_doctor', summoning: 'office_worker'
};

const PROP = {
  copper: '/assets/gen/rock_copper.png', iron: '/assets/gen/rock_iron.png',
  moonsilver: '/assets/gen/rock_moon.png', ember: '/assets/gen/rock_ember.png',
  void: '/assets/gen/rock_void.png', starfall: '/assets/gen/rock_star.png',
  ash: '/assets/gen/sks/tree_ash.png', ironbark: '/assets/gen/sks/tree_ironbark.png',
  moonwood: '/assets/gen/sks/tree_moonwood.png', emberroot: '/assets/gen/sks/tree_emberroot.png',
  voidtrunk: '/assets/gen/sks/tree_voidtrunk.png'
};

const FISH_BG = {
  eel: '/assets/gen/sks/fishing_eel.png',
  lantern: '/assets/gen/sks/fishing_lantern.png',
  ashpond: '/assets/gen/sks/fishing_ashpond.png',
  deep: '/assets/gen/sks/fishing_deep.png'
};

const ROOM_W = 384;
const FURN = {
  cooking: [
    {src:'/assets/gen/sks/cook_herbs.png', at:10, x:0.2812, y:0.0000, w:16/ROOM_W},
    {src:'/assets/gen/sks/cook_basket.png', at:20, x:0.5208, y:0.8548, w:22/ROOM_W},
    {src:'/assets/gen/sks/cook_stool.png', at:30, x:0.4375, y:0.8387, w:16/ROOM_W},
    {src:'/assets/gen/sks/cook_board.png', at:40, x:0.1823, y:0.4677, w:22/ROOM_W},
    {src:'/assets/gen/sks/cook_sack.png', at:50, x:0.0208, y:0.8548, w:14/ROOM_W},
    {src:'/assets/gen/sks/cook_pantry.png', at:60, x:0.8385, y:0.1290, w:40/ROOM_W},
    {src:'/assets/gen/sks/cook_crate.png', at:70, x:0.7604, y:0.8710, w:18/ROOM_W},
    {src:'/assets/gen/sks/cook_lamp.png', at:80, x:0.6406, y:0.0161, w:12/ROOM_W},
    {src:'/assets/gen/sks/cook_pot.png', at:90, x:0.5885, y:0.8710, w:16/ROOM_W}
  ],
  smithing: [
    {src:'/assets/gen/sks/smith_shield.png', at:10, x:0.0156, y:0.1452, w:16/ROOM_W},
    {src:'/assets/gen/sks/smith_tub.png', at:20, x:0.4557, y:0.8710, w:20/ROOM_W},
    {src:'/assets/gen/sks/smith_barrel.png', at:30, x:0.0156, y:0.8387, w:14/ROOM_W},
    {src:'/assets/gen/sks/smith_swords.png', at:40, x:0.4375, y:0.0484, w:28/ROOM_W},
    {src:'/assets/gen/sks/smith_shoes.png', at:50, x:0.3906, y:0.9032, w:18/ROOM_W},
    // Parked on the right, out of the walking lane in front of the forge.
    {src:'/assets/gen/sks/smith_armor.png', at:60, x:0.8200, y:0.5806, w:24/ROOM_W},
    {src:'/assets/gen/sks/smith_hammer.png', at:70, x:0.3906, y:0.0484, w:14/ROOM_W},
    {src:'/assets/gen/sks/smith_barrel.png', at:80, x:0.5990, y:0.8387, w:14/ROOM_W},
    {src:'/assets/gen/sks/smith_lean.png', at:90, x:0.3281, y:0.6613, w:16/ROOM_W}
  ],
  alchemy: [
    {src:'/assets/gen/sks/alch_herbs.png', at:10, x:0.4792, y:0.0000, w:16/ROOM_W},
    {src:'/assets/gen/sks/alch_books.png', at:20, x:0.0104, y:0.8741, w:18/ROOM_W},
    {src:'/assets/gen/sks/alch_box.png', at:30, x:0.5208, y:0.8889, w:16/ROOM_W},
    {src:'/assets/gen/sks/alch_stool.png', at:40, x:0.4167, y:0.8593, w:14/ROOM_W},
    {src:'/assets/gen/sks/alch_pot.png', at:50, x:0.5573, y:0.8593, w:16/ROOM_W},
    {src:'/assets/gen/sks/alch_scrolls.png', at:60, x:0.2604, y:0.8148, w:16/ROOM_W},
    {src:'/assets/gen/sks/alch_lamp.png', at:70, x:0.4844, y:0.0000, w:12/ROOM_W},
    {src:'/assets/gen/sks/alch_barrel.png', at:80, x:0.9375, y:0.8593, w:14/ROOM_W},
    {src:'/assets/gen/sks/alch_flower.png', at:90, x:0.6510, y:0.8296, w:12/ROOM_W}
  ]
};

let node = null, bgEl, floorEl, propLayer, furnLayer, walkEl, sprite, fxEl, bobEl;
let raf = 0, last = 0, still = false;
let W = 0, H = 0, k = 1.5, cam = 0, floorH = 0;
let skill = '', spot = '', heroId = '', level = 0, finds = 0, moving = false;
let x = 0, dir = 1, v = 28, f = 0, ft = 0, frames = 4, hopping = 0, primed = false, isRoom = false;
let lay = {s: 1, dw: 384, dh: 160, ox: 0, oy: 0};

function build() {
  node = document.createElement('div');
  node.className = 'sks';
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = [
    '<div class="sks-bg"></div>',
    '<div class="sks-floor"></div>',
    '<div class="sks-furn"></div>',
    '<div class="sks-props"></div>',
    '<div class="sks-bob"></div>',
    '<div class="sks-w"><div class="sks-s"></div></div>',
    '<div class="sks-fx"><img src="/assets/gen/sks/crit.png" alt=""></div>'
  ].join('');
  bgEl = node.querySelector('.sks-bg');
  floorEl = node.querySelector('.sks-floor');
  furnLayer = node.querySelector('.sks-furn');
  propLayer = node.querySelector('.sks-props');
  bobEl = node.querySelector('.sks-bob');
  walkEl = node.querySelector('.sks-w');
  sprite = node.querySelector('.sks-s');
  fxEl = node.querySelector('.sks-fx');
}

function artSize(sk, id) {
  if (sk === 'cooking' || sk === 'smithing') return {w: 384, h: 124, floor: 16};
  if (sk === 'alchemy') return {w: 384, h: 135, floor: 18};
  if (sk === 'mining') return {w: 384, h: 160, floor: 36};
  if (sk === 'woodcutting') return {w: 380, h: 136, floor: 24};
  if (sk === 'fishing') return {w: 384, h: id === 'eel' ? 125 : 160, floor: 20};
  return {w: 384, h: 160, floor: 16};
}

// Whole-number scale when crop and letterbox stay modest; otherwise a uniform
// cover scale so pixels stay square (never stretch X and Y apart).
function fitScale(rw, rh) {
  if (!W || !H) return 1;
  const cover = Math.max(W / rw, H / rh);
  const contain = Math.min(W / rw, H / rh);
  const cand = [Math.round(contain), Math.floor(contain), Math.round(cover), Math.ceil(cover), Math.floor(cover)];
  let best = null, bestScore = 0.35;
  for (const i of cand) {
    if (!Number.isInteger(i) || i < 1) continue;
    const cropW = Math.max(0, (i * rw - W) / Math.max(i * rw, 1));
    const cropH = Math.max(0, (i * rh - H) / Math.max(i * rh, 1));
    const barW = Math.max(0, (W - i * rw) / W);
    const barH = Math.max(0, (H - i * rh) / H);
    if (cropW > 0.45 || cropH > 0.45 || barW > 0.4 || barH > 0.4) continue;
    const score = cropW + cropH + 0.6 * (barW + barH);
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return best || cover;
}

function layout() {
  const art = artSize(skill, spot);
  const s = isRoom ? fitScale(art.w, art.h) : (H ? H / art.h : 1);
  const dw = art.w * s, dh = art.h * s;
  const ox = (W - dw) / 2;
  const oy = H - dh;
  floorH = Math.round(art.floor * s);
  lay = {s, dw, dh, ox, oy, art};
  return lay;
}

function setSheet(id) {
  const src = walkSrc(id);
  const img = new Image();
  img.onload = () => {
    frames = Math.max(1, Math.round(img.naturalWidth / FR));
    sprite.style.backgroundImage = `url(${src})`;
    sizeHero();
  };
  img.src = src;
  heroId = id;
}

function sizeHero() {
  if (!sprite) return;
  const kk = k;
  sprite.style.width = FR * kk + 'px';
  sprite.style.height = FR * kk + 'px';
  sprite.style.backgroundSize = `${FR * frames * kk}px ${FR * kk}px`;
  walkEl.style.bottom = Math.round(floorH) + 'px';
}

function measure() {
  const r = node.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  W = r.width; H = r.height;
  layout();
  const cap = Math.max(1, Math.floor((H * 0.85) / FR));
  k = Math.max(1, Math.min(cap, Math.round(lay.s)));
  sizeHero();
  return true;
}

function placeFurniture() {
  const list = FURN[skill] || [];
  const {dw, dh, ox, oy} = lay;
  [...furnLayer.children].forEach((p, i) => {
    const it = list[i];
    if (!it) return;
    p.style.left = Math.round(ox + it.x * dw) + 'px';
    p.style.top = Math.round(oy + it.y * dh) + 'px';
    if (it.w) p.style.width = Math.round(it.w * dw) + 'px';
    p.style.opacity = level >= it.at ? '1' : '0';
  });
}

function applyScene(opts) {
  const sk = opts.skill;
  const id = opts.node || FIRST[sk] || '';
  const lv = opts.level || 1;
  const changed = sk !== skill || id !== spot || lv !== level;
  skill = sk; spot = id; level = lv;
  still = !!opts.still;
  moving = !!opts.active && !still;

  isRoom = !!FURN[sk];
  layout();
  let bg = '/assets/gen/scene_' + sk + '.png';
  let floor = '';
  if (sk === 'mining') { bg = '/assets/gen/sks/bg_mine.png'; floor = '/assets/gen/sks/floor_mine.png'; }
  else if (sk === 'woodcutting') { bg = '/assets/gen/sks/bg_wood.png'; floor = '/assets/gen/sks/floor_wood.png'; }
  else if (sk === 'fishing') { bg = FISH_BG[id] || FISH_BG.eel; floor = '/assets/gen/sks/floor_fish.png'; }
  bgEl.style.backgroundImage = `url(${bg})`;
  bgEl.style.backgroundRepeat = isRoom ? 'no-repeat' : 'repeat-x';
  if (floor) {
    floorEl.style.display = '';
    floorEl.style.backgroundImage = `url(${floor})`;
    floorEl.style.backgroundRepeat = 'repeat-x';
  } else {
    floorEl.style.display = 'none';
  }
  walkEl.style.bottom = Math.round(floorH) + 'px';

  if (changed) {
    propLayer.textContent = '';
    const src = PROP[id];
    if (src) {
      const count = sk === 'woodcutting' || sk === 'mining' ? 3 : 1;
      const isTree = sk === 'woodcutting';
      for (let i = 0; i < count; i++) {
        const p = document.createElement('img');
        p.className = 'sks-prop';
        p.src = src;
        p.alt = '';
        p.dataset.slot = String(i);
        p.style.left = (14 + i * 30) + '%';
        propLayer.appendChild(p);
      }
    }
    if (sk === 'woodcutting') {
      const hut = document.createElement('img');
      hut.className = 'sks-prop sks-hut';
      hut.src = '/assets/gen/sks/prop_sawmill.png';
      hut.alt = '';
      hut.style.right = '4%';
      hut.style.left = 'auto';
      propLayer.appendChild(hut);
    }
    furnLayer.textContent = '';
    const list = FURN[sk] || [];
    for (const it of list) {
      const p = document.createElement('img');
      p.className = 'sks-furn-item';
      p.src = it.src;
      p.alt = '';
      if (it.flip) p.style.transform = 'scaleX(-1)';
      furnLayer.appendChild(p);
    }
  }
  placeFurniture();
  const treeW = Math.round(130 * lay.s);
  const rockW = Math.round(64 * Math.max(1.2, lay.s));
  [...propLayer.querySelectorAll('.sks-prop')].forEach(p => {
    if (p.classList.contains('sks-hut')) p.style.width = Math.round(110 * Math.max(1, lay.s * 0.7)) + 'px';
    else p.style.width = (skill === 'woodcutting' ? treeW : rockW) + 'px';
  });

  bobEl.style.display = sk === 'fishing' && moving ? '' : 'none';

  const hid = opts.hero || HERO_FOR[sk] || FALLBACK;
  if (hid !== heroId) setSheet(hid);
  else sizeHero();

  const nextFinds = opts.finds || 0;
  if (primed && nextFinds > finds) flash();
  finds = nextFinds;
  primed = true;
}

function flash() {
  fxEl.classList.remove('on'); void fxEl.offsetWidth; fxEl.classList.add('on');
  hopping = 0.35;
}

function frame(now) {
  raf = 0;
  if (!node || !node.isConnected) return;
  if (!measure()) { raf = requestAnimationFrame(frame); return; }
  const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;

  if (!still && !isRoom) cam += SCROLL * (lay.s || 1) * dt;
  const camPx = Math.round(cam);
  const bgW = Math.round(lay.dw);
  const bgH = Math.round(lay.dh);
  const ox = Math.round(lay.ox), oy = Math.round(lay.oy);
  bgEl.style.backgroundSize = `${bgW}px ${bgH}px`;
  if (isRoom) {
    bgEl.style.backgroundPosition = `${ox}px ${oy}px`;
    propLayer.style.transform = '';
  } else {
    const shift = bgW ? ((camPx % bgW) + bgW) % bgW : 0;
    bgEl.style.backgroundPosition = `${ox - Math.round(shift)}px ${oy}px`;
    propLayer.style.transform = `translateX(${-Math.round((camPx * 0.85) % Math.max(W, 1))}px)`;
  }
  if (floorEl.style.display !== 'none') {
    const flW = bgW;
    floorEl.style.backgroundSize = `${flW}px ${Math.round(floorH)}px`;
    const shift = flW ? ((camPx % flW) + flW) % flW : 0;
    floorEl.style.backgroundPosition = `${ox - Math.round(shift)}px 100%`;
    floorEl.style.height = Math.round(floorH) + 'px';
  }
  placeFurniture();

  if (moving) {
    x += dir * v * dt * Math.max(0.8, lay.s / 1.5);
    const half = FR * k / 2;
    if (x > W + half) x = -half;
    if (x < -half) x = W + half;
    const step = frames > 4 ? 0.09 : 0.12;
    ft += dt; if (ft > step) { ft = 0; f = (f + 1) % frames; }
  } else f = 0;

  if (hopping > 0) hopping = Math.max(0, hopping - dt);
  const hop = hopping > 0 ? Math.round(Math.sin((0.35 - hopping) / 0.35 * Math.PI) * 10) : 0;
  sprite.style.backgroundPosition = `${-Math.round(f * FR * k)}px 0`;
  sprite.style.transform = dir < 0 ? 'scaleX(-1)' : '';
  walkEl.style.transform = `translateX(${Math.round(x - FR * k / 2)}px) translateY(${-hop}px)`;
  walkEl.style.bottom = Math.round(floorH) + 'px';

  if (skill === 'fishing' && moving) {
    const bx = Math.round(W * 0.62);
    bobEl.style.left = bx + 'px';
    bobEl.style.bottom = Math.round(floorH + 18 + Math.sin(now / 400) * 3) + 'px';
  }

  if (!still || !document.hidden) raf = requestAnimationFrame(frame);
}

export function mountSkillScene(el, opts) {
  if (!el) { if (raf) cancelAnimationFrame(raf); raf = 0; primed = false; finds = 0; return; }
  if (!node) build();
  if (node.parentNode !== el) el.appendChild(node);
  measure();
  applyScene(opts || {});
  last = 0;
  if (x === 0) x = (W || 400) * 0.35;
  if (!raf) raf = requestAnimationFrame(frame);
}
