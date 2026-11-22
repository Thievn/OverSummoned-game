export const meta = {
  title: 'OverSummoned',
  description:
    'OverSummoned is a fantasy adventure game. You are pulled from Earth into Aldermere, a city built on top of an endless dungeon.',
};

export const tagline = 'Summoned from Earth. Sent into the dark.';

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
  'OverSummoned throws you out of your life on Earth and into Aldermere, a city built over a dungeon that never ends.',
  'Hire heroes from every age of history, arm them with legendary gear, and fight your way down.',
];

export const joke = 'Roman sword. Stone Age torch. Ambulance paddles. Any gear works on any hero.';

export const form = {
  email: 'Email',
  placeholder: 'you@example.com',
  fax: 'Fax',
  sending: 'Sending',
  success: "You're on the list.",
  invalid: 'That email did not work. Try another one.',
  rate: 'Too many tries. Wait a few minutes.',
  down: 'Something went wrong. Try again in a minute.',
};

export const featuresIntro = 'What waits for you';

export const featureBlurbs = [
  { title: 'The Descent', text: 'Lead a squad of three into the monster-filled dungeon below the city.' },
  { title: 'Gear', text: 'Arm any hero with weapons and relics from any age of history.' },
  { title: 'The Exchange', text: 'Trade your best finds with heroes across the city.' },
  { title: 'The Ledger', text: 'Carve your name into the Ledger of Names for everyone to see.' },
];

export const about = {
  title: 'What you do',
  steps: [
    'Choose who you were on Earth.',
    'Hire two heroes to fight at your side.',
    'Come back rich, or come back scarred.',
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
    text: 'A paramedic blasted a ghoul with her paddles. It fled screaming.',
  },
  {
    source: 'Stocks',
    text: 'A thief stole fourteen Crowns from the market. He spends tonight in the Stocks.',
  },
  {
    source: 'The Crier',
    text: 'The summoning Circle is glowing. A big batch of heroes arrives Friday.',
  },
  {
    source: 'Docks',
    text: 'A second moon rose over the harbor last night. Nobody knows where it came from.',
  },
];

export const deskCopy = {
  city: {
    title: 'City',
    lines: ['Your spare heroes earn Crowns while you are away.'],
  },
  descent: {
    title: 'Descent',
    lines: ['Choose a door. Read the danger. Strike first.'],
  },
  office: {
    title: 'Hero Office',
    lines: ['You owe four Crowns for your summoning. The Office always collects.'],
  },
  market: {
    title: 'Exchange',
    lines: ['Sell your gear for Crowns. Trading for real money is banned.'],
  },
  crier: {
    title: 'The Crier',
    lines: headlines.map((line) => `${line.source}. ${line.text}`),
  },
  stocks: {
    title: 'Stocks',
    lines: ['Get caught stealing and you spend an hour locked in the Stocks.'],
  },
  infirmary: {
    title: 'Infirmary',
    lines: ['Fall to zero Life and you wake up here, patched up and sore.'],
  },
};

export const heroes = {
  title: 'Heroes you can hire',
  lead: 'Every Friday the Circle pulls new heroes from Earth. Find the ones worth fighting beside.',
  hint: 'Tap a card to see the hero fight.',
};

export const knowhow = {
  legionary: 'Formation. His guard grows stronger with every ally at his side.',
  gangster: 'Shakedown. Scares enemies off or buys them out.',
  paramedic: 'Triage. Heals harder and stops bleeding fast.',
  office_worker: 'Reply All. Marks every enemy so the squad hits harder for two turns.',
  hunter: 'Fire-craft. Lights the dark and roasts meat that heals the squad.',
  engineer: 'Contraptions. Builds traps and gadgets out of scrap.',
  plague_doctor: 'Miasma Theory. Cures Poison and Rot with old remedies.',
  delivery_rider: 'Last Mile. Escaping a fight costs no Energy.',
};

export const bios = {
  legionary: 'A soldier of Rome who has never dropped his shield. He is not about to start now.',
  gangster: 'He walked out of 1927 Chicago with a violin case. There is no violin inside.',
  paramedic: 'The Circle took her in the middle of a rescue. She is still saving lives.',
  office_worker: 'Kevin fell through his office floor holding a coffee. He has not spilled a drop.',
  hunter: 'He hunted mammoths across the ice. Ghouls do not scare him.',
  engineer: 'Give her a pile of scrap and a minute. She will hand you a weapon.',
  plague_doctor: 'He fought the Black Death with herbs and a beak mask. Now he fights the dark.',
  delivery_rider: 'Marco has never missed a delivery. A dungeon is just a longer route.',
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
  line: 'The rarer the item, the wilder its power.',
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
  hint: 'Tap an item to inspect it.',
};

export const sections = [
  {
    id: 'overflow',
    title: 'Overflow Night',
    lines: ['Every Friday, draw three new heroes. Keep one.', 'The rest go to the Hiring Hall for anyone to claim.'],
  },
  {
    id: 'descent',
    title: 'Gear and the Descent',
    lines: ['Any item fits any hero.', 'Fall in the dungeon and you carry a Scar forever.'],
  },
  {
    id: 'trade',
    title: 'The Exchange',
    lines: ['Sell your gear for Crowns.', 'Trading for real money is banned.'],
  },
  {
    id: 'crews',
    title: 'Crews',
    lines: ['Join a Crew. Share a hall, the loot, and the danger.'],
  },
];

export const rules = {
  title: 'House rules',
  lines: ['You and two hired heroes against the dark.', 'Trading for real money is banned.'],
};

export const ledger = {
  title: 'Ledger of Names',
  lines: ['Every great deed and every great failure, written down for all to see.'],
};

export const footer = {
  adults: 'Adults only. 18+.',
  privacy: 'Privacy',
  terms: 'Terms',
};

export const legal = {
  privacyTitle: 'Privacy',
  privacy: ['We keep your email safe. We never sell it.'],
  termsTitle: 'Terms',
  terms: ['The store sells looks, never power.', 'Trading for real money is banned.'],
};

export const itemVoices = {
  second_moon: 'I move the tides. I can move you.',
  group_chat: 'Forty new messages. All of them about you.',
};

export const flip = {
  hint: 'Hover or tap a card to see the hero in action.',
  sheet: 'Full sheet',
  skill: 'Know-How',
  back: 'Turn back',
};

export const fight = {
  title: 'Roll for it',
  lead: 'Every room is a fight. Choose your move, roll two dice, and see if your squad survives.',
  party: 'Your squad',
  foes: 'In the way',
  roll: 'Roll',
  pick: 'Choose your move.',
  need: 'need',
  vs: 'vs',
  win: 'Hit!',
  lose: 'Miss!',
  next: 'Into the next room',
  again: 'Fight again',
  lootTitle: 'The loot drops straight into your gear.',
  lootEmpty: 'Empty',
  cleared: 'Room cleared!',
  scaleNote: 'Small foes, big foes. Size up what you are fighting.',
};

export const rooms = [
  {
    id: 'cellars',
    name: 'The Old Cellars',
    foes: ['slime', 'goblin', 'skeleton'],
    intro: 'Acid ooze crawls up the stairs. A goblin grins behind it, knife out. Bones rattle in the dark.',
    loot: 'rusty_gladius',
    moves: [
      { foe: 'goblin', label: 'Charge the goblin before he runs', stat: 'might', dc: 9, win: 'You slam into the goblin. His knife skitters away and he crashes down.', lose: 'The goblin slips aside and slashes your arm.' },
      { foe: 'slime', label: 'Lock shields and crush the ooze', stat: 'guard', dc: 8, win: 'Your shields smash the ooze flat. It splatters and melts away.', lose: 'The ooze pours over your shields and burns your hands.' },
      { foe: 'skeleton', label: 'Kick its legs out from under it', stat: 'knack', dc: 10, win: 'Its legs snap. The skeleton clatters to the floor in pieces.', lose: 'The skeleton stomps forward and swings its rusty blade at your head.' },
    ],
  },
  {
    id: 'kitchen',
    name: 'The Ash Kitchen',
    foes: ['ghoul', 'skeleton'],
    intro: 'A ghoul with a burning skull stirs a boiling pot. A skeleton guards the back door. Both turn toward you.',
    loot: 'trench_lantern',
    moves: [
      { foe: 'ghoul', label: 'Kick the boiling pot at it', stat: 'guard', dc: 9, win: 'Scalding water hits the ghoul. It shrieks and staggers into the flames.', lose: 'The pot will not budge. The ghoul lunges at you through the steam.' },
      { foe: 'ghoul', label: 'Charge before it turns', stat: 'might', dc: 10, win: 'Your blade bites deep. The ghoul howls and crumbles into ash.', lose: 'The ghoul spins and rakes you with burning claws.' },
      { foe: 'skeleton', label: 'Shove the skeleton into the oven', stat: 'knack', dc: 8, win: 'It topples into the fire. Its bones blacken and fall apart.', lose: 'The skeleton sidesteps and its blade nicks your cheek.' },
    ],
  },
  {
    id: 'door',
    name: "The Butcher's Door",
    foes: ['goblin', 'brute'],
    intro: 'A horned brute blocks the last door, spiked club in hand. A goblin scout screams for blood.',
    loot: 'shield_lost_ninth',
    moves: [
      { foe: 'brute', label: 'Hack at its knees', stat: 'might', dc: 11, win: 'Steel meets bone. The brute crashes down and the whole floor shakes.', lose: 'Its club comes down first. You barely roll clear.' },
      { foe: 'brute', label: 'Raise your shield and take the blow', stat: 'guard', dc: 9, win: 'The club slams your shield and you hold. The brute stumbles and falls.', lose: 'The blow knocks you flat. Your shield arm goes numb.' },
      { foe: 'goblin', label: 'Hurl a torch at the goblin', stat: 'knack', dc: 10, win: 'The torch hits. The goblin shrieks and goes down in flames.', lose: 'The goblin ducks. The brute roars and charges.' },
    ],
  },
];

export const foeNames = {
  slime: 'Acid Ooze',
  goblin: 'Goblin Cutthroat',
  skeleton: 'Bone Sentry',
  ghoul: 'Cinder Ghoul',
  brute: 'Horned Brute',
};
