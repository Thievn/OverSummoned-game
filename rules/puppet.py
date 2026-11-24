"""Cuts Smudge's painted poses into puppet parts.
Each pose gets: base.png (the body with the moving bits removed), one PNG per
part, and an entry in rig.json with offsets, pivots, draw order and face points.
mode: 'fill' = part sits on top, the hole under it is painted in;
      'behind' = part is drawn behind the body (tail, rod); hole is cleared;
      'front' = part sits on top over empty space; hole is cleared except near the pivot."""
import json, sys
import numpy as np, cv2
from PIL import Image, ImageDraw
from scipy import ndimage

SRC = "/home/claude/oversummoned-game/art2/smudge"
OUT = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/oversummoned-game/art2/puppet"

POSES = {
 "stamp": dict(foot=(300, 520), bag=(95, 250), parts=[
    ("tail", "behind", (445, 425), [(432,405),(470,378),(540,395),(570,450),(565,505),(520,520),(495,470),(440,445)]),
    ("arm", "front", (352, 262), [(350,238),(400,215),(440,150),(480,138),(508,180),(508,268),(430,278),(385,292),(346,285)]),
    ("head", "fill", (275, 218), [(165,200),(150,120),(175,40),(240,5),(330,10),(385,80),(394,170),(362,216),(312,230),(250,228),(200,216)]),
   ], face=dict(eyes=[(267, 132, 15, 12), (339, 139, 11, 11)], mouth=(303, 186, 12, 7), fur=(303, 118))),
 "fish": dict(foot=(250, 355), bag=(60, 250), parts=[
    ("tail", "behind", (140, 392), [(95,385),(165,375),(175,420),(150,520),(100,530),(90,470)]),
    ("rod", "behind", (292, 215), [(300,226),(272,200),(440,18),(476,18),(476,80),(316,232)]),
    ("feet", "front", (285, 362), [(228,374),(300,340),(326,360),(332,470),(300,492),(240,482),(235,430)]),
    ("head", "fill", (188, 176), [(105,150),(100,80),(125,25),(185,5),(245,20),(262,60),(280,95),(264,127),(236,152),(216,176),(170,186),(125,180)]),
   ], face=dict(eyes=[(224, 77, 10, 10)], mouth=(246, 113, 8, 6), fur=(238, 72)), rod_tip=(470, 50)),
 "pick": dict(foot=(257, 522), bag=(120, 250), parts=[
    ("tail", "behind", (140, 465), [(5,430),(60,415),(140,440),(150,480),(110,525),(20,520),(0,470)]),
    ("hand_a", "front", (397, 210), [(388,200),(420,172),(470,180),(512,215),(506,236),(450,228),(400,226)]),
    ("hand_b", "front", (397, 250), [(388,234),(450,231),(514,240),(506,263),(450,271),(392,266)]),
    ("head", "fill", (312, 192), [(222,150),(215,90),(240,35),(300,12),(370,25),(408,70),(414,130),(402,170),(378,192),(330,202),(270,196),(235,180)]),
   ], face=dict(eyes=[(361, 111, 11, 10)], mouth=(376, 156, 8, 5), fur=(350, 92)), hands=(505, 235)),
 "dig": dict(foot=(300, 535), bag=(110, 240), parts=[
    ("tail", "behind", (115, 450), [(0,440),(60,425),(115,435),(122,465),(60,492),(0,487)]),
    ("shovel", "front", (350, 335), [(338,318),(372,305),(410,330),(470,350),(570,395),(570,458),(450,462),(425,405),(365,385),(336,350)]),
    ("head", "fill", (300, 182), [(215,150),(205,90),(225,40),(280,12),(350,20),(390,60),(404,110),(388,142),(362,162),(332,182),(280,190),(240,180)]),
   ], face=dict(eyes=[(351, 97, 11, 11)], mouth=(366, 136, 8, 5), fur=(340, 78)), blade=(520, 440)),
 "sleep": dict(foot=(300, 372), bag=(430, 150), parts=[], face=dict(eyes=[], mouth=(0, 0, 0, 0), fur=(0, 0)), zzz=(250, 120)),
}
KEEP = {"arm": 36, "feet": 26, "hand_a": 14, "hand_b": 14, "shovel": 22}

def mask_of(size, poly):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return np.asarray(m) > 0

def run():
    import os
    os.makedirs(OUT, exist_ok=True)
    rig = {}
    for pose, spec in POSES.items():
        im = Image.open(f"{SRC}/{pose}.png").convert("RGBA")
        a = np.asarray(im).copy()
        base = a.copy()
        bgnear = ndimage.binary_dilation(a[..., 3] == 0, iterations=10)
        entry = dict(size=list(im.size), foot=list(spec["foot"]), bag=list(spec["bag"]), parts=[], face=None)
        for k in ("rod_tip", "hands", "blade", "zzz"):
            if k in spec: entry[k] = list(spec[k])
        for name, mode, pivot, poly in spec["parts"]:
            m = mask_of(im.size, poly)
            # take the ink outline along with the part, wherever the part borders empty space
            m = m | (ndimage.binary_dilation(m, iterations=10) & bgnear & (a[..., 3] > 0))
            pm = ndimage.binary_dilation(m, iterations=5) if mode == "behind" else m
            piece = a.copy()
            piece[~pm] = 0
            ys, xs = np.where(piece[..., 3] > 0)
            x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
            Image.fromarray(piece[y0:y1, x0:x1], "RGBA").save(f"{OUT}/{pose}_{name}.png")
            hole = m & (base[..., 3] > 0)
            if mode == "fill":
                rgb = cv2.inpaint(np.ascontiguousarray(base[..., :3]), ndimage.binary_dilation(hole, iterations=2).astype(np.uint8) * 255, 7, cv2.INPAINT_TELEA)
                # only paint where the body was solid just outside the hole, so we never grow the silhouette
                ring = ndimage.binary_dilation(hole, iterations=10) & ~hole & (base[..., 3] > 200)
                near = ndimage.binary_dilation(ring, iterations=60)
                keep = hole & near
                # shrink the filled area so nothing peeks out past the part that covers it
                keep = ndimage.binary_erosion(keep, iterations=10) | (hole & ndimage.binary_dilation(ring, iterations=14))
                base[..., :3][hole] = rgb[hole]
                base[..., 3][hole & ~keep] = 0
            else:
                clear = hole.copy()
                if mode == "front" and name in KEEP:
                    yy, xx = np.mgrid[0:im.height, 0:im.width]
                    clear &= ((xx - pivot[0]) ** 2 + (yy - pivot[1]) ** 2) > KEEP[name] ** 2
                base[..., 3][clear] = 0
            entry["parts"].append(dict(name=name, mode=mode, pivot=list(pivot), offset=[int(x0), int(y0)]))
        if spec["face"]["eyes"]:
            fx, fy = spec["face"]["fur"]
            fur = [int(v) for v in a[fy - 2:fy + 3, fx - 2:fx + 3, :3].reshape(-1, 3).mean(axis=0)]
            entry["face"] = dict(eyes=[list(e) for e in spec["face"]["eyes"]], mouth=list(spec["face"]["mouth"]), fur=fur)
        Image.fromarray(base, "RGBA").save(f"{OUT}/{pose}_base.png")
        rig[pose] = entry
    json.dump(rig, open(f"{OUT}/rig.json", "w"), indent=1)
    return rig

def preview(rig, angles, path):
    """Rebuild each pose with the parts turned by test angles, to check the cuts."""
    tiles = []
    for pose, e in rig.items():
        W, H = e["size"]
        canvas = Image.new("RGBA", (W + 80, H + 80), (70, 40, 90, 255))
        base = Image.open(f"{OUT}/{pose}_base.png")
        def paste(part):
            p = Image.open(f"{OUT}/{pose}_{part['name']}.png")
            full = Image.new("RGBA", (W + 80, H + 80), (0, 0, 0, 0))
            full.paste(p, (part["offset"][0] + 40, part["offset"][1] + 40))
            ang = angles.get(part["name"], 0)
            full = full.rotate(-ang, center=(part["pivot"][0] + 40, part["pivot"][1] + 40), resample=Image.BICUBIC)
            canvas.alpha_composite(full)
        for part in e["parts"]:
            if part["mode"] == "behind": paste(part)
        canvas.alpha_composite(base, (40, 40))
        for part in e["parts"]:
            if part["mode"] != "behind": paste(part)
        tiles.append(canvas)
    Wt = sum(t.width for t in tiles)
    row = Image.new("RGB", (Wt, max(t.height for t in tiles)), "black")
    x = 0
    for t in tiles:
        row.paste(t, (x, 0)); x += t.width
    row.thumbnail((2000, 700))
    row.save(path)

if __name__ == "__main__":
    rig = run()
    preview(rig, {}, "/home/claude/shots/pup0.png")
    preview(rig, {"head": 8, "tail": 14, "arm": 70, "rod": -8, "feet": 12, "hand_a": -10, "hand_b": 8, "shovel": 14}, "/home/claude/shots/pup1.png")
    print("ok")
