"""Colour masks for Smudge's wardrobe: which pixels are fur and which are cloak, laid out exactly like each pose's atlas.
Red = fur, green = cloak. The game recolours through the mask, so a fur colour never touches the satchel, scrolls, book or tools.
Run: python3 rules/wearmask.py   ->  assets/v2/db/smudge_<pose>_mask.webp
Fur and cloak are found by colour, then the props that share the fur's brown are cut out by hand (KEEP_OUT, picture pixels)."""
import json, os
import numpy as np
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art2', 'puppet'); OUT = os.path.join(ROOT, 'assets', 'v2', 'db')
RIG = json.load(open(os.path.join(ROOT, 'data', 'rig.json')))
KEEP_OUT = {   # satchel, scrolls, feather, belts, books and wooden handles: brown, but not fur
    'stamp': [[(40, 15), (170, 15), (170, 190), (135, 230), (125, 380), (35, 380)], [(185, 325), (335, 325), (335, 372), (185, 372)],
              [(410, 198), (502, 198), (502, 274), (410, 274)], [(450, 138), (492, 138), (492, 180), (450, 180)], [(158, 446), (508, 438), (508, 566), (158, 566)]],
    'fish': [[(0, 25), (112, 25), (112, 175), (102, 332), (18, 332), (0, 200)], [(243, 256), (262, 276), (478, 56), (462, 38)]],
    'pick': [[(68, 8), (202, 8), (207, 150), (186, 192), (162, 332), (66, 332)], [(283, 208), (358, 208), (358, 262), (283, 262)], [(228, 288), (352, 288), (352, 362), (228, 362)]],
    'dig': [[(73, 8), (202, 8), (207, 172), (162, 302), (73, 302)], [(143, 254), (160, 247), (468, 373), (456, 398)], [(233, 270), (307, 270), (307, 302), (233, 302)]],
}

def hsl(a):
    a = a[..., :3].astype(float) / 255; r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(2), a.min(2); l = (mx + mn) / 2; d = mx - mn
    s = np.where(d == 0, 0, np.where(l > .5, d / (2 - mx - mn + 1e-9), d / (mx + mn + 1e-9)))
    h = np.where(mx == r, ((g - b) / (d + 1e-9)) % 6, np.where(mx == g, (b - r) / (d + 1e-9) + 2, (r - g) / (d + 1e-9) + 4)) * 60
    return np.where(d > 0, h, 0), s, l

def build(pose):
    rig = RIG[pose]; size = rig['size']
    off = {'base': (0, 0)}
    for p in rig['parts']: off[p['name']] = tuple(p['offset'])
    for n, v in (rig.get('db') or {}).items(): off[n] = tuple(v['offset'])
    out = Image.new('RGBA', (size[0] * 4, size[1] * 4), (0, 0, 0, 0))   # big enough; trimmed to the atlas size below
    keep = Image.new('L', (size[0] + 600, size[1] + 600), 255); kd = ImageDraw.Draw(keep)
    for poly in KEEP_OUT.get(pose, []): kd.polygon(poly, fill=0)
    keep = np.asarray(keep) > 0
    tex = json.load(open(os.path.join(OUT, f'smudge_{pose}_tex.json')))
    atlas = np.zeros((tex['height'], tex['width'], 4), np.uint8)
    for st in tex['SubTexture']:
        n = st['name']; f = os.path.join(SRC, f'{pose}_{n}.png')
        if n not in off or not os.path.exists(f): continue
        im = np.asarray(Image.open(f).convert('RGBA')); h, s, l = hsl(im); a = im[..., 3] > 20
        fur = a & (h >= 16) & (h <= 44) & (s >= .16) & (s <= .92) & (l >= .2) & (l <= .9)
        dark = a & (h >= 10) & (h <= 40) & (s >= .12) & (l >= .08) & (l < .2)            # the darkest fur: paws, shadows
        cloak = a & (h >= 168) & (h <= 222) & (s >= .12) & (l >= .06) & (l <= .85)
        ox, oy = off[n]; H, W = im.shape[:2]
        k = keep[oy:oy + H, ox:ox + W]
        if k.shape != (H, W): k = np.pad(k, ((0, H - k.shape[0]), (0, W - k.shape[1])), constant_values=True)
        m = np.zeros((H, W, 4), np.uint8)
        m[..., 0] = np.where((fur | dark) & k, 255, 0); m[..., 1] = np.where(cloak, 255, 0); m[..., 3] = np.where(m[..., 0] | m[..., 1], 255, 0)
        x, y = st['x'], st['y']; w, hh = min(W, st['width']), min(H, st['height'])
        atlas[y:y + hh, x:x + w] = m[:hh, :w]
    Image.fromarray(atlas).save(os.path.join(OUT, f'smudge_{pose}_mask.webp'), lossless=True)
    return atlas

if __name__ == '__main__':
    for pose in ('stamp', 'fish', 'pick', 'dig'):
        a = build(pose); print(pose, 'fur px', int((a[..., 0] > 0).sum()), 'cloak px', int((a[..., 1] > 0).sum()))
