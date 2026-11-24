# OverSummoned gear stats: model, formulas, and what the live game does today

This is a mockup spec. Nothing here is live yet. The data model it describes is in `items.js`.

## 1. The six stats

| Stat | Key | What a player reads | What it does |
|---|---|---|---|
| Attack | `atk` | "Hits harder" | Added to every hit |
| Defense | `def` | "Takes less damage" | Cuts damage taken, with diminishing returns |
| Health | `hp` | "Stays up longer" | Size of the hero's health pool |
| Speed | `spd` | "Acts sooner" | Turn order and how often the hero acts |
| Crit Chance | `crit` (%) | "Big hits more often" | Chance for a hit to deal 1.5x damage |
| Luck | `luck` | "Better loot drops" | Pushes drop rarity upward |

Weapons also carry `dmg:[lo,hi]` and `speed`, which is seconds per swing. DPS is shown as `(lo+hi)/2 / speed`. Armor pieces carry `armor`, and shields also carry `block`.

## 2. Item record

```
{ name, rarity, ilvl, bind:'pickup'|'equip'|null, unique, slot, hand, type,
  armor, block, dmg:[lo,hi], speed,
  stats:{atk,def,hp,spd,crit,luck},
  equip:[text + effect key], use:text, cd, set:setId, req:cardLevel,
  sell:copper, stack, flavor, icon }
```

- **Slots:** head, chest, legs, feet, hands, neck, ring x2, main, off, trinket x2, plus belt x4 (potions and food only).
- **Two-hand weapons** take main and lock off.
- **Coins:** 1 gold = 100 silver = 10,000 copper. Store copper as an integer.

## 3. Hero totals, which are also the numbers on the card front

```
levelMult   = 1 + 0.05 * (cardLevel - 1)          // card level 1..10, from dupes
base_k      = floor(heroBase_k * levelMult)       // atk, def, hp, spd (crit and luck do not scale)
gear_k      = sum of item.stats[k] over equipped items (belt excluded)
set_k       = SETS[hero].stats[k] if all 3 set items are worn by THIS hero, else 0
total_k     = base_k + gear_k + set_k
Armor       = sum of item.armor          // adds to Defense at 1 Defense per 20 Armor
DEF_eff     = total_def + floor(Armor/20)
crit_eff    = min(60, total_crit)        // %
```

The card front shows the totals for Attack, Defense and Health, plus a small line with Speed, Crit and Luck. The gear view shows only what gear adds ("Attack +54"). On the hero base table, `hp = 40 + guard*8` is today's engine formula, so existing balance carries over.

## 4. Combat formulas

**Damage per hit**
```
weaponRoll = randInt(dmg.lo, dmg.hi)       // unarmed: 1..3
raw        = weaponRoll + total_atk
mitigated  = raw * 100 / (100 + DEF_eff_target)     // 100 Defense = half damage, never zero
isCrit     = rand() < crit_eff/100
damage     = max(1, round(mitigated * (isCrit ? 1.5 : 1) * variance(0.95..1.05)))
```

**Turn order**
- Each fighter's next action time is `t_next = t_now + swing / (1 + spd/100)`.
- `swing` is the weapon speed, or 2.0 unarmed.
- The fighter with the lowest `t_next` acts first. Ties go to higher Speed, then a seeded coin flip.
- Speed therefore decides who opens the fight and how often each hero acts.

**Health pool and defeat**
- Each hero has `hp_max = total_hp`.
- A hero at 0 is downed for the rest of that delve.
- A downed hero goes to `os_infirmary` for `10 min * floor` unless an effect revives them (for example Defibrillator Paddles or the Golden Hour set bonus).
- If the whole party is downed, the run ends on that room. The party keeps what was looted so far, minus 50% of that run's gold.

**Potions and food (belt Use effects)**
- Rule: when a hero's HP is below `rules.heal`% (already stored per player), they use the first matching belt item.
- One use per hero per cooldown.
- Each use consumes 1 from `os_bag`.
- Effects are keyed data, for example `heal:70`, `def_fight:25`, `hot:{amount:4,every:3}`, `heal:28`.
- `rules.retreat`% means the party leaves early when total party HP falls below that share. They keep the loot so far.

**Luck and drop rarity**
- `partyLuck = sum(total_luck of party) + night bonus`, capped at 100.
- `luckMult = 1 + partyLuck/100`. Rarity weights then become:
  - common unchanged
  - uncommon x luckMult^0.5
  - rare, epic and legendary x luckMult
  - absurd and unhinged x luckMult x floorMult
- These multiply the existing `drop_rates` weights in `os_config`, so the admin tuning still works.

**Set bonus application**
- On each fight start, for each hero, count the worn items whose `set == hero_id`.
- At 3, add `SETS[hero].stats` to the totals and register the effect key, for example `aoe_slap_once`, `testudo`, `hustle_gold_15`, `mining_20`, `revive_first`, `reply_all_plus1`.
- Set items worn by a different hero still give their item stats but never their set bonus.

**Equip effects**
- Every green "Equip:" line maps to an effect key with numbers, for example `first_strike_double`, `on_hit_shred:{chance:2,def:20,sec:6}` or `aggro_first`.
- The fight loop has hooks for: fight start, before hit, after hit, ally down, and room clear.
- Effects outside combat (Hustle gold, Mining speed, chest finding) are read by `os_tick`, the hustle code in `os_act`, and `os_claim`.

## 5. What the live game does today

I read the repo branch `cursor/oversummoned-game-d7cc` (js/engine.js, js/catalog.js, js/ui.js and the 4 os_* migrations). I also ran read-only queries on Supabase eresamyqxarlrdgudgrw: the os_* table columns, and a keyword scan of all 19 live os_* function bodies. None of the live functions mention gear, equip, crit, speed, luck or might.

### Already hooked up
- Hero ownership, card level (`os_hero.level`) and dupes. Level-up exists (`os_act` op `card`/`level`).
- The party of up to 3 heroes (`os_set_party`) and the infirmary check.
- A delve is a timer (`os_start_delve`, with a Vigor cost). `os_claim` rolls loot by rarity weights from `os_config.drop_rates`, adjusted by floor and by the room choice (kick or shield).
- When the first player gets a hero, `os_grant_hero` turns on that hero's items (`os_item_def.in_pool = true where hero_id = h`). This is already the "first summoner adds the set to the pool" rule.
- `os_item_def` has `slot` and `rarity`, and `os_hero_def.items` lists each hero's signature items.
- `os_player.life` and `life_max`, plus `os_player.rules` (`heal`, `retreat`, `loot`), are stored.
- Some hero perks are already applied: Delivery Rider makes delves 10% shorter on the server. In the client preview engine, mining, smithing, woodcutting, alchemy and mastery perks are applied too.
- Selling uses `os_sellval(rarity)` in whole gold.

### Not hooked up: must be built so every gear stat affects play
1. **No equipment storage.** There is no `os_gear` table. Add `os_gear(uid, hero_id, slot, item_id)` with a unique (uid, hero_id, slot), plus an `os_belt(uid, hero_id, idx, item_id)`. Add an `os_equip(hero, slot, item)` RPC that checks ownership, slot, two-hand rules, unique-equipped items and the required card level, and moves the item out of `os_bag`. Today the client shows a hard-coded `s.gear` for Gaius only.
2. **Items have no stats in the database.** `os_item_def` only has id, name, rarity, slot, hero_id and in_pool. Add `ilvl, bind, unique, hand, type, armor, block, dmg_lo, dmg_hi, speed, stats jsonb, equip jsonb, use jsonb, set_id, req_level, sell_copper, flavor`. Slot values need the full list (`head, legs, feet, hands, neck, ring, off, belt`; today mostly `chest, trinket, main, food, mat`).
3. **Heroes have no stats in the database.** Might, Guard and Knack live only in client `js/catalog.js`. Add `base jsonb {atk,def,hp,spd,crit,luck}` to `os_hero_def` and rename the labels in catalog.js and ui.js. The cards still say Might, Guard and Knack.
4. **No set table or bonus logic.** Add `os_set(id, hero_id, name, bonus_name, text, stats jsonb, effect)` and link items through `set_id`. Today the server only knows `os_hero_def.items`.
5. **There is no fight.** `os_claim` never reads party stats, gear, Health, Speed or Crit. Loot count is only `minutes/4 + party size`, and gold is only `minutes x floor`. The client's foes, HP bars and "38 damage!" lines are static preview data (`engine.js` bibleState). The fix: `os_claim`, or a helper `os_fight(seed)`, runs the formulas above, seeded by `os_delve.seed` (already stored), and returns a log. Its results should drive whether the floor is cleared (today any delve of 15 minutes or more on the deepest floor counts as cleared), the number of loot rolls, gold, injuries, and potion use.
6. **Luck is not in drop rates.** `os_claim` uses only `drop_rates`, floor and the room choice. Multiply the weights by the party's Luck as in section 4.
7. **Potions are not consumed by rules.** `rules.heal` and `rules.retreat` are saved by `os_set_rules` but never read. The client-only `choice: 'eat'` takes one Eel Stew from the bag. The server's `choice` only saves the word. Belt items must be read and consumed in the fight.
8. **Health pool.** `os_player.life_max` stays at its default of 100 on the server. Only the client preview sets `lifeMax = Σ(40 + guard*8)`. Compute it on the server from hero totals when the party or gear changes.
9. **Card level does not scale stats.** Level only changes the label (and the client delve HP of `+6 per level`). Apply `levelMult` on the server.
10. **Equip effects outside combat.** Hustle odds in `os_act` are fixed per job, and gathering timers in `os_tick` come from `os_node` only. To make Fedora, Goggles, Lantern and the set bonuses matter, read equipped effect keys in `os_tick` (gather speed, extra yield), the hustle branch of `os_act` (gold %) and `os_claim` (chest finds, night luck).
11. **Coins.** The database stores whole gold (`os_player.gold int`, `os_sellval` 3..1000). The tooltip shows gold, silver and copper. Either keep gold and show silver and copper as cosmetic fractions, or migrate prices to copper. Copper is simpler for small potions.
12. **Client.** `ui.js` `slot()` shows only an icon and a quantity. It needs the tooltip (`mmo.js` here), the gear and set views on the card back, equip and unequip actions, and the compare view in the bank and loot screens. `play.js` needs `os_equip` and `os_belt` in its RPC map.
13. **Admin (/ledger).** It needs editors for item stats and sets so you can tune balance without code. Today `os_admin` can grant items and set hero level only.

### Suggested build order
Steps 2 and 3 (data), then 1 (equip), then 8, 9, 5 and 7 (fight), then 6 (luck), then 4 (sets), then 10 (effects outside combat), then 12 and 13 (screens), then 11.
