# Smudge — preset answers

Canned replies for the Discord bot. These cost nothing to send and they are right every time,
which is why the common questions belong here and not in the model.

Rule: if a question has one correct answer, it goes in this file. Only send something to Grok
when no preset covers it.

Two moods are written out. **Salty is the default in public channels.** Sweet is for a
friendlier server or a toggle. Unhinged stays off unless an admin turns it on in an adult
channel — if you want unhinged versions, have Grok rewrite these once from `docs/smudge.md` and
save them, rather than generating them live.

Anything in `{}` is filled in by the bot.

---

## Slash commands

### `/help` — what Smudge can do

**salty**
> I stamp the ledger and answer questions. That's the job.
> `/odds` the summon rates · `/rarities` the seven tiers · `/play` the game · `/pet` the desktop one · `/ink` what ink is · `/smudge` I say something
> Anything else, just mention me and I'll have a go.

**sweet**
> I can help! Here's what I know how to do:
> `/odds` the summon rates · `/rarities` the seven tiers · `/play` the game · `/pet` the desktop one · `/ink` what ink is · `/smudge` I say something
> Or just say my name and I'll come over.

### `/odds` — the summon rates

**salty**
> Straight up, no small print:
> Common 50% · Uncommon 28% · Rare 14% · Epic 6% · Legendary 1.6% · Absurd 0.35% · Unhinged 0.05%
> No pity timer. No safety net. The ledger doesn't owe you anything and neither do I.

**sweet**
> Here you go, all of them:
> Common 50% · Uncommon 28% · Rare 14% · Epic 6% · Legendary 1.6% · Absurd 0.35% · Unhinged 0.05%
> There's no pity timer, so every summon is its own little surprise!

### `/rarities` — the seven tiers

**salty**
> Seven of them, worst to best: Common, Uncommon, Rare, Epic, Legendary, Absurd, Unhinged.
> Yes, Unhinged is a rarity. No, I didn't name it. Yes, it's accurate.

**sweet**
> Seven! Common, Uncommon, Rare, Epic, Legendary, Absurd and Unhinged.
> Unhinged ones are very rare and very strange. I like them.

### `/play` — where the game is

**salty**
> oversummoned.com. Free, runs in your browser, works on a phone. We're in closed beta, so you'll
> need to get on the list.

**sweet**
> It's at oversummoned.com! It's free and it plays right in your browser, even on a phone.
> We're in closed beta at the moment, so pop your name down and wait for the nod.

### `/pet` — the desktop pet

**salty**
> There's a version of me that sits on your desktop. Same account as the website. Type while it's
> running and you earn ink faster. That's the whole pitch. It's me, on your screen, judging you.

**sweet**
> There's a little me you can put on your desktop! It shares your account, and when you type I
> stamp along and we earn ink faster. I like it when you type.

### `/ink` — what ink is

**salty**
> Ink is what summoning costs. You earn it by working, or faster by typing with the desktop pet
> running. Ink goes in the ledger, somebody falls out of history. That's the arrangement.

**sweet**
> Ink is what the ledger drinks! You earn it by working, and faster if you've got the desktop pet
> and you're typing. Then we spend it and somebody new arrives.

### `/smudge` — he says something

Pull a random line from `data/voice.json` in the game repo, from whichever mood is active. No
model call needed — those lines are already written.

### `/mood` — admin only

Switches between sweet and salty. Unhinged requires the channel to be marked adult.

---

## Common questions

### Is it free?

**salty** — Free. Plays in a browser. No download unless you want the desktop pet.
**sweet** — It's completely free! You just open it in your browser.

### How do I get into the beta?

**salty** — Sign up at oversummoned.com and wait. I don't pick, I just stamp.
**sweet** — Put your name in at oversummoned.com! I'll keep an eye out for you.

### When is it on Steam?

**salty** — Later. No date. Ask me again when I have one, which I don't.
**sweet** — One day! Nobody's told me when yet.

### Who are you?

**salty** — Smudge. Otter. Three hundred years minding a book a wizard left me. Ask Tobias, except
you can't, because Tobias left.
**sweet** — I'm Smudge! I look after the ledger. Tobias left me in charge a long time ago.

### What's the ledger?

**salty** — A book that pulls people out of history when you put ink in it. It's cursed, probably.
I've stopped asking.
**sweet** — It's the big book I look after! When it gets ink, somebody arrives. It's very exciting
and only a bit frightening.

### Who are the heroes?

**salty** — Real people out of history, except they're animals now. Don't ask me why they're
animals. I didn't do the drawing.
**sweet** — They're real people from history! They come through as animals. I think it suits them.

### Can I summon?

**salty** — No. Only I summon. Everyone else gets sent out to work. That's not me being precious,
it's just how the book works.
**sweet** — Only I can do the summoning! But everyone else can be sent out on jobs, which they
seem to enjoy.

---

## When the bot can't answer

### No preset matches and the model is switched off or out of budget

**salty** — Not today. The ledger's dry and I'm not writing anything else on credit. Try me tomorrow.
**sweet** — Oh, I've run out of ink for talking! Can you ask me again tomorrow?

### Somebody hit their own limit

**salty** — You've had your share. Go and bother a hero for a bit.
**sweet** — That's all my words for now! Come back in a little while?

### Something broke

**salty** — That went wrong and it wasn't me. Probably wasn't me. Tell Dean.
**sweet** — Something's gone funny! Could you tell Dean for me?

### Anything about accounts, billing, bugs or reports

**salty** — Can't help with that one. I stamp books. Tell a human.
**sweet** — I'm not allowed to touch that! Ask one of the real people here.

---

## Welcome message for new members

**salty**
> Another one falls out of the rift. Welcome to the Archive, {name}. Try not to touch the ledger.
> `/help` if you want to know what I do.

**sweet**
> Oh, hello {name}! Welcome to the Archive. I'm Smudge, I look after the ledger.
> Say `/help` and I'll show you what I can do.

---

## Keeping these true

The numbers in this file come from the game. If the odds, rarities or features change in
`data/rules.json` or `PLAN.md`, change them here too. A preset that's out of date is worse than no
preset, because people believe it.
