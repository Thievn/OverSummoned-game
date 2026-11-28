# Direction: cards, art and what moves

Decided 28 Nov 2026. This is the shape of the game from here. If something elsewhere disagrees
with this file, this file is newer — but check with Dean before acting on the difference.

---

## 1. Smudge is the only animated thing

Heroes are static card art. No puppet cut, no head joint, no blink, no tail. New heroes cost
"generate the art, cut the background" and nothing else.

All animation effort goes into one character, rigged properly in DragonBones.

The 26 heroes that already have a moving head and blink keep it. There's no reason to tear out
work that already runs. Just don't do it for new ones.

**Why.** Rigging was the bottleneck and the thing that kept breaking. It scaled with the size of
the roster, which is the worst way for a cost to scale in a collecting game. Cutting it takes a
hero from an evening's work to a few minutes.

## 2. Cards are props in Smudge's animation

Heroes don't stand next to Smudge. Their **cards** do. He deals them, stamps them, slides them
across the desk, holds one up, drops one when something startles him. A card falls out of the
rift and lands by his paw.

One prop type, reused for every hero forever. It also happens to be what the lore says is
literally happening: they come out of a book as entries.

Speech bubbles can point at a card the same way they point at Smudge. Same code, different
coordinates.

## 3. The frame is a template, not generated art

The card frame — border, name bar, art window, type line, stat boxes, rarity gem — is built once
and reused. Only the character art, the backdrop, the text and the numbers change.

**Never generate a card with its frame baked into the picture.** A stat changes, a name changes, a
rarity changes, and a baked frame means regenerating the whole card. Numbers have to be real text
on top of a template.

Generated art is the character and the backdrop. Everything else is the template.

## 4. Two forms per character

Every character can have two cards:

- **The animal.** The default, the face of the game, and what most people collect.
- **The human.** Rarer, a chase card.

Same stats, same name, same character. Only the picture changes.

### How they relate, in the lore

The animal is how the character was **remembered**. The human is how they were **recorded**.
Neither is wrong and neither is the "real" one.

Do not frame the human form as a correction of a mistake. That tells players the animals — the
whole hook of the game — are an error, and the animals are the best thing about it.

### Names

Keep the pun names. They're some of the best jokes in the game and only about fifteen characters
have them anyway. On a human card, add a small "born..." line underneath with a name that sounds
close to the pun without being the actual historical person. Cleocatra's human card says "born
Cleora of Canopus", not "Cleopatra".

## 5. Cards are scarce on purpose

Art is now cheap enough to make endlessly. That is the danger, not the opportunity.

A game with three thousand cards has no chase, because nothing in it is rare. Every trading card
game that works solves this the same way: fixed sets, fixed rosters, each set closed when the
next one opens.

So the limit has to be deliberate. Something like sixty cards a set, a few sets a year, each with
its own rarity spread and its own secret rares. Make art all week; ship it on a schedule.

## 6. Trading

Player-to-player trading through the **Steam Inventory Service** once the game is on Steam. It
gives persistent inventories without running item servers, and trading and the Community Market
can be switched on or off per item at any time.

**No cash market of our own.** If money is involved, it stays inside Steam Wallet and Valve
handles the payments, the fraud and the cut. Cards with real cash value that come out of random
summons is loot-box territory, which is regulated in several countries, and running the money
side means chargebacks, fraud, identity checks and tax reporting. That is a second job.

Cosmetics for Smudge are the thing we sell directly. One base, many cheap overlays.

## 7. Why Smudge is an animal — PROPOSED, not decided

Dean asked the right question: if the ledger can bring people through as humans, why is the one
who works it an otter?

The answer that fits what's already written: **Smudge was summoned too.** He was the first one,
pulled through before Tobias understood the book, and he came out as an otter because that is how
the record remembered him. He stayed because there was nowhere to send him back to.

And his own page in the ledger is blank. Three hundred years of writing down other people's names
and his own entry is the one nobody ever filled in. Which is exactly why he wants a thank-you
card, and why he's still waiting for Tobias.

This gives the game a permanent mystery and its rarest possible card: Smudge's own human form,
which nobody has seen, including Smudge.

It also keeps him an otter forever, which protects the thing the game is known for.

## 8. Order of work

1. Train one Scenario model on the character style, covering both animal and human forms.
2. Do three test characters in both forms. Put them next to the existing cards and judge.
3. Only then decide whether to redo the whole roster.
4. Rebuild the card frame as a proper template, with the foil treatment for rare cards.
5. Finish the Smudge rig.
6. Steam, then trading. In that order.
