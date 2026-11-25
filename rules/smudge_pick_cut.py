"""Careful cut of Smudge's lockpicking pose.  python3 rules/smudge_pick_cut.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from scipy import ndimage
from cutlib import *

POSE = 'pick'
HEAD = [(300,8),(345,16),(385,36),(408,52),(409,70),(403,100),(399,118),(411,136),(405,150),(393,160),(385,173),(372,171),(360,168),
        (345,172),(330,176),(310,172),(285,165),(255,158),(230,150),(212,142),(204,128),(206,108),(212,90),(214,70),(218,50),(213,36),(224,25),(250,15),(275,9)]
TAIL = [(0,432),(20,412),(60,402),(100,396),(142,398),(146,440),(128,462),(96,462),(72,470),(100,480),(130,500),(143,510),(141,529),(100,529),(40,522),(6,502),(0,470)]
ARM_A = [(346,196),(366,198),(400,180),(440,174),(464,188),(492,214),(492,231),(462,233),(440,233),(420,229),(380,229),(360,226),(346,216)]
ARM_B = [(300,243),(340,254),(382,262),(420,236),(450,233),(463,243),(494,239),(494,253),(463,263),(456,281),(420,291),(360,290),(300,286)]


def run():
    a, xx, yy = load(POSE); base = a.copy(); parts = []
    tail = cut_behind(a, base, TAIL, fur_only=True, under=[(78,388),(152,388),(152,472),(78,472)])
    parts.append(dict(name='tail', mode='behind', pivot=[124, 440], offset=save(tail, POSE, 'tail')))
    arm_a = cut_behind(a, base, ARM_A)
    parts.append(dict(name='hand_a', mode='behind', pivot=[356, 211], offset=save(arm_a, POSE, 'hand_a')))
    arm_b = cut_behind(a, base, ARM_B, overlap=[(272,240),(304,240),(304,294),(272,294)], soften=[(280,240),(312,240),(312,294),(280,294)],
                       under=[(292,226),(432,226),(432,302),(292,302)])
    parts.append(dict(name='hand_b', mode='behind', pivot=[298, 268], offset=save(arm_b, POSE, 'hand_b')))
    head = cut_head(a, base, HEAD, soft=[(200,146),(350,160),(350,186),(200,186)], fill=[(200,128),(352,128),(352,192),(200,192)],
                    quill=[(184,90),(205,90),(205,150),(184,150)])
    parts.append(dict(name='head', mode='front', pivot=[312, 170], offset=save(head, POSE, 'head')))
    fur = [int(v) for v in a[90:95, 348:353, :3].reshape(-1, 3).mean(axis=0)]
    entry = dict(size=[a.shape[1], a.shape[0]], foot=[257, 522], bag=[120, 250], parts=parts, hands=[505, 235],
                 face=dict(eyes=[[361, 111, 11, 10]], mouth=[376, 156, 8, 5], fur=fur))
    finish(POSE, a, base, entry); return entry


if __name__ == '__main__':
    e = run()
    sheet(POSE, e, [{}, {'head': 8, 'tail': 12, 'hand_a': 5, 'hand_b': -5}, {'head': -8, 'tail': -12, 'hand_a': -5, 'hand_b': 5}], '/tmp/pickcut.png')
    print('ok')
