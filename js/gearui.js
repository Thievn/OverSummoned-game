// OverSummoned 3D cards: flip, card back (story / gear / era set) and classic item tooltips.
// Used by the homepage and the game. No game rules live here; the math is in fight.js.
import { GEAR, ERA_SETS, HERO_BASE, STAT_NAMES, SLOT_NAMES, BELT_SLOTS, slotKind } from './gear.js';
import { heroTotals, canEquip } from './fight.js';
import { portraitSrc, backSrc, iconFor } from './art.js';

const RN = {common:'Common', uncommon:'Uncommon', rare:'Rare', epic:'Epic', legendary:'Legendary', absurd:'Absurd', unhinged:'Unhinged'};
const SLOT_LABEL = {head:'Head', chest:'Chest', legs:'Legs', feet:'Boots', hands:'Gloves', neck:'Amulet', ring:'Ring', main:'Main hand', off:'Off hand', trinket:'Trinket', belt:'Belt'};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
export const itemIcon = (id) => { const it = GEAR[id]; if (!it) return iconFor(id, null); return iconFor(id, it.icon); };

const GLY = {
  head:'<path d="M5 13c0-4 3-7 7-7s7 3 7 7v3h-3v-3h-8v3H5z"/><path d="M11 3h2v3h-2z"/>',
  chest:'<path d="M8 4l4 2 4-2 4 3-2 4h-1v9H7v-9H6L4 7z"/>',
  legs:'<path d="M7 4h10l1 16h-4l-2-10-2 10H6z"/>',
  feet:'<path d="M8 4h5v9l6 2v4H6v-4l2-1z"/>',
  hands:'<path d="M8 20v-6L6 10l1-1 2 2V4h1.5v6h1V3h1.5v7h1V4H15v7h1V6h1.5v9l-2 5z"/>',
  neck:'<path d="M6 4c0 5 3 8 6 8s6-3 6-8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 12l3 4-3 4-3-4z"/>',
  ring:'<circle cx="12" cy="14" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 6h4l1 3h-6z"/>',
  main:'<path d="M18 3h3v3L10 17l-3-3z"/><path d="M5 15l4 4-2 1-3-3zM4 19l1 1-2 1z"/>',
  off:'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
  trinket:'<path d="M12 3l2.5 6 6 .5-4.6 4 1.5 6.5-5.4-3.4L6.6 20l1.5-6.5L3.5 9.5l6-.5z"/>',
  belt:'<path d="M10 3h4v3l3 4v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9l3-4z"/>'
};
const ICO = {
  bio:'<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h8l2 2v10H3z" opacity=".25"/><path d="M3 2h8l2 2v10H3zM4 3v10h8V5h-2V3z"/><path d="M5 6h6v1H5zM5 8h6v1H5zM5 10h4v1H5z"/></svg>',
  gear:'<svg viewBox="0 0 16 16" fill="currentColor"><path d="M7 1h2v2h2v1h1v1h1v4h-1v4h-2v-3H6v3H4V9H3V5h1V4h1V3h2z"/><path d="M5 6h6v2H5z" fill="#000" opacity=".55"/><path d="M7 3h2v3H7z" opacity=".5"/></svg>',
  set:'<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h9v1h1v9H4v-1H3V4H2z"/><path d="M4 4h7v8H5V5H4z" opacity=".35"/><path d="M12 3h2v2h-2zM2 12h2v2H2z"/><path d="M6 6h4v1H6zM6 8h4v1H6zM6 10h2v1H6z"/></svg>'
};
const FLIP = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8a5 5 0 0 1 9-3M13 8a5 5 0 0 1-9 3"/><path d="M12 2v3H9M4 14v-3h3"/></svg>';

let IDX = 0;
let SHOW_SETS = true;
// The public pages show gear but keep era sets for players to discover in the game.
export function setShowSets(v) { SHOW_SETS = !!v; }
function socket(id, slot, i, q, setIds) {
  const t = slotKind(slot);
  if (!id || !GEAR[id]) return `<button type="button" class="gs" data-slot="${slot}" style="--i:${i}" aria-label="Empty ${SLOT_LABEL[t]} slot"><svg class="ghost" viewBox="0 0 24 24" fill="currentColor">${GLY[t]}</svg></button>`;
  const it = GEAR[id]; const setp = setIds && setIds.includes(id) ? ' set-piece' : '';
  return `<button type="button" class="gs filled r-${it.rarity}${setp}" data-id="${id}" data-slot="${slot}" style="--i:${i};--sd:${(i * 0.37) % 4}s" aria-label="${esc(it.name)}"><span class="pip"></span><img src="${itemIcon(id)}" alt="">${q != null ? `<span class="q">${q}</span>` : ''}</button>`;
}

// hero: {id, name, title, rarity, era, back, backText, foot}. opt: {level, gear, belt qty map, z, flipped, view, id, mine}
export function cardHTML(hero, opt = {}) {
  const hid = hero.id; const G = opt.gear || {}; const S = opt.noSet ? null : ERA_SETS[hid]; const uid = opt.id || ('k' + (IDX++));
  const T = heroTotals(hid, opt.level || 1, G);
  const worn = Object.entries(G).filter(([k]) => !k.startsWith('belt')).map(([, v]) => v).filter(Boolean);
  const found = S ? S.items.filter(x => worn.includes(x)) : [];
  const on = !!S && found.length === S.items.length;
  let i = 0;
  const col = (a) => a.map(s => socket(G[s], s, i++, null, S ? S.items : [])).join('');
  const L = col(['head','chest','legs','feet']), Rr = col(['neck','ring1','ring2','hands']);
  const row = col(['main','off','trinket1','trinket2']);
  const stock = opt.stock || null;
  const belt = BELT_SLOTS.map(s => socket(G[s], s, i++, G[s] ? (stock ? (stock[G[s]] || 0) : (opt.beltQty && opt.beltQty[s]) ?? null) : null)).join('');
  const gg = T.gear;
  const sum = (gg.atk + gg.def + gg.hp) ? `<span class="sm">Attack <b>+${gg.atk}</b></span><span class="sg">Defense <b>+${gg.def}</b></span><span class="sk">Health <b>+${gg.hp}</b></span>` : `<span>Nothing worn yet</span>`;
  const ledger = S ? S.items.map(x => { const f = found.includes(x); const it = GEAR[x] || {name:x}; return `<button type="button" class="ls ${f ? 'found' : 'missing'}" data-id="${x}" data-set="1"><span class="sock"><img src="${itemIcon(x)}" alt=""></span><span class="nm">${esc(it.name)}</span><span class="st">${f ? 'Found' : 'Not found'}</span></button>`; }).join('') : '';
  const pips = [0,1,2].map(n => `<i class="${n < found.length ? 'on' : ''}"></i>`).join('');
  const r = hero.rarity;
  return `<div data-hero="${hid}" data-level="${opt.level || 1}" ${opt.mine ? 'data-mine="1"' : ''} class="flip3d ${opt.flipped ? 'flipped' : ''}" id="${uid}" style="--z:${opt.z || 1}" tabindex="0" role="button" aria-label="${esc(hero.name)} card, tap to flip">
  <div class="floor"></div>
  <div class="lift"><div class="tilt"><div class="f3">
   <div class="face front card r-${r}"><div class="card-in">
    <div class="card-top"><span class="gem"></span><span class="rar">${RN[r]}</span><span class="lvl">Lv ${opt.level || 1}</span></div>
    <div class="card-art"><img class="px" src="${portraitSrc(hid)}" alt="${esc(hero.name)}"></div>
    <div class="card-name h">${esc(hero.name)}</div><div class="card-title">${esc(hero.title)}</div>
    <div class="card-stats"><span class="s-str"><small>Attack</small><b>${T.total.atk}</b></span><span class="s-def"><small>Defense</small><b>${T.total.def}</b></span><span class="s-wit"><small>Health</small><b>${T.total.hp}</b></span></div>
    <div class="card-sub"><span>Speed <b>${T.total.spd}</b></span><span>Crit <b>${T.total.crit}%</b></span><span>Luck <b>${T.total.luck}</b></span></div>
    <div class="card-era">${esc(hero.era)}</div>
   </div><div class="glare"></div><span class="flip-hint">${FLIP}Flip</span></div>
   <div class="face back cardback r-${r}" data-view="${opt.view || 'bio'}"><div class="cb-in">
    <div class="cb-scene"><img class="gif" alt="" src="${backSrc(hid, hero.gif)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"><span class="cb-era">${esc(hero.era)}</span><div class="vig"></div>
      <div class="gcol l">${L}</div><div class="gcol r">${Rr}</div>
      ${S ? `<div class="ledger"><div class="lt">Ledger of Belongings</div><div class="ln">${esc(S.name)}</div><div class="row3">${ledger}</div></div>` : ''}
    </div>
    <div class="cbtabs" role="group" aria-label="Card back">
      <button type="button" class="tab" data-v="bio" aria-label="Story" aria-pressed="${(opt.view || 'bio') === 'bio'}">${ICO.bio}</button>
      <button type="button" class="tab" data-v="gear" aria-label="Gear" aria-pressed="${opt.view === 'gear'}">${ICO.gear}</button>
      ${S ? `<button type="button" class="tab" data-v="set" aria-label="Era set" aria-pressed="${opt.view === 'set'}">${ICO.set}</button>` : ''}
    </div>
    <div class="cb-low">
      <div class="layer bio">${hero.own && hero.bio ? `<div class="cb-bio">${esc(hero.bio)}</div>` : ''}<div class="cb-skill">${esc(hero.back)}</div><div class="cb-text">${esc(hero.backText)}</div><div class="cb-foot" style="margin-top:auto"><span>${esc(hero.foot || hero.perk || '')}</span><span>${RN[r]}</span></div></div>
      <div class="layer gear"><div class="gsum">${sum}</div><div class="grow">${row}</div><div class="belt"><span class="buckle"></span>${belt}<span class="lbl">Belt</span></div></div>
      ${S ? `<div class="layer set"><div class="bonus ${on ? 'on' : ''}"><div class="bh">${on ? 'Set bonus active' : 'Wear all 3'}<span class="pips">${pips}</span></div><div class="bn">${esc(S ? S.bonus : '')}</div><div class="bt">${esc(S ? S.text : '')}</div></div>
        <div class="bonus-wear" style="text-align:center;font:600 .95em 'Space Grotesk';color:var(--mut);margin-top:.55em">${on ? 'All three worn. The era remembers.' : found.length ? `${found.length} of 3 found. Keep delving.` : 'None found yet. They are out there.'}</div></div>` : ''}
    </div>
   </div><div class="glare"></div></div>
  </div></div></div></div>`;
}

// ---------- tooltip ----------
const PRIMARY = ['atk','def','hp'], SECOND = ['spd','crit','luck'];
const dps = (it) => it.dmg ? ((it.dmg[0] + it.dmg[1]) / 2 / it.speed) : 0;
export function coinsHTML(c) {
  c = Math.max(0, Math.floor(c || 0));
  const g = Math.floor(c / 10000), s = Math.floor(c % 10000 / 100), k = c % 100; let o = '';
  if (g) o += `${fmt(g)}<i class="coin g"></i>`; if (s || g) o += `${s}<i class="coin s"></i>`; o += `${k}<i class="coin c"></i>`; return o;
}
function secLine(k, v) {
  if (k === 'spd') return `Equip: Increases your Speed by ${v}, so you act sooner.`;
  if (k === 'crit') return `Equip: Increases your Crit Chance by ${v}%.`;
  if (k === 'luck') return `Equip: Increases your Luck by ${v}. Better loot drops.`;
  return '';
}
function slotType(it) {
  const left = it.slot === 'main' ? (it.hand || 'Main Hand') : it.slot === 'belt' ? 'Belt' : SLOT_NAMES[it.slot];
  const right = it.type && it.type !== left ? it.type : '';
  return `<div class="mt-row"><span>${esc(left)}</span><span>${esc(right)}</span></div>`;
}
export function tipBody(id, ctx = {}) {
  const it = GEAR[id]; if (!it) return '';
  let o = `<div class="mt-name" style="color:var(--mt-${it.rarity})">${esc(it.name)}</div>`;
  o += `<div class="mt-ilvl">Item Level ${it.ilvl || 1}</div>`;
  if (it.bind) o += `<div>${it.bind === 'pickup' ? 'Binds when picked up' : 'Binds when equipped'}</div>`;
  if (it.unique) o += `<div>Unique-Equipped</div>`;
  if (it.stack) o += `<div>Max Stack: ${it.stack}</div>`;
  o += slotType(it);
  if (it.dmg) o += `<div class="mt-row"><span>${it.dmg[0]} - ${it.dmg[1]} Damage</span><span>Speed ${Number(it.speed).toFixed(2)}</span></div><div>(${dps(it).toFixed(1)} damage per second)</div>`;
  if (it.armor) o += `<div>${fmt(it.armor)} Armor</div>`;
  if (it.block) o += `<div>${it.block} Block</div>`;
  const st = it.stats || {};
  PRIMARY.forEach(k => { if (st[k]) o += `<div>+${st[k]} ${STAT_NAMES[k]}</div>`; });
  SECOND.forEach(k => { if (st[k]) o += `<div class="mt-g">${secLine(k, st[k])}</div>`; });
  (it.equip || []).forEach(e => { o += `<div class="mt-g">Equip: ${esc(e)}</div>`; });
  if (it.use) o += `<div class="mt-g">Use: ${esc(it.use.text)}${it.use.cd ? ` (${esc(it.use.cd)})` : ''}</div>`;
  if (SHOW_SETS && it.set && ERA_SETS[it.set]) {
    const S = ERA_SETS[it.set]; const worn = ctx.worn || []; const have = S.items.filter(x => worn.includes(x)); const on = have.length === S.items.length;
    o += `<div class="mt-set"><div class="mt-sn">${esc(S.name)} (${have.length}/${S.items.length})</div>`;
    S.items.forEach(x => { o += `<div class="mt-si ${have.includes(x) ? 'own' : ''}">${esc((GEAR[x] || {name:x}).name)}</div>`; });
    o += `<div class="mt-sb ${on ? 'on' : ''}">(3) Set: ${esc(S.text)}</div></div>`;
  }
  if (it.req) { const bad = ctx.level && ctx.level < it.req; o += `<div class="${bad ? 'mt-red' : ''}">Requires Card Level ${it.req}</div>`; }
  if (it.sell) o += `<div class="mt-sell">Sell Price: ${coinsHTML(it.sell)}</div>`;
  if (it.flavor) o += `<div class="mt-flav">"${esc(it.flavor)}"</div>`;
  return o;
}
function diff(newId, oldId) {
  const a = GEAR[newId], b = GEAR[oldId]; if (!a || !b) return ''; const rows = [];
  const add = (label, v, dec) => { if (!v) return; rows.push(`<div class="${v > 0 ? 'mt-up' : 'mt-down'}">${v > 0 ? '+' : ''}${dec ? v.toFixed(1) : fmt(v)} ${label}</div>`); };
  if (a.dmg || b.dmg) add('Damage Per Second', dps(a) - dps(b), 1);
  add('Armor', (a.armor || 0) - (b.armor || 0));
  [...PRIMARY, ...SECOND].forEach(k => add(k === 'crit' ? 'Crit Chance (%)' : STAT_NAMES[k], ((a.stats || {})[k] || 0) - ((b.stats || {})[k] || 0)));
  return rows.length ? `<div class="mt-cmp"><div>If you replace this item, these stats change:</div>${rows.join('')}</div>` : '';
}
function emptyBody(slot) { const k = slotKind(slot); return `<div class="mt-name" style="color:#d9d9d9">${esc(SLOT_NAMES[k] || k)}</div><div class="mt-dim">Empty slot</div><div class="mt-flav">"Anything you find for this spot goes right here."</div>`; }

let root, back, cur = null;
const listeners = new Set();
export function onTipChange(fn) { listeners.add(fn); }
function emit() { listeners.forEach(fn => { try { fn(isOpen()); } catch (e) {} }); }
function ensure() {
  if (root) return;
  back = document.createElement('div'); back.className = 'mt-back';
  root = document.createElement('div'); root.className = 'mt-wrap'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Item details');
  document.body.append(back, root);
  back.addEventListener('click', hideTip);
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-equip]');
    if (!b) return;
    e.stopPropagation();
    const d = b.dataset;
    document.dispatchEvent(new CustomEvent('os-equip', {detail:{hero:d.hero, slot:d.slot, item:d.equip === '-' ? '' : d.equip}}));
    hideTip();
  });
}
const isPhone = () => matchMedia('(max-width: 719px)').matches;
export function isOpen() { return !!(root && root.classList.contains('on')); }

// ctx: {id, slot, hero, level, worn, compare, actions:[{label, hero, slot, item}], picker:[itemIds], tag}
export function showTip(anchor, ctx) {
  ensure(); cur = anchor;
  const panels = [];
  const {id, compare} = ctx;
  const acts = (ctx.actions || []).map(a => `<button type="button" class="mt-btn" data-equip="${a.item || '-'}" data-hero="${a.hero}" data-slot="${a.slot}">${esc(a.label)}</button>`).join('');
  if (id && GEAR[id]) panels.push(`<div class="mt r-${GEAR[id].rarity}">${ctx.tag ? `<div class="mt-tag">${esc(ctx.tag)}</div>` : compare ? '<div class="mt-tag">Just found</div>' : ''}${tipBody(id, ctx)}${compare ? diff(id, compare) : ''}${acts ? `<div class="mt-acts">${acts}</div>` : ''}</div>`);
  else {
    let pick = '';
    if (ctx.picker) {
      pick = ctx.picker.length ? `<div class="mt-pick">${ctx.picker.map(x => { const it = GEAR[x]; const why = canEquip(x, ctx.slot, ctx.hero, ctx.level, ctx.gearMap || {}); const stats = Object.entries(it.stats || {}).map(([k, v]) => `+${v} ${STAT_NAMES[k]}`).join(', ') || (it.use ? esc(it.use.text) : '');
        return `<button type="button" class="mt-pi" ${why ? 'disabled' : ''} data-equip="${x}" data-hero="${ctx.hero}" data-slot="${ctx.slot}"><img src="${itemIcon(x)}" alt=""><span><b style="color:var(--mt-${it.rarity})">${esc(it.name)}</b><small>${why ? esc(why) : stats}</small></span></button>`; }).join('')}</div>`
        : `<div class="mt-dim" style="margin-top:6px">Nothing in your bank fits here yet.</div>`;
    }
    panels.push(`<div class="mt">${emptyBody(ctx.slot)}${pick}</div>`);
  }
  if (compare && GEAR[compare]) panels.push(`<div class="mt eq r-${GEAR[compare].rarity}"><div class="mt-tag">Currently equipped</div>${tipBody(compare, ctx)}</div>`);
  const phone = isPhone();
  root.className = 'mt-wrap' + (phone ? ' sheet' : '') + (compare ? ' two' : '');
  root.innerHTML = (phone ? '<div class="mt-grip"></div>' : '') + `<div class="mt-panels">${phone ? panels.join('') : panels.slice().reverse().join('')}</div>`;
  back.classList.toggle('on', phone);
  root.classList.add('on');
  if (!phone) {
    const sr = anchor.getBoundingClientRect(), cr = (anchor.closest('.flip3d') || anchor).getBoundingClientRect();
    const w = root.offsetWidth, hh = root.offsetHeight, vw = innerWidth, vh = innerHeight;
    let x = cr.right + 12; if (x + w > vw - 8) x = cr.left - 12 - w; if (x < 8) x = Math.max(8, Math.min(vw - w - 8, cr.left + cr.width / 2 - w / 2));
    let y = sr.top - 8; y = Math.max(8, Math.min(vh - hh - 8, y));
    root.style.left = x + 'px'; root.style.top = y + 'px';
  } else { root.style.left = ''; root.style.top = ''; }
  emit();
}
export function hideTip() {
  if (!root || !root.classList.contains('on')) return false;
  root.classList.remove('on'); back.classList.remove('on');
  document.querySelectorAll('.gs.sel,.ls.sel').forEach(s => s.classList.remove('sel'));
  cur = null; emit(); return true;
}
addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTip(); });

// ---------- behaviour ----------
// provider(cardEl) -> {gear, level, bag, mine} lets the game offer Equip and Take off.
let provider = null;
export function setGearProvider(fn) { provider = fn; }
const hoverable = () => matchMedia('(hover:hover)').matches;
function wornOf(card) { const p = provider && provider(card); if (p) return Object.entries(p.gear || {}).filter(([k]) => !k.startsWith('belt')).map(([, v]) => v); return Array.from(card.querySelectorAll('.gcol .gs.filled,.grow .gs.filled')).map(b => b.dataset.id); }
function tipFor(card, btn) {
  document.querySelectorAll('.gs.sel,.ls.sel').forEach(s => s.classList.remove('sel')); btn.classList.add('sel');
  const hid = card ? card.dataset.hero : btn.dataset.hero;
  const p = card && provider ? provider(card) : null;
  const level = p ? p.level : (card ? +card.dataset.level : 1);
  const ctx = {id: btn.dataset.id, slot: btn.dataset.slot, hero: hid, level, worn: card ? wornOf(card) : [], compare: btn.dataset.cmp || null};
  if (p && p.mine && btn.dataset.slot && !btn.dataset.set) {
    const slot = btn.dataset.slot; const kind = slotKind(slot);
    if (btn.dataset.id) ctx.actions = [{label: kind === 'belt' ? 'Take it off the belt' : 'Take it off', hero: hid, slot, item: ''}];
    else ctx.picker = Object.keys(p.bag || {}).filter(x => GEAR[x] && GEAR[x].slot === kind && (p.bag[x] || 0) > 0);
    ctx.gearMap = p.gear || {};
  }
  showTip(btn, ctx);
}
export function flipCard(c) { c.classList.remove('lifting'); void c.offsetWidth; c.classList.add('lifting'); c.classList.toggle('flipped'); hideTip(); setTimeout(() => c.classList.remove('lifting'), 800); c.dispatchEvent(new CustomEvent('os-flip', {bubbles: true, detail: {flipped: c.classList.contains('flipped')}})); }
function setTabs(back) { back.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-pressed', String(t.dataset.v === back.dataset.view))); }

let bound = false;
export function bindCards() {
  if (bound) return; bound = true;
  document.addEventListener('click', (e) => {
    const c = e.target.closest('.flip3d');
    if (!c) {
      const d = e.target.closest('[data-tip-item]');
      if (d && !d.dataset.act && GEAR[d.dataset.tipItem] && !hoverable()) { if (d.classList.contains('sel') && isOpen()) { hideTip(); return; } d.classList.add('sel'); showTip(d, {id: d.dataset.tipItem, worn: []}); return; }
      if (!e.target.closest('.mt-wrap')) hideTip(); return;
    }
    if (c.closest('[data-dragged="1"]')) return;
    const back = c.querySelector('.back');
    const tab = e.target.closest('.tab'), slot = e.target.closest('.gs,.ls');
    if (tab) { e.stopPropagation(); hideTip(); back.dataset.view = back.dataset.view === tab.dataset.v && tab.dataset.v !== 'bio' ? 'bio' : tab.dataset.v; setTabs(back); c.dispatchEvent(new CustomEvent('os-view', {bubbles: true, detail: {view: back.dataset.view}})); return; }
    if (slot && c.classList.contains('flipped')) { e.stopPropagation(); if (slot.classList.contains('sel')) { if (!hoverable() || (provider && provider(c) && provider(c).mine)) hideTip(); return; } tipFor(c, slot); return; }
    if (hideTip()) return;
    flipCard(c);
  });
  document.addEventListener('keydown', (e) => { const c = e.target.closest && e.target.closest('.flip3d'); if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); flipCard(c); } });
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const c = e.target.closest && e.target.closest('.flip3d'); if (!c) return;
    const tilt = c.querySelector('.tilt'); const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.classList.add('hovering'); tilt.style.setProperty('--ry', ((px - .5) * 20) + 'deg'); tilt.style.setProperty('--rx', ((.5 - py) * 16) + 'deg');
    c.style.setProperty('--gx', px * 100 + '%'); c.style.setProperty('--gy', py * 100 + '%');
  });
  document.addEventListener('pointerout', (e) => {
    const c = e.target.closest && e.target.closest('.flip3d'); if (!c || (e.relatedTarget && c.contains(e.relatedTarget))) return;
    c.classList.remove('hovering'); const tilt = c.querySelector('.tilt'); tilt.style.setProperty('--ry', '0deg'); tilt.style.setProperty('--rx', '0deg');
  });
  document.addEventListener('mouseover', (e) => {
    if (!hoverable()) return;
    const d = e.target.closest && e.target.closest('.flip3d .gs,.flip3d .ls,[data-tip-item]');
    if (!d || (e.relatedTarget && d.contains(e.relatedTarget))) return;
    const c = d.closest('.flip3d');
    if (c && !c.classList.contains('flipped')) return;
    if (c && provider && provider(c) && provider(c).mine && !d.dataset.id) return;
    if (d.dataset.tipItem) { if (!GEAR[d.dataset.tipItem]) return; d.classList.add('sel'); showTip(d, {id: d.dataset.tipItem, compare: d.dataset.cmp || null, hero: d.dataset.hero, level: +d.dataset.level || 0, worn: []}); return; }
    tipFor(c, d);
  });
  document.addEventListener('mouseout', (e) => {
    if (!hoverable()) return;
    const d = e.target.closest && e.target.closest('.flip3d .gs,.flip3d .ls,[data-tip-item]');
    if (!d || (e.relatedTarget && (d.contains(e.relatedTarget) || (root && root.contains(e.relatedTarget))))) return;
    const c = d.closest('.flip3d');
    if (c && provider && provider(c) && provider(c).mine) return; // game cards keep the tooltip open for the buttons
    hideTip();
  });
}
export { RN as RARITY_LABEL };
