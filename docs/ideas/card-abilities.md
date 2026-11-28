Written by: Grok
Date: 2026-11-28
Status: idea

# Card abilities: how a card gets a job

> **Note added by Claude (Opus), 28 Nov.** Two decisions have landed since this was written, both
> in `docs/`, neither changing anything in this file:
>
> - `docs/card-system.md` — one card per character with up to two faces, human cards as top-rarity
>   anomalies, and Double Entry. Your section 13 already anticipated most of it.
> - `docs/economy-loot.md` — junk loot grinds down into ink, to give it a second verb. This one
>   touches your design: the **Inky** and **Fortune** helper lanes both get more valuable once ink
>   has a second source, so Inky may want rebalancing. Worth your view.
>
> Dean has read both. Nothing here has been rewritten — this note is the only change.


This is my design for what each OverSummoned card can *do*, on top of the numbers it already has. It is an idea, not a plan. Nothing in it is built, nothing in `data/rules.json` has been changed, and Dean has not signed off on any of it.

The per-hero version (all 50 heroes, with their abilities written out) is in `card-abilities-roster.md`, next to this file. Where this file disagrees with Claude's docs, the last section says so and names the doc.

The thinking behind it: Magic: The Gathering works because a card does one thing no other card does, and because cards that share a trait light each other up. I wanted that feeling, using the game's own words (ink, ledger, Smudge) and its own fifty heroes. Nothing here is copied from another game.

Numbers on the hero entries are written level 1 to level 3, like "5 to 8".

## Contents

1. The big idea
2. The four modes
3. Front and back of the card
4. Ability types, costs and rarity
5. Keyword glossary
6. Traits and tribal combos
7. Which stats a card carries
8. Anti-stacking: keeping helpers fair
9. Level unlocks
10. The quirk pool
11. Gear synergies
12. Balance notes and open questions
13. Where this disagrees with Claude's docs
14. If Dean picks this up: how I would build it

<a id="idea"></a>
## The big idea

Every card in OverSummoned gets a job, a style and a story. Stats tell you how strong a card is. **Abilities tell you why you want it.** A card can be a mediocre duelist and the best farmer in the Archive, and both of those are good news for the person who owns it.

The design borrows the best idea from the big collectible card games: **a card does one thing that no other card does**, and cards that share a trait light each other up. It uses the game's own words (ink, ledger, Smudge) and its own fifty heroes. Nothing here is copied from another game.

- **20 trait tags.** Every card has 1 or 2. When cards share a tag, a combo switches on.
- **One signature ability per hero**, with a different effect in each of four modes: Duel, Raid, Farm and Smudge Helper.
- **Mode ratings** from S down to D for each mode, so no card is useless.
- **A quirk on every copy.** Two Florida Mans are never exactly alike. That is what makes trading interesting.
- **Level unlocks.** Level 3 sharpens the ability, level 5 opens the charm slot, level 7 adds a second ability, level 10 awakens the signature ability into a stronger form (the human card stays its own, separate card).
- **Not every card has every stat.** Luck lives on 12 cards only. Speed lives on 29. The rest do other jobs.
- **Gear that matters.** A hero's own signature gear boosts their ability. Some gear unlocks a stat the card does not normally carry.

<a id="modes"></a>
## The four modes

These are the places a card can be used. The repo already has all four. Each hero has an effect written for each.

| Mode | How it works in the game today | What abilities do here |
|---|---|---|
| **Duel** | Player against player. A deck of 12 heroes. Each turn calls one stat. Three turns a round, first to three rounds. Energy starts at 7, adds 7 a turn, caps at 20. Cost by rarity: 2 to 8 ◆. Every hero already has a Move in `rules.json` under `duel.moves`. | The signature ability **is** the existing Move, rewritten in plain keywords. No Move was changed in effect. The numbers just scale at level 3. |
| **Raid** | A team of 3 takes on a boss. Three rooms, then the fight. Room choices roll one team stat. A boss is weak or resistant to a stat. Crit chance comes from Luck, double strikes from Speed. 3 tickets, one back every 2 hours. | Raid effects are built from five raid keywords: Breach, Brace, Plunder, Patch and Second Look. |
| **Farm** | Expeditions. Anybody not in Smudge's crew can go through the rift for 1, 4 or 8 hours and bring back loot, ink and mastery. | Each hero changes what the expedition brings home, how fast it is, or how often it finds something special. |
| **Smudge Helper** | Smudge works one place. Up to 3 heroes stand behind him as crew. Each gives speed (Speed / 150) and luck (Luck / 150). This is the clicker and desktop pet mode. | Each hero feeds one of five helper lanes: Haste, Fortune, Inky, Scholar or Double Haul. Lanes have caps, so stacking cannot break it. |

<a id="anatomy"></a>
## Front and back of the card

The front is for a quick look. A player glancing across a table, or a binder page, should see **who it is, how strong it is, what it does in one line, and how it plays in each mode.** Everything else is on the back.

|  | FRONT (quick glance) | BACK (the detail) |
|---|---|---|
| **Top** | Name, energy cost (◆), rarity gem, level pips (1 to 10) | Name, rarity, serial number, the character's era and place |
| **Art** | The hero art on its backdrop. A human card could get the foil border (open question: should foil follow rarity or follow the form? see `foil-texture-and-scenario.md`). | Smaller art strip. |
| **Type line** | Trait icons (1 or 2), then archetype and species. For example: Hex, Medic - Mystic - Crow | Full trait names and what each combo does |
| **Text box** | The signature ability name, its icon, and one short rules line (the Duel text). One italic flavor line below. | The four modes in full: Duel, Raid, Farm and Helper. Level 7 and level 10 abilities, locked until earned. |
| **Stats** | The stats this card carries, in boxes: Attack, Defense, Health, plus Speed and Luck only if carried. Power in the corner. | Stat bars with what gear has added. Greyed boxes for any stat the card does not carry. |
| **Ratings** | Four small badges: D, R, F, H with the S to D letter. | The same four, with a one-line reason each. |
| **Gear** | Nothing. A row of 8 dots in rarity color shows how many slots are filled. | **All the gear:** 5 general slots (weapon, head, body, feet, charm) and 3 signature slots (weapon, armor, trinket). The charm slot is locked until level 5. |
| **Quirk and bio** | Nothing. A small star if the copy has a Golden Ink quirk. | The quirk banner for this copy and the bio paragraph. |

> In short: the front is stats, ability and ratings. The back is gear, quirk, bio and the full detail. This follows what Dean asked for: gear lives on the back.

<a id="types"></a>
## Ability types, costs and rarity

There are three kinds of ability. Players learn them once, then see them everywhere.

| Type | What it means | Examples |
|---|---|---|
| **Passive** | Always on. It works the whole time the card is in play, with no trigger and no cost. | Twist, Gamble, Crescendo |
| **Triggered** | Fires on its own when something happens, like when you play the card, when you are losing or when it is drawn. | Sap, Rally, Comeback |
| **Activated** | You choose to use it, and you pay ◆ for it. A level 7 skill on most rare and rarer cards. | Spend ◆2: Tax 1 more |

**The ◆ cost.** Activated abilities cost ◆. In a duel, that is energy, which the game already has. On a raid it is **Nerve**: the team starts with 3 and gains 1 after each room. In Smudge's helper slots there is nothing to pay with, so Activated abilities stay asleep there. That is on purpose: helpers should give steady, quiet help.

**Rarity tells you how complex a card is.** A common card is easy to understand. A rare card asks you to think about its partners. An unhinged card might do something great and something terrible in the same turn.

| Rarity | How complex its abilities are | Duel cost |
|---|---|---|
| **Common** | 1 keyword. One short line. A level 7 skill that is Passive. | 2 ◆ |
| **Uncommon** | 1 keyword plus a simple condition. Level 7 skill is Triggered or Passive. | 3 ◆ |
| **Rare** | 1 or 2 keywords. Tribal link to a trait. Level 7 skill may be Activated (◆1 to ◆2). | 4 ◆ |
| **Epic** | A keyword, a tribal clause and an Activated level 7 skill (◆2 to ◆3). | 5 ◆ |
| **Legendary** | Two effects on one card. Activated skill at ◆3. Awakened form changes how the card plays. | 6 ◆ |
| **Absurd** | A wild upside with a built-in cost. Always has a risky clause. | 7 ◆ |
| **Unhinged** | All-in cards. Huge swings and a self-inflicted cost. The most fun to play and the hardest to master. | 8 ◆ |

<a id="keywords"></a>
## Keyword glossary

Keywords are the shared vocabulary. Every card uses the same words with the same meaning, so one sentence is enough. X stands for the number printed on the card. Numbers are shown as level 1 and level 3 in the hero pages, like **5 → 8**.

| Keyword | Where | What it does |
|---|---|---|
| **Surge X (Stat)** | Duel | This card gets +X points when the turn calls that stat. Surge is why a slow tank is a star on a Health call. |
| **Comeback X** | Duel | +X points if you are losing the round when you play this card. |
| **Swagger X** | Duel | +X points if you are winning the round when you play this card. |
| **Rally X (Group)** | Duel | Every other card of that group you play this turn gets +X. Groups are the game's ages and kin, like Ancient or Birds. |
| **Lift X** | Duel | Every other card you play this turn gets +X. |
| **Mend X** | Duel | Remove Burn from your side, then Lift X. |
| **Sap X** | Duel | The other player's best card this turn loses X points. |
| **Burn X** | Duel | The other player loses X points at the start of each of the next 2 turns. |
| **Lock X** | Duel | The other player cannot play X cards of their choice (you pick) next turn. |
| **Tax X** | Duel | Their most expensive card costs X more energy next turn. |
| **Spark X** | Duel | Gain X extra energy next turn. |
| **Guard** | Duel | Your side ignores the other player's Sap and Burn this turn. |
| **Crescendo X** | Duel | +X points for each time you have already played this card in this duel. |
| **Boomerang** | Duel | When this card leaves play it goes on top of your deck, so you draw it again next turn. |
| **Twist** | Duel | This card always scores its best stat, whatever the turn calls. |
| **Gamble** | Duel | A chance to score 1.5 times its points. The chance is the card's Luck out of 250. The odds show before you commit. |
| **Peek** | Duel | Look at 2 cards in the other player's hand. |
| **Breach X%** | Raid | Your team hits the boss X% harder. |
| **Brace X%** | Raid | The boss hits your team X% softer. |
| **Plunder X%** | Raid | X% chance of one extra loot roll when the boss goes down. |
| **Patch X%** | Raid | Heal X% of the team's lost health, between rooms or before the boss. |
| **Second Look** | Raid | Retry one failed room choice. You see the result of both tries and keep the better one. |
| **Haste X%** | Helper | Smudge works X% faster. One of the five helper lanes. |
| **Fortune X%** | Helper | Smudge finds X% better loot. The luck lane, and the only lane Luck can feed. |
| **Inky X%** | Helper | Smudge earns X% more ink. |
| **Scholar X%** | Helper | Smudge earns X% more skill xp. |
| **Double Haul X%** | Helper | X% chance Smudge pulls up a second item. Already in the game as a mastery perk. |
| **◆ (Energy mark)** | Cost | The cost of an Activated ability. In a duel it is energy. On a raid it is Nerve. Helpers cannot pay, so Activated abilities do nothing in the helper slots. |
| **Nerve** | Cost | A raid resource. The team starts a raid with 3 Nerve and gains 1 more after each room. Nerve is spent on ◆ abilities. |
| **Awaken** | Level | At level 10 the card's awakened ability replaces its signature ability. It works the same on the animal card and the human card. |

<a id="traits"></a>
## Traits and tribal combos

There are 20 traits. Each card has 1 or 2. Traits do nothing by themselves. **Cards that share a trait switch on a combo.** This is how players build decks and crews, not just pile up their strongest cards.

- **In a duel:** play 2 or 3 cards with the same trait in the same turn.
- **On a raid:** 2 or 3 of the 3 team members share the trait.
- **In Smudge's helper slots:** 2 or 3 of the 3 helpers share the trait.
- **Only one combo counts per team.** If a team has two, the better one wins. This stops a team from stacking three bonuses at once.
- **A card with two traits** can start a combo with either one, but only one at a time.
- The raid and helper bonus is always one raid keyword and one helper lane per trait, at the same strength for every trait.

| Trait | Who they are | Duel: 2 in a turn | Duel: 3 in a turn | Team of 2 (Raid / Helper) | Team of 3 (Raid / Helper) |
|---|---|---|---|---|---|
| **Royal** | Crowns, thrones and ballot boxes. They give orders and everyone else lifts. | Play 2 Royals in one turn: your other cards get +2. | Play 3 Royals: your other cards get +4 and one card gets Guard. | Breach 6% / Inky 5% | Breach 12% / Inky 10% |
| **Pirate** | Raiders of every sea and fjord. They take things, sometimes yours. | Play 2 Pirates in one turn: Sap 3 on their best card. | Play 3 Pirates: Sap 6 and you draw a card. | Plunder 8% / Double Haul 4% | Plunder 16% / Double Haul 8% |
| **Mad Science** | Inventors, doctors and things with too many wires. Powered by bad ideas. | Play 2 in one turn: your next card costs 1 less energy. | Play 3: one card of yours gains Twist this turn. | Second Look 1: retry 1 failed room choice per raid / Scholar 5% | Second Look 2: retry 2 failed room choices per raid / Scholar 10% |
| **Night** | After dark, anything can happen. They see what others miss. | Play 2 in one turn: Peek at two cards in their hand. | Play 3: Peek, and Lock 1 card next turn. | Brace 6% / Haste 5% | Brace 12% / Haste 10% |
| **Swamp** | Water folk and wetland weirdos. Hard to hurt, hard to hold. | Play 2 in one turn: one of them gets Guard. | Play 3: Guard for the lot, and Mend 3. | Patch 6% / Double Haul 4% | Patch 12% / Double Haul 8% |
| **Punk** | Loud, rude and impossible to ignore. They wear the room down. | Play 2 in one turn: Burn 2 on the other player. | Play 3: Burn 4 on the other player. | Breach 6% / Inky 5% | Breach 12% / Inky 10% |
| **Florida** | Sunshine, scratch-offs and bad decisions that somehow work. | Play 2 in one turn: every Gamble gets +10% chance. | Play 3: every Gamble gets +20% and Swagger gets +3. | Plunder 8% / Double Haul 4% | Plunder 16% / Double Haul 8% |
| **Thief** | Pickpockets, jewel hunters and very polite burglars. They never leave a trace. | Play 2 in one turn: Tax 1 on their dearest card. | Play 3: Lock 1 card next turn. | Plunder 8% / Fortune 5% | Plunder 16% / Fortune 10% |
| **Sleuth** | Detectives, spies and anyone with a notebook. They know what you did. | Play 2 in one turn: Peek at one card in their hand. | Play 3: Peek, and Comeback 4 on one of them. | Second Look 1: retry 1 failed room choice per raid / Scholar 5% | Second Look 2: retry 2 failed room choices per raid / Scholar 10% |
| **Warrior** | Swords, spears and a very good reason. They hit first and hardest. | Play 2 in one turn: Surge 3 on an Attack turn. | Play 3: Surge 6 on an Attack turn. | Breach 6% / Haste 5% | Breach 12% / Haste 10% |
| **Soldier** | Uniforms, orders and medals. They fight as one unit. | Play 2 in one turn: your first card gets +3. | Play 3: Spark 1 and your first card gets +3. | Brace 6% / Haste 5% | Brace 12% / Haste 10% |
| **Showbiz** | Stars, singers and champions. They give the crowd what it wants. | Play 2 in one turn: Swagger 3 while you are ahead. | Play 3: Swagger 6 while you are ahead. | Brace 6% / Inky 5% | Brace 12% / Inky 10% |
| **Day Job** | Regular folks with regular shifts. Steady, patient, and surprisingly tough. | Play 2 in one turn: Surge 3 on a Health turn. | Play 3: Surge 5 on a Health turn and one card gets Boomerang. | Patch 6% / Scholar 5% | Patch 12% / Scholar 10% |
| **Hex** | Curses, potions and spooky friends. Their effects last. | Play 2 in one turn: your Burn lasts 1 more turn. | Play 3: your Burn lasts 1 more turn and cannot be Mended. | Brace 6% / Fortune 5% | Brace 12% / Fortune 10% |
| **Hustler** | Gamblers, speculators and politicians. They bet big. | Play 2 in one turn: every Gamble gets +10% chance. | Play 3: every Gamble gets +20% chance, and a failed Gamble is not lost. | Plunder 8% / Fortune 5% | Plunder 16% / Fortune 10% |
| **Pulp** | Characters that only ever lived on screens, shelves and arcades. They keep coming back. | Play 2 in one turn: every Crescendo gets +1. | Play 3: one card gets Boomerang. | Breach 6% / Double Haul 4% | Breach 12% / Double Haul 8% |
| **Aussie** | Beaches, outback and a good mate. They keep energy flowing. | Play 2 in one turn: Spark 1. | Play 3: Spark 2. | Patch 6% / Haste 5% | Patch 12% / Haste 10% |
| **Frost** | Ice, fjords and long winters. They slow everything down but themselves. | Play 2 in one turn: the other player's fastest card gets -3. | Play 3: their fastest card gets -6. | Brace 6% / Double Haul 4% | Brace 12% / Double Haul 8% |
| **Medic** | Doctors, lifeguards and paramedics. They keep everybody up. | Play 2 in one turn: Mend 2. | Play 3: Mend 4 and your other cards get +2. | Patch 6% / Scholar 5% | Patch 12% / Scholar 10% |
| **Beyond** | From outer space and past it. Rules do not apply. | Play 2 in one turn: one card gains Twist. | Play 3: two cards gain Twist. | Second Look 1: retry 1 failed room choice per raid / Haste 5% | Second Look 2: retry 2 failed room choices per raid / Haste 10% |

> The game also has older groups already in the code: ages (Ancient, Old World, Sail and Steam, Wartime, Neon, Today and Beyond) and kin (Dogs and Wolves, Cats, Birds and so on). Those stay exactly as they are. Arenas still favor them and some Moves Rally them. Traits are a new layer on top, and a card is both.

<a id="stats"></a>
## Which stats a card carries

Today every hero carries five stats. That makes every card feel alike. New rule: **Attack, Defense and Health are on every card** (these make Power). **Speed and Luck are optional**, and a card only carries them when it fits the character.

- **Speed** is carried by 29 heroes. The slower, heavier ones do not carry it. A card without Speed scores 0 on a Speed call and always plays after faster cards. That is its weakness. In return those cards are tougher elsewhere.
- **Luck** is carried by only 12 heroes: the gamblers, thieves, mystics and a few stars. A card without Luck is never a Gamble card, never part of the Fortune lane through stats, and cannot be a crit machine.
- **The points do not vanish.** When a card drops a stat, those points move into its two strongest remaining stats (60% to the best, 40% to the second). Its total stays the same as before, so rarity budgets (`card.hero_total`) still hold. A focused card has higher peaks and a real hole.
- **Gear in a missing stat** is ignored, with one exception: a hero's own signature **trinket** can **unlock** a stat the card does not carry, and it counts only at the trinket's own value. Speed can be unlocked this way. Luck can only be unlocked by the two trinkets with "Lucky" in the name that sit on a card without Luck: Florida Man's Lucky Scratch-Off and Maya's Lucky Stethoscope.
- **Quirks** that add Speed or Luck can only roll on cards that carry those stats.

**Power.** The repo shows Power as Attack + Defense + Health, and uses it for display only (nothing in the engine reads it for rules). Keep that formula. Because dropped points move into the trio, **the roster's average Power rises from 52.6 to 62.9 (about 20 percent)**, and the biggest jumps are on the heroes that lost Speed and Luck. This is fine for display, but compare Power only within a rarity. If Power is ever used in a rule, scale it with `power_after`, which the data file gives for every hero.

<a id="anti"></a>
## Anti-stacking: keeping helpers fair

Smudge has 3 helper slots, and raids have a team of 3. If the same bonus can stack three times, players will find the three best and nothing else matters. These rules stop that.

- **Five helper lanes.** Every helper effect belongs to one lane: Haste, Fortune, Inky, Scholar, or Double Haul. Stats feed lanes too: Speed feeds Haste, and Luck feeds Fortune.
- **Diminishing returns inside a lane.** The best helper counts 100%, the second counts 60%, the third counts 30%. Three Fortune helpers are worth about 1.9 helpers, not 3.
- **A cap on every lane.** Haste 60%, Fortune 60%, Inky 40%, Scholar 40%, Double Haul 30%. Gear and quirks count toward the cap too. (The existing crew speed cap of 75% stays as the overall ceiling.)
- **Luck is rare on purpose.** 12 cards carry it. Even a team of the top three luck cards (Eagleton, Zorp, Raspawtin) reaches about 84% before the cap, and the cap brings it to 60%. Before this design the same team reached 102%.
- **One combo per team.** Only the best Tribal Combo counts.
- **Same name, once.** If two copies of the same ability could ever be on one team, only the best one counts. (Today the crew cannot hold the same hero twice, so this is a safeguard.)
- **Raids.** Team damage bonuses from abilities cap at +50%, Brace at 30%, Plunder gives at most 1 extra loot roll, and crit chance stays capped at 50% as it is now.
- **Expeditions** do not stack, since each hero goes on their own and rolls separately.
- **Activated abilities sleep in helper slots.** Only Passive and Triggered effects help Smudge.

<a id="levels"></a>
## Level unlocks

Cards level from 1 to 10 (the repo's existing card max). Each level already adds 8% to stats. These are the new unlocks on top.

| Level | What happens | Notes |
|---|---|---|
| **3** | **Sharpened.** Every number in the signature ability goes up by half, rounded up. Surge 6 becomes Surge 9. | The hero pages show every number as level 1 → level 3. |
| **5** | **Charm slot opens.** The 5th general gear slot. | Already in the game (`slots.charm_level: 5`). |
| **7** | **Second ability.** Passive on commons, Triggered on uncommons, Triggered or Activated on rares and up. | Activated abilities cost ◆. Each hero has their own. |
| **10** | **Awaken.** The awakened ability replaces the signature ability. It is a stronger version with a new twist. | The human card is a separate card with the same stats and the same abilities. Only the picture changes. |

<a id="quirks"></a>
## The quirk pool

The first time a card is opened, it rolls **one** small quirk. It never changes, it shows on the back and it follows the card when it is traded. Quirks are small on purpose (a point or two, a few percent). A perfect copy is a trophy, and a plain copy is still a good card.

Tier odds: **Common 55%, Uncommon 28%, Rare 14%, Mythic 3%.** Quirks cannot add a stat the card does not carry. A Speed or Luck quirk is re-rolled on cards without those stats. A Grudge quirk rolls its target group when the card is opened.

| Quirk | Effect | Tier | Rolls on |
|---|---|---|---|
| **Steady Hands** | Common | +2 Defense. | any card |
| **Hearty Breakfast** | Common | +2 Health. | any card |
| **Mean Streak** | Common | +2 Attack. | any card |
| **Good Boots** | Common | +2 Speed. | only on cards that carry Speed |
| **Lucky Socks** | Common | +2 Luck. | only on cards that carry Luck |
| **Early Bird** | Common | Expeditions with this card finish 3% sooner. | any card |
| **Tidy Paws** | Common | As a helper, Smudge earns 2% more ink. | any card |
| **Sweet Tooth** | Common | Gain 10 gold every time this card wins a raid. | any card |
| **Grudge** | Uncommon | +3 points in a duel against a rival group. The group is rolled with the quirk (for example, Grudge: Pirates). | any card |
| **Show Off** | Uncommon | +2 points in a duel when you are winning the round. | any card |
| **Comeback Kid** | Uncommon | +2 points in a duel when you are losing the round. | any card |
| **Thick Skin** | Uncommon | In raids, the boss hits this card's owner 3% softer. | any card |
| **Pack Rat** | Uncommon | Expeditions have a 6% chance to bring back one extra junk item. | any card |
| **Quick Study** | Uncommon | As a helper, Smudge earns 3% more skill xp. | any card |
| **Night Owl** | Uncommon | Night expeditions with this card bring back 5% more loot. | any card |
| **Team Player** | Uncommon | Counts as one extra member of its own traits when checking Tribal Combos. Only works once per team. | any card |
| **Born Leader** | Rare | Rally, Lift and Mend on this card get +1. | any card |
| **Second Wind** | Rare | Once per duel, when this card scores 0 on a turn, it scores 5 instead. | any card |
| **Gear Head** | Rare | Gear on this card gives 5% more of its stats. | any card |
| **Eagle Eye** | Rare | In raids, the first room choice with this card on the team has a 10% better chance. | any card |
| **Trade Mark** | Rare | Cosmetic. A tiny stamp on the card back. It does nothing, but collectors love it. | any card |
| **Golden Ink** | Mythic | +1 to every carried stat and a gold shimmer on the card. Perfect copies are the ones people chase. | any card |
| **Twin Quirk** | Mythic | The card carries a second quirk, rolled from Common and Uncommon. | any card |

<a id="gear"></a>
## Gear synergies

Gear already has stats and the hero's own kit gives a bonus when worn together (+10% for two pieces, +25% for three). Synergies add a second, smarter reason to hunt gear.

- **Signature gear boosts the ability.** Every hero has a piece of their own kit named on their sheet that makes their signature ability stronger. Florida Man's Jorts of Power add to Swagger. Gaius's Scutum Shield makes his Guard last longer.
- **Signature trinkets can unlock a stat.** If the trinket has Speed and the card does not carry it, Speed comes alive at the trinket's own value. This gives slow cards a way to grow. Luck unlocks only on the two "Lucky" trinkets (Florida Man and Maya), so luck stays rare.
- **General gear is for stats.** Weapons, heads, bodies, feet and charms still just add stats and the existing skill speed. This keeps the chase simple.
- **Era sets stay as they are** (the retired era gear with its 2-piece and 3-piece bonuses). Nothing here changes it.
- **All gear sits on the back of the card.** The front never shows gear.

<a id="balance"></a>
## Balance notes and open questions

- **Power goes up about 20% on average** because dropped points move into Attack, Defense and Health. Power is display-only today. If it becomes a rule, use the `power_after` value.
- **Biggest Power jumps** are on heroes that lost both Speed and Luck: Inspector Hootsworth 44 to 79, Bella 46 to 78, Dr. Quackenstein 56 to 80, Rex Sizzle 34 to 59, Napoleon 73 to 96. If that feels too steep, send only 75% of the dropped points into the trio (the other 25% simply goes away) and the average rise falls to about 15%.
- **Cards with no Speed always play last in a duel.** Order matters when two Moves clash. Many tanks (Kevin, Doug, Bjorn, Gaius) will always be second. This is a trade-off, but the duel simulator should confirm no stat is called under 15% or over 25% of turns and no Move wins more than 70% of decks.
- **Luck shrinks to 12 cards.** Gamble now only lives where Luck lives. The three Gamble cards (Joost, Chad, Eagleton) all carry Luck, and Luck is high on them. Check Gamble doesn't get too strong with the Hustler combo (+20%).
- **Raid damage stacks from many sources** (Breach, tribal combos, quirks, raidUp gear, potions, first-kill bonus). The 50% ability cap helps, but the raid simulator should run a stacked best-case.
- **Helper lane totals** are new. Check the real feel on a long idle day: Haste 60% plus gear should not make the 75% crew speed cap meaningless.
- **Sleeping Activated abilities in helper slots.** Some legendaries are Activated at level 7. They do nothing as helpers. That is intended, but it means those cards are not great helpers after level 7. Their helper rating already reflects it.
- **Quirk re-roll?** Not decided. Letting players re-roll for shards would make trading less valuable. Suggest no re-roll for now.
- **Rally still uses the old groups** (ages and kin) so the existing Moves stay as written. Dean may want to move some of them onto traits later.
- **Showbiz is the biggest trait (10 cards)**, so its combo is intentionally the mildest. Frost, Pulp and Warrior are mid-sized. Florida, Punk, Beyond and Sleuth have only 3 cards and are the hardest to complete, so their payoffs are the strongest.
- **Human card art is not done for most heroes.** Nothing in this file depends on it. Art for the human forms is its own job.

<a id="disagree"></a>
## Where this disagrees with Claude's docs

**With `docs/direction-cards.md`, section 4 (two forms per character).**
My first draft had the human card unlock when a hero reached level 10. Claude's doc treats the human card as its own rarer chase card that people collect and trade. Those do not fit together, and Claude's version is the better one for a collecting game: a chase card should not be handed to everyone who levels the animal. So this file no longer does that. What stays at level 10 is the Awakened ability, which belongs to the character on either card. If you read an older copy that says "level 10 unlocks the True Summon", that is the idea I dropped.

**With `docs/direction-cards.md`, section 4 (same stats on both forms).**
No disagreement. The stat changes below (Speed on 29 heroes, Luck on 12) apply to the character, so both forms get them.

**With `docs/direction-cards.md`, section 5 (fixed sets, scarcity) and section 6 (Steam trading).**
A question rather than a disagreement. In section 10 (quirks) I wrote that each copy rolls a quirk and that it travels with the card when it is traded. That means each copy is a slightly different item. I believe the Steam Inventory Service can hold per-item properties, but I have not confirmed it, so check before leaning on the idea. If it cannot, the quirk becomes a thing that exists only in the web game, and the trading story stays simple.

**With `docs/smudge.md`.**
Nothing in the ability text speaks as Smudge, so there is nothing to clash with his voice. I did not write any new Smudge lines.

<a id="build"></a>
## If Dean picks this up: how I would build it

This is a sketch for whoever ends up doing the work, not a job for anyone. Only Dean hands those out.

1. Put the per-hero data (a machine-readable copy of the roster file exists on my side, one entry per hero keyed by the id in `data/rules.json`) next to `duel.moves`, not in place of it. The signature ability's Duel text is the existing Move rewritten in plain keywords. The engine effect stays `duel.moves[id].fx`, so the Duel engine does not change.
2. Numbers are written with `{n}`. Level 1 shows n. Level 3 shows ceil(n x 1.5).
3. Render only the stats a card carries. Do not draw an empty box for a stat it lacks. Power stays Attack + Defense + Health.
4. Roll the quirk once, when a copy is first opened, weighted by the tier odds. Skip any quirk that needs a stat the card does not carry. Store the quirk id on the copy and never change it.
5. Helpers use the lane rules: best 100%, second 60%, third 30%, then the lane cap. Activated abilities are ignored in helper slots.
6. Card front and back follow the table in section 3, on top of a reusable frame template with real text. See `card-frame-template.md`.
7. Traits come with their combo text. Only one combo counts per team.
8. Not built, and needing a simulator run before anything ships: Peek (two extra cards on Sterling and Vesper) and the level 7 and level 10 abilities.
9. Do not change the stats in `rules.json` until Dean says yes. The new stat set in the roster file is a proposal.
