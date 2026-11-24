import asyncio,sys
from playwright.async_api import async_playwright
U='http://localhost:8765/index.html'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    async def page(w,h,dsf=2):
      pg=await b.new_page(viewport={'width':w,'height':h},device_scale_factor=dsf)
      errs=[];pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append(str(e)))
      await pg.goto(U);await pg.wait_for_load_state('networkidle');await pg.wait_for_timeout(600);pg._errs=errs;return pg
    async def snap(pg,sel,name,pad=44):
      el=await pg.query_selector(sel);await el.scroll_into_view_if_needed();await pg.wait_for_timeout(50)
      bb=await el.bounding_box()
      await pg.screenshot(path=f'shots/{name}.png',clip={'x':max(0,bb['x']-pad),'y':max(0,bb['y']-pad),'width':bb['width']+2*pad,'height':bb['height']+2*pad+10})
    for tag,(w,h) in {'phone':(390,844),'desktop':(1440,900)}.items():
      pg=await page(w,h)
      await pg.screenshot(path=f'shots/{tag}-page-top.png')
      await snap(pg,'#will',f'{tag}-01-front')
      await pg.evaluate("mock.flip('will')");await pg.wait_for_timeout(900)
      await snap(pg,'#will',f'{tag}-02-back-bio')
      await pg.evaluate("mock.view('will','gear')");await pg.wait_for_timeout(1300)
      await snap(pg,'#will',f'{tag}-03-gear-filled')
      await pg.evaluate("mock.tip('will','.gs[data-id=item_golden_statuette]')");await pg.wait_for_timeout(300)
      await snap(pg,'#will',f'{tag}-04-gear-tooltip')
      await pg.evaluate("mock.tip('will','.gs[data-slot=legs]')");await pg.wait_for_timeout(300)
      await snap(pg,'#will',f'{tag}-05-empty-slot-tooltip')
      await pg.mouse.click(2,2);await pg.evaluate("mock.view('will','set')");await pg.wait_for_timeout(1000)
      await snap(pg,'#will',f'{tag}-06-set-full-bonus')
      await pg.evaluate("mock.flip('kevin')");await pg.wait_for_timeout(900)
      await pg.evaluate("mock.view('kevin','gear')");await pg.wait_for_timeout(1300)
      await snap(pg,'#kevin',f'{tag}-07-gear-empty-new-account')
      await pg.evaluate("mock.view('kevin','set')");await pg.wait_for_timeout(1000)
      await snap(pg,'#kevin',f'{tag}-08-set-none-found')
      await pg.evaluate("mock.view('r-legionary','set')");await pg.wait_for_timeout(1000)
      await snap(pg,'#r-legionary',f'{tag}-09-set-1-of-3')
      await pg.evaluate("mock.view('r-legionary','gear')");await pg.wait_for_timeout(1300)
      await snap(pg,'#reel',f'{tag}-10-homepage-row',pad=4)
      print(tag,'errors:',pg._errs)
      await pg.close()
    # transition frames (phone)
    pg=await page(390,844)
    await pg.evaluate("mock.flip('will')");await pg.wait_for_timeout(900)
    for n,t in enumerate([0,120,240,360,520,800]):
      await pg.evaluate("mock.view('will','bio')");await pg.wait_for_timeout(900)
      await pg.evaluate("mock.view('will','gear')");await pg.evaluate(f"mock.freeze({t})");await pg.wait_for_timeout(60)
      await snap(pg,'#will',f'seq-gear-{n}-{t}ms')
    await pg.close()
    for tag,(w,h) in {'phone':(390,844),'desktop':(1440,900)}.items():
      pg=await page(w,h)
      for n,t in enumerate([0,190,330,450,600,780]):
        await pg.reload();await pg.wait_for_load_state('networkidle');await pg.wait_for_timeout(400)
        await pg.evaluate("mock.flip('will')");await pg.evaluate(f"mock.freeze({t})");await pg.wait_for_timeout(60)
        await snap(pg,'#will',f'seq-flip-{tag}-{n}-{t}ms',pad=40)
      if tag=='desktop':
        await pg.reload();await pg.wait_for_load_state('networkidle');await pg.wait_for_timeout(400)
        el=await pg.query_selector('#will');bb=await el.bounding_box()
        await pg.mouse.move(bb['x']+bb['width']*.85,bb['y']+bb['height']*.2,steps=5);await pg.wait_for_timeout(300)
        await snap(pg,'#will','desktop-11-hover-tilt',pad=40)
      await pg.close()
    await b.close()
asyncio.run(main())
