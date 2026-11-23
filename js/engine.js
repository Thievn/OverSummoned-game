import {
  HEROES, ITEMS, NODES, SKILLS, HUSTLES, DELVE_LENGTHS, DEFAULT_CONFIG,
  levelFromXp, xpForLevel, mentionsHero, GEAR_OF
} from './catalog.js';
import { heroTotals, partyFor, partyFx, simulate, roomsFor, canEquip, heroOutFx, fasterMult, luckWeights, makeRng } from './fight.js';
import { GEAR, ALL_SLOTS, slotKind, EXAMPLE_GEAR } from './gear.js';

const clone = (v) => JSON.parse(JSON.stringify(v));

export function rng(state) {
  state.seed = (Math.imul(state.seed || 1, 1664525) + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

export function freshState(name) {
  const skills = {};
  SKILLS.forEach(s => { skills[s.id] = {xp: 0, mastery: {}, node: null, hero: null, session: emptySession()}; });
  return {
    seed: 7,
    now: Date.now(),
    freeze: false,
    name: name || 'Summoned',
    gold: 250,
    sigils: 1,
    vigor: 100, vigorMax: 100,
    daring: 10, daringMax: 25,
    life: 120, lifeMax: 120,
    party: ['office_worker', 'delivery_rider'],
    rules: {heal: 40, retreat: 25, loot: 'balanced'},
    deepest: 1,
    floor: 1,
    city: 'aldermere',
    travel: null,
    stocksUntil: 0,
    banned: false,
    hustleXp: 0,
    crew: null,
    heroes: {
      office_worker: {level: 1, dupes: 0},
      delivery_rider: {level: 1, dupes: 0}
    },
    known: ['office_worker', 'delivery_rider'],
    pool: ['stained_mug', 'delivery_bag', 'courier_helmet', 'group_chat'],
    bag: {stained_mug: 1, delivery_bag: 1, raw_eel: 6, copper_ore: 20},
    gear: {},
    skills,
    active: null,
    lastTick: Date.now(),
    vigorAt: Date.now(),
    daringAt: Date.now(),
    delve: null,
    crier: [
      {tag:'Breaking', msg:'Ghoul chef bursts out of the Ash Kitchen. Three crews are hunting it now.'},
      {tag:'Market', msg:'Moonsilver holds at 41 gold a bar. Miners are cheering.'},
      {tag:'Streets', msg:"The Hollow Bishop's chest cracked open. Moonsilver spilled across the tavern floor."},
      {tag:'Crews', msg:'A new crew is climbing the Cup.'}
    ],
    chat: [],
    infirmary: [],
    hustleLog: [],
    listings: [],
    orders: [],
    trades: [],
    welcome: null,
    pending: null,
    config: clone(DEFAULT_CONFIG),
    unread: 0,
    events: []
  };
}

function emptySession() {
  return {at: Date.now(), items: {}, xp: 0};
}

export function bibleState() {
  const s = freshState('Dean');
  s.preview = true;
  s.gold = 48210;
  s.sigils = 7;
  s.vigor = 72;
  s.daring = 18;
  s.life = 340;
  s.lifeMax = 340;
  s.deepest = 10;
  s.floor = 7;
  s.hustleXp = xpForLevel(23) + 40;
  const levels = {mining:42, woodcutting:31, fishing:28, cooking:35, smithing:39, alchemy:22, summoning:18};
  const mastery = {mining:{copper:99, iron:87, moonsilver:41}, woodcutting:{ash:40}, fishing:{eel:30}, cooking:{stew:50}, smithing:{iron:60, moon:20}, alchemy:{draught:10}, summoning:{whisper:20}};
  SKILLS.forEach(sk => {
    s.skills[sk.id].xp = xpForLevel(levels[sk.id]) + Math.round(xpNeedSafe(levels[sk.id]) * 0.64);
    s.skills[sk.id].mastery = mastery[sk.id] || {};
    s.skills[sk.id].xpLabel = sk.id === 'mining' ? '48,210 / 61,512 XP' : null;
  });
  s.skills.mining.pool = 38;
  s.skills.mining.node = 'moonsilver';
  s.skills.mining.hero = 'engineer';
  s.skills.mining.session = {at: Date.now() - 2.14 * 3600e3, items: {moonsilver_ore: 412, gem_violet: 3, card_shard: 1}, xp: 15656};
  s.active = 'mining';
  s.heroes = {
    will_slapton:{level:1, dupes:0},
    legionary:{level:4, dupes:2},
    gangster:{level:3, dupes:1},
    engineer:{level:4, dupes:1},
    plague_doctor:{level:2, dupes:0},
    paramedic:{level:2, dupes:0},
    hunter:{level:2, dupes:0},
    office_worker:{level:1, dupes:0},
    delivery_rider:{level:1, dupes:0}
  };
  s.known = Object.keys(s.heroes);
  s.party = ['legionary', 'paramedic', 'engineer'];
  s.bag = {
    copper_ore:2400, iron_ore:1100, moonsilver_ore:412, ember_ore:36, void_ore:8,
    iron_bar:220, moonsilver_bar:64, ash_log:3200, raw_eel:540, eel_stew:188,
    potion_pink:14, potion_cyan:9, gem_violet:5, card_shard:12, summon_sigil:7,
    rusty_gladius:1, violin_case:1, defib_paddles:1, brass_goggles:1, herb_pomander:1,
    trench_lantern:1, stained_mug:1, courier_helmet:1, shield_lost_ninth:1, steam_gauntlet:1,
    pinstripe_fedora:1, medic_bag:1
  };
  s.gear = {
    legionary:{head:'galea_helmet', main:'rusty_gladius', off:'shield_lost_ninth', feet:'hobnailed_caligae', belt1:'potion_pink', belt2:'eel_stew'},
    paramedic:{main:'defib_paddles', off:'medic_bag', trinket1:'trauma_shears', belt1:'potion_pink', belt2:'eel_stew'},
    engineer:{head:'brass_goggles', hands:'steam_gauntlet', main:'pocket_trebuchet', belt1:'potion_pink'}
  };
  for (const id of Object.keys(s.heroes)) if (!s.gear[id] && EXAMPLE_GEAR[id]) s.gear[id] = JSON.parse(JSON.stringify(EXAMPLE_GEAR[id]));
  s.heroes.legionary.level = 6; s.heroes.paramedic.level = 4; s.heroes.engineer.level = 5;
  s.crier = [
    {tag:'Breaking', msg:'Ghoul chef bursts out of the Ash Kitchen. Three crews are hunting it now.'},
    {tag:'Market', msg:'Moonsilver hits a record 41 gold a bar. Miners are cheering.'},
    {tag:'Streets', msg:"The Hollow Bishop's chest cracked open. Moonsilver spilled across the tavern floor."},
    {tag:'Crews', msg:'Neon Lanterns climb to 4th place in the Crew Cup.'}
  ];
  s.crew = {
    name:'Neon Lanterns', rank:4, members:18, max:25, online:12, perk:'+5% XP', vaultOre:36120, goal:50000, youGave:4880,
    motto:'We mine, we delve, we split the loot. Be nice and show up for raids.',
    roster:[
      {name:'Dean', role:'Leader', line:'Mining 42', on:true, face:'engineer'},
      {name:'Kaz_99', role:'Officer', line:'Delving Floor 9', on:true, face:'gangster'},
      {name:'Lina', role:'Member', line:'Cooking 51', on:true, face:'paramedic'},
      {name:'Brokk_fan', role:'Member', line:'In the Infirmary', on:false, face:'hunter'},
      {name:'moth', role:'Member', line:'Hustling', on:true, face:'plague_doctor'},
      {name:'Gus', role:'Recruit', line:'Offline 3h', on:false, face:'office_worker'}
    ],
    chat:[
      {who:'Kaz_99', face:'gangster', color:'pk', t:'8:02 PM', text:'Ghoul chef is on Floor 9. Who has fire potions?'},
      {who:'Lina', face:'paramedic', color:'lm', t:'8:03 PM', text:'I just cooked 40 eel stews. Grab them from the crew vault!'},
      {who:'Dean', face:'engineer', color:'cy', t:'8:05 PM', text:'The ghoul is down to one hit. Hold the line.'},
      {who:'moth', face:'plague_doctor', color:'vi', t:'8:06 PM', text:'On my way with draughts.'},
      {who:'Brokk_fan', face:'hunter', color:'lm', t:'8:07 PM', text:'Still stuck in the Infirmary. Floor 6 ghoul got me good.'},
      {who:'Kaz_99', face:'gangster', color:'pk', t:'8:08 PM', text:'Who wants in on the Royal Mint heist? We need a driver.'},
      {who:'Gus', face:'office_worker', color:'cy', t:'8:10 PM', text:'Me! First heist. What do I bring?'},
      {who:'Lina', face:'paramedic', color:'lm', t:'8:10 PM', text:'Bring snacks and run fast. You will be fine!'}
    ],
    heist:{lock:'Kaz_99', gadgets:'Dean', lookout:'Lina'},
    raid:'The Hollow Bishop', raidN:14,
    cup:[['Ironclad Rats',48200],['Moth Court',44950],['The Ninth',40100],['Neon Lanterns',38770]]
  };
  s.unread = 3;
  s.delve = makeDelve(s, 7, 60, s.now - 22 * 60e3, 924731);
  s.delve.loot = {ash_log:18, iron_bar:6, gem_violet:1, card_shard:2};
  s.infirmary = [{id:'delivery_rider', name:'Marco', reason:'Healing after Floor 6', until: Date.now()+4*60e3+15e3}];
  s.stocksUntil = 0;
  s.stocksWho = {name:'Vincenzo', reason:'In the Stocks for a botched heist', face:'gangster', until: Date.now()+12*60e3+40e3};
  s.hustleLog = [
    {result:'Won', detail:"Picked a fat noble's pocket", gold:'+38g'},
    {result:'Won', detail:'The dice rolled your way', gold:'+150g'},
    {result:'Caught', detail:'A guard grabbed your collar', gold:'Stocks'},
    {result:'Won', detail:'Found a card shard in a purse', gold:'+1'}
  ];
  s.listings = [
    {id:'moon', item:'moonsilver_bar', price:41, qty:1204, today:12},
    {id:'ember', item:'ember_ore', price:88, qty:310, today:4},
    {id:'stew', item:'eel_stew', price:9, qty:8842, today:-3},
    {id:'pink', item:'potion_pink', name:'Healing draught', price:64, qty:520, today:1},
    {id:'pack', item:'card_pack', name:'Card pack', price:1250, qty:96, today:22},
    {id:'gem', item:'gem_violet', price:2400, qty:41, today:-8}
  ];
  s.cardListings = [
    {id:'c1', hero:'gangster', level:2, seller:'Kaz_99', price:18500},
    {id:'c2', hero:'plague_doctor', level:2, seller:'moth', price:9900},
    {id:'c3', hero:'hunter', level:4, seller:'Brokk_fan', price:4800}
  ];
  s.orders = [
    {text:'Selling 20 Moonsilver bars', meta:'14 sold', good:true},
    {text:'Buying Gangster card', meta:'Waiting', good:false}
  ];
  s.welcome = {
    away:'9h 40m',
    lines:[
      {icon:'moonsilver_ore', text:'Edith mined Moonsilver', value:'+1,804', cls:'lm'},
      {icon:'pickaxe', text:'Mining went up', value:'Lv 41 → 42', cls:'cy'},
      {icon:'swords', text:'Delve cleared Floors 5 to 7', value:'+3', cls:'pk'},
      {icon:'coin', text:'Your Market orders sold', value:'+5,740g', cls:''},
      {icon:'gem_violet', text:'A violet gem shook loose from the rock', value:'+1', cls:'vi'}
    ],
    note:{face:'gangster', title:'Vincenzo got caught hustling.', text:"He's out of the Stocks in 12 min."},
    chat:'Kaz_99: raid at 9! bring fire potions'
  };
  s.sel = 'will_slapton';
  s.foundCount = 41;
  s.bars = {vigor:72, daring:72, life:100, skill:62, delve:48, crew:72, mastery:38, xp:78, node:62};
  return s;
}

function xpNeedSafe(lv){ return Math.round(40 * Math.pow(lv, 1.55) + 20 * lv); }

export function skillLevel(state, id) {
  return levelFromXp(state.skills[id].xp).level;
}

export function nodeOf(skill, id) {
  return (NODES[skill] || []).find(n => n.id === id) || null;
}

export function intervalMs(state, skill, node) {
  const n = nodeOf(skill, node);
  if (!n) return 3000;
  let sec = n.sec;
  const hero = state.skills[skill].hero;
  const h = hero && HEROES[hero];
  const lv = h ? (state.heroes[hero]?.level || 1) : 1;
  if (h) sec *= fasterMult(heroOutFx(hero, lv, state.gear && state.gear[hero])[skill] || 0);
  const pool = poolPct(state, skill);
  if (pool >= 50) sec *= 0.95;
  sec /= state.config.xpRate > 0 ? 1 : 1;
  if (state.burstUntil && state.burstUntil > state.now && state.burstSkill === skill) sec *= 0.5;
  return Math.max(400, Math.round(sec * 1000));
}

export function poolPct(state, skill) {
  if (state.skills[skill] && state.skills[skill].pool != null) return state.skills[skill].pool;
  const nodes = NODES[skill] || [];
  const open = nodes.filter(n => skillLevel(state, skill) >= n.lv);
  if (!open.length) return 0;
  const sum = open.reduce((a, n) => a + (state.skills[skill].mastery[n.id] || 0), 0);
  return Math.round(sum / open.length);
}

function grantItem(state, id, qty, hold) {
  if (!id || qty <= 0) return;
  if (id === 'summon_sigil') { state.sigils += qty; return; }
  if (hold) {
    state.pending = state.pending || {items:{}, xp:{}, lines:[]};
    state.pending.items[id] = (state.pending.items[id] || 0) + qty;
  } else {
    state.bag[id] = (state.bag[id] || 0) + qty;
  }
  const sk = state.active;
  if (sk) {
    const sess = state.skills[sk].session;
    sess.items[id] = (sess.items[id] || 0) + qty;
  }
}

function canPay(state, use) {
  if (!use) return Infinity;
  let n = Infinity;
  for (const k of Object.keys(use)) n = Math.min(n, Math.floor((state.bag[k] || 0) / use[k]));
  return n;
}
function pay(state, use, times) {
  if (!use) return;
  for (const k of Object.keys(use)) {
    state.bag[k] = (state.bag[k] || 0) - use[k] * times;
    if (state.bag[k] <= 0) delete state.bag[k];
  }
}

export function tick(state, now) {
  state.now = now;
  if (state.freeze) return state;
  const cfg = state.config || DEFAULT_CONFIG;
  const cap = (cfg.offlineHours || 24) * 3600e3;
  let elapsed = Math.min(cap, Math.max(0, now - (state.lastTick || now)));
  const away = now - (state.lastTick || now) > 10 * 60e3;
  const hold = away || !!state.pending;
  if (elapsed > 1500 && state.active) {
    const sk = state.skills[state.active];
    const node = nodeOf(state.active, sk.node);
    if (node && skillLevel(state, state.active) >= node.lv) {
      const iv = intervalMs(state, state.active, sk.node);
      let actions = Math.floor(elapsed / iv);
      const afford = canPay(state, node.use);
      if (node.use) actions = Math.min(actions, afford);
      if (actions > 0) {
        pay(state, node.use, actions);
        let xp = Math.round(actions * node.xp * (cfg.xpRate || 1));
        if (poolPct(state, state.active) >= 10) xp = Math.round(xp * 1.05);
        const hero = sk.hero && HEROES[sk.hero];
        if (hero && hero.perkKey === 'mastery') xp = Math.round(xp * 1.1);
        if (state.crew) xp = Math.round(xp * 1.05);
        sk.xp += xp;
        sk.session.xp += xp;
        let qty = actions * (node.qty || 1);
        if (poolPct(state, state.active) >= 95 && rng(state) < 0.5) qty += actions;
        if (hero && hero.perkKey === 'wood' && state.active === 'woodcutting') qty += Math.floor(actions * 0.2);
        if (hero && hero.perkKey === 'alchemy' && state.active === 'alchemy') qty += actions;
        if (node.every) qty = Math.floor(actions / node.every);
        if (!node.every || qty > 0) grantItem(state, node.item, Math.max(node.every ? qty : qty, node.every ? qty : actions > 0 && !node.every ? qty : 0), hold);
        if (node.item === 'card_shard' || rng(state) < actions * 0.002) {
          if (rng(state) < 0.15) grantItem(state, 'card_shard', 1, hold);
        }
        sk.mastery[node.id] = Math.min(100, (sk.mastery[node.id] || 0) + actions * 0.08);
        if (hold) {
          state.pending = state.pending || {items:{}, xp:{}, lines:[]};
          state.pending.xp[state.active] = (state.pending.xp[state.active] || 0) + xp;
        }
      }
      state.lastTick = now - (elapsed % iv);
    } else state.lastTick = now;
  } else if (!state.active) state.lastTick = now;

  const vEvery = (cfg.vigorEvery || 300) * 1000;
  while (now - state.vigorAt >= vEvery && state.vigor < state.vigorMax) {
    state.vigor = Math.min(state.vigorMax, state.vigor + (cfg.vigorChunk || 5));
    state.vigorAt += vEvery;
  }
  if (state.vigor >= state.vigorMax) state.vigorAt = now;
  const dEvery = (cfg.daringEvery || 240) * 1000;
  while (now - state.daringAt >= dEvery && state.daring < state.daringMax) {
    state.daring = Math.min(state.daringMax, state.daring + 1);
    state.daringAt += dEvery;
  }
  if (state.daring >= state.daringMax) state.daringAt = now;
  if (state.travel && state.travel.until <= now) {
    state.city = state.travel.to;
    state.travel = null;
  }
  if (away && !state.welcome && state.pending) {
    state.welcome = receipt(state);
  }
  return state;
}

function receipt(state) {
  const lines = [];
  const p = state.pending || {items:{}, xp:{}};
  Object.keys(p.items || {}).forEach(id => {
    const it = ITEMS[id];
    if (!it) return;
    lines.push({icon: it.icon.startsWith('items/') ? 'chest' : it.icon, text: it.name + ' came in', value:'+' + p.items[id], cls:'lm'});
  });
  Object.keys(p.xp || {}).forEach(id => {
    lines.push({icon: SKILLS.find(s => s.id === id)?.icon || 'clock', text: (SKILLS.find(s => s.id === id)?.name || 'A skill') + ' kept rising', value:'+' + p.xp[id] + ' XP', cls:'cy'});
  });
  if (!lines.length) return null;
  return {away: 'a while', lines, note: null, chat: state.unread ? 'New words from the crew' : ''};
}

function pushCrier(state, tag, msg) {
  if (mentionsHero(msg)) return;
  state.crier.unshift({tag, msg, at: state.now});
  state.crier = state.crier.slice(0, 40);
}

export function dispatch(state, action) {
  const a = action || {};
  const out = {toast:'', hero:null};
  const now = state.now || Date.now();
  if (a.type === 'skill') {
    const node = nodeOf(a.skill, a.node);
    if (!node) return out;
    if (skillLevel(state, a.skill) < node.lv) { out.toast = 'That vein is still shut.'; return out; }
    if (node.use && canPay(state, node.use) < 1) { out.toast = 'The materials are not in the Bank.'; return out; }
    SKILLS.forEach(s => { if (s.id !== a.skill) state.skills[s.id].node = state.active === s.id ? null : state.skills[s.id].node; });
    state.active = a.skill;
    state.skills[a.skill].node = a.node;
    state.skills[a.skill].session = emptySession();
    state.lastTick = now;
    out.toast = node.name + ' is underway.';
    return out;
  }
  if (a.type === 'stop') {
    state.active = null;
    out.toast = 'The crew sets the tools down.';
    return out;
  }
  if (a.type === 'hero-skill') {
    if (!state.heroes[a.hero]) { out.toast = 'That card is not in your hand.'; return out; }
    if (state.infirmary.some(i => i.id === a.hero && i.until > now)) { out.toast = 'That hero is resting.'; return out; }
    state.skills[a.skill].hero = a.hero;
    out.toast = HEROES[a.hero].name.split(' ')[0] + ' takes the shift.';
    return out;
  }
  if (a.type === 'burst') {
    if (state.vigor < 10) { out.toast = 'Not enough Vigor.'; return out; }
    state.vigor -= 10;
    state.burstUntil = now + 5 * 60e3;
    state.burstSkill = a.skill;
    out.toast = 'The crew pushes harder for five minutes.';
    return out;
  }
  if (a.type === 'hustle') return doHustle(state, a.id, out);
  if (a.type === 'bail') {
    const held = state.stocksUntil > now || (state.stocksWho && state.stocksWho.until > now);
    if (!held) { out.toast = 'Nobody is in the Stocks.'; return out; }
    if (state.gold < 900) { out.toast = 'Not enough gold for bail.'; return out; }
    state.gold -= 900;
    state.stocksUntil = 0;
    state.stocksWho = null;
    out.toast = 'Bail is paid. The lock opens.';
    return out;
  }
  if (a.type === 'travel') {
    if (state.travel) { out.toast = 'You are already on the road.'; return out; }
    state.travel = {to: a.dest, until: now + 25 * 60e3, from: state.city};
    out.toast = 'The waystone opens. Twenty-five minutes on the road.';
    if (a.dest === 'emberfall' && rng(state) < 0.25) {
      const cut = Math.round(state.gold * 0.08);
      state.gold -= cut;
      out.toast = 'Bandits on the Emberfall road took a cut of the purse.';
    }
    return out;
  }
  if (a.type === 'delve') return startDelve(state, a.floor | 0, a.minutes | 0, out);
  if (a.type === 'choice') {
    if (!state.delve) return out;
    state.delve.choice = a.choice;
    if (a.choice === 'eat') {
      const have = state.bag.eel_stew || 0;
      if (have > 0) { state.bag.eel_stew = have - 1; if (!state.bag.eel_stew) delete state.bag.eel_stew; }
    }
    out.toast = a.choice === 'kick' ? 'The pot flies.' : a.choice === 'shield' ? 'Shields lock.' : 'The squad eats.';
    return out;
  }
  if (a.type === 'claim') return claimDelve(state, out);
  if (a.type === 'sell') return sell(state, a.item, a.qty | 0 || 1, out);
  if (a.type === 'buy') return buy(state, a.item, a.qty | 0 || 1, out);
  if (a.type === 'list') return listItem(state, a.item, a.qty | 0 || 1, a.price | 0, out);
  if (a.type === 'forge') return forge(state, out);
  if (a.type === 'summon') return summon(state, out);
  if (a.type === 'pack') return openPack(state, out);
  if (a.type === 'level') return levelCard(state, a.hero, out);
  if (a.type === 'party') return setParty(state, a.ids, out);
  if (a.type === 'equip') return equip(state, a.hero, a.slot, a.item, out);
  if (a.type === 'chat') {
    const text = String(a.text || '').trim().slice(0, 240);
    if (!text) return out;
    if (!state.crew) { out.toast = 'You have no crew to hear it.'; return out; }
    state.crew.chat = state.crew.chat || [];
    state.crew.chat.push({who: state.name, face:'engineer', color:'cy', t:'now', text});
    return out;
  }
  if (a.type === 'crew-create') {
    const name = String(a.name || '').trim().slice(0, 32);
    if (!name) { out.toast = 'A crew needs a name.'; return out; }
    if (state.crew) { out.toast = 'You already stand with a crew.'; return out; }
    state.crew = {name, rank:99, members:1, max:25, online:1, perk:'+5% XP', vaultOre:0, goal:50000, youGave:0, motto: a.motto || 'Show up. Share the haul.', roster:[{name: state.name, role:'Leader', line:'Just arrived', on:true, face:'engineer'}], chat:[], heist:{}, cup:[['Ironclad Rats',48200],['Moth Court',44950],['The Ninth',40100],[name, 0]], code: codeOf(name)};
    out.toast = name + ' raises a banner.';
    return out;
  }
  if (a.type === 'crew-give') {
    const n = Math.min(a.qty | 0 || 1, state.bag.moonsilver_ore || 0);
    if (!state.crew || n < 1) { out.toast = 'No moonsilver to give.'; return out; }
    state.bag.moonsilver_ore -= n;
    if (state.bag.moonsilver_ore <= 0) delete state.bag.moonsilver_ore;
    state.crew.vaultOre += n;
    state.crew.youGave += n;
    out.toast = 'The vault takes the ore.';
    return out;
  }
  if (a.type === 'heist') {
    if (!state.crew) { out.toast = 'A heist needs a crew.'; return out; }
    state.crew.heist = state.crew.heist || {};
    state.crew.heist.you = true;
    out.toast = 'You are in. The plan needs two hours.';
    return out;
  }
  if (a.type === 'collect') {
    const p = state.pending;
    if (p) {
      Object.keys(p.items || {}).forEach(id => {
        if (id === 'summon_sigil') state.sigils += p.items[id];
        else state.bag[id] = (state.bag[id] || 0) + p.items[id];
      });
    }
    state.pending = null;
    state.welcome = null;
    out.toast = 'Everything is in the Bank.';
    return out;
  }
  if (a.type === 'grant') {
    out.hero = grantHero(state, a.hero, false);
    return out;
  }
  if (a.type === 'crier') {
    if (mentionsHero(a.msg)) { out.toast = 'That line names a hero. Hero arrivals stay off the paper.'; return out; }
    pushCrier(state, a.tag || 'Streets', a.msg);
    return out;
  }
  return out;
}

function codeOf(name) {
  return name.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase() || 'CREW';
}

function grantHero(state, id, announce) {
  const h = HEROES[id];
  if (!h) return null;
  const owned = !!state.heroes[id];
  if (owned) state.heroes[id].dupes += 1;
  else state.heroes[id] = {level: 1, dupes: 0};
  if (!state.known.includes(id)) state.known.push(id);
  (GEAR_OF[id] || []).forEach(it => { if (!state.pool.includes(it)) state.pool.push(it); });
  state.events.push({kind:'card', ref:id, at: state.now});
  if (announce) pushCrier(state, 'Streets', 'A new card walked into the tavern.');
  return {id, fresh: !owned};
}

function doHustle(state, id, out) {
  const job = HUSTLES.find(j => j.id === id);
  if (!job) return out;
  if (job.locked || (job.need && skillLevel(state, 'summoning') < 0 && hustleLevel(state) < job.need)) {
    out.toast = 'That job is still locked.';
    return out;
  }
  if (hustleLevel(state) < (job.need || 1) && job.locked) { out.toast = 'That job is still locked.'; return out; }
  if (state.stocksUntil > state.now) { out.toast = 'You are in the Stocks.'; return out; }
  if (state.daring < job.daring) { out.toast = 'Not enough Daring.'; return out; }
  state.daring -= job.daring;
  let chance = job.chance;
  const g = state.heroes.gangster;
  if (g) chance = Math.min(95, chance + 15);
  const ok = rng(state) * 100 < chance;
  state.hustleXp += 20;
  if (ok) {
    const hg = partyFx(partyFor(state.party.map(pid => ({id: pid, level: state.heroes[pid]?.level || 1})), state.gear)).hustle_gold || 0;
    const gold = Math.floor((job.gold[0] + Math.floor(rng(state) * (job.gold[1] - job.gold[0] + 1))) * (1 + Math.min(100, hg) / 100));
    state.gold += gold;
    if (job.shard && rng(state) < job.shard) grantItem(state, 'card_shard', 1, false);
    if (job.rare && rng(state) < job.rare) grantItem(state, 'gem_violet', 1, false);
    state.hustleLog.unshift({result:'Won', detail: job.name, gold: '+' + gold + 'g'});
    out.toast = 'It lands. +' + gold + ' gold.';
    pushCrier(state, 'Streets', 'A hustle paid out in the Night Market.');
  } else {
    if (job.jail) state.stocksUntil = state.now + job.jail * 60e3;
    if (job.infirmary) {
      const hid = state.party[0];
      if (hid) state.infirmary.push({id: hid, name: HEROES[hid].name.split(' ')[0], reason: 'Hurt on a job', until: state.now + job.infirmary * 60e3, face: hid});
    }
    state.hustleLog.unshift({result:'Caught', detail: job.fail, gold: job.jail ? 'Stocks' : 'Hurt'});
    out.toast = job.jail ? 'Caught. The Stocks are cold.' : 'Caught.';
    pushCrier(state, 'Streets', 'The guards closed a hustle in the market.');
  }
  state.hustleLog = state.hustleLog.slice(0, 8);
  return out;
}

export function hustleLevel(state) {
  return levelFromXp(state.hustleXp).level;
}

function vigorCost(minutes, floor) {
  const base = {1:6, 15:12, 60:20, 240:35, 480:50}[minutes] || 12;
  return base + Math.max(0, floor - 1);
}

function startDelve(state, floor, minutes, out) {
  const allowed = state.config.delveMinutes || [1,15,60,240,480];
  if (!allowed.includes(minutes)) { out.toast = 'That length is not open.'; return out; }
  if (state.delve) { out.toast = 'A delve is already running.'; return out; }
  if (!state.party.length) { out.toast = 'The party is empty.'; return out; }
  if (floor < 1 || floor > state.deepest) { out.toast = 'That floor is still shut.'; return out; }
  const resting = state.party.filter(id => state.infirmary.some(i => i.id === id && i.until > state.now));
  if (resting.length) { out.toast = 'Someone in the party is resting.'; return out; }
  const cost = vigorCost(minutes, floor);
  if (state.vigor < cost) { out.toast = 'Not enough Vigor.'; return out; }
  state.vigor -= cost;
  state.delve = makeDelve(state, floor, minutes, state.now, Math.floor(rng(state) * 2147483000) + 1);
  state.events.push({kind:'delve', ref: String(floor), at: state.now});
  out.toast = 'Down they go.';
  return out;
}

function claimDelve(state, out) {
  const d = state.delve;
  if (!d) { out.toast = 'Nothing to bring home.'; return out; }
  if (d.ends > state.now) { out.toast = 'They are still in the dark.'; return out; }
  const f = d.fight || {rooms: 1, cleared: 1, result: 'won', used: {}, downed: []};
  const party = partyFor((d.party || []).map(id => ({id, level: state.heroes[id]?.level || 1})), state.gear);
  const fx = partyFx(party);
  const luck = party.reduce((a, p) => a + p.total.luck, 0);
  const floorMult = (1 + (d.floor - 1) * 0.08) * (d.choice === 'kick' ? 1.15 : d.choice === 'shield' ? 0.95 : 1);
  const hr = new Date(state.now).getHours();
  const w = luckWeights(state.config.dropRates || DEFAULT_CONFIG.dropRates, luck, floorMult, (hr >= 20 || hr < 6) ? (fx.night_rare || 0) : 0);
  const base = Math.max(2, Math.floor(d.minutes / 4) + 1) + (d.party.length - 1);
  let rolls = f.cleared > 0 ? Math.max(1, Math.round(base * f.cleared / Math.max(1, f.rooms))) : 0;
  if (f.cleared > 0) rolls += (fx.extra_roll || 0) + (fx.chest_find || 0) * Math.floor(f.cleared / 3);
  const loot = {};
  const tiers = ['unhinged','absurd','legendary','epic','rare','uncommon','common'];
  const tot = tiers.reduce((a, t) => a + w[t], 0);
  for (let i = 0; i < rolls; i++) {
    let r = rng(state) * tot, rar = 'common';
    for (const t of tiers) { if (r < w[t]) { rar = t; break; } r -= w[t]; }
    let id = null;
    for (let k = tiers.indexOf(rar); k < tiers.length && !id; k++) {
      const pool = state.pool.filter(x => ITEMS[x] && ITEMS[x].rarity === tiers[k]);
      if (pool.length) id = pool[Math.floor(rng(state) * pool.length)];
    }
    id = id || 'copper_ore';
    loot[id] = (loot[id] || 0) + 1;
    grantItem(state, id, 1, false);
    state.events.push({kind:'item', ref:id, at: state.now});
  }
  let gold = Math.floor((d.minutes * d.floor * 2 + Math.floor(rng(state) * (d.minutes + 5))) * f.cleared / Math.max(1, f.rooms) * (1 + Math.min(100, fx.delve_gold || 0) / 100));
  if (f.result === 'wiped') gold = Math.floor(gold * 0.5);
  state.gold += gold;
  if (f.result === 'won' && d.floor >= state.deepest && d.minutes >= 15) state.deepest += 1;
  for (const [id, q] of Object.entries(f.used || {})) { const have = state.bag[id] || 0; state.bag[id] = have - Math.min(have, q); if (state.bag[id] <= 0) delete state.bag[id]; }
  const rest = 10 * d.floor * (d.choice === 'eat' ? 0.5 : 1);
  (f.downed || []).forEach(id => {
    state.infirmary = state.infirmary.filter(i => i.id !== id);
    state.infirmary.push({id, name: HEROES[id].name.split(' ')[0], reason: 'Hurt on floor ' + d.floor, until: state.now + rest * 60e3, face: id});
  });
  const hc = (state.config.heroChance || {})[String(d.minutes)] ?? 0.02;
  let hero = null;
  if (f.cleared > 0 && rng(state) < hc * (1 + d.floor * 0.05)) {
    const ids = Object.keys(HEROES);
    const id = ids[Math.floor(rng(state) * ids.length)];
    hero = grantHero(state, id, false);
    out.hero = hero;
  }
  state.delve = null;
  refreshLife(state);
  out.toast = f.result === 'won' ? 'The party is back.' : f.result === 'wiped' ? 'The squad was carried out. Half the gold made it.' : 'The squad backed out early.';
  out.report = {gold, loot, hero, floor: d.floor, minutes: d.minutes, result: f.result, cleared: f.cleared, rooms: f.rooms};
  pushCrier(state, 'Streets', 'A party came up from floor ' + d.floor + ' with a heavy pack.');
  return out;
}

function priceOf(state, item) {
  const row = (state.listings || []).find(l => l.item === item);
  if (row) return row.price;
  return ITEMS[item]?.value || 5;
}

function sell(state, item, qty, out) {
  const have = state.bag[item] || 0;
  qty = Math.max(1, Math.min(qty, have));
  if (!ITEMS[item] || qty < 1 || have < 1) { out.toast = 'Nothing to sell.'; return out; }
  const gross = priceOf(state, item) * qty;
  const fee = Math.round(gross * (state.config.marketFee || 0));
  const net = Math.max(1, gross - fee);
  state.bag[item] = have - qty;
  if (state.bag[item] <= 0) delete state.bag[item];
  state.gold += net;
  state.trades.push({item, price: priceOf(state, item), qty, at: state.now});
  state.events.push({kind:'trade', ref:item, qty: net, at: state.now});
  out.toast = 'Sold for ' + net + ' gold.';
  out.gold = net;
  return out;
}

function buy(state, item, qty, out) {
  qty = Math.max(1, qty);
  if (item === 'card_pack') {
    const cost = 1250 * qty;
    if (state.gold < cost) { out.toast = 'Not enough gold.'; return out; }
    state.gold -= cost;
    for (let i = 0; i < qty; i++) out.hero = openPack(state, out).hero;
    return out;
  }
  const cost = priceOf(state, item) * qty;
  if (state.gold < cost) { out.toast = 'Not enough gold.'; return out; }
  state.gold -= cost;
  grantItem(state, item, qty, false);
  state.events.push({kind:'trade', ref:item, qty: cost, at: state.now});
  out.toast = 'Bought.';
  return out;
}

function listItem(state, item, qty, price, out) {
  qty = Math.max(1, Math.min(qty, state.bag[item] || 0));
  if (qty < 1 || price < 1) { out.toast = 'Set a price and an item you hold.'; return out; }
  state.bag[item] -= qty;
  if (state.bag[item] <= 0) delete state.bag[item];
  state.orders.push({text:'Selling ' + qty + ' ' + (ITEMS[item]?.name || item), meta:'Listed', good:true, item, qty, price});
  out.toast = 'Listed.';
  return out;
}

function forge(state, out) {
  const need = {moonsilver_bar:4, ash_log:2};
  if (canPay(state, need) < 1) { out.toast = 'Not enough bars and wood.'; return out; }
  if (skillLevel(state, 'smithing') < 35) { out.toast = 'Smithing is not there yet.'; return out; }
  pay(state, need, 1);
  grantItem(state, 'moonsilver_gladius', 1, false);
  state.skills.smithing.xp += 120;
  out.toast = 'A Moonsilver Gladius cools on the rack.';
  return out;
}

function summon(state, out) {
  if (state.sigils < 1) { out.toast = 'You need a sigil.'; return out; }
  state.sigils -= 1;
  out.hero = grantHero(state, 'will_slapton', false);
  out.toast = 'Will Slapton steps into the light.';
  return out;
}

function openPack(state, out) {
  if (state.gold < 1250) { out.toast = 'A pack costs 1,250 gold.'; return out; }
  state.gold -= 1250;
  const ids = Object.keys(HEROES);
  const id = ids[Math.floor(rng(state) * ids.length)];
  out.hero = grantHero(state, id, false);
  out.toast = 'The pack opens in your hands.';
  return out;
}

function levelCard(state, id, out) {
  const h = state.heroes[id];
  if (!h || h.dupes < 1) { out.toast = 'No spare copy to fold in.'; return out; }
  if (h.level >= 10) { out.toast = 'That card is already at level 10.'; return out; }
  h.dupes -= 1;
  h.level += 1;
  refreshLife(state);
  out.toast = HEROES[id].name.split(' ')[0] + ' hits level ' + h.level + '.';
  return out;
}

function setParty(state, ids, out) {
  const clean = (ids || []).filter(id => state.heroes[id]).slice(0, 3);
  if (state.delve) { out.toast = 'The party is already out.'; return out; }
  state.party = clean;
  refreshLife(state);
  out.toast = 'The party is set.';
  return out;
}

export function refreshLife(state) {
  const party = partyFor((state.party || []).filter(id => state.heroes[id]).map(id => ({id, level: state.heroes[id].level || 1})), state.gear);
  state.lifeMax = party.reduce((a, p) => a + p.total.hp, 0) || 100;
  if (!state.delve) state.life = state.lifeMax;
}

// Build a delve with its whole fight worked out from the squad's real stats.
export function makeDelve(state, floor, minutes, started, seed) {
  const party = partyFor(state.party.map(id => ({id, level: state.heroes[id]?.level || 1})), state.gear);
  const stock = {};
  party.forEach(p => p.belt.forEach(id => { if (id) stock[id] = state.bag[id] || 0; }));
  const fight = simulate({party, floor, minutes, seed, rules: state.rules, stock});
  let mins = minutes;
  if (state.party.includes('delivery_rider')) mins *= 0.9;
  mins *= 1 - Math.min(60, partyFx(party).delve_speed || 0) / 100;
  return {floor, minutes, name: FLOOR_NAMES[(floor - 1) % 10], started, ends: started + Math.max(20e3, Math.round(mins * 60) * 1000),
    party: state.party.slice(), choice: null, seed, fight, loot: {}};
}
const FLOOR_NAMES = ['The Cellar Door','Drip Hall','Rat Parliament','The Mushroom Stacks','The Long Stairs','Bone Orchard','The Ash Kitchen','The Lantern Market','Hollow Cathedral','The Hollow Bishop'];

// What the squad has seen so far: the fight plays out across the delve's length.
export function fightAt(d, now) {
  const f = d && d.fight;
  if (!f || !f.log || !f.log.length) return null;
  const span = Math.max(1, d.ends - d.started);
  const frac = Math.max(0, Math.min(1, (now - d.started) / span));
  const n = frac >= 1 ? f.log.length : Math.max(1, Math.floor(f.log.length * frac));
  const seen = f.log.slice(0, n);
  const last = seen[seen.length - 1];
  const room = last.r || 1;
  const roomFoes = (f.foes && f.foes[room - 1]) || [];
  const fh = last.fh && last.fh.length ? last.fh : roomFoes.map(x => x.max);
  return {seen, hp: last.hp, max: f.max, ids: f.ids || d.party, room, rooms: f.rooms, foes: roomFoes.map((x, i) => ({name: x.name, max: x.max, hp: fh[i] ?? x.max})), done: frac >= 1, result: f.result, cleared: f.cleared};
}

function equip(state, hero, slot, item, out) {
  if (!state.heroes[hero]) { out.toast = 'That card is not in your hand.'; return out; }
  if (!ALL_SLOTS.includes(slot)) { out.toast = 'No such slot.'; return out; }
  if (state.delve && state.delve.party.includes(hero)) { out.toast = 'That hero is out on a delve.'; return out; }
  state.gear = state.gear || {};
  const g = state.gear[hero] = state.gear[hero] || {};
  const kind = slotKind(slot);
  const give = (id, q) => { if (!id) return; state.bag[id] = (state.bag[id] || 0) + q; if (state.bag[id] <= 0) delete state.bag[id]; };
  if (!item) {
    if (g[slot]) { if (kind !== 'belt') give(g[slot], 1); delete g[slot]; out.toast = 'Taken off.'; }
    refreshLife(state); return out;
  }
  const why = canEquip(item, slot, hero, state.heroes[hero].level, g);
  if (why) { out.toast = why; return out; }
  if ((state.bag[item] || 0) < 1) { out.toast = 'You do not have one of those.'; return out; }
  if (kind === 'main' && GEAR[item].hand === 'Two-Hand' && g.off) { give(g.off, 1); delete g.off; }
  if (kind !== 'belt') { if (g[slot]) give(g[slot], 1); give(item, -1); }
  g[slot] = item;
  refreshLife(state);
  out.toast = GEAR[item].name + (kind === 'belt' ? ' goes on the belt.' : ' is on.');
  return out;
}

export function feedIsClean(lines) {
  return (lines || []).every(l => !mentionsHero(typeof l === 'string' ? l : l.msg) && !/new card found/i.test(typeof l === 'string' ? l : (l.msg || '') + (l.text || '')));
}

export function welcomeIsClean(w) {
  if (!w) return true;
  return (w.lines || []).every(l => !/new card|hero found|was summoned|pulled /i.test(l.text || ''));
}
