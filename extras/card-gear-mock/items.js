// ===== OverSummoned gear data model (mockup) =====
// Stats everyone understands: atk Attack, def Defense, hp Health, spd Speed, crit Crit Chance (%), luck Luck (better loot drops)
// Item: {name, rarity, ilvl, bind:'pickup'|'equip'|null, unique, slot, hand, type, armor, block, dmg:[lo,hi], speed,
//        stats:{atk,def,hp,spd,crit,luck}, equip:[text], use:text, cd:text, set:setId, req:cardLevel, sell:copper, stack, flavor, icon}
window.STAT_NAMES={atk:'Attack',def:'Defense',hp:'Health',spd:'Speed',crit:'Crit Chance',luck:'Luck'};
window.SLOT_NAMES={head:'Head',chest:'Chest',legs:'Legs',feet:'Feet',hands:'Hands',neck:'Neck',ring:'Finger',main:'Main Hand',off:'Off Hand',trinket:'Trinket',belt:'Belt'};
window.ITEMS={
 duelling_rapier:{name:'Duelling Rapier',rarity:'legendary',ilvl:72,bind:'pickup',slot:'main',hand:'One-Hand',type:'Sword',dmg:[88,131],speed:1.6,stats:{atk:14,hp:40,spd:9,crit:3},equip:['Your first strike in every fight hits twice.'],req:6,sell:184210,flavor:'It has won more arguments than any lawyer in London.',icon:'items/duelling_rapier'},
 flint_spear:{name:'Flint Spear',rarity:'uncommon',ilvl:20,bind:'equip',slot:'main',hand:'Two-Hand',type:'Spear',dmg:[38,64],speed:3.0,stats:{atk:6,hp:20},req:2,sell:960,flavor:'Sharpened by hand, one careful chip at a time.',icon:'items/flint_spear'},
 rusty_gladius:{name:'Rusty Gladius',rarity:'rare',ilvl:34,bind:'pickup',slot:'main',hand:'One-Hand',type:'Sword',dmg:[41,62],speed:1.8,stats:{atk:6,def:3},equip:['Hits have a 2% chance to knock the enemy\'s shield aside, lowering their Defense by 20 for 6 sec.'],set:'legionary',req:3,sell:3320,flavor:'Rusty on the outside. Still very Roman on the inside.',icon:'items/rusty_gladius'},
 violin_case:{name:'The Violin Case',rarity:'epic',ilvl:54,bind:'pickup',slot:'main',hand:'Two-Hand',type:'Gun',dmg:[96,178],speed:3.2,stats:{atk:12,crit:3},equip:['Your first shot in every fight hits every enemy.'],set:'gangster',req:5,sell:11200,flavor:'There is no violin in it. There never was.',icon:'items/violin_case'},
 pocket_trebuchet:{name:'Pocket Trebuchet',rarity:'epic',ilvl:50,bind:'pickup',slot:'main',hand:'Two-Hand',type:'Siege Engine',dmg:[70,140],speed:3.5,stats:{atk:10,spd:2},set:'engineer',req:5,sell:9400,flavor:'Small enough for a pocket, loud enough for a castle.',icon:'items/pocket_trebuchet'},
 defib_paddles:{name:'Defibrillator Paddles',rarity:'epic',ilvl:46,bind:'pickup',slot:'main',hand:'One-Hand',type:'Paddles',dmg:[44,70],speed:2.0,stats:{atk:5,hp:30},equip:['Once per delve, brings a fallen ally back with 30% Health.'],set:'paramedic',req:4,sell:8100,flavor:'Charged, steady, and ready to bring someone back.',icon:'items/defib_paddles'},
 shield_lost_ninth:{name:'Shield of the Lost Ninth',rarity:'legendary',ilvl:70,bind:'pickup',slot:'off',type:'Shield',armor:1840,block:62,stats:{atk:4,def:14,hp:120},equip:['When an ally falls, your Defense rises by 25 for the rest of the fight.'],set:'legionary',req:6,sell:172000,flavor:'Nine thousand marched north. This is what came home.',icon:'items/shield_lost_ninth'},
 trench_lantern:{name:'Trench Lantern',rarity:'rare',ilvl:36,bind:'equip',slot:'off',type:'Held In Off-hand',stats:{spd:4,luck:3},equip:['Lights up hidden chests in dark rooms.'],req:3,sell:4100,flavor:'It has seen darker nights than this one, and it kept burning.',icon:'items/trench_lantern'},
 medic_bag:{name:'Medic Bag',rarity:'uncommon',ilvl:28,bind:'equip',slot:'off',type:'Held In Off-hand',stats:{def:2,hp:40},equip:['Potions you drink heal 10% more.'],set:'paramedic',req:2,sell:1380,flavor:'Everything you need for a very bad day.',icon:'items/medic_bag'},
 pinstripe_fedora:{name:'Pinstripe Fedora',rarity:'uncommon',ilvl:24,bind:'equip',slot:'head',type:'Leather',armor:64,stats:{def:4,luck:3},equip:['Hustles pay 3% more gold.'],set:'gangster',req:2,sell:1240,flavor:'Tilted just enough to say the boss sent him.',icon:'items/pinstripe_fedora'},
 brass_goggles:{name:'Brass Goggles',rarity:'rare',ilvl:38,bind:'equip',slot:'head',type:'Leather',armor:92,stats:{def:3,hp:30,crit:2},equip:['Mining is 5% faster.'],set:'engineer',req:3,sell:4875,flavor:'Built to see through smoke, sparks and bad ideas.',icon:'items/brass_goggles'},
 galea_helmet:{name:'Galea Helmet',rarity:'rare',ilvl:34,bind:'pickup',slot:'head',type:'Plate',armor:188,stats:{def:6,hp:40},equip:['Increases your chance to dodge an attack by 1%.'],set:'legionary',req:3,sell:3410,flavor:'The red crest says follow me into the fight.',icon:'items/galea_helmet'},
 item_red_carpet_tux:{name:'Red Carpet Tux',rarity:'epic',ilvl:52,bind:'pickup',slot:'chest',type:'Cloth',armor:140,stats:{def:6,hp:60,spd:5},equip:['Enemies attack you first. You look too good to ignore.'],set:'will_slapton',req:5,sell:9850,flavor:'Pressed, steamed, and ready for its close-up.',icon:'items/item_red_carpet_tux'},
 pinstripe_vest:{name:'Pinstripe Vest',rarity:'epic',ilvl:50,bind:'pickup',slot:'chest',type:'Leather',armor:160,stats:{def:7,hp:40,luck:4},set:'gangster',req:5,sell:9100,flavor:'Sharp lines, deep pockets, and a watch that isn\'t his.',icon:'items/pinstripe_vest'},
 hi_vis_vest:{name:'Hi-Vis Vest',rarity:'common',ilvl:8,bind:null,slot:'chest',type:'Cloth',armor:38,stats:{def:2,hp:15},req:1,sell:112,flavor:'Bright enough to be seen from the next century.',icon:'items/hi_vis_vest'},
 mammoth_cloak:{name:'Mammoth Cloak',rarity:'rare',ilvl:32,bind:'equip',slot:'chest',type:'Leather',armor:120,stats:{def:5,hp:60},req:3,sell:3050,flavor:'Warm, heavy, and still a little bit angry.',icon:'items/mammoth_cloak'},
 hobnailed_caligae:{name:'Hobnailed Caligae',rarity:'uncommon',ilvl:26,bind:'equip',slot:'feet',type:'Plate',armor:96,stats:{def:4,spd:3},req:2,sell:1520,flavor:'Thousands of miles of empire, one hobnail at a time.',icon:'items/hobnailed_caligae'},
 open_palm:{name:'The Open Palm',rarity:'absurd',ilvl:75,bind:'pickup',unique:true,slot:'hands',type:'Cloth',armor:72,stats:{atk:18,crit:5},equip:['Your slaps stun for 1 extra turn.'],set:'will_slapton',req:7,sell:260000,flavor:'Still tingling from the last one.',icon:'items/open_palm_glove'},
 steam_gauntlet:{name:'Steam Gauntlet',rarity:'epic',ilvl:48,bind:'pickup',slot:'hands',type:'Plate',armor:210,stats:{atk:6,def:6},equip:['Hits have a 5% chance to vent steam, burning the enemy for 30 damage.'],set:'engineer',req:4,sell:8700,flavor:'Runs on coal, steam and a strong right hook.',icon:'items/steam_gauntlet'},
 bone_necklace:{name:'Bone Necklace',rarity:'rare',ilvl:30,bind:'equip',slot:'neck',type:'Amulet',stats:{atk:4,crit:1},req:3,sell:2900,flavor:'Every tooth on it comes with a story Brokk will tell twice.',icon:'items/bone_necklace'},
 second_moon:{name:'Second Moon',rarity:'unhinged',ilvl:80,bind:'pickup',unique:true,slot:'ring',type:'Ring',stats:{hp:50,luck:12},equip:['Rare loot drops 10% more often while it is night in Aldermere.'],req:9,sell:420000,flavor:'Look up tonight and count the moons again.',icon:'items/second_moon'},
 item_golden_statuette:{name:'Golden Statuette',rarity:'legendary',ilvl:66,bind:'pickup',unique:true,slot:'trinket',type:'Trinket',stats:{atk:8,luck:6},use:'Raise it high. Your squad deals 20% more damage for 15 sec.',cd:'2 Min Cooldown',set:'will_slapton',req:6,sell:150000,flavor:'He would like to thank the Academy, his mother, and his right hand.',icon:'items/item_golden_statuette'},
 stained_mug:{name:'Stained Mug',rarity:'common',ilvl:6,bind:null,slot:'trinket',type:'Trinket',stats:{luck:1},use:'Take a sip. Restores 15 Health over 10 sec.',cd:'1 Min Cooldown',set:'office_worker',req:1,sell:35,flavor:'It says World\'s Okayest Hero, and he wears it proudly.',icon:'items/stained_mug'},
 black_ledger:{name:'Black Ledger',rarity:'epic',ilvl:44,bind:'pickup',slot:'trinket',type:'Trinket',stats:{luck:8},equip:['Shows who owes you gold in every city.'],set:'office_worker',req:4,sell:7700,flavor:'Every name in it owes somebody something.',icon:'items/black_ledger'},
 group_chat:{name:'The Group Chat',rarity:'rare',ilvl:30,bind:'equip',slot:'trinket',type:'Trinket',stats:{spd:4,luck:2},use:'Send one message. Your squad acts sooner for 10 sec.',cd:'3 Min Cooldown',set:'office_worker',req:3,sell:2600,flavor:'47 unread, and every one of them says urgent.',icon:'items/group_chat'},
 trauma_shears:{name:'Trauma Shears',rarity:'uncommon',ilvl:26,bind:'equip',slot:'trinket',type:'Trinket',stats:{atk:3,spd:3},set:'paramedic',req:2,sell:1300,flavor:'They cut through jeans, boots and excuses.',icon:'items/trauma_shears'},
 potion_pink:{name:'Healing Draught',rarity:'rare',ilvl:30,slot:'belt',type:'Potion',use:'Restores 70 Health to the hero who drinks it.',cd:'30 Sec Cooldown',stack:20,req:1,sell:128,flavor:'Thick, pink, and it fixes most of what a delve breaks.',icon:'gen/potion_pink'},
 potion_cyan:{name:'Guard Oil',rarity:'rare',ilvl:30,slot:'belt',type:'Potion',use:'Rub it on your armor. +25 Defense for one fight.',cd:'1 Min Cooldown',stack:20,req:1,sell:128,flavor:'Blades slide off it like rain off a window.',icon:'gen/potion_cyan'},
 flask:{name:'Night Tonic',rarity:'epic',ilvl:48,slot:'belt',type:'Potion',use:'Restores 4 Health every 3 sec for the rest of the delve.',cd:'Once per delve',stack:5,req:4,sell:520,flavor:'Brewed under the second moon. Tastes like plums and courage.',icon:'gen/flask'},
 eel_stew:{name:'Eel Stew',rarity:'uncommon',ilvl:12,slot:'belt',type:'Food',use:'Restores 28 Health. Your hero has to sit down to eat it.',cd:'10 Sec Cooldown',stack:20,req:1,sell:18,flavor:'Hot, salty, and straight from the river.',icon:'gen/eel_stew'},
};
window.SETS={
 will_slapton:{name:'Award Night',items:['item_red_carpet_tux','item_golden_statuette','open_palm'],bonus:'Standing Ovation',text:'Once per delve, your slap hits every enemy in the room. +10 Attack.',stats:{atk:10}},
 legionary:{name:'The Lost Ninth',items:['galea_helmet','rusty_gladius','shield_lost_ninth'],bonus:'Testudo',text:'When you raise your shield, the whole squad takes half damage for 1 turn. +15 Defense.',stats:{def:15}},
 gangster:{name:'Prohibition Row',items:['pinstripe_fedora','pinstripe_vest','violin_case'],bonus:'Made Man',text:'Every hustle pays 15% more gold. +8 Luck.',stats:{luck:8}},
 engineer:{name:'Crane and Daughters',items:['brass_goggles','steam_gauntlet','pocket_trebuchet'],bonus:'Full Steam',text:'Mining runs 20% faster, and your contraptions fire twice. +6 Speed.',stats:{spd:6}},
 paramedic:{name:'Night Shift',items:['defib_paddles','medic_bag','trauma_shears'],bonus:'Golden Hour',text:'The first hero to fall in a delve gets back up with half Health. +60 Health.',stats:{hp:60}},
 office_worker:{name:'Corner Office',items:['stained_mug','group_chat','black_ledger'],bonus:'Circle Back',text:'Reply All lasts 1 extra turn, and nobody can mute it. +5% Crit Chance.',stats:{crit:5}},
};
// hero base stats (card level 1)
window.HEROES_M={
 will_slapton:{name:'Will Slapton',title:'Leading Man',r:'absurd',lv:7,era:'Hollywood, 2022',base:{atk:16,def:9,hp:112,spd:13,crit:8,luck:2},back:'Keep It Out Your Mouth',bt:'A thunderous slap that stuns one enemy for 2 turns. Double damage if they just made a joke.',foot:'Stuns the loudest enemy'},
 office_worker:{name:'Kevin Latham',title:'Office Worker',r:'common',lv:1,era:'Modern day',base:{atk:7,def:8,hp:104,spd:12,crit:5,luck:4},back:'Reply All',bt:'Marks every enemy so the squad hits harder for two turns.',foot:'Hits harder together'},
 legionary:{name:'Gaius Marcellus',title:'Roman Legionary',r:'rare',lv:4,era:'Rome',base:{atk:12,def:15,hp:160,spd:8,crit:5,luck:1},back:'Formation',bt:'His guard grows with every ally still standing.',foot:'Holds the line'},
 gangster:{name:'Vincenzo Moretti',title:'Prohibition Gangster',r:'epic',lv:5,era:'Chicago, 1927',base:{atk:13,def:9,hp:112,spd:15,crit:7,luck:5},back:'Shakedown',bt:'He scares a mark off, or he buys the room.',foot:'+15% hustle chance'},
 engineer:{name:'Edith Crane',title:'Victorian Engineer',r:'rare',lv:6,era:'London, 1880s',base:{atk:8,def:9,hp:112,spd:16,crit:6,luck:3},back:'Contraptions',bt:'She builds a way through with scrap, steam and spite.',foot:'Mining +15% speed'},
 paramedic:{name:'Maya Washington',title:'Paramedic',r:'uncommon',lv:3,era:'Modern day',base:{atk:7,def:10,hp:120,spd:14,crit:5,luck:3},back:'Triage',bt:'She stops the bleeding and gets everyone walking.',foot:'Meals heal harder'},
};
// card total = floor(base * (1 + 0.05*(level-1))) + sum(gear stats) + active set stats   (see STATS.md)
window.heroTotals=function(hid,gear){
  const h=HEROES_M[hid],m=1+0.05*(h.lv-1),t={};
  for(const k in STAT_NAMES)t[k]=k==='crit'||k==='luck'?h.base[k]:Math.floor(h.base[k]*m);
  const worn=Object.entries(gear).filter(([k])=>k!=='belt').map(([,v])=>v).filter(Boolean);
  const g={atk:0,def:0,hp:0,spd:0,crit:0,luck:0};
  worn.forEach(id=>{const s=ITEMS[id].stats||{};for(const k in s)g[k]+=s[k]});
  const S=SETS[hid];if(S&&S.items.every(x=>worn.includes(x)))for(const k in S.stats)g[k]+=S.stats[k];
  const tot={};for(const k in t)tot[k]=t[k]+g[k];
  return {base:t,gear:g,total:tot};
};
