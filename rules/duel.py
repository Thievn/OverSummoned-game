"""Duels (O8): groups, arenas, Moves and every duel number.

Read by build.py: each hero gains `arch`, `age`, `kin` and `move`; rules.json gains `duel`.
The engine is js/duel-engine.mjs; the balance check is rules/sim_duel.mjs. Plan: PLAN-CITY-DUELS.md, sections 2 and 3.

Move names and lines here are STAND-INS (F7 writes the real ones). Fable changes `name` and `text` only.
Effect fields (`fx`, `on`, `x`, `stat`, `group`, `n`) are Opus's and are tuned by the sim.
"""

# ---- groups: age (when they are from) and kin (what they are). Every group has at least four heroes.
AGES = {
    "ancient": "Ancient",          # before 500
    "oldworld": "Old World",       # 500 to 1700
    "steam": "Sail and Steam",     # 1700 to 1900
    "wartime": "Wartime",          # 1900 to 1950
    "neon": "Neon",                # 1950 to 1999
    "today": "Today and Beyond",   # now, and the two who are from nowhere at all
}
KINS = {
    "dogs": "Dogs and Wolves",
    "cats": "Cats",
    "birds": "Birds",
    "small": "Small Things",
    "weasels": "Weasel Kin",
    "hoofed": "Hoofed",
    "water": "Water Folk",
    "odd": "Odd Ones",
}
AGE = {
    "brokk": "ancient", "gaius": "ancient", "cleocatra": "ancient", "gladius": "ancient", "tut": "ancient",
    "albrecht": "oldworld", "astrid": "oldworld", "kenji": "oldworld", "troffea": "oldworld", "joost": "oldworld",
    "morwenna": "oldworld", "sable": "oldworld", "bjorn": "oldworld", "mona": "oldworld", "selene": "oldworld",
    "edith": "steam", "napoleon": "steam", "blackbear": "steam", "lola": "steam", "hootsworth": "steam", "quack": "steam",
    "vincenzo": "wartime", "emu": "wartime", "raspawtin": "wartime", "madjack": "wartime", "flap": "wartime",
    "dusty": "wartime", "sterling": "wartime", "dolly": "wartime", "slapton": "wartime",
    "vesper": "neon", "roxy": "neon", "jazzmin": "neon", "stella": "neon", "pam": "neon", "gorm": "neon",
    "max": "neon", "rex": "neon", "ajolote": "neon",
    "kevin": "today", "marco": "today", "maya": "today", "chad": "today", "bella": "today", "florida": "today",
    "jacko": "today", "doug": "today", "eagleton": "today", "beep": "today", "zorp": "today",
}
KIN = {
    "marco": "dogs", "maya": "dogs", "gaius": "dogs", "napoleon": "dogs", "kenji": "dogs", "raspawtin": "dogs",
    "jazzmin": "dogs", "rex": "dogs", "astrid": "dogs", "lola": "dogs",
    "cleocatra": "cats", "stella": "cats", "gladius": "cats", "selene": "cats",
    "albrecht": "birds", "slapton": "birds", "emu": "birds", "bella": "birds", "flap": "birds",
    "hootsworth": "birds", "quack": "birds", "eagleton": "birds",
    "joost": "small", "chad": "small", "pam": "small", "vesper": "small", "edith": "small", "dusty": "small",
    "sable": "small", "troffea": "small",
    "vincenzo": "weasels", "sterling": "weasels", "brokk": "weasels", "roxy": "weasels",
    "madjack": "hoofed", "gorm": "hoofed", "dolly": "hoofed", "tut": "hoofed", "max": "hoofed",
    "ajolote": "water", "bjorn": "water", "doug": "water", "florida": "water",
    "kevin": "odd", "blackbear": "odd", "jacko": "odd", "morwenna": "odd", "mona": "odd", "beep": "odd", "zorp": "odd",
}

# ---- arenas: one per place. `w` is how often each stat is called there (attack, defense, health, speed, luck);
# `bonus` is the group that plays 20% stronger in that arena.
ARENAS = {
    "dock":        dict(w=(3, 2, 2, 2, 1), bonus=("age", "ancient")),
    "fjord":       dict(w=(2, 2, 3, 1, 2), bonus=("age", "oldworld")),
    "vault":       dict(w=(1, 3, 2, 1, 3), bonus=("kin", "small")),
    "speakeasy":   dict(w=(2, 1, 2, 2, 3), bonus=("arch", "rogue")),
    "closet":      dict(w=(2, 2, 2, 2, 2), bonus=("age", "today")),
    "outback":     dict(w=(2, 1, 2, 3, 2), bonus=("kin", "hoofed")),
    "bondi":       dict(w=(2, 1, 2, 3, 2), bonus=("kin", "water")),
    "blackforest": dict(w=(2, 2, 1, 2, 3), bonus=("arch", "mystic")),
    "archive":     dict(w=(2, 3, 2, 2, 1), bonus=("age", "neon")),
}

# ---- Moves. on: play (default), ahead, behind, drawn, exit.
# fx: boost (this card +x when the call is `stat`, or always when stat is None), rally (your other cards of `group` +x),
#     lift (your other cards this turn +x), ramp (+x per earlier play this duel), sap (their best card -x),
#     burn (their side -x for the next n turns), lock (n cards in their hand cannot be played next turn),
#     spark (+x energy next turn), tax (their dearest card costs x more next turn), twist (this card counts its best stat),
#     guard (sap and burn miss your side this turn), mend (clear burn on your side, your other cards +x),
#     gamble (luck out of 200 is the chance this card counts 1.5 times), top (exit: back to the top of the deck, not the bottom),
#     peek (see n cards in their hand; the house AI cannot use it).
# x is in points before card level and arena bonus; the engine scales nothing, so tune x here.
MOVES = {
    # tanks: guard and hold
    "kevin":     dict(name="Circling Back", text="Comes back to the top of the deck, not the bottom. +5 on a Health call.", on="exit", fx="top", plus=dict(stat="health", x=5)),
    "gaius":     dict(name="Hold the Line", text="Sap and burn do nothing to your side this turn.", fx="guard"),
    "napoleon":  dict(name="Grand Plan", text="+8 when you are behind in the round.", on="behind", fx="boost", x=8),
    "gorm":      dict(name="Stampede", text="+3 each time he has been played before.", fx="ramp", x=3),
    "ajolote":   dict(name="Grows Back", text="Clears burn from your side, and your other cards +2.", fx="mend", x=2),
    "doug":      dict(name="Unbothered", text="Sap and burn do nothing to your side this turn.", fx="guard"),
    "bjorn":     dict(name="Cold Water", text="+6 on a Health call.", fx="boost", stat="health", x=6),
    "tut":       dict(name="Curse of the Tomb", text="Their side -4 for two turns.", fx="burn", x=4, n=2),
    # bruisers: big hits
    "brokk":     dict(name="Dig In", text="+5 on an Attack call.", fx="boost", stat="attack", x=5),
    "blackbear": dict(name="Broadside", text="Their best card this turn -8.", fx="sap", x=8),
    "astrid":    dict(name="Shield Wall", text="Your other Old World cards +4.", fx="rally", group=("age", "oldworld"), x=4),
    "florida":   dict(name="Death Roll", text="+10 when you are ahead in the round.", on="ahead", fx="boost", x=10),
    "madjack":   dict(name="Over the Top", text="+12 on an Attack call.", fx="boost", stat="attack", x=12),
    "roxy":      dict(name="Clear the Room", text="Their best card this turn -6.", fx="sap", x=6),
    "max":       dict(name="Charge", text="+4 each time he has been played before.", fx="ramp", x=4),
    "dusty":     dict(name="Spines Out", text="Their side -3 for two turns.", fx="burn", x=3, n=2),
    "gladius":   dict(name="Crowd Pleaser", text="Your other Ancient cards +4.", fx="rally", group=("age", "ancient"), x=4),
    # fast: energy and tempo
    "marco":     dict(name="Out for Delivery", text="+1 energy next turn.", fx="spark", x=1),
    "kenji":     dict(name="First Cut", text="+4 on a Speed call.", fx="boost", stat="speed", x=4),
    "emu":       dict(name="Undefeated", text="+2 energy next turn.", fx="spark", x=2),
    "troffea":   dict(name="Dancing Fever", text="Your other cards this turn +2.", fx="lift", x=2),
    "jazzmin":   dict(name="Encore", text="+1 energy when drawn.", on="drawn", fx="spark", x=1),
    "flap":      dict(name="Cliffhanger", text="+5 when you are behind in the round.", on="behind", fx="boost", x=5),
    # support: lift the others
    "maya":      dict(name="Triage", text="Clears burn from your side, and your other cards +3.", fx="mend", x=3),
    "edith":     dict(name="Busy Paws", text="Your other cards this turn +2.", fx="lift", x=2),
    "jacko":     dict(name="Lifeguard", text="Clears burn from your side, and your other cards +2.", fx="mend", x=2),
    "rex":       dict(name="Best in Show", text="Your other Dogs and Wolves +3.", fx="rally", group=("kin", "dogs"), x=3),
    "dolly":     dict(name="Herd Instinct", text="Your other cards this turn +3.", fx="lift", x=3),
    "beep":      dict(name="Recalibrate", text="Counts its best number, whatever the call.", fx="twist"),
    # rogues: take things away
    "vincenzo":  dict(name="Protection Money", text="Their dearest card costs 2 more next turn.", fx="tax", x=2),
    "lola":      dict(name="Pickpocket", text="Their best card this turn -6.", fx="sap", x=6),
    "sable":     dict(name="Light Fingers", text="One card in their hand cannot be played next turn.", fx="lock", n=1),
    "mona":      dict(name="Blend In", text="Counts its best number, whatever the call.", fx="twist"),
    "sterling":  dict(name="Inside Job", text="See two cards in their hand. +3 on a Speed call.", fx="peek", n=2, stat="speed", x=3),
    "selene":    dict(name="Cat Burglar", text="Two cards in their hand cannot be played next turn.", fx="lock", n=2),
    # mystics: bend the rules
    "albrecht":  dict(name="Plague Doctor", text="Their side -3 for two turns.", fx="burn", x=3, n=2),
    "morwenna":  dict(name="Moth to Flame", text="Counts its best number, whatever the call.", fx="twist"),
    "raspawtin": dict(name="Hard to Kill", text="+10 when you are behind in the round.", on="behind", fx="boost", x=10),
    "vesper":    dict(name="Night Shift", text="Their best card this turn -5.", fx="sap", x=5),
    "hootsworth":dict(name="Deduction", text="See two cards in their hand. Your other cards +3.", fx="peek", n=2, x=3),
    "quack":     dict(name="Hex", text="Their dearest card costs 1 more next turn.", fx="tax", x=1),
    # lucky: dice
    "joost":     dict(name="Tulip Fever", text="A chance to count 1.5 times. Luck sets the chance.", fx="gamble"),
    "chad":      dict(name="To the Moon", text="A chance to count 1.5 times. Luck sets the chance.", fx="gamble"),
    "pam":       dict(name="Extra Life", text="Comes back to the top of the deck, not the bottom. +5 on a Luck call.", on="exit", fx="top", plus=dict(stat="luck", x=5)),
    "eagleton":  dict(name="Recount", text="A chance to count 1.5 times. Luck sets the chance.", fx="gamble"),
    "zorp":      dict(name="Not From Here", text="Counts its best number, whatever the call.", fx="twist"),
    # stars: lift their crowd
    "slapton":   dict(name="Star Billing", text="Your other Wartime cards +8.", fx="rally", group=("age", "wartime"), x=8),
    "cleocatra": dict(name="Queen of the Nile", text="Your other cards this turn +4.", fx="lift", x=4),
    "bella":     dict(name="Flock Together", text="Your other Birds +6.", fx="rally", group=("kin", "birds"), x=6),
    "stella":    dict(name="Tomorrow's News", text="Your other Neon cards +4.", fx="rally", group=("age", "neon"), x=4),
}

DUEL = dict(
    deck=12,                 # different heroes in a deck; duels open at this many owned
    decks_saved=3,
    hand=5,
    per_turn=3,              # cards a turn at most
    turns_per_round=3,
    rounds_to_win=3,
    energy=dict(start=7, per_turn=7, max=20),
    cost={"common": 2, "uncommon": 3, "rare": 4, "epic": 5, "legendary": 6, "absurd": 7, "unhinged": 8},
    arena_bonus=0.2,
    # Every card should give about the same points for each point of energy. Dear cards get a little less, because
    # three cards a turn is the limit, so the dear ones already pack more into a turn (sim, 27 Nov). So a hero's own stats are scaled by rarity in duels only. Filled in below.
    rarity_scale={},
    premium=-0.0175,         # per point of cost above 2 (negative: the slot limit already favours dear cards)
    # A trained point counts `train_weight` times half the card's cost, so training doubles any card at about the
    # same cap whatever its rarity, and never makes a cheap card worth more per energy than a dear one.
    train_weight=0.5,
    train_soft=15, train_after=0.5,   # in a duel, trained points past 15 on a stat count half (sim: one maxed hero must not carry a deck)
    kit=dict(two=0.1, three=0.25),
    gamble=dict(div=250, mult=1.5, cap=0.35),
    brackets=[               # card level counts up to `level`; training up to `train` per stat (before train_weight)
        dict(id="copper", name="Copper", level=3, train=10, rating=0),
        dict(id="silver", name="Silver", level=5, train=25, rating=1100),
        dict(id="gold", name="Gold", level=7, train=40, rating=1300),
        dict(id="open", name="Open", level=10, train=60, rating=1500),
    ],
    practice=dict(bracket="silver", paid_per_day=3, gold=40),
    marks=dict(max=5, regen_minutes=30),
    rest_minutes=10,
    stakes=dict(options=[0, 100, 500, 2000], pays=1.8, daily_cap=10000, by_bracket={"copper": 100, "silver": 500, "gold": 2000, "open": 2000}),
    rating=dict(start=1000, k_attack=24, k_defend=8),
    turn_seconds=30,
    ages=AGES, kins=KINS, arenas=ARENAS, moves=MOVES,
)


def fill_scale(hero_total):
    """rarity_scale[r] = (cost / 2) * (common total / this total) * (1 + premium * (cost - 2))."""
    c = DUEL["cost"]
    for r, cost in c.items():
        DUEL["rarity_scale"][r] = round((cost / 2) * (hero_total["common"] / hero_total[r]) * (1 + DUEL["premium"] * (cost - 2)), 3)


def check(hero_ids, arch_of):
    """Fails the build if a hero is missing a group or a Move, or a group is too small."""
    from collections import Counter
    for name, table, names in (("age", AGE, AGES), ("kin", KIN, KINS), ("move", MOVES, None)):
        missing = [h for h in hero_ids if h not in table]
        extra = [h for h in table if h not in hero_ids]
        assert not missing and not extra, f"duel {name}: missing {missing} extra {extra}"
        if names:
            bad = [g for g in table.values() if g not in names]
            assert not bad, f"duel {name}: unknown groups {bad}"
            small = {g: n for g, n in Counter(table.values()).items() if n < 4}
            assert not small, f"duel {name}: groups under four heroes {small}"
    for hid, m in MOVES.items():
        g = m.get("group")
        if g:
            pool = {"age": AGE, "kin": KIN, "arch": arch_of}[g[0]]
            assert sum(1 for v in pool.values() if v == g[1]) >= 4, f"move {hid}: rally group {g} too small"
