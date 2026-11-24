from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
F="/usr/share/fonts/truetype/sand-box/google/Pirata One/PirataOne-Regular.ttf"
def wordmark(text, px, scale, out, fpath=F, var=None):
    font=ImageFont.truetype(fpath, px)
    if var: font.set_variation_by_name(var)
    l,t,r,b=font.getbbox(text)
    W,H=r-l+12,b-t+12
    m=Image.new("L",(W,H),0); ImageDraw.Draw(m).text((6-l,6-t),text,font=font,fill=255)
    a=(np.array(m)>110).astype(np.uint8)
    h=a.shape[0]
    # gradient: candle gold top -> ember orange -> blood red bottom
    ys=np.linspace(0,1,h)[:,None]
    top=np.array([255,224,140]);mid=np.array([232,138,48]);bot=np.array([140,32,24])
    col=np.where(ys[...,None]<0.5, top+(mid-top)*(ys[...,None]/0.5), mid+(bot-mid)*((ys[...,None]-0.5)/0.5))
    col=np.broadcast_to(col,(h,a.shape[1],3)).copy()
    # highlight row
    img=np.zeros((h,a.shape[1],4),np.uint8)
    # outline 1px dark
    from scipy.ndimage import binary_dilation
    o=binary_dilation(a,iterations=1)&~a.astype(bool)
    sh=np.zeros_like(a,bool); sh[2:,2:]=binary_dilation(a,iterations=1)[:-2,:-2]
    img[sh]=[40,6,6,255]
    img[o]=[20,10,8,255]
    img[a.astype(bool),:3]=col[a.astype(bool)]; img[a.astype(bool),3]=255
    im=Image.fromarray(img,"RGBA")
    im=im.crop(im.getbbox())
    im=im.resize((im.width*scale,im.height*scale),Image.NEAREST)
    im.save(out); return im.size
G="/usr/share/fonts/truetype/sand-box/google/Grenze/Grenze-VariableFont_wght.ttf"
print(wordmark("OverSummoned",44,4,"logo/oversummoned_wordmark_pixel.png",G,b"Black"))
print(wordmark("OverSummoned",44,1,"logo/oversummoned_wordmark_pixel_1x.png",G,b"Black"))
print(wordmark("OverSummoned",40,4,"logo/oversummoned_wordmark_blackletter_alt.png"))
