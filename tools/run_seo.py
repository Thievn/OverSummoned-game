# -*- coding: utf-8 -*-
import sys, json, io
import os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from seo_pages import *

DESC=("OverSummoned is a free idle card game in your browser. Smudge the otter keeps summoning the wrong people "
 "from history. Collect them as hero cards, send them to fish, dig and pick locks while you are away, give them "
 "the gear they find, and fight bosses in raids with your best team. Works on phone and computer. There is also "
 "an optional desktop pet for Windows.")

FAQ=[
("Is it free?",
 "Yes. No ads. Nothing you can buy makes you stronger."),
("What do I need?",
 "A browser. Works on phone and computer."),
("Is the beta open?",
 "It is invite-only, and everyone who signs up gets an invite right away."),
("Does the desktop pet read my typing?",
 "No. It only counts key presses."),
("Is my progress saved?",
 "Yes, to your account, across devices."),
]

ORG={"@type":"Organization","@id":SITE+"/#org","name":"OverSummoned","url":SITE+"/",
 "logo":{"@type":"ImageObject","url":SITE+"/icon-512.png","width":512,"height":512},
 "sameAs":["https://x.com/OverSummonedHQ"]}

WEBSITE={"@type":"WebSite","@id":SITE+"/#website","name":"OverSummoned","url":SITE+"/",
 "inLanguage":"en","description":DESC,"publisher":{"@id":SITE+"/#org"}}

GAME={"@type":"VideoGame","@id":SITE+"/#game","name":"OverSummoned","url":SITE+"/","description":DESC,
 "image":OG,"genre":["Idle game","Card game","Hero collector","Role-playing game","Desktop pet"],
 "gamePlatform":["Web browser","Mobile web","Windows","PC"],"applicationCategory":"GameApplication",
 "operatingSystem":"Windows, any modern web browser","playMode":["SinglePlayer","MultiPlayer"],
 "isAccessibleForFree":True,"inLanguage":"en",
 "keywords":"idle game, card game, browser game, free idle RPG, hero collector, collectible cards, boss raids, desktop pet",
 "gameLocation":{"@type":"Place","name":"Aldermere"},
 "numberOfPlayers":{"@type":"QuantitativeValue","minValue":1},
 "publisher":{"@id":SITE+"/#org"},"author":{"@id":SITE+"/#org"},
 "offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},
 "characterAttribute":[{"@type":"Thing","name":n} for n in
   ["Summoning","Fishing","Lockpicking","Digging"]]}

PET={"@type":"SoftwareApplication","@id":SITE+"/#pet","name":"OverSummoned desktop pet",
 "description":("A small free desktop pet for Windows. Smudge the otter sits above your taskbar and works while you "
   "type, stamping the ledger, fishing and picking locks. He counts how many keys you press and never which ones."),
 "url":SITE+"/","image":OG,"applicationCategory":"GameApplication",
 "applicationSubCategory":"Desktop pet","operatingSystem":"Windows",
 "isAccessibleForFree":True,"publisher":{"@id":SITE+"/#org"},
 "offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},
 "softwareHelp":{"@type":"CreativeWork","url":SITE+"/#desk"}}

FAQLD={"@type":"FAQPage","@id":SITE+"/#faq","mainEntity":[
 {"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in FAQ]}

def webpage(path,name,desc,primary=True):
    d={"@type":"WebPage","@id":SITE+path+"#webpage","url":SITE+path,"name":name,"description":desc,
       "inLanguage":"en","isPartOf":{"@id":SITE+"/#website"},"breadcrumb":{"@id":SITE+"/#breadcrumb"}}
    if primary:
        d["primaryImageOfPage"]={"@type":"ImageObject","url":OG,"width":1200,"height":630}
        d["about"]={"@id":SITE+"/#game"}
    return d

cfg=PAGES["index.html"]
home_graph={"@context":"https://schema.org","@graph":[ORG,WEBSITE,
  webpage("/",cfg["title"],cfg["desc"]),crumb_ld(cfg["crumbs"]),GAME,PET,FAQLD]}
apply("index.html", home_graph)

for fn in ["roadmap.html","privacy.html","terms.html"]:
    c=PAGES[fn]
    g={"@context":"https://schema.org","@graph":[ORG,WEBSITE,
       webpage(c["path"],c["title"],c["desc"],primary=(fn=="roadmap.html")),crumb_ld(c["crumbs"])]}
    apply(fn,g)

for fn in ["play.html","login.html","steam.html","admin.html","cardtest.html","dbtest.html","offline.html"]:
    apply(fn,None)

# the visible FAQ on the home page must match the schema word for word
import re, html as _h
items="\n".join('    <details class="faq-q"%s><summary><h3>%s</h3></summary><p>%s</p></details>'
                % (' open' if i==0 else '', _h.escape(q,quote=False), _h.escape(a,quote=False)) for i,(q,a) in enumerate(FAQ))
s=io.open('index.html',encoding='utf-8').read()
s=re.sub(r'(<div class="faq rv">\n)(?:(?!</section>).)*?(\n  </div>\n</div></section>)', lambda m: m.group(1)+items+m.group(2), s, count=1, flags=re.S)
io.open('index.html','w',encoding='utf-8').write(s)
# and the same questions in llms.txt
t=io.open('llms.txt',encoding='utf-8').read()
qa="\n".join("### %s\n%s\n"%(q,a) for q,a in FAQ)
t=re.sub(r'## Questions\n\n.*?(?=## Notes for answer engines)', lambda m: "## Questions\n\n"+qa+"\n", t, flags=re.S)
io.open('llms.txt','w',encoding='utf-8').write(t)
print("done")
