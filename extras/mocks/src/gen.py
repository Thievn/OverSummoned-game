import sys,os
sys.path.insert(0,os.path.dirname(__file__))
from common import *
OUT=f'{ROOT}/html'
ERA={'legionary':'forum_bg','gangster':'era_chicago','paramedic':'era_modern','office_worker':'era_office','hunter':'era_iceage','engineer':'era_london','plague_doctor':'era_plague','delivery_rider':'era_modern','will_slapton':'era_hollywood'}
PEAK={'legionary':5,'gangster':6,'paramedic':8,'office_worker':7,'hunter':6,'engineer':6,'plague_doctor':5,'delivery_rider':8,'will_slapton':6}
SK={'will_slapton':('Keep It Out Your Mouth','A thunderous slap that stuns one enemy for 2 turns. Double damage if they just made a joke.'),
'legionary':('Formation','Raises the shield wall. His guard grows with every ally beside him.'),
'gangster':('Shakedown','Flips a lucky coin. Enemies run, or he buys them off.'),
'paramedic':('Triage','A burst of healing light that closes wounds and stops bleeding fast.'),
'office_worker':('Reply All','One sip of coffee and the whole squad hits harder for 2 turns.'),
'hunter':('Fire-craft','Lifts his torch to light the dark and roast meat that heals the squad.'),
'engineer':('Contraptions','Swings her wrench and sparks fly. Builds traps out of scrap.'),
'plague_doctor':('Miasma','A cloud of herb smoke that weakens every enemy it touches.'),
'delivery_rider':('Hot Delivery','Hands out a fresh pizza. The squad heals and moves faster.')}
def cardback(id,z=1.0,frame=None,play=True):
    n,t,r,d,s,w,era,perk=H[id]; sk,tx=SK[id]
    sc=3.2*z if id!='will_slapton' else 2.9*z
    f=PEAK[id] if frame is None else frame
    W=188*z-22*z
    return f'''<div class="cardback r-{r}" style="--z:{z}"><div class="cb-in">
<div class="cb-scene" style="background-image:url({g(ERA[id])})"><span class="cb-era">{era}</span>
<span class="shadow" style="left:{W/2-26*z}px;width:{52*z}px;top:{W*1.25-16*z-4}px"></span>
{fsprite(id,'skill',f,sc,W/2,W*1.25-16*z,play)}</div>
<div class="row"><div class="cb-skill">{sk}</div><div class="sp"></div><span class="tag v" style="font-size:{10*z}px">Skill</span></div>
<div class="cb-text">{tx}</div>
<div class="cb-foot"><span>{perk}</span><span>{RN[r]}</span></div></div></div>'''
import re
def write(name,html):
    html=re.sub(r'>([^<]*)<',lambda m:'>'+m.group(1).replace('fi','f&zwnj;i').replace('fl','f&zwnj;l')+'<',html)
    open(f'{OUT}/{name}.html','w').write(html)

# ---------- HOME ----------
def home():
    party=[('engineer','idle',4,485),('will_slapton','skill',6,590),('legionary','idle',2,695),('gangster','idle',1,778)]
    spr=''.join(fsprite(i,a,f,2.9,x,240) for (i,a,f,x) in party)
    c=f'''<div style="display:grid;grid-template-columns:1fr 318px;gap:12px;height:100%">
<div class="g" style="grid-template-rows:262px auto 1fr;min-height:0">
 <div class="scene" style="background-image:url({g('city_bg')})">
  <div style="position:absolute;left:20px;top:22px;z-index:2;max-width:420px">
   <div class="eb cy">Aldermere, the city that summoned you</div>
   <div class="h" style="font-size:23px;line-height:1.1;margin:4px 0 6px;max-width:400px">Welcome back, Dean. Your heroes never stopped working.</div><div class="mut" style="font-size:13px;max-width:380px;margin-bottom:10px">They mined, fought and hustled for 6 hours. Come see what they brought home.</div>
   <div class="row"><span class="btn l">Collect 6h 12m of loot</span><span class="btn g">See what happened</span></div></div>
  <div style="position:absolute;inset:0;z-index:1">{spr}</div>
  <div style="position:absolute;right:14px;top:14px;z-index:2" class="row"><span class="tag l">5 heroes on shift</span><span class="tag p">1 delve running</span></div>
 </div>
 <div class="g" style="grid-template-columns:repeat(4,1fr)">
  <div class="panel glowc"><div class="ph"><img class="ico px" src="{g('pickaxe')}"><div><h3>Now training</h3><small>Mining Lv 42</small></div></div>
   <div class="row" style="margin-bottom:6px"><img class="ico px" src="{g('moonsilver_ore')}"><b>Moonsilver vein</b><div class="sp"></div><span class="nums cy">1.8s</span></div>
   <div class="bar"><i style="width:62%"></i></div><div class="row" style="margin-top:6px;font-size:12px"><span class="mut">Edith Crane +15% speed</span><div class="sp"></div><span class="lm">+412 ore</span></div></div>
  <div class="panel glow"><div class="ph"><img class="ico px" src="{g('swords')}"><div><h3>Delve: Ash Kitchen</h3><small>Floor 7 of 10</small></div></div>
   <div class="bar p"><i style="width:48%"></i></div><div class="row" style="margin-top:8px;font-size:12px"><span class="mut">Boss in 38m</span><div class="sp"></div><span class="pk">The Hollow Bishop waits</span></div>
   <div class="row" style="margin-top:8px"><span class="btn sm">Watch the fight</span></div></div>
  <div class="panel"><div class="ph"><img class="ico px" src="{g('mask')}"><div><h3>Hustles</h3><small>18 Daring ready</small></div><div class="sp"></div><span class="nav"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:var(--pink);box-shadow:0 0 8px var(--pink)"></span></span></div>
   <div style="font-size:13px;margin-bottom:8px">Rig the dice at the Gilded Rat. <span class="lm">72% to win</span></div>
   <div class="row"><span class="btn sm">Roll the dice</span><span class="mut" style="font-size:11.5px">Costs 5 Daring</span></div></div>
  <div class="panel"><div class="ph"><img class="ico px" src="{g('banner')}"><div><h3>Neon Lanterns</h3><small>Crew goal, 2 days left</small></div></div>
   <div style="font-size:13px;margin-bottom:6px">Fill the crew vault with 50,000 Moonsilver</div>
   <div class="bar l"><i style="width:72%"></i></div><div class="row" style="margin-top:6px;font-size:12px"><span class="mut">36,120 / 50,000</span><div class="sp"></div><span class="lm">You gave 4,880</span></div></div>
 </div>
 <div class="g" style="grid-template-columns:1.3fr 1fr 1fr;min-height:0">
  <div class="panel"><div class="ph"><img class="ico px" src="{g('paper')}"><div><h3>The Aldermere Crier</h3><small>Morning edition</small></div></div>
   <div class="list">
    <div class="li blk"><span class="tag p">Breaking</span><b>Ghoul chef bursts out of the Ash Kitchen.</b> Three crews are hunting it now.</div>
    <div class="li blk"><span class="tag c">Market</span>Moonsilver hits a record 41 gold a bar. Miners are cheering.</div>
    <div class="li blk"><span class="tag l">Pulled</span>Kaz_99 pulled an Unhinged card. The whole tavern went silent.</div>
    <div class="li blk"><span class="tag v">Crews</span>Neon Lanterns climb to 4th place in the Crew Cup.</div></div></div>
  <div class="panel"><div class="ph"><img class="ico px" src="{g('cross')}"><div><h3>Infirmary &amp; Stocks</h3><small>Who's laid up in town</small></div></div>
   <div class="list">
    <div class="li"><img class="px" src="{pt('gangster')}" style="border-radius:6px;object-fit:cover"><div><b>Vincenzo</b><br><small class="mut">In the Stocks for a botched heist</small></div><div class="sp"></div><span class="nums pk">12:40</span></div>
    <div class="li"><img class="px" src="{pt('delivery_rider')}" style="border-radius:6px;object-fit:cover"><div><b>Marco</b><br><small class="mut">Healing after Floor 6</small></div><div class="sp"></div><span class="nums cy">04:15</span></div>
    <div class="li"><span class="btn sm g">Pay his bail, 900 gold</span></div></div></div>
  <div class="panel"><div class="ph"><img class="ico px" src="{g('portal')}"><div><h3>Waystones</h3><small>Travel to other cities</small></div></div>
   <div class="list">
    <div class="li"><b>Port Sable</b><span class="sp"></span><span class="mut">Eels sell for double</span></div>
    <div class="li"><b>Emberfall</b><span class="sp"></span><span class="mut">Cheap ember ore</span></div>
    <div class="li"><b>The Frost Market</b><span class="sp"></span><span class="lm">Rare cards on sale</span></div>
    <div class="li"><span class="btn sm c">Step through, 25 min</span></div></div></div>
 </div>
</div>
<div class="panel glow" style="display:flex;flex-direction:column;align-items:center;gap:10px;background:radial-gradient(300px 260px at 50% 30%,rgba(229,38,46,.25),transparent 70%),linear-gradient(180deg,rgba(26,15,49,.9),rgba(16,9,31,.92))">
 <div class="row" style="align-self:stretch"><span class="tag p">Featured this week</span><div class="sp"></div><span class="mut" style="font-size:12px">Ends in 3d 4h</span></div>
 {card_front('will_slapton',lv=1,size=1.5)}
 <div style="text-align:center;font-size:13px;line-height:1.4">He was walking back to his seat at the biggest awards show on Earth when the Circle grabbed him. <b class="pk">A goblin made one joke. Nobody has seen that goblin since.</b></div>
 <div class="row"><span class="btn">Summon for 1 sigil</span><span class="btn g">Flip card</span></div>
</div></div>'''
    write('home',desktop('City','Aldermere','City Hub',c))

# ---------- MINING ----------
def mining():
    rocks=[('Copper vein','rock_copper','copper_ore',1,'5 XP','2.0s',99,100,False),('Iron vein','rock_copper','iron_ore',15,'14 XP','2.6s',87,100,False),
    ('Moonsilver vein','rock_moon','moonsilver_ore',40,'38 XP','3.0s',41,62,True),('Ember vein','rock_ember','ember_ore',55,'60 XP','3.6s',0,0,False),('Void vein','rock_moon','void_ore',70,'95 XP','4.2s',0,0,False),('Starfall crater','rock_ember','gem_violet',85,'140 XP','5.0s',0,0,False)]
    cards=''
    for nm,rk,ore,lv,xp,t,m,p,act in rocks:
        lock=lv>42
        cards+=f'''<div class="panel {'glowc' if act else ''}" style="{'opacity:.5' if lock else ''};padding:10px">
<div class="row"><img class="px" src="{g(rk)}" style="width:64px;height:64px;{'filter:grayscale(1) brightness(.5)' if lock else ''}"><div style="flex:1"><b class="h" style="font-size:15px">{nm}</b><div class="mut" style="font-size:12px">{'Unlocks at Lv '+str(lv) if lock else xp+' · '+t}</div>
<div class="row" style="margin-top:4px"><img class="px" src="{g(ore)}" style="width:20px">{'<span class="tag">Locked</span>' if lock else f'<span class="tag c">Mastery {m}</span>'}</div></div></div>
<div class="bar {'' if act else ''}" style="margin-top:8px;height:6px"><i style="width:{p}%"></i></div></div>'''
    c=f'''<div style="display:grid;grid-template-columns:1fr 300px;gap:12px;height:100%">
<div class="g" style="grid-template-rows:auto 250px auto 1fr;min-height:0">
 <div class="panel"><div class="row" style="gap:16px"><img class="px" src="{g('pickaxe')}" style="width:44px"><div style="flex:1"><div class="row"><b class="h" style="font-size:20px">Mining</b><span class="tag l">Lv 42 / 99</span><div class="sp"></div><span class="mut nums" style="font-size:12px">48,210 / 61,512 XP</span></div><div class="bar thick" style="margin-top:6px"><i style="width:78%"></i></div></div>
 <div style="width:260px"><div class="row" style="font-size:12px"><b>Mastery Pool</b><div class="sp"></div><span class="mut nums">38%</span></div><div class="bar p" style="margin-top:6px"><i style="width:38%"></i></div><small class="dim">At 50% every vein mines 5% faster</small></div></div></div>
 <div class="scene" style="background-image:url({g('mine_bg')})">
  <img class="px" src="{g('rock_moon')}" style="position:absolute;left:470px;top:116px;width:128px;z-index:1">
  <div style="position:absolute;inset:0;z-index:2">{sprite('engineer','attack',3,3,400,232)}</div>
  <div style="position:absolute;left:12px;top:12px;z-index:3;background:rgba(7,4,13,.72);padding:8px 12px;border-radius:10px;border:1px solid var(--line)"><div class="eb cy">Mining now</div><div class="h" style="font-size:22px">Moonsilver vein</div><div class="mut" style="font-size:12.5px">Edith swings. The rock cracks. Glowing ore spills out.</div></div>
  <div style="position:absolute;left:18px;right:18px;bottom:14px;z-index:3" class="row"><div class="bar thick" style="flex:1"><i style="width:62%"></i></div><span class="nums cy">1.8s</span><span class="btn sm g">Stop</span></div></div>
 <div class="g" style="grid-template-columns:repeat(3,1fr);align-content:start">{cards}</div>
 <div class="panel"><div class="ph"><h3>Mastery Pool rewards</h3><small>Shared by every vein</small></div><div class="g" style="grid-template-columns:repeat(4,1fr)">
 {''.join(f'<div class="panel" style="padding:10px;{"border-color:rgba(198,255,61,.4)" if on else ""}"><div class="row"><b class="{"lm" if on else "mut"}">{pc}</b><div class="sp"></div><span class="tag {"l" if on else ""}">{"Active" if on else "Locked"}</span></div><div style="font-size:12.5px;margin-top:4px">{t}</div></div>' for pc,t,on in [('10%','+5% Mining XP',True),('25%','Veins never run dry',True),('50%','Every vein mines 5% faster',False),('95%','Double ore on every swing',False)])}</div></div>
</div>
<div class="g" style="align-content:start">
 <div class="panel"><div class="ph"><h3>Hero on this skill</h3></div><div class="row" style="align-items:flex-start;gap:12px">{card_front('engineer',lv=4,size=.62)}<div style="font-size:12.5px"><b class="lm">Mining +15% speed</b><br><span class="mut">Edith reads rock like a blueprint. Level her card to make it faster.</span><br><br><span class="btn sm g">Swap hero</span></div></div></div>
 <div class="panel"><div class="ph"><h3>This session</h3><div class="sp"></div><small>2h 14m</small></div><div class="list">
  <div class="li"><img class="px" src="{g('moonsilver_ore')}">Moonsilver ore<span class="sp"></span><b class="nums">+412</b></div>
  <div class="li"><img class="px" src="{g('gem_violet')}">Violet gem<span class="sp"></span><b class="nums vi">+3</b></div>
  <div class="li"><img class="px" src="{g('clock')}">Mining XP<span class="sp"></span><b class="nums cy">+15,656</b></div>
  <div class="li"><img class="px" src="{g('cards')}"><span>Card shard <span class="pk">rare drop!</span></span><span class="sp"></span><b class="nums pk">+1</b></div></div></div>
 <div class="panel"><div class="ph"><h3>Next unlock</h3></div><div class="row"><img class="px" src="{g('rock_ember')}" style="width:48px"><div style="font-size:12.5px"><b>Ember vein at Lv 55</b><br><span class="mut">Ember ore makes the blades that cut ghouls.</span></div></div></div>
</div></div>'''
    write('skill_mining',desktop('Mining','Skills','Mining',c))

# ---------- CARDS ----------
def cards():
    order=['will_slapton','legionary','gangster','engineer','plague_doctor','paramedic','hunter','office_worker','delivery_rider']
    grid=''
    for i in range(24):
        if i<len(order):
            id=order[i]; n,t,r,*_=H[id]
            grid+=f'<div class="mini-card r-{r}"><div class="in"><img class="px" src="{pt(id)}"></div><div class="nm">{n}<small>{RN[r]}</small></div></div>'
        else: grid+='<div class="mini-card lock"><div class="in"><b>?</b></div></div>'
    eras=''.join(f'<span class="tag {"p" if k==0 else ""}">{e}</span>' for k,e in enumerate(['All eras','Ancient','Medieval','Victorian','1920s','Modern','Pop culture']))
    rar=''.join(f'<span class="tag" style="color:var(--rc);border-color:var(--rc)" class="r-{r}">{RN[r]}</span>'.replace('class="tag"',f'class="tag r-{r}"') for r in ['common','uncommon','rare','epic','legendary','absurd','unhinged'])
    sets=''.join(f'<div class="li"><b>{a}</b><span class="sp"></span><span class="mut nums">{b}</span><div class="bar {c}" style="width:90px"><i style="width:{p}%"></i></div></div>' for a,b,c,p in [('Legions of Rome','3 / 12','',25),('Prohibition Row','2 / 10','p',20),('Red Carpet Legends','1 / 15','p',7),('Heroes of the Ward','4 / 8','l',50)])
    c=f'''<div style="display:grid;grid-template-columns:1fr 470px;gap:12px;height:100%">
<div class="g" style="grid-template-rows:auto auto auto;align-content:start;min-height:0">
 <div class="panel"><div class="row"><b class="h" style="font-size:20px">Your collection</b><span class="tag l">41 / 1,200 found</span><div class="sp"></div><span class="btn sm">Open a pack</span></div>
  <div class="row" style="margin-top:10px;flex-wrap:wrap">{eras}</div><div class="row" style="margin-top:6px;flex-wrap:wrap">{rar}</div></div>
 <div class="panel" style="display:grid;grid-template-columns:repeat(8,1fr);gap:8px;align-content:start">{grid}</div>
 <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:12px"><div class="panel"><div class="ph"><h3>Era sets</h3><small>Finish a set for a permanent bonus and a gold frame</small></div><div class="list">{sets}</div></div>
  <div class="panel"><div class="ph"><h3>Dupes become power</h3></div><div style="font-size:12.5px" class="mut">Every extra copy levels the card up. Level 5 unlocks its gear slot. Level 10 turns the frame gold.</div><div class="row" style="margin-top:10px"><span class="btn sm c">Level up 3 cards</span></div></div></div>
 </div>
<div class="panel glow" style="display:flex;flex-direction:column;gap:10px"><div class="row"><h3 class="h" style="font-size:16px">Will Slapton</h3><span class="tag p">Absurd</span><div class="sp"></div><span class="mut" style="font-size:12px">Tap a card to flip it</span></div>
 <div class="row" style="align-items:flex-start;gap:14px;justify-content:center">{card_front('will_slapton',lv=1,size=1.07)}{cardback('will_slapton',z=1.07)}</div>
 <div class="row" style="justify-content:center;gap:28px;font-size:12px" class="mut"><span class="mut">Front</span><span class="mut">Back: his skill, live</span></div>
 <div class="list" style="font-size:12.5px"><div class="li"><img class="px" src="{it('item_red_carpet_tux')}"><b>Red Carpet Tux</b><span class="sp"></span><span class="mut">+3 Guard</span></div>
 <div class="li"><img class="px" src="{it('item_golden_statuette')}"><b>Golden Statuette</b><span class="sp"></span><span class="mut">+2 Might, +2 Knack</span></div></div>
 <div class="row"><span class="btn">Send on a delve</span><span class="btn g">Show to my crew</span></div></div></div>'''
    write('cards',desktop('Cards','Adventure','Cards',c))

# ---------- DELVE ----------
def delve():
    scene=(sprite('legionary','idle',2,3,170,250)+sprite('will_slapton','skill',5,3,280,250) if 'will_slapton' in SP else sprite('legionary','idle',2,3,170,250))
    scene=sprite('legionary','idle',2,3,150,290)+sprite('paramedic','idle',1,3,250,290)+sprite('engineer','attack',3,3,360,290)+sprite('ghoul','hit',1,3,560,290)+sprite('skeleton','idle',2,3,690,290)
    party=''
    for id,hp,mx in [('legionary',182,210),('paramedic',96,140),('engineer',120,130)]:
        n,t,r,d,s,w,*_=H[id]
        party+=f'''<div class="li"><img class="px" src="{pt(id)}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid var(--rc)" ><div style="flex:1"><div class="row"><b>{n}</b><div class="sp"></div><span class="nums mut" style="font-size:12px">{hp}/{mx}</span></div><div class="bar l" style="height:6px;margin-top:3px"><i style="width:{hp*100//mx}%"></i></div><div class="bar" style="height:3px;margin-top:3px"><i style="width:{(hp*7)%100}%"></i></div></div></div>'''
    log=''.join(f'<div class="li" style="font-size:12.5px">{x}</div>' for x in ['<b class="cy">Edith</b> rams her wrench into the ghoul. <b class="pk">38 damage!</b>','The ghoul shrieks and hurls a pot of boiling soup.','<b class="cy">Gaius</b> lifts his shield. The soup splashes off harmlessly.','<b class="lm">Maya</b> patches up Edith. +24 Life.','A skeleton rattles out of the pantry, sword raised.','<b class="cy">Gaius</b> slams his shield into the skeleton. <b class="pk">22 damage!</b>','The ghoul is down to its last bit of strength. One more hit could end it.'])
    c=f'''<div style="display:grid;grid-template-columns:1fr 300px;gap:12px;height:100%">
<div class="g" style="grid-template-rows:auto 340px 1fr;min-height:0">
 <div class="panel"><div class="row"><img class="px ico" src="{g('swords')}"><b class="h" style="font-size:20px">The Ash Kitchen</b><span class="tag p">Floor 7 of 10</span><div class="sp"></div>
 {''.join(f'<span style="width:34px;height:8px;border-radius:4px;background:{"var(--pink)" if i<6 else ("linear-gradient(90deg,var(--pink) 50%,rgba(255,255,255,.1) 50%)" if i==6 else "rgba(255,255,255,.1)")}"></span>' for i in range(10))}<img class="px" src="{g('skull')}" style="width:22px"></div></div>
 <div class="scene" style="background-image:url({A}/bg_dungeon.png)"><div style="position:absolute;inset:0;z-index:2">{scene}</div>
  <div style="position:absolute;left:16px;top:12px;z-index:3"><div class="eb pk">Room 3 of 5</div><div class="h" style="font-size:20px">A ghoul guards the boiling pots</div></div>
  <div style="position:absolute;right:16px;top:12px;z-index:3;width:250px" class="g"><div><div class="row" style="font-size:12px"><b>Ash Ghoul</b><div class="sp"></div><span class="nums">44/120</span></div><div class="bar p" style="height:6px;margin-top:3px"><i style="width:37%"></i></div></div><div><div class="row" style="font-size:12px"><b>Skeleton</b><div class="sp"></div><span class="nums">80/80</span></div><div class="bar p" style="height:6px;margin-top:3px"><i style="width:100%"></i></div></div></div>
  <div style="position:absolute;left:540px;top:150px;z-index:3;font:700 26px 'Pixelify Sans';color:var(--pink);text-shadow:0 0 12px var(--pink)">-38</div></div>
 <div class="g" style="grid-template-columns:1fr 1fr;min-height:0">
  <div class="panel"><div class="ph"><h3>Your squad</h3><small>Auto-fighting</small></div><div class="list">{party}</div></div>
  <div class="panel"><div class="ph"><h3>Battle log</h3></div><div class="list">{log}</div></div></div>
</div>
<div class="g" style="align-content:start">
 <div class="panel glow"><div class="ph"><h3>Big moment</h3></div><div style="font-size:13px;margin-bottom:10px">The ghoul is staggering. <b>Push now</b> or play it safe?</div>
  <div class="g" style="gap:8px"><span class="btn">Kick the boiling pot at it</span><span class="btn c">Raise the shield wall</span><span class="btn g">Eat and heal first</span></div></div>
 <div class="panel"><div class="ph"><h3>Food</h3></div><div class="row">{slot(g('eel_stew'),'uncommon','24')}{slot(g('potion_pink'),'rare','6')}{slot(g('potion_cyan'),'rare','3')}{slot('', 'common','','empty')}</div><small class="dim">Your squad eats automatically below 40% Life.</small></div>
 <div class="panel"><div class="ph"><h3>Loot so far</h3></div><div class="row" style="flex-wrap:wrap">{slot(g('ash_log'),'common','18')}{slot(g('iron_bar'),'uncommon','6')}{slot(g('gem_violet'),'epic','1')}{slot(g('cards'),'rare','2')}{slot(g('coin'),'common','840')}</div></div>
 <div class="panel"><div class="row"><img class="px" src="{g('boss_bishop')}" style="width:64px"><div style="font-size:12.5px"><b class="pk">Boss: The Hollow Bishop</b><br><span class="mut">Floor 10. Drops the Unhinged card <b>Saint of Ash</b>.</span></div></div></div>
</div></div>'''
    write('delve',desktop('Delve','Adventure','Delve',c))

# ---------- BANK ----------
def bank():
    items=[('copper_ore','common','2.4k'),('iron_ore','common','1.1k'),('moonsilver_ore','rare','412'),('ember_ore','epic','36'),('void_ore','epic','8'),('iron_bar','uncommon','220'),('moonsilver_bar','rare','64'),('ash_log','common','3.2k'),('raw_eel','common','540'),('eel_stew','uncommon','188'),('potion_pink','rare','14'),('potion_cyan','rare','9'),('gem_violet','epic','5'),('cards','rare','12'),('summon_sigil','legendary','7'),('trophy','legendary','1'),('skull','uncommon','77'),('chest','rare','3')]
    its=['rusty_gladius','violin_case','defib_paddles','brass_goggles','herb_pomander','trench_lantern','stained_mug','courier_helmet','shield_lost_ninth','steam_gauntlet','pinstripe_fedora','medic_bag']
    cells=''.join(slot(g(i),r,q,'on' if i=='moonsilver_bar' else '') for i,r,q in items)+''.join(slot(it(i),['rare','epic','uncommon'][k%3],'') for k,i in enumerate(its))+''.join(slot('','common','','empty') for _ in range(66))
    cells=cells.replace('<img class="px" src="">','')
    c=f'''<div style="display:grid;grid-template-columns:1fr 330px;gap:12px;height:100%">
<div class="panel" style="min-height:0"><div class="row" style="margin-bottom:10px"><b class="h" style="font-size:20px">Bank</b><span class="tag">142 / 200 slots</span><div class="sp"></div>{''.join(f'<span class="tag {"p" if k==0 else ""}">{x}</span>' for k,x in enumerate(['Everything','Ores','Bars','Food','Gear','Cards']))}<span class="tag c">Worth 182,400 gold</span></div>
 <div style="display:grid;grid-template-columns:repeat(12,52px);gap:8px;justify-content:start">{cells}</div></div>
<div class="g" style="align-content:start">
 <div class="panel glowc"><div class="row"><div class="slot r-rare" style="width:64px;height:64px"><img class="px" src="{g('moonsilver_bar')}" style="width:52px;height:52px"></div><div><b class="h" style="font-size:17px">Moonsilver bar</b><br><span class="tag c">Rare</span> <span class="mut" style="font-size:12px">x64</span></div></div>
  <div class="mut" style="font-size:12.5px;margin:8px 0">Cold to the touch and glowing. Smiths turn it into blades that hurt ghosts.</div>
  <div class="row"><span class="btn sm c">Sell for 41 each</span><span class="btn sm g">List on Market</span></div></div>
 <div class="panel"><div class="ph"><img class="ico px" src="{g('anvil')}"><div><h3>Smithing</h3><small>Lv 39</small></div></div>
  <div class="row" style="margin-bottom:8px"><img class="px" src="{it('rusty_gladius')}" style="width:40px"><div><b>Moonsilver Gladius</b><br><small class="mut">Might +6 · Hurts ghosts</small></div></div>
  <div class="row" style="font-size:12px;margin-bottom:8px">{slot(g('moonsilver_bar'),'rare','4')}{slot(g('ash_log'),'common','2')}<span class="mut">→</span>{slot(it('rusty_gladius'),'epic','1')}</div>
  <div class="bar" style="margin-bottom:8px"><i style="width:30%"></i></div>
  <div class="row"><span class="btn sm">Forge 16 swords</span><span class="mut" style="font-size:12px">4.0s each · 120 XP</span></div></div>
 <div class="panel"><div class="ph"><h3>Gaius is using</h3></div><div class="row">{slot(it('rusty_gladius'),'rare')}{slot(it('shield_lost_ninth'),'epic')}{slot(it('hobnailed_caligae'),'uncommon')}{slot('','common','','empty')}</div></div>
</div></div>'''.replace('<img class="px" src="">','')
    write('bank',desktop('Bank','Adventure','Bank',c))

# ---------- MARKET ----------
def market():
    rows=[('moonsilver_bar','Moonsilver bar','41','+12%','lm','1,204'),('ember_ore','Ember ore','88','+4%','lm','310'),('eel_stew','Eel stew','9','-3%','pk','8,842'),('potion_pink','Healing draught','64','+1%','lm','520'),('cards','Card pack','1,250','+22%','lm','96'),('gem_violet','Violet gem','2,400','-8%','pk','41')]
    tb=''.join(f'<div class="li"><img class="px" src="{g(i)}"><b style="width:160px">{n}</b><span class="nums" style="width:80px">{p}g</span><span class="nums {c}" style="width:60px">{d}</span><span class="mut nums" style="width:70px">{v}</span><span class="sp"></span><span class="btn sm c">Buy</span><span class="btn sm g">Sell</span></div>' for i,n,p,d,c,v in rows)
    cardsale=''.join(f'<div class="li"><img class="px" src="{pt(id)}" style="width:36px;height:36px;border-radius:6px;object-fit:cover"><div><b>{H[id][0]}</b><br><small class="mut">{RN[H[id][2]]} · Lv {lv} · by {who}</small></div><span class="sp"></span><b class="nums">{p}g</b><span class="btn sm">Buy</span></div>' for id,lv,who,p in [('gangster',3,'Kaz_99','18,500'),('plague_doctor',2,'moth','9,900'),('hunter',4,'Brokk_fan','4,800')])
    c=f'''<div style="display:grid;grid-template-columns:1fr 1fr 300px;gap:12px;height:100%;align-content:start">
<div class="panel" style="grid-column:span 2"><div class="row" style="margin-bottom:6px"><b class="h" style="font-size:20px">Market</b><span class="tag c">Prices move as players trade</span><div class="sp"></div><span class="btn sm">Sell something</span></div>
 <div class="li dim" style="font-size:11px;text-transform:uppercase;letter-spacing:.12em"><span style="width:26px"></span><span style="width:160px">Item</span><span style="width:80px">Price</span><span style="width:60px">Today</span><span style="width:70px">For sale</span></div>{tb}</div>
<div class="panel glow" style="grid-row:span 2"><div class="ph"><img class="ico px" src="{g('portal')}"><div><h3>Waystone deals</h3><small>Buy cheap abroad, sell at home</small></div></div>
 <div class="list"><div class="li"><b>Port Sable</b><span class="sp"></span><span class="lm">Eel stew 4g</span></div><div class="li"><b>Emberfall</b><span class="sp"></span><span class="lm">Ember ore 51g</span></div><div class="li"><b>Frost Market</b><span class="sp"></span><span class="lm">Ice Age cards</span></div><div class="li"><b>Old Rome Gate</b><span class="sp"></span><span class="lm">Legion gear</span></div></div>
 <div class="mut" style="font-size:12.5px;margin:8px 0">You can carry 30 items per trip. Bandits strike the Emberfall road at night.</div><span class="btn c">Plan a trip</span>
 <div class="ph" style="margin-top:16px"><h3>Your orders</h3></div><div class="list"><div class="li">Selling 20 Moonsilver bars<span class="sp"></span><span class="lm">14 sold</span></div><div class="li">Buying Gangster card<span class="sp"></span><span class="mut">Waiting</span></div></div></div>
<div class="panel" style="grid-column:span 3"><div class="ph"><img class="ico px" src="{g('moonsilver_bar')}"><div><h3>Moonsilver bar, last 7 days</h3><small>Up 12% today. A crew is buying everything for the Bishop raid.</small></div><div class="sp"></div><b class="h lm" style="font-size:20px">41g</b></div>
<svg viewBox="0 0 1000 110" style="width:100%;height:64px" preserveAspectRatio="none"><defs><linearGradient id="gg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#36d6ff" stop-opacity=".35"/><stop offset="1" stop-color="#36d6ff" stop-opacity="0"/></linearGradient></defs><polygon fill="url(#gg)" points="0,110 0,80 90,74 180,86 270,70 360,72 450,60 540,66 630,52 720,58 810,40 900,30 1000,12 1000,110"/><polyline fill="none" stroke="#36d6ff" stroke-width="3" points="0,80 90,74 180,86 270,70 360,72 450,60 540,66 630,52 720,58 810,40 900,30 1000,12"/></svg></div>
<div class="panel" style="grid-column:span 2"><div class="ph"><img class="ico px" src="{g('cards')}"><div><h3>Cards for sale</h3><small>Trade with real players</small></div></div><div class="list">{cardsale}</div></div>
</div>'''
    write('market',desktop('Market','The City','Market',c))

# ---------- HUSTLES ----------
def hustles():
    H2=[('Pick pockets at the Night Market','Daring 2',92,'12 to 40 gold','A slap on the wrist'),('Rig the dice at the Gilded Rat','Daring 5',72,'150 gold, maybe a card shard','10 min in the Stocks'),('Smuggle moonsilver past the guards','Daring 10',54,'600 gold','25 min in the Stocks'),('Rob the Duke\'s carriage','Daring 15',31,'2,500 gold and a rare drop','1 hour in the Infirmary'),('Steal the Archmage\'s summoning ledger','Daring 25',0,'A guaranteed Epic card','Needs Hustle Lv 40')]
    rows=''
    for n,cost,ch,rew,risk in H2:
        lock=ch==0
        rows+=f'''<div class="panel" style="padding:10px;{'opacity:.5' if lock else ''}"><div class="row"><img class="px ico" src="{g('mask' if not lock else 'shackle')}"><div style="flex:1"><b>{n}</b><div style="font-size:12px"><span class="lm">Win: {rew}</span> · <span class="pk">Fail: {risk}</span></div></div>
<div style="width:120px"><div class="row" style="font-size:11.5px"><span class="mut">Chance</span><div class="sp"></div><b class="nums">{ch}%</b></div><div class="bar l" style="height:5px;margin-top:3px"><i style="width:{ch}%"></i></div></div><span class="tag p">{cost}</span><span class="btn sm {'g' if lock else ''}">{'Locked' if lock else 'Do it'}</span></div></div>'''
    c=f'''<div style="display:grid;grid-template-columns:1fr 320px;gap:12px;height:100%">
<div class="g" style="align-content:start">
 <div class="panel"><div class="row" style="gap:14px"><img class="px" src="{g('mask')}" style="width:44px"><div style="flex:1"><div class="row"><b class="h" style="font-size:20px">Hustles</b><span class="tag l">Hustle Lv 23</span><div class="sp"></div><span class="mut nums" style="font-size:12px">Daring 18 / 25, +1 every 4 min</span></div><div class="bar p thick" style="margin-top:6px"><i style="width:72%"></i></div></div></div>
 <div class="mut" style="font-size:12.5px;margin-top:8px">Quick jobs on the wrong side of the law. Spend Daring, take your chances, and grab gold the fast way. Get caught and you sit in the Stocks.</div></div>
 {rows}
 <div class="panel glow"><div class="ph"><img class="ico px" src="{g('dice')}"><div><h3>Crew heist: The Royal Mint</h3><small>Plan it with 4 crewmates. Takes 2 hours to pull off.</small></div><div class="sp"></div><span class="tag l">Huge payout</span></div>
 <div class="row" style="gap:14px">{''.join(f'<div class="row" style="padding:6px 10px 6px 6px;border:1px solid var(--line2);border-radius:12px"><img class="px" src="{pt(i)}" style="width:34px;height:34px;border-radius:8px;object-fit:cover"><div><b style="font-size:12.5px">{r}</b><br><small class="mut">{n}</small></div></div>' for i,r,n in [('gangster','Lockpick','Kaz_99'),('engineer','Gadgets','Dean'),('paramedic','Lookout','Lina')])}<div class="row" style="padding:6px 10px;border:1px dashed var(--line2);border-radius:12px;color:var(--mut)">Driver needed</div><div class="sp"></div><span class="btn">Join the heist</span></div>
 <div class="mut" style="font-size:12.5px;margin-top:8px">Split 40,000 gold four ways, plus a shot at the Legendary card <b class="vi">The Golden Vault</b>. If the guards catch you, the whole crew sits in the Stocks.</div></div>
</div>
<div class="g" style="align-content:start">
 <div class="panel glow"><div class="ph"><img class="ico px" src="{g('shackle')}"><div><h3>The Stocks</h3><small>The town jail</small></div></div>
  <div class="row"><img class="px" src="{pt('gangster')}" style="width:44px;height:44px;border-radius:8px;object-fit:cover"><div style="flex:1"><b>Vincenzo is locked up</b><br><small class="mut">Caught smuggling moonsilver</small></div><b class="nums pk">12:40</b></div>
  <div class="row" style="margin-top:10px"><span class="btn sm">Pay bail, 900g</span><span class="btn sm g">Ask the crew</span></div></div>
 <div class="panel"><div class="ph"><h3>Last 5 jobs</h3></div><div class="list">
  <div class="li"><span class="lm">Won</span> Picked a fat noble's pocket<span class="sp"></span><b class="nums">+38g</b></div>
  <div class="li"><span class="lm">Won</span> The dice rolled your way<span class="sp"></span><b class="nums">+150g</b></div>
  <div class="li"><span class="pk">Caught</span> A guard grabbed your collar<span class="sp"></span><b class="nums pk">Stocks</b></div>
  <div class="li"><span class="lm">Won</span> Found a card shard in a purse<span class="sp"></span><b class="nums vi">+1</b></div></div></div>
 <div class="panel"><div class="ph"><h3>Hero bonus</h3></div><div class="row">{card_front('gangster',lv=3,size=.55)}<div style="font-size:12.5px"><b class="lm">+15% hustle chance</b><br><span class="mut">Vincenzo has done this before. Many times.</span></div></div></div>
</div></div>'''
    write('hustles',desktop('Hustles','The City','Hustles',c))

# ---------- CREW ----------
def crew():
    mem=[('engineer','Dean','Leader','Mining 42',True),('gangster','Kaz_99','Officer','Delving Floor 9',True),('paramedic','Lina','Member','Cooking 51',True),('hunter','Brokk_fan','Member','In the Infirmary',False),('plague_doctor','moth','Member','Hustling',True),('office_worker','Gus','Recruit','Offline 3h',False)]
    ms=''.join(f'<div class="li"><img class="px" src="{pt(i)}" style="width:36px;height:36px;border-radius:8px;object-fit:cover"><div><b>{n}</b> <span class="tag {"p" if r=="Leader" else ""}">{r}</span><br><small class="mut">{a}</small></div><span class="sp"></span><span style="width:8px;height:8px;border-radius:50%;background:{"var(--lime)" if on else "var(--dim)"}"></span></div>' for i,n,r,a,on in mem)
    chat=''.join(f'<div class="li" style="align-items:flex-start"><img class="px" src="{pt(i)}" style="width:28px;height:28px;border-radius:6px;object-fit:cover"><div><b class="{c}">{n}</b> <small class="dim">{t}</small><br>{m}</div></div>' for i,n,c,t,m in [('gangster','Kaz_99','pk','8:02 PM','Ghoul chef is on Floor 9. Who has fire potions?'),('paramedic','Lina','lm','8:03 PM','I just cooked 40 eel stews. Grab them from the crew vault!'),('engineer','Dean','cy','8:05 PM','Pulled Will Slapton!! He stunned the boss in one slap'),('plague_doctor','moth','vi','8:06 PM','No way. Send him on our raid tonight.'),('hunter','Brokk_fan','lm','8:07 PM','Still stuck in the Infirmary. Floor 6 ghoul got me good.'),('gangster','Kaz_99','pk','8:08 PM','Who wants in on the Royal Mint heist? We need a driver.'),('office_worker','Gus','cy','8:10 PM','Me! First heist. What do I bring?'),('paramedic','Lina','lm','8:10 PM','Bring snacks and run fast 😄'.replace(' 😄','. You will be fine!'))])
    c=f'''<div style="display:grid;grid-template-columns:300px 1fr 300px;gap:12px;height:100%">
<div class="g" style="align-content:start"><div class="panel glow"><div class="row"><img class="px" src="{g('banner')}" style="width:52px"><div><b class="h" style="font-size:19px">Neon Lanterns</b><br><small class="mut">18 / 25 members · Rank 4</small></div></div>
 <div class="mut" style="font-size:12.5px;margin:8px 0">We mine, we delve, we split the loot. Be nice and show up for raids.</div><div class="row"><span class="tag l">Crew perk: +5% XP</span><span class="tag c">Vault 36k ore</span></div></div>
 <div class="panel"><div class="ph"><h3>Members</h3><small>12 online</small></div><div class="list">{ms}</div></div></div>
<div class="panel" style="display:flex;flex-direction:column"><div class="ph"><img class="ico px" src="{g('chat')}"><h3>Crew chat</h3><div class="sp"></div><span class="tag l">Live</span></div><div class="list" style="flex:1">{chat}</div>
 <div class="row" style="padding:8px;border:1px solid var(--line2);border-radius:12px;background:rgba(0,0,0,.25)"><span class="mut" style="flex:1">Say something to your crew...</span><span class="btn sm">Send</span></div></div>
<div class="g" style="align-content:start">
 <div class="panel"><div class="ph"><h3>This week's goal</h3></div><div style="font-size:13px">Fill the vault with 50,000 Moonsilver</div><div class="bar l" style="margin:8px 0"><i style="width:72%"></i></div><small class="mut">Reward: an Epic card pack for every member</small></div>
 <div class="panel glow"><div class="ph"><img class="ico px" src="{g('swords')}"><div><h3>Crew raid tonight</h3><small>9:00 PM</small></div></div><div class="row"><img class="px" src="{g('boss_bishop')}" style="width:56px"><div style="font-size:12.5px"><b class="pk">The Hollow Bishop</b><br><span class="mut">Bring 5 heroes each. 14 signed up.</span></div></div><span class="btn" style="margin-top:8px">Sign up my squad</span></div>
 <div class="panel"><div class="ph"><img class="ico px" src="{g('trophy')}"><h3>Crew Cup</h3></div><div class="list"><div class="li">1. Ironclad Rats<span class="sp"></span><b class="nums">48,200</b></div><div class="li">2. Moth Court<span class="sp"></span><b class="nums">44,950</b></div><div class="li">3. The Ninth<span class="sp"></span><b class="nums">40,100</b></div><div class="li" style="color:var(--pink)">4. Neon Lanterns<span class="sp"></span><b class="nums">38,770</b></div></div></div>
</div></div>'''
    write('crew',desktop('Crew','The City','Crew',c))

# ---------- PHONE ----------
def welcome_phone():
    c=f'''<div class="scene" style="height:200px;background-image:url({g('city_bg')})"><div style="position:absolute;inset:0;z-index:1">{fsprite('engineer','idle',2,2.6,100,180)}{fsprite('will_slapton','skill',6,2.6,195,182)}{fsprite('legionary','idle',4,2.6,290,180)}</div>
<div style="position:absolute;left:14px;top:12px;z-index:2"><div class="eb cy">You were away 9h 40m</div><div class="h" style="font-size:24px;line-height:1.05">Welcome back, Dean!</div></div></div>
<div class="panel"><div class="ph"><h3>While you were gone</h3><div class="sp"></div><small>Up to 24h counts</small></div><div class="list">
<div class="li"><img class="px" src="{g('moonsilver_ore')}"><span>Edith mined Moonsilver</span><span class="sp"></span><b class="lm nums">+1,804</b></div>
<div class="li"><img class="px" src="{g('pickaxe')}"><span>Mining went up</span><span class="sp"></span><b class="cy">Lv 41 → 42</b></div>
<div class="li"><img class="px" src="{g('swords')}"><span>Delve cleared Floors 5 to 7</span><span class="sp"></span><b class="pk nums">+3</b></div>
<div class="li"><img class="px" src="{g('coin')}"><span>Your Market orders sold</span><span class="sp"></span><b class="nums">+5,740g</b></div>
<div class="li"><img class="px" src="{g('cards')}"><span><b class="pk">New card found!</b></span><span class="sp"></span><b class="vi">Rare</b></div></div></div>
<div class="panel glow"><div class="row"><img class="px" src="{pt('gangster')}" style="width:42px;height:42px;border-radius:8px;object-fit:cover"><div style="font-size:12.5px"><b>Vincenzo got caught hustling.</b><br><span class="mut">He's out of the Stocks in 12 min.</span></div></div></div>
<div class="panel"><div class="row"><img class="px ico" src="{g('chat')}"><div style="font-size:12.5px"><b>Crew chat: 14 new messages</b><br><span class="mut">Kaz_99: raid at 9! bring fire potions</span></div></div></div>
<span class="btn l" style="height:46px;font-size:15px">Collect everything</span>'''
    write('phone_welcome',phone('City',c,now=False))
def home_phone():
    c=f'''<div class="scene" style="height:180px;background-image:url({g('city_bg')})"><div style="position:absolute;inset:0;z-index:1">{fsprite('legionary','idle',2,2.4,70,166)}{fsprite('engineer','idle',4,2.4,145,166)}{fsprite('will_slapton','skill',6,2.4,225,168)}{fsprite('paramedic','idle',1,2.4,305,166)}</div>
<div style="position:absolute;left:12px;top:10px;z-index:2"><div class="eb cy">Aldermere</div><div class="h" style="font-size:20px">Your squad is on shift</div></div></div>
<div class="row" style="gap:6px">{meter('Vigor','bolt','c',72,100,'+5 in 4:12').replace('width:168px','flex:1')}{meter('Daring','flame','p',18,25,'+1 in 2:40').replace('width:168px','flex:1')}</div>
<div class="panel glow" style="display:flex;gap:12px;align-items:center;background:radial-gradient(200px 160px at 20% 50%,rgba(229,38,46,.28),transparent 70%),linear-gradient(180deg,rgba(26,15,49,.9),rgba(16,9,31,.92))">{card_front('will_slapton',lv=1,size=.68)}<div><span class="tag p">Featured</span><div class="h" style="font-size:18px;margin:4px 0">Will Slapton</div><div class="mut" style="font-size:12px">One slap stuns any enemy. Double damage if they just told a joke.</div><span class="btn sm" style="margin-top:8px">Summon, 1 sigil</span></div></div>
<div class="g" style="grid-template-columns:1fr 1fr;gap:8px">
<div class="panel" style="padding:10px"><div class="row"><img class="px ico" src="{g('swords')}"><b>Delve</b></div><div class="bar p" style="margin:6px 0"><i style="width:48%"></i></div><small class="mut">Floor 7, boss in 38m</small></div>
<div class="panel" style="padding:10px"><div class="row"><img class="px ico" src="{g('mask')}"><b>Hustles</b></div><small class="lm">3 jobs ready</small><br><small class="mut">Rig the dice, 72%</small></div>
<div class="panel" style="padding:10px"><div class="row"><img class="px ico" src="{g('paper')}"><b>The Crier</b></div><small class="mut">Ghoul chef bursts out of the Ash Kitchen!</small></div>
<div class="panel" style="padding:10px"><div class="row"><img class="px ico" src="{g('banner')}"><b>Crew</b></div><div class="bar l" style="margin:6px 0"><i style="width:72%"></i></div><small class="mut">Vault goal 72%</small></div></div>'''
    write('phone_home',phone('City',c))
def cards_phone():
    c=f'''<div class="row"><b class="h" style="font-size:20px">Will Slapton</b><span class="tag p">Absurd</span><div class="sp"></div><span class="tag">Back</span></div>
<div style="display:flex;justify-content:center">{cardback('will_slapton',z=1.4)}</div>
<div class="row" style="justify-content:center"><span class="btn g">Flip to front</span><span class="btn">Send on a delve</span></div>'''
    write('phone_cardback',phone('Cards',c,now=False))
def delve_phone():
    scene=sprite('legionary','idle',2,2,60,190)+sprite('engineer','attack',3,2,130,190)+sprite('ghoul','hit',1,2,250,190)+sprite('skeleton','idle',2,2,320,190)
    c=f'''<div class="row"><b class="h" style="font-size:19px">The Ash Kitchen</b><span class="tag p">Floor 7</span></div>
<div class="scene" style="height:210px;background-image:url({A}/bg_dungeon.png)"><div style="position:absolute;inset:0;z-index:1">{scene}</div><div style="position:absolute;left:220px;top:70px;z-index:2;font:700 22px 'Pixelify Sans';color:var(--pink);text-shadow:0 0 10px var(--pink)">-38</div>
<div style="position:absolute;left:10px;right:10px;top:10px;z-index:2" class="row"><div style="flex:1"><small>Squad</small><div class="bar l" style="height:5px"><i style="width:80%"></i></div></div><div style="flex:1"><small>Ash Ghoul</small><div class="bar p" style="height:5px"><i style="width:37%"></i></div></div></div></div>
<div class="panel" style="font-size:13px"><b class="cy">Edith</b> rams her wrench into the ghoul. <b class="pk">38 damage!</b> It shrieks and stumbles toward the fire.</div>
<div class="panel glow"><div style="font-size:13px;margin-bottom:8px">The ghoul is staggering. What now?</div><div class="g" style="gap:8px"><span class="btn">Kick the boiling pot at it</span><span class="btn c">Raise the shield wall</span><span class="btn g">Eat and heal first</span></div></div>'''
    write('phone_delve',phone('Delve',c))
for f in [home,mining,cards,delve,bank,market,hustles,crew,welcome_phone,home_phone,cards_phone,delve_phone]: f()
print('ok')
