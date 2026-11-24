"""Builds rules.json from content.py. Both the desktop app and the website load
this one file, so the numbers can never drift apart. Run: python3 rules/build.py"""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from content import HEROES, PLACES, ARCH

RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "absurd", "unhinged"]
C = dict(
    version=3,
    rarities=RARITIES,
    rarity_color={"common": "#9aa3b8", "uncommon": "#3ecf6b", "rare": "#4a8dff", "epic": "#b06bff", "legendary": "#ff9a2e", "absurd": "#ff4fb4", "unhinged": "#ff3b30"},
    stats=["attack", "defense", "health", "speed", "luck"],
    skills=["Summoning", "Fishing", "Lockpicking", "Digging"],
    # ---- pacing
    tier={  # per place tier: desktop keys per action, web seconds per action, xp per action, ink per action
        "1": {"keys": 150, "seconds": 20, "xp": 40, "ink": 60},
        "2": {"keys": 200, "seconds": 30, "xp": 110, "ink": 110},
        "3": {"keys": 260, "seconds": 45, "xp": 320, "ink": 200},
    },
    lock_pins=5,
    max_keys_per_second=14,
    daily_keys={"full": 40000, "after": 0.05},   # keys past the daily amount count for 5% (stops macros, never hits a real typist)
    web={"xp_mult": 0.5, "loot_chance": 0.5, "ink_mult": 0.5},
    # ---- summoning
    summon={"base_ink": 3000, "per_unique": 400, "xp_per_ink": 0.25,
            "weights": {"common": 50, "uncommon": 28, "rare": 14, "epic": 6, "legendary": 1.6, "absurd": 0.35, "unhinged": 0.05},
            "luck_per_level": 0.0},   # the odds are the odds: published, and they never move
    # ---- cards
    card={"max_level": 10, "stat_per_level": 0.08, "shard_gold": 25,
          "hero_total": {"common": 50, "uncommon": 62, "rare": 76, "epic": 92, "legendary": 110, "absurd": 130, "unhinged": 155}},
    # ---- gear
    gear={"budget": {"common": 5, "uncommon": 8, "rare": 14, "epic": 22, "legendary": 32, "absurd": 42, "unhinged": 55},
          "signature_bonus": 0.5,
          "skill_speed": {"common": 1, "uncommon": 2, "rare": 4, "epic": 6, "legendary": 10, "absurd": 13, "unhinged": 16},
          "drop_weight": {"common": 1.2, "uncommon": 0.75, "rare": 0.375, "epic": 0.15, "legendary": 0.06, "absurd": 0.03, "unhinged": 0.012},
          "sell": {"common": 15, "uncommon": 30, "rare": 80, "epic": 220, "legendary": 600, "absurd": 1500, "unhinged": 4000}},
    loot={"weight": {"common": 20, "uncommon": 9, "rare": 4, "epic": 1},
          "sell": {"common": 5, "uncommon": 18, "rare": 45, "epic": 150},
          "luck_per_level": 0.01},   # each skill level: +1% weight on everything above common
    # ---- crew (web)
    crew={"slots": 3, "speed_div": 400, "speed_cap": 0.75, "luck_div": 300, "offline_hours": 12},
    # ---- perks by skill level
    perks=[
        {"level": 10, "name": "Double Haul", "text": "10% chance of a second item", "double": 0.10},
        {"level": 25, "name": "Quick Paws", "text": "10% faster", "speed": 0.10},
        {"level": 50, "name": "Double Haul II", "text": "20% chance of a second item", "double": 0.20},
        {"level": 75, "name": "Nose for Treasure", "text": "+25% luck", "luck": 0.25},
        {"level": 99, "name": "Mastery", "text": "Mastery cape, +10% speed and luck", "speed": 0.10, "luck": 0.10},
    ],
    # ---- rift crate
    crate={"minutes": 30, "rolls": 3, "luck": 1.0, "gold": [50, 150], "ink": 300},
    # ---- expeditions (web)
    expedition={"lengths": [{"id": "short", "name": "Quick Raid", "minutes": 15, "rolls": 2, "gold": 30},
                            {"id": "medium", "name": "Day Trip", "minutes": 60, "rolls": 6, "gold": 100},
                            {"id": "long", "name": "Grand Tour", "minutes": 240, "rolls": 18, "gold": 320}],
                "power_needed": {"1": 60, "2": 140, "3": 260}, "min_chance": 0.10, "max_chance": 0.95, "luck": 0.5,
                "slots": [{"total_level": 0}, {"total_level": 50}, {"total_level": 150}]},
    # ---- gold
    gold={"daily_sell_cap_base": 2000, "daily_sell_cap_per_level": 20, "ink_pack": {"gold": 100, "ink": 250}},
)

def xp_for_level(level):
    total = 0.0
    for l in range(1, level):
        total += math.floor(l + 300.0 * 2 ** (l / 7.0))
    return int(math.floor(total / 4.0))
C["xp_table"] = [xp_for_level(l) for l in range(1, 100)]   # xp needed to BE level index+1

def spread(total, weights):
    vals = [round(total * w) for w in weights]
    vals[0] += total - sum(vals)
    return dict(zip(C["stats"], vals))

SLOT_SPREAD = {"weapon": (0.7, 0, 0, 0.3, 0), "armor": (0, 0.5, 0.5, 0, 0), "trinket": (0, 0, 0, 0.4, 0.6)}
place_by_id = {p["id"]: p for p in PLACES}
items, heroes = {}, []
for h in HEROES:
    gear_ids = []
    gear_rarity = h["rarity"] if h["rarity"] != "common" else "uncommon"
    for name, slot, _art, flavor in h["gear"]:
        iid = f"{h['id']}_{slot}"
        it = dict(id=iid, name=name, kind="gear", slot=slot, rarity=gear_rarity, icon=iid, flavor=flavor, owner=h["id"],
                  place=h["place"], stats={k: v for k, v in spread(C["gear"]["budget"][gear_rarity], SLOT_SPREAD[slot]).items() if v},
                  sell=C["gear"]["sell"][gear_rarity])
        if slot == "trinket":
            it["equip"] = {"skill": place_by_id[h["place"]]["skill"], "speed": C["gear"]["skill_speed"][gear_rarity]}
        items[iid] = it
        gear_ids.append(iid)
    heroes.append(dict(id=h["id"], name=h["name"], title=h["title"], era=h["era"], species=h["species"], rarity=h["rarity"],
                       bio=h["bio"], lines=h["lines"], stats=spread(C["card"]["hero_total"][h["rarity"]], ARCH[h["arch"]]),
                       gear=gear_ids, place=h["place"]))

places = []
for p in PLACES:
    table, n = [], 0
    for l in p["loot"]:
        name, art, rarity, flavor = l
        old = not (" " in art)
        n += 0 if old else 1
        iid = art if old else f"{p['id']}_{n}"
        items[iid] = dict(id=iid, name=name, kind="loot", rarity=rarity, icon=iid, flavor=flavor, place=p["id"], sell=C["loot"]["sell"][rarity])
        table.append([iid, C["loot"]["weight"][rarity]])
    for h in heroes:
        if h["place"] == p["id"]:
            for g in h["gear"]:
                table.append([g, C["gear"]["drop_weight"][items[g]["rarity"]]])
    places.append(dict(id=p["id"], name=p["name"], era=p["era"], skill=p["skill"], level=p["level"], tier=p["tier"], blurb=p["blurb"], loot=table))
items["x_shard"] = dict(id="x_shard", name="Card Shard", kind="loot", rarity="uncommon", icon="x_shard", flavor="A corner of somebody who has already arrived.", place="archive", sell=C["card"]["shard_gold"])

out = dict(C, heroes=heroes, places=places, items=items)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
json.dump(out, open(os.path.join(root, "rules", "rules.json"), "w"), indent=1)
print(len(heroes), "heroes", len(places), "places", len(items), "items")
