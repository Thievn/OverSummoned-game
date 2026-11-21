"""Builds the OverSummoned card template layers (2x master, 1200x1880).
Layers: frame_<rarity>.png (portrait window transparent), gem_<rarity>.png, nameplate.png, statplate.png,
window_shadow.png, window_mask.png, icon_guard/might/knack.png, layout.json."""
import json, math, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps
from scipy import ndimage
SRC="src/"; OUT="layers/"
import os; os.makedirs(OUT,exist_ok=True)
RC={"Common":"#B8B2A7","Uncommon":"#3FAE4F","Rare":"#3A86FF","Epic":"#A35BF0","Legendary":"#F28C1B","Absurd":"#F04FC8","Unhinged":"#E5262E"}
LET={"Common":"C","Uncommon":"U","Rare":"R","Epic":"E","Legendary":"L","Absurd":"A","Unhinged":"X"}
CW,CH=1200,1880; TOP=80; K=1200/864
def hx(c): c=c.lstrip('#'); return tuple(int(c[i:i+2],16) for i in (0,2,4))
# ---------- 1. stretch master frame (9-slice on plain bar runs) ----------
src=Image.open(SRC+"frame_master_gold_raw.jpg").convert("RGB")
def vstretch(im, y0,y1, add):
    w,h=im.size
    a=im.crop((0,0,w,y0)); m=im.crop((0,y0,w,y1)).resize((w,y1-y0+add),Image.LANCZOS); b=im.crop((0,y1,w,h))
    out=Image.new("RGB",(w,h+add)); out.paste(a,(0,0)); out.paste(m,(0,y0)); out.paste(b,(0,y1+add)); return out
f=vstretch(src,765,845,72); f=vstretch(f,300,390,72)   # 864x1296
f=f.resize((1200,1800),Image.LANCZOS)
fa=np.array(f).astype(float); L=fa.mean(2)
# window = flood region of dark pixels connected to center
dark=L<34
RECT=(int(95*K),int(104*K),int(770*K),int((1054+144)*K))
inr=np.zeros_like(dark); inr[RECT[1]:RECT[3],RECT[0]:RECT[2]]=True
lab,_=ndimage.label(dark&inr); win=lab==lab[900,600]
win=ndimage.binary_fill_holes(win)
win=ndimage.binary_opening(win,iterations=2)
# socket hole connected to top center
lab2,_=ndimage.label(dark); sock=lab2==lab2[int(55*K),600]
if sock.sum()>20000: sock=np.zeros_like(sock)
alpha=np.ones(L.shape)
alpha[win]=0; alpha[sock]=0
# trim outside-of-card black (corners outside frame are already gold to edge; keep)
alpha=ndimage.gaussian_filter(alpha,0.8)
ys,xs=np.where(win); WIN=(int(xs.min())+0,int(ys.min())+TOP,int(xs.max())+1,int(ys.max())+TOP+1)
print("window",WIN)
frame_rgb=fa
def place(rgb,alpha_):
    canvas=np.zeros((CH,CW,4)); canvas[TOP:,:, :3]=rgb; canvas[TOP:,:,3]=alpha_*255
    return canvas
# window mask (white=portrait visible)
wm=np.zeros((CH,CW)); wm[TOP:,:][win]=255
wm_img=Image.fromarray(ndimage.gaussian_filter(wm,0.8).astype(np.uint8),"L"); wm_img.save(OUT+"window_mask.png")
# ---------- 2. metal recolors ----------
lum=L/255.0
def gradmap(stops):
    xs=np.array([s[0] for s in stops]); cols=np.array([hx(s[1]) for s in stops],float)
    out=np.zeros(lum.shape+(3,))
    for c in range(3): out[...,c]=np.interp(lum,xs,cols[:,c])
    return out
def mix(a,b,t): return a*(1-t)+b*t
METAL={  # v2: each metal clearly reads as its rarity colour; Legendary is the only gold
 "Common":   [(0,"#070707"),(0.25,"#2b2b2a"),(0.55,"#6e6d6a"),(0.8,"#bab8b3"),(1,"#f4f2ee")],   # grey iron / silver
 "Uncommon": [(0,"#020805"),(0.25,"#0b2c18"),(0.55,"#1f7040"),(0.8,"#4fbf74"),(1,"#cdf5d6")],   # emerald / verdigris
 "Rare":     [(0,"#03060d"),(0.25,"#16284c"),(0.55,"#3566b5"),(0.8,"#8ab6f2"),(1,"#eef5ff")],   # blue steel, pushed bluer so it never reads as grey
 "Epic":     [(0,"#06030e"),(0.25,"#26104f"),(0.55,"#5e30b8"),(0.8,"#a07af2"),(1,"#eee4ff")],   # amethyst
 "Absurd":   [(0,"#120309"),(0.25,"#560d3b"),(0.55,"#d42a96"),(0.8,"#ff70c8"),(1,"#ffe2f3")],   # hot pink / magenta
 "Unhinged": [(0,"#050101"),(0.25,"#2c0507"),(0.55,"#801016"),(0.8,"#d22d2d"),(1,"#ffb3a3")],   # blood red
}
frames={}
for r in RC:
    if r in METAL: rgb=gradmap(METAL[r])
    else: rgb=frame_rgb.copy()
    if r=="Rare":   # blue enamel in the recesses
        rec=np.clip((0.30-lum)/0.18,0,1)*(lum>0.10)
        rgb=mix(rgb,np.array(hx("#1d4fb0"),float)*np.ones_like(rgb),rec[...,None]*0.45)
    if r=="Legendary":  # warmer gold + ember glow in highlights
        rgb=np.clip(rgb*np.array([1.08,0.98,0.80]),0,255)
        hi=np.clip((lum-0.55)/0.35,0,1)
        rgb=np.clip(rgb+np.array([90,35,0])*hi[...,None],0,255)
    frames[r]=place(rgb,alpha)
def keyed(path, thr=22, size=None):
    im=Image.open(path).convert("RGB"); a=np.array(im).astype(float); m=a.max(2)>thr
    lab,_=ndimage.label(m); 
    if lab.max()==0: return None
    big=np.argmax(ndimage.sum(m,lab,range(1,lab.max()+1)))+1
    m=ndimage.binary_fill_holes(lab==big)
    al=ndimage.gaussian_filter(m.astype(float),1.0)
    rgba=np.dstack([a,al*255]).astype(np.uint8)
    o=Image.fromarray(rgba,"RGBA"); o=o.crop(o.getbbox())
    return o
def paste(canvas,img,x,y):
    c=Image.fromarray(canvas.astype(np.uint8),"RGBA"); c.alpha_composite(img,(int(x),int(y))); return np.array(c).astype(float)
gx,gy=600,TOP+int(55*K)  # gem centre
# Epic: candle sconces on the side bars
sconce=keyed(SRC+"sconce_raw.jpg"); sconce=sconce.resize((int(sconce.width*250/sconce.height),250),Image.LANCZOS)
# v2: recolour the sconce metal to amethyst, keep candle wax + flame
_sa=np.array(sconce).astype(float); _l=_sa[...,:3].mean(2)/255
_xs=np.array([t for t,_ in METAL["Epic"]]); _cs=np.array([hx(c) for _,c in METAL["Epic"]],float)
_m=np.stack([np.interp(_l,_xs,_cs[:,c]) for c in range(3)],-1)
_keep=np.clip((_l-0.62)/0.15,0,1)[...,None]
_sa[...,:3]=_m*(1-_keep)+_sa[...,:3]*_keep
sconce=Image.fromarray(_sa.astype(np.uint8),"RGBA")
for x in (66-sconce.width//2, CW-66-sconce.width//2):
    frames["Epic"]=paste(frames["Epic"],sconce,x,TOP+900-sconce.height//2)
# Legendary: crown crest behind the gem
crown=keyed(SRC+"crown_raw.jpg"); crown=crown.resize((330,int(crown.height*330/crown.width)),Image.LANCZOS)
fr=Image.fromarray(frames["Legendary"].astype(np.uint8),"RGBA"); lay=Image.new("RGBA",(CW,CH),(0,0,0,0))
lay.alpha_composite(crown,(gx-crown.width//2, gy-int(crown.height*0.62)))
glow=Image.new("RGBA",(CW,CH),(0,0,0,0)); ga=fr.split()[3].point(lambda v:0)
frames["Legendary"]=np.array(Image.alpha_composite(lay,fr) if False else Image.alpha_composite(fr,lay)).astype(float)
# ember sparks along legendary frame
rng=np.random.default_rng(7); ff=Image.fromarray(frames["Legendary"].astype(np.uint8),"RGBA"); d=ImageDraw.Draw(ff)
for i in range(70):
    side=rng.integers(4); t=rng.random()
    if side==0: x,y=t*CW, TOP+rng.random()*110
    elif side==1: x,y=t*CW, CH-rng.random()*110
    elif side==2: x,y=rng.random()*120, TOP+t*1800
    else: x,y=CW-rng.random()*120, TOP+t*1800
    s=rng.random()*2.6+0.8; d.ellipse([x-s,y-s,x+s,y+s],fill=(255,int(140+rng.random()*90),40,int(160+rng.random()*95)))
ff=Image.alpha_composite(ff.filter(ImageFilter.GaussianBlur(0)),Image.new("RGBA",ff.size,(0,0,0,0)))
frames["Legendary"]=np.array(ff).astype(float)
# Absurd: bottom-right corner replaced by a traffic cone + googly eye on top-left ornament
fa_=frames["Absurd"]; 
yy,xx=np.mgrid[0:CH,0:CW]
cut=((xx-(CW+30))**2+(yy-(TOP-30))**2)<270**2   # bite out the corner
cut=cut & ~(np.zeros_like(cut))
fa_[...,3]=np.where(cut,0,fa_[...,3])
cone=keyed(SRC+"cone_raw.jpg"); cone=cone.resize((250,int(cone.height*250/cone.width)),Image.LANCZOS).rotate(18,expand=True,resample=Image.BICUBIC)
fa_=paste(fa_,cone,CW-cone.width+10,0)
im=Image.fromarray(fa_.astype(np.uint8),"RGBA"); d=ImageDraw.Draw(im)
ex,ey,er=92,CH-92,34
d.ellipse([ex-er-3,ey-er-3,ex+er+3,ey+er+3],fill=(20,12,8,255)); d.ellipse([ex-er,ey-er,ex+er,ey+er],fill=(246,243,236,255))
d.ellipse([ex-4,ey+2,ex+26,ey+30],fill=(10,10,10,255)); d.ellipse([ex+6,ey+7,ex+13,ey+14],fill=(255,255,255,230))
frames["Absurd"]=np.array(im).astype(float)
# Unhinged: cracked frame, chunks breaking off and floating, glitch split
fu=Image.fromarray(frames["Unhinged"].astype(np.uint8),"RGBA")
rng=np.random.default_rng(21)
def jagged(cx,cy,rx,ry,n=11):
    pts=[]
    for k in range(n):
        a=2*math.pi*k/n+rng.normal(0,0.12); rr=1+rng.normal(0,0.22)
        pts.append((cx+math.cos(a)*rx*rr, cy+math.sin(a)*ry*rr))
    return pts
chunks=[((CW-75,TOP+95,110,120),(26,-58),-9),((55,TOP+1180,95,150),(-34,18),6),((600,CH-58,150,70),(18,40),4),((1145,TOP+1380,70,110),(30,6),-5)]
base=fu.copy(); pieces=[]
for (cx,cy,rx,ry),off,rot in chunks:
    poly=jagged(cx,cy,rx,ry)
    m=Image.new("L",fu.size,0); ImageDraw.Draw(m).polygon(poly,fill=255)
    piece=fu.copy(); piece.putalpha(ImageChops.multiply(fu.split()[3],m))
    bb=piece.getbbox(); 
    if not bb: continue
    piece=piece.crop(bb)
    # cut the chunk out of the frame
    ba=np.array(base.split()[3]).astype(float); base.putalpha(Image.fromarray((ba*(1-np.array(m)/255)).astype(np.uint8)))
    # glowing rim around the hole
    edge=ImageChops.subtract(m.filter(ImageFilter.MaxFilter(9)),m)
    ea=ImageChops.multiply(edge,fu.split()[3].filter(ImageFilter.MaxFilter(9)))
    gl=Image.new("RGBA",fu.size,(255,60,50,0)); gl.putalpha(ea.filter(ImageFilter.GaussianBlur(3)))
    base=Image.alpha_composite(base,gl)
    # piece with a hot edge, rotated and pushed out
    pa=piece.split()[3]; pe=ImageChops.subtract(pa,pa.filter(ImageFilter.MinFilter(5)))
    hot=Image.new("RGBA",piece.size,(255,90,70,0)); hot.putalpha(pe)
    piece=Image.alpha_composite(piece,hot).rotate(rot,expand=True,resample=Image.BICUBIC)
    pieces.append((piece,(bb[0]+off[0],bb[1]+off[1])))
dd=ImageDraw.Draw(base)
def crack(x,y,ang,n):
    pts=[(x,y)]
    for k in range(n):
        ang+=rng.normal(0,0.45); L_=rng.integers(16,34); x+=math.cos(ang)*L_; y+=math.sin(ang)*L_; pts.append((x,y))
    return pts
fa_mask=np.array(fu.split()[3])>40
cr=Image.new("RGBA",fu.size,(0,0,0,0)); cd=ImageDraw.Draw(cr)
for (x,y,a) in [(0,TOP+420,0.2),(CW,TOP+700,math.pi-0.15),(330,TOP,1.45),(CW-70,CH,-1.6),(0,CH-320,-0.35),(870,TOP,1.6),(CW,TOP+250,math.pi+0.3)]:
    p=crack(x,y,a,6)
    cd.line(p,fill=(255,60,45,170),width=9); 
cr=cr.filter(ImageFilter.GaussianBlur(3)); cd=ImageDraw.Draw(cr)
for (x,y,a) in []: pass
rng=np.random.default_rng(21)
for (x,y,a) in [(0,TOP+420,0.2),(CW,TOP+700,math.pi-0.15),(330,TOP,1.45),(CW-70,CH,-1.6),(0,CH-320,-0.35),(870,TOP,1.6),(CW,TOP+250,math.pi+0.3)]:
    pass
cra=np.array(cr); cra[...,3]=(cra[...,3]*fa_mask).astype(np.uint8); base=Image.alpha_composite(base,Image.fromarray(cra))
for piece,pos in pieces: base.alpha_composite(piece,pos)
# small floating shards in the headroom and margins
dd=ImageDraw.Draw(base)
for k in range(12):
    sx=int(rng.integers(30,CW-30)); sy=int(rng.choice([rng.integers(8,TOP-6),rng.integers(CH-40,CH-6)]))
    s=int(rng.integers(5,13)); poly=jagged(sx,sy,s,s*0.7,5)
    dd.polygon(poly,fill=(70,14,14,255),outline=(255,110,85,255))
# rgb glitch split + a few horizontal glitch slices
r_,g_,b_,a_=base.split()
base=Image.merge("RGBA",(ImageChops.offset(r_,5,0),g_,ImageChops.offset(b_,-5,0),ImageChops.lighter(a_,ImageChops.offset(a_,5,0))))
for (yy0,h,dx) in [(TOP+560,14,22),(TOP+1260,9,-30),(TOP+300,6,16)]:
    sl=base.crop((0,yy0,CW,yy0+h)); base.paste(Image.new("RGBA",(CW,h),(0,0,0,0)),(0,yy0)); base.alpha_composite(sl,(dx,yy0))
frames["Unhinged"]=np.array(base).astype(float)
for r,arr in frames.items():
    Image.fromarray(arr.clip(0,255).astype(np.uint8),"RGBA").save(OUT+f"frame_{r.lower()}.png")
# ---------- 3. gems ----------
gm=Image.open(SRC+"gem_master_raw.jpg").convert("L"); gm=gm.crop((150,125,875,850)).resize((150,150),Image.LANCZOS)
gl=np.array(gm).astype(float)/255
def shape_mask(kind,n=150):
    m=Image.new("L",(n*4,n*4),0); d=ImageDraw.Draw(m); c=n*2; R=n*2-6
    if kind=="circle": d.ellipse([c-R,c-R,c+R,c+R],fill=255)
    elif kind=="diamond": d.polygon([(c,c-R),(c+R*0.82,c),(c,c+R),(c-R*0.82,c)],fill=255)
    elif kind=="hexagon": d.polygon([(c+R*math.cos(math.radians(a)),c+R*math.sin(math.radians(a))) for a in range(-90,270,60)],fill=255)
    elif kind=="shield": d.polygon([(c-R*0.85,c-R*0.8),(c+R*0.85,c-R*0.8),(c+R*0.85,c+R*0.05),(c,c+R),(c-R*0.85,c+R*0.05)],fill=255)
    elif kind=="pentagon": d.polygon([(c+R*math.cos(math.radians(a)),c+R*math.sin(math.radians(a))) for a in range(-90,270,72)],fill=255)
    elif kind=="heart":
        d.ellipse([c-R,c-R*0.75,c+R*0.05,c+R*0.25],fill=255); d.ellipse([c-R*0.05,c-R*0.75,c+R,c+R*0.25],fill=255)
        d.polygon([(c-R*0.95,c-R*0.1),(c+R*0.95,c-R*0.1),(c,c+R)],fill=255)
    elif kind=="shard": d.polygon([(c-R*0.3,c-R),(c+R*0.6,c-R*0.55),(c+R*0.9,c+R*0.2),(c+R*0.2,c+R),(c-R*0.7,c+R*0.6),(c-R*0.95,c-R*0.2)],fill=255)
    return m.resize((n,n),Image.LANCZOS)
SHAPE={"Common":"circle","Uncommon":"diamond","Rare":"hexagon","Epic":"shield","Legendary":"pentagon","Absurd":"heart","Unhinged":"shard"}
for r,col in RC.items():
    base=np.array(hx(col),float)
    if r=="Common": base=np.array(hx("#E9E1CF"),float)
    t=gl[...,None]
    rgb=np.where(t<0.6, base*(0.25+t/0.6*0.75), base+(255-base)*((t-0.6)/0.4))
    if r=="Unhinged":
        ang=(np.arctan2(*np.mgrid[-75:75,-75:75])+math.pi)/(2*math.pi)
        rainbow=np.stack([np.clip(np.abs(ang*6-3)-1,0,1),np.clip(2-np.abs(ang*6-2),0,1),np.clip(2-np.abs(ang*6-4),0,1)],-1)*255
        seg=(np.floor(ang*7)%2==0)[...,None]
        rgb=np.where(seg, rgb*0.35, rgb*0.6+rainbow*0.4*t)
    m=shape_mask(SHAPE[r])
    gem=Image.fromarray(np.dstack([rgb.clip(0,255),np.array(m)]).astype(np.uint8),"RGBA")
    # gold bezel outline
    big=Image.new("RGBA",(190,190),(0,0,0,0))
    ring=m.resize((176,176),Image.LANCZOS)
    bez=Image.new("RGBA",(176,176),(120,82,30,255)); bez.putalpha(ring)
    hl=Image.new("RGBA",(176,176),(240,206,130,255)); hl.putalpha(ring.filter(ImageFilter.GaussianBlur(1)).point(lambda v:int(v*0.6)))
    big.alpha_composite(bez,(7,7)); big.alpha_composite(hl,(5,5)); big.alpha_composite(bez,(8,8))
    big.alpha_composite(gem,(20,20))
    glow=Image.new("RGBA",(190,190),hx(col)+(0,)); glow.putalpha(m.resize((190,190)).filter(ImageFilter.GaussianBlur(12)).point(lambda v:int(v*0.55)))
    out=Image.new("RGBA",(220,220),(0,0,0,0)); out.alpha_composite(glow.resize((220,220)),(0,0)); out.alpha_composite(big,(15,15))
    out=out.resize((132,132),Image.LANCZOS); out.save(OUT+f"gem_{r.lower()}.png")
# ---------- 4. window shadow, nameplate, stat plate ----------
x0,y0,x1,y1=WIN
ws=np.zeros((CH,CW,4)); 
wmask=np.array(wm_img).astype(float)/255
inner=ndimage.distance_transform_edt(wmask>0.5)
sh=np.clip(1-inner/38,0,1)**1.6*0.85
ws[...,3]=sh*255*wmask
# bottom fade where the plates sit
yy=np.arange(CH)[:,None]*np.ones((1,CW))
NP_TOP=y1-430; ST_TOP=y1-175
fade=np.clip((yy-(NP_TOP-170))/170,0,1)*0.92
ws[...,3]=np.maximum(ws[...,3],fade*255*wmask)
Image.fromarray(ws.astype(np.uint8),"RGBA").save(OUT+"window_shadow.png")
GOLD=(214,170,92); GOLD_D=(120,84,36)
def gold_line(d,xa,xb,y,w=3):
    d.line([(xa,y),(xb,y)],fill=GOLD_D+(255,),width=w+2); d.line([(xa,y-1),(xb,y-1)],fill=GOLD+(255,),width=w)
def diamond(d,x,y,s):
    d.polygon([(x,y-s),(x+s*1.4,y),(x,y+s),(x-s*1.4,y)],fill=GOLD+(255,),outline=GOLD_D+(255,))
np_img=Image.new("RGBA",(CW,CH),(0,0,0,0)); d=ImageDraw.Draw(np_img)
d.rectangle([x0,NP_TOP,x1,y1],fill=(10,8,7,215))
gold_line(d,x0+6,x1-6,NP_TOP,3); diamond(d,CW//2,NP_TOP,11)
for xx_ in (x0+30,x1-30): diamond(d,xx_,NP_TOP,6)
np_img=Image.alpha_composite(Image.new("RGBA",(CW,CH),(0,0,0,0)),np_img)
np_img.putalpha(ImageChops.multiply(np_img.split()[3],wm_img))
np_img.save(OUT+"nameplate.png")
st=Image.new("RGBA",(CW,CH),(0,0,0,0)); d=ImageDraw.Draw(st)
d.rectangle([x0,ST_TOP,x1,y1],fill=(5,4,4,235))
gold_line(d,x0+40,x1-40,ST_TOP,2); diamond(d,CW//2,ST_TOP,7)
# two thin separators between the three stat slots
cw3=(x1-x0)/3
for i in (1,2):
    sx=int(x0+cw3*i); d.line([(sx,ST_TOP+40),(sx,y1-34)],fill=GOLD_D+(200,),width=2)
st.putalpha(ImageChops.multiply(st.split()[3],wm_img)); st.save(OUT+"statplate.png")
# ---------- 5. stat icons (gold, vector, supersampled) ----------
def icon(kind,n=88):
    S=4; m=Image.new("L",(n*S,n*S),0); d=ImageDraw.Draw(m); c=n*S/2; R=n*S/2-8
    if kind=="guard":
        d.polygon([(c-R*0.78,c-R*0.82),(c,c-R*0.98),(c+R*0.78,c-R*0.82),(c+R*0.74,c+R*0.05),(c,c+R*0.98),(c-R*0.74,c+R*0.05)],fill=255)
        d.polygon([(c,c-R*0.7),(c+R*0.5,c-R*0.58),(c+R*0.47,c+R*0.02),(c,c+R*0.68)],fill=150)
    elif kind=="might":
        bl=[(c-R*0.08,c+R*0.35),(c-R*0.08,c-R*0.75),(c,c-R*0.98),(c+R*0.08,c-R*0.75),(c+R*0.08,c+R*0.35)]
        d.polygon(bl,fill=255); d.rectangle([c-R*0.42,c+R*0.33,c+R*0.42,c+R*0.45],fill=255)
        d.rectangle([c-R*0.07,c+R*0.45,c+R*0.07,c+R*0.78],fill=200); d.ellipse([c-R*0.14,c+R*0.76,c+R*0.14,c+R*0.98],fill=255)
        m=m.rotate(-40,resample=Image.BICUBIC)
        d=ImageDraw.Draw(m)
    elif kind=="knack":
        pts=[]
        for i in range(10):
            a=math.radians(-90+i*36); rr=R if i%2==0 else R*0.42
            pts.append((c+rr*math.cos(a),c+rr*math.sin(a)))
        d.polygon(pts,fill=255)
    m=m.resize((n,n),Image.LANCZOS)
    a=np.array(m).astype(float)/255
    yy_=np.linspace(0,1,n)[:,None]*np.ones((1,n))
    col=np.dstack([np.interp(yy_,[0,0.45,1],[255,226,150]),np.interp(yy_,[0,0.45,1],[236,180,96]),np.interp(yy_,[0,0.45,1],[170,96,36])])
    shade=np.clip(a*1.15,0,1)
    rgb=col*(0.55+0.45*shade[...,None])
    solid=(a>0.02).astype(float)
    al=ndimage.gaussian_filter(solid,0.6)
    outl=np.clip(ndimage.grey_dilation(al,size=(5,5))-al,0,1)
    out=np.zeros((n,n,4)); out[...,:3]=rgb*al[...,None]+np.array([30,18,8])*outl[...,None]*(1-al[...,None])
    out[...,3]=np.clip(al+outl,0,1)*255
    return Image.fromarray(out.astype(np.uint8),"RGBA")
for k in ("guard","might","knack"): icon(k).save(OUT+f"icon_{k}.png")
layout={"card_size":[CW,CH],"scale_note":"2x master. compose_card.py --scale 0.5 gives 600x940.","frame_box":[0,TOP,CW,CH],
 "portrait_window":list(WIN),"gem_center":[gx,gy],"letter_center":[gx,gy+108],"nameplate_top":NP_TOP,"statplate_top":ST_TOP,
 "name_center_y":NP_TOP+92,"title_center_y":NP_TOP+168,"stat_center_y":(ST_TOP+y1)//2+4,"rarity_colors":RC,"rarity_letters":LET,"gem_shapes":SHAPE}
json.dump(layout,open(OUT+"layout.json","w"),indent=1); print(layout)
