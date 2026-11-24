#!/usr/bin/env python3
"""Chroma-key, anti-halo cleanup, rune generation, and composite preview."""
from __future__ import annotations

import math
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path("/workspace/oversummoned-godot")
RAW = ROOT / "raw"
ASSETS = ROOT / "assets"
CIRCLE = ASSETS / "circle"
HEROES = ASSETS / "heroes"
GEAR = ASSETS / "gear"
FX = ASSETS / "fx"
UI = ASSETS / "ui"

for p in (CIRCLE, HEROES, GEAR, FX, UI):
    p.mkdir(parents=True, exist_ok=True)


def load_rgb(path: Path) -> Image.Image:
    return Image.open(path).convert("RGB")


def is_chroma_green(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> np.ndarray:
    """True where the pixel is lime-screen green, not cyan armor trim or pink glow."""
    r = r.astype(np.float32)
    g = g.astype(np.float32)
    b = b.astype(np.float32)
    # Dominant lime: G clearly ahead of R and B (excludes cyan where G≈B).
    dominant = (g > 90) & (g > r * 1.28 + 8) & (g > b * 1.28 + 8)
    # Very bright lime even if slightly contaminated by JPEG.
    bright = (g > 190) & (r < 160) & (b < 160) & (g > r + 30) & (g > b + 30)
    # HSV-ish: hue near 120°, high sat, mid-high value.
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1.0), 0.0)
    # green-ish hue when G is the max channel
    hue_green = (g == mx) & (sat > 0.35) & (mx > 80) & ((g - r) > 20) & ((g - b) > 20)
    return dominant | bright | hue_green


def flood_from_edges(mask_bg: np.ndarray) -> np.ndarray:
    """Keep only background connected to the image border."""
    h, w = mask_bg.shape
    vis = np.zeros((h, w), dtype=np.uint8)
    stack = []
    for x in range(w):
        if mask_bg[0, x]:
            stack.append((0, x))
        if mask_bg[h - 1, x]:
            stack.append((h - 1, x))
    for y in range(h):
        if mask_bg[y, 0]:
            stack.append((y, 0))
        if mask_bg[y, w - 1]:
            stack.append((y, w - 1))
    while stack:
        y, x = stack.pop()
        if vis[y, x]:
            continue
        if not mask_bg[y, x]:
            continue
        vis[y, x] = 1
        if y > 0 and not vis[y - 1, x]:
            stack.append((y - 1, x))
        if y + 1 < h and not vis[y + 1, x]:
            stack.append((y + 1, x))
        if x > 0 and not vis[y, x - 1]:
            stack.append((y, x - 1))
        if x + 1 < w and not vis[y, x + 1]:
            stack.append((y, x + 1))
    return vis.astype(bool)


def chroma_key(im: Image.Image, keep_enclosed_holes: bool = True) -> Image.Image:
    rgb = np.array(im.convert("RGB"))
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    green = is_chroma_green(r, g, b)
    edge_bg = flood_from_edges(green)
    if keep_enclosed_holes:
        # Also punch fully-green interior holes (crown ring).
        bg = edge_bg | green
    else:
        bg = edge_bg

    # Soft alpha: 1 = keep, 0 = drop. Feather based on how green it is.
    g_f = g.astype(np.float32)
    r_f = r.astype(np.float32)
    b_f = b.astype(np.float32)
    green_score = np.clip((g_f - np.maximum(r_f, b_f) - 10.0) / 70.0, 0.0, 1.0)
    alpha = np.where(bg, (1.0 - green_score) * 255.0, 255.0)
    # Hard-drop strong screen green.
    alpha = np.where(green & (green_score > 0.55), 0.0, alpha)
    alpha = np.where(edge_bg & (green_score > 0.25), np.minimum(alpha, (1.0 - green_score) * 180.0), alpha)

    # Clean tiny speckles with a light max/min on alpha.
    a_img = Image.fromarray(alpha.astype(np.uint8), "L")
    a_img = a_img.filter(ImageFilter.MedianFilter(size=3))
    # Slight contract so JPEG leftovers vanish, then tiny blur for AA.
    a = np.array(a_img).astype(np.float32)
    a = np.clip((a - 18.0) * (255.0 / 220.0), 0, 255)
    a_img = Image.fromarray(a.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(radius=0.6))
    a = np.array(a_img).astype(np.float32)
    # Re-clip near zero
    a = np.where(a < 12, 0, a)

    # Despill: pull leftover green toward the neighbor color on semi-transparent edges.
    max_rb = np.maximum(r_f, b_f)
    excess = np.clip(g_f - max_rb, 0, 255)
    edge = (a > 8) & (a < 250)
    g_f = np.where(edge, g_f - excess * 0.92, g_f)
    # Also despill any remaining green-tinted opaque fringe near the cut.
    near = (a >= 250) & (excess > 12) & green
    g_f = np.where(near, max_rb + 4, g_f)
    g_f = np.clip(g_f, 0, 255)

    out = np.dstack([r_f, g_f, b_f, a]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def tight_crop(im: Image.Image, pad: int = 16, min_alpha: int = 12) -> Image.Image:
    a = np.array(im.split()[-1])
    ys, xs = np.where(a >= min_alpha)
    if len(xs) == 0:
        return im
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad)
    y1 = min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def place_on_canvas(im: Image.Image, size: int, anchor: str = "center", anchor_xy: tuple[float, float] | None = None) -> Image.Image:
    """Paste im onto a transparent square. anchor_xy is a point in im coords that should land on the canvas center."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if anchor_xy is not None:
        cx, cy = size // 2, size // 2
        x = int(round(cx - anchor_xy[0]))
        y = int(round(cy - anchor_xy[1]))
        canvas.alpha_composite(im, (x, y))
        return canvas
    if anchor == "center":
        x = (size - im.width) // 2
        y = (size - im.height) // 2
    elif anchor == "feet":
        x = (size - im.width) // 2
        y = size - im.height - max(8, size // 40)
    else:
        x = (size - im.width) // 2
        y = (size - im.height) // 2
    canvas.alpha_composite(im, (x, y))
    return canvas


def bbox(im: Image.Image, min_alpha: int = 12) -> tuple[int, int, int, int]:
    a = np.array(im.split()[-1])
    ys, xs = np.where(a >= min_alpha)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def hat_anchor(im: Image.Image) -> tuple[float, float]:
    """Point that should sit on the head: horizontal center, near the bottom opening of the hat."""
    x0, y0, x1, y1 = bbox(im)
    ax = (x0 + x1) / 2.0
    # Sit slightly above the visual bottom so the brim hangs over the head.
    ay = y0 + (y1 - y0) * 0.78
    return ax, ay


def crown_anchor(im: Image.Image) -> tuple[float, float]:
    x0, y0, x1, y1 = bbox(im)
    ax = (x0 + x1) / 2.0
    ay = y0 + (y1 - y0) * 0.72
    return ax, ay


def visor_anchor(im: Image.Image) -> tuple[float, float]:
    x0, y0, x1, y1 = bbox(im)
    ax = (x0 + x1) / 2.0
    ay = y0 + (y1 - y0) * 0.55
    return ax, ay


def weapon_anchor(im: Image.Image) -> tuple[float, float]:
    """Grip: follow the main axis and sit ~18% from the handle end (darker / lower)."""
    a = np.array(im.split()[-1])
    ys, xs = np.where(a >= 20)
    # The handle is the end closest to the bottom of the image for these diagonals.
    # Use the 8th percentile of y+x (lower-left-ish) vs y-x depending on orientation.
    pts = np.column_stack([xs, ys])
    # Find the two farthest points (tips of the weapon).
    # Approximate: min and max of projection on the principal axis.
    cov = np.cov(pts.astype(np.float64), rowvar=False)
    eigvals, eigvecs = np.linalg.eigh(cov)
    axis = eigvecs[:, int(np.argmax(eigvals))]
    proj = pts.astype(np.float64) @ axis
    p_min = pts[int(np.argmin(proj))]
    p_max = pts[int(np.argmax(proj))]
    # Handle is the tip with larger y (lower on the image).
    handle = p_min if p_min[1] > p_max[1] else p_max
    tip = p_max if handle is p_min else p_min
    t = 0.16
    ax = handle[0] * (1 - t) + tip[0] * t
    ay = handle[1] * (1 - t) + tip[1] * t
    return float(ax), float(ay)


def relic_anchor(im: Image.Image) -> tuple[float, float]:
    x0, y0, x1, y1 = bbox(im)
    return (x0 + x1) / 2.0, (y0 + y1) / 2.0


def process_one(src: Path, dest: Path, kind: str, canvas: int | None, flip: bool = False) -> Image.Image:
    im = chroma_key(load_rgb(src), keep_enclosed_holes=True)
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    im = tight_crop(im, pad=8)
    if canvas:
        if kind == "hat":
            anc = hat_anchor(im)
        elif kind == "crown":
            anc = crown_anchor(im)
        elif kind == "visor":
            anc = visor_anchor(im)
        elif kind == "weapon":
            anc = weapon_anchor(im)
        elif kind == "relic":
            anc = relic_anchor(im)
        elif kind == "hero":
            # Keep feet near bottom, horizontally centered on bbox.
            x0, y0, x1, y1 = bbox(im)
            feet_x = (x0 + x1) / 2.0
            feet_y = y1 - 4
            # Place feet at lower-center of canvas.
            c = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
            # feet should land at (canvas/2, canvas - pad)
            pad = int(canvas * 0.06)
            x = int(round(canvas / 2.0 - feet_x))
            y = int(round((canvas - pad) - feet_y))
            c.alpha_composite(im, (x, y))
            im = c
            im.save(dest, "PNG", optimize=True)
            print(f"saved {dest.name} {im.size} hero feet→({canvas/2:.0f},{canvas-pad})")
            return im
        elif kind == "pedestal":
            anc = relic_anchor(im)
        else:
            anc = relic_anchor(im)
        im = place_on_canvas(im, canvas, anchor_xy=anc)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True)
    print(f"saved {dest} {im.size} kind={kind}")
    return im


# -------------------- rune / fx generation --------------------

def _aa_circle(draw_buf: Image.Image, cx, cy, r, fill, width=0):
    draw = ImageDraw.Draw(draw_buf)
    if width:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=fill, width=width)
    else:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)


def make_rune_ring(path: Path, size: int, inner_ratio: float, outer_ratio: float, ticks: int, style: str) -> None:
    scale = 4
    S = size * scale
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = cy = S / 2
    r0 = S * inner_ratio / 2
    r1 = S * outer_ratio / 2

    # Soft outer glow
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i, a in enumerate((28, 18, 10)):
        rr = r1 + (18 - i * 4) * scale
        gd.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=(255, 220, 140, a), width=8 * scale)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=10 * scale / 4))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # Main bands
    bands = [
        (r1, 7 * scale, (255, 236, 180, 255)),
        (r1 * 0.92, 3 * scale, (255, 200, 90, 230)),
        (r0, 6 * scale, (255, 230, 170, 255)),
        (r0 * 1.08, 2 * scale, (255, 180, 80, 200)),
    ]
    if style == "inner":
        bands.append((r0 * 1.35, 2 * scale, (255, 210, 120, 210)))
        bands.append(((r0 + r1) / 2, 2 * scale, (255, 240, 200, 180)))
    else:
        mid = (r0 + r1) / 2
        bands.append((mid, 3 * scale, (255, 215, 110, 230)))
        bands.append((mid * 1.12, 2 * scale, (255, 245, 200, 160)))
        bands.append((r1 * 0.78, 2 * scale, (255, 190, 90, 200)))

    for rr, w, col in bands:
        draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=col, width=max(1, int(w)))

    # Rune ticks / sigils around the ring
    mid_r = (r0 + r1) / 2
    rng = np.random.default_rng(42 if style == "outer" else 99)
    for i in range(ticks):
        ang = (2 * math.pi * i / ticks) - math.pi / 2
        # skip some for irregular ancient look
        kind = i % 7
        ca, sa = math.cos(ang), math.sin(ang)
        # radial tick
        x1 = cx + math.cos(ang) * (r0 + 6 * scale)
        y1 = cy + math.sin(ang) * (r0 + 6 * scale)
        x2 = cx + math.cos(ang) * (r1 - 6 * scale)
        y2 = cy + math.sin(ang) * (r1 - 6 * scale)
        col = (255, 230, 160, 240)
        if kind == 0:
            # triangle sigil
            w = 10 * scale
            p1 = (cx + ca * (mid_r + w), cy + sa * (mid_r + w))
            p2 = (cx + ca * (mid_r - w) - sa * w * 0.7, cy + sa * (mid_r - w) + ca * w * 0.7)
            p3 = (cx + ca * (mid_r - w) + sa * w * 0.7, cy + sa * (mid_r - w) - ca * w * 0.7)
            draw.polygon([p1, p2, p3], outline=col)
        elif kind == 1:
            # diamond
            w = 8 * scale
            pts = [
                (cx + ca * (mid_r + w), cy + sa * (mid_r + w)),
                (cx + ca * mid_r - sa * w, cy + sa * mid_r + ca * w),
                (cx + ca * (mid_r - w), cy + sa * (mid_r - w)),
                (cx + ca * mid_r + sa * w, cy + sa * mid_r - ca * w),
            ]
            draw.polygon(pts, outline=col)
        elif kind == 2:
            # small filled circle
            rr = 5 * scale
            px, py = cx + ca * mid_r, cy + sa * mid_r
            draw.ellipse((px - rr, py - rr, px + rr, py + rr), outline=col, width=2 * scale)
        elif kind == 3:
            # chevron
            w = 9 * scale
            p1 = (cx + ca * (mid_r - w) - sa * w, cy + sa * (mid_r - w) + ca * w)
            p2 = (cx + ca * (mid_r + w), cy + sa * (mid_r + w))
            p3 = (cx + ca * (mid_r - w) + sa * w, cy + sa * (mid_r - w) - ca * w)
            draw.line([p1, p2, p3], fill=col, width=2 * scale)
        elif kind == 4:
            # rune bar + cross
            draw.line([(x1, y1), (x2, y2)], fill=col, width=2 * scale)
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            w = 6 * scale
            draw.line([(mx - sa * w, my + ca * w), (mx + sa * w, my - ca * w)], fill=col, width=2 * scale)
        else:
            draw.line([(x1, y1), (x2, y2)], fill=col, width=max(2, int(1.8 * scale)))

    # Inner geometric star / seal for inner ring
    if style == "inner":
        pts = []
        n = 8
        for i in range(n * 2):
            ang = 2 * math.pi * i / (n * 2) - math.pi / 2
            rr = r0 * (0.55 if i % 2 == 0 else 0.22)
            pts.append((cx + math.cos(ang) * rr, cy + math.sin(ang) * rr))
        draw.polygon(pts, outline=(255, 236, 190, 230))
        draw.ellipse((cx - r0 * 0.18, cy - r0 * 0.18, cx + r0 * 0.18, cy + r0 * 0.18), outline=(255, 220, 140, 230), width=2 * scale)
    else:
        # outer ring: tiny runic "letters" as short broken arcs
        for i in range(24):
            ang0 = 2 * math.pi * i / 24
            for k in range(3):
                a0 = ang0 + k * 0.04
                a1 = a0 + 0.07
                rr = r1 * 0.86
                p0 = (cx + math.cos(a0) * rr, cy + math.sin(a0) * rr)
                p1 = (cx + math.cos(a1) * rr, cy + math.sin(a1) * rr)
                draw.line([p0, p1], fill=(255, 240, 200, 200), width=2 * scale)

    img = img.resize((size, size), Image.Resampling.LANCZOS)
    # Crush near-zero noise
    arr = np.array(img)
    arr[:, :, 3] = np.where(arr[:, :, 3] < 8, 0, arr[:, :, 3])
    Image.fromarray(arr, "RGBA").save(path, "PNG", optimize=True)
    print(f"saved {path} {size}x{size}")


def make_glow_orb(path: Path, size: int = 512) -> None:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx = cy = size / 2
    arr = np.zeros((size, size, 4), dtype=np.float32)
    yy, xx = np.mgrid[0:size, 0:size]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (size / 2)
    # Core
    core = np.clip(1.0 - d / 0.22, 0, 1) ** 0.6
    mid = np.clip(1.0 - d / 0.55, 0, 1) ** 1.4
    halo = np.clip(1.0 - d / 0.98, 0, 1) ** 2.4
    arr[:, :, 0] = 255 * (0.6 * halo + 0.9 * mid + 1.0 * core)
    arr[:, :, 1] = 255 * (0.35 * halo + 0.7 * mid + 1.0 * core)
    arr[:, :, 2] = 255 * (0.55 * halo + 0.85 * mid + 1.0 * core)
    arr[:, :, 3] = 255 * (0.28 * halo + 0.45 * mid + 0.7 * core)
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    Image.fromarray(arr, "RGBA").save(path, "PNG", optimize=True)
    print(f"saved {path}")


def make_beam(path: Path, w=128, h=768) -> None:
    arr = np.zeros((h, w, 4), dtype=np.float32)
    cx = w / 2
    xx = np.arange(w)[None, :]
    yy = np.arange(h)[:, None]
    dx = np.abs(xx - cx) / (w / 2)
    # brighter at bottom (source) and along the center
    along = 1.0 - (yy / h) * 0.55
    core = np.clip(1.0 - dx / 0.18, 0, 1) ** 0.7 * along
    mid = np.clip(1.0 - dx / 0.55, 0, 1) ** 1.6 * along
    halo = np.clip(1.0 - dx / 1.0, 0, 1) ** 2.2 * along
    arr[:, :, 0] = 255 * (0.7 * halo + 0.95 * mid + 1.0 * core)
    arr[:, :, 1] = 255 * (0.4 * halo + 0.75 * mid + 1.0 * core)
    arr[:, :, 2] = 255 * (0.85 * halo + 0.9 * mid + 1.0 * core)
    arr[:, :, 3] = 255 * (0.2 * halo + 0.45 * mid + 0.85 * core)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA").save(path, "PNG", optimize=True)
    print(f"saved {path}")


def make_shockwave(path: Path, size=768) -> None:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = cy = size / 2
    r = size * 0.42
    for i, (w, a) in enumerate(((18, 40), (10, 90), (5, 180), (2, 230))):
        rr = r
        col = (255, 230, 180, a)
        draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=col, width=w)
    img = img.filter(ImageFilter.GaussianBlur(radius=2.5))
    # punch a hole so it's a ring
    arr = np.array(img)
    yy, xx = np.mgrid[0:size, 0:size]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    arr[:, :, 3] = np.where(d < r * 0.72, (arr[:, :, 3] * 0.05).astype(np.uint8), arr[:, :, 3])
    Image.fromarray(arr, "RGBA").save(path, "PNG", optimize=True)
    print(f"saved {path}")


def make_sunburst(path: Path, size=768) -> None:
    arr = np.zeros((size, size, 4), dtype=np.float32)
    cx = cy = size / 2
    yy, xx = np.mgrid[0:size, 0:size]
    ang = np.arctan2(yy - cy, xx - cx)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (size / 2)
    rays = (np.cos(ang * 12) * 0.5 + 0.5) ** 1.6
    fall = np.clip(1.0 - d, 0, 1) ** 1.15
    v = rays * fall
    arr[:, :, 0] = 255
    arr[:, :, 1] = 230 * fall + 25
    arr[:, :, 2] = 140 * fall + 20
    arr[:, :, 3] = 255 * np.clip(v * 0.85, 0, 1)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA").save(path, "PNG", optimize=True)
    print(f"saved {path}")


def make_spark(path: Path, size=64) -> None:
    arr = np.zeros((size, size, 4), dtype=np.float32)
    cx = cy = size / 2
    yy, xx = np.mgrid[0:size, 0:size]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (size / 2)
    # plus-shaped spark
    cross = np.maximum(np.clip(1 - np.abs(xx - cx) / 2.2, 0, 1) * np.clip(1 - d, 0, 1),
                       np.clip(1 - np.abs(yy - cy) / 2.2, 0, 1) * np.clip(1 - d, 0, 1))
    core = np.clip(1 - d / 0.35, 0, 1) ** 0.6
    v = np.clip(cross + core, 0, 1)
    arr[:, :, 0] = 255
    arr[:, :, 1] = 240
    arr[:, :, 2] = 200
    arr[:, :, 3] = 255 * v
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA").save(path, "PNG", optimize=True)
    print(f"saved {path}")


def make_particle(path: Path, size=32) -> None:
    arr = np.zeros((size, size, 4), dtype=np.float32)
    cx = cy = size / 2
    yy, xx = np.mgrid[0:size, 0:size]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (size / 2)
    v = np.clip(1 - d, 0, 1) ** 1.2
    arr[:, :, 0] = 255
    arr[:, :, 1] = 230
    arr[:, :, 2] = 160
    arr[:, :, 3] = 255 * v
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA").save(path, "PNG", optimize=True)
    print(f"saved {path}")


def make_icon(hero: Image.Image, dest: Path, size=256) -> None:
    # Crop the head/torso of the apprentice for a square icon on a dark circle.
    a = np.array(hero.split()[-1])
    ys, xs = np.where(a >= 20)
    x0, x1 = xs.min(), xs.max() + 1
    y0, y1 = ys.min(), ys.max() + 1
    # top 58% of the character
    y_cut = y0 + int((y1 - y0) * 0.58)
    head = hero.crop((x0, y0, x1, y_cut))
    # scale to fit
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # dark plum circle
    d = ImageDraw.Draw(canvas)
    d.ellipse((4, 4, size - 5, size - 5), fill=(28, 18, 40, 255), outline=(240, 190, 80, 255), width=6)
    head = head.copy()
    # scale
    max_side = int(size * 0.86)
    scale = min(max_side / head.width, max_side / head.height)
    nw, nh = int(head.width * scale), int(head.height * scale)
    head = head.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.alpha_composite(head, ((size - nw) // 2, (size - nh) // 2 + 8))
    canvas.save(dest, "PNG", optimize=True)
    print(f"saved {dest}")


def composite_preview(paths: dict, dest: Path) -> dict:
    """Compose apprentice + pedestal + rings + pirate hat + neon blade + rift crystal.
    Returns measured socket offsets (in hero-canvas pixels) for Godot.
    """
    ped = Image.open(paths["pedestal"]).convert("RGBA")
    ring_o = Image.open(paths["rune_outer"]).convert("RGBA")
    ring_i = Image.open(paths["rune_inner"]).convert("RGBA")
    glow = Image.open(paths["glow_orb"]).convert("RGBA")
    hero = Image.open(paths["apprentice"]).convert("RGBA")
    hat = Image.open(paths["hat"]).convert("RGBA")
    blade = Image.open(paths["blade"]).convert("RGBA")
    crystal = Image.open(paths["crystal"]).convert("RGBA")

    W, H = 1100, 1100
    # Dark checker so we can see any leftover fringe
    bg = Image.new("RGBA", (W, H), (18, 20, 28, 255))
    tile = 24
    d = ImageDraw.Draw(bg)
    for y in range(0, H, tile):
        for x in range(0, W, tile):
            if (x // tile + y // tile) % 2 == 0:
                d.rectangle((x, y, x + tile, y + tile), fill=(24, 26, 36, 255))

    # Layout: pedestal near bottom-center
    ped_w = 620
    ped_h = int(ped.height * (ped_w / ped.width))
    ped_r = ped.resize((ped_w, ped_h), Image.Resampling.LANCZOS)
    ped_x = (W - ped_w) // 2
    ped_y = 430
    # Rings sit on the top face of the pedestal. The top face is the inner dark ellipse
    # in the upper portion of the pedestal art.
    ring_size = 430
    ro = ring_o.resize((ring_size, ring_size), Image.Resampling.LANCZOS)
    ri = ring_i.resize((int(ring_size * 0.62), int(ring_size * 0.62)), Image.Resampling.LANCZOS)
    gl = glow.resize((300, 300), Image.Resampling.LANCZOS)
    # Pedestal top-center empirically: a bit above the vertical center of the sprite.
    ring_cx = ped_x + ped_w // 2
    ring_cy = ped_y + int(ped_h * 0.30)

    bg.alpha_composite(ped_r, (ped_x, ped_y))
    bg.alpha_composite(gl, (ring_cx - 150, ring_cy - 150))
    bg.alpha_composite(ro, (ring_cx - ring_size // 2, ring_cy - ring_size // 2))
    bg.alpha_composite(ri, (ring_cx - ri.width // 2, ring_cy - ri.height // 2))

    # Hero: feet on the pedestal platform (center of the top disc).
    hero_h = 520
    hero_w = int(hero.width * (hero_h / hero.height))
    hero_r = hero.resize((hero_w, hero_h), Image.Resampling.LANCZOS)
    # Feet are near the bottom of the hero canvas (we placed them there).
    feet_local = (hero_w / 2.0, hero_h * 0.94)
    hero_x = int(ring_cx - feet_local[0])
    hero_y = int(ring_cy - 8 - feet_local[1] + 90)  # stand slightly in front / on the stone
    # tweak: feet should rest on the stone, a little below ring center toward us
    hero_y = int(ped_y + ped_h * 0.22 - feet_local[1] + 40)
    bg.alpha_composite(hero_r, (hero_x, hero_y))

    # Analyze hero alpha to estimate hat / hand sockets in this composited scale.
    ha = np.array(hero_r.split()[-1])
    ys, xs = np.where(ha >= 30)
    hx0, hx1 = int(xs.min()), int(xs.max())
    hy0, hy1 = int(ys.min()), int(ys.max())
    # Hat: top of the silhouette, slightly down
    hat_sx = (hx0 + hx1) / 2.0
    hat_sy = hy0 + (hy1 - hy0) * 0.10
    # Raised hand is the leftmost bulge in the upper-middle of the sprite.
    # Scan left edge of opaque pixels in the upper 45%.
    band = ha[hy0:hy0 + int((hy1 - hy0) * 0.55), :]
    # leftmost column with opaque, then its vertical centroid
    cols = np.where(band.max(axis=0) >= 30)[0]
    left_x = int(cols.min()) if len(cols) else hx0
    col_ys = np.where(band[:, left_x:left_x + 18].max(axis=1) >= 30)[0]
    hand_y = hy0 + (int(col_ys.mean()) if len(col_ys) else 80)
    hand_x = left_x + 22

    # Relic floats to the right of the character
    relic_x = hx1 - 10
    relic_y = hy0 + (hy1 - hy0) * 0.45

    hat_s = 210
    hat_r = hat.resize((hat_s, hat_s), Image.Resampling.LANCZOS)
    # hat PNG is already anchored at center
    bg.alpha_composite(hat_r, (hero_x + int(hat_sx) - hat_s // 2, hero_y + int(hat_sy) - hat_s // 2))

    blade_s = 260
    blade_r = blade.resize((blade_s, blade_s), Image.Resampling.LANCZOS)
    bg.alpha_composite(blade_r, (hero_x + int(hand_x) - blade_s // 2, hero_y + int(hand_y) - blade_s // 2))

    cry_s = 110
    cry_r = crystal.resize((cry_s, cry_s), Image.Resampling.LANCZOS)
    bg.alpha_composite(cry_r, (hero_x + int(relic_x) - cry_s // 2, hero_y + int(relic_y) - cry_s // 2))

    # Caption
    d = ImageDraw.Draw(bg)
    label = "OverSummoned  ·  socket alignment preview  ·  hat + neon blade + rift crystal"
    d.rectangle((40, 30, 1060, 88), fill=(12, 14, 20, 220), outline=(240, 190, 80, 180), width=2)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    except Exception:
        font = ImageFont.load_default()
    d.text((60, 48), label, fill=(255, 236, 200, 255), font=font)

    # Mark sockets with tiny crosses (for our eyes only)
    def cross(px, py, col=(0, 255, 180, 220)):
        d.line((px - 8, py, px + 8, py), fill=col, width=2)
        d.line((px, py - 8, px, py + 8), fill=col, width=2)

    cross(hero_x + hat_sx, hero_y + hat_sy, (255, 220, 80, 220))
    cross(hero_x + hand_x, hero_y + hand_y, (80, 220, 255, 220))
    cross(hero_x + relic_x, hero_y + relic_y, (255, 80, 200, 220))

    bg.save(dest, "PNG", optimize=True)
    print(f"saved composite {dest}")

    # Socket offsets as fractions of the hero canvas (1024) so Godot can use them.
    # hero_r is a scaled version of the 1024 canvas.
    sx = 1024 / hero_w
    sy = 1024 / hero_h
    sockets = {
        "apprentice": {
            "hat": [round(hat_sx * sx, 1), round(hat_sy * sy, 1)],
            "weapon": [round(hand_x * sx, 1), round(hand_y * sy, 1)],
            "relic": [round(relic_x * sx, 1), round(relic_y * sy, 1)],
        }
    }
    return sockets


def main() -> None:
    jobs = [
        (RAW / "pedestal_raw.jpg", CIRCLE / "pedestal.png", "pedestal", 1024, False),
        (RAW / "apprentice_idle_raw.jpg", HEROES / "apprentice_idle.png", "hero", 1024, False),
        (RAW / "apprentice_react_raw.jpg", HEROES / "apprentice_react.png", "hero", 1024, False),
        (RAW / "cyber_knight_idle_raw.jpg", HEROES / "cyber_knight_idle.png", "hero", 1024, False),
        (RAW / "hat_pirate_raw.jpg", GEAR / "hat_pirate.png", "hat", 512, False),
        (RAW / "hat_visor_raw.jpg", GEAR / "hat_visor.png", "visor", 512, False),
        (RAW / "hat_crown_raw.jpg", GEAR / "hat_crown.png", "crown", 512, False),
        # Flip weapons so the blade/orb extends up-left, away from the body,
        # matching the raised right hand on the left side of the hero sprite.
        (RAW / "weapon_neon_blade_raw.jpg", GEAR / "weapon_neon_blade.png", "weapon", 512, True),
        (RAW / "weapon_club_raw.jpg", GEAR / "weapon_club.png", "weapon", 512, True),
        (RAW / "weapon_staff_raw.jpg", GEAR / "weapon_staff.png", "weapon", 512, True),
        (RAW / "relic_rift_crystal_raw.jpg", GEAR / "relic_rift_crystal.png", "relic", 512, False),
        (RAW / "relic_ledger_raw.jpg", GEAR / "relic_ledger.png", "relic", 512, False),
        (RAW / "relic_lantern_raw.jpg", GEAR / "relic_lantern.png", "relic", 512, False),
    ]
    for src, dest, kind, canvas, flip in jobs:
        process_one(src, dest, kind, canvas, flip=flip)

    make_rune_ring(CIRCLE / "rune_outer.png", 1024, 0.62, 0.96, 32, "outer")
    make_rune_ring(CIRCLE / "rune_inner.png", 1024, 0.28, 0.70, 20, "inner")
    make_glow_orb(CIRCLE / "glow_orb.png", 512)
    make_beam(FX / "rift_beam.png")
    make_shockwave(FX / "shockwave.png")
    make_sunburst(FX / "sunburst.png")
    make_spark(FX / "spark.png")
    make_particle(FX / "particle.png")

    hero = Image.open(HEROES / "apprentice_idle.png")
    make_icon(hero, ROOT / "icon.png", 256)
    make_icon(hero, UI / "icon.png", 256)

    sockets = composite_preview(
        {
            "pedestal": CIRCLE / "pedestal.png",
            "rune_outer": CIRCLE / "rune_outer.png",
            "rune_inner": CIRCLE / "rune_inner.png",
            "glow_orb": CIRCLE / "glow_orb.png",
            "apprentice": HEROES / "apprentice_idle.png",
            "hat": GEAR / "hat_pirate.png",
            "blade": GEAR / "weapon_neon_blade.png",
            "crystal": GEAR / "relic_rift_crystal.png",
        },
        ROOT / "preview_composite.png",
    )
    import json
    (ROOT / "data" / "sockets_guess.json").write_text(json.dumps(sockets, indent=2))
    print("sockets", sockets)


if __name__ == "__main__":
    main()
