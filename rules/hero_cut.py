"""Second, cleaner pass over every hero's head and tail cut (replaces heropup.py's output).
The head keeps heropup's outline, but its lower edge is feathered into the body and the neck and
collar are painted in underneath, so the head can tilt without a slit or a stuck copy showing.
  python3 rules/hero_cut.py [id ...]"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage
import cutlib
from cutlib import poly, cut_head, save, crumbs, ROOT

HP = os.path.join(ROOT, 'art2', 'hpuppet')


def tables():
    src = open(os.path.join(ROOT, 'rules', 'heropup.py')).read()
    ns = {}
    exec(src[src.index('HEADS = {'):src.index('FACES = {}')], ns)
    return ns['HEADS'], ns['TAILS']


def run(ids=None):
    HEADS, TAILS = tables(); cutlib.OUT = HP
    rigs = {p: json.load(open(p)) for p in (os.path.join(HP, 'rig.json'), os.path.join(ROOT, 'data', 'rig.json'))}
    done = []
    for hid, (pts, pivot) in HEADS.items():
        if ids and hid not in ids: continue
        a = np.asarray(Image.open(os.path.join(ROOT, 'art2', 'heroes', hid + '.png')).convert('RGBA')).copy(); base = a.copy(); pose = 'h_' + hid
        alpha = a[..., 3] > 0; parts = []
        if hid in TAILS:
            tp, tpiv = TAILS[hid]; bgnear = ndimage.binary_dilation(~alpha, iterations=10)
            m = poly(a, tp); m = m | (ndimage.binary_dilation(m, iterations=10) & bgnear & alpha)
            piece = a.copy(); piece[~ndimage.binary_dilation(m, iterations=5)] = 0; base[..., 3][m] = 0
            parts.append(dict(name='tail', mode='behind', pivot=list(tpiv), offset=save(piece, pose, 'tail')))
        xs = [p[0] for p in pts]; bottom = max(p[1] for p in pts); x0, x1 = min(xs) - 12, max(xs) + 12
        soft = [(x0, bottom - 16), (x1, bottom - 16), (x1, bottom + 12), (x0, bottom + 12)]
        fill = [(x0, bottom - 46), (x1, bottom - 46), (x1, bottom + 12), (x0, bottom + 12)]
        head = cut_head(a, base, [tuple(p) for p in pts], soft=soft, fill=fill)
        parts.append(dict(name='head', mode='front', pivot=list(pivot), offset=save(head, pose, 'head')))
        crumbs(base)
        Image.fromarray(base, 'RGBA').save(os.path.join(HP, pose + '_base.png'))
        Image.fromarray(base, 'RGBA').save(os.path.join(cutlib.WEB, pose + '_base.webp'), quality=92, method=6)
        for r in rigs.values(): r[pose]['parts'] = parts
        done.append(hid)
    json.dump(rigs[os.path.join(HP, 'rig.json')], open(os.path.join(HP, 'rig.json'), 'w'))
    json.dump(rigs[os.path.join(ROOT, 'data', 'rig.json')], open(os.path.join(ROOT, 'data', 'rig.json'), 'w'), separators=(',', ':'))
    return done, rigs[os.path.join(HP, 'rig.json')]


if __name__ == '__main__':
    done, rig = run(sys.argv[1:] or None)
    tiles = []
    for i, hid in enumerate(done):
        e = rig['h_' + hid]; t = cutlib.preview('h_' + hid, e, {'head': 6 if i % 2 else -6, 'tail': 10}, bg=(14, 20, 44, 255))
        t.thumbnail((250, 250)); c = Image.new('RGB', (250, 250), (14, 20, 44)); c.paste(t.convert('RGB'), ((250 - t.width) // 2, (250 - t.height) // 2)); tiles.append(c)
    cols = 9; rows = (len(tiles) + cols - 1) // cols; s = Image.new('RGB', (cols * 250, rows * 250))
    for i, t in enumerate(tiles): s.paste(t, ((i % cols) * 250, (i // cols) * 250))
    s.save('/tmp/herocut.png'); print(len(done), 'heroes')
