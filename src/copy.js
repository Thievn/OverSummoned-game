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
export const promise = 'We send one email when the doors open.';
export const adults = 'Adults only. 18+.';

export const pitch = [
  'OverSummoned is a browser game set in Aldermere, a city that keeps summoning people from Earth by accident.',
  'Pick who you were, hire a squad from every century, and survive the dungeon under the city.',
];

export const dayLine =
  'Each day you spend Energy, Nerve, Morale and Life, then take one run under the city.';

export const joke = 'A Roman can carry a defibrillator. Nobody here will stop him.';

export const form = {
  email: 'Email',
  placeholder: 'you@example.com',
  fax: 'Fax',
  sending: 'Sending',
  success: "You're on the list. We send one email when the doors open.",
  invalid: 'That address did not work. Check it and try again.',
  rate: 'Too many tries from here. Wait a few minutes.',
  down: 'The list did not answer. Try again in a minute.',
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
  body: 'A session is about fifteen minutes. Collect wages and check the Exchange. Then run one floor, sort the loot, and spend the Nerve you have left.',
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
    text: 'A paramedic shocked a ghoul. The ghoul said sorry and left by the side door.',
  },
  {
    source: 'Stocks',
    text: 'Fourteen coins taken, one sandwich left behind. One hour in the Stocks.',
  },
  {
    source: 'The Crier',
    text: 'Mr. Pell has the Overflow forms out. He has already sighed at the numbers.',
  },
  {
    source: 'Docks',
    text: 'The second moon is over the water. The Hero Office calls it a lamp.',
  },
  {
    source: 'Hiring Hall',
    text: 'Three heroes from Friday are still at the hall. One brought a lantern.',
  },
  {
    source: 'Exchange',
    text: 'A violin case sold before noon. The receipt inside was for a violin.',
  },
];

export const deskCopy = {
  city: {
    title: 'City',
    lines: [
      'Spare heroes work city jobs while you are away.',
      'Wages pay in Crowns when the timer ends.',
      'Lodging sets Morale. A bad room sets it low.',
    ],
  },
  descent: {
    title: 'Descent',
    lines: [
      'Pick a door. Read what the ghoul is about to do. Hit it first.',
      'The Old Cellars are the first dungeon. The Angry Boiler waits at the bottom.',
      'An exit shows up every few floors. Leave with the loot, or go deeper.',
    ],
  },
  office: {
    title: 'Hero Office',
    lines: [
      'Mr. Pell found your column and sighed at a number bigger than last week.',
      'You owe the Office four Crowns for the summoning.',
    ],
  },
  market: {
    title: 'Exchange',
    lines: [
      'Sell gear for Crowns. Fees and cooldowns come out of the sale.',
      'Trading for real money is banned.',
    ],
  },
  crier: {
    title: 'The Crier',
    lines: headlines.map((line) => `${line.source}. ${line.text}`),
  },
  stocks: {
    title: 'Stocks',
    lines: [
      'He had fourteen coins and a sandwich. You took the coins.',
      'He noticed, and you spent the next hour in the Stocks thinking about the sandwich.',
    ],
  },
  infirmary: {
    title: 'Infirmary',
    lines: [
      'When Life hits zero, you wake up here.',
      'A paramedic shocked a ghoul. The ghoul said sorry and left by the side door.',
    ],
  },
};

export const heroes = {
  title: 'Heroes you can hire',
  lead: 'Every Friday the Circle brings in a new batch. Some of them are worth hiring.',
  hint: 'Click or tap a card to open the character sheet.',
};

export const knowhow = {
  legionary: 'Formation. Guard rises with each companion in the fight.',
  gangster: 'Shakedown. Intimidate or bribe enemies and merchants.',
  paramedic: 'Triage. Healing is stronger, it stops Bleed, and it can revive a companion.',
  office_worker: 'Reply All. Marks every enemy for two turns.',
  hunter: 'Fire-craft. Sets enemies alight, lights dark rooms, and cooks meat into healing.',
  engineer: 'Contraptions. Builds traps and gadgets from scrap.',
  plague_doctor: 'Miasma Theory. Cures Poison and Rot. Wrong about why. Still works.',
  delivery_rider: 'Last Mile. An exit costs no Energy, and you leave with one extra item.',
};

export const bios = {
  legionary: 'He signed for the sword, then the floor opened. He still has the receipt.',
  gangster: 'He arrived with a violin case and no violin. The Office charged him four Crowns anyway.',
  paramedic: 'The Circle took her halfway through a shift, ambulance and all. The siren still works.',
  office_worker:
    'Kevin had 412 unread emails when the floor opened under him. He still wonders what was in the last one.',
  hunter: 'He came through with a spear and a strip of cooked meat. The meat settled the fight that week.',
  engineer: 'She measured the Circle, wrote the number down, and asked who signed off on the cheap parts.',
  plague_doctor: 'He is wrong about the cause and right about the cure. The cellar smells of cloves either way.',
  delivery_rider: 'The delivery bag came with him. The customer is in another century. The bag is not.',
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
  knackRule: 'Knack gear is the rounded average of Wits, Hands and Charm.',
  also: 'Also on the gear',
  empty: 'Empty',
  anomalyLocked: 'Level 20',
  belt: 'Belt',
  consumable: 'Consumable',
  withGear: 'Totals include gear.',
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
  { id: 'common', name: 'Common', letter: 'C', shape: 'circle', color: '#B8B2A7' },
  { id: 'uncommon', name: 'Uncommon', letter: 'U', shape: 'diamond', color: '#3FAE4F' },
  { id: 'rare', name: 'Rare', letter: 'R', shape: 'hexagon', color: '#3A86FF' },
  { id: 'epic', name: 'Epic', letter: 'E', shape: 'shield', color: '#A35BF0' },
  { id: 'legendary', name: 'Legendary', letter: 'L', shape: 'pentagon', color: '#F28C1B' },
  { id: 'absurd', name: 'Absurd', letter: 'A', shape: 'heart', color: '#F04FC8' },
  { id: 'unhinged', name: 'Unhinged', letter: 'X', shape: 'shard', color: '#E5262E' },
];

export const loot = {
  title: 'Loot',
  line: 'A Roman can carry a defibrillator. Nobody here will stop him.',
  hint: 'Hover or tap an icon for the item.',
};

export const sections = [
  {
    id: 'overflow',
    title: 'Overflow Night',
    lines: [
      'Every Friday at 8 PM Eastern, the Circle brings in one shared batch.',
      'You get your own random 3, keep 1, and the rest go to the Hiring Hall.',
      'Lost Property crates open the same night.',
    ],
  },
  {
    id: 'descent',
    title: 'Gear and the Descent',
    lines: [
      'Cards start close in power. Gear does most of the rest.',
      'Any item fits any hero, from any century.',
      'Die down there and you lose what you have not banked. You keep a Scar.',
    ],
  },
  {
    id: 'trade',
    title: 'The Exchange',
    lines: [
      'Anything worth having can be sold for Crowns, with fees and cooldowns.',
      'Trading for real money is banned.',
      'Money in the store buys looks. It never buys power.',
    ],
  },
  {
    id: 'crews',
    title: 'Crews',
    lines: [
      'A Crew shares a hall, a name, and the jobs nobody wants.',
      'The Crier prints what the Crew did. So does the Stocks list, if you were caught.',
    ],
  },
];

export const rules = {
  title: 'House rules',
  lines: [
    'Squads are three. You, plus two heroes you hired.',
    'Energy, Nerve, Morale and Life spend, then refill on timers.',
    'No era locks. A hunter can wear a hi-vis vest.',
    'Adults only. 18+.',
  ],
};

export const ledger = {
  title: 'Ledger of Names',
  lines: [
    'The Ledger of Names is the public list of who did what in Aldermere.',
    'It opens with the city. There is nothing on it yet.',
  ],
};

export const bottom = {
  title: 'The doors are shut.',
  line: 'We send one email when the doors open.',
};

export const footer = {
  adults: 'OverSummoned is for adults. 18+.',
  privacy: 'Privacy',
  terms: 'Terms',
};

export const legal = {
  privacyTitle: 'Privacy',
  privacy: [
    'We save the email you type so we can send one message when the doors open.',
    'Resend holds the contact. We do not sell addresses, and we do not send anything else.',
  ],
  termsTitle: 'Terms',
  terms: [
    'OverSummoned is an adults-only game, 18 and over.',
    'The city is not open yet. Joining the list does not buy anything.',
    'When a store exists, it sells looks and never power. Trades for real money are banned.',
  ],
};

export const itemVoices = {
  second_moon: 'Stop calling me a lamp.',
  group_chat: 'You cannot mute this.',
};
