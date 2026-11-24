import os,json,base64,urllib.request,io
from PIL import Image
K=os.environ.get('PIXELLAB_API_KEY'); assert K, 'no key'
style="pixel art bust portrait, chest up, facing viewer, detailed 16-bit RPG character portrait, dark dungeon background with warm torchlight, crisp pixels, "
P={'engineer':"Victorian woman engineer Edith, brass goggles on her forehead, auburn hair in a bun, leather apron over a high-collar blouse, holding a wrench, steampunk",
'plague_doctor':"medieval plague doctor, long white beak mask, wide black hat, black leather coat, glass eye lenses, holding a cane with a lantern glow",
'delivery_rider':"young latino delivery rider Marco, bright red helmet pushed back, hoodie and hi-vis strap, insulated food delivery backpack, phone in hand, smirking"}
for k,d in P.items():
    body={"description":style+d,"image_size":{"width":96,"height":128},"detail":"highly detailed","direction":"south","outline":"selective outline","seed":7}
    r=urllib.request.Request("https://api.pixellab.ai/v1/generate-image-pixflux",data=json.dumps(body).encode(),headers={"Authorization":"Bearer "+K,"Content-Type":"application/json"})
    try:
        j=json.load(urllib.request.urlopen(r,timeout=180))
        b=j['image']['base64'].split(',')[-1]
        Image.open(io.BytesIO(base64.b64decode(b))).save(f'portraits/{k}.png'); print(k,'ok',j.get('usage'))
    except Exception as e:
        print(k,'ERR',e, getattr(e,'read',lambda:b'')()[:300])
