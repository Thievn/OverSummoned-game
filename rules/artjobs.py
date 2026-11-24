"""Builds the Grok art job list (SQL inserts for public.os_art_job) from content.py."""
import sys, json
sys.path.insert(0, "/home/claude/oversummoned-game/rules")
from content import HEROES, PLACES

STYLE = ("Art style: polished 2D cartoon game art with bold clean dark navy outlines, bright warm saturated colors, "
         "flat cel shading with two tones and a warm rim light, light painted texture. No text, no labels.")
HERO_STYLE = ("Draw it in exactly the art style of the reference otter image: bold clean dark navy outlines, bright warm saturated colors, "
              "flat cel shading with two tones and a warm rim light, light painted texture on cloth, an expressive cartoon face with eyes that have white highlights, "
              "and the same tall adventure-hero proportions (head about one third of the height). This is a different species: do not draw an otter. "
              "Cute but cool. Original character, not a real person. Polished 2D game character art, full body, three-quarter view, standing, centered on a plain pure white background, "
              "no text, no logos, no ground shadow.")
REF = "art/raw/sheet1/smudge_1.jpg"

LOOK = {
 "napoleon": "Napoleon Bone-apart, a short proud corgi emperor of France in 1805: dark blue military coat with gold epaulettes and white breeches, a big black bicorne hat, one paw tucked into his coat, chin up, standing on a tiny golden stepladder, smug frown",
 "cleocatra": "Cleocatra, an elegant adult Egyptian cat queen: sleek tan fur, gold and lapis headdress with a cobra, kohl-lined eyes, a white pleated gown with a wide gold collar, gold bracelets, holding a cobra scepter, bored regal expression, tall and glamorous",
 "blackbear": "Captain Blackbear, a huge burly black bear pirate captain from 1717: long dark red captain coat worn open over a bare furry muscular chest, tricorn hat, a big black beard with small smoking fuses tied into it, cutlass in one paw, crossed belts, fierce grin",
 "astrid": "Astrid Ironhowl, a tall athletic adult grey wolf Viking shield-maiden: braided silver mane, fur-trimmed leather armor that shows strong toned arms and midriff, blue war paint, a bearded axe on her shoulder and a round raven shield, confident smirk, powerful and attractive heroic build",
 "kenji": "Kenji Shibata, a shiba inu ronin samurai from 1640: worn indigo kimono and hakama, a straw kasa hat pushed back, katana in a red scabbard at his hip, a rice ball in one paw, serious noble face with curled tail",
 "emu": "General Emu, a tall proud emu military commander from 1932: an Australian army slouch hat with a feather, a row of oversized medals pinned to his chest feathers, a swagger stick under one wing, long strong legs, smug victorious stare",
 "troffea": "Frau Troffea, a hare peasant woman from 1518 caught mid-dance: green medieval dress with a twirling skirt, white headscarf, worn red shoes, a tambourine raised, wide slightly manic smile, dynamic spinning pose",
 "joost": "Joost van der Bloem, a chubby hamster Dutch merchant from 1637: black doublet with a huge white ruff collar, tall black hat, proudly holding up a single red and white striped tulip in a pot, cheeks stuffed, hopeful grin",
 "chad": "Chad Hodler, a lemming crypto bro: grey hoodie with a rocket print, backwards cap, mirrored sunglasses, gold chain, holding a phone showing a red falling chart line, both thumbs up, overconfident grin",
 "bella": "Bella Pawsworth, a tall glamorous adult pink flamingo influencer on a beach: hot pink bikini, big sunglasses pushed up on her head, long elegant legs standing on one leg, curvy pin-up figure, taking a selfie with a phone on a stick, pouty confident smile",
 "florida": "Florida Man, a big muscular alligator: shirtless with defined abs, cut-off denim shorts, flip-flops, a faded trucker cap, a rusty machete resting on his shoulder and a gas station slushie cup in the other hand, huge chaotic toothy grin",
 "lola": "Lola Vixen, a tall glamorous adult red fox cabaret dancer from Paris 1895: red sequined corset with black lace, feather boa, long black gloves, fishnet stockings, holding large pink ostrich feather fans, curvy pin-up figure, playful wink, a stolen gold pocket watch dangling from one finger",
 "morwenna": "Morwenna Duskwing, an elegant adult moth witch: pale fuzzy collar, large dark patterned moth wings worn like a cloak, feathery antennae, a black gothic dress with purple corset lacing, a pointed witch hat, holding a crooked wand and a small glowing lantern, heavy-lidded mysterious smile",
 "sable": "Sable Quickpaw, a lean raccoon master thief from Venice 1610: dark leather doublet open at the chest, short cape, a black and gold carnival half-mask pushed up on his forehead, a ring of skeleton keys in one paw and a dripping wet gold goblet in the other, sly grin, striped tail",
 "jacko": "Jacko Riley, a tall muscular kangaroo surf lifeguard: shirtless with defined abs, red board shorts, a red and yellow lifesaver cap, a white zinc stripe across his nose, a yellow rescue board under one arm, friendly confident grin",
}

jobs = []  # (path, prompt, refs, aspect, n)
for h in HEROES:
    if h["id"] in LOOK:
        jobs.append((f"art/raw/f/hero_{h['id']}", LOOK[h["id"]] + ". " + HERO_STYLE, [REF], "1:1", 1))

SCENE_HEAD = "A compact floating diorama scene isolated on a plain pure white background, wide composition, brightly lit with clear daylight-level colors, not dark: "
SCENE_TAIL = " Clean edges, nothing crumbling. Absolutely no characters, no animals, no people. " + STYLE
jobs.append(("art/raw/f/scene_archive", SCENE_HEAD + "a cozy candle-lit archive cellar with warm golden light: tall bookshelves along the back wall, candles, a stone flagstone floor. A large glowing teal magic summoning circle with runes is painted on the floor at the FRONT center of the scene, close to the viewer. Behind the circle there is a clear empty patch of floor with a small woven rug. Warm and inviting, well lit." + SCENE_TAIL, [], "2:1", 2))
for p in PLACES:
    if "scene" in p:
        extra = " The left-center of the ground is open and empty." if p["skill"] != "Fishing" else ""
        jobs.append((f"art/raw/f/scene_{p['id']}", SCENE_HEAD + p["scene"] + "." + extra + SCENE_TAIL, [], "2:1", 2))

SM = "Smudge the hooded otter apprentice, same character, same teal hood and cloak, same backpack with scrolls and quill, same art style as the reference, "
SM_TAIL = " Bold clean dark navy outlines, warm colors, flat cel shading. Plain pure white background, no other objects, no text, no ground shadow, no floor."
jobs.append(("art/raw/f/smudge_stamp", SM + "sitting cross-legged on the floor, front view facing the viewer, a big open leather ledger book lying flat on the floor in front of his crossed legs. His left paw rests on the page. His right arm is raised high out to the side, clearly away from his body with empty space around it, holding a wooden rubber stamp. He is looking down at the book with a focused little smile." + SM_TAIL, [REF], "1:1", 2))
jobs.append(("art/raw/f/smudge_sleep", SM + "fast asleep, curled up lying on his side directly on the ground like a sleeping cat, head resting on his own folded arms, eyes closed, peaceful smile, tail wrapped around his body, hood up. No book, no cushion, no bed." + SM_TAIL, [REF], "1:1", 2))
jobs.append(("art/raw/f/smudge_dig", SM + "in side view facing RIGHT, standing with knees bent, holding a long wooden shovel out in front of him with both hands. The shovel blade points down toward the ground on the right, and there is a clear gap of empty space between the shovel and his body. Determined grin, tongue out a little." + SM_TAIL, [REF], "1:1", 2))

def sheet(name, items):
    assert len(items) == 9, (name, len(items))
    lst = "; ".join(items)
    jobs.append((f"art/raw/f/icons_{name}", "A clean 3 by 3 grid of nine separate game loot icons on a plain pure white background, large even spacing, each icon centered in its own cell, nothing touching, no frames. In reading order, left to right, top to bottom: " + lst + ". Absolutely no characters, no animals, no people. " + STYLE, [], "1:1", 1))

SHEETS = {}
hs = HEROES
for i in range(0, 24, 3):
    trio = hs[i:i + 3]
    nm = "gear_" + "_".join(h["id"] for h in trio)
    SHEETS[nm] = [(f"{h['id']}_{g[1]}", g[2]) for h in trio for g in h["gear"]]
newloot = [(p["id"], l) for p in PLACES for l in p["loot"] if " " in l[1] or len(l[1]) > 20]
extras = [("x_crate", "a wooden treasure crate bound with glowing teal magic runes, closed"), ("x_crate_open", "the same wooden rune crate with its lid open and golden light and sparkles bursting out"),
          ("x_gold", "a thick gold coin embossed with a paw print"), ("x_ink", "a round glass bottle of glowing teal ink with a cork"),
          ("x_shard", "a torn glowing corner piece of a playing card"), ("x_stamp", "a wooden rubber stamp with a brass handle")]
flat = []
counters = {}
for pid, l in newloot:
    counters[pid] = counters.get(pid, 0) + 1
    flat.append((f"{pid}_{counters[pid]}", l[1]))
flat += extras
for i in range(0, len(flat), 9):
    SHEETS[f"loot_{i // 9 + 1}"] = flat[i:i + 9]
for nm, items in SHEETS.items():
    sheet(nm, [d for _, d in items])

if __name__ == "__main__":
    json.dump({k: [n for n, _ in v] for k, v in SHEETS.items()}, open("/home/claude/oversummoned-game/rules/sheets.json", "w"), indent=1)
    def q(s): return "'" + s.replace("'", "''") + "'"
    rows = []
    for path, prompt, refs, aspect, n in jobs:
        arr = "array[" + ",".join(q(r) for r in refs) + "]::text[]"
        rows.append(f"({q(path)},{q(prompt)},{arr},{q(aspect)},{n})")
    open("/tmp/artjobs.sql", "w").write("insert into public.os_art_job(path,prompt,refs,aspect,n) values\n" + ",\n".join(rows) + "\nreturning id, path;")
    print(len(jobs), "jobs", len(flat), "loot icons", list(SHEETS))
