"""Lift the cloak off Smudge by comparing the dressed and bare turnarounds.

  python3 rules/cloak_diff.py <bare_sheet> <dressed_sheet> <out_dir>

The two sheets are the same character in the same eight poses, one with the cloak and one
without, so whatever differs between them is the cloak, the belt and the pack. Differencing them
is far more reliable than keying out the teal: it catches the brown belt and the leather pack
too, and it doesn't eat the parts of him that happen to be bluish.
"""
import os, sys, numpy as np
from PIL import Image
from scipy import ndimage

CELLS = 4, 2
NAMES = ['01_front', '02_three_quarter_front_right', '03_side_right', '04_three_quarter_back_right',
         '05_back', '06_three_quarter_back_left', '07_side_left', '08_three_quarter_front_left']


def cells(im, label_skip=0.05):
    w, h = im.size; cw, ch = w // CELLS[0], h // CELLS[1]
    out = []
    for r in range(CELLS[1]):
        for c in range(CELLS[0]):
            out.append(im.crop((c * cw, r * ch + int(ch * label_skip), (c + 1) * cw, (r + 1) * ch)))
    return out


def best_shift(a, b, rng=14):
    """The two sheets are drawn separately, so a pose can sit a few pixels off. Slide one over
    the other and keep the offset where the silhouettes agree most."""
    ga, gb = np.asarray(a.convert('L')).astype(float), np.asarray(b.convert('L')).astype(float)
    ma, mb = ga < 236, gb < 236
    best, bxy = -1, (0, 0)
    for dy in range(-rng, rng + 1, 2):
        for dx in range(-rng, rng + 1, 2):
            sb = np.roll(np.roll(mb, dy, 0), dx, 1)
            score = (ma & sb).sum() / max((ma | sb).sum(), 1)
            if score > best: best, bxy = score, (dx, dy)
    return bxy, best


def main(bare_p, dressed_p, out):
    os.makedirs(out, exist_ok=True)
    B, D = Image.open(bare_p).convert('RGB'), Image.open(dressed_p).convert('RGB')
    cb, cd = cells(B), cells(D)
    for name, b, d in zip(NAMES, cb, cd):
        (dx, dy), score = best_shift(b, d)
        nb = np.roll(np.roll(np.asarray(b).astype(int), -dy, 0), -dx, 1)
        nd = np.asarray(d).astype(int)
        diff = np.abs(nd - nb).sum(2)                      # where dressed differs from bare
        worn = diff > 60
        worn = ndimage.binary_closing(worn, np.ones((5, 5)))
        worn = ndimage.binary_opening(worn, np.ones((3, 3)))
        worn = ndimage.binary_fill_holes(worn)
        lab, n = ndimage.label(worn)                       # keep the big pieces, drop speckle
        if n:
            sz = ndimage.sum(worn, lab, range(1, n + 1))
            keep = [i + 1 for i, s in enumerate(sz) if s > worn.size * 0.004]
            worn = np.isin(lab, keep)
        a = (worn * 255).astype(np.uint8)
        rgba = np.dstack([nd.astype(np.uint8), a])
        im = Image.fromarray(rgba, 'RGBA')
        bb = im.getbbox()
        if bb: im.crop(bb).save(f'{out}/{name}.png')
        print(f'{name:28s} align {dx:+3d},{dy:+3d} ({score:.2f})  worn {worn.mean()*100:5.1f}% of cell')


main(*sys.argv[1:4])
