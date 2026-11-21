"""Unify raw PixelLab icons: shared master palette, <=12 colors/icon, 1px dark outline, 4x export, code rarity glow."""
import json, numpy as np
from PIL import Image, ImageFilter
from scipy.cluster.vq import kmeans2
from scipy import ndimage
ITEMS=json.load(open('items.json'))
RC={"Common":"#B8B2A7","Uncommon":"#3FAE4F","Rare":"#3A86FF","Epic":"#A35BF0","Legendary":"#F28C1B","Absurd":"#F04FC8","Unhinged":"#E5262E"}
OUTLINE=np.array([22,16,18])
def load(i): return np.array(Image.open(f'raw/{i}.png').convert('RGBA')).astype(float)
def build_palette(k=48):
    px=np.concatenate([a[a[...,3]>127][:,:3] for a in map(load,[it['id'] for it in ITEMS])])
    np.random.seed(7); c,_=kmeans2(px,k,minit='++',seed=7)
    return np.vstack([c,OUTLINE])
def process(iid,pal):
    a=load(iid); m=a[...,3]>127
    rgb=a[...,:3][m]
    # per-icon: pick <=11 colors from master palette (+outline)
    d=((rgb[:,None,:]-pal[None])**2).sum(-1); idx=d.argmin(1)
    cnt=np.bincount(idx,minlength=len(pal)); keep=list(np.argsort(-cnt)[:11]); keep=[k for k in keep if cnt[k]>0]
    if len(pal)-1 not in keep: keep.append(len(pal)-1)
    sub=pal[keep]; d=((rgb[:,None,:]-sub[None])**2).sum(-1); out=np.zeros((32,32,4),np.uint8)
    out[...,:3][m]=sub[d.argmin(1)]; out[...,3][m]=255
    # 1px outline: transparent pixels touching the sprite become outline; ensure sprite edge is dark
    ring=ndimage.binary_dilation(m,structure=[[0,1,0],[1,1,1],[0,1,0]])&~m
    out[ring]=[*OUTLINE,255]
    return Image.fromarray(out)
def glow(icon32,rarity,scale=4,pad=6):
    """Return icon at `scale` with a code-drawn rarity glow behind it (pad in source px)."""
    big=icon32.resize((32*scale,32*scale),Image.NEAREST)
    S=(32+2*pad)*scale; can=Image.new('RGBA',(S,S),(0,0,0,0))
    col=tuple(int(RC[rarity][i:i+2],16) for i in (1,3,5))
    al=Image.new('L',(S,S),0); al.paste(big.getchannel('A'),(pad*scale,pad*scale))
    g=np.array(al.filter(ImageFilter.MaxFilter(scale*2+1)).filter(ImageFilter.GaussianBlur(scale*2.5))).astype(float)
    g=np.clip(g/max(g.max(),1)*1.4,0,1)*(230 if rarity in("Legendary","Absurd","Unhinged") else 190)
    gl=Image.new('RGBA',(S,S),col+(0,)); gl.putalpha(Image.fromarray(g.astype(np.uint8)))
    can.alpha_composite(gl); can.alpha_composite(big,(pad*scale,pad*scale)); return can
if __name__=='__main__':
    import os; os.makedirs('glow',exist_ok=True)
    pal=build_palette(); Image.fromarray(np.repeat(pal[None].astype(np.uint8),8,0)).resize((len(pal)*8,64),Image.NEAREST).save('master_palette.png')
    np.savetxt('master_palette.txt',pal,fmt='%d')
    for it in ITEMS:
        ic=process(it['id'],pal); ic.save(f"{it['id']}.png"); ic.resize((128,128),Image.NEAREST).save(f"{it['id']}@4x.png")
        glow(ic,it['rarity']).save(f"glow/{it['id']}_glow@4x.png")
        print(it['id'],len(set(map(tuple,np.array(ic).reshape(-1,4)[np.array(ic)[...,3].ravel()>0]))))
