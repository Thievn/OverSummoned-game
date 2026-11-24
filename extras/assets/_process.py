import json, glob, os, numpy as np
from pathlib import Path
from PIL import Image
R=Path("_raw"); OUT=Path(".")
SPECS = {
 "hunter":("origin","Stone Age Hunter","Origins carousel + Descent demo (player)","Fire-craft"),
 "legionary":("origin","Roman Legionary","Origins carousel + Descent demo (player)","Formation"),
 "engineer":("origin","Victorian Engineer","Origins carousel + Descent demo (player)","Contraptions"),
 "gangster":("origin","Prohibition Gangster","Origins carousel + Descent demo (player)","Shakedown"),
 "paramedic":("origin","Modern Paramedic","Origins carousel + Descent demo (player)","Triage"),
 "office_worker":("origin","Office Worker","Origins carousel + Descent demo (player)","Paperwork"),
 "cellar_rat":("enemy","Cellar Rat (The Old Cellars)","Descent demo enemy, floor 1",None),
 "ghoul":("enemy","Ghoul (The Bone Orchard)","Descent demo enemy, elite",None),
 "boiler_boss":("enemy","The Angry Boiler (Old Cellars boss)","Descent demo boss",None),
 "clerk_pell":("npc","Mr. Pell, Hero Office clerk","City section / Hero Office NPC",None),
}
FPS={"idle":7,"attack":12,"hurt":12}
def load(p): return np.array(Image.open(p).convert("RGBA"))
def solid_rows(a, thr=3):
    m=a[...,3]>32; rows=np.where(m.sum(1)>=thr)[0]; return rows
def low_row(a): r=solid_rows(a); return int(r.max()) if len(r) else None
manifest_chars=[]; issues=[]
for cid,(kind,title,section,knowhow) in SPECS.items():
    still=R/f"{cid}.png"
    if not still.exists(): issues.append(f"{cid}: missing still"); continue
    anims={}
    for nm in ("idle","attack","hurt"):
        d=R/f"{cid}_{nm}"
        fs=sorted(d.glob("*.png")) if d.exists() else []
        if not fs: continue
        fr=[load(f) for f in fs]
        # drop trailing duplicate of frame 0 (loop closure)
        if len(fr)>8 and np.abs(fr[-1].astype(int)-fr[0].astype(int)).mean()<6: fr=fr[:-1]
        if len(fr)>8: fr=fr[:8] if nm=="idle" else fr
        anims[nm]=fr
    s=load(still)
    if "idle" not in anims: issues.append(f"{cid}: no idle"); 
    # feet row = median lowest solid row across idle frames (falls back to still)
    lows=[low_row(f) for f in anims.get("idle",[s])]
    feet=int(np.median(lows))
    # re-seat drifted frames: any frame whose lowest solid row sits below the feet line gets shifted up onto it
    for nm,v in anims.items():
        for i,f in enumerate(v):
            lr=low_row(f)
            if lr is not None and lr>feet+1:
                d=lr-feet; g=np.zeros_like(f); g[:-d]=f[d:]; v[i]=g
                issues.append(f"{cid} {nm}[{i}]: generator drifted {d}px down, re-seated onto feet line")
    allfr=[s]+[f for v in anims.values() for f in v]
    # horizontal/top union bbox across everything, alpha>0
    ys=[];xs=[]
    for f in allfr:
        m=f[...,3]>0
        if m.any():
            yy,xx=np.where(m); ys+= [yy.min()]; xs+=[xx.min(),xx.max()]
    top=max(0,min(ys)-2); left=max(0,min(xs)-2); right=min(s.shape[1]-1,max(xs)+2)
    # check below-feet pixels
    for nm,v in [("still",[s])]+list(anims.items()):
        for i,f in enumerate(v):
            lr=low_row(f)
            if lr is not None and lr>feet+1: issues.append(f"{cid} {nm}[{i}]: {lr-feet}px below feet line, clipped")
            if nm=="idle" and lr is not None and lr<feet-1: issues.append(f"{cid} idle[{i}]: lowest row {feet-lr}px above feet line (lift)")
    W=right-left+1; H=feet-top+1
    cdir=OUT/"characters"/cid; (cdir/"frames").mkdir(parents=True,exist_ok=True)
    def crop(f):
        c=f[top:feet+1, left:right+1].copy()
        return Image.fromarray(c,"RGBA")
    crop(s).save(cdir/f"{cid}.png")
    # feet anchor x: centre of opaque pixels in bottom 3 rows of still
    m=s[feet-2:feet+1, left:right+1,3]>32; xx=np.where(m.any(0))[0]
    anchor=int(round((xx.min()+xx.max())/2)) if len(xx) else W//2
    entry={"id":cid,"title":title,"kind":kind,"section":section,"facing":"right" if kind!="enemy" else "left",
           "still":str(cdir/f"{cid}.png"),"frame_width":W,"frame_height":H,
           "baseline":{"feet_y":H-1,"feet_offset_from_bottom_px":0,"feet_anchor_x":anchor,
                       "note":"Lowest opaque row of the idle loop is the last row of every frame. Place the frame's bottom edge on the ground line; no extra offset needed."},
           "source_canvas_px":s.shape[1],"animations":{}}
    if knowhow: entry["know_how"]=knowhow
    for nm,v in anims.items():
        ims=[crop(f) for f in v]
        files=[]
        for i,im in enumerate(ims):
            p=cdir/"frames"/f"{cid}_{nm}_{i:02d}.png"; im.save(p); files.append(str(p))
        sheet=Image.new("RGBA",(W*len(ims),H),(0,0,0,0))
        for i,im in enumerate(ims): sheet.paste(im,(i*W,0))
        sp=cdir/f"{cid}_{nm}_sheet.png"; sheet.save(sp)
        entry["animations"][nm]={"sheet":str(sp),"frames":files,"frame_count":len(ims),"fps":FPS[nm],
            "loop": nm=="idle","layout":"horizontal","frame_width":W,"frame_height":H}
    manifest_chars.append(entry)
json.dump({"characters":manifest_chars,"issues":issues},open("_raw/processed.json","w"),indent=1,default=int)
print("\n".join(issues) or "no issues"); print(len(manifest_chars),"chars")
