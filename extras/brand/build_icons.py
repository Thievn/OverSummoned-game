#!/usr/bin/env python3
"""Build four OverSummoned brand icon mockups: 1024 profile pics, favicons, comparison sheet."""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageEnhance, ImageFont

ROOT = Path("/workspace/oversummoned-brand")
SRC = ROOT / "src"
OUT_SIZE = 1024
SS = 2  # supersample factor for the master
MASTER = OUT_SIZE * SS  # 2048

# Palette from mocks.css + gold crown
BG = (7, 4, 13, 255)
BG2 = (13, 7, 24, 255)
PANEL = (19, 10, 36, 255)
PANEL2 = (26, 15, 49, 255)
PINK = (255, 46, 138)
CYAN = (54, 214, 255)
VIOLET = (155, 92, 255)
LIME = (198, 255, 61)
GOLD_HI = (255, 241, 191)
GOLD = (233, 194, 106)
GOLD_MID = (185, 130, 47)
GOLD_DK = (110, 68, 19)
RUBY = (158, 27, 27)
STROKE = (30, 18, 8)
INK = (243, 236, 255)
PEARL = (244, 230, 200)


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def trim(im: Image.Image, pad: int = 0) -> Image.Image:
    b = im.split()[-1].getbbox()
    if not b:
        return im
    if pad:
        b = (max(0, b[0] - pad), max(0, b[1] - pad), min(im.size[0], b[2] + pad), min(im.size[1], b[3] + pad))
    return im.crop(b)


def scale_to_width(im: Image.Image, width: int) -> Image.Image:
    w, h = im.size
    nh = max(1, round(h * (width / w)))
    return im.resize((width, nh), Image.Resampling.LANCZOS)


def scale_to_height(im: Image.Image, height: int) -> Image.Image:
    w, h = im.size
    nw = max(1, round(w * (height / h)))
    return im.resize((nw, height), Image.Resampling.LANCZOS)


def paste(base: Image.Image, layer: Image.Image, xy, center=False) -> None:
    x, y = xy
    if center:
        x -= layer.size[0] // 2
        y -= layer.size[1] // 2
    if layer.mode != "RGBA":
        layer = layer.convert("RGBA")
    base.alpha_composite(layer, (int(x), int(y)))


def radial_background(size: int) -> Image.Image:
    """Deep Aldermere night: violet bloom upper-right, pink ember lower-left."""
    import numpy as np
    yy, xx = np.mgrid[0:size, 0:size]
    t = yy / max(size - 1, 1)
    r = 7 + (18 - 7) * t * 0.5
    g = 4 + (10 - 4) * t * 0.4
    b = 13 + (36 - 13) * t * 0.45
    dx, dy = (xx - size * 0.62) / size, (yy - size * 0.28) / size
    v = np.exp(-(dx * dx * 4.2 + dy * dy * 5.5))
    dx2, dy2 = (xx - size * 0.28) / size, (yy - size * 0.78) / size
    p = np.exp(-(dx2 * dx2 * 5.0 + dy2 * dy2 * 6.5))
    dx3, dy3 = (xx - size * 0.50) / size, (yy - size * 0.46) / size
    c = np.exp(-(dx3 * dx3 * 7 + dy3 * dy3 * 7))
    r = np.clip(r + 155 * v * 0.28 + 255 * p * 0.16 + 30 * c, 0, 255)
    g = np.clip(g + 92 * v * 0.18 + 46 * p * 0.08 + 12 * c, 0, 255)
    b = np.clip(b + 255 * v * 0.32 + 138 * p * 0.14 + 40 * c, 0, 255)
    arr = np.dstack([r, g, b, np.full_like(r, 255)]).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def add_grain(im: Image.Image, amount: float = 0.035, seed: int = 7) -> Image.Image:
    import numpy as np
    w, h = im.size
    rng = np.random.default_rng(seed)
    noise = (rng.integers(0, 256, (h, w), dtype=np.uint8))
    noise_im = Image.fromarray(noise, "L").filter(ImageFilter.GaussianBlur(0.4))
    v = np.array(noise_im)
    alpha = np.full((h, w), int(amount * 255), dtype=np.uint8)
    overlay = np.dstack([v, v, v, alpha])
    out = Image.alpha_composite(im, Image.fromarray(overlay, "RGBA"))
    return out


def glow_layer(size, center, radius, color, alpha, blur) -> Image.Image:
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = center
    r = radius
    col = (*color[:3], int(alpha))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=col)
    if blur > 0:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return layer


def ring_glow(size, center, inner, outer, color, alpha, blur) -> Image.Image:
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = center
    col = (*color[:3], int(alpha))
    d.ellipse((cx - outer, cy - outer, cx + outer, cy + outer), fill=col)
    # cut hole
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((cx - inner, cy - inner, cx + inner, cy + inner), fill=255)
    # punch
    clear = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    layer = Image.composite(clear, layer, mask)
    if blur > 0:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return layer


def draw_circle_stroke(draw, center, radius, color, width, dashed=None, start=0.0):
    cx, cy = center
    if not dashed:
        draw.ellipse(
            (cx - radius, cy - radius, cx + radius, cy + radius),
            outline=color,
            width=width,
        )
        return
    # dashed arc: dashed = (on_frac, off_frac) in radians-ish via segments
    on, off = dashed
    segs = 72
    step = 2 * math.pi / segs
    # use many small chords, skip off portions
    period = on + off
    pts_on = []
    for i in range(segs + 1):
        ang = start + i * step
        phase = (ang) % period
        x = cx + radius * math.cos(ang)
        y = cy + radius * math.sin(ang)
        if phase < on:
            pts_on.append((x, y))
        else:
            if len(pts_on) >= 2:
                draw.line(pts_on, fill=color, width=width, joint="curve")
            pts_on = []
    if len(pts_on) >= 2:
        draw.line(pts_on, fill=color, width=width, joint="curve")


def rounded_rect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def fit_in_circle_preview(im: Image.Image, size: int) -> Image.Image:
    """Circle-crop a square image to `size`."""
    src = im.resize((size, size), Image.Resampling.LANCZOS) if im.size != (size, size) else im.copy()
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(src, (0, 0))
    out.putalpha(mask)
    return out


def shadow_for(im: Image.Image, blur=18, opacity=140, offset=(0, 10), color=(0, 0, 0)) -> Image.Image:
    a = im.split()[-1].point(lambda p: int(p * opacity / 255))
    sh = Image.new("RGBA", im.size, (*color, 0))
    sh.putalpha(a)
    # expand canvas for blur + offset
    pad = blur * 3 + max(abs(offset[0]), abs(offset[1]))
    canvas = Image.new("RGBA", (im.size[0] + pad * 2, im.size[1] + pad * 2), (0, 0, 0, 0))
    canvas.paste(sh, (pad + offset[0], pad + offset[1]), sh)
    canvas = canvas.filter(ImageFilter.GaussianBlur(blur))
    return canvas, pad


def composite_with_shadow(base, im, center, blur=22, opacity=160, offset=(0, 14), color=(0, 0, 0)):
    sh, pad = shadow_for(im, blur=blur, opacity=opacity, offset=offset, color=color)
    cx, cy = center
    paste(base, sh, (cx, cy), center=True)
    paste(base, im, (cx, cy), center=True)


CROWN = trim(load_rgba(SRC / "crown-trim.png"), pad=0)
LETTER_O = trim(load_rgba(SRC / "letter-o-trim.png"), pad=0)
# slightly tighten crown if transparent margins remain
CROWN = trim(CROWN, pad=2)


def hero_legionary(scale: int = 12) -> Image.Image:
    sheet = load_rgba(Path("/workspace/oversummoned-mocks/assets/front/legionary_idle.png"))
    fw, fh = 41, 50
    frame = trim(sheet.crop((0, 0, fw, fh)), pad=1)
    return frame.resize((frame.size[0] * scale, frame.size[1] * scale), Image.Resampling.NEAREST)


# ---------------------------------------------------------------------------
# Option 1 — Crown over a glowing summoning circle
# ---------------------------------------------------------------------------
def build_option_1(size: int = MASTER) -> Image.Image:
    im = radial_background(size)
    cx = cy = size // 2
    # lift crown slightly above true center so it sits in the circle well
    # circle center a touch below mid so crown + ring feel balanced in a circle crop
    ring_cy = int(size * 0.53)
    crown_cy = int(size * 0.46)

    # atmospheric glows
    im.alpha_composite(glow_layer(size, (cx, ring_cy), int(size * 0.42), VIOLET, 90, int(size * 0.16)))
    im.alpha_composite(glow_layer(size, (cx, ring_cy), int(size * 0.30), CYAN, 70, int(size * 0.12)))
    im.alpha_composite(glow_layer(size, (cx, crown_cy), int(size * 0.22), GOLD, 80, int(size * 0.10)))
    im.alpha_composite(glow_layer(size, (cx, int(size * 0.70)), int(size * 0.20), PINK, 50, int(size * 0.12)))

    # summoning rings (drawn on a high-res overlay)
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    # outer soft rings
    rings = [
        # radius, width, color, alpha, dashed, start
        (int(size * 0.38), int(size * 0.010), (*VIOLET, 200), None, 0),
        (int(size * 0.355), int(size * 0.004), (*CYAN, 180), (0.12, 0.08), 0.2),
        (int(size * 0.33), int(size * 0.007), (*PINK, 160), None, 0),
        (int(size * 0.295), int(size * 0.0035), (*GOLD, 200), (0.06, 0.10), 0.4),
        (int(size * 0.26), int(size * 0.006), (*CYAN, 210), None, 0),
        (int(size * 0.225), int(size * 0.003), (*VIOLET, 160), (0.18, 0.07), 0),
    ]
    for radius, width, col, dashed, start in rings:
        if dashed:
            draw_circle_stroke(d, (cx, ring_cy), radius, col, width, dashed=dashed, start=start)
        else:
            draw_circle_stroke(d, (cx, ring_cy), radius, col, width)

    # tick marks / rune pips on the main ring
    main_r = int(size * 0.38)
    for i in range(24):
        ang = i * (2 * math.pi / 24) - math.pi / 2
        inner = main_r - (size * 0.018 if i % 6 == 0 else size * 0.011)
        outer = main_r + (size * 0.018 if i % 6 == 0 else size * 0.010)
        x1 = cx + inner * math.cos(ang)
        y1 = ring_cy + inner * math.sin(ang)
        x2 = cx + outer * math.cos(ang)
        y2 = ring_cy + outer * math.sin(ang)
        col = (*GOLD, 220) if i % 6 == 0 else (*CYAN, 200)
        w = max(2, int(size * (0.006 if i % 6 == 0 else 0.0035)))
        d.line((x1, y1, x2, y2), fill=col, width=w)
        if i % 6 == 0:
            # diamond pip at tick
            px = cx + (main_r + size * 0.032) * math.cos(ang)
            py = ring_cy + (main_r + size * 0.032) * math.sin(ang)
            s = size * 0.010
            d.polygon([(px, py - s), (px + s, py), (px, py + s), (px - s, py)], fill=(*GOLD_HI, 230))

    # inner thin gold ring close to the crown
    draw_circle_stroke(d, (cx, ring_cy), int(size * 0.20), (*GOLD_MID, 180), max(2, int(size * 0.0035)))

    # soft particles
    rng = random.Random(11)
    for _ in range(40):
        ang = rng.uniform(0, 2 * math.pi)
        rad = rng.uniform(size * 0.18, size * 0.42)
        x = cx + rad * math.cos(ang)
        y = ring_cy + rad * math.sin(ang)
        pr = rng.uniform(size * 0.002, size * 0.006)
        col = rng.choice([CYAN, PINK, VIOLET, GOLD_HI])
        a = rng.randint(90, 200)
        d.ellipse((x - pr, y - pr, x + pr, y + pr), fill=(*col, a))

    im.alpha_composite(overlay)

    # extra ring glow after strokes
    im.alpha_composite(ring_glow(size, (cx, ring_cy), int(size * 0.34), int(size * 0.42), CYAN, 80, int(size * 0.03)))
    im.alpha_composite(ring_glow(size, (cx, ring_cy), int(size * 0.31), int(size * 0.37), PINK, 60, int(size * 0.025)))

    # crown
    crown = scale_to_width(CROWN, int(size * 0.62))
    composite_with_shadow(im, crown, (cx, crown_cy), blur=int(size * 0.03), opacity=180, offset=(0, int(size * 0.012)))
    # gold under-glow already placed
    im = add_grain(im, 0.028, seed=1)
    return im


# ---------------------------------------------------------------------------
# Option 2 — Crown on a collector card back
# ---------------------------------------------------------------------------
def build_option_2(size: int = MASTER) -> Image.Image:
    im = radial_background(size)
    cx = cy = size // 2

    im.alpha_composite(glow_layer(size, (cx, cy), int(size * 0.46), VIOLET, 80, int(size * 0.16)))
    im.alpha_composite(glow_layer(size, (cx, int(size * 0.36)), int(size * 0.22), GOLD, 70, int(size * 0.10)))
    im.alpha_composite(glow_layer(size, (cx, int(size * 0.72)), int(size * 0.22), PINK, 70, int(size * 0.12)))

    # card geometry — portrait card, sized to stay inside a circle crop
    # circle radius = size/2; card must sit within ~0.78 of that for safe margin
    card_h = int(size * 0.78)
    card_w = int(card_h * 0.70)  # collector-card ratio-ish, slightly chunky
    x0 = (size - card_w) // 2
    y0 = (size - card_h) // 2
    rad = int(card_w * 0.10)

    card = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)

    # outer rarity glow (absurd/legendary pink-violet)
    glow_box = (x0 - int(size * 0.02), y0 - int(size * 0.02), x0 + card_w + int(size * 0.02), y0 + card_h + int(size * 0.02))
    # we'll add a blurred pink plate behind
    plate = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pd = ImageDraw.Draw(plate)
    pd.rounded_rectangle(glow_box, radius=rad + 8, fill=(*PINK, 200))
    plate = plate.filter(ImageFilter.GaussianBlur(int(size * 0.03)))
    im.alpha_composite(plate)
    plate2 = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pd2 = ImageDraw.Draw(plate2)
    pd2.rounded_rectangle(glow_box, radius=rad + 8, fill=(*VIOLET, 180))
    plate2 = plate2.filter(ImageFilter.GaussianBlur(int(size * 0.045)))
    im.alpha_composite(plate2)

    # outer gold/pink edge
    d.rounded_rectangle((x0, y0, x0 + card_w, y0 + card_h), radius=rad, fill=(18, 8, 36, 255))
    # gold border
    border = max(4, int(size * 0.016))
    d.rounded_rectangle((x0, y0, x0 + card_w, y0 + card_h), radius=rad, outline=(*GOLD, 255), width=border)
    # inner violet line
    inset = border + max(2, int(size * 0.007))
    d.rounded_rectangle(
        (x0 + inset, y0 + inset, x0 + card_w - inset, y0 + card_h - inset),
        radius=max(4, rad - inset),
        outline=(*VIOLET, 220),
        width=max(2, int(size * 0.004)),
    )
    # inner field
    inset2 = inset + max(2, int(size * 0.010))
    field = (x0 + inset2, y0 + inset2, x0 + card_w - inset2, y0 + card_h - inset2)
    d.rounded_rectangle(field, radius=max(4, rad - inset2), fill=(12, 6, 26, 255))

    im.alpha_composite(card)

    # inner pattern: subtle sunburst / arcane diamonds
    pattern = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(pattern)
    # clip later
    for i in range(16):
        ang = i * math.pi / 16
        length = size * 0.55
        x1 = cx - length * math.cos(ang)
        y1 = cy - length * math.sin(ang)
        x2 = cx + length * math.cos(ang)
        y2 = cy + length * math.sin(ang)
        pdraw.line((x1, y1, x2, y2), fill=(155, 92, 255, 28), width=max(1, int(size * 0.004)))
    # concentric faint diamonds
    for k, s in enumerate((0.16, 0.22, 0.28, 0.34)):
        rr = size * s
        pdraw.polygon(
            [(cx, cy - rr), (cx + rr * 0.72, cy), (cx, cy + rr), (cx - rr * 0.72, cy)],
            outline=(*GOLD, 40 + k * 8),
        )
    # mask pattern to inner field
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(field, radius=max(4, rad - inset2), fill=255)
    pattern.putalpha(ImageChops.multiply(pattern.split()[-1], mask))
    im.alpha_composite(pattern)

    # four corner pips (tiny gold diamonds) inside the field
    pip = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pd3 = ImageDraw.Draw(pip)
    margin = inset2 + int(size * 0.045)
    corners = [
        (x0 + margin, y0 + margin),
        (x0 + card_w - margin, y0 + margin),
        (x0 + margin, y0 + card_h - margin),
        (x0 + card_w - margin, y0 + card_h - margin),
    ]
    s = size * 0.016
    for px, py in corners:
        pd3.polygon([(px, py - s), (px + s, py), (px, py + s), (px - s, py)], fill=(*GOLD, 230))
        # tiny inner
        s2 = s * 0.35
        pd3.polygon([(px, py - s2), (px + s2, py), (px, py + s2), (px - s2, py)], fill=(*GOLD_HI, 255))
    im.alpha_composite(pip)

    # soft inner vignette already from bg; gold glow behind crown
    im.alpha_composite(glow_layer(size, (cx, int(size * 0.48)), int(size * 0.22), GOLD, 90, int(size * 0.08)))

    # crown centered on the card, slightly above geometric center (optical)
    crown = scale_to_width(CROWN, int(card_w * 0.78))
    composite_with_shadow(im, crown, (cx, int(size * 0.49)), blur=int(size * 0.025), opacity=200, offset=(0, int(size * 0.01)))

    im = add_grain(im, 0.03, seed=2)
    return im


# ---------------------------------------------------------------------------
# Option 3 — Crown with a pixel hero stepping out of a card
# ---------------------------------------------------------------------------
def build_option_3(size: int = MASTER) -> Image.Image:
    im = radial_background(size)
    cx = size // 2

    im.alpha_composite(glow_layer(size, (cx, int(size * 0.55)), int(size * 0.42), VIOLET, 80, int(size * 0.16)))
    im.alpha_composite(glow_layer(size, (cx, int(size * 0.62)), int(size * 0.26), CYAN, 80, int(size * 0.12)))
    im.alpha_composite(glow_layer(size, (cx, int(size * 0.82)), int(size * 0.18), PINK, 50, int(size * 0.10)))

    # Card sits mid-low as a portal the hero is walking out of.
    # Crown is a smaller crest above, overlapping only the top edge.
    card_h = int(size * 0.52)
    card_w = int(card_h * 0.74)
    card_cy = int(size * 0.58)
    x0 = cx - card_w // 2
    y0 = card_cy - card_h // 2
    rad = int(card_w * 0.11)

    # portal / rarity glow behind the card
    for col, blur, pad, alpha in (
        (CYAN, int(size * 0.040), int(size * 0.01), 190),
        (VIOLET, int(size * 0.055), int(size * 0.02), 170),
        (PINK, int(size * 0.035), int(size * 0.00), 120),
    ):
        plate = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ImageDraw.Draw(plate).rounded_rectangle(
            (x0 - pad, y0 - pad, x0 + card_w + pad, y0 + card_h + pad),
            radius=rad + pad,
            fill=(*col, alpha),
        )
        im.alpha_composite(plate.filter(ImageFilter.GaussianBlur(blur)))

    card = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((x0, y0, x0 + card_w, y0 + card_h), radius=rad, fill=(14, 7, 30, 255))
    border = max(4, int(size * 0.014))
    d.rounded_rectangle((x0, y0, x0 + card_w, y0 + card_h), radius=rad, outline=(*GOLD, 255), width=border)
    inset = border + max(2, int(size * 0.006))
    d.rounded_rectangle(
        (x0 + inset, y0 + inset, x0 + card_w - inset, y0 + card_h - inset),
        radius=max(4, rad - inset),
        outline=(*PINK, 220),
        width=max(2, int(size * 0.004)),
    )
    inset2 = inset + max(1, int(size * 0.006))
    field = (x0 + inset2, y0 + inset2, x0 + card_w - inset2, y0 + card_h - inset2)
    d.rounded_rectangle(field, radius=max(3, rad - inset2), fill=(8, 4, 18, 255))
    im.alpha_composite(card)

    # portal light inside the card, clipped to the field
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(field, radius=max(3, rad - inset2), fill=255)
    for center, radius, col, alpha, blur in (
        ((cx, int(card_cy + size * 0.02)), int(card_w * 0.46), CYAN, 150, int(size * 0.055)),
        ((cx, int(card_cy)), int(card_w * 0.30), VIOLET, 110, int(size * 0.05)),
    ):
        portal = glow_layer(size, center, radius, col, alpha, blur)
        pa = portal.split()[-1]
        portal.putalpha(ImageChops.multiply(pa, mask))
        im.alpha_composite(portal)

    # crest: official crown sits on the top edge of the card
    crown = scale_to_width(CROWN, int(size * 0.46))
    crown_cy = y0 - int(crown.size[1] * 0.28)
    # gold under-glow
    im.alpha_composite(glow_layer(size, (cx, crown_cy), int(size * 0.18), GOLD, 80, int(size * 0.07)))
    composite_with_shadow(im, crown, (cx, crown_cy), blur=int(size * 0.022), opacity=190, offset=(0, int(size * 0.01)))

    # hero stepping out — feet in front of the card's bottom edge
    hero = hero_legionary(scale=16 if size >= 2048 else 11)
    hero_feet_y = int(y0 + card_h + size * 0.07)
    hero_y = hero_feet_y - hero.size[1]
    foot_glow = glow_layer(size, (cx, hero_feet_y - int(size * 0.01)), int(size * 0.16), (0, 0, 0), 210, int(size * 0.04))
    im.alpha_composite(foot_glow)

    # cyan summoning haze around the hero
    ha = hero.split()[-1]
    dil = ha.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.GaussianBlur(10))
    haze_hero = Image.new("RGBA", hero.size, (54, 214, 255, 0))
    haze_hero.putalpha(dil.point(lambda p: int(p * 0.70)))
    haze = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    paste(haze, haze_hero, (cx - hero.size[0] // 2, hero_y))
    im.alpha_composite(haze.filter(ImageFilter.GaussianBlur(7)))

    paste(im, hero, (cx, hero_y + hero.size[1] // 2), center=True)

    motes = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    md = ImageDraw.Draw(motes)
    rng = random.Random(22)
    for _ in range(26):
        x = cx + rng.randint(-int(size * 0.20), int(size * 0.20))
        y = rng.randint(int(y0 + size * 0.04), int(hero_feet_y))
        pr = rng.uniform(size * 0.002, size * 0.007)
        col = rng.choice([CYAN, PINK, VIOLET, GOLD_HI])
        md.ellipse((x - pr, y - pr, x + pr, y + pr), fill=(*col, rng.randint(110, 220)))
    im.alpha_composite(motes)

    im = add_grain(im, 0.028, seed=3)
    return im


def build_option_4(size: int = MASTER) -> Image.Image:
    im = radial_background(size)
    cx = size // 2

    im.alpha_composite(glow_layer(size, (cx, int(size * 0.56)), int(size * 0.40), VIOLET, 85, int(size * 0.16)))
    im.alpha_composite(glow_layer(size, (cx, int(size * 0.40)), int(size * 0.20), GOLD, 80, int(size * 0.10)))
    im.alpha_composite(glow_layer(size, (cx, int(size * 0.78)), int(size * 0.18), PINK, 50, int(size * 0.10)))

    # faint seal rings, slightly larger than the O so the circle crop has a halo
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    draw_circle_stroke(d, (cx, int(size * 0.53)), int(size * 0.41), (*VIOLET, 90), max(2, int(size * 0.004)))
    draw_circle_stroke(d, (cx, int(size * 0.53)), int(size * 0.43), (*GOLD_MID, 70), max(2, int(size * 0.003)))
    im.alpha_composite(overlay)
    im.alpha_composite(ring_glow(size, (cx, int(size * 0.53)), int(size * 0.37), int(size * 0.45), GOLD, 45, int(size * 0.03)))

    # official gold O. Sized so the full letter (including the teardrop counter) stays readable.
    letter = scale_to_width(LETTER_O, int(size * 0.66))
    # stack crown + O as a unit, optically centered in the circle
    crown = scale_to_width(CROWN, int(size * 0.36))
    overlap = int(crown.size[1] * 0.16)  # band sits on the O's top stroke
    stack_h = crown.size[1] + letter.size[1] - overlap
    stack_top = (size - stack_h) // 2 + int(size * 0.01)
    crown_cy = stack_top + crown.size[1] // 2
    o_top = stack_top + crown.size[1] - overlap
    o_cy = o_top + letter.size[1] // 2

    # portal glow in the O's counter, placed before the letter so it shows through the hole
    # (we'll add it after the letter too, clipped isn't necessary because the letter is opaque)
    composite_with_shadow(im, letter, (cx, o_cy), blur=int(size * 0.03), opacity=200, offset=(0, int(size * 0.014)))

    # glow inside the counter
    # the official O's counter is a teardrop, slightly right-of-center and mid-height
    hole_cx = cx + int(size * 0.01)
    hole_cy = o_cy + int(size * 0.015)
    im.alpha_composite(glow_layer(size, (hole_cx, hole_cy), int(size * 0.11), CYAN, 80, int(size * 0.05)))
    im.alpha_composite(glow_layer(size, (hole_cx, hole_cy), int(size * 0.07), VIOLET, 60, int(size * 0.035)))

    im.alpha_composite(glow_layer(size, (cx, crown_cy), int(size * 0.14), GOLD, 70, int(size * 0.06)))
    composite_with_shadow(im, crown, (cx, crown_cy), blur=int(size * 0.020), opacity=190, offset=(0, int(size * 0.008)))

    im = add_grain(im, 0.028, seed=4)
    return im


# ---------------------------------------------------------------------------
# Downsample master to 1024
# ---------------------------------------------------------------------------
def to_1024(master: Image.Image) -> Image.Image:
    return master.resize((OUT_SIZE, OUT_SIZE), Image.Resampling.LANCZOS)


# ---------------------------------------------------------------------------
# Favicon drawing — simplified, pixel-aware, still the same marks
# ---------------------------------------------------------------------------

def fav_bg(size: int) -> Image.Image:
    import numpy as np
    yy, xx = np.mgrid[0:size, 0:size]
    dx = (xx + 0.5) / size - 0.5
    dy = (yy + 0.5) / size - 0.48
    v = np.exp(-(dx * dx * 6 + dy * dy * 6))
    r = np.clip(7 + 40 * v + 18 * (yy / max(size - 1, 1)), 0, 255)
    g = np.clip(4 + 20 * v + 6 * (yy / max(size - 1, 1)), 0, 255)
    b = np.clip(13 + 70 * v + 20 * (yy / max(size - 1, 1)), 0, 255)
    arr = np.dstack([r, g, b, np.full((size, size), 255)]).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


# Pixel-art crown used at 16px (and as a snap guide). Colors from the official mark.
_PC = {
    ".": None,
    "k": (30, 18, 8, 255),       # outline
    "p": (244, 230, 200, 255),   # pearl
    "h": (255, 241, 191, 255),   # gold highlight
    "g": (233, 194, 106, 255),   # gold
    "m": (185, 130, 47, 255),    # gold mid
    "d": (110, 68, 19, 255),     # gold dark
    "r": (158, 27, 27, 255),     # ruby
}

# 13x9 five-point crown — gold-filled points, pearls, ruby, band
PIXEL_CROWN_13 = [
    ".p..p.p.p..p.",
    "kkg.khkhk.gkk",
    ".khhggggghhk.",
    "..khggggghk..",
    "..kgggrgggk..",
    "..kmmmmmmmk..",
    "kkkkmmmmmkkkk",
    "kdddddddddddk",
    ".kkkkkkkkkkk.",
]

# 9x8 tighter crown for 16px monogram and tight rings
PIXEL_CROWN_11 = [
    "p.p.p.p.p",
    "khkhkhkhk",
    "khhghghhk",
    ".hgggggh.",
    ".kggrggk.",
    "kkkmmmkkk",
    "kdddddddk",
    ".kkkkkkk.",
]


def paint_grid(im: Image.Image, grid, ox, oy, palette=_PC):
    px = im.load()
    w, h = im.size
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            col = palette.get(ch)
            if col is None:
                continue
            xx, yy = ox + x, oy + y
            if 0 <= xx < w and 0 <= yy < h:
                px[xx, yy] = col


def place_pixel_crown(im, cx, cy, which="13"):
    grid = PIXEL_CROWN_13 if which == "13" else PIXEL_CROWN_11
    gh, gw = len(grid), len(grid[0])
    ox = int(round(cx - gw / 2))
    oy = int(round(cy - gh / 2))
    paint_grid(im, grid, ox, oy)
    return gw, gh


def _crown_small(width: int) -> Image.Image:
    return scale_to_width(CROWN, width)


def draw_tiny_ring(d, cx, cy, r, color, width=1):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=color, width=width)


def favicon_option_1(size: int) -> Image.Image:
    im = fav_bg(size)
    d = ImageDraw.Draw(im)
    cx = cy = size / 2
    if size <= 16:
        # hand-pixel: outer violet, inner cyan ring, pixel crown
        draw_tiny_ring(d, 7.5, 7.5, 7.2, (*VIOLET, 255), 1)
        draw_tiny_ring(d, 7.5, 7.5, 6.2, (*CYAN, 255), 1)
        place_pixel_crown(im, 8, 8, "13")
        return im
    if size >= 48:
        draw_tiny_ring(d, cx, cy + 1, size * 0.40, (*VIOLET, 255), 2)
        draw_tiny_ring(d, cx, cy + 1, size * 0.34, (*CYAN, 255), 1)
        draw_tiny_ring(d, cx, cy + 1, size * 0.28, (*PINK, 230), 1)
        r = size * 0.40
        for i in range(8):
            ang = i * math.pi / 4
            x1 = cx + (r - 2) * math.cos(ang)
            y1 = cy + 1 + (r - 2) * math.sin(ang)
            x2 = cx + (r + 2) * math.cos(ang)
            y2 = cy + 1 + (r + 2) * math.sin(ang)
            d.line((x1, y1, x2, y2), fill=(*GOLD, 255), width=1)
        cw = int(size * 0.62)
    else:
        draw_tiny_ring(d, cx, cy + 1, size * 0.40, (*VIOLET, 255), 2)
        draw_tiny_ring(d, cx, cy + 1, size * 0.32, (*CYAN, 255), 1)
        cw = int(size * 0.66)
    crown = _crown_small(cw)
    paste(im, crown, (round(cx), round(cy) - 1), center=True)
    return im


def favicon_option_2(size: int) -> Image.Image:
    im = fav_bg(size)
    d = ImageDraw.Draw(im)
    if size <= 16:
        # 1px gold card, 1px inner field, pixel crown
        d.rounded_rectangle((1, 1, 14, 14), radius=2, fill=(16, 8, 32, 255), outline=(*GOLD, 255), width=1)
        place_pixel_crown(im, 8, 8, "13")
        return im
    if size >= 48:
        m, rad, bw = 6, 6, 3
    else:
        m, rad, bw = 4, 4, 2
    d.rounded_rectangle((m - 1, m - 1, size - m, size - m), radius=rad + 1, outline=(*PINK, 255), width=1)
    d.rounded_rectangle((m, m, size - 1 - m, size - 1 - m), radius=rad, fill=(16, 8, 32, 255), outline=(*GOLD, 255), width=bw)
    inset = m + bw + 1
    d.rounded_rectangle((inset, inset, size - 1 - inset, size - 1 - inset), radius=max(2, rad - 2), outline=(*VIOLET, 255), width=1)
    cw = max(10, size - 2 * m - 2 * bw - 4)
    crown = _crown_small(cw)
    paste(im, crown, (size // 2, size // 2 + 1), center=True)
    return im


def _mini_hero(height: int) -> Image.Image:
    """Integer-friendly downsample of the legionary, with a cyan rim at larger sizes."""
    hero = trim(load_rgba(Path("/workspace/oversummoned-mocks/assets/front/legionary_idle.png")).crop((0, 0, 41, 50)))
    # first scale with nearest if almost integer, else lanczos then optional posterize-ish
    scale = hero.size[1] / height
    nw = max(1, round(hero.size[0] / scale))
    if abs(scale - round(scale)) < 0.08:
        hero = hero.resize((nw, height), Image.Resampling.NEAREST)
    else:
        hero = hero.resize((nw, height), Image.Resampling.LANCZOS)
    return hero


def favicon_option_3(size: int) -> Image.Image:
    im = fav_bg(size)
    d = ImageDraw.Draw(im)
    if size <= 16:
        # card + pixel crown (a hero is unreadable at 16)
        d.rounded_rectangle((1, 3, 14, 14), radius=2, fill=(16, 8, 32, 255), outline=(*GOLD, 255), width=1)
        place_pixel_crown(im, 8, 7, "13")
        return im
    if size >= 48:
        x0, y0, x1, y1 = 12, 16, 35, 43
        d.rounded_rectangle((x0, y0, x1, y1), radius=4, fill=(28, 16, 58, 255), outline=(*GOLD, 255), width=2)
        d.rounded_rectangle((x0 + 3, y0 + 3, x1 - 3, y1 - 3), radius=2, outline=(*PINK, 220), width=1)
        crown = _crown_small(28)
        paste(im, crown, (24, 12), center=True)
        # 41x50 sprite at exact 1/2 scale stays crisp
        raw = load_rgba(Path("/workspace/oversummoned-mocks/assets/front/legionary_idle.png")).crop((0, 0, 41, 50))
        hero = trim(raw.resize((20, 25), Image.Resampling.NEAREST))
        paste(im, hero, (24, 37), center=True)
    else:
        # 32px: crown on a card, no hero (too muddy at this size)
        d.rounded_rectangle((6, 9, 25, 29), radius=3, fill=(16, 8, 32, 255), outline=(*GOLD, 255), width=2)
        d.rounded_rectangle((9, 12, 22, 26), radius=2, outline=(*PINK, 200), width=1)
        crown = _crown_small(22)
        paste(im, crown, (16, 12), center=True)
    return im


def _simple_o(im, cx, cy, outer, thickness, gold_hi=GOLD_HI, gold=GOLD, gold_dk=GOLD_DK, outline=STROKE, hole_fill=None):
    """Geometric gold O for tiny favicons, where the serif official O turns to mush."""
    ring = Image.new("RGBA", im.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    # dark outer stroke as a slightly larger disk, then gold disk, then hole
    rd.ellipse((cx - outer, cy - outer, cx + outer, cy + outer), fill=(*outline, 255))
    rd.ellipse((cx - outer + 1, cy - outer + 1, cx + outer - 1, cy + outer - 1), fill=(*gold, 255))
    inner = max(1, outer - thickness)
    if hole_fill:
        rd.ellipse((cx - inner, cy - inner, cx + inner, cy + inner), fill=(*hole_fill, 255))
        rd.ellipse((cx - inner + 1, cy - inner + 1, cx + inner - 1, cy + inner - 1), fill=(*hole_fill, 255))
    else:
        # punch a transparent hole
        mask = Image.new("L", im.size, 0)
        ImageDraw.Draw(mask).ellipse((cx - inner, cy - inner, cx + inner, cy + inner), fill=255)
        ring = Image.composite(Image.new("RGBA", im.size, (0, 0, 0, 0)), ring, mask)
        rd = ImageDraw.Draw(ring)
    # inner outline
    rd.ellipse((cx - inner, cy - inner, cx + inner, cy + inner), outline=(*outline, 255), width=1)
    # highlight arc on the upper-left of the stroke
    rd.arc((cx - outer + 2, cy - outer + 2, cx + outer - 2, cy + outer - 2), start=200, end=330, fill=(*gold_hi, 255), width=max(1, int(thickness * 0.45)))
    im.alpha_composite(ring)


def favicon_option_4(size: int) -> Image.Image:
    im = fav_bg(size)
    if size <= 16:
        # thick gold O slightly low, violet hole so the letter reads, 9px crown on top
        _simple_o(im, 7.5, 9.2, outer=6.4, thickness=3.0, hole_fill=(28, 14, 58))
        place_pixel_crown(im, 8, 4.5, "11")
        return im
    if size >= 48:
        # official O still works at 48, but keep the crown smaller so the letter reads
        letter = scale_to_height(LETTER_O, 34)
        paste(im, letter, (24, 29), center=True)
        crown = _crown_small(22)
        paste(im, crown, (24, 11), center=True)
    else:
        letter = scale_to_height(LETTER_O, 22)
        paste(im, letter, (16, 19), center=True)
        crown = _crown_small(14)
        paste(im, crown, (16, 7), center=True)
    return im



def write_ico(path: Path, images):
    """Write a true multi-resolution ICO with embedded PNGs."""
    import io, struct
    payloads, entries = [], []
    offset = 6 + 16 * len(images)
    for im in images:
        buf = io.BytesIO()
        im.convert("RGBA").save(buf, format="PNG")
        data = buf.getvalue()
        w, h = im.size
        entries.append((w if w < 256 else 0, h if h < 256 else 0, len(data), offset))
        payloads.append(data)
        offset += len(data)
    with open(path, "wb") as f:
        f.write(struct.pack("<HHH", 0, 1, len(images)))
        for w, h, size, off in entries:
            f.write(struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, size, off))
        for data in payloads:
            f.write(data)


FAV_BUILDERS = {
    1: favicon_option_1,
    2: favicon_option_2,
    3: favicon_option_3,
    4: favicon_option_4,
}


def save_option(n: int, master: Image.Image):
    folder = ROOT / f"option_{n}"
    folder.mkdir(parents=True, exist_ok=True)
    profile = to_1024(master)
    profile.save(folder / "profile_1024.png")
    # also a circle preview for convenience
    fit_in_circle_preview(profile, 1024).save(folder / "profile_circle_1024.png")
    favs = {}
    for s in (16, 32, 48):
        fav = FAV_BUILDERS[n](s).convert("RGBA")
        favs[s] = fav
        fav.save(folder / f"favicon_{s}.png")
        zoom = fav.resize((s * 8, s * 8), Image.Resampling.NEAREST)
        zoom.save(folder / f"favicon_{s}@8x.png")
    write_ico(folder / "favicon.ico", [favs[16], favs[32], favs[48]])
    print(f"option {n} written")
    return profile


def font_try(size: int, bold=True):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size=size)
    return ImageFont.load_default()


def build_sheet(profiles: dict):
    """Comparison sheet: 4 circle crops + favicon sizes at 1x and 4x."""
    # layout
    margin = 64
    gutter = 48
    header_h = 160
    label_h = 72
    circle_d = 420
    square_d = 160
    fav_zoom = 6
    # columns = 4
    cols = 4
    content_w = cols * circle_d + (cols - 1) * gutter
    width = content_w + margin * 2

    # rows: header, circles, labels, square thumbs, favicon row (16/32/48 at 1x and zoom)
    fav_row_h = 48 * fav_zoom + 16 + 40 + 80  # zoomed 48 + labels + 1x row
    height = margin + header_h + circle_d + label_h + 24 + square_d + 40 + fav_row_h + margin

    sheet = Image.new("RGBA", (width, height), (7, 4, 13, 255))
    # subtle background blooms
    sheet.alpha_composite(glow_layer(width if False else height, (0, 0), 1, VIOLET, 0, 1))  # no-op keep import used
    # paint a wide bg with blooms
    bg = Image.new("RGBA", (width, height), BG)
    # simple vertical + two blooms
    px = bg.load()
    for y in range(height):
        for x in range(0, width, 2):  # slight skip for speed, then blur? actually do every pixel but cheaper
            pass
    # faster bg: resize a small gradient
    small = Image.new("RGBA", (width // 4, height // 4), BG)
    sp = small.load()
    sw, sh = small.size
    for y in range(sh):
        for x in range(sw):
            dx = (x / sw) - 0.7
            dy = (y / sh) - 0.15
            v = math.exp(-(dx * dx * 8 + dy * dy * 14))
            dx2 = (x / sw) - 0.15
            dy2 = (y / sh) - 0.75
            p = math.exp(-(dx2 * dx2 * 10 + dy2 * dy2 * 12))
            r = int(7 + 155 * v * 0.22 + 255 * p * 0.10)
            g = int(4 + 92 * v * 0.14 + 46 * p * 0.06)
            b = int(13 + 255 * v * 0.26 + 138 * p * 0.10)
            sp[x, y] = (min(255, r), min(255, g), min(255, b), 255)
    bg = small.resize((width, height), Image.Resampling.LANCZOS)
    sheet = bg

    draw = ImageDraw.Draw(sheet)
    title_f = font_try(54, bold=True)
    sub_f = font_try(22, bold=False)
    label_f = font_try(26, bold=True)
    small_f = font_try(16, bold=False)
    tiny_f = font_try(14, bold=False)

    title = "OverSummoned  brand icon options"
    # measure
    tb = draw.textbbox((0, 0), title, font=title_f)
    tw = tb[2] - tb[0]
    draw.text(((width - tw) // 2, margin + 16), title, font=title_f, fill=INK)
    sub = "Profile picture (circle crop)  ·  square 1024  ·  favicon 16 / 32 / 48"
    sb = draw.textbbox((0, 0), sub, font=sub_f)
    sw = sb[2] - sb[0]
    draw.text(((width - sw) // 2, margin + 84), sub, font=sub_f, fill=(169, 156, 198, 255))

    names = {
        1: "Summoning circle",
        2: "Collector card back",
        3: "Hero from a card",
        4: "Monogram O",
    }
    blurbs = {
        1: "Crown over a glowing Aldermere circle",
        2: "Crown as the emblem on a card back",
        3: "Crown, card, and a summoned legionary",
        4: "Official gold O with the crown perched on it",
    }

    y_circle = margin + header_h
    y_label = y_circle + circle_d + 14
    y_square = y_label + label_h
    y_fav = y_square + square_d + 36

    for i, n in enumerate((1, 2, 3, 4)):
        x = margin + i * (circle_d + gutter)
        # circle on a subtle ring
        ring = Image.new("RGBA", (circle_d + 16, circle_d + 16), (0, 0, 0, 0))
        rd = ImageDraw.Draw(ring)
        rd.ellipse((0, 0, circle_d + 15, circle_d + 15), outline=(*VIOLET, 80), width=3)
        paste(sheet, ring, (x - 8, y_circle - 8))
        circ = fit_in_circle_preview(profiles[n], circle_d)
        paste(sheet, circ, (x, y_circle))

        # labels
        cap = f"Option {n}"
        cb = draw.textbbox((0, 0), cap, font=label_f)
        cw = cb[2] - cb[0]
        draw.text((x + (circle_d - cw) // 2, y_label), cap, font=label_f, fill=INK)
        nm = names[n]
        nb = draw.textbbox((0, 0), nm, font=small_f)
        nw = nb[2] - nb[0]
        draw.text((x + (circle_d - nw) // 2, y_label + 32), nm, font=small_f, fill=GOLD)

        # square thumb centered under the circle
        sq = profiles[n].resize((square_d, square_d), Image.Resampling.LANCZOS)
        # rounded preview of the raw square
        sx = x + (circle_d - square_d) // 2
        # slight border
        border = Image.new("RGBA", (square_d + 4, square_d + 4), (0, 0, 0, 0))
        ImageDraw.Draw(border).rounded_rectangle((0, 0, square_d + 3, square_d + 3), radius=20, outline=(*VIOLET, 90), width=2)
        paste(sheet, border, (sx - 2, y_square - 2))
        # mask square with rounded corners for polish
        mask = Image.new("L", (square_d, square_d), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, square_d - 1, square_d - 1), radius=18, fill=255)
        sq2 = Image.new("RGBA", (square_d, square_d), (0, 0, 0, 0))
        sq2.paste(sq, (0, 0))
        sq2.putalpha(mask)
        paste(sheet, sq2, (sx, y_square))

        # favicons: 16, 32, 48 at 1x and zoomed
        folder = ROOT / f"option_{n}"
        # group them under the column
        # layout within column: three sizes in a row, each shown 1x on a light/dark chip plus zoom
        sizes = (16, 32, 48)
        group_w = circle_d
        # 16@8x, 32@4x, 48@3x so the 16px mark is actually inspectable
        zoom_for = {16: 8, 32: 4, 48: 3}
        zooms = [s * zoom_for[s] for s in sizes]
        gap = 10
        total_zw = sum(zooms) + gap * 2
        start = x + (group_w - total_zw) // 2
        fx = start
        for s, z in zip(sizes, zooms):
            fav = load_rgba(folder / f"favicon_{s}.png")
            zoomed = fav.resize((z, z), Image.Resampling.NEAREST)
            # dark chip
            chip = Image.new("RGBA", (z + 8, z + 8), (13, 7, 24, 255))
            ImageDraw.Draw(chip).rectangle((0, 0, z + 7, z + 7), outline=(*VIOLET, 70))
            paste(chip, zoomed, (4, 4))
            paste(sheet, chip, (fx - 4, y_fav))
            lab = f"{s}px"
            lb = draw.textbbox((0, 0), lab, font=tiny_f)
            lw = lb[2] - lb[0]
            draw.text((fx + (z - lw) // 2, y_fav + z + 12), lab, font=tiny_f, fill=(169, 156, 198, 255))
            fx += z + gap

        # actual-size row (how they'd look in a tab)
        ay = y_fav + 48 * 4 + 36
        # label "actual size"
        # place 16, 32, 48 at real pixels, vertically centered, with a tiny browser-dot bg
        acc = [16, 32, 48]
        acc_w = sum(acc) + 16 * 2
        ax = x + (group_w - acc_w) // 2
        for s in acc:
            fav = load_rgba(folder / f"favicon_{s}.png")
            paste(sheet, fav, (ax, ay + (48 - s) // 2))
            ax += s + 16

    # footer note
    foot = "Gold crown is the existing OverSummoned mark. No icons were published."
    fb = draw.textbbox((0, 0), foot, font=tiny_f)
    fw = fb[2] - fb[0]
    draw.text(((width - fw) // 2, height - margin + 16), foot, font=tiny_f, fill=(110, 99, 144, 255))

    # wait, height - margin + 16 may clip. Let's check
    # I'll put footer inside the bottom margin
    # actually redraw footer higher if needed — we'll fix after a look

    out = ROOT / "option_sheet.png"
    sheet.save(out)
    print("sheet", sheet.size, "->", out)
    return sheet


def main():
    print("Building option 1…")
    p1 = save_option(1, build_option_1())
    print("Building option 2…")
    p2 = save_option(2, build_option_2())
    print("Building option 3…")
    p3 = save_option(3, build_option_3())
    print("Building option 4…")
    p4 = save_option(4, build_option_4())
    profiles = {1: p1, 2: p2, 3: p3, 4: p4}
    print("Building sheet…")
    build_sheet(profiles)
    print("done")


if __name__ == "__main__":
    main()
