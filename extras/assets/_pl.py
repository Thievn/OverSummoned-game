import sys, json, time, base64
sys.path.insert(0, "/workspace/thievns-den-assets")
import importlib.util
spec = importlib.util.spec_from_file_location("g", "/workspace/thievns-den-assets/_generate.py")
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
from pathlib import Path
from PIL import Image
RAW = Path("/workspace/oversummoned-assets/_raw")
STYLE = ("High quality gritty dark-fantasy pixel art sprite, crisp hard pixels, no anti-aliasing, no blur. "
 "Realistic-leaning 16-bit roguelite character, adult proportions, grounded and weathered, slightly wry, not cute, not chibi. "
 "Palette: soot, stone gray, dried blood, rot green, with accents of torchlight amber, ember orange and candle gold. "
 "Warm torchlight rim light from the left, deep shadows. Single color black outline, chunky readable silhouette.")
BODY = ("Full-body character, standing on flat ground, both feet planted on the same floor line near the bottom of the frame, "
 "head to toe visible, side view three-quarter facing {dir}. Transparent background, no ground shadow, no scenery, no text.")
def still(id, desc, size=128, direction="east", seed=None):
    out = RAW / f"{id}.png"
    if out.exists(): return out, 0
    prompt = f"{STYLE} {BODY.format(dir='right' if direction=='east' else 'left')} {desc}"
    g.CHAR_DETAIL = "highly detailed"; g.CHAR_OUTLINE = "single color black outline"
    img, usage = g.pixen(prompt, size, size, no_background=True, view="side", direction=direction, seed=seed)
    img.save(out); return out, g.usage_gens(usage)
def anim(id, first, action, n=8, seed=None):
    d = RAW / id
    if d.exists() and any(d.iterdir()): return d, 0
    job, usage = g.start_animate(first, action, n, no_background=True, seed=seed)
    res = g.poll_job(job, timeout_s=420)
    imgs = g.extract_images(res.get("last_response"))
    d.mkdir(exist_ok=True)
    for i, im in enumerate(imgs): im.save(d / f"{i:02d}.png")
    u = g.usage_gens(usage) or g.usage_gens((res.get("last_response") or {}).get("usage") if isinstance(res.get("last_response"),dict) else None)
    return d, u
