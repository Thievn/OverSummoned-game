import json,os,sys
from PIL import Image
H=['legionary','gangster','paramedic','office_worker','hunter','engineer','plague_doctor','delivery_rider']
E=['slime','goblin','skeleton','ghoul','brute']
# which stored animation to use per row (first existing wins)
PICK={'idle':['idle','t_idle_pmm'],'attack':['attack','t_atk_v3'],'hit':['hit'],'skill':['skill'],'death':['death']}
OVR={'office_worker':{'attack':'attack2','hit':'hit3'},'hunter':{'attack':'attack2','hit':'hit2','skill':'skill2'},
 'plague_doctor':{'hit':'hit3'},'delivery_rider':{'attack':'attack2','skill':'skill2'},
 'skeleton':{'attack':'attack3'},'ghoul':{'attack':'attack2','hit':'hit3'},'slime':{'death':'death3','attack':'attack2'},
 'brute':json.load(open('brute_pick.json')) if os.path.exists('brute_pick.json') else {}}
ROWS={'hero':['idle','attack','hit','skill'],'enemy':['idle','attack','hit','death']}
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../public/assets/oversummoned/sprites')
def melt(fr):
    # finish the squash with a flat puddle that fades out
    base=fr[-1]; bb=base.getbbox(); cx=(bb[0]+bb[2])/2; w0=bb[2]-bb[0]; h0=bb[3]-bb[1]
    crop=base.crop(bb); out=list(fr)
    for sy,sx,a in [(0.7,1.1,1),(0.5,1.2,.9),(0.32,1.3,.65),(0.18,1.35,.35)]:
        w=max(1,round(w0*sx)); h=max(1,round(h0*sy))
        c=crop.resize((w,h),Image.NEAREST)
        al=c.getchannel('A').point(lambda v:int(v*a)); c.putalpha(al)
        im=Image.new('RGBA',base.size,(0,0,0,0)); im.alpha_composite(c,(round(cx-w/2),bb[3]-h)); out.append(im)
    return out
def load(name,kind):
    meta=json.load(open(f'zips/{name}/metadata.json')); st=meta['states'][0]['frames']['animations']
    dr='east' if kind=='hero' else 'west'
    res={}
    for row in ROWS[kind]:
        o=OVR.get(name,{}).get(row); key=o if o else next((k for k in PICK[row] if k in st and dr in st[k]),None)
        if not key: raise SystemExit(f'{name} missing {row}')
        fr=[Image.open(f'zips/{name}/'+f).convert('RGBA') for f in st[key][dr]]
        if name=='slime' and row=='death': fr=melt(fr[:7])
        res[row]=(key,fr)
    return res
def anchor_of(im):
    bb=im.getbbox(); return ((bb[0]+bb[2])/2, bb[3])  # body center x, feet y
info={}
for name in H+E:
    kind='hero' if name in H else 'enemy'
    if not os.path.exists(f'zips/{name}/metadata.json'): print('skip',name); continue
    rows=load(name,kind)
    # align every animation by its first frame (the reference pose) so feet and body center stay put
    placed={}; minx=miny=1e9; maxx=maxy=-1e9
    for row,(key,frames) in rows.items():
        ax,ay=anchor_of(frames[0]); ax=round(ax)
        placed[row]=(frames,ax,ay)
        for f in frames:
            bb=f.getbbox()
            if not bb: continue
            minx=min(minx,bb[0]-ax); maxx=max(maxx,bb[2]-ax); miny=min(miny,bb[1]-ay); maxy=max(maxy,bb[3]-ay)
    pad=2
    left=int(-minx)+pad; top=int(-miny)+pad
    W=left+int(maxx)+pad; Hh=top+int(maxy)+pad
    cols=max(len(v[0]) for v in placed.values())
    sheet=Image.new('RGBA',(W*cols,Hh*len(placed)),(0,0,0,0))
    for r,(row,(frames,ax,ay)) in enumerate(placed.items()):
        for c,f in enumerate(frames):
            sheet.alpha_composite(f,(c*W+left-ax, r*Hh+top-int(ay)))
    sheet.save(f'{OUT}/{name}.png')
    ref=rows['idle'][1][0]; bb=ref.getbbox()
    info[name]={'kind':kind,'w':W,'h':Hh,'ax':left,'ay':top,'height':bb[3]-bb[1],'frames':{row:len(v[0]) for row,v in placed.items()},'src':{row:rows[row][0] for row in rows}}
    print(name, W,Hh,'anchor',left,top,'height',bb[3]-bb[1], info[name]['frames'], info[name]['src'])
old=json.load(open(f'{OUT}/sprites.json')) if os.path.exists(f'{OUT}/sprites.json') else {}
json.dump(info,open(f'{OUT}/sprites.json','w'),indent=1)
