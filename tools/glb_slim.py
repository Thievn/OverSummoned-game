"""Shrinks the textures inside a GLB without touching the mesh, the skeleton or the animations.
Meshy embeds 4K+ PNG maps, which is why a 25k-triangle Smudge weighs 35 MB. Here every image is resized and
re-encoded (colour as JPEG unless it has real transparency, data maps as JPEG too), and the binary chunk is rebuilt
with the same buffer layout rules glTF requires (4-byte alignment). Prints what it found.
  python3 tools/glb_slim.py in.glb out.glb [--color 2048] [--data 1024] [--drop-pbr]
--drop-pbr removes metallic/roughness maps (keeps the normal map), for a flatter, lighter look."""
import io, json, struct, sys, argparse
from PIL import Image

def read(path):
    b = open(path, 'rb').read()
    magic, ver, length = struct.unpack_from('<4sII', b, 0)
    assert magic == b'glTF' and ver == 2, 'not a GLB 2.0 file'
    off, js, bin_ = 12, None, b''
    while off < length:
        clen, ctype = struct.unpack_from('<I4s', b, off); data = b[off + 8: off + 8 + clen]; off += 8 + clen
        if ctype == b'JSON': js = json.loads(data)
        elif ctype == b'BIN\x00': bin_ = data
    return js, bin_

def write(path, js, bin_):
    j = json.dumps(js, separators=(',', ':')).encode()
    j += b' ' * (-len(j) % 4); bin_ += b'\x00' * (-len(bin_) % 4)
    out = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(j) + 8 + len(bin_))
    out += struct.pack('<I4s', len(j), b'JSON') + j + struct.pack('<I4s', len(bin_), b'BIN\x00') + bin_
    open(path, 'wb').write(out); return len(out)

def stats(js):
    tris = 0
    for m in js.get('meshes', []):
        for p in m['primitives']:
            if 'indices' in p: tris += js['accessors'][p['indices']]['count'] // 3
            else: tris += js['accessors'][p['attributes']['POSITION']]['count'] // 3
    return {'meshes': len(js.get('meshes', [])), 'triangles': tris, 'images': len(js.get('images', [])),
            'materials': len(js.get('materials', [])), 'skins': len(js.get('skins', [])),
            'joints': sum(len(s['joints']) for s in js.get('skins', [])), 'animations': [a.get('name') for a in js.get('animations', [])]}

def slim(src, dst, color=2048, data=1024, drop_pbr=False):
    js, bin_ = read(src)
    print('before', stats(js), f'{len(bin_)/1e6:.1f} MB binary')
    role = {}   # image index -> 'color' or 'data'
    for m in js.get('materials', []):
        pbr = m.get('pbrMetallicRoughness', {})
        for k, r in (('baseColorTexture', 'color'), ('emissiveTexture', 'color')):
            t = pbr.get(k) or m.get(k)
            if t: role[js['textures'][t['index']]['source']] = r
        for k in ('metallicRoughnessTexture',):
            t = pbr.get(k)
            if t:
                role.setdefault(js['textures'][t['index']]['source'], 'pbr')
                if drop_pbr: del pbr[k]; pbr['metallicFactor'] = 0.0; pbr['roughnessFactor'] = 0.85
        for k in ('normalTexture', 'occlusionTexture'):
            t = m.get(k)
            if t: role.setdefault(js['textures'][t['index']]['source'], 'data')
    views = js['bufferViews']; newdata = {}
    for i, img in enumerate(js.get('images', [])):
        if 'bufferView' not in img: continue
        v = views[img['bufferView']]; raw = bin_[v.get('byteOffset', 0): v.get('byteOffset', 0) + v['byteLength']]
        im = Image.open(io.BytesIO(raw)); r = role.get(i, 'data'); before = im.size
        cap = color if r == 'color' else data
        if r == 'pbr' and drop_pbr: im = im.resize((4, 4))
        elif max(im.size) > cap: im.thumbnail((cap, cap), Image.LANCZOS)
        alpha = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 250
        buf = io.BytesIO()
        if alpha: im.save(buf, 'PNG', optimize=True); img['mimeType'] = 'image/png'
        else: im.convert('RGB').save(buf, 'JPEG', quality=88 if r == 'color' else 82, optimize=True); img['mimeType'] = 'image/jpeg'
        newdata[img['bufferView']] = buf.getvalue()
        print(f'  image {i} {r}: {before} {len(raw)/1e6:.2f} MB -> {im.size} {len(newdata[img["bufferView"]])/1e6:.2f} MB')
    out = bytearray()
    for vi, v in enumerate(views):
        d = newdata.get(vi, bin_[v.get('byteOffset', 0): v.get('byteOffset', 0) + v['byteLength']])
        out += b'\x00' * (-len(out) % 4); v['byteOffset'] = len(out); v['byteLength'] = len(d); out += d
    js['buffers'][0]['byteLength'] = len(out)
    n = write(dst, js, bytes(out))
    print('after ', f'{n/1e6:.2f} MB file')
    return stats(js)

if __name__ == '__main__':
    a = argparse.ArgumentParser(); a.add_argument('src'); a.add_argument('dst')
    a.add_argument('--color', type=int, default=2048); a.add_argument('--data', type=int, default=1024); a.add_argument('--drop-pbr', action='store_true')
    o = a.parse_args(); slim(o.src, o.dst, o.color, o.data, o.drop_pbr)

def read_partial(head_path, tail_path, tail_start):
    """A GLB we only hold the start and the end of: JSON from the head, binary bytes from the tail."""
    b = open(head_path, 'rb').read()
    clen, _ = struct.unpack_from('<I4s', b, 12); js = json.loads(b[20:20 + clen]); bin0 = 20 + clen + 8
    tail = open(tail_path, 'rb').read()
    return js, bin0, tail, tail_start

def add_animations(dst_js, dst_bin, src_js, src_bin_at, rename=None):
    """Copies every animation in src into dst, matching target nodes by name. src_bin_at(offset, length) -> bytes."""
    by_name = {n.get('name'): i for i, n in enumerate(dst_js['nodes'])}
    out = bytearray(dst_bin); dst_js.setdefault('animations', []); added = []
    for a in src_js.get('animations', []):
        acc_map, chans, samps = {}, [], []
        def acc(i):
            if i in acc_map: return acc_map[i]
            A = dict(src_js['accessors'][i]); v = src_js['bufferViews'][A['bufferView']]
            data = src_bin_at(v.get('byteOffset', 0) + A.get('byteOffset', 0), A['count'] * {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[A['type']] * 4)
            out.extend(b'\x00' * (-len(out) % 4))
            dst_js['bufferViews'].append({'buffer': 0, 'byteOffset': len(out), 'byteLength': len(data)}); out.extend(data)
            A['bufferView'] = len(dst_js['bufferViews']) - 1; A.pop('byteOffset', None)
            dst_js['accessors'].append(A); acc_map[i] = len(dst_js['accessors']) - 1; return acc_map[i]
        for s in a['samplers']: samps.append({'input': acc(s['input']), 'output': acc(s['output']), 'interpolation': s.get('interpolation', 'LINEAR')})
        miss = 0
        for c in a['channels']:
            nm = src_js['nodes'][c['target']['node']].get('name')
            if nm not in by_name: miss += 1; continue
            chans.append({'sampler': c['sampler'], 'target': {'node': by_name[nm], 'path': c['target']['path']}})
        name = (rename or {}).get(a.get('name'), a.get('name'))
        dst_js['animations'].append({'name': name, 'channels': chans, 'samplers': samps}); added.append((name, len(chans), miss))
    dst_js['buffers'][0]['byteLength'] = len(out)
    return bytes(out), added
