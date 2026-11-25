"""Art jobs for wave two: ten heroes, ten card backdrops, eighty gear icons (nine to a green-screen sheet)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import wave2 as W
G = "a plain flat solid pure bright green (#00FF00) chroma-key background. The same flat green shows through every gap, hole and opening in and between the objects. Nothing on the objects themselves is green-screen green; use teal, olive or dark forest green instead. No shadows on the background"
STYLE = "Art style: polished 2D cartoon game art with bold clean dark navy outlines, bright warm saturated colors, flat cel shading with two tones and a warm rim light, light painted texture. No text, no letters, no logos, no labels."
REF = "art/raw/sheet1/smudge_1.jpg"
HS = ("Draw it in exactly the art style of the reference otter image: bold clean dark navy outlines, bright warm saturated colors, flat cel shading with two tones and a warm rim light, an expressive cartoon face with eyes that have white highlights, tall adventure-hero proportions (head about one third of the height). This is a different species: do not draw an otter. Cute but cool. Original character, not based on any existing cartoon, comic, film or toy character. Fully clothed, no nudity. Full body, three-quarter view, standing, arms held a little away from the body, nothing cropped, centered on " + G + ". No text, no ground shadow.")
jobs = []
for k, v in W.LOOK.items(): jobs.append((f"art/raw/w/hero_{k}", v + ". " + HS, [REF], "1:1", 2))
for k, v in W.BGLOOK.items(): jobs.append((f"art/raw/w/bg_{k}", "A soft painterly background illustration for a trading card, portrait orientation: " + v + ". Slightly out of focus and atmospheric, simplified shapes, rich but muted colors, darker toward the bottom and the corners, an open empty area in the center where a character will stand. No characters, no animals, no people, no text, no frame. Painted 2D game art style.", [], "3:4", 1))
items = []
for h in W.HEROES:
    for name, slot, desc, _ in h["gear"]: items.append((f"{h['id']}_{slot}", desc))
    for slot, name, _, desc, _ in W.ERA[h["id"]][5]: items.append((f"e_{h['id']}_{slot}", desc))
while len(items) % 9: items.append(("_spare%d" % len(items), "a small wooden treasure chest with brass bands"))
sheets = {}
for i in range(0, len(items), 9):
    nm = "w%02d" % (i // 9 + 1); sheets[nm] = [k for k, _ in items[i:i + 9]]
    jobs.append((f"art/raw/w/icons_{nm}", "A clean 3 by 3 grid of nine separate game loot icons, large even spacing, each icon centered in its own cell, nothing touching, no frames, on " + G + ". In reading order, left to right, top to bottom: " + "; ".join(f"{n + 1}) {d}" for n, (_, d) in enumerate(items[i:i + 9])) + ". Absolutely no characters, no animals, no people. " + STYLE, [], "1:1", 1))
root = os.path.dirname(os.path.abspath(__file__))
json.dump(sheets, open(os.path.join(root, "sheets_w.json"), "w"), indent=1)
json.dump([dict(path=p, prompt=pr, refs=r, aspect=a, n=n) for p, pr, r, a, n in jobs], open(os.path.join(root, "artjobs_w.json"), "w"))
print(len(jobs), "jobs", len(items), "icons")
