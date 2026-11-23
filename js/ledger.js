import { SB_URL, SB_KEY, DEFAULT_CONFIG } from './catalog.js';

const root = document.getElementById('root');
const toastEl = document.getElementById('toast');
const preview = new URLSearchParams(location.search).get('preview') === '1';
let sb = null;
let view = 'dash';
let data = null;
let player = null;
let q = '';

function toast(t) {
  toastEl.textContent = t;
  toastEl.className = 'toast on';
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => { toastEl.className = 'toast'; }, 2400);
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function spark(points, color) {
  const vals = (points || []).map(p => +p.n || 0);
  if (!vals.length) vals.push(0, 0);
  const max = Math.max(1, ...vals);
  const step = 1000 / Math.max(1, vals.length - 1);
  const pts = vals.map((v, i) => `${Math.round(i * step)},${Math.round(100 - (v / max) * 80)}`).join(' ');
  return `<svg viewBox="0 0 1000 110" style="width:100%;height:72px" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="3" points="${pts}"/></svg>`;
}

function sample() {
  const days = (key) => Array.from({length: 10}, (_, i) => ({d: 'day ' + (i + 1), n: 2 + ((i * 3 + key) % 9)}));
  return {
    totals: {players: 1, waitlist: 1, delves: 4, cards: 2, items: 80, volume: 12400, crews: 1},
    signups: days(1), actives: days(2), delves: days(3), cards: days(1), items: days(4), volume: days(5).map(d => ({d:d.d, n:d.n * 400})),
    users: [{uid:'preview', name:'Dean', email:'owner@example.com', gold:48210, sigils:7, vigor:72, daring:18, banned:false, seen:'today'}],
    waitlist: [{email:'preview-test@example.com', created_at:'2026-11-21'}],
    config: DEFAULT_CONFIG,
    crier: [{tag:'Streets', msg:'The Hollow Bishop chest cracked open. Moonsilver spilled across the tavern floor.'}],
    listings: [{id:1, item:'moonsilver_bar', qty:20, price:41, seller:'city'}],
    crews: [{id:'c', name:'Neon Lanterns', members:6, cup:38770}],
    audit: [{at:'today', admin:'owner', action:'open', target:'books', detail:'{}'}]
  };
}

function shell(body) {
  const item = (id, label) => `<a class="${view===id?'on':''}" href="#${id}" data-go="${id}">${label}<span></span></a>`;
  return `<div class="app"><aside class="rail"><img class="logo" src="/assets/logo.svg" alt="OverSummoned">
<div class="me"><div><b>The books</b><small>Owner only</small></div></div>
<h6>House</h6><nav class="nav">
${item('dash','Dashboard')}${item('players','Players')}${item('waitlist','Waitlist')}${item('tuning','Tuning')}
${item('crier','The Crier')}${item('market','Market')}${item('crews','Crews')}${item('audit','Audit')}
</nav>
<div style="margin-top:auto" class="dim"><a href="/play" style="color:var(--mut)">Back to the city</a></div>
</aside><div class="main"><header class="top"><div class="tt"><div class="crumb">OverSummoned</div><div class="title">${titleOf(view)}</div></div><div class="sp"></div></header>
<div class="content" style="overflow:auto">${body}</div></div></div>`;
}
function titleOf(v){ return {dash:'Dashboard', players:'Players', player:'Player', waitlist:'Waitlist', tuning:'Tuning', crier:'The Crier', market:'Market', crews:'Crews', audit:'Audit'}[v] || 'Books'; }

function dash() {
  const t = data.totals || {};
  const card = (series, total, label, color) => `<div class="panel"><div class="ph"><h3>${label}</h3><div class="sp"></div><b class="h">${(t[total]||0).toLocaleString()}</b></div>${spark(data[series], color)}</div>`;
  return `<div class="g" style="grid-template-columns:1fr 1fr;align-content:start">
${card('signups','waitlist','Names on the list','#ff2e8a')}
${card('actives','players','Players seen','#36d6ff')}
${card('delves','delves','Delves run','#c6ff3d')}
${card('items','items','Items found','#9b5cff')}
${card('cards','cards','Cards found','#ff8a1f')}
${card('volume','volume','Market gold','#36d6ff')}
</div>`;
}

function players() {
  const rows = (data.users || []).map(u => `<tr><td><button class="btn sm g" type="button" data-user="${esc(u.uid)}">${esc(u.name)}</button></td><td>${esc(u.email||'')}</td><td class="nums">${(u.gold||0).toLocaleString()}</td><td>${u.banned ? 'Shut out' : 'In the city'}</td><td>${esc(u.seen||'')}</td></tr>`).join('');
  return `<div class="panel"><div class="row"><input id="q" placeholder="Search a name" aria-label="Search" value="${esc(q)}"><button class="btn sm" type="button" id="search">Search</button></div>
<table class="ledger-table"><thead><tr><th>Name</th><th>Email</th><th>Gold</th><th></th><th>Seen</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No one in the book yet.</td></tr>'}</tbody></table></div>`;
}

function playerView() {
  const p = player;
  if (!p) return '<div class="panel">Pick a player.</div>';
  const f = (name, val) => `<label class="mut">${name}<br><input data-field="${name}" value="${esc(val ?? '')}"></label>`;
  return `<div class="panel g"><div class="row"><b class="h" style="font-size:22px">${esc(p.name)}</b><span class="mut">${esc(p.email||'')}</span></div>
<div class="row" style="flex-wrap:wrap;align-items:flex-end">${f('gold', p.gold)}${f('sigils', p.sigils)}${f('vigor', p.vigor)}${f('daring', p.daring)}</div>
<div class="row">${f('skill', 'mining')}${f('skill_xp', p.skill_xp || 0)}${f('hero', 'engineer')}${f('hero_level', p.hero_level || 1)}</div>
<div class="row">${f('stocks_minutes', 0)}<label class="mut">Shut the door<br><input data-field="banned" type="checkbox" ${p.banned?'checked':''}></label></div>
<div class="row"><button class="btn" type="button" id="save-player">Save</button><button class="btn g" type="button" id="jail">Send to the Stocks</button></div>
<p class="dim">Hero arrivals stay off the Crier even from this room.</p></div>`;
}

function waitlist() {
  const rows = (data.waitlist || []).map(w => `<tr><td>${esc(w.email)}</td><td>${esc(w.created_at||'')}</td></tr>`).join('');
  return `<div class="panel"><div class="row"><b class="h" style="font-size:20px">Waitlist</b><div class="sp"></div><button class="btn sm" type="button" id="csv">Download the list</button></div>
<table class="ledger-table"><thead><tr><th>Email</th><th>When</th></tr></thead><tbody>${rows || '<tr><td colspan="2">The list is empty.</td></tr>'}</tbody></table></div>`;
}

function tuning() {
  const c = data.config || DEFAULT_CONFIG;
  return `<form class="panel g" id="tune">
<div class="row" style="flex-wrap:wrap"><label class="mut">XP rate<br><input name="xpRate" value="${c.xpRate}"></label>
<label class="mut">Market fee<br><input name="marketFee" value="${c.marketFee}"></label>
<label class="mut">Offline hours<br><input name="offlineHours" value="${c.offlineHours}"></label>
<label class="mut">Delve lengths<br><input name="delveMinutes" value="${(c.delveMinutes||[]).join(', ')}"></label></div>
<p class="mut">Drop weights, low to high. Common through Unhinged.</p>
<div class="row" style="flex-wrap:wrap">${Object.keys(c.dropRates||{}).map(k => `<label class="mut">${k}<br><input name="drop_${k}" value="${c.dropRates[k]}"></label>`).join('')}</div>
<button class="btn" type="submit">Save the tuning</button></form>`;
}

function crier() {
  const rows = (data.crier || []).map(c => `<div class="li blk"><span class="tag p">${esc(c.tag||'Streets')}</span> ${esc(c.msg)}</div>`).join('');
  return `<div class="panel g"><form id="post" class="g"><div class="row"><select name="tag"><option>Streets</option><option>Market</option><option>Crews</option><option>Breaking</option></select><input name="msg" placeholder="A line for the paper" aria-label="Line" style="flex:1"></div><button class="btn" type="submit">Post it</button></form><p class="mut">Lines that name a hero are refused. Arrivals stay quiet.</p><div class="list">${rows}</div></div>`;
}

function market() {
  const rows = (data.listings || []).map(l => `<tr><td>${esc(l.item||l.hero_id||l.kind)}</td><td>${l.qty||''}</td><td>${l.price}g</td><td>${esc(l.seller||'city')}</td><td><button class="btn sm g" type="button" data-drop="${l.id}">Take it down</button></td></tr>`).join('');
  return `<div class="panel"><table class="ledger-table"><thead><tr><th>Goods</th><th>Qty</th><th>Price</th><th>Who</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="5">The market is quiet.</td></tr>'}</tbody></table></div>`;
}

function crews() {
  const rows = (data.crews || []).map(c => `<tr><td>${esc(c.name)}</td><td>${c.members}</td><td>${(c.cup||0).toLocaleString()}</td><td><button class="btn sm g" type="button" data-disband="${esc(c.id)}">Disband</button></td></tr>`).join('');
  return `<div class="panel"><table class="ledger-table"><thead><tr><th>Crew</th><th>Members</th><th>Cup</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="4">No crews.</td></tr>'}</tbody></table></div>`;
}

function audit() {
  const rows = (data.audit || []).map(a => `<tr><td>${esc(a.at)}</td><td>${esc(a.admin)}</td><td>${esc(a.action)}</td><td>${esc(a.target)}</td><td class="dim">${esc(typeof a.detail==='string'?a.detail:JSON.stringify(a.detail||{}))}</td></tr>`).join('');
  return `<div class="panel" style="overflow:auto"><table class="ledger-table"><thead><tr><th>When</th><th>Who</th><th>Did</th><th>On</th><th>Note</th></tr></thead><tbody>${rows || '<tr><td colspan="5">No marks in the book.</td></tr>'}</tbody></table></div>`;
}

function paint() {
  if (!data) { root.innerHTML = '<div class="g-gate" style="display:grid;place-items:center;height:100vh">Opening the books...</div>'; return; }
  const body = {dash:dash, players:players, player:playerView, waitlist:waitlist, tuning:tuning, crier:crier, market:market, crews:crews, audit:audit}[view]();
  root.innerHTML = shell(body);
}

async function call(op, payload) {
  if (preview) { toast('This is a look at the books. Nothing is written.'); return null; }
  const { data: res, error } = await sb.rpc('os_admin', {op, payload: payload || {}});
  if (error) {
    const m = error.message || '';
    if (/not allowed/i.test(m)) { root.innerHTML = shell('<div class="panel"><h2 class="h">That did not open.</h2></div>'); return null; }
    if (/does not exist|PGRST202/i.test(m)) { toast('The books are still being bound.'); return null; }
    toast('That did not land.');
    return null;
  }
  return res;
}

async function load() {
  if (preview) { data = sample(); paint(); return; }
  const res = await call('dash', {days: 14});
  if (!res) { if (!data) data = {totals:{}, signups:[], users:[], waitlist:[], config:DEFAULT_CONFIG, crier:[], listings:[], crews:[], audit:[]}; paint(); return; }
  data = res;
  paint();
}

root.addEventListener('click', async (e) => {
  const go = e.target.closest('[data-go]');
  if (go) { e.preventDefault(); view = go.dataset.go; if (view!=='player') player=null; paint(); return; }
  if (e.target.id === 'search') { q = root.querySelector('#q').value; const res = await call('users', {q}); if (res) { data.users = res.users || res; view='players'; paint(); } return; }
  const u = e.target.closest('[data-user]');
  if (u) { const res = await call('user', {uid: u.dataset.user}); player = res && (res.player || res); view = 'player'; paint(); return; }
  if (e.target.id === 'csv') { download(); return; }
  if (e.target.id === 'save-player' || e.target.id === 'jail') { await savePlayer(e.target.id === 'jail'); return; }
  const drop = e.target.closest('[data-drop]');
  if (drop) { await call('market', {op:'remove', id: +drop.dataset.drop}); toast('Taken down.'); await reload('market'); return; }
  const dis = e.target.closest('[data-disband]');
  if (dis) { await call('crew', {op:'disband', id: dis.dataset.disband}); toast('The banner comes down.'); await reload('crews'); return; }
});
root.addEventListener('submit', async (e) => {
  if (e.target.id === 'tune') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const drop = {};
    for (const [k,v] of fd.entries()) if (k.startsWith('drop_')) drop[k.slice(5)] = +v;
    const value = {xpRate:+fd.get('xpRate'), marketFee:+fd.get('marketFee'), offlineHours:+fd.get('offlineHours'), delveMinutes:String(fd.get('delveMinutes')).split(',').map(s=>+s.trim()).filter(Boolean), dropRates:drop};
    await call('config', {value});
    toast('Tuning saved.');
  }
  if (e.target.id === 'post') {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = await call('crier', {tag: fd.get('tag'), msg: fd.get('msg')});
    if (res && res.refused) toast('That line names a hero. Hero arrivals stay off the paper.');
    else { toast('Posted.'); await reload('crier'); }
  }
});

async function savePlayer(jail) {
  if (!player) return;
  const patch = {};
  root.querySelectorAll('[data-field]').forEach(el => {
    if (el.type === 'checkbox') patch.banned = el.checked;
    else patch[el.dataset.field] = el.value;
  });
  if (jail) patch.stocks_minutes = 30;
  await call('set', {uid: player.uid, patch});
  toast('Written.');
}

function download() {
  const rows = [['email','when']].concat((data.waitlist||[]).map(w => [w.email, w.created_at||'']));
  const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = 'waitlist.csv';
  a.click();
}

async function reload(which) {
  const res = await call(which === 'market' ? 'market' : which === 'crews' ? 'crews' : which === 'crier' ? 'crier' : 'dash', {});
  if (!res) return;
  if (which === 'market') data.listings = res.listings || res;
  else if (which === 'crews') data.crews = res.crews || res;
  else if (which === 'crier') data.crier = res.crier || res;
  else Object.assign(data, res);
  view = which;
  paint();
}

async function boot() {
  if (preview) { await load(); return; }
  try { sb = window.supabase.createClient(SB_URL, SB_KEY, {auth:{persistSession:true, detectSessionInUrl:true}}); } catch (e) { sb = null; }
  const session = sb && (await sb.auth.getSession()).data.session;
  if (!session) {
    root.innerHTML = `<div class="land"><header class="land-top"><a href="/"><img class="logo" src="/assets/logo.svg" alt="OverSummoned"></a><div class="sp"></div><a class="btn gold sm" href="/story">The Story</a><a class="btn g sm" href="/?login=1">Log in</a></header><main class="land-main"><div class="panel" style="max-width:460px"><h2 class="h" style="font-size:28px">Sign in to open the books.</h2><p class="mut">Use the same sign-in as the city.</p><a class="btn" id="ledger-login" href="/?login=1">Log in</a></div></main><footer class="land-foot"><a href="/"><img class="logo" src="/assets/logo.svg" alt="OverSummoned"></a><div>OverSummoned. 18+. Free.</div><nav class="foot-links" aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav></footer></div>`;
    return;
  }
  await load();
}
boot();
