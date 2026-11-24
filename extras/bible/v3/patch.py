import re
src=open('bible_v2.md').read()
new=open('v3/new_sections.md').read()
def split(t):
    parts=re.split(r'\n(?=## )',t)
    return parts
head,*secs=split(src)
d={s.split('\n',1)[0][3:].strip():s for s in secs}
order=[s.split('\n',1)[0][3:].strip() for s in secs]
nd={s.split('\n',1)[0][3:].strip():s for s in split('\n'+new)[1:]}
head=head.replace("Version 2, November 21, 2026","Version 3, November 21, 2026")
def rep(k,a,b):
    assert a in d[k],(k,a); d[k]=d[k].replace(a,b)
# House rule
rep("House rule: never name the inspiration","A mentor with a real story, who is also a Recruit you can earn.","A mentor with a real story, who is also a hero you can earn.")
rep("House rule: never name the inspiration","| Hall of Fame | The Ledger of Names |","| Item Market and trading | The Exchange, Handshake and Hiring Hall | Fees go to the Hero Office as a Crowns sink, and you can trade heroes as well as items. |\n| Hall of Fame | The Ledger of Names |")
# roster wording
d["Character roster"]=d["Character roster"].replace("Recruit","hero")
rep("Character roster","| Know-How (active) |","| Traits | Modern era, Wits, Talk. Favored in the Lower Mall and the Archive Stacks. |\n| Know-How (active) |")
# Gear
g="Gear and items"
rep(g,"| 9. Bound tag | Tradeable, Claimed on pickup, or Bound (in a bind slot, survives death) | Claimed on pickup |",
 "| 9. Trade tag | Tradeable, Tradeable in Xh (fresh drop cooldown), or Bound (in a bind slot, survives death, trade-locked) | Tradeable in 61h (fresh drop) |\n| Market line | Small grey text: the 7-day median sale price | Market: about 42,000 Ø |")
d[g]=d[g].replace("| Claimed on pickup, Durability 120/120 |","| Tradeable in 61h (fresh drop), Durability 120/120 |")
d[g]=d[g].replace("| Claimed on pickup, Lines 0/100 |","| Bound (trade-locked), Lines 0/100 |")
d[g]=d[g].replace("| Claimed on pickup, 2 charges per fight |","| Tradeable, 2 charges per fight |")
d[g]=d[g].replace("| Claimed on pickup, Durability 90/90 |","| Tradeable in 18h (fresh drop), Durability 90/90 |")
d[g]=d[g].replace("| Claimed on pickup, Air 100% |","| Tradeable, Air 100% |")
d[g]=d[g].replace("| Claimed on pickup, repairs itself, sometimes |","| Tradeable in 70h (fresh drop), repairs itself, sometimes |")
d[g]=d[g].replace("| Claimed on pickup, Battery 3% forever |","| Bound (trade-locked), Battery 3% forever |")
rep(g,"| The Market | Trade with other players for Crowns. Legendary and above are Claimed on pickup and cannot be traded. |",
 "| The Exchange and Handshake | Trade with other players for Crowns, including Legendary and higher, after the fresh-drop cooldown. See Trading and the market. |")
rep(g,"Any item, any character. There are no era or class locks.","Any item, any character. Gear lives in one shared armory and moves freely between your heroes in the city. There are no era or class locks.")
rep(g,"- One at a time: only one Anomaly item works at once, and only one Unhinged item can be equipped anywhere.","- One at a time: only one Anomaly item works per hero, and only one Unhinged item can be equipped per hero.")
assert "Claimed" not in d[g], [l for l in d[g].split('\n') if 'Claimed' in l]
# Progression
p=nd["Progression and the City"]
# Descent
k="The Descent: dungeon scenarios"
rep(k,"| Entry cost |","| Squad | You plus 2 hired heroes. Each dungeon favors certain traits, worth up to +30 percent damage and loot. |\n| Entry cost |")
rep(k,"Keep XP, stats, Recruits and bound gear.","Keep XP, stats, heroes and bound gear. Fallen hires go to the Infirmary, never die for good.")
d[k]=d[k].replace("Recruit","hero")
# Earning
k="Earning and showing it off"
rep(k,"| The Binder | Every Recruit card you own, sorted by era. Uncollected ones show as dark silhouettes. Completion per era unlocks a binder cover. | Yes |",
 "| The Binder | Every hero card you own or have owned, sorted by era. Uncollected ones show as dark silhouettes. Completion per era unlocks a binder cover. | Yes |\n| Hall of Heroes | Retired heroes on your wall with portrait, best run, Scars and a farewell line | Yes |\n| Trade record | Your Exchange sales count and any record sales. Prices stay private unless you opt in. | Opt-in |")
# Social
k="Social and endgame"
rep(k,"| Economy | Player Market with visible price history for items up to Epic, Recruit contracts, crafting materials and repair. The Hero Office taxes Summoned income, which feeds smuggling. |",
 "| Economy | The Exchange, buy orders, the Handshake and the Hiring Hall, with price history for every item and hero, fees as a Crowns sink, and crew trading. See Trading and the market. The Hero Office taxes Summoned income, which feeds smuggling. |\n| Hero loans | Crewmates lend heroes to each other for 24 hours for a set fee. |")
rep(k,"| Overflow Night | Every Friday | New arrivals, Intake, Lost Property crates, weekly boss |","| Overflow Night | Every Friday, 8 PM Eastern | The weekly batch of 10 to 15 themed heroes, your 3 face-up offers, Lost Property crates, weekly boss, Feuds settle |")
# Monetization
k="Monetization"
rep(k,"Alternate portrait art for Recruits","Alternate portrait art for heroes")
rep(k,"Gear, upgrade materials, rerolls, repairs and bag space are always earned.","Gear, heroes, Crowns, Barracks slots, upgrade materials, rerolls, repairs and bag space are always earned. Gilt cannot be traded or turned into Crowns, so money can never reach the Exchange.")
rep(k,"more Market listings","more Exchange listing slots (the fees still apply)")
# Art
d["Art consistency pipeline"]=d["Art consistency pipeline"].replace("Players and Recruits face right","Players and hired heroes face right")
# Site
k="Site plan"
rep(k,"- Left sidebar: Home, City, Descent, Hero Office, Market, Forge Row, Crier, Stocks, Infirmary, Crew, Binder, Armory, Ledger, Almanac",
 "- Left sidebar: Home, City, Descent, Barracks, Hiring Hall, Expeditions, Exchange, Forge Row, Crier, Stocks, Infirmary, Crew, Binder, Armory, Ledger, Almanac")
rep(k,"- Bottom ticker: Market moves and big player moments, like a Legendary drop","- Bottom ticker: Exchange record sales and big player moments, like a Legendary drop\n- Barracks screen: every hero with their job, shift timer, upkeep and a one-tap swap into the squad")
# Roadmap
k="Build roadmap"
rep(k,"| 2. The City | Bars and timers, Pit, hustles, jobs, Stocks, Lodging, Market, Forge Row upgrades, Dez's Errands | 6 to 8 weeks |",
 "| 2. The City | Bars and timers, Pit, hustles, hero jobs, Stocks, Lodging, Forge Row upgrades, Dez's Errands | 6 to 8 weeks |")
rep(k,"| 3. Collecting | Weekly Intake, Recruits as companions, Binder, Ascension, Anomaly slot, set bonuses, 8 Origins | 4 to 6 weeks |",
 "| 3. Roster | Squad of 3, dungeon favored traits, weekly Intake batch, Hiring Hall, Barracks and upkeep, Expeditions, retire and release, Binder, Ascension, Anomaly slot, set and squad bonuses, 8 Origins | 6 to 8 weeks |\n| 3b. Trading | Exchange, buy orders, Handshake, fees, trade locks, price history, hero hiring between players, anti-bot and anti-RMT checks, ToS update | 4 to 6 weeks |")
# Open questions
d["Open questions for Dean"]="""## Open questions for Dean

1. Happy with premise A (the Cheap Circle)?
2. Are the 8 launch Origins right, or do you want to swap any?
3. Should gear show on the pixel sprites from day one, or only the weapon at first?
4. Friday 8 PM Eastern for Overflow Night, or another day and time?
5. Is a starting Barracks of 5 with daily upkeep right, or too tight?
6. How adult: strong language and off-page sex, as in the v1.1 bible, or tamer for a wider audience?
7. Do you want the far-future Earth secret (option C) as the long-term mystery?
"""
d["How this relates to Claude's v1.1 bible"]=nd["How this relates to Claude's v1.1 bible"]
d["The short version"]=nd["The short version"]
out=[]
for o in order:
    if o=="Choosing and collecting":
        out+= [nd["Squad, roster and Intake"],nd["Trading and the market"]]
    elif o=="Core loop and progression":
        out.append(p)
    else:
        out.append(d[o])
    if o=="The short version":
        out.append(nd["Core game loop"])
t=head+'\n'+'\n'.join(x.rstrip('\n')+'\n' for x in out)
open('bible.md','w').write(t)
