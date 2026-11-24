import sys, json, concurrent.futures as cf, traceback
sys.path.insert(0,'.'); import _pl
IDLE = "Standing idle loop in place. Same pose, same position, feet stay planted and do not move. Subtle breathing, chest rises and falls, {extra} Seamless loop back to the first frame."
C = [
 dict(id="hunter", dir="east", size=128, seed=7102, desc="A Stone Age hunter, lean muscular man with wild dark hair and beard, fur pelt and hide wraps, bone necklace, bare calloused feet wrapped in hide, flint-tipped wooden spear held upright in right hand, a smoldering torch-brand on his belt. Wary, feral, sharp eyes.",
      idle="the fur pelt and hair stir slightly, spear hand tightens.", act="Thrusting the flint spear forward in a hard stab, lunging slightly then returning to the starting stance. Feet stay on the ground."),
 dict(id="legionary", dir="east", size=128, seed=7101, desc=None,
      idle="red crest and tunic hem sway slightly, shield arm shifts a little.", act="Bashing forward with the red shield then a short gladius stab, then returning to the starting guard stance. Feet stay on the ground."),
 dict(id="engineer", dir="east", size=128, seed=7103, desc="A Victorian engineer woman, brass goggles pushed up on a soot-smudged face, dark hair in a messy bun, leather work apron over a waistcoat and rolled shirt sleeves, long dark skirt and boots, holding a heavy brass wrench in one hand and a small ticking clockwork gadget in the other. Smug, competent.",
      idle="apron hem sways, the small gadget glows and ticks, she taps the wrench against her palm once.", act="Winding up and tossing the small brass clockwork gadget forward which sparks, then returning to the starting stance. Feet stay on the ground."),
 dict(id="gangster", dir="east", size=128, seed=7104, desc="A 1920s Prohibition gangster, sharp pinstripe three-piece suit, dark fedora with a band, loosened tie, two-tone shoes, a tommy gun held low at his hip, cigarette in mouth. Scar on cheek, cocky half-smile.",
      idle="cigarette smoke curls up, tie shifts, he rolls his shoulders.", act="Raising the tommy gun and firing a short burst forward with muzzle flash and recoil, then lowering back to the starting stance. Feet stay on the ground."),
 dict(id="paramedic", dir="east", size=128, seed=7105, desc="A modern paramedic woman, navy blue EMS uniform with reflective stripes and a patch, black cargo pants, black boots, nitrile gloves, stethoscope around neck, heavy red trauma bag slung on one shoulder, holding a defibrillator paddle. Exhausted, unflappable.",
      idle="trauma bag strap shifts, she flexes her gloved fingers.", act="Pulling a glowing green syringe from the bag and jabbing it forward, then returning to the starting stance. Feet stay on the ground."),
 dict(id="office_worker", dir="east", size=128, seed=7106, desc="A modern office worker man, rumpled white dress shirt, loose tie, khaki slacks, office shoes, blue company lanyard with an ID badge around his neck, holding a paper coffee cup in one hand and a red stapler in the other. Thinning hair, dead-eyed, mildly annoyed.",
      idle="lanyard badge swings slightly, he lifts the coffee cup a little and sips.", act="Swinging the red stapler forward like a weapon in a quick overhand strike, then returning to the starting stance with coffee still in hand. Feet stay on the ground."),
]
E = [
 dict(id="cellar_rat", dir="west", size=96, seed=7201, desc="A huge mangy cellar rat-thing the size of a dog, hunched on all four legs, patchy gray-brown fur, pink scabby tail, glowing sickly green eyes, yellow teeth, dripping sewer slime. Monster, not cute.",
      idle="whiskers twitch, it sniffs and its sides heave, tail flicks.", act="Lunging forward to bite with jaws snapping, then scuttling back to the starting pose. Paws stay on the ground.", hurt="Recoiling from a hit, flinching back with a squeal and flash, then recovering to the starting pose. Paws stay on the ground."),
 dict(id="ghoul", dir="west", size=128, seed=7202, desc="A ghoul from a cemetery dungeon, gaunt gray-green rotting humanoid in torn burial rags, long clawed hands, sunken glowing amber eyes, hunched, exposed ribs, rot moss growing on its shoulders. Menacing undead.",
      idle="it sways hunched, claws twitch, head tilts.", act="Winding up and slashing forward with its long claws in a heavy swing, then returning to the starting pose. Feet stay on the ground.", hurt="Staggering back from a hit, flinching with a pale flash, then recovering to the starting pose. Feet stay on the ground."),
 dict(id="boiler_boss", dir="west", size=160, seed=7203, desc="Boss: The Angry Boiler, a huge furious cast-iron steam boiler construct on stubby riveted iron legs, glowing furnace mouth full of fire like an angry face, two pipe arms with valve-wheel fists, pressure gauge eyes with needles in the red, leaking steam, soot and rust. Comedic but dangerous dungeon boss.",
      idle="steam puffs from its pipes, furnace fire flickers, gauge needles shake.", act="Slamming a valve-wheel pipe fist forward while blasting fire and steam from its furnace mouth, then returning to the starting pose. Legs stay on the ground.", hurt="Rattling from a hit, steam bursting out of loose rivets, flinching back, then recovering to the starting pose. Legs stay on the ground."),
]
N = [
 dict(id="clerk_pell", dir="east", size=128, seed=7301, desc="Mr. Pell, a fantasy kingdom Hero Office clerk, thin balding older man with half-moon spectacles, ink-stained fingers, dull green clerk robe with sleeve garters, a quill behind his ear, holding a big brass stamp and a stack of forms. Bored, bureaucratic, deeply unimpressed.",
      idle="he adjusts his spectacles and the forms shift slightly.", act="Raising the brass stamp and slamming it down hard onto the forms, then returning to the starting pose. Feet stay on the ground."),
]
results = {}
def job(spec, kind):
    out = {"id": spec["id"], "usage": 0.0, "errors": []}
    try:
        if spec["desc"]:
            p,u = _pl.still(spec["id"], spec["desc"], size=spec["size"], direction=spec["dir"], seed=spec["seed"])
        else:
            p,u = _pl.RAW/f"{spec['id']}.png", 0
        out["usage"] += u or 0
        anims = [("idle", IDLE.format(extra=spec["idle"])), ("attack", spec["act"])]
        if spec.get("hurt"): anims.append(("hurt", spec["hurt"]))
        def a(nm_act):
            nm, act = nm_act
            try:
                d,u = _pl.anim(f"{spec['id']}_{nm}", p, act, 8, seed=spec["seed"])
                return u or 0
            except Exception as e:
                out["errors"].append(f"{nm}: {e}"); return 0
        with cf.ThreadPoolExecutor(3) as ex:
            out["usage"] += sum(ex.map(a, anims))
    except Exception as e:
        out["errors"].append(traceback.format_exc()[-600:])
    print(json.dumps(out), flush=True)
    return out
allspecs = [(s,"origin") for s in C]+[(s,"enemy") for s in E]+[(s,"npc") for s in N]
with cf.ThreadPoolExecutor(5) as ex:
    res = list(ex.map(lambda t: job(*t), allspecs))
json.dump(res, open("_raw/run_results.json","w"), indent=1)
print("TOTAL", sum(r["usage"] for r in res))
