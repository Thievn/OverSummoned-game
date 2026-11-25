"""Careful cut of Smudge's digging pose.  python3 rules/smudge_dig_cut.py
The whole shovel is one part that slides under both fists: body -> shovel -> fists ("over") -> head."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, cv2
from scipy import ndimage
from cutlib import *

POSE = 'dig'
HEAD = [(300,12),(340,24),(375,38),(387,50),(385,75),(381,95),(399,105),(403,122),(393,138),(385,152),(375,161),(360,153),(345,153),
        (335,160),(320,168),(300,170),(275,166),(250,158),(228,148),(214,138),(206,124),(208,104),(216,84),(224,66),(216,52),(211,40),(222,29),(250,19),(275,13)]
TAIL = [(0,420),(30,430),(70,444),(105,444),(142,430),(152,470),(120,487),(60,487),(14,472),(0,456)]
BLADE = [(428,346),(480,344),(522,362),(562,398),(566,442),(540,454),(448,436),(436,402)]
L_FIST = [(192,252),(238,250),(246,300),(232,314),(200,312),(190,290)]
R_FIST = [(346,330),(392,330),(404,356),(398,380),(360,382),(346,360)]
P0, P1 = (150, 258), (440, 372)          # the shaft, end to neck


def run():
    a, xx, yy = load(POSE); base = a.copy(); parts = []; alpha = a[..., 3] > 0
    tail = cut_behind(a, base, TAIL, fur_only=True, under=[(56,396),(164,396),(164,462),(56,462)])
    parts.append(dict(name='tail', mode='behind', pivot=[140, 456], offset=save(tail, POSE, 'tail')))

    # ---- shovel
    dx, dy = P1[0] - P0[0], P1[1] - P0[1]; L = float(np.hypot(dx, dy)); ux, uy = dx / L, dy / L
    along = (xx - P0[0]) * ux + (yy - P0[1]) * uy; across = np.abs(-(xx - P0[0]) * uy + (yy - P0[1]) * ux)
    shaft = (across <= 10) & (along >= -8) & (along <= L + 6)
    fists = poly(a, L_FIST) | poly(a, R_FIST)
    sm = (shaft | poly(a, BLADE)) & alpha
    sm |= ndimage.binary_dilation(sm & (xx > 402), iterations=7) & alpha & (xx > 398)      # blade and neck with their ink line
    piece = a.copy(); piece[~(sm & ~fists)] = 0
    for (x0, x1, step) in ((190, 248, 58), (344, 404, -62)):       # shaft under each fist, copied along its own line
        span = shaft & (xx >= x0) & (xx <= x1)
        sx = step * ux; sy = step * uy
        src = cv2.warpAffine(a, np.float32([[1, 0, -sx], [0, 1, -sy]]), (a.shape[1], a.shape[0]), flags=cv2.INTER_LINEAR)
        ok = span & (src[..., 3] > 0) & (across <= 8); piece[ok] = src[ok]
    parts.append(dict(name='shovel', mode='front', pivot=[300, 318], offset=save(piece, POSE, 'shovel')))
    # body where the shaft lay across it: paint in; open air: clear
    gone = sm & ~fists
    over_body = gone & (xx < 346)
    painted = cv2.inpaint(np.ascontiguousarray(base[..., :3]), ndimage.binary_dilation(over_body, iterations=2).astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)
    base[..., :3][over_body] = painted[over_body]
    base[..., 3][gone & ~over_body] = 0
    # fists go back on top of the shovel
    om = fists & alpha & ndimage.binary_dilation(shaft, iterations=26)
    op = a.copy(); op[~om] = 0
    parts.append(dict(name='over', mode='front', pivot=[300, 318], offset=save(op, POSE, 'over')))

    head = cut_head(a, base, HEAD, soft=[(200,142),(338,152),(338,182),(200,182)], fill=[(200,124),(340,124),(340,186),(200,186)],
                    quill=[(178,90),(207,90),(207,146),(178,146)])
    parts.append(dict(name='head', mode='front', pivot=[305, 165], offset=save(head, POSE, 'head')))
    fur = [int(v) for v in a[76:81, 338:343, :3].reshape(-1, 3).mean(axis=0)]
    entry = dict(size=[a.shape[1], a.shape[0]], foot=[300, 535], bag=[110, 240], parts=parts, blade=[520, 440],
                 face=dict(eyes=[[351, 97, 11, 11]], mouth=[366, 136, 8, 5], fur=fur))
    finish(POSE, a, base, entry); return entry


if __name__ == '__main__':
    e = run()
    sheet(POSE, e, [{}, {'head': 8, 'tail': 12, 'shovel': 9}, {'head': -8, 'tail': -12, 'shovel': -7}], '/tmp/digcut.png')
    print('ok')
