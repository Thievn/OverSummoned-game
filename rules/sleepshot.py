import asyncio, subprocess, time, socket
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
        pg=await b.new_page(viewport={'width':1080,'height':900},device_scale_factor=2)
        pg.on('pageerror',lambda e: print('PAGEERR',e))
        await pg.goto('http://127.0.0.1:8800/dbtest.html',wait_until='load'); await pg.wait_for_timeout(1500)
        box=await pg.evaluate("(()=>{const r=document.getElementById('d_sleep').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()")
        print(box)
        for i in range(4):
            await pg.screenshot(path=f'/tmp/z{i}.png',clip=box); await pg.wait_for_timeout(620)
        await pg.evaluate("DBP.forEach(p=>p.bones=true)"); await pg.wait_for_timeout(100); await pg.screenshot(path='/tmp/z4.png',clip=box)
        await b.close()
asyncio.run(main())
ims=[Image.open(f'/tmp/z{i}.png') for i in range(5)]
s=Image.new('RGB',(sum(i.width for i in ims),ims[0].height)); x=0
for im in ims: s.paste(im,(x,0)); x+=im.width
s.save('/tmp/z_all.png'); print(s.size)
