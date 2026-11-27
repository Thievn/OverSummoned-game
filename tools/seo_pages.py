# -*- coding: utf-8 -*-
import re, io, json, os

SITE="https://oversummoned.com"
OG=SITE+"/assets/og-share.jpg?v=2"
OGALT="OverSummoned game screens: hero cards, a boss raid and Smudge the otter at work"

ICONS = """<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon_32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon_16.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="application-name" content="OverSummoned">
<meta name="apple-mobile-web-app-title" content="OverSummoned">"""

PAGES = {
 "index.html": dict(
   path="/", index=True,
   title="OverSummoned: a free idle card game with heroes from all of history",
   desc="Collect hero cards from all of history, send them to work while you are away, and fight bosses with your best team. Free in your browser on phone or computer. Closed beta: sign up and get your invite by email.",
   ogtitle="OverSummoned: collect heroes from all the wrong centuries",
   ogdesc="A free idle card game. Collect heroes from history, put them to work while you are away, and fight bosses. Plays in your browser on phone or computer.",
   crumbs=[("Home","/")]),
 "roadmap.html": dict(
   path="/roadmap", index=True,
   title="What's Coming to OverSummoned · Roadmap",
   desc="What is next for OverSummoned: new arrivals every month, guild raids, seasons, the shop and the Steam release of the desktop pet.",
   ogtitle="OverSummoned roadmap · what's coming next",
   ogdesc="New arrivals every month, guild raids, seasons, the shop, and the desktop pet on Steam.",
   crumbs=[("Home","/"),("What's coming","/roadmap")]),
 "privacy.html": dict(
   path="/privacy", index=True,
   title="Privacy Policy · OverSummoned",
   desc="What OverSummoned stores and what it never touches. The desktop pet counts how many keys you press, never which ones.",
   ogtitle="Privacy Policy · OverSummoned",
   ogdesc="What OverSummoned stores and what it never touches.",
   crumbs=[("Home","/"),("Privacy","/privacy")]),
 "terms.html": dict(
   path="/terms", index=True,
   title="Terms of Service · OverSummoned",
   desc="The rules for playing OverSummoned and using the desktop pet.",
   ogtitle="Terms of Service · OverSummoned",
   ogdesc="The rules for playing OverSummoned and using the desktop pet.",
   crumbs=[("Home","/"),("Terms","/terms")]),
 # app + utility pages: keep out of the index, still let link equity flow
 "play.html":    dict(path="/play",    index=False, follow=True,
                      title="Play OverSummoned", desc="Open your ledger and put your arrivals to work."),
 "login.html":   dict(path="/login",   index=False, follow=True,
                      title="Sign in · OverSummoned", desc="Sign in to OverSummoned."),
 "steam.html":   dict(path="/steam",   index=False, follow=False,
                      title="Signing in · OverSummoned", desc="Signing you in through Steam."),
 "admin.html":   dict(path="/admin",   index=False, follow=False,
                      title="Owner's office · OverSummoned", desc="Owner tools."),
 "cardtest.html":dict(path="/cardtest",index=False, follow=False,
                      title="Living card test · OverSummoned", desc="Internal card test page."),
 "dbtest.html":  dict(path="/dbtest",  index=False, follow=False,
                      title="Smudge rig test · OverSummoned", desc="Internal rig test page."),
 "offline.html": dict(path="/offline", index=False, follow=False,
                      title="You're offline · OverSummoned", desc="You are offline."),
}

def esc(s):
    return (s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;"))

def crumb_ld(crumbs):
    return {"@type":"BreadcrumbList","@id":SITE+"/#breadcrumb",
      "itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":SITE+p}
                         for i,(n,p) in enumerate(crumbs)]}

def build_head(fn, cfg, ld=None):
    url = SITE + cfg["path"]
    out = []
    out.append("<title>%s</title>" % esc(cfg["title"]))
    out.append('<meta name="description" content="%s">' % esc(cfg["desc"]))
    if cfg["index"]:
        out.append('<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">')
    else:
        out.append('<meta name="robots" content="noindex,%s">' % ("follow" if cfg.get("follow") else "nofollow"))
    out.append('<link rel="canonical" href="%s">' % url)
    if cfg["index"]:
        out.append('<meta property="og:type" content="website">')
        out.append('<meta property="og:site_name" content="OverSummoned">')
        out.append('<meta property="og:locale" content="en_US">')
        out.append('<meta property="og:url" content="%s">' % url)
        out.append('<meta property="og:title" content="%s">' % esc(cfg["ogtitle"]))
        out.append('<meta property="og:description" content="%s">' % esc(cfg["ogdesc"]))
        out.append('<meta property="og:image" content="%s">' % OG)
        out.append('<meta property="og:image:type" content="image/jpeg">')
        out.append('<meta property="og:image:width" content="1200">')
        out.append('<meta property="og:image:height" content="630">')
        out.append('<meta property="og:image:alt" content="%s">' % esc(OGALT))
        out.append('<meta name="twitter:card" content="summary_large_image">')
        out.append('<meta name="twitter:site" content="@OverSummonedHQ">')
        out.append('<meta name="twitter:creator" content="@OverSummonedHQ">')
        out.append('<meta name="twitter:title" content="%s">' % esc(cfg["ogtitle"]))
        out.append('<meta name="twitter:description" content="%s">' % esc(cfg["ogdesc"]))
        out.append('<meta name="twitter:image" content="%s">' % OG)
        out.append('<meta name="twitter:image:alt" content="%s">' % esc(OGALT))
    out.append(ICONS)
    if ld:
        out.append('<script type="application/ld+json">%s</script>' %
                   json.dumps(ld, ensure_ascii=False, separators=(",",":")))
    return "\n".join(out)

def strip_old(head):
    # remove tags we are now managing, wherever the redesign left them
    pats = [r'<title>.*?</title>', r'<meta\s+name="description"[^>]*>',
            r'<meta\s+name="robots"[^>]*>', r'<link\s+rel="canonical"[^>]*>',
            r'<meta\s+property="og:[^>]*>', r'<meta\s+name="twitter:[^>]*>',
            r'<link\s+rel="manifest"[^>]*>', r'<link\s+rel="apple-touch-icon"[^>]*>',
            r'<link\s+rel="icon"[^>]*>', r'<meta\s+name="application-name"[^>]*>',
            r'<meta\s+name="apple-mobile-web-app-title"[^>]*>',
            r'<script type="application/ld\+json">.*?</script>']
    for p in pats:
        head = re.sub(p, '', head, flags=re.S|re.I)
    return head

def apply(fn, ld=None):
    cfg = PAGES[fn]
    src = io.open(fn, encoding="utf-8").read()
    block = "<!-- seo:start -->\n" + build_head(fn, cfg, ld) + "\n<!-- seo:end -->"
    if "<!-- seo:start -->" in src:
        src = re.sub(r'<!-- seo:start -->.*?<!-- seo:end -->', lambda m: block, src, flags=re.S)
    else:
        m = re.search(r'<head[^>]*>', src, re.I)
        head_end = src.lower().index("</head>")
        head = src[m.end():head_end]
        head = strip_old(head)
        head = re.sub(r'\n{3,}', '\n', head)
        src = src[:m.end()] + "\n" + block + "\n" + head.lstrip("\n") + src[head_end:]
    io.open(fn,"w",encoding="utf-8").write(src)
    return cfg
