"""Works out the circle to crop out of each hero drawing for a profile picture.

The rig only knows where the eyes are for 20 of the 50, so the rest were cropped from a rough head pivot and
came out off-centre. This reads the drawing itself: the top band of the figure is the head (plus whatever is on
it), and the box is centred on that. Writes `avatar: [cx, cy, size, aspect]` into data/rig.json: the centre and the box size as
fractions of the picture's own width and height, plus its width/height, so the game needs no other numbers.
  python3 tools/avatar_box.py [--sheet /tmp/faces.png]
"""
import json, os, sys, glob
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'assets/v2/heroes')

def box(path):
    im = Image.open(path).convert('RGBA'); W, H = im.size
    a = np.asarray(im)[:, :, 3] > 40
    ys, xs = np.where(a)
    if not len(ys): return None
    top, bot = ys.min(), ys.max()
    band = a[top:top + max(8, int((bot - top) * .30))]                # the head sits in the top third or so
    col = band.sum(0)
    if not col.max(): return None
    # the head is the dense lump in that band; a raised axe or a lightning bolt is a thin column, so the box
    # grows out from the busiest column only while the drawing stays at least a third as solid
    peak = int(col.argmax()); lim = col.max() * .33
    l = peak
    while l > 0 and col[l - 1] >= lim: l -= 1
    r = peak
    while r < len(col) - 1 and col[r + 1] >= lim: r += 1
    x5, x95 = l, r
    w = max(x95 - x5, (bot - top) * .18)
    # start the box at the top of the head itself, not at the tip of a feather
    rows = a[:, max(0, int(x5)):int(x95) + 1].sum(1)
    solid = np.where(rows >= max(3, w * .12))[0]
    if len(solid): top = max(top, int(solid[0]))
    s = min(max(w * 1.38, W * .2), W * .95, H * .95)
    cx = (x5 + x95) / 2
    cy = top + s * .47                                                # a little air above the head
    cy = min(max(cy, s / 2), H - s / 2); cx = min(max(cx, s / 2), W - s / 2)
    return [round(cx / W, 4), round(cy / H, 4), round(s / W, 4), round(W / H, 4)]   # centre, size (of width), and the picture's shape

def main():
    rig = json.load(open(os.path.join(ROOT, 'data/rig.json')))
    done, miss = 0, []
    for f in sorted(glob.glob(os.path.join(ART, '*.webp'))):
        hid = os.path.basename(f)[:-5]; key = 'h_' + hid
        if key not in rig: miss.append(hid); continue
        b = box(f)
        if b: rig[key]['avatar'] = b; done += 1
    json.dump(rig, open(os.path.join(ROOT, 'data/rig.json'), 'w'), separators=(',', ':'))
    print('avatar boxes written:', done, 'not in rig:', miss)

    if '--sheet' in sys.argv:
        out = sys.argv[sys.argv.index('--sheet') + 1]
        ids = sorted(k[2:] for k in rig if k.startswith('h_') and 'avatar' in rig[k])
        C, D = 8, 120; rows = (len(ids) + C - 1) // C
        sheet = Image.new('RGB', (C * D, rows * (D + 16)), (16, 25, 54)); dr = ImageDraw.Draw(sheet)
        for i, hid in enumerate(ids):
            im = Image.open(os.path.join(ART, hid + '.webp')).convert('RGBA'); W, H = im.size
            cx, cy, s = rig['h_' + hid]['avatar'][:3]; s *= W
            crop = im.crop((int(cx * W - s / 2), int(cy * H - s / 2), int(cx * W + s / 2), int(cy * H + s / 2))).resize((D - 8, D - 8))
            bg = Image.new('RGBA', crop.size, (22, 33, 74, 255)); bg.alpha_composite(crop)
            mask = Image.new('L', crop.size, 0); ImageDraw.Draw(mask).ellipse((0, 0, crop.size[0] - 1, crop.size[1] - 1), fill=255)
            sheet.paste(bg.convert('RGB'), ((i % C) * D + 4, (i // C) * (D + 16) + 4), mask)
            dr.text(((i % C) * D + 6, (i // C) * (D + 16) + D - 8), hid[:14], fill=(200, 210, 235))
        sheet.save(out); print('sheet', out, sheet.size)

main()
