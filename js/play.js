import { SB_URL, SB_KEY, HEROES, ITEMS } from './catalog.js';
import { bibleState, freshState, tick, dispatch } from './engine.js';
import { render, gate } from './ui.js';

const root = document.getElementById('root');
const toastEl = document.getElementById('toast');
const params = new URLSearchParams(location.search);
const preview = params.get('preview') === '1';
let state = null;
let sb = null;
let remote = false;
let heroModal = null;

function toast(t) {
  if (!t) return;
  toastEl.textContent = t;
  toastEl.className = 'toast on';
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => { toastEl.className = 'toast'; }, 2800);
}

function save() {
  if (preview || remote) return;
  try { localStorage.setItem('os_save_v1', JSON.stringify(state)); } catch (e) {}
}

function paint() {
  state.phone = matchMedia('(max-width: 860px)').matches;
  state.view = (location.hash || '#city').slice(1) || 'city';
  if (state.view === 'skills') state.view = state.active || 'mining';
  root.innerHTML = render(state);
  if (params.get('shot') === '1') document.body.classList.add('still');
  if (heroModal) showHero(heroModal);
}

function showHero(hero) {
  if (!hero || !HEROES[hero.id]) return;
  const h = HEROES[hero.id];
  const old = document.getElementById('hero-pop');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'hero-pop';
  el.className = 'pop';
  el.innerHTML = `<div class="panel glow" style="width:min(420px,92vw)"><div class="eb">${hero.fresh ? 'Someone new is in the torchlight' : 'Another copy came home'}</div><h3 class="h" style="font-size:26px;margin:6px 0">${h.name}</h3><p class="mut">${h.title}. This stays between you and the squad.</p><div class="row" style="margin-top:12px"><button class="btn" type="button" id="hero-ok">Keep them close</button></div></div>`;
  document.body.appendChild(el);
  el.querySelector('#hero-ok').onclick = () => { el.remove(); heroModal = null; };
}

function act(type, data, form) {
  if (type === 'go') return;
  const map = {
    stop: {type:'stop'},
    collect: {type:'collect'},
    summon: {type:'summon'},
    pack: {type:'pack'},
    bail: {type:'bail'},
    forge: {type:'forge'},
    heist: {type:'heist'},
    burst: {type:'burst', skill: state.view},
    level: {type:'level', hero: state.sel},
    'party-add': {type:'party', ids: Array.from(new Set([...(state.party || []), state.sel])).slice(0, 3)},
    show: {type:'chat', text: (HEROES[state.sel]?.name || 'A card') + ' is on the table.'},
    give: {type:'crew-give', qty: 100},
    raid: {type:'chat', text: 'My squad is in for the raid.'},
    ask: {type:'chat', text: 'Can the crew help with bail?'},
    travel: {type:'travel', dest: 'sable'},
    'choice-kick': {type:'choice', choice:'kick'},
    'choice-shield': {type:'choice', choice:'shield'},
    'choice-eat': {type:'choice', choice:'eat'},
    claim: {type:'claim'},
    'delve-go': {type:'delve', floor: state.floor || 1, minutes: state.pickMin || 15},
    hustle: {type:'hustle', id: data.job || 'dice'},
    sell: {type:'sell', item: data.item || state.pick, qty: 1},
    buy: {type:'buy', item: data.item, qty: 1},
    list: {type:'list', item: state.pick, qty: 1, price: (ITEMS[state.pick] && ITEMS[state.pick].value) || 10},
    skill: {type:'skill', skill: data.skill, node: data.node},
    pick: null,
    rar: null,
    len: null,
    floor: null,
    'toggle-party': null,
    bank: null,
    sel: null,
    flip: null
  };
  if (type === 'pick') { state.pick = data.item; paint(); return; }
  if (type === 'sel') { state.sel = data.hero; state.showBack = false; paint(); return; }
  if (type === 'flip') { state.showBack = state.showBack === false; paint(); return; }
  if (type === 'rar') { state.rar = state.rar === data.rar ? 'all' : data.rar; paint(); return; }
  if (type === 'len') { state.pickMin = +data.min; paint(); return; }
  if (type === 'floor') {
    const dir = +data.dir;
    state.floor = Math.max(1, Math.min(state.deepest || 1, (state.floor || 1) + dir));
    paint(); return;
  }
  if (type === 'toggle-party') {
    const id = data.hero;
    const party = state.party.slice();
    const i = party.indexOf(id);
    if (i >= 0) party.splice(i, 1);
    else if (party.length < 3) party.push(id);
    const r = dispatch(state, {type:'party', ids: party});
    toast(r.toast); save(); paint(); return;
  }
  if (type === 'bank') { state.bankFilter = data.filter; paint(); return; }
  if (type === 'travel-sable' || type.startsWith('travel-')) {
    const r = dispatch(state, {type:'travel', dest: type.slice(7)});
    toast(r.toast); save(); paint(); return;
  }
  if (type === 'submit' && form) {
    const name = form.getAttribute('data-act');
    if (name === 'chat') {
      const r = dispatch(state, {type:'chat', text: new FormData(form).get('text')});
      toast(r.toast); form.reset(); save(); paint(); return;
    }
    if (name === 'crew-create') {
      const r = dispatch(state, {type:'crew-create', name: new FormData(form).get('name')});
      toast(r.toast); save(); paint(); return;
    }
    if (name === 'crew-join') { toast('Ask them for the code in person. The banner opens when the books do.'); return; }
  }
  const action = map[type];
  if (!action) return;
  if (remote) remoteAct(action);
  else {
    const r = dispatch(state, action);
    if (r.hero) heroModal = r.hero;
    if (r.toast) toast(r.toast);
    save(); paint();
  }
}

async function remoteAct(action) {
  const op = {
    stop: ['skill', {op:'stop'}],
    skill: ['skill', {op:'start', skill: action.skill, node: action.node}],
    hustle: ['hustle', {job: action.id}],
    travel: ['travel', {dest: action.dest}],
    choice: ['choice', {choice: action.choice}],
    claim: ['claim', {}],
    sell: ['market', {op:'sell', item: action.item, qty: action.qty || 1}],
    buy: ['market', {op:'buy', item: action.item, qty: action.qty || 1}],
    summon: ['summon', {}],
    pack: ['pack', {}],
    collect: ['collect', {}],
    bail: ['bail', {}],
    forge: ['forge', {}],
    delve: ['delve', {floor: action.floor, minutes: action.minutes}],
    party: ['party', {ids: action.ids}],
    chat: ['crew', {op:'chat', text: action.text}],
    'crew-create': ['crew', {op:'create', name: action.name}],
    'crew-give': ['crew', {op:'give', qty: action.qty}],
    level: ['card', {op:'level', hero: action.hero}]
  }[action.type];
  if (!op) { const r = dispatch(state, action); toast(r.toast); paint(); return; }
  if (action.type === 'delve') {
    const { error } = await sb.rpc('os_start_delve', {f: action.floor, m: action.minutes});
    if (error) { toast(human(error)); return; }
    await pull(); return;
  }
  if (action.type === 'party') {
    const { error } = await sb.rpc('os_set_party', {p: action.ids});
    if (error) { toast(human(error)); return; }
    await pull(); return;
  }
  if (action.type === 'claim') {
    const { data, error } = await sb.rpc('os_claim');
    if (error) { toast(human(error)); return; }
    if (data && data.hero) heroModal = {id: data.hero.id, fresh: data.hero.new};
    await pull(); toast('The party is back.'); return;
  }
  if (action.type === 'sell') {
    const { data, error } = await sb.rpc('os_sell', {i: action.item, q: action.qty || 1});
    if (error) { toast(human(error)); return; }
    await pull(); toast('Sold for ' + data + ' gold.'); return;
  }
  const { data, error } = await sb.rpc('os_act', {op: op[0], payload: op[1]});
  if (error) {
    if (/PGRST202|does not exist|404/i.test(error.message || '')) { remote = false; toast('The gates are stuck. Your work is saved on this device until they open.'); const r = dispatch(state, action); if (r.hero) heroModal = r.hero; toast(r.toast); save(); paint(); return; }
    toast(human(error)); return;
  }
  if (data) applyServer(data);
  paint();
}

function human(error) {
  const m = (error && error.message) || '';
  if (/not allowed/i.test(m)) return 'The door is shut.';
  if (/not enough vigor/i.test(m)) return 'Not enough Vigor.';
  if (/stocks/i.test(m)) return 'You are in the Stocks.';
  if (/banned|closed its door/i.test(m)) return 'The city has closed its door to you.';
  return m.replace(/^.*?:\s*/, '').slice(0, 140) || 'That did not land. Try again.';
}

function applyServer(data) {
  if (!data || !data.player) return;
  const p = data.player;
  state.gold = p.gold;
  state.sigils = p.sigils ?? state.sigils;
  state.vigor = p.vigor ?? state.vigor;
  state.daring = p.daring ?? state.daring;
  state.name = p.name || state.name;
  state.deepest = p.deepest || 1;
  state.party = p.party || [];
  state.rules = p.rules || state.rules;
  state.banned = !!p.banned;
  state.stocksUntil = p.stocks_until ? Date.parse(p.stocks_until) : 0;
  if (p.skill) state.skills = mergeSkills(p.skill);
  state.active = (p.skill && p.skill.active) || state.active;
  if (Array.isArray(data.heroes)) {
    state.heroes = {};
    data.heroes.forEach(h => { state.heroes[h.hero_id] = {level: h.level, dupes: h.dupes}; });
  }
  if (Array.isArray(data.bag)) {
    state.bag = {};
    data.bag.forEach(b => { state.bag[b.id] = b.qty; });
  }
  if (data.delve) {
    state.delve = state.delve || {};
    state.delve.floor = data.delve.floor;
    state.delve.minutes = data.delve.minutes;
    state.delve.started = Date.parse(data.delve.started_at);
    state.delve.ends = Date.parse(data.delve.ends_at);
    state.delve.party = data.delve.party || state.party;
    state.delve.choice = data.delve.choice || null;
    state.delve.name = state.delve.name || 'The Ash Kitchen';
  } else if (data.delve === null) state.delve = null;
  if (Array.isArray(data.feed)) {
    state.crier = data.feed.map(msg => (typeof msg === 'string' ? {tag:'Streets', msg} : msg));
  }
  if (Array.isArray(data.crier)) state.crier = data.crier;
  if (data.welcome) state.welcome = data.welcome;
  if (data.market) {
    state.listings = data.market.listings || state.listings;
    state.cardListings = data.market.cards || [];
    state.orders = data.market.orders || [];
  }
  if (data.crew) state.crew = data.crew;
  if (data.config) state.config = Object.assign(state.config, data.config);
  state.now = data.now ? Date.parse(data.now) : Date.now();
  remote = true;
}

function mergeSkills(skill) {
  const next = state.skills;
  Object.keys(skill).forEach(k => {
    if (k === 'active') return;
    next[k] = Object.assign(next[k] || {xp:0, mastery:{}, session:{at:Date.now(), items:{}, xp:0}}, skill[k]);
  });
  return next;
}

async function pull() {
  const { data, error } = await sb.rpc('os_state');
  if (error) throw error;
  applyServer(data);
  paint();
}

root.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) {
    e.preventDefault();
    location.hash = go.dataset.go;
    state.unread = go.dataset.go === 'crew' ? 0 : state.unread;
    paint();
    return;
  }
  const t = e.target.closest('[data-act]');
  if (!t) return;
  e.preventDefault();
  act(t.dataset.act, t.dataset, t.closest('form'));
});
root.addEventListener('change', (e) => {
  const sel = e.target.closest('select[data-act="hero-skill"]');
  if (!sel) return;
  const r = dispatch(state, {type:'hero-skill', skill: sel.dataset.skill, hero: sel.value});
  toast(r.toast); save(); paint();
});
root.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-act]');
  if (!form) return;
  e.preventDefault();
  act('submit', {}, form);
});
addEventListener('hashchange', paint);
addEventListener('resize', () => { if (!state) return; const p = matchMedia('(max-width: 860px)').matches; if (p !== state.phone) paint(); });

function loop() {
  if (!state || state.freeze || remote) return;
  tick(state, Date.now());
  const bars = root.querySelectorAll('.chip .bar i, .nowbar .bar i');
  bars.forEach(el => {
    if (!state.active) return;
    const iv = 1800;
    el.style.width = ((Date.now() % iv) / iv * 100) + '%';
  });
}

async function boot() {
  if (preview) {
    state = bibleState();
    state.freeze = params.get('shot') === '1';
    state.pickMin = 15;
    state.floor = state.floor || 7;
    paint();
    if (!state.freeze) setInterval(() => { tick(state, Date.now()); }, 1000);
    return;
  }
  try { sb = window.supabase.createClient(SB_URL, SB_KEY, {auth:{persistSession:true, detectSessionInUrl:true}}); }
  catch (e) { sb = null; }
  const session = sb && (await sb.auth.getSession()).data.session;
  if (!session) { location.replace('/?login=1'); return; }
  const allow = await sb.from('den_allow').select('email').maybeSingle();
  if (!allow.data) {
    await sb.auth.signOut();
    location.replace('/?denied=1');
    return;
  }
  state = freshState((session.user.email || 'Summoned').split('@')[0]);
  state.freeze = false;
  state.pickMin = 15;
  try {
    await pull();
    remote = true;
    sb.channel('crier').on('postgres_changes', {event:'INSERT', schema:'public', table:'os_feed'}, payload => {
      const row = payload.new;
      if (!row || !row.msg) return;
      state.crier.unshift({tag: row.tag || 'Streets', msg: row.msg, at: row.at});
      if (state.view === 'crier' || state.view === 'city') paint();
    }).subscribe();
    setInterval(() => { pull().catch(() => {}); }, 8000);
  } catch (e) {
    const m = (e && e.message) || '';
    if (/not allowed|closed its door/i.test(m)) { root.innerHTML = gate('The city has closed its door to you.'); return; }
    if (/does not exist|PGRST202|os_state/i.test(m) || e.code === 'PGRST202') {
      remote = false;
      try {
        const raw = localStorage.getItem('os_save_v1');
        if (raw) state = JSON.parse(raw);
      } catch (err) {}
      state.now = Date.now();
      tick(state, Date.now());
      paint();
      setInterval(() => { tick(state, Date.now()); save(); }, 1000);
      return;
    }
    root.innerHTML = gate('The door stuck. Reload and try again.');
  }
}
boot();
setInterval(loop, 200);
