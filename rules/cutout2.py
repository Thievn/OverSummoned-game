"""White-background cutout for Grok art.
Removes near-white touching the border, plus enclosed white gaps larger than
`gap_min` pixels (holes between arms and body). Small white areas such as eye
highlights are kept. Halo is unmixed with colour-to-alpha. Optional max size."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def cutout(src, dst, gap_min=350, thresh=232, max_side=None, pad=4):
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    white = a.min(axis=2) > thresh
    lab, n = ndimage.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    if gap_min:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(n + 1))
        big = [i for i in range(1, n + 1) if i not in border and sizes[i] >= gap_min]
        if big:
            bg |= np.isin(lab, big)
    alpha = np.where(bg, 0.0, 1.0)
    band = ndimage.binary_dilation(bg, iterations=3) & ~bg
    light = a.min(axis=2) / 255.0
    edge = np.clip((1.0 - light) / 0.5, 0.0, 1.0)
    alpha = np.where(band, np.minimum(alpha, edge), alpha)
    al = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.where(band[..., None], np.clip((a - 255 * (1 - al)) / al, 0, 255), a)
    out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
    bb = out.getbbox()
    out = out.crop((max(bb[0] - pad, 0), max(bb[1] - pad, 0), min(bb[2] + pad, out.width), min(bb[3] + pad, out.height)))
    if max_side and max(out.size) > max_side:
        out.thumbnail((max_side, max_side), Image.LANCZOS)
    out.save(dst, optimize=True)
    return out.size

def slice_grid(src, out_prefix, names, gap_min=0, max_side=160):
    """Cut a white-background icon sheet into separate icons by connected blobs."""
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    ink = a.min(axis=2) < 232
    ink = ndimage.binary_closing(ink, iterations=6)
    lab, n = ndimage.label(ink)
    objs = ndimage.find_objects(lab)
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    blobs = sorted([(objs[i], sizes[i]) for i in range(n) if sizes[i] > 3000], key=lambda t: -t[1])[:len(names)]
    # order: rows top to bottom, then left to right
    blobs = sorted(blobs, key=lambda t: (round(((t[0][0].start + t[0][0].stop) / 2) / (im.height / 3)), (t[0][1].start + t[0][1].stop) / 2))
    res = []
    for (sl, _), name in zip(blobs, names):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        tile = im.crop((max(x0 - 6, 0), max(y0 - 6, 0), min(x1 + 6, im.width), min(y1 + 6, im.height)))
        # pad with white so the cutout sees a white border all round
        canvas = Image.new("RGB", (tile.width + 20, tile.height + 20), "white")
        canvas.paste(tile, (10, 10))
        tmp = "/tmp/_tile.png"
        canvas.save(tmp)
        res.append((name, cutout(tmp, f"{out_prefix}{name}.png", gap_min=gap_min, max_side=max_side)))
    return res

if __name__ == "__main__":
    print(cutout(sys.argv[1], sys.argv[2]))

def ink_edge(path, width=3, color=(16, 22, 42), erode=1):
    """Kill any leftover light halo and wrap the cutout in a solid dark ink line."""
    im = Image.open(path).convert("RGBA")
    pad = width + 2
    big = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    big.paste(im, (pad, pad))
    a = np.asarray(big).astype(np.float32)
    alpha = a[..., 3] / 255.0
    solid = alpha > 0.5
    if erode:
        solid = ndimage.binary_erosion(solid, iterations=erode)
    # pixels on the outer rim that are pale (halo) become transparent
    rim = solid & ~ndimage.binary_erosion(solid, iterations=2)
    pale = a[..., :3].min(axis=2) > 200
    solid = solid & ~(rim & pale)
    yy, xx = np.mgrid[-width:width + 1, -width:width + 1]
    disk = (xx ** 2 + yy ** 2) <= width ** 2
    outline = ndimage.binary_dilation(solid, structure=disk)
    out = np.zeros_like(a)
    out[outline] = [*color, 255]
    body = solid
    out[body] = a[body]
    out[body, 3] = 255
    # soft 1px anti-alias on the outer edge
    edge = ndimage.binary_dilation(outline, iterations=1) & ~outline
    out[edge] = [*color, 110]
    Image.fromarray(out.astype(np.uint8), "RGBA").save(path, optimize=True)

def strip_grey_fringe(path, light=165, sat=22, rounds=25):
    """Peel off light grey shadow pixels that touch transparency (cast shadows under objects)."""
    im = np.asarray(Image.open(path).convert("RGBA")).astype(np.int16)
    a = im[..., 3] > 20
    rgb = im[..., :3]
    greyish = (rgb.min(axis=2) > light) & ((rgb.max(axis=2) - rgb.min(axis=2)) < sat)
    for _ in range(rounds):
        edge = ndimage.binary_dilation(~a) & a & greyish
        if not edge.any():
            break
        a &= ~edge
    im[..., 3] = np.where(a, im[..., 3], 0)
    Image.fromarray(im.astype(np.uint8), "RGBA").save(path)
