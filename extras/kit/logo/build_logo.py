"""Build the OverSummoned wordmark: master SVG (vector paths, no font needed) + high-res PNG.
Glyph outlines come from Cinzel Decorative Black (OFL) as a starting shape; letterforms are then
locked as paths in the SVG so the logo never depends on a font again."""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import numpy as np, cairosvg, io
from PIL import Image, ImageFilter
FONT="/usr/share/fonts/truetype/sand-box/google/Cinzel Decorative/CinzelDecorative-Black.ttf"
TEXT="OverSummoned"
f=TTFont(FONT); cmap=f.getBestCmap(); gs=f.getGlyphSet(); upm=f['head'].unitsPerEm
hmtx=f['hmtx']
SIZE=200  # px per em
# capitals O and S bigger, like the mockup
scale={0:1.0}; 
pad_x=170; base=310; x=pad_x; paths=[]; tracking=6
for i,ch in enumerate(TEXT):
    gname=cmap[ord(ch)]
    s=SIZE/upm*(1.18 if ch in "OS" else 1.0)
    pen=SVGPathPen(gs)
    tp=TransformPen(pen,(s,0,0,-s,x,base))
    gs[gname].draw(tp)
    paths.append(pen.getCommands())
    x+=hmtx[gname][0]*s+tracking
W=int(x+pad_x); 
D=" ".join(paths)
# crown (vector) centered above, between letters
cx=W/2; cy=58
CS=1.55
crown=(f"M{cx-46},{cy+38} L{cx-52},{cy-6} L{cx-30},{cy+14} L{cx-14},{cy-18} L{cx},{cy+6} L{cx+14},{cy-18} L{cx+30},{cy+14} L{cx+52},{cy-6} L{cx+46},{cy+38} Z "
       f"M{cx-48},{cy+42} L{cx+48},{cy+42} L{cx+48},{cy+52} L{cx-48},{cy+52} Z")
pearls="".join(f'<circle cx="{px}" cy="{py}" r="5"/>' for px,py in [(cx-52,cy-10),(cx-14,cy-22),(cx+14,cy-22),(cx+52,cy-10),(cx,cy-30)])
H=360
# side flourishes: thin line + diamond, like the mockup
def flourish(x0,x1,y):
    d=f"M{x0},{y-1.2} L{x1},{y-1.2} L{x1},{y+1.2} L{x0},{y+1.2} Z "
    xm=x0 if x0<x1 else x0
    return d
fl_y=base-55
fl=(f"M8,{fl_y-1.5} L{pad_x-14},{fl_y-1.5} L{pad_x-14},{fl_y+1.5} L8,{fl_y+1.5} Z M{pad_x-34},{fl_y} L{pad_x-24},{fl_y-9} L{pad_x-14},{fl_y} L{pad_x-24},{fl_y+9} Z M8,{fl_y} L16,{fl_y-5} L24,{fl_y} L16,{fl_y+5} Z "
    f"M{W-8},{fl_y-1.5} L{W-pad_x+14},{fl_y-1.5} L{W-pad_x+14},{fl_y+1.5} L{W-8},{fl_y+1.5} Z M{W-pad_x+34},{fl_y} L{W-pad_x+24},{fl_y-9} L{W-pad_x+14},{fl_y} L{W-pad_x+24},{fl_y+9} Z M{W-8},{fl_y} L{W-16},{fl_y-5} L{W-24},{fl_y} L{W-16},{fl_y+5} Z")
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <title>OverSummoned</title>
  <defs>
    <linearGradient id="gold" x1="0" y1="{base-200}" x2="0" y2="{base+10}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFF1BF"/>
      <stop offset="0.30" stop-color="#E9C26A"/>
      <stop offset="0.52" stop-color="#B9822F"/>
      <stop offset="0.56" stop-color="#F3D589"/>
      <stop offset="0.78" stop-color="#C08A35"/>
      <stop offset="1" stop-color="#6E4413"/>
    </linearGradient>
    <linearGradient id="goldc" x1="0" y1="{cy-35*CS}" x2="0" y2="{cy+55*CS}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFF1BF"/><stop offset="0.35" stop-color="#E2B65C"/><stop offset="0.7" stop-color="#B07A2C"/><stop offset="1" stop-color="#6E4413"/>
    </linearGradient>
    <linearGradient id="hi" x1="0" y1="{base-200}" x2="0" y2="{base}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/>
      <stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g id="layer-shadow" fill="#0B0705" fill-opacity="0.85" transform="translate(5,7)"><path d="{D}"/><path d="{crown}" transform="translate({cx*(1-CS)},{cy*(1-CS)}) scale({CS})"/></g>
  <g id="layer-outline" fill="none" stroke="#1E1208" stroke-width="7" stroke-linejoin="round"><path d="{D}"/><path d="{crown}" transform="translate({cx*(1-CS)},{cy*(1-CS)}) scale({CS})"/></g>
  <g id="layer-bevel-dark" fill="#5A360F" transform="translate(1.6,2.2)"><path d="{D}"/><path d="{crown}" transform="translate({cx*(1-CS)},{cy*(1-CS)}) scale({CS})"/></g>
  <g id="layer-gold" fill="url(#gold)"><path d="{D}"/><path fill="url(#goldc)" d="{crown}" transform="translate({cx*(1-CS)},{cy*(1-CS)}) scale({CS})"/><g fill="#F4E6C8" stroke="#3A260E" stroke-width="1" transform="translate({cx*(1-CS)},{cy*(1-CS)}) scale({CS})">{pearls}</g><path d="{fl}"/></g>
  <g id="layer-highlight" fill="url(#hi)" transform="translate(-1,-1.4)"><path d="{D}"/></g>
  <g id="layer-gem" fill="#9E1B1B" stroke="#2A0A0A" stroke-width="1.5"><circle cx="{cx}" cy="{cy+31*CS}" r="{6*CS}"/></g>
</svg>'''
open("oversummoned_logo.svg","w").write(svg)
# one-color version
one=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}"><title>OverSummoned</title><g fill="#D4A64A"><path d="{D}"/><path d="{crown}" transform="translate({cx*(1-CS)},{cy*(1-CS)}) scale({CS})"/><g fill="#F4E6C8" stroke="#3A260E" stroke-width="1" transform="translate({cx*(1-CS)},{cy*(1-CS)}) scale({CS})">{pearls}</g><path d="{fl}"/></g></svg>'
open("oversummoned_logo_onecolor.svg","w").write(one)
# PNG renders
for sc,name in [(4,"oversummoned_logo_4x.png"),(2,"oversummoned_logo_2x.png"),(1,"oversummoned_logo_1x.png")]:
    png=cairosvg.svg2png(bytestring=svg.encode(),output_width=W*sc,output_height=H*sc)
    im=Image.open(io.BytesIO(png)).convert("RGBA")
    # soft blurred drop shadow under everything for the hi-res PNG
    a=im.split()[3].filter(ImageFilter.GaussianBlur(6*sc))
    sh=Image.new("RGBA",im.size,(0,0,0,0)); sh.putalpha(a.point(lambda v:int(v*0.55)))
    if sc>=2:
        from scipy import ndimage
        arr=np.array(im).astype(float); al=arr[...,3]/255
        dist=ndimage.distance_transform_edt(al>0.5); dist=np.minimum(dist,5*sc)/(5*sc)
        gy,gx=np.gradient(ndimage.gaussian_filter(dist,1.2*sc))
        light=np.clip(-(gx*0.7+gy*0.7)*6*sc,-1,1)
        rng=np.random.default_rng(3); noise=ndimage.gaussian_filter(rng.normal(0,1,al.shape),0.8*sc)*0.06
        gold=(arr[...,0]>120)&(al>0.5)
        f=1+light*0.35+noise
        for c in range(3): arr[...,c]=np.where(gold,np.clip(arr[...,c]*f,0,255),arr[...,c])
        im=Image.fromarray(arr.astype(np.uint8),"RGBA")
    out=Image.alpha_composite(sh,im); bb=out.getbbox(); out=out.crop(bb); out.save(name)
    print(name,out.size)
cairosvg.svg2png(bytestring=one.encode(),write_to="oversummoned_logo_onecolor_4x.png",output_width=W*4,output_height=H*4)
