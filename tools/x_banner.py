"""Builds the official @OverSummonedHQ X banner (1500x500) from the live art, so it can be rebuilt
whenever a hero's picture changes.   python3 tools/x_banner.py [out.png]"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
W, H = 1500, 500
INK = (8, 12, 26); TEAL = (63, 224, 197)
FLOOR = 456
LEFT, RIGHT = 600, 1480     # the row of characters runs between these
# left to right after Smudge: (hero id, height)
CAST = [('gorm', 244), ('vesper', 228), ('stella', 240), ('flap', 200), ('roxy', 224), ('ajolote', 212)]


def smudge():
    """Smudge at his ledger, with the pale fringe round the book and cloak removed."""
    src = np.array(Image.open(P('art2', 'smudge', 'stamp.png')).convert('RGBA'))
    rgb = src[..., :3].astype(int); al = src[..., 3]; mx = rgb.max(2); mn = rgb.min(2)
    navy = (al > 0) & (np.abs(rgb - np.array([16, 22, 42])).max(2) <= 3)
    whiteish = (al == 255) & ~navy & (mn > 60) & ((mx - mn) < 22)
    semi = (al > 0) & (al < 255); outside = al == 0
    lab, _ = ndi.label(outside | whiteish | semi | navy, structure=np.ones((3, 3)))
    reach = np.isin(lab, np.unique(lab[outside]))
    dist = ndi.distance_transform_edt(~(outside | navy))
    kill = reach & whiteish & (dist <= 10)
    solid = (al == 255) & ~kill & ~navy
    solid &= ~(solid & ndi.binary_dilation(kill, iterations=2) & (mn > 90) & ((mx - mn) < 45))
    keep = navy & ndi.binary_dilation(solid, iterations=2)
    out = src.copy(); out[..., 3] = np.where(solid | keep, 255, 0); out[keep, :3] = (16, 22, 42)
    im = Image.fromarray(out); return im.crop(im.getbbox())


def build(dst):
    bg = Image.open(P('assets', 'v2', 'scenes', 'archive.webp')).convert('RGB')
    s = max(W / bg.width, H / bg.height)
    bg = bg.resize((int(bg.width * s) + 1, int(bg.height * s) + 1), Image.LANCZOS)
    top = max(0, (bg.height - H) // 2)
    bg = bg.crop((0, top, W, top + H)).filter(ImageFilter.GaussianBlur(4))
    a = np.array(bg).astype(float) * 0.40 + np.array(INK, float) * 0.60
    grad = np.linspace(1.0, 0.0, W)[None, :, None] ** 1.5
    a = a * (1 - 0.55 * grad) + np.array(INK, float) * (0.55 * grad)
    bg = Image.fromarray(a.clip(0, 255).astype('uint8')).convert('RGBA')

    def stand(im, x, h, floor=FLOOR):
        im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
        sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse([x + im.width * 0.12, floor - 12, x + im.width * 0.88, floor + 10], fill=(0, 0, 0, 120))
        bg.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7))); bg.alpha_composite(im, (x, floor - h))

    # everyone stands in one row with the same gap between neighbours, nobody cut off by the right edge
    row = [('smudge', smudge(), 218, 464)] + [(hid, Image.open(P('art2', 'heroes', hid + '.png')).convert('RGBA'), h, FLOOR) for hid, h in CAST]
    widths = [round(im.width * h / im.height) for _, im, h, _ in row]
    gap = (RIGHT - LEFT - sum(widths)) / (len(row) - 1)
    xs = []; x = LEFT
    for w in widths: xs.append(round(x)); x += w + gap
    for i in list(range(1, len(row), 2)) + list(range(0, len(row), 2)):      # every other one a step behind, so overlaps look natural
        stand(row[i][1], xs[i], row[i][2], floor=row[i][3])

    d = ImageDraw.Draw(bg)
    L = ImageFont.truetype(P('assets', 'fonts', 'LilitaOne.ttf'), 72); N = ImageFont.truetype(P('assets', 'fonts', 'Nunito.ttf'), 27)
    x = 84; y = 168
    for txt, col in (('Over', (255, 255, 255)), ('Summoned', TEAL)):
        d.text((x + 3, y + 5), txt, font=L, fill=(0, 0, 0, 200)); d.text((x, y), txt, font=L, fill=col); x += d.textlength(txt, font=L)
    d.text((87, 254), 'He only meant to summon one.', font=N, fill=(222, 228, 242))
    bg.convert('RGB').save(dst); print('saved', dst, bg.size)


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else '/home/claude/out/oversummoned_x_banner.png')
