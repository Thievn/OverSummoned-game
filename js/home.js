// Homepage: Will's 3D card, the nine-card row, and the screenshot lightbox.
import { HEROES, HERO_ORDER } from './catalog.js';
import { EXAMPLE_GEAR } from './gear.js';
import { cardHTML, bindCards, onTipChange, isOpen, hideTip } from './gearui.js';

const LEVELS = {will_slapton:7, legionary:6, gangster:5, engineer:5, plague_doctor:4, paramedic:4, hunter:3, office_worker:3, delivery_rider:2};
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

bindCards();

// Will, front and back, kitted out.
const will = document.getElementById('home-will');
if (will) will.innerHTML = cardHTML(HEROES.will_slapton, {level: 7, gear: EXAMPLE_GEAR.will_slapton, z: 1.05, view: 'gear', id: 'home-will-card'});

// ---------- the nine ----------
const reel = document.getElementById('reel');
if (reel) {
  const item = (id, n) => `<div class="reel-item" ${n ? 'aria-hidden="true"' : ''}>${cardHTML(HEROES[id], {level: LEVELS[id] || 1, gear: EXAMPLE_GEAR[id] || {}, z: 1.12, flipped: true, view: 'gear', id: 'reel-' + id + (n ? '-' + n : '')})}<small>${HEROES[id].name} · ${HEROES[id].rarity[0].toUpperCase() + HEROES[id].rarity.slice(1)}</small></div>`;
  const one = HERO_ORDER.map(id => item(id, 0)).join('');
  reel.innerHTML = `<div class="reel-track">${one}${HERO_ORDER.map(id => item(id, 1)).join('')}</div>`;
  reel.classList.add('auto');
  const track = reel.firstElementChild;
  let pausedUntil = 0, hover = false, touching = false, dragging = null, last = performance.now(), pos = 0;
  const half = () => track.scrollWidth / 2;
  const wrap = () => { const h = half(); if (h <= 0) return; if (reel.scrollLeft >= h) reel.scrollLeft -= h; else if (reel.scrollLeft < 1) reel.scrollLeft += h; };
  const paused = () => hover || touching || dragging || isOpen() || performance.now() < pausedUntil || document.hidden;
  const speed = 22; // pixels a second: slow and steady
  function frame(now) {
    const dt = Math.min(64, now - last); last = now;
    if (!reduce && !paused()) { pos += speed * dt / 1000; const step = Math.floor(pos); if (step) { reel.scrollLeft += step; pos -= step; wrap(); } }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame((t) => { last = t; reel.scrollLeft = 1; requestAnimationFrame(frame); });
  reel.addEventListener('mouseenter', () => { hover = true; });
  reel.addEventListener('mouseleave', () => { hover = false; });
  reel.addEventListener('touchstart', () => { touching = true; }, {passive: true});
  reel.addEventListener('touchend', () => { touching = false; pausedUntil = performance.now() + 2500; wrap(); }, {passive: true});
  reel.addEventListener('scroll', () => { if (touching || dragging) wrap(); }, {passive: true});
  reel.addEventListener('os-flip', () => { pausedUntil = performance.now() + 6000; });
  reel.addEventListener('os-view', () => { pausedUntil = performance.now() + 6000; });
  onTipChange((open) => { if (!open) pausedUntil = performance.now() + 1500; });
  // A vertical wheel scrolls the row sideways.
  reel.addEventListener('wheel', (e) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    e.preventDefault(); hideTip();
    reel.scrollLeft += d; wrap(); pausedUntil = performance.now() + 2500;
  }, {passive: false});
  // Click and drag with a mouse.
  reel.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = {x: e.clientX, left: reel.scrollLeft, moved: false};
  });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.x;
    if (Math.abs(dx) > 5 && !dragging.moved) { dragging.moved = true; reel.classList.add('dragging'); hideTip(); }
    if (dragging.moved) { reel.scrollLeft = dragging.left - dx; if (reel.scrollLeft >= half()) { reel.scrollLeft -= half(); dragging.left -= half(); } else if (reel.scrollLeft < 1) { reel.scrollLeft += half(); dragging.left += half(); } }
  });
  addEventListener('pointerup', () => {
    if (!dragging) return;
    if (dragging.moved) { reel.dataset.dragged = '1'; setTimeout(() => { delete reel.dataset.dragged; }, 60); }
    dragging = null; reel.classList.remove('dragging'); pausedUntil = performance.now() + 2500;
  });
  reel.addEventListener('dragstart', (e) => e.preventDefault());
}

// ---------- screenshot lightbox ----------
const shots = Array.from(document.querySelectorAll('figure.frame img'));
if (shots.length) {
  const box = document.createElement('div');
  box.className = 'lb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Screenshot'); box.hidden = true;
  box.innerHTML = `<div class="lb-stage"><img alt=""><div class="lb-cap"></div></div>
<button type="button" class="lb-x" aria-label="Close">&times;</button>
<button type="button" class="lb-nav lb-prev" aria-label="Previous screenshot">&#8249;</button>
<button type="button" class="lb-nav lb-next" aria-label="Next screenshot">&#8250;</button>
<div class="lb-count"></div>`;
  document.body.appendChild(box);
  const img = box.querySelector('img'), cap = box.querySelector('.lb-cap'), count = box.querySelector('.lb-count');
  let at = 0, opener = null;
  const show = (i) => { at = (i + shots.length) % shots.length; img.src = shots[at].currentSrc || shots[at].src; img.alt = shots[at].alt; cap.textContent = shots[at].alt; count.textContent = (at + 1) + ' / ' + shots.length; };
  const open = (i, from) => { opener = from || null; show(i); box.hidden = false; requestAnimationFrame(() => box.classList.add('on')); document.documentElement.classList.add('lb-open'); box.querySelector('.lb-x').focus(); };
  const close = () => { box.classList.remove('on'); document.documentElement.classList.remove('lb-open'); setTimeout(() => { box.hidden = true; }, 180); if (opener) opener.focus(); };
  shots.forEach((s, i) => {
    const fig = s.closest('figure');
    fig.classList.add('zoomable');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'zoom'; b.setAttribute('aria-label', 'Open this screenshot larger'); b.innerHTML = '<span>+</span>';
    fig.appendChild(b);
    b.addEventListener('click', () => open(i, b));
    s.addEventListener('click', () => open(i, b));
  });
  box.addEventListener('click', (e) => {
    if (e.target.closest('.lb-x')) return close();
    if (e.target.closest('.lb-prev')) return show(at - 1);
    if (e.target.closest('.lb-next')) return show(at + 1);
    if (!e.target.closest('.lb-stage img')) close();
  });
  addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(at - 1);
    else if (e.key === 'ArrowRight') show(at + 1);
  });
  let sx = null, sy = 0;
  box.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, {passive: true});
  box.addEventListener('touchend', (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(at + (dx < 0 ? 1 : -1));
  }, {passive: true});
}
