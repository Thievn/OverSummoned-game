# -*- coding: utf-8 -*-
"""Builds a page for every hero and every place from data/rules.json.

Run it after ANY change to the rulebook (a new hero, new gear, a new place):

    python3 tools/build_pages.py

It rewrites heroes/, places/, their two index pages and sitemap.xml, so the
site, its schema and its sitemap can never drift from the rulebook.
Optional extra prose per hero lives in data/lore.json and is merged in.
"""
import json, io, os, re, html, datetime, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SITE = "https://oversummoned.com"
R = json.load(io.open('data/rules.json', encoding='utf-8'))
LORE = json.load(io.open('data/lore.json', encoding='utf-8')) if os.path.exists('data/lore.json') else {}
HEROES, PLACES, ITEMS = R['heroes'], R['places'], R['items']
RC = R['rarity_color']
BY_ID = {h['id']: h for h in HEROES}
PLACE_BY_ID = {p['id']: p for p in PLACES}
E = lambda s: html.escape(str(s), quote=True)
SLOT = {'weapon': 'Weapon', 'armor': 'Armour', 'trinket': 'Trinket'}
STATN = [('attack', 'Attack'), ('defense', 'Defence'), ('health', 'Health'),
         ('speed', 'Speed'), ('luck', 'Luck')]
MAXSTAT = max(max(h['stats'].get(k, 0) for k, _ in STATN) for h in HEROES) or 1

def head(title, desc, path, image, ld, extra_css=""):
    url = SITE + path
    return f"""<!doctype html>
<html lang="en">
<head>
<!-- seo:start -->
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="OverSummoned">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:image" content="{SITE}{image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@OverSummonedHQ">
<meta name="twitter:title" content="{E(title)}">
<meta name="twitter:description" content="{E(desc)}">
<meta name="twitter:image" content="{SITE}{image}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon_32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(',', ':'))}</script>
<!-- seo:end -->
<!-- analytics:start -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-R4C4V95HD5"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-R4C4V95HD5');</script>
<!-- analytics:end -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#080c1a">
<link rel="stylesheet" href="/css/os.css?v=1126v">
{extra_css}</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="/" aria-label="OverSummoned"><span class="o">O</span>ver<b>Summoned</b></a>
  <nav>
    <a class="hide-s" href="/heroes">The arrivals</a>
    <a class="hide-s" href="/places">Places</a>
    <a class="hide-s" href="/story">The story</a>
    <a class="hide-s" href="/desktop-pet">Desktop pet</a>
    <a class="hide-s" href="https://x.com/OverSummonedHQ" target="_blank" rel="noopener">Follow on X</a>
    <a class="hide-s" href="/play">Sign in</a>
    <a class="btn small" href="/#wishlist">Join the wishlist</a>
  </nav>
</div></header>
<main>
"""

FOOT = """</main>
<footer><div class="wrap">
  <span>OverSummoned. Made by one human and one very patient otter.</span>
  <span><a href="/heroes">Arrivals</a> · <a href="/places">Places</a> · <a href="/story">The story</a> · <a href="/desktop-pet">Desktop pet</a> · <a href="/roadmap">What's coming</a> · <a href="https://x.com/OverSummonedHQ" target="_blank" rel="noopener">@OverSummonedHQ on X</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></span>
</div></footer>
<script src="/js/track.js?v=1126v" defer></script>
<script src="/js/sound.js?v=1126v" defer></script>
</body>
</html>
"""

def crumbs(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + p}
        for i, (n, p) in enumerate(items)]}

def gear_card(it):
    st = " · ".join("%s +%s" % (k.capitalize(), v) for k, v in it.get('stats', {}).items())
    return f"""      <div class="gcard" style="--c:{RC.get(it['rarity'],'#9aa3b8')}">
        <img src="/assets/v2/loot/{E(it['icon'])}.webp" alt="{E(it['name'])}" loading="lazy" width="64" height="64">
        <div><b>{E(it['name'])}</b><i>{E(SLOT.get(it.get('slot'),it.get('slot','')))} · {E(it['rarity'])}</i>
        <p>{E(it.get('flavor',''))}</p><span class="gst">{E(st)}</span></div>
      </div>"""

def hero_page(h):
    hid, name = h['id'], h['name']
    place = PLACE_BY_ID.get(h.get('place'))
    lore = LORE.get(hid, {})
    rare = h['rarity']
    col = RC.get(rare, '#9aa3b8')
    img = "/assets/v2/heroes/%s.webp" % hid
    title = "%s · %s in OverSummoned" % (name, h['title'])
    desc = "%s — %s, %s. %s" % (name, h['title'], h['era'], h['bio'])
    desc = re.sub(r'\s+', ' ', desc)[:185]
    gear = [ITEMS[g] for g in h.get('gear', []) if g in ITEMS]
    # other arrivals who work the same place, for internal links
    kin = [x for x in HEROES if x.get('place') == h.get('place') and x['id'] != hid][:6]
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": "%s/heroes/%s#webpage" % (SITE, hid),
         "url": "%s/heroes/%s" % (SITE, hid), "name": title, "description": desc,
         "inLanguage": "en", "isPartOf": {"@id": SITE + "/#website"},
         "about": {"@id": "%s/heroes/%s#char" % (SITE, hid)}},
        crumbs([("Home", "/"), ("The arrivals", "/heroes"), (name, "/heroes/" + hid)]),
        {"@type": "Person", "@id": "%s/heroes/%s#char" % (SITE, hid), "name": name,
         "alternateName": h['title'], "description": h['bio'],
         "image": SITE + img, "url": "%s/heroes/%s" % (SITE, hid),
         "additionalProperty": [
             {"@type": "PropertyValue", "name": "Era", "value": h['era']},
             {"@type": "PropertyValue", "name": "Species", "value": h['species']},
             {"@type": "PropertyValue", "name": "Rarity", "value": rare}]}]}
    bars = "".join(
        f'<li><span>{lab}</span><div class="bar"><i style="width:{round(h["stats"].get(k,0)/MAXSTAT*100)}%;background:{col}"></i></div><b>{h["stats"].get(k,0)}</b></li>'
        for k, lab in STATN)
    says = [l for l in h.get('lines', [])[:2] if l]
    saying = "".join('<blockquote class="say">%s</blockquote>' % E(s) for s in says)
    lore_html = ""
    if lore.get('history'):
        lore_html = ('<section class="hsec"><h2>The history behind %s</h2>%s</section>'
                     % (E(name), "".join("<p>%s</p>" % E(p) for p in lore['history'])))
    kin_html = ""
    if kin:
        kin_html = ('<section class="hsec"><h2>Others whose things wash up at %s</h2><div class="kinrow">%s</div></section>'
                    % (E(place['name'] if place else 'the same place'),
                       "".join('<a class="kin" href="/heroes/%s"><img src="/assets/v2/heroes/thumb/%s.webp" alt="%s" loading="lazy" width="96" height="96"><span>%s</span></a>'
                               % (k['id'], k['id'], E(k['name']), E(k['name'])) for k in kin)))
    placep = ""
    if place:
        placep = ('<p class="wherep">Their lost things wash up at <a href="/places/%s"><b>%s</b></a>. %s</p>'
                  % (place['id'], E(place['name']), E(place['blurb'])))
    body = f"""<article class="hero-pg" style="--c:{col}">
<div class="wrap">
  <nav class="crumb"><a href="/">Home</a> › <a href="/heroes">The arrivals</a> › <span>{E(name)}</span></nav>
  <div class="htop">
    <div class="hart"><img src="{img}" alt="{E(name)}, {E(h['species'])}, {E(h['title'])}" width="420" height="420"></div>
    <div class="hmeta">
      <span class="rare" style="background:{col}">{E(rare)}</span>
      <h1>{E(name)}</h1>
      <p class="htitle">{E(h['title'])}</p>
      <ul class="facts">
        <li><span>Era</span><b>{E(h['era'])}</b></li>
        <li><span>Species</span><b>{E(h['species'])}</b></li>
        <li><span>Lost things at</span><b>{E(place['name']) if place else '—'}</b></li>
        <li><span>Found by</span><b>{E(place['skill']) if place else '—'}</b></li>
      </ul>
      <p class="bio">{E(h['bio'])}</p>
      {saying}
      <a class="btn" href="/#wishlist">Join the wishlist</a>
    </div>
  </div>

  <section class="hsec"><h2>True, and nothing to do with {E(name)}</h2>
    <p class="factbox">{E(h.get('fact',''))}</p></section>

  {lore_html}

  <section class="hsec"><h2>The numbers</h2>
    <ul class="statlist">{bars}</ul>
    <p class="mut small">Every stat counts in a fight and on a job. Speed sets the pace, Luck picks the haul.</p>
  </section>

  <section class="hsec"><h2>The three things {E(name)} lost on the way</h2>
    <p class="mut">Gear works for anyone, and half again as well in the paws it was made for.</p>
    <div class="gearwall">{"".join(gear_card(g) for g in gear)}</div>
  </section>

  {placep}
  {kin_html}

  <section class="hsec cta-end">
    <h2>Meet {E(name)} in the ledger</h2>
    <p class="mut">OverSummoned is in closed beta. Join the wishlist and Smudge will write when a seat opens.</p>
    <a class="btn" href="/#wishlist">Join the wishlist</a>
  </section>
</div>
</article>
"""
    return head(title, desc, "/heroes/" + hid, img, ld) + body + FOOT

def place_page(p):
    pid = p['id']
    img = "/assets/v2/scenes/%s.webp" % pid
    here = [h for h in HEROES if h.get('place') == pid]
    title = "%s · where Smudge works in OverSummoned" % p['name']
    desc = re.sub(r'\s+', ' ', "%s — %s. %s" % (p['name'], p['era'], p['blurb']))[:185]
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": "%s/places/%s#webpage" % (SITE, pid),
         "url": "%s/places/%s" % (SITE, pid), "name": title, "description": desc,
         "inLanguage": "en", "isPartOf": {"@id": SITE + "/#website"}},
        crumbs([("Home", "/"), ("Places", "/places"), (p['name'], "/places/" + pid)])]}
    folk = "".join('<a class="kin" href="/heroes/%s"><img src="/assets/v2/heroes/thumb/%s.webp" alt="%s" loading="lazy" width="96" height="96"><span>%s</span></a>'
                   % (h['id'], h['id'], E(h['name']), E(h['name'])) for h in here)
    body = f"""<article class="place-pg">
<div class="wrap">
  <nav class="crumb"><a href="/">Home</a> › <a href="/places">Places</a> › <span>{E(p['name'])}</span></nav>
  <h1>{E(p['name'])}</h1>
  <p class="htitle">{E(p['era'])} · {E(p['skill'])}</p>
  <img class="pscene" src="{img}" alt="{E(p['name'])} in OverSummoned" width="910" height="459">
  <p class="bio">{E(p['blurb'])}</p>
  <section class="hsec"><h2>Whose lost things wash up here</h2>
    {'<div class="kinrow">' + folk + '</div>' if folk else '<p class="mut">Nothing with a name on it has washed up here yet.</p>'}
  </section>
  <section class="hsec cta-end"><h2>Go looking yourself</h2>
    <p class="mut">OverSummoned is in closed beta.</p><a class="btn" href="/#wishlist">Join the wishlist</a></section>
</div>
</article>
"""
    return head(title, desc, "/places/" + pid, img, ld) + body + FOOT

def hub(kind):
    if kind == 'heroes':
        title = "Every arrival in OverSummoned"
        desc = "Every stranger the cursed ledger has pulled out of history so far. Collectible arrivals, each with their own era, stats and three lost items."
        items = sorted(HEROES, key=lambda h: h['name'])
        cards = "".join(
            '<a class="hcard" href="/heroes/%s" style="--c:%s"><img src="/assets/v2/heroes/thumb/%s.webp" alt="%s" loading="lazy" width="200" height="200"><b>%s</b><i>%s</i><span>%s</span></a>'
            % (h['id'], RC.get(h['rarity'], '#9aa3b8'), h['id'], E(h['name']), E(h['name']), E(h['title']), E(h['era']))
            for h in items)
        path, image = "/heroes", "/assets/og-share.jpg"
        lead = "The ledger keeps misfiring. These are the people it has coughed up so far."
    else:
        title = "Every place Smudge works in OverSummoned"
        desc = "Nine corners of history where Smudge fishes, digs and picks locks — from a Roman dock to an office supply closet."
        items = PLACES
        cards = "".join(
            '<a class="pcard" href="/places/%s"><img src="/assets/v2/scenes/%s.webp" alt="%s" loading="lazy" width="320" height="161"><b>%s</b><i>%s · %s</i><span>%s</span></a>'
            % (p['id'], p['id'], E(p['name']), E(p['name']), E(p['era']), E(p['skill']), E(p['blurb']))
            for p in items)
        path, image = "/places", "/assets/v2/scenes/archive.webp"
        lead = "Eight corners of history, and one cellar he calls home."
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "url": SITE + path, "name": title, "description": desc,
         "inLanguage": "en", "isPartOf": {"@id": SITE + "/#website"}},
        crumbs([("Home", "/"), (title.split(' in ')[0], path)])]}
    body = f"""<div class="wrap hubwrap">
  <nav class="crumb"><a href="/">Home</a> › <span>{E(title.split(' in ')[0])}</span></nav>
  <h1>{E(title.split(' in ')[0])}</h1>
  <p class="lede">{E(lead)}</p>
  <div class="{'herogrid' if kind=='heroes' else 'placegrid'}">{cards}</div>
</div>
"""
    return head(title, desc, path, image, ld) + body + FOOT

def write(path, text):
    d = os.path.dirname(path)
    if d and not os.path.isdir(d):
        os.makedirs(d)
    io.open(path, 'w', encoding='utf-8').write(text)

def thumbs():
    """Card art comes with uneven empty space around it. Trim each to its drawing
    and stand it on the same square so the grid is uniform."""
    try:
        from PIL import Image
    except ImportError:
        print("WARNING Pillow missing: thumbnails not rebuilt"); return
    os.makedirs('assets/v2/heroes/thumb', exist_ok=True)
    for h in HEROES:
        src = 'assets/v2/heroes/%s.webp' % h['id']; dst = 'assets/v2/heroes/thumb/%s.webp' % h['id']
        if not os.path.exists(src): continue
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src): continue
        im = Image.open(src).convert('RGBA'); box = im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
        if box: im = im.crop(box)
        S, pad = 400, 14; k = min((S - 2 * pad) / im.width, (S - 2 * pad) / im.height)
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        cv = Image.new('RGBA', (S, S), (0, 0, 0, 0)); cv.alpha_composite(im, ((S - im.width) // 2, S - pad - im.height))
        cv.save(dst, 'WEBP', quality=88, method=6)
thumbs()

n = 0
for h in HEROES:
    write('heroes/%s.html' % h['id'], hero_page(h)); n += 1
for p in PLACES:
    write('places/%s.html' % p['id'], place_page(p)); n += 1
write('heroes/index.html', hub('heroes'))
write('places/index.html', hub('places'))
n += 2

# ---- sitemap, rebuilt from the same source so it can never fall behind
D = datetime.date.today().isoformat()
scenes = [p['id'] for p in PLACES]
def url(loc, cf, pr, imgs=()):
    s = '  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>%s</changefreq>\n    <priority>%s</priority>\n' % (loc, D, cf, pr)
    for u, t in imgs:
        s += '    <image:image>\n      <image:loc>%s</image:loc>\n      <image:title>%s</image:title>\n    </image:image>\n' % (u, html.escape(t))
    return s + '  </url>\n'
x = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
x += url(SITE + "/", "weekly", "1.0",
         [(SITE + "/assets/og-share.jpg", "OverSummoned")] +
         [(SITE + "/assets/v2/scenes/%s.webp" % s, "OverSummoned place: " + PLACE_BY_ID[s]['name']) for s in scenes])
x += url(SITE + "/heroes", "weekly", "0.9")
x += url(SITE + "/places", "monthly", "0.8")
for h in sorted(HEROES, key=lambda h: h['id']):
    x += url("%s/heroes/%s" % (SITE, h['id']), "monthly", "0.7",
             [(SITE + "/assets/v2/heroes/%s.webp" % h['id'], "%s, %s" % (h['name'], h['title']))])
for p in PLACES:
    x += url("%s/places/%s" % (SITE, p['id']), "monthly", "0.6",
             [(SITE + "/assets/v2/scenes/%s.webp" % p['id'], p['name'])])
for extra, cf, pr in [("/roadmap", "weekly", "0.7"), ("/story", "monthly", "0.6"),
                      ("/desktop-pet", "monthly", "0.8"),
                      ("/privacy", "yearly", "0.3"), ("/terms", "yearly", "0.3")]:
    if os.path.exists(extra.strip('/') + '.html'):
        x += url(SITE + extra, cf, pr)
x += '</urlset>\n'
write('sitemap.xml', x)

missing = [h['id'] for h in HEROES if not os.path.exists('assets/v2/heroes/%s.webp' % h['id'])]
print("built %d pages + hubs, sitemap has %d urls" % (n, x.count('<url>')))
if missing:
    print("WARNING missing art for:", ", ".join(missing))
