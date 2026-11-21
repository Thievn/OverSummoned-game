# OverSummoned game plan (summary for builders)

This summarizes the OverSummoned Game Design Plan, version 3 (Nov 21, 2026). The plan builds on Game Bible v1.1, and where the two disagree, the plan wins. Nothing in the game has been built yet. The first thing to build is the new landing page (Phase 0).

Voice and copy rules are in [voice.md](voice.md). The art kit is in `public/assets/oversummoned/`, and the scripts that build it are in `tools/card-kit/`.

## The short version

- **Premise:** The world is called Ash and the city is Aldermere. The Hero Office rebuilt the city's summoning Circle on the cheap, and now it pulls people from every century of Earth, every week, on **Overflow Night** (Friday, 8 PM Eastern). Tagline: **"Pulled from Earth. Stuck in Ash."**
- **Squads of 3:** you go into the **Descent** (the dungeons under the city) with your own character plus 2 hired heroes. Each dungeon favors different teams, which is the reason to collect heroes.
- **Spare heroes:** heroes who aren't in your squad work City jobs and go on timed Expeditions, so your roster earns money while you're offline.
- **Gear:** cards start out fairly even, and gear makes up about 60% of a hero's power. Gear is shared across your heroes, and any item fits any hero from any century.
- **Rarity:** 7 tiers from Common to Unhinged. Items get sillier as rarity climbs.
- **Trading:** everything worth having can be traded for **Crowns (Ø)**, with fees, cooldowns and anti-bot rules. Trading for real money is banned.
- **Monetization:** money buys looks, never power.
- **Art:** painted portrait cards, animated pixel sprites in fights, and pixel item icons with hover tooltips.

## Core loop

1. **Bars:** spend Energy, Nerve, Morale and Life, which refill on real-time timers.
2. **Descent:** do dungeon runs with a squad of 3.
3. **Loot:** turn drops into gear (equip, craft) or Crowns (sell on the Exchange).
4. **City jobs:** spare heroes earn wages while you're away.
5. **Weekly Overflow:** every Friday brings a batch of 10 to 15 themed heroes. You get 3 face-up offers and keep 1. Lost Property crates and a new weekly boss open the same night.

A 15-minute session goes like this:
- Collect wages.
- Reassign your heroes.
- Check the market.
- Pick a squad for today's dungeon.
- Do one shallow run (about 8 minutes).
- Sort the loot.
- Spend your leftover Nerve.

## Characters

- **Origin:** who you were on Earth.
- **Rarity:** sets how often that Origin turns up in the weekly batch, how odd its Know-How is and how silly it gets. Each Origin has one rarity.
- **Base stats:** every card starts within about 5% of the same total.

There are 8 launch Origins (cards in `public/assets/oversummoned/cards.json`):

| Card | Origin | Era | Rarity | Guard / Might / Knack | Know-How |
|---|---|---|---|---|---|
| Gaius Marcellus | Roman Legionary | Rome, 1st century | Rare | 15 / 12 / 8 | Formation: Guard bonus grows with each companion in the fight |
| Vincenzo Moretti | Prohibition Gangster | 1920s | Epic | 9 / 13 / 15 | Shakedown: intimidate or bribe enemies and merchants |
| Maya Washington | Paramedic | Modern | Uncommon | 10 / 7 / 14 | Triage: stronger healing, stops Bleed, revives companions |
| Kevin Latham | Office Worker | Modern | Common | 8 / 7 / 12 | Reply All: Marks every enemy for two turns |
| Brokk | Stone Age Hunter | Stone Age | Uncommon | 11 / 16 / 6 | Fire-craft: sets enemies alight, lights dark rooms, cooks meat into healing |
| Edith Crane | Victorian Engineer | Industrial | Rare | 9 / 8 / 16 | Contraptions: builds traps and gadgets from scrap |
| Doctor Albrecht | Plague Doctor | Medieval, 1348 | Rare | 10 / 8 / 15 | Miasma Theory: cures Poison and Rot, wrong about why, still works |
| Marco Reyes | Delivery Rider | Modern | Common | 8 / 9 / 11 | Last Mile: Exits cost no Energy and you leave with one extra item |

The full roster has about 42 Origins across 7 eras: Ancient, Medieval, Renaissance, Industrial, 20th century, Modern and Near future. The top rarities include:
- Temple Oracle and Cold War Spy (Legendary)
- HOA President and Space Tourist (Absurd)
- The Spare (summoned twice) (Unhinged)

**Card front:** painted portrait, name, title, rarity gem with letter, and three **Overstats**: Guard (shield), Might (sword) and Knack (star, the average of Wits, Hands and Charm). The Overstats always include gear. A Power seal and Ascension corners (I to V) come later.

**Stats:** Might, Guard, Speed and Hands (fight stats), plus Wits, Charm and Grit (street stats).

**Card back:** clicking or tapping a card flips it to the character sheet. That sheet has a header, the portrait with the pixel sprite on a ground line, a paper-doll with 11 gear slots and a 4-slot belt, the stats panel (base, gear, total), Know-How, bio, and Scars.

## Rarity ladder (cards and items)

| Tier | Color | Letter | Gem shape | Frame metal | Silliness |
|---|---|---|---|---|---|
| Common | #B8B2A7 | C | circle | grey iron | None. A rusty sword is a rusty sword. |
| Uncommon | #3FAE4F | U | diamond | emerald verdigris | A dry detail in the flavor line |
| Rare | #3A86FF | R | hexagon | blue steel and enamel | Odd history, still sensible |
| Epic | #A35BF0 | E | shield | amethyst with candle sconces | The effect starts bending the rules |
| Legendary | #F28C1B | L | pentagon | gold with embers and a crown (the only gold frame) | Grim and grand |
| Absurd | #F04FC8 | A | heart | hot pink, with a traffic cone for one corner and a googly eye | Openly ridiculous, real upside, funny cost |
| Unhinged | #E5262E | X | shard | blood red, cracked, with floating pieces and glitch | Chaos. Strong, unpredictable, a little unwell. |

- Rarity always appears three ways: color, the written word and the gem shape. That way color-blind players never have to rely on color alone.
- Tooltip effects by rarity:
  - Epic: a faint candle flicker.
  - Legendary: a slow ember shimmer across the name.
  - Absurd: the word "Absurd" wobbles.
  - Unhinged: the border glitches, and the item gets one extra line spoken in its own voice.
- Base item drop chances: Common 55%, Uncommon 28%, Rare 12%, Epic 4%, Legendary 0.8%, Absurd 0.18%, Unhinged 0.02%.

## Gear and tooltips

- **Slots:**
  - Main Hand and Off Hand.
  - Head, Chest, Legs and Feet.
  - 2 Rings and 2 Trinkets.
  - 1 Anomaly slot (unlocks at level 20).
  - A 4-slot Belt for consumables.
- **No locks:** there are no era or class locks. A Stone Age Hunter can wear a hi-vis vest.
- **Tooltip lines, in order:**
  1. Name (in its rarity color)
  2. Rarity and Item Level
  3. Slot and type
  4. Primary stats (white)
  5. Secondary stats (green)
  6. Effect (green: Equip, Use, Chance on hit or Unique)
  7. Flavor line (gold italics)
  8. Era of origin (grey)
  9. Trade tag
  10. Durability or charges
- **Tooltip behavior:**
  - Desktop: the tooltip appears 150 ms after hovering, flips to stay on screen, and pins on click.
  - Phone: tapping opens a bottom sheet.
  - Keyboard: Tab shows the tooltip and Escape closes it.
- **Item data:** all 14 kit items have full tooltip data in `public/assets/oversummoned/items.json`.

## The City (later phases)

- **Bars:**
  - Energy: max 100, refills 5 every 10 minutes.
  - Nerve: spent on Hustles.
  - Morale: set by your Lodging.
  - Life: when it hits zero, you go to the Infirmary.
- **Places:** the Pit (training), Hustles, Lessons, Forge Row (salvage, temper, reforge, Era Fusion), Lodging, Mags's Back Room (free daily tokens, cosmetic prizes only), the Exchange and Handshake trades, and the Hiring Hall.
- **Public pages:** The Crier (the daily paper) and the public Stocks and Infirmary lists, which show funny reasons.
- **NPCs:**
  - Mr. Pell, the Hero Office clerk.
  - Dez Calloway, a mentor who was a 1974 trucker.
  - Sister Odile Marrow, who runs the Infirmary.
  - Big Mags Gristle, who runs the tavern.
  - Nib, a goblin fence.
  - Hollis Hawk, editor of the Crier.
- **Factions:** the Hero Office, the Black Ledger, the Fresh Eyes Guild, the Closed Gate and the Smugglers' Rest.

## The Descent

- **Floors:** 8 to 12, each a node map with 2 or 3 paths: Fight, Elite, Cache, Shrine, Merchant, Rest, Event, Stranger, Exit.
- **Fights:** turn-based, with animated pixel sprites, and the enemy's next move shown as an intent. Actions: Strike, Technique, Guard, Know-How, Item, Talk, Flee.
- **Progress:** pick 1 of 3 Boons after each floor. An Exit comes every 3 floors, where you either leave with the loot or go deeper.
- **Death:** you lose unbanked loot and gain a **Scar**, a small permanent perk with a quirk, named after how you died.
- **Dungeons and bosses:**
  - The Old Cellars: The Angry Boiler (tutorial)
  - The Bone Orchard: The Head Gardener
  - The Sunken Mint: The Auditor
  - The Lower Mall: The Manager
  - The Archive Stacks: The Backlog
  - The Stalled Line: The Delay
  - The Glasswork Deep: The One Who Kept Going
  - The Outrage Pit: The Trending

## Monetization

- **Patron of the Office:** $5 a month.
- **Cosmetics:** alternate portraits, Glamours, foil frames.
- **Almanac Pass:** cosmetic paid track only.
- **The rule:** if a free player would lose a fight, a race or a trade because someone else paid for something, that thing doesn't go in the store.

## Site plan: landing page (Phase 0)

The layout follows the mockups in this folder. Mockup 1 is the **interface reference**: a dark game-site layout with a sign-up panel on the left, a game screen in the middle and features on the right. Mockup 2 is the painted card row. Mockup 3 shows the pixel accents.

| Section | What it shows | Sample copy |
|---|---|---|
| Header | Logo SVG, About, Features, Rules, Leaderboards, Join button | "Join the waitlist" |
| Left panel | Short pitch, email field, button | "OverSummoned is a browser game set in Aldermere, a city that keeps summoning people from Earth by accident. Pick who you were, hire a squad from every century, and survive the dungeon under the city." |
| Center | A peek at the game's Home screen: live-looking bars, character sheet, rotating Crier headlines and Infirmary lines | |
| Right panel | Four features with short blurbs | "Go down with a squad of three. Gear up from any century. Trade with the whole city. Climb the Ledger of Names." |
| Card row | Painted cards; click or tap flips to the character sheet with filled gear slots | "Every Friday the Circle brings in a new batch. Some of them are worth hiring." |
| Loot strip | One pixel icon per rarity; hover or tap shows the real tooltip | "A Roman can carry a defibrillator. Nobody here will stop him." |
| Fight preview | A squad of three pixel sprites in a Descent fight, feet on the floor | "Pick a door. Read what the ghoul is about to do. Hit it first." |
| How it works | Three short steps | "Pick your era. Hire your squad. Come back richer, or come back with a Scar." |
| Footer | 18+, privacy, terms, waitlist again | "We send one email when the doors open." |

**Fonts:**
- The logo is always the SVG, never typed out in a font.
- Cinzel Decorative for big headings.
- Cinzel for section headings, names and buttons.
- EB Garamond for body text.
- Inter with tabular numerals for numbers.

**Phone layout:** the sidebar becomes a bottom tab bar, and tooltips open as bottom sheets.

**Waitlist:** reuse the existing Vercel project and the Resend contact segment (`api/waitlist.js`). Nothing gets sent without Dean's yes.

## Build roadmap

| Phase | What ships |
|---|---|
| 0. Landing page | Mockup layout, logo, painted cards that flip to a character sheet, loot strip with working tooltips, real waitlist |
| 1. First Descent | Accounts, character pick, Old Cellars, sprite fights, squad of 3, gear and drops, Boons, Scars |
| 2. City and roster | Bars, Pit, Hustles, Stocks, Lodging, Barracks, jobs, Expeditions, Forge Row |
| 3. Collecting and trading | Weekly Overflow, Intake, Hiring Hall, Exchange, price history, Binder, Ascension |
| 4. Social | Crews, the Crier daily edition, Ledger of Names, Armory |
| 5. Live game | More dungeons, Origins and items, events, cosmetics |

**Technical rules:**
- The server decides every roll, drop and stat. Grok only writes the words around them, following the prompt kit (see voice.md).
- Code filters every line Grok writes before it's shown.

## Open questions for Dean

- Premise A (the Cheap Circle), plus the rule that picks each week's arrivals from the same calendar week across history?
- Are the 8 launch Origins right?
- Should gear show on the sprites from day one?
- Friday 8 PM Eastern for Overflow Night?
- A starting Barracks of 5 heroes?
- How adult should the tone be?
