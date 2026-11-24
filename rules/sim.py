"""Pacing simulation. Checks how long things take for different players."""
import json, random, os
R = json.load(open(os.path.join(os.path.dirname(__file__), "rules.json")))
XP = R["xp_table"]
def level(xp):
    l = 1
    while l < 99 and xp >= XP[l]: l += 1
    return l
def best_place(skill, lvl):
    ps = [p for p in R["places"] if p["skill"] == skill and p["level"] <= lvl]
    return max(ps, key=lambda p: p["tier"])
def perk(lvl, key):
    return sum(p.get(key, 0) for p in R["perks"] if lvl >= p["level"]) if key != "double" else max([p.get("double", 0) for p in R["perks"] if lvl >= p["level"]] + [0])

def skill_time(mode, rate, crew_speed=0.0):
    """mode desktop: rate = keys per day. mode web: rate = hours per day. Returns days to reach milestones in one skill."""
    xp, days, out = 0, 0.0, {}
    for target in (15, 40, 75, 99):
        while level(xp) < target:
            lvl = level(xp); t = R["tier"][str(best_place("Fishing", lvl)["tier"])]
            speed = 1 + perk(lvl, "speed") + crew_speed
            if mode == "desktop":
                eff = min(rate, R["daily_keys"]["full"]) + max(0, rate - R["daily_keys"]["full"]) * R["daily_keys"]["after"]
                per_day = eff / t["keys"] * speed * t["xp"]
            else:
                per_day = rate * 3600 / t["seconds"] * speed * t["xp"] * R["web"]["xp_mult"]
            need = XP[lvl] - xp
            step = min(need, per_day)   # at most one day per step
            xp += step; days += step / per_day
        out[target] = days
    return out

def summon_sim(keys_per_day, trials=200):
    """Days of typing at the Archive only to own all 24 heroes, and ink for the first 5."""
    w = R["summon"]["weights"]; res = []; first5 = []
    for _ in range(trials):
        owned, ink_spent, n = set(), 0, 0
        while len(owned) < len(R["heroes"]):
            cost = R["summon"]["base_ink"] + R["summon"]["per_unique"] * len(owned)
            ink_spent += cost; n += 1
            lvl = level(ink_spent * R["summon"]["xp_per_ink"])
            ws = {r: w[r] + (R["summon"]["luck_per_level"] * lvl if r in ("rare", "epic", "legendary") else 0) for r in w}
            r = random.choices(list(ws), list(ws.values()))[0]
            owned.add(random.choice([h["id"] for h in R["heroes"] if h["rarity"] == r]))
            if len(owned) == 5 and len(first5) < _ + 1: first5.append(ink_spent)
        res.append(ink_spent)
    res.sort()
    return sum(first5) / len(first5), res[len(res) // 2]

def gear_sim(place_id, lvl, luck=0.0, trials=300):
    """Actions to collect every signature item at a place."""
    p = next(x for x in R["places"] if x["id"] == place_id)
    ids = [i for i, _ in p["loot"]]
    ws = []
    for i, wt in p["loot"]:
        it = R["items"][i]
        boost = 1 + lvl * R["loot"]["luck_per_level"] + luck if it["rarity"] != "common" else 1
        ws.append(wt * boost)
    gear = {i for i in ids if R["items"][i]["kind"] == "gear"}
    out = []
    for _ in range(trials):
        got, n = set(), 0
        while got != gear:
            n += 1
            i = random.choices(ids, ws)[0]
            if i in gear: got.add(i)
        out.append(n)
    out.sort()
    return out[len(out) // 2], sum(ws[k] for k, i in enumerate(ids) if i in gear) / sum(ws)

if __name__ == "__main__":
    print("XP: L15", XP[14], "L40", XP[39], "L75", XP[74], "L99", XP[98])
    for name, mode, rate in [("casual typist 5k keys/day", "desktop", 5000), ("office typist 15k keys/day", "desktop", 15000), ("heavy typist 30k keys/day", "desktop", 30000),
                             ("macro at the key cap, 24h", "desktop", 14 * 86400), ("web idle 2h/day", "web", 2), ("web idle 8h/day, crew +40%", "web", 8), ("web 24h/day offline, crew +40%", "web", 24)]:
        r = skill_time(mode, rate, 0.4 if "crew" in name else 0)
        print(f"{name:32s} days to L15 {r[15]:7.1f}  L40 {r[40]:7.1f}  L75 {r[75]:8.1f}  L99 {r[99]:9.1f}")
    f5, allink = summon_sim(15000)
    print(f"summons: first 5 heroes {f5:,.0f} ink ({f5/15000:.1f} days at 15k keys); all 24 median {allink:,.0f} ink ({allink/15000:.0f} days)")
    for pid, lvl in [("dock", 10), ("vault", 30), ("fjord", 60)]:
        n, share = gear_sim(pid, lvl)
        t = R["tier"][str(next(p for p in R['places'] if p['id']==pid)['tier'])]
        print(f"{pid}: gear share of drops {share*100:.1f}%, all 9 signature items after ~{n} actions = {n*t['keys']/15000:.0f} days typing or {n*t['seconds']/3600/R['web']['loot_chance']:.0f} h web idle")
