Written by: Grok
Date: 2026-11-28
Status: idea

# Card frame template: border only, everything else is live text

## The problem

The Vesper Nightshade mockup looks great, and that is the trouble. The name, the stat boxes and the type line are all painted into the picture. Change Vesper's attack from 31 to 34 and you have to regenerate the whole card. Change a name, a rarity or a trait and it is the same story. For a game with fifty heroes, seven rarities and numbers that will be tuned for months, that cannot work.

`docs/direction-cards.md` (section 3) already says this: never generate a card with its frame baked into the picture. This file is my answer to the "so what do we use instead" part.

## The idea

Build the frame once per rarity as a **border only**. One big empty opening in the middle. No name plate, no stat boxes, no labels, no gem socket. Then the game draws everything else as real text and real shapes on top, at coordinates that do not change.

So a card is a stack of layers, bottom to top:

1. The character art and its backdrop, scaled to fill the opening.
2. The frame border (transparent in the middle, so the art shows through).
3. Live text and shapes drawn by code: name, the "born..." line on human cards, energy cost, type line, rarity gem, ability text, stat tiles, ratings, serial number.
4. Optional: a pop-out cutout of the hero over the border, so a boot or a sword breaks past the edge. Dean loves this on the Vesper card.
5. The foil layer, a looping texture masked to the border ring only. See `foil-texture-and-scenario.md`.

Change a stat and you change a number. Change a rarity and you swap one border file. The art is never touched.

## What I have already made

I made the frames in the same painted style as the Vesper card, using it as the style reference, then cleaned them up and cut them out in code. There are eight:

- common, uncommon, rare, epic, legendary, absurd, unhinged
- a true-summon frame for the human cards

Each rarity gets fancier as it rises, the same way the current in-game frames do. The rare uses the same border family as epic and legendary (same thickness, same corner flourishes and metal keylines) in sapphire and silver-blue with a faint pearly shimmer on the rim, because Dean wanted it to match its family.

**The back matches the front.** Each rarity's back is the same border as its front, byte for byte, with the middle empty. No sockets, no panels, no labels. Gear squares, the stat strip and the bio are drawn in code, the same way the front is. That means a card looks like one object when you flip it.

All files are 1526 x 2256 pixels, transparent PNG, corner radius 84. The opening is x 120 to 1408 and y 126 to 2132. A safe box for content with a bit of breathing room is x 152 to 1374 and y 150 to 2108. The border ring is about 96 pixels wide at the sides and 100 at top and bottom.

**Where the files are.** The foil textures are now in the repo, at `docs/ideas/assets/foil/`. See `foil-texture-and-scenario.md`. The frame PNGs themselves are still on Dean's Drive (they are larger, and this folder is for thinking): https://drive.google.com/drive/folders/18zZylDrG0qahMznWo2np4_YsMZ-uNnFs. If Dean wants the frames in the repo too, they should go in an assets folder and not in `docs/`.

Per rarity there are: the clean outline (the one to use), an art mask, a foil mask for the border ring, a foil overlay, a blank preview, and the back. I also made an older version of each frame with painted plates for name, type and five stat boxes. I would not use those, for the reason in the next section.

## Layout I would draw on top

Top to bottom, which is the order I used on the example Florida Man card:

1. Name bar, with the energy cost in a round orb on the right. On human cards, a small "born..." line under the name.
2. Art.
3. Type line: trait tags, then species, with the rarity gem at the right.
4. Ability box: the keyword chip and its one-line rule, then the named ability, a thin divider, and an italic flavor line.
5. Stat tiles for the stats the card carries, plus Power. See `card-abilities.md`: Speed and Luck are optional, so a card can show three, four or five tiles.
6. Four small mode ratings (Duel, Raid, Farm, Helper) as letter grades.
7. A rarity strip with the serial number.

The back follows the game's current flip side: a gear view with the five general slots and the three signature slots, and an info view with the bio, the true fact and what Smudge says. The charm slot shows as locked until level 5.

## Where I differ from `docs/direction-cards.md`

Section 3 lists the template as "border, name bar, art window, type line, stat boxes, rarity gem". My border-only frame goes a step further and draws the name bar, the type line, the stat boxes and the gem in code too. My reason is that the number of stat tiles changes from card to card (three to five, if the abilities idea in `card-abilities.md` is used), and a painted row of five boxes would then show empty ones. It is a small difference. If Claude would rather keep painted plates for the name bar, the older plate versions exist and still work.

## What I am unsure about

- Fonts. My example used a serif for names. The site uses Lilita One for headings. The card should probably match one of them, and Dean should pick.
- Whether the human card's frame should be its own frame (the true-summon one) or the animal's rarity frame with a small badge. I made the separate frame because it makes the human card instantly recognisable in a binder, but it adds an eighth border to keep up.
