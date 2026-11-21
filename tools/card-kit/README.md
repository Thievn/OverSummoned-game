# OverSummoned card kit (tools)

These are the scripts that built the art in `public/assets/oversummoned/`. They expect the original working-folder layout (`frames/src/`, `frames/layers/`, `portraits/`, `icons/raw/`), so the large source images aren't committed here. The web-ready output lives in `public/assets/oversummoned/`:

| Path | What |
|---|---|
| `logo/oversummoned_logo.svg` | Layered vector wordmark. Use this on the site. |
| `logo/oversummoned_logo.png` / `.webp` | Transparent raster at 2439 px wide (PNG) and 2x (WebP) |
| `logo/oversummoned_logo_onecolor.svg` | One-color version |
| `cards/<id>.webp` | Finished cards, 600x940. The top 80 px is transparent headroom for the crown, cone and shards. |
| `cards/thumbs/<id>.webp` | 300x470 thumbnails |
| `rarity-demo/kevin_<rarity>.webp` | Kevin Latham in all 7 frames (demo only) |
| `portraits/<id>.webp` | Bare painted portraits (864x1152), for the character sheet |
| `frames/` | Card layers at the 1200x1880 master size, plus `layout.json` with every anchor point |
| `icons/<id>.png` | 32 px pixel icons. Render with `image-rendering: pixelated` and whole-number scaling only. |
| `icons/4x/<id>.png` | 128 px nearest-neighbor copies |
| `icons/glow/<id>.webp` | Example glow renders. On the web, draw the glow in CSS (`filter: drop-shadow(0 0 6px <rarity color>)`). |
| `items.json` | 14 items with full tooltip data |
| `cards.json` | 8 launch cards: name, title, rarity, Overstats, era, Know-How, asset paths |

## Original kit notes

## Logo (`logo/`)
- `oversummoned_logo.svg` is the layered vector, with groups shadow / outline / bevel-dark / gold / highlight / gem. `oversummoned_logo_onecolor.svg` is the one-color version.
- PNGs are transparent: `_1x` is 2439x355, plus `_2x` and `_4x`, and `onecolor_4x`.
- To rebuild: `python3 logo/build_logo.py` (uses the Cinzel Decorative Black font).

## Card frames (`frames/layers/`)
- Master card size is 1200x1880. Cards ship at 600x940, which includes 80px of transparent headroom at the top for the crown, the cone and the shards.
- All 7 rarities share one layout, because every variant is recolored by code from one master frame.
- **v2 metals (after Dean's feedback)**: each frame's metal now matches its rarity colour, and Legendary is the only gold one.
  - Common: grey iron/silver
  - Uncommon: emerald verdigris
  - Rare: blue steel with blue enamel
  - Epic: amethyst, with matching amethyst sconces
  - Legendary: gold-orange with a crown and embers
  - Absurd: hot-pink magenta, plus the cone and googly eye
  - Unhinged: blood red with cracks and glitch
  - The metals are gradient maps in `METAL` in `build_frames.py`, and the layout is unchanged.
- Frames: `frame_<rarity>.png`, one each for common, uncommon, rare, epic, legendary, absurd and unhinged. The portrait window is transparent.
- `gem_<rarity>.png`: each rarity has its own gem shape (circle, diamond, hexagon, shield, pentagon, heart, shard), so colorblind players can tell them apart.
- Other layers: `window_mask.png`, `window_shadow.png`, `nameplate.png`, `statplate.png`, and the stat icons `icon_guard.png`, `icon_might.png`, `icon_knack.png`.
- `layout.json` holds every anchor point: window, gem, letter, name, title and stats.
- To rebuild: `python3 frames/build_frames.py`.

## Compositing
```
python3 compose_card.py --portrait portraits/legionary.jpg --name "Gaius Marcellus" \
  --title "Roman Legionary" --guard 15 --might 12 --knack 8 --rarity Rare --out card.png --scale 0.5
```
Run `python3 build_previews.py` to recompose every card in `cards.json`, plus the rarity ladder, and rebuild `preview_cards.png` and `preview_rarities.png`.

Stacking order, bottom to top: portrait (cover-fit) > window mask > shadow > plates > frame > gem > letter > name > title > stats.

Fonts:
- Cinzel for the name, title and numbers.
- Cinzel Decorative for the logo.
- On the web, use EB Garamond for body text and Inter for UI numbers.

## Portraits (`portraits/`)
- 8 Origins, 864x1152, as `.jpg` and `.webp`.
- Every portrait used the locked prompt in `style_prompt.txt` with the mockup-1 reference crops.
- `cards.json` holds the names, titles, rarities and stats.
- `cards/` holds the finished cards. `cards/rarity_ladder/` has Kevin in all 7 frames.

## Item icons (`icons/`)
- 14 PixelLab icons at 32px: `<id>.png` and `<id>@4x.png` (nearest-neighbor).
- They share one master palette (`master_palette.png` / `.txt`, 48 colors plus the outline color). Each icon uses 12 colors or fewer and has a 1px outline in #161012.
- The rarity glow is added only in code: `process_icons.glow(icon, rarity)`. `glow/` holds pre-baked examples at 4x. On the web, use a CSS `drop-shadow` in the rarity color instead.
- `items.json` maps each id to its name and rarity.

## Rarity colors
| Rarity | Color |
|---|---|
| Common | #B8B2A7 |
| Uncommon | #3FAE4F |
| Rare | #3A86FF |
| Epic | #A35BF0 |
| Legendary | #F28C1B |
| Absurd | #F04FC8 |
| Unhinged | #E5262E |
