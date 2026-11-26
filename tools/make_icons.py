"""Builds the app icons and the loading art from the real Smudge drawing.
The old ones had the picture pasted in as a rectangle, so his chest and his stamp arm were cut off
with a hard straight edge. Here he is masked by the circle instead, so every edge is the circle's.
  python3 tools/make_icons.py"""
import os
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAVY, DEEP, TEAL = '#101936', '#0b1226', '#1f6f7a'
SRC = os.path.join(ROOT, 'art2', 'smudge', 'stamp.png')
BUST = (118, 34, 512, 400)      # head, chest and the raised stamp, read off the drawing

def rounded(size, r, fill):
    m = Image.new('L', (size, size), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, size - 1, size - 1], r, fill=255)
    im = Image.new('RGBA', (size, size), fill); im.putalpha(m); return im

def icon(size, pad_ratio=0.085, square=False, bg=NAVY):
    S = size * 4                                  # draw big, shrink once: clean edges
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    plate = Image.new('RGBA', (S, S), bg) if square else rounded(S, int(S * 0.235), bg)
    out.alpha_composite(plate)
    pad = int(S * pad_ratio); d = S - pad * 2
    ring = Image.new('RGBA', (S, S), (0, 0, 0, 0)); rd = ImageDraw.Draw(ring)
    rd.ellipse([pad, pad, pad + d, pad + d], fill=TEAL)
    out.alpha_composite(ring)
    bust = Image.open(SRC).convert('RGBA').crop(BUST)
    w = int(d * 1.06); bust = bust.resize((w, round(bust.height * w / bust.width)), Image.LANCZOS)
    layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    layer.alpha_composite(bust, (pad + (d - w) // 2, pad + int(d * 0.06)))
    circ = Image.new('L', (S, S), 0); ImageDraw.Draw(circ).ellipse([pad, pad, pad + d, pad + d], fill=255)
    layer.putalpha(Image.fromarray((__import__('numpy').asarray(layer.getchannel('A')).astype(int) * (__import__('numpy').asarray(circ).astype(int)) // 255).astype('uint8')))
    out.alpha_composite(layer)
    rd2 = ImageDraw.Draw(out); rd2.ellipse([pad, pad, pad + d, pad + d], outline=(255, 255, 255, 40), width=max(2, S // 170))
    return out.resize((size, size), Image.LANCZOS)

if __name__ == '__main__':
    icon(512).save(os.path.join(ROOT, 'icon-512.png'))
    icon(192).save(os.path.join(ROOT, 'icon-192.png'))
    icon(180, square=True).convert('RGB').save(os.path.join(ROOT, 'apple-touch-icon.png'))
    # the loading picture: the same bust, no plate, so it sits on the page's own background
    b = Image.open(SRC).convert('RGBA').crop(BUST)
    wink = b.copy()
    # one eye shut, drawn where the rig says the eye is: a lid in his own fur colour with a lash line under it
    import json
    face = json.load(open(os.path.join(ROOT, 'data', 'rig.json')))['stamp']['face']
    cx, cy, rx, ry = face['eyes'][0]; fur = tuple(face['fur'])
    cx -= BUST[0]; cy -= BUST[1]; w, h = int(rx * 2.6), int(ry * 2.8)
    lid = Image.new('RGBA', (w * 4, h * 4), (0, 0, 0, 0)); ld = ImageDraw.Draw(lid)
    ld.ellipse([0, 0, w * 4 - 1, h * 4 - 1], fill=fur + (255,))
    ld.arc([4, -h * 4, w * 4 - 5, h * 4 - 5], 20, 160, fill=(26, 32, 56, 255), width=12)
    wink.alpha_composite(lid.resize((w, h), Image.LANCZOS), (cx - w // 2, cy - h // 2))
    for im, nm in ((b, 'boot'), (wink, 'boot_wink')):
        o = im.copy(); o.thumbnail((420, 420), Image.LANCZOS)
        o.save(os.path.join(ROOT, 'assets', 'v2', 'smudge', nm + '.webp'), quality=92, method=6)
    print('icons and boot art rebuilt')
