import json, re, sys, urllib.request, xml.etree.ElementTree as ET
base = sys.argv[1] if len(sys.argv) > 1 else None
def get(path):
    if base:
        r = urllib.request.urlopen(urllib.request.Request(base + path, headers={"User-Agent": "Mozilla/5.0 seo-check"}))
        return r.status, r.read().decode("utf-8"), dict(r.headers)
    f = {"/": "index.html"}.get(path, path.strip("/") + (".html" if "." not in path else ""))
    return 200, open(f, encoding="utf-8").read(), {}
ok = True
need = {"/": {"VideoGame", "WebSite", "Organization", "BreadcrumbList", "FAQPage", "WebPage"},
        "/story": {"VideoGame", "WebSite", "Organization", "BreadcrumbList", "WebPage"},
        "/privacy": {"WebSite", "Organization", "BreadcrumbList", "WebPage"},
        "/terms": {"WebSite", "Organization", "BreadcrumbList", "WebPage"},
        "/updates": {"WebSite", "Organization", "BreadcrumbList", "WebPage"}}
for path, types in need.items():
    st, body, _ = get(path)
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', body, re.S)
    found = set()
    for b in blocks:
        d = json.loads(b)
        for n in d.get("@graph", [d]):
            t = n["@type"]; found |= set(t if isinstance(t, list) else [t])
            if t == "FAQPage":
                for q in n["mainEntity"]:
                    assert q["name"] and q["acceptedAnswer"]["text"]
                    if q["name"] not in body.split("application/ld+json")[0] and body.count(q["name"]) < 2:
                        print("  FAQ question not visible:", q["name"]); ok = False
    h1 = len(re.findall(r"<h1\b", body))
    title = re.search(r"<title>(.*?)</title>", body).group(1)
    desc = re.search(r'<meta name="description" content="([^"]*)"', body).group(1)
    canon = re.search(r'<link rel="canonical" href="([^"]+)"', body).group(1)
    imgs = re.findall(r"<img\b[^>]*>", body)
    noalt = [i for i in imgs if "alt=" not in i]
    for k in ("og:title", "og:description", "og:image", "og:url"):
        assert f'property="{k}"' in body, k
    miss = types - found
    print(f"{path} {st} ld-blocks={len(blocks)} types={sorted(found)} h1={h1} title={len(title)}ch desc={len(desc)}ch canon={canon} imgs={len(imgs)} noalt={len(noalt)}")
    if miss or h1 != 1 or noalt or st != 200: ok = False; print("  PROBLEM", miss)
st, sm, _ = get("/sitemap.xml")
root = ET.fromstring(sm.encode())
locs = [e.text for e in root.iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
print("sitemap ok, urls:", locs)
st, rb, _ = get("/robots.txt")
for bot in ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]:
    assert f"User-agent: {bot}" in rb, bot
assert "Disallow: /ledger" in rb and "Sitemap: https://oversummoned.com/sitemap.xml" in rb
print("robots ok")
if base:
    for p in locs:
        st, _, _ = get(p.replace("https://oversummoned.com", "")); print(" ", p, st)
    for p in ["/llms.txt", "/site.webmanifest", "/assets/og-share.jpg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/assets/preview/city.webp", "/css/faq.css"]:
        r = urllib.request.urlopen(urllib.request.Request(base + p, headers={"User-Agent": "Mozilla/5.0"}))
        print(" ", p, r.status, r.headers.get("content-type"))
    json.loads(get("/site.webmanifest")[1])
print("ALL OK" if ok else "SOME PROBLEMS")
