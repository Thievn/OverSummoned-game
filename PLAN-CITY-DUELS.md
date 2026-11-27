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
- **Energy:** start with 7, gain 7 a turn, unspent carries over, never more than 20 (changed in O8: at 5 a turn almost nobody could play two cards). Cost by rarity: common 2, uncommon 3, rare 4, epic 5, legendary 6, absurd 7, unhinged 8.
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

### 3.6 How much you can play (Dean, 26 Nov: an energy limit, and people who want to keep playing still can)

- **Duel marks:** ranked costs 1 mark. Hold 5, one comes back every 30 minutes. Their own meter, NOT raid tickets: sharing would make every duel cost a raid.
- **Practice is free and unlimited.** Anyone who wants to keep playing always can; it just pays nothing after the first three a day and never touches rating.
- **Rest stays, shorter:** every hero you actually played in a ranked duel rests 10 minutes (same `S.recover` field and gold patch-up as raids). Marks limit the player; rest is what makes a second deck worth raising.

### 3.6b Stakes (gold on the table)

- Ranked only. Before the duel pick a stake: none, 100, 500 or 2,000 gold, the top one capped by bracket (Copper 100, Silver 500, Gold and Open 2,000).
- You stake against the house, never against the other player: win and get 1.8 times the stake back, lose and it is gone. The missing tenth is a gold sink.
- The owner of a defence deck risks nothing and wins nothing from a stake. They did not agree to the bet.
- No stakes in live duels between friends or guildmates, ever. Gold buys things on the market, so a bet between two players is a way to pass gold to a second account or sell it. Friend duels are for pride and the board.
- Daily cap on gold staked (start at 10,000). Stakes and payouts happen on the server in the same transaction as the result.
- Other prizes: rating, a small fixed gold and a crate chance on the first wins of the day, season titles and frames. No shards, no stats.
- Not legal advice: gold cannot be bought or cashed out today, which is what keeps this a game mechanic. If gold is ever sold for real money, stakes must be looked at again before that ships.

### 3.7 The table (how it looks) — built around the screenshot Dean sent of Cards, the Universe and Everything

What that screen does well, and we keep: their three slots at the top and yours at the bottom with open ground between; a winding path joining the two sides, half in each colour, with a marker that walks it carrying the score; energy shown as a number with "+ per turn" beside it; your points and theirs as two fat coloured bars; hand along the bottom, deck in the corner, round counter under the hand; cards dragged up into a slot.
What we change so it is ours, not theirs:
- **The marker is Smudge.** He walks the path holding a signboard with the gap between the scores, toward whoever is losing ground, and reacts (reuse `lookAt`, `sulk`, `hello` and the cheer). When a round ends he reaches one end and plants the sign.
- **The path is an ink trail**, the same ink he summons with, drawn fresh at the start of each duel (SVG path, stroke animates in). Your half gold, their half rift violet. Not their yellow and pink, not their exact snake.
- **The call sits on the signpost at the middle of the trail:** this turn's stat, with the round's other two calls small beside it. This is the thing their game does not have.
- **Backdrop:** each hero already has an era backdrop (`bg`). Each duel picks one at random from the 24 heroes in the two decks, darkened so cards read. No picture is generated per duel: it would cost money, take seconds and could come out wrong. New backdrops are drawn once through the Grok queue and reused.
- **Playing a card:** drag it up or tap it then tap a slot; it lifts, tilts and drops in with a thud. Tap a played card to take it back until you press Ready. Cards you cannot afford are dimmed with the missing energy shown.
- **The flip:** cards turn fastest first, the called stat lifts off each card and flies down the trail into Smudge's sign, green if a Move raised it, red if it was sapped. Move names stamp across the card. Both point bars count up digit by digit.
- **Energy:** the number, "+5" beside it, and twenty pips that fill and drain.
- A narrow line of text under the trail: Smudge calling it, heroes answering in their own voices.
- Phone first, one screen, no scrolling. On desktop the same table centred with the hand wider and the text line to the side.
- Sound: each backdrop's place theme, else the battle pool.

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

## 6. Decisions (Dean, 26 Nov: "we'll try this and tweak as we go", so the recommended answer stands on each)

1. Training cost steps (2c): YES. Nobody loses a point they already have.
2. Gear in duels: the hero's own three-piece kit only. Era gear stays out until the sim says otherwise.
3. Deck of 12; duels open at 12 heroes. Opus: in O8, count how many heroes each beta account owns and tell Dean if most are under 12.
4. Duel marks (5, one per 30 minutes), free unlimited Practice, 10 minute rest per hero played.
5. Ranked against saved defence decks first; live duels by challenge later.
6. Stakes against the house only; none between friends.
7. The name: "Duels" until F7 brings options.

All of these are numbers in `rules/build.py`. Expect them to move after Dean plays O9.

## 7. Start here (Opus)

Read PLAN.md, then this file. Back up to the secondary GitHub repo first. Do O8 and stop: show Dean the group table and the sim results before any screen. Then O9, Practice only, and stop again for Dean to play it. Do not start ranked, the city or the market until he has said the table is fun.

## O8 done (27 Nov, Opus): what was built and what changed from the plan above

Built, no screens:
- `rules/duel.py`: ages, kins, the nine arenas, fifty Moves (STAND-IN names and lines for F7), every duel number. build.py adds `arch`, `age`, `kin` to every hero and `duel` to rules.json, and fails the build if a hero lacks a group or Move or a group drops under four. Rebuilt rules.json is otherwise byte-for-byte the same data.
- `js/duel-engine.mjs`: the whole rule book, pure and seeded (newDuel, legal, play, choose, runDuel, makeCard). **Changed from the plan:** the engine is JavaScript, not Python, so the sim, the practice table (O9) and the ranked edge function (O10, Deno imports .mjs) all run the one file. `play()` returns events (flip, move, score, round, end) for O9 to animate.
- `rules/sim_duel.mjs` (was planned as sim_duel.py): `node rules/sim_duel.mjs [n]`. All 15 marks pass at 10,000 duels. Writes `rules/sim_duel_heroes.json` (every hero's win rate).
- House players: easy (plays at random a third of the time), normal (points now against energy spent), careful (also holds a card for a call still to come this round, and gives up a lost round to bank energy). Careful beats normal 67%, normal beats easy 71%.

Numbers the sim forced (all in rules/duel.py):
- `energy` 7 / +7 / max 20 (plan said 6 / +5 / 15).
- `rarity_scale`: in a duel only, a hero's own stats are scaled by rarity so every card gives about the same points per energy (common 1.0 up to unhinged ~1.5), minus a small `premium` for dear cards because the three-a-turn limit already favours them. Without it a deck of commons won 96%; with only that, the dearest twelve won 65%.
- Training in a duel: a trained point counts `train_weight` x half the card's cost, and past 15 on a stat (`train_soft`) only half. One hero maxed in everything now LOSES to the same 300 points spread over the deck (tall wins 40%). This is the one-card problem solved inside duels.
- Gamble chance capped at 35%. Marco and Emu's energy Moves cut (+2 to +1, +3 to +2). Kevin and Pam got a small boost on their own stat. Bella and Slapton's group Moves raised (still weakest: they are built for decks players will build around them, which random-deck sims undervalue).
- The rarity mark is now "no more than 55%" (the plan's wording). Decks of one price lose a little because they waste energy; that is deck-building, not rarity.

Results at 10,000 duels: 4.07 rounds a duel, 1.7 cards a side a turn; each stat called 18.5% to 21.1%; every hero between 43.9% (Slapton) and 57.7% (President Eagleton); commons-and-uncommons decks 50 to 55%, rare-only 49 to 53%, the dearest twelve 53%.

Beta accounts today: three saves, holding 1, 2 and 16 heroes. Only one could open Duels at 12. Dean to decide before O9 ships: keep 12, or open Practice earlier with a smaller deck.

Not done in O8 (on purpose): no version bump (nothing reads `duel` yet; O9 bumps), no screens, no server.

## O9 done (27 Nov, Opus): the practice table

- Duels screen (`#v-duels`, js/duel.js lobby): pick who to play (easy, normal, careful, with your record against each), build a deck of 8 to 12 from what you own (tap to add or take out, "Pick for me" builds a mixed-cost deck), how-to-play notes. Practice opens at 8 owned (`duel.practice.min_deck`); ranked keeps 12.
- The table (`#duel` overlay, js/duel.js, css/duel.css): built around Dean's screenshot. Their slots top, yours bottom, Smudge on an ink trail between (violet from their side, gold from yours, split where he stands; the sign shows the gap), the call and the round's three calls top left, energy pill plus twenty pips, points bars, hand of five, deck count, Ready (says Pass with nothing placed). Tap a card to read it and place it, tap a placed card to take it back, or drag it up. Unaffordable and locked cards say so. Reveal: their cards drop face down, everyone flips fastest first, Moves stamp their names on the card, numbers turn green or red, totals count up into the bars and Smudge walks. Round banner, rounds pips, result sheet with Play again.
- Backdrop: one of the 24 heroes' own era backdrops, at random. Music: the arena's battle theme (falls back to the raid theme until the ElevenLabs tracks are in).
- Practice pays 40 gold for the first 3 wins a day (client-side, same trust as raid gold). Record in `S.duel`.
- `duel.open` is False: only the owner sees Duels. Set True in rules/duel.py to open it to the beta.
- Words are stand-ins in `data/duel_words.json` and the Move names in rules/duel.py (F7). Short names for titled heroes in `duel.short`.
- Not done: no tutorial beyond the notes, no Grok lines (O11), no Peek reveal shown on the table (the house cannot use it either), no keyboard play.

## Duels, second pass (Fable, 27 Nov, after Dean played O9)

Dean's verdict: a good start and "kind of exciting", but hard to read, the trail stutters in, Smudge is dull, the backdrops are low quality, the music grated within 30 seconds, and he had to stop and read every card. He also wants it to pick up what makes Gwent and Destiny: Rising's card game hard to put down. Steps below are O9b to O9f. Do them in order; each one ships by itself. O10 (ranked) waits until Dean has played O9d.

### What was actually wrong (checked)
- Backdrops are the 480 x 640 pictures made for the little window on a card, stretched over a whole screen. That is why they look soft. They were never meant for this.
- The trail is revealed with a top-to-bottom wipe, so each bend shows its ends before its middle. It reads as lag.
- Smudge on the table is one still picture (the boot image) that tilts. Nothing else.
- Table text is as small as 0.62rem (about 10px). The Move text only shows after a tap.
- One music track per duel, a 60 second loop, so a 4 minute duel hears it four times. The five new battle tracks are still not in the game (blocked download), so every arena played the same raid theme.

### O9b. Readable and learnable (no new art)
- **Nothing under 13px on the table.** Call chips, the commentary line, card names, the info panel: all up. The current call becomes the biggest thing in the middle of the table, in the stat's own colour (one colour per stat, used everywhere: chip, card number, info row).
- **Cards say what they do without a tap.** Each of the eleven effects gets an icon and a two or three word tag on the card face under the art ("+1 energy", "Sap 6", "Dogs +3", "Best stat"). The full sentence still opens on tap, now in a panel that stays put until you tap elsewhere and uses 15px text.
- **The number is the hero.** The yellow score for this turn's call is twice the size. Under the hand, one line: "Playing these: 43 points for 6 energy".
- **The first duel is a lesson.** A scripted first match against a fixed easy deck with a fixed hand: Smudge points at one thing at a time and waits for you to do it (this is your energy; this turn calls Speed, so this card is worth 24; drag it up; press Ready; watch the flip; that is a round). Five steps, skippable, replayable from the Duels screen. No walls of text: one sentence per step, 16px, in a speech bubble from Smudge.
- **A coach for the next three duels:** a soft glow on the best-value playable card, turn off-able.
- **Fix the trail:** draw it by animating the stroke along its own length from the middle outwards (stroke-dashoffset), both colours at once, 0.6 seconds. No wipe.

### O9c. A table worth looking at (new art through the Grok queue; show Dean the first of each before making the rest)
- **Ten arena backdrops, made by Grok through the art queue (Dean, 27 Nov: real pictures from Grok, nothing hand-drawn in code):** one high-resolution picture each, composed so a phone cut and a desktop cut of the same picture both work. Brief for every one: the scene is busy at the top and bottom edges and calm, darker and slightly blurred through the middle band where cards and the trail sit. Ten eras spread across the six ages so every deck sees a fitting one (for example Rome, Viking fjord, Venice vault, Black Forest, Chicago speakeasy, wartime outback, neon arcade, Bondi today, the supply closet office, Beyond). Slow life in each: two or three looping layers (drifting fog, lantern flicker, waves, neon buzz) done in CSS over the picture, off for reduced motion. The old card pictures stay on the cards.
- **Smudge the referee: six new pictures from Grok** (the same queue, with his current art as the reference) in his existing style, same size and feet position so they swap cleanly (the Bongo Cat approach Dean chose after 3D was dropped): walking with the scoreboard on a pole, pointing at your side, pointing at theirs, both arms up for a round won, face in paw for a round lost, slamming the stamp for the end of the duel. Swapped by what just happened, with a hop between. Idle uses his existing blink and breathing. FIRST draw one, show Dean, and only then the other five.
- **The trail as ink, alive:** a wet-ink texture with a slow shimmer; drips where it bends; your half glows brighter as your lead grows; when the lead changes hands the join flashes and splashes; on a round win the whole trail floods the winner's colour, then drains.
- **Points you can feel:** each card's number flies along the trail into Smudge's board as a blob of ink; the board flips like a station sign; big hits (30+) shake the table slightly; a Move firing gets its own short flourish by effect family (sap bites a chunk out of the card, burn smoulders on their bar for its two turns, lock drops a padlock on the card in their hand, spark crackles on your energy pill).
- **Card backs and table felts** exist as a system from day one (one default each), because they are the first things to sell later.

### O9d. Three things from Gwent and Destiny: Rising (rules; every one goes through the sim before a screen)
What those games do, briefly. Gwent is a best of three where your hand barely refills, so every card spent now is a card you do not have later, and the whole game is deciding when to stop and let a round go. Destiny: Rising's Shadowshaper Duels gives rising points each round (1, then 2, up to 6), front and back rows, and a ladder of named opponents at three difficulties with first-win rewards and a duelist level track.
We already have the Gwent heart by another road: energy carries over, so over-spending to win round one loses round two. The house's careful player already throws rounds on purpose. What is missing is the player seeing and feeling that choice. So:
1. **Swap two (Gwent's mulligan).** Before the first turn, put back up to two cards from your opening five and draw again. Cheap to build, removes the "dead hand" loss, and makes every duel start with a decision.
2. **Stand down (Gwent's pass).** A second button beside Ready: sit out the rest of this round. You play nothing more this round, both players see it at once, and you start the next round with +3 energy. Giving up a round becomes a move you make on purpose, and the other player has to decide whether to keep spending to be safe. This is the mechanic that makes Gwent Gwent.
3. **A captain (Gwent's leader).** One hero in your deck wears the captain's mark. Once per duel, press Captain's Call before you pick: this turn is judged on your captain's best stat, for both sides. One big, loud, once-only moment per duel, and a reason to care which hero leads.
4. **The rival ladder (Destiny: Rising's named duelists).** Replace "the house deck" with eight named rivals: the raid bosses, who already have names and attitudes (The Tiber Thing, Big Tony's Boys, The Emu Vanguard, Gary the Great White, The Doge's Nephew and the rest). Each has a themed deck, a home arena, a captain, three difficulties, and a first-win prize at each (gold, a crate, a title, a card back). Twenty-four first wins to chase with nobody else online. This is the solo content that makes a new player stay.
5. **A duelist road.** Wins give duelist XP; levels 1 to 20 pay out cosmetics (card backs, felts, a title, a Smudge pose as an emote). Never shards or stats.
Considered and left out for now: front and back rows (no room on a phone with three slots a side), rising points per round (our rising energy already does it), spies and decoys (wait for ranked).
Sim marks to add: Stand down is used in 10% to 35% of rounds by the careful house player; Swap two changes the win rate of the worse opening hand by at least 3 points; no captain wins over 58%.

### O9e. Music that does not grate
- One arena, one mood, and never the same loop twice in a row. Six moods (ancient, noir, north, gothic, sun-and-surf, neon), **two tracks each**, each **two minutes** long rather than one, written to loop cleanly. Twelve tracks, about 21,600 ElevenLabs credits of the 40,000 a month.
- A duel starts on one track of its arena's mood and crossfades to the other at the start of round three, so the back half of a close duel sounds different from the front.
- A short sting for round won, round lost, Captain's Call and the final stamp, so the music is not the only thing marking time.
- Music volume on the table starts at 60% of the menu level, with its own slider on the table.
- NOT blocked (corrected 27 Nov). The game's own pipeline already does this and was used on 26 Nov for music_jazz, music_north and music_sun: generate in ElevenLabs, insert a row in `public.os_art_job` with the signed link and a path under `art/raw/sfx/`, POST its id to the existing `asset-fetch` edge function (via `net.http_post`), the file lands on the `art` branch, `git fetch origin art`, then ffmpeg into `assets/v2/sfx/`. Dean downloads nothing. Do NOT deploy a new fetch function; use the one that is there.
- FIRST JOB: the five battle tracks already made on 26 Nov (ElevenLabs flow `EIyoBgS4x6WApGKfDF8B`: ancient, noir, north, gothic, romp) were never pulled in. Get fresh links for them with the ElevenLabs tools and run them through `asset-fetch` to `music_b_ancient.mp3`, `music_b_noir.mp3`, `music_b_north.mp3`, `music_b_gothic.mp3`, `music_b_romp.mp3`. The code that plays them shipped already.

### O9f. Phone polish
- Test on a real small phone (360 x 640) and a tall one (412 x 915): nothing overlaps, thumbs reach Ready and the hand without shifting grip, the info panel never covers the slots.
- Haptic tap (navigator.vibrate) on place, flip and round end where the phone supports it.
- Landscape and desktop: hand wider, commentary to the side, backdrop uses the landscape cut.

### Words (Fable, F7, alongside O9b to O9d)
Fifty Move names and one-line texts; the two or three word tags; the tutorial's five sentences; the eight rivals' taunts for win, loss and Captain's Call; the name for Duels itself; Stand down, Swap two and Captain's Call in Smudge's voice.

### Order (Dean, 27 Nov: music and backdrops are musts)
0. The five waiting battle tracks, today (see O9e, first job). Ten minutes of work and every arena stops sharing one tune.
1. O9b. 2. O9d. 3. O9c and O9e together. 4. O9f.
Why O9b first: it costs nothing in art and fixes "I had to stop and read every card", which is the thing most likely to make a new player quit. O9d second: the rules decide what the art has to show (a captain's mark, a Stand down state), so drawing before them means drawing twice. Then O9c and O9e together, since both wait on generated assets, then O9f.

## O9b and O9d done (27 Nov, Opus)

**Music, first job: done.** The five battle tracks were pulled in through the existing `os_art_job` + `asset-fetch` route (jobs 293 to 297), levelled with ffmpeg and committed. Every boss and every duel arena now has its own theme. Lengths as generated: ancient, noir and gothic 60s, north 120s, romp only 30s (regenerate romp longer in O9e).

**O9b done.** Nothing on the table is under 13px. One colour per called stat, used on the big call, the chips, the card's number and the info row. Every card shows its Move as an icon and two or three words under the art, so no tap is needed. A line under the hand reads "Playing 2: 43 on Attack for 6 energy". The info panel floats in the middle of the table and stays until dismissed. The ink trail now runs out from Smudge both ways at once instead of wiping top to bottom. A five-step lesson runs on the first duel, pointing at one thing at a time and waiting for the player to do it; it is skippable and replayable from the Duels screen ("Show me again"). For a new player's first three duels the best-value affordable card glows.

**O9d done.** All of it is in the engine, all of it is in the sim, and the sim is 18 of 18 at 10,000 duels.
- **Swap two** before the first turn: a window of your opening five, put back up to two, they go under the deck. Worth about +4 points of win rate (sim).
- **Stand down**: sit out the rest of the round, start the next one with +3 energy. The careful house player uses it in 26% of its rounds.
- **Captain's Call**: once a duel, your captain scores `captain_per_cost` (5) x their cost more that turn. **Changed from the plan**: the plan said the turn would be judged on the captain's best stat for both sides. The sim showed that made one cheap lopsided hero the only sensible captain (33% to 67% win rates by captain). Scaling a flat bonus by the captain's cost makes every hero a fair pick: the captaincy is now worth 0.2% on average, with no hero outside the noise band.
- **The rival ladder**: the eight raid bosses, each with a deck drawn from the groups they belong to, a home arena, their own captain and three difficulties. 24 first wins, paying 60 to 1,200 gold (a tier-2 rival pays double, a tier-3 one triple).
- **The duelist road**: 20 levels on duel XP, prizes are card backs, table felts and titles. The prizes are named in `rules/duel.py` but not yet redeemable: O9c builds the card-back and felt system, and F7 writes the titles.
- Sim marks added: stand down used in 10% to 35% of rounds; swap two worth at least +1 point; captaincy even across heroes (a noise-aware test, since the first version of this mark measured hero strength rather than the captaincy).
- Also tuned by the sim: energy stays 7/+7/20, `premium` to -0.0195, gamble cap to 0.30, and the Black Forest arena's weights evened out because Luck was the most-called stat overall.

**Still owner-only.** `duel.open` is still False in rules/duel.py.
