"""Green-screen cut for the wave-three heroes: raw take -> art2/heroes/<id>.png (650 tall) and the card
image at assets/v2/heroes/<id>.webp (560 tall). Same sizes as every earlier hero.
  python3 rules/wave3_cut.py [id ...]"""
import os, sys
sys.path.insert(0, '/home/claude/tools')
import green
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PICK = {'doug': 2, 'bjorn': 1, 'mona': 1, 'dusty': 1, 'hootsworth': 2, 'sterling': 2, 'dolly': 2,
        'gladius': 2, 'quack': 2, 'selene': 1, 'beep': 1, 'tut': 1, 'eagleton': 2, 'zorp': 2}
RAW = '/tmp/w3'

def one(hid, take=None):
    src = f'{RAW}/hero_{hid}_{take or PICK[hid]}.jpg'
    tmp = f'/tmp/cut_{hid}.png'
    green.cut(src, tmp, ink=2, pad=0, largest=True)
    im = Image.open(tmp).convert('RGBA'); im = im.crop(im.getbbox())
    big = im.resize((max(1, round(im.width * 650 / im.height)), 650), Image.LANCZOS)
    big.save(f'{ROOT}/art2/heroes/{hid}.png')
    card = big.resize((max(1, round(big.width * 560 / 650)), 560), Image.LANCZOS)
    card.save(f'{ROOT}/assets/v2/heroes/{hid}.webp', quality=92, method=6)
    return big.size

if __name__ == '__main__':
    ids = sys.argv[1:] or list(PICK)
    for h in ids: print(h, one(h))
