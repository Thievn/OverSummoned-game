import asyncio, subprocess, time, socket, json, sys
from playwright.async_api import async_playwright
def up():
    s=socket.socket()
    try: s.connect(('127.0.0.1',8800)); s.close(); return True
    except Exception: return False
if not up():
    subprocess.Popen(['python3','/home/claude/tools/serve.py','/home/claude/oversummoned-game','8800'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True); time.sleep(1.5)
STEPS=json.loads(sys.argv[1]) if len(sys.argv)>1 else []
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1200,'height':900})
        errs=[]
        pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
        await pg.route(lambda u: not u.startswith('http://127.0.0.1'), lambda r: r.abort())
        await pg.goto('http://127.0.0.1:8800/play.html?dev=1',wait_until='load'); await pg.wait_for_timeout(2200)
        await pg.evaluate("localStorage.clear()"); await pg.reload(wait_until='load'); await pg.wait_for_timeout(2200)
        for i,st in enumerate(STEPS):
            if st[0]=='js': print(i, json.dumps(await pg.evaluate(st[1]))[:600])
            elif st[0]=='shot': await pg.screenshot(path=st[1],full_page=len(st)>2)
            elif st[0]=='click': await pg.get_by_text(st[1],exact=True).last.click(); 
            await pg.wait_for_timeout(st[-1] if isinstance(st[-1],int) else 500)
        for e in errs[:10]: print(e)
        await b.close()
asyncio.run(main())
