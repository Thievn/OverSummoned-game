/* OverSummoned catalog. Keep node numbers in sync with supabase/migrations os_node(). */
export const SB_URL = 'https://eresamyqxarlrdgudgrw.supabase.co';
export const SB_KEY = 'sb_publishable_VZn5RjVsoRhLhYW87TJY3Q_CrgicMQF';

export const RARITY = ['common','uncommon','rare','epic','legendary','absurd','unhinged'];
export const RARITY_NAME = {common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary',absurd:'Absurd',unhinged:'Unhinged'};

export const HEROES = {
  office_worker: {id:'office_worker', name:'Kevin Latham', title:'Office Worker', rarity:'common', era:'Modern day', eraBg:'era_office', might:7, guard:8, knack:12, perk:'Mastery comes quicker while Kevin keeps the ledger.', perkKey:'mastery', skill:'Any', back:'Reply All', backText:'Marks every enemy so the squad hits harder for two turns.', gif:'office_worker'},
  delivery_rider: {id:'delivery_rider', name:'Marco Reyes', title:'Delivery Rider', rarity:'common', era:'Modern day', eraBg:'era_modern', might:9, guard:8, knack:11, perk:'Delves finish a little sooner. Marco knows the short stairs.', perkKey:'delve', skill:'Delve', back:'Last Mile', backText:'He treats the dark like a late order and does not linger.', gif:'delivery_rider'},
  paramedic: {id:'paramedic', name:'Maya Washington', title:'Paramedic', rarity:'uncommon', era:'Modern day', eraBg:'era_modern', might:7, guard:10, knack:14, perk:'Cooked meals heal harder when Maya is on the squad.', perkKey:'cook', skill:'Cooking', back:'Triage', backText:'She stops the bleeding and gets everyone walking.', gif:'paramedic'},
  hunter: {id:'hunter', name:'Brokk', title:'Stone Age Hunter', rarity:'uncommon', era:'Ice Age', eraBg:'era_iceage', might:16, guard:11, knack:6, perk:'Woodcutting sometimes drops a second log.', perkKey:'wood', skill:'Woodcutting', back:'Fire-craft', backText:'He lights the dark and the meat comes off the fire hot.', gif:'hunter'},
  legionary: {id:'legionary', name:'Gaius Marcellus', title:'Roman Legionary', rarity:'rare', era:'Rome, 1st century', eraBg:'forum_bg', might:12, guard:15, knack:8, perk:'Smithing runs faster with Gaius at the anvil.', perkKey:'smith', skill:'Smithing', back:'Formation', backText:'His guard grows with every ally still standing.', gif:'legionary'},
  engineer: {id:'engineer', name:'Edith Crane', title:'Victorian Engineer', rarity:'rare', era:'London, 1880s', eraBg:'era_london', might:8, guard:9, knack:16, perk:'Mining +15% speed', perkKey:'mine', skill:'Mining', back:'Contraptions', backText:'She builds a way through with scrap, steam and spite.', gif:'engineer'},
  plague_doctor: {id:'plague_doctor', name:'Doctor Albrecht', title:'Plague Doctor', rarity:'rare', era:'Medieval, 1348', eraBg:'era_plague', might:8, guard:10, knack:15, perk:'Alchemy brews one extra dose.', perkKey:'alchemy', skill:'Alchemy', back:'Miasma Theory', backText:'Old remedies, sharp enough for rot and poison.', gif:'plague_doctor'},
  gangster: {id:'gangster', name:'Vincenzo Moretti', title:'Prohibition Gangster', rarity:'epic', era:'Chicago, 1927', eraBg:'era_chicago', might:13, guard:9, knack:15, perk:'+15% hustle chance', perkKey:'hustle', skill:'Hustles', back:'Shakedown', backText:'He scares a mark off, or he buys the room.', gif:'gangster'},
  will_slapton: {id:'will_slapton', name:'Will Slapton', title:'Leading Man', rarity:'absurd', era:'Hollywood, 2022', eraBg:'era_hollywood', might:16, guard:9, knack:13, perk:'One slap stuns the loudest enemy.', perkKey:'stun', skill:'Delve', back:'Keep It Out Your Mouth', backText:'A thunderous slap that stuns one enemy for 2 turns. Double damage if they just made a joke.', foot:'Stuns the loudest enemy', gif:'will_slapton',
    bio:'He was walking back to his seat at the biggest awards show on Earth when the Circle grabbed him. A goblin made one joke. Nobody has seen that goblin since.'}
};

export const HERO_ORDER = ['will_slapton','legionary','gangster','engineer','plague_doctor','paramedic','hunter','office_worker','delivery_rider'];

export const FIND_NAMES = Object.values(HEROES).flatMap(h => [h.name, h.name.split(' ')[0], h.id.replaceAll('_',' ')]);

export const ITEMS = {
  copper_ore:{name:'Copper ore', rarity:'common', icon:'copper_ore', kind:'mat', value:2},
  iron_ore:{name:'Iron ore', rarity:'common', icon:'iron_ore', kind:'mat', value:4},
  moonsilver_ore:{name:'Moonsilver ore', rarity:'rare', icon:'moonsilver_ore', kind:'mat', value:18},
  ember_ore:{name:'Ember ore', rarity:'epic', icon:'ember_ore', kind:'mat', value:40},
  void_ore:{name:'Void ore', rarity:'epic', icon:'void_ore', kind:'mat', value:70},
  gem_violet:{name:'Violet gem', rarity:'epic', icon:'gem_violet', kind:'mat', value:2400},
  ash_log:{name:'Ash log', rarity:'common', icon:'ash_log', kind:'mat', value:2},
  raw_eel:{name:'Raw eel', rarity:'common', icon:'raw_eel', kind:'food', value:3},
  eel_stew:{name:'Eel stew', rarity:'uncommon', icon:'eel_stew', kind:'food', value:9, heal:28},
  potion_pink:{name:'Healing draught', rarity:'rare', icon:'potion_pink', kind:'food', value:64, heal:70},
  potion_cyan:{name:'Guard oil', rarity:'rare', icon:'potion_cyan', kind:'food', value:64},
  iron_bar:{name:'Iron bar', rarity:'uncommon', icon:'iron_bar', kind:'mat', value:14},
  moonsilver_bar:{name:'Moonsilver bar', rarity:'rare', icon:'moonsilver_bar', kind:'mat', value:41, blurb:'Cold to the touch and glowing. Smiths turn it into blades that hurt ghosts.'},
  card_shard:{name:'Card shard', rarity:'rare', icon:'cards', kind:'mat', value:80},
  summon_sigil:{name:'Summoning sigil', rarity:'legendary', icon:'summon_sigil', kind:'mat', value:500},
  rusty_gladius:{name:'Rusty Gladius', rarity:'rare', icon:'items/rusty_gladius', kind:'gear', slot:'main', might:4, by:'Gaius Marcellus'},
  shield_lost_ninth:{name:'Shield of the Lost Ninth', rarity:'legendary', icon:'items/shield_lost_ninth', kind:'gear', slot:'off', guard:10, might:3, by:'Gaius Marcellus'},
  hobnailed_caligae:{name:'Hobnailed Caligae', rarity:'uncommon', icon:'items/hobnailed_caligae', kind:'gear', slot:'feet', guard:4, by:'Gaius Marcellus'},
  brass_goggles:{name:'Brass Goggles', rarity:'rare', icon:'items/brass_goggles', kind:'gear', slot:'head', knack:5, by:'Edith Crane'},
  steam_gauntlet:{name:'Steam Gauntlet', rarity:'epic', icon:'items/steam_gauntlet', kind:'gear', slot:'off', might:3, guard:4, by:'Edith Crane'},
  violin_case:{name:'The Violin Case', rarity:'epic', icon:'items/violin_case', kind:'gear', slot:'main', might:8, by:'Vincenzo Moretti'},
  defib_paddles:{name:'Defibrillator Paddles', rarity:'epic', icon:'items/defib_paddles', kind:'gear', slot:'trinket', knack:7, by:'Maya Washington'},
  herb_pomander:{name:'Herb Pomander', rarity:'uncommon', icon:'items/herb_pomander', kind:'gear', slot:'belt', knack:4, by:'Doctor Albrecht'},
  trench_lantern:{name:'Trench Lantern', rarity:'rare', icon:'items/trench_lantern', kind:'gear', slot:'trinket', knack:5, by:'a soldier'},
  stained_mug:{name:'Stained Mug', rarity:'common', icon:'items/stained_mug', kind:'gear', slot:'trinket', knack:3, by:'Kevin Latham'},
  courier_helmet:{name:'Courier Helmet', rarity:'common', icon:'items/courier_helmet', kind:'gear', slot:'head', guard:4, by:'Marco Reyes'},
  pinstripe_fedora:{name:'Pinstripe Fedora', rarity:'uncommon', icon:'items/pinstripe_fedora', kind:'gear', slot:'head', guard:3, knack:3, by:'Vincenzo Moretti'},
  medic_bag:{name:'Medic Bag', rarity:'uncommon', icon:'items/medic_bag', kind:'gear', slot:'off', guard:3, knack:3, by:'Maya Washington'},
  item_red_carpet_tux:{name:'Red Carpet Tux', rarity:'epic', icon:'items/item_red_carpet_tux', kind:'gear', slot:'chest', guard:3, by:'Will Slapton'},
  item_golden_statuette:{name:'Golden Statuette', rarity:'legendary', icon:'items/item_golden_statuette', kind:'gear', slot:'trinket', might:2, knack:2, by:'Will Slapton'},
  moonsilver_gladius:{name:'Moonsilver Gladius', rarity:'epic', icon:'items/rusty_gladius', kind:'gear', slot:'main', might:6, by:'the smiths', blurb:'Hurts ghosts.'}
};

export const GEAR_OF = {
  legionary:['rusty_gladius','shield_lost_ninth','hobnailed_caligae'],
  engineer:['brass_goggles','steam_gauntlet'],
  gangster:['violin_case','pinstripe_fedora'],
  paramedic:['defib_paddles','medic_bag'],
  will_slapton:['item_red_carpet_tux','item_golden_statuette']
};

export function itemSrc(id) {
  const it = ITEMS[id];
  if (!it) return '/assets/gen/chest.png';
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
    {id:'starfall', name:'Starfall crater', lv:85, sec:6.4, xp:180, item:'gem_violet', rock:'rock_ember', line:'A violet heart in the crater.'}
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
    {id:'draught', name:'Healing draught', lv:1, sec:3.4, xp:20, item:'potion_pink', rock:'potion_pink', line:'Sweet, then it burns clean.'},
    {id:'oil', name:'Guard oil', lv:18, sec:3.8, xp:28, item:'potion_cyan', rock:'potion_cyan', line:'Smears on a shield and stays.'},
    {id:'violet', name:'Violet distill', lv:50, sec:6.0, xp:140, item:'gem_violet', use:{potion_pink:1, potion_cyan:1}, rock:'gem_violet', line:'Two draughts become one hard gem.'}
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
  {id:'pockets', name:'Pick pockets at the Night Market', win:'12 to 40 gold', fail:'A slap on the wrist', chance:92, daring:2, gold:[12,40], jail:0},
  {id:'dice', name:'Rig the dice at the Gilded Rat', win:'150 gold, maybe a card shard', fail:'10 min in the Stocks', chance:72, daring:5, gold:[150,150], shard:0.25, jail:10},
  {id:'smuggle', name:'Smuggle moonsilver past the guards', win:'600 gold', fail:'25 min in the Stocks', chance:54, daring:10, gold:[600,600], jail:25},
  {id:'duke', name:"Rob the Duke's carriage", win:'2,500 gold and a rare drop', fail:'1 hour in the Infirmary', chance:31, daring:15, gold:[2500,2500], rare:0.4, infirmary:60},
  {id:'ledger', name:"Steal the Archmage's summoning ledger", win:'A guaranteed Epic card', fail:'Needs Hustle Lv 40', chance:0, daring:25, need:40, locked:true}
];

export const CITIES = [
  {id:'aldermere', name:'Aldermere', note:'Home prices'},
  {id:'sable', name:'Port Sable', note:'Eels sell for double', deal:'Eel stew 4g'},
  {id:'emberfall', name:'Emberfall', note:'Cheap ember ore', deal:'Ember ore 51g'},
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

export function xpNeed(level) {
  return Math.round(40 * Math.pow(level, 1.55) + 20 * level);
}
export function levelFromXp(xp) {
  let lv = 1, rest = Math.max(0, xp | 0);
  while (lv < 99) {
    const need = xpNeed(lv);
    if (rest < need) return {level: lv, into: rest, need};
    rest -= need;
    lv++;
  }
  return {level: 99, into: rest, need: xpNeed(99)};
}
export function xpForLevel(level) {
  let t = 0;
  for (let i = 1; i < level; i++) t += xpNeed(i);
  return t;
}
