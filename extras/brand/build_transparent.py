import sys, shutil
sys.argv=['x']
import build_icons as B
from PIL import Image
from pathlib import Path
S=B.MASTER
def mark(size, pad=0.04, shadow=True):
    im=Image.new("RGBA",(size,size),(0,0,0,0))
    cx=size//2
    avail=size*(1-2*pad)
    letter=B.scale_to_width(B.LETTER_O,int(avail*0.80))
    crown=B.scale_to_width(B.CROWN,int(avail*0.44))
    ov=int(crown.size[1]*0.16)
    h=crown.size[1]+letter.size[1]-ov
    if h>avail:
        f=avail/h
        letter=B.scale_to_width(B.LETTER_O,int(letter.size[0]*f)); crown=B.scale_to_width(B.CROWN,int(crown.size[0]*f))
        ov=int(crown.size[1]*0.16); h=crown.size[1]+letter.size[1]-ov
    top=(size-h)//2
    ccy=top+crown.size[1]//2; ocy=top+crown.size[1]-ov+letter.size[1]//2
    if shadow:
        B.composite_with_shadow(im,letter,(cx,ocy),blur=int(size*0.015),opacity=120,offset=(0,int(size*0.008)))
        B.composite_with_shadow(im,crown,(cx,ccy),blur=int(size*0.012),opacity=120,offset=(0,int(size*0.006)))
    else:
        B.paste(im,letter,(cx,ocy),center=True); B.paste(im,crown,(cx,ccy),center=True)
    return im
out=Path("OverSummoned-logo-O"); 
if out.exists(): shutil.rmtree(out)
(out/"transparent").mkdir(parents=True); (out/"dark-background").mkdir()
m=mark(S)
for s in [1024,512,256,128]:
    m.resize((s,s),Image.Resampling.LANCZOS).save(out/"transparent"/f"oversummoned-logo-{s}.png")
mf=mark(S,pad=0.0,shadow=False)
icons=[mf.resize((s,s),Image.Resampling.LANCZOS) for s in (16,32,48,64)]
for s,i in zip((16,32,48,64),icons): i.save(out/"transparent"/f"favicon-{s}.png")
icons[-1].save(out/"transparent"/"favicon.ico",sizes=[(16,16),(32,32),(48,48),(64,64)])
shutil.copy("option_4/profile_1024.png",out/"dark-background"/"oversummoned-profile-square-1024.png")
shutil.copy("option_4/profile_circle_1024.png",out/"dark-background"/"oversummoned-profile-circle-1024.png")
# preview on checker / light / dark
P=Image.new("RGBA",(1500,520),(30,20,40,255))
from PIL import ImageDraw
d=ImageDraw.Draw(P)
for x in range(0,500,20):
    for y in range(0,500,20):
        d.rectangle([x+10,y+10,x+29,y+29],fill=(200,200,200) if (x+y)//20%2 else (255,255,255))
d.rectangle([510,10,1000,510],fill=(245,245,245)); d.rectangle([1010,10,1490,510],fill=(12,10,18))
t=m.resize((480,480),Image.Resampling.LANCZOS)
for x in (20,515,1010): P.alpha_composite(t,(x,20))
P.save("transparent_preview.png")
