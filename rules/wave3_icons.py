"""Queues the wave-three gear icons as 3x3 green-screen grids, then slices them into
assets/v2/loot/<id>.webp. Picture descriptions live in rules/wave3.py (ART).
  python3 rules/wave3_icons.py plan   -> prints the SQL rows and writes the sheet map
  python3 rules/wave3_icons.py slice  -> cuts the finished sheets into icons"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, '/home/claude/tools')
import wave3
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP = os.path.join(ROOT, 'rules', 'wave3_sheets.json')
G = ("a plain flat solid pure bright green (#00FF00) chroma-key background. The same flat green shows through every gap, hole "
     "and opening in and between the objects. Nothing on the objects themselves is green-screen green. No shadows on the background")
STYLE = ("Art style: polished 2D cartoon game art with bold clean dark navy outlines, bright warm saturated colors, flat cel shading "
         "with two tones and a warm rim light, light painted texture. No text, no labels.")

def items():
    out = []
    for h in wave3.HEROES:
        for name, slot, art, _f in h['gear']: out.append((f"{h['id']}_{slot}", art))
    for hid, (_n, _s, _e, _w, _c, pieces) in wave3.ERA.items():
        for slot, _name, _rl, art, _f in pieces: out.append((f"e_{hid}_{slot}", art))
    return out

def plan():
    it = items()
    while len(it) % 9: it.append((f'x_pad{len(it)}', 'a small gold star'))
    sheets, rows = {}, []
    for i in range(0, len(it), 9):
        nm = f'w3_{i // 9 + 1:02d}'; sheets[nm] = [a for a, _ in it[i:i + 9]]
        p = ("A clean 3 by 3 grid of nine separate game loot icons, large even spacing, each icon centered in its own cell, nothing "
             "touching, no frames, on " + G + ". In reading order, left to right, top to bottom: " + "; ".join(d for _, d in it[i:i + 9]) +
             ". Absolutely no characters, no animals, no people. " + STYLE)
        rows.append((f'art/raw/g/icons_{nm}', p))
    json.dump(sheets, open(MAP, 'w'), indent=1)
    return rows, sheets

def cut():
    import green
    sheets = json.load(open(MAP)); done = 0
    for nm, names in sheets.items():
        src = f'/tmp/w3icons/icons_{nm}.jpg'
        if not os.path.exists(src): print('missing', nm); continue
        out = os.path.join(ROOT, 'assets', 'v2', 'loot')
        miss = green.slice9(src, names, out)
        if miss: print(nm, 'empty cells:', miss)
        for n in names:                      # slice9 writes png; the game serves webp
            png = os.path.join(out, n + '.png')
            if not os.path.exists(png): continue
            if n.startswith('x_pad'): os.remove(png); continue
            from PIL import Image
            Image.open(png).convert('RGBA').save(os.path.join(out, n + '.webp'), quality=92, method=6)
            os.remove(png); done += 1
    print(done, 'icons')

if __name__ == '__main__':
    if sys.argv[1:2] == ['slice']: cut()
    else:
        rows, sheets = plan()
        print(len(rows), 'sheets', sum(len(v) for v in sheets.values()), 'cells')
        json.dump([{'path': p, 'prompt': q} for p, q in rows], open('/tmp/w3icons_jobs.json', 'w'))
