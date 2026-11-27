"""Duels (O8): groups, arenas, Moves and every duel number.

Read by build.py: each hero gains `arch`, `age`, `kin` and `move`; rules.json gains `duel`.
The engine is js/duel-engine.mjs; the balance check is rules/sim_duel.mjs. Plan: PLAN-CITY-DUELS.md, sections 2 and 3.

Move names by Fable (F7). The `text` says what the card does in plain English, the same sentence for the same effect
(Dean, 27 Nov: instructions must be plain; jokes belong in names and in Smudge's commentary, never in rules text). Fable changes `name` and `text` only.
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
    "blackforest": dict(w=(2, 2, 2, 2, 2), bonus=("arch", "mystic")),   # luck was the most-called stat overall; evened up
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
    "kevin":     dict(name="Circling Back", text="After you play this card it goes back on top of your deck, so you draw it again soon. +5 points on a Health turn.", on="exit", fx="top", plus=dict(stat="health", x=5)),
    "gaius":     dict(name="Hold the Line", text="The other player's sap and burn do nothing to you this turn.", fx="guard"),
    "napoleon":  dict(name="Top Shelf", text="+8 points if you are losing the round when you play it.", on="behind", fx="boost", x=8),
    "gorm":      dict(name="Immediate Area", text="+3 points for each time you have already played this card in this duel.", fx="ramp", x=3),
    "ajolote":   dict(name="Grows Back", text="Removes burn from your side. Your other cards this turn get +2 points.", fx="mend", x=2),
    "doug":      dict(name="Denied", text="The other player's sap and burn do nothing to you this turn.", fx="guard"),
    "bjorn":     dict(name="Declared Dead", text="+6 points on a Health turn.", fx="boost", stat="health", x=6),
    "tut":       dict(name="Wrong Continent", text="The other player loses 4 points each turn for the next 2 turns.", fx="burn", x=4, n=2),
    # bruisers: big hits
    "brokk":     dict(name="Stick, Mostly", text="+5 points on a Attack turn.", fx="boost", stat="attack", x=5),
    "blackbear": dict(name="Lit Fuse", text="The other player's best card this turn loses 8 points.", fx="sap", x=8),
    "astrid":    dict(name="Bored of Winning", text="Your other Old World cards this turn get +4 points.", fx="rally", group=("age", "oldworld"), x=4),
    "florida":   dict(name="Hold My Drink", text="+10 points if you are winning the round when you play it.", on="ahead", fx="boost", x=10),
    "madjack":   dict(name="Longbow, 1944", text="+12 points on a Attack turn.", fx="boost", stat="attack", x=12),
    "roxy":      dict(name="Soundcheck", text="The other player's best card this turn loses 6 points.", fx="sap", x=6),
    "max":       dict(name="Out of Retirement", text="+4 points for each time you have already played this card in this duel.", fx="ramp", x=4),
    "dusty":     dict(name="Eleven Years of Opinions", text="The other player loses 3 points each turn for the next 2 turns.", fx="burn", x=3, n=2),
    "gladius":   dict(name="No Shirt Required", text="Your other Ancient cards this turn get +4 points.", fx="rally", group=("age", "ancient"), x=4),
    # fast: energy and tempo
    "marco":     dict(name="Out for Delivery", text="You get 1 extra energy next turn.", fx="spark", x=1),
    "kenji":     dict(name="For the Biscuit", text="+4 points on a Speed turn.", fx="boost", stat="speed", x=4),
    "emu":       dict(name="Never Lost a War", text="You get 2 extra energy next turn.", fx="spark", x=2),
    "troffea":   dict(name="Catching", text="Your other cards this turn get +2 points.", fx="lift", x=2),
    "jazzmin":   dict(name="And Again!", text="You get 1 extra energy as soon as you draw this card.", on="drawn", fx="spark", x=1),
    "flap":      dict(name="Thirty Years Late", text="+5 points if you are losing the round when you play it.", on="behind", fx="boost", x=5),
    # support: lift the others
    "maya":      dict(name="Triage", text="Removes burn from your side. Your other cards this turn get +3 points.", fx="mend", x=3),
    "edith":     dict(name="Before Breakfast", text="Your other cards this turn get +2 points.", fx="lift", x=2),
    "jacko":     dict(name="Between the Flags", text="Removes burn from your side. Your other cards this turn get +2 points.", fx="mend", x=2),
    "rex":       dict(name="Power Ballad", text="Your other Dog and Wolf cards this turn get +3 points.", fx="rally", group=("kin", "dogs"), x=3),
    "dolly":     dict(name="Singing to You", text="Your other cards this turn get +3 points.", fx="lift", x=3),
    "beep":      dict(name="Slightly On Fire", text="Always scores its highest stat, no matter which stat the turn is using.", fx="twist"),
    # rogues: take things away
    "vincenzo":  dict(name="A Friendly Word", text="The other player's most expensive card costs 2 more energy next turn.", fx="tax", x=2),
    "lola":      dict(name="Encore, Monsieur", text="The other player's best card this turn loses 6 points.", fx="sap", x=6),
    "sable":     dict(name="Rinsed", text="The other player cannot play one of their cards next turn.", fx="lock", n=1),
    "mona":      dict(name="Whatever You See", text="Always scores its highest stat, no matter which stat the turn is using.", fx="twist"),
    "sterling":  dict(name="Whose Side", text="+3 points on a Speed turn.", fx="peek", n=2, stat="speed", x=3),
    "selene":    dict(name="Invited Back", text="The other player cannot play 2 of their cards next turn.", fx="lock", n=2),
    # mystics: bend the rules
    "albrecht":  dict(name="More Leeches", text="The other player loses 3 points each turn for the next 2 turns.", fx="burn", x=3, n=2),
    "morwenna":  dict(name="Wrong Candle", text="Always scores its highest stat, no matter which stat the turn is using.", fx="twist"),
    "raspawtin": dict(name="Seconds, Please", text="+10 points if you are losing the round when you play it.", on="behind", fx="boost", x=10),
    "vesper":    dict(name="Not on the List", text="The other player's best card this turn loses 5 points.", fx="sap", x=5),
    "hootsworth":dict(name="The Stare", text="Your other cards this turn get +3 points.", fx="peek", n=2, x=3),
    "quack":     dict(name="More Lightning", text="The other player's most expensive card costs 1 more energy next turn.", fx="tax", x=1),
    # lucky: dice
    "joost":     dict(name="One More Bulb", text="Has a chance to score 1.5 times its points. The higher this card's Luck, the better the chance.", fx="gamble"),
    "chad":      dict(name="Buying the Dip", text="Has a chance to score 1.5 times its points. The higher this card's Luck, the better the chance.", fx="gamble"),
    "pam":       dict(name="Extra Life", text="After you play this card it goes back on top of your deck, so you draw it again soon. +5 points on a Luck turn.", on="exit", fx="top", plus=dict(stat="luck", x=5)),
    "eagleton":  dict(name="Recount", text="Has a chance to score 1.5 times its points. The higher this card's Luck, the better the chance.", fx="gamble"),
    "zorp":      dict(name="Definitely a Human", text="Always scores its highest stat, no matter which stat the turn is using.", fx="twist"),
    # stars: lift their crowd
    "slapton":   dict(name="Top Billing", text="Your other Wartime cards this turn get +8 points.", fx="rally", group=("age", "wartime"), x=8),
    "cleocatra": dict(name="Royal Audience", text="Your other cards this turn get +4 points.", fx="lift", x=4),
    "bella":     dict(name="Do It for the Feed", text="Your other Bird cards this turn get +6 points.", fx="rally", group=("kin", "birds"), x=6),
    "stella":    dict(name="Next Week's Episode", text="Your other Neon cards this turn get +4 points.", fx="rally", group=("age", "neon"), x=4),
}

# the name on a duel card where the first word is a title, not a name
SHORT = {"albrecht": "Albrecht", "blackbear": "Blackbear", "emu": "Emu", "troffea": "Troffea", "stella": "Stella", "flap": "Flap",
         "max": "Max", "ajolote": "Ajolote", "hootsworth": "Hootsworth", "sterling": "Sterling", "quack": "Quackenstein",
         "beep": "B33-P", "tut": "Tut", "eagleton": "Eagleton", "zorp": "Zorp", "madjack": "Mad Jack", "pam": "Pam", "florida": "Florida Man"}

# the two or three words that go on the card face. Built from the effect, so a new Move gets one for free.
def tag_for(hid, m, stats):
    """One short line, 12 characters at most, whole words only: it has to fit a small card without wrapping."""
    fx, x, n = m["fx"], m.get("x"), m.get("n")
    st = (m.get("stat") or "").title()
    if fx == "boost":   return f"+{x} {st}" if m.get("stat") else (f"+{x} if {m['on']}" if m.get("on") in ("ahead", "behind") else f"+{x}")
    if fx == "ramp":    return f"+{x} per play"
    if fx == "rally":   return f"{GROUP_WORD[m['group']]} +{x}"
    if fx == "lift":    return f"Allies +{x}"
    if fx == "mend":    return f"Mend, +{x}"
    if fx == "guard":   return "Shield"
    if fx == "sap":     return f"Sap {x}"
    if fx == "burn":    return f"Burn {x}"
    if fx == "lock":    return f"Lock {n or 1}"
    if fx == "spark":   return f"+{x} energy"
    if fx == "tax":     return f"Tax +{x}"
    if fx == "twist":   return "Best stat"
    if fx == "peek":    return (f"+{x} {st}" if m.get("stat") else f"Allies +{x}")   # the peek itself is not shown on the table yet, so the card only promises what it does
    if fx == "gamble":  return "Lucky x1.5"
    if fx == "top":     return "Comes back"
    return ""

GROUP_WORD = {("age", "ancient"): "Ancient", ("age", "oldworld"): "Olden", ("age", "steam"): "Sail", ("age", "wartime"): "Wartime",
              ("age", "neon"): "Neon", ("age", "today"): "Today", ("kin", "dogs"): "Dogs", ("kin", "cats"): "Cats", ("kin", "birds"): "Birds",
              ("kin", "small"): "Small", ("kin", "weasels"): "Weasels", ("kin", "hoofed"): "Hoofed", ("kin", "water"): "Water", ("kin", "odd"): "Odd"}


def fill_tags():
    for hid, m in MOVES.items():
        m["tag"] = tag_for(hid, m, None)
        m["icon"] = ICON[m["fx"]]


# one letter-shape per effect, drawn as a glyph in the browser (no art needed)
ICON = {"boost": "+", "ramp": "\u25b2", "rally": "\u2638", "lift": "\u2191", "mend": "\u271a", "guard": "\u26e8", "sap": "\u2702",
        "burn": "\u2668", "lock": "\u26bf", "spark": "\u26a1", "tax": "\u00d7", "twist": "\u2731", "peek": "\u25c9", "gamble": "\u2684", "top": "\u21ba"}

# one colour per called stat, used on the chip, the card number and the info row
STAT_COLOR = {"attack": "#ff7a5e", "defense": "#6aa9ff", "health": "#5ddc8a", "speed": "#ffd35c", "luck": "#c58bff"}


# The rival ladder: the eight raid bosses, each with a deck built from the groups they would call on,
# a home arena, and a captain. Three difficulties each, a first-win prize at every one.
# `pool` names the groups the deck is drawn from, in order of preference; `fill` tops it up from everyone.
RIVALS = [
 dict(id="tiber",    name="The Tiber Thing",      arena="dock",        pool=[("age", "ancient"), ("kin", "water")],   captain="gladius",  tier=1,
      text="It has been in that river since the aqueducts went up. It has a deck. Nobody asked how."),
 dict(id="tony",     name="Big Tony's Boys",      arena="speakeasy",   pool=[("age", "wartime"), ("arch", "rogue")],  captain="vincenzo", tier=1,
      text="Four gentlemen, one table, and a very fixed idea about who wins."),
 dict(id="brenda",   name="Brenda, Back From Leave", arena="closet",   pool=[("age", "today"), ("arch", "support")],  captain="maya",     tier=1,
      text="She has seen the state of the supply closet. Now she would like a word, in cards."),
 dict(id="vanguard", name="The Emu Vanguard",     arena="outback",     pool=[("kin", "birds"), ("arch", "fast")],     captain="emu",      tier=2,
      text="They beat an army once. They have been looking for a rematch ever since."),
 dict(id="gary",     name="Gary the Great White",  arena="bondi",      pool=[("kin", "water"), ("arch", "bruiser")],  captain="florida",  tier=2,
      text="He is between the flags, holding cards in a way sharks should not be able to."),
 dict(id="nephew",   name="The Doge's Nephew",    arena="vault",       pool=[("age", "oldworld"), ("arch", "rogue")], captain="selene",   tier=2,
      text="Bad at guarding. Surprisingly good at cards, which is worse."),
 dict(id="well",     name="The Thing Under the Well", arena="blackforest", pool=[("arch", "mystic"), ("age", "oldworld")], captain="morwenna", tier=3,
      text="It was buried for a reason. It has had a long time to think about its deck."),
 dict(id="antlers",  name="The Antlered Deep",    arena="fjord",       pool=[("age", "oldworld"), ("kin", "hoofed")], captain="astrid",   tier=3,
      text="Something under the ice has antlers, opinions, and a hand it will not show you."),
]
# difficulty: how the rival's own cards are levelled and trained, and what the first win pays
LEVELS = [
 dict(id="easy",    name="Easy",    level=3, train=6,  ai=0, gold=150,  xp=10),
 dict(id="normal",  name="Normal",  level=5, train=16, ai=1, gold=450,  xp=25),
 dict(id="careful", name="Careful", level=7, train=26, ai=2, gold=1200, xp=60),
]
# a tier-2 rival pays double on a first win, a tier-3 one triple
TIER_PAY = [1, 1, 2, 3]
# the duelist road: twenty levels, cosmetics only, never a stat
ROAD_XP = 120          # xp for level 2, then x1.18 a level
ROAD = {3: "back:ink", 5: "title:Card Sharp", 8: "felt:oak", 11: "back:brass", 14: "title:The House Always Blinks",
        17: "felt:velvet", 20: "back:ledger"}

DUEL = dict(
    open=False,              # False: only the owner sees Duels (testing). True: everyone.
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
    premium=-0.0195,         # per point of cost above 2 (negative: the slot limit already favours dear cards)
    # A trained point counts `train_weight` times half the card's cost, so training doubles any card at about the
    # same cap whatever its rarity, and never makes a cheap card worth more per energy than a dear one.
    train_weight=0.5,
    train_soft=15, train_after=0.5,   # in a duel, trained points past 15 on a stat count half (sim: one maxed hero must not carry a deck)
    kit=dict(two=0.1, three=0.25),
    gamble=dict(div=250, mult=1.5, cap=0.30),
    brackets=[               # card level counts up to `level`; training up to `train` per stat (before train_weight)
        dict(id="copper", name="Copper", level=3, train=10, rating=0),
        dict(id="silver", name="Silver", level=5, train=25, rating=1100),
        dict(id="gold", name="Gold", level=7, train=40, rating=1300),
        dict(id="open", name="Open", level=10, train=60, rating=1500),
    ],
    practice=dict(bracket="silver", paid_per_day=5, repeat_share=0.2, gold=40, min_deck=8),   # a repeat win pays a fifth of that rival's first-win prize, five times a day;   # Practice opens at 8 heroes (Dean, 27 Nov); ranked keeps `deck`
    marks=dict(max=5, regen_minutes=30),
    swap=2,                  # cards you may put back before the first turn
    swap_floor=9.0,          # the house puts back a card worth less than this per energy (typical is 9 to 11)
    captain_per_cost=5,      # Captain's Call adds this x the captain's cost, once a duel (flat x2 made cheap
                             # lopsided heroes the only sensible captain; by cost, every hero is a fair pick)
    stand_down_energy=3,     # energy you start the next round with for sitting this one out
    rest_minutes=10,
    stakes=dict(options=[0, 100, 500, 2000], pays=1.8, daily_cap=10000, by_bracket={"copper": 100, "silver": 500, "gold": 2000, "open": 2000}),
    rating=dict(start=1000, k_attack=24, k_defend=8),
    turn_seconds=30,
    ages=AGES, kins=KINS, arenas=ARENAS, moves=MOVES, short=SHORT, stat_color=STAT_COLOR,
    rivals=RIVALS, levels=LEVELS, tier_pay=TIER_PAY, road=dict(xp=ROAD_XP, step=1.18, max=20, prizes=ROAD),
    coach_duels=3,           # the best-value card glows for your first three duels
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
