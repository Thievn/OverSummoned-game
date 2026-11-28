"""Make Smudge's Discord profile picture from the drawn face sheet.

  python3 rules/avatar.py   -> art2/avatar/smudge_discord_<n>.png (1024px) + a preview sheet

Discord shows an avatar as a circle and often at 32px, so this keeps everything inside the
circle, keeps the head big, and uses the site's own colours so it matches oversummoned.com.
No new art is generated: the head is the painted one, lifted off its white page.
"""
import os, numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'art2', 'avatar')
S = 1024
INK, PANEL2, GOLD, GOLD2 = (8, 12, 26), (26, 38, 80), (242, 185, 53), (255, 211, 92)
TEAL, PARCH, PARCH2, SEPIA = (63, 224, 197), (243, 230, 200), (228, 210, 168), (74, 53, 32)


def lift(cell):
    """Take the head off its white page by flooding in from the corners, so the pale cream
    fur and the whiskers stay put. A luminance cut-off eats them."""
    a = np.asarray(cell).astype(int)
    near_white = a.min(2) > 238
    seed = np.zeros(near_white.shape, bool); seed[0, :] = seed[-1, :] = seed[:, 0] = seed[:, -1] = True
    bg = ndimage.binary_propagation(seed & near_white, mask=near_white)
    bg = ndimage.binary_closing(bg, np.ones((3, 3)))
    fg = ~bg
    lab, n = ndimage.label(fg)                            # the sheet has faint specks in the
    if n > 1:                                             # margins; drop anything that isn't him
        sz = ndimage.sum(fg, lab, range(1, n + 1))
        fg = lab == int(np.argmax(sz)) + 1
    al = ndimage.gaussian_filter(fg.astype(np.float32), 0.8)   # one soft pixel, so no jagged rim
    im = np.dstack([a, np.clip(al * 255, 0, 255)]).astype(np.uint8)
    o = Image.fromarray(im, 'RGBA')
    return o.crop(o.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())


def radial(top, bottom, cx=0.5, cy=0.34):
    y, x = np.mgrid[0:S, 0:S]
    d = np.sqrt(((x / S - cx) * 1.15) ** 2 + ((y / S - cy) * 1.15) ** 2) / 0.78
    t = np.clip(d, 0, 1)[..., None]
    g = np.array(top) * (1 - t) + np.array(bottom) * t
    return Image.fromarray(g.astype(np.uint8), 'RGB').convert('RGBA')


def glow(colour, r=0.40, soft=180):
    g = Image.new('L', (S, S), 0)
    ImageDraw.Draw(g).ellipse([S * (.5 - r), S * (.40 - r), S * (.5 + r), S * (.40 + r)], fill=255)
    g = g.filter(ImageFilter.GaussianBlur(soft))
    lay = Image.new('RGBA', (S, S), colour + (0,)); lay.putalpha(g.point(lambda v: int(v * .55)))
    return lay


def rim(colour, w=14):
    lay = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(lay).ellipse([w / 2, w / 2, S - w / 2, S - w / 2], outline=colour + (255,), width=w)
    return lay


def place(bg, head, fill=0.80, cy=0.50, by='max'):
    # by='width' fills the circle properly: the head spans it and the shoulders run off the bottom,
    # which is how a profile picture is framed. by='max' keeps the whole thing inside.
    h = head.copy(); k = (S * fill) / (h.size[0] if by == 'width' else max(h.size))
    h = h.resize((int(h.size[0] * k), int(h.size[1] * k)), Image.LANCZOS)
    sh = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    sh.paste(h, (int(S / 2 - h.size[0] / 2), int(S * cy - h.size[1] / 2)), h)
    drop = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    drop.putalpha(sh.getchannel('A').filter(ImageFilter.GaussianBlur(26)).point(lambda v: int(v * .45)))
    out = bg.copy(); out.alpha_composite(drop, (0, 16)); out.alpha_composite(sh)
    return out


def circle(im):
    m = Image.new('L', (S, S), 0); ImageDraw.Draw(m).ellipse([0, 0, S - 1, S - 1], fill=255)
    o = im.copy(); o.putalpha(m); return o


def main():
    os.makedirs(OUT, exist_ok=True)
    sheet = Image.open('/tmp/faces/sheet.png').convert('RGB'); W, H = sheet.size
    calm = lift(sheet.crop((0, 0, W // 3, H // 2)))
    laugh = lift(sheet.crop((2 * W // 3, 0, W, H // 2)))

    # A small avatar lives or dies on contrast. Smudge is mid-brown in a dark teal hood, so the
    # background has to be much lighter than he is, or much darker with a light edge behind him.
    made = []
    # 1 — brand gold. Brightest, and the one that still reads in a 32px member list.
    a = radial(GOLD2, GOLD, cy=.30); a = place(a, calm, .88, .54); a.alpha_composite(rim(INK, 18))
    made.append(('gold', a))
    # 2 — parchment, the colour of the cards. Softer, and the dark hood frames his face.
    b = radial(PARCH, PARCH2, cy=.30); b = place(b, calm, .88, .54); b.alpha_composite(rim(SEPIA, 16))
    made.append(('parchment', b))
    # 3 — night, with a teal halo right behind his head so he doesn't sink into it.
    c = radial(PANEL2, INK); c.alpha_composite(glow(TEAL, .30, 120))
    c = place(c, calm, .90, .505, 'width'); c.alpha_composite(rim(GOLD, 18))
    made.append(('night', c))

    for n, im in made:
        circle(im).save(f'{OUT}/smudge_discord_{n}.png')
        im.convert('RGB').save(f'{OUT}/smudge_discord_{n}_square.png')

    # preview on Discord's own dark grey, at the sizes it actually shows
    sizes = [168, 80, 40, 24]
    col = 360; pv = Image.new('RGB', (col * len(made), 250), (49, 51, 56))
    d = ImageDraw.Draw(pv)
    for i, (n, im) in enumerate(made):
        c_ = circle(im); x = i * col + 20; big = c_.resize((sizes[0], sizes[0]), Image.LANCZOS)
        pv.paste(big, (x, 30), big); sx = x + sizes[0] + 20
        for s in sizes[1:]:
            t = c_.resize((s, s), Image.LANCZOS); pv.paste(t, (sx, 30 + sizes[0] - s), t); sx += s + 10
        d.text((x, 212), n, fill=(222, 222, 228))
    pv.save(f'{OUT}/preview.png')
    print('wrote', ', '.join(n for n, _ in made))


main()
