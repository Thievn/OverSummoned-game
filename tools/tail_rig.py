"""Gives a Meshy-rigged Smudge a real tail. Meshy's auto-rig has no tail bones, so it glues the tail to the
nearest leg (on Smudge, the left one), which is why the tail is dragged around by his leg when he runs.

This adds a chain of bones (tail0..tailN) along the tail's centreline, parented to Hips, and re-weights the
tail's vertices onto that chain: each vertex follows the two nearest tail bones, and near the root it blends back
into its original weights so the join to the body stays smooth. The game then swings the chain in code.
  python3 tools/tail_rig.py in.glb out.glb [--preset bare|cloak]
"""
import sys, struct, argparse
import numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
import glb_slim as g

PRESETS = {
    # metres, in mesh space: root at the back of the hips, down the back, then out along the floor to his left
    'bare': {'pts': [(0.00, 0.46, -0.090), (0.00, 0.33, -0.115), (0.01, 0.20, -0.130), (0.05, 0.07, -0.125),
                     (0.15, 0.04, -0.127), (0.24, 0.03, -0.138), (0.31, 0.03, -0.160)],
             'sel': lambda x, y, z: ((z < -0.075) & (y < 0.47)) | ((y < 0.07) & (z < -0.04) & (x > -0.03))},
    # the cloaked model: the tail runs straight down and back, then out along the floor to his left; picked by
    # distance from that line, so the cloak's hem (further out) stays with the body
    'cloak': {'pts': [(0.00, 0.45, -0.040), (0.00, 0.33, -0.100), (0.00, 0.20, -0.150), (0.03, 0.08, -0.190),
                      (0.12, 0.04, -0.190), (0.22, 0.04, -0.170), (0.31, 0.05, -0.160)],
              'radius': [0.06, 0.075, 0.08, 0.08, 0.06, 0.045, 0.03], 'grow': 1.5, 'zmax': -0.05},
    # the 1920s model: one long diagonal tail, down and back, angled slightly to his left
    '1920s': {'pts': [(0.00, 0.42, -0.030), (0.01, 0.32, -0.075), (0.03, 0.22, -0.120), (0.07, 0.13, -0.170),
                      (0.12, 0.07, -0.220), (0.17, 0.04, -0.260), (0.21, 0.02, -0.300)],
              'radius': [0.055, 0.07, 0.07, 0.065, 0.055, 0.04, 0.03], 'grow': 1.6, 'zmax': -0.035, 'reach': 0.06},
}

def near_line(P, pts, radius, grow=1.0, zmax=None):
    radius = [r * grow for r in radius]
    seg = pts[1:] - pts[:-1]; L2 = (seg ** 2).sum(1); out = np.zeros(len(P), bool)
    for k in range(len(seg)):
        u = np.clip(((P - pts[k]) * seg[k]).sum(1) / L2[k], 0, 1); d = np.linalg.norm(pts[k] + seg[k] * u[:, None] - P, axis=1)
        r = radius[k] + (radius[k + 1] - radius[k]) * u; out |= d < r
    out &= P[:, 1] < pts[0][1] + 0.02
    if zmax is not None: out &= P[:, 2] < zmax
    return out

def spread(sel, I, legs, passes=12):
    """A tail picked by distance can miss its own far side; any leg-weighted vertex that shares a triangle with
    the tail is pulled in, a few rings deep, so no triangle is left straddling the tail and a thigh."""
    for _ in range(passes):
        hit = sel[I].any(1); cand = np.zeros_like(sel); cand[I[hit].reshape(-1)] = True
        new = cand & legs & ~sel
        if not new.any(): break
        sel = sel | new
    return sel

DT = {5126: np.float32, 5123: np.uint16, 5121: np.uint8, 5125: np.uint32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def get(js, b, i):
    a = js['accessors'][i]; bv = js['bufferViews'][a['bufferView']]; n = NC[a['type']]; dt = DT[a['componentType']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); st = bv.get('byteStride')
    if st and st != n * np.dtype(dt).itemsize:
        raw = np.frombuffer(b, np.uint8, st * a['count'], off).reshape(a['count'], st)
        out = raw[:, :n * np.dtype(dt).itemsize].copy().view(dt).reshape(a['count'], n)
    else:
        out = np.frombuffer(b, dt, a['count'] * n, off).reshape(a['count'], n).copy()
    if a.get('normalized') and dt != np.float32: out = out.astype(np.float32) / np.iinfo(dt).max
    return out

def put(js, b, arr, ctype, atype, target=None):
    """Appends arr as a new tightly packed bufferView + accessor; returns (accessor index, new bin)."""
    b = b + b'\x00' * (-len(b) % 4); raw = np.ascontiguousarray(arr).tobytes()
    bv = {'buffer': 0, 'byteOffset': len(b), 'byteLength': len(raw)}
    if target: bv['target'] = target
    js['bufferViews'].append(bv)
    acc = {'bufferView': len(js['bufferViews']) - 1, 'componentType': ctype, 'count': len(arr), 'type': atype}
    js['accessors'].append(acc); js['buffers'][0]['byteLength'] = len(b) + len(raw)
    return len(js['accessors']) - 1, b + raw

def local(n):
    if 'matrix' in n: return np.array(n['matrix'], float).reshape(4, 4).T
    t = n.get('translation', [0, 0, 0]); r = n.get('rotation', [0, 0, 0, 1]); s = n.get('scale', [1, 1, 1])
    x, y, z, w = r
    R = np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
    M = np.eye(4); M[:3, :3] = R * np.array(s); M[:3, 3] = t; return M

def globals_(js):
    par = {c: i for i, n in enumerate(js['nodes']) for c in n.get('children', [])}
    G = {}
    def go(i):
        if i not in G: G[i] = (go(par[i]) if i in par else np.eye(4)) @ local(js['nodes'][i])
        return G[i]
    for i in range(len(js['nodes'])): go(i)
    return G

def smooth(e0, e1, x): t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

def rig(src, dst, preset='bare'):
    cfg = PRESETS[preset]; js, b = g.read(src); b = bytearray(b)
    sk = js['skins'][0]; joints = sk['joints']; names = {i: n.get('name') for i, n in enumerate(js['nodes'])}
    assert not any(str(names[j]).startswith('tail') for j in joints), 'already has a tail'
    G = globals_(js); ibm = get(js, bytes(b), sk['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    err = max(np.abs(G[j] @ ibm[k] - np.eye(4)).max() for k, j in enumerate(joints))
    print('bind check (should be ~0):', round(float(err), 5))
    hips = next(j for j in joints if names[j] == 'Hips')

    # the chain: one node per centreline point except the tip, each parented to the previous
    pts = np.array(cfg['pts'], float); parent = hips; new = []
    for k, p in enumerate(pts[:-1]):
        Gp = G[parent]; lp = np.linalg.inv(Gp) @ np.append(p, 1)
        js['nodes'].append({'name': f'tail{k}', 'translation': [float(v) for v in lp[:3]]})
        idx = len(js['nodes']) - 1; js['nodes'][parent].setdefault('children', []).append(idx)
        G[idx] = Gp @ local(js['nodes'][idx]); new.append(idx); parent = idx
    base = len(joints); hips_j = joints.index(hips); joints.extend(new)
    allibm = np.concatenate([ibm, np.stack([np.linalg.inv(G[i]) for i in new])])
    sk['inverseBindMatrices'], b = put(js, bytes(b), allibm.transpose(0, 2, 1).reshape(-1, 16).astype(np.float32), 5126, 'MAT4')

    for mesh in js['meshes']:
        for prim in mesh['primitives']:
            at = prim['attributes']
            if 'JOINTS_0' not in at: continue
            P = get(js, b, at['POSITION']); J = get(js, b, at['JOINTS_0']).astype(np.uint16); W = get(js, b, at['WEIGHTS_0']).astype(np.float32)
            if 'sel' in cfg: sel = cfg['sel'](*P.T)
            else:
                sel = near_line(P, pts, cfg['radius'], cfg.get('grow', 1), cfg.get('zmax'))
                legset = [k for k, j in enumerate(joints[:base]) if 'Leg' in str(names[j]) or 'Foot' in str(names[j]) or 'Toe' in str(names[j])]
                dom = J[np.arange(len(J)), W.argmax(1)]; legs = np.isin(dom, legset) & (P[:, 2] < (cfg.get('zmax') or 0) + cfg.get('reach', 0.02))
                I = get(js, b, prim['indices']).reshape(-1, 3); sel = spread(sel, I, legs)
            idx = np.where(sel)[0]
            seg = pts[1:] - pts[:-1]; L = np.linalg.norm(seg, axis=1); cum = np.concatenate([[0], np.cumsum(L)])
            for v in idx:
                q = P[v]; u = np.clip(((q - pts[:-1]) * seg).sum(1) / L**2, 0, 1)
                d = np.linalg.norm(pts[:-1] + seg * u[:, None] - q, axis=1); k = int(d.argmin()); uk = u[k]
                s = cum[k] + uk * L[k]                               # distance from the root along the tail
                nxt = min(k + 1, len(new) - 1); wb = 0.5 * smooth(0.5, 1.0, uk) if nxt != k else 0.0
                # how much of it belongs to the tail: fades in from the root, and fades out at the seam where the
                # tail presses against the backs of the thighs, so that skin stretches between the two instead of tearing
                tw = smooth(0.0, 0.09, s) * (1 if 'radius' in cfg else 1 - smooth(0.052, 0.08, d[k]))
                # whatever is not tail blends into the hips, never into a leg: Meshy weighted the tail to a leg,
                # and keeping any of that makes each stride drag the base of the tail along with the thigh
                J[v] = [base + k, base + nxt, hips_j, hips_j]
                W[v] = [tw * (1 - wb), tw * wb, 1 - tw, 0]
            W /= W.sum(1, keepdims=True)
            at['JOINTS_0'], b = put(js, b, J, 5123, 'VEC4', 34962)
            at['WEIGHTS_0'], b = put(js, b, W, 5126, 'VEC4', 34962)
            print(f'{mesh.get("name")}: {len(idx)} tail vertices re-weighted onto {len(new)} tail bones')
    print('wrote', g.write(dst, js, bytes(b)), 'bytes')

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('dst'); ap.add_argument('--preset', default='bare')
    a = ap.parse_args(); rig(a.src, a.dst, a.preset)
