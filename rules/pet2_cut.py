"""Cuts the front-facing Smudge base picture into the layered parts the desktop pet uses.

One drawing in, several PNGs out, all on the same 1024x1024 canvas so every part lines up with
every other part. Nothing is redrawn by hand: the parts are regions of the one approved picture,
with the holes left behind filled in by smearing the neighbouring pixels.

  python3 rules/pet2_cut.py            # cuts everything into desktop-pet2/art/
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = os.environ.get('PET2_SRC', '/tmp/pet2')
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'desktop-pet2', 'art')
N = 1024                                   # the shared canvas every part is drawn on

# where things are in the base picture, read off a grid overlay
DESK_TOP = 806                             # the desk hides everything below this line
PAWS = {'paw_l': (300, 760, 450, 890), 'paw_r': (595, 760, 745, 890)}    # x0, y0, x1, y1 round each paw
# straps, buckles, the clasp and the belt: brown like his fur, but they are not fur
LEATHER = [(335, 495, 420, 815), (620, 495, 700, 815), (448, 520, 560, 610), (455, 780, 585, 820)]

# Every number here is a place on the shared 1024x1024 canvas. The pet reads this file.
RIG = {
    "canvas": 1024,
    "eye_l": [426, 291], "eye_r": [614, 291], "eye_r_px": 42,
    "brow_l": [424, 236], "brow_r": [616, 236],
    "nose": [521, 354],
    "mouth": [521, 396], "mouth_w": 186,
    "muzzle": [521, 380],
    "head": [517, 300], "head_pivot": [517, 470], "head_top": [517, 118], "head_w": 440,
    "hood_at": [-3, -5],
    "paw_l": [367, 822], "paw_r": [665, 822],
    "desk_top": DESK_TOP, "desk_y": 836,
    "hold_l": [367, 800], "hold_r": [665, 800],
    "neck": [517, 470], "chest": [517, 650],
    "bubble": [517, 96],
}


def load(name):
    """The picture with its white background taken away."""
    im = Image.open(os.path.join(SRC, name)).convert('RGB').resize((N, N), Image.LANCZOS)
    a = np.asarray(im).astype(np.int16)
    pale = a.min(2) >= 236
    lab, n = ndimage.label(pale)
    edge = set(lab[0].tolist()) | set(lab[-1].tolist()) | set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
    bg = np.isin(lab, [i for i in edge if i])
    fg = ndimage.binary_closing(~bg, np.ones((3, 3), bool))
    return np.asarray(im), fg


def smear(rgb, keep, into, axis=0, up=False):
    """Fills `into` with the nearest kept pixel along one axis, so a hole never shows an edge."""
    out = rgb.copy()
    idx = ndimage.distance_transform_edt(~keep, return_distances=False, return_indices=True)
    out[into] = rgb[idx[0][into], idx[1][into]]
    return out


BOX = {}

def save(rgb, mask, path, feather=1.0, mask_img=None):
    """Writes one part, trimmed to just the pixels it uses, and remembers where on the page it sat.
    The white page behind the drawing would show as a pale rim once the edge is softened, so the
    colours are carried outwards past the edge first and the softening happens over real colour."""
    rgb = smear(rgb, mask, ~mask)
    a = (mask * 255).astype(np.uint8)
    if feather:
        a = np.asarray(Image.fromarray(a).filter(ImageFilter.GaussianBlur(feather)))
    im = Image.fromarray(np.dstack([rgb, a]).astype(np.uint8), 'RGBA')
    box = im.getbbox()
    im = im.crop(box)
    name = os.path.basename(path)[:-4]
    BOX[name] = box
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path)
    if mask_img is not None:
        Image.fromarray((mask_img * 255).astype(np.uint8)).crop(box).save(path[:-4] + '_fur_mask.png')
    return im


def _crop(mask, part, path):
    Image.fromarray((mask * 255).astype(np.uint8)).crop(BOX[part]).save(path)


def main():
    os.makedirs(OUT, exist_ok=True)
    rgb, fg = load('base_hooddown_2.jpg')
    dark = (rgb[:, :, 0] < 95) & (rgb[:, :, 1] < 70) & (rgb[:, :, 2] < 60) & fg

    # ---- the two paws. The ink outline joins every dark shape in the drawing, so each paw is
    # found inside its own box: the biggest dark blob in there, grown a little to take its outline.
    paw = {}
    for key, (x0, y0, x1, y1) in PAWS.items():
        box = np.zeros_like(dark)
        box[y0:y1, x0:x1] = True
        lab, n = ndimage.label(dark & box)
        sz = ndimage.sum(dark & box, lab, range(1, n + 1))
        m = (lab == int(np.argmax(sz)) + 1)
        m = ndimage.binary_fill_holes(m)
        m = ndimage.binary_dilation(m, np.ones((7, 7), bool)) & box & fg
        paw[key] = ndimage.binary_fill_holes(m)
    anypaw = paw['paw_l'] | paw['paw_r']

    rows = np.arange(N)[:, None] * np.ones((1, N), bool)
    low = rows >= DESK_TOP

    # ---- the desk: the wooden slab, with the paws lifted off it and their holes filled
    desk = fg & low & ~anypaw
    desk = ndimage.binary_fill_holes(desk)
    desk_full = ndimage.binary_fill_holes(fg & low) & low
    hole = desk_full & ~desk
    deskrgb = smear(rgb, desk, hole)
    deskrgb = np.asarray(Image.fromarray(deskrgb.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0)))
    save(deskrgb, desk_full, f'{OUT}/desk.png')

    # ---- the paws, each with a little room around it
    for key, m in paw.items():
        save(rgb, m, f'{OUT}/{key}.png')

    # ---- the core: head, body, cloak. Everything the desk and the paws do not cover.
    core = fg & ~low & ~anypaw
    core = ndimage.binary_fill_holes(core)
    # the paws sit over the body, so fill what they were hiding
    overlap = anypaw & ~low
    keep = core & ~overlap
    corergb = smear(rgb, keep, overlap | (~core))
    full = core | overlap
    # carry the bottom edge down behind the desk, so breathing never shows a gap
    tail = np.zeros_like(full)
    tail[DESK_TOP:DESK_TOP + 90] = True
    band = full[DESK_TOP - 1]
    for y in range(DESK_TOP, min(N, DESK_TOP + 90)):
        full[y] |= band
        corergb[y] = np.where(band[:, None], corergb[DESK_TOP - 1], corergb[y])
    save(corergb, full, f'{OUT}/core.png')

    # ---- the hood, lifted off the hood-up drawing: teal, above the shoulders
    h_rgb, h_fg = load('base_hoodup_1.jpg')
    teal = (h_rgb[:, :, 2].astype(int) - h_rgb[:, :, 0] > 14) & (h_rgb[:, :, 1] > 28) & h_fg
    teal &= (rows < 560)                                     # the hood only, not the cloak or the satchel
    teal = ndimage.binary_closing(teal, np.ones((5, 5), bool))
    teal = ndimage.binary_dilation(teal, np.ones((7, 7), bool)) & h_fg    # take its ink outline with it
    teal = ndimage.binary_closing(teal, np.ones((7, 7), bool))
    lab, n = ndimage.label(teal)
    if n:
        sz = ndimage.sum(teal, lab, range(1, n + 1))
        teal = (lab == int(np.argmax(sz)) + 1)
    # no hole filling: the hood is a ring and the face belongs to whoever is wearing it
    teal = ndimage.binary_dilation(teal, np.ones((3, 3), bool)) & h_fg
    save(h_rgb, teal, f'{OUT}/hood.png')

    # ---- masks for recolouring. White means "this is fur" or "this is cloak", so a shader can
    # shift the colour of only that part. Leather, buckles, the clasp and the ink outlines are
    # left out by hand, because their brown is too close to his fur to separate by colour alone.
    r, g, b = [rgb[:, :, i].astype(int) for i in range(3)]
    lum = rgb.max(2).astype(int)
    furm = (r > g) & (g >= b) & (lum > 92) & core
    for (x0, y0, x1, y1) in LEATHER:
        furm[y0:y1, x0:x1] = False
    furm = ndimage.binary_opening(furm, np.ones((3, 3), bool))
    cloakm = (b.astype(int) - r > 12) & (g > 26) & core
    cloakm = ndimage.binary_opening(cloakm, np.ones((3, 3), bool))
    _crop(furm, 'core', f'{OUT}/core_fur_mask.png')
    _crop(cloakm, 'core', f'{OUT}/core_cloak_mask.png')
    for key, m in paw.items():
        _crop((rgb[:, :, 0] > 20) & m, key, f'{OUT}/{key}_fur_mask.png')
    h_r, h_g, h_b = [h_rgb[:, :, i].astype(int) for i in range(3)]
    _crop((h_b - h_r > 12) & (h_g > 26) & teal, 'hood', f'{OUT}/hood_fur_mask.png')

    RIG['off'] = {k: [v[0], v[1]] for k, v in BOX.items()}
    json.dump(RIG, open(os.path.join(os.path.dirname(OUT), 'rig.json'), 'w'), indent=1)
    print('wrote', sorted(os.listdir(OUT)))


if __name__ == '__main__':
    main()
