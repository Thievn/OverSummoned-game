import sys,json
from pl import *
from PIL import Image
eid,desc,size,concept=sys.argv[1],sys.argv[2],int(sys.argv[3]),sys.argv[4]
ids=json.load(open('hero_ids.json'))
body={'description':desc,'image_size':{'width':size,'height':size},'view':'side','no_background':True,
      'style_description':'crisp 16-bit pixel art game sprite, chibi side-scroller proportions, single color dark outline, matches the hero sprites'}
ref=Image.open('rot/legionary_east.png').convert('RGBA')
if concept!='-':
    c=Image.open(concept).convert('RGBA'); bb=c.getbbox(); c=c.crop(bb); c=c.resize((c.width*6,c.height*6),0)
    body.update(method='create_from_concept',concept_image=b64(c))
else:
    body.update(method='create_with_style')
if size>=56: body['style_character_id']=ids['legionary']
else: body['reference_image']=b64(ref)
r=req('POST','/create-character-pro',body)
j=job(r['background_job_id']); json.dump(j,open(f'out_{eid}_create.json','w')); print(eid,'done',j.get('usage'), j['last_response']['character_id'])
