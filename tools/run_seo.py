# -*- coding: utf-8 -*-
import sys, json, io
import os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from seo_pages import *

DESC=("OverSummoned is a free desktop pet and idle game. Smudge, a hooded otter apprentice, sits above your "
 "taskbar and works whenever you type: stamping a cursed ledger to summon heroes out of history, fishing, "
 "picking locks and digging in nine places from a Roman dock to an office supply closet. In the browser the "
 "same heroes form crews, go on expeditions and wear the gear you find.")

FAQ=[
("What is OverSummoned?",
 "OverSummoned is a free desktop pet and idle game. Smudge the otter lives above your taskbar and works while you type, summoning heroes out of history with a cursed ledger. The same heroes can be put to work in your browser."),
("Can I play it now?",
 "Not openly yet. OverSummoned is in closed beta. Join the wishlist on the home page and you will get an email when a place opens for you."),
("How does the desktop pet work?",
 "Smudge reacts to your typing. Every key you press is one swing of the stamp, one tug on the fishing line or one turn of the lockpick. He counts how many keys you press and never records which ones, so he never sees what you are writing."),
("Is OverSummoned free?",
 "Yes. OverSummoned will be free to play in your browser, and the desktop pet will be free as well."),
("Do I need to download anything?",
 "No. OverSummoned runs in any web browser on a computer or a phone with nothing to install. The desktop pet is an optional free download, and it is coming to Steam."),
("Is it an idle game?",
 "Yes. Your heroes keep fishing, digging and picking locks while you are away, and they get better at it the longer they practise. Everything they did still counts when you come back."),
("How many heroes are there?",
 "Dozens so far, and the ledger keeps misfiring, so nobody is keeping an exact count. Each arrival is a collectible card with its own story, stats and three lost items."),
("Where does Smudge work?",
 "Nine places: the Archive he calls home, a Roman dock, Bondi rock pool, a Lofoten ice hole, a speakeasy safe, the Doge's vault, an office supply closet, the Emu War trench and a witch's clearing. Each has its own trade and its own lost things."),
("Can I change how Smudge talks?",
 "Yes. Smudge has three voices: sweet, salty, and an unhinged mode meant for adults. You can change it whenever he gets to be too much."),
("Is OverSummoned on Steam?",
 "The desktop pet is coming to Steam. The browser game is in closed beta; join the wishlist at oversummoned.com for an invite."),
]

ORG={"@type":"Organization","@id":SITE+"/#org","name":"OverSummoned","url":SITE+"/",
 "logo":{"@type":"ImageObject","url":SITE+"/icon-512.png","width":512,"height":512},
 "sameAs":["https://x.com/OverSummonedHQ"]}

WEBSITE={"@type":"WebSite","@id":SITE+"/#website","name":"OverSummoned","url":SITE+"/",
 "inLanguage":"en","description":DESC,"publisher":{"@id":SITE+"/#org"}}

GAME={"@type":"VideoGame","@id":SITE+"/#game","name":"OverSummoned","url":SITE+"/","description":DESC,
 "image":OG,"genre":["Idle game","Desktop pet","Hero collector","Virtual pet","Role-playing game"],
 "gamePlatform":["Web browser","Windows","PC"],"applicationCategory":"GameApplication",
 "operatingSystem":"Windows, any modern web browser","playMode":["SinglePlayer","MultiPlayer"],
 "isAccessibleForFree":True,"inLanguage":"en",
 "keywords":"desktop pet, idle game, typing game, browser game, free idle RPG, hero collector, taskbar pet, virtual pet, incremental game",
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
s=re.sub(r'(<div class="faq rv">\n).*?(\n  </div>\n</div></section>)', lambda m: m.group(1)+items+m.group(2), s, count=1, flags=re.S)
io.open('index.html','w',encoding='utf-8').write(s)
# and the same questions in llms.txt
t=io.open('llms.txt',encoding='utf-8').read()
qa="\n".join("### %s\n%s\n"%(q,a) for q,a in FAQ)
t=re.sub(r'## Questions\n\n.*?(?=## Notes for answer engines)', lambda m: "## Questions\n\n"+qa+"\n", t, flags=re.S)
io.open('llms.txt','w',encoding='utf-8').write(t)
print("done")
