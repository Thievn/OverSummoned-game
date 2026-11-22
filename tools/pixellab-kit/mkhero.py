import sys,json
from pl import *
from PIL import Image
hid,desc,size=sys.argv[1],sys.argv[2],int(sys.argv[3])
p=Image.open(f'/tmp/the-den-v2/public/assets/oversummoned/pixel/{hid}.png').convert('RGBA')
concept=p.resize((p.width*4,p.height*4),0)
body={'description':desc,'image_size':{'width':size,'height':size},'method':'create_from_concept','view':'side','concept_image':b64(concept),'no_background':True,
      'style_description':'crisp 16-bit pixel art game sprite, side-scroller, same colors and outfit as the concept portrait, single color dark outline'}
r=req('POST','/create-character-pro',body)
print(json.dumps(r)[:400])
jid=r.get('background_job_id') or r.get('job_id')
j=job(jid); json.dump(j,open(f'out_{hid}_create.json','w')); print('done',json.dumps(j)[:600])
