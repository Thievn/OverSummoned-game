# Sprite kit (Blender 4.2, headless)

Low-poly chibi rigs rendered through one fixed orthographic camera, so every
hero and monster shares the same pixel scale and the same feet line.

    python3 specs.py                                   # writes specs/*.json
    blender -b --factory-startup --python rig.py -- specs/<id>.json raw/<id>
    python3 post.py <id>                               # 4x render -> 64px frame, 3-tone ramps, outline
    python3 fx.py                                      # hand-placed pixel FX, sheets/*.png, gifs/*.gif
    python3 lineup.py                                  # lineup_scale.png

Sheets: 64x64 frames. Heroes rows = idle, attack, hit, skill. Enemies rows = idle, attack, hit, death.
Heroes face right, enemies face left.
