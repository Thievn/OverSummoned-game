"""Cut of Smudge's sleeping pose: just the tail comes off (it lies in front). Everything else that
moves while he sleeps (back rising, snout and paw twitches, the Zs) is done with bones on the whole
picture in rules/dbexport.py.   python3 rules/smudge_sleep_cut.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutlib import *

POSE = 'sleep'
TAIL = [(243,360),(252,345),(270,329),(300,318),(340,316),(380,313),(408,306),(428,296),(438,280),(446,270),(470,270),(500,300),(500,340),
        (482,360),(450,373),(400,379),(340,377),(290,371),(255,366)]


def run():
    a, xx, yy = load(POSE); base = a.copy()
    tail = cut_front(a, base, TAIL)
    parts = [dict(name='tail', mode='front', pivot=[455, 286], offset=save(tail, POSE, 'tail'))]
    entry = dict(size=[a.shape[1], a.shape[0]], foot=[300, 372], bag=[430, 150], parts=parts, face=None, zzz=[250, 120],
                 db=dict(breath=[410, 190], nose=[165, 212], paw=[150, 272], zs=[[120, 60], [92, 26], [58, -14]]))
    finish(POSE, a, base, entry); return entry


if __name__ == '__main__':
    e = run(); sheet(POSE, e, [{}, {'tail': 5}, {'tail': -5}], '/tmp/sleepcut.png'); print('ok')
