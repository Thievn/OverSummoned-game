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
- [x] Cards redrawn as calm trading cards (name bar, art window, type line, text box, rarity gem); no moving frames, corners or shake. Top three rarities keep a quiet foil edge and glow
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
- [x] Standing orders on every job: Stay, Wander (next open place every 15 min), Hunt (goes where the things you still lack are likeliest, hero's own signature gear counts triple)
- [x] When ink is full Smudge summons by himself (a setting in the account; works while you are away, capped at 25 at a time)
- [x] Treasure's second use: the cabinet in the bag. One of each on display = all ink worth +0.5% per piece for good; a finished place set = +10% work speed there
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
- [x] Desktop pet on the current rulebook: seven rarities, all 26 heroes (tested: summon, menu, places, sleep)
- [ ] Desktop pet: stacked crates, Stay / Wander / Hunt
- [ ] Windows download from the site
- [ ] Count keys in other apps (Windows add-on)
- [ ] Sounds for the new places

## DragonBones (bone rigs)
- [x] DragonBones runtime (open source) pulled in; plays in the browser on the site
- [x] `rules/dbexport.py` writes real DragonBones files from the cut parts and joints
- [x] Smudge stamp pose as a test: shared bone names, three-bone tail with a bending mesh, idle / stamp / cheer / blink / talk; test page at `/dbtest.html`
- [x] Dean chose DragonBones (likes the tail). Keep the current rig's blink style and smaller mouth
- [x] Stamp pose recut (`rules/smudge_stamp_cut.py`): white fringe peeled, head no longer takes the feather, arm cut from the shoulder with the cloak painted in behind, fist and stamp on a wrist joint so the stamp lands face-down
- [x] Fishing, lockpicking and digging recut (`rules/smudge_fish_cut.py`, `_pick_`, `_dig_`, shared helpers in `rules/cutlib.py`): hood no longer takes the feather, whole arms on the lockpick pose, shovel slides under both fists, legs and tails reach up under the body so no gaps open
- [x] White-edge check: only the stamp pose had it. Other Smudge poses and spot-checked heroes are clean; heroes left untouched (auto-peel would eat blades, grey fur, white shirts)
- [x] Version stamp on art and data links (`OS.VER` in `js/os.js`); bump it whenever art changes
- [x] Stamp pose shoulder: round fur cap on the arm, chest strip no longer covers the lowered arm
- [x] All four working poses are DragonBones rigs (`rules/dbexport.py` writes `assets/v2/db/smudge_<pose>_*`): shared bones, bending tail, same move names on each (idle, act, cheer, blink, talk)
- [x] `DBCanvas.Puppet` in `js/dbcanvas.js`: drop-in Smudge player (act / cheer / say), loads each pose on demand
- [x] Sleeping pose as a DragonBones rig: back rises and falls, snout and paw twitches at random, tail tip curls, three Zs ripple one after another
- [x] Recut Smudge parts and rig copied into the desktop pet (`desktop-fable/`); arm swings from the shoulder there too. Runs clean in the headless test. It still uses the simple rig (no bending tail yet)
- [x] All 26 heroes exported on the shared skeleton (`python3 rules/dbexport.py heroes` -> `assets/v2/db/hero_<id>_*`), bending tail on the seven that have one; `DBCanvas.Puppet(host, id, scale, {hero:true})`
- [x] Every hero's head recut (`rules/hero_cut.py`): lower edge feathered into the body, neck and collar painted in underneath, so heads tilt with no slit and no stuck copy
- [x] Soft moving spots on 24 heroes (`SOFT` in `rules/dbexport.py`): props, wings, bags, extra tails sway or bob with no cut, so no seams. Placed by eye from stills; not yet reviewed in motion
- [ ] Heroes: properly cut arms and weapons for bigger moves (hand work per hero). Head outlines are still the first coarse ones, so a hat brim or a weapon beside the head moves with it
- [x] Game and landing page now draw Smudge and the job-screen heroes with the DragonBones player (`OS.Puppet` hands over to it when `dbcanvas.js` is on the page; old rig stays as fallback)
- [x] Soft chest bone with bounce-and-settle on Cleocatra, Astrid, Bella, Lola and Frau Troffea (`CHEST` in `rules/dbexport.py`)
- [x] Player download halved: comments stripped from the core (680 KB to 328 KB before compression)
- [ ] Proper minify of the player and loading it after first paint (needs a build tool; none in the workspace)
- [ ] Godot desktop pet: play the same files (add-on if one works on 4.3, otherwise a small player on Godot's built-in Skeleton2D)
- [ ] The DragonBones editor itself is a Windows/Mac hand tool; files can be opened there for hand polish later

## Waiting on Dean
- [ ] Header logo: tried a ring-O wordmark, Dean did not like it; plain two-tone restored. Logo and icon set on hold
- [ ] Going live on oversummoned.com: Dean said yes once the Torn/Melvor mechanics are done. Not yet: crews, market, making skills, and the hero-jobs question are open. Preview only for now
- [x] Approve the database change (accounts, saves, page views, admin numbers)
- [ ] Later: add the preview address to Supabase's sign-in redirect list (Authentication, URL Configuration), then test Google sign-in
- [x] Deploy of the Grok marketing function
- [ ] First real sign-in test with Google on the preview, then open the Owner's office and try the marketing studio

## Known gaps
- Saves are trusted from the browser. Before trading or real money, move the rolls to the server.
- Built pages marked [~] are written and tested with sample data, but not yet against the live database.
- A leaderboard exists; friends, gifts, crews and chat do not yet.

## Raising a card (the point of everything)
- [x] The full kit: a hero wearing two of their own three signature pieces gets +10% to every stat; all three gives +25% and +10% work speed. Shown on the hero sheet
- [x] Stats page in the account: collection, work, ink and gold, fights, time played (counts from when it was added)
- [x] Final card design, on every card: front has the five numbers, power and a dot per gear slot; back has the hero standing idle (animated on the opened card) with gear down both sides, bonus lines, a slim stat line, and the story behind the "i"
- [x] Eight slots: weapon, head, body, feet, charm (opens at card level 5) for gear anyone can wear; plus the hero's own three pieces, which only that hero can wear
- [x] Era gear (`rules/gear2.py`): 130 pieces, five per hero's time and place, all rarities, 26 three-piece sets (bonus at 2 and 3), weapon and charm specials. Drops where that hero's own gear drops. Icons cut from green screen
- [x] Armory in the bag: every piece owned, filter by slot, shows who wears it. Empty slots glow when something fits
- [ ] RULE for every new hero: also add their three own pieces plus five era pieces (weapon, head, body, feet, charm) to `rules/gear2.py`, generate icons on green screen, rebuild
- [ ] Hero eyelids are off (eye positions inaccurate); place by hand per hero to bring blinking back
- [ ] Balance check for era gear: stat budgets and the special percentages are first guesses
- [x] The bench in the Workshop, three making skills with levels and bars: Cooking (fish to energy or a raid ticket), Tinkering (junk to spare parts, which gear upgrades now need), Restoring (junk to a missing cabinet piece, treasure to a card shard)
- [x] Completion percentage on the dashboard (heroes, cabinet, gear, bosses, levels)
- [x] Card backs come to rest flat after the flip so they are drawn sharp
- [ ] Mastery per treasure
- [ ] Crews, market, per-skill leaderboards (needs database approval)

## Voices
- [x] Crew chatter: each hero has five lines and two replies in their own voice (`rules/chatter.py` -> `data/chatter.json`, 182 lines, written by hand). One speaks every 11 to 21 seconds; sometimes one other answers. Never two at once. A crew member reacts when Smudge finds treasure
- [ ] Grok voices: have Grok write a bigger set per hero ONCE, from the owner's office, and store it in the database for everyone. Never per player or per visit, so credits are spent once per hero. Needs database approval
- [ ] RULE for every new hero: add their lines to `rules/chatter.py`

## Loot
- [x] Junk loot (`rules/junk.py`): 63 sell-only finds (local fish, lost property, daft things; 7 per place plus 7 that fall out of the rift anywhere). Mostly 1 to 9 gold, a few worth 20 to 50. Not part of the cabinet. "Sell spare treasure" sells all junk
- [ ] Gold needs more to spend on (today: gear upgrades). Ideas: market, shard purchases, cosmetics
- [x] DECIDED and built: Smudge does the work himself, one place at a time, animated. Up to three heroes stand behind him as crew (slots at total level 0, 15, 45) and add speed, luck, gear bonuses and mastery. Standing orders (Stay, Wander, Hunt) are Smudge's
- [x] Expeditions: heroes not in the crew go home to their own era for 1, 4 or 8 hours and bring back loot, ink and mastery; can be called back early for less
- [x] No daily sell cap; treasure sells for less (4 / 10 / 24 / 60 gold)
- [x] Job scenes: each place has a standing spot on solid ground for the hero

## Pacing (testing)
- [x] Fresh crew: first 4 hours of work each day at double speed, then the plain rate (plain rate is 65% of the old one). Shown on the dashboard
- [x] Shards: every duplicate summon gives one; spend them in Arrivals to call a missing hero by name (2 / 4 / 8 / 15 / 30 / 45 / 80 by rarity). Published odds unchanged
- [x] Rebirth: at 99 a skill can restart at 1 for +10% xp in it and +3% ink, for good, up to 10 times; stars show beside the skill in the account
- [x] Weekly contracts: three hauling goals, new each week, paying shards and a crate
- [ ] Estimates: days to 99 for one skill go 929 -> 714 (2 h a day), 170 -> 175 (8 h), 57 -> 75 (round the clock). Whole collection drops from about 4,000 summons to about 290
- [ ] These run in the web game only; the desktop pet has the numbers but not the features
- [ ] Still slow for light players (2 h a day is about two years to 99); decide whether to speed the early levels

## Tuning
- [ ] Re-run pacing now that only Smudge works (x3 base speed as a stand-in) and expeditions exist; check bench times and recipe costs; check 3 crew at high stats is not too fast
- [ ] Desktop pet still uses the old hero-jobs-free model; bring crew bonuses in line with the web
- [ ] Cabinet bonus fills fast (44 of 66 pieces in two hours of testing): check +0.5% per piece is not too generous
- [ ] Hunt order tends to park a hero at the place with their own signature gear; decide if that is wanted
- [ ] Web game running around the clock levels too fast (about 4 weeks to 99)

## The city (Torn side) — built 24 Nov, on the preview
- [x] Database: friends, mailbox, guilds (30 max), weekly guild hauls, guild chat, market listings, per-skill boards (`supabase/os2_social.sql`, applied)
- [x] City screen tabs: Rankings (total + each skill), Friends, Guild, Market, Mailbox; tap any name to see their ledger
- [x] Gifts between friends (20 a day), market stall (10 spots, market keeps 5%), gold and gifts arrive by mailbox
- [x] Guild weekly goal: 1,500 hauls per member, reward 3 crates + 5 shards each, guild room chat
- [x] Scenes: fixed spots per place, everyone wholly on one surface, side-facing heroes turn toward the work
- [ ] Test with two real accounts (needs Dean signed in on the preview + a second account)
- [ ] Chat refresh is manual/15s; live chat later. Report/mute for chat before going public
- [ ] Mailbox dot on the home tile; guild goal tuning; market price history

## Anti-cheat: the server keeps the ledger — stage 1 built 24 Nov
- [x] Browsers can no longer write the save table. Every save goes through `os2_save_put`, which checks it against the last page it accepted
- [x] Refused: unknown items or heroes, negative counts, rebirth without level 99, and anything earned faster than is possible
      (xp, ink, gold, items, legendary+ items, unhinged items, new cards, legendary+ cards, hauls) — limits per second plus a small burst
- [x] Gold from selling is credited by the server's own price list, so a big sell-off is never refused
- [x] Gifts, market listing/buying/taking back, mailbox and guild reward all change the server's copy; the game takes the server's numbers
- [x] Guild hauls are counted by the server from checked saves; guild reward needs 100 hauls of your own
- [x] Leaderboard numbers (total level, cards, gold) are worked out by the server, not sent by the browser
- [x] Refusals are written to `os2_flag`; a second device loads the newest page instead of overwriting
- [ ] **Not yet run against a real signed-in account** — Dean to play on the preview for a few minutes; watch for "ledger did not balance"
- [ ] Reload `os2_item` whenever heroes/items are added (it is filled from data/rules.json)
- [ ] Show `os2_flag` in the Owner's office
- [ ] **Stage 2 (the full fix): the server rolls every haul, drop and summon itself.** Today a cheat can still nudge luck inside the
      speed limits (e.g. claim a lucky drop). Stage 2 moves the haul/loot/summon maths into the database so the browser only draws.
- [ ] Limits are generous on purpose; tighten after watching real play

## To-do list (raised, not urgent)
- [ ] Scenes: speakeasy crew stand close together; outback third spot is on the dirt pile; check every hero's facing in each scene
- [ ] Guild chat live refresh, report/mute before going public
- [ ] Mailbox dot on the home tile; market price history
- [ ] Logo and social icon set (on hold)

## Public roadmap page — built 24 Nov
- [x] `/roadmap` ("What's coming"): four stages (Just arrived, Being built, After that, On the horizon); linked from the game home tile and the site footer
- [ ] Keep it in step with this file: move a card up a stage whenever the feature ships
- [ ] Optional: let signed-in players vote for what they want most
- Promises made on the page (change the page if Dean disagrees): shop is looks only; monthly arrivals; nothing resets cards; missed daily stamp keeps your place

## Live — 24 Nov
- [x] oversummoned.com now runs this version (main fast-forwarded to fable at 1af472e; previous live commit was 140c617 if a rollback is ever needed)
- Still invite-only: only allow-listed emails can play until `os2_open` is switched on
- From here: fable = preview, main = live; push to main only when Dean says

## Wave two — ten new arrivals, built 24 Nov (on the preview, not yet live)
- [x] Vesper Nightshade (bat, goth), Roxy Riot (skunk, punk), Jazzmin Sweat (poodle, aerobics), Captain Stella Comet (snow leopard, pulp space),
      Pixel Pam (red panda, arcade), Gorm the Mighty (bison, barbarian), Commander Flap (penguin, jetpack), Sgt. Max Carnage (rhino, action movie),
      Rex Sizzle (Afghan hound, hair metal), El Ajolote Dorado (axolotl, luchador). Roster is now 36.
- [x] Per the rule: 3 own pieces + 5-piece era set + crew lines + icons each (80 new gear pieces, 422 items in all), 10 new card backdrops
- [x] Animated puppets for all ten (head; Pam's tail; soft chest motion on Vesper, Roxy, Jazzmin, Stella)
- [x] New: every card can carry one true fact, shown on the story page (idea borrowed from Cards, the Universe and Everything). Only the new ten have one so far
- [x] Server item list reloaded so saves accept the new heroes and gear
- Everything is in `rules/wave2.py`; art jobs in `rules/artjobs_w.py`. Copy that pattern for wave three
- [ ] Facts for the first 26 heroes
- [ ] Tails for Roxy and Stella (they cross behind the legs, need a careful cut)
- [ ] Collections/albums (group cards by theme with a bonus for finishing a set), another CUE idea
- [ ] New 80s/90s treasure for the loot pool (pocket pet egg, brick phone, slap bracelet...) and maybe a new place to find it
- [ ] Sunglasses icons (Pam's visor, Max's aviators) had their green lenses keyed out and were patched; regenerate with non-green lenses
- [ ] Desktop pet: new hero art and rules copied, puppets not wired
