"""What a day on the desktop pet is worth, next to a day of the browser game.

The pet must be a bonus, never the best way to play, so this prints the two side by side and
checks the pet stays well under the game. Run it after changing anything in desktop-pet2/pet.json.

  python3 rules/sim_pet.py
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = json.load(open(os.path.join(ROOT, 'data', 'rules.json')))
P = json.load(open(os.path.join(ROOT, 'desktop-pet2', 'pet.json')))

# what a typing day looks like. 2,000 keys is a light day of email; 40,000 is the daily cap and
# nobody reaches it by hand.
DAYS = [("a light day", 2000), ("a normal day", 9000), ("a heavy day", 20000), ("the daily cap", 40000)]
IDLE_HOURS = 2.0
TIER = "2"                       # a middling place
SPEED = 1.5                      # a player a few weeks in


def idle(hours):
    """Finds and ink from leaving the browser game running, with nobody watching."""
    secs = float(R["tier"][TIER]["seconds"]) / SPEED
    hauls = hours * 3600.0 / secs
    crates = hours * 60.0 / float(R["crate"]["minutes"])
    rolls = hauls + crates * float(R["crate"]["rolls"])
    gold = crates * (sum(R["crate"]["gold"]) / 2.0)
    ink = crates * float(R["crate"]["ink"])
    return {"rolls": rolls, "gold": gold, "ink": ink}


def pet(keys):
    c = P["chest"]
    full = float(P["daily_full"])
    worth = min(keys, full) + max(0.0, keys - full) * float(P["after_daily"])
    chests = worth / float(c["keys"])
    return {
        "chests": chests,
        "rolls": chests * float(c["rolls"]),
        "gold": chests * (sum(c["gold"]) / 2.0),
        "ink": worth * float(P["ink_per_key"]),
    }


def main():
    base = idle(IDLE_HOURS)
    cost = float(R["summon"]["base_ink"]) + 25 * float(R["summon"]["per_unique"])
    print("Two hours of the browser game left running, nobody watching:")
    print("  %5.0f finds   %6.0f gold   %6.0f ink  (%.1f summons)" % (base["rolls"], base["gold"], base["ink"], base["ink"] / cost))
    print()
    print("A day on the desktop pet (chest every %d keys, %d finds a chest):" % (P["chest"]["keys"], P["chest"]["rolls"]))
    ok = True
    for name, keys in DAYS:
        d = pet(keys)
        share = d["rolls"] / base["rolls"] * 100.0
        print("  %-14s %6d keys  %4.1f chests  %5.1f finds  %5.0f gold  %6.0f ink (%.1f summons)  = %4.0f%% of those two hours"
              % (name, keys, d["chests"], d["rolls"], d["gold"], d["ink"], d["ink"] / cost, share))
        if name == "a normal day" and share > 35.0:
            ok = False
    print()
    print("Rules this has to keep:")
    checks = [
        ("a normal day is well under two idle hours", pet(9000)["rolls"] / base["rolls"] < 0.35),
        ("even the daily cap is under a full idle day", pet(40000)["rolls"] < idle(24.0)["rolls"] * 0.25),
        ("a light day still brings something", pet(2000)["chests"] >= 1.0),
        ("typing past the cap is nearly worthless", pet(80000)["chests"] - pet(40000)["chests"] < 2.0),
    ]
    for label, good in checks:
        print("  %s  %s" % ("PASS" if good else "FAIL", label))
        ok = ok and good
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
