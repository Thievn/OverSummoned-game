import asyncio
from playwright.async_api import async_playwright
from PIL import Image
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1000,'height':640},device_scale_factor=2)
        pg.on('pageerror',lambda e: print('PAGEERR',e))
        await pg.goto('http://127.0.0.1:8800/dbtest.html',wait_until='load'); await pg.wait_for_timeout(1300)
        clip={'x':40,'y':130,'width':920,'height':430}
        await pg.screenshot(path='/tmp/s0.png',clip=clip)
        await pg.evaluate("document.getElementById('bStamp').click()"); await pg.wait_for_timeout(330)
        await pg.screenshot(path='/tmp/s1.png',clip=clip)
        await pg.wait_for_timeout(600)
        await pg.evaluate("document.getElementById('bCheer').click();document.getElementById('bTalk').click()"); await pg.wait_for_timeout(420)
        await pg.screenshot(path='/tmp/s2.png',clip=clip)
        await b.close()
asyncio.run(main())
ims=[Image.open('/tmp/s%d.png'%i) for i in (0,1,2)]
s=Image.new('RGB',(ims[0].width,ims[0].height*3))
for i,im in enumerate(ims): s.paste(im,(0,im.height*i))
s.resize((1100,1542),Image.LANCZOS).save('/tmp/s012.png')
