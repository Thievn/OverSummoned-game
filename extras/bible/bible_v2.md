# OverSummoned Bible (Poppy plan)

Version 2, November 21, 2026. Written for Dean (Thievn's Den) by Poppy. Readers: Dean, Claude, Grok and anyone else on the project. Planning only. Nothing in this document has been built yet. The live, interactive version of this plan (with hoverable item tooltips) is the Page "OverSummoned: Game Design Plan".

## How this relates to Claude's v1.1 bible

Claude's "Oversummoned: Game Bible" v1.1 stays the base and has not been edited. This document builds on it and replaces some parts. Where the two disagree, this document wins. The game's name is always spelled OverSummoned.

| Area | Status | What changed |
|---|---|---|
| Pitch, Aldermere, Summoned vs Natives, Overflow | Kept | Adds the Cheap Circle premise and names the world Ash. |
| Writing voice, content boundaries, Grok pipeline, voice samples | Kept in full | Still the source of truth for every word the game shows. |
| Descent battle, Boons, Exits, Scars, Callings | Kept | Adds Energy costs, Infirmary and Stocks tie-ins, 8 scenarios. |
| Art direction (pixel portraits) | Superseded | Painted portrait card fronts, animated pixel sprites in fights, pixel item icons. |
| Gear slots and rarity (Scrap to Anomaly) | Superseded | 11 slots plus a 4-slot belt, and the 7-tier ladder from Common to Unhinged. |
| Bars (Energy, Nerve, Health, Spirit) | Renamed | Energy, Nerve, Morale and Life, to match the mockup. |
| Stats (Brawn, Guard, Speed, Hands, Wits, Charm, Grit) | Renamed | Brawn becomes Might. Card fronts show three Overstats. |
| Collecting | New | Recruit cards, weekly face-up Intake, the Binder. |
| Monetization | Kept and tightened | Same never-sold rule, now covering gear, rerolls, repairs and materials. |
| Landing page section | Superseded | New site plan based on Dean's two favorite mockups. |
| Open questions | Superseded | New list at the end of this document. |

## The short version

- Premise: the world is called Ash, the city is Aldermere. Its summoning Circle was rebuilt on the cheap and now pulls people from every Earth century, every week, on Overflow Night.
- You pick a starting character with modest base stats. Every card starts fairly even. Gear is where most of your power comes from.
- Each card has a painted portrait on the front. Tap it and it opens a full character sheet with a bio, base stats, and a paper-doll of 11 gear slots plus a 4-slot consumable belt.
- Any item fits any character, whatever century it came from. Items have clean hover-to-read tooltips, and rarity runs Common, Uncommon, Rare, Epic, Legendary, Absurd and Unhinged, getting sillier as it climbs.
- Fights use fully animated pixel sprites. Items use pixel icons in a classic loot style. Card fronts stay painted, as in the mockups.
- Gear power is earned through play and crafting only. Money buys looks, never stats, never random results.

| Number | What |
|---|---|
| 8 | Origins at launch, 42 planned across 7 eras |
| 7 | Rarity tiers, Common to Unhinged |
| 11 + 4 | Gear slots plus consumable belt slots |
| 0 dollars | Gear power or random items sold |

## House rule: never name the inspiration

RULE. The daily city loop is modeled on Torn City, which has run since 2004, and the item tooltips borrow the look of classic online RPG loot. Those names appear only in internal docs like this one. They never appear on the site, in the game, in marketing, in shipped code comments, or in anything Grok writes. Every borrowed mechanic gets its own OverSummoned name and its own twist.

| Inspiration mechanic | OverSummoned name | What changes |
|---|---|---|
| Energy, Nerve, Happy, Life bars | Energy, Nerve, Morale, Life | Energy also pays for dungeon runs, so the bars feed the roguelite. |
| Gym | The Pit | Training shows a short written result and a visible gain. |
| Crimes | Hustles | Era-clash themes, and your Origin unlocks one hustle nobody else has. |
| Education | Lessons (Rune Quarter) and Know-How swaps | You can also teach your era's skills to other players for money. |
| Properties | Lodging | From a cot in the Fresh Ward to a manor in Old Darrow. Sets Morale, holds your trophy room. |
| Mentor missions | Dez's Errands | A mentor with a real story, who is also a Recruit you can earn. |
| Newspaper | The Crier | Written daily from real game events, player names only on opt-in. |
| Jail and Hospital lists | The Stocks and the Infirmary | Same public lists with funny reasons, plus filters and a help button. |
| Casino | Mags's Back Room | Free daily tokens only, cosmetic prizes only, no real money in or out. |
| Hall of Fame | The Ledger of Names | Weekly and seasonal boards, so new players can place. |
| Factions | Crews | Cheaper to start, with crew dungeon runs and turf. |
| Keepsakes | Memorials | Limited cards honoring standout players, only with their consent. |
| Calendar | The Almanac | Seasonal events tied to the world's own holidays. |
| Donator packs | Patron of the Office | Cosmetic and convenience only. No faster bars, no bigger bars. |

## Era and premise

Two clocks matter. Aldermere has its own calendar, and Earth's timeline is where the Summoned come from.

| Option | Aldermere's time | Earth's time | Why it went wrong | Why it keeps happening weekly |
|---|---|---|---|---|
| A. The Cheap Circle (recommended) | Year 412 of the Crowned Reckoning. Late medieval with runecraft. Gunpowder is rare and frowned on. | Any moment in human history, from the Stone Age to a few years past today. | The Hero Office cut the Circle's budget, sold the old limiter stone and hired the lowest bidder to rebuild it. The clause that said summon one hero now says summon heroes. | The Circle also powers the city's lamps and pumps. Shut it off and Aldermere goes dark, so the council keeps it running and calls the arrivals an acceptable cost. |
| B. Same Week, Every Year | As in A. | Each Overflow pulls people from the same calendar week across many years, including this week in the present. | As in A. | The Circle locks onto Earth's calendar, so each weekly event can riff on what is happening now. |
| C. It Was Always Earth | Ash is Earth, thousands of years after a collapse. | Everyone is pulled from the past of the world they now stand on. | Nobody built the Circle. They found it and guessed at the controls. | It runs on a timer set by people who are long dead. |

Recommendation: use A as the public premise and borrow B's rule for picking each week's arrivals, which gives a built-in reason for current-events satire. Keep C as a secret long-term mystery for endgame players, and never confirm it early.

Items come through with people. Whatever someone had on them when the Circle took them lands in Aldermere too, which is why a Roman shield and a self-checkout machine can end up in the same dungeon. It also explains the mockup tagline, "Pulled from Earth. Stuck in Ash." Ash is the name of the world.

Sample line, Mr. Pell: "Era?" You told him. He found the column, ran a finger down it, and sighed at a number that was clearly bigger than last week's. "Cause of arrival?" "I was at the dentist." He wrote that down very carefully, then slid a form across. "Sign here. You owe the Office four Crowns for the summoning."

## Character roster

The Origin is who you were on Earth. A card's rarity sets how often that Recruit turns up in the weekly Intake, how odd its Know-How is, and how silly it gets. Base stats stay close: every card starts within about 5 percent of the same total. The real gap between players comes from gear.

### Origins by era

| Origin | Era | Rarity | Know-How | Launch |
|---|---|---|---|---|
| Stone Age Hunter | Ancient | Uncommon | Fire-craft: sets enemies alight, lights dark rooms, cooks meat into healing. | Yes |
| Roman Legionary | Ancient | Rare | Formation: Guard bonus that grows with each companion in the fight. | Yes |
| Pyramid Laborer | Ancient | Common | Heavy Lifting: moves blocked doors and carries one extra loot slot. |  |
| Gladiator | Ancient | Rare | Play to the Crowd: each hit landed builds Focus faster while others are watching. |  |
| Temple Oracle | Ancient | Legendary | Bad Feeling: sees one floor ahead on the node map, once per run. |  |
| Bronze Age Sailor | Ancient | Common | Sea Legs: immune to knockdown, better odds on flooded floors. |  |
| Plague Doctor | Medieval | Rare | Miasma Theory: cures Poison and Rot, wrong about why, still works. | Yes |
| Viking Raider | Medieval | Rare | Shield Wall Breaker: first strike each fight ignores Guard. |  |
| Monastery Scribe | Medieval | Common | Illuminated Notes: reads enemy weaknesses after one look instead of one hit. |  |
| Court Jester | Medieval | Uncommon | Licensed Fool: Talk actions never anger an enemy, even when they fail. |  |
| Samurai Retainer | Medieval | Epic | Iaido: a guaranteed crit on the first turn if you did not act last turn. |  |
| Peasant Farmer | Medieval | Common | Hard Winter: heals from food at double value, Morale drops slower. |  |
| Pirate Quartermaster | Renaissance | Rare | Fair Shares: crew loot split earns everyone a bonus cut. |  |
| Workshop Painter | Renaissance | Uncommon | Perspective: spots hidden doors and fake walls. |  |
| Witchfinder | Renaissance | Epic | Accusation: Marks one enemy, and cultists take double damage from it. |  |
| Back-Alley Alchemist | Renaissance | Rare | Volatile Mix: crafts one random potion per floor from junk. |  |
| Musketeer | Renaissance | Uncommon | One Good Shot: a slow, loud, enormous ranged hit with a long reload. |  |
| Victorian Engineer | Industrial | Rare | Contraptions: builds traps and gadgets from scrap. | Yes |
| Chimney Sweep | Industrial | Common | Small Spaces: takes vent shortcuts that skip a node. |  |
| Frontier Gunslinger | Industrial | Rare | Quick Draw: always acts first on turn one. |  |
| Tonic Salesman | Industrial | Uncommon | Miracle Cure: sells junk to merchants at full price, once per merchant. |  |
| Lighthouse Keeper | Industrial | Common | Long Watch: dark floors have no accuracy penalty. |  |
| Private Inquiry Agent | Industrial | Epic | Deduction: reveals what is in a cache and whether it is trapped. |  |
| Prohibition Gangster | 20th century | Epic | Shakedown: intimidate or bribe enemies and merchants. | Yes |
| Trench Runner | 20th century | Uncommon | Keep Your Head Down: Guard doubles against ranged attacks. |  |
| Fighter Pilot | 20th century | Rare | Bail Out: Flee always works once per run, at the cost of half your Life. |  |
| Cold War Spy | 20th century | Legendary | Dead Drop: banks one item mid-run without reaching an Exit. |  |
| Disco Roller Skater | 20th century | Uncommon | Groove: dodges the first hit of every fight. |  |
| Door-to-Door Salesman | 20th century | Common | Foot in the Door: strangers in the Descent never leave without a deal. |  |
| Paramedic | Modern | Uncommon | Triage: stronger healing, stops Bleed, revives companions. | Yes |
| Office Worker | Modern | Common | Reply All: Marks every enemy in the fight for two turns. | Yes |
| Delivery Rider | Modern | Common | Last Mile: Exits cost no Energy and you leave with one extra item. | Yes |
| Night Shift Nurse | Modern | Uncommon | Twelve Hours: no penalty when Life is low. |  |
| IT Help Desk | Modern | Uncommon | Turn It Off and On: resets one construct enemy to full stun. |  |
| Conspiracy Podcaster | Modern | Rare | Do Your Research: guesses an enemy intent two turns ahead, right about half the time. |  |
| HOA President | Modern | Absurd | Violation Notice: fines an enemy, which skips its next turn to argue. |  |
| Gig Courier, 2031 | Near future | Common | Five Stars: Morale boost every time a job finishes on time. |  |
| Doomsday Prepper | Near future | Rare | Go Bag: starts every run with three random consumables. |  |
| Space Tourist | Near future | Absurd | Paid for the View: immune to fear and Rattled, terrible at everything else. |  |
| Mars Colony Volunteer | Near future | Absurd | Low Gravity Habits: huge leap attacks, falls over a lot. |  |
| Exosuit Trooper | Near future | Legendary | Power Armor: massive Guard that drains Focus every turn. |  |
| The Spare (summoned twice) | Near future | Unhinged | Two of Me: a copy of you joins every fight and takes half the blame. |  |

### Sample card spec

| Field | Value |
|---|---|
| Name and title | Kevin Latham, Office Drone |
| Origin and era | Office Worker, Modern (summoned from a Tuesday budget meeting) |
| Rarity | Common |
| Card front | Painted portrait, name, title, rarity gem, and three Overstats: Guard (shield), Might (sword), Knack (star), plus a Power seal. These show totals with gear included. |
| Base stats | Might 7, Guard 8, Speed 9, Hands 10, Wits 14, Charm 11, Grit 9 |
| Know-How (active) | Reply All: Marks every enemy for two turns. Cooldown 4. |
| Passive | Expense Report: 10 percent more Crowns from caches. |
| Ascension | Tiers I to V. Tier III unlocks a second Know-How. Each tier adds a gold corner to the frame. |
| Bio line | Kevin had 412 unread emails when the floor opened under him. He still wonders what was in the last one. |
| Portrait notes | Chest-up, loosened tie, lanyard, rolled sleeves, tired eyes. Office lighting behind him gone cold and green. |

### Natives and city NPCs

| NPC | Role | Voice |
|---|---|---|
| Mr. Pell | Hero Office clerk, registers every arrival | Tired, exact, quietly cruel with paperwork. |
| Dez Calloway | Mentor. A long-haul trucker summoned in 1974, here for 22 years | Warm, blunt, full of bad advice that works. |
| Sister Odile Marrow | Runs the Infirmary | Kind hands, terrible bedside manner, bills by the stitch. |
| Warden Hasp | Keeps the Stocks | Bored. Takes bribes in snacks. |
| Big Mags Gristle | Owns the tavern and the Back Room | Loud, fond of you until you owe her. |
| Nib | Goblin pickpocket and fence | Fast talker, steals mid-sentence. |
| Madame Vesper | Pawnbroker and fortune teller | Never wrong about prices. |
| Hollis Hawk | Editor of The Crier | Treats every rat sighting like a war. |
| Old Tamsin Rook | Forge Row smith, does reforging and tempering | Hates modern items. Fixes them anyway, slowly, for more money. |

Factions: the Hero Office (law and taxes), the Black Ledger (organized crime, from the mockup), the Fresh Eyes Guild (Natives who love new ideas), the Closed Gate (Natives who want you gone) and the Smugglers' Rest (anyone with a boat).

### Enemy families by dungeon

| Dungeon | Enemy family | Boss |
|---|---|---|
| The Old Cellars | Rats, mold, pipe leeches, a very lost goat | The Angry Boiler |
| The Bone Orchard | Undead, rot, trees that grab | The Head Gardener |
| The Sunken Mint | Coin constructs, drowned thieves | The Auditor |
| The Lower Mall | Mannequins, fluorescent ghouls, a food court that fights back | The Manager |
| The Archive Stacks | Form golems, ink slimes, a librarian who shushes violently | The Backlog |
| The Stalled Line | Commuters from every decade, still trying to get to work | The Delay |
| The Glasswork Deep | Reflections of your own past deaths | The One Who Kept Going |
| The Outrage Pit | Hot Takes that change intent based on your last move | The Trending |

## Rarity ladder

One ladder for cards and gear. Item names in tooltips and card gems use these colors. Rarity is also written out as a word and shown by gem shape, so color-blind players never rely on color alone. Card gem letters: C, U, R, E, L, A and X (X for Unhinged). The mockup's gem letters were filler from the image tool.

| Tier | Color | Card frame | Tooltip treatment | Silliness |
|---|---|---|---|---|
| Common | #B8B2A7 bone white | Dark iron, bone-white round gem | Plain border, name in bone white | None. A rusty sword is a rusty sword. |
| Uncommon | #3FAE4F green | Bronze with engraved corners, green gem | Green border and name | A dry detail in the flavor line. |
| Rare | #3A86FF blue | Silvered steel with blue enamel, blue gem | Blue border and name | Odd history, still sensible. |
| Epic | #A35BF0 purple | Heavy gold with candle sconces, as in the mockup, purple gem | Purple border, faint candle flicker on open | The effect starts bending the rules. |
| Legendary | #F28C1B orange | Gold with ember filigree and the crown crest, orange gem | Orange border, slow ember shimmer across the name | Grim and grand. The jokes get darker, not dafter. |
| Absurd | #F04FC8 pink | Gold frame with one corner replaced by something wrong, like a traffic cone, pink gem | Pink border, the word Absurd wobbles | Openly ridiculous items with real upside and a funny cost. |
| Unhinged | #E5262E red, glitching | Cracked frame with floating pieces, red-black gem that flickers through every other color | Red border that glitches, plus one extra line the item says itself | Chaos. Strong, unpredictable, a little unwell. |

## Character sheet

Tapping or clicking a card flips it over and opens the full character sheet. On a phone it opens as a full-screen page. On desktop it opens as a large panel over the page.

### Layout zones

| Zone | What it holds |
|---|---|
| 1. Header | Name, title, rarity gem, level, Calling, Power score |
| 2. Portrait and sprite | Painted portrait on top, the animated pixel sprite standing on a ground line below it, holding its main hand weapon |
| 3. Paper-doll | Left column: Head, Chest, Legs, Feet, Ring 1, Ring 2. Right column: Main Hand, Off Hand, Trinket 1, Trinket 2, Anomaly. Underneath: Belt 1 to 4. Empty slots show a faint outline icon, filled slots glow in the item's rarity color. |
| 4. Stats panel | Base, gear and total for each stat, with the gear part shown in green |
| 5. Know-How | Active and passive, with cooldowns and Ascension unlocks |
| 6. Bio and backstory | Where and when they were taken, a 3 to 5 sentence backstory, and how they feel about Aldermere |
| 7. Scars | Every Scar with its perk, quirk and the line that earned it |

### Stats panel example: Kevin Latham, geared

| Stat | Base | Gear | Scars and Boons | Total |
|---|---|---|---|---|
| Might | 7 | +20 | +0 | 27 |
| Guard | 8 | +23 | +2 | 33 |
| Speed | 9 | +4 | +0 | 13 |
| Hands | 10 | +8 | +0 | 18 |
| Wits | 14 | +23 | +1 | 38 |
| Charm | 11 | +3 | +0 | 14 |
| Grit | 9 | +19 | +3 | 31 |

Card front Overstats for this Kevin: Guard 33, Might 27, Knack 23 (the average of Wits, Hands and Charm), Power 174. The bare card read Guard 8, Might 7, Knack 12.

### Where power comes from

| Source | Share of a geared character's power | How you get it |
|---|---|---|
| Gear | About 60 percent | Drops, crafting, trading for Crowns |
| Base stats and training | About 30 percent | The card's base plus Pit training and Lessons |
| Know-How, Scars, Boons | About 10 percent | Playing, dying, and choices in a run |

## Gear and items

### Tooltip spec

| Line | Shows | Example |
|---|---|---|
| 1. Name | In its rarity color | Shield of the Lost Ninth |
| 2. Rarity and item level | Item level 1 to 300 | Legendary, Item Level 110 |
| 3. Slot and type | Slot on the left, type on the right | Off Hand, Shield |
| 4. Primary stats | White, one per line | +18 Guard |
| 5. Secondary stats | Green, one per line | +12% Block |
| 6. Effect | Green, starts with Equip, Use, Chance on hit or Unique | Unique: takes your first death each run |
| 7. Flavor line | Gold italics, 12 to 30 words, written to the voice rules | One of them dropped this. |
| 8. Era of origin | Small grey text | Rome, 2nd century |
| 9. Bound tag | Tradeable, Claimed on pickup, or Bound (in a bind slot, survives death) | Claimed on pickup |
| 10. Durability or charges | Small grey text, turns red under 20 percent | Durability 120 / 120 |
| Compare | Shift on desktop, or the Compare button on mobile, shows the equipped item beside it with green and red differences | +6 Guard, -2 Speed |

### Hover and tap behavior

- Desktop: the tooltip appears after 150 ms beside the cursor and flips to stay on screen. Moving off hides it. Clicking pins it until you click elsewhere.
- Phone and tablet: one tap opens the tooltip as a sheet pinned to the bottom of the screen, with Equip, Compare and Salvage buttons. Tapping outside closes it. Long press goes straight to Compare.
- Keyboard: tabbing onto an item shows its tooltip, and Escape closes it.
- Everywhere: the same tooltip appears in bags, on the paper-doll, in loot drops, on the Market and on other players' public Armory.

### Slots

| Slot | Count | Notes |
|---|---|---|
| Main Hand | 1 | Any weapon: blades, axes, spears, bows, firearms, staves, gadgets, and stranger things |
| Off Hand | 1 | Shields, lanterns, books, decoys, a second light weapon |
| Head, Chest, Legs, Feet | 1 each | Armor. Light, medium or heavy changes Speed and Guard. |
| Rings | 2 | Small stat items |
| Trinkets | 2 | Items with Use or proc effects |
| Anomaly | 1 | Unlocks at level 20. See the rules below. |
| Belt | 4 | Consumables used in a fight with the Item action |

Any item, any character. There are no era or class locks. A Stone Age Hunter can wear a hi-vis vest and swing a rapier. Origins only add a small bonus: an item from your own era gives 5 percent more of its stats, because you know how it works.

### Stats and budget per rarity

| Group | Stats |
|---|---|
| Primary | Might, Guard, Speed, Hands, Wits, Charm, Grit |
| Secondary | Crit Chance, Crit Damage, Dodge, Block, Armor, Life, Focus Regen, Accuracy, Loot Find, Crown Find |
| Damage and resist | Slash, Blunt, Pierce, Fire, Shock and Rot, each as bonus damage or resistance |

| Rarity | Budget at the same item level | Primaries | Secondaries | Effect | Base drop chance |
|---|---|---|---|---|---|
| Common | 100 | 1 | 0 | None | 55% |
| Uncommon | 115 | 2 | 1 | None | 28% |
| Rare | 130 | 2 | 2 | Minor | 12% |
| Epic | 150 | 2 to 3 | 2 | One proc or Use | 4% |
| Legendary | 170 | 3 | 3 | Unique, one equipped per name | 0.8% |
| Absurd | 185, with a built-in drawback | 1 to 2 | 1 to 2 | Silly effect with real upside | 0.18% |
| Unhinged | 200, with a drawback and randomness | 1 to 3 | 1 to 2 | Chaotic, one Unhinged item equipped at a time | 0.02% |

Deeper floors and bosses push the odds up the ladder. Item level follows dungeon depth, and your Hero License grade caps what item level you can equip, so a new player is never facing a fully geared veteran on the weekly boards.

### Sample items

| Item | Rarity, item level | Slot, type | Era | Stats | Effect | Flavor | Tag, readout |
|---|---|---|---|---|---|---|---|
| Rusty Gladius | Common, 5 | Main Hand, Short Blade | Rome, 1st century | +3 Might | None | Issued to a man named Quintus, who signed for it and then, by the look of the edge, used it to open crates. | Tradeable, Durability 40/40 |
| Hobnailed Caligae | Uncommon, 18 | Feet, Light Armor | Rome, 1st century | +4 Speed, +3 Grit, +2% Dodge | None | Army sandals. The last owner wore them with wool socks, which the legion allowed and his centurion did not. | Tradeable, Durability 55/55 |
| Hi-Vis Vest | Uncommon, 20 | Chest, Light Armor | Modern, 2019 | +5 Guard, +3 Charm, +5% Loot Find | None | Nobody stops a person in a vest. The ghoul let you walk straight past and said sorry. | Tradeable, Durability 60/60 |
| Beak Mask of Doctor Albrecht | Rare, 45 | Head, Leather | Medieval, 1348 | +6 Grit, +6 Wits, +15% Rot Resist, +3% Crit Chance | Equip: Healing items restore 20% more Life. | The beak is packed with dried lavender and cloves. It did nothing for the plague. It does a lot for the cellar. | Tradeable, Durability 70/70 |
| Trench Lantern | Rare, 42 | Off Hand, Lantern | 20th century, 1916 | +7 Wits, +5 Grit, +4% Crit Chance | Equip: No accuracy penalty on dark floors. Your first Strike in the dark Marks the target. | Still smells of paraffin and wet wool. There is a thumbprint on the glass that nobody has wiped off. | Tradeable, Durability 65/65 |
| Duelling Rapier, Far Too Fancy | Rare, 48 | Main Hand, Long Blade | Renaissance, 1590s | +8 Hands, +5 Speed, +6% Crit Damage, +3% Dodge | Chance on hit: 10% to Riposte the next attack against you. | The hilt has more gold on it than the blade has steel. Its owner died in a duel about whose hilt was nicer. | Tradeable, Durability 60/60 |
| The Violin Case | Epic, 70 | Main Hand, Firearm | Prohibition, 1927 | +12 Might, +8 Hands, +6% Crit Chance, +10% Pierce Damage | Chance on Strike: 15% to fire a burst that hits every enemy. | There has never been a violin in it. The case has three bullet holes and a receipt for a violin. | Tradeable, Ammo 30/30 |
| Defibrillator Paddles | Epic, 72 | Trinket, Medical Device | Modern, 2008 | +10 Wits, +8 Grit, +5% Focus Regen | Use: Revive a fallen companion at 40% Life, or Shock one enemy and Stun it for 1 turn. | CLEAR is printed on the handles in big letters. The ghouls have learned the word and back off when they hear it. | Tradeable, Charges 3/3 |
| Shield of the Lost Ninth | Legendary, 110 | Off Hand, Shield | Rome, 2nd century | +18 Guard, +12 Grit, +8 Might, +12% Block, +200 Armor, +5% Life | Unique: The first time you would die each run, the shield takes the blow instead and breaks until you return to the city. | Five thousand men marched into the fog and never wrote home. One of them, it turns out, dropped this. | Claimed on pickup, Durability 120/120 |
| The Black Ledger's Ledger | Legendary, 115 | Trinket, Book | Aldermere, Native | +14 Wits, +14 Charm, +10% Crown Find, +4% Crit Chance | Unique: Each enemy you defeat adds a line. At 100 lines, your next Shakedown or Talk always works. | Names in one column, debts in the other. Your name is near the bottom, in fresh ink. | Claimed on pickup, Lines 0/100 |
| Self-Checkout Machine | Absurd, 130 | Anomaly, Appliance | Modern, 2014 | +20 Hands, +15 Wits, +15% Loot Find | Use: Scan one enemy and add an item from its loot table to your pack. 25% chance it asks for staff assistance instead, and you lose a turn waiting. | It has followed three adventurers to their graves. It is still waiting for an attendant. | Claimed on pickup, 2 charges per fight |
| Pocket Trebuchet | Absurd, 135 | Main Hand, Siege Engine | Medieval, 1304 | +25 Might, +30% Blunt Damage, -10 Speed | Equip: Strikes hit very hard. Every third Strike launches you instead of the rock. | The engineer who shrank it is still missing. So is his left boot. | Claimed on pickup, Durability 90/90 |
| Inflatable Tube Man | Absurd, 132 | Off Hand, Decoy | Modern, 1996 | +22 Charm, +15 Guard, +8% Dodge | Use: Every enemy attacks the tube man for 2 turns. Nobody, including the tube man, knows what powers it. | Taken from outside a used chariot lot. It has not stopped waving since it came through the Circle. | Claimed on pickup, Air 100% |
| A Second Moon (Small) | Unhinged, 160 | Anomaly, Celestial Body | Unknown | +30 to a random stat, rerolled each fight, +10% Crit Chance, -15% Accuracy at night | Equip: Each turn, gravity flips for one random fighter. It can be you. | The Crier ran it on page one. The Hero Office says it is a lamp. The lamp has a tide. | Claimed on pickup, repairs itself, sometimes |
| The Group Chat | Unhinged, 165 | Anomaly, Device | Near future, 2034 | +35 Wits, +35 Charm, -20 Grit, +12% Focus Regen | Equip: At the start of each fight, up to 4 people from other centuries join the chat. Each one gives you a random buff, a random curse, or leaves. You cannot mute it. | Eleven people from nine centuries, all typing. Someone reacted to your death with a thumbs up. | Claimed on pickup, Battery 3% forever |

### Cross-era set bonuses

| Combo | Pieces | Bonus |
|---|---|---|
| Socks and Sandals | Hobnailed Caligae plus any modern Legs item | 2 pieces: +6 Grit. Enemies are Rattled on turn one from second-hand embarrassment. |
| Shield and Spreadsheet | Any Roman Off Hand plus any office Trinket | 2 pieces: Reply All also gives you 1 Guard stack per enemy Marked. |
| Bootleg Medicine | Any Prohibition item plus any Plague Doctor item | 2 pieces: healing also cures Rattled. 3 pieces: potions heal double. |
| The Commute | Any wheeled item, any courier bag, any footwear from a different century | 3 pieces: Speed doubles on turn one, and Exits cost no Energy. |
| Time Tourist | Items from 4 or more different eras | +2% to all stats per different era worn, up to 7 eras. All 7 grants the title Everywhen. |
| Era sets | Matching pieces from one era, like the Legion Kit | Classic 2, 4 and 6 piece bonuses for players who like a clean look |

### Anomaly slot rules

- Any item fits: a second weapon, a third ring, another hat. It gives 50 percent of its stats but its full effect.
- Anomaly-only items: some Absurd and Unhinged items, like the Self-Checkout Machine, only fit here, at full strength.
- One at a time: only one Anomaly item works at once, and only one Unhinged item can be equipped anywhere.
- Unlock: level 20, after Mr. Pell hands you Form 9, which says you accept responsibility for whatever happens.
- Swapping: locked during a run. You can only change it in the city.

### Consumables

| Consumable | Era | Effect |
|---|---|---|
| Hardtack | Age of Sail | Heal a little. Takes a full turn to chew. |
| Instant Coffee, Dry | Modern | +Speed for 3 turns, then -Speed for 2 |
| Mead, Strong | Medieval | +Might and +Grit, -Accuracy |
| Smelling Salts | Victorian | Removes Stun and Rattled |
| Antibiotics | 20th century | Cures Rot and Poison. Natives think it is witchcraft and will pay well for it. |
| Lamp Oil, Lit | Industrial | Thrown: Fire damage to all enemies |
| Can of Something Blue | Near future | +Focus Regen for the fight, -5 Life afterward. The label lists no ingredients. |

Belt slots refill only from what you carry. Consumables stack to 10 and are lost on death unless bound.

### Where gear comes from

| Source | What drops |
|---|---|
| Enemies and elites | The dungeon's own loot table, themed to its enemy family |
| Bosses | Signature items, like the Boiler's Valve Wheel, with bad-luck protection for Legendary drops |
| Caches and shrines | Random items, sometimes trapped |
| Lost Property crate | One free crate per player each Overflow Night, with items from that week's arrivals |
| Hero Office bounties | A chosen item from a short list, so you can target a slot |
| Crafting on Forge Row | Recipes learned in Lessons, using salvaged materials |
| The Market | Trade with other players for Crowns. Legendary and above are Claimed on pickup and cannot be traded. |
| Almanac events | Event items with their own flavor |

| Upgrade | What it does | Cost |
|---|---|---|
| Salvage | Break an item into Scrap, Era Dust and, for Absurd or higher, Weirdness | Free |
| Temper | +5 item level, up to your License cap | Crowns and Scrap |
| Reforge | Reroll one secondary stat | Crowns and Era Dust, rising each time |
| Era Fusion | Merge two items from different eras. The result keeps one item's look and the better stats from both | Crowns, Era Dust and Weirdness |
| Repair | Restores durability | Crowns at Forge Row |

Bad-luck protection: every boss kill without a Legendary drop adds 0.5 percent to your next roll, and the 40th one is guaranteed. Loot is weighted toward slots you have not filled yet.

## Choosing and collecting

1. Pick your starting character. Choose from the 8 launch Origins, all with modest base stats. The card flips to show their bio and empty gear slots. You start with a Common weapon from your era and a basic chest piece.
2. Gear them up. Everything you find can go on any card. Gear is where most of the power comes from.
3. Collect Recruits. Other Summoned you hire. Each has its own sheet and slots. They join your Descents as companions (up to 2) and work City jobs while you are away.
4. Weekly Intake, face-up. Every Overflow Night you get free Intake Papers from play. Spend one to see 3 new arrivals face-up and keep 1. No blind pulls, and odds are shown.
5. Other ways in. Strangers met in the Descent can join you. Mission chains award specific Recruits. Recruit contracts trade on the Market. Events give limited Recruits.
6. Upgrade cards. Recruits level up by working and fighting. Ascension (I to V) raises the level cap and unlocks a second Know-How at III.
7. Duplicates. A duplicate becomes Papers for that Recruit, used for Ascension, or can be filed with the Hero Office for Crowns.
8. Bound gear. Bind slots grow with level. Bound gear and Recruits survive death. Unbound loot carried on a failed run is lost.

How it stays fair:
- Cards start even. Gear is the big gap, and every point of it is earned.
- Crowns cannot be bought, and Gilt cannot be turned into Crowns or traded.
- Legendary and higher items cannot be traded, which takes the money out of selling accounts or items.
- License caps on item level and weekly boards split by License grade keep new players competitive.
- Bad-luck protection on Legendary drops and top-tier cards.

Never allowed:
- Selling gear, stat items, rerolls, reforges, repairs or upgrade materials.
- Selling Intake Papers, Recruits or anything random for real money.
- Selling Energy, Nerve, refills, faster regen or bigger bars.
- Hiding odds or showing fake near-misses.

Loot box law check: paid random rewards are banned or restricted in a growing list of places. Belgium treats them as illegal gambling. Australia gives games with paid loot boxes an M rating at minimum, and simulated gambling an R18+ rating, since September 2024. In January 2025 the US FTC fined a major gacha publisher 20 million dollars over loot box sales to teens. Brazil passed a 2025 law restricting loot boxes in games minors can reach. Apple and Google require shown odds for any paid random item. Because OverSummoned sells nothing random, and random gear drops only come from play, these rules should not apply. The free Lost Property crate and Back Room tokens must never be buyable. These facts were not re-checked for this plan. Get a short legal review before launch.

## Core loop and progression

The loop: bars refill on real-time timers. You spend them in the City (train, hustle, work, craft) and on Descent runs. Runs produce gear and Recruits, banked at an Exit. Gear goes back on your cards, gets salvaged or gets sold. Everything feeds your status: ranks, The Crier and the Ledger of Names.

### Bars

| Bar | Max | Refill | Spent on |
|---|---|---|---|
| Energy | 100 | 5 every 10 minutes (full in about 3 hours 20 minutes) | Descent runs (20 shallow, 40 deep), training at the Pit (5) |
| Nerve | 10 at start, grows with Street Cred | 1 every 5 minutes | Hustles. Failing can land you in the Stocks. |
| Morale | Set by Lodging | Toward your Lodging's level, plus food and company | Multiplies training gains |
| Life | Grows with Grit | Slowly, or fast at the Infirmary for Crowns | Taken by fights. Zero means the Infirmary. |

### Stats, ranks and Callings

- Fight stats: Might, Guard, Speed, Hands. Trained at the Pit with Energy, then boosted by gear.
- Street stats: Wits, Charm, Grit. Raised by Lessons, hustles, jobs and gear.
- Overstats: the three numbers on a card's front (Guard, Might, Knack) and its Power score. Always totals with gear.
- Level 1 to 100: from XP earned everywhere. Unlocks districts, bind slots, the Anomaly slot and Recruit slots.
- Street rank: Fresh Meat, Stray, Nuisance, Known Face, Cutthroat, Fixer, Name, Problem, Legend. Earned by Street Cred.
- Hero License: Grade F to Grade S. Earned by dungeon depth and bosses. Sets your item level cap and unlocks harder Descents.
- Callings: classes earned by doing: Vanguard, Duelist, Artificer, Hedgecaster, Medic, Fixer, Cutpurse, Odd Job, plus hidden ones.

### City activities

| Activity | Cost | Example |
|---|---|---|
| Hustles | Nerve | Pickpocketing, Selling Saint's Fingers, Forging Hero Licenses, Smuggling Coffee, Selling Weather Forecasts, Running a Pyramid Scheme |
| Jobs | Time | Hero Office clerk, Forge Row apprentice, Infirmary orderly, Crier delivery |
| Lessons | Crowns and real days | Runecraft, Beast-Lore, Alchemy, Smithing, Local Law. 1 to 14 days each. Smithing unlocks crafting recipes. |
| Forge Row | Crowns and materials | Salvage, Temper, Reforge, Era Fusion, Repair |
| Know-How swaps | Time | Teach your era's skill to a Native or player for Crowns and a cut of what they make. |
| Lodging | Crowns plus upkeep | Cot, Room over the Tavern, Rowhouse, Townhouse, Old Darrow Manor |
| Mags's Back Room | Free daily tokens | Card and dice games for cosmetic prizes only |

Sample hustle result: "He had fourteen coins and a sandwich. You took the coins. He noticed, and you spent the next hour in the Stocks thinking about the sandwich."

### Currencies and sinks

| Currency | How you get it | Where it goes |
|---|---|---|
| Crowns (Ø) | Runs, jobs, hustles, trades | Repair, Temper, Reforge, bail, healing, Lodging upkeep, Lessons, Hero Office tax, crew charters, Market fees |
| Scrap, Era Dust, Weirdness | Salvaging items | Crafting and upgrading gear |
| Papers | Duplicate Recruits, weekly play | Ascension |
| Intake Papers | Weekly play only | Seeing and keeping one of 3 face-up arrivals |
| Gilt | Bought with real money or earned slowly | Cosmetics only |

### Daily and weekly rhythm

| When | What happens |
|---|---|
| Every few hours | Energy and Nerve refill. Check in, spend, leave. |
| Daily | New Crier edition. Daily seeded Descent with a shared layout and its own board. One Dez errand. Free Back Room tokens. |
| Weekly, Overflow Night (Friday 8 PM Eastern) | New arrivals land. Intake Papers refresh. Lost Property crates open. A weekly boss opens. The Crier runs a big front page. Crew feuds settle. |
| Monthly | One new Origin, a new dungeon floor set and a new batch of items. |
| Seasonal (about 10 weeks) | New Almanac event, seasonal boards, a cosmetic frame for taking part. |

### The first 10 minutes

1. 0:00 You land in the Circle. One short Origin intro in plain words. Mr. Pell asks what era you are from, which is the character pick. The card flips and shows your empty slots.
2. 1:30 First fight, right away. Pell sends you into the Old Cellars to clear rats as your first fee. Three rooms, enemy intents shown, your pixel sprite fighting on screen.
3. 3:00 First drop. A green item falls. You hover it, see the stats, equip it, and watch the card's Overstats tick up.
4. 4:00 First Exit choice. Leave with your loot, or go one room deeper for a chest. Most people go deeper. That is the hook.
5. 5:30 Back up to the city. Your bars, your Crowns, and your name on the Infirmary list if the chest won.
6. 7:00 First Recruit. Dez walks you to the Intake board. Pick 1 of 3 face-up arrivals from this week.
7. 9:00 Timers start. Start a Lesson, see Energy refilling, and Dez hands you an errand for tomorrow.

Sample line, Dez Calloway: "Nineteen years I drove a truck, kid. Never got summoned once. Then I stop for gas in Amarillo and wake up here with a ghoul eating my jerky. Lace your boots. Nobody in that cellar cares what year you're from."

## The Descent: dungeon scenarios

| Rule | How it works |
|---|---|
| Entry cost | 20 Energy for a shallow run (floors 1 to 3), 40 for a deep run. Crew runs cost each member the same. |
| Floors | 8 to 12, ending in a boss. Each floor is a node map with 2 or 3 paths. |
| Nodes | Fight, Elite, Cache, Shrine, Merchant, Rest, Event, Stranger, Exit |
| Battle | Turn-based, with fully animated pixel sprites. The enemy's next move is shown as an intent. Actions: Strike, Technique, Guard, Know-How, Item, Talk, Flee. |
| Gear in a run | Your equipped gear sets your stats. New drops can be equipped between fights, except the Anomaly slot. |
| Boons | Pick 1 of 3 after each floor. They last until the run ends. |
| Exits | Every 3 floors. Leave with everything, or go deeper for more. |
| Death | Lose unbanked loot and unbound gear. Keep XP, stats, Recruits and bound gear. Gain a Scar, a small permanent perk with a quirk, named after how you died. |
| Infirmary tie-in | Death puts you on the public Infirmary list for 20 to 60 minutes. Friends can pay to discharge you early. |
| Stocks tie-in | Getting caught stealing from a dungeon merchant or a sacred cache puts you in the Stocks. Friends can bail or bust you out. |

A floor runs: floor start, then a choice of Fight, Cache or Event, then Elite or Rest, then a Boon pick, then Exit or go deeper.

### Scenario ideas

| Scenario | The setup | Sample line |
|---|---|---|
| The Boiler Has Demands (Old Cellars) | The tutorial dungeon under the Hero Office. The building's boiler has been ignored for 60 years and has opinions about it. | The Angry Boiler is building pressure. The gauge needle went past the red and kept going, into a part of the dial someone painted a skull on. |
| Harvest Week (Bone Orchard) | The cemetery's fruit trees are ripe, and they are doing the picking this year. | The tree lowered a branch to you, slowly, like it was offering a hand. Two of its apples had teeth. |
| The Old Money (Sunken Mint) | A flooded treasury guarded by a construct that only accepts a currency withdrawn 200 years ago. | The Auditor turned your Crown over in its iron fingers, weighed it, and handed it back. Then it hit you with the ledger. |
| Closing Time (Lower Mall) | Part of an Earth shopping mall got summoned underground in 1998. The lights still hum. Someone keeps playing the closing music. | A voice on the speakers said the mall would close in fifteen minutes. It had been saying that for twenty-six years. |
| The Backlog (Archive Stacks) | Every form the Hero Office ever lost is down here, and some of them have started filing themselves. | The form golem demanded a signature in triplicate. You only had two hands, so it took one of your fingers as a deposit. |
| The 8:14 Never Came (Stalled Line) | A subway tunnel full of commuters from different decades who still think the train is coming. | A man in a 1950s hat checked his watch, looked at you, and asked if you knew about the delay. His watch had no hands. |
| What You Left Down Here (Glasswork Deep) | A crystal mine that shows you your past deaths. Your Scars come back as enemies, wearing the gear you lost. The grim one. | The thing in the glass was you, from the run where you went for the chest. It still had the arrow in its neck. It still went for the chest. |
| Hot Takes (Outrage Pit) | Current-events satire. Enemies feed on attention and change their intent based on what you just did. | You guarded. The Hot Take called you a coward to four thousand followers, none of whom existed, and grew a second head. |

The Outrage Pit is the slot for current-events satire. Its enemies, events, item drops and Crier headlines rotate with each Overflow, about institutions and trends, never real people or brands.

## Earning and showing it off

| Surface | What it shows | Public? |
|---|---|---|
| Character Sheet | Portrait, sprite, level, rank, crew, wealth, Street Cred, notoriety, district, equipped title, top 3 badges | Yes |
| The Armory | Your equipped gear on the paper-doll. Anyone can hover your items to read the tooltips. | Yes |
| The Binder | Every Recruit card you own, sorted by era. Uncollected ones show as dark silhouettes. Completion per era unlocks a binder cover. | Yes |
| Collection Log | Every item you have ever found, with silhouettes for the rest. Finding all Absurd items earns a title. | Yes |
| Scars Wall | Every Scar you earned, with the date, the dungeon and the line that killed you | Yes |
| Titles | One shown under your name, such as Boiler Survivor, Twice Audited, Everywhen or Known to the Stocks | Yes |
| Seals (badges) | Wax seals for feats: first boss, first Legendary, 100 hustles, a full era set, a crew war win | Yes |
| Trophy Room | Inside your Lodging. Boss trophies and rare finds on display. Visitors can leave a note. | Yes |
| The Ledger of Names | Leaderboards: deepest run, biggest haul, most bosses, best Binder, highest Power per License grade, most bailed out, crew respect. Weekly, seasonal and all-time. | Yes |
| The Crier front page | Big moments, like the first Unhinged drop of the week or a record haul, in newspaper voice, with opt-in names | Yes |
| Infirmary and Stocks lists | Who is in and why, with timers and a button to help | Yes |
| Crew page | Banner, roster, war record, shared trophies, crew Binder | Yes |

Sample Infirmary reasons: Tried to reason with the Angry Boiler. Bitten by a rat he was trying to name. Launched by his own Pocket Trebuchet. Fell down Descent Shaft 4. Again.

Sample Stocks reasons: Sold a saint's finger. It was a carrot. Forged a Hero License. Spelled Hero wrong. Unlicensed heroism in the Fresh Ward. Tried to pay the Watch in exposure.

## Social and endgame

| System | How it works |
|---|---|
| Crews | 3 to 25 players. A Crew Hall, shared stash, crew Binder and a charter that costs Crowns to start. |
| Crew Descents | 2 to 4 players run a dungeon together, with roles and a vote at each fork. Loot uses need-or-pass rolls, shown openly. |
| Turf | Crews hold districts of Aldermere. Turf gives a small cut of hustle income there. |
| Feuds | Declared crew wars over a week. Points come from attacks, runs and hustles on rival turf. Settled on Overflow Night. |
| Streaks | Crew-wide chains of wins in a time window, for respect. |
| Economy | Player Market with visible price history for items up to Epic, Recruit contracts, crafting materials and repair. The Hero Office taxes Summoned income, which feeds smuggling. |
| Endgame depth | Grade S Licenses, Legendary and Absurd hunting, the Collection Log, Descent depth records, full era Binders, Memorials, and slowly finding out what the Circle really is. |

| Almanac event | When | What happens |
|---|---|---|
| Overflow Night | Every Friday | New arrivals, Intake, Lost Property crates, weekly boss |
| Census Week | February | The Hero Office counts everyone. Hiding from the count is a hustle. |
| Founders' Fair | May | Market festival, crafting contests, a parade that goes wrong |
| The Misplacement | August | Anniversary of the first broken summoning. Double arrivals and double Lost Property. |
| Ash Night | October | The dead in the Bone Orchard get loud. Costume cosmetics. |
| Midwinter Audit | December | The Auditor walks the city. Everyone owes something. |

## Monetization

| Sold | Price idea | Why it is fair |
|---|---|---|
| Patron of the Office (membership) | 5 dollars a month | Cosmetic frame, extra saved loadouts, more Market listings, longer logs, crew banner. No bar, stat or loot effects. |
| Alternate portrait art for Recruits | 2 to 5 dollars each | Looks only |
| Glamours (item looks) | Small items | Change how a sprite's weapon or an item icon looks. The stats and rarity color never change. |
| Foil and seasonal card frames, card backs | Bundles | Looks only |
| Profile themes, title colors, Trophy Room decor | Small items | Looks only |
| Almanac Pass (seasonal) | 8 dollars a season | Paid track is cosmetics only. All gear and gameplay rewards are on the free track. |
| Name change, Re-Registration | Small fee or earned | Convenience only |
| Crier classified ads | Small fee | Moderated player ads |

The test for every store item: if a free player would lose a fight, a race or a trade because someone else bought it, it does not go in the store. Gear, upgrade materials, rerolls, repairs and bag space are always earned.

## Art consistency pipeline

The goal: every new card, sprite and item icon looks like it came out of the same box as the first ones, and the logo never drifts. Only one thing is generated per character for the card (the portrait) and one per character for fights (the sprite set). Everything else is a locked template or code.

| Asset | Style | Where it shows |
|---|---|---|
| Card front | Painted, semi-realistic portrait | Cards, Binder, Intake board, landing page |
| Fight sprite | Pixel art, fully animated | The Descent, the character sheet, the landing page demo |
| Item icon | Pixel art, classic loot style | Bags, paper-doll, tooltips, Market, loot drops |
| Logo and UI | Traced vector wordmark, serif fonts, dark gold | Everywhere |

### Logo

1. Trace once. Take the OverSummoned wordmark from the mockup at the highest resolution we can get, then trace it into a clean vector SVG. An auto-trace gives the starting shape. A designer pass fixes curves and spacing.
2. Lock it. Save the master SVG with the gold gradient, bevel and dark outline as separate layers. Export fixed PNG sizes, a one-color version and the horned skull emblem as the favicon. Nobody regenerates the logo after this.
3. Check it. The traced shapes become Dean's own artwork. Before launch, compare it against similar display fonts so it is not a near-copy of a commercial typeface.

| Use | Font | Notes |
|---|---|---|
| Logo | The traced SVG only | Never typed out in a font |
| Big headings | Cinzel Decorative | Free on Google Fonts, closest match to the mockup's flared capitals |
| Section headings, card names, item names, buttons | Cinzel | Same family, calmer |
| Body text, lore, flavor lines | EB Garamond | Readable serif with an old-book feel |
| Numbers, bars, timers, tooltip stats | Inter with tabular numerals | Keeps stat columns lined up on phones |

### Card system

| Layer (back to front) | Made by | Changes per card? |
|---|---|---|
| 1. Portrait | Generated, one per character | Yes |
| 2. Portrait window mask and inner shadow | Template PNG | No |
| 3. Frame (per rarity) | Template SVG or PNG | Only by rarity |
| 4. Rarity gem and letter | Template gem, letter drawn by code | Only by rarity |
| 5. Nameplate | Template | No |
| 6. Name and title text | Code, Cinzel | Yes |
| 7. Stat plate | Template | No |
| 8. Overstat icons and numbers, with gear included | Code | Yes, and they update live as gear changes |
| 9. Power seal | Template wax seal, number by code | Yes |
| 10. Ascension corners (I to V) | Template overlays | By tier |
| 11. Rarity effects (flicker, shimmer, wobble, glitch) | Code animation | Only by rarity |

Because names, stats and rarity are drawn by code on top of fixed layers, every card is identical in layout down to the pixel. The same component renders cards on the site and in the game, and a server-side render makes share images for the Binder and The Crier. Card data lives in one file, so a new card is a new row plus a portrait and a sprite set. The back of the card is the character sheet, built from the same data.

### Portraits

| Spec | Value |
|---|---|
| Size | 1024 by 1365 (3:4), exported as WebP |
| Framing | Chest-up. Top of head about 10 percent from the top edge. Eyes on the 38 percent line. Shoulders fill the width. |
| Pose | Three-quarter turn, looking near the viewer, never straight at them |
| Lighting | Warm key light from upper left, dim rim light on the right, deep shadow side |
| Background | A blurred scene from their own era, darkened at the edges, with a hint of Aldermere's candlelight |
| Style | Painted, semi-realistic, visible brushwork, muted palette with gold and ember accents |
| Never | Text, logos, a frame, modern brands, extra fingers, cartoon proportions |

Locked style prompt (do not edit per character): Painted semi-realistic character portrait, oil painting with visible brushwork, dark fantasy card art. Chest-up, three-quarter view, looking just past the viewer. Warm torchlight key from upper left, faint cool rim light on the right, deep shadows. Muted palette of soot, stone and dried blood with gold and ember highlights. Background: a blurred scene from the subject's home era fading into dark candlelit stone. No text, no frame, no border, no logos.

Per-character slot (the only part that changes): Subject: {age} {build} {origin} from {era}. Wearing {clothing}. Holding {prop}. Expression: {expression}. One detail: {detail}.

References: attach the 5 approved mockup portraits (Gaius, Vincenzo, Maya, Kevin, Brokk) as style references every time.

Portrait QA checklist:
- Framing matches the spec when laid over the template window
- Light comes from upper left and the face sits in warm light
- Brushwork and palette match the 5 references side by side
- Hands, eyes and teeth are clean
- Clothing and props fit the era, with no modern brands or text
- Looks right at Binder thumbnail size (120 pixels wide)
- Dean signs off before it ships

### Pixel fight sprites

| Spec | Value |
|---|---|
| Tool | PixelLab, with every new sprite generated from the same reference sprite and settings |
| Canvas | 128 by 128 pixels per frame. Humans stand 88 to 96 pixels tall. Large bosses use 160 or 192 pixel canvases at the same pixel size. |
| Animations | Idle (8 frames, 7 fps), Attack (9 frames, 12 fps), Hurt (4 frames, 10 fps), Death (8 frames, 10 fps). Later: Cast and Use Item (6 frames each). |
| Feet | Every frame has its feet on the bottom row of the canvas. The manifest stores the foot anchor point, and the game places that point exactly on the arena ground line. A test fails the build if any frame floats by even 1 pixel. |
| Facing | Players and Recruits face right. Enemies face left. |
| Scale | One pixel size everywhere. Sprites scale by whole numbers only (2x or 3x) with pixelated rendering, never blurry. |
| Palette | One shared 48-color master palette: soot, stone, dried blood, rot green, plus torch amber, ember, candle gold and the rarity colors |
| Outline | 1 pixel dark outline, a little lighter on the lit side, with light from the upper left to match the portraits |
| Weapons | The main hand weapon shows on the sprite as a swappable overlay per weapon type. Full visible armor comes later. |

The PixelLab sprites made earlier can be reused: six Origins (idle and attack), the Cellar Rat, the Ghoul, the Angry Boiler and Mr. Pell. They need hurt and death animations added for the Origins, a recolor to the master palette, and a feet check against the ground line. Any that do not match the new standard get regenerated.

### Pixel item icons

| Spec | Value |
|---|---|
| Grid | Drawn at 32 by 32 pixels. Shown at 64 pixels in bags and on the paper-doll, 96 pixels in the tooltip header. Whole-number scaling only. |
| Framing | Weapons drawn on a 45 degree angle, everything else straight on, with 2 pixels of empty space on every side |
| Palette | The same master palette, with no more than 12 colors per icon |
| Outline | 1 pixel dark outline, light from the upper left |
| Rarity glow | Never painted into the icon. Code draws the slot border and a soft glow in the rarity color. Legendary shimmers, Absurd wobbles slightly, Unhinged flickers. |
| Never | Text, logos or real brand shapes |

Icon QA checklist:
- Readable at 32 pixels, the item is clear from its shape alone
- Uses only master palette colors
- Outline and light direction match the rest of the set
- No rarity color painted into the art
- Dean signs off on the first 20 before the rest are made

Status as of this plan: none of the new art has been made yet.

## Site plan

### Landing page

| Section | What it shows | Sample copy |
|---|---|---|
| Header | Traced logo, About, Features, Rules, Leaderboards, and a Join button | Join the waitlist |
| Left panel: sign-up | Short pitch, email field, button, sign-in link | OverSummoned is a browser game set in Aldermere, a city that keeps summoning people from Earth by accident. Pick who you were, gear up with whatever came through with you, and survive the dungeon under the city. |
| Center: game screen peek | The mockup's Home screen with live-looking bars, character sheet and city news | Real sample Crier headlines and Infirmary lines, rotating |
| Right panel: features | Four painted icons with short blurbs | Go down for loot. Gear up from any century. Build a crew. Climb the Ledger of Names. |
| Card row | Five painted cards from the second mockup. Tap or click one and it flips to its character sheet with filled gear slots | Every week the Circle brings in new arrivals. Some of them are worth hiring. |
| Loot strip | A row of pixel item icons, one per rarity. Hover or tap for the real tooltip. | A Roman can carry a defibrillator. Nobody here will stop him. |
| Fight preview | A short looping clip of the animated pixel sprites in a Descent fight, feet on the floor | Pick a door. Read what the ghoul is about to do. Hit it first. |
| How it works | Three short steps with screenshots | Pick your era. Go down. Come back richer, or come back with a Scar. |
| Footer | 18+, privacy, terms, waitlist again | We send one email when the doors open. |

### In-game screen

- Left sidebar: Home, City, Descent, Hero Office, Market, Forge Row, Crier, Stocks, Infirmary, Crew, Binder, Armory, Ledger, Almanac
- Top bar: logo, server time, your name, Crowns
- Status block: the four bars with refill timers, always visible
- Main panel: whatever page you are on. The Home page shows your card, Overstats and the paper-doll.
- Right column: Crier headlines and your event log
- Bottom ticker: Market moves and big player moments, like a Legendary drop
- Descent screen: node map on top, the fight stage with pixel sprites on a ground line in the middle, actions and enemy intent below
- Phone: the sidebar becomes a bottom tab bar, the bars stay pinned at the top, and tooltips open as bottom sheets

## Build roadmap

| Phase | What ships | Rough size |
|---|---|---|
| 0. New landing page | Mockup layout, traced logo, 5 painted cards that flip to a character sheet, the loot strip with working tooltips, real waitlist (reuse the existing Vercel and Resend setup) | 2 to 3 weeks |
| 1. First Descent | Accounts, character pick, Old Cellars, animated sprite fights, gear slots and drops, tooltips, Boons, death and Scars, Infirmary list | 6 to 8 weeks |
| 2. The City | Bars and timers, Pit, hustles, jobs, Stocks, Lodging, Market, Forge Row upgrades, Dez's Errands | 6 to 8 weeks |
| 3. Collecting | Weekly Intake, Recruits as companions, Binder, Ascension, Anomaly slot, set bonuses, 8 Origins | 4 to 6 weeks |
| 4. Social | Crews, crew Descents, The Crier daily edition, Ledger of Names, Armory | 6 weeks |
| 5. Live game | More dungeons, Origins and items, Feuds, Almanac events, Patron and cosmetics | Ongoing |

Tech notes:
- Server decides everything. Every roll, hit and drop, and every item's stats, are decided by the server. Grok only writes the words around them.
- Item data. Items are rows in one table: name, rarity, item level, slot, type, era, stats, effect, flavor, icon. Stats roll from the rarity budget. Flavor lines are written once and stored.
- Grok writing. Follows the prompt kit and the v1.1 bible's voice section: fixed cached system prompt, 3 rotating voice samples, a facts card, and a short note at the end. Common results come from pre-written pools refreshed weekly.
- Post-filter. Code catches em dashes, banned phrases and names, and the it's-not-X-it's-Y pattern, then regenerates or sends text to an editor pass.
- Waitlist. Reuse the current Vercel project and Resend contact list. No emails go out without Dean's yes.
- Art. Locked logo SVG, card template layers, one portrait and one PixelLab sprite set per character, and 32 pixel icons per item.

## Open questions for Dean

1. Happy with premise A (the Cheap Circle) plus the same-week rule for picking arrivals?
2. Are the 8 launch Origins right, or do you want to swap any?
3. Should Legendary and higher items be untradeable, as planned, or tradeable with a fee?
4. Should gear show on the pixel sprites from day one, or only the weapon at first?
5. Friday night for Overflow Night, or another day?
6. How adult: strong language and off-page sex, as in the v1.1 bible, or tamer for a wider audience?
7. Do you want the far-future Earth secret (option C) as the long-term mystery?
