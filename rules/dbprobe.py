import sys, asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1000,'height':640})
        pg.on('console',lambda m: print(m.type, m.text[:160].replace(chr(10),' | ')) if m.type in('error','warning') and 'GL Driver' not in m.text else None)
        pg.on('pageerror',lambda e: print('PAGEERR',e))
        await pg.goto('http://127.0.0.1:8800/dbtest.html',wait_until='load'); await pg.wait_for_timeout(1200)
        for i,(js,wait) in enumerate(json.loads(sys.argv[1])):
            r=await pg.evaluate(js); print(i,r); await pg.wait_for_timeout(wait)
            await pg.screenshot(path=f'/tmp/probe{i}.png',clip={'x':500,'y':130,'width':460,'height':430})
        await b.close()
asyncio.run(main())
