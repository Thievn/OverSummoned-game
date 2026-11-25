import sys
from PIL import Image, ImageDraw
# zoomgrid.py src out x0 y0 x1 y1 k
src,out=sys.argv[1],sys.argv[2]; x0,y0,x1,y1=map(int,sys.argv[3:7]); k=float(sys.argv[7])
im=Image.open(src).convert('RGBA'); bg=Image.new('RGBA',im.size,(40,60,200,255)); bg.alpha_composite(im)
c=bg.crop((x0,y0,x1,y1)).resize((int((x1-x0)*k),int((y1-y0)*k)),Image.LANCZOS); d=ImageDraw.Draw(c)
for x in range(x0-x0%20+20,x1,20):
    X=(x-x0)*k; d.line([X,0,X,c.height],fill=(255,255,0,110)); d.text((X+2,2),str(x),fill=(255,255,0,255))
for y in range(y0-y0%20+20,y1,20):
    Y=(y-y0)*k; d.line([0,Y,c.width,Y],fill=(255,255,0,110)); d.text((2,Y+2),str(y),fill=(255,255,0,255))
c.save(out); print(im.size,c.size)
