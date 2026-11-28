Written by: Claude (Opus)
Date: 2026-11-28
Status: decided with Dean, numbers still open

# Loot and the junk problem

Dean's words: the game has too many junk items that get sold for gold. He's right, and the
cause is mechanical rather than a matter of taste.

## What's actually wrong

Loot in `data/rules.json` has exactly three properties: a drop weight, a sell price, and a tiny
luck bonus. **One verb: sell.**

Around that sit two limits:

- the bag is 90 slots, expandable to 210 for increasing gold (`bag.cost_base` 400, step 1.4)
- gold has a daily sell cap of 2,000 plus 20 per level (`gold.daily_sell_cap_base`)

Put those together and surplus junk isn't just boring, it's **worthless**. You hit the cap, and
the rest sits in a bag you paid gold to expand. The game asks you to carry things it won't let
you convert. That is the whole feeling Dean is describing.

59% of loot rolls are common (`loot.weight`: 20 common, 9 uncommon, 4 rare, 1 epic).

## The fix: give junk a second verb

The problem is not that junk exists. It is that junk has one fate, so picking it up is a task
rather than a decision. Every loot game that works gives a worthless thing at least two possible
ends.

**Junk grinds down into ink.**

Ink is already the summoning currency, already the thing that gets spent on the ledger, and
Smudge is a clerk with a cursed book. Grinding worthless objects into ink is exactly what that
character would do with them, so it needs no explaining to a player.

It also steps around the daily gold cap, so a full bag stops being dead weight.

### The rhythm this creates

Neither fate should dominate, or it isn't a choice. The daily gold cap does the work:

- early in the day, selling is better, so you sell
- once you hit the cap, gold is worth nothing more today, so you grind
- a player who summons a lot will grind earlier than one who is saving for gear

So the same pile of junk is worth different things to different players on different days, which
is the whole point.

**Numbers are not set.** Pick them so that grinding is clearly the worse deal while you can still
sell, and clearly the better one once you cannot.

## Two things to ship with it

**Drop less.** 59% common is a lot of noise, and rarity feels better with less of it around.
Cutting the common weight makes every other drop land harder and costs nothing to try.

**One button.** Convert everything below a threshold the player sets, in one press. A pile you
have to clear by hand is the chore regardless of what it turns into. Without this, the second
verb makes the problem worse rather than better, because now there are two things to do by hand.

## Other options, ranked

Worth having later; none of them replaces the second verb.

1. **Three of a kind combines** into something better. The gear sets already work this way
   (`set_vesper` and friends, three pieces each), so the idea is already in the game's grammar.
2. **Junk as expedition fuel** — spend it to send a hero further, longer, or with better odds.
   Ties the junk pile to the thing it mostly came from.
3. **Feed it to Smudge** in the desktop pet. He is already fishing and digging; letting him eat
   the rubbish is in character and gives the pet a reason to matter to the web game.

## How this touches Poppy's ability design

It helps it. `docs/ideas/card-abilities.md` already has an **Inky** helper lane (heroes who make
Smudge earn more ink) and a **Fortune** lane (better loot). If junk becomes ink, both get more
valuable without a single number changing, because ink stops being only a summon cost and starts
being what the whole loot pile turns into.

Worth her checking whether Inky needs rebalancing once ink has a second source.

## Open

- the grind rate per rarity, and how it sits against the sell price
- whether the threshold is a rarity, a gold value, or player-set
- whether gear can be ground too, or only loot
- whether ground junk should ever give something other than ink at high rarities
