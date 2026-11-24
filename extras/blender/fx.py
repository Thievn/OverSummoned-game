import json, math, random, os
from PIL import Image, ImageOps
F=64
H=['legionary','gangster','paramedic','office_worker','hunter','engineer','plague_doctor','delivery_rider']
E=['slime','goblin','skeleton','ghoul','brute']
ORDER_H=['idle','attack','hit','skill']; ORDER_E=['idle','attack','hit','death']
OUTL=(18,8,24,255)
PINK=(255,46,140,255); CYAN=(54,214,255,255); LIME=(198,255,61,255); GOLD=(255,204,51,255); WHITE=(255,255,255,255)
VIO=(168,85,255,255); ORG=(255,122,26,255); YEL=(255,243,160,255); RED=(255,64,48,255)
def px(im,x,y,c):
    x,y=int(round(x)),int(round(y))
    if 0<=x<F and 0<=y<F: im.putpixel((x,y),c)
def rect(im,x,y,w,h,c):
    for i in range(w):
        for j in range(h): px(im,x+i,y+j,c)
def flame(im,x,y,t,big=1):
    # hand-placed flicker flame, three tones
    h=[4,5,3,5,4,6,3,5][t%8]+big*2; sway=[0,1,0,-1][t%4]
    for j in range(h):
        w=max(1,int((1-j/h)*(2+big)+0.5))
        cx=x+(sway if j>h//2 else 0)
        for i in range(-w,w+1):
            c=YEL if abs(i)<w-1 and j<h*0.5 else (ORG if j<h*0.8 else RED)
            px(im,cx+i,y-j,c)
    px(im,x+sway,y-h-1,ORG if t%2 else RED)
def coin(im,x,y):
    rect(im,x,y,2,2,GOLD); px(im,x,y,YEL); px(im,x+2,y+1,OUTL)
def cross(im,x,y,c):
    rect(im,x-1,y,3,1,c); rect(im,x,y-1,1,3,c)
def env(im,x,y):
    rect(im,x,y,4,3,WHITE); px(im,x+1,y+1,PINK); px(im,x+2,y+1,PINK); rect(im,x,y+3,4,1,OUTL)
def flash(im,c=WHITE):
    p=im.load()
    for y in range(F):
        for x in range(F):
            if p[x,y][3] and p[x,y]!=OUTL: p[x,y]=c
def tint(im,c,k=0.45):
    p=im.load()
    for y in range(F):
        for x in range(F):
            a=p[x,y]
            if a[3] and a!=OUTL: p[x,y]=tuple(int(a[i]*(1-k)+c[i]*k) for i in range(3))+(255,)
def dissolve(im,amt,seed=3):
    r=random.Random(seed); p=im.load()
    for y in range(F):
        for x in range(F):
            if p[x,y][3] and ((x+y)%2==0 and amt>0.3 or r.random()<amt): p[x,y]=(0,0,0,0)

def apply(name,anim,i,im,tips,n):
    tF=tips.get('tipF'); t=i
    if name=='hunter' and anim in ('idle','skill') and 'tipTorch' in tips: flame(im,tips['tipTorch'][0],tips['tipTorch'][1],t,big=0)
    if name=='ghoul': flame(im,tips['tipHead'][0],tips['tipHead'][1]+3,t,big=2)
    if anim=='attack' and name in H and i in (2,3) and tF:
        # pixel smear arc in front of the weapon
        for k in range(7):
            a=-1.1+k*0.37; r=9+i
            px(im,tF[0]+math.cos(a)*r-2,tF[1]+math.sin(a)*r+2,WHITE if k%2 else PINK)
    if anim=='hit':
        if i==0: flash(im)
        elif i==1: tint(im,PINK)
    if anim=='death':
        if i>=2: tint(im,(255,255,255),0.25*(i-1))
        if i>=3: dissolve(im,0.35 if i==3 else 0.7)
    if anim!='skill': return
    if name=='legionary' and i>=2:
        x=tips['tipShield'][0]+3; y0=tips['tipShield'][1]
        for j in range(-12,8):
            c=CYAN if (j+i)%3 else WHITE
            px(im,x,y0+j,c)
            if (j+i)%2==0: px(im,x+1,y0+j,CYAN)
        for k in range(3): px(im,x+2+((i+k*3)%5),y0-10+((i*7+k*5)%18),WHITE)
    if name=='gangster' and i>=2:
        bx,by=tips['tipCoin']
        for k in range(3):
            s=(i-2+k*2)/6
            if 0<=s<=1: coin(im,bx+s*10,by-6-math.sin(s*math.pi)*10+s*4)
        if i%2: px(im,bx+1,by-3,YEL)
    if name=='paramedic' and i>=2:
        bx,by=tips['tipB']
        for k in range(4):
            yy=by-2-((i*3+k*6)%16); xx=bx-8+k*5
            cross(im,xx,yy,LIME if k%2 else WHITE)
    if name=='office_worker' and i>=2:
        bx,by=tips['tipF']
        for k in range(3):
            s=(i-2+k*2)
            if s>=0: env(im,bx+2+s*3,by-4-k*4+s%2)
    if name=='hunter' and 2<=i<=6:
        bx,by=tips['tipTorch']
        for k in range(5):
            r=3+(i-2)*3+k%2*2
            flame(im,bx+r,by+2-k,i+k,big=0)
    if name=='engineer' and i>=2:
        bx,by=tips['tipWrench']
        for k in range(5):
            a=k*1.25+i; r=2+(i%3)*2
            px(im,bx+math.cos(a)*r,by+math.sin(a)*r,GOLD if k%2 else CYAN)
        gx,gy=bx+8,by-4-(i%2)
        for (dx,dy) in ((0,-2),(2,0),(0,2),(-2,0),(1,-1),(1,1),(-1,1),(-1,-1)): px(im,gx+dx,gy+dy,CYAN)
        px(im,gx,gy,WHITE)
    if name=='plague_doctor' and i>=2:
        bx,by=tips['tipCane']
        for k in range(4):
            r=2+((i-2)*2+k)%6; xx=bx+4+k*4+(i-2); yy=by+2-k*3
            c=LIME if k%2 else VIO
            for dx in range(-r//2,r//2+1):
                for dy in range(-r//3,r//3+1):
                    if dx*dx*4+dy*dy*9<=r*r+1: px(im,xx+dx,yy+dy,c)
    if name=='delivery_rider' and 2<=i<=6:
        bx,by=tips['tipBack']
        for k in range(4):
            yy=by-6+k*5; L=6+(k*3+i)%5
            for d in range(L): px(im,bx-4-d-(i-2)*2,yy,CYAN if d<L-2 else WHITE)

def build(name):
    kind='hero' if name in H else 'enemy'
    order=ORDER_H if kind=='hero' else ORDER_E
    meta=json.load(open(f'frames/{name}_meta.json'))
    rows={}
    for a in order:
        fr=[]
        n=len(meta[a])
        for i in range(n):
            im=Image.open(f'frames/{name}_{a}_{i}.png').convert('RGBA')
            apply(name,a,i,im,meta[a][i],n)
            if kind=='enemy': im=ImageOps.mirror(im)
            fr.append(im)
        rows[a]=fr
    cols=max(len(v) for v in rows.values())
    sheet=Image.new('RGBA',(F*cols,F*len(order)),(0,0,0,0))
    for r,a in enumerate(order):
        for c,im in enumerate(rows[a]): sheet.alpha_composite(im,(c*F,r*F))
    return rows, sheet, {a:len(rows[a]) for a in order}

if __name__=='__main__':
    os.makedirs('sheets',exist_ok=True); os.makedirs('gifs',exist_ok=True)
    info={}
    for n in H+E:
        rows,sheet,cnt=build(n); sheet.save(f'sheets/{n}.png'); info[n]={'frames':cnt,'kind':'hero' if n in H else 'enemy'}
        # 5x preview gif of every animation in sequence
        seq=[im for a in rows for im in rows[a] for _ in range(1)]
        bg=(22,10,36)
        g=[]
        for im in seq:
            b=Image.new('RGBA',(F,F),bg+(255,)); b.alpha_composite(im); g.append(b.convert('RGB').resize((F*5,F*5),0))
        g[0].save(f'gifs/{n}.gif',save_all=True,append_images=g[1:],duration=120,loop=0)
    json.dump(info,open('sheets/sprites.json','w'),indent=1)
    print('sheets done')
