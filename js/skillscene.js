// A walking skill scene: a looping backdrop and floor, a hero on the ground,
// unique trees or rocks for the spot you picked, a room that gains furniture
// as you level, and a short flash when you find something good.
// Positions snap to whole pixels so nothing ripples.
import {walkSrc} from './art.js';

const FR = 64, FALLBACK = 'engineer';
const SCROLL = 16;

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
    {src:'/assets/gen/sks/smith_armor.png', at:60, x:0.5104, y:0.5806, w:24/ROOM_W},
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
  sprite.style.width = FR * k + 'px';
  sprite.style.height = FR * k + 'px';
  sprite.style.backgroundSize = `${FR * frames * k}px ${FR * k}px`;
  walkEl.style.bottom = Math.round(floorH) + 'px';
}

function measure() {
  const r = node.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  W = r.width; H = r.height;
  k = Math.max(1, Math.min(2.2, H * 0.42 / FR));
  sizeHero();
  return true;
}

function applyScene(opts) {
  const sk = opts.skill, id = opts.node || '';
  const lv = opts.level || 1;
  const changed = sk !== skill || id !== spot || lv !== level;
  skill = sk; spot = id; level = lv;
  still = !!opts.still;
  moving = !!opts.active && !still;

  isRoom = !!FURN[sk];
  let bg = '/assets/gen/scene_' + sk + '.png';
  let floor = '';
  if (sk === 'mining') { bg = '/assets/gen/sks/bg_mine.png'; floor = '/assets/gen/sks/floor_mine.png'; }
  else if (sk === 'woodcutting') { bg = '/assets/gen/sks/bg_wood.png'; floor = '/assets/gen/sks/floor_wood.png'; }
  else if (sk === 'fishing') bg = FISH_BG[id] || FISH_BG.eel;
  bgEl.style.backgroundImage = `url(${bg})`;
  bgEl.style.backgroundRepeat = isRoom ? 'no-repeat' : 'repeat-x';
  if (floor) {
    floorEl.style.display = '';
    floorEl.style.backgroundImage = `url(${floor})`;
    floorH = Math.max(10, Math.round(H * 0.12));
  } else {
    floorEl.style.display = 'none';
    floorH = Math.round(H * 0.08);
  }
  walkEl.style.bottom = floorH + 'px';

  // resource props
  if (changed) {
    propLayer.textContent = '';
    const src = PROP[id];
    if (src) {
      const count = sk === 'woodcutting' || sk === 'mining' ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('img');
        p.className = 'sks-prop';
        p.src = src;
        p.alt = '';
        const isTree = sk === 'woodcutting';
        p.style.width = (isTree ? 120 : 88) + 'px';
        p.style.left = (18 + i * 28) + '%';
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
      hut.style.width = '110px';
      propLayer.appendChild(hut);
    }
    // furniture
    furnLayer.textContent = '';
    const list = FURN[sk] || [];
    for (const it of list) {
      const p = document.createElement('img');
      p.className = 'sks-furn-item';
      p.src = it.src;
      p.alt = '';
      p.style.left = (it.x * 100) + '%';
      p.style.top = (it.y * 100) + '%';
      if (it.w) p.style.width = (it.w * 100) + '%';
      if (it.flip) p.style.transform = 'scaleX(-1)';
      p.style.opacity = lv >= it.at ? '1' : '0';
      furnLayer.appendChild(p);
    }
  } else {
    [...furnLayer.children].forEach((p, i) => {
      const it = (FURN[sk] || [])[i];
      if (it) p.style.opacity = lv >= it.at ? '1' : '0';
    });
  }

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

  if (!still && !isRoom) cam += SCROLL * (k / 1.5) * dt;
  const camPx = Math.round(cam);
  if (isRoom) {
    bgEl.style.backgroundSize = '100% 100%';
    bgEl.style.backgroundPosition = '0 0';
    propLayer.style.transform = '';
  } else {
    const bgW = Math.round(Math.max(W * 1.4, H * 2.2));
    const bgH = Math.round(H);
    bgEl.style.backgroundSize = `${bgW}px ${bgH}px`;
    bgEl.style.backgroundPosition = `${-Math.round(((camPx % bgW) + bgW) % bgW)}px 0`;
    propLayer.style.transform = `translateX(${-Math.round((camPx * 0.85) % Math.max(W, 1))}px)`;
  }
  if (floorEl.style.display !== 'none') {
    const flW = Math.round(bgW);
    floorEl.style.backgroundSize = `${flW}px ${Math.round(floorH)}px`;
    floorEl.style.backgroundPosition = `${-Math.round(((camPx % flW) + flW) % flW)}px 100%`;
    floorEl.style.height = Math.round(floorH) + 'px';
  }

  if (moving) {
    x += dir * v * dt * (k / 1.5);
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
