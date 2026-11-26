"""Fits an XP table so a regular player (job running 12 hours a day) reaches each level on a target day,
given the proposed speed rules. Iterates because the places you unlock depend on the table itself."""
import json, math, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import sim_web as S
ANCH = [(1, 0), (2, 0.05), (10, 2), (15, 8), (25, 18), (40, 84), (75, 360), (99, 588)]   # level -> hours of job time
def target_h(L):
    for (a, ha), (b, hb) in zip(ANCH, ANCH[1:]):
        if a <= L <= b:
            if ha == 0: return hb * (L - a) / (b - a)
            return math.exp(math.log(ha) + (math.log(hb) - math.log(ha)) * (L - a) / (b - a))
P = dict(S.NEW); P['xp_mult'] = 0.25; S.R['web']['ink_mult'] = 0.2
table = list(S.R['xp_table'])
for it in range(4):
    S.XP = table
    cum = S.hourly_xp(P, 12, days=52)       # cumulative skill xp per hour of job time
    new = [0]
    for L in range(2, 100):
        h = target_h(L); i = min(int(h), len(cum) - 2); f = h - i
        new.append(int(round(cum[i] + (cum[i + 1] - cum[i]) * f)))
    for i in range(1, len(new)): new[i] = max(new[i], new[i - 1] + 1 + i)
    print(it, 'L15', new[14], 'L40', new[39], 'L75', new[74], 'L99', new[98])
    table = new
json.dump(table, open(os.path.join(os.path.dirname(__file__), 'xp_table_new.json'), 'w'))
