"""Write a Smudge pose out as real DragonBones files (5.5 format).

  python3 rules/dbexport.py [pose ...]   -> assets/v2/db/smudge_<pose>_{ske.json,tex.json,tex.webp}

Reads the parts tools/puppet.py already cut (art2/puppet/<pose>_*.png) and the joints in
data/rig.json, and produces a skeleton the official DragonBones runtimes play, and that the
DragonBones editor can open for hand polish. What it adds over the simple rig:
  * a three-bone tail with a weighted mesh, so the tail bends along its length
  * eyelid and mouth bones
  * named animations, the same names on every pose: idle, act, cheer, blink, talk
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
    fr = [{'duration': step, 'tweenEasing': 0, key: r2(fn(f / dur))} for f in range(0, dur, step) if f + step <= dur]
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


def grid(w, h, origin, NX, NY, weigh):
    """A picture as a soft mesh: weigh(px, py) -> [(bone index, weight), ...] for each grid point."""
    verts = []; uvs = []; weights = []; tris = []
    for j in range(NY):
        for i in range(NX):
            px, py = w * i / (NX - 1), h * j / (NY - 1)
            verts += [r2(origin[0] + px), r2(origin[1] + py)]; uvs += [round(px / w, 4), round(py / h, 4)]
            ws = [(b, round(v, 3)) for b, v in weigh(px, py) if v > 0.001]
            weights += [len(ws)] + [v for bw in ws for v in bw]
    for j in range(NY - 1):
        for i in range(NX - 1):
            a = j * NX + i; tris += [a, a + 1, a + NX, a + 1, a + NX + 1, a + NX]
    return verts, uvs, tris, weights


# Soft secondary motion on the pin-up heroes: (centre x, centre y, radius) of the bust in the hero's picture.
CHEST = {'cleocatra': (228, 240, 28), 'astrid': (205, 215, 30), 'bella': (140, 222, 32), 'lola': (272, 205, 28), 'troffea': (206, 240, 24)}


def build(pose='stamp', hero=False):
    """pose: one of Smudge's poses, or with hero=True a hero id (parts in art2/hpuppet, rig key h_<id>)."""
    name = f'hero_{pose}' if hero else f'smudge_{pose}'
    SRC = os.path.join(ROOT, 'art2', 'hpuppet') if hero else globals()['SRC']; pre = f'h_{pose}' if hero else pose
    rig = json.load(open(os.path.join(ROOT, 'data', 'rig.json')))[pre]
    foot = rig['foot']; parts = rig['parts']; P = {p['name']: dict(p) for p in parts}
    img = {n: Image.open(os.path.join(SRC, f'{pre}_{n}.png')).convert('RGBA') for n in ['base'] + list(P)}
    P['base'] = {'offset': [0, 0]}
    DBX = rig.get('db', {})                      # stamp pose: the arm in two pieces, forearm + fist
    for n, v in DBX.items(): P[n] = v; img[n] = Image.open(os.path.join(SRC, f'{pre}_{n}.png')).convert('RGBA')
    if DBX: del img['arm']
    A = lambda pt: (pt[0] - foot[0], pt[1] - foot[1])           # picture point -> armature space

    # ---- face shapes (drawn here so they ride in the same atlas)
    face = rig.get('face') or {'fur': [0, 0, 0], 'eyes': [], 'mouth': [0, 0, 0, 0]}; has_tail = 'tail' in P
    fur = tuple(face['fur']); eyes = face['eyes']; mouth = face['mouth']
    INK = (28, 20, 32, 255)
    def ellipse(w, h, col, lash=False):
        s = 4; e = Image.new('RGBA', (w * s, h * s), (0, 0, 0, 0)); d = ImageDraw.Draw(e)
        if lash:        # closed eye: fur-coloured lid with a dark lash line along the bottom
            d.ellipse([0, 0, w * s - 1, h * s - 1], fill=col + (255,))
            d.arc([s, -h * s, w * s - 1 - s, h * s - 1 - s], 20, 160, fill=INK, width=3 * s)
        else: d.ellipse([0, 0, w * s - 1, h * s - 1], fill=col + (255,), outline=INK, width=2 * s)
        return e.resize((w, h), Image.LANCZOS)
    for i, (cx, cy, rx, ry) in enumerate(eyes): img[f'lid{i}'] = ellipse(int(rx * 2.5), int(ry * 2.6), fur, True)
    if mouth[2]: img['mouth'] = ellipse(mouth[2] * 2 + 2, mouth[3] * 2 + 2, (90, 31, 44))

    # ---- atlas (simple shelves, 2px gutters)
    order = sorted(img, key=lambda n: -img[n].size[1]); W = 1024; x = y = 2; rowh = 0; sub = []
    while max(i.size[0] for i in img.values()) + 4 > W: W *= 2
    for n in order:
        w, h = img[n].size
        if x + w + 2 > W: x = 2; y += rowh + 2; rowh = 0
        sub.append({'name': n, 'x': x, 'y': y, 'width': w, 'height': h}); x += w + 2; rowh = max(rowh, h)
    H = 1
    while H < y + rowh + 2: H *= 2
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for s in sub: atlas.paste(img[s['name']], (s['x'], s['y']))

    # ---- bones: the shared set (root, body, head, tail1-3, lids, mouth) plus one per extra moving part
    body = (0, -round(rig['size'][1] * 0.3)) if hero else (0, -90); pos = {}
    bones = [{'name': 'root'}, {'name': 'body', 'parent': 'root', 'transform': {'x': body[0], 'y': body[1]}}]
    def joint(n, parent='body', ppos=body, length=60, pivot=None):
        px, py = A(pivot or P[n]['pivot']); bones.append({'name': n, 'parent': parent, 'length': length, 'transform': {'x': r2(px - ppos[0]), 'y': r2(py - ppos[1])}})
        pos[n] = (px, py); return (px, py)
    extras = [p['name'] for p in parts if p['name'] not in ('tail', 'head', 'over')]
    hp = joint('head')
    for n in extras: joint(n)
    if DBX: joint('hand', 'arm', pos['arm'], 40, DBX['hand']['pivot'])
    if has_tail:
        # tail: three bones in a chain along the tail
        tp = A(P['tail']['pivot']); tl = (P['tail']['pivot'][0] - P['tail']['offset'][0], P['tail']['pivot'][1] - P['tail']['offset'][1])
        (dx, dy), L = tail_axis(img['tail'], tl); ang = math.degrees(math.atan2(dy, dx)); seg = L / 3
        bones.append({'name': 'tail1', 'parent': 'body', 'length': r2(seg), 'transform': {'x': r2(tp[0] - body[0]), 'y': r2(tp[1] - body[1]), 'skX': r2(ang), 'skY': r2(ang)}})
        bones.append({'name': 'tail2', 'parent': 'tail1', 'length': r2(seg), 'transform': {'x': r2(seg)}})
        bones.append({'name': 'tail3', 'parent': 'tail2', 'length': r2(seg), 'transform': {'x': r2(seg)}})
    chest = CHEST.get(pose) if hero else None
    if chest:
        cp = A(chest[:2]); bones.append({'name': 'chest', 'parent': 'body', 'transform': {'x': r2(cp[0] - body[0]), 'y': r2(cp[1] - body[1])}})
    idx = {b['name']: i for i, b in enumerate(bones)}
    for i, (cx, cy, rx, ry) in enumerate(eyes):
        ex, ey = A((cx, cy - int(ry * 2.6) / 2)); bones.append({'name': f'lid{i}', 'parent': 'head', 'transform': {'x': r2(ex - hp[0]), 'y': r2(ey - hp[1]), 'scY': 0.01}})
    if mouth[2]:
        mx, my = A((mouth[0], mouth[1])); bones.append({'name': 'mouth', 'parent': 'head', 'transform': {'x': r2(mx - hp[0]), 'y': r2(my - hp[1]), 'scY': 0.01}})

    if has_tail:
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

    # ---- slots in draw order: behind parts, body, front parts, face
    def image(n, bonepos, tex=None):
        o = P[tex or n]['offset']; w, h = img[tex or n].size; c = A((o[0] + w / 2, o[1] + h / 2))
        return {'name': tex or n, 'transform': {'x': r2(c[0] - bonepos[0]), 'y': r2(c[1] - bonepos[1])}}
    slots = []; skin = []
    def add(n, bone, display): slots.append({'name': n, 'parent': bone}); skin.append({'name': n, 'display': [display]})
    def part(p):
        n = p['name']
        if n == 'tail': add('tail', 'root', tail_mesh)
        elif n == 'over': add('over', 'body', image('over', body))
        elif n == 'head': add('head', 'head', image('head', hp))
        elif n == 'arm' and DBX: add('arm', 'arm', image('arm', pos['arm'], 'forearm')); add('hand', 'hand', image('hand', pos['hand']))
        else: add(n, n, image(n, pos[n]))
    for p in parts:
        if p['mode'] == 'behind': part(p)
    if chest:       # the body picture becomes a soft mesh so the bust can lag and settle; everything else stays rigid
        bw_, bh_ = img['base'].size
        def wchest(px, py):
            v = math.exp(-(((px - chest[0]) / chest[2]) ** 2 + ((py - chest[1]) / (chest[2] * 0.8)) ** 2) / 2); v = max(0.0, (v - 0.12) / 0.88)
            return [(idx['body'], 1 - v), (idx['chest'], v)]
        NX = max(8, bw_ // 22); NY = max(10, bh_ // 22)
        v_, u_, t_, w_ = grid(bw_, bh_, A((0, 0)), NX, NY, wchest)
        add('base', 'root', {'type': 'mesh', 'name': 'base', 'width': bw_, 'height': bh_, 'vertices': v_, 'uvs': u_, 'triangles': t_, 'weights': w_,
                             'slotPose': [1, 0, 0, 1, 0, 0], 'bonePose': [idx['body'], 1, 0, 0, 1, body[0], body[1], idx['chest'], 1, 0, 0, 1, r2(cp[0]), r2(cp[1])]})
    else: add('base', 'body', image('base', body))
    for p in parts:
        if p['mode'] != 'behind': part(p)
    for i in range(len(eyes)): add(f'lid{i}', f'lid{i}', {'name': f'lid{i}', 'transform': {'y': r2(img[f'lid{i}'].size[1] / 2)}})
    if mouth[2]: add('mouth', 'mouth', {'name': 'mouth'})

    # ---- animations. Every pose has: idle, act, cheer, blink, talk
    S = math.sin; T = 2 * math.pi
    idle = [
        {'name': 'tail1', 'rotateFrame': wave(96, 6, lambda p: 4 * S(T * p))},
        {'name': 'tail2', 'rotateFrame': wave(96, 6, lambda p: 7 * S(T * p - 0.9) + 2 * S(T * 2 * p))},
        {'name': 'tail3', 'rotateFrame': wave(96, 6, lambda p: 11 * S(T * p - 1.8) + 3 * S(T * 2 * p - 0.6))},
        {'name': 'head', 'rotateFrame': wave(96, 8, lambda p: 1.6 * S(T * p + 0.5))},
    ]
    if hero:
        act = (14, [{'name': 'head', 'rotateFrame': keys([(0, 0), (3, -2.5), (7, 3.5), (14, 0)])},
                    {'name': 'tail2', 'rotateFrame': keys([(0, 0), (5, 9), (10, -4), (14, 0)])},
                    {'name': 'tail3', 'rotateFrame': keys([(0, 0), (6, 16), (11, -7), (14, 0)])}])
    elif pose == 'stamp':
        act = (14, [
            {'name': 'arm', 'rotateFrame': keys([(0, 0), (3, -12), (7, 97), (9, 97), (14, 0)]),
             'scaleFrame': keys([(0, {'x': 1, 'y': 1}), (3, {'x': 0.96, 'y': 1}), (7, {'x': 1.16, 'y': 1}), (9, {'x': 1.16, 'y': 1}), (14, {'x': 1, 'y': 1})]),
             'translateFrame': keys([(0, {'x': 0, 'y': 0}), (7, {'x': -4, 'y': 8}), (9, {'x': -4, 'y': 8}), (14, {'x': 0, 'y': 0})])},
            {'name': 'hand', 'rotateFrame': keys([(0, 0), (3, 8), (7, -92), (9, -92), (14, 0)])},
            {'name': 'head', 'rotateFrame': keys([(0, 0), (3, -2), (6, 5), (14, 0)])},
            {'name': 'tail3', 'rotateFrame': keys([(0, 0), (6, -16), (10, 8), (14, 0)])},
            {'name': 'tail2', 'rotateFrame': keys([(0, 0), (5, -9), (9, 4), (14, 0)])}])
    elif pose == 'fish':
        idle += [{'name': 'feet', 'rotateFrame': wave(96, 6, lambda p: 5 * S(T * 2 * p))},
                 {'name': 'rod', 'rotateFrame': wave(96, 8, lambda p: 1.2 * S(T * p + 1))}]
        act = (22, [      # a tug on the line: rod dips, then he hauls back
            {'name': 'rod', 'rotateFrame': keys([(0, 0), (4, 7), (9, -11), (13, -8), (22, 0)])},
            {'name': 'head', 'rotateFrame': keys([(0, 0), (4, 4), (9, -5), (22, 0)])},
            {'name': 'feet', 'rotateFrame': keys([(0, 0), (5, -9), (10, 10), (16, -4), (22, 0)])},
            {'name': 'tail2', 'rotateFrame': keys([(0, 0), (8, 10), (15, -5), (22, 0)])},
            {'name': 'tail3', 'rotateFrame': keys([(0, 0), (9, 18), (16, -8), (22, 0)])}])
    elif pose == 'pick':
        idle += [{'name': 'hand_a', 'rotateFrame': wave(24, 2, lambda p: 1.6 * S(T * 2 * p) + 0.8 * S(T * 5 * p))},
                 {'name': 'hand_b', 'rotateFrame': wave(24, 2, lambda p: -1.3 * S(T * 2 * p + 1) + 0.7 * S(T * 3 * p))}]
        act = (16, [      # the lock gives: both picks twist, head cocks
            {'name': 'hand_a', 'rotateFrame': keys([(0, 0), (3, -5), (6, 4), (9, -3), (16, 0)])},
            {'name': 'hand_b', 'rotateFrame': keys([(0, 0), (3, 4), (6, -5), (9, 3), (16, 0)])},
            {'name': 'head', 'rotateFrame': keys([(0, 0), (4, 6), (10, 6), (16, 0)])},
            {'name': 'tail3', 'rotateFrame': keys([(0, 0), (6, 20), (11, -8), (16, 0)])}])
    elif pose == 'dig':
        idle += [{'name': 'shovel', 'rotateFrame': wave(96, 8, lambda p: 1.2 * S(T * p))}]
        act = (20, [      # drive the blade down, then fling
            {'name': 'shovel', 'rotateFrame': keys([(0, 0), (4, -5), (8, 11), (11, 11), (15, -8), (20, 0)]),
             'translateFrame': keys([(0, {'x': 0, 'y': 0}), (8, {'x': 5, 'y': 9}), (11, {'x': 5, 'y': 9}), (15, {'x': -4, 'y': -6}), (20, {'x': 0, 'y': 0})])},
            {'name': 'head', 'rotateFrame': keys([(0, 0), (8, 5), (15, -4), (20, 0)])},
            {'name': 'tail2', 'rotateFrame': keys([(0, 0), (8, -8), (15, 8), (20, 0)])},
            {'name': 'tail3', 'rotateFrame': keys([(0, 0), (9, -14), (16, 14), (20, 0)])}])
    else: act = (12, [{'name': 'head', 'rotateFrame': keys([(0, 0), (5, 5), (12, 0)])}])
    bounce = None
    if chest:
        idle.append({'name': 'chest', 'translateFrame': wave(96, 6, lambda p: 0.7 * S(T * 2 * p - 0.9), 'y')})
        act[1].append({'name': 'chest', 'translateFrame': keys([(0, {'x': 0, 'y': 0}), (3, {'x': 0, 'y': -1.6}), (6, {'x': 0, 'y': 3.2}), (9, {'x': 0, 'y': -1.8}), (11, {'x': 0, 'y': 0.9}), (14, {'x': 0, 'y': 0})])})
        bounce = {'name': 'chest', 'translateFrame': wave(12, 2, lambda p: 2.4 * S(T * p - 1.1), 'y')}
    names = {b['name'] for b in bones}
    drop = lambda bl: [b for b in bl if b['name'] in names]            # heroes without a tail simply skip the tail lines
    idle = drop(idle); act = (act[0], drop(act[1]))
    lids = [f'lid{i}' for i in range(len(eyes))]
    anims = [
        {'duration': 96, 'playTimes': 0, 'name': 'idle', 'bone': idle},
        {'duration': act[0], 'playTimes': 1, 'name': 'act', 'bone': act[1]},
        {'duration': 12, 'playTimes': 0, 'name': 'cheer', 'bone': drop([
            {'name': 'tail1', 'rotateFrame': wave(12, 2, lambda p: 9 * S(T * p))},
            {'name': 'tail2', 'rotateFrame': wave(12, 2, lambda p: 16 * S(T * p - 1.0))},
            {'name': 'tail3', 'rotateFrame': wave(12, 2, lambda p: 24 * S(T * p - 2.0))},
            {'name': 'head', 'rotateFrame': wave(12, 2, lambda p: 3 * S(T * p))},
        ] + ([bounce] if bounce else [])) + [{'name': n, 'scaleFrame': [{'duration': 12, 'x': 1, 'y': 100}, {'duration': 0, 'x': 1, 'y': 100}]} for n in lids]},
        {'duration': 5, 'playTimes': 1, 'name': 'blink', 'bone': [
            {'name': n, 'scaleFrame': [{'duration': 1, 'x': 1, 'y': 100}, {'duration': 4, 'tweenEasing': 0, 'x': 1, 'y': 100}, {'duration': 0, 'x': 1, 'y': 1}]} for n in lids]},
    ]
    if mouth[2]: anims.append({'duration': 16, 'playTimes': 0, 'name': 'talk', 'bone': [
        {'name': 'mouth', 'scaleFrame': [{'duration': 2, 'tweenEasing': 0, 'x': 1, 'y': v} for v in (35, 85, 50, 100, 40, 70, 45, 90)] + [{'duration': 0, 'x': 1, 'y': 35}]}]})
    for an in anims:
        for b in an['bone']: assert b['name'] in names, (pose, an['name'], b['name'])

    ske = {'frameRate': FPS, 'name': name, 'version': '5.5', 'compatibleVersion': '5.5', 'armature': [{
        'type': 'Armature', 'frameRate': FPS, 'name': pose,
        'aabb': {'x': -foot[0], 'y': -foot[1], 'width': rig['size'][0], 'height': rig['size'][1]},
        'bone': bones, 'slot': slots, 'skin': [{'name': '', 'slot': skin}],
        'animation': anims, 'defaultActions': [{'gotoAndPlay': 'idle'}]}]}
    tex = {'name': name, 'imagePath': f'{name}_tex.png', 'width': W, 'height': H, 'SubTexture': sub}

    os.makedirs(OUT, exist_ok=True)
    json.dump(ske, open(os.path.join(OUT, f'{name}_ske.json'), 'w'), separators=(',', ':'))
    json.dump(tex, open(os.path.join(OUT, f'{name}_tex.json'), 'w'), separators=(',', ':'))
    atlas.save(os.path.join(OUT, f'{name}_tex.webp'), quality=92, method=6)
    print(f'{name}: {len(bones)} bones, {len(slots)} slots, ' + (f'tail {ang:.0f} deg x {L:.0f}px, ' if has_tail else 'no tail, ') + f'atlas {W}x{H}')


def build_sleep():
    """The sleeping pose. The whole picture is one soft mesh with bones under the back, the snout and
    the front paws, so the back rises as he breathes and he twitches now and then; the tail lies in
    front on its own three bones; three Zs ride up and down one after another."""
    pose = 'sleep'; name = 'smudge_sleep'
    rig = json.load(open(os.path.join(ROOT, 'data', 'rig.json')))[pose]; foot = rig['foot']; D = rig['db']
    A = lambda pt: (pt[0] - foot[0], pt[1] - foot[1]); TP = rig['parts'][0]
    img = {'base': Image.open(os.path.join(SRC, 'sleep_base.png')).convert('RGBA'), 'tail': Image.open(os.path.join(SRC, 'sleep_tail.png')).convert('RGBA')}
    def zed(sz):
        s = 4; w = sz * s; e = Image.new('RGBA', (w + 8 * s, w + 8 * s), (0, 0, 0, 0)); d = ImageDraw.Draw(e); o = 4 * s; t = w * 0.24
        pts = [(o, o), (o + w, o), (o + w, o + t * 0.9), (o + t * 1.25, o + w - t), (o + w, o + w - t), (o + w, o + w), (o, o + w), (o, o + w - t * 0.9), (o + w - t * 1.25, o + t), (o, o + t)]
        d.polygon(pts, fill=(236, 240, 255, 255)); d.line(pts + [pts[0]], fill=(16, 22, 42, 255), width=2 * s, joint='curve')
        return e.resize((sz + 8, sz + 8), Image.LANCZOS)
    ZS = [16, 22, 30]
    for i, sz in enumerate(ZS): img[f'z{i}'] = zed(sz)

    order = sorted(img, key=lambda n: -img[n].size[1]); W = 1024; x = y = 2; rowh = 0; sub = []
    for n in order:
        w, h = img[n].size
        if x + w + 2 > W: x = 2; y += rowh + 2; rowh = 0
        sub.append({'name': n, 'x': x, 'y': y, 'width': w, 'height': h}); x += w + 2; rowh = max(rowh, h)
    H = 1
    while H < y + rowh + 2: H *= 2
    atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for s in sub: atlas.paste(img[s['name']], (s['x'], s['y']))

    body = (0, -90)
    bones = [{'name': 'root'}, {'name': 'body', 'parent': 'root', 'transform': {'x': 0, 'y': -90}}]
    P = {}
    for n in ('breath', 'nose', 'paw'):
        P[n] = A(D[n]); bones.append({'name': n, 'parent': 'body', 'transform': {'x': r2(P[n][0] - body[0]), 'y': r2(P[n][1] - body[1])}})
    tp = A(TP['pivot']); tl = (TP['pivot'][0] - TP['offset'][0], TP['pivot'][1] - TP['offset'][1])
    (dx, dy), L = tail_axis(img['tail'], tl); ang = math.degrees(math.atan2(dy, dx)); seg = L / 3
    bones.append({'name': 'tail1', 'parent': 'body', 'length': r2(seg), 'transform': {'x': r2(tp[0] - body[0]), 'y': r2(tp[1] - body[1]), 'skX': r2(ang), 'skY': r2(ang)}})
    bones.append({'name': 'tail2', 'parent': 'tail1', 'length': r2(seg), 'transform': {'x': r2(seg)}})
    bones.append({'name': 'tail3', 'parent': 'tail2', 'length': r2(seg), 'transform': {'x': r2(seg)}})
    for i, zp in enumerate(D['zs']):
        zx, zy = A(zp); bones.append({'name': f'z{i}', 'parent': 'root', 'transform': {'x': r2(zx), 'y': r2(zy)}})
    idx = {b['name']: i for i, b in enumerate(bones)}

    # body picture: weights fall off smoothly from each of the three little bones
    bw, bh = img['base'].size
    def wbody(px, py):
        def near(c, rx, ry, floor=0.0):
            v = math.exp(-(((px - c[0]) / rx) ** 2 + ((py - c[1]) / ry) ** 2) / 2); return max(0.0, (v - floor) / (1 - floor))
        b = near(D['breath'], 95, 80, 0.15); n = near(D['nose'], 20, 18, 0.2); p = near(D['paw'], 26, 16, 0.2)
        t = b + n + p
        if t > 1: b, n, p = b / t, n / t, p / t
        return [(idx['body'], 1 - (b + n + p)), (idx['breath'], b), (idx['nose'], n), (idx['paw'], p)]
    v, u, t, w = grid(bw, bh, A((0, 0)), 20, 14, wbody)
    bp = [idx['body'], 1, 0, 0, 1, body[0], body[1]]
    for n in ('breath', 'nose', 'paw'): bp += [idx[n], 1, 0, 0, 1, r2(P[n][0]), r2(P[n][1])]
    base_mesh = {'type': 'mesh', 'name': 'base', 'width': bw, 'height': bh, 'vertices': v, 'uvs': u, 'triangles': t, 'weights': w, 'slotPose': [1, 0, 0, 1, 0, 0], 'bonePose': bp}
    tw, th = img['tail'].size
    def wtail(px, py):
        q = ((px - tl[0]) * dx + (py - tl[1]) * dy) / L * 3 - 0.5; q = max(0.0, min(2.0, q)); k = min(1, int(q)); f = q - k; f = f * f * (3 - 2 * f)
        return [(idx[f'tail{k + 1}'], 1 - f), (idx[f'tail{k + 2}'], f)]
    v, u, t, w = grid(tw, th, A(TP['offset']), 9, 5, wtail)
    bp = []
    for k in range(3): bp += [idx[f'tail{k + 1}']] + mat(ang, tp[0] + dx * seg * k, tp[1] + dy * seg * k)
    tail_mesh = {'type': 'mesh', 'name': 'tail', 'width': tw, 'height': th, 'vertices': v, 'uvs': u, 'triangles': t, 'weights': w, 'slotPose': [1, 0, 0, 1, 0, 0], 'bonePose': bp}

    slots = [{'name': 'base', 'parent': 'root'}, {'name': 'tail', 'parent': 'root'}] + [{'name': f'z{i}', 'parent': f'z{i}'} for i in range(3)]
    skin = [{'name': 'base', 'display': [base_mesh]}, {'name': 'tail', 'display': [tail_mesh]}] + [{'name': f'z{i}', 'display': [{'name': f'z{i}'}]} for i in range(3)]

    S = math.sin; T = 2 * math.pi; C = math.cos
    idle = [
        {'name': 'breath', 'translateFrame': wave(120, 6, lambda p: -3.6 * (0.5 - 0.5 * C(T * p)), 'y')},
        {'name': 'tail2', 'rotateFrame': wave(120, 8, lambda p: 1.5 * S(T * p + 0.4))},
        {'name': 'tail3', 'rotateFrame': wave(120, 6, lambda p: 4 * S(T * p) + 1.5 * S(T * 3 * p))},
    ]
    # the Zs: one wave passing along the three of them, like a caterpillar's back
    for i in range(3):
        idle.append({'name': f'z{i}', 'translateFrame': wave(120, 4, lambda p, i=i: (5 + 2 * i) * S(T * 2 * p - i * 1.25), 'y'),
                     'rotateFrame': wave(120, 6, lambda p, i=i: 6 * S(T * 2 * p - i * 1.25 - 0.8))})
    twitch = [{'name': 'nose', 'translateFrame': keys([(0, {'x': 0, 'y': 0}), (2, {'x': -1.5, 'y': -2.5}), (4, {'x': 0.5, 'y': 0.5}), (6, {'x': -1, 'y': -1.5}), (10, {'x': 0, 'y': 0})])}]
    act = [   # a dream: paws jerk, tail tip flicks, he settles
        {'name': 'paw', 'translateFrame': keys([(0, {'x': 0, 'y': 0}), (2, {'x': 3, 'y': -3}), (4, {'x': -1, 'y': 1}), (6, {'x': 2.5, 'y': -2}), (9, {'x': -0.5, 'y': 0.5}), (16, {'x': 0, 'y': 0})])},
        {'name': 'nose', 'translateFrame': keys([(0, {'x': 0, 'y': 0}), (3, {'x': -1.5, 'y': -2}), (8, {'x': 0.5, 'y': 0.5}), (16, {'x': 0, 'y': 0})])},
        {'name': 'tail3', 'rotateFrame': keys([(0, 0), (3, 13), (6, -6), (9, 8), (16, 0)])},
        {'name': 'tail2', 'rotateFrame': keys([(0, 0), (4, 5), (8, -2), (16, 0)])}]
    cheer = [{'name': 'tail3', 'rotateFrame': wave(24, 3, lambda p: 9 * S(T * p))}, {'name': 'tail2', 'rotateFrame': wave(24, 3, lambda p: 4 * S(T * p - 0.8))}]
    anims = [{'duration': 120, 'playTimes': 0, 'name': 'idle', 'bone': idle}, {'duration': 16, 'playTimes': 1, 'name': 'act', 'bone': act},
             {'duration': 10, 'playTimes': 1, 'name': 'twitch', 'bone': twitch}, {'duration': 24, 'playTimes': 0, 'name': 'cheer', 'bone': cheer}]
    ske = {'frameRate': FPS, 'name': name, 'version': '5.5', 'compatibleVersion': '5.5', 'armature': [{
        'type': 'Armature', 'frameRate': FPS, 'name': pose, 'aabb': {'x': -foot[0], 'y': -foot[1], 'width': bw, 'height': bh},
        'bone': bones, 'slot': slots, 'skin': [{'name': '', 'slot': skin}], 'animation': anims, 'defaultActions': [{'gotoAndPlay': 'idle'}]}]}
    tex = {'name': name, 'imagePath': f'{name}_tex.png', 'width': W, 'height': H, 'SubTexture': sub}
    json.dump(ske, open(os.path.join(OUT, f'{name}_ske.json'), 'w'), separators=(',', ':'))
    json.dump(tex, open(os.path.join(OUT, f'{name}_tex.json'), 'w'), separators=(',', ':'))
    atlas.save(os.path.join(OUT, f'{name}_tex.webp'), quality=92, method=6)
    print(f'{name}: {len(bones)} bones, {len(slots)} slots, tail {ang:.0f} deg x {L:.0f}px, atlas {W}x{H}')


if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['heroes']:
        ids = args[1:] or sorted(k[2:] for k in json.load(open(os.path.join(ROOT, 'data', 'rig.json'))) if k.startswith('h_'))
        for h in ids: build(h, hero=True)
    else:
        for pose in (args or ['stamp', 'fish', 'pick', 'dig', 'sleep']): build_sleep() if pose == 'sleep' else build(pose)
