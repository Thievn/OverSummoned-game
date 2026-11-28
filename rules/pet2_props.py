"""Cuts the pet's props and cosmetics off their white pages and writes the list the pet reads.

Each one is a single object drawn on its own, so cutting is simple: take away the white that is
joined to the edge of the page, trim to what is left, and save it at a sensible size. Where it sits
on Smudge is not baked into the picture; it is a line in items.json, which the wardrobe reads.

  python3 rules/pet2_props.py
"""
import os, json
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = os.environ.get('PET2_SRC', '/tmp/pet2')
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'desktop-pet2')
OUT = os.path.join(ROOT, 'art')

# name -> the picture it comes from. The number on the end is which of Grok's two takes was better.
PIECES = {
    'prop_ledger':  'prop_ledger_1.jpg',
    'prop_stamp':   'prop_stamp_1.jpg',
    'prop_rod':     'prop_rod_1.jpg',
    'prop_bucket':  'prop_bucket_1.jpg',
    'prop_shovel':  'prop_shovel_1.jpg',
    'prop_dirt':    'prop_dirt_2.jpg',
    'prop_chest':   'part_chest_back_2.jpg',
    'prop_rake':    'part_rake_1.jpg',
}


def cut(src, dst, side=420, thresh=234, feather=0.8, crop=None, hollow=False):
    im = Image.open(src).convert('RGB')
    if crop:
        im = im.crop(crop)
    pad = Image.new('RGB', (im.width + 8, im.height + 8), (255, 255, 255))
    pad.paste(im, (4, 4))
    a = np.asarray(pad).astype(np.int16)
    pale = a.min(2) >= thresh
    lab, n = ndimage.label(pale)
    edge = set(lab[0].tolist()) | set(lab[-1].tolist()) | set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
    fg = ~np.isin(lab, [i for i in edge if i])
    fg = ndimage.binary_closing(fg, np.ones((3, 3), bool))
    lb, m = ndimage.label(fg)
    if m > 1:                                       # drop stray specks, keep anything sizeable
        sz = ndimage.sum(fg, lb, range(1, m + 1))
        fg = np.isin(lb, [i + 1 for i in range(m) if sz[i] > sz.max() * .03])
    if hollow:
        # a crown or a helmet is a ring: the bare white sealed inside it is the hole the head goes
        # through, not part of the item, so it is taken out
        inner = (a.min(2) >= 247) & fg
        il, k = ndimage.label(inner)
        if k:
            isz = ndimage.sum(inner, il, range(1, k + 1))
            big = [i + 1 for i in range(k) if isz[i] > fg.sum() * 0.012]
            if big:
                fg = fg & ~np.isin(il, big)
    rgb = np.asarray(pad).copy()
    idx = ndimage.distance_transform_edt(~fg, return_distances=False, return_indices=True)
    rgb[~fg] = rgb[idx[0][~fg], idx[1][~fg]]        # carry colour past the edge, so no white rim
    al = (fg * 255).astype(np.uint8)
    if feather:
        al = np.asarray(Image.fromarray(al).filter(ImageFilter.GaussianBlur(feather)))
    out = Image.fromarray(np.dstack([rgb, al]).astype(np.uint8), 'RGBA')
    out = out.crop(out.getbbox())
    out.thumbnail((side, side), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    out.save(dst)
    return out.size


def main():
    sizes = {}
    for name, f in PIECES.items():
        p = os.path.join(SRC, f)
        if not os.path.exists(p):
            print('missing', f)
            continue
        sizes[name] = cut(p, f'{OUT}/{name}.png')
    # the tension wrench is the right-hand tool on the pair sheet, so it is cropped out first
    w = os.path.join(SRC, 'part_lockpicks_1.jpg')
    if os.path.exists(w):
        im = Image.open(w)
        sizes['prop_wrench'] = cut(w, f'{OUT}/prop_wrench.png',
                                   crop=(int(im.width * .55), 0, im.width, im.height))
    # anything called hat_*, face_* or neck_* in the art folder is a cosmetic
    for f in sorted(os.listdir(SRC)):
        for kind in ('hat_', 'face_', 'neck_'):
            if f.startswith(kind) and f.endswith('.jpg'):
                name = f[:-4]
                if name[-2:-1] == '_' and name[-1].isdigit(): name = name[:-2]
                sizes[name] = cut(os.path.join(SRC, f), f'{OUT}/{name}.png', side=480, hollow=True)
    print(json.dumps(sizes, indent=1))


if __name__ == '__main__':
    main()
