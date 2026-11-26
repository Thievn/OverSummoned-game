"""Web pacing sim: one job, a crew of up to three, summons bought with the ink the job makes.
Compares the live numbers with a proposed set. Run: python3 rules/sim_web.py
Mirrors js/game.js: jobSpeed, worked() (rested hours), doAction, summonCost, mastery, crew slots."""
import json, math, os, random
R = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'data', 'rules.json')))
XP = R['xp_table']; HEROES = R['heroes']
W = R['summon']['weights']

def lvl_of(x):
    l = 1
    while l < 99 and x >= XP[l]: l += 1
    return l

def soft(b, cap):
    return b if not cap else cap * (1 - math.exp(-b / cap))

LIVE = dict(name='Live today', solo_mult=3.0, xp_mult=0.25, mastery_speed=0.01, mastery_xp=10, crew_speed_div=150, cap=0, card_bump=0.08, summon_luck=0.0)
NEW = dict(name='Proposed', solo_mult=1.0, xp_mult=0.25, mastery_speed=0.006, mastery_xp=10, crew_speed_div=150, cap=2.5, card_bump=0.08, summon_luck=0.03)

def run(P, hours_per_day, days=60, skill='Lockpicking', seed=1):
    rnd = random.Random(seed)
    xp = {s: 0 for s in R['skills']}; ink = 3400; roster = {'kevin': 1}; mastery = {}
    places = [p for p in R['places'] if p['skill'] == skill]
    out = {}; t_job = 0.0
    for day in range(1, days + 1):
        rest = R['rested']['hours'] * 3600
        secs = hours_per_day * 3600
        crate_t = 0.0
        while secs > 0:
            step = 60.0; secs -= step
            f = min(step, rest); rest -= f; wdt = (f * R['rested']['mult'] + (step - f)) * R['rested']['base']
            crate_t += step
            if crate_t >= R['crate']['minutes'] * 60: crate_t = 0; ink += R['crate']['ink']
            L = lvl_of(xp[skill]); p = max([p for p in places if L >= p['level']], key=lambda p: p['tier']); t = R['tier'][str(p['tier'])]
            total = sum(lvl_of(xp[s]) for s in R['skills'])
            slots = sum(1 for n in R['jobs']['crew_slots'] if total >= n)
            crew = sorted(roster, key=lambda h: -next(x for x in HEROES if x['id'] == h)['stats']['speed'])[:slots]
            b = 0.0
            for h in crew:
                st = next(x for x in HEROES if x['id'] == h)['stats']['speed'] * (1 + P['card_bump'] * (min(10, 1 + int(math.sqrt(2 * (roster[h] - 1)))) - 1))
                m = min(R['jobs']['mastery_cap'], lvl_of(mastery.get(h, 0)) - 1)
                b += st / P['crew_speed_div'] + m * P['mastery_speed']
            b += sum(pk.get('speed', 0) for pk in R['perks'] if L >= pk['level'])
            speed = (1 + soft(b, P['cap'])) * P['solo_mult']
            t_job += wdt; per = t['seconds'] / speed
            while t_job >= per:
                t_job -= per
                xp[skill] += t['xp'] * P['xp_mult']; ink += t['ink'] * R['web']['ink_mult']
                for h in crew: mastery[h] = mastery.get(h, 0) + P['mastery_xp']
            # spend ink on summons, as most players do
            while True:
                cost = R['summon']['base_ink'] + R['summon']['per_unique'] * len(roster)
                if ink < cost: break
                ink -= cost; xp['Summoning'] += cost * R['summon']['xp_per_ink']
                sl = lvl_of(xp['Summoning']); bump = 1 + P['summon_luck'] * (sl // 10)
                ws = {r: w * (bump if r not in ('common', 'uncommon') else 1) for r, w in W.items()}
                r = rnd.choices(list(ws), list(ws.values()))[0]
                pool = [h['id'] for h in HEROES if h['rarity'] == r] or ['kevin']
                h = rnd.choice(pool); roster[h] = roster.get(h, 0) + 1
        out[day] = dict(skill=lvl_of(xp[skill]), summ=lvl_of(xp['Summoning']), heroes=len(roster), speed=round(speed, 2), haul=round(t['seconds'] / speed, 1))
    return out

def hourly_xp(P, hours_per_day, days=52, skill='Lockpicking'):
    """Cumulative skill xp at the end of every hour of job time."""
    out = [0.0]; xp = {s: 0 for s in R['skills']}; ink = 3400; roster = {'kevin': 1}; mastery = {}; t_job = 0.0
    places = [p for p in R['places'] if p['skill'] == skill]; H = {h['id']: h for h in HEROES}
    for day in range(days):
        rest = R['rested']['hours'] * 3600
        for hour in range(hours_per_day):
            for m in range(60):
                f = min(60, rest); rest -= f; wdt = (f * R['rested']['mult'] + (60 - f)) * R['rested']['base']
                L = lvl_of(xp[skill]); p = max([p for p in places if L >= p['level']], key=lambda p: p['tier']); t = R['tier'][str(p['tier'])]
                total = sum(lvl_of(xp[s]) for s in R['skills']); slots = sum(1 for n in R['jobs']['crew_slots'] if total >= n)
                crew = sorted(roster, key=lambda h: -H[h]['stats']['speed'])[:slots]; b = 0.0
                for h in crew:
                    st = H[h]['stats']['speed'] * (1 + P['card_bump'] * (min(10, 1 + int(math.sqrt(2 * (roster[h] - 1)))) - 1))
                    b += st / P['crew_speed_div'] + min(R['jobs']['mastery_cap'], lvl_of(mastery.get(h, 0)) - 1) * P['mastery_speed']
                b += sum(pk.get('speed', 0) for pk in R['perks'] if L >= pk['level'])
                speed = (1 + soft(b, P['cap'])) * P['solo_mult']; t_job += wdt; per = t['seconds'] / speed
                while t_job >= per:
                    t_job -= per; xp[skill] += t['xp'] * P['xp_mult']; ink += t['ink'] * R['web']['ink_mult']
                    for h in crew: mastery[h] = mastery.get(h, 0) + P['mastery_xp']
                if m % 30 == 0: ink += R['crate']['ink'] / 2
                while ink >= R['summon']['base_ink'] + R['summon']['per_unique'] * len(roster):
                    c = R['summon']['base_ink'] + R['summon']['per_unique'] * len(roster); ink -= c; xp['Summoning'] += c * R['summon']['xp_per_ink']
                    import random as _r; r = _r.choices(list(W), list(W.values()))[0]; pool = [h['id'] for h in HEROES if h['rarity'] == r]; h = _r.choice(pool); roster[h] = roster.get(h, 0) + 1
            out.append(xp[skill])
    return out

if __name__ == '__main__':
    for P in (LIVE, NEW):
        print('==', P['name'])
        for name, h in (('light, 4h a day', 4), ('regular, 12h a day', 12), ('heavy, 24h a day', 24)):
            o = run(P, h)
            d99 = next((d for d in o if o[d]['skill'] >= 99), None)
            row = '  '.join(f"d{d}: L{o[d]['skill']} sum{o[d]['summ']} {o[d]['heroes']}h x{o[d]['speed']}" for d in (1, 7, 30))
            print(f"{name:20s} {row}  L99 on day {d99}")
