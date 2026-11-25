from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
from scipy import ndimage as ndi

W,H=1500,500
INK=(8,12,26); TEAL=(63,224,197); GOLD=(242,185,53)

# --- clean Smudge cutout (same fringe removal as the avatar) ---
src=np.array(Image.open('art2/smudge/stamp.png').convert('RGBA'))
rgb=src[...,:3].astype(int); al=src[...,3]; mx=rgb.max(2); mn=rgb.min(2)
navy=(al>0)&(np.abs(rgb-np.array([16,22,42])).max(2)<=3)
whiteish=(al==255)&~navy&(mn>60)&((mx-mn)<22)
semi=(al>0)&(al<255); outside=al==0
passable=outside|whiteish|semi|navy
lab,_=ndi.label(passable,structure=np.ones((3,3)))
reach=np.isin(lab,np.unique(lab[outside]))
dist=ndi.distance_transform_edt(~(outside|navy))
kill=reach&whiteish&(dist<=10)
solid=(al==255)&~kill&~navy
halo=solid&ndi.binary_dilation(kill,iterations=2)&(mn>90)&((mx-mn)<45)
solid&=~halo
keep=navy&ndi.binary_dilation(solid,iterations=2)
out=src.copy(); out[...,3]=np.where(solid|keep,255,0); out[keep,:3]=(16,22,42)
smudge=Image.fromarray(out)

# --- background: the archive, darkened, with a navy wash ---
bg=Image.open('assets/v2/scenes/archive.webp').convert('RGB')
s=max(W/bg.width,H/bg.height)
bg=bg.resize((int(bg.width*s)+1,int(bg.height*s)+1),Image.LANCZOS)
bg=bg.crop((0,max(0,(bg.height-H)//2),W,max(0,(bg.height-H)//2)+H)).filter(ImageFilter.GaussianBlur(3))
a=np.array(bg).astype(float)*0.42+np.array(INK,float)*0.58
# left-to-right darkening so the text side is calm
grad=np.linspace(1.0,0.0,W)[None,:,None]
a=a*(1-0.34*grad)+np.array(INK,float)*(0.34*grad)
bg=Image.fromarray(a.clip(0,255).astype('uint8')).convert('RGBA')

# teal glow behind Smudge
gl=Image.new('RGBA',(W,H),(0,0,0,0))
ImageDraw.Draw(gl).ellipse([930,140,1380,460],fill=TEAL+(46,))
bg.alpha_composite(gl.filter(ImageFilter.GaussianBlur(70)))

# --- Smudge on the right ---
sh=430; sw=int(smudge.width*sh/smudge.height)
sm=smudge.resize((sw,sh),Image.LANCZOS)
bg.alpha_composite(sm,(1052,H-sh-14))

d=ImageDraw.Draw(bg)
L=lambda p: ImageFont.truetype('assets/fonts/LilitaOne.ttf',p)
N=lambda p: ImageFont.truetype('assets/fonts/Nunito.ttf',p)

X=132
def shadow(xy,txt,font,fill):
    d.text((xy[0]+3,xy[1]+4),txt,font=font,fill=(0,0,0,165))
    d.text(xy,txt,font=font,fill=fill)

shadow((X,112),"THIEVN",L(108),(255,255,255))
# rule
d.rounded_rectangle([X,246,X+150,252],3,fill=GOLD)
shadow((X,274),"Solo dev.",N(37),(214,224,245))
f=N(37); w=d.textlength("Solo dev. ",font=f)
shadow((X+w,274),"Making ",N(37),(214,224,245))
w2=w+d.textlength("Making ",font=f)
shadow((X+w2,272),"OverSummoned",L(40),TEAL)
shadow((X,328),"A desktop pet who works while you type.",N(27),(150,163,190))

bg.convert('RGB').save('/home/claude/out/thievn_x_banner.png',quality=95)
print('saved 1500x500')
