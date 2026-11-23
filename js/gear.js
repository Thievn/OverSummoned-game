// OverSummoned gear, sets and hero stats. One source of truth: the site, the tests
// and the database seed (scripts/gear-seed.mjs) all read this file.
// Stats: atk Attack, def Defense, hp Health, spd Speed, crit Crit Chance (%), luck Luck.

export const STAT_KEYS = ['atk','def','hp','spd','crit','luck'];
export const STAT_NAMES = {atk:'Attack', def:'Defense', hp:'Health', spd:'Speed', crit:'Crit Chance', luck:'Luck'};
export const SLOT_NAMES = {head:'Head', chest:'Chest', legs:'Legs', feet:'Feet', hands:'Hands', neck:'Neck', ring:'Finger', main:'Main Hand', off:'Off Hand', trinket:'Trinket', belt:'Belt'};
// Card slots. ring and trinket have two sockets, the belt has four.
export const GEAR_SLOTS = ['head','neck','chest','hands','legs','feet','ring1','ring2','main','off','trinket1','trinket2'];
export const BELT_SLOTS = ['belt1','belt2','belt3','belt4'];
export const ALL_SLOTS = GEAR_SLOTS.concat(BELT_SLOTS);
export function slotKind(slot) { return String(slot).replace(/\d+$/, ''); }

// Hero base stats at card level 1, plus the fight skill each hero brings.
export const HERO_BASE = {
  will_slapton:   {short:'Will',     base:{atk:16, def:9,  hp:112, spd:13, crit:8, luck:2}, fx:{slap:2}},
  legionary:      {short:'Gaius',    base:{atk:12, def:15, hp:160, spd:8,  crit:5, luck:1}, fx:{formation:2}},
  gangster:       {short:'Vincenzo', base:{atk:13, def:9,  hp:112, spd:15, crit:7, luck:5}, fx:{}},
  engineer:       {short:'Edith',    base:{atk:8,  def:9,  hp:112, spd:16, crit:6, luck:3}, fx:{}},
  plague_doctor:  {short:'Albrecht', base:{atk:8,  def:10, hp:120, spd:15, crit:5, luck:2}, fx:{}},
  paramedic:      {short:'Maya',     base:{atk:7,  def:10, hp:120, spd:14, crit:5, luck:3}, fx:{triage:18}},
  hunter:         {short:'Brokk',    base:{atk:16, def:11, hp:128, spd:6,  crit:6, luck:1}, fx:{}},
  office_worker:  {short:'Kevin',    base:{atk:7,  def:8,  hp:104, spd:12, crit:5, luck:4}, fx:{reply_all:2}},
  delivery_rider: {short:'Marco',    base:{atk:9,  def:8,  hp:104, spd:11, crit:5, luck:3}, fx:{}}
};

// fx keys used by the fight: first_double, first_aoe, shred, steam, ally_down_def, dodge, aggro,
// revive_once, potion_plus, stun_plus, dr, undead. Out of the fight: mining, smithing, hustle_gold,
// delve_gold, extra_roll, chest_find, night_rare, delve_speed.
export const GEAR = {
  duelling_rapier:{name:'Duelling Rapier', rarity:'legendary', ilvl:72, bind:'pickup', slot:'main', hand:'One-Hand', type:'Sword', dmg:[88,131], speed:1.6, stats:{atk:14, hp:40, spd:9, crit:3}, equip:['Your first strike in every fight hits twice.'], fx:{first_double:1}, req:6, sell:184210, flavor:'It has won more arguments than any lawyer in London.', icon:'items/duelling_rapier', pool:true},
  flint_spear:{name:'Flint Spear', rarity:'uncommon', ilvl:20, bind:'equip', slot:'main', hand:'Two-Hand', type:'Spear', dmg:[38,64], speed:3.0, stats:{atk:6, hp:20}, set:'hunter', hero:'hunter', req:2, sell:960, flavor:'Sharpened by hand, one careful chip at a time.', icon:'items/flint_spear'},
  rusty_gladius:{name:'Rusty Gladius', rarity:'rare', ilvl:34, bind:'pickup', slot:'main', hand:'One-Hand', type:'Sword', dmg:[41,62], speed:1.8, stats:{atk:6, def:3}, equip:["Hits have a 2% chance to knock the enemy's shield aside, lowering their Defense by 20 for 6 sec."], fx:{shred:2}, set:'legionary', hero:'legionary', req:3, sell:3320, flavor:'Rusty on the outside. Still very Roman on the inside.', icon:'items/rusty_gladius'},
  moonsilver_gladius:{name:'Moonsilver Gladius', rarity:'epic', ilvl:40, bind:'equip', slot:'main', hand:'One-Hand', type:'Sword', dmg:[52,80], speed:1.8, stats:{atk:8, crit:2}, equip:['Deals 25% more damage to the undead.'], fx:{undead:25}, req:2, sell:5200, flavor:'Cold to the touch. Ghosts can feel it coming.', icon:'items/rusty_gladius'},
  violin_case:{name:'The Violin Case', rarity:'epic', ilvl:54, bind:'pickup', slot:'main', hand:'Two-Hand', type:'Gun', dmg:[96,178], speed:3.2, stats:{atk:12, crit:3}, equip:['Your first shot in every fight hits every enemy.'], fx:{first_aoe:1}, set:'gangster', hero:'gangster', req:5, sell:11200, flavor:'There is no violin in it. There never was.', icon:'items/violin_case'},
  pocket_trebuchet:{name:'Pocket Trebuchet', rarity:'epic', ilvl:50, bind:'pickup', slot:'main', hand:'Two-Hand', type:'Siege Engine', dmg:[70,140], speed:3.5, stats:{atk:10, spd:2}, set:'engineer', hero:'engineer', req:5, sell:9400, flavor:'Small enough for a pocket, loud enough for a castle.', icon:'items/pocket_trebuchet'},
  defib_paddles:{name:'Defibrillator Paddles', rarity:'epic', ilvl:46, bind:'pickup', slot:'main', hand:'One-Hand', type:'Paddles', dmg:[44,70], speed:2.0, stats:{atk:5, hp:30}, equip:['Once per delve, brings a fallen ally back with 30% Health.'], fx:{revive_once:30}, set:'paramedic', hero:'paramedic', req:4, sell:8100, flavor:'Charged, steady, and ready to bring someone back.', icon:'items/defib_paddles'},
  shield_lost_ninth:{name:'Shield of the Lost Ninth', rarity:'legendary', ilvl:70, bind:'pickup', slot:'off', type:'Shield', armor:1840, block:62, stats:{atk:4, def:14, hp:120}, equip:['When an ally falls, your Defense rises by 25 for the rest of the fight.'], fx:{ally_down_def:25}, set:'legionary', hero:'legionary', req:6, sell:172000, flavor:'Nine thousand marched north. This is what came home.', icon:'items/shield_lost_ninth'},
  trench_lantern:{name:'Trench Lantern', rarity:'rare', ilvl:36, bind:'equip', slot:'off', type:'Held In Off-hand', stats:{spd:4, luck:3}, equip:['Finds one hidden chest for every 3 rooms you clear.'], fx:{chest_find:1}, req:3, sell:4100, flavor:'It has seen darker nights than this one, and it kept burning.', icon:'items/trench_lantern', pool:true},
  medic_bag:{name:'Medic Bag', rarity:'uncommon', ilvl:28, bind:'equip', slot:'off', type:'Held In Off-hand', stats:{def:2, hp:40}, equip:['Potions you drink heal 10% more.'], fx:{potion_plus:10}, set:'paramedic', hero:'paramedic', req:2, sell:1380, flavor:'Everything you need for a very bad day.', icon:'items/medic_bag'},
  inflatable_tube_man:{name:'Inflatable Tube Man', rarity:'absurd', ilvl:70, bind:'pickup', unique:true, slot:'off', type:'Held In Off-hand', stats:{hp:40, spd:12, luck:8}, equip:['Enemies swing at it instead of you 10% of the time.'], fx:{dodge:10}, hero:'office_worker', req:6, sell:240000, flavor:'It waves at everyone. It never, ever stops waving.', icon:'items/inflatable_tube_man'},
  pinstripe_fedora:{name:'Pinstripe Fedora', rarity:'uncommon', ilvl:24, bind:'equip', slot:'head', type:'Leather', armor:64, stats:{def:4, luck:3}, equip:['Hustles pay 3% more gold.'], fx:{hustle_gold:3}, set:'gangster', hero:'gangster', req:2, sell:1240, flavor:'Tilted just enough to say the boss sent him.', icon:'items/pinstripe_fedora'},
  brass_goggles:{name:'Brass Goggles', rarity:'rare', ilvl:38, bind:'equip', slot:'head', type:'Leather', armor:92, stats:{def:3, hp:30, crit:2}, equip:['Mining is 5% faster.'], fx:{mining:5}, set:'engineer', hero:'engineer', req:3, sell:4875, flavor:'Built to see through smoke, sparks and bad ideas.', icon:'items/brass_goggles'},
  galea_helmet:{name:'Galea Helmet', rarity:'rare', ilvl:34, bind:'pickup', slot:'head', type:'Plate', armor:188, stats:{def:6, hp:40}, equip:['Increases your chance to dodge an attack by 1%.'], fx:{dodge:1}, set:'legionary', hero:'legionary', req:3, sell:3410, flavor:'The red crest says follow me into the fight.', icon:'items/galea_helmet'},
  beak_mask:{name:'Beak Mask', rarity:'rare', ilvl:34, bind:'equip', slot:'head', type:'Leather', armor:86, stats:{def:4, hp:40}, equip:['You take 5% less damage from every hit.'], fx:{dr:5}, set:'plague_doctor', hero:'plague_doctor', req:3, sell:3300, flavor:'The beak is stuffed with herbs. The smell is the point.', icon:'items/beak_mask'},
  courier_helmet:{name:'Courier Helmet', rarity:'common', ilvl:6, bind:null, slot:'head', type:'Plate', armor:40, stats:{def:2, spd:2}, set:'delivery_rider', hero:'delivery_rider', req:1, sell:90, flavor:'Scuffed from a thousand late-night deliveries.', icon:'items/courier_helmet'},
  item_red_carpet_tux:{name:'Red Carpet Tux', rarity:'epic', ilvl:52, bind:'pickup', slot:'chest', type:'Cloth', armor:140, stats:{def:6, hp:60, spd:5}, equip:['Enemies attack you first. You look too good to ignore.'], fx:{aggro:1}, set:'will_slapton', hero:'will_slapton', req:5, sell:9850, flavor:'Pressed, steamed, and ready for its close-up.', icon:'items/item_red_carpet_tux'},
  pinstripe_vest:{name:'Pinstripe Vest', rarity:'epic', ilvl:50, bind:'pickup', slot:'chest', type:'Leather', armor:160, stats:{def:7, hp:40, luck:4}, set:'gangster', hero:'gangster', req:5, sell:9100, flavor:"Sharp lines, deep pockets, and a watch that isn't his.", icon:'items/pinstripe_vest'},
  hi_vis_vest:{name:'Hi-Vis Vest', rarity:'common', ilvl:8, bind:null, slot:'chest', type:'Cloth', armor:38, stats:{def:2, hp:15}, set:'delivery_rider', hero:'delivery_rider', req:1, sell:112, flavor:'Bright enough to be seen from the next century.', icon:'items/hi_vis_vest'},
  mammoth_cloak:{name:'Mammoth Cloak', rarity:'rare', ilvl:32, bind:'equip', slot:'chest', type:'Leather', armor:120, stats:{def:5, hp:60}, set:'hunter', hero:'hunter', req:3, sell:3050, flavor:'Warm, heavy, and still a little bit angry.', icon:'items/mammoth_cloak'},
  waxed_coat:{name:'Waxed Coat', rarity:'rare', ilvl:32, bind:'equip', slot:'chest', type:'Leather', armor:124, stats:{def:5, hp:50}, set:'plague_doctor', hero:'plague_doctor', req:3, sell:3100, flavor:'Rain, blood and worse all roll right off it.', icon:'items/waxed_coat'},
  hobnailed_caligae:{name:'Hobnailed Caligae', rarity:'uncommon', ilvl:26, bind:'equip', slot:'feet', type:'Plate', armor:96, stats:{def:4, spd:3}, hero:'legionary', req:2, sell:1520, flavor:'Thousands of miles of empire, one hobnail at a time.', icon:'items/hobnailed_caligae'},
  open_palm:{name:'The Open Palm', rarity:'absurd', ilvl:75, bind:'pickup', unique:true, slot:'hands', type:'Cloth', armor:72, stats:{atk:18, crit:5}, equip:['Your slaps stun for 1 extra turn.'], fx:{stun_plus:1}, set:'will_slapton', hero:'will_slapton', req:7, sell:260000, flavor:'Still tingling from the last one.', icon:'items/open_palm_glove'},
  steam_gauntlet:{name:'Steam Gauntlet', rarity:'epic', ilvl:48, bind:'pickup', slot:'hands', type:'Plate', armor:210, stats:{atk:6, def:6}, equip:['Hits have a 5% chance to vent steam, burning the enemy for 30 damage.'], fx:{steam:5}, set:'engineer', hero:'engineer', req:4, sell:8700, flavor:'Runs on coal, steam and a strong right hook.', icon:'items/steam_gauntlet'},
  bone_necklace:{name:'Bone Necklace', rarity:'rare', ilvl:30, bind:'equip', slot:'neck', type:'Amulet', stats:{atk:4, crit:1}, set:'hunter', hero:'hunter', req:3, sell:2900, flavor:'Every tooth on it comes with a story Brokk will tell twice.', icon:'items/bone_necklace'},
  herb_pomander:{name:'Herb Pomander', rarity:'uncommon', ilvl:22, bind:'equip', slot:'neck', type:'Amulet', stats:{hp:30, luck:2}, equip:['Potions you drink heal 10% more.'], fx:{potion_plus:10}, set:'plague_doctor', hero:'plague_doctor', req:2, sell:1100, flavor:'Lavender, clove and a lot of hope.', icon:'items/herb_pomander'},
  second_moon:{name:'Second Moon', rarity:'unhinged', ilvl:80, bind:'pickup', unique:true, slot:'ring', type:'Ring', stats:{hp:50, luck:12}, equip:['Rare loot drops 10% more often while it is night in Aldermere.'], fx:{night_rare:10}, req:9, sell:420000, flavor:'Look up tonight and count the moons again.', icon:'items/second_moon', pool:true},
  item_golden_statuette:{name:'Golden Statuette', rarity:'legendary', ilvl:66, bind:'pickup', unique:true, slot:'trinket', type:'Trinket', stats:{atk:8, luck:6}, use:{text:'Raise it high. Your squad deals 20% more damage for 15 sec.', cd:'2 Min Cooldown', k:'rally', v:20, cds:120}, set:'will_slapton', hero:'will_slapton', req:6, sell:150000, flavor:'He would like to thank the Academy, his mother, and his right hand.', icon:'items/item_golden_statuette'},
  stained_mug:{name:'Stained Mug', rarity:'common', ilvl:6, bind:null, slot:'trinket', type:'Trinket', stats:{luck:1}, use:{text:'Take a sip. Restores 15 Health.', cd:'1 Min Cooldown', k:'heal', v:15, cds:60}, set:'office_worker', hero:'office_worker', req:1, sell:35, flavor:"It says World's Okayest Hero, and he wears it proudly.", icon:'items/stained_mug'},
  black_ledger:{name:'Black Ledger', rarity:'epic', ilvl:44, bind:'pickup', slot:'trinket', type:'Trinket', stats:{luck:8}, equip:['Every delve brings home 5% more gold.'], fx:{delve_gold:5}, set:'office_worker', hero:'office_worker', req:4, sell:7700, flavor:'Every name in it owes somebody something.', icon:'items/black_ledger'},
  group_chat:{name:'The Group Chat', rarity:'rare', ilvl:30, bind:'equip', slot:'trinket', type:'Trinket', stats:{spd:4, luck:2}, use:{text:'Send one message. Your squad acts sooner for 10 sec.', cd:'3 Min Cooldown', k:'haste', v:30, cds:180}, set:'office_worker', hero:'office_worker', req:3, sell:2600, flavor:'47 unread, and every one of them says urgent.', icon:'items/group_chat'},
  trauma_shears:{name:'Trauma Shears', rarity:'uncommon', ilvl:26, bind:'equip', slot:'trinket', type:'Trinket', stats:{atk:3, spd:3}, set:'paramedic', hero:'paramedic', req:2, sell:1300, flavor:'They cut through jeans, boots and excuses.', icon:'items/trauma_shears'},
  delivery_bag:{name:'Delivery Bag', rarity:'common', ilvl:6, bind:null, slot:'trinket', type:'Trinket', stats:{luck:2}, equip:['Room for one more find in every delve.'], fx:{extra_roll:1}, set:'delivery_rider', hero:'delivery_rider', req:1, sell:80, flavor:'Insulated, waterproof, and somehow always smells like fries.', icon:'items/delivery_bag'},
  potion_pink:{name:'Healing Draught', rarity:'rare', ilvl:30, slot:'belt', type:'Potion', use:{text:'Restores 70 Health to the hero who drinks it.', cd:'30 Sec Cooldown', k:'heal', v:70, cds:30}, stack:20, req:1, sell:640000, flavor:'Thick, pink, and it fixes most of what a delve breaks.', icon:'gen/potion_pink'},
  potion_cyan:{name:'Guard Oil', rarity:'rare', ilvl:30, slot:'belt', type:'Potion', use:{text:'Rub it on your armor. +25 Defense for one fight.', cd:'1 Min Cooldown', k:'guard', v:25, cds:60}, stack:20, req:1, sell:640000, flavor:'Blades slide off it like rain off a window.', icon:'gen/potion_cyan'},
  night_tonic:{name:'Night Tonic', rarity:'epic', ilvl:48, slot:'belt', type:'Potion', use:{text:'Restores 4 Health every 3 sec for the rest of the delve.', cd:'Once per delve', k:'hot', v:4, cds:100000}, stack:5, req:4, sell:1200000, flavor:'Brewed under the second moon. Tastes like plums and courage.', icon:'gen/flask', pool:true},
  eel_stew:{name:'Eel Stew', rarity:'uncommon', ilvl:12, slot:'belt', type:'Food', use:{text:'Restores 28 Health. Your hero has to sit down to eat it.', cd:'10 Sec Cooldown', k:'heal', v:28, cds:10}, stack:20, req:1, sell:90000, flavor:'Hot, salty, and straight from the river.', icon:'gen/eel_stew'}
};

// Era sets. Wear all three on their own hero and the bonus switches on.
export const ERA_SETS = {
  will_slapton:  {name:'Award Night', items:['item_red_carpet_tux','item_golden_statuette','open_palm'], bonus:'Standing Ovation', text:'Once per delve, your first slap hits every enemy in the room. +10 Attack.', stats:{atk:10}, fx:{slap_aoe_once:1}},
  legionary:     {name:'The Lost Ninth', items:['galea_helmet','rusty_gladius','shield_lost_ninth'], bonus:'Testudo', text:'The first enemy hit in every room does half damage. +15 Defense.', stats:{def:15}, fx:{testudo:1}},
  gangster:      {name:'Prohibition Row', items:['pinstripe_fedora','pinstripe_vest','violin_case'], bonus:'Made Man', text:'Every hustle pays 15% more gold. +8 Luck.', stats:{luck:8}, fx:{hustle_gold:15}},
  engineer:      {name:'Crane and Daughters', items:['brass_goggles','steam_gauntlet','pocket_trebuchet'], bonus:'Full Steam', text:'Mining runs 20% faster, and 1 in 5 of her attacks fires twice. +6 Speed.', stats:{spd:6}, fx:{mining:20, double_shot:20}},
  paramedic:     {name:'Night Shift', items:['defib_paddles','medic_bag','trauma_shears'], bonus:'Golden Hour', text:'The first hero to fall in a delve gets back up with half Health. +60 Health.', stats:{hp:60}, fx:{revive_first:50}},
  office_worker: {name:'Corner Office', items:['stained_mug','group_chat','black_ledger'], bonus:'Circle Back', text:'Reply All lasts 1 extra turn. +5% Crit Chance.', stats:{crit:5}, fx:{mark_plus:1}},
  hunter:        {name:'First Fire', items:['flint_spear','mammoth_cloak','bone_necklace'], bonus:'Hot Coals', text:'His first hit in every room burns for 20 extra damage. +10 Attack.', stats:{atk:10}, fx:{first_fire:20}},
  plague_doctor: {name:'The Black Year', items:['beak_mask','waxed_coat','herb_pomander'], bonus:'Quarantine', text:'Potions heal the squad 20% more. +40 Health.', stats:{hp:40}, fx:{potion_plus:20}},
  delivery_rider:{name:'Last Mile', items:['courier_helmet','hi_vis_vest','delivery_bag'], bonus:'Express Route', text:'Delves finish 10% sooner. +5 Speed.', stats:{spd:5}, fx:{delve_speed:10}}
};

// Hero perks that work outside a fight, as fx keys (percent).
export const HERO_PERK_FX = {engineer:{mining:15}, legionary:{smithing:15}, delivery_rider:{delve_speed:10}};

// Example kit for the homepage cards. Real players start with empty cards.
export const EXAMPLE_GEAR = {
  will_slapton:  {chest:'item_red_carpet_tux', trinket1:'item_golden_statuette', hands:'open_palm', main:'duelling_rapier', ring1:'second_moon', belt1:'potion_pink', belt2:'potion_pink', belt3:'potion_cyan'},
  legionary:     {head:'galea_helmet', main:'rusty_gladius', off:'shield_lost_ninth', feet:'hobnailed_caligae', belt1:'potion_pink', belt2:'eel_stew'},
  gangster:      {head:'pinstripe_fedora', chest:'pinstripe_vest', main:'violin_case', belt1:'potion_pink'},
  engineer:      {head:'brass_goggles', hands:'steam_gauntlet', main:'pocket_trebuchet', belt1:'night_tonic'},
  plague_doctor: {head:'beak_mask', chest:'waxed_coat', neck:'herb_pomander', belt1:'potion_pink', belt2:'potion_pink'},
  paramedic:     {main:'defib_paddles', off:'medic_bag', trinket1:'trauma_shears', belt1:'potion_pink', belt2:'eel_stew'},
  hunter:        {main:'flint_spear', chest:'mammoth_cloak', neck:'bone_necklace', belt1:'eel_stew'},
  office_worker: {trinket1:'stained_mug', trinket2:'group_chat', off:'inflatable_tube_man', belt1:'eel_stew'},
  delivery_rider:{head:'courier_helmet', chest:'hi_vis_vest', trinket1:'delivery_bag', belt1:'eel_stew'}
};
