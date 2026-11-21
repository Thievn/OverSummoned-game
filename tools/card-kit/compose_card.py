#!/usr/bin/env python3
"""Compose a finished OverSummoned card.
usage: python3 compose_card.py --portrait p.jpg --name "Gaius Marcellus" --title "Legionary" \
          --guard 18 --might 16 --knack 10 --rarity Rare --out card.png [--scale 0.5] [--eyes 0.38]
Layers (back to front): portrait (cover-fit, eyes on --eyes line of the window) > window mask >
window shadow > nameplate > stat plate > frame_<rarity> > gem_<rarity> > rarity letter > name/title > stat icons and numbers."""
import argparse, json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
HERE=os.path.dirname(os.path.abspath(__file__)); LY=os.path.join(HERE,"frames","layers")
FONTS={"cinzel":"/usr/share/fonts/truetype/sand-box/google/Cinzel/Cinzel-VariableFont_wght.ttf",
       "deco":"/usr/share/fonts/truetype/sand-box/google/Cinzel Decorative/CinzelDecorative-Black.ttf"}
def font(path,size,var=None):
    f=ImageFont.truetype(path,size)
    if var:
        try: f.set_variation_by_axes([var])
        except Exception: pass
    return f
def hx(c): c=c.lstrip('#'); return tuple(int(c[i:i+2],16) for i in (0,2,4))
def fit_text(text,path,size,maxw,var):
    while size>20:
        f=font(path,size,var)
        if f.getlength(text)<=maxw: return f
        size-=2
    return font(path,size,var)
def shadow_text(base,xy,text,f,fill,anchor="mm",sh=4,spacing=0):
    lay=Image.new("RGBA",base.size,(0,0,0,0)); d=ImageDraw.Draw(lay)
    d.text((xy[0]+sh*0.5,xy[1]+sh),text,font=f,fill=(0,0,0,230),anchor=anchor)
    lay=lay.filter(ImageFilter.GaussianBlur(2.5)); d=ImageDraw.Draw(lay)
    d.text(xy,text,font=f,fill=fill,anchor=anchor,stroke_width=1,stroke_fill=(20,12,6,255))
    base.alpha_composite(lay)
def compose(portrait,name,title,guard,might,knack,rarity,out=None,scale=1.0,eyes=0.30,eye_y_src=0.30,zoom=1.0,shift_x=0.0):
    L=json.load(open(os.path.join(LY,"layout.json"))); CW,CH=L["card_size"]; x0,y0,x1,y1=L["portrait_window"]
    card=Image.new("RGBA",(CW,CH),(0,0,0,0))
    # 1 portrait: cover the window; place the portrait's eye line (eye_y_src of its height) on the window's eyes line
    p=Image.open(portrait).convert("RGB"); ww,wh=x1-x0,y1-y0
    s=max(ww/p.width, wh/p.height)*zoom
    pw,ph=int(p.width*s),int(p.height*s); p=p.resize((pw,ph),Image.LANCZOS)
    py=int(y0+wh*eyes-ph*eye_y_src); py=min(py,y0); 
    if py+ph<y1: py=y1-ph
    px=int(x0+(ww-pw)//2+shift_x*pw)
    lay=Image.new("RGBA",(CW,CH),(0,0,0,0)); lay.paste(p,(px,py))
    mask=Image.open(os.path.join(LY,"window_mask.png")); lay.putalpha(ImageChops.multiply(lay.split()[3],mask))
    card.alpha_composite(lay)
    for n in ("window_shadow","nameplate","statplate",f"frame_{rarity.lower()}"):
        card.alpha_composite(Image.open(os.path.join(LY,n+".png")))
    gem=Image.open(os.path.join(LY,f"gem_{rarity.lower()}.png")); gx,gy=L["gem_center"]
    card.alpha_composite(gem,(gx-gem.width//2,gy-gem.height//2))
    col=hx(L["rarity_colors"][rarity]); cream=(243,229,196,255)
    lx,ly=L["letter_center"]
    shadow_text(card,(lx,ly),L["rarity_letters"][rarity],font(FONTS["cinzel"],44,700),(245,232,205,255),sh=3)
    shadow_text(card,(CW//2,L["name_center_y"]),name.upper(),fit_text(name.upper(),FONTS["cinzel"],70,x1-x0-90,700),cream,sh=5)
    shadow_text(card,(CW//2,L["title_center_y"]),title.upper(),fit_text(title.upper(),FONTS["cinzel"],40,x1-x0-140,600),(224,190,120,255),sh=3)
    cw3=(x1-x0)/3; sy=L["stat_center_y"]; nf=font(FONTS["cinzel"],62,700)
    for i,(k,v) in enumerate((("guard",guard),("might",might),("knack",knack))):
        ic=Image.open(os.path.join(LY,f"icon_{k}.png")); cx=int(x0+cw3*i+cw3/2)
        tw=nf.getlength(str(v)); total=ic.width+18+tw; sx=int(cx-total/2)
        card.alpha_composite(ic,(sx,sy-ic.height//2))
        shadow_text(card,(sx+ic.width+18,sy+2),str(v),nf,cream,anchor="lm",sh=4)
    if scale!=1.0: card=card.resize((int(CW*scale),int(CH*scale)),Image.LANCZOS)
    if out: card.save(out)
    return card
if __name__=="__main__":
    a=argparse.ArgumentParser()
    a.add_argument("--portrait",required=True); a.add_argument("--name",required=True); a.add_argument("--title",required=True)
    a.add_argument("--guard",type=int,required=True); a.add_argument("--might",type=int,required=True); a.add_argument("--knack",type=int,required=True)
    a.add_argument("--rarity",required=True,choices=["Common","Uncommon","Rare","Epic","Legendary","Absurd","Unhinged"])
    a.add_argument("--out",required=True); a.add_argument("--scale",type=float,default=1.0); a.add_argument("--eyes",type=float,default=0.30)
    a.add_argument("--eye-y-src",type=float,default=0.30); a.add_argument("--zoom",type=float,default=1.0); a.add_argument("--shift-x",type=float,default=0.0)
    x=a.parse_args(); compose(x.portrait,x.name,x.title,x.guard,x.might,x.knack,x.rarity,x.out,x.scale,x.eyes,x.eye_y_src,x.zoom,x.shift_x)
