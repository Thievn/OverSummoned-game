import asyncio, subprocess, time, socket, sys
from playwright.async_api import async_playwright
from PIL import Image
def up():
    s=socket.socket()
    try: s.connect(('127.0.0.1',8800)); s.close(); return True
    except Exception: return False
if not up():
    subprocess.Popen(['python3','/home/claude/tools/serve.py','/home/claude/oversummoned-game','8800'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True); time.sleep(1.5)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1080,'height':700},device_scale_factor=1.5)
        pg.on('pageerror',lambda e: print('PAGEERR',e))
        pg.on('console',lambda m: print('ERR',m.text[:200]) if m.type=='error' and 'accounts.google' not in m.text and 'ERR_' not in m.text else None)
        await pg.goto('http://127.0.0.1:8800/dbtest.html',wait_until='load'); await pg.wait_for_timeout(1500)
        clip={'x':20,'y':110,'width':1040,'height':350}
        await pg.screenshot(path='/tmp/d0.png',clip=clip)
        for i,ms in enumerate((230,380,560)):
            await pg.evaluate("document.getElementById('bAct').click()"); await pg.wait_for_timeout(ms)
            await pg.screenshot(path=f'/tmp/d{i+1}.png',clip=clip); await pg.wait_for_timeout(900)
        await b.close()
asyncio.run(main())
ims=[Image.open(f'/tmp/d{i}.png') for i in range(4)]
s=Image.new('RGB',(ims[0].width,sum(i.height for i in ims))); y=0
for im in ims: s.paste(im,(0,y)); y+=im.height
s.resize((1300,int(s.height*1300/s.width)),Image.LANCZOS).save('/tmp/d_all.png')
