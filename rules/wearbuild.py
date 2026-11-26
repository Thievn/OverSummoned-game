"""Turns the raw per-pose wardrobe art on the `art` branch into game assets.
Every item is drawn for the pose it is worn in, so there is one picture per item per pose and nothing
is stretched or re-angled at runtime. Run after the art jobs finish:
  git fetch origin art && python3 rules/wearbuild.py"""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wearcut import cut
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'art2', 'wear'); OUT = os.path.join(ROOT, 'assets', 'v2', 'wear')
POSES = ('stamp', 'fish', 'pick', 'dig')
OPT = {'crown': dict(max_side=420), 'glasses': dict(max_side=420, glass=90), 'jetpack': dict(max_side=460)}

def fetch(path):
    for n in ('_1', '_2', ''):
        for ext in ('jpg', 'png'):
            try:
                b = subprocess.check_output(['git', 'show', f'FETCH_HEAD:art/raw/wear/{path}{n}.{ext}'], cwd=ROOT, stderr=subprocess.DEVNULL)
                f = os.path.join(RAW, f'{path}{n}.{ext}'); open(f, 'wb').write(b); return f
            except subprocess.CalledProcessError:
                pass
    return None

if __name__ == '__main__':
    os.makedirs(RAW, exist_ok=True); os.makedirs(OUT, exist_ok=True)
    for item, o in OPT.items():
        for pose in POSES:
            src = fetch(f'{item}_{pose}')
            if not src: print('MISSING', item, pose); continue
            print(item, pose, cut(src, os.path.join(OUT, f'{item}_{pose}.webp'), **o))
