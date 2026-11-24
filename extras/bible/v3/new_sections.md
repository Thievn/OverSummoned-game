## How this relates to Claude's v1.1 bible

Claude's "Oversummoned: Game Bible" v1.1 stays the base and has not been edited. This document builds on it and replaces some parts. Where the two disagree, this document wins. The game's name is always spelled OverSummoned. This is version 3 of the Poppy plan and replaces version 2.

| Area | Status | What changed |
|---|---|---|
| Pitch, Aldermere, Summoned vs Natives, Overflow | Kept | Adds the Cheap Circle premise, names the world Ash, and makes Overflow the weekly hero batch. |
| Writing voice, content boundaries, Grok pipeline, voice samples | Kept in full | Still the source of truth for every word the game shows. |
| Descent battle, Boons, Exits, Scars, Callings | Kept | Adds squads of 3, dungeon favored traits, Energy costs, Infirmary and Stocks tie-ins, 8 scenarios. |
| Art direction (pixel portraits) | Superseded | Painted portrait card fronts, animated pixel sprites in fights, pixel item icons. |
| Gear slots and rarity (Scrap to Anomaly) | Superseded | 11 slots plus a 4-slot belt, a shared armory, and the 7-tier ladder from Common to Unhinged. |
| Bars (Energy, Nerve, Health, Spirit) | Renamed | Energy, Nerve, Morale and Life, to match the mockup. |
| Stats (Brawn, Guard, Speed, Hands, Wits, Charm, Grit) | Renamed | Brawn becomes Might. Card fronts show three Overstats. |
| Companions and crews | Expanded | Hero roster, Barracks, City jobs, Expeditions, retire and release, Hiring Hall. |
| Economy and market | Expanded | Full Exchange, direct trades, fees, cooldowns, anti-bot and anti-RMT rules. |
| Monetization | Kept and tightened | Same never-sold rule, now covering gear, heroes, rerolls, repairs and materials. |
| Landing page section | Superseded | New site plan based on Dean's two favorite mockups. |
| Open questions | Superseded | New list at the end of this document. |

## The short version

- Premise: the world is called Ash, the city is Aldermere. Its summoning Circle was rebuilt on the cheap and now pulls people from every Earth century, every week, on Overflow Night.
- You take your own character plus 2 hired heroes into the Descent. Each dungeon favors different teams, which is the reason to collect.
- Heroes not in your squad work City jobs, mind market stalls, stand guard and go on timed Expeditions, so your roster earns while you are offline.
- Cards start fairly even. Gear is most of your power, it is shared across your heroes, and any item fits any hero from any century. Rarity runs Common to Unhinged and gets sillier as it climbs.
- Everything worth having can be traded for Crowns, including Legendary and higher, with fees, short cooldowns and anti-bot rules. Real-money trading is banned.
- Painted portrait cards, animated pixel sprites in fights, pixel item icons with hover tooltips. Money buys looks, never power.

| Number | What |
|---|---|
| 3 | Heroes per Descent: you plus 2 hires |
| 7 | Rarity tiers, Common to Unhinged |
| 10 to 15 | New heroes every Friday in a shared weekly batch |
| 0 dollars | Gear power or random items sold |

## Core game loop

In one line: spend your bars on dungeon runs with a squad of three, turn the loot into gear and Crowns, put your other heroes to work while you are away, trade what you do not need, and every Friday the Circle brings in new heroes and new problems.

Loop diagram (mermaid):

flowchart LR
  Overflow[Weekly Overflow] -->|new arrivals| Heroes
  Overflow -->|Lost Property| Loot
  Bars -->|Energy| Descent
  Heroes -->|squad of 3| Descent
  Heroes -->|spare heroes| Jobs[City jobs and Expeditions]
  Descent -->|drops| Loot
  Loot -->|equip, craft| Gear
  Gear -->|power| Heroes
  Loot -->|sell| Market
  Market -->|buy| Gear
  Jobs -->|wages, materials| Crowns
  Market -->|sales| Crowns
  Crowns -->|hire, upkeep| Heroes
  Crowns -->|temper, repair| Gear

| Piece | What it gives | What it needs |
|---|---|---|
| Bars | Energy for runs and training, Nerve for hustles | Time. They refill on real-time timers. |
| Descent | Loot, XP, Scars, Crier moments | Energy and a squad that suits the dungeon |
| Loot | Gear to equip, materials to craft, items to sell | A safe Exit, or it is lost |
| Gear | About 60 percent of a hero's power | Drops, crafting or the market, plus Crowns for repair and tempering |
| Heroes | Squad members, City income, Expedition results | Barracks space and daily upkeep in Crowns |
| City jobs | Crowns and materials while you are offline | Spare heroes with the right skills |
| Market | The gear and heroes you are missing | Crowns and fees |
| Weekly Overflow | New heroes, a theme, Lost Property loot, a fresh boss | Nothing. It happens every Friday whether you are ready or not. |

### A 15-minute session

1. 0:00 Log in. Collect overnight job wages and Expedition returns. If something odd happened, The Crier already has the story.
2. 1:00 Reassign. Upkeep is paid automatically. Put spare heroes on new shifts and send one on a 4-hour Expedition.
3. 2:00 Check the market. See what sold. Buy the missing Legs piece you have been watching on the price chart.
4. 4:00 Pick a squad. Today's dungeon favors Fire and healers, so swap in the Stone Age Hunter and the Paramedic and move gear across from your armory.
5. 5:00 Run the Descent. A shallow run takes about 8 minutes. Fight, pick a Boon, decide at the Exit.
6. 13:00 Sort the loot. Hover the drops, equip one, salvage two, list one on the Exchange. Fresh drops show their trade cooldown.
7. 14:00 Spend the rest. Use Nerve on a hustle, start Pit training, log off with every timer running.

### Daily rhythm

| When | What happens |
|---|---|
| Morning check-in | Collect overnight jobs and Expeditions, read The Crier, reassign heroes |
| Every 3 to 4 hours | Energy is full again. One or two runs, then sort loot. |
| Any time | Hustles when Nerve is full, market buys and sells, crew chat |
| Daily | One seeded Descent with a shared layout and its own board, one Dez errand, free Back Room tokens |
| Midnight Eastern | Upkeep is charged and daily boards close |

### Weekly rhythm

| Day | What happens |
|---|---|
| Friday 8 PM Eastern, Overflow Night | The week's batch of 10 to 15 themed heroes arrives. Everyone gets their 3 face-up offers. Lost Property crates open. A new weekly boss opens. Crew feuds settle. The Crier runs its big front page. |
| Saturday and Sunday | Weekly boss push. Hiring Hall rush for the heroes nobody picked. Market prices swing on new items. |
| Monday to Wednesday | Feud week. Long Expeditions. Crafting and tempering for the next boss. |
| Thursday | The Crier teases next week's theme. Players save Crowns and Intake Papers. |

## Squad, roster and Intake

Your own character is the one you picked at signup and can never be traded, retired or released. Every other hero is a hire. You collect them because no single team is good at every dungeon, and because heroes sitting in the Barracks still earn.

### Your squad

- Three go down: you plus 2 hired heroes. All three fight, each with their own sprite, gear and Know-How.
- Turn order is set by Speed. You pick each hero's action every turn, like a small party in a classic RPG.
- A downed hire can be revived mid-run. If the whole squad falls, everyone goes to the Infirmary and unbanked loot is lost. Hires never die for good.
- Crew loans: a crewmate can lend you one hero for 24 hours. The hero comes back on its own and earns its owner a small fee.

### Dungeons favor different teams

| Dungeon | Favored traits | Good picks |
|---|---|---|
| The Old Cellars | None, it is the tutorial | Anyone |
| The Bone Orchard | Fire, healing | Stone Age Hunter, Plague Doctor, Paramedic |
| The Sunken Mint | Shock, Talk, constructs | IT Help Desk, Victorian Engineer, Prohibition Gangster |
| The Lower Mall | Modern era, Charm | Office Worker, Delivery Rider, Disco Roller Skater |
| The Archive Stacks | Wits, reading | Monastery Scribe, Office Worker, Private Inquiry Agent |
| The Stalled Line | Speed | Delivery Rider, Fighter Pilot, Frontier Gunslinger |
| The Glasswork Deep | Grit, Scars | Night Shift Nurse, Trench Runner, any hero with 3 or more Scars |
| The Outrage Pit | Charm, Talk | Court Jester, Conspiracy Podcaster, HOA President |

Each squad member who matches a favored trait gives the whole squad +10 percent damage and loot, up to +30 percent. Some doors only open for certain Know-How, like the Chimney Sweep's vent shortcuts. The daily seeded Descent rotates which dungeon it uses, so the best squad changes every day.

### Spare heroes at work

| Job | Best for | Earns | Shift |
|---|---|---|---|
| Infirmary shift | Paramedic, Night Shift Nurse, Plague Doctor | Crowns, and cuts your own Infirmary timers | 4, 8 or 12 hours |
| Debt collecting for the Black Ledger | Prohibition Gangster, Viking Raider | Crowns and Street Cred, small risk of injury | 4 or 8 hours |
| Market stall | Tonic Salesman, Door-to-Door Salesman, any high Charm | Lower Exchange fees on your own listings while on shift | 8 or 12 hours |
| Guard duty | Roman Legionary, Exosuit Trooper, any high Guard | Protects your Lodging and crew turf from player hustles, plus a wage | 8 or 12 hours |
| Forge apprentice | Victorian Engineer, Pyramid Laborer | Scrap and Era Dust | 4, 8 or 12 hours |
| Hero Office clerk | Office Worker, Monastery Scribe | Steady Crowns, no risk | 8 or 12 hours |

Wages are collected when you log in. A hero on shift cannot join a run until the shift ends or you pull them early for half pay.

### Expeditions

| Destination | Length | Favors | Can bring back |
|---|---|---|---|
| Lost Property Office basement | 1 hour | Hands | Consumables and junk worth salvaging |
| The Salt Road | 2 hours | Guard, Might | Crowns and trade goods |
| The Drowned Chapel | 4 hours | Wits, Fire | Rot materials, Rare items |
| The Neighbouring Kingdom | 8 hours | Charm | Faction standing and a Crier story |
| The Old Battlefield | 12 hours | Grit | Era Dust and old gear, high injury risk |
| Past the Wall | 24 hours | A balanced team of 3 | A real shot at a Legendary, and a real chance of coming back hurt |

Send 1 to 3 spare heroes. The success chance is shown before you send them. Results are loot, materials, a Crier story, or an injury that puts the hero in the Infirmary for 2 to 24 hours and sometimes earns a Scar. Nobody dies on an Expedition.

Sample Crier story: EXPEDITION RETURNS FROM SALT ROAD ONE MULE SHORT. The mule's owner, a Roman, has filed a complaint with the Hero Office. The Office has asked whether the mule was licensed.

### Barracks

- Starting size: 5 hero slots, not counting your own character.
- Upkeep is charged daily in Crowns by rarity: Common 25, Uncommon 50, Rare 100, Epic 200, Legendary 400, Absurd 600, Unhinged 800. Your own character is free.
- Expanding: +1 slot per Hero License grade, +2 from Lodging upgrades, +1 from some Seals. Maximum 25.
- Unpaid upkeep: the hero stops working and sulks. You get warnings. After 7 unpaid days they walk out to the Hiring Hall, and their gear goes back to your armory.

### Retire or release

- Retire: a hero at level 30 or higher can retire. You get Papers, a small permanent Pension perk (for example +1 percent Crown Find, stacking to 5 percent), and the hero goes up on your Hall of Heroes wall with their portrait, best run, Scars and a short farewell line.
- Release: send a hero back to the City Hiring Hall with their level and Scars intact. Set a price or let them go free. If another player hires them, you get the price minus the Hall's 10 percent cut.
- Gear always comes off and returns to your armory before a hero leaves.

### Shared gear and squad sets

Gear sits in one armory and can be moved between heroes freely in the city. One item can only be worn by one hero at a time. Each hero keeps saved loadouts, so swapping a squad takes one tap. Squad sets count gear across all three heroes in a run.

| Squad set | Needs | Bonus |
|---|---|---|
| Mixed Company | 3 heroes from 3 different eras | +5 percent to all stats for the squad |
| The Night Shift | Every squad member wears one medical item | All healing +20 percent |
| Old Money | 3 Prohibition items spread across the squad | Shakedown and Talk work 25 percent more often |
| Shield Wall | Two Roman Off Hand items in the squad | Formation counts double |

### Overflow Night Intake and the Hiring Hall

1. One shared batch. Every Friday at 8 PM Eastern, 10 to 15 new heroes arrive with a theme tied to that week on Earth. Everyone in the game sees the same list, so everyone is talking about the same new faces.
2. Your own 3. Each player gets their own random 3 face-up from that batch and keeps 1 by spending an Intake Paper. Offers differ between players. Odds are shown, and each batch has at least one Legendary or higher.
3. Nothing is missed for good. Every hero from the batch goes into the City Hiring Hall. Any player can hire any of them later for Crowns.
4. Hiring Hall prices are set by rarity: Common 500 Ø, Uncommon 1,500, Rare 5,000, Epic 15,000, Legendary 50,000, Absurd 120,000, Unhinged 250,000. Prices rise 10 percent for each hire of that hero in its first week, then fall slowly toward a floor. Every Crown spent there leaves the economy.
5. Other ways in. Strangers in the Descent can join you. Mission chains award specific heroes. Players release or sell heroes through the Hiring Hall. Events give limited heroes.

| Sample weekly theme | Earth week it riffs on | Some arrivals |
|---|---|---|
| Tax Week | Mid-April | A medieval tithe reeve, a 1920s revenue agent, a modern accountant who has not slept, a Roman tax farmer |
| Moon Week | Late July | A 1969 mission controller, a medieval astronomer, a festival-goer who never found his tent |
| Doorbuster Week | Late November | Retail workers from five centuries, a market-day pig seller, a shopper still holding a coupon |

### Upgrades and duplicates

- Heroes level by fighting, working and going on Expeditions.
- Ascension tiers I to V raise the level cap. Tier III unlocks a second Know-How. Each tier adds a gold corner to the card.
- A duplicate becomes Papers for that hero, used for Ascension, or can be released to the Hiring Hall for another player to hire.

How it stays fair:
- Cards start even. Gear is the big gap, and it is earned or bought with earned Crowns.
- Crowns cannot be bought, and Gilt cannot be turned into Crowns or traded.
- Every weekly hero ends up in the Hiring Hall, so nothing is locked behind luck forever.
- License caps on item level and weekly boards split by License grade keep new players competitive.
- Bad-luck protection on Legendary drops, and at least one Legendary or higher in every weekly batch.

Never allowed:
- Selling gear, stat items, heroes, rerolls, repairs or upgrade materials for real money.
- Selling Intake Papers or anything random for real money.
- Selling Energy, Nerve, refills, faster regen or bigger bars.
- Hiding odds or showing fake near-misses.

Loot box law check: paid random rewards are banned or restricted in a growing list of places. Belgium treats them as illegal gambling. Australia gives games with paid loot boxes an M rating at minimum, and simulated gambling an R18+ rating, since September 2024. In January 2025 the US FTC fined a major gacha publisher 20 million dollars over loot box sales to teens. Brazil passed a 2025 law restricting loot boxes in games minors can reach. Apple and Google require shown odds for any paid random item. Because OverSummoned sells nothing random, and Crowns can never be bought or cashed out, these rules should not apply. The free Intake Papers, Lost Property crates and Back Room tokens must never be buyable. These facts were not re-checked for this plan. Get a short legal review before launch.

## Trading and the market

REAL-MONEY TRADING IS BANNED. The Terms of Service ban buying or selling Crowns, items, heroes or accounts for real money or anything outside the game, and paid boosting. Breaking it means a ban and a rollback of the items involved. Crowns can never be bought from us or cashed out.

| Way to trade | How it works |
|---|---|
| The Exchange | List an item at a fixed price for 12, 24 or 48 hours. Anyone can buy it. Sorted and filtered by slot, rarity, item level, stat and era. |
| Buy orders | Post what you want and what you will pay. The Crowns are held until someone fills it or you cancel. |
| The Handshake (direct trade) | Two players open a trade window and put in items and Crowns. Any change resets both confirmations, and there is a 3-second lock before the final accept. |
| The Hiring Hall | Hire heroes from the weekly batch, or heroes other players released or put up for hire. |
| Crew stash | A shared crew bank with ranks, permissions and a full log of who took what. |

### Fees (the Crowns sink)

| Fee | Amount | Who pays |
|---|---|---|
| Exchange listing deposit | 2 percent of the asking price, kept if the item does not sell | Seller |
| Exchange sale tax (the Hero Office's cut) | 8 percent of the sale | Seller |
| Buy order fee | 2 percent when filled | Buyer |
| Handshake fee | Flat, by the rarest item in the trade: Common 5, Uncommon 15, Rare 50, Epic 200, Legendary 1,000, Absurd 2,500, Unhinged 5,000 Ø | Split between both players |
| Crowns gift | 5 percent, with a daily cap | Sender |
| Hiring Hall player sales | 10 percent of the price | Seller |
| Inside your crew | Half of all the fees above | Same |

A hero on a Market stall shift lowers your own listing fees, which gives a reason to keep a high-Charm hero around.

### Trade locks

| Lock | Rule |
|---|---|
| Fresh drops | Items cannot be traded for 24 hours after they drop, or 72 hours for Legendary and higher. The tooltip counts it down. This stops farm-and-flip runs. |
| Crafted and fused items | 24 hours |
| Bound gear | Gear in a bind slot survives death but cannot be traded. Unbinding costs Crowns and starts a fresh 24-hour cooldown. |
| Hero transfers | A hero who changes hands cannot be traded again for 7 days. |
| Your own character | Never tradeable |
| New accounts | Under 7 days old or under level 10: no trading Rare or higher, no sending Crowns |

### Price history

- Every item page has a chart of sale prices over 7, 30 and 90 days, with median, low, high and volume, filterable by item level band.
- The 7-day median shows in tooltips for items in your bags and on the Exchange.
- Big sales and new record prices scroll along the bottom ticker.
- The Crier runs a weekly market report: what went up, what crashed, and who overpaid for a tube man.

### Anti-RMT and anti-bot

- Odd prices get held: trades far from an item's median (a Legendary for 1 Crown, a Common for 2 million) are held for 24 hours and reviewed.
- Daily limits on Crowns sent to other players, and a fee on every gift.
- Device and network checks flag mule accounts that only exist to receive items.
- Server-side caps on how fast anyone can list, buy or cancel.
- No sniping: new Exchange listings become visible to everyone at the same moment, after a short delay.
- Click timing and session patterns are checked on the server. Players are only asked to prove they are human when flagged.
- Consequences: bans, item rollbacks and a public note in the Hero Office records.

### Hero hiring between players

- Released heroes show up in the Hiring Hall beside the weekly batch, with their level, Ascension, Scars and service record visible.
- You can list any hero (not your own character) at a price. The buyer gets the hero without gear.
- Crewmates can lend a hero for 24 hours for a fee they set. The hero always comes home.
- A hero who changes hands has a 7-day cooldown before it can move again.

### Crew trading

- Crew stash: shared storage with rank permissions and a full log.
- Crew buy orders paid from the crew treasury, useful for boss materials.
- Half fees on trades inside the crew, with the same cooldowns and RMT checks.
- Crew market tab: members can list items to the crew first for 12 hours before they go public.

## Progression and the City

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
- Level 1 to 100: from XP earned everywhere. Unlocks districts, bind slots, the Anomaly slot and Barracks space.
- Street rank: Fresh Meat, Stray, Nuisance, Known Face, Cutthroat, Fixer, Name, Problem, Legend. Earned by Street Cred.
- Hero License: Grade F to Grade S. Earned by dungeon depth and bosses. Sets your item level cap, adds Barracks slots and unlocks harder Descents.
- Callings: classes earned by doing: Vanguard, Duelist, Artificer, Hedgecaster, Medic, Fixer, Cutpurse, Odd Job, plus hidden ones.

### City activities

| Activity | Cost | Example |
|---|---|---|
| Hustles | Nerve | Pickpocketing, Selling Saint's Fingers, Forging Hero Licenses, Smuggling Coffee, Selling Weather Forecasts, Running a Pyramid Scheme |
| Hero jobs | A spare hero's time | Infirmary shifts, debt collecting, market stall, guard duty, forge apprentice, Hero Office clerk |
| Lessons | Crowns and real days | Runecraft, Beast-Lore, Alchemy, Smithing, Local Law. 1 to 14 days each. Smithing unlocks crafting recipes. |
| Forge Row | Crowns and materials | Salvage, Temper, Reforge, Era Fusion, Repair |
| Know-How swaps | Time | Teach your era's skill to a Native or player for Crowns and a cut of what they make. |
| Lodging | Crowns plus upkeep | Cot, Room over the Tavern, Rowhouse, Townhouse, Old Darrow Manor. Bigger Lodging adds Barracks slots. |
| Mags's Back Room | Free daily tokens | Card and dice games for cosmetic prizes only |

Sample hustle result: "He had fourteen coins and a sandwich. You took the coins. He noticed, and you spent the next hour in the Stocks thinking about the sandwich."

### Currencies and sinks

| Currency | How you get it | Where it goes |
|---|---|---|
| Crowns (Ø) | Runs, hero jobs, Expeditions, hustles, sales | Hero upkeep, Hiring Hall, trade fees and taxes, repair, Temper, Reforge, bail, healing, Lodging upkeep, Lessons, crew charters |
| Scrap, Era Dust, Weirdness | Salvaging items, forge apprentice shifts, Expeditions | Crafting and upgrading gear |
| Papers | Duplicate heroes, retiring heroes, weekly play | Ascension |
| Intake Papers | Weekly play only | Keeping one of your 3 weekly offers |
| Gilt | Bought with real money or earned slowly | Cosmetics only. Cannot be traded or turned into Crowns. |

### Monthly and seasonal

| When | What happens |
|---|---|
| Monthly | One new Origin outside the weekly batches, a new dungeon floor set and a new batch of items. |
| Seasonal (about 10 weeks) | New Almanac event, seasonal boards, a cosmetic frame for taking part. |

### The first 10 minutes

1. 0:00 You land in the Circle. One short Origin intro in plain words. Mr. Pell asks what era you are from, which is the character pick. The card flips and shows your empty slots.
2. 1:30 First fight, right away. Pell sends you into the Old Cellars to clear rats as your first fee. Three rooms, enemy intents shown, your pixel sprite fighting on screen.
3. 3:00 First drop. A green item falls. You hover it, see the stats, equip it, and watch the card's Overstats tick up.
4. 4:00 First Exit choice. Leave with your loot, or go one room deeper for a chest. Most people go deeper. That is the hook.
5. 5:30 Back up to the city. Your bars, your Crowns, and your name on the Infirmary list if the chest won.
6. 7:00 First hire. Dez walks you to the Intake board. You see 3 heroes from this week's batch and keep 1. Now you have a squad of two.
7. 9:00 Timers start. Start a Lesson, put your new hire on a short shift, and Dez hands you an errand for tomorrow.

Sample line, Dez Calloway: "Nineteen years I drove a truck, kid. Never got summoned once. Then I stop for gas in Amarillo and wake up here with a ghoul eating my jerky. Lace your boots. Nobody in that cellar cares what year you're from."
