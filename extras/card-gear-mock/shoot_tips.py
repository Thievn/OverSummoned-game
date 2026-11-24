import asyncio
from playwright.async_api import async_playwright
U='http://localhost:8765/index.html'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for tag,(w,h,mob) in {'phone':(390,844,True),'desktop':(1440,900,False)}.items():
      ctx=await b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,has_touch=mob,is_mobile=mob)
      pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
      await pg.goto(U);await pg.wait_for_load_state('networkidle');await pg.wait_for_timeout(500)
      async def shot(name,anchor):
        await pg.wait_for_timeout(450)
        if mob: await pg.screenshot(path=f'shots/{name}.png')
        else:
          bb=await (await pg.query_selector(anchor)).bounding_box(); tb=await (await pg.query_selector('.mt-wrap')).bounding_box()
          x0=min(bb['x'],tb['x'])-24;y0=min(bb['y'],tb['y'])-24;x1=max(bb['x']+bb['width'],tb['x']+tb['width'])+24;y1=max(bb['y']+bb['height'],tb['y']+tb['height'])+24
          await pg.screenshot(path=f'shots/{name}.png',clip={'x':max(0,x0),'y':max(0,y0),'width':x1-max(0,x0),'height':y1-max(0,y0)})
      await pg.screenshot(path=f'shots/{tag}-20-front-new-stats.png',clip=None) if False else None
      el=await pg.query_selector('#will');await el.scroll_into_view_if_needed()
      bb=await el.bounding_box();await pg.screenshot(path=f'shots/{tag}-20-front-new-stats.png',clip={'x':bb['x']-30,'y':bb['y']-30,'width':bb['width']+60,'height':bb['height']+70})
      await pg.evaluate("mock.flip('will')");await pg.wait_for_timeout(900);await pg.evaluate("mock.view('will','gear')");await pg.wait_for_timeout(1300)
      bb=await el.bounding_box();await pg.screenshot(path=f'shots/{tag}-21-gear-new-stats.png',clip={'x':bb['x']-30,'y':bb['y']-30,'width':bb['width']+60,'height':bb['height']+70})
      await pg.evaluate("mock.tip('will','.gs[data-id=duelling_rapier]')");await shot(f'{tag}-22-tip-legendary-weapon','#will')
      await pg.evaluate("mock.hide()")
      await pg.evaluate("mock.tip('will','.gs[data-id=potion_pink]')");await shot(f'{tag}-24-tip-potion','#will')
      await pg.evaluate("mock.hide()")
      await pg.evaluate("mock.tip('will','.gs[data-id=item_golden_statuette]')");await shot(f'{tag}-26-tip-set-complete','#will')
      await pg.evaluate("mock.hide()")
      # common armor on Maya (reel), set partial on Gaius (reel)
      await pg.evaluate("mock.view('r-paramedic','gear')");await pg.wait_for_timeout(1200)
      r=await pg.query_selector('#r-paramedic');await r.scroll_into_view_if_needed()
      await pg.evaluate("mock.tip('r-paramedic','.gs[data-id=hi_vis_vest]')");await shot(f'{tag}-23-tip-common-armor','#r-paramedic')
      await pg.evaluate("mock.hide()")
      await pg.evaluate("mock.view('r-legionary','gear')");await pg.wait_for_timeout(1200)
      r=await pg.query_selector('#r-legionary');await r.scroll_into_view_if_needed()
      await pg.evaluate("mock.tip('r-legionary','.gs[data-id=rusty_gladius]')");await shot(f'{tag}-25-tip-set-partial','#r-legionary')
      await pg.evaluate("mock.hide()")
      d=await pg.query_selector('.drops');await d.scroll_into_view_if_needed()
      await pg.evaluate("mock.drop('.gs[data-id=brass_goggles]')");await shot(f'{tag}-27-compare-upgrade','.drops')
      await pg.evaluate("mock.hide()")
      await pg.evaluate("mock.drop('.gs[data-id=flint_spear]')");await shot(f'{tag}-28-compare-downgrade','.drops')
      if mob:
        await pg.evaluate("document.querySelector('.mt-wrap').scrollTop=9999");await pg.wait_for_timeout(200);await pg.screenshot(path=f'shots/{tag}-28b-compare-downgrade-scrolled.png')
      await pg.evaluate("mock.hide()")
      print(tag,errs);await ctx.close()
    await b.close()
asyncio.run(main())
