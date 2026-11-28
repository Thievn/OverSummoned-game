"""Draws the pet exactly the way the Godot build will, so the numbers in items.json can be checked
and fixed here instead of guessing at them in the editor. Same layer order, same anchors, same page.

  python3 rules/pet2_preview.py               # one picture per activity
  python3 rules/pet2_preview.py wardrobe      # a few looks side by side
"""
import os, sys, json, math
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'desktop-pet2')
ART = os.path.join(ROOT, 'art')
N = 1024
RIG = json.load(open(os.path.join(ROOT, 'rig.json')))
IT = json.load(open(os.path.join(ROOT, 'items.json')))

FUR = {'brown': None, 'white': ((133, 140, 158), (255, 255, 255)), 'black': ((18, 18, 26), (84, 87, 107)),
       'gold': ((138, 92, 13), (255, 219, 138)), 'ghost': ((107, 158, 199), (224, 247, 255))}
CLOAK = {'teal': None, 'red': ((71, 13, 15), (189, 51, 46)), 'purple': ((46, 15, 77), (133, 71, 199)),
         'green': ((13, 51, 23), (66, 143, 71)), 'black': ((13, 13, 20), (66, 66, 82)),
         'sand': ((102, 79, 33), (230, 199, 128))}


def tex(name):
    p = os.path.join(ART, f'{name}.png')
    return Image.open(p).convert('RGBA') if name and os.path.exists(p) else None


def recolour(im, maskname, pair):
    if pair is None:
        return im
    m = tex(maskname)
    if m is None:
        return im
    import numpy as np
    a = np.asarray(im).astype(float)
    mk = (np.asarray(m.convert('L')).astype(float) / 255.0)[:, :, None]
    lum = (a[:, :, 0] * .299 + a[:, :, 1] * .587 + a[:, :, 2] * .114) / 255.0
    f = np.clip((lum - .08) / .84, 0, 1)
    f = (f * f * (3 - 2 * f))[:, :, None]
    d = np.array(pair[0], float)
    l = np.array(pair[1], float)
    re = d + (l - d) * f
    a[:, :, :3] = a[:, :, :3] * (1 - mk) + re * mk
    return Image.fromarray(a.astype('uint8'), 'RGBA')


def paste(canvas, im, at, w, anchor_y, rot=0.0):
    if im is None:
        return
    k = w / im.width
    s = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
    if rot:
        s = s.rotate(-rot, resample=Image.BICUBIC, expand=True)
    canvas.alpha_composite(s, (int(at[0] - s.width / 2), int(at[1] - s.height * anchor_y)))


TIP = [782.0, 700.0]


def face(c, look, expression):
    """Mirrors _draw_face in rig.gd: paint the drawn eye out in fur, then draw the new one."""
    if expression in ('', 'normal'):
        return
    d = ImageDraw.Draw(c)
    pair = FUR.get(look.get('fur', 'brown'))
    fur = (120, 79, 46) if pair is None else tuple(int(a * .45 + b * .55) for a, b in zip(*pair))
    ink = (18, 13, 13)
    r = RIG['eye_r_px']
    for side in ('l', 'r'):
        x, y = RIG['eye_' + side]
        rr = r * 1.12
        d.ellipse([x - rr, y + 2 - rr, x + rr, y + 2 + rr], fill=fur)
        if expression in ('happy', 'cheer'):
            d.arc([x - r * .78, y + 6 - r * .5, x + r * .78, y + 6 + r * .78], 180, 360, fill=ink, width=9)
        elif expression == 'sleepy':
            d.arc([x - r * .72, y - r * .36, x + r * .72, y + r * .36], 0, 180, fill=ink, width=9)
        elif expression == 'surprised':
            d.ellipse([x - r * .72, y - r * .72, x + r * .72, y + r * .72], fill=(255, 255, 255), outline=ink, width=7)
            d.ellipse([x - r * .34, y - r * .34, x + r * .34, y + r * .34], fill=ink)
        elif expression == 'angry':
            d.ellipse([x - r * .46, y + 4 - r * .46, x + r * .46, y + 4 + r * .46], fill=ink)
            dx = 1 if side == 'l' else -1
            d.line([(x - r * .8 * dx, y - r * .78), (x + r * .8 * dx, y - r * .30)], fill=ink, width=9)
    mx, my = RIG['mouth']
    w = RIG['mouth_w'] * .5
    if expression == 'cheer':
        d.chord([mx - w * .8, my - 40, mx + w * .8, my + 40], 0, 180, fill=(92, 36, 41), outline=ink, width=8)
    elif expression == 'surprised':
        d.ellipse([mx - 26, my - 16, mx + 26, my + 36], fill=(82, 31, 36), outline=ink, width=7)
    elif expression == 'focused':
        d.ellipse([mx - 6, my + 4, mx + 34, my + 44], fill=(217, 107, 115), outline=ink, width=5)


def draw(activity='summon', look=None, lift=(0, 0), expression=''):
    look = dict({'head': 'hood', 'face': '', 'neck': '', 'fur': 'brown', 'cloak': 'teal'}, **(look or {}))
    a = IT['activities'][activity]
    OFF = RIG['off']
    c = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    core = recolour(tex('core'), 'core_fur_mask', FUR.get(look['fur']))
    core = recolour(core, 'core_cloak_mask', CLOAK.get(look['cloak']))
    c.alpha_composite(core, tuple(OFF['core']))
    face(c, look, expression)
    for slot in ('neck', 'face', 'head'):
        key = look.get(slot) or ''
        it = IT['items'].get(key)
        if not it:
            continue
        pic = it.get('pic', key)
        im = tex(pic)
        if pic == 'hood':      # his hood is cut from the same page, so it just goes back where it was
            im = recolour(im, 'hood_fur_mask', CLOAK.get(look['cloak']))
            o = RIG['off']['hood']; h = RIG.get('hood_at', [0, 0])
            c.alpha_composite(im, (o[0] + h[0], o[1] + h[1]))
            continue
        paste(c, im, it.get('at', [517, 118]), it.get('w', 440), it.get('anchor_y', 0.0))
    c.alpha_composite(tex('desk'), tuple(OFF['desk']))
    if a.get('desk'):
        paste(c, tex(a['desk']), a['desk_at'], a['desk_w'], 1.0)
    for i, s in enumerate(['l', 'r']):
        at = RIG['paw_' + s]
        dy = lift[i] + a.get('rest_' + s, 0)
        pw = recolour(tex('paw_' + s), f'paw_{s}_fur_mask', FUR.get(look['fur']))
        hand = Image.new('RGBA', (N, N), (0, 0, 0, 0))
        hand.alpha_composite(pw, (OFF['paw_' + s][0], int(OFF['paw_' + s][1] - dy)))
        key = 'hold_' + s
        if a.get(key):
            im = tex(a[key])
            k = a[key + '_w'] / im.width
            sm = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
            rot = a.get(key + '_rot', 0)
            grip = a.get(key + '_grip', [.5, .5])
            gx, gy = sm.width * grip[0], sm.height * grip[1]
            sr = sm.rotate(-rot, resample=Image.BICUBIC, expand=True, center=(gx, gy))
            ox = (sr.width - sm.width) / 2
            oy = (sr.height - sm.height) / 2
            px = at[0] + a[key + '_at'][0]
            py = at[1] + a[key + '_at'][1] - lift[i] - a.get('rest_' + s, 0)
            hand.alpha_composite(sr, (int(px - gx - ox), int(py - gy - oy)))
            if activity == 'fish' and s == 'r':      # where the rod's thin end ends up
                lx, ly = sm.width * .95 - gx, sm.height * .04 - gy
                th = math.radians(rot)
                TIP[0] = px + lx * math.cos(th) - ly * math.sin(th)
                TIP[1] = py + lx * math.sin(th) + ly * math.cos(th)
        c.alpha_composite(hand, (0, 0))
    if a.get('front'):
        paste(c, tex(a['front']), a['front_at'], a['front_w'], 1.0)
    if activity == 'fish':
        d = ImageDraw.Draw(c)
        f = a['float_at']
        d.line([(TIP[0], TIP[1]), tuple(f)], fill=(245, 245, 250, 220), width=3)
        d.ellipse([f[0] - 15, f[1] - 15, f[0] + 15, f[1] + 15], fill=(219, 56, 46, 255), outline=(26, 18, 18, 255), width=3)
    return c


def flat(c, bg=(16, 22, 42)):
    o = Image.new('RGB', c.size, bg)
    o.paste(c, (0, 0), c)
    return o


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'wardrobe':
        looks = [
            ('hood, brown', {}),
            ('wizard hat', {'head': 'hat_wizard'}),
            ('crown + bow tie', {'head': 'hat_crown', 'neck': 'neck_bow'}),
            ('white fur, red cloak', {'fur': 'white', 'cloak': 'red'}),
            ('gold fur, no hat', {'fur': 'gold', 'head': 'bare', 'cloak': 'purple'}),
        ]
        ims = [flat(draw('summon', lk)) for _, lk in looks]
    elif len(sys.argv) > 1 and sys.argv[1] == 'faces':
        ims = [flat(draw('summon', {}, expression=e)) for e in ['happy', 'cheer', 'sleepy', 'surprised', 'angry', 'focused']]
    else:
        ims = [flat(draw(k)) for k in IT['activities']]
    w = 460
    o = Image.new('RGB', ((w + 6) * len(ims), w), (255, 255, 255))
    for i, m in enumerate(ims):
        o.paste(m.resize((w, w), Image.LANCZOS), (i * (w + 6), 0))
    o.save('/tmp/pet_preview.png')
    print('/tmp/pet_preview.png')
