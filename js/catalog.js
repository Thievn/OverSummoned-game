import { GEAR, HERO_BASE } from './gear.js';
/* OverSummoned catalog. Keep node numbers in sync with supabase/migrations os_node(). */
import { iconFor } from './art.js';
export const SB_URL = 'https://eresamyqxarlrdgudgrw.supabase.co';
export const SB_KEY = 'sb_publishable_VZn5RjVsoRhLhYW87TJY3Q_CrgicMQF';

export const RARITY = ['common','uncommon','rare','epic','legendary','absurd','unhinged'];
export const RARITY_NAME = {common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary',absurd:'Absurd',unhinged:'Unhinged'};

export const HEROES = {
  office_worker: {id:'office_worker', name:'Kevin Latham', title:'Office Worker', rarity:'common', era:'Modern day', eraBg:'era_office', perk:'Mastery comes quicker while Kevin keeps the ledger.', perkKey:'mastery', skill:'Any', back:'Reply All', backText:'Marks every enemy so the squad hits harder for two turns.', gif:'office_worker'},
  delivery_rider: {id:'delivery_rider', name:'Marco Reyes', title:'Delivery Rider', rarity:'common', era:'Modern day', eraBg:'era_modern', perk:'Delves finish a little sooner. Marco knows the short stairs.', perkKey:'delve', skill:'Delve', back:'Last Mile', backText:'He treats the dark like a late order and does not linger.', gif:'delivery_rider'},
  paramedic: {id:'paramedic', name:'Maya Washington', title:'Paramedic', rarity:'uncommon', era:'Modern day', eraBg:'era_modern', perk:'Cooked meals heal harder when Maya is on the squad.', perkKey:'cook', skill:'Cooking', back:'Triage', backText:'She stops the bleeding and gets everyone walking.', gif:'paramedic'},
  hunter: {id:'hunter', name:'Brokk', title:'Stone Age Hunter', rarity:'uncommon', era:'Ice Age', eraBg:'era_iceage', perk:'Woodcutting sometimes drops a second log.', perkKey:'wood', skill:'Woodcutting', back:'Fire-craft', backText:'He lights the dark and the meat comes off the fire hot.', gif:'hunter'},
  legionary: {id:'legionary', name:'Gaius Marcellus', title:'Roman Legionary', rarity:'rare', era:'Rome, 1st century', eraBg:'forum_bg', perk:'Smithing runs faster with Gaius at the anvil.', perkKey:'smith', skill:'Smithing', back:'Formation', backText:'His guard grows with every ally still standing.', gif:'legionary'},
  engineer: {id:'engineer', name:'Edith Crane', title:'Victorian Engineer', rarity:'rare', era:'London, 1880s', eraBg:'era_london', perk:'Mining +15% speed', perkKey:'mine', skill:'Mining', back:'Contraptions', backText:'She builds a way through with scrap, steam and spite.', gif:'engineer'},
  plague_doctor: {id:'plague_doctor', name:'Doctor Albrecht', title:'Plague Doctor', rarity:'rare', era:'Medieval, 1348', eraBg:'era_plague', perk:'Alchemy brews one extra dose.', perkKey:'alchemy', skill:'Alchemy', back:'Miasma Theory', backText:'Old remedies, sharp enough for rot and poison.', gif:'plague_doctor'},
  gangster: {id:'gangster', name:'Vincenzo Moretti', title:'Prohibition Gangster', rarity:'epic', era:'Chicago, 1927', eraBg:'era_chicago', perk:'+15% hustle chance', perkKey:'hustle', skill:'Hustles', back:'Shakedown', backText:'He scares a mark off, or he buys the room.', gif:'gangster'},
  will_slapton: {id:'will_slapton', name:'Will Slapton', title:'Leading Man', rarity:'absurd', era:'Hollywood, 2022', eraBg:'era_hollywood', perk:'One slap stuns the loudest enemy.', perkKey:'stun', skill:'Delve', back:'Keep It Out Your Mouth', backText:'A thunderous slap that stuns one enemy for 2 turns. Double damage if they just made a joke.', foot:'Stuns the loudest enemy', gif:'will_slapton',
    bio:'He was walking back to his seat at the biggest awards show on Earth when the Circle grabbed him. A goblin made one joke. Nobody has seen that goblin since.'}
};

export const HERO_ORDER = ['will_slapton','legionary','gangster','engineer','plague_doctor','paramedic','hunter','office_worker','delivery_rider'];

export const FIND_NAMES = Object.values(HEROES).flatMap(h => [h.name, h.name.split(' ')[0], h.id.replaceAll('_',' ')]);

export const ITEMS = {
  copper_ore:{name:'Copper ore', rarity:'common', icon:'copper_ore', kind:'mat', value:0.17, sell:1700},
  iron_ore:{name:'Iron ore', rarity:'common', icon:'iron_ore', kind:'mat', value:0.36, sell:3600},
  moonsilver_ore:{name:'Moonsilver ore', rarity:'rare', icon:'moonsilver_ore', kind:'mat', value:0.85, sell:8500},
  ember_ore:{name:'Ember ore', rarity:'epic', icon:'ember_ore', kind:'mat', value:2.9, sell:29000},
  void_ore:{name:'Void ore', rarity:'epic', icon:'void_ore', kind:'mat', value:5.8, sell:58000},
  gem_violet:{name:'Violet gem', rarity:'epic', icon:'gem_violet', kind:'mat', value:60, sell:600000},
  ash_log:{name:'Ash log', rarity:'common', icon:'ash_log', kind:'mat', value:3, sell:30000},
  raw_eel:{name:'Raw eel', rarity:'common', icon:'raw_eel', kind:'food', value:0.18, sell:1800},
  eel_stew:{name:'Eel stew', rarity:'uncommon', icon:'eel_stew', kind:'food', value:9, sell:90000, heal:28},
  potion_pink:{name:'Healing draught', rarity:'rare', icon:'potion_pink', kind:'food', value:64, sell:640000, heal:70},
  potion_cyan:{name:'Guard oil', rarity:'rare', icon:'potion_cyan', kind:'food', value:1, sell:10000},
  iron_bar:{name:'Iron bar', rarity:'uncommon', icon:'iron_bar', kind:'mat', value:0.9, sell:9000},
  moonsilver_bar:{name:'Moonsilver bar', rarity:'rare', icon:'moonsilver_bar', kind:'mat', value:41, sell:410000, blurb:'Cold to the touch and glowing. Smiths turn it into blades that hurt ghosts.'},
  card_shard:{name:'Card shard', rarity:'rare', icon:'cards', kind:'mat', value:0, keep:true, blurb:'A piece of a card, still warm. The circle keeps these; they cannot be sold.'},
  summon_sigil:{name:'Summoning sigil', rarity:'legendary', icon:'summon_sigil', kind:'mat', value:0, keep:true},
};

// Gear joins the item list from gear.js. Each hero's own things enter the world with them.
for (const [id, g] of Object.entries(GEAR)) {
  if (ITEMS[id]) { Object.assign(ITEMS[id], {name: g.name, rarity: g.rarity}); continue; }
  ITEMS[id] = {name: g.name, rarity: g.rarity, icon: g.icon.replace(/^gen\//, ''), kind: g.slot === 'belt' ? 'food' : 'gear', slot: g.slot, value: Math.max(1, Math.round((g.sell || 0) / 10000))};
}
export const GEAR_OF = {};
for (const id of Object.keys(HEROES)) GEAR_OF[id] = Object.keys(GEAR).filter(x => GEAR[x].hero === id);
for (const [id, h] of Object.entries(HERO_BASE)) if (HEROES[id]) HEROES[id].base = h.base;

export function itemSrc(id) {
  const it = ITEMS[id];
  if (!it) return '/assets/gen/chest.png';
  if (it.own || it.icon.startsWith('own/')) return iconFor(id, it.icon);
  if (it.icon.startsWith('items/')) return '/assets/' + it.icon + '.png';
  return '/assets/gen/' + it.icon + '.png';
}

export const SKILLS = [
  {id:'mining', name:'Mining', icon:'pickaxe', verb:'mines'},
  {id:'woodcutting', name:'Woodcutting', icon:'axe', verb:'chops'},
  {id:'fishing', name:'Fishing', icon:'rod', verb:'fishes'},
  {id:'cooking', name:'Cooking', icon:'pot', verb:'cooks'},
  {id:'smithing', name:'Smithing', icon:'anvil', verb:'smiths'},
  {id:'alchemy', name:'Alchemy', icon:'flask', verb:'brews'},
  {id:'summoning', name:'Summoning', icon:'summon_sigil', verb:'calls'}
];

export const NODES = {
  mining: [
    {id:'copper', name:'Copper vein', lv:1, sec:2.0, xp:5, item:'copper_ore', rock:'rock_copper', line:'The seam is bright and easy.'},
    {id:'iron', name:'Iron vein', lv:10, sec:2.6, xp:14, item:'iron_ore', rock:'rock_copper', line:'Dark ore, good for a blade.'},
    {id:'moonsilver', name:'Moonsilver vein', lv:25, sec:3.0, xp:38, item:'moonsilver_ore', rock:'rock_moon', line:'Edith swings. The rock cracks. Glowing ore spills out.'},
    {id:'ember', name:'Ember vein', lv:55, sec:4.2, xp:70, item:'ember_ore', rock:'rock_ember', line:'Ember ore makes the blades that cut ghouls.'},
    {id:'void', name:'Void vein', lv:70, sec:5.2, xp:110, item:'void_ore', rock:'rock_void', line:'The rock drinks the lamplight.'},
    {id:'starfall', name:'Starfall crater', lv:85, sec:6.4, xp:180, item:'gem_violet', every:6, rock:'rock_ember', line:'Mostly scorched rock. Now and then, a violet heart.'}
  ],
  woodcutting: [
    {id:'ash', name:'Ash grove', lv:1, sec:2.2, xp:6, item:'ash_log', rock:'ash_log', line:'Pale wood, good for fires and hafts.'},
    {id:'ironbark', name:'Ironbark stand', lv:15, sec:3.0, xp:16, item:'ash_log', qty:2, rock:'ash_log', line:'The axe rings like a bell.'},
    {id:'moonwood', name:'Moonwood', lv:30, sec:3.6, xp:34, item:'ash_log', qty:2, rock:'ash_log', line:'The grain glows when it splits.'},
    {id:'emberroot', name:'Ember root', lv:55, sec:4.4, xp:72, item:'ash_log', qty:3, rock:'ash_log', line:'Sap runs hot.'},
    {id:'voidtrunk', name:'Void trunk', lv:75, sec:5.5, xp:120, item:'ash_log', qty:3, rock:'ash_log', line:'The tree has no birds.'}
  ],
  fishing: [
    {id:'eel', name:'Eel run', lv:1, sec:2.4, xp:6, item:'raw_eel', rock:'raw_eel', line:'Silver backs in black water.'},
    {id:'lantern', name:'Lantern pool', lv:20, sec:3.2, xp:20, item:'raw_eel', qty:2, rock:'raw_eel', line:'They follow the lamp and the hook.'},
    {id:'ashpond', name:'Ash pond', lv:40, sec:4.0, xp:48, item:'raw_eel', qty:2, rock:'raw_eel', line:'Warm water, fat eels.'},
    {id:'deep', name:'The deep cut', lv:65, sec:5.4, xp:100, item:'raw_eel', qty:3, rock:'raw_eel', line:'Something bigger tugs, then an eel comes up.'}
  ],
  cooking: [
    {id:'stew', name:'Eel stew', lv:1, sec:3.0, xp:18, item:'eel_stew', use:{raw_eel:1}, rock:'eel_stew', line:'The pot smells like the harbor and home.'},
    {id:'feast', name:'Watch feast', lv:25, sec:4.0, xp:40, item:'eel_stew', qty:2, use:{raw_eel:2}, rock:'eel_stew', line:'Enough for a squad coming up the stairs.'},
    {id:'broth', name:'Pink broth', lv:45, sec:5.0, xp:80, item:'potion_pink', use:{raw_eel:1, gem_violet:1}, rock:'potion_pink', line:'A gem dissolves. The broth glows.'}
  ],
  smithing: [
    {id:'iron', name:'Iron bar', lv:1, sec:3.2, xp:16, item:'iron_bar', use:{iron_ore:2}, rock:'iron_bar', line:'The bar takes a dark shine.'},
    {id:'moon', name:'Moonsilver bar', lv:20, sec:4.0, xp:36, item:'moonsilver_bar', use:{moonsilver_ore:2}, rock:'moonsilver_bar', line:'Cold light in the tongs.'},
    {id:'gladius', name:'Moonsilver Gladius', lv:35, sec:4.0, xp:120, item:'moonsilver_gladius', use:{moonsilver_bar:4, ash_log:2}, rock:'items/rusty_gladius', line:'Might +6. Hurts ghosts.', gear:true}
  ],
  alchemy: [
    {id:'draught', name:'Healing draught', lv:1, sec:3.4, xp:20, item:'potion_pink', use:{raw_eel:1, ash_log:1}, rock:'potion_pink', line:'Sweet, then it burns clean.'},
    {id:'oil', name:'Guard oil', lv:18, sec:3.8, xp:28, item:'potion_cyan', use:{ash_log:2, copper_ore:1}, rock:'potion_cyan', line:'Smears on a shield and stays.'},
    {id:'violet', name:'Violet distill', lv:50, sec:6.0, xp:140, item:'gem_violet', use:{potion_pink:1, potion_cyan:1}, every:10, rock:'gem_violet', line:'Most brews fizzle. Now and then two draughts set into one hard gem.'}
  ],
  summoning: [
    {id:'whisper', name:'Whisper circle', lv:1, sec:4.0, xp:22, item:'card_shard', rock:'cards', line:'A shard of a card, still warm.'},
    {id:'sigil', name:'Sigil rite', lv:20, sec:8.0, xp:60, item:'summon_sigil', every:4, rock:'summon_sigil', line:'The circle answers with a sigil.'},
    {id:'name', name:'Name the door', lv:60, sec:7.0, xp:120, item:'card_shard', qty:2, rock:'cards', line:'Two shards, and a name you almost hear.'}
  ]
};

export const MASTERY = [
  {at:10, text:'+5% skill XP'},
  {at:25, text:'The work never runs dry'},
  {at:50, text:'Every action is 5% faster'},
  {at:95, text:'Double yield'}
];

export const DELVE_LENGTHS = [
  {m:1, label:'1 min'},
  {m:15, label:'15 min'},
  {m:60, label:'1 hour'},
  {m:240, label:'4 hours'},
  {m:480, label:'8 hours'}
];

export const FLOORS = [
  'The Cellar Door','Drip Hall','Rat Parliament','The Mushroom Stacks','The Long Stairs',
  'Bone Orchard','The Ash Kitchen','The Lantern Market','Hollow Cathedral','The Hollow Bishop'
];

export const HUSTLES = [
  {id:'pockets', name:'Pick pockets at the Night Market', win:'8 to 20 gold', fail:'A slap on the wrist', chance:92, daring:2, gold:[8,20], jail:0, need:1, xp:30},
  {id:'dice', name:'Rig the dice at the Gilded Rat', win:'40 to 120 gold, maybe a card shard', fail:'10 min in the Stocks', chance:72, daring:5, gold:[40,120], shard:0.25, jail:10, need:8, xp:80},
  {id:'smuggle', name:'Smuggle moonsilver past the guards', win:'200 to 400 gold', fail:'25 min in the Stocks', chance:54, daring:10, gold:[200,400], jail:25, need:20, xp:180},
  {id:'duke', name:"Rob the Duke's carriage", win:'800 to 1,500 gold and maybe a violet gem', fail:'1 hour in the Infirmary', chance:31, daring:15, gold:[800,1500], rare:0.4, infirmary:60, need:35, xp:300},
  {id:'ledger', name:"Steal the Archmage's summoning ledger", win:'A guaranteed Epic card', fail:'Coming soon', chance:0, daring:25, need:50, locked:true}
];

export const CITIES = [
  {id:'aldermere', name:'Aldermere', note:'Home prices'},
  {id:'sable', name:'Port Sable', note:'Eels sell for double', deal:'Eel stew 4g'},
  {id:'emberfall', name:'Emberfall', note:'Cheap ember ore', deal:'Ember ore 5g'},
  {id:'frost', name:'The Frost Market', note:'Rare cards on sale', deal:'Ice Age cards'},
  {id:'rome', name:'Old Rome Gate', note:'Legion gear', deal:'Legion gear'}
];

export const SETS = [
  {id:'rome', name:'Legions of Rome', need:12, have:['legionary']},
  {id:'prohibition', name:'Prohibition Row', need:10, have:['gangster']},
  {id:'carpet', name:'Red Carpet Legends', need:15, have:['will_slapton']},
  {id:'ward', name:'Heroes of the Ward', need:8, have:['paramedic','plague_doctor']}
];

export const NAV_CITY = [
  {id:'city', name:'City', icon:'tower'},
  {id:'hustles', name:'Hustles', icon:'mask', dot:true},
  {id:'travel', name:'Travel', icon:'portal'},
  {id:'infirmary', name:'Infirmary', icon:'cross'},
  {id:'crier', name:'The Crier', icon:'paper'},
  {id:'market', name:'Market', icon:'scales'},
  {id:'crew', name:'Crew', icon:'banner', dot:true}
];
export const NAV_ADV = [
  {id:'delve', name:'Delve', icon:'swords'},
  {id:'cards', name:'Cards', icon:'cards'},
  {id:'collections', name:'Collections', icon:'tome'},
  {id:'bank', name:'Bank', icon:'chest'}
];

export const DEFAULT_CONFIG = {
  xpRate: 1,
  marketFee: 0.05,
  offlineHours: 24,
  vigorEvery: 300,
  vigorChunk: 5,
  daringEvery: 240,
  dropRates: {common:50, uncommon:25, rare:14, epic:7, legendary:3, absurd:0.8, unhinged:0.2},
  heroChance: {'1':0.004,'15':0.02,'60':0.06,'240':0.14,'480':0.22},
  delveMinutes: [1,15,60,240,480]
};

export function mentionsHero(text) {
  const s = String(text || '').toLowerCase();
  if (/new card|hero found|was summoned|pulled an |pulled a |unhinged card/.test(s)) return true;
  return FIND_NAMES.some(n => n && s.includes(String(n).toLowerCase()) && /found|pulled|summoned|arrived|joins/.test(s));
}

// Skills: a long road. About an hour to Lv 10, three days of steady work to Lv 50, and a real goal at Lv 99.
export function xpNeed(level) {
  return Math.round(8 * Math.pow(level, 2.6) + 80 * level);
}
function ladder(need, xp) {
  let lv = 1, rest = Math.max(0, xp | 0);
  while (lv < 99) {
    const n = need(lv);
    if (rest < n) return {level: lv, into: rest, need: n};
    rest -= n;
    lv++;
  }
  return {level: 99, into: rest, need: need(99)};
}
export function levelFromXp(xp) { return ladder(xpNeed, xp); }
export function xpForLevel(level) {
  let t = 0;
  for (let i = 1; i < level; i++) t += xpNeed(i);
  return t;
}
// Hustles climb their own, lighter ladder. Daring sets the pace.
export function hustleNeed(level) {
  return Math.round(23 * Math.pow(level, 1.13));
}
export function hustleFromXp(xp) { return ladder(hustleNeed, xp); }
export function hustleXpFor(level) {
  let t = 0;
  for (let i = 1; i < level; i++) t += hustleNeed(i);
  return t;
}
