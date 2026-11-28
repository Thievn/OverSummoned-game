Written by: Claude (Opus)
Date: 2026-11-28
Status: decided with Dean, except where marked open

# The card system

How a card works: what it is, how the two forms fit together, what drops, and how it all maps
onto Steam. Sits on top of `docs/direction-cards.md`, which covers the wider direction (static
art, Smudge as the only animated thing, fixed sets).

For what a card can *do* — abilities, traits, modes — see `docs/ideas/card-abilities.md` by
Poppy Rose. That's still an idea. This file is the container; that one is the contents.

---

## 1. A card is a character, not a picture

One character, one card in your collection. A character can have two faces:

- **The animal.** The default, and what nearly every card is.
- **The human.** Rare. An anomaly.

Both faces are the same character with the same stats, the same abilities and the same name. Only
the picture changes.

You don't collect two cards for one character. You collect one card that may end up having two
faces. That matters, and section 4 is about why.

## 2. Where the human forms come from

The ledger summons from the record, not from history. The animal is how someone was
**remembered**. The human is how they were **recorded**.

So a human card is not a corrected version of a mistake. It's the page underneath — the one the
book doesn't normally give you. Either the record broke, or what came through wasn't from the
version of history we have.

Never write the human form as a fix for a wrong animal. The animals are the hook of the game.

## 3. Rarity, and where anomalies sit

The seven tiers stay as they are: Common, Uncommon, Rare, Epic, Legendary, Absurd, Unhinged.

**Human cards are their own card at the top of the ladder, whatever the character's own rarity
is.** Vesper is Epic; Vesper's human card is an anomaly. Kevin is Common; a human Kevin would be
an anomaly too.

That means rarity stops describing the character on these and starts describing how unlikely it
was that the book coughed that page up. Which is the right meaning for them.

Not every character gets one. Make them where they're worth making, not across the roster.

### What else lives up there

Once the top tier means *the book glitched*, it isn't only about human forms. That tier is the
room for anything:

- the ledger itself
- Tobias
- Smudge's blank page — a card with no picture on it
- someone summoned twice, two of them on one card
- a page from a book that was never written

The rest of the game has to stay orderly for these to land. Keep the rule boring so the
exceptions are funny.

## 4. Double Entry

**The idea.** Whichever face drops first is the one you use. When the other one turns up it joins
the same card. You choose which face it shows. The card gets a mark saying it has both.

A card with both faces is a **Double Entry** — both pages filled in, the book complete on that
person. Double-entry bookkeeping is from Tobias's own century, so the name belongs in the world
rather than sitting on top of it.

**The important part: the merge is in the display, never in the inventory.**

Two items in the backend, always. One card on screen.

If the two genuinely became one item, you could never sell half of it. Someone who owns a Double
Entry and wants to sell just the human would be stuck, and anyone who merged would have destroyed
their ability to trade either piece. That's the opposite of what Double Entry is for.

So: the player sees one card with a face toggle and a mark. The inventory holds two tradeable
things. Sell the human and the card quietly goes back to showing the animal and loses its mark.
Nothing is destroyed, nothing is locked, and it's far easier to build, because it's a view rather
than a transaction.

**Rules that follow from that:**

- A human card is a complete, playable card on its own. If it drops first, you play it.
- The animal arriving later adds a face; it doesn't replace or upgrade anything.
- Display preference is per card and saved.
- The mark appears only while both are owned.
- Stats, abilities and level belong to the character and are shared by both faces. Levelling the
  animal levels the human.

## 5. What drops, and what we say about it

Anomaly cards mostly drop in the Absurd and Unhinged bands. That's a tendency, not a law, and the
site doesn't claim otherwise.

**What stays public:** the drop rate. The game already publishes its summon odds, says there's no
pity timer and makes a point of being straight about it. That honesty is part of what the game
is, so the rate for anomalies is published too.

**What stays quiet:** which characters have a second face. Nobody gets a checklist. Finding out
that a character has another page is the good bit.

## 6. What's on the card

Follow `docs/ideas/card-frame-template.md` by Poppy Rose. The short version:

- The frame is a **border only**, built once per rarity, with an empty middle.
- Art and backdrop sit behind it.
- Everything else — name, the "born..." line, type line, stats, rarity gem, ability text, serial
  number, the Double Entry mark — is real text drawn on top at fixed coordinates.
- A cutout of the character can break past the border. Keep this. It's the thing that makes the
  Vesper mockup feel alive.

**Never generate a card with its frame baked into the picture.** Stats will be tuned for months.
A painted-in number means regenerating the card to change it.

## 6b. Card size

Cards are the standard trading-card shape: **63.5 x 88.9 mm (2.5 x 3.5 inches), which is exactly
5:7, or 0.714**. That's the size Magic, Pokemon and every poker deck use, so sleeves, binders,
print runs and every mockup anyone sends us all line up without an argument.

In CSS that is `aspect-ratio: 5/7`.

**Two things in the code are currently off and should be fixed together:**

| Where | Now | Should be |
|---|---|---|
| `css/os.css` line 89, `.card` | `5/7.2` (0.694) | `5/7` |
| `css/duel.css` lines 39 and 110, `.dslot` and `.dc` | `.72` | `5/7` |

So the same card is a slightly different shape in the collection than it is in a duel. Neither
is standard. It's a two-character change in two files, but it touches the live site, so it ships
when Dean says.

Every frame, template and mockup from here on is built at 5:7.

## 7. Foil

One seamless iridescent texture, scrolled under a mask that covers only the border ring. The art,
the text and the numbers never move. Stronger on rarer frames.

Poppy has already made the texture (2048 and 4096, plus a subtle version for low rarities). It
needs moving off Drive and into the repo.

This doesn't contradict "Smudge is the only animated thing". A shimmer on a border is light
moving across a printed surface, not a hero animating, and it costs nothing per card because it's
one texture and one mask.

## 8. Steam

Trading through the Steam Inventory Service once the game is there. Each face is its own item.
Double Entry is a display state the game works out from what's in the inventory, so Steam never
needs to know the concept exists.

A Double Entry is worth more than either half, which gives people a reason to complete one and a
reason to break one up. Both are good for a market.

**No cash market of our own.** If money is involved it stays in Steam Wallet and Valve handles
the payments, the fraud and the cut. See `docs/direction-cards.md` section 6.

**Open question, raised by Poppy in `card-abilities.md` section 13:** her quirk system gives each
copy a rolled property that travels with it, which means every copy is a slightly different item.
Steam's economy does support per-copy properties — it's how CS2 skins carry wear values and
stickers — but confirm it against the Steamworks docs before any design leans on it.

## 9. Decided, and still open

**Decided:** one card per character, two possible faces · the animal is the default and the human
is the anomaly · human cards sit at the top of the rarity ladder whatever the character is · not
every character gets one · Double Entry merges the display and never the inventory · the rate is
public and the roster is secret · the frame is a border with live text · one direction for the
whole roster.

**Open:** which characters get a second face · the exact anomaly drop rate · whether the top tier
takes non-character cards (the ledger, Tobias, the blank page) and when · what the Double Entry
mark actually looks like · whether quirks survive the Steam check.

## 10. One deliberate exception

Zorp, Destroyer of Tuesdays, is an Alien whose title is **"Definitely a Human."**

His anomaly card should be an actual human being, played completely straight. It only works
because every other card in the game runs the other way.
