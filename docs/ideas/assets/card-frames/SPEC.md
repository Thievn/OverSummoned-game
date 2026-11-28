Written by: Grok
Date: 2026-11-28
Status: idea

# OverSummoned card frames, v4 (standard TCG size)

These replace the v3 frames. The only thing that changed in the idea is the **size**: every file is now **1500 x 2100 px**, which is a standard trading card, **2.5 x 3.5 in at 600 dpi**, or **63.5 x 88.9 mm**. That is the exact conversion Claude pinned in `docs/card-system.md` (5:7, or 0.714). The v3 frames were 1526 x 2256, a taller and skinnier card that would not have fit standard sleeves or a Steam card template.

Idea doc: `../../card-frame-template.md`. Nothing here is wired into the game.

## How the size was changed without squashing anything

Nothing was scaled. The v3 border was cut apart and shortened:

- **Height, 156 px shorter.** A strip of the plain stretch of the left and right edges (about halfway down, where the border is only texture) was removed and the two halves were joined with a short crossfade. The position was searched per tier and per side so the cut lands where there is no flourish.
- **Width, 26 px narrower.** The same thing across the plain middle of the top and bottom edges. On the plated version, the five stat boxes each lose a few columns from their flat cream centre so all five stay the same size.
- **Corners and flourishes are never touched, never scaled.** The rounded card corners (radius 84 px) are the original pixels.
- **A clean trim was drawn around the art opening**, in each rarity's metal colour. The old painted inner edge had ragged paint and inpainting scraps on some tiers (absurd, epic, uncommon). The trim covers them and gives every frame a crisp edge. Rare keeps its sapphire and silver-blue shimmer.
- The faint ghost where "Power 50" text had been painted out of the power bar was smoothed on legendary and absurd and re-textured on unhinged.

## Files

Per tier (`common`, `uncommon`, `rare`, `epic`, `legendary`, `absurd`, `unhinged`, `true-summon`):

| File | What it is |
|---|---|
| `fronts/<tier>/frame_outline.png` | **The one to use.** Border only, one big transparent opening. |
| `backs/<tier>/back.png` | The back. Identical to the front outline, so a card looks like one object when you flip it. |
| `fronts/<tier>/frame.png` | Older version with a painted name plate, type bar, five stat boxes and power bar. Same border as the outline. Optional. |
| `fronts/<tier>/art_mask.png` | White where the art shows through `frame.png`. |
| `fronts/<tier>/art_mask_outline.png` | White where the art shows through `frame_outline.png` (the opening). |
| `fronts/<tier>/foil_mask.png` | White over the border ring only. Scroll a seamless foil tile under it. Works for the front and the back. |

Not committed, because they can be rebuilt from the files above: `foil_overlay.png` (the foil tile pre-masked at 30%), `front_blank.png` and `back_preview.png` (previews on a dark fill). The foil tiles are in `docs/ideas/assets/foil/`.

`slots.json` has every coordinate. `contact-sheet_fronts-and-matching-backs_v4.png` shows all eight tiers, front on the left and back on the right. `example_card_tcg.png` is Florida Man's human form on the absurd frame with live text, laid out to the new size.

## Coordinates (pixels, origin top-left, 1500 x 2100)

| | x | y | w | h |
|---|---|---|---|---|
| Opening (outline) | 120 | 126 | 1262 | 1850 |
| Safe content box | 152 | 150 | 1198 | 1802 |
| Art window (plated `frame.png`) | 120 | 304 | 1262 | 1194 |

The opening has 22 px chamfered corners. The border ring is about 96 px wide at the sides and 100 px at top and bottom. The plated version's name plate, type bar, stat boxes, power bar and gem are in `slots.json`.

## Layout used on the example card

Top to bottom: name bar with energy cost, art, type line with trait tags and rarity gem, ability box (keyword, triggered ability, flavor text), quick-glance stat tiles, mode ratings (Duel, Raid, Farm, Helper), rarity strip with serial number. All of it is real text drawn on top of the frame.

## Known small flaws

- On legendary, absurd and true-summon, a few of the inner corners show a small dark patch left over from the v3 build. It is visible at 100% zoom, not at card size. Fixing it means repainting the ornaments.
- `unhinged` still has its worn, uneven power bar edge. That is the look of the frame.
