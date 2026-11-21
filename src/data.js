export const ASSET = '/assets/oversummoned/';

export const ORIGINS = [
  {
    id: 'hunter',
    bio: 'Spear, fire, and a family that stayed alive because of both. Aldermere has neither mammoths nor gratitude.',
    detail: 'You talk flame into things that were not planning on it.',
  },
  {
    id: 'legionary',
    bio: 'Twenty years in a line that did not break. The line is gone. You still stand like it is there.',
    detail: 'Brace, and the hit that follows has to earn it.',
  },
  {
    id: 'engineer',
    bio: 'Bridges, boilers, timetables. You look at a dungeon and see a machine that failed inspection.',
    detail: 'A pin, a pipe, a result you will not fully explain.',
  },
  {
    id: 'gangster',
    bio: 'You collected for men who disliked the word no. The rats have not heard of you. Give it a week.',
    detail: 'Ask the room for crowns. Some rooms pay.',
  },
  {
    id: 'paramedic',
    bio: 'You have walked into worse. You have also left people better than you found them, which is a rare habit here.',
    detail: 'Stop the worst bleed. Somebody stays upright.',
  },
  {
    id: 'office_worker',
    bio: 'You knew the form number, the copy list, and which signature was real. The Hero Office is not ready for you.',
    detail: 'Their rules, applied correctly, and suddenly applied to them.',
  },
];

export const DOORS = [
  {
    id: 'drip',
    enemy: 'cellar_rat',
    kicker: 'Left',
    name: 'Dripping arch',
    text: 'Water, and something chewing on the far side.',
  },
  {
    id: 'bone',
    enemy: 'ghoul',
    kicker: 'Middle',
    name: 'Bone door',
    text: 'Warm to the touch. That is not an improvement.',
  },
  {
    id: 'grate',
    enemy: 'cellar_rat',
    kicker: 'Right',
    name: 'Service grate',
    text: 'Pipes, a maintenance log, and handwriting you do not trust.',
  },
];

export const BOONS = [
  {
    id: 'spit',
    name: 'Bound Spit',
    text: 'A spear that already dislikes you. Bound gear climbs out when you do.',
  },
  {
    id: 'wick',
    name: 'Warm Wick',
    text: 'A stub of candle. Heal a little at the next door. Smells like a closed chapel.',
  },
  {
    id: 'carbon',
    name: "Clerk's Carbon",
    text: 'A copy of a form with your name already on it. The next clerk is slightly less cruel.',
  },
];

export const HEADLINES = [
  'Overflow, week forty: nine hundred more. The king sends fruit.',
  'Hero Office closes early. Mr. Pell cites a single inkwell.',
  'Market: spears up, boots down. A Roman shield listed as vintage.',
  'Crew wanted. Must own a ladder and a worse idea.',
  "Native ledger: 'They keep explaining their old jobs.'",
];

export const MARKET = [
  { name: 'Boiled eel', price: '2 crowns', note: 'It is eel. Probably.' },
  { name: 'Bound lantern', price: '14 crowns', note: 'Survives you. The oil does not.' },
  { name: 'Floor 3 map', price: '6 crowns', note: 'The seller has not been to floor 3.' },
  { name: 'Apology pamphlet', price: '1 crown', note: 'The Natives are not buying it either.' },
];

export const CREWS = [
  {
    name: 'The Late Shift',
    text: 'Paramedics and whoever is still awake. They bring people back. Sometimes the same people, twice.',
  },
  {
    name: 'Lantern & Co.',
    text: 'Engineers. They treat a curse like a building code and file against it.',
  },
  {
    name: "Pell's Problem",
    text: 'Not a crew. A queue with weapons, and one tired man at the desk.',
  },
];

export const JOBS = [
  { name: 'Lantern duty', pay: '3 crowns', note: 'A night, plus whatever the dark keeps.' },
  { name: 'Night soil', pay: '4 crowns', note: 'People move aside. This is the best pay in the city.' },
  { name: 'Hero', pay: '1 crown', note: 'And a speech. The speech is optional. The crown is late.' },
  { name: "Clerk's runner", pay: '2 crowns', note: 'You will meet Mr. Pell. Bring extra paper.' },
];

export const SCARS = [
  {
    name: 'Cooked Nerves',
    perk: 'Fire barely registers.',
    flaw: 'Steam kettles make you flinch. In public. Loudly.',
  },
  {
    name: 'Still Clocked In',
    perk: 'You start each floor with a bandage.',
    flaw: 'You pat a watch you do not own, and sometimes miss the tell.',
  },
  {
    name: 'Rat Tax',
    perk: 'Rats pay out in crowns.',
    flaw: 'Rats know your face, and they talk.',
  },
  {
    name: 'Wrong Century',
    perk: 'Know-How comes back one room sooner.',
    flaw: 'You called the king "bud." The room is still thinking about it.',
  },
];

export const BOUND = [
  { name: 'Legion strap', note: 'The shield is gone. The habit of holding one is not.' },
  { name: 'Stethoscope', note: 'It does not listen to hearts anymore. It listens to doors.' },
  { name: 'Office lanyard', note: 'It should not still open things. It does.' },
];
