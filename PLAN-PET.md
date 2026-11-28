# Two jobs for Opus (Fable, 27 Nov): L6 the features grid, and P1 to P7 the front-facing desktop pet

Read PLAN.md first. The wording rule applies to everything here: plain English, no hero count.

---------------------------------------------------------------------------------------------------
## L6. Front page: replace "What you can do" with a grid of everything in the game

Dean: the four tiles undersell the game, and "Plenty to keep them busy" is confusing. Show everything
that is in the game's own menu, with the same icons, so the page shows how much there is.

- Kicker: WHAT IS IN THE GAME. Heading: **There is a lot to do.**
- One tile per menu item, in this order, each with the same icon the game menu uses
  (`/assets/v2/loot/<icon>.webp`), a name and one plain line. Before shipping, open each screen in
  play.html?dev=1 and check the line is true. Fix the line, never stretch the truth.

| Tile | Icon | Line |
|---|---|---|
| Summon | x_ink | Spend ink to summon a new hero card. You never know who turns up. |
| Heroes | x_shard | Your collection. Flip any card to see its story, stats and gear. |
| Work | outback_4 | Send Smudge fishing, digging and lock picking. He keeps going while you are away. |
| Expeditions | x_map | Send heroes off on their own. They come back with loot. |
| Gear | x_crate | Every hero has their own three pieces to find, plus weapons, hats and charms anyone can wear. |
| Workshop | x_anvil | Turn spare loot into tonics and upgrade your gear. |
| Training | x_dumbbell | Spend energy to raise a hero's stats. |
| Raids | x_sword | Pick three heroes and fight a boss for the best loot. |
| Duels | x_trophy | Card battles against rival captains. **Coming soon** |
| City | x_friends | Add friends, join a guild and chat. |
| Market and rankings | x_gold | Trade with other players and climb the boards. **Coming soon** |
| Desktop pet | (new pet art, see below; until then x_map is NOT ok, use the Smudge icon-192) | A small Smudge on your screen who taps along while you type and brings you chests. Optional. **Coming soon** |

- "Coming soon" is a small gold pill in the tile's top corner (`.soon`). The tile keeps full colour
  and its icon. Do not grey it out.
- Layout: 4 across on desktop, 3 at tablet, 2 on phones (small tiles: icon 44px, name, line). It must
  not make the phone page longer than it is now; the tiles are compact, not the big `.beat` cards.
- When Duels opens to everyone (`duel.open`), remove its pill and add the duel table as the fourth
  screenshot (already noted in PLAN-LANDING.md).
- Check at 360, 390, 1366. Look at the screenshots before shipping.

---------------------------------------------------------------------------------------------------
## The desktop pet, version 2: front-facing Smudge

### Why (Dean, 27 Nov)
The pet today shows Smudge side-on in a full scene, with a different drawing for every activity.
Hats and cosmetics have to be redrawn for every pose and angle, which is why they never worked.
Dean wants it to work like Bongo Cat: one simple front-facing character, taps along as you type,
cosmetics that are easy to add, a small menu, a chest now and then.

### Is it a good idea? Yes, and here is the trade
- **Gain:** one body drawing. A hat is one picture that sits on one head. Every cosmetic works with
  every activity. New cosmetics cost one Grok image each. This is what makes selling or giving away
  cosmetics realistic.
- **Lose:** the nine painted scenes and the side-on fishing, digging and lock picking animations in
  the pet. They stay in the browser game, where they already look good. The pet stops trying to be a
  small copy of the game and becomes a companion to it.
- Smudge keeps his look: same fur, same teal hood, same outline style. Only the angle changes.

### What the player sees
A small window above the taskbar, transparent background:
- Smudge from the chest up, facing you, behind a small desk. Both paws on the desk.
- **Every key or click makes one paw tap** (left, right, left, right). Fast typing = fast tapping.
- **The activity is shown by what is on the desk and in his paws, not by a new pose:**
  - Summoning: ledger and ink pot on the desk, a stamp in the tapping paw.
  - Fishing: rod held upright, a bucket on the desk. The float bobs on each tap.
  - Digging: small shovel, a pile of dirt that grows and resets.
  - Lock picking: a padlock on the desk, picks in his paws.
  Each is a **prop set** (one held item + one desk item + one small effect). Same body under all four.
- Face: eyes open, blink, happy, closed. Mouth closed and open. He looks toward the mouse a little.
- Sleeps when you stop typing for a few minutes (head down on the desk, Zs). Wakes on the next key.
- His own speech bubble, in the new style from the site (paper colour, name tab). The face never
  moves, so the bubble has one fixed spot above him and can never cover it.
- A key counter under the desk, like Bongo Cat's.

### Keys, ink and chests (recommendation, Dean to confirm)
- **Keys do not turn into ink one for one.** That was hard to explain and easy to cheat. Keys fill a
  **chest bar**. When it is full, a chest drops on the desk. Click it to open.
- A chest holds: some gold, some ink, 2 to 3 pieces of loot from the place that matches the current
  activity, and now and then a piece of gear or a cosmetic. Everything goes to the player's account
  on the site. Use the crate rules that already exist in rules/ (`crate`, `daily_keys`,
  `max_keys_per_second`) as the starting numbers.
- **Fair, not too much:** keep the daily cap and the keys-per-second cap. Target: a normal day of
  typing is worth about what 2 hours of idle Work is worth in the browser. The pet is a bonus, never
  the best way to play. Put the numbers in rules/ and add a sim line that prints "pet day vs idle day".
- The pet still only counts key presses. It never sees which keys. Say so in the menu.

### Cosmetics
- Slots: **hat, face (glasses, eyepatch), neck (scarf, tie), desk (the desk's look), and held item
  skin** (a gold stamp, a fancy rod). One picture per item, drawn to the same canvas so it lines up.
- Free ones come from chests, milestones (keys typed, days in a row) and site achievements.
- Paid ones are a later decision (Steam items or a site shop). Build the wardrobe so an item only
  needs an id, a slot, a picture and a "how you get it" line. Do not build payments now.
- The hood counts as the default hat. A hat replaces the hood-up head with the hood-down head.

### Menu (right-click the pet, same idea as Bongo Cat)
Activity (the four) · Wardrobe · Chests (bar, today's count) · Smudge's mood (the three voices) ·
Size · Always on top · Sound · Link to my account · Quit. Plain labels, one line of help each.

### Art and rig (all art from Grok through the art queue, never hand drawn)
Concept images Fable queued for Dean to pick from: `art/raw/pet2/front_idle`, `front_fish`,
`front_sheet` on the art branch (jobs 320 to 322, ref `art/raw/duel/smudge_walk_2.jpg`).
Once Dean picks a look, generate each part as its own image from that one approved picture as the
reference, on white, same canvas, then cut from white (same method as the duel poses):
- body (chest and shoulders), head hood-up, head hood-down, desk
- paw left and paw right, each in two frames: resting and pressed
- eyes: open, half, closed, happy. mouth: closed, open
- 4 prop sets (held + desk item each)
- first cosmetics: 6 hats, 2 face, 2 neck, to prove the slots work
Rig = layered sprites with offsets in one json file. No bones needed: paws swap frames, head bobs
2 to 3 px on each tap, body breathes by scale, eyes swap frames. Simple on purpose.

### Steps for Opus
- **P1. Show Dean the look.** Present the three concept images. If none is right, queue more
  (3 at a time). Do not go further until Dean picks one.
- **P2. Backup, then parts.** Back up desktop-fable to the secondary repo. Generate and cut all the
  parts. Assemble a still picture from the parts and show Dean before any code.
- **P3. Web preview first.** Build the layered Smudge as a small page (`pettest.html`): type and he
  taps, switch activity, switch hats, sleep, speech bubble. This is quick to test and Dean can see
  it in his browser. Its json is the same one the Godot pet will read.
- **P4. Godot pet.** Replace puppet.gd's side-on rig with the layered one in desktop-fable. Keep
  cloud.gd (account link, saving). Transparent window, taps on global key and mouse counts.
- **P5. Chests.** Chest bar, drop, open, rewards written to the account through the existing cloud
  calls. Numbers in rules/, sim line added, caps kept.
- **P6. Menu and wardrobe.** The right-click menu above. Wardrobe grid with owned and locked items.
- **P7. Tell the site.** Update /desktop-pet page and the front page tile with the new art and plain
  wording. Add a notes entry.

### Decided (Dean, 27 Nov, evening). These replace anything above that disagrees.
- **Look:** Dean likes all three concepts. Base = `front_idle` (hood up, stamping). Hood down when a
  hat is worn, as in `front_fish`. P1 is done; start at P2.
- **The pet is "farming on your desk".** Say it that way in the menu and on the site.
- **Each activity must read clearly and move properly, not only swap a prop:**
  - Fishing: he holds the rod and casts. The rod tilts forward and back on each tap, the line and
    float swing and settle (a simple spring), and now and then a fish comes up.
  - Digging: shovel goes down into the dirt on one tap and lifts with dirt flying on the next.
  - Stamping: stamp comes down on the ledger with an ink splat. **Stamping is the ink activity:**
    it fills ink for summons. Fishing, digging and lock picking bring loot from their places.
  - Lock picking: picks wiggle, the padlock pops open now and then.
  Each activity is 2 arm frames plus one moving prop. See `art/raw/pet2/sheet_actions`.
- **Key counter like Bongo Cat:** a number that goes up with every key and click, and never resets.
  Lifetime total is saved to the account.
- **Stats page in the menu:** lifetime keys, today, this session, keys per second right now, best
  keys per second, best day, days in a row, chests opened, time farming per activity.
- **Chests stay** (Dean's own idea): the bar fills from keys, the chest drops, rewards go to the site.
- **Fur colours:** the fur is its own layer, separate from the hood, face and outline, drawn in a
  light neutral brown so the code can tint it (Godot shader, hue and brightness, masked to the fur
  layer). Start with brown, white, black, gold, plus a free colour slider. Hood colour the same way.
- **Expressions:** eyes and mouth are their own layers: happy, surprised, angry, sleepy, focused
  (tongue out), plus blink. He reacts: happy on a chest, focused when typing fast, sleepy when idle.
- **Versions of Smudge (special skins):** a full replacement part set on the same canvas, so every
  hat and prop still fits. First two: **Evil Smudge** (dark fur, red eyes, torn hood, small horns)
  and **Ghost Smudge**. See `art/raw/pet2/sheet_versions`. These are the rare or paid ones.
- **Go all out on the wardrobe.** First batch: at least 12 hats, 4 face items, 4 neck items, 4 fur
  colours, 2 special versions. See `art/raw/pet2/sheet_cosmetics`. Sheets are for choosing only;
  each chosen item is then generated on its own, on the shared canvas, and cut from white.
- **Wardrobe must be testable by Dean:** in the menu he picks any item and sees it on Smudge at
  once, in every activity, with nothing misplaced. For testing, a dev switch unlocks everything.
- **Who builds:** Opus. Web preview first (P3, `pettest.html`) so Dean can try the wardrobe in his
  browser the same day, then the Godot build (P4) reading the same json. P6 (menu, wardrobe, stats)
  is done in both.

### Decided (Dean, 27 Nov, 8pm). Dean saw the sheets and loved them. These win over anything above.
- **Lock picking is a small treasure chest on the desk**, not a padlock standing up. He works the
  picks at its keyhole; now and then the lid pops open. Concept: `art/raw/pet2/front_lockpick_chest`.
- **Every piece is its own separate part, and everything swaps with everything.** No baked-in
  combinations. Layers, back to front, all on one shared canvas:
  backdrop (empty) · body fur · belly fur · cloak · strap and satchel · neck item · head fur ·
  face markings · eyes · mouth · face item · hood OR hat (hood is just another head item) ·
  desk · desk prop · paw left · paw right · held item · effect.
  A skin (Evil, Ghost) is a set of replacement fur, eyes and mouth parts. It must still take any
  hood, hat, cloak, neck or face item. A cloak colour, a hood, a fur colour and a hat are four
  separate choices. Adding a cosmetic later = adding one picture and one line in the json.
  Test for done: Evil fur + pale blue hood + crown + bow tie + fishing all show together, lined up.
- **Build the Godot pet first** (this replaces "web preview first"). Dean wants to run it on his
  computer and see Smudge do the movements as he types. Order is now: P2 parts, P4 Godot pet with
  typing movements for all four activities, P6 menu + wardrobe + stats, P5 chests, then P3 the web
  preview only if it is still useful, P7 the site.
- **Getting it to Dean:** Opus cannot run Godot in the cloud workspace. Build it as a new project
  folder `desktop-pet2/` (leave `desktop-fable/` alone as the backup), check every script with care,
  and hand Dean the folder to open in Godot on his computer (through his connected folder if the
  desktop app is linked, otherwise as a zip). Expect a round or two of fixes from what Dean sees;
  ask him for a screenshot or the error text each time.

### Still open
- Paid cosmetics: Steam, the site, or later. Build free first.
- Chest numbers: Opus proposes them from the sim, Dean approves.
