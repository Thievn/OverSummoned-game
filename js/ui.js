import {
  HEROES, HERO_ORDER, ITEMS, SKILLS, NODES, NAV_CITY, NAV_ADV, MASTERY, DELVE_LENGTHS,
  FLOORS, HUSTLES, CITIES, SETS, RARITY_NAME, itemSrc, levelFromXp
} from './catalog.js';
import { skillLevel, poolPct, intervalMs, hustleLevel, fightAt } from './engine.js';
import { heroTotals, coins } from './fight.js';
import { GEAR, STAT_NAMES } from './gear.js';
import { cardHTML, itemIcon } from './gearui.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ico = (n, cls='') => `<img class="px ${cls}" src="/assets/gen/${n}.png" alt="">`;
const btn = (label, act, extra='') => `<button class="btn ${extra}" type="button" data-act="${act}">${label}</button>`;
const bar = (pct, cls='') => `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div>`;
const num = (n) => (n || 0).toLocaleString();
const qty = (n) => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n);

function slot(id, q, on) {
  if (!id) return `<div class="slot r-common empty"></div>`;
  const it = ITEMS[id] || {rarity:'common'};
  return `<button type="button" class="slot r-${it.rarity} ${on ? 'on' : ''}" data-act="pick" data-item="${id}"${GEAR[id] ? ` data-tip-item="${id}"` : ''}><img class="px" src="${itemSrc(id)}" alt=""><span class="q">${q ? qty(q) : ''}</span></button>`;
}

let GEARS = {};
function cardFront(id, level, z) {
  const h = HEROES[id];
  if (!h) return '';
  const T = heroTotals(id, level || 1, GEARS[id] || {}).total;
  return `<div class="card r-${h.rarity}" style="--z:${z || 1}" data-act="sel" data-hero="${id}"><div class="card-in">
<div class="card-top"><span class="gem"></span><span class="rar">${RARITY_NAME[h.rarity]}</span><span class="lvl">Lv ${level || 1}</span></div>
<div class="card-art"><img class="px" src="/assets/portrait/${id}.png" alt="${esc(h.name)}"></div>
<div class="card-name h">${esc(h.name)}</div><div class="card-title">${esc(h.title)}</div>
<div class="card-stats"><span class="s-str"><small>Attack</small><b>${T.atk}</b></span><span class="s-def"><small>Defense</small><b>${T.def}</b></span><span class="s-wit"><small>Health</small><b>${T.hp}</b></span></div>
<div class="card-era">${esc(h.era)}</div></div></div>`;
}

function cardBack(id, z) {
  const h = HEROES[id];
  if (!h) return '';
  return `<div class="cardback r-${h.rarity}" style="--z:${z || 1}"><div class="cb-in">
<div class="cb-scene"><img class="px" alt="" src="/card_backs/${h.gif}.gif" style="width:100%;height:100%;object-fit:cover;display:block"><span class="cb-era">${esc(h.era)}</span></div>
<div class="row"><div class="cb-skill">${esc(h.back)}</div><div class="sp"></div><span class="tag v">Skill</span></div>
<div class="cb-text">${esc(h.backText)}</div>
<div class="cb-foot"><span>${esc(h.foot || h.perk)}</span><span>${RARITY_NAME[h.rarity]}</span></div>
</div></div>`;
}

function mini(id) {
  const h = HEROES[id];
  return `<button type="button" class="mini-card r-${h.rarity}" data-act="sel" data-hero="${id}"><div class="in"><img class="px" src="/assets/portrait/${id}.png" alt=""></div><div class="nm">${esc(h.name.split(' ')[0] === h.name ? h.name : h.name)}<small>${RARITY_NAME[h.rarity]}</small></div></button>`;
}

function clock(ms) {
  if (ms <= 0) return 'now';
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60), ss = s % 60;
  if (m >= 60) return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  return m + ':' + String(ss).padStart(2, '0');
}

function meters(s) {
  const vPct = s.freeze && s.bars ? s.bars.vigor : Math.round(100 * s.vigor / s.vigorMax);
  const dPct = s.freeze && s.bars ? s.bars.daring : Math.round(100 * s.daring / s.daringMax);
  const lPct = s.freeze && s.bars ? s.bars.life : Math.round(100 * s.life / Math.max(1, s.lifeMax));
  const vNext = s.vigor >= s.vigorMax ? 'Full' : '+' + (s.config.vigorChunk || 5) + ' in ' + clock((s.config.vigorEvery || 300) * 1000 - ((s.now - s.vigorAt) % ((s.config.vigorEvery || 300) * 1000)));
  const dNext = s.daring >= s.daringMax ? 'Full' : '+1 in ' + clock((s.config.daringEvery || 240) * 1000 - ((s.now - s.daringAt) % ((s.config.daringEvery || 240) * 1000)));
  const lifeNote = s.life >= s.lifeMax ? 'Full' : 'Squad';
  const one = (cls, icon, name, cur, max, pct, note) => `<div class="meter m-${cls}">${ico(icon)}<div><div class="mrow"><b>${name}</b><span class="nums">${cur}/${max}</span></div>${bar(pct)}<small>${note}</small></div></div>`;
  return `<div class="meters">${one('c','bolt','Vigor', s.vigor, s.vigorMax, vPct, s.freeze ? '+5 in 4:12' : vNext)}${one('p','flame','Daring', s.daring, s.daringMax, dPct, s.freeze ? '+1 in 2:40' : dNext)}${one('l','heart','Life', s.life, s.lifeMax, lPct, s.freeze ? 'Full' : lifeNote)}</div>`;
}

function chip(s) {
  if (!s.active) return '';
  const sk = s.skills[s.active];
  const node = (NODES[s.active] || []).find(n => n.id === sk.node);
  const iv = intervalMs(s, s.active, sk.node);
  const pct = s.freeze && s.bars ? s.bars.skill : ((s.now - (s.lastTick || s.now)) % iv) / iv * 100;
  const label = node ? node.name.split(' ')[0] : SKILLS.find(x => x.id === s.active).name;
  const secs = s.freeze && s.active === 'mining' ? '1.8s' : (iv / 1000).toFixed(1) + 's';
  return `<span class="chip">${ico(SKILLS.find(x => x.id === s.active).icon)} ${esc(label)} <span class="bar"><i style="width:${pct}%"></i></span> ${secs}</span>`;
}

function rail(s) {
  const link = (id, name, icon, right) => {
    const on = s.view === id || (id !== 'city' && s.view === id) ? ' on' : '';
    const live = s.active === id ? ' live' : '';
    return `<a class="${on}${live}" href="#${id}" data-go="${id}">${ico(icon)}${name}${right}</a>`;
  };
  const city = NAV_CITY.map(n => link(n.id, n.name, n.icon, (n.id === 'hustles' && s.daring >= 2) || (n.id === 'crew' && s.unread) ? '<span class="dot"></span>' : '<span></span>')).join('');
  const skills = SKILLS.map(sk => {
    const lv = s.freeze && s.preview ? ({mining:42,woodcutting:31,fishing:28,cooking:35,smithing:39,alchemy:22,summoning:18}[sk.id]) : skillLevel(s, sk.id);
    const pct = s.freeze && sk.id === 'mining' ? 64 : levelFromXp(s.skills[sk.id].xp).into / levelFromXp(s.skills[sk.id].xp).need * 100;
    return link(sk.id, sk.name, sk.icon, `<span class="lv">${lv}</span><span class="mini"><i style="width:${Math.round(pct)}%"></i></span>`);
  }).join('');
  const adv = NAV_ADV.map(n => link(n.id, n.name, n.icon, '<span></span>')).join('');
  const crew = s.crew ? s.crew.name : 'No crew yet';
  return `<aside class="rail"><img class="logo" src="/assets/logo.svg" alt="OverSummoned">
<div class="me"><img class="px" src="/assets/portrait/engineer.png" alt=""><div><b>${esc(s.name)}</b><small>Crew: ${esc(crew)}</small></div></div>
<div class="wallet"><span>${ico('coin')}${num(s.gold)}</span><span>${ico('summon_sigil')}${s.sigils}</span></div>
<h6>The City</h6><nav class="nav">${city}</nav>
<h6>Skills</h6><nav class="nav">${skills}</nav>
<h6>Adventure</h6><nav class="nav">${adv}</nav></aside>`;
}

function top(s, crumb, title) {
  return `<header class="top"><div class="tt"><div class="crumb">${crumb}</div><div class="title">${title}</div></div>
${meters(s)}<div class="sp"></div>${chip(s)}
<button class="bell" type="button" data-go="crew" aria-label="Crew">${ico('chat')}${s.unread ? `<b>${s.unread}</b>` : ''}</button></header>`;
}

function frontRow(heroes) {
  return heroes.map(h => {
    const fr = {legionary:{w:41,h:50,ax:23,ay:48,n:8}, engineer:{w:53,h:51,ax:24,ay:49,n:8}, will_slapton:{w:63,h:57,ax:32,ay:55,n:11}, gangster:{w:37,h:50,ax:17,ay:48,n:8}, paramedic:{w:59,h:49,ax:30,ay:47,n:8}};
    const meta = fr[h.id] || fr.engineer;
    const scale = h.scale || 2.9;
    const w = meta.w * scale, ht = meta.h * scale, n = h.anim === 'skill' ? 11 : meta.n;
    const ww = (h.anim === 'skill' ? (h.id === 'will_slapton' ? 63 : meta.w) : meta.w) * scale;
    const frames = h.anim === 'skill' ? 11 : 8;
    const fw = (h.id === 'will_slapton' && h.anim === 'skill' ? 63 : meta.w) * scale;
    const fh = (h.id === 'will_slapton' && h.anim === 'skill' ? 57 : meta.h) * scale;
    const left = h.x - (h.id === 'will_slapton' ? 32 : meta.ax) * scale;
    const topv = h.y - (h.id === 'will_slapton' ? 55 : meta.ay) * scale;
    return `<div class="sprite fsp" style="width:${fw}px;height:${fh}px;left:${left}px;top:${topv}px;background-image:url(/assets/front/${h.id}_${h.anim}.png);background-size:${frames * fw}px ${fh}px;animation:fs ${frames * 110}ms steps(${frames}) infinite;--sw:-${frames * fw}px"></div>`;
  }).join('');
}

function cityDesk(s) {
  const away = s.welcome ? (s.welcome.away || 'a while') : '';
  const banner = s.welcome ? `<div class="eb cy">Aldermere, the city that summoned you</div>
   <div class="h" style="font-size:23px;line-height:1.1;margin:4px 0 6px;max-width:400px">Welcome back, ${esc(s.name)}. Your heroes never stopped working.</div>
   <div class="mut" style="font-size:13px;max-width:380px;margin-bottom:10px">They mined, fought and hustled for ${esc(away)}. Come see what they brought home.</div>
   <div class="row">${btn('Collect ' + esc(away) + ' of loot', 'collect', 'l')}${btn('See what happened', 'go', 'g')} </div>`.replace('data-act="go"', 'data-go="welcome"') : `<div class="eb cy">Aldermere, the city that summoned you</div>
   <div class="h" style="font-size:23px;line-height:1.1;margin:4px 0 6px">The city keeps its lights on for you.</div>
   <div class="mut" style="font-size:13px;max-width:380px">Train a craft. Send a squad down. Come back heavier.</div>`;
  const sk = s.active ? s.skills[s.active] : null;
  const node = sk && (NODES[s.active] || []).find(n => n.id === sk.node);
  const train = s.active ? `<div class="panel glowc"><div class="ph">${ico('pickaxe', 'ico')}<div><h3>Now training</h3><small>${esc(SKILLS.find(x => x.id === s.active).name)} Lv ${skillLevel(s, s.active)}</small></div></div>
   <div class="row" style="margin-bottom:6px">${ico(node ? (ITEMS[node.item]?.icon || 'pickaxe').replace('items/','') : 'pickaxe')}<b>${esc(node ? node.name : 'Idle')}</b><div class="sp"></div><span class="nums cy">${(intervalMs(s, s.active, sk.node)/1000).toFixed(1)}s</span></div>
   ${bar(s.freeze && s.bars ? s.bars.skill : 40)}<div class="row" style="margin-top:6px;font-size:12px"><span class="mut">${sk.hero ? esc(HEROES[sk.hero].name) + ' on shift' : 'No hero assigned'}</span><div class="sp"></div><span class="lm">+${sk.session.items[node?.item] || 0}</span></div></div>` : `<div class="panel"><div class="ph"><h3>Now training</h3></div><p class="mut">Pick a skill and the work starts.</p></div>`;
  const delve = s.delve ? `<div class="panel glow"><div class="ph">${ico('swords','ico')}<div><h3>Delve: ${esc(s.delve.name)}</h3><small>Floor ${s.delve.floor} of 10</small></div></div>
   ${bar(s.freeze && s.bars ? s.bars.delve : delvePct(s), 'p')}<div class="row" style="margin-top:8px;font-size:12px"><span class="mut">Back in ${clock(s.delve.ends - s.now)}</span><div class="sp"></div><span class="pk">${s.delve.floor >= 10 ? 'The Hollow Bishop waits' : 'The floor holds'}</span></div>
   <div class="row" style="margin-top:8px">${btn('Watch the fight', 'go', 'sm').replace('data-act="go"', 'data-go="delve"')}</div></div>` : `<div class="panel"><div class="ph">${ico('swords','ico')}<div><h3>Delve</h3><small>The stairs are quiet</small></div></div><div class="row">${btn('Send them down', 'go', 'sm').replace('data-act="go"', 'data-go="delve"')}</div></div>`;
  const crier = s.crier.slice(0, 4).map((c, i) => `<div class="li blk"><span class="tag ${['p','c','l','v'][i % 4]}">${esc(c.tag)}</span> ${esc(c.msg)}</div>`).join('');
  const stockLeft = (s.stocksUntil > s.now ? s.stocksUntil : (s.stocksWho?.until || 0)) - s.now;
  const stocks = stockLeft > 0 ? `<div class="li"><img class="px" src="/assets/portrait/${s.stocksWho?.face || 'gangster'}.png" style="border-radius:6px;object-fit:cover" alt=""><div><b>${esc(s.stocksWho?.name || s.name)}</b><br><small class="mut">${esc(s.stocksWho?.reason || 'In the Stocks')}</small></div><div class="sp"></div><span class="nums pk">${clock(stockLeft)}</span></div>` : '';
  const inf = s.infirmary.filter(i => i.until > s.now).map(i => `<div class="li"><img class="px" src="/assets/portrait/${i.face || i.id}.png" style="border-radius:6px;object-fit:cover" alt=""><div><b>${esc(i.name)}</b><br><small class="mut">${esc(i.reason)}</small></div><div class="sp"></div><span class="nums cy">${clock(i.until - s.now)}</span></div>`).join('');
  const crew = s.crew ? `<div class="panel"><div class="ph">${ico('banner','ico')}<div><h3>${esc(s.crew.name)}</h3><small>Crew goal</small></div></div>
   <div style="font-size:13px;margin-bottom:6px">Fill the crew vault with ${num(s.crew.goal)} Moonsilver</div>
   ${bar(Math.round(100 * s.crew.vaultOre / s.crew.goal), 'l')}<div class="row" style="margin-top:6px;font-size:12px"><span class="mut">${num(s.crew.vaultOre)} / ${num(s.crew.goal)}</span><div class="sp"></div><span class="lm">You gave ${num(s.crew.youGave)}</span></div></div>` : `<div class="panel"><div class="ph"><h3>Crew</h3></div><p class="mut">No banner yet.</p>${btn('Find a crew', 'go', 'sm').replace('data-act="go"', 'data-go="crew"')}</div>`;
  const will = HEROES.will_slapton;
  return `<div style="display:grid;grid-template-columns:1fr 318px;gap:12px;height:100%">
<div class="g" style="grid-template-rows:262px auto 1fr;min-height:0">
 <div class="scene" style="background-image:url(/assets/gen/city_bg.png)">
  <div style="position:absolute;left:20px;top:22px;z-index:2;max-width:460px">${banner}</div>
  <div style="position:absolute;inset:0;z-index:1">${frontRow([
    {id:'engineer', anim:'idle', x:430, y:230, scale:2.7},
    {id:'will_slapton', anim:'skill', x:560, y:228, scale:2.7},
    {id:'legionary', anim:'idle', x:680, y:230, scale:2.7},
    {id:'gangster', anim:'idle', x:790, y:230, scale:2.7}
  ])}</div>
  <div style="position:absolute;right:14px;top:14px;z-index:2" class="row"><span class="tag l">${s.preview ? '5 heroes on shift' : Object.keys(s.heroes).length + ' heroes in hand'}</span>${s.delve ? '<span class="tag p">1 delve running</span>' : ''}</div>
 </div>
 <div class="g" style="grid-template-columns:repeat(4,1fr)">${train}${delve}
  <div class="panel"><div class="ph">${ico('mask','ico')}<div><h3>Hustles</h3><small>${s.daring} Daring ready</small></div></div>
   <div style="font-size:13px;margin-bottom:8px">Rig the dice at the Gilded Rat. <span class="lm">72% to win</span></div>
   <div class="row">${btn('Roll the dice', 'hustle', 'sm')} <span class="mut" style="font-size:11.5px">Costs 5 Daring</span></div></div>
  ${crew}
 </div>
 <div class="g" style="grid-template-columns:1.3fr 1fr 1fr;min-height:0">
  <div class="panel"><div class="ph">${ico('paper','ico')}<div><h3>The Aldermere Crier</h3><small>Morning edition</small></div></div><div class="list">${crier}</div></div>
  <div class="panel"><div class="ph">${ico('cross','ico')}<div><h3>Infirmary &amp; Stocks</h3><small>Who is laid up in town</small></div></div>
   <div class="list">${stocks}${inf}<div class="li">${btn('Pay bail, 900 gold', 'bail', 'sm g')}</div></div></div>
  <div class="panel"><div class="ph">${ico('portal','ico')}<div><h3>Waystones</h3><small>Travel to other cities</small></div></div>
   <div class="list"><div class="li"><b>Port Sable</b><span class="sp"></span><span class="mut">Eels sell for double</span></div>
   <div class="li"><b>Emberfall</b><span class="sp"></span><span class="mut">Cheap ember ore</span></div>
   <div class="li"><b>The Frost Market</b><span class="sp"></span><span class="lm">Rare cards on sale</span></div>
   <div class="li">${btn('Step through, 25 min', 'travel', 'sm c')}</div></div></div>
 </div>
</div>
<div class="panel glow" style="display:flex;flex-direction:column;align-items:center;gap:10px;background:radial-gradient(300px 260px at 50% 30%,rgba(229,38,46,.25),transparent 70%),linear-gradient(180deg,rgba(26,15,49,.9),rgba(16,9,31,.92))">
 <div class="row" style="align-self:stretch"><span class="tag p">Featured this week</span><div class="sp"></div><span class="mut" style="font-size:12px">Ends in 3d 4h</span></div>
 ${cardFront('will_slapton', s.heroes.will_slapton?.level || 1, 1.15)}
 <div style="text-align:center;font-size:13px;line-height:1.45">${esc(will.bio)}</div>
 <div class="row">${btn('Summon for 1 sigil', 'summon')}${btn('Flip card', 'go', 'g').replace('data-act="go"', 'data-go="cards"')}</div>
</div></div>`;
}

function delvePct(s) {
  if (!s.delve) return 0;
  const a = s.delve.started, b = s.delve.ends;
  return Math.max(0, Math.min(100, (s.now - a) / Math.max(1, b - a) * 100));
}

function sideSprite(id, row, scale, x, y, flip) {
  const meta = {
    legionary:{w:56,h:50,ax:29,ay:48,idle:8,attack:9},
    paramedic:{w:42,h:51,ax:16,ay:49,idle:8,attack:9},
    engineer:{w:61,h:51,ax:24,ay:49,idle:8,attack:9},
    ghoul:{w:51,h:52,ax:29,ay:49,idle:8,attack:9},
    skeleton:{w:57,h:52,ax:23,ay:49,idle:8,attack:9},
    gangster:{w:45,h:51,ax:22,ay:49,idle:8,attack:9},
    hunter:{w:54,h:53,ax:30,ay:48,idle:8,attack:9}
  }[id];
  if (!meta) return '';
  const rows = {idle:0, attack:1, hit:2, skill:3};
  const frames = meta[row] || 8;
  const cols = 11;
  const w = meta.w * scale, h = meta.h * scale;
  const left = x - meta.ax * scale, top = y - meta.ay * scale;
  return `<div class="sprite ${flip ? 'face-r' : ''}" style="width:${w}px;height:${h}px;left:${left}px;top:${top}px;background-image:url(/assets/sprites/${id}.png);background-size:${cols*w}px ${4*h}px;background-position:0 ${-rows[row]*h}px;animation:fs ${frames*110}ms steps(${frames}) infinite;--sw:-${frames*w}px"></div>`;
}

function skillView(s, id) {
  const sk = s.skills[id];
  const meta = SKILLS.find(x => x.id === id);
  const L = levelFromXp(sk.xp);
  const nodes = NODES[id];
  const cur = nodes.find(n => n.id === sk.node) || nodes[0];
  const active = s.active === id;
  const pct = s.freeze && id === 'mining' && s.bars ? s.bars.xp : Math.round(100 * L.into / L.need);
  const pool = poolPct(s, id);
  const hero = sk.hero;
  const cards = nodes.map(n => {
    const locked = skillLevel(s, id) < n.lv;
    const on = active && sk.node === n.id;
    const rock = n.rock.startsWith('items/') ? '/assets/' + n.rock + '.png' : '/assets/gen/' + n.rock + '.png';
    return `<button type="button" class="panel ${on ? 'glowc' : ''}" style="${locked ? 'opacity:.5;' : ''}padding:10px;text-align:left" data-act="skill" data-skill="${id}" data-node="${n.id}" ${locked ? 'disabled' : ''}>
<div class="row"><img class="px" src="${rock}" style="width:64px;height:64px;${locked ? 'filter:grayscale(1) brightness(.5)' : ''}" alt=""><div style="flex:1"><b class="h" style="font-size:15px">${esc(n.name)}</b><div class="mut" style="font-size:12px">${locked ? 'Unlocks at Lv ' + n.lv : n.xp + ' XP · ' + n.sec.toFixed(1) + 's'}</div>
<div class="row" style="margin-top:4px"><img class="px" src="${itemSrc(n.item)}" style="width:20px" alt=""><span class="tag ${locked ? '' : 'c'}">${locked ? 'Locked' : 'Mastery ' + Math.round(sk.mastery[n.id] || 0)}</span></div></div></div>
${bar(locked ? 0 : (sk.mastery[n.id] || (on ? 62 : 100)), '')}</button>`;
  }).join('');
  const rewards = MASTERY.map(m => `<div class="panel" style="padding:10px;${pool >= m.at ? 'border-color:rgba(198,255,61,.4)' : ''}"><div class="row"><b class="${pool >= m.at ? 'lm' : 'mut'}">${m.at}%</b><div class="sp"></div><span class="tag ${pool >= m.at ? 'l' : ''}">${pool >= m.at ? 'Active' : 'Locked'}</span></div><div style="font-size:12.5px;margin-top:4px">${m.text}</div></div>`).join('');
  const sess = Object.keys(sk.session.items).map(k => `<div class="li"><img class="px" src="${itemSrc(k)}" alt="">${esc(ITEMS[k]?.name || k)}<span class="sp"></span><b class="nums">+${sk.session.items[k]}</b></div>`).join('');
  const next = nodes.find(n => n.lv > skillLevel(s, id));
  const mineArt = id === 'mining' ? `<img class="px" src="/assets/gen/rock_moon.png" style="position:absolute;left:470px;top:116px;width:128px;z-index:1" alt="">
  <div style="position:absolute;inset:0;z-index:2">${sideSprite('engineer','attack',3,400,232,false)}</div>` : `<div style="position:absolute;inset:0;z-index:2">${sideSprite(hero || 'engineer','idle',3,360,232,false)}</div>`;
  return `<div style="display:grid;grid-template-columns:1fr 300px;gap:12px;height:100%">
<div class="g" style="grid-template-rows:auto 220px auto 1fr;min-height:0">
 <div class="panel"><div class="row" style="gap:16px">${ico(meta.icon)}<div style="flex:1"><div class="row"><b class="h" style="font-size:20px">${meta.name}</b><span class="tag l">Lv ${s.freeze && sk.xpLabel && id==='mining' ? '42 / 99' : L.level + ' / 99'}</span><div class="sp"></div><span class="mut nums" style="font-size:12px">${s.freeze && sk.xpLabel ? sk.xpLabel : num(L.into) + ' / ' + num(L.need) + ' XP'}</span></div>${bar(pct, 'thick')}</div>
 <div style="width:260px"><div class="row" style="font-size:12px"><b>Mastery Pool</b><div class="sp"></div><span class="mut nums">${pool}%</span></div>${bar(pool, 'p')}<small class="dim">At 50% every action is 5% faster</small></div></div></div>
 <div class="scene" style="background-image:url(/assets/gen/${id === 'mining' ? 'mine_bg' : id === 'fishing' ? 'city_bg' : 'mine_bg'}.png)">${mineArt}
  <div style="position:absolute;left:12px;top:12px;z-index:3;background:rgba(7,4,13,.72);padding:8px 12px;border-radius:10px;border:1px solid var(--line)"><div class="eb cy">${active ? 'Working now' : 'Ready'}</div><div class="h" style="font-size:22px">${esc(cur.name)}</div><div class="mut" style="font-size:12.5px">${esc(cur.line)}</div></div>
  <div style="position:absolute;left:18px;right:18px;bottom:14px;z-index:3" class="row">${bar(active ? (s.freeze && s.bars ? s.bars.node : 50) : 0, 'thick')}<span class="nums cy">${active ? (intervalMs(s, id, sk.node) / 1000).toFixed(1) + 's' : ''}</span>${active ? btn('Stop', 'stop', 'sm g') : ''}</div></div>
 <div class="g" style="grid-template-columns:repeat(3,1fr);align-content:start">${cards}</div>
 <div class="panel"><div class="ph"><h3>Mastery Pool rewards</h3><small>Shared by every action</small></div><div class="g" style="grid-template-columns:repeat(4,1fr)">${rewards}</div></div>
</div>
<div class="g" style="align-content:start">
 <div class="panel"><div class="ph"><h3>Hero on this skill</h3></div>
 ${hero ? `<div class="row" style="align-items:flex-start;gap:12px">${cardFront(hero, s.heroes[hero].level, 0.62)}<div style="font-size:12.5px"><b class="lm">${esc(HEROES[hero].perk)}</b><br><span class="mut">${esc(HEROES[hero].name)} stays on this shift until you swap them.</span><br><br><select data-act="hero-skill" data-skill="${id}" aria-label="Swap hero" style="margin-top:8px">${heroOptions(s, hero)}</select></div></div>` : `<select data-act="hero-skill" data-skill="${id}" aria-label="Choose hero">${heroOptions(s, '')}</select>`}
 </div>
 <div class="panel"><div class="ph"><h3>This session</h3></div><div class="list">${sess || '<div class="li mut">Nothing yet.</div>'}${sk.session.xp ? `<div class="li">${ico('clock')}${meta.name} XP<span class="sp"></span><b class="nums cy">+${num(sk.session.xp)}</b></div>` : ''}</div>
 <div class="row" style="margin-top:8px">${btn('Push harder, 10 Vigor', 'burst', 'sm')}</div></div>
 ${next ? `<div class="panel"><div class="ph"><h3>Next unlock</h3></div><div class="row"><img class="px" src="/assets/gen/${next.rock.startsWith('items/') ? 'chest' : next.rock}.png" style="width:48px" alt=""><div style="font-size:12.5px"><b>${esc(next.name)} at Lv ${next.lv}</b><br><span class="mut">${esc(next.line)}</span></div></div></div>` : ''}
</div></div>`;
}

function heroOptions(s, cur) {
  const ids = Object.keys(s.heroes);
  return `<option value="">No hero</option>` + ids.map(id => `<option value="${id}" ${id === cur ? 'selected' : ''}>${esc(HEROES[id].name)}</option>`).join('');
}

function cardsView(s) {
  const owned = Object.keys(s.heroes);
  const show = HERO_ORDER.filter(id => !s.rar || s.rar === 'all' || HEROES[id].rarity === s.rar);
  const grid = show.map(id => s.heroes[id] ? mini(id) : `<div class="mini-card lock"><div class="in"><b>?</b></div></div>`).join('');
  const locks = Array.from({length: Math.max(0, 16 - show.length)}).map(() => `<div class="mini-card lock"><div class="in"><b>?</b></div></div>`).join('');
  const sel = s.sel && HEROES[s.sel] ? s.sel : (owned[0] || 'will_slapton');
  const h = HEROES[sel];
  const ownedH = s.heroes[sel];
  const sets = SETS.map(set => {
    const have = set.have.filter(id => s.heroes[id]).length;
    return `<div class="li"><b>${set.name}</b><span class="sp"></span><span class="mut nums">${have} / ${set.need}</span><div class="bar" style="width:90px"><i style="width:${Math.round(100 * have / set.need)}%"></i></div></div>`;
  }).join('');
  const T = ownedH ? heroTotals(sel, ownedH.level, (s.gear || {})[sel] || {}).total : null;
  const statRow = T ? `<div class="row" style="flex-wrap:wrap;gap:6px;font-size:12px;justify-content:center">${Object.keys(STAT_NAMES).map(k => `<span class="tag">${STAT_NAMES[k]} <b>${T[k]}${k === 'crit' ? '%' : ''}</b></span>`).join('')}</div>` : '';
  const count = s.foundCount || owned.length;
  return `<div style="display:grid;grid-template-columns:1fr 470px;gap:12px;height:100%">
<div class="g" style="align-content:start;min-height:0">
 <div class="panel"><div class="row"><b class="h" style="font-size:20px">Your collection</b><span class="tag l">${count} / 1,200 found</span><div class="sp"></div>${btn('Open a pack', 'pack', 'sm')}</div>
  <div class="row" style="margin-top:10px;flex-wrap:wrap"><span class="tag p">All eras</span><span class="tag">Ancient</span><span class="tag">Medieval</span><span class="tag">Victorian</span><span class="tag">1920s</span><span class="tag">Modern</span><span class="tag">Pop culture</span></div>
  <div class="row" style="margin-top:6px;flex-wrap:wrap">${['common','uncommon','rare','epic','legendary','absurd','unhinged'].map(r => `<button type="button" class="tag r-${r}" style="color:var(--rc);border-color:var(--rc)" data-act="rar" data-rar="${r}">${RARITY_NAME[r]}</button>`).join('')}</div></div>
 <div class="panel" style="display:grid;grid-template-columns:repeat(8,1fr);gap:8px;align-content:start">${grid}${locks}</div>
 <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:12px"><div class="panel"><div class="ph"><h3>Era sets</h3><small>Finish a set for a permanent bonus and a gold frame</small></div><div class="list">${sets}</div></div>
  <div class="panel"><div class="ph"><h3>Copies become power</h3></div><div style="font-size:12.5px" class="mut">Every extra copy levels the card up, and every level adds 5% to Attack, Defense, Health and Speed. Better gear asks for a higher level. Level 10 turns the frame gold.</div><div class="row" style="margin-top:10px">${btn('Level this card', 'level', 'sm c')}</div></div></div>
</div>
<div class="panel glow" style="display:flex;flex-direction:column;gap:10px"><div class="row"><h3 class="h" style="font-size:16px">${esc(h.name)}</h3><span class="tag p">${RARITY_NAME[h.rarity]}</span><div class="sp"></div><span class="mut" style="font-size:12px">Tap a card to choose it</span></div>
 <div class="row" style="justify-content:center;padding:6px 0 18px">${cardHTML(h, {level: ownedH ? ownedH.level : 1, gear: ownedH ? ((s.gear || {})[sel] || {}) : {}, stock: s.bag, z: 1.5, flipped: !!s.showBack, view: s.cardView || 'gear', id: 'card-' + sel, mine: !!ownedH && !s.preview})}</div>
 ${statRow}
 <div class="mut" style="font-size:12px;text-align:center">Tap the card to turn it over. On the back, tap a slot to wear something from your bank.</div>
 <div class="row">${btn('Send on a delve', 'party-add')}${btn('Show to my crew', 'show', 'g')}</div>
 ${ownedH ? `<div class="mut" style="font-size:12px">Level ${ownedH.level}. Spare copies: ${ownedH.dupes}.</div>` : `<div class="mut">Not in your hand yet.</div>`}
</div></div>`;
}
function statLine(id) {
  const g = GEAR[id];
  if (!g) return '';
  const bits = Object.entries(g.stats || {}).map(([k, v]) => '+' + v + ' ' + STAT_NAMES[k]);
  if (g.dmg) bits.unshift(g.dmg[0] + ' to ' + g.dmg[1] + ' damage');
  if (g.armor) bits.push(g.armor.toLocaleString() + ' Armor');
  if (g.use) bits.push(g.use.text);
  return bits.join(', ');
}
function coinLine(c) { const k = coins(c); return (k.g ? num(k.g) + 'g ' : '') + (k.s || k.g ? k.s + 's ' : '') + k.c + 'c'; }

function delveView(s) {
  if (!s.delve) return delveSetup(s);
  const d = s.delve;
  const pips = Array.from({length:10}, (_, i) => `<span style="width:34px;height:8px;border-radius:4px;background:${i < d.floor - 1 ? 'var(--pink)' : i === d.floor - 1 ? 'linear-gradient(90deg,var(--pink) 50%,rgba(255,255,255,.1) 50%)' : 'rgba(255,255,255,.1)'}"></span>`).join('');
  const fa = fightAt(d, s.now);
  const squad = (d.party || []).map((id, i) => {
    const hp = fa ? [fa.hp[i] ?? 0, fa.max[i] ?? 1] : ((d.hp && d.hp[id]) || [100,100]);
    const pct = Math.round(100 * hp[0] / Math.max(1, hp[1]));
    return `<div class="li"><img class="px" src="/assets/portrait/${id}.png" style="width:40px;height:40px;border-radius:8px;object-fit:cover" alt=""><div style="flex:1"><div class="row"><b>${esc(HEROES[id].name)}</b><div class="sp"></div><span class="nums mut" style="font-size:12px">${hp[0]}/${hp[1]}</span></div>${bar(pct, hp[0] > 0 ? 'l' : 'p')}</div></div>`;
  }).join('');
  const lines = fa ? fa.seen.slice(-9).reverse() : [];
  const log = lines.map(e => `<div class="li" style="font-size:12.5px">${e.c === 'room' || e.c === 'end' ? `<b class="cy">${esc(e.x)}</b>` : esc(e.x)} ${e.v ? `<b class="${e.c === 'hurt' || e.c === 'down' ? 'pk' : e.c === 'heal' ? 'lm' : 'cy'}">${esc(e.v)}</b>` : ''}</div>`).join('') || '<div class="li mut">The squad is still on the stairs.</div>';
  const foes = (fa ? fa.foes : []).map(f => `<div><div class="row" style="font-size:12px"><b>${esc(f.name)}</b><div class="sp"></div><span class="nums">${f.hp}/${f.max}</span></div>${bar(Math.round(100 * f.hp / Math.max(1,f.max)), 'p')}</div>`).join('');
  d.room = fa ? (fa.done ? (fa.result === 'won' ? 'Floor cleared' : fa.result === 'wiped' ? 'Carried out' : 'Backed out') : 'Room ' + fa.room + ' of ' + fa.rooms) : 'In the dark';
  d.blurb = fa && fa.foes[0] ? (fa.done ? (fa.result === 'won' ? 'Every room is quiet now.' : 'They made it out with what they carried.') : fa.foes.length > 1 ? 'Something big and its friends' : 'A ' + fa.foes[0].name + ' blocks the way') : '';
  const ready = d.ends <= s.now;
  return `<div style="display:grid;grid-template-columns:1fr 300px;gap:12px;height:100%">
<div class="g" style="grid-template-rows:auto 300px 1fr;min-height:0">
 <div class="panel"><div class="row">${ico('swords','ico')}<b class="h" style="font-size:20px">${esc(d.name)}</b><span class="tag p">Floor ${d.floor} of 10</span><div class="sp"></div>${pips}${ico('skull')}</div></div>
 <div class="scene" style="background-image:url(/assets/bg_dungeon.png)"><div style="position:absolute;inset:0;z-index:2">${sideSprite('legionary','idle',3,150,250,false)}${sideSprite('paramedic','idle',3,250,250,true)}${sideSprite('engineer','attack',3,400,250,false)}${sideSprite('ghoul','attack',3,560,250,false)}${sideSprite('skeleton','idle',3,700,250,false)}</div>
  <div style="position:absolute;left:16px;top:12px;z-index:3"><div class="eb pk">${esc(d.room || 'In the dark')}</div><div class="h" style="font-size:20px">${esc(d.blurb || '')}</div></div>
  <div style="position:absolute;right:16px;top:12px;z-index:3;width:250px" class="g">${foes}</div></div>
 <div class="g" style="grid-template-columns:1fr 1fr;min-height:0">
  <div class="panel"><div class="ph"><h3>Your squad</h3><small>Auto-fighting</small></div><div class="list">${squad}</div></div>
  <div class="panel"><div class="ph"><h3>Battle log</h3><small>Newest first</small></div><div class="list">${log}</div>${ready ? `<div class="row" style="margin-top:8px">${btn('Bring it home', 'claim')}</div>` : ''}</div>
 </div>
</div>
<div class="g" style="align-content:start">
 <div class="panel glow"><div class="ph"><h3>Big moment</h3></div><div style="font-size:13px;margin-bottom:10px">Push for more loot, play it safe, or eat a stew so anyone hurt heals twice as fast.</div>
  <div class="g" style="gap:8px">${btn('Kick the boiling pot at it', 'choice-kick')}${btn('Raise the shield wall', 'choice-shield', 'c')}${btn('Eat and heal first', 'choice-eat', 'g')}</div>
  ${d.choice ? `<div class="mut" style="margin-top:8px">You chose to ${esc(d.choice)}.</div>` : ''}</div>
 <div class="panel"><div class="ph"><h3>On their belts</h3></div><div class="row" style="flex-wrap:wrap">${beltsOf(s, d.party).map(id => slot(id, s.bag[id] || 0)).join('') || '<span class="mut">Nothing on the belts. Put potions on a card back.</span>'}</div><small class="dim">Each hero drinks on their own below ${(s.rules && s.rules.heal) ?? 40}% Health. The squad backs out below ${(s.rules && s.rules.retreat) ?? 25}%.</small></div>
 <div class="panel"><div class="ph"><h3>Rooms</h3></div><div class="mut" style="font-size:12.5px">${fa ? (fa.done ? `${fa.cleared} of ${fa.rooms} rooms cleared. What they find depends on how far they got.` : `Room ${fa.room} of ${fa.rooms}. Loot is counted when they come home.`) : ''}</div></div>
 <div class="panel"><div class="row">${ico('boss_bishop')}<div style="font-size:12.5px"><b class="pk">Boss: The Hollow Bishop</b><br><span class="mut">Floor 10. A strange card waits at the bottom, and the paper will not print the name.</span></div></div></div>
</div></div>`;
}

function beltsOf(s, party) {
  const out = [];
  (party || []).forEach(id => ['belt1','belt2','belt3','belt4'].forEach(k => { const x = ((s.gear || {})[id] || {})[k]; if (x && !out.includes(x)) out.push(x); }));
  return out;
}

function delveSetup(s) {
  const floor = s.floor || 1;
  const lengths = (s.config.delveMinutes || [1,15,60,240,480]).map(m => {
    const label = (DELVE_LENGTHS.find(x => x.m === m) || {label: m + ' min'}).label;
    return `<button type="button" class="tag ${s.pickMin === m ? 'p' : ''}" data-act="len" data-min="${m}">${label}</button>`;
  }).join('');
  return `<div class="g" style="max-width:820px">
 <div class="panel"><div class="ph"><h3>Send a delve</h3><small>${esc(FLOORS[(floor - 1) % 10])} · floor ${floor}</small></div>
  <div class="row" style="margin-bottom:10px"><button class="btn g sm" type="button" data-act="floor" data-dir="-1">Lower</button><b class="h" style="font-size:28px">${floor}</b><button class="btn g sm" type="button" data-act="floor" data-dir="1">Higher</button><span class="mut">Deepest open: ${s.deepest}</span></div>
  <div class="row" style="flex-wrap:wrap">${lengths}</div>
  <p class="mut" style="margin:10px 0">Vigor pays for the stairs. Longer walks bring more home. The one-minute walk is a real delve.</p>
  <div class="row">${s.party.map(id => `<img class="px" src="/assets/portrait/${id}.png" alt="" style="width:48px;height:64px;object-fit:cover;border-radius:8px">`).join('')}</div>
  <div class="row" style="margin-top:12px">${btn('Send the party', 'delve-go')}</div>
 </div>
 <div class="panel"><div class="ph"><h3>Party</h3><small>Up to three</small></div><div class="row" style="flex-wrap:wrap">${Object.keys(s.heroes).map(id => `<button type="button" class="tag ${s.party.includes(id) ? 'p' : ''}" data-act="toggle-party" data-hero="${id}">${esc(HEROES[id].name.split(' ')[0])}</button>`).join('')}</div></div>
</div>`;
}

function bankView(s) {
  const filter = s.bankFilter || 'all';
  const ids = Object.keys(s.bag).filter(id => {
    const it = ITEMS[id];
    if (!it) return false;
    if (filter === 'all') return true;
    if (filter === 'ores') return /ore/.test(id);
    if (filter === 'bars') return /bar/.test(id);
    if (filter === 'food') return it.kind === 'food';
    if (filter === 'gear') return it.kind === 'gear';
    if (filter === 'cards') return id === 'card_shard' || id === 'summon_sigil';
    return true;
  });
  const cells = ids.map(id => slot(id, s.bag[id], s.pick === id)).join('');
  const blanks = Array.from({length: Math.max(12, 48 - ids.length)}).map(() => slot(null)).join('');
  const pick = s.pick && ITEMS[s.pick] ? s.pick : ids[0];
  const it = pick ? ITEMS[pick] : null;
  const worth = Object.keys(s.bag).reduce((a, id) => a + (ITEMS[id]?.value || 0) * s.bag[id], 0);
  return `<div style="display:grid;grid-template-columns:1fr 330px;gap:12px;height:100%">
<div class="panel" style="min-height:0;overflow:auto"><div class="row" style="margin-bottom:10px"><b class="h" style="font-size:20px">Bank</b><span class="tag">${ids.length} / 200 slots</span><div class="sp"></div>
 ${['all','ores','bars','food','gear','cards'].map(f => `<button type="button" class="tag ${filter === f ? 'p' : ''}" data-act="bank" data-filter="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join('')}
 <span class="tag c">Worth ${num(worth)} gold</span></div>
 <div style="display:grid;grid-template-columns:repeat(auto-fill,52px);gap:8px">${cells}${blanks}</div></div>
<div class="g" style="align-content:start">
 ${it ? `<div class="panel glowc"><div class="row"><div class="slot r-${it.rarity}" style="width:64px;height:64px"><img class="px" src="${itemSrc(pick)}" style="width:52px;height:52px" alt=""></div><div><b class="h" style="font-size:17px">${esc(it.name)}</b><br><span class="tag c">${RARITY_NAME[it.rarity]}</span> <span class="mut" style="font-size:12px">x${s.bag[pick] || 0}</span></div></div>
  <div class="mut" style="font-size:12.5px;margin:8px 0">${esc(statLine(pick) || it.blurb || 'It sits in the Bank until you use it or sell it.')}</div>
  ${GEAR[pick] && GEAR[pick].req ? `<div class="mut" style="font-size:12px;margin-bottom:8px">Needs card level ${GEAR[pick].req}. Wear it from the back of a card.</div>` : ''}
  <div class="row">${btn('Sell for ' + (GEAR[pick] && GEAR[pick].sell ? coinLine(GEAR[pick].sell) : (it.value || 1) + 'g') + ' each', 'sell', 'sm c')}${btn('List on Market', 'list', 'sm g')}</div></div>` : ''}
 <div class="panel"><div class="ph">${ico('anvil','ico')}<div><h3>Smithing</h3><small>Lv ${skillLevel(s, 'smithing')}</small></div></div>
  <div class="row" style="margin-bottom:8px"><img class="px" src="/assets/items/rusty_gladius.png" style="width:40px" alt=""><div><b>Moonsilver Gladius</b><br><small class="mut">+8 Attack · Hurts the undead</small></div></div>
  <div class="row" style="font-size:12px;margin-bottom:8px">${slot('moonsilver_bar', 4)}${slot('ash_log', 2)}<span class="mut">→</span>${slot('moonsilver_gladius', 1)}</div>
  <div class="row">${btn('Forge a sword', 'forge', 'sm')}<span class="mut" style="font-size:12px">4 bars, 2 logs, 120 XP</span></div></div>
 ${(s.party || []).filter(id => s.gear && s.gear[id] && Object.keys(s.gear[id]).length).slice(0, 2).map(id => `<div class="panel"><div class="ph"><h3>${esc(HEROES[id].name.split(' ')[0])} is wearing</h3></div><div class="row" style="flex-wrap:wrap">${Object.entries(s.gear[id]).filter(([k]) => !k.startsWith('belt')).map(([, x]) => slot(x)).join('')}</div></div>`).join('')}
</div></div>`;
}

function marketView(s) {
  const rows = (s.listings || []).map(l => {
    const name = l.name || ITEMS[l.item]?.name || l.item;
    const icon = l.item === 'card_pack' ? 'cards' : (ITEMS[l.item]?.icon || 'coin');
    const src = icon.startsWith('items/') ? '/assets/' + icon + '.png' : '/assets/gen/' + icon + '.png';
    const today = l.today || 0;
    return `<div class="li"><img class="px" src="${src}" alt=""><b style="width:160px">${esc(name)}</b><span class="nums" style="width:80px">${num(l.price)}g</span><span class="nums ${today >= 0 ? 'lm' : 'pk'}" style="width:60px">${today >= 0 ? '+' : ''}${today}%</span><span class="mut nums" style="width:70px">${num(l.qty)}</span><span class="sp"></span><button class="btn sm c" type="button" data-act="buy" data-item="${l.item}">Buy</button><button class="btn sm g" type="button" data-act="sell" data-item="${l.item}">Sell</button></div>`;
  }).join('');
  const cards = (s.cardListings || []).map(c => `<div class="li"><img class="px" src="/assets/portrait/${c.hero}.png" style="width:36px;height:36px;border-radius:6px;object-fit:cover" alt=""><div><b>${esc(HEROES[c.hero].name)}</b><br><small class="mut">${RARITY_NAME[HEROES[c.hero].rarity]} · Lv ${c.level} · by ${esc(c.seller)}</small></div><span class="sp"></span><b class="nums">${num(c.price)}g</b><button class="btn sm" type="button" data-act="buy-card" data-id="${c.id}">Buy</button></div>`).join('');
  const orders = (s.orders || []).map(o => `<div class="li">${esc(o.text)}<span class="sp"></span><span class="${o.good ? 'lm' : 'mut'}">${esc(o.meta)}</span></div>`).join('');
  return `<div style="display:grid;grid-template-columns:1fr 1fr 300px;gap:12px;align-content:start">
<div class="panel" style="grid-column:span 2"><div class="row" style="margin-bottom:6px"><b class="h" style="font-size:20px">Market</b><span class="tag c">Prices move as players trade</span><div class="sp"></div>${btn('Sell something', 'list', 'sm')}</div>
 <div class="li dim" style="font-size:11px;letter-spacing:.12em;text-transform:uppercase"><span style="width:26px"></span><span style="width:160px">Item</span><span style="width:80px">Price</span><span style="width:60px">Today</span><span style="width:70px">For sale</span></div>
 ${rows}</div>
<div class="panel glow" style="grid-row:span 2"><div class="ph">${ico('portal','ico')}<div><h3>Waystone deals</h3><small>Buy cheap abroad, sell at home</small></div></div>
 <div class="list">${CITIES.filter(c => c.deal).map(c => `<div class="li"><b>${c.name}</b><span class="sp"></span><span class="lm">${c.deal}</span></div>`).join('')}</div>
 <div class="mut" style="font-size:12.5px;margin:8px 0">You can carry 30 items per trip. Bandits strike the Emberfall road at night.</div>
 ${btn('Plan a trip', 'go', 'c').replace('data-act="go"', 'data-go="travel"')}
 <div class="ph" style="margin-top:16px"><h3>Your orders</h3></div><div class="list">${orders || '<div class="li mut">No open orders.</div>'}</div></div>
<div class="panel" style="grid-column:span 3"><div class="ph">${ico('moonsilver_bar','ico')}<div><h3>Moonsilver bar, last 7 days</h3><small>A crew is buying for the Bishop raid.</small></div><div class="sp"></div><b class="h lm" style="font-size:20px">${priceLabel(s, 'moonsilver_bar')}g</b></div>
<svg viewBox="0 0 1000 110" style="width:100%;height:64px" preserveAspectRatio="none"><defs><linearGradient id="gg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#36d6ff" stop-opacity=".35"/><stop offset="1" stop-color="#36d6ff" stop-opacity="0"/></linearGradient></defs><polygon fill="url(#gg)" points="0,110 0,80 90,74 180,86 270,70 360,72 450,60 540,66 630,52 720,58 810,40 900,30 1000,12 1000,110"/><polyline fill="none" stroke="#36d6ff" stroke-width="3" points="0,80 90,74 180,86 270,70 360,72 450,60 540,66 630,52 720,58 810,40 900,30 1000,12"/></svg></div>
<div class="panel" style="grid-column:span 2"><div class="ph">${ico('cards','ico')}<div><h3>Cards for sale</h3><small>Trade with real players</small></div></div><div class="list">${cards || '<div class="li mut">No cards on the table.</div>'}</div></div>
</div>`;
}
function priceLabel(s, item) {
  const row = (s.listings || []).find(l => l.item === item);
  return row ? row.price : (ITEMS[item]?.value || 0);
}

function hustlesView(s) {
  const lv = hustleLevel(s);
  const rows = HUSTLES.map(j => {
    const locked = j.locked && lv < (j.need || 99);
    return `<div class="panel" style="padding:10px;${locked ? 'opacity:.5' : ''}"><div class="row">${ico(locked ? 'shackle' : 'mask', 'ico')}<div style="flex:1"><b>${esc(j.name)}</b><div style="font-size:12px"><span class="lm">Win: ${esc(j.win)}</span> · <span class="pk">Fail: ${esc(j.fail)}</span></div></div>
<div style="width:120px"><div class="row" style="font-size:11.5px"><span class="mut">Chance</span><div class="sp"></div><b class="nums">${locked ? 0 : j.chance}%</b></div>${bar(locked ? 0 : j.chance, 'l')}</div>
<span class="tag p">Daring ${j.daring}</span>${locked ? '<span class="btn sm g">Locked</span>' : `<button class="btn sm" type="button" data-act="hustle" data-job="${j.id}">Do it</button>`}</div></div>`;
  }).join('');
  const log = (s.hustleLog || []).map(h => `<div class="li"><span class="${h.result === 'Won' ? 'lm' : 'pk'}">${esc(h.result)}</span> ${esc(h.detail)}<span class="sp"></span><b class="nums">${esc(h.gold)}</b></div>`).join('');
  const who = s.stocksWho;
  return `<div style="display:grid;grid-template-columns:1fr 320px;gap:12px;height:100%">
<div class="g" style="align-content:start;overflow:auto">
 <div class="panel"><div class="row" style="gap:14px">${ico('mask')}<div style="flex:1"><div class="row"><b class="h" style="font-size:20px">Hustles</b><span class="tag l">Hustle Lv ${lv}</span><div class="sp"></div><span class="mut nums" style="font-size:12px">Daring ${s.daring} / ${s.daringMax}, +1 every 4 min</span></div>${bar(Math.round(100 * s.daring / s.daringMax), 'p thick')}</div></div>
 <div class="mut" style="font-size:12.5px;margin-top:8px">Quick jobs on the wrong side of the law. Spend Daring, take your chances, and grab gold the fast way. Get caught and you sit in the Stocks.</div></div>
 ${rows}
 ${s.crew ? `<div class="panel glow"><div class="ph">${ico('dice','ico')}<div><h3>Crew heist: The Royal Mint</h3><small>Plan it with 4 crewmates. Takes 2 hours to pull off.</small></div><div class="sp"></div><span class="tag l">Huge payout</span></div>
 <div class="row"><span class="mut" style="font-size:12.5px">Split 40,000 gold, plus a shot at a legendary card. If the guards catch you, the whole crew sits in the Stocks.</span><div class="sp"></div>${btn('Join the heist', 'heist')}</div></div>` : ''}
</div>
<div class="g" style="align-content:start">
 <div class="panel glow"><div class="ph">${ico('shackle','ico')}<div><h3>The Stocks</h3><small>The town jail</small></div></div>
  ${(s.stocksUntil > s.now || (who && who.until > s.now)) ? `<div class="row"><img class="px" src="/assets/portrait/${who?.face || 'gangster'}.png" style="width:44px;height:44px;border-radius:8px;object-fit:cover" alt=""><div style="flex:1"><b>${esc(who?.name || 'Someone')} is locked up</b><br><small class="mut">${esc(who?.reason || 'Caught')}</small></div><b class="nums pk">${clock((s.stocksUntil > s.now ? s.stocksUntil : who.until) - s.now)}</b></div><div class="row" style="margin-top:10px">${btn('Pay bail, 900g', 'bail', 'sm')}${btn('Ask the crew', 'ask', 'sm g')}</div>` : '<p class="mut">The Stocks are empty.</p>'}
 </div>
 <div class="panel"><div class="ph"><h3>Last jobs</h3></div><div class="list">${log || '<div class="li mut">No jobs yet.</div>'}</div></div>
 ${s.heroes.gangster ? `<div class="panel"><div class="ph"><h3>Hero bonus</h3></div><div class="row">${cardFront('gangster', s.heroes.gangster.level, 0.55)}<div style="font-size:12.5px"><b class="lm">+15% hustle chance</b><br><span class="mut">Vincenzo has done this before. Many times.</span></div></div></div>` : ''}
</div></div>`;
}

function crewView(s) {
  if (!s.crew) return `<div class="panel" style="max-width:560px"><div class="ph"><h3>No crew yet</h3></div><p class="mut">Raise a banner or walk in with a code a friend gives you.</p>
 <form data-act="crew-create" class="g"><input name="name" placeholder="Crew name" aria-label="Crew name" style="background:#100818;border:1px solid var(--line2);color:var(--ink);border-radius:10px;padding:10px"><div class="row">${btn('Raise the banner', 'submit')}</div></form>
 <form data-act="crew-join" class="row" style="margin-top:12px"><input name="code" placeholder="Crew code" aria-label="Crew code" style="background:#100818;border:1px solid var(--line2);color:var(--ink);border-radius:10px;padding:10px;flex:1">${btn('Join', 'submit', 'g')}</form></div>`;
  const c = s.crew;
  const members = (c.roster || []).map(m => `<div class="li"><img class="px" src="/assets/portrait/${m.face}.png" style="width:36px;height:36px;border-radius:8px;object-fit:cover" alt=""><div><b>${esc(m.name)}</b> <span class="tag ${m.role === 'Leader' ? 'p' : ''}">${esc(m.role)}</span><br><small class="mut">${esc(m.line)}</small></div><span class="sp"></span><span style="width:8px;height:8px;border-radius:50%;background:${m.on ? 'var(--lime)' : 'var(--dim)'}"></span></div>`).join('');
  const chat = (c.chat || []).map(m => `<div class="li" style="align-items:flex-start"><img class="px" src="/assets/portrait/${m.face}.png" style="width:28px;height:28px;border-radius:6px;object-fit:cover" alt=""><div><b class="${m.color || 'cy'}">${esc(m.who)}</b> <small class="dim">${esc(m.t)}</small><br>${esc(m.text)}</div></div>`).join('');
  const cup = (c.cup || []).map((row, i) => `<div class="li" style="${row[0] === c.name ? 'color:var(--pink)' : ''}">${i + 1}. ${esc(row[0])}<span class="sp"></span><b class="nums">${num(row[1])}</b></div>`).join('');
  return `<div style="display:grid;grid-template-columns:300px 1fr 300px;gap:12px;height:100%">
<div class="g" style="align-content:start"><div class="panel glow"><div class="row">${ico('banner')}<div><b class="h" style="font-size:19px">${esc(c.name)}</b><br><small class="mut">${c.members} / ${c.max} members · Rank ${c.rank}</small></div></div>
 <div class="mut" style="font-size:12.5px;margin:8px 0">${esc(c.motto)}</div><div class="row"><span class="tag l">Crew perk: ${esc(c.perk)}</span><span class="tag c">Vault ${num(c.vaultOre)} ore</span></div></div>
 <div class="panel"><div class="ph"><h3>Members</h3><small>${c.online} online</small></div><div class="list">${members}</div></div></div>
<div class="panel" style="display:flex;flex-direction:column;min-height:0"><div class="ph">${ico('chat','ico')}<h3>Crew chat</h3><div class="sp"></div><span class="tag l">Live</span></div>
 <div class="list" style="flex:1;overflow:auto">${chat}</div>
 <form data-act="chat" class="row" style="padding:8px;border:1px solid var(--line2);border-radius:12px;background:rgba(0,0,0,.25)"><input name="text" placeholder="Say something to your crew..." aria-label="Message" style="flex:1;background:transparent;border:0;color:var(--ink);outline:none">${btn('Send', 'submit', 'sm')}</form></div>
<div class="g" style="align-content:start">
 <div class="panel"><div class="ph"><h3>This week's goal</h3></div><div style="font-size:13px">Fill the vault with ${num(c.goal)} Moonsilver</div>${bar(Math.round(100 * c.vaultOre / c.goal), 'l')}<small class="mut">Reward: an Epic card pack for every member</small><div class="row" style="margin-top:8px">${btn('Give 100 ore', 'give', 'sm')}</div></div>
 <div class="panel glow"><div class="ph">${ico('swords','ico')}<div><h3>Crew raid tonight</h3><small>9:00 PM</small></div></div><div class="row">${ico('boss_bishop')}<div style="font-size:12.5px"><b class="pk">${esc(c.raid || 'The Hollow Bishop')}</b><br><span class="mut">Bring 5 heroes each. ${c.raidN || 0} signed up.</span></div></div>${btn('Sign up my squad', 'raid')}</div>
 <div class="panel"><div class="ph">${ico('trophy','ico')}<h3>Crew Cup</h3></div><div class="list">${cup}</div></div>
</div></div>`;
}

function travelView(s) {
  const here = CITIES.find(c => c.id === s.city) || CITIES[0];
  const rows = CITIES.map(c => `<div class="panel ${c.id === s.city ? 'glowc' : ''}"><div class="row"><b class="h" style="font-size:18px">${esc(c.name)}</b><span class="tag">${c.id === s.city ? 'You are here' : ''}</span><div class="sp"></div><span class="mut">${esc(c.note)}</span></div>
 ${c.deal ? `<div class="lm" style="margin:6px 0">${esc(c.deal)}</div>` : ''}${c.id !== s.city ? btn('Step through, 25 min', 'travel-' + c.id, 'sm c') : ''}</div>`).join('');
  const road = s.travel ? `<div class="panel glow"><b>On the road</b><p class="mut">The waystone closes in ${clock(s.travel.until - s.now)}.</p></div>` : '';
  return `<div class="g" style="max-width:880px"><div class="panel"><div class="ph">${ico('portal','ico')}<div><h3>Waystones</h3><small>Now: ${esc(here.name)}</small></div></div><p class="mut">You can carry 30 items per trip. Bandits strike the Emberfall road at night.</p></div>${road}<div class="g" style="grid-template-columns:1fr 1fr">${rows}</div></div>`;
}

function infirmaryView(s) {
  const rows = s.infirmary.filter(i => i.until > s.now).map(i => `<div class="li"><img class="px" src="/assets/portrait/${i.face || i.id}.png" style="width:40px;height:40px;border-radius:8px;object-fit:cover" alt=""><div><b>${esc(i.name)}</b><br><small class="mut">${esc(i.reason)}</small></div><span class="sp"></span><b class="nums cy">${clock(i.until - s.now)}</b></div>`).join('');
  const jail = s.stocksUntil > s.now ? `<div class="panel glow"><div class="ph"><h3>The Stocks</h3></div><p>${esc(s.stocksWho?.name || 'A hustler')} sits the lock for ${clock(s.stocksUntil - s.now)}.</p>${btn('Pay bail, 900 gold', 'bail', 'sm')}</div>` : '';
  return `<div class="g" style="max-width:720px"><div class="panel"><div class="ph">${ico('cross','ico')}<div><h3>Infirmary</h3><small>Rest, then walk</small></div></div><div class="list">${rows || '<div class="li mut">The beds are made and empty.</div>'}</div></div>${jail}</div>`;
}

function crierView(s) {
  const rows = s.crier.map(c => `<div class="li blk"><span class="tag p">${esc(c.tag)}</span> ${esc(c.msg)}</div>`).join('');
  return `<div class="panel" style="max-width:820px"><div class="ph">${ico('paper','ico')}<div><h3>The Aldermere Crier</h3><small>Live from the streets</small></div><div class="sp"></div><span class="tag l">Live</span></div>
 <div class="list">${rows}</div><p class="mut" style="margin-top:10px">Hero arrivals stay off the paper. The city talks about gold, bosses, and trouble.</p></div>`;
}

function welcomeView(s) {
  const w = s.welcome || {away:'a while', lines:[], note:null, chat:''};
  const lines = (w.lines || []).map(l => `<div class="li">${ico(l.icon)}<span>${esc(l.text)}</span><span class="sp"></span><b class="${l.cls || ''} nums">${esc(l.value)}</b></div>`).join('');
  return `<div class="g" style="max-width:640px">
 <div class="scene" style="height:180px;background-image:url(/assets/gen/city_bg.png)"><div style="position:absolute;left:16px;top:16px;z-index:2"><div class="eb cy">You were away ${esc(w.away)}</div><div class="h" style="font-size:28px">Welcome back, ${esc(s.name)}!</div></div></div>
 <div class="panel"><div class="ph"><h3>While you were gone</h3><div class="sp"></div><small>Up to 24h counts</small></div><div class="list">${lines}</div></div>
 ${w.note ? `<div class="panel glow"><div class="row"><img class="px" src="/assets/portrait/${w.note.face}.png" style="width:42px;height:42px;border-radius:8px;object-fit:cover" alt=""><div><b>${esc(w.note.title)}</b><br><span class="mut">${esc(w.note.text)}</span></div></div></div>` : ''}
 ${w.chat ? `<div class="panel"><div class="row">${ico('chat','ico')}<div><b>Crew chat</b><br><span class="mut">${esc(w.chat)}</span></div></div></div>` : ''}
 ${btn('Collect everything', 'collect', 'l')}
</div>`;
}

function phoneHome(s) {
  return `<div class="scene" style="height:180px;background-image:url(/assets/gen/city_bg.png)"><div style="position:absolute;inset:0;z-index:1">${frontRow([
    {id:'legionary', anim:'idle', x:70, y:150, scale:2.2},
    {id:'engineer', anim:'idle', x:150, y:150, scale:2.2},
    {id:'will_slapton', anim:'skill', x:230, y:150, scale:2.2},
    {id:'paramedic', anim:'idle', x:320, y:155, scale:2.0}
  ])}</div><div style="position:absolute;left:12px;top:10px;z-index:2"><div class="eb cy">Aldermere</div><div class="h" style="font-size:20px">Your squad is on shift</div></div></div>
<div class="row" style="gap:6px"><div class="meter m-c" style="flex:1">${ico('bolt')}<div><div class="mrow"><b>Vigor</b><span class="nums">${s.vigor}/${s.vigorMax}</span></div>${bar(Math.round(100*s.vigor/s.vigorMax))}<small>+5 in 4:12</small></div></div><div class="meter m-p" style="flex:1">${ico('flame')}<div><div class="mrow"><b>Daring</b><span class="nums">${s.daring}/${s.daringMax}</span></div>${bar(Math.round(100*s.daring/s.daringMax))}<small>+1 in 2:40</small></div></div></div>
<div class="panel glow" style="display:flex;gap:12px;align-items:center">${cardFront('will_slapton', 1, 0.68)}<div><span class="tag p">Featured</span><div class="h" style="font-size:18px;margin:4px 0">Will Slapton</div><div class="mut" style="font-size:12px">One slap stuns any enemy. Double damage if they just told a joke.</div>${btn('Summon, 1 sigil', 'summon', 'sm')}</div></div>
<div class="g" style="grid-template-columns:1fr 1fr;gap:8px">
<div class="panel" style="padding:10px"><div class="row">${ico('swords','ico')}<b>Delve</b></div>${bar(s.delve ? 48 : 0, 'p')}<small class="mut">${s.delve ? 'Floor ' + s.delve.floor : 'Quiet'}</small></div>
<div class="panel" style="padding:10px" data-go="hustles"><div class="row">${ico('mask','ico')}<b>Hustles</b></div><small class="lm">${s.daring >= 5 ? 'Jobs ready' : 'Low Daring'}</small></div>
<div class="panel" style="padding:10px" data-go="crier"><div class="row">${ico('paper','ico')}<b>The Crier</b></div><small class="mut">${esc(s.crier[0]?.msg || '')}</small></div>
<div class="panel" style="padding:10px" data-go="crew"><div class="row">${ico('banner','ico')}<b>Crew</b></div>${bar(s.crew ? Math.round(100 * s.crew.vaultOre / s.crew.goal) : 0, 'l')}</div>
</div>`;
}

function phoneDelve(s) {
  if (!s.delve) return delveSetup(s);
  const d = s.delve;
  const fa = fightAt(d, s.now);
  const sh = fa ? fa.hp.reduce((a, x) => a + x, 0) : 1, sm = fa ? fa.max.reduce((a, x) => a + x, 0) : 1;
  const f0 = fa && fa.foes[0];
  const lines = fa ? fa.seen.slice(-4).reverse() : [];
  const ready = d.ends <= s.now;
  return `<div class="row"><b class="h" style="font-size:19px">${esc(d.name)}</b><span class="tag p">Floor ${d.floor}</span>${fa ? `<span class="tag">Room ${fa.room}/${fa.rooms}</span>` : ''}</div>
<div class="scene" style="height:210px;background-image:url(/assets/bg_dungeon.png)"><div style="position:absolute;inset:0;z-index:1">${sideSprite('legionary','idle',2,80,170,false)}${sideSprite('engineer','attack',2,160,170,false)}${sideSprite('ghoul','attack',2,250,170,false)}${sideSprite('skeleton','idle',2,320,170,false)}</div>
<div style="position:absolute;left:10px;right:10px;top:8px;z-index:2" class="row"><div style="flex:1"><small>Squad ${sh}/${sm}</small>${bar(Math.round(100 * sh / Math.max(1, sm)), 'l')}</div><div style="flex:1"><small>${esc(f0 ? f0.name : 'Foe')}</small>${bar(f0 ? Math.round(100 * f0.hp / Math.max(1, f0.max)) : 0, 'p')}</div></div></div>
<div class="panel" style="font-size:13px">${lines.map(e => `<div>${esc(e.x)} ${e.v ? `<b class="${e.c === 'hurt' || e.c === 'down' ? 'pk' : e.c === 'heal' ? 'lm' : 'cy'}">${esc(e.v)}</b>` : ''}</div>`).join('') || 'The squad is still on the stairs.'}</div>
${ready ? `<div class="row">${btn('Bring it home', 'claim')}</div>` : ''}
<div class="panel glow"><div style="font-size:13px;margin-bottom:8px">Push for more loot, or play it safe?</div><div class="g" style="gap:8px">${btn('Kick the boiling pot at it', 'choice-kick')}${btn('Raise the shield wall', 'choice-shield', 'c')}${btn('Eat and heal first', 'choice-eat', 'g')}</div></div>`;
}

function phoneCard(s) {
  const id = s.sel && HEROES[s.sel] ? s.sel : (Object.keys(s.heroes)[0] || 'will_slapton');
  const h = HEROES[id]; const own = s.heroes[id];
  return `<div class="row"><b class="h" style="font-size:20px">${esc(h.name)}</b><span class="tag p">${RARITY_NAME[h.rarity]}</span></div>
<div class="row" style="flex-wrap:wrap;gap:6px">${Object.keys(s.heroes).map(x => `<button type="button" class="tag ${x === id ? 'p' : ''}" data-act="sel" data-hero="${x}">${esc(HEROES[x].name.split(' ')[0])}</button>`).join('')}</div>
<div style="display:flex;justify-content:center;padding:8px 0 16px">${cardHTML(h, {level: own ? own.level : 1, gear: own ? ((s.gear || {})[id] || {}) : {}, stock: s.bag, z: 1.55, flipped: !!s.showBack, view: s.cardView || 'gear', id: 'card-' + id, mine: !!own && !s.preview})}</div>
<div class="row" style="justify-content:center">${btn('Send on a delve', 'party-add')}</div>`;
}

function nowbar(s) {
  if (!s.active) return '';
  const sk = s.skills[s.active];
  const node = (NODES[s.active] || []).find(n => n.id === sk.node);
  const meta = SKILLS.find(x => x.id === s.active);
  return `<div class="nowbar">${ico(ITEMS[node?.item]?.icon || meta.icon)}<div><b>${esc(meta.name)}${node ? ' ' + esc(node.name.split(' ')[0]) : ''}</b><br><small>Lv ${skillLevel(s, s.active)}</small></div>${bar(s.freeze && s.bars ? s.bars.skill : 50)}<small class="nums">${s.freeze && s.active === 'mining' ? '1.8s' : (intervalMs(s, s.active, sk.node) / 1000).toFixed(1) + 's'}</small></div>`;
}

function tabs(s) {
  const items = [['city','tower','City'],['skills','pickaxe','Skills'],['delve','swords','Delve'],['cards','cards','Cards'],['crew','banner','Crew']];
  const cur = ['mining','woodcutting','fishing','cooking','smithing','alchemy','summoning'].includes(s.view) ? 'skills' : (s.view === 'welcome' ? 'city' : s.view);
  return `<nav class="tabs">${items.map(([id, icon, name]) => `<a class="${cur === id ? 'on' : ''}" href="#${id === 'skills' ? (s.active || 'mining') : id}" data-go="${id === 'skills' ? (s.active || 'mining') : id}">${ico(icon)}${name}${id === 'crew' && s.unread ? '<span class="dot"></span>' : ''}</a>`).join('')}</nav>`;
}

function desktopBody(s) {
  const v = s.view;
  if (v === 'city') return cityDesk(s);
  if (SKILLS.some(sk => sk.id === v)) return skillView(s, v);
  if (v === 'cards') return cardsView(s);
  if (v === 'delve') return delveView(s);
  if (v === 'bank') return bankView(s);
  if (v === 'market') return marketView(s);
  if (v === 'hustles') return hustlesView(s);
  if (v === 'crew') return crewView(s);
  if (v === 'travel') return travelView(s);
  if (v === 'infirmary') return infirmaryView(s);
  if (v === 'crier') return crierView(s);
  if (v === 'welcome') return welcomeView(s);
  return cityDesk(s);
}

const CRUMB = {city:['Aldermere','City Hub'], mining:['Skills','Mining'], woodcutting:['Skills','Woodcutting'], fishing:['Skills','Fishing'], cooking:['Skills','Cooking'], smithing:['Skills','Smithing'], alchemy:['Skills','Alchemy'], summoning:['Skills','Summoning'], cards:['Adventure','Cards'], delve:['Adventure','Delve'], bank:['Adventure','Bank'], market:['The City','Market'], hustles:['The City','Hustles'], crew:['The City','Crew'], travel:['The City','Travel'], infirmary:['The City','Infirmary'], crier:['The City','The Crier'], welcome:['Aldermere','Welcome back']};

export function render(s) {
  GEARS = s.gear || {};
  if (s.phone) {
    let body = '';
    if (s.view === 'welcome') body = welcomeView(s);
    else if (s.view === 'delve') body = phoneDelve(s);
    else if (s.view === 'cards') body = phoneCard(s);
    else if (s.view === 'city') body = phoneHome(s);
    else body = desktopBody(s);
    return `<div class="phone"><header class="ptop"><img class="logo" src="/assets/logo.svg" alt="OverSummoned"><div class="sp"></div><span class="chip">${ico('coin')}${num(s.gold)}</span><button class="bell" type="button" data-go="crew">${ico('banner')}${s.unread ? `<b>${s.unread}</b>` : ''}</button></header><div class="pbody">${body}</div>${nowbar(s)}${tabs(s)}</div>`;
  }
  const crumb = CRUMB[s.view] || CRUMB.city;
  return `<div class="app">${rail(s)}<div class="main">${top(s, crumb[0], crumb[1])}<div class="content">${desktopBody(s)}</div></div></div>`;
}

export function gate(msg) {
  return `<div class="phone" style="align-items:center;justify-content:center"><div class="panel" style="max-width:420px;margin:24px"><img class="logo" src="/assets/logo.svg" alt="OverSummoned" style="height:36px"><h2 class="h" style="font-size:28px;margin:12px 0">That did not open.</h2><p class="mut">${esc(msg)}</p><div class="row" style="margin-top:12px"><a class="btn" href="/">Back to the city</a></div></div></div>`;
}
