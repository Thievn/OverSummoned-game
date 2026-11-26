"""Shared helpers for the careful, per-pose puppet cuts (see smudge_fish_cut.py etc.)."""
import json, os
import numpy as np, cv2
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'art2', 'puppet'); WEB = os.path.join(ROOT, 'assets', 'v2', 'puppet')
INK = (16, 22, 42)


def load(pose):
    a = np.asarray(Image.open(os.path.join(ROOT, 'art2', 'smudge', pose + '.png')).convert('RGBA')).copy()
    H, W = a.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]
    return a, xx, yy


def poly(a, pts):
    m = Image.new('L', (a.shape[1], a.shape[0]), 0); ImageDraw.Draw(m).polygon(pts, fill=255); return np.asarray(m) > 0


def colours(a):
    rgb = a[..., :3].astype(np.int16)
    teal = (rgb[..., 2] > rgb[..., 0] + 6) & (rgb[..., 1] > rgb[..., 0])          # cloak, hood
    cloak = (rgb[..., 2] > rgb[..., 0] + 8) & (rgb[..., 1] > rgb[..., 0] + 6)      # cloak but not neutral ink
    dark = rgb.max(axis=2) < 60
    return teal, cloak, dark


def biggest(m):
    lab, n = ndimage.label(m)
    return m if n < 2 else lab == (1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1)))))


def save(piece, pose, name):
    ys, xs = np.where(piece[..., 3] > 0); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    im = Image.fromarray(piece[y0:y1, x0:x1], 'RGBA'); im.save(f'{OUT}/{pose}_{name}.png'); im.save(f'{WEB}/{pose}_{name}.webp', quality=92, method=6)
    return [int(x0), int(y0)]


def cut_head(a, base, pts, soft, fill, quill=None, swing=None):
    """Head on top of the body. pts: outline hugging the hood. soft: polygon where the lower edge is
    feathered into the collar. fill: polygon where the collar is painted in underneath.
    quill: polygon where anything that is not hood (the feather behind it) is left on the body."""
    teal, cloak, dark = colours(a); alpha = a[..., 3] > 0
    hm = poly(a, pts) & alpha
    if quill is not None:
        band = poly(a, quill); hood = hm & teal
        hm &= ~(hm & band & ~teal & ~(dark & ndimage.binary_dilation(hood, iterations=2)))
        hm = ndimage.binary_opening(hm, iterations=2) | (hm & ~band)
    hm = biggest(hm)
    # take the hood's own ink line too, wherever it faces open air (never on the quill side or the collar)
    grab = ndimage.binary_dilation(hm, iterations=6) & alpha & ~poly(a, soft) & ndimage.binary_dilation(~alpha, iterations=7)
    if quill is not None: grab &= ~ndimage.binary_dilation(poly(a, quill), iterations=4)
    hm = biggest(hm | grab)
    piece = a.copy(); piece[~hm] = 0
    edge = np.clip((cv2.GaussianBlur(hm.astype(np.float32), (0, 0), 2.4) - 0.5) * 2, 0, 1)
    k = cv2.GaussianBlur(poly(a, soft).astype(np.float32), (0, 0), 3)
    piece[..., 3] = (piece[..., 3] * (1 - k + k * edge)).astype(np.uint8)
    base[..., 3][hm] = 0
    known = base[..., 3] > 200
    near = ndimage.binary_dilation(known, iterations=24) & hm & poly(a, fill)
    if swing is not None:
        # Heroes: the head leaves a hole in the body. Turning the head uncovers the rim of that hole, which used to show
        # as a slit or a stuck-looking second head. So the body is painted in all round the join, as far in as there is
        # body to copy from, rather than only under the chin.
        near = ndimage.binary_dilation(known, iterations=34) & hm
    painted = cv2.inpaint(np.ascontiguousarray(base[..., :3]), (~known).astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)
    base[..., :3][near] = painted[near]; base[..., 3][near] = 255
    return piece


def cut_behind(a, base, pts, overlap=None, keep_cloak=True, soften=None, thin=False, under=None, fur_only=False):
    """A part drawn behind the body (tail, dangling legs, rod). pts: what leaves the body.
    overlap: extra polygon of the original picture the part also carries, so it reaches up under the
    body and no gap opens when it swings. soften: polygon where the body's cut edge is feathered."""
    teal, cloak, dark = colours(a); alpha = a[..., 3] > 0
    m = poly(a, pts) & alpha
    if keep_cloak: m &= ~cloak
    if fur_only:
        rgb = a[..., :3].astype(np.int16); m &= (rgb[..., 0] > rgb[..., 2] + 18) & (rgb[..., 0] >= rgb[..., 1])
    if not thin:
        m = biggest(ndimage.binary_opening(m, iterations=1))
        grow = ndimage.binary_dilation(m, iterations=3) & poly(a, pts) & alpha & (~cloak if keep_cloak else True)
        m = (m | (ndimage.binary_dilation(m, iterations=8) & poly(a, pts) & alpha & dark & ndimage.binary_dilation(~alpha, iterations=8))) if fur_only else grow
    pm = m | (poly(a, overlap) & alpha if overlap is not None else False)
    piece = a.copy(); piece[~pm] = 0
    # where cloak (or anything in the `under` polygon) sits in front of the part, paint the part's own
    # fur in underneath, so nothing opens up when it swings
    hid = poly(a, pts) & alpha & (~m if fur_only else cloak) & ndimage.binary_dilation(m, iterations=30) if keep_cloak else np.zeros_like(m)
    if under is not None: hid = hid | (poly(a, under) & alpha & ~m & ndimage.binary_dilation(m, iterations=30))
    if hid.any():
        fur = cv2.inpaint(np.ascontiguousarray(a[..., :3]), (~(m & ~dark)).astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA)
        piece[..., :3][hid & (piece[..., 3] == 0)] = fur[hid & (piece[..., 3] == 0)]; piece[..., 3][hid] = 255
    base[..., 3][m] = 0
    if soften is not None:
        gone = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 3.0)
        k = poly(a, soften)
        base[..., 3] = np.where(k, (base[..., 3] * np.clip(1 - gone * 2.2, 0, 1)).astype(np.uint8), base[..., 3])
    return piece


def cut_front(a, base, pts, fill=10, fur_only=True):
    """A part lying on top of the body (a tail curled in front). Cloak stays on the body. The body is
    painted a little way in under the part's edge so no slit opens when it lifts; the rest is cleared."""
    teal, cloak, dark = colours(a); alpha = a[..., 3] > 0; rgb = a[..., :3].astype(np.int16)
    m = poly(a, pts) & alpha & ~cloak
    if fur_only:
        fur = m & (rgb[..., 0] > rgb[..., 2] + 18) & (rgb[..., 0] >= rgb[..., 1])
        fur = biggest(ndimage.binary_opening(fur, iterations=1))
        m = ndimage.binary_fill_holes(fur | (ndimage.binary_dilation(fur, iterations=7) & m & dark))
    m |= ndimage.binary_dilation(m, iterations=7) & alpha & dark & ndimage.binary_dilation(~alpha, iterations=8) & ndimage.binary_dilation(poly(a, pts), iterations=6)
    piece = a.copy(); piece[~m] = 0
    base[..., 3][m] = 0
    known = base[..., 3] > 200
    band = ndimage.binary_dilation(known, iterations=fill) & m
    painted = cv2.inpaint(np.ascontiguousarray(base[..., :3]), (~known).astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA)
    base[..., :3][band] = painted[band]; base[..., 3][band] = 255
    return piece


def crumbs(base, least=300):
    lab, n = ndimage.label(base[..., 3] > 0)
    if n > 1:
        sizes = ndimage.sum(base[..., 3] > 0, lab, range(1, n + 1)); base[..., 3][~np.isin(lab, [i + 1 for i, v in enumerate(sizes) if v > least])] = 0


def finish(pose, a, base, entry):
    crumbs(base)
    for d, ext in ((OUT, 'png'), (WEB, 'webp')):
        Image.fromarray(base, 'RGBA').save(f'{d}/{pose}_base.{ext}', **({'quality': 92, 'method': 6} if ext == 'webp' else {}))
    for p in (f'{OUT}/rig.json', os.path.join(ROOT, 'data', 'rig.json')):
        r = json.load(open(p)); r[pose] = entry
        json.dump(r, open(p, 'w'), separators=(',', ':')) if 'data' in p else json.dump(r, open(p, 'w'), indent=1)


def preview(pose, entry, angles, bg=(70, 40, 120, 255)):
    W, H = entry['size']; canvas = Image.new('RGBA', (W + 80, H + 80), bg)
    def paste(part):
        p = Image.open(f"{OUT}/{pose}_{part['name']}.png"); full = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        full.paste(p, (part['offset'][0] + 40, part['offset'][1] + 40))
        canvas.alpha_composite(full.rotate(-angles.get(part['name'], 0), center=(part['pivot'][0] + 40, part['pivot'][1] + 40), resample=Image.BICUBIC))
    for part in entry['parts']:
        if part['mode'] == 'behind': paste(part)
    canvas.alpha_composite(Image.open(f'{OUT}/{pose}_base.png'), (40, 40))
    for part in entry['parts']:
        if part['mode'] != 'behind': paste(part)
    return canvas


def sheet(pose, entry, sets, path):
    tiles = [preview(pose, entry, s) for s in sets]
    row = Image.new('RGB', (sum(t.width for t in tiles), tiles[0].height)); x = 0
    for t in tiles: row.paste(t, (x, 0)); x += t.width
    row.save(path)
