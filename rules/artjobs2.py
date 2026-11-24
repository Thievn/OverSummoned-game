"""Round two art jobs: every icon on a green screen, new heroes, card backdrops."""
import json, sys
sys.path.insert(0, "/home/claude/oversummoned-game/rules")
from content import HEROES, PLACES
G = "a plain flat solid pure bright green (#00FF00) chroma-key background. The same flat green shows through every gap, hole and opening in and between the objects. Nothing on the objects themselves is green-screen green. No shadows on the background"
STYLE = "Art style: polished 2D cartoon game art with bold clean dark navy outlines, bright warm saturated colors, flat cel shading with two tones and a warm rim light, light painted texture. No text, no labels."
OLD = {"bath_carp": "a golden carp fish", "bath_eel": "a dark blue eel with glowing teal spots", "bath_coin": "a silver Roman denarius coin", "bath_scroll": "a wet rolled papyrus scroll", "bath_strigil": "a curved bronze Roman strigil scraper",
       "bath_lamp": "a small Roman clay oil lamp with a flame", "bath_vial": "a small pink glass perfume vial with a stopper", "bath_wreath": "a golden laurel wreath", "bath_nose": "a broken-off marble statue nose, pale grey stone",
       "easy_chips": "a stack of red, blue and black poker chips", "easy_moonshine": "a clear glass jug of moonshine with XXX on a brown label, cork", "easy_bills": "a banded stack of green dollar bills, dark forest green", "easy_envelope": "a cream sealed envelope with a red wax seal",
       "easy_knuckles": "brass knuckles", "easy_fedora": "a grey fedora hat with a feather", "easy_watch": "a gold pocket watch on a chain", "easy_pearls": "a pearl necklace, cream pearls", "easy_ring": "a diamond ring in an open red velvet box"}
EXTRA = {"x_crate": "a wooden treasure crate bound with glowing teal magic runes, closed", "x_crate_open": "a wooden rune crate with its lid open and golden light and sparkles bursting out", "x_gold": "a thick gold coin embossed with a paw print",
         "x_ink": "a round glass bottle of glowing teal ink with a cork", "x_shard": "a torn glowing purple corner piece of a playing card", "x_stamp": "a wooden rubber stamp with a brass handle",
         "x_tonic_speed": "a tall thin potion bottle of fizzing yellow liquid with a lightning bolt charm", "x_tonic_luck": "a round potion bottle of sparkling pink liquid with a four-leaf clover charm, the clover is dark teal",
         "x_tonic_xp": "a square potion bottle of glowing blue liquid with a tiny book charm", "x_energy": "an orange lightning bolt in a round brass badge", "x_ticket": "a red and gold raid ticket stub with a skull stamp",
         "x_key": "an ornate golden key with a teal gem", "x_sword": "two crossed steel swords", "x_anvil": "a small iron anvil with a hammer", "x_dumbbell": "a heavy iron dumbbell", "x_map": "a rolled treasure map with a red X",
         "x_friends": "two cartoon paw prints side by side, one teal one gold", "x_trophy": "a golden trophy cup"}
items = []
for h in HEROES:
    for g in h["gear"]: items.append((f"{h['id']}_{g[1]}", g[2]))
n = {}
for p in PLACES:
    for l in p["loot"]:
        if " " in l[1]:
            n[p["id"]] = n.get(p["id"], 0) + 1; items.append((f"{p['id']}_{n[p['id']]}", l[1]))
items += list(OLD.items()) + list(EXTRA.items())
while len(items) % 9: items.append((f"x_pad{len(items)}", "a small gold star"))
jobs, sheets = [], {}
for i in range(0, len(items), 9):
    nm = f"g{i // 9 + 1:02d}"; sheets[nm] = [a for a, _ in items[i:i + 9]]
    jobs.append((f"art/raw/g/icons_{nm}", "A clean 3 by 3 grid of nine separate game loot icons, large even spacing, each icon centered in its own cell, nothing touching, no frames, on " + G + ". In reading order, left to right, top to bottom: " + "; ".join(d for _, d in items[i:i + 9]) + ". Absolutely no characters, no animals, no people. " + STYLE, [], "1:1", 1))
REF = "art/raw/sheet1/smudge_1.jpg"
HS = ("Draw it in exactly the art style of the reference otter image: bold clean dark navy outlines, bright warm saturated colors, flat cel shading with two tones and a warm rim light, an expressive cartoon face with eyes that have white highlights, tall adventure-hero proportions (head about one third of the height). This is a different species: do not draw an otter. Cute but cool. Original character. Full body, three-quarter view, standing, arms held a little away from the body, centered on " + G + ". No text, no ground shadow.")
LOOK = {
 "morwenna": "Morwenna Duskwing, an elegant adult anthropomorphic MOTH witch, clearly an insect: a soft fluffy cream-white moth head with two huge round glossy black compound eyes, two long feathery comb-like antennae, no snout, no nose, no ears, no whiskers, no tail, four slim fuzzy arms, large dusty grey-and-purple moth wings open behind her, a black gothic dress with purple corset lacing, a small pointed witch hat between the antennae, holding a crooked wand and a small glowing lantern, mysterious little smile",
 "chad": "Chad Hodler, a LEMMING crypto bro: a tiny round fluffy golden-brown and black arctic rodent with small round ears, short stubby tail, big buck teeth and beady eyes, wearing an oversized grey hoodie with a rocket print, a backwards cap, mirrored sunglasses and a gold chain, holding a phone showing a red falling chart, one thumb up, overconfident grin",
 "raspawtin": "Raspawtin, a very tall gaunt borzoi (Russian wolfhound) mystic from 1916: long narrow snout, long wild black hair and a long scraggly black beard, enormous piercing pale blue hypnotic eyes, a long black monk robe with a rope belt and a heavy silver cross, one hand raised with long fingers, a half-eaten tea cake in the other, unsettling calm smile",
 "madjack": "Mad Jack Ramsbottom, a burly ram British army officer from 1944: big curled horns, a khaki WWII officer battledress uniform and a tam o'shanter cap, a tartan set of bagpipes under one arm, a basket-hilted broadsword raised in the other hand, a longbow and quiver on his back, a wild delighted battle grin",
}
for k, v in LOOK.items(): jobs.append((f"art/raw/g/hero_{k}", v + ". " + HS, [REF], "1:1", 2))
BG = {"office": "a modern open-plan office with cubicles, a water cooler and fluorescent light", "city": "a modern city street at dusk with shop lights and a bike lane", "iceage": "an Ice Age tundra with snow, distant mammoths and an aurora",
      "rome": "ancient Rome with marble columns, a red banner and warm sun", "london": "Victorian London with an iron bridge, gas lamps, fog and brick chimneys", "medieval": "a medieval European town square with timber houses and a church spire under a grey sky",
      "chicago": "a 1920s Chicago street at night with a neon speakeasy sign, brick walls and a vintage car", "hollywood": "a Hollywood red carpet premiere with searchlights, palm trees and camera flashes", "france": "a Napoleonic battlefield camp with tricolor flags, tents and cannon smoke at sunset",
      "egypt": "ancient Egypt with a palace terrace on the Nile, palm trees, obelisks and golden light", "caribbean": "a Caribbean pirate cove with a tall ship, palm trees and a turquoise sea", "norway": "a Viking fjord with snowy mountains, a longship and a wooden hall",
      "japan": "Edo Japan with a red torii gate, cherry blossom, a pagoda and Mount Fuji", "outback": "the Australian outback with red earth, gum trees and a huge sunset sky", "amsterdam": "1600s Amsterdam with canal houses, a windmill and fields of tulips",
      "beach": "a sunny tropical beach with palm trees, pastel lifeguard tower and turquoise waves", "paris": "an 1890s Paris cabaret stage with red velvet curtains, gold footlights and a windmill silhouette", "forest": "a dark fairytale forest at night with twisted trees, a full moon, fireflies and a crooked cottage",
      "venice": "Venice at carnival with a canal, gondolas, a stone bridge and lanterns", "russia": "a snowy St Petersburg palace at night with onion domes and a frozen river", "normandy": "a 1944 Normandy beach at dawn with landing craft, sea mist and searchlights"}
for k, v in BG.items():
    jobs.append((f"art/raw/g/bg_{k}", "A soft painterly background illustration for a trading card, portrait orientation: " + v + ". Slightly out of focus and atmospheric, simplified shapes, rich but muted colors, darker toward the bottom and the corners, an open empty area in the center where a character will stand. No characters, no animals, no people, no text, no frame. Painted 2D game art style.", [], "3:4", 1))
json.dump(sheets, open("/home/claude/oversummoned-game/rules/sheets2.json", "w"), indent=1)
json.dump([dict(path=p, prompt=pr, refs=r, aspect=a, n=n) for p, pr, r, a, n in jobs], open("/home/claude/oversummoned-game/rules/artjobs.json", "w"))
print(len(jobs), "jobs", len(items), "icons", len(sheets), "sheets")
