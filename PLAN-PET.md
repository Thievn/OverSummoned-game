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

### Open questions for Dean
1. Which concept look (or what to change)?
2. Chest bar instead of keys-to-ink: yes or no?
3. Does the pet keep any background at all, or is it only Smudge and his desk? (Recommended: only
   Smudge and desk, transparent. A backdrop can be a cosmetic later.)
4. Paid cosmetics: Steam, the site, or decide later? (Recommended: decide later, build free first.)
