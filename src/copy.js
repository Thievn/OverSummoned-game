export const meta = {
  title: 'OverSummoned',
  description:
    'OverSummoned is a browser game set in Aldermere, a city that keeps summoning people from Earth by accident.',
};

export const tagline = 'Pulled from Earth. Stuck in Ash.';

export const nav = [
  { href: '#about', label: 'About' },
  { href: '#features', label: 'Features' },
  { href: '#rules', label: 'Rules' },
  { href: '#ledger', label: 'Ledger' },
];

export const skip = 'Skip to the waitlist';
export const signupTitle = 'Join the waitlist';
export const join = 'Join the waitlist';
export const spam = "We don't spam.";
export const adults = 'Adults only. 18+.';

export const pitch = [
  'OverSummoned is a browser game set in Aldermere, a city that keeps summoning people from Earth by accident.',
  'Pick who you were, hire a squad from every century, and survive the dungeon under the city.',
];

export const joke = 'A Roman can carry a defibrillator. Nobody here will stop him.';

export const form = {
  email: 'Email',
  placeholder: 'you@example.com',
  fax: 'Fax',
  sending: 'Sending',
  success: "You're on the list.",
  invalid: 'That address did not work.',
  rate: 'Wait a few minutes.',
  down: 'Try again in a minute.',
};

export const featuresIntro = 'In the city';

export const featureBlurbs = [
  { title: 'The Descent', text: 'Go down with a squad of three.' },
  { title: 'Gear', text: 'Gear up from any century.' },
  { title: 'The Exchange', text: 'Trade with the whole city.' },
  { title: 'The Ledger', text: 'Climb the Ledger of Names.' },
];

export const about = {
  title: 'What you do',
  steps: [
    'Pick your era.',
    'Hire your squad.',
    'Come back richer, or come back with a Scar.',
  ],
};

export const screen = {
  status: 'Status',
  energy: 'Energy',
  nerve: 'Nerve',
  morale: 'Morale',
  life: 'Life',
  energyNote: '5 every 10 min',
  nerveNote: 'Spent on Hustles',
  moraleNote: 'Set by lodging',
  lifeNote: 'Infirmary at 0',
  character: 'Character',
  openSheet: 'Open the sheet',
  rank: 'Rank',
  faction: 'Faction',
  due: 'Due',
  location: 'Location',
  news: 'City news',
  utc: 'UTC',
  places: 'Places',
};

export const desks = [
  { id: 'home', label: 'Home' },
  { id: 'city', label: 'City' },
  { id: 'descent', label: 'Descent' },
  { id: 'office', label: 'Office' },
  { id: 'market', label: 'Market' },
  { id: 'crier', label: 'Crier' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'infirmary', label: 'Infirmary' },
];

export const sample = {
  cardId: 'office_worker',
  rank: 'New arrival',
  faction: 'Fresh Eyes Guild',
  due: '4',
  location: 'Hero Office',
};

export const headlines = [
  {
    source: 'Infirmary',
    text: 'A paramedic shocked a ghoul. It said sorry and left.',
  },
  {
    source: 'Stocks',
    text: 'Fourteen coins taken. One sandwich left behind.',
  },
  {
    source: 'The Crier',
    text: 'Mr. Pell sighed at the Overflow forms.',
  },
  {
    source: 'Docks',
    text: 'The Office says the second moon is a lamp.',
  },
];

export const deskCopy = {
  city: {
    title: 'City',
    lines: ['Spare heroes earn Crowns while you are out.'],
  },
  descent: {
    title: 'Descent',
    lines: ['Pick a door. Read the next move. Hit first.'],
  },
  office: {
    title: 'Hero Office',
    lines: ['You owe four Crowns for the summoning.'],
  },
  market: {
    title: 'Exchange',
    lines: ['Sell gear for Crowns. Real money is banned.'],
  },
  crier: {
    title: 'The Crier',
    lines: headlines.map((line) => `${line.source}. ${line.text}`),
  },
  stocks: {
    title: 'Stocks',
    lines: ['You took the coins and left the sandwich. An hour in the Stocks.'],
  },
  infirmary: {
    title: 'Infirmary',
    lines: ['At zero Life, you wake up here.'],
  },
};

export const heroes = {
  title: 'Heroes you can hire',
  lead: 'Every Friday the Circle brings in a new batch. Some of them are worth hiring.',
  hint: 'Open a card.',
};

export const knowhow = {
  legionary: 'Formation. Guard rises with each companion beside you.',
  gangster: 'Shakedown. Intimidate or bribe.',
  paramedic: 'Triage. Better healing. Stops Bleed.',
  office_worker: 'Reply All. Marks every enemy for two turns.',
  hunter: 'Fire-craft. Lights the dark and cooks meat into healing.',
  engineer: 'Contraptions. Traps and gadgets from scrap.',
  plague_doctor: 'Miasma Theory. Cures Poison and Rot. Wrong about why.',
  delivery_rider: 'Last Mile. An exit costs no Energy.',
};

export const bios = {
  legionary: 'He signed for the sword. He still has the receipt.',
  gangster: 'He arrived with a violin case and no violin.',
  paramedic: 'The Circle took her ambulance too. The siren still works.',
  office_worker: 'Kevin had 412 unread emails when the floor opened under him.',
  hunter: 'He came through holding a spear and a strip of cooked meat.',
  engineer: 'She measured the Circle and asked who bought the cheap parts.',
  plague_doctor: 'Wrong about the cause. Right about the cure.',
  delivery_rider: 'The bag came with him. The customer did not.',
};

export const sheet = {
  close: 'Close',
  guard: 'Guard',
  might: 'Might',
  knack: 'Knack',
  base: 'Base',
  gear: 'Gear',
  total: 'Total',
  know: 'Know-How',
  also: 'Also',
  empty: 'Empty',
  anomalyLocked: 'Level 20',
  belt: 'Belt',
  consumable: 'Consumable',
  withGear: 'With gear.',
  itemLevel: 'Item Level',
  closeItem: 'Close item',
};

export const slots = {
  main: 'Main Hand',
  off: 'Off Hand',
  head: 'Head',
  chest: 'Chest',
  legs: 'Legs',
  feet: 'Feet',
  ring1: 'Ring',
  ring2: 'Ring',
  trinket1: 'Trinket',
  trinket2: 'Trinket',
  anomaly: 'Anomaly',
};

export const rarity = {
  title: 'Rarity',
  line: 'Items get sillier as rarity goes up.',
};

export const rarityTiers = [
  { id: 'common', name: 'Common', color: '#B8B2A7' },
  { id: 'uncommon', name: 'Uncommon', color: '#3FAE4F' },
  { id: 'rare', name: 'Rare', color: '#3A86FF' },
  { id: 'epic', name: 'Epic', color: '#A35BF0' },
  { id: 'legendary', name: 'Legendary', color: '#F28C1B' },
  { id: 'absurd', name: 'Absurd', color: '#F04FC8' },
  { id: 'unhinged', name: 'Unhinged', color: '#E5262E' },
];

export const loot = {
  title: 'Loot',
  hint: 'Tap an icon.',
};

export const sections = [
  {
    id: 'overflow',
    title: 'Overflow Night',
    lines: ['Every Friday you draw 3. Keep 1.', 'The rest go to the Hiring Hall.'],
  },
  {
    id: 'descent',
    title: 'Gear and the Descent',
    lines: ['Any item fits any hero.', 'Die down there and you keep a Scar.'],
  },
  {
    id: 'trade',
    title: 'The Exchange',
    lines: ['Sell gear for Crowns.', 'Real-money trades are banned.'],
  },
  {
    id: 'crews',
    title: 'Crews',
    lines: ['A Crew shares a hall and the blame.'],
  },
];

export const rules = {
  title: 'House rules',
  lines: ['You and two hired heroes.', 'Real-money trades are banned.'],
};

export const ledger = {
  title: 'Ledger of Names',
  lines: ['The public list of who did what.'],
};

export const footer = {
  adults: 'Adults only. 18+.',
  privacy: 'Privacy',
  terms: 'Terms',
};

export const legal = {
  privacyTitle: 'Privacy',
  privacy: ['We keep your email. We do not sell it.'],
  termsTitle: 'Terms',
  terms: ['The store sells looks, never a win.', 'Real-money trades are banned.'],
};

export const itemVoices = {
  second_moon: 'Stop calling me a lamp.',
  group_chat: 'You cannot mute this.',
};
