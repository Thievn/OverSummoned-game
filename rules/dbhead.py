"""Rig the drawn Smudge head as a real DragonBones skeleton.

  python3 rules/dbhead.py   -> assets/v2/db/smudge_head_{ske.json,tex.json,tex.webp}

Uses the same exporter helpers and the same 5.5 output as rules/dbexport.py, so the same
browser player (js/dbcanvas.js) runs it. Nothing here is drawn in code: the head and the hood
are the painted pictures, cut apart in rules/head_cut.py. What the rig adds is movement.

Why it doesn't look stiff:
  * the head is a soft mesh, not a flat picture on a pivot. The chin is pinned to the neck,
    the middle follows the head bone and the top follows a crown bone, so turning the head
    bends it instead of swinging it like a signboard.
  * the hood is its own mesh on its own bone and is always a few frames behind the head.
    That lag is what sells weight.
  * every key is eased, and the fast moves overshoot and settle instead of stopping dead.
"""
import json, math, os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dbexport import grid, keys, wave, mat, r2, EASE

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art2', 'head')
OUT = os.path.join(ROOT, 'assets', 'v2', 'db')
FPS = 30
S, T = math.sin, 2 * math.pi
smooth = lambda t: 0.0 if t <= 0 else 1.0 if t >= 1 else t * t * (3 - 2 * t)
band = lambda v, a, b: smooth((v - a) / (b - a))


def build():
    meta = json.load(open(os.path.join(SRC, 'head.json')))
    faces = meta['faces']
    img = {n: Image.open(os.path.join(SRC, f'face_{n}.png')) for n in faces}
    img['hood'] = Image.open(os.path.join(SRC, 'hood.png'))

    # One box for all six faces, so every expression is the same mesh and swapping one for
    # another moves nothing. The hood keeps its own box.
    def box(ims):
        bs = [i.getbbox() for i in ims]
        return (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))
    fb = box([img[n] for n in faces]); hb = box([img['hood']])
    for n in faces: img[n] = img[n].crop(fb)
    img['hood'] = img['hood'].crop(hb)
    fw, fh = img[faces[0]].size; hw, hh = img['hood'].size

    # Armature space: x from the middle of the head, y from the bottom of the hood, up is negative.
    OX, OY = (fb[0] + fb[2]) / 2, hb[3]
    A = lambda x, y: (r2(x - OX), r2(y - OY))
    chin, top = fb[3], fb[1]
    hbot, htop = hb[3], hb[1]
    neck_p = A(OX, chin - (chin - top) * 0.06)        # the pivot the chin turns on
    head_p = A(OX, chin - (chin - top) * 0.45)        # the middle of the head
    crown_p = A(OX, chin - (chin - top) * 0.88)       # the top of the skull
    cloak_p = A(OX, hbot - (hbot - htop) * 0.55)

    # ---- atlas
    order = sorted(img, key=lambda n: -img[n].size[1]); W = 2048; x = y = 2; rowh = 0; sub = []
    for n in order:
        w, h = img[n].size
        if x + w + 2 > W: x = 2; y += rowh + 2; rowh = 0
        sub.append({'name': n, 'x': x, 'y': y, 'width': w, 'height': h}); x += w + 2; rowh = max(rowh, h)
    H = 1
    while H < y + rowh + 2: H *= 2
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for s in sub: atlas.paste(img[s['name']], (s['x'], s['y']))

    bones = [
        {'name': 'root'},
        {'name': 'cloak', 'parent': 'root', 'transform': {'x': cloak_p[0], 'y': cloak_p[1]}},
        {'name': 'neck', 'parent': 'root', 'transform': {'x': neck_p[0], 'y': neck_p[1]}},
        {'name': 'head', 'parent': 'neck', 'transform': {'x': r2(head_p[0] - neck_p[0]), 'y': r2(head_p[1] - neck_p[1])}},
        {'name': 'crown', 'parent': 'head', 'transform': {'x': r2(crown_p[0] - head_p[0]), 'y': r2(crown_p[1] - head_p[1])}},
    ]
    idx = {b['name']: i for i, b in enumerate(bones)}

    # ---- head mesh: chin held by the neck, middle by the head, skull by the crown
    def wface(px, py):
        t = (fh - py) / fh                       # 0 at the chin, 1 at the top of the ears
        n = 1 - band(t, 0.02, 0.34)
        c = 0.80 * band(t, 0.40, 0.96)
        return [(idx['neck'], n), (idx['crown'], c), (idx['head'], max(0.0, 1 - n - c))]
    fv, fu, ft, fwt = grid(fw, fh, A(fb[0], fb[1]), 11, 12, wface)
    fpose = [idx['neck']] + mat(0, *neck_p) + [idx['head']] + mat(0, *head_p) + [idx['crown']] + mat(0, *crown_p)

    # ---- hood mesh: hem pinned to the shoulders, the rest rides the cloak bone
    def whood(px, py):
        s = (hh - py) / hh
        c = band(s, 0.06, 0.52)
        return [(idx['root'], 1 - c), (idx['cloak'], c)]
    hv, hu, ht2, hwt = grid(hw, hh, A(hb[0], hb[1]), 10, 11, whood)
    hpose = [idx['root']] + mat(0, 0, 0) + [idx['cloak']] + mat(0, *cloak_p)

    mesh = lambda nm, w, h, v, u, t, wt, bp: {'type': 'mesh', 'name': nm, 'width': w, 'height': h,
        'vertices': v, 'uvs': u, 'triangles': t, 'weights': wt, 'slotPose': [1, 0, 0, 1, 0, 0], 'bonePose': bp}
    slots = [{'name': 'hood', 'parent': 'cloak'}, {'name': 'face', 'parent': 'head'}]
    skin = [{'name': 'hood', 'display': [mesh('hood', hw, hh, hv, hu, ht2, hwt, hpose)]},
            # the six faces are one slot with six pictures on the same mesh: swapping is free
            {'name': 'face', 'display': [mesh(n, fw, fh, fv, fu, ft, fwt, fpose) for n in faces]}]

    # ---- animations. The hood is always behind the head by about three frames.
    LAG = 0.42
    def hood_of(fn, scale=LAG, lag=0.10):
        return lambda p: scale * fn(p - lag)

    hb_fn = lambda p: 2.2 * S(T * p + 0.5) + 0.7 * S(T * 2 * p + 1.3)
    sway = lambda p: 1.1 * S(T * p + 0.9)
    idle = [
        {'name': 'head', 'rotateFrame': wave(150, 5, hb_fn),
         'translateFrame': wave(150, 5, lambda p: 1.5 * S(T * p + 1.1), 'x')},
        {'name': 'neck', 'translateFrame': wave(150, 5, lambda p: -1.6 * (0.5 - 0.5 * math.cos(T * 2 * p)), 'y')},
        {'name': 'crown', 'scaleFrame': wave(150, 5, lambda p: 1 + 0.018 * S(T * 2 * p - 0.6), 'y')},
        {'name': 'cloak', 'rotateFrame': wave(150, 5, hood_of(hb_fn))},
    ]
    # a key press: the head dips, squashes, comes back past the mark and settles
    tap = [
        {'name': 'head', 'rotateFrame': keys([(0, 0), (2, -1.0), (5, 3.4), (9, -1.6), (13, 0.5), (18, 0)]),
         'translateFrame': keys([(0, {'x': 0, 'y': 0}), (2, {'x': 0, 'y': -2}), (5, {'x': 0, 'y': 7}),
                                 (9, {'x': 0, 'y': -2.5}), (13, {'x': 0, 'y': 1}), (18, {'x': 0, 'y': 0})])},
        {'name': 'crown', 'scaleFrame': keys([(0, {'x': 1, 'y': 1}), (2, {'x': 0.99, 'y': 1.03}), (5, {'x': 1.07, 'y': 0.92}),
                                              (9, {'x': 0.97, 'y': 1.05}), (13, {'x': 1.01, 'y': 0.99}), (18, {'x': 1, 'y': 1})])},
        {'name': 'cloak', 'rotateFrame': keys([(0, 0), (4, -0.6), (8, 2.2), (13, -1.0), (18, 0)]),
         'translateFrame': keys([(0, {'x': 0, 'y': 0}), (4, {'x': 0, 'y': 1}), (8, {'x': 0, 'y': 3.4}), (13, {'x': 0, 'y': -1}), (18, {'x': 0, 'y': 0})])},
    ]
    laugh_fn = lambda p: -5.5 + 5.5 * math.cos(T * p) - 2.0 * S(T * 2 * p)
    laugh = [
        {'name': 'head', 'rotateFrame': wave(20, 2, laugh_fn),
         'translateFrame': wave(20, 2, lambda p: -3.5 + 3.5 * math.cos(T * p), 'y')},
        {'name': 'crown', 'scaleFrame': wave(20, 2, lambda p: 1 + 0.05 * S(T * p - 0.4), 'y')},
        {'name': 'cloak', 'rotateFrame': wave(20, 2, hood_of(laugh_fn, 0.5, 0.14))},
    ]
    gasp = [
        # a small lift only: any more and the head rises clear of the hood opening
        {'name': 'neck', 'translateFrame': keys([(0, {'x': 0, 'y': 0}), (3, {'x': 0, 'y': -4}), (8, {'x': 0, 'y': -3}), (16, {'x': 0, 'y': -0.5}), (24, {'x': 0, 'y': 0})])},
        {'name': 'crown', 'scaleFrame': keys([(0, {'x': 1, 'y': 1}), (3, {'x': 0.93, 'y': 1.09}), (8, {'x': 0.96, 'y': 1.06}), (16, {'x': 1.02, 'y': 0.98}), (24, {'x': 1, 'y': 1})])},
        {'name': 'head', 'rotateFrame': keys([(0, 0), (3, -3.0), (9, -2.2), (17, 0.6), (24, 0)])},
        {'name': 'cloak', 'rotateFrame': keys([(0, 0), (5, -1.6), (11, -1.0), (19, 0.4), (24, 0)]),
         'translateFrame': keys([(0, {'x': 0, 'y': 0}), (5, {'x': 0, 'y': -2.6}), (11, {'x': 0, 'y': -2}), (24, {'x': 0, 'y': 0})])},
    ]
    # a slow look to one side and back, so he isn't always facing straight on
    glance = [
        {'name': 'head', 'rotateFrame': keys([(0, 0), (14, 4.5), (46, 4.5), (62, 0), (90, 0)]),
         'translateFrame': keys([(0, {'x': 0, 'y': 0}), (14, {'x': 5, 'y': 0}), (46, {'x': 5, 'y': 0}), (62, {'x': 0, 'y': 0}), (90, {'x': 0, 'y': 0})])},
        {'name': 'cloak', 'rotateFrame': keys([(0, 0), (18, 1.9), (48, 1.9), (66, 0), (90, 0)])},
    ]
    anims = [
        {'duration': 150, 'playTimes': 0, 'name': 'idle', 'bone': idle},
        {'duration': 18, 'playTimes': 1, 'name': 'tap', 'bone': tap},
        {'duration': 20, 'playTimes': 0, 'name': 'laugh', 'bone': laugh},
        {'duration': 24, 'playTimes': 1, 'name': 'gasp', 'bone': gasp},
        {'duration': 90, 'playTimes': 1, 'name': 'glance', 'bone': glance},
    ]
    ske = {'frameRate': FPS, 'name': 'smudge_head', 'version': '5.5', 'compatibleVersion': '5.5', 'armature': [{
        'type': 'Armature', 'frameRate': FPS, 'name': 'head',
        'aabb': {'x': r2(A(hb[0], 0)[0]), 'y': r2(A(0, hb[1])[1]), 'width': hw, 'height': hh},
        'bone': bones, 'slot': slots, 'skin': [{'name': '', 'slot': skin}],
        'animation': anims, 'defaultActions': [{'gotoAndPlay': 'idle'}]}]}
    tex = {'name': 'smudge_head', 'imagePath': 'smudge_head_tex.png', 'width': W, 'height': H, 'SubTexture': sub}

    os.makedirs(OUT, exist_ok=True)
    json.dump(ske, open(os.path.join(OUT, 'smudge_head_ske.json'), 'w'), separators=(',', ':'))
    json.dump(tex, open(os.path.join(OUT, 'smudge_head_tex.json'), 'w'), separators=(',', ':'))
    atlas.save(os.path.join(OUT, 'smudge_head_tex.webp'), quality=92, method=6)
    atlas.save(os.path.join(OUT, 'smudge_head_tex.png'))
    print(f'head: {len(bones)} bones, face {fw}x{fh} x{len(faces)}, hood {hw}x{hh}, atlas {W}x{H}')
    print(f'  anims: ' + ', '.join(f"{a['name']}({a['duration']}f)" for a in anims))


build()
