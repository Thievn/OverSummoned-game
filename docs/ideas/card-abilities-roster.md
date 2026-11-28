Written by: Grok
Date: 2026-11-28
Status: idea

# Card abilities: the roster, one entry per hero

This is the per-hero half of `card-abilities.md`. Read that file first, because it explains the keywords, traits, lanes and levels used below.

Everything here is a proposal. The stats on each entry are my suggested new stat sets, not what is in `data/rules.json` today. Each entry shows what the old Power was so you can see the change.

One note on level 10: the "Awakened" ability in each entry is a stronger version of the signature ability. It belongs to the character on either card (animal or human). It does not unlock the human card. `card-abilities.md` explains why.

<a id="heroes"></a>
## The roster

Order follows `data/rules.json` (by rarity, then roughly by theme). Each entry: traits, stats carried, mode ratings (Duel, Raid, Farm, Helper), the signature ability in every mode, level 7 ability, awakened ability and gear synergies.

| Hero | Rarity | Traits | D | R | F | H | Signature |
|---|---|---|---|---|---|---|---|
| [Kevin Latham](#h-kevin) | common | Day Job | B | C | A | B | Circling Back |
| [Marco Reyes](#h-marco) | common | Day Job | B | D | A | A | Out for Delivery |
| [Maya Washington](#h-maya) | uncommon | Medic, Day Job | B | A | A | B | Triage |
| [Brokk](#h-brokk) | uncommon | Warrior, Frost | B | A | B | C | Stick, Mostly |
| [Gaius Marcellus](#h-gaius) | rare | Warrior | A | B | D | C | Hold the Line |
| [Edith Crane](#h-edith) | rare | Mad Science, Day Job | C | B | A | B | Before Breakfast |
| [Doctor Albrecht](#h-albrecht) | rare | Hex, Medic | B | C | B | A | More Leeches |
| [Vincenzo Moretti](#h-vincenzo) | epic | Thief, Hustler | A | C | B | A | A Friendly Word |
| [Will Slapton](#h-slapton) | legendary | Showbiz | A | B | C | B | Top Billing |
| [Napoleon Bone-apart](#h-napoleon) | epic | Royal, Soldier | B | A | D | C | Top Shelf |
| [Cleocatra](#h-cleocatra) | legendary | Royal, Showbiz | S | B | B | A | Royal Audience |
| [Captain Blackbear](#h-blackbear) | epic | Pirate | A | B | B | B | Lit Fuse |
| [Astrid Ironhowl](#h-astrid) | rare | Pirate, Warrior | A | B | C | B | Bored of Winning |
| [Kenji Shibata](#h-kenji) | rare | Warrior | B | C | B | A | For the Biscuit |
| [General Emu](#h-emu) | absurd | Soldier, Aussie | A | B | A | A | Never Lost a War |
| [Frau Troffea](#h-troffea) | uncommon | Showbiz, Hex | C | C | B | A | Catching |
| [Joost van der Bloem](#h-joost) | uncommon | Hustler | D | D | S | B | One More Bulb |
| [Chad Hodler](#h-chad) | common | Hustler, Florida | D | D | A | C | Buying the Dip |
| [Bella Pawsworth](#h-bella) | rare | Showbiz, Florida | B | C | B | A | Do It for the Feed |
| [Florida Man](#h-florida) | absurd | Florida, Swamp | S | B | B | C | Hold My Drink |
| [Lola Vixen](#h-lola) | epic | Showbiz, Thief | B | C | B | A | Encore, Monsieur |
| [Morwenna Duskwing](#h-morwenna) | rare | Hex, Night | B | C | B | A | Wrong Candle |
| [Sable Quickpaw](#h-sable) | rare | Thief, Pirate | A | B | B | B | Rinsed |
| [Jacko Riley](#h-jacko) | uncommon | Aussie, Medic | C | B | A | B | Between the Flags |
| [Raspawtin](#h-raspawtin) | unhinged | Hex, Frost | S | B | A | B | Seconds, Please |
| [Mad Jack Ramsbottom](#h-madjack) | unhinged | Soldier | A | B | D | C | Longbow, 1944 |
| [Vesper Nightshade](#h-vesper) | epic | Night, Punk | B | B | B | A | Not on the List |
| [Roxy Riot](#h-roxy) | rare | Punk | B | D | C | A | Soundcheck |
| [Jazzmin Sweat](#h-jazzmin) | uncommon | Showbiz, Pulp | C | D | B | A | And Again! |
| [Captain Stella Comet](#h-stella) | legendary | Pulp, Beyond | A | B | C | B | Next Week's Episode |
| [Pixel Pam](#h-pam) | common | Pulp | C | D | A | A | Extra Life |
| [Gorm the Mighty](#h-gorm) | absurd | Pulp, Warrior | A | B | D | C | Immediate Area |
| [Commander Flap](#h-flap) | rare | Pulp, Frost | C | C | B | A | Thirty Years Late |
| [Sgt. Max Carnage](#h-max) | epic | Soldier, Pulp | A | C | C | B | Out of Retirement |
| [Rex Sizzle](#h-rex) | uncommon | Punk, Showbiz | C | C | B | A | Power Ballad |
| [El Ajolote Dorado](#h-ajolote) | legendary | Showbiz, Swamp | A | B | B | B | Grows Back |
| [Doug from Accounts](#h-doug) | common | Day Job, Swamp | C | A | B | B | Denied |
| [Bjorn the Twice-Dead](#h-bjorn) | common | Pirate, Frost | C | B | A | C | Declared Dead |
| [Mona Lisard](#h-mona) | uncommon | Thief, Sleuth | B | C | B | A | Whatever You See |
| [Dusty Belle](#h-dusty) | uncommon | Aussie | B | C | A | B | Eleven Years of Opinions |
| [Inspector Hootsworth](#h-hootsworth) | rare | Sleuth, Night | B | B | B | A | The Stare |
| [Agent Sterling Stoat](#h-sterling) | rare | Sleuth | B | B | B | A | Whose Side |
| [Dolly LaRue](#h-dolly) | rare | Aussie, Showbiz | B | A | B | B | Singing to You |
| [Gladius Maximus](#h-gladius) | rare | Warrior, Showbiz | A | B | C | B | No Shirt Required |
| [Dr. Quackenstein](#h-quack) | epic | Mad Science, Medic | B | C | B | A | More Lightning |
| [Selene Nightbloom](#h-selene) | epic | Thief, Night | A | B | B | B | Invited Back |
| [Unit B33-P](#h-beep) | epic | Beyond, Mad Science | B | B | A | B | Slightly On Fire |
| [Pharaoh Tutankhamoose](#h-tut) | legendary | Royal, Swamp | A | B | C | B | Wrong Continent |
| [President Baldwin Eagleton](#h-eagleton) | absurd | Royal, Hustler | D | D | S | B | Recount |
| [Zorp, Destroyer of Tuesdays](#h-zorp) | unhinged | Beyond, Mad Science | B | C | B | A | Definitely a Human |

<a id="h-kevin"></a>
### Kevin Latham

*Office Worker · Sloth · Today* · **Common** · 2 ◆ · Traits: **Day Job**

*"One more sip, then he will get right on it."*

**Stats:** ATK 8 · DEF 16 · HP 24 · SPD - · LCK - · Power 48 (was 39) · Does not carry: Speed, Luck

**Ratings:** Duel **B** · Raid **C** · Farm **A** · Helper **B**

**Signature: Circling Back** (Triggered)

- **Duel:** Boomerang. When this card leaves play it goes on top of your deck. Surge 5→8 (Health).
- **Raid:** Slow and Steady. Brace 8→12%: the boss hits 8→12% softer while Kevin is still standing.
- **Farm:** Long Nap. Sent on an expedition, he brings back 10→15% more gold. The trip takes 5% longer.
- **Helper (Scholar lane):** Meeting Notes. Smudge earns 5→8% more skill xp.

**Level 7: Fresh Pot** (Passive). Kevin gains Guard. The mug is never empty, so neither is his patience.

**Level 10, Awakened: Out of Office, For Good.** Surge 10 (Health). His Guard now covers your whole side for two turns, and Boomerang also draws him straight back into your hand.

**Gear synergy:** *Bottomless Mug*: Trinket. Surge turns that call Health get +3 more. Unlocks Speed here, at the gear's own value.

<a id="h-marco"></a>
### Marco Reyes

*Delivery Rider · Greyhound · Today* · **Common** · 2 ◆ · Traits: **Day Job**

*"Hot food, cold drinks, and a bike that has never once stopped."*

**Stats:** ATK 13 · DEF 4 · HP 9 · SPD 25 · LCK - · Power 26 (was 24) · Does not carry: Luck

**Ratings:** Duel **B** · Raid **D** · Farm **A** · Helper **A**

**Signature: Out for Delivery** (Triggered)

- **Duel:** Spark 1→2. Gain 1→2 extra energy next turn.
- **Raid:** Express Lane. The first room is skipped and counts as cleared. Once per raid.
- **Farm:** Out for Delivery. Expeditions with Marco come back 8→12% sooner.
- **Helper (Haste lane):** Rush Hour. Smudge works 6→9% faster.

**Level 7: Five Stars** (Passive). Marco gains Spark 1 when he is drawn, so he pays for himself.

**Level 10, Awakened: Rider of the Year.** Spark 3. When you play Marco, your next card this turn costs 1 less energy.

**Gear synergy:** *Thermal Delivery Bag*: Armor. Spark gets +1 energy.

<a id="h-maya"></a>
### Maya Washington

*Paramedic · Golden Retriever · Today* · **Uncommon** · 3 ◆ · Traits: **Medic + Day Job**

*"Stay with me. You are doing great. Look at the dog."*

**Stats:** ATK 6 · DEF 15 · HP 25 · SPD 21 · LCK - · Power 46 (was 39) · Does not carry: Luck

**Ratings:** Duel **B** · Raid **A** · Farm **A** · Helper **B**

**Signature: Triage** (Triggered)

- **Duel:** Mend 3→5. Remove Burn from your side. Your other cards this turn get +3→5.
- **Raid:** Triage. Patch 10→15%: the team heals 10→15% of its health before the boss fight.
- **Farm:** Field Kit. Any hero sent out alongside Maya comes home with 8→12% less rest time.
- **Helper (Scholar lane):** Teaching Hospital. Smudge earns 6→9% more skill xp, and crew rest 5→8% faster.

**Level 7: Steady Hands** (Triggered). When you play Maya, remove Burn from your side and draw a card if you were behind.

**Level 10, Awakened: Chief Paramedic.** Mend 6. Also, your lowest-scoring card this turn cannot lose points to Sap.

**Gear synergy:** *Trauma Shears*: Weapon. Mend gets +1 for each Medic you play this turn. *Lucky Stethoscope*: Trinket. Unlocks Luck here, at the gear's own value.

<a id="h-brokk"></a>
### Brokk

*Ice Age Hunter · Badger · Ice Age* · **Uncommon** · 3 ◆ · Traits: **Warrior + Frost**

*"He found fire and a stick. He has not asked for more."*

**Stats:** ATK 21 · DEF 7 · HP 28 · SPD - · LCK - · Power 56 (was 42) · Does not carry: Speed, Luck

**Ratings:** Duel **B** · Raid **A** · Farm **B** · Helper **C**

**Signature: Stick, Mostly** (Triggered)

- **Duel:** Surge 5→8 (Attack). +5→8 points when the turn calls Attack.
- **Raid:** Spear Throw. Breach 10→15% on the first round of a boss fight.
- **Farm:** Cave Cache. Expeditions to the Fjord bring back 10→15% more loot.
- **Helper (Double Haul lane):** Dig In. 5→8% chance Smudge pulls up a second item.

**Level 7: First Fire** (Triggered). When you play Brokk with another Frost card, both get +3 points.

**Level 10, Awakened: Mammoth Hunter.** Surge 8 (Attack). Brokk is immune to Sap while a Frost card is beside him.

**Gear synergy:** *Mammoth-Tusk Spear*: Weapon. Surge gets +2. *First Fire*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-gaius"></a>
### Gaius Marcellus

*Legionary · Bulldog · Rome, 79 AD* · **Rare** · 4 ◆ · Traits: **Warrior**

*"Hold the line, friends. The line is us."*

**Stats:** ATK 9 · DEF 30 · HP 35 · SPD - · LCK - · Power 74 (was 61) · Does not carry: Speed, Luck

**Ratings:** Duel **A** · Raid **B** · Farm **D** · Helper **C**

**Signature: Hold the Line** (Triggered)

- **Duel:** Guard. Your side ignores the other player's Sap and Burn this turn.
- **Raid:** Shield Wall. Brace 12→18% for the whole fight if two Warriors stand on the team.
- **Farm:** Marching Orders. Expeditions are 5→8% more likely to bring back gear.
- **Helper (Haste lane):** Quick March. Smudge works 4→6% faster.

**Level 7: Tortoise Formation** (Activated, ◆2). Spend ◆2: a Warrior you play this turn gets Guard too.

**Level 10, Awakened: Legion Eagle.** Guard. Your side also gains +4 points on any Defense turn.

**Gear synergy:** *Scutum Shield*: Armor. Guard lasts one extra turn. *Legion Eagle Pin*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-edith"></a>
### Edith Crane

*Engineer · Beaver · London, 1880s* · **Rare** · 4 ◆ · Traits: **Mad Science + Day Job**

*"It will work if you stop poking it. Stop poking it."*

**Stats:** ATK 10 · DEF 17 · HP 29 · SPD 22 · LCK - · Power 56 (was 51) · Does not carry: Luck

**Ratings:** Duel **C** · Raid **B** · Farm **A** · Helper **B**

**Signature: Before Breakfast** (Triggered)

- **Duel:** Lift 2→3. Your other cards this turn get +2→3.
- **Raid:** Quick Fix. Second Look: once per raid, retry a failed room choice.
- **Farm:** Spare Parts. Expeditions bring back 12→18% more parts for gear upgrades.
- **Helper (Inky lane):** Steam Press. Smudge earns 5→8% more ink.

**Level 7: Rigged Up** (Triggered). When you play Edith, the next gear piece you equip costs 10% less gold to upgrade.

**Level 10, Awakened: Master Engineer.** Lift 5. Every Mad Science card you play with her this turn gets Guard.

**Gear synergy:** *Pocket Blueprint*: Trinket. Lift gets +1 for each gear piece Edith wears.

<a id="h-albrecht"></a>
### Doctor Albrecht

*Plague Doctor · Crow · 1348* · **Rare** · 4 ◆ · Traits: **Hex + Medic**

*"Hold still. The leeches know exactly what to do."*

**Stats:** ATK 25 · DEF 7 · HP 13 · SPD - · LCK 32 · Power 45 (was 41) · Does not carry: Speed

**Ratings:** Duel **B** · Raid **C** · Farm **B** · Helper **A**

**Signature: More Leeches** (Triggered)

- **Duel:** Burn 3→5. The other player loses 3→5 points at the start of each of the next 2 turns.
- **Raid:** More Leeches. The boss loses 3→5% of its health every round.
- **Farm:** Herb Pouch. Expeditions have a 8→12% chance to bring back a potion ingredient.
- **Helper (Fortune lane):** Reading the Signs. Smudge finds 6→9% better loot.

**Level 7: Plague Mask** (Activated, ◆2). Spend ◆2: the other player loses 2 more points from Burn this turn.

**Level 10, Awakened: The Great Cleanse.** Burn 6. Burn now lasts 3 turns and cannot be removed.

**Gear synergy:** *Leech Jar*: Weapon. Burn gets +1. *Herb Pomander*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-vincenzo"></a>
### Vincenzo Moretti

*Gangster · Weasel · Chicago, 1927* · **Epic** · 5 ◆ · Traits: **Thief + Hustler**

*"A friendly word. Just one. You will remember it."*

**Stats:** ATK 24 · DEF 9 · HP 15 · SPD 25 · LCK 26 · Power 48 (was 48) · Carries all five

**Ratings:** Duel **A** · Raid **C** · Farm **B** · Helper **A**

**Signature: A Friendly Word** (Triggered)

- **Duel:** Tax 2→3. The other player's most expensive card costs 2→3 more energy next turn.
- **Raid:** Protection Racket. Plunder 12→18%: a boss pays out an extra loot roll.
- **Farm:** Collecting. Expeditions bring back 10→15% more gold.
- **Helper (Fortune lane):** Skim Off the Top. Smudge finds 7→11% better loot.

**Level 7: Make an Offer** (Activated, ◆3). Spend ◆3: pick a card in their hand. It costs 2 more next turn.

**Level 10, Awakened: The Godfather's Favor.** Tax 3. Their dearest card also scores 3 less this round.

**Gear synergy:** *Lucky Silver Dollar*: Trinket. Tax gets +1.

<a id="h-slapton"></a>
### Will Slapton

*Leading Man · Peacock · Hollywood* · **Legendary** · 6 ◆ · Traits: **Showbiz**

*"Take the shot from the left. That is the good side."*

**Stats:** ATK 20 · DEF 19 · HP 37 · SPD 32 · LCK - · Power 76 (was 63) · Does not carry: Luck

**Ratings:** Duel **A** · Raid **B** · Farm **C** · Helper **B**

**Signature: Top Billing** (Triggered)

- **Duel:** Rally 8→12 (Wartime). Your other Wartime cards this turn get +8→12.
- **Raid:** Hero Shot. The first time a team member would fall, they stay up on 1 health.
- **Farm:** Press Tour. Expeditions earn 8→12% more ink.
- **Helper (Inky lane):** Fan Mail. Smudge earns 7→11% more ink, and crew feel fresh 5→8% longer.

**Level 7: Roll Camera** (Activated, ◆3). Spend ◆3: your Wartime cards this turn get +4 more.

**Level 10, Awakened: Lifetime Achievement.** Rally 12 (Wartime). If you are ahead, every Showbiz card gets +4 more.

**Gear synergy:** *Walk of Fame Star*: Trinket. Rally gets +2.

<a id="h-napoleon"></a>
### Napoleon Bone-apart

*Emperor · Corgi · France, 1805* · **Epic** · 5 ◆ · Traits: **Royal + Soldier**

*"Short? I prefer to say compact and well organized."*

**Stats:** ATK 20 · DEF 34 · HP 42 · SPD - · LCK - · Power 96 (was 73) · Does not carry: Speed, Luck

**Ratings:** Duel **B** · Raid **A** · Farm **D** · Helper **C**

**Signature: Top Shelf** (Triggered)

- **Duel:** Comeback 8→12. +8→12 points if you are losing the round when you play it.
- **Raid:** Grand Strategy. Breach 10→15% when the team has a Soldier or a Royal.
- **Farm:** Campaign Season. Expeditions are 12→18% more likely to find gold.
- **Helper (Scholar lane):** War Council. Smudge earns 6→9% more skill xp.

**Level 7: Stand on the Stepladder** (Triggered). When you play Napoleon while losing, you also draw a card.

**Level 10, Awakened: Emperor of Everything.** Comeback 14. If you are ahead, Royal and Soldier cards get +4 instead.

**Gear synergy:** *Imperial Stepladder*: Trinket. Comeback gets +2. Unlocks Speed here, at the gear's own value.

<a id="h-cleocatra"></a>
### Cleocatra

*Queen of the Nile · Egyptian Cat · Alexandria, 40 BC* · **Legendary** · 6 ◆ · Traits: **Royal + Showbiz**

*"Nine lives, nine palaces, and not one dull afternoon."*

**Stats:** ATK 22 · DEF 18 · HP 26 · SPD 25 · LCK 20 · Power 66 (was 66) · Carries all five

**Ratings:** Duel **S** · Raid **B** · Farm **B** · Helper **A**

**Signature: Royal Audience** (Triggered)

- **Duel:** Lift 4→6. Your other cards this turn get +4→6.
- **Raid:** Nine Lives. Once per raid, if the team would be wiped out, everyone is back up at 30% health.
- **Farm:** Tribute. Expeditions bring back 10→15% more of every drop.
- **Helper (Fortune lane):** Royal Favor. Smudge finds 9→14% better loot.

**Level 7: The Court Rises** (Activated, ◆3). Spend ◆3: Royal cards you play this turn get Lift 3 too.

**Level 10, Awakened: Queen of the Nile.** Lift 8. A Royal card you play this turn cannot lose points to Sap or Burn.

**Gear synergy:** *Collar of Isis*: Armor. Lift gets +2 when two Royals are in play.

<a id="h-blackbear"></a>
### Captain Blackbear

*Pirate Captain · Black Bear · Caribbean, 1717* · **Epic** · 5 ◆ · Traits: **Pirate**

*"Fire the cannon! No, the other cannon. The one that is not him."*

**Stats:** ATK 45 · DEF 10 · HP 37 · SPD - · LCK - · Power 92 (was 73) · Does not carry: Speed, Luck

**Ratings:** Duel **A** · Raid **B** · Farm **B** · Helper **B**

**Signature: Lit Fuse** (Triggered)

- **Duel:** Sap 8→12. The other player's best card this turn loses 8→12 points.
- **Raid:** Boarding Party. Breach 12→18% on the first two rounds.
- **Farm:** Plunder the Cargo. Expeditions bring back 12→18% more gear drops.
- **Helper (Double Haul lane):** Shiver Me Timbers. 6→9% chance Smudge pulls up a second item.

**Level 7: Light the Fuse** (Activated, ◆2). Spend ◆2: Sap hits their best card for 4 more.

**Level 10, Awakened: Terror of the Seven Seas.** Sap 14. Pirates you play this turn Sap for 3 too.

**Gear synergy:** *Boarding Cutlass*: Weapon. Sap gets +2. *Smoking Beard Fuse*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-astrid"></a>
### Astrid Ironhowl

*Shield-Maiden · Wolf · Norway, 870* · **Rare** · 4 ◆ · Traits: **Pirate + Warrior**

*"We sing before we fight. The songs are shorter than the arguments."*

**Stats:** ATK 39 · DEF 24 · HP 13 · SPD - · LCK - · Power 76 (was 56) · Does not carry: Speed, Luck

**Ratings:** Duel **A** · Raid **B** · Farm **C** · Helper **B**

**Signature: Bored of Winning** (Triggered)

- **Duel:** Rally 4→6 (Old World). Your other Old World cards this turn get +4→6.
- **Raid:** Raid Song. Breach 8→12% while a Pirate or Frost card is also on the team.
- **Farm:** Longship. Expeditions to the Fjord bring back 10→15% more loot.
- **Helper (Haste lane):** Row Together. Smudge works 5→8% faster.

**Level 7: Shield Maiden's Oath** (Triggered). When your side would lose points to Sap, Astrid gives that card +3 instead.

**Level 10, Awakened: Ironhowl.** Rally 8 (Old World). Pirates and Warriors in that group get Guard.

**Gear synergy:** *Bearded Axe*: Weapon. Rally gets +1. *Mead Horn*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-kenji"></a>
### Kenji Shibata

*Ronin · Shiba Inu · Japan, 1640* · **Rare** · 4 ◆ · Traits: **Warrior**

*"A good dog never draws first. A good dog finishes."*

**Stats:** ATK 28 · DEF 6 · HP 10 · SPD 34 · LCK - · Power 44 (was 38) · Does not carry: Luck

**Ratings:** Duel **B** · Raid **C** · Farm **B** · Helper **A**

**Signature: For the Biscuit** (Triggered)

- **Duel:** Surge 4→6 (Speed). +4→6 points when the turn calls Speed.
- **Raid:** Single Strike. The first hit of every boss fight is a guaranteed crit.
- **Farm:** Wandering Blade. Short expeditions take 10→15% less time.
- **Helper (Haste lane):** Quick Paws. Smudge works 8→12% faster.

**Level 7: Honorable Rice Ball** (Triggered). When you play Kenji on a Speed turn, draw a card.

**Level 10, Awakened: Ronin of the Mountain.** Surge 8 (Speed). Kenji always plays first in a Move clash.

**Gear synergy:** *Katana 'Good Boy'*: Weapon. Surge gets +2.

<a id="h-emu"></a>
### General Emu

*Undefeated Commander · Emu · Australia, 1932* · **Absurd** · 7 ◆ · Traits: **Soldier + Aussie**

*"The enemy had tanks. We had enthusiasm. We both ran out of tanks."*

**Stats:** ATK 39 · DEF 13 · HP 26 · SPD 48 · LCK - · Power 78 (was 72) · Does not carry: Luck

**Ratings:** Duel **A** · Raid **B** · Farm **A** · Helper **A**

**Signature: Never Lost a War** (Triggered)

- **Duel:** Spark 2→3. Gain 2→3 extra energy next turn.
- **Raid:** Rout. Breach 12→18% for any team with a Speed total over 60.
- **Farm:** Run Them Down. Expeditions finish 12→18% sooner.
- **Helper (Haste lane):** Charge. Smudge works 9→14% faster.

**Level 7: Victory Lap** (Activated, ◆3). Spend ◆3: Spark 2 more. If you win the turn, draw a card.

**Level 10, Awakened: Undefeated.** Spark 4. When you win a round, your next round starts with 2 extra energy.

**Gear synergy:** *Medal of Total Victory*: Trinket. Spark gets +1.

<a id="h-troffea"></a>
### Frau Troffea

*The Dancing Plague · Hare · Strasbourg, 1518* · **Uncommon** · 3 ◆ · Traits: **Showbiz + Hex**

*"She started dancing and could not stop. The whole street joined in."*

**Stats:** ATK 24 · DEF 8 · HP 7 · SPD 21 · LCK - · Power 39 (was 33) · Does not carry: Luck

**Ratings:** Duel **C** · Raid **C** · Farm **B** · Helper **A**

**Signature: Catching** (Triggered)

- **Duel:** Lift 2→3. Your other cards this turn get +2→3.
- **Raid:** Dancing Fever. Foes lose 5→8% damage each round they fail to hit the same target twice.
- **Farm:** Never Tired. Expeditions take 8→12% less time.
- **Helper (Haste lane):** Whirl. Smudge works 8→12% faster.

**Level 7: Contagious Rhythm** (Passive). Troffea's Lift now also reaches cards you play next turn.

**Level 10, Awakened: The Great Dance.** Lift 4. Every card in your hand scores 1 more until the round ends.

**Gear synergy:** *Unstoppable Tambourine*: Trinket. Lift gets +1 for each Hex or Showbiz card in play.

<a id="h-joost"></a>
### Joost van der Bloem

*Tulip Speculator · Hamster · Amsterdam, 1637* · **Uncommon** · 3 ◆ · Traits: **Hustler**

*"One bulb. Just one bulb. Tell no one how much it cost."*

**Stats:** ATK 4 · DEF 5 · HP 16 · SPD - · LCK 37 · Power 25 (was 21) · Does not carry: Speed

**Ratings:** Duel **D** · Raid **D** · Farm **S** · Helper **B**

**Signature: One More Bulb** (Passive)

- **Duel:** Gamble. Chance of scoring 1.5 times its points, equal to this card's Luck out of 250.
- **Raid:** All In. Plunder 15→23%, but the team starts the fight with 10% less health.
- **Farm:** Tulip Fever. Expeditions have a 10→15% chance to pay out double gold.
- **Helper (Fortune lane):** Speculation. Smudge finds 10→15% better loot.

**Level 7: Hold the Bulb** (Triggered). When Joost is drawn, you may keep him in hand. Gamble gets +10% chance.

**Level 10, Awakened: The Bubble Is Not Real.** Gamble. Chance of 2x instead of 1.5x. If it fails, he scores nothing.

**Gear synergy:** *Semper Augustus Bulb*: Trinket. Gamble chance gets +10%. Unlocks Speed here, at the gear's own value.

<a id="h-chad"></a>
### Chad Hodler

*Crypto Visionary · Lemming · Online, 2021* · **Common** · 2 ◆ · Traits: **Hustler + Florida**

*"Diamond hands. Laser eyes. A hoodie with ears."*

**Stats:** ATK 6 · DEF 4 · HP 12 · SPD - · LCK 31 · Power 22 (was 18) · Does not carry: Speed

**Ratings:** Duel **D** · Raid **D** · Farm **A** · Helper **C**

**Signature: Buying the Dip** (Passive)

- **Duel:** Gamble. Chance of scoring 1.5 times its points, equal to this card's Luck out of 250.
- **Raid:** To the Moon. Breach 20→30% in the final round, but nothing in the first two.
- **Farm:** Buy the Dip. Expeditions that run long (4 hours or more) bring back 15→23% more gold.
- **Helper (Fortune lane):** Hodl. Smudge finds 7→11% better loot, but loses 3→5% speed.

**Level 7: Iron Grip** (Passive). Chad cannot be Locked or Taxed.

**Level 10, Awakened: Whale.** Gamble. If it works, the bonus is 2x and you draw a card.

**Gear synergy:** *Diamond Hands*: Trinket. Gamble chance gets +10%. Unlocks Speed here, at the gear's own value.

<a id="h-bella"></a>
### Bella Pawsworth

*Influencer · Flamingo · Miami, today* · **Rare** · 4 ◆ · Traits: **Showbiz + Florida**

*"Smile, tilt, post. The sunset waits for nobody."*

**Stats:** ATK 36 · DEF 29 · HP 13 · SPD - · LCK - · Power 78 (was 46) · Does not carry: Speed, Luck

**Ratings:** Duel **B** · Raid **C** · Farm **B** · Helper **A**

**Signature: Do It for the Feed** (Triggered)

- **Duel:** Rally 6→9 (Bird). Your other Bird cards this turn get +6→9.
- **Raid:** Going Live. The team's Luck room choices get +10% to their chance.
- **Farm:** Sponsored Trip. Expeditions bring back 8→12% more ink.
- **Helper (Inky lane):** Brand Deal. Smudge earns 8→12% more ink.

**Level 7: Verified** (Triggered). When you play Bella with another Bird or Florida card, both get +2.

**Level 10, Awakened: Viral.** Rally 10 (Bird). Every Showbiz and Florida card you play gets the bonus too.

**Gear synergy:** *Verified Checkmark*: Trinket. Rally gets +2 for each Florida card. Unlocks Speed here, at the gear's own value.

<a id="h-florida"></a>
### Florida Man

*Local Legend · Alligator · Florida, today* · **Absurd** · 7 ◆ · Traits: **Florida + Swamp**

*"Hold my drink. No, really. Hold it. Watch this."*

**Stats:** ATK 41 · DEF 24 · HP 45 · SPD 14 · LCK - · Power 110 (was 98) · Does not carry: Luck

**Ratings:** Duel **S** · Raid **B** · Farm **B** · Helper **C**

**Signature: Hold My Drink** (Triggered)

- **Duel:** Swagger 10→15. +10→15 points if you are winning the round when you play it.
- **Raid:** Wild Card. At the start of each room, a random wild thing happens. It is usually good. Breach 10→15% on a good one.
- **Farm:** Found Something. Expeditions return one extra random item, which may be junk, and sometimes is treasure.
- **Helper (Double Haul lane):** Weird Finds. 6→9% chance of a second item, and one in ten of those is a surprise.

**Level 7: Hold My Other Drink** (Activated, ◆3). Spend ◆3: Swagger doubles this turn. If you were not ahead, it still gets half.

**Level 10, Awakened: The Legend of Florida.** Swagger 20. If it fires, your next card this turn costs 0 energy.

**Gear synergy:** *Jorts of Power*: Armor. Swagger gets +2. *Lucky Scratch-Off*: Trinket. Unlocks Luck on Florida Man.

<a id="h-lola"></a>
### Lola Vixen

*Cabaret Star · Fox · Paris, 1895* · **Epic** · 5 ◆ · Traits: **Showbiz + Thief**

*"She will take a bow. She will also take your watch. Both are lovely."*

**Stats:** ATK 21 · DEF 6 · HP 20 · SPD 23 · LCK 26 · Power 47 (was 47) · Carries all five

**Ratings:** Duel **B** · Raid **C** · Farm **B** · Helper **A**

**Signature: Encore, Monsieur** (Triggered)

- **Duel:** Sap 6→9. The other player's best card this turn loses 6→9 points.
- **Raid:** Distraction. The boss misses 10→15% of its attacks while Lola is on the team.
- **Farm:** Encore Haul. Expeditions have a 8→12% chance to bring back stolen treasure.
- **Helper (Fortune lane):** Pick-Pocket. Smudge finds 8→12% better loot.

**Level 7: Fan Dance** (Activated, ◆2). Spend ◆2: Sap hits again for half.

**Level 10, Awakened: Star of the Moulin.** Sap 10. Their best card also cannot Boomerang this turn.

**Gear synergy:** *Stolen Pocket Watch*: Trinket. Sap gets +1.

<a id="h-morwenna"></a>
### Morwenna Duskwing

*Hedge Witch · Moth · Black Forest, 1600s* · **Rare** · 4 ◆ · Traits: **Hex + Night**

*"The candle was the wrong colour. So were the toads."*

**Stats:** ATK 21 · DEF 7 · HP 10 · SPD 14 · LCK 24 · Power 38 (was 38) · Carries all five

**Ratings:** Duel **B** · Raid **C** · Farm **B** · Helper **A**

**Signature: Wrong Candle** (Passive)

- **Duel:** Twist. This card always scores its highest stat, whatever the turn calls.
- **Raid:** Hex the Boss. The boss's weak stat counts for 10→15% more.
- **Farm:** Moonlit Foraging. Night expeditions bring back 12→18% more loot.
- **Helper (Scholar lane):** Witch's Lessons. Smudge earns 8→12% more skill xp.

**Level 7: Curse and Counter-Curse** (Triggered). When a Sap hits your side, Morwenna turns 2 points of it into Twist.

**Level 10, Awakened: Hedge Queen.** Twist. Also scores best stat +4, and a Hex card in play gains Twist too.

**Gear synergy:** *Suspiciously Warm Lantern*: Trinket. Twist gets +2.

<a id="h-sable"></a>
### Sable Quickpaw

*Master Thief · Raccoon · Venice, 1610* · **Rare** · 4 ◆ · Traits: **Thief + Pirate**

*"Nothing was locked. Everything simply wanted to be borrowed."*

**Stats:** ATK 37 · DEF 4 · HP 7 · SPD 27 · LCK - · Power 48 (was 37) · Does not carry: Luck

**Ratings:** Duel **A** · Raid **B** · Farm **B** · Helper **B**

**Signature: Rinsed** (Triggered)

- **Duel:** Lock 1. The other player cannot play 1 of their cards next turn.
- **Raid:** Pick the Lock. The first room choice cannot fail.
- **Farm:** Light Fingers. Expeditions have a 8→12% chance to bring back an extra Loot item.
- **Helper (Haste lane):** Quick Hands. Smudge works 7→11% faster.

**Level 7: Fast Hands** (Activated, ◆2). Spend ◆2: Lock one more card next turn.

**Level 10, Awakened: Master of the Heist.** Lock 1. Also steals 1 energy from the other player.

**Gear synergy:** *Skeleton Key Ring*: Trinket. Lock gets +1 on Speed turns.

<a id="h-jacko"></a>
### Jacko Riley

*Surf Lifeguard · Kangaroo · Bondi Beach, today* · **Uncommon** · 3 ◆ · Traits: **Aussie + Medic**

*"Between the flags, mate. Swim where it is safe and everyone goes home."*

**Stats:** ATK 8 · DEF 21 · HP 30 · SPD - · LCK - · Power 59 (was 40) · Does not carry: Speed, Luck

**Ratings:** Duel **C** · Raid **B** · Farm **A** · Helper **B**

**Signature: Between the Flags** (Triggered)

- **Duel:** Mend 2→3. Remove Burn from your side. Your other cards this turn get +2→3.
- **Raid:** Rescue Board. Patch 8→12% to the weakest team member, after every room.
- **Farm:** Beach Patrol. Expeditions to Bondi bring back 10→15% more gold.
- **Helper (Scholar lane):** Lifeguard Lessons. Smudge earns 6→9% more skill xp.

**Level 7: Rip Current** (Triggered). When you play Jacko, remove Burn from your side and give a Water Folk card +3.

**Level 10, Awakened: Legend of Bondi.** Mend 4. Your side takes no Burn at all this turn.

**Gear synergy:** *Rescue Board*: Weapon. Mend gets +1. *Zinc Stripe*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-raspawtin"></a>
### Raspawtin

*Unkillable Mystic · Borzoi · St Petersburg, 1916* · **Unhinged** · 8 ◆ · Traits: **Hex + Frost**

*"Poisoned, shot, drowned. He asked for seconds."*

**Stats:** ATK 45 · DEF 18 · HP 21 · SPD 33 · LCK 42 · Power 84 (was 84) · Carries all five

**Ratings:** Duel **S** · Raid **B** · Farm **A** · Helper **B**

**Signature: Seconds, Please** (Triggered)

- **Duel:** Comeback 10→15. +10→15 points if you are losing the round when you play it.
- **Raid:** Cannot Be Killed. The first time a team member falls each room, they get back up at 25% health.
- **Farm:** Miraculous Survival. Expeditions never fail and bring back 10→15% more of every drop.
- **Helper (Fortune lane):** Unnatural Luck. Smudge finds 10→15% better loot.

**Level 7: Another Cup, Thank You** (Activated, ◆3). Spend ◆3: Comeback 5 more, and Raspawtin cannot be Locked.

**Level 10, Awakened: The Unkillable.** Comeback 20. If your total would fall to 0 this round, you keep 1 point.

**Gear synergy:** *Suspicious Tea Cake*: Weapon. Comeback gets +2.

<a id="h-madjack"></a>
### Mad Jack Ramsbottom

*Officer and Lunatic · Ram · Normandy, 1944* · **Unhinged** · 8 ◆ · Traits: **Soldier**

*"Fix bayonets and long live the longbow!"*

**Stats:** ATK 65 · DEF 22 · HP 51 · SPD 26 · LCK - · Power 138 (was 129) · Does not carry: Luck

**Ratings:** Duel **A** · Raid **B** · Farm **D** · Helper **C**

**Signature: Longbow, 1944** (Triggered)

- **Duel:** Surge 12→18 (Attack). +12→18 points when the turn calls Attack.
- **Raid:** Death or Glory. Breach 20→30% for the first three rounds, then he is down 10% health.
- **Farm:** Over the Top. Expeditions to the Outback pay 10→15% more gold.
- **Helper (Double Haul lane):** Bagpipes at Dawn. 4→6% chance of a second item.

**Level 7: Longbow, Fully Drawn** (Activated, ◆3). Spend ◆3: Surge 8 more, but this card scores 0 on the next turn.

**Level 10, Awakened: Officer and Lunatic.** Surge 24 (Attack). He may go first no matter what, and cannot be Locked.

**Gear synergy:** *War Longbow*: Trinket. Surge gets +3.

<a id="h-vesper"></a>
### Vesper Nightshade

*Queen of the Batcave · Bat · London, 1982* · **Epic** · 5 ◆ · Traits: **Night + Punk**

*"If you are not on the list, you are not getting in. If you are on it, tonight is yours."*

**Stats:** ATK 30 · DEF 11 · HP 16 · SPD 35 · LCK - · Power 57 (was 50) · Does not carry: Luck

**Ratings:** Duel **B** · Raid **B** · Farm **B** · Helper **A**

**Signature: Not on the List** (Triggered)

- **Duel:** Sap 5→8. The other player's best card this turn loses 5→8 points.
- **Raid:** Echolocation. Scout the room before you act: you see which stat each room choice uses before picking.
- **Farm:** Night Flight. Night expeditions return 10→15% sooner.
- **Helper (Haste lane):** Wingbeats. Smudge works 8→12% faster.

**Level 7: Wall of Sound** (Triggered). When you play Vesper with another Punk, Sap hits for 3 more.

**Level 10, Awakened: Queen of the Batcave.** Sap 10. Peek: you see the other player's whole hand.

**Gear synergy:** *Ankh of Eternal Sighing*: Trinket. Sap gets +1.

<a id="h-roxy"></a>
### Roxy Riot

*Three Chords and a Grudge · Skunk · London, 1977* · **Rare** · 4 ◆ · Traits: **Punk**

*"Three chords, one grudge, and a sound check that never ends."*

**Stats:** ATK 34 · DEF 10 · HP 29 · SPD - · LCK - · Power 73 (was 57) · Does not carry: Speed, Luck

**Ratings:** Duel **B** · Raid **D** · Farm **C** · Helper **A**

**Signature: Soundcheck** (Triggered)

- **Duel:** Sap 6→9. The other player's best card this turn loses 6→9 points.
- **Raid:** Feedback. The boss loses 8→12% of its attack each round Roxy is alive.
- **Farm:** Tour Bus. Expeditions are 8→12% more likely to bring back a gift.
- **Helper (Inky lane):** Merch Table. Smudge earns 6→9% more ink.

**Level 7: Mosh Pit** (Triggered). When you play Roxy with another Punk, both Sap for 3.

**Level 10, Awakened: Queen of the Pit.** Sap 12. The other player's best card also cannot be Mended.

**Gear synergy:** *Out-of-Tune Bass*: Weapon. Sap gets +1. *Safety Pin (Structural)*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-jazzmin"></a>
### Jazzmin Sweat

*Feel the Burn · Poodle · Los Angeles, 1984* · **Uncommon** · 3 ◆ · Traits: **Showbiz + Pulp**

*"And a one, and a two, and a never stop. Squeeze it out!"*

**Stats:** ATK 16 · DEF 8 · HP 6 · SPD 31 · LCK - · Power 30 (was 26) · Does not carry: Luck

**Ratings:** Duel **C** · Raid **D** · Farm **B** · Helper **A**

**Signature: And Again!** (Triggered)

- **Duel:** Spark 1→2. Gain 1→2 extra energy next turn as soon as you draw this card.
- **Raid:** Cardio. After every room, the team's Speed counts 8→12% more.
- **Farm:** Marathon. Expeditions take 10→15% less time.
- **Helper (Haste lane):** Jazzercise. Smudge works 9→14% faster.

**Level 7: Warm-Up Set** (Passive). Jazzmin gains Spark 1 if you played another Showbiz card last turn.

**Level 10, Awakened: Aerobics Champion.** Spark 3 on draw. Showbiz cards get +2 for every card played before this one.

**Gear synergy:** *Leg Warmers of Fury*: Armor. Spark gets +1.

<a id="h-stella"></a>
### Captain Stella Comet

*Ace of the Rocket Patrol · Snow Leopard · The Future, as of 1953* · **Legendary** · 6 ◆ · Traits: **Pulp + Beyond**

*"Tune in next week for the next amazing instalment!"*

**Stats:** ATK 40 · DEF 18 · HP 23 · SPD 33 · LCK - · Power 81 (was 73) · Does not carry: Luck

**Ratings:** Duel **A** · Raid **B** · Farm **C** · Helper **B**

**Signature: Next Week's Episode** (Triggered)

- **Duel:** Rally 4→6 (Neon). Your other Neon cards this turn get +4→6.
- **Raid:** Rocket Patrol. Breach 12→18% against bosses weak to Speed.
- **Farm:** Interstellar Mail. Expeditions return 8→12% sooner and 5→8% fuller.
- **Helper (Scholar lane):** Space Cadet Class. Smudge earns 8→12% more skill xp.

**Level 7: Cliffhanger** (Triggered). When you play Stella, Neon cards in your hand cost 1 less next turn.

**Level 10, Awakened: Ace of the Rocket Patrol.** Rally 8 (Neon). Pulp and Beyond cards get +4 too.

**Gear synergy:** *Rocket Patrol Badge*: Trinket. Rally gets +2.

<a id="h-pam"></a>
### Pixel Pam

*Three Letters, Top of Every Board · Red Panda · A mall arcade, 1983* · **Common** · 2 ◆ · Traits: **Pulp**

*"Three letters on the high score board. One more quarter."*

**Stats:** ATK 5 · DEF 7 · HP 14 · SPD - · LCK 25 · Power 26 (was 24) · Does not carry: Speed

**Ratings:** Duel **C** · Raid **D** · Farm **A** · Helper **A**

**Signature: Extra Life** (Triggered)

- **Duel:** Boomerang. When this card leaves play it goes on top of your deck. Surge 5→8 (Luck).
- **Raid:** Extra Life. Once per raid, a failed room choice is retried.
- **Farm:** High Score. Expeditions have a 10→15% chance of a bonus find.
- **Helper (Fortune lane):** Combo Streak. Smudge finds 6→9% better loot.

**Level 7: Insert Coin** (Triggered). When Pam returns with Boomerang, you gain 1 energy.

**Level 10, Awakened: Top of Every Board.** Boomerang. Also draws her straight to your hand. Surge 8 (Luck).

**Gear synergy:** *Roll of Quarters*: Weapon. Boomerang gives 1 extra energy once a duel. *Lucky Joystick Knob*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-gorm"></a>
### Gorm the Mighty

*Master of the Immediate Area · Bison · A toy aisle, 1983* · **Absurd** · 7 ◆ · Traits: **Pulp + Warrior**

*"By the power of the toy aisle, this area is mine!"*

**Stats:** ATK 45 · DEF 30 · HP 51 · SPD - · LCK - · Power 126 (was 103) · Does not carry: Speed, Luck

**Ratings:** Duel **A** · Raid **B** · Farm **D** · Helper **C**

**Signature: Immediate Area** (Passive)

- **Duel:** Crescendo 3→5. +3→5 points for each time you have already played this card in this duel.
- **Raid:** Master of the Immediate Area. Breach 5→8% for each round Gorm has fought.
- **Farm:** Collector's Edition. Expeditions bring back 10→15% more gear.
- **Helper (Double Haul lane):** Heavy Lifting. 5→8% chance of a second item.

**Level 7: Mail-In Offer** (Activated, ◆3). Spend ◆3: Crescendo triggers twice this turn.

**Level 10, Awakened: Master of the Aisle.** Crescendo 6. Gorm cannot be Locked or Taxed.

**Gear synergy:** *Mail-In Power Amulet*: Trinket. Crescendo gets +1. Unlocks Speed here, at the gear's own value.

<a id="h-flap"></a>
### Commander Flap

*The Bird Who Finally Flew · Penguin · A movie serial, 1936* · **Rare** · 4 ◆ · Traits: **Pulp + Frost**

*"Thirty years of waddling. One glorious afternoon of flying."*

**Stats:** ATK 13 · DEF 6 · HP 22 · SPD 33 · LCK - · Power 41 (was 35) · Does not carry: Luck

**Ratings:** Duel **C** · Raid **C** · Farm **B** · Helper **A**

**Signature: Thirty Years Late** (Triggered)

- **Duel:** Comeback 5→8. +5→8 points if you are losing the round when you play it.
- **Raid:** Rocket Pack. The team's Speed counts 10→15% more in the final round.
- **Farm:** Long Way Home. Expeditions bring back 10→15% more loot.
- **Helper (Haste lane):** Aerial Mail. Smudge works 8→12% faster.

**Level 7: Altimeter** (Triggered). When you play Flap while losing, Comeback is 3 higher.

**Level 10, Awakened: The Bird Who Finally Flew.** Comeback 10. A Frost or Pulp card played with him gets +3.

**Gear synergy:** *Twin-Tank Rocket Pack*: Weapon. Comeback gets +2.

<a id="h-max"></a>
### Sgt. Max Carnage

*One-Rhino Army · Rhino · A jungle, 1985* · **Epic** · 5 ◆ · Traits: **Soldier + Pulp**

*"One rhino. One headband. One very bad day for the bad guys."*

**Stats:** ATK 42 · DEF 13 · HP 14 · SPD 18 · LCK - · Power 69 (was 65) · Does not carry: Luck

**Ratings:** Duel **A** · Raid **C** · Farm **C** · Helper **B**

**Signature: Out of Retirement** (Passive)

- **Duel:** Crescendo 4→6. +4→6 points for each time you have already played this card in this duel.
- **Raid:** One-Rhino Army. Breach 15→23%. If Max is the only fighter, double it.
- **Farm:** Jungle Run. Expeditions to wild places bring back 8→12% more gear.
- **Helper (Double Haul lane):** Muscle. 5→8% chance of a second item.

**Level 7: Reservist Call-Up** (Triggered). When you play Max a second time in a duel, draw a card.

**Level 10, Awakened: Rambo Rhino.** Crescendo 8. Never takes more than 8 points from Sap.

**Gear synergy:** *Red Headband*: Armor. Crescendo gets +1.

<a id="h-rex"></a>
### Rex Sizzle

*Voice of a Generation, He Says · Afghan Hound · Sunset Strip, 1987* · **Uncommon** · 3 ◆ · Traits: **Punk + Showbiz**

*"A voice for a generation. Mostly his own, and mostly in the mirror."*

**Stats:** ATK 5 · DEF 30 · HP 24 · SPD - · LCK - · Power 59 (was 34) · Does not carry: Speed, Luck

**Ratings:** Duel **C** · Raid **C** · Farm **B** · Helper **A**

**Signature: Power Ballad** (Triggered)

- **Duel:** Rally 3→5 (Dog and Wolf). Your other Dog and Wolf cards this turn get +3→5.
- **Raid:** Power Ballad. Allies get +5→8% to every roll for the first room.
- **Farm:** Greatest Hits. Expeditions bring back 8→12% more gifts.
- **Helper (Inky lane):** Back Catalog. Smudge earns 7→11% more ink.

**Level 7: Encore Chorus** (Triggered). When you play Rex with another Dog or Wolf card, both get +2.

**Level 10, Awakened: Voice of a Generation.** Rally 6 (Dog and Wolf). Showbiz and Punk cards get +3 too.

**Gear synergy:** *Keytar of Destiny*: Weapon. Rally gets +1. *Industrial Hairspray*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-ajolote"></a>
### El Ajolote Dorado

*The Golden One · Axolotl · Mexico City, 1955* · **Legendary** · 6 ◆ · Traits: **Showbiz + Swamp**

*"The mask never comes off. The belt never leaves his side."*

**Stats:** ATK 17 · DEF 35 · HP 58 · SPD - · LCK - · Power 110 (was 89) · Does not carry: Speed, Luck

**Ratings:** Duel **A** · Raid **B** · Farm **B** · Helper **B**

**Signature: Grows Back** (Triggered)

- **Duel:** Mend 2→3. Remove Burn from your side. Your other cards this turn get +2→3.
- **Raid:** Grows Back. After every room, he heals 10→15% of the team's lost health.
- **Farm:** Regrowth. Expeditions never leave anyone resting.
- **Helper (Scholar lane):** Champion's Wisdom. Smudge earns 8→12% more skill xp.

**Level 7: Cape of Entrances** (Triggered). When you play Ajolote, remove Burn from your side and give a Showbiz card +3.

**Level 10, Awakened: Golden Champion.** Mend 6. Your side also gains +3 points on every Health turn.

**Gear synergy:** *Championship Belt*: Weapon. Mend gets +1. *Cape of Entrances*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-doug"></a>
### Doug from Accounts

*Expense Auditor · Capybara · Today* · **Common** · 2 ◆ · Traits: **Day Job + Swamp**

*"Receipt, please. And a note on why you needed the second sandwich."*

**Stats:** ATK 5 · DEF 25 · HP 17 · SPD - · LCK - · Power 47 (was 36) · Does not carry: Speed, Luck

**Ratings:** Duel **C** · Raid **A** · Farm **B** · Helper **B**

**Signature: Denied** (Triggered)

- **Duel:** Guard. Your side ignores the other player's Sap and Burn this turn.
- **Raid:** Audit. 10→15% of boss damage is refunded to the team as health.
- **Farm:** Expense Report. Expeditions bring back 10→15% more gold, but nothing else.
- **Helper (Inky lane):** Tidy Books. Smudge earns 6→9% more ink.

**Level 7: Paper Trail** (Passive). Doug gains Surge 2 on every turn, but only if you have not played another Day Job.

**Level 10, Awakened: Chief Auditor.** Guard. Your side also takes 3 less from Sap and Burn next turn.

**Gear synergy:** *Lanyard With Nine Keycards*: Trinket. Guard also blocks Lock. Unlocks Speed here, at the gear's own value.

<a id="h-bjorn"></a>
### Bjorn the Twice-Dead

*Ice Fisherman · Walrus · Norway, 870* · **Common** · 2 ◆ · Traits: **Pirate + Frost**

*"He died twice and still caught more than anyone on the lake."*

**Stats:** ATK 11 · DEF 17 · HP 21 · SPD - · LCK - · Power 49 (was 41) · Does not carry: Speed, Luck

**Ratings:** Duel **C** · Raid **B** · Farm **A** · Helper **C**

**Signature: Declared Dead** (Triggered)

- **Duel:** Surge 6→9 (Health). +6→9 points when the turn calls Health.
- **Raid:** Died Twice. The first time he falls, he returns at full health in the next room.
- **Farm:** Ice Fishing. Fishing expeditions bring back 12→18% more fish.
- **Helper (Double Haul lane):** Patient Catch. 6→9% chance of a second item.

**Level 7: Third Time Lucky** (Activated, ◆2). Spend ◆2: Surge 3 more on a Health turn.

**Level 10, Awakened: Thrice-Dead Fisher.** Surge 10 (Health). Once a duel he returns to your hand when played.

**Gear synergy:** *His Own Funeral Coin*: Trinket. Surge gets +2. Unlocks Speed here, at the gear's own value.

<a id="h-mona"></a>
### Mona Lisard

*Portrait Painter · Chameleon · Venice, 1610* · **Uncommon** · 3 ◆ · Traits: **Thief + Sleuth**

*"A little more blue here. Now smile. No, not that one. The other one."*

**Stats:** ATK 25 · DEF 3 · HP 5 · SPD 29 · LCK - · Power 33 (was 26) · Does not carry: Luck

**Ratings:** Duel **B** · Raid **C** · Farm **B** · Helper **A**

**Signature: Whatever You See** (Passive)

- **Duel:** Twist. This card always scores its highest stat, whatever the turn calls.
- **Raid:** Portrait Eyes. Once per raid, copy the best team member's stat for one room.
- **Farm:** Studio Visit. Expeditions have a 10→15% chance of a rare find.
- **Helper (Scholar lane):** Art Class. Smudge earns 8→12% more skill xp.

**Level 7: Unfinished Smile** (Triggered). When you play Mona, copy a Twist card's effect from your hand.

**Level 10, Awakened: The Masterpiece.** Twist. Her best stat is also doubled when it is under 10.

**Gear synergy:** *The Unfinished Smile*: Trinket. Twist gets +3.

<a id="h-dusty"></a>
### Dusty Belle

*Gold Prospector · Echidna · Western Australia, 1932* · **Uncommon** · 3 ◆ · Traits: **Aussie**

*"Eleven years on the claim. Eleven years of opinions about it."*

**Stats:** ATK 32 · DEF 8 · HP 20 · SPD - · LCK - · Power 60 (was 45) · Does not carry: Speed, Luck

**Ratings:** Duel **B** · Raid **C** · Farm **A** · Helper **B**

**Signature: Eleven Years of Opinions** (Triggered)

- **Duel:** Burn 3→5. The other player loses 3→5 points at the start of each of the next 2 turns.
- **Raid:** Digging In. Brace 8→12% after the third round.
- **Farm:** Strike Gold. Digging expeditions bring back 15→23% more.
- **Helper (Double Haul lane):** Prospector's Nose. 7→11% chance of a second item.

**Level 7: The One Nugget** (Triggered). When you play Dusty, gain 5 gold.

**Level 10, Awakened: Queen of the Outback.** Burn 6. Digging expeditions also find nuggets worth 2x gold.

**Gear synergy:** *Old Faithful*: Weapon. Burn gets +1. *The One Nugget*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-hootsworth"></a>
### Inspector Hootsworth

*Consulting Detective · Tawny Owl · London, 1888* · **Rare** · 4 ◆ · Traits: **Sleuth + Night**

*"The answer was in the room all along. So was the butler."*

**Stats:** ATK 42 · DEF 8 · HP 29 · SPD - · LCK - · Power 79 (was 44) · Does not carry: Speed, Luck

**Ratings:** Duel **B** · Raid **B** · Farm **B** · Helper **A**

**Signature: The Stare** (Triggered)

- **Duel:** Peek. See 2 cards in the other player's hand. Lift 3→5: your other cards this turn get +3→5.
- **Raid:** Elementary. Scout: you see the boss's weak stat and weakest room choice before you pick.
- **Farm:** Case File. Expeditions never return empty-handed.
- **Helper (Scholar lane):** Detective Notes. Smudge earns 8→12% more skill xp.

**Level 7: Second Glance** (Triggered). When you play Hootsworth, Peek again after the first card flips.

**Level 10, Awakened: The Great Detective.** Lift 6. See their hand and lock the card that matters most.

**Gear synergy:** *Magnifying Glass, Large*: Weapon. Lift gets +1. *Notebook of Things You Said*: Trinket. Unlocks Speed here, at the gear's own value.

<a id="h-sterling"></a>
### Agent Sterling Stoat

*Gentleman Spy · Stoat · Chicago, 1927* · **Rare** · 4 ◆ · Traits: **Sleuth**

*"Shaken, stirred, and already three steps ahead."*

**Stats:** ATK 28 · DEF 6 · HP 8 · SPD 38 · LCK - · Power 42 (was 34) · Does not carry: Luck

**Ratings:** Duel **B** · Raid **B** · Farm **B** · Helper **A**

**Signature: Whose Side** (Triggered)

- **Duel:** Peek. See 2 cards in the other player's hand. Surge 3→5 (Speed): +3→5 points on a Speed turn.
- **Raid:** Undercover. Skip the final room check entirely. Once per raid.
- **Farm:** Secret Mission. Expeditions have a 10→15% chance of an item no one else gets.
- **Helper (Haste lane):** Fast Getaway. Smudge works 8→12% faster.

**Level 7: Cufflink Camera** (Triggered). When you play Sterling, Peek one more card.

**Level 10, Awakened: Double-Oh Stoat.** Surge 7 (Speed). Peek also shows their next three draws.

**Gear synergy:** *Cufflink Camera*: Trinket. Peek shows one more card.

<a id="h-dolly"></a>
### Dolly LaRue

*Canteen Sweetheart · Fallow Deer · Sydney, 1942* · **Rare** · 4 ◆ · Traits: **Aussie + Showbiz**

*"One more song, boys. Then home. I promise. Probably."*

**Stats:** ATK 10 · DEF 21 · HP 31 · SPD 15 · LCK - · Power 62 (was 50) · Does not carry: Luck

**Ratings:** Duel **B** · Raid **A** · Farm **B** · Helper **B**

**Signature: Singing to You** (Triggered)

- **Duel:** Lift 3→5. Your other cards this turn get +3→5.
- **Raid:** Morale. The team gets +5→8% to every roll for the whole fight.
- **Farm:** Canteen Run. Expeditions send everyone home 10→15% less rested.
- **Helper (Inky lane):** Troop Concert. Smudge earns 8→12% more ink.

**Level 7: Box of Forty-One Rings** (Triggered). When you play Dolly, give another Aussie or Showbiz card +3.

**Level 10, Awakened: Sweetheart of Sydney.** Lift 6. Every card you play this turn gets Guard.

**Gear synergy:** *Chrome Stage Microphone*: Weapon. Lift gets +1.

<a id="h-gladius"></a>
### Gladius Maximus

*People's Champion · Lion · Rome, 80 AD* · **Rare** · 4 ◆ · Traits: **Warrior + Showbiz**

*"The crowd on its feet! The mane at its best!"*

**Stats:** ATK 33 · DEF 18 · HP 14 · SPD 15 · LCK - · Power 65 (was 59) · Does not carry: Luck

**Ratings:** Duel **A** · Raid **B** · Farm **C** · Helper **B**

**Signature: No Shirt Required** (Triggered)

- **Duel:** Rally 4→6 (Ancient). Your other Ancient cards this turn get +4→6.
- **Raid:** Crowd Favorite. Breach 10→15% after every round the team survives.
- **Farm:** Prize Money. Expeditions bring back 10→15% more gold.
- **Helper (Inky lane):** Gladiator's Fame. Smudge earns 8→12% more ink.

**Level 7: Thumbs Up** (Activated, ◆2). Spend ◆2: Rally goes up by 3 and affects Showbiz cards too.

**Level 10, Awakened: People's Champion.** Rally 8 (Ancient). Showbiz and Warrior cards in play get Guard.

**Gear synergy:** *Flask of Mane Oil*: Trinket. Rally gets +2.

<a id="h-quack"></a>
### Dr. Quackenstein

*Galvanic Physician · Pekin Duck · Black Forest, 1790* · **Epic** · 5 ◆ · Traits: **Mad Science + Medic**

*"It's alive! It's also a little bit cross. Pass the cables."*

**Stats:** ATK 40 · DEF 13 · HP 27 · SPD 15 · LCK - · Power 80 (was 56) · Does not carry: Luck

**Ratings:** Duel **B** · Raid **C** · Farm **B** · Helper **A**

**Signature: More Lightning** (Triggered)

- **Duel:** Tax 1→2. The other player's most expensive card costs 1→2 more energy next turn.
- **Raid:** Jump Start. A fallen team member comes back with 15→23% health once per raid.
- **Farm:** Lab Samples. Expeditions bring back 12→18% more parts.
- **Helper (Inky lane):** Spark of Genius. Smudge earns 9→14% more ink.

**Level 7: More Power!** (Activated, ◆3). Spend ◆3: Tax 1 more, and the taxed card also scores 3 less.

**Level 10, Awakened: Galvanic Physician.** Tax 3. Mad Science cards you play get +3.

**Gear synergy:** *Copper Lightning Rod*: Weapon. Tax gets +1.

<a id="h-selene"></a>
### Selene Nightbloom

*Jewel Thief · Black Panther · Venice, 1610* · **Epic** · 5 ◆ · Traits: **Thief + Night**

*"The jewels were always hers. She was merely late collecting."*

**Stats:** ATK 30 · DEF 6 · HP 9 · SPD 19 · LCK 26 · Power 45 (was 45) · Carries all five

**Ratings:** Duel **A** · Raid **B** · Farm **B** · Helper **B**

**Signature: Invited Back** (Triggered)

- **Duel:** Lock 2. The other player cannot play 2 of their cards next turn.
- **Raid:** Quiet Entry. The first room cannot hurt the team.
- **Farm:** Midnight Heist. Night expeditions have a 10→15% chance of a rare find.
- **Helper (Fortune lane):** Shadow Hands. Smudge finds 8→12% better loot.

**Level 7: Hidden Exit** (Triggered). When you play Selene, you may keep one locked card out of the lock.

**Level 10, Awakened: Jewel of the Night.** Lock 3. Locked cards cost 2 more to play when they return.

**Gear synergy:** *The Doge's Signet*: Trinket. Lock gets +1 on a Speed turn.

<a id="h-beep"></a>
### Unit B33-P

*Butler, Slightly On Fire · Robot · Beyond* · **Epic** · 5 ◆ · Traits: **Beyond + Mad Science**

*"Dinner is served. Please ignore the smoke. It is part of the experience."*

**Stats:** ATK 8 · DEF 35 · HP 19 · SPD 27 · LCK - · Power 62 (was 51) · Does not carry: Luck

**Ratings:** Duel **B** · Raid **B** · Farm **A** · Helper **B**

**Signature: Slightly On Fire** (Passive)

- **Duel:** Twist. This card always scores its highest stat, whatever the turn calls.
- **Raid:** Always Ready. Once per room, one team member's worst stat counts as their best.
- **Farm:** Perfectly Served. Expeditions bring back 10→15% more food.
- **Helper (Scholar lane):** Household Duties. Smudge earns 7→11% more skill xp.

**Level 7: Silver Service** (Activated, ◆2). Spend ◆2: your next card this turn is Twist.

**Level 10, Awakened: At Your Service.** Twist. All other Beyond cards you play get Twist too.

**Gear synergy:** *Small Persistent Flame*: Trinket. Twist gets +2.

<a id="h-tut"></a>
### Pharaoh Tutankhamoose

*Boy King, Wrong Continent · Moose · Egypt, 1330 BC* · **Legendary** · 6 ◆ · Traits: **Royal + Swamp**

*"He is a boy king, and he is bored. Wrong continent, wrong century, wrong crown."*

**Stats:** ATK 15 · DEF 61 · HP 40 · SPD - · LCK - · Power 116 (was 93) · Does not carry: Speed, Luck

**Ratings:** Duel **A** · Raid **B** · Farm **C** · Helper **B**

**Signature: Wrong Continent** (Triggered)

- **Duel:** Burn 4→6. The other player loses 4→6 points at the start of each of the next 2 turns.
- **Raid:** Curse of the Pharaoh. The boss loses 5→8% of its health each round.
- **Farm:** Tomb Raider. Expeditions have a 12→18% chance of a rare treasure.
- **Helper (Inky lane):** Gold Collar. Smudge earns 8→12% more ink.

**Level 7: Crook and Flail** (Activated, ◆3). Spend ◆3: Burn 2 more for 2 more turns.

**Level 10, Awakened: Boy King of the Wrong Continent.** Burn 8. Royals you play get Guard.

**Gear synergy:** *Scarab of the Wrong Continent*: Trinket. Burn lasts 1 extra turn. Unlocks Speed here, at the gear's own value.

<a id="h-eagleton"></a>
### President Baldwin Eagleton

*Candidate for Everything · Bald Eagle · A campaign trail, every year* · **Absurd** · 7 ◆ · Traits: **Royal + Hustler**

*"Vote for me! I have no policies but I have a great smile."*

**Stats:** ATK 11 · DEF 10 · HP 32 · SPD 18 · LCK 64 · Power 53 (was 53) · Carries all five

**Ratings:** Duel **D** · Raid **D** · Farm **S** · Helper **B**

**Signature: Recount** (Passive)

- **Duel:** Gamble. Chance of scoring 1.5 times its points, equal to this card's Luck out of 250.
- **Raid:** Recount. Once per raid, redo a failed room choice with a bonus.
- **Farm:** Campaign Trail. Expeditions pay out 12→18% more of everything.
- **Helper (Fortune lane):** Pocket Votes. Smudge finds 9→14% better loot.

**Level 7: Concession Speech** (Triggered). When Eagleton's Gamble fails, he returns to your hand.

**Level 10, Awakened: President of Everything.** Gamble. Chance is doubled while you are ahead.

**Gear synergy:** *'I Voted For Me' Button*: Trinket. Gamble chance gets +10%.

<a id="h-zorp"></a>
### Zorp, Destroyer of Tuesdays

*Definitely a Human · Alien · Beyond* · **Unhinged** · 8 ◆ · Traits: **Beyond + Mad Science**

*"Greetings, fellow Earth person. I am a normal human. Tuesday is a fine day."*

**Stats:** ATK 13 · DEF 20 · HP 30 · SPD 39 · LCK 47 · Power 63 (was 63) · Carries all five

**Ratings:** Duel **B** · Raid **C** · Farm **B** · Helper **A**

**Signature: Definitely a Human** (Passive)

- **Duel:** Twist. This card always scores its highest stat, whatever the turn calls.
- **Raid:** Weird Science. Each round the team gets a random buff of 10→15%.
- **Farm:** Strange Cargo. Expeditions bring back a random item from another place.
- **Helper (Haste lane):** Probe. Smudge works 10→15% faster.

**Level 7: Universal Translator** (Passive). Zorp always plays as if the turn is calling his best stat.

**Level 10, Awakened: Destroyer of Tuesdays.** Twist. If this card scores under 20, it scores 20 instead.

**Gear synergy:** *Earth Calendar, Tuesdays Removed*: Trinket. Twist gets +3.
