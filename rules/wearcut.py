"""Cuts a wardrobe item off its white background. Floods in from the border only, so white INSIDE the
item (a spectacle lens, a highlight on brass) is kept. Edges are feathered, not inked: the generated art
already carries its own navy outline, and a second stroke on top reads as a sticker."""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

def cut(src, dst, max_side=512, thresh=238, feather=1, glass=0):
    im = Image.open(src).convert('RGB')
    p = Image.new('RGB', (im.width + 6, im.height + 6), (255, 255, 255)); p.paste(im, (3, 3))
    a = np.asarray(p).astype(np.int16)
    pale = a.min(2) >= thresh                              # near-white anywhere
    lab, n = ndimage.label(pale)
    border = set(lab[0].tolist()) | set(lab[-1].tolist()) | set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
    bg = np.isin(lab, [i for i in border if i])            # only white joined to the outside
    fg = ~bg
    fg = ndimage.binary_closing(fg, np.ones((3, 3), bool))
    lb, m = ndimage.label(fg)                              # drop stray specks
    if m > 1:
        sz = ndimage.sum(fg, lb, range(1, m + 1))
        fg = np.isin(lb, [i + 1 for i in range(m) if sz[i] > sz.max() * .02])
    al = (fg * 255).astype(np.uint8)
    if glass:
        # spectacle lenses: pale areas sealed inside the item. Left opaque they hide his eyes and the
        # glasses read as a sticker, so they are dropped to glass and keep only their highlight.
        inner = pale & fg
        il, k = ndimage.label(inner)
        if k:
            sz = ndimage.sum(inner, il, range(1, k + 1))
            big = [i + 1 for i in range(k) if sz[i] > 400]
            if big: al[np.isin(il, big)] = glass
    if feather:
        al = np.asarray(Image.fromarray(al).filter(__import__('PIL.ImageFilter', fromlist=['x']).GaussianBlur(feather)))
    out = np.dstack([np.asarray(p), al]).astype(np.uint8)
    o = Image.fromarray(out, 'RGBA'); o = o.crop(o.getbbox())
    if max_side: o.thumbnail((max_side, max_side), Image.LANCZOS)
    o.save(dst, quality=92, method=6)
    return o.size

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    print(os.path.basename(dst), cut(src, dst))
