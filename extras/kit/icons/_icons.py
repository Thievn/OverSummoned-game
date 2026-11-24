import sys, json, concurrent.futures as cf
import importlib.util
spec = importlib.util.spec_from_file_location("g", "/workspace/thievns-den-assets/_generate.py")
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
from pathlib import Path
RAW=Path("raw")
STYLE=("Classic RPG loot inventory icon, 32x32 pixel art, crisp hard pixels, no anti-aliasing, 1 pixel dark outline, "
 "light from the upper left, limited muted dark-fantasy palette (soot, stone, dried blood, aged gold, ember orange) with small bright accents, "
 "single object centered with 2 pixels of empty space around it, transparent background, no text, no letters.")
ITEMS=[
 ("rusty_gladius","Common","Rusty Gladius","a short Roman gladius sword drawn diagonally at 45 degrees, pitted rusty iron blade, worn wooden grip and round pommel"),
 ("hobnailed_caligae","Uncommon","Hobnailed Caligae","a single Roman leather strap sandal boot with iron hobnails on the sole, side view"),
 ("hi_vis_vest","Uncommon","Hi-Vis Vest","a small sleeveless safety vest shaped like a tank top, bright neon yellow fabric with two horizontal silver reflective stripes, front view, small and centered with empty space around it"),
 ("beak_mask","Rare","Beak Mask of Doctor Albrecht","a plague doctor beak mask, dark leather, long curved beak, two round brass-rimmed glass eye lenses, side three-quarter view"),
 ("trench_lantern","Rare","Trench Lantern","an old square hurricane oil lantern with a metal frame, a clear glass chimney with a warm orange flame inside, and a round wire carrying handle on top"),
 ("duelling_rapier","Rare","Duelling Rapier, Far Too Fancy","an absurdly ornate Renaissance rapier diagonal at 45 degrees, thin silver blade, elaborate gold swept-hilt cage with a red tassel"),
 ("violin_case","Epic","The Violin Case","a black 1920s violin case, slightly open, with the barrel of a tommy gun poking out, brass latches"),
 ("defib_paddles","Epic","Defibrillator Paddles","two rectangular defibrillator paddles with black handles and silver metal plates, crossed in an X, small blue electric sparks between them"),
 ("shield_lost_ninth","Legendary","Shield of the Lost Ninth","a curved Roman scutum shield, deep red with gold eagle-wing emblem and central iron boss, battle-scarred, front view"),
 ("black_ledger","Legendary","The Black Ledger's Ledger","a thick black leather ledger book bound with iron clasps and a small padlock, gold coins spilling from the pages"),
 ("pocket_trebuchet","Absurd","Pocket Trebuchet","a tiny handheld wooden medieval trebuchet siege engine with a little sling and a pebble, comically small"),
 ("inflatable_tube_man","Absurd","Inflatable Tube Man","a wacky waving inflatable tube man, bright red, arms flailing, on a small black blower base"),
 ("second_moon","Unhinged","A Second Moon (Small)","a simple round grey stone moon sphere with a few craters, softly glowing pale blue-white, perfectly round ball, no face, nothing else"),
 ("group_chat","Unhinged","The Group Chat","a black smartphone standing upright with a cracked glowing screen, three small white speech bubbles floating above it and a red notification dot on its corner"),
]
def run(it):
    fid,rar,name,desc=it
    out=RAW/f"{fid}.png"
    if out.exists(): return fid,0
    img,u=g.pixen(f"{STYLE} {desc}",32,32,no_background=True,view=None,direction=None,seed=9300+ITEMS.index(it))
    img.save(out); return fid,g.usage_gens(u)
if __name__=="__main__":
    only=sys.argv[1:] 
    its=[i for i in ITEMS if not only or i[0] in only]
    with cf.ThreadPoolExecutor(6) as ex:
        for r in ex.map(run,its): print(r,flush=True)
    json.dump([dict(id=i[0],rarity=i[1],name=i[2]) for i in ITEMS],open("items.json","w"),indent=1)
