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
    web={"xp_mult": 0.25, "loot_chance": 0.5, "ink_mult": 0.35, "stamp_ink": 5},
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
          "sell": {"common": 4, "uncommon": 10, "rare": 24, "epic": 60},
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

BG = dict(kevin="office", marco="city", maya="city", brokk="iceage", gaius="rome", edith="london", albrecht="medieval", vincenzo="chicago", slapton="hollywood", napoleon="france",
          cleocatra="egypt", blackbear="caribbean", astrid="norway", kenji="japan", emu="outback", troffea="medieval", joost="amsterdam", chad="office", bella="beach", florida="beach",
          lola="paris", morwenna="forest", sable="venice", jacko="beach", raspawtin="russia", madjack="normandy")
import wave2 as _w2
BG.update(_w2.BG)
C.update(
    jobs={"slots": [0, 0, 20, 50, 100, 150], "speed_div": 100, "luck_div": 100, "mastery_xp": 10, "mastery_speed": 0.01, "mastery_cap": 50, "wander_minutes": 15,
          # Smudge does the work, one place at a time; up to three heroes stand behind him as crew
          "crew_slots": [0, 15, 45], "crew_speed_div": 150, "crew_luck_div": 150, "solo_mult": 3.0},
    # everybody else can be sent home to their own era for a while and comes back with whatever they found
    exped={"slots": [0, 0, 30, 80, 150], "hours": [1, 4, 8], "rolls_per_hour": 7, "ink_per_hour": 260, "mastery_per_hour": 30},
    # making skills: turn what comes up into something a card can use
    making={"skills": ["Cooking", "Tinkering", "Restoring"], "recipes": [
        {"id": "supper", "skill": "Cooking", "level": 1, "name": "Fish supper", "text": "Three fish, fried. Gives back 15 energy for training.", "need": {"fish": 3}, "seconds": 60, "xp": 30, "gives": {"energy": 15}},
        {"id": "feast", "skill": "Cooking", "level": 15, "name": "Raid feast", "text": "A proper spread. Gives one raid ticket.", "need": {"fish": 8, "treasure": 1}, "seconds": 600, "xp": 220, "gives": {"ticket": 1}},
        {"id": "scrap", "skill": "Tinkering", "level": 1, "name": "Strip for parts", "text": "Five bits of junk become one spare part. Parts go into gear upgrades.", "need": {"junk": 5}, "seconds": 90, "xp": 40, "gives": {"parts": 1}},
        {"id": "fine", "skill": "Tinkering", "level": 20, "name": "Fine parts", "text": "Two spare treasures become three parts.", "need": {"treasure": 2}, "seconds": 300, "xp": 150, "gives": {"parts": 3}},
        {"id": "restore", "skill": "Restoring", "level": 1, "name": "Restore a relic", "text": "Six bits of junk and 30 gold, cleaned up into a cabinet piece you are missing.", "need": {"junk": 6, "gold": 30}, "seconds": 240, "xp": 90, "gives": {"cabinet": 1}},
        {"id": "shard", "skill": "Restoring", "level": 25, "name": "Piece a card together", "text": "Four spare treasures and 150 gold become one card shard.", "need": {"treasure": 4, "gold": 150}, "seconds": 900, "xp": 300, "gives": {"shard": 1}}],
        "speed_per_level": 0.01},
    # a hero wearing their own signature pieces: two gives a little, all three is "the full kit"
    kit={"two": 0.10, "three": 0.25, "speed": 0.10},
    # ---- pacing. Fresh crew: the first hours of work each day run at double speed, then the plain rate.
    #      The plain rate is lower than it used to be, so daily players gain and round-the-clock idlers lose a little.
    rested={"hours": 4, "mult": 2.0, "base": 0.65},
    # every duplicate summon gives a shard; shards call a missing hero by name. The odds themselves never change.
    shards={"per_dupe": 1, "cost": {"common": 2, "uncommon": 4, "rare": 8, "epic": 15, "legendary": 30, "absurd": 45, "unhinged": 80}},
    # rebirth: at 99, start the skill again at 1 for a permanent bonus
    rebirth={"max": 10, "xp_per": 0.10, "ink_per": 0.03},
    # weekly contracts: three hauling goals, new every Monday
    contracts={"count": 3, "need": [120, 250, 400], "shards": [2, 3, 5]},
    # the cabinet: one of each treasure on display. Each piece makes all ink worth a bit more; a finished place set speeds work there
    cabinet={"ink_per": 0.005, "set_speed": 0.10},
    energy={"max": 100, "regen_seconds": 180, "train_cost": 10, "cap_base": 10, "cap_per_card_level": 5},
    tonics=[{"id": "x_tonic_speed", "name": "Quickstep Tonic", "effect": "speed", "amount": 0.25, "minutes": 60, "cost": {"rarity": "common", "n": 8}, "text": "Every job runs 25% faster for an hour."},
            {"id": "x_tonic_luck", "name": "Lucky Dip Tonic", "effect": "luck", "amount": 0.5, "minutes": 60, "cost": {"rarity": "uncommon", "n": 4}, "text": "Better finds everywhere for an hour."},
            {"id": "x_tonic_xp", "name": "Bookworm Tonic", "effect": "xp", "amount": 0.5, "minutes": 60, "cost": {"rarity": "rare", "n": 2}, "text": "Half again as much skill xp for an hour."}],
    gear_up={"max": 5, "per_level": 0.15, "gold": [60, 150, 350, 800, 2000], "parts": [1, 2, 4, 7, 12]},
    raids={"tickets": 3, "regen_minutes": 120, "hp_mult": 8, "rounds": 20, "loot_rolls": 3, "loot_luck": 2.0,
           "bosses": [
             {"id": "tiber", "name": "The Tiber Thing", "place": "dock", "hp": 300, "attack": 35, "defense": 10, "gold": 120, "text": "Nobody has seen all of it. The part with the teeth is enough."},
             {"id": "tony", "name": "Big Tony's Boys", "place": "speakeasy", "hp": 340, "attack": 38, "defense": 12, "gold": 140, "text": "Four gentlemen who would like a word about the safe."},
             {"id": "vanguard", "name": "The Emu Vanguard", "place": "outback", "hp": 380, "attack": 36, "defense": 14, "gold": 160, "text": "They beat an army once. They would like to do it again."},
             {"id": "gary", "name": "Gary the Great White", "place": "bondi", "hp": 1200, "attack": 80, "defense": 40, "gold": 400, "text": "He is between the flags. That is the problem."},
             {"id": "nephew", "name": "The Doge's Nephew", "place": "vault", "hp": 1350, "attack": 85, "defense": 45, "gold": 450, "text": "Bad at guarding. Surprisingly good at fencing."},
             {"id": "well", "name": "The Thing Under the Well", "place": "blackforest", "hp": 1500, "attack": 90, "defense": 50, "gold": 500, "text": "It was buried for a reason. Smudge had a shovel."},
             {"id": "antlers", "name": "The Antlered Deep", "place": "fjord", "hp": 4000, "attack": 160, "defense": 100, "gold": 1400, "text": "Something under the ice has antlers. It also has opinions."},
             {"id": "brenda", "name": "Brenda, Back From Leave", "place": "closet", "hp": 4600, "attack": 175, "defense": 115, "gold": 1700, "text": "She has seen the state of the supply closet."},
           ]},
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
                       bio=h["bio"], fact=h.get("fact", ""), lines=h["lines"], bg=BG[h["id"]], stats=spread(C["card"]["hero_total"][h["rarity"]], ARCH[h["arch"]]),
                       gear=gear_ids, place=h["place"]))

# ---- era gear: five pieces per hero's time and place, wearable by anyone (see gear2.py)
import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gear2, junk
era_items, gear_sets = gear2.expand(C["gear"]["budget"])
hero_place = {h["id"]: h["place"] for h in HEROES}
for it in era_items:
    it["place"] = hero_place[it["era"]]; it["sell"] = C["gear"]["sell"][it["rarity"]]; art_desc = it.pop("desc"); items[it["id"]] = it
C["gear_sets"] = gear_sets
C["slots"] = {"general": ["weapon", "head", "body", "feet", "charm"], "own": ["weapon", "armor", "trinket"], "charm_level": 5}

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
    # junk: only sells. Local junk at a modest weight, rift junk rarely, and nothing in the cabinet.
    for k, wgt in ((p["id"], 6), ("rift", 1.2)):
        for i, (jn, gold, _art, fl) in enumerate(junk.JUNK.get(k, []) if p["skill"] != "Summoning" else []):
            jid = f"j_{k}_{i + 1}"
            items[jid] = dict(id=jid, name=jn, kind="loot", junk=True, rarity="common" if gold < 10 else "uncommon" if gold < 25 else "rare", icon=jid, flavor=fl, place=(p["id"] if k != "rift" else "archive"), sell=gold)
            table.append([jid, wgt if gold < 10 else wgt / 3 if gold < 25 else wgt / 12])
    for h in heroes:
        if h["place"] == p["id"]:
            for g in h["gear"]:
                table.append([g, C["gear"]["drop_weight"][items[g]["rarity"]]])
            for it in era_items:
                if it["era"] == h["id"]: table.append([it["id"], C["gear"]["drop_weight"][it["rarity"]]])
    places.append(dict(id=p["id"], name=p["name"], era=p["era"], skill=p["skill"], level=p["level"], tier=p["tier"], blurb=p["blurb"], loot=table))
items["x_crate"] = dict(id="x_crate", name="Rift Crate", kind="crate", rarity="rare", icon="x_crate", flavor="It fell out of a hole in time. It is ticking. Probably fine.", place="archive", sell=0)
for t in C["tonics"]:
    items[t["id"]] = dict(id=t["id"], name=t["name"], kind="tonic", rarity="uncommon", icon=t["id"], flavor=t["text"], place="archive", sell=0)
items["x_shard"] = dict(id="x_shard", name="Card Shard", kind="loot", rarity="uncommon", icon="x_shard", flavor="A corner of somebody who has already arrived.", place="archive", sell=C["card"]["shard_gold"])

out = dict(C, heroes=heroes, places=places, items=items)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
json.dump(out, open(os.path.join(root, "rules", "rules.json"), "w"), indent=1)
print(len(heroes), "heroes", len(places), "places", len(items), "items")
