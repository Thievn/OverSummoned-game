"""Cut the Scenario face sheet into DragonBones parts.

  python3 rules/head_cut.py

Six drawn faces -> art2/head/face_<name>.png (hood removed, so the head can turn inside it)
plus one hood/<name>.png taken from the calm face, which sits behind and lags.
Everything is lined up on the nose so the faces swap without the head jumping.
"""
import json, os, numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = '/tmp/faces/sheet.png'
OUT = os.path.join(ROOT, 'art2', 'head')
NAMES = ['calm', 'open', 'laugh', 'focus', 'happy', 'gasp']
PAGE = 660          # square page every part is drawn on
NOSE = (330, 340)   # where every nose lands on that page


def alpha(a):
    """White page -> transparency, with a soft edge so nothing looks cut out with scissors."""
    lum = a.astype(float).mean(2)
    al = np.clip((250 - lum) / 14, 0, 1)
    al[ndimage.binary_fill_holes(lum < 244)] = 1.0
    return al


def teal(a):
    """The hood: strongly blue-green, and darker than the fur."""
    r, g, b = a[..., 0].astype(float), a[..., 1].astype(float), a[..., 2].astype(float)
    m = (b > r + 18) & (g > r + 4) & (b < 190)
    m = ndimage.binary_closing(m, np.ones((5, 5)))
    m = ndimage.binary_fill_holes(m)
    lab, n = ndimage.label(m)
    if n:                      # keep the one big hood, drop stray blue in the eyes
        sz = ndimage.sum(m, lab, range(1, n + 1))
        m = lab == (int(np.argmax(sz)) + 1)
    return m


def nose_at(a, al):
    """The nose is the darkest solid blob in the middle of the face."""
    h, w = al.shape
    box = np.zeros((h, w), bool); box[int(h * .30):int(h * .62), int(w * .30):int(w * .70)] = True
    d = (a.max(2) < 72) & box & (al > .5)
    ys, xs = np.where(d)
    return xs.mean(), ys.mean()


def place(rgb, mask, al, nx, ny):
    """Drop a part onto the common page with its nose on the common spot."""
    out = np.zeros((PAGE, PAGE, 4), np.uint8)
    ys, xs = np.where(mask & (al > .02))
    if not len(ys): return None
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    dx, dy = int(round(NOSE[0] - nx)), int(round(NOSE[1] - ny))
    tx0, ty0 = x0 + dx, y0 + dy
    sub = np.dstack([rgb[y0:y1, x0:x1], (al[y0:y1, x0:x1] * mask[y0:y1, x0:x1] * 255)]).astype(np.uint8)
    out[ty0:ty0 + sub.shape[0], tx0:tx0 + sub.shape[1]] = sub
    return Image.fromarray(out)


def main():
    os.makedirs(OUT, exist_ok=True)
    im = Image.open(SRC).convert('RGB'); W, H = im.size
    meta = {'page': PAGE, 'nose': list(NOSE), 'faces': NAMES}
    for i, nm in enumerate(NAMES):
        c = np.asarray(im.crop(((i % 3) * W // 3, (i // 3) * H // 2, (i % 3 + 1) * W // 3, (i // 3 + 1) * H // 2)))
        al = alpha(c); nx, ny = nose_at(c, al); solid = al > .02
        # The ink outline around the hood is drawn dark, not teal, so grow the teal a little
        # and hand that border over to the hood. Otherwise the face keeps a ghost hood edge.
        hood = ndimage.binary_dilation(teal(c) & (al > .5), np.ones((13, 13))) & solid
        face = ndimage.binary_closing(solid & ~hood, np.ones((3, 3))) & solid
        lab, n = ndimage.label(face)       # the head is one blob; the cloak clasp and
        if n > 1:                          # other loose bits belong to the hood layer
            keep = int(np.argmax(ndimage.sum(face, lab, range(1, n + 1)))) + 1
            hood |= face & (lab != keep); face = lab == keep
        place(c, face, al, nx, ny).save(f'{OUT}/face_{nm}.png')
        if nm == 'calm':
            place(c, hood, al, nx, ny).save(f'{OUT}/hood.png')
            # the cloak shoulders below the hood opening, so the head has something to sit on
        print(f'{nm:7s} nose {nx:5.0f},{ny:5.0f}  face {face.sum():6d}px  hood {hood.sum():6d}px')
    json.dump(meta, open(f'{OUT}/head.json', 'w'), indent=1)


main()
