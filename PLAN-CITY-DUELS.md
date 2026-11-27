# OverSummoned: a reason for fifty heroes, Duels, and the city

Written 26 Nov by Fable for Dean. Opus builds from this. Steps are labelled O8 to O16 (build) and F7 to F9 (words).
Nothing here is built yet. Every number is a first guess and lives in `rules/build.py` so it can be tuned without touching code.

## 0. What is wrong today (checked in the code, not guessed)

- A hero is five numbers (attack, defense, health, speed, luck) and a rarity. No hero can do anything another cannot. Archetype (tank, bruiser, fast, lucky, mystic, rogue, star, support) only shapes the numbers.
- Training: 10 energy buys +1 on one stat. The cap is per stat: 10 + 5 per card level, so +60 on each of five stats at card level 10. That is +300 on one hero. A level 10 legendary's own stats total about 189. Training is worth more than the card.
- 480 energy a day is 48 points. One hero is maxed in about a week, three in three weeks, and three is all a raid ever asks for. Crew is three, expeditions take up to four. So about six heroes matter and forty-four are pictures.
- Era and species are nearly all unique (42 eras, 50 species across 50 heroes), so "bring your Romans" is not possible with the data as it is.

Dean is right. The cap slows a player down; nothing makes them go wide.

## 1. Rules this plan keeps

1. Money never buys power. Shards, card levels, training and heroes are never tradeable and never sold.
2. Smudge is the voice of everything. Heroes talk because they are people. Buildings, boards, cards and menus do not.
3. The server decides anything another player can see or lose to. The browser only draws it.
4. Wide beats tall. Every new system should pay a player for raising many heroes a little before one hero a lot.
5. Back up to the secondary GitHub repo before O9, O13 and O14 (Dean's standing rule).

## 2. A reason for fifty heroes (five changes, smallest first)

**2a. Groups (O8).** Every hero gets two new tags, set once in `rules/content.py` and `rules/wave3.py`:
- `age`, seven buckets: Ancient (before 500), Old World (500 to 1700), Sail and Steam (1700 to 1900), Wartime (1900 to 1950), Neon (1950 to 1999), Today, Beyond.
- `kin`, about eight animal families: Dogs, Cats, Birds, Rodents and small things, Hoofed, Bears and big things, Water, Odd ones.
With archetype (8), rarity (7) and home place (9) that makes five ways to belong to a group. Groups are what arenas, Moves, the guild boss and the collection perks all key on. Aim for no group under four heroes; print the table and show Dean before going on.

**2b. Moves (O8).** Each hero gets one Move: a name, one line, and an effect from the vocabulary in 3.4. This is the "something unique" that is missing. Moves work in Duels first; raids pick them up in O15.

**2c. Training pays for going wide (O12).** Cost per point by how far that stat is already trained on that hero: the first 15 points cost 5 energy, 16 to 35 cost 10, past 35 cost 20. Nobody loses a point they have. A week of energy now does twice as much spread across the bench as poured into one card. NEEDS DEAN'S YES: it changes a live economy.

**2d. Fresh legs (O12).** A hero's first raid of the day adds +15% loot and gold to that raid (three fresh heroes, +45%). Shown on the raid sheet as a small green tag on the card. A reward for rotating, not a punishment for not.

**2e. Chapters (O12).** Collection perks, per group: 3, 6 and 10 heroes of one `age` or `kin` at card level 5 gives a small permanent account perk (+1% work speed, +2 energy cap, +1 gift a day; never a combat stat). One page in the account, bars that fill.

The two big reasons are below: a Duel deck is twelve heroes who then need a rest, and the guild boss lets each hero swing once a week.

## 3. Duels (player against player)

### 3.1 What was taken from Cards, the Universe and Everything, and what was not

Taken: both players play at once and reveal together; up to three cards a turn from a hand of five; energy that grows each turn, with dearer cards costing more; three turns to a round, first to three rounds; played cards go to the bottom of the deck in the order played, so a combo comes round again; an arena that favours a group; weekly rule changes; one bar in the middle that slides toward whoever is ahead.
Not taken: a single Power number (we already have five stats, so we use them), 18-card decks (we have 50 heroes, not 5,000), trading cards, crafting and fusion.

### 3.2 The rules

- **Deck:** 12 different heroes. Duels open when a player owns 12. Up to three saved decks.
- **Hand:** 5, refilled to 5 after every turn. Played cards return to the bottom in play order.
- **Turn:** both players pick up to 3 cards, limited by energy, and press Ready (30 second timer in live play). Then both sides flip.
- **Energy:** start with 6, gain 5 a turn, unspent carries over, never more than 15. Cost by rarity: common 2, uncommon 3, rare 4, epic 5, legendary 6, absurd 7, unhinged 8.
- **The call (this is ours):** every turn calls one stat. On a Speed call, a card is worth its speed. A round shows its three calls up front (say Speed, then Attack, then Health), so you plan the round: hold the sloth for the Health turn, spend the greyhound now.
- **Round:** whoever has more points after three turns takes the round. Level after three: one more turn on a random call. First to three rounds wins. Three to five rounds, about four minutes.
- **Arena:** each duel is in one of the nine places. The arena sets which stats get called more often and gives one group +20% there (the dock favours Ancient; the speakeasy favours rogues). The arena rotates weekly for ranked.
- **Order:** when two Moves clash, the faster card goes first. Speed matters on every turn, not only its own.

Why this fixes the one-card problem by itself: a hero trained to the moon in attack is worth almost nothing on four calls out of five and costs the same energy every time. Kevin (common, health 19, cost 2) beats most legendaries on a Health call, per energy. A deck needs an answer to every call, at several prices.

### 3.3 Keeping it fair

- **Cost by rarity** means a deck of commons and a deck of legendaries both work; they just play differently.
- **Brackets cap what counts.** In a duel a card's stat is: base stat, times its card level bonus up to the bracket's level cap, plus training up to the bracket's training cap.
  Copper: level 3, +10. Silver: level 5, +25. Gold: level 7, +40. Open: level 10, +60. Your bracket follows your rating. Practice uses Silver for everyone.
- **Gear:** in version one only the hero's own three-piece kit counts (+10% for two, +25% for three, as now). Era gear numbers stay out until the sim says they are safe. DEAN TO CONFIRM.
- **No real money anywhere in it.** Season prizes are titles, name colours and frames.
- **The server plays the duel.** The deck is read from the server's copy of the save, never from the browser. The engine is one seeded, pure function in one file, used by the browser (practice, drawing) and by the edge function (ranked).
- **Opus must write `rules/sim_duel.py` before any screen:** 10,000 duels of house AI against itself. Pass marks: no single-rarity deck wins more than 55% against a mixed deck in the same bracket; no stat is called under 15% or over 25% of turns overall; average duel 3.6 to 4.4 rounds; no Move appears in over 70% of winning decks.

### 3.4 Moves: a small vocabulary, fifty names

Triggers: **Entrance** (when played), **Drawn** (when it reaches the hand), **Exit** (when it returns to the deck), **Ahead** or **Behind** (only if you are winning or losing the round when played).
Effects: **Boost** (this card +X on one named call), **Rally** (every card of a group you play this turn +X), **Ramp** (+X each time this card is played this duel), **Sap** (their best card this turn −X), **Burn** (their side −X a turn for two turns), **Lock** (one card in their hand cannot be played next turn), **Spark** (+energy next turn), **Tax** (their dearest card costs 1 more next turn), **Twist** (for your side only, this turn's call becomes this card's best stat), **Peek** (see two cards in their hand), **Gamble** (luck out of 200 is the chance of ×1.5; shown before you commit).
Archetype sets the family, the hero sets the detail: tank guards against Sap and Burn, bruiser Boosts, fast Sparks, lucky Gambles, mystic Twists, rogue Saps, Locks and Peeks, star Rallies, support mends Burn and lifts neighbours. Size of X scales with rarity, and cheap cards get narrower Moves. Fifty heroes, fifty Moves, about eleven effects to test.
Examples for tone (Fable writes all fifty in F7): Kevin, "Circling Back": Exit, he goes to the top of the deck, not the bottom. Marco the rider, "Out for Delivery": Entrance, +2 energy next turn. Gaius, "Hold the Line": Sap and Burn do nothing to your side this turn.

### 3.5 Who you play

1. **Practice** against Smudge's house decks, three difficulties, no rest, no rating, small daily gold for the first three. Opens at 12 heroes and teaches the game in a guided first duel.
2. **Ranked** (O10). You play live against another player's saved defence deck, flown by the house AI. Honest reason: a closed beta will not have two people queueing at the same minute, and an empty queue kills PvP faster than anything. It still counts for both: attacker ±24 scale, defender ±8, standard Elo from 1000. The defender gets a mailbox note with a replay.
3. **Live duels** against a friend or guildmate by challenge (O16, Supabase Realtime, 30 second turns). A live ranked queue comes when the numbers online support it, falling back to a defence deck after 20 seconds.

The ranked board never includes Practice.

### 3.6 Rest (Dean's idea, and the second half of the fix)

Every hero you actually played in a ranked duel rests 20 minutes, win or lose (same `S.recover` field as raids, same gold patch-up). Heroes left in the deck unplayed do not. No tickets: rest is the limiter, so a player with thirty raised heroes plays more duels an hour than a player with twelve. Full rewards on the first ten ranked wins a day; rating always counts.

### 3.7 The table (how it looks)

Phone first, one screen, no scrolling.
- Top: their name plate with title and name colour, their three slots face down until the flip.
- Middle: **the rope**. One wide bar, your colour (gold) from the left, theirs (rift violet) from the right, the knot sliding as points land. Both totals count up digit by digit. Under it, five round pips, and three call chips for this round with the live one lit and pulsing.
- Bottom: your three slots, your hand of five fanned, an energy bar of fifteen pips that fill and drain, a Ready button, a timer ring.
- On the flip: cards turn one at a time fastest first, the called stat lifts off the card and flies into the rope, green if a Move raised it, red if it was sapped (same colours as `OS.spread`). Move names stamp across the card. Round won: the rope snaps to your side and a pip fills.
- A narrow ticker of text runs under the rope: Smudge calling the match, and the heroes answering in their own voices.
- Sound: reuse the battle pool; each arena uses its place's theme.

### 3.8 The words (ties to the Grok plan Dean approved)

One Grok call when a duel starts, never during it: send both decks' voice cards, get back a small set of lines per hero (entrance, ahead, behind, beaten by a named rival) and Smudge's calls. The browser picks from them as things happen. Lines are saved to the line pool, so the next duel with that hero can reuse them and a failed call costs nothing. Same budget cap and kill switch as raids. About $0.001 a duel.

### 3.9 Where it lives

Its own button in the main nav and its own building in the city. Dean asked if that is going too far: it is not, it is the game's missing second half, but it is the largest thing built so far. Hence the order: sim, then Practice you can play, then ranked, then live.

## 4. The city, rebuilt

The city stops being five tabs and becomes a place: one painted street scene (Grok art queue, one wide picture plus a phone crop) with six doors. On a phone the same six are large picture tiles. Each door shows one live number so the street always looks busy (lowest price of the hour, the leader's name, the guild boss's health bar).

| Door | Was | Becomes |
|---|---|---|
| The square | nothing | Notice board: this week's arena, guild boss, market movers, who just beat a boss or went up a bracket, Smudge's line of the day |
| The market | Market tab | Section 4.1 |
| The hall of records | Rankings tab | Section 4.2 |
| The guildhall | Guild tab | Section 4.3 |
| The duel hall | nothing | Section 3 |
| The post office | Friends + Mailbox | Friends, gifts, mail, live-duel challenges, sold notices |

### 4.1 The market

**What can be sold (about 530 things today):**
- Treasure: 85 pieces, shelved by the nine places.
- Junk: 63 kinds (cheap, but bench recipes need them).
- Gear: 300 live pieces, by slot (weapon, head, body, feet, charm, and each hero's own three), by rarity, by set.
- Retired gear: the 72 pieces no longer found anywhere. Their own shelf. They are the market's rare antiques and should feel like it.
- Brews: 3 tonics, 3 potions.
- Rift crates: allowed, five listings a day per seller.
**Never sold:** heroes, shards, ink, energy, cooked food, raid tickets, frames, titles, anything bought with real money. Gear must be unworn and not upgraded.

**How it works:**
- Shelves with a count and lowest price on each, a search box, and three chips that do the real work: "Missing from my cabinet", "Finishes a set I have started", "My heroes can wear it".
- Item page: the five lowest asks, a seven-day price line, last sold, how many you own, who can wear it. Buy one or buy several.
- Selling: pick from the bag, the page suggests the seven-day median, price must sit between half and four times it (stops laundering and fat-finger losses), runs 24 or 72 hours, market keeps 5%. Ten stall spots; more for gold.
- Wanted notices (second pass): post what you will pay, a seller fills it in one tap.
- Opens three days after joining at Summoning level 10. Every sale is logged; repeated sales between two accounts on one connection are flagged in admin.
- Gold arrives by mailbox with a bell alert.
The old game's Trading Hall migrations (`os_phase2e*.sql`) already solved price bands, deposits and the sale log. Lift the design, not the tables; build on `os2_listing`.

### 4.2 The hall of records

- Boards: the ledger (total level), each of the four skills and three making skills, collection %, raids (bosses beaten, fastest kill per boss), duels (season rating, ranked only), guilds (weekly haul, boss damage, duel points).
- Every board: this week, this season, all time; everyone or friends only; your own row pinned at the bottom with arrows for places gained since yesterday (nightly snapshot table).
- Top three stand on a podium with picture, frame, title and name colour. Tap anyone for their ledger and their showcase deck.
- Seasons are a calendar month. Prizes are titles, name colours and one frame per season. No power.

### 4.3 The guildhall (what a guild is for)

1. **The guild boss.** One big boss a week, shared health, weak to one group that changes weekly. Each member gets three swings a day, three heroes a swing, and **a hero can swing once a week**. Thirty members cannot win it with their best three; the guild that raised whole rosters does. This is the answer to "everyone just puts their three cards in". Rewards by guild progress, with a floor for anyone who swung.
2. **Guild levels.** Weekly hauls and boss damage give guild XP. Levels give small shared comforts (+1 stall spot, +1 gift a day, +2% work speed, capped). Never combat stats.
3. **The bench.** Post one hero for guildmates to borrow for a raid (not a ranked duel), once a day each. The owner gets a small gold tip. New players get carried, veterans get thanked.
4. **Requests.** Ask for a treasure or a piece of gear; members give from their bag. Uses the gift count.
5. **Guild duel points.** The best ten members' ranked wins each week add up on the guild board.
6. Chat, a pinned notice, and report and mute before any of it goes public.

## 5. Build order

- **O8** Groups, Moves data, duel numbers in `rules/build.py`; `rules/sim_duel.py` meets the pass marks in 3.3. Show Dean the group table and the sim results. No screens.
- **O9** Duel engine (`js/duel-engine.js`, pure and seeded) and the table screen, Practice only. Dean plays it and says if it is fun before anything else is built on it.
- **O12** Training cost steps, fresh legs, Chapters (small; can go between any two steps once Dean agrees to 2c).
- **O10** Ranked: edge function running the same engine file, defence decks, rating, rest, replays, the ranked board. Migration plus an end-to-end SQL test like the beta sign-up had.
- **O13** City street, six doors, the square, the hall of records with snapshots.
- **O14** Market, first pass (shelves, chips, item page, price band, log), then wanted notices.
- **O15** Guildhall: boss, levels, bench, requests. Moves start working in raids here.
- **O11** Duel words through Grok and the line pool (needs the raid dungeon-master work done first; they share the pool, cap and kill switch).
- **O16** Live duels by challenge, seasons and prizes.

Each step ends with screenshots at phone and desktop width that Opus has actually looked at, a patch note, and a version bump.

**Words for Fable:** F7 fifty Move names and lines, nine arena lines, the five calls, every word on the table screen and the first-duel guide. F8 the six doors, market shelves, board names, season titles. F9 guild boss, bench, requests, levels.
**Art (Grok queue):** the city street (wide and phone), six door tiles, a duel table surface per place (nine, can reuse place backdrops darkened), the rope knot, the guild boss.

## 6. Dean decides

1. Training cost steps (2c): yes or no. It is the one change that touches what players already have.
2. Does era gear count in duels, or only the hero's own kit (3.3)? Recommended: kit only at first.
3. Deck of 12 and duels opening at 12 heroes: right for how many heroes beta players actually own?
4. Rest of 20 minutes per hero played, no tickets: or would you rather tickets and no rest?
5. Ranked against defence decks first, live queue later: agreed?
6. The name. "Duels" is a working word. F7 will bring three options in Smudge's voice.
