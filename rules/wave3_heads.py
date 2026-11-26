"""Proposes a head polygon and neck pivot for a hero cutout, the way heropup.HEADS wants them.
The head is the blob at the top; the neck is the narrowest row under it. Always check the drawing it
saves to /tmp/headcheck_<id>.png before trusting a number.
  python3 rules/wave3_heads.py <id> [...]"""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def runs(row):
    """the horizontal stretches of character in one row of pixels"""
    out, start = [], None
    for x, v in enumerate(row):
        if v and start is None: start = x
        if not v and start is not None: out.append((start, x - 1)); start = None
    if start is not None: out.append((start, len(row) - 1))
    return out

NECK = {   # read off the drawings: the row where the head stops and the collar or shoulders start
 'doug': 155, 'bjorn': 165, 'mona': 150, 'dusty': 165, 'hootsworth': 170, 'sterling': 140, 'dolly': 165,
 'gladius': 170, 'quack': 160, 'selene': 140, 'beep': 145, 'tut': 205, 'eagleton': 190, 'zorp': 195,
}

XLIM = {  # where a raised arm, a pickaxe or a wing touches the head and must be left out of it
 'dusty': (118, 337), 'gladius': (102, 300), 'bjorn': (95, 330), 'eagleton': (175, 363),
}

def propose(hid, neck=None):
    """The head is everything above the neck row that belongs to the body's own stretch of pixels, so a pickaxe
    or a cocktail held up beside the ear is left behind."""
    a = np.asarray(Image.open(f'{ROOT}/art2/heroes/{hid}.png').convert('RGBA'))
    al = a[..., 3] > 24; H, W = al.shape
    top = int(np.argmax(al.any(1)))
    neck = neck or NECK[hid]
    cx = int(np.mean(np.where(al[top:top + int(H * .06)].any(0))[0]))
    def mid(y):
        for s, e in runs(al[y]):
            if s - 14 <= cx <= e + 14: return s, e
        return None
    x0, x1 = W, 0
    for y in range(top, neck + 1):
        r = mid(y)
        if r: x0, x1 = min(x0, r[0]), max(x1, r[1]); cx = (r[0] + r[1]) // 2
    if hid in XLIM: x0, x1 = XLIM[hid]
    bottom = min(H - 1, neck + 10)
    nr = mid(neck) or (x0, x1)
    pivot = (int((nr[0] + nr[1]) / 2), int(neck))
    cham = max(8, (x1 - x0) // 6)
    pts = [(x0, top), (x1, top), (x1, bottom - cham), (x1 - cham, bottom), (x0 + cham, bottom), (x0, bottom - cham)]
    return pts, pivot

def draw(hid, pts, pivot):
    im = Image.open(f'{ROOT}/art2/heroes/{hid}.png').convert('RGBA')
    c = Image.new('RGBA', im.size, (255, 255, 255, 255)); c.alpha_composite(im); d = ImageDraw.Draw(c)
    d.polygon(pts, outline=(230, 20, 120, 255), width=3)
    d.ellipse([pivot[0] - 5, pivot[1] - 5, pivot[0] + 5, pivot[1] + 5], fill=(20, 120, 230, 255))
    c.convert('RGB').save(f'/tmp/headcheck_{hid}.png')
    return c

if __name__ == '__main__':
    out = {}
    for hid in sys.argv[1:]:
        p, v = propose(hid); draw(hid, p, v); out[hid] = (p, v)
        print(f' "{hid}": ({[tuple(x) for x in p]}, {v}),'.replace('[(', '[(').replace(')]', ')]'))
