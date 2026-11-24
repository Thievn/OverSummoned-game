export const HEROES = [
  {
    id: 'cyber-knight',
    name: 'Cyber-Knight',
    era: 'Neon Ruins',
    role: 'Rift Vanguard',
    img: '/art/hero-cyber-knight.png',
    unlocked: true,
    trait: 'Holds the line in two centuries at once. Neon plate, pirate nerve.',
    lore: 'Pulled from a neon century that has not happened yet. He still bows like a gentleman and swings like a privateer.',
    base: { atk: 980, def: 802, spd: 92, crit: 10, luck: 23 },
  },
  {
    id: 'apprentice',
    name: 'Apprentice Summoner',
    era: 'Bureau Hall',
    role: 'First Summoner',
    img: '/art/hero-apprentice.png',
    unlocked: true,
    trait: 'The Bureau sent him first. He treats every click like a dare.',
    lore: 'Newest badge in the Summoning Bureau. He talks to the circle like it can hear him. Some days, it answers.',
    base: { atk: 720, def: 610, spd: 118, crit: 14, luck: 31 },
  },
  {
    id: 'victorian-ghost',
    name: 'Victorian Ghost',
    era: 'Gaslight London',
    role: 'Waiting in the rift',
    img: null,
    unlocked: false,
    trait: 'A polite haunt with unusual taste in hardware. Still arriving.',
    lore: 'A calling card is already on the ledger. The circle has not opened for her just yet.',
    base: { atk: 0, def: 0, spd: 0, crit: 0, luck: 0 },
  },
  {
    id: 'stone-hunter',
    name: 'Stone Age Hunter',
    era: 'First Fire',
    role: 'Waiting in the rift',
    img: null,
    unlocked: false,
    trait: 'Older than the Bureau paperwork. Still arriving.',
    lore: 'The first spark of a campfire is already humming under the stones.',
    base: { atk: 0, def: 0, spd: 0, crit: 0, luck: 0 },
  },
];

export const GEAR = [
  {
    id: 'visor',
    name: 'Cyber Visor',
    slot: 'hat',
    rarity: 'rare',
    img: '/art/item-visor.png',
    stats: { atk: 40, spd: 14, luck: 8 },
    lore: 'Reads three seconds into a fight you have not started yet.',
    dropRate: '4.8%',
    marketValue: 1.24,
    owned: true,
  },
  {
    id: 'blade',
    name: 'Neon Blade',
    slot: 'weapon',
    rarity: 'epic',
    img: '/art/item-blade.png',
    stats: { atk: 200, spd: 20, crit: 8 },
    lore: 'Forged in a blackout. The edge hums in a key only stray cats can hear.',
    dropRate: '1.7%',
    marketValue: 6.9,
    owned: true,
  },
  {
    id: 'pirate-hat',
    name: 'Pirate Hat',
    slot: 'hat',
    rarity: 'absurd',
    img: '/art/item-pirate-hat.png',
    stats: { atk: 68, def: 40, luck: 14 },
    lore: 'Walked out of a stormy century and refused to take itself off.',
    dropRate: '0.4%',
    marketValue: 18.5,
    owned: true,
  },
  {
    id: 'relic',
    name: 'Rift Relic',
    slot: 'relic',
    rarity: 'unhinged',
    img: '/art/item-rift-relic.png',
    stats: { atk: 120, crit: 12, luck: 22 },
    lore: 'A pocket of the circle you can wear. It whispers about the next pull.',
    dropRate: '0.08%',
    marketValue: 47,
    owned: true,
  },
  {
    id: 'club',
    name: 'Caveman Club',
    slot: 'weapon',
    rarity: 'legendary',
    img: '/art/item-club.png',
    stats: { atk: 160, def: 30, crit: 4 },
    lore: 'Simple, honest, older than every Bureau rule. Still hits like a landslide.',
    dropRate: '0.9%',
    marketValue: 9.4,
    owned: true,
  },
  {
    id: 'cloak',
    name: 'Shadow Cloak',
    slot: 'cloak',
    rarity: 'epic',
    img: '/art/item-cloak.png',
    stats: { def: 110, spd: 8, luck: 6 },
    lore: 'Woven from a night that never ended. The hem still drips starlight.',
    dropRate: '1.5%',
    marketValue: 5.15,
    owned: true,
  },
];

export const FEATURED_IDS = ['visor', 'blade', 'pirate-hat', 'relic'];

export const ERAS = [
  {
    id: 'neon-ruins',
    name: 'Neon Ruins',
    bg: '/art/bg-neon-ruins.png',
    blurb: 'A wet plaza under a city that forgot how to sleep.',
  },
  {
    id: 'pirate-cove',
    name: 'Pirate Cove',
    bg: '/art/bg-pirate-cove.png',
    blurb: 'Lanterns, lightning, and a ship that should not still be afloat.',
  },
];

export const RARITY = {
  common: { label: 'COMMON', color: '#9aa0b4' },
  uncommon: { label: 'UNCOMMON', color: '#34d399' },
  rare: { label: 'RARE', color: '#3b82f6' },
  epic: { label: 'EPIC', color: '#a855f7' },
  legendary: { label: 'LEGENDARY', color: '#e8c36a' },
  absurd: { label: 'ABSURD', color: '#dc2626' },
  unhinged: { label: 'UNHINGED', color: '#ff2e93' },
};

export const FUSION_ORDER = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'absurd',
  'unhinged',
];

export const DELVE_FLOORS = [
  {
    floor: 1,
    title: 'Dust and Echoes',
    text: 'A faint spark of Era dust lifts off the stones.',
    loot: 'Common Era Spark',
    rarity: 'common',
    fail: 0,
    essence: 8,
    sparks: 3,
  },
  {
    floor: 2,
    title: 'Lantern Street',
    text: 'Street lanterns flicker, and a sealed cache clicks open.',
    loot: 'Uncommon Era Spark',
    rarity: 'uncommon',
    fail: 0.08,
    essence: 16,
    sparks: 2,
  },
  {
    floor: 3,
    title: 'The Rattle Cache',
    text: 'Something valuable knocks from inside a locked crate.',
    loot: 'Rare Era Spark',
    rarity: 'rare',
    fail: 0.14,
    essence: 28,
    sparks: 2,
  },
  {
    floor: 4,
    title: 'Howling Gate',
    text: 'The rift howls and offers a relic shard in the dark.',
    loot: 'Epic Era Spark',
    rarity: 'epic',
    fail: 0.24,
    essence: 44,
    sparks: 1,
  },
  {
    floor: 5,
    title: 'The Unhinged Lean',
    text: 'Something Unhinged leans out of the dark and grins at you.',
    loot: 'Absurd Era Spark',
    rarity: 'absurd',
    fail: 0.36,
    essence: 70,
    sparks: 1,
  },
];

export const MARKET_LISTINGS = [
  { itemId: 'visor', seller: 'RiftCat92', price: 1.24, qty: 3 },
  { itemId: 'blade', seller: 'NeonDock', price: 6.9, qty: 1 },
  { itemId: 'club', seller: 'FirstFire', price: 9.4, qty: 2 },
  { itemId: 'cloak', seller: 'NightHem', price: 5.15, qty: 1 },
  { itemId: 'pirate-hat', seller: 'StormCove', price: 18.5, qty: 1 },
  { itemId: 'relic', seller: 'BureauLost', price: 47, qty: 1 },
];

export const SLOT_ORDER = ['hat', 'weapon', 'cloak', 'relic'];
export const SLOT_LABELS = {
  hat: 'Hat',
  weapon: 'Weapon',
  cloak: 'Cloak',
  relic: 'Relic',
};
export const EMPTY_SLOT_COPY = {
  hat: 'No Hat',
  weapon: 'No Weapon',
  cloak: 'No Cloak',
  relic: 'No Relic',
};

export const NAV = [
  { id: 'heroes', label: 'Heroes' },
  { id: 'gear', label: 'Gear' },
  { id: 'idler', label: 'Era Idler' },
  { id: 'delve', label: 'Rift Delve' },
  { id: 'binder', label: 'Steam Binder' },
  { id: 'market', label: 'Market' },
];

export function formatStat(key, value) {
  if (key === 'crit') return `${value}%`;
  return Number(value).toLocaleString();
}

export function formatMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

export function computeStats(hero, loadout, gearList) {
  const stats = { atk: 0, def: 0, spd: 0, crit: 0, luck: 0, ...hero.base };
  for (const slot of SLOT_ORDER) {
    const id = loadout[slot];
    if (!id) continue;
    const item = gearList.find((g) => g.id === id);
    if (!item) continue;
    for (const [k, v] of Object.entries(item.stats)) {
      stats[k] = (stats[k] || 0) + v;
    }
  }
  return stats;
}

export function itemById(id) {
  return GEAR.find((g) => g.id === id);
}

export function heroById(id) {
  return HEROES.find((h) => h.id === id);
}
