import asyncio, subprocess, time, socket
from playwright.async_api import async_playwright
from PIL import Image
s=socket.socket()
try: s.connect(('127.0.0.1',8800)); s.close()
except Exception:
    subprocess.Popen(['python3','/home/claude/tools/serve.py','/home/claude/oversummoned-game','8800'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True); time.sleep(1.5)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':390,'height':780},device_scale_factor=2,is_mobile=True,has_touch=True)
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.route(lambda u: not u.startswith('http://127.0.0.1'), lambda r: r.abort())
        await pg.goto('http://127.0.0.1:8800/play.html?dev=1',wait_until='load'); await pg.wait_for_timeout(2200)
        await pg.evaluate("localStorage.clear()"); await pg.reload(wait_until='load'); await pg.wait_for_timeout(2200)
        await pg.evaluate("(()=>{const o=__os,S=o.S();S.roster={kevin:1,lola:6,brokk:1};const h=OS.heroes.lola;S.equip.lola=[h.gear[0],null,null];S.gear.lola={weapon:'e_gaius_weapon',head:'e_lola_head',body:'e_lola_body'};S.bag.e_lola_feet=1;S.bag.e_kevin_head=2;S.xp.Fishing=5000;S.jobs=[{place:'dock',prog:0,order:'stay',since:0}];S.crew=['kevin','brokk',null];S.exped=[{hero:'lola',end:Date.now()+3e6,dur:14400}];o.render()})()")
        shots=[]
        async def snap(n): 
            await pg.wait_for_timeout(1200); await pg.screenshot(path=f'/tmp/m_{n}.png'); shots.append(n)
        await snap('home')
        for v in ('jobs','workshop','heroes','bag'):
            await pg.evaluate(f"__os.show('{v}')"); await snap(v)
        await pg.evaluate("__os.heroSheet('lola')"); await pg.wait_for_timeout(900); await snap('sheet')
        ov=await pg.evaluate("document.documentElement.scrollWidth>document.documentElement.clientWidth+1")
        print('sideways scroll:',ov, errs[:3])
        await b.close()
        ims=[Image.open(f'/tmp/m_{n}.png') for n in shots]; w,h=ims[0].size
        s=Image.new('RGB',(w*3,h*2))
        for i,im in enumerate(ims): s.paste(im,((i%3)*w,(i//3)*h))
        s.resize((s.width*5//8,s.height*5//8)).save('/tmp/mobile.png')
asyncio.run(main())
