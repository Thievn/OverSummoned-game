# Lore brief — for whoever writes the story

Written by Opus, 28 Nov 2026, for Fable to write from. This is the research, not the story.
It says what the game already believes, what must not be contradicted, and what the story has to
answer. Nothing here is prose. The prose is the job.

---

## The thing to know before anything else

**The roster already proves the rule. It just hasn't been written down.**

Dean and Grok landed on an idea: the ledger doesn't summon from history, it summons from the
record — anything that was written down, sung about, gossiped about or believed. That sounded
like a new idea. It isn't. It's a description of what the game has been doing for fifty
characters.

Look at who is already in `data/rules.json`:

| Kind | Who | Their era, as the game states it |
|---|---|---|
| Real people, bent | Cleocatra, Napoleon Bone-apart, Raspawtin, Pharaoh Tutankhamoose, Frau Troffea, General Emu | Alexandria 40 BC, France 1805, St Petersburg 1916, Egypt 1330 BC, Strasbourg 1518, Australia 1932 |
| Nobodies from an era | Gaius Marcellus a legionary, Edith Crane an engineer, Bjorn an ice fisherman, Dolly LaRue a canteen singer, Kevin Latham from an office | Rome 79 AD, London 1880s, Norway 870, Sydney 1942, Today |
| Legends and tall tales | Florida Man, Morwenna Duskwing the hedge witch | Florida today, Black Forest 1600s |
| Things that were only ever made up | Commander Flap, Gorm the Mighty, Pixel Pam, Sgt. Max Carnage | **a movie serial, 1936** · **a toy aisle, 1983** · **a mall arcade, 1983** · **a jungle, 1985** |
| Futures that never happened | Captain Stella Comet | **The Future, as of 1953** |
| Whatever these are | Zorp, Unit B33-P | **Beyond** |

Those era strings are already in the game. A toy aisle is not a place in history. Neither is a
movie serial. The game has been summoning from the record since the first set, so the lore isn't
inventing a rule — it's finally explaining one.

That is the spine of the story. Start there.

---

## Already canon. Do not contradict.

These appear in files the game actually reads. Changing them means changing the game.

| Thing | What's established | Where |
|---|---|---|
| **The ledger** | A book that pulls people out of history when ink is spent on it. Lower case — it's a book, not a title. Possibly cursed. Smudge has stopped asking. | `data/voice.json` |
| **Tobias** | A wizard. Smudge's master. Left Smudge in charge of the ledger and never came back. Left no useful instructions. Smudge is extremely rude about him. Has a grave, or Smudge swears on one. | `data/voice.json` |
| **Three hundred years** | How long Smudge has been minding the book. Stated in all three voice moods. It is the number. | `data/voice.json` |
| **The Archive** | Where Smudge lives and works and where the ledger is kept. Home base. | `data/voice.json`, `data/expeditions.json` |
| **The city** | Where summoned heroes end up living. | `data/lore.json`, `data/arrivals.json`, `PLAN.md` |
| **The rift** | The hole in time that crates and strangers fall out of. | `data/voice.json`, `data/rules.json` |
| **Ink** | What summoning costs. Earned by working, faster by typing with the desktop pet. | `data/rules.json` |
| **Only Smudge summons** | Every other hero can be sent out on jobs. Nobody else works the book. | `PLAN.md` |
| **Summoning goes wrong** | Half of them are accidents. Smudge apologises to the people he pulls through. He does not treat them as servants. | `data/voice.json` |
| **The hood** | Smudge's. From the 1400s. Smells like it. Itches. | `data/voice.json` |
| **Seven rarities** | Common, Uncommon, Rare, Epic, Legendary, Absurd, Unhinged. | `data/rules.json` |
| **Places the heroes work** | Ostia docks, Bondi, a fjord, a Chicago speakeasy, a vault, a closet, the outback, the Black Forest, the Archive. | `data/expeditions.json` |

**Read `data/voice.json` in full before writing a word.** It is the only place Smudge's character
actually lives, and it's three hundred lines of him in three moods. The story has to sound like
the otter who already exists, not a new one.

Also read two or three expedition entries in `data/expeditions.json` — those were written by
Fable and they are the tone the rest of the writing should match.

---

## Proposed, not decided

**Why Smudge is an animal.** Dean asked: if the ledger can bring people through as humans, why
is the one who works it an otter?

The proposed answer: Smudge was summoned too. The first one, pulled through before Tobias
understood the book, and he came out an otter because that is how the record remembered him. He
stayed because there was nowhere to send him back to. And his own page in the ledger is blank —
three hundred years writing down other people's names, and his own entry is the one nobody ever
filled in.

It fits the voice lines that already exist (the thank-you card, "apprentice of WHAT, Tobias"), it
keeps him an otter forever, and it gives the game its rarest possible card: Smudge's own human
form, which nobody has seen, including Smudge.

Dean likes it. It is not locked. If something better comes out of the writing, say so.

**Where his name came from.** "Smudge" is not a name. It is what Tobias called the mark on the
page — the blot where an entry should have been. Three hundred years later he is still the only
one in the book without a proper entry, and he is named after the fact.

This also settles a question Dean raised: if he ever gets a human card, it is not a human called
Smudge, because Smudge was never a name. Whoever is under there has a real one and nobody knows
it, him included.

**Tobias, and the date.** Three hundred years back is about 1726, which is not an age of wizards,
and that is better than inventing one. 1726 is the tail end of alchemy — Newton had died the year
before, having spent much of his life on it — and the century of the great cataloguing projects,
men trying to write down everything that was known.

So Tobias is not a wizard in a tower. He is a scholar who set out to compile a record of
everything that had ever been written down, and got further than he should have. The book started
writing back.

That gives a ledger that works as an object, a Tobias who works as a man, and no need for an age
of magic. It also keeps the three hundred years exactly as stated, which matters because the
number is in all three voice moods.

Loose thread worth using rather than fixing: the hood is from the 1400s, which is also canon. The
simplest answer is that the hood is older than he is — it came through the rift, or Tobias had it
already. A three-hundred-year-old otter in a six-hundred-year-old coat is a better detail than
either fact on its own.

**The Archive travels, and so does Smudge.** This one is already canon and easy to miss. His
"move" lines in `data/voice.json` include *"Hold on to your ass, we're jumping centuries"* and
*"New place, same otter, same damn ledger."* He goes.

The way it holds together: the Archive is not in a place, it is attached to the rift, and the
rift moves. Where it opens is where you can go. Smudge travels because the Archive travels — he
packs the snacks and the ledger and the whole room goes with him.

The heroes get *sent* on expeditions because Smudge has to stay and work the book. He is the only
one who can, so he is the one who never gets to go on the jobs. Worth keeping: it is a small
tragedy for a character who complains for a living, and it uses both things the game already does
without changing either.

**Two forms per character.** The animal is how they were *remembered*. The human is how they were
*recorded*. Neither is wrong and neither is the true one. Do not write the human form as a
correction of a mistake — the animals are the hook of the game and the lore must not call them
an error. See `docs/direction-cards.md`.

---

## Not canon, despite appearances

**"The Order."** Grok used this in a conversation with Dean, as in the Order's clerk writing down
names. It is nowhere in the game. There is no Order. There is a wizard who left and an otter who
stayed.

It might be worth having — it would explain who built the Archive and who Tobias answered to. But
it is a new invention, so decide it on purpose rather than inheriting it by accident.

**Names for the human forms.** Grok suggested "born Vivien Blake" for Vesper, "born Cleora of
Canopus" for Cleocatra. The rule behind those is good: close to the pun, never the actual famous
person. Cleocatra's human is not Cleopatra. Keep the rule; the specific names are up for grabs.

---

## What the story has to answer

Roughly in order of how much the game needs them.

1. **What is the ledger, and where did it come from?** Who made it, and why does it work the way
   it does. This is the centre of everything.
2. **Who was Tobias and where did he go?** The single biggest hole. Smudge's whole personality is
   built on being abandoned by him, and we know nothing else.
3. **Why do they come through as animals?** The answer that makes the two-form system work.
4. **Why is Smudge an otter?** See above. Needs writing out properly.
5. **What is the Archive?** A room, a building, a place outside time? Who built it?
6. **What is the city?** Where fifty people from six thousand years of history now live together.
   What is that like. This is probably the richest thing in the setting and almost nothing has
   been written about it.
7. **What is "Beyond"?** Two cards claim it as their era. It needs to mean something.
8. **What is the rift and why does it drop crates?** It behaves like weather. Does anyone
   understand it? (Smudge does not.)
9. **Can anyone go back?** Nobody has asked this in the game yet. Somebody will.
10. **Why those nine places?** Ostia, Bondi, a fjord, a speakeasy, a vault, a closet, the outback,
    the Black Forest. Is there a reason the ledger reaches those, or is it random?

---

## What to write

Five pieces. Short is better than long — this gets read by players in a lore tab and quoted in a
Discord, not studied.

1. **How the ledger works** — one page. The record, not history. The four kinds of thing it can
   reach, with an example card for each from the table at the top. This is the load-bearing one;
   everything else can wait.
2. **Smudge** — one page. The blank page, Tobias, three hundred years, why he's still there.
3. **The Archive and the city** — one page. Where this all happens and what it's like to live
   there.
4. **Tobias** — half a page, and leave it unfinished on purpose. A mystery with an answer written
   down somewhere is better than one with no answer, but players shouldn't get it yet.
5. **The two forms** — a few paragraphs. Remembered and recorded. Written so it reads as wonder
   rather than as a patch.

## How it should read

Plain words. Short sentences. The game is funny and the lore should be too, but the lore is the
straight man — Smudge does the jokes, the world doesn't. No "ancient tome of untold power", no
prophecy, no capital-letter nouns that haven't earned it.

Whatever gets written has to survive being read by someone who already owns Gorm the Mighty, an
action figure from a toy aisle in 1983, and Zorp, who insists he is definitely a human. If the
lore can't hold those two with a straight face, it's the wrong lore.

## Where it goes

`docs/lore.md`, next to this file. If it gets long, split it into `docs/lore/` with one file per
piece. Don't put it in `data/` — that folder is read by the game and this is for people.
