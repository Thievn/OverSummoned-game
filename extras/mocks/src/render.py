import sys,os
from playwright.sync_api import sync_playwright
R='/workspace/oversummoned-mocks'; os.makedirs(f'{R}/png',exist_ok=True)
names=sys.argv[1:] or [f[:-5] for f in sorted(os.listdir(f'{R}/html')) if f.endswith('.html')]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for n in names:
        ph=n.startswith('phone_')
        pg=b.new_page(viewport={'width':390,'height':844} if ph else {'width':1440,'height':900},device_scale_factor=2)
        pg.goto(f'file://{R}/html/{n}.html'); pg.evaluate("document.body.classList.add('still')"); pg.wait_for_timeout(900)
        pg.screenshot(path=f'{R}/png/{n}.png'); pg.close(); print(n)
    b.close()
