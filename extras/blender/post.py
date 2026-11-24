import json, os, sys, colorsys, math, random
from PIL import Image, ImageDraw
F=64; R=4
OUTL=(18,8,24,255)
def hx(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
def ramp(c):
    r,g,b=[x/255 for x in c]; h,l,s=colorsys.rgb_to_hls(r,g,b)
    def mk(dh,dl,ds):
        hh=h+dh
        return tuple(int(max(0,min(1,v))*255) for v in colorsys.hls_to_rgb(hh%1,max(0,min(1,l+dl)),max(0,min(1,s+ds))))
    # shadows drift toward violet, lights toward warm
    tv=0.75-h; tv=(tv+0.5)%1-0.5
    tw=0.12-h; tw=(tw+0.5)%1-0.5
    return [mk(tv*0.06,-0.13*max(l,0.4),-0.08), c, mk(tw*0.1,0.12*(1-l)+0.04,-0.05)]
def lum(p): return 0.3*p[0]+0.59*p[1]+0.11*p[2]+1

def process(name, spec):
    cols=sorted({p['color'] for p in spec['parts']})
    bases=[hx(c) for c in cols]; ramps=[ramp(c) for c in bases]
    meta=json.load(open(f'raw/{name}/meta.json'))
    # per-character shade thresholds from idle frame 0 so shading stays stable across frames
    f=Image.open(f'raw/{name}/idle_0_f.png').convert('RGBA').load(); s=Image.open(f'raw/{name}/idle_0_s.png').convert('RGBA').load()
    rs=sorted(lum(s[x,y])/lum(f[x,y]) for y in range(F*R) for x in range(F*R) if f[x,y][3]>128)
    T0=rs[int(len(rs)*0.22)]; T1=rs[int(len(rs)*0.86)]
    out={}
    for anim,frames in spec['anims'].items():
        out[anim]=[]
        for i in range(len(frames)):
            f=Image.open(f'raw/{name}/{anim}_{i}_f.png').convert('RGBA'); s=Image.open(f'raw/{name}/{anim}_{i}_s.png').convert('RGBA')
            fp=f.load(); sp=s.load()
            img=Image.new('RGBA',(F,F),(0,0,0,0)); ip=img.load()
            for by in range(F):
                for bx in range(F):
                    cnt={}; op=0
                    for yy in range(R):
                        for xx in range(R):
                            X,Y=bx*R+xx,by*R+yy; a=fp[X,Y]
                            if a[3]<128: continue
                            op+=1
                            # flat pass is linear->sRGB of the base color; find nearest base
                            k=min(range(len(bases)),key=lambda j:sum((a[t]-bases[j][t])**2 for t in range(3)))
                            ratio=lum(sp[X,Y])/lum(a)
                            lv=0 if ratio<T0 else (2 if ratio>T1 else 1)
                            cnt[(k,lv)]=cnt.get((k,lv),0)+1
                    if op>=7:
                        k,lv=max(cnt,key=cnt.get); ip[bx,by]=(*ramps[k][lv],255)
            # cleanup: kill lone shade speckles inside a part
            ref=img.copy(); rp=ref.load()
            for y in range(1,F-1):
                for x in range(1,F-1):
                    c=rp[x,y]
                    if c[3]==0: continue
                    nb=[rp[x+1,y],rp[x-1,y],rp[x,y+1],rp[x,y-1]]
                    if c in nb: continue
                    best=max(set(nb),key=nb.count)
                    if nb.count(best)>=3 and best[3]: ip[x,y]=best
            # outline
            o=img.copy(); op_=o.load()
            for y in range(F):
                for x in range(F):
                    if ip[x,y][3]==0:
                        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                            if 0<=x+dx<F and 0<=y+dy<F and ip[x+dx,y+dy][3]:
                                op_[x,y]=OUTL; break
            out[anim].append(o)
    return out, meta

if __name__=='__main__':
    import pickle
    name=sys.argv[1]; spec=json.load(open(f'specs/{name}.json'))
    out,meta=process(name,spec)
    os.makedirs('frames',exist_ok=True)
    for a,fr in out.items():
        for i,im in enumerate(fr): im.save(f'frames/{name}_{a}_{i}.png')
    json.dump(meta,open(f'frames/{name}_meta.json','w'))
    print('ok',name)
