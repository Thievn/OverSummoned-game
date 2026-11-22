from PIL import Image, ImageDraw
import json
F=64; info=json.load(open('sheets/sprites.json'))
def frame(n,row,i):
    s=Image.open(f'sheets/{n}.png'); cnt=list(info[n]['frames'].values())[row]
    return s.crop(((i%cnt)*F,row*F,(i%cnt)*F+F,row*F+F))
bg=Image.open('bg_dungeon.png').convert('RGBA')
party=[('paramedic',28),('legionary',64),('office_worker',100)]
foes=[('slime',196),('goblin',240),('skeleton',284)]
g=[]
for t in range(16):
    im=bg.copy()
    for n,x in party: im.alpha_composite(frame(n,0,t//2),(x,74))
    for n,x in foes: im.alpha_composite(frame(n,0,t//2),(x,74))
    g.append(im.convert('RGB').resize((384*3,160*3),0))
g[0].save('fight_preview.gif',save_all=True,append_images=g[1:],duration=110,loop=0)
g[0].save('fight_preview.png')
# brute room still
im=bg.copy()
for n,x in party: im.alpha_composite(frame(n,0,0),(x,74))
for n,x in [('goblin',218),('brute',268)]: im.alpha_composite(frame(n,0,0),(x,74))
im.convert('RGB').resize((384*3,160*3),0).save('fight_brute_scale.png')
H=['legionary','gangster','paramedic','office_worker','hunter','engineer','plague_doctor','delivery_rider']
g=[]
for t in range(8):
    im=Image.new('RGBA',(F*8,F),(18,8,34,255))
    for k,n in enumerate(H): im.alpha_composite(frame(n,3,t),(k*F,0))
    g.append(im.convert('RGB').resize((F*8*4,F*4),0))
g[0].save('skills_preview.gif',save_all=True,append_images=g[1:],duration=130,loop=0)
print('ok')
