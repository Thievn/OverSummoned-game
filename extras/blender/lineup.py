from PIL import Image, ImageDraw, ImageOps
H=['legionary','gangster','paramedic','office_worker','hunter','engineer','plague_doctor','delivery_rider']
E=['slime','goblin','skeleton','ghoul','brute']
Z=5; step=40
W=step*(len(H)+len(E))+40
o=Image.new('RGBA',(W,72),(16,8,28,255)); d=ImageDraw.Draw(o)
d.rectangle((0,64,W,72),fill=(40,18,60,255)); d.line((0,64,W,64),fill=(255,46,140,255))
x=0
for n in H:
    im=Image.open(f'sheets/{n}.png').crop((0,0,64,64)); bb=im.getbbox(); o.alpha_composite(im,(x-bb[0]+4,4)); x+=step
x+=20
for n in E:
    im=Image.open(f'sheets/{n}.png').crop((0,0,64,64)); bb=im.getbbox(); o.alpha_composite(im,(x-bb[0]+4,4)); x+=step+ (16 if n=='brute' else 0)
o=o.crop((0,0,x+10,72))
o.resize((o.width*Z,o.height*Z),0).save('lineup_scale.png'); print(o.size)
