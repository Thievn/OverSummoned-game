"""Drawing templates for Smudge's wardrobe: art2/slots/<pose>_<slot>.png. Smudge is ghosted, the box is where the item lands.
An item is ONE transparent picture, centred on the box, as wide as the box. Hats: one picture for every pose.
Glasses and other face items: a 'front' picture (stamp pose) and a 'side' picture facing RIGHT (fish, pick, dig).
The anchors live in js/dbcanvas.js (ANCHOR); this reads them from there so the two never disagree."""
import os, re, math, json
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'js', 'dbcanvas.js')).read()
A = {}
for pose, body in re.findall(r"(\w+):\s*\{ (foot: .*?) \},\n", src):
    A[pose] = {k: json.loads('[' + v.replace("'", '"') + ']') for k, v in re.findall(r"(\w+): \[([^\]]*)\]", body)}
os.makedirs(os.path.join(ROOT, 'art2', 'slots'), exist_ok=True)
for pose, a in A.items():
    im = Image.open(os.path.join(ROOT, 'art2', 'smudge', pose + '.png')).convert('RGBA')
    for slot in ('head_top', 'face'):
        if slot not in a: continue
        x, y, deg, w = a[slot][:4]; view = a[slot][4] if len(a[slot]) > 4 else 'any'
        g = im.copy(); g.putalpha(g.getchannel('A').point(lambda v: v * 0.3)); c = Image.new('RGBA', im.size, (255, 255, 255, 255)); c.alpha_composite(g)
        d = ImageDraw.Draw(c); h = w * (0.75 if slot == 'head_top' else 0.38); t = math.radians(deg)
        pts = [(x + dx * math.cos(t) - dy * math.sin(t), y + dx * math.sin(t) + dy * math.cos(t)) for dx, dy in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]
        d.polygon(pts, outline=(230, 30, 120, 255), width=3); d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(230, 30, 120, 255))
        d.text((8, 8), f"{pose} / {slot} / view: {view} / width {w}px / tilt {deg} deg", fill=(20, 20, 40, 255))
        c.save(os.path.join(ROOT, 'art2', 'slots', f'{pose}_{slot}.png')); print(pose, slot)
