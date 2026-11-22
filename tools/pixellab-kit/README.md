# PixelLab sprite kit

Sprites for the flip cards and the Roll for it fight.

- `mkhero.py` makes a side-view character from a card portrait.
- `mkenemy.py` makes an enemy in the same style.
- `anim.py` adds one animation to a character.
- `fetchzip.py` downloads a character with all its frames.
- `build_sheets.py` packs idle/attack/hit/skill (heroes, facing right) and idle/attack/hit/death (enemies, facing left) into
  `public/assets/oversummoned/sprites/<id>.png` and writes `sprites.json`.

Each sheet has its own frame size. `ax`/`ay` in `sprites.json` is the feet point, so every character stands on the same floor at the same pixel scale.
The API key is read from `PIXELLAB_API_KEY`.
