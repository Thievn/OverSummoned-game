#!/usr/bin/env python3
"""Idempotent SEO pass for OverSummoned. Run from the repo root."""
import json, re, sys, html

SITE = "https://oversummoned.com"
OG = SITE + "/assets/og-share.jpg"
DESC_GAME = ("OverSummoned is a free pixel idle RPG you play in your browser. Summon heroes from "
             "every era, find loot and gear, and let your crew mine, cook and fight while you are away.")

FAQ = [
 ("What is OverSummoned?",
  "OverSummoned is a pixel idle RPG you play in your browser. You summon heroes from different eras of history, put them to work in the river city of Aldermere, and send them on delves for loot."),
 ("Is OverSummoned an idle game?",
  "Yes. Your heroes keep mining, fishing, cooking and fighting while you are away. When you come back, everything they did still counts."),
 ("Do I need to download anything?",
  "No. OverSummoned runs in your web browser on a computer or a phone. There is nothing to install."),
 ("Is OverSummoned free?",
  "Yes. OverSummoned is a free online RPG you can play right in your browser."),
 ("Who are the heroes?",
  "They are parody heroes pulled out of their own time. There is a Roman legionary, a plague doctor from 1348, an Ice Age hunter, a Chicago gangster from 1927, a Victorian engineer, a Hollywood leading man, and a few folks from the modern day. Nine are in the city right now, with more on the way."),
 ("How do loot and gear work?",
  "Heroes bring back gear from their delves, like weapons, trinkets, rings and potions for their belt. Every item has stats such as Attack, Defense, Health and Speed, and those numbers count in every fight."),
 ("What skills can my heroes learn?",
  "There are seven: mining, woodcutting, fishing, cooking, smithing, alchemy and summoning. Each hero is better at some of them, so who you send where matters."),
 ("Can I play with friends?",
  "Yes. Join a crew to get a shared chat, a shared vault and a goal for the week. At night your squad can sign up for the big fight together."),
]

PAGES = {
 "index.html": dict(
   path="/", title="OverSummoned · Free Pixel Idle RPG in Your Browser",
   desc="Summon heroes from every era, gear them up with loot, and let them mine, cook and fight while you are away. A free pixel idle RPG in your browser.",
   og_title="OverSummoned · A pixel idle RPG you play in your browser",
   og_desc="Summon heroes from every era, collect loot and gear, and let your crew keep working while you are away.",
   crumbs=[("Home", "/")], theme="#07040d"),
 "story.html": dict(
   path="/story", title="The Story of Aldermere · OverSummoned",
   desc="Read how the river city of Aldermere ended up with more borrowed heroes than people. The story behind OverSummoned, a pixel idle RPG.",
   og_title="The Ledger of Aldermere · OverSummoned",
   og_desc="Some time ago, an archivist read one name from a book he shouldn't have opened. Aldermere hasn't been the same since.",
   crumbs=[("Home", "/"), ("The Story", "/story")], theme="#100c08"),
 "privacy.html": dict(
   path="/privacy", title="Privacy Policy · OverSummoned",
   desc="How OverSummoned collects, uses and protects your information when you visit the site or play the game.",
   og_title="Privacy Policy · OverSummoned",
   og_desc="How OverSummoned collects, uses and protects your information.",
   crumbs=[("Home", "/"), ("Privacy Policy", "/privacy")], theme=None),
 "terms.html": dict(
   path="/terms", title="Terms of Service · OverSummoned",
   desc="The rules for using OverSummoned, including your account, fair play, and what you can expect from us.",
   og_title="Terms of Service · OverSummoned",
   og_desc="The rules for using OverSummoned and playing fair.",
   crumbs=[("Home", "/"), ("Terms of Service", "/terms")], theme=None),
 "updates.html": dict(
   path="/updates", title="Update Log · OverSummoned",
   desc="Everything new in OverSummoned, newest first: new loot, new gear sets, new places and the fixes that make the game play better.",
   og_title="Update Log · OverSummoned",
   og_desc="Everything new in the river city of Aldermere, newest first.",
   crumbs=[("Home", "/"), ("Update Log", "/updates")], theme=None),
}

def url(p): return SITE + ("/" if p == "/" else p)

def jsonld(name, cfg):
    org = {"@type": "Organization", "@id": SITE + "/#org", "name": "OverSummoned",
           "url": SITE + "/", "logo": {"@type": "ImageObject", "url": SITE + "/icon-512.png", "width": 512, "height": 512}}
    site = {"@type": "WebSite", "@id": SITE + "/#website", "name": "OverSummoned", "url": SITE + "/",
            "inLanguage": "en", "description": DESC_GAME, "publisher": {"@id": SITE + "/#org"}}
    crumbs = {"@type": "BreadcrumbList", "@id": url(cfg["path"]) + "#breadcrumb",
              "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": url(p)}
                                  for i, (n, p) in enumerate(cfg["crumbs"])]}
    page = {"@type": "WebPage", "@id": url(cfg["path"]) + "#webpage", "url": url(cfg["path"]),
            "name": cfg["title"], "description": cfg["desc"], "inLanguage": "en",
            "isPartOf": {"@id": SITE + "/#website"}, "breadcrumb": {"@id": url(cfg["path"]) + "#breadcrumb"},
            "primaryImageOfPage": {"@type": "ImageObject", "url": OG, "width": 1200, "height": 630}}
    graph = [org, site, page, crumbs]
    if name in ("index.html", "story.html"):
        game = {"@type": "VideoGame", "@id": SITE + "/#game", "name": "OverSummoned", "url": SITE + "/",
                "description": DESC_GAME, "image": OG,
                "genre": ["Idle RPG", "Role-playing game", "Pixel art", "Hero collector"],
                "gamePlatform": ["Web browser", "PC", "Mobile"], "applicationCategory": "Game",
                "operatingSystem": "Any", "playMode": ["SinglePlayer", "MultiPlayer"],
                "isAccessibleForFree": True, "inLanguage": "en",
                "keywords": "pixel RPG, idle RPG, browser RPG, free online RPG, hero collector, summoning game, loot, gear",
                "gameLocation": {"@type": "Place", "name": "Aldermere"},
                "publisher": {"@id": SITE + "/#org"}, "author": {"@id": SITE + "/#org"}}
        if name == "index.html":
            game["screenshot"] = [SITE + "/assets/preview/%s.webp" % s for s in ("city", "mining", "delve", "cards", "market", "crew")]
            page["about"] = {"@id": SITE + "/#game"}
        else:
            page["about"] = {"@id": SITE + "/#game"}
        graph.append(game)
    if name == "index.html":
        graph.append({"@type": "FAQPage", "@id": SITE + "/#faq", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]})
    data = {"@context": "https://schema.org", "@graph": graph}
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + '</script>'

def head_block(name, cfg):
    e = lambda s: s.replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;")
    u = url(cfg["path"])
    lines = [
      f'<title>{e(cfg["title"])}</title>',
      f'<meta name="description" content="{e(cfg["desc"])}">',
      '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
      f'<link rel="canonical" href="{u}">',
      '<meta property="og:type" content="website">',
      '<meta property="og:site_name" content="OverSummoned">',
      '<meta property="og:locale" content="en_US">',
      f'<meta property="og:url" content="{u}">',
      f'<meta property="og:title" content="{e(cfg["og_title"])}">',
      f'<meta property="og:description" content="{e(cfg["og_desc"])}">',
      f'<meta property="og:image" content="{OG}">',
      '<meta property="og:image:type" content="image/jpeg">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      '<meta property="og:image:alt" content="OverSummoned logo over a pixel city at night, with nine hero portraits">',
      '<meta name="twitter:card" content="summary_large_image">',
      f'<meta name="twitter:title" content="{e(cfg["og_title"])}">',
      f'<meta name="twitter:description" content="{e(cfg["og_desc"])}">',
      f'<meta name="twitter:image" content="{OG}">',
      '<meta name="twitter:image:alt" content="OverSummoned logo over a pixel city at night, with nine hero portraits">',
      '<meta name="application-name" content="OverSummoned">',
      '<meta name="apple-mobile-web-app-title" content="OverSummoned">',
      '<link rel="icon" href="/favicon.ico" sizes="any">',
      '<link rel="icon" type="image/png" sizes="32x32" href="/favicon_32.png">',
      '<link rel="icon" type="image/png" sizes="16x16" href="/favicon_16.png">',
      '<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">',
      '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
      '<link rel="manifest" href="/site.webmanifest">',
      jsonld(name, cfg),
    ]
    return "<!-- seo:start -->\n" + "\n".join(lines) + "\n<!-- seo:end -->"

def apply_head(name, s, cfg):
    if "<!-- seo:start -->" in s:
        s = re.sub(r"<!-- seo:start -->.*?<!-- seo:end -->", lambda m: head_block(name, cfg), s, flags=re.S)
    else:
        # Replace from <title> through the last icon link (old block).
        m = re.search(r"<title>.*?</title>.*?<link rel=\"apple-touch-icon\"[^>]*>", s, flags=re.S)
        if not m: sys.exit("no head block in " + name)
        # Only remove meta/link lines that we now own; keep anything else in that span.
        span = m.group(0)
        keep = [ln for ln in span.split("\n") if ln.strip() and not re.match(
            r"\s*<(title>|meta (name|property)=\"(description|og:|twitter:|robots)|link rel=\"(canonical|icon|apple-touch-icon|manifest)\")", ln)]
        s = s[:m.start()] + head_block(name, cfg) + ("\n" + "\n".join(keep) if keep else "") + s[m.end():]
    # perf hints for fonts loaded by CSS @import
    if 'rel="preconnect" href="https://fonts.googleapis.com"' not in s:
        s = s.replace("<!-- seo:end -->", '<!-- seo:end -->\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>', 1)
    if 'rel="preload" href="/assets/logo.svg"' not in s:
        s = s.replace("<!-- seo:end -->", '<!-- seo:end -->\n<link rel="preload" href="/assets/logo.svg" as="image" type="image/svg+xml">', 1)
    FONTS = "https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
    if 'rel="preload" as="style" href="https://fonts.googleapis.com' not in s:
        s = s.replace("<!-- seo:end -->", '<!-- seo:end -->\n<link rel="preload" as="style" href="%s">' % FONTS, 1)
    if name == "index.html" and 'href="/assets/gen/city_bg.png"' not in s:
        s = s.replace("<!-- seo:end -->", '<!-- seo:end -->\n<link rel="preload" href="/assets/gen/city_bg.png" as="image" fetchpriority="high">', 1)
    return s

def img_attrs(s):
    def fix(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag)
        src = src.group(1) if src else ""
        add = []
        if "decoding=" not in tag: add.append('decoding="async"')
        if "logo.svg" in src:
            if "width=" not in tag: add.append('width="2439" height="360"')
        elif "/card_backs/" in src:
            if "loading=" not in tag: add.append('loading="lazy"')
            if "width=" not in tag: add.append('width="384" height="480"')
        elif "/assets/portrait/" in src:
            if "loading=" not in tag: add.append('loading="lazy"')
            if "width=" not in tag: add.append('width="96" height="128"')
        elif "/assets/preview/" in src:
            if "loading=" not in tag and "city." not in src: add.append('loading="lazy"')
            if "width=" not in tag: add.append('width="1440" height="900"')
        if not add: return tag
        return tag[:-1].rstrip() + " " + " ".join(add) + ">"
    return re.sub(r"<img\b[^>]*>", fix, s)

CARDBACK_ALT = {
 "will_slapton": "Will Slapton's animated card back, Hollywood 2022",
 "legionary": "Gaius Marcellus the Roman legionary's animated card back",
 "gangster": "Vincenzo Moretti the Chicago gangster's animated card back",
 "engineer": "Edith Crane the Victorian engineer's animated card back",
 "plague_doctor": "Doctor Albrecht the plague doctor's animated card back",
 "paramedic": "Maya Washington the paramedic's animated card back",
 "hunter": "Brokk the Ice Age hunter's animated card back",
 "office_worker": "Kevin Latham the office worker's animated card back",
 "delivery_rider": "Marco Reyes the delivery rider's animated card back",
}
def alt_text(s):
    def fix(m):
        tag = m.group(0)
        mm = re.search(r'src="/card_backs/([a-z_]+)\.gif"', tag)
        if mm and re.search(r'alt=""', tag) and mm.group(1) in CARDBACK_ALT:
            tag = tag.replace('alt=""', 'alt="%s"' % CARDBACK_ALT[mm.group(1)], 1)
        return tag
    return re.sub(r"<img\b[^>]*>", fix, s)

def webp_previews(s):
    def fix(m):
        tag = m.group(0)
        name = m.group(1)
        return f'<picture><source type="image/webp" srcset="/assets/preview/{name}.webp">{tag}</picture>'
    return re.sub(r'(?<!</source>)<img\b(?=[^>]*src="/assets/preview/([a-z]+)\.png")[^>]*>', fix, s) if "image/webp" not in s else s

def faq_html():
    items = "\n".join(
        f'    <details class="faq-item"><summary><h3>{html.escape(q)}</h3></summary><p>{html.escape(a)}</p></details>'
        for q, a in FAQ)
    return ('<section class="faq" id="faq" aria-labelledby="faq-title">\n'
            '    <div class="eb cy">Questions</div>\n'
            '    <h2 class="h" id="faq-title">Good questions, short answers.</h2>\n'
            f'{items}\n  </section>\n\n  ')

def home_body(s):
    s = s.replace('<div class="eb cy">Aldermere</div>\n      <h1>', '<div class="eb cy">A pixel idle RPG you play in your browser</div>\n      <h1>', 1)
    if 'id="faq"' not in s:
        anchor = '<section class="panel glow cta">'
        if anchor not in s: sys.exit("no cta anchor")
        s = s.replace(anchor, faq_html() + anchor, 1)
    else:
        s = re.sub(r'<section class="faq" id="faq".*?</section>\n\n  ', lambda m: faq_html(), s, flags=re.S)
    return s

def main():
    for name, cfg in PAGES.items():
        s = open(name, encoding="utf-8").read()
        s = apply_head(name, s, cfg)
        s = img_attrs(s)
        s = alt_text(s)
        if name != "index.html" and "/css/faq.css" not in s and 'img class="logo"' in s:
            s = s.replace('<link rel="stylesheet" href="/css/land.css">', '<link rel="stylesheet" href="/css/land.css">\n<link rel="stylesheet" href="/css/faq.css">', 1)
        if name == "index.html":
            if "/css/faq.css" not in s:
                s = s.replace('<link rel="stylesheet" href="/css/land.css">', '<link rel="stylesheet" href="/css/land.css">\n<link rel="stylesheet" href="/css/faq.css">', 1)
            s = home_body(s)
            s = webp_previews(s)
        open(name, "w", encoding="utf-8").write(s)
        print("ok", name)

if __name__ == "__main__":
    main()

def write_static():
    import datetime
    today = datetime.date.today().isoformat()
    imgs = [("city", "The City Hub in OverSummoned"), ("mining", "Mining in OverSummoned"), ("delve", "A delve fight in OverSummoned"),
            ("cards", "OverSummoned hero cards, front and animated back"), ("market", "The OverSummoned market"), ("crew", "An OverSummoned crew and the Crew Cup")]
    def u(loc, pri, freq, images=""):
        return f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>{freq}</changefreq>\n    <priority>{pri}</priority>\n{images}  </url>\n"
    im = "".join(f"    <image:image>\n      <image:loc>{SITE}/assets/preview/{n}.webp</image:loc>\n    </image:image>\n" for n, _ in imgs)
    im = f"    <image:image>\n      <image:loc>{SITE}/assets/og-share.jpg</image:loc>\n    </image:image>\n" + im
    sm = ('<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
          + u(SITE + "/", "1.0", "weekly", im) + u(SITE + "/story", "0.8", "monthly")
          + u(SITE + "/updates", "0.6", "weekly")
          + u(SITE + "/privacy", "0.3", "yearly") + u(SITE + "/terms", "0.3", "yearly") + "</urlset>\n")
    open("sitemap.xml", "w").write(sm)
    bots = ["Googlebot", "Bingbot", "Google-Extended", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot",
            "Claude-User", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Applebot", "Applebot-Extended", "DuckDuckBot", "CCBot", "meta-externalagent"]
    rules = "Allow: /\nDisallow: /ledger\nDisallow: /gm\n"
    rb = "# OverSummoned. Search engines and AI answer engines are welcome on the public pages.\n\n"
    rb += "User-agent: *\n" + rules + "\n"
    for b in bots:
        rb += f"User-agent: {b}\n" + rules + "\n"
    rb += f"Sitemap: {SITE}/sitemap.xml\n"
    open("robots.txt", "w").write(rb)
    man = {"name": "OverSummoned", "short_name": "OverSummoned",
           "description": "A pixel idle RPG you play in your browser. Summon heroes from every era and let them work while you are away.",
           "start_url": "/", "scope": "/", "display": "standalone", "background_color": "#07040d", "theme_color": "#07040d",
           "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
                     {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
                     {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}],
           "categories": ["games", "entertainment"]}
    open("site.webmanifest", "w").write(json.dumps(man, indent=2) + "\n")
    faq = "\n".join(f"### {q}\n{a}\n" for q, a in FAQ)
    llms = f"""# OverSummoned

> OverSummoned is a pixel idle RPG you play in your browser. You summon parody heroes from different eras of history, put them to work in the river city of Aldermere, and send them on delves for loot and gear. Your heroes keep working while you are away.

## The game in plain words

- Genre: idle RPG, pixel RPG, browser RPG, hero collector, summoning game.
- Where you play: in any web browser, on a computer or a phone. Nothing to download.
- Cost: free to play.
- Setting: Aldermere, a river city where an old ledger keeps pulling people out of the wrong century.
- Heroes: nine so far, each from a different time. A Roman legionary, a plague doctor from 1348, an Ice Age hunter, a Chicago gangster from 1927, a Victorian engineer from 1880s London, a Hollywood leading man, a paramedic, an office worker and a delivery rider from the modern day.
- Skills: mining, woodcutting, fishing, cooking, smithing, alchemy and summoning. Heroes keep at them while you are offline.
- Delves: send a squad down for a short walk or most of a night, then watch the fight play out. You can step in with food, shields and more.
- Loot and gear: weapons, trinkets, rings and a potion belt. Every item has stats like Attack, Defense, Health, Speed and Crit Chance, and they count in every fight.
- Cards: every hero is a collectible card with an animated back that shows them in the place they came from.
- Market and crews: trade ore, food, gems and cards in a market where prices move, and join a crew with a shared chat, vault and weekly goal.

## Pages

- [Home]({SITE}/): what OverSummoned is, the heroes, screenshots and questions.
- [The Story]({SITE}/story): how Aldermere ended up with more borrowed heroes than people.
- [Update Log]({SITE}/updates): everything new in the game, newest first.
- [Privacy Policy]({SITE}/privacy)
- [Terms of Service]({SITE}/terms)

## Questions

{faq}"""
    open("llms.txt", "w").write(llms)

if __name__ == "__main__":
    write_static()
    print("ok static")
