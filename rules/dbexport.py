"""Write a Smudge pose out as real DragonBones files (5.5 format).

  python3 rules/dbexport.py            -> assets/v2/db/smudge_{ske.json,tex.json}, smudge_tex.webp

Reads the parts tools/puppet.py already cut (art2/puppet/<pose>_*.png) and the joints in
data/rig.json, and produces a skeleton the official DragonBones runtimes play, and that the
DragonBones editor can open for hand polish. What it adds over the simple rig:
  * a three-bone tail with a weighted mesh, so the tail bends along its length
  * eyelid and mouth bones
  * named animations: idle, stamp, cheer, blink, talk
"""
import json, math, os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art2', 'puppet')
OUT = os.path.join(ROOT, 'assets', 'v2', 'db')
FPS = 24
r2 = lambda v: round(v, 2)


def tail_axis(im, pivot):
    """Unit direction and length from the joint to the far tip of the tail picture."""
    a = im.getchannel('A').load(); w, h = im.size; best = (0, pivot)
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if a[x, y] > 60:
                d = math.hypot(x - pivot[0], y - pivot[1])
                if d > best[0]: best = (d, (x, y))
    L, tip = best
    return ((tip[0] - pivot[0]) / L, (tip[1] - pivot[1]) / L), L


def mat(deg, x, y):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return [r2(c * 1000) / 1000, r2(s * 1000) / 1000, r2(-s * 1000) / 1000, r2(c * 1000) / 1000, r2(x), r2(y)]


def wave(dur, step, fn, key='rotate'):
    """Sampled looping timeline: fn(phase 0..1) -> value."""
    fr = [{'duration': step, 'tweenEasing': 0, key: r2(fn(f / dur))} for f in range(0, dur, step)]
    fr.append({'duration': 0, key: r2(fn(0))})
    return fr


EASE = [0.4, 0, 0.6, 1]
def keys(seq, key='rotate'):
    """[(frame, value), ...] -> eased keyframes. value may be a dict for translate/scale."""
    out = []
    for i, (f, v) in enumerate(seq):
        d = seq[i + 1][0] - f if i + 1 < len(seq) else 0
        k = {'duration': d}
        if d: k['curve'] = EASE
        if isinstance(v, dict): k.update(v)
        else: k[key] = v
        out.append(k)
    return out


def build(pose='stamp', name='smudge'):
    rig = json.load(open(os.path.join(ROOT, 'data', 'rig.json')))[pose]
    foot = rig['foot']; P = {p['name']: p for p in rig['parts']}
    img = {n: Image.open(os.path.join(SRC, f'{pose}_{n}.png')).convert('RGBA') for n in ['base'] + list(P)}
    P['base'] = {'offset': [0, 0]}
    DBX = rig.get('db', {})
    for n, v in DBX.items(): P[n] = v; img[n] = Image.open(os.path.join(SRC, f'{pose}_{n}.png')).convert('RGBA')
    if DBX: del img['arm']
    A = lambda pt: (pt[0] - foot[0], pt[1] - foot[1])           # picture point -> armature space

    # ---- face shapes (drawn here so they ride in the same atlas)
    fur = tuple(rig['face']['fur']); eyes = rig['face']['eyes']; mouth = rig['face']['mouth']
    INK = (28, 20, 32, 255)
    def ellipse(w, h, col, lash=False):
        s = 4; e = Image.new('RGBA', (w * s, h * s), (0, 0, 0, 0)); d = ImageDraw.Draw(e)
        if lash:        # closed eye: fur-coloured lid with a dark lash line along the bottom
            d.ellipse([0, 0, w * s - 1, h * s - 1], fill=col + (255,))
            d.arc([s, -h * s, w * s - 1 - s, h * s - 1 - s], 20, 160, fill=INK, width=3 * s)
        else: d.ellipse([0, 0, w * s - 1, h * s - 1], fill=col + (255,), outline=INK, width=2 * s)
        return e.resize((w, h), Image.LANCZOS)
    for i, (cx, cy, rx, ry) in enumerate(eyes): img[f'lid{i}'] = ellipse(int(rx * 2.5), int(ry * 2.6), fur, True)
    img['mouth'] = ellipse(mouth[2] * 2 + 2, mouth[3] * 2 + 2, (90, 31, 44))

    # ---- atlas (simple shelves, 2px gutters)
    order = sorted(img, key=lambda n: -img[n].size[1]); W = 1024; x = y = 2; rowh = 0; sub = []
    for n in order:
        w, h = img[n].size
        if x + w + 2 > W: x = 2; y += rowh + 2; rowh = 0
        sub.append({'name': n, 'x': x, 'y': y, 'width': w, 'height': h}); x += w + 2; rowh = max(rowh, h)
    H = 1
    while H < y + rowh + 2: H *= 2
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for s in sub: atlas.paste(img[s['name']], (s['x'], s['y']))

    # ---- bones
    body = (0, -90)
    bones = [{'name': 'root'}, {'name': 'body', 'parent': 'root', 'transform': {'x': body[0], 'y': body[1]}}]
    def joint(n, parent='body', ppos=body, length=60):
        px, py = A(P[n]['pivot']); bones.append({'name': n, 'parent': parent, 'length': length, 'transform': {'x': r2(px - ppos[0]), 'y': r2(py - ppos[1])}})
        return (px, py)
    hp = joint('head'); ap = joint('arm')
    if DBX:
        wp = A(DBX['hand']['pivot']); bones.append({'name': 'hand', 'parent': 'arm', 'length': 40, 'transform': {'x': r2(wp[0] - ap[0]), 'y': r2(wp[1] - ap[1])}})
    # tail: three bones in a chain along the tail
    tp = A(P['tail']['pivot']); tl = (P['tail']['pivot'][0] - P['tail']['offset'][0], P['tail']['pivot'][1] - P['tail']['offset'][1])
    (dx, dy), L = tail_axis(img['tail'], tl); ang = math.degrees(math.atan2(dy, dx)); seg = L / 3
    bones.append({'name': 'tail1', 'parent': 'body', 'length': r2(seg), 'transform': {'x': r2(tp[0] - body[0]), 'y': r2(tp[1] - body[1]), 'skX': r2(ang), 'skY': r2(ang)}})
    bones.append({'name': 'tail2', 'parent': 'tail1', 'length': r2(seg), 'transform': {'x': r2(seg)}})
    bones.append({'name': 'tail3', 'parent': 'tail2', 'length': r2(seg), 'transform': {'x': r2(seg)}})
    idx = {b['name']: i for i, b in enumerate(bones)}
    for i, (cx, cy, rx, ry) in enumerate(eyes):
        ex, ey = A((cx, cy - int(ry * 2.6) / 2)); bones.append({'name': f'lid{i}', 'parent': 'head', 'transform': {'x': r2(ex - hp[0]), 'y': r2(ey - hp[1]), 'scY': 0.01}})
    mx, my = A((mouth[0], mouth[1])); bones.append({'name': 'mouth', 'parent': 'head', 'transform': {'x': r2(mx - hp[0]), 'y': r2(my - hp[1]), 'scY': 0.01}})

    # ---- tail mesh, weighted across the three tail bones
    tw, th = img['tail'].size; NX, NY = 7, 7; verts = []; uvs = []; weights = []; tris = []
    to = A(P['tail']['offset'])
    for j in range(NY):
        for i in range(NX):
            px, py = tw * i / (NX - 1), th * j / (NY - 1)
            verts += [r2(to[0] + px), r2(to[1] + py)]; uvs += [round(px / tw, 4), round(py / th, 4)]
            u = ((px - tl[0]) * dx + (py - tl[1]) * dy) / L * 3 - 0.5           # 0 = middle of bone 1, 2 = middle of bone 3
            u = max(0.0, min(2.0, u)); k = min(1, int(u)); f = u - k
            f = f * f * (3 - 2 * f)
            ws = [(idx[f'tail{k + 1}'], 1 - f), (idx[f'tail{k + 2}'], f)]
            ws = [(b, round(w, 3)) for b, w in ws if w > 0.001]
            weights += [len(ws)] + [v for bw in ws for v in bw]
    for j in range(NY - 1):
        for i in range(NX - 1):
            a = j * NX + i; tris += [a, a + 1, a + NX, a + 1, a + NX + 1, a + NX]
    bp = []
    for k in range(3): bp += [idx[f'tail{k + 1}']] + mat(ang, tp[0] + dx * seg * k, tp[1] + dy * seg * k)
    tail_mesh = {'type': 'mesh', 'name': 'tail', 'width': tw, 'height': th, 'vertices': verts, 'uvs': uvs, 'triangles': tris,
                 'weights': weights, 'slotPose': [1, 0, 0, 1, 0, 0], 'bonePose': bp}

    # ---- slots (draw order) and skin
    def image(n, bonepos):
        o = P[n]['offset']; w, h = img[n].size; c = A((o[0] + w / 2, o[1] + h / 2))
        return {'name': n, 'transform': {'x': r2(c[0] - bonepos[0]), 'y': r2(c[1] - bonepos[1])}}
    slots = [{'name': 'tail', 'parent': 'root'}, {'name': 'base', 'parent': 'body'}, {'name': 'arm', 'parent': 'arm'}] + ([{'name': 'hand', 'parent': 'hand'}] if DBX else []) + ([{'name': 'over', 'parent': 'body'}] if 'over' in P else []) + [{'name': 'head', 'parent': 'head'}]
    skin = [{'name': 'tail', 'display': [tail_mesh]}, {'name': 'base', 'display': [image('base', body)]},
            {'name': 'arm', 'display': [image('forearm' if DBX else 'arm', ap)]}] + ([{'name': 'hand', 'display': [image('hand', wp)]}] if DBX else []) + ([{'name': 'over', 'display': [image('over', body)]}] if 'over' in P else []) + [{'name': 'head', 'display': [image('head', hp)]}]
    for n in [f'lid{i}' for i in range(len(eyes))] + ['mouth']:
        d = {'name': n}
        if n != 'mouth': d['transform'] = {'y': r2(img[n].size[1] / 2)}
        slots.append({'name': n, 'parent': n}); skin.append({'name': n, 'display': [d]})

    # ---- animations
    S = math.sin; T = 2 * math.pi
    idle = {'duration': 96, 'playTimes': 0, 'name': 'idle', 'bone': [
        {'name': 'tail1', 'rotateFrame': wave(96, 6, lambda p: 4 * S(T * p))},
        {'name': 'tail2', 'rotateFrame': wave(96, 6, lambda p: 7 * S(T * p - 0.9) + 2 * S(T * 2 * p))},
        {'name': 'tail3', 'rotateFrame': wave(96, 6, lambda p: 11 * S(T * p - 1.8) + 3 * S(T * 2 * p - 0.6))},
        {'name': 'head', 'rotateFrame': wave(96, 8, lambda p: 1.6 * S(T * p + 0.5))},
    ]}
    stamp = {'duration': 14, 'playTimes': 1, 'name': 'stamp', 'bone': [
        {'name': 'arm', 'rotateFrame': keys([(0, 0), (3, -12), (7, 97), (9, 97), (14, 0)]),
         'scaleFrame': keys([(0, {'x': 1, 'y': 1}), (3, {'x': 0.96, 'y': 1}), (7, {'x': 1.16, 'y': 1}), (9, {'x': 1.16, 'y': 1}), (14, {'x': 1, 'y': 1})]),
         'translateFrame': keys([(0, {'x': 0, 'y': 0}), (7, {'x': -4, 'y': 8}), (9, {'x': -4, 'y': 8}), (14, {'x': 0, 'y': 0})])},
        {'name': 'hand', 'rotateFrame': keys([(0, 0), (3, 8), (7, -92), (9, -92), (14, 0)])},
        {'name': 'head', 'rotateFrame': keys([(0, 0), (3, -2), (6, 5), (14, 0)])},
        {'name': 'tail3', 'rotateFrame': keys([(0, 0), (6, -16), (10, 8), (14, 0)])},
        {'name': 'tail2', 'rotateFrame': keys([(0, 0), (5, -9), (9, 4), (14, 0)])},
    ]}
    cheer = {'duration': 12, 'playTimes': 0, 'name': 'cheer', 'bone': [
        {'name': 'tail1', 'rotateFrame': wave(12, 2, lambda p: 9 * S(T * p))},
        {'name': 'tail2', 'rotateFrame': wave(12, 2, lambda p: 16 * S(T * p - 1.0))},
        {'name': 'tail3', 'rotateFrame': wave(12, 2, lambda p: 24 * S(T * p - 2.0))},
        {'name': 'head', 'rotateFrame': wave(12, 2, lambda p: 3 * S(T * p))},
    ] + [{'name': f'lid{i}', 'scaleFrame': [{'duration': 12, 'x': 1, 'y': 100}, {'duration': 0, 'x': 1, 'y': 100}]} for i in range(len(eyes))]}
    blink = {'duration': 5, 'playTimes': 1, 'name': 'blink', 'bone': [
        {'name': f'lid{i}', 'scaleFrame': [{'duration': 1, 'x': 1, 'y': 100}, {'duration': 4, 'tweenEasing': 0, 'x': 1, 'y': 100}, {'duration': 0, 'x': 1, 'y': 1}]} for i in range(len(eyes))]}
    talk = {'duration': 16, 'playTimes': 0, 'name': 'talk', 'bone': [
        {'name': 'mouth', 'scaleFrame': [{'duration': 2, 'tweenEasing': 0, 'x': 1, 'y': v} for v in (35, 85, 50, 100, 40, 70, 45, 90)] + [{'duration': 0, 'x': 1, 'y': 20}]}]}

    ske = {'frameRate': FPS, 'name': name, 'version': '5.5', 'compatibleVersion': '5.5', 'armature': [{
        'type': 'Armature', 'frameRate': FPS, 'name': pose,
        'aabb': {'x': -foot[0], 'y': -foot[1], 'width': rig['size'][0], 'height': rig['size'][1]},
        'bone': bones, 'slot': slots, 'skin': [{'name': '', 'slot': skin}],
        'animation': [idle, stamp, cheer, blink, talk], 'defaultActions': [{'gotoAndPlay': 'idle'}]}]}
    tex = {'name': name, 'imagePath': f'{name}_tex.png', 'width': W, 'height': H, 'SubTexture': sub}

    os.makedirs(OUT, exist_ok=True)
    json.dump(ske, open(os.path.join(OUT, f'{name}_ske.json'), 'w'), separators=(',', ':'))
    json.dump(tex, open(os.path.join(OUT, f'{name}_tex.json'), 'w'), separators=(',', ':'))
    atlas.save(os.path.join(OUT, f'{name}_tex.webp'), quality=92, method=6)
    print(f'{name}: {len(bones)} bones, {len(slots)} slots, tail {ang:.0f} deg x {L:.0f}px, atlas {W}x{H}')


if __name__ == '__main__':
    build(*sys.argv[1:])
