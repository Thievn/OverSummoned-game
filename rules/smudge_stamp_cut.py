"""Careful cut of Smudge's stamp pose (replaces the generic polygon cut for this pose).

  python3 rules/smudge_stamp_cut.py     -> art2/puppet/stamp_*.png, assets/v2/puppet/stamp_*.webp, data/rig.json

What is different from rules/puppet.py:
  * pale ground-shadow fringe along the bottom is peeled off first
  * the knocked-out eye whites are filled back in
  * head: follows the hood outline, never takes feather pixels; collar is painted in underneath
  * arm: the whole arm from the shoulder, cut by colour against the cloak; the cloak behind it is
    painted in, and the cloak drape that hangs over the shoulder is redrawn on top ("over")
"""
import json, os
import numpy as np, cv2
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art2', 'smudge', 'stamp.png')
OUT = os.path.join(ROOT, 'art2', 'puppet')
WEB = os.path.join(ROOT, 'assets', 'v2', 'puppet')

TAIL = [(432,405),(470,378),(540,395),(570,450),(565,505),(520,520),(495,470),(440,445)]
HEAD = [(262,5),(282,5),(302,12),(325,26),(345,40),(362,56),(374,78),(382,102),(387,125),(390,150),(390,168),(386,182),(378,191),
        (350,199),(322,205),(300,207),(285,215),(270,223),(255,223),(240,215),(222,207),(205,201),(188,195),(172,189),
        (161,177),(158,160),(159,140),(164,122),(175,104),(183,86),(185,76),(177,66),(166,56),(169,45),(190,34),(215,22),(240,10)]
ARM = [(336,255),(352,258),(380,238),(402,225),(420,217),(434,190),(438,165),(453,148),(478,143),(502,163),(508,215),(508,278),
       (462,283),(444,289),(427,301),(400,301),(360,293),(336,287)]
OVER = [(300,200),(410,214),(426,232),(386,247),(353,263),(341,263),(341,293),(318,293),(318,263),(300,263)]
HAND = [(413,224),(424,215),(436,190),(438,165),(453,148),(478,143),(502,163),(508,215),(508,278),(462,283),(440,265),(412,247)]
HEAD_PIVOT, ARM_PIVOT, TAIL_PIVOT, WRIST = (275, 212), (346, 270), (445, 425), (442, 238)


def poly(size, pts):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).polygon(pts, fill=255); return np.asarray(m) > 0


def crop_save(arr, name):
    ys, xs = np.where(arr[..., 3] > 0); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    im = Image.fromarray(arr[y0:y1, x0:x1], 'RGBA'); im.save(f'{OUT}/stamp_{name}.png')
    im.save(f'{WEB}/stamp_{name}.webp', quality=92, method=6)
    return [int(x0), int(y0)]


def run():
    im = Image.open(SRC).convert('RGBA'); size = im.size; a = np.asarray(im).copy()
    H, W = a.shape[:2]; yy, xx = np.mgrid[0:H, 0:W]
    rgb = a[..., :3].astype(np.int16)

    # ---- 1. peel the pale shadow fringe along the bottom. An earlier pass wrapped the whole cutout,
    #         fringe included, in a navy ink line, so: lift that line, peel the pale pixels, ink again.
    INK = np.array([16, 22, 42]); low = yy > 300
    solid = a[..., 3] > 20; before = solid.copy()
    inkish = (np.abs(rgb - INK).max(axis=2) < 14)
    ring = inkish & ndimage.binary_dilation(~solid, iterations=4) & low
    solid &= ~ring
    pale = (rgb.min(axis=2) > 38) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 24) & low
    for _ in range(80):
        edge = ndimage.binary_dilation(~solid, iterations=1) & solid & (pale | (inkish & low))
        if not edge.any(): break
        solid &= ~edge
    solid = ndimage.binary_opening(solid, iterations=1) | (solid & ~low)
    lab, n = ndimage.label(solid)
    sizes = ndimage.sum(solid, lab, range(1, n + 1)); solid &= np.isin(lab, [i + 1 for i, v in enumerate(sizes) if v > 400])
    newink = ndimage.binary_dilation(solid, iterations=2) & ~solid & low & before
    a[..., 3][~solid] = 0
    a[..., :3][newink] = INK; a[..., 3][newink] = 255
    rgb = a[..., :3].astype(np.int16)

    # ---- 2. no see-through pinholes inside the head (eye corners, mouth): close them with ink
    headp = poly(size, HEAD)
    lab, n = ndimage.label(a[..., 3] < 128)
    for i in range(1, n + 1):
        m = lab == i
        if m[0, :].any() or m[-1, :].any() or m[:, 0].any() or m[:, -1].any(): continue
        if (m & headp).sum() == m.sum() and m.sum() < 600:
            g = ndimage.binary_dilation(m, iterations=1); a[..., :3][g & (a[..., 3] < 255)] = INK; a[..., 3][g] = 255
    rgb = a[..., :3].astype(np.int16); alpha = a[..., 3] > 0
    base = a.copy(); parts = []
    teal = (rgb[..., 2] > rgb[..., 0] + 6) & (rgb[..., 1] > rgb[..., 0])
    dark = rgb.max(axis=2) < 60

    # ---- 3. tail (drawn behind the body), same cut as before
    bgnear = ndimage.binary_dilation(~alpha, iterations=10)
    tm = poly(size, TAIL); tm = tm | (ndimage.binary_dilation(tm, iterations=10) & bgnear & alpha)
    piece = a.copy(); piece[~ndimage.binary_dilation(tm, iterations=5)] = 0
    parts.append(dict(name='tail', mode='behind', pivot=list(TAIL_PIVOT), offset=crop_save(piece, 'tail')))
    base[..., 3][tm] = 0

    # ---- 4. arm: everything in the arm outline that is not cloak, plus its own ink line
    ap = poly(size, ARM) & alpha
    cloak = (rgb[..., 2] > rgb[..., 0] + 8) & (rgb[..., 1] > rgb[..., 0] + 6)
    core = ap & ~cloak
    core = ndimage.binary_opening(core, iterations=1)
    lab, n = ndimage.label(core); core = lab == (1 + int(np.argmax(ndimage.sum(core, lab, range(1, n + 1)))))
    arm = ndimage.binary_fill_holes(core)
    arm = ndimage.binary_closing(arm, iterations=2) & ap
    piece = a.copy(); piece[~arm] = 0
    # a round fur shoulder under the cloak so no gap opens when the arm turns
    disc = ((xx - ARM_PIVOT[0]) ** 2 + (yy - ARM_PIVOT[1]) ** 2 <= 21 ** 2) & ~arm & ((yy <= 285) | (xx < 340))
    furfill = cv2.inpaint(np.ascontiguousarray(piece[..., :3]), (~(arm & ~dark)).astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA)
    piece[..., :3][disc] = furfill[disc]; piece[..., 3][disc] = 255
    parts.append(dict(name='arm', mode='front', pivot=list(ARM_PIVOT), offset=crop_save(piece, 'arm')))
    # the same arm in two pieces for the bone rig: forearm, and the fist with the stamp on a wrist joint,
    # so the stamp can stay face-down while the arm swings. Fur is painted on under the fist.
    hand = arm & poly(size, HAND)
    fore = piece.copy(); under = hand & ((xx - WRIST[0]) ** 2 + (yy - WRIST[1]) ** 2 <= 24 ** 2)
    fore[hand & ~under] = 0
    wfill = cv2.inpaint(np.ascontiguousarray(piece[..., :3]), (~(arm & ~hand & ~dark)).astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA)
    fore[..., :3][under] = wfill[under]
    hp_ = a.copy(); hp_[~hand] = 0
    db = dict(forearm=dict(pivot=list(ARM_PIVOT), offset=crop_save(fore, 'forearm')), hand=dict(pivot=list(WRIST), offset=crop_save(hp_, 'hand')))
    # body behind the arm: cloak lining, mirrored up from just below the arm; open air stays empty
    hole = ndimage.binary_dilation(arm, iterations=2) & alpha
    edge_x = lambda y: 398 + (y - 240) * 24 / 60.0           # right edge of the cloak behind the arm
    behind = hole & (xx < edge_x(yy)) & (yy >= 240); arm_hole = hole.copy()
    miss = np.zeros((H, W), bool)
    for x in range(W):
        col = np.where(behind[:, x])[0]
        if not len(col): continue
        bottom = col.max() + 1
        for y in col:
            sy = min(H - 1, bottom + 2 + min(bottom - y, 26))
            ok = base[sy, x, 3] > 0 and not hole[sy, x]
            if ok: base[y, x, :3] = base[sy, x, :3]
            else: miss[y, x] = True
            base[y, x, 3] = 255
    if miss.any(): base[..., :3] = cv2.inpaint(np.ascontiguousarray(base[..., :3]), miss.astype(np.uint8) * 255, 4, cv2.INPAINT_TELEA)
    blur = cv2.GaussianBlur(base[..., :3], (0, 0), 2.2); base[..., :3][behind] = (blur[behind] * 0.9).astype(np.uint8)
    base[..., 3][hole & ~behind] = 0
    ink = behind & ndimage.binary_dilation(hole & ~behind, iterations=3)          # ink line down the cloak's new edge
    base[..., :3][ink] = (16, 22, 42)

    # ---- 5. head
    hm = headp & alpha
    band = xx < 176                                                     # the side that touches the quill
    hood = hm & teal
    feather = hm & band & ~teal & ~(dark & ndimage.binary_dilation(hood, iterations=2))
    hm &= ~feather
    hm = ndimage.binary_opening(hm, iterations=2) | (hm & ~band)
    lab, n = ndimage.label(hm); hm = lab == (1 + int(np.argmax(ndimage.sum(hm, lab, range(1, n + 1)))))
    piece = a.copy(); piece[~hm] = 0
    # soft lower seam so the hood melts into the collar
    soft = cv2.GaussianBlur(hm.astype(np.float32), (0, 0), 2.4)
    k = np.clip((yy - 182) / 8.0, 0, 1)
    seam = np.clip((soft - 0.5) * 2, 0, 1)
    piece[..., 3] = (piece[..., 3] * (1 - k + k * seam)).astype(np.uint8)
    parts_head = dict(name='head', mode='front', pivot=list(HEAD_PIVOT), offset=crop_save(piece, 'head'))
    # collar under the head: paint a band in from the cloak around it, leave the rest empty
    hole = hm.copy()
    base[..., 3][hole] = 0
    known = (base[..., 3] > 200)
    near = ndimage.binary_dilation(known, iterations=24) & hole & (yy > 172) & (xx > 170) & (xx < 384)
    fill = cv2.inpaint(np.ascontiguousarray(base[..., :3]), (~known).astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)
    base[..., :3][near] = fill[near]; base[..., 3][near] = 255

    # ---- 6. the cloak drape that hangs in front of the shoulder, redrawn over the arm
    om = poly(size, OVER) & (base[..., 3] > 0) & ~arm_hole
    piece = base.copy(); piece[~om] = 0
    parts.append(dict(name='over', mode='front', pivot=[360, 240], offset=crop_save(piece, 'over')))
    parts.append(parts_head)

    lab, n = ndimage.label(base[..., 3] > 0)                                         # no loose crumbs
    sizes = ndimage.sum(base[..., 3] > 0, lab, range(1, n + 1)); base[..., 3][~np.isin(lab, [i + 1 for i, v in enumerate(sizes) if v > 300])] = 0
    Image.fromarray(base, 'RGBA').save(f'{OUT}/stamp_base.png')
    Image.fromarray(base, 'RGBA').save(f'{WEB}/stamp_base.webp', quality=92, method=6)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/stamp_clean.png')
    fur = [int(v) for v in a[116:121, 301:306, :3].reshape(-1, 3).mean(axis=0)]
    entry = dict(size=list(size), foot=[300, 520], bag=[95, 250], parts=parts, db=db,
                 face=dict(eyes=[[267, 132, 15, 12], [339, 139, 11, 11]], mouth=[303, 186, 12, 7], fur=fur))
    for p in (f'{OUT}/rig.json', os.path.join(ROOT, 'data', 'rig.json')):
        r = json.load(open(p)); r['stamp'] = entry; json.dump(r, open(p, 'w'), separators=(',', ':') if 'data' in p else None, indent=None if 'data' in p else 1)
    return entry


def preview(entry, angles, path, bg=(70, 40, 120, 255)):
    W, H = entry['size']; canvas = Image.new('RGBA', (W + 80, H + 80), bg)
    def paste(part):
        p = Image.open(f"{OUT}/stamp_{part['name']}.png"); full = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        full.paste(p, (part['offset'][0] + 40, part['offset'][1] + 40))
        full = full.rotate(-angles.get(part['name'], 0), center=(part['pivot'][0] + 40, part['pivot'][1] + 40), resample=Image.BICUBIC)
        canvas.alpha_composite(full)
    for part in entry['parts']:
        if part['mode'] == 'behind': paste(part)
    canvas.alpha_composite(Image.open(f'{OUT}/stamp_base.png'), (40, 40))
    for part in entry['parts']:
        if part['mode'] != 'behind': paste(part)
    canvas.save(path); return canvas


if __name__ == '__main__':
    e = run()
    tiles = [preview(e, ang, f'/tmp/cut{i}.png') for i, ang in enumerate([{}, {'head': 7, 'arm': 45, 'tail': 10}, {'head': -7, 'arm': 95, 'tail': -10}])]
    row = Image.new('RGB', (sum(t.width for t in tiles), tiles[0].height)); x = 0
    for t in tiles: row.paste(t, (x, 0)); x += t.width
    row.save('/tmp/cut_all.png'); print('ok', [p['name'] for p in e['parts']])
