"""Careful cut of Smudge's fishing pose.  python3 rules/smudge_fish_cut.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from scipy import ndimage
from cutlib import *

POSE = 'fish'
HEAD = [(200,8),(245,19),(253,36),(259,60),(273,84),(267,101),(259,121),(240,129),(228,133),(215,143),(190,147),(160,145),
        (135,141),(116,135),(105,118),(101,96),(103,70),(97,48),(110,35),(135,21),(165,11)]
TAIL = [(100,352),(170,352),(172,400),(170,440),(162,482),(142,514),(106,530),(96,522),(110,482),(116,432),(104,402),(100,372)]
LEGS = [(214,353),(300,353),(332,340),(336,400),(345,440),(350,475),(300,492),(240,484),(212,440),(214,400)]
ROD = [(294,222),(309,228),(336,200),(388,134),(438,86),(476,64),(476,28),(436,42),(384,92),(334,152),(300,194),(288,212)]


def run():
    a, xx, yy = load(POSE); base = a.copy(); parts = []
    tail = cut_behind(a, base, TAIL, overlap=[(104,336),(168,336),(168,356),(104,356)])
    parts.append(dict(name='tail', mode='behind', pivot=[136, 356], offset=save(tail, POSE, 'tail')))
    rod = cut_behind(a, base, ROD, keep_cloak=False, thin=True)
    base[..., 3][ndimage.binary_dilation(poly(a, ROD), iterations=6) & (yy < 205)] = 0      # and its ink line
    # carry the rod on down under the fist so nothing shows when it tips
    ext = np.roll(np.roll(rod, 14, axis=0), -8, axis=1); m = (rod[..., 3] == 0) & (ext[..., 3] > 0) & (yy > 204); rod[m] = ext[m]
    parts.append(dict(name='rod', mode='behind', pivot=[292, 215], offset=save(rod, POSE, 'rod')))
    legs = cut_behind(a, base, LEGS, overlap=[(206,330),(332,322),(334,356),(206,356)], soften=[(210,338),(340,326),(340,362),(210,362)])
    parts.append(dict(name='feet', mode='behind', pivot=[292, 338], offset=save(legs, POSE, 'feet')))
    head = cut_head(a, base, HEAD, soft=[(95,122),(240,122),(240,160),(95,160)], fill=[(100,112),(242,112),(242,160),(100,160)],
                    quill=[(88,30),(112,30),(112,126),(88,126)])
    parts.append(dict(name='head', mode='front', pivot=[205, 140], offset=save(head, POSE, 'head')))
    fur = [int(v) for v in a[70:75, 236:241, :3].reshape(-1, 3).mean(axis=0)]
    entry = dict(size=[a.shape[1], a.shape[0]], foot=[250, 355], bag=[60, 250], parts=parts, rod_tip=[470, 50],
                 face=dict(eyes=[[224, 77, 10, 10]], mouth=[246, 113, 8, 6], fur=fur))
    finish(POSE, a, base, entry); return entry


if __name__ == '__main__':
    e = run()
    sheet(POSE, e, [{}, {'head': 8, 'tail': 12, 'feet': 8, 'rod': -6}, {'head': -8, 'tail': -12, 'feet': -8, 'rod': 6}], '/tmp/fishcut.png')
    print('ok')
