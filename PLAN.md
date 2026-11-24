# OverSummoned: the list

The running list of everything agreed. Ask "what's left" and this is the answer.
Status: [x] done, [~] partly done, [ ] not started.

## Direction
- Web first. The website is the full game (mobile friendly), summoning included.
- The desktop pet (Godot) is an optional download that shares the same account. Typing earns ink faster.
- Steam comes later. "Coming to Steam" button until then.
- Only Smudge summons. Every other hero can be sent to work jobs.
- Locked to thievnsden@gmail.com until signups are opened.

## Art
- [x] Every icon regenerated on a green screen so no white is ever trapped
- [x] Icons checked on dark, light and purple before shipping
- [x] Card backdrops: a soft painting of where each hero is from
- [x] One frame template per rarity, fancier as rarity rises
- [x] Silhouettes keep their rarity frame
- [x] Morwenna redone as a proper moth, Chad as a proper lemming
- [x] Head no longer leaves a still copy behind when Smudge tilts it
- [~] Every hero cut into a puppet: all 26 have a moving head and blink; 7 also have a moving tail. Arms, props and capes are still one piece with the body. Albrecht, Blackbear and Chad have no blink (goggles, dark fur, sunglasses)
- [x] Every new character goes through the same puppet step (rules/heropup.py: add a head outline and a neck joint)
- [ ] Smudge: moving pupils, more mouth shapes

## Rarities and summoning
- [x] Seven rarities: Common, Uncommon, Rare, Epic, Legendary, Absurd, Unhinged
- [x] Odds 50 / 28 / 14 / 6 / 1.6 / 0.35 / 0.05, shown openly, no safety net
- [x] Florida Man and General Emu move to Absurd; new Unhinged heroes
- [x] Summon animation: ring fills, flashes the rarity colour, card rises out

## Accounts
- [~] Login page: username (live "available / taken" tick), password, retype, Google and Steam buttons the same size
- [~] Optional "Connect Steam" in the account; notice where Steam is needed
- [x] Account settings page
- [~] Saves stored on the account, not the browser
- [~] Play now goes to login; the game does not load without an account
- [~] Admin button, only on the owner's account

## The web game (Melvor and Torn style, simple but deep)
- [x] Player dashboard after login
- [x] First-run guide
- [x] Jobs: assign heroes to places, timers, mastery, offline progress
- [x] Workshop: tonics, gear upgrades
- [x] Training: energy bar, train a hero's stats
- [x] Raids: team of three against era bosses
- [x] Crates stack in the bag; open by hand or automatically (setting)
- [ ] Stay / Wander / Hunt
- [ ] When ink is full Smudge goes home and summons
- [ ] Treasure gets a second use beyond selling
- [~] Social: friends, profiles others can view, leaderboards, a city feed, gifting, crews, chat
- [ ] Trading and the player market (after the economy is proven)

## Landing page
- [x] "Twenty-four strangers and counting", number updates itself
- [x] Lost Property and Arrivals both say more is coming
- [~] Samples of the game screens
- [~] "Download the desktop pet" and "Coming to Steam"

## Admin panel (owner only, enforced on the server)
- [~] Overview graphs: visitors, page views, signups, active players, summons, gold and ink
- [~] Players list and search
- [~] Characters and items galleries with stats, odds and ownership
- [~] Economy numbers live
- [~] Marketing studio: Grok writes TikTok and X posts and makes images (key stays on the server)
- [~] Our own page-view tracker

## Shop
- [x] Shop page shell: cosmetics, cart, "coming soon" checkout
- [ ] Real payments (needs a payment account in Dean's name)

## Desktop pet
- [x] Fable build: puppet Smudge, 9 places, 24 heroes, crate, loot lists
- [ ] Sign in with a link code so heroes and ink sync with the web
- [ ] New rarities, stacked crates, Stay / Wander / Hunt
- [ ] Windows download from the site
- [ ] Count keys in other apps (Windows add-on)
- [ ] Sounds for the new places

## Waiting on Dean
- [x] Approve the database change (accounts, saves, page views, admin numbers)
- [ ] Later: add the preview address to Supabase's sign-in redirect list (Authentication, URL Configuration), then test Google sign-in
- [x] Deploy of the Grok marketing function
- [ ] First real sign-in test with Google on the preview, then open the Owner's office and try the marketing studio

## Known gaps
- Saves are trusted from the browser. Before trading or real money, move the rolls to the server.
- Built pages marked [~] are written and tested with sample data, but not yet against the live database.
- A leaderboard exists; friends, gifts, crews and chat do not yet.

## Tuning
- [ ] Web game running around the clock levels too fast (about 4 weeks to 99)
