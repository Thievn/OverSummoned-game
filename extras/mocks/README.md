# OverSummoned: the idle game, as mockups

These are mockups only. Nothing here is wired to the live site or the repo.

## What's in this folder

| Path | What it is |
|---|---|
| `png/home.png` ... `png/crew.png` | Desktop screens, 1440x900 at 2x |
| `png/phone_*.png` | Phone screens, 390x844 at 2x |
| `png/card_backs_lineup.png` | All 9 card backs: front-facing hero doing their skill on a background from their home era |
| `card_backs/*.gif` | The same card backs, animated (idle, then skill, then idle) |
| `concepts/concept_*_melvor.jpg` | Image-generator concepts built from a Melvor-style layout plus our real logo, portraits and sprites |
| `concepts/old-mockup-based/` | Earlier concepts that leaned on the Nov 21 mockups. Kept for the record, not used. |
| `html/*.html` | The source for every screen. Open one in a browser to see the sprites animate. |
| `src/gen.py`, `src/common.py`, `src/mocks.css`, `src/render.py` | Builds the HTML and renders the PNGs |
| `assets/` | Pixel portraits, side sprites, new front-facing sprites, icons and backgrounds used above |

Screens: City Hub (Will Slapton featured), Mining, Cards (front and flipped back), Delve, Bank and Smithing, Market with Waystone travel, Hustles with the Stocks and a crew heist, Crew with live chat, and phone versions of Home, Delve, the card back and the Welcome Back summary.

## The core loop

1. **Train a skill.** Pick one skill (Mining, Woodcutting, Fishing, Cooking, Smithing, Alchemy, Summoning). It runs on a timer, gives XP and items every action, and keeps running while you are away (up to 24 hours). Each skill has a Mastery Pool with rewards at 10, 25, 50 and 95 percent, just like Melvor.
2. **Put a hero card on it.** Every card has a perk ("Mining +15% speed"). Cards make skills better, so collecting cards matters even if you never fight.
3. **Craft and stock up.** Ore becomes bars, bars become gear, fish becomes food. Everything sits in the Bank grid.
4. **Delve now and then.** Pick a squad of cards and send them down a dungeon. Fights run on their own, with an occasional "big moment" choice. The boss at the bottom drops rare cards.
5. **Spend your bars in the city.** Vigor (refills over time) pays for delves and training bursts. Daring (refills slower) pays for Hustles: quick risky jobs for fast gold. Fail one and you sit in the Stocks for a while. Lose a delve and your hero rests in the Infirmary. Life is your squad's health.
6. **Trade and travel.** The Market is player-run, with prices that move. Waystones take you to other cities where some goods are cheap, so buying abroad and selling at home is its own game.
7. **Play with friends.** Crews share a chat, a vault, a weekly goal, crew heists and crew raids, and climb the Crew Cup. The Aldermere Crier is a live newspaper of what everyone is doing (big pulls, market spikes, bosses killed).
8. **Come back.** The Welcome Back screen shows everything your heroes did while you were gone, and you collect it in one tap.

Everything feeds the card collection: card shards drop from skills, Hustles, delves and crew goals. Duplicates level a card up. Era sets ("Legions of Rome", "Red Carpet Legends") give permanent bonuses. The plan is room for 1,200+ cards, so there is always one more to chase.

## How the screens connect

- The **sidebar** is the whole game, Melvor-style: The City (City, Hustles, Travel, Infirmary, The Crier, Market, Crew), Skills with levels, then Adventure (Delve, Cards, Bank).
- The **top bar** always shows Vigor, Daring and Life with refill timers, plus whatever you are training right now.
- The **City Hub** is the dashboard: what is training, the running delve, Hustles ready, the crew goal, the Crier, who is in the Stocks or Infirmary, and Waystone deals. The featured card (this week: Will Slapton) lives on the right.
- On phones the sidebar becomes 5 tabs (City, Skills, Delve, Cards, Crew) and the current action rides above them.

## What changes compared with Claude's version (/play)

- Skills become real and come first. Right now they are "Soon" tiles stuck at Level 1. Here they are the main thing you do.
- City systems get added: Vigor and Daring bars, Hustles, the Stocks, the Infirmary, Waystone travel, a working Market and the Crier as a real newspaper.
- Delves stay, but you can watch them and make the odd choice, instead of only a progress bar.
- Cards get a purpose outside fights (skill perks), duplicates that level them up, era sets, and a back that shows the hero animated in their home era.
- Crews become real: chat, vault, goals, heists, raids and a leaderboard.
- A Welcome Back screen, so returning feels like a reward.
- Same logo, same pixel portraits, same dark and neon look.

## Weak spots in Claude's /play today

1. Only one loop works: pick a party, start a timed delve, collect. Skills, City, Market and Crews are all "Coming in a later build" placeholders.
2. Skills look playable but are fake: every bar is empty and says "Level 1".
3. A delve is a bar and a countdown. There is no fight to watch and nothing to decide. The "1 min (test)" length is visible to players.
4. Nothing to do while a delve runs, and no summary when you come back.
5. No social play yet. The Crier only shows the feed when there is one, and there is no chat.
6. Cards have no long-term goal: no levels from duplicates, no sets, no reason to own a common.
7. Some player copy breaks the house rules: "Server-side, so nothing gets duped", "The dungeon runs on the server clock", "Melvor-style" in the Skills intro, "Something broke." as an error, and all-caps buttons like "NICE" and "COLLECT LOOT".
8. Card art is mixed: some heroes use the new portraits, others the older pixel set.
9. The menu shows an "Admin" link to everyone. It may be locked on the server, but players shouldn't see it.

## APIs/tools that would help

Dean doesn't make the art or the code, so this list is about what saves the most work. Prices are rough and change often.

**Bottom line: what we already have (PixelLab, Supabase, Vercel, Resend, and the image generator here) is enough to build all of this.** The only paid thing worth adding is music, plus two free tools to see crashes and where players quit.

### Already have, keep using

| Tool | Rough cost | Why it matters |
|---|---|---|
| PixelLab | About $10 to $50 a month depending on plan | Makes every portrait, sprite animation, item icon and pixel background in a matching style. It made everything in these mockups, so it can carry 1,200 cards. |
| Supabase | Free now, about $25 a month once real players arrive | Accounts, saves, the market, crews and the offline timers. Its Realtime feature runs crew chat and the live Crier with no extra service. |
| Vercel | Free now, about $20 a month later | Hosts the game and preview links. |
| Resend | Free up to about 3,000 emails a month | Waitlist mail, login links and "your delve is done" emails. |
| Image generator (here) | Included | Concept screens and marketing art. Not needed for in-game pixel art, since PixelLab covers that. |

### Worth adding

| Tool | Rough cost | Why it matters |
|---|---|---|
| Suno (music) | About $10 a month, paid plan needed for commercial use | Background loops for the city, each skill and boss fights. An idle game is on screen for hours, so music matters a lot. |
| ElevenLabs Sound Effects, or free packs (Kenney, Freesound CC0) | Free to about $5 a month | Pickaxe hits, card flips, coin sounds, level-up chimes. Free packs cover most of it. |
| Sentry | Free tier | Tells us when the game breaks for a player, before they complain. |
| PostHog | Free tier | Shows where new players stop playing, so we fix the right screen first. |
| A chat filter (OpenAI moderation is free, or a simple word list) | Free | Crew chat and the Crier need basic protection from abuse. |

### Later, only when it's time

| Tool | Rough cost | Why it matters |
|---|---|---|
| Stripe | About 3% per sale | Only if we sell cosmetic card frames or a supporter pack. Not needed to build. |
| Web push (OneSignal free tier) | Free | "Your delve is done" taps on a phone. Nice, not needed at first. |

### Fine to skip

- Game engines (Unity, Godot) and 3D tools like Blender. This is a web game with pixel art, and the 3D look is out.
- Aseprite or other drawing apps. They're for artists, and PixelLab covers the art.
- Paid asset stores. They won't match our style.
- Separate realtime or game servers (Photon, Colyseus) and extra databases like Redis. Supabase handles chat, market and timers for an idle game.
- Extra image generators for icons. PixelLab already matches our icon style.

## PixelLab use for this pass

About 75 generations: 9 front-facing idle animations, 9 front-facing skill animations, 7 era backgrounds, about 41 icons and about 9 scenes or rock nodes.
