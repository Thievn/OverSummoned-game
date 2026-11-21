"""Recompose all cards + rarity ladder and rebuild preview_cards.png / preview_rarities.png."""
import json, glob
from PIL import Image, ImageDraw, ImageFont
from compose_card import compose
RC={"Common":"#B8B2A7","Uncommon":"#3FAE4F","Rare":"#3A86FF","Epic":"#A35BF0","Legendary":"#F28C1B","Absurd":"#F04FC8","Unhinged":"#E5262E"}
R=list(RC)
cin=glob.glob("/usr/share/fonts/truetype/sand-box/google/Cinzel/Cinzel-Variable*")[0]
def F(sz,w=700):
    f=ImageFont.truetype(cin,sz); f.set_variation_by_axes([w]); return f
cards=json.load(open('cards.json')); imgs=[]
for c in cards:
    big=compose(c['portrait'],c['name'],c['title'],c['guard'],c['might'],c['knack'],c['rarity'])
    base=f"cards/card_{c['id']}_{c['rarity'].lower()}"
    big.save(base+"@2x.png"); sm=big.resize((600,940),Image.LANCZOS); sm.save(base+".png"); imgs.append((c,sm))
# preview_cards: logo + 4x2 grid
logo=Image.open('logo/oversummoned_logo_1x.png'); lw=1500; logo=logo.resize((lw,int(logo.height*lw/logo.width)),Image.LANCZOS)
gap=40; W=4*600+5*gap; top=logo.height+60; H=top+2*(940+90)+gap
o=Image.new('RGBA',(W,H),(16,12,12,255)); d=ImageDraw.Draw(o); o.alpha_composite(logo,(W//2-lw//2,20))
for i,(c,sm) in enumerate(imgs):
    x=gap+(i%4)*(600+gap); y=top+(i//4)*(940+90); o.alpha_composite(sm,(x,y))
    d.text((x+300,y+940+40),c['rarity'].upper(),font=F(34),fill=RC[c['rarity']],anchor="mm")
o.convert('RGB').save('preview_cards.png')
# rarity ladder
lad=[]
for r in R:
    sm=compose('portraits/office_worker.jpg','Kevin Latham','Office Worker',8,7,12,r).resize((600,940),Image.LANCZOS)
    sm.save(f'cards/rarity_ladder/kevin_{r.lower()}.png'); lad.append(sm)
W=7*600+8*30; H=940+170; o=Image.new('RGBA',(W,H),(16,12,12,255)); d=ImageDraw.Draw(o)
for i,(r,sm) in enumerate(zip(R,lad)):
    x=30+i*630; o.alpha_composite(sm,(x,30)); d.text((x+300,1030),r.upper(),font=F(40),fill=RC[r],anchor="mm")
o.convert('RGB').save('preview_rarities.png')
