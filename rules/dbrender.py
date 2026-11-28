"""Draw frames dumped by the DragonBones runtime, so a rig can be checked without a browser.

  node /tmp/dbdump.js <anim> <frames> <faceIndex> && python3 rules/dbrender.py out.gif

Reads /tmp/frames.json (slot meshes per frame) and the atlas, and warps every triangle the
same way the canvas player does. This is a test harness, not the game: nothing it draws ships.
"""
import json, sys, os, numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATLAS = np.asarray(Image.open(os.path.join(ROOT, 'assets', 'v2', 'db', 'smudge_head_tex.png')).convert('RGBA')).astype(np.float32)
W = H = int(os.environ.get('DBR_SIZE', 520))
OX, OY = W / 2, H * 0.86
SC = W / 620


def warp(dst, acc, v, u, t, reg):
    rx, ry, rw, rh = reg['x'], reg['y'], reg['width'], reg['height']
    for k in range(0, len(t), 3):
        i = [t[k] * 2, t[k + 1] * 2, t[k + 2] * 2]
        P = np.array([[OX + v[j] * SC, OY + v[j + 1] * SC] for j in i])
        Q = np.array([[rx + u[j] * rw, ry + u[j + 1] * rh] for j in i])
        x0, y0 = np.floor(P.min(0)).astype(int) - 1; x1, y1 = np.ceil(P.max(0)).astype(int) + 1
        x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
        if x1 <= x0 or y1 <= y0: continue
        xs, ys = np.meshgrid(np.arange(x0, x1) + .5, np.arange(y0, y1) + .5)
        d = ((P[1, 1] - P[2, 1]) * (P[0, 0] - P[2, 0]) + (P[2, 0] - P[1, 0]) * (P[0, 1] - P[2, 1]))
        if abs(d) < 1e-6: continue
        a = ((P[1, 1] - P[2, 1]) * (xs - P[2, 0]) + (P[2, 0] - P[1, 0]) * (ys - P[2, 1])) / d
        b = ((P[2, 1] - P[0, 1]) * (xs - P[2, 0]) + (P[0, 0] - P[2, 0]) * (ys - P[2, 1])) / d
        c = 1 - a - b
        m = (a >= -.004) & (b >= -.004) & (c >= -.004)
        if not m.any(): continue
        sx = np.clip(a * Q[0, 0] + b * Q[1, 0] + c * Q[2, 0], 0, ATLAS.shape[1] - 1)
        sy = np.clip(a * Q[0, 1] + b * Q[1, 1] + c * Q[2, 1], 0, ATLAS.shape[0] - 1)
        px = ATLAS[np.rint(sy).astype(int), np.rint(sx).astype(int)]
        al = (px[..., 3] / 255.0) * m
        # within one mesh take the strongest cover, so touching triangles don't blend at the seam
        sal = acc[y0:y1, x0:x1]; keep = al > sal
        dst[y0:y1, x0:x1] = np.where(keep[..., None], px[..., :3], dst[y0:y1, x0:x1])
        acc[y0:y1, x0:x1] = np.maximum(sal, al)


def main(out):
    frames = json.load(open('/tmp/frames.json')); ims = []
    for fr in frames:
        page = np.full((H, W, 3), (27, 23, 34), np.float32)
        for nm in ('hood', 'face'):          # each slot on its own layer, then laid down in order
            s = fr.get(nm)
            if not (s and s['tex']): continue
            lay = np.zeros((H, W, 3), np.float32); acc = np.zeros((H, W), np.float32)
            warp(lay, acc, s['v'], s['u'], s['t'], s['tex'])
            a = acc[..., None]; page = lay * a + page * (1 - a)
        ims.append(Image.fromarray(page.astype(np.uint8)))
    # one shared palette, so the gif stays small and nothing shimmers between frames
    pal = ims[0].quantize(colors=128, method=Image.MEDIANCUT)
    ims = [i.quantize(palette=pal, dither=Image.FLOYDSTEINBERG) for i in ims]
    ims[0].save(out, save_all=True, append_images=ims[1:], duration=33, loop=0, optimize=True)
    print(out, len(ims), 'frames')


main(sys.argv[1] if len(sys.argv) > 1 else '/tmp/head.gif')
