"""Splits the cloak out of Smudge's atlas so it can be taken off without ever redrawing the otter.
The recolour mask already marks every cloak pixel green; this widens that by a few pixels to catch the
anti-aliased navy outline, then writes an atlas with the cloak erased. Cloak on = the original atlas,
cloak off = this one. The rig, the parts and every animation are untouched, because only the picture changes.
Run: python3 rules/cloakoff.py  ->  assets/v2/db/smudge_<pose>_nocloak.webp"""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, 'assets', 'v2', 'db')
POSES = ('stamp', 'fish', 'pick', 'dig')
HALO = 40           # clean-up passes: the cloak mask misses the cloak's own highlights and outline, so flood outward from the hole through everything that is not warm brown fur or leather
HEAD_KEEP = True    # the head part keeps its hood until the hoodless head art lands

def mend(a, close=14, ink=(26, 31, 56)):
    """Bridge the gaps the cloak left in his silhouette. Closing the alpha joins edges that were only
    separated by cloak; the new pixels take the colour of the nearest fur, and the fresh silhouette edge
    gets the same dark navy line every other edge has, so the join does not read as a cut."""
    solid = a[..., 3] > 20
    k = np.hypot(*np.mgrid[-close:close + 1, -close:close + 1]) <= close
    closed = ndimage.binary_closing(solid, k)
    new = closed & ~solid
    if new.any():
        _, idx = ndimage.distance_transform_edt(~solid, return_indices=True)
        a[new] = a[idx[0][new], idx[1][new]]
        a[..., 3][new] = 255
    edge = closed & ~ndimage.binary_erosion(closed, np.ones((7, 7), bool))
    fresh = edge & ndimage.binary_dilation(new, np.ones((9, 9), bool))
    a[..., 0][fresh], a[..., 1][fresh], a[..., 2][fresh], a[..., 3][fresh] = ink + (255,)
    return a, int(new.sum())

def halo(a, gone):
    """Eat the anti-aliased rim the cloak left behind: pixels touching the hole that are nearly white or
    nearly black-navy, i.e. the cloak's own blend and outline, never the otter's brown fur."""
    rgb = a[..., :3].astype(float); mx = rgb.max(2); mn = rgb.min(2); L = (mx + mn) / 510
    sat = (mx - mn) / np.maximum(mx, 1)
    h = np.zeros_like(L)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    d = mx - mn
    with np.errstate(invalid='ignore', divide='ignore'):
        h = np.where(mx == r, ((g - b) / np.maximum(d, 1)) % 6,
            np.where(mx == g, (b - r) / np.maximum(d, 1) + 2, (r - g) / np.maximum(d, 1) + 4)) * 60
    warm = (h >= 8) & (h <= 52) & (sat > .22)         # otter fur, leather, scrolls, wood: keep all of it
    edge = ~warm                                       # anything else touching the hole was cloak
    for _ in range(HALO):
        n = np.zeros_like(gone)
        n[1:] |= gone[:-1]; n[:-1] |= gone[1:]; n[:, 1:] |= gone[:, :-1]; n[:, :-1] |= gone[:, 1:]
        step = n & ~gone & edge & (a[..., 3] > 0)
        if not step.any(): break
        gone |= step
    return gone

def split(pose, grow=0):
    tex = Image.open(os.path.join(DB, f'smudge_{pose}_tex.webp')).convert('RGBA')
    mask = Image.open(os.path.join(DB, f'smudge_{pose}_mask.webp')).convert('RGB')
    if mask.size != tex.size: mask = mask.resize(tex.size, Image.NEAREST)
    g = mask.getchannel('G').point(lambda v: 255 if v > 128 else 0)
    if grow: g = g.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    cloak = np.asarray(g) > 128
    if HEAD_KEEP:                       # leave the head subtexture alone for now
        t = json.load(open(os.path.join(DB, f'smudge_{pose}_tex.json')))
        for s in t['SubTexture']:
            if s['name'] == 'head':
                cloak[s['y']:s['y'] + s['height'], s['x']:s['x'] + s['width']] = False
    a = np.asarray(tex).copy()
    cloak = halo(a, cloak)
    a[cloak] = 0
    a, mended = mend(a)
    out = os.path.join(DB, f'smudge_{pose}_nocloak.webp')
    Image.fromarray(a).save(out, quality=92, method=6)
    return out, int(cloak.sum()), mended

if __name__ == '__main__':
    for p in POSES:
        f, n, mn = split(p); print(p, n, 'erased,', mn, 'mended,', os.path.getsize(f), 'bytes')

