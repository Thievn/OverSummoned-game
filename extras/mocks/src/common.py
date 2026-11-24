import json,os
ROOT='/workspace/oversummoned-mocks'
A='../assets'
SP=json.load(open(f'{ROOT}/assets/sprites/sprites.json'))
ROWS={'hero':['idle','attack','hit','skill'],'enemy':['idle','attack','hit','death']}
H={ # id: name, title, rarity, def, str, wits, era, perk
 'legionary':('Gaius Marcellus','Roman Legionary','rare',15,12,8,'Rome, 1st century','Smithing +15% speed'),
 'gangster':('Vincenzo Moretti','Prohibition Gangster','epic',9,13,15,'Chicago, 1927','+15% gold from delves'),
 'paramedic':('Maya Washington','Paramedic','uncommon',10,7,14,'Modern Earth','Cooked food heals +20%'),
 'office_worker':('Kevin Latham','Office Worker','common',8,7,12,'Modern Earth','+10% Mastery XP'),
 'hunter':('Brokk','Stone Age Hunter','uncommon',11,16,6,'Ice Age','Woodcutting +20% logs'),
 'engineer':('Edith Crane','Victorian Engineer','rare',9,8,16,'London, 1880s','Mining +15% speed'),
 'plague_doctor':('Doctor Albrecht','Plague Doctor','rare',10,8,15,'Medieval, 1348','Alchemy +1 potion per brew'),
 'delivery_rider':('Marco Reyes','Delivery Rider','common',8,9,11,'Modern Earth','Delves finish 10% faster'),
 'will_slapton':('Will Slapton','Leading Man','absurd',9,16,13,'Hollywood, 2022','Stuns the loudest enemy'),
}
RN={'common':'Common','uncommon':'Uncommon','rare':'Rare','epic':'Epic','legendary':'Legendary','absurd':'Absurd','unhinged':'Unhinged'}
def g(n): return f'{A}/gen/{n}.png'
def it(n): return f'{A}/items/{n}.png'
def pt(n): return f'{A}/portrait/{n}.png'
def sprite(id,row='idle',frame=0,scale=3,x=0,y=0,extra='',cls=''):
    s=SP[id]; r=ROWS[s['kind']].index(row); w,h=s['w']*scale,s['h']*scale
    cols=max(s['frames'].values())
    return (f'<div class="sprite {cls}" style="width:{w}px;height:{h}px;left:{x-s["ax"]*scale}px;top:{y-s["ay"]*scale}px;'
            f'background-image:url({A}/sprites/{id}.png);background-size:{cols*w}px {4*h}px;background-position:{-frame*w}px {-r*h}px;{extra}"></div>')
def slot(icon,r='common',q='',cls=''):
    return f'<div class="slot r-{r} {cls}">{f"<img class=px src={icon}>" if icon else ""}{f"<span class=q>{q}</span>" if q else ""}</div>'
NAVS=[('City','tower'),('Hustles','mask',True),('Travel','portal'),('Infirmary','cross'),('The Crier','paper'),('Market','scales'),('Crew','banner',True)]
SKILLS=[('Mining','pickaxe',42,64),('Woodcutting','axe',31,20),('Fishing','rod',28,70),('Cooking','pot',35,45),('Smithing','anvil',39,82),('Alchemy','flask',22,30),('Summoning','summon_sigil',18,55)]
ADV=[('Delve','swords'),('Cards','cards'),('Bank','chest')]
def rail(active,live='Mining'):
    def a(label,icon,lv=None,mini=None,dot=False):
        on=' on' if label==active else ''
        lc=' live' if label==live else ''
        right=f'<span class="lv">{lv}</span>' if lv is not None else ('<span class="dot"></span>' if dot else '<span></span>')
        m=f'<span class="mini"><i style="width:{mini}%"></i></span>' if mini is not None else ''
        return f'<a class="{on}{lc}"><img class="px" src="{g(icon)}">{label}{right}{m}</a>'
    h=f'''<aside class="rail"><img class="logo" src="{A}/logo.svg">
<div class="me"><img class="px" src="{pt("engineer")}"><div><b>Dean</b><small>Crew: Neon Lanterns</small></div></div>
<div class="wallet"><span><img class="px" src="{g("coin")}">48,210</span><span><img class="px" src="{g("summon_sigil")}">7</span></div>
<h6>The City</h6><nav class="nav">{"".join(a(n[0],n[1],dot=len(n)>2) for n in NAVS)}</nav>
<h6>Skills</h6><nav class="nav">{"".join(a(n,i,lv,m) for n,i,lv,m in SKILLS)}</nav>
<h6>Adventure</h6><nav class="nav">{"".join(a(n,i) for n,i in ADV)}</nav></aside>'''
    return h
def topbar(crumb,title,extra=''):
    return f'''<header class="top"><div class="tt"><div class="crumb">{crumb}</div><div class="title">{title}</div></div>
<div class="meters">{meter('Vigor','bolt','c',72,100,'+5 in 4:12')}{meter('Daring','flame','p',18,25,'+1 in 2:40')}{meter('Life','heart','l',340,340,'Full')}</div>
<div class="sp"></div>{extra}
<span class="chip"><img class="px" src="{g("pickaxe")}">Moonsilver <span class="bar"><i style="width:62%"></i></span> 1.8s</span>
<div class="bell"><img class="px" src="{g("chat")}"><b>3</b></div></header>'''
def meter(n,icon,c,v,mx,t):
    return f'<div class="meter m-{c}"><img class="px" src="{g(icon)}"><div><div class="mrow"><b>{n}</b><span class="nums">{v}/{mx}</span></div><div class="bar"><i style="width:{v*100//mx}%"></i></div><small>{t}</small></div></div>'
FR=json.load(open(f'{ROOT}/assets/front/front.json')) if os.path.exists(f'{ROOT}/assets/front/front.json') else {}
def fsprite(id,anim='idle',frame=0,scale=3,x=0,y=0,play=True,cls=''):
    s=FR[id]; n=s[anim]; w,h=s['w']*scale,s['h']*scale
    a=f'animation:fs {n*110}ms steps({n}) infinite;--sw:-{n*w}px;' if play else ''
    return (f'<div class="sprite fsp {cls}" style="width:{w}px;height:{h}px;left:{x-s["ax"]*scale}px;top:{y-s["ay"]*scale}px;'
            f'background-image:url({A}/front/{id}_{anim}.png);background-size:{n*w}px {h}px;background-position:{-frame*w}px 0;{a}"></div>')
def page(body,title='OverSummoned'):
    return f'<!doctype html><html><head><meta charset="utf-8"><title>{title}</title><link rel="stylesheet" href="mocks.css"><link rel="stylesheet" href="screens.css"></head><body>{body}</body></html>'
def desktop(active,crumb,title,content,extra=''):
    return page(f'<div class="app">{rail(active)}<div class="main">{topbar(crumb,title,extra)}<div class="content">{content}</div></div></div>')
TABS=[('City','tower'),('Skills','pickaxe'),('Delve','swords'),('Cards','cards'),('Crew','banner')]
def phone(active,content,now=True,top=None):
    tabs=''.join(f'<a class="{"on" if n==active else ""}"><img class="px" src="{g(i)}">{n}{"<span class=dot></span>" if n=="Crew" else ""}</a>' for n,i in TABS)
    nb=f'''<div class="nowbar"><img class="px" src="{g("moonsilver_ore")}"><div><b>Mining Moonsilver</b><br><small>Lv 42 · Edith +15%</small></div><div class="bar"><i style="width:62%"></i></div><small class="nums">1.8s</small></div>''' if now else ''
    t=top or f'''<header class="ptop"><img class="logo" src="{A}/logo.svg"><div class="sp"></div><span class="chip"><img class="px" src="{g("coin")}">48,210</span><div class="bell"><img class="px" src="{g("banner")}"><b>3</b></div></header>'''
    return page(f'<div class="phone">{t}<div class="pbody">{content}</div>{nb}<nav class="tabs">{tabs}</nav></div>')
def card_front(id,lv=3,copies=1,size=1.0,cls=''):
    n,t,r,d,s,w,era,perk=H[id]
    return f'''<div class="card r-{r} {cls}" style="--z:{size}"><div class="card-in">
<div class="card-top"><span class="gem"></span><span class="rar">{RN[r]}</span><span class="lvl">Lv {lv}</span></div>
<div class="card-art"><img class="px" src="{pt(id)}"></div>
<div class="card-name h">{n}</div><div class="card-title">{t}</div>
<div class="card-stats"><span class="s-str"><small>Might</small><b>{s}</b></span><span class="s-def"><small>Guard</small><b>{d}</b></span><span class="s-wit"><small>Knack</small><b>{w}</b></span></div>
<div class="card-era">{era}</div></div>{f'<span class="copies">x{copies}</span>' if copies>1 else ''}</div>'''
