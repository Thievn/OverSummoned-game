import json, os, copy
def B(shape,pivot,size,off,color,**k):
    d=dict(shape=shape,pivot=pivot,size=size,off=off,color=color); d.update(k); return d

def humanoid(c, s=1.0, limb=2.6, torso=(5.5,7,9.5), head=(9,9,8.5), leg=8):
    hz=leg
    piv=[['root',None,[0,0,0]],['hips','root',[0,0,hz]],['torso','hips',[0,0,0]],
         ['head','torso',[0,0,torso[2]-0.5]],['armF','torso',[0,-(torso[1]/2+limb/2-0.3),torso[2]-1.5]],
         ['armB','torso',[0,(torso[1]/2+limb/2-0.3),torso[2]-1.5]],
         ['handF','armF',[0,0,-7]],['handB','armB',[0,0,-7]],
         ['legF','hips',[0,-1.7,0]],['legB','hips',[0,1.7,0]],
         ['tipF','handF',[0,0,0]],['tipB','handB',[0,0,0]],['tipHead','head',[0,0,head[2]+2]]]
    P=[]
    for L in ('legF','legB'):
        P.append(B('box',L,[3,3,leg],[0,0,-leg/2],c['pants']))
        P.append(B('box',L,[4.4,3.2,2.2],[0.7,0,-leg+0.9],c['boots'],bevel=0.3))
    P.append(B('box','torso',list(torso),[0,0,torso[2]/2-0.4],c['top'],bevel=0.5))
    P.append(B('box','head',list(head),[0.3,0,head[2]/2],c['skin'],bevel=0.9))
    for y in (-2.2,2.2):
        P.append(B('box','head',[0.8,1.4,2.6],[head[0]/2+0.4,y,head[2]*0.48],c.get('eye','#120818')))
    for A,H in (('armF','handF'),('armB','handB')):
        P.append(B('box',A,[limb,limb,7],[0,0,-3.3],c.get('sleeve',c['top'])))
        P.append(B('sph',H,[3.2,3.2,3.2],[0,0,0],c.get('hand',c['skin'])))
    return piv,P

def hair(P,col,hx=9,top=8.5,back=True):
    P.append(B('box','head',[hx+0.6,9.6,2.6],[-0.2,0,top+0.4],col,bevel=0.6))
    if back: P.append(B('box','head',[3,9.6,6.5],[-3.6,0,top-2.6],col,bevel=0.5))


def vest(P):
    P.append(B('box','torso',[6.3,7.7,6.5],[0.1,0,5.2],'#c6ff3d',bevel=0.4))
    P.append(B('box','torso',[6.4,7.8,0.9],[0.1,0,4.2],'#e9eef5'))
def lantern(P,pv='handB'):
    P.append(B('box',pv,[2.6,2.6,0.8],[1.2,0,-1.2],'#3a3448'))
    P.append(B('box',pv,[2.2,2.2,2.6],[1.2,0,-2.8],'#ffd84d'))
    P.append(B('box',pv,[2.6,2.6,0.8],[1.2,0,-4.4],'#3a3448'))
def tubeman(P,pv='handB'):
    P.append(B('cyl',pv,[2.4,2.4,12],[3,0,5],'#ff2e8a'))
    P.append(B('sph',pv,[2.8,2.8,2.8],[3,0,11.6],'#ff2e8a'))
    P.append(B('box',pv,[0.8,1,1],[4.3,0,11.8],'#120818'))
    P.append(B('box',pv,[1,6,1.2],[3,0,8],'#36d6ff',rot=[25,0,0]))

# ---------------- animations ----------------
def idle():
    return [{'torso':{'z':0},'armF':{'swing':4},'armB':{'swing':-4}},
            {'torso':{'z':-0.6},'head':{'z':-0.3},'armF':{'swing':8},'armB':{'swing':-8}},
            {'torso':{'z':-1.0},'head':{'z':-0.4},'armF':{'swing':10},'armB':{'swing':-10}},
            {'torso':{'z':-0.6},'head':{'z':-0.3},'armF':{'swing':6},'armB':{'swing':-6}}]
def attack(arm='armF'):
    o='armB' if arm=='armF' else 'armF'
    return [{arm:{'swing':-50},'torso':{'swing':-10},'root':{'x':-1}},
            {arm:{'swing':-110},'torso':{'swing':-14},'root':{'x':-2},'legF':{'swing':10},'legB':{'swing':-10}},
            {arm:{'swing':40},'torso':{'swing':12},'root':{'x':5},'legF':{'swing':30},'legB':{'swing':-25},o:{'swing':-30}},
            {arm:{'swing':95},'torso':{'swing':18},'root':{'x':8},'legF':{'swing':35},'legB':{'swing':-30},o:{'swing':-40}},
            {arm:{'swing':80},'torso':{'swing':12},'root':{'x':6},'legF':{'swing':20},'legB':{'swing':-20}},
            {arm:{'swing':20},'torso':{'swing':3},'root':{'x':2}}]
def hit():
    return [{'root':{'x':-3},'torso':{'swing':-16},'head':{'swing':-14},'armF':{'swing':-30},'armB':{'swing':-40}},
            {'root':{'x':-2},'torso':{'swing':-10},'head':{'swing':-8},'armF':{'swing':-15},'armB':{'swing':-20}},
            {'root':{'x':-1},'torso':{'swing':-3},'armF':{'swing':0}}]
def death():
    return [{'root':{'x':-2},'torso':{'swing':-15},'head':{'swing':-15},'armF':{'swing':-40},'armB':{'swing':-40}},
            {'root':{'x':-3,'swing':-25},'torso':{'swing':-10},'armF':{'swing':-70},'armB':{'swing':-60},'legF':{'swing':20}},
            {'root':{'x':-4,'swing':-55,'z':0},'armF':{'swing':-100},'armB':{'swing':-90},'legF':{'swing':30}},
            {'root':{'x':-5,'swing':-80},'armF':{'swing':-120},'armB':{'swing':-110},'legF':{'swing':20}},
            {'root':{'x':-5,'swing':-88},'armF':{'swing':-130},'armB':{'swing':-120}}]
def skill_raise(arm='armF', lift=150, n=8):
    fr=[]
    for i in range(n):
        t=min(1,i/3)
        bob=[0,-0.5,-1,-0.5][i%4]
        fr.append({arm:{'swing':lift*t},'torso':{'swing':-6*t,'z':bob},'head':{'swing':-10*t},
                   ('armB' if arm=='armF' else 'armF'):{'swing':-20*t}})
    return fr
def skill_thrust(arm='armF', n=8):
    seq=[(-40,-1,-8),(-90,-2,-12),(60,4,10),(95,6,16),(95,6,16),(95,6,16),(70,4,10),(20,1,2)]
    return [{arm:{'swing':a},'root':{'x':x},'torso':{'swing':t},'legF':{'swing':max(0,t*2)},'legB':{'swing':-max(0,t*2)}} for a,x,t in seq[:n]]
def skill_guard(n=8):
    fr=[]
    for i in range(n):
        t=min(1,i/2)
        fr.append({'armB':{'swing':75*t},'armF':{'swing':-40*t},'torso':{'swing':8*t,'z':-1*t},
                   'legF':{'swing':20*t},'legB':{'swing':-15*t},'root':{'x':1*t}})
    return fr
def skill_dash(n=8):
    seq=[0,-2,6,12,16,16,10,4]
    fr=[]
    for i,x in enumerate(seq[:n]):
        run=(i%2)*2-1
        fr.append({'root':{'x':x},'torso':{'swing':18 if 1<i<6 else 4},'legF':{'swing':35*run},'legB':{'swing':-35*run},
                   'armF':{'swing':-40*run},'armB':{'swing':40*run}})
    return fr

def walk(n=4):
    fr=[]
    for i in range(n):
        r=[1,0,-1,0][i]
        fr.append({'legF':{'swing':25*r},'legB':{'swing':-25*r},'armF':{'swing':-20*r},'armB':{'swing':20*r},'torso':{'z':-0.5*abs(r)}})
    return fr

# ---------------- heroes ----------------
H={}
SKIN='#f0b98d'; SKIN2='#c98a5e'; SKIN3='#8c5a3c'
def hero(name, c, extra, skill, **kw):
    piv,P=humanoid(c, **kw); extra(piv,P)
    H[name]=dict(pivots=piv,parts=P,anims={'idle':idle(),'attack':attack(),'hit':hit(),'skill':skill},kind='hero')

def legion(piv,P):
    P.append(B('box','torso',[6.2,7.6,5.5],[0,0,6.5],'#c9d1e6',bevel=0.4))       # lorica
    P.append(B('box','torso',[6.4,7.8,3],[0,0,0.5],'#8e1b3a',bevel=0.3))          # tunic skirt
    P.append(B('box','head',[9.8,9.8,4],[0,0,8],'#c9d1e6',bevel=0.8))             # helmet
    P.append(B('box','head',[7,1.4,3.5],[-0.5,0,11],'#ff2e63'))                   # crest
    P.append(B('box','handF',[8.5,0.8,1.4],[5,0,0],'#e8eefc'))                    # gladius
    P.append(B('box','handF',[1,2.6,1],[0.8,0,0],'#ffcc33'))
    P.append(B('box','handB',[1.2,8.5,11],[5,-1,2.5],'#e0183f',bevel=0.3))           # scutum
    P.append(B('box','handB',[1.6,2.4,2.4],[5.6,-1.2,2.5],'#ffcc33'))
    vest(P)
    piv.append(['tipShield','handB',[4.5,-1,2]])
hero('legionary',dict(pants='#7a1a2e',boots='#6b4a2e',top='#8e1b3a',skin=SKIN),legion,skill_guard())

def gang(piv,P):
    P.append(B('box','torso',[5.8,2,5],[2.2,0,6],'#f2f0ea'))                    # shirt
    P.append(B('box','torso',[5.9,0.9,5],[2.5,0,5.6],'#ff2e63'))                # tie
    P.append(B('cyl','head',[13,13,0.9],[0.3,0,8.6],'#1d1b26'))                 # brim
    P.append(B('box','head',[8.6,8.6,4],[0,0,10.5],'#2a2735',bevel=0.7))
    P.append(B('box','head',[8.8,8.8,1],[0,0,9.4],'#ff2e63'))                   # hat band
    P.append(B('box','head',[1.6,2.4,0.8],[4.8,-1.5,2.4],'#3a2214'))            # moustache
    P.append(B('box','handF',[2,2.4,9],[1.2,0,-3.2],'#5a2e1a',bevel=0.5))      # violin case
    P.append(B('box','handF',[2.1,2.5,1],[1.2,0,-1],'#ffcc33'))
    lantern(P)
    piv.append(['tipCoin','handF',[1,0,1]])
hero('gangster',dict(pants='#2a2735',boots='#141019',top='#2f2c3d',skin=SKIN),gang,skill_raise('armF',110))

def medic(piv,P):
    P.append(B('box','armF',[2.8,2.8,1],[0,0,-1.5],'#c6ff3d'))                  # reflective band
    P.append(B('box','torso',[5.8,7.4,1],[0,0,5],'#c6ff3d'))
    P.append(B('box','handB',[4,3.4,3.4],[1,0,-1.5],'#f4f4f8',bevel=0.3))        # med bag
    P.append(B('box','handB',[4.2,1,1],[1,-1.8,-1.5],'#ff2e63'))
    P.append(B('box','handB',[1,1,3],[1,-1.8,-1.5],'#ff2e63'))
    hair(P,'#3a2418'); P.append(B('sph','head',[4,4,4],[-5,0,6],'#3a2418'))   # bun
    vest(P)
    P.append(B('cone','head',[3.6,3.6,7],[7.2,0,3.4],'#f2ede0',rot=[0,90,0]))
hero('paramedic',dict(pants='#25483e',boots='#141019',top='#2f6b57',skin=SKIN2),medic,skill_raise('armB',150))

def office(piv,P):
    P.append(B('box','torso',[5.9,0.9,6],[2.5,0,5],'#1d1b26'))                  # tie
    P.append(B('box','torso',[5.8,0.4,4],[2.4,-2.5,4],'#36d6ff'))              # lanyard
    P.append(B('box','torso',[0.6,1.6,2],[2.9,-2.5,2],'#f4f4f8'))
    hair(P,'#3b2a20')
    P.append(B('box','handF',[8.5,0.8,1.4],[5,0,0],'#d8dcea'))                  # rusty gladius
    P.append(B('box','handF',[1,2.6,1],[0.8,0,0],'#b0603a'))
    lantern(P)
hero('office_worker',dict(pants='#4a4a5a',boots='#7a4a2a',top='#e6e2d6',sleeve='#e6e2d6',skin=SKIN),office,skill_raise('armF',130))

def hunter(piv,P):
    P.append(B('box','torso',[6.4,7.8,7],[0,0,4.4],'#8a6240',bevel=0.6))        # fur
    P.append(B('box','torso',[6.6,8,1.6],[0,0,7.5],'#c9a77c',bevel=0.4))
    hair(P,'#e2582a'); P.append(B('box','head',[3,8,4.5],[4.6,0,1.4],'#e2582a',bevel=0.6))  # beard
    P.append(B('box','handF',[5,2.6,1.2],[2.2,0,-0.6],'#7a5030'))                # pocket trebuchet
    P.append(B('box','handF',[1,1,6],[3.4,0,2.4],'#9a6a40',rot=[0,30,0]))
    P.append(B('sph','handF',[1.8,1.8,1.8],[5,0,5],'#ff7a1a'))
    piv.append(['tipTorch','handF',[5,0,5.4]])
    tubeman(P); vest(P)
hero('hunter',dict(pants='#6b4a2e',boots='#4a3020',top='#8a6240',sleeve=SKIN,skin=SKIN),hunter,skill_thrust())

def engineer(piv,P):
    P.append(B('box','torso',[6,7.6,8],[0.3,0,3.6],'#7a4a2a',bevel=0.3))        # apron
    hair(P,'#b8322a'); P.append(B('sph','head',[4.4,4.4,4.4],[-1,0,10],'#b8322a'))
    P.append(B('box','head',[2,8.6,2],[4.4,0,7],'#ffcc33',bevel=0.3))           # goggles
    P.append(B('box','head',[0.8,2,1.4],[5.5,-2.2,7],'#36d6ff'))
    P.append(B('box','handF',[11,0.6,0.8],[6.5,0,0],'#e8eefc'))                 # duelling rapier
    P.append(B('box','handF',[1,2.8,1.4],[0.9,0,0],'#ffcc33'))
    piv.append(['tipWrench','handF',[11.5,0,0]])
    lantern(P)
hero('engineer',dict(pants='#3a2a2a',boots='#2a1a14',top='#ece6d8',sleeve='#ece6d8',skin=SKIN),engineer,skill_raise('armF',120))

def plague(piv,P):
    P.append(B('box','hips',[7,8,7],[-0.3,0,-2.6],'#1d1b26',bevel=0.5))         # coat skirt
    P.append(B('cone','head',[3.2,3.2,7],[7.2,0,3.4],'#f2ede0',rot=[0,90,0]))  # beak
    P.append(B('cyl','head',[14,14,0.9],[0,0,8.6],'#14111c'))
    P.append(B('box','head',[8.4,8.4,3.6],[0,0,10.6],'#1d1b26',bevel=0.6))
    P.append(B('box','head',[0.9,1.8,1.8],[4.9,-2.2,5],'#36d6ff'))              # lenses
    P.append(B('box','handF',[1,1,11],[1,0,1.5],'#5a3a22'))                     # cane
    piv.append(['tipCane','handF',[1,0,7.4]])
    lantern(P)
hero('plague_doctor',dict(pants='#14111c',boots='#0e0b14',top='#25222f',skin='#f2ede0',hand='#2a2735'),plague,skill_raise('armF',100))

def rider(piv,P):
    P.append(B('sph','head',[10.4,10.4,8],[0,0,6.6],'#ff2e3e'))                 # helmet
    P.append(B('box','head',[1,6,1.4],[5,0,6.8],'#ffffff'))
    P.append(B('box','torso',[6,8.6,9.6],[-5.6,0,5.4],'#36d6ff',bevel=0.6))      # delivery pack
    P.append(B('box','torso',[0.6,4,2],[-8.6,0,6],'#f4f4f8'))
    vest(P); tubeman(P)
    piv.append(['tipBack','torso',[-6,0,4]])
hero('delivery_rider',dict(pants='#2c4a8a',boots='#7a4a2a',top='#e8452c',skin=SKIN3),rider,skill_dash())

# ---------------- enemies ----------------
E={}
def slime():
    piv=[['root',None,[0,0,0]],['body','root',[0,0,0]],['tipHead','body',[0,0,12]]]
    P=[B('sph','body',[13,11,10],[0,0,5],'#ff4fa3'),B('sph','body',[6,6,4],[2,0,8],'#ffa3d4'),
       B('box','body',[0.8,1.4,2.2],[6,-2.2,6],'#120818'),B('box','body',[0.8,1.4,2.2],[6,2.2,6],'#120818')]
    sq=[1,0.9,0.82,0.92]
    an={'idle':[{'root':{'sq':s}} for s in sq],
        'attack':[{'root':{'sq':0.75}},{'root':{'sq':1.25,'z':3,'x':2}},{'root':{'sq':1.1,'z':6,'x':6}},{'root':{'sq':0.8,'x':10}},{'root':{'sq':0.9,'x':6}},{'root':{'sq':1,'x':2}}],
        'hit':[{'root':{'sq':0.7,'x':-3}},{'root':{'sq':1.15,'x':-2}},{'root':{'sq':0.95,'x':-1}}],
        'death':[{'root':{'sq':0.7}},{'root':{'sq':0.5}},{'root':{'sq':0.35}},{'root':{'sq':0.22}},{'root':{'sq':0.12}}]}
    E['slime']=dict(pivots=piv,parts=P,anims=an,kind='enemy',turn=-20)
slime()
def enemy_h(name,c,extra,s=1.0,**kw):
    piv,P=humanoid(c,**kw); extra(piv,P)
    E[name]=dict(pivots=piv,parts=P,anims={'idle':idle(),'attack':attack(),'hit':hit(),'death':death()},kind='enemy',scale=s)
def gob(piv,P):
    P.append(B('cone','head',[2,4,6],[-1,-5.5,5],'#7cc23a',rot=[90,0,0]))
    P.append(B('cone','head',[2,4,6],[-1,5.5,5],'#7cc23a',rot=[-90,0,0]))
    P.append(B('box','handF',[6,0.8,1.2],[3.4,0,0],'#c8ccd8'))
    P.append(B('box','head',[0.9,1.6,1.6],[4.9,-2.2,4],'#ffe14d'))
enemy_h('goblin',dict(pants='#5a3a22',boots='#3a2414',top='#8a6a3a',sleeve='#7cc23a',skin='#7cc23a',eye='#ff2e63'),gob,s=0.72)
def skel(piv,P):
    for p in P:
        if p['pivot'] in ('legF','legB','armF','armB') and p['shape']=='box' and p['size'][2]>5: p['size'][0]=p['size'][1]=1.5
    P.append(B('box','torso',[1.6,1.6,9],[0,0,4.4],'#e8e2cc'))
    for z in (4.5,6.5,8): P.append(B('box','torso',[4.5,6.8,1],[0.3,0,z],'#e8e2cc'))
    P.append(B('box','head',[2,7,2.4],[3.6,0,0.8],'#cfc8b0'))
    P.append(B('box','handF',[8.5,0.8,1.6],[5,0,0],'#b0603a'))
enemy_h('skeleton',dict(pants='#e8e2cc',boots='#e8e2cc',top='#00000000',skin='#e8e2cc',eye='#ff2e63'),skel,torso=(2.0,6.8,9.5))
def ghoul(piv,P):
    P.append(B('box','torso',[5.8,7.4,1],[2.6,0,5],'#ff7a1a'))
    P.append(B('box','head',[0.9,1.6,1.6],[4.9,-2.2,4],'#ffe14d'))
    for p in P:
        if p['pivot']=='head' and p['color']=='#120818': p['color']='#ffe14d'
enemy_h('ghoul',dict(pants='#1b1622',boots='#1b1622',top='#2a2030',skin='#2a2030',hand='#2a2030',eye='#ffe14d'),ghoul,s=1.0)
def brute(piv,P):
    P.append(B('cone','head',[2.4,2.4,4],[1,-3.5,10],'#f2ede0'))
    P.append(B('cone','head',[2.4,2.4,4],[1,3.5,10],'#f2ede0'))
    P.append(B('box','handF',[1.6,1.6,10],[0.6,0,4],'#6b4a2e'))
    P.append(B('box','handF',[3.4,3.4,5],[0.6,0,9],'#5a3a22',bevel=0.6))
    P.append(B('box','torso',[7.2,9.2,3],[0,0,0.6],'#3a2414'))
    P.append(B('box','head',[2,6,1.6],[4.5,0,1.5],'#f2ede0'))
enemy_h('brute',dict(pants='#3a2a3a',boots='#2a1a24',top='#7d6a8f',sleeve='#7d6a8f',skin='#7d6a8f',eye='#ff2e63'),brute,s=1.55,torso=(7,9,9.5),limb=3.4)

os.makedirs('specs',exist_ok=True)
for d in (H,E):
    for k,v in d.items():
        v['parts']=[p for p in v['parts'] if p['color']!='#00000000']
        if 'turn' not in v: v['turn']=-24
        json.dump(v,open(f'specs/{k}.json','w'))
print(list(H),list(E))
