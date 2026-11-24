import os,json,base64,urllib.request,io
from PIL import Image
K=os.environ['PIXELLAB_API_KEY']
def gen(name,desc,w,h,seed=7,nobg=False):
    body={"description":desc,"image_size":{"width":w,"height":h},"detail":"highly detailed","seed":seed,"no_background":nobg}
    if name.startswith('p_'): body.update(direction="south",outline="selective outline")
    r=urllib.request.Request("https://api.pixellab.ai/v1/generate-image-pixflux",data=json.dumps(body).encode(),headers={"Authorization":"Bearer "+K,"Content-Type":"application/json"})
    j=json.load(urllib.request.urlopen(r,timeout=180)); b=j['image']['base64'].split(',')[-1]
    Image.open(io.BytesIO(base64.b64decode(b))).save(f'{name}.png'); print(name,'ok')
style="pixel art bust portrait, chest up, facing viewer, detailed 16-bit RPG character portrait, dark dungeon background with warm torchlight, crisp pixels, "
gen('portraits/office_worker',style+"tired office worker Kevin, short brown hair, white shirt with loose black tie, blue lanyard ID badge, holding a coffee mug, deadpan expression",96,128)
gen('bg_dungeon',"side view pixel art dungeon hall interior, dark stone brick back wall, arches, glowing magenta and cyan crystal torches, violet fog, flat stone floor along the bottom, no characters, wide game background",384,160,seed=11)
