from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
import math
D = "/workspace/oversummoned-blender/"
FB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
FS = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
def card(raw, out, name, era, rarity, col):
    W, H = 640, 880; pad = 40
    c = Image.new("RGBA", (W + 2*pad, H + 2*pad), (0, 0, 0, 0))
    rr = (pad, pad, pad + W, pad + H)
    # outer rarity glow
    g = Image.new("RGBA", c.size, (0, 0, 0, 0)); ImageDraw.Draw(g).rounded_rectangle(rr, 44, outline=col + (255,), width=14)
    c.alpha_composite(g.filter(ImageFilter.GaussianBlur(16)))
    # body with vertical gradient
    body = Image.new("RGBA", c.size, (0, 0, 0, 0)); bd = ImageDraw.Draw(body)
    for y in range(H):
        t = y / H; v = (int(34 - 12*t), int(28 - 10*t), int(52 - 18*t), 255)
        bd.line([(pad, pad + y), (pad + W, pad + y)], fill=v)
    mask = Image.new("L", c.size, 0); ImageDraw.Draw(mask).rounded_rectangle(rr, 44, fill=255)
    c.paste(body, (0, 0), mask)
    # radial rarity glow behind item
    rg = Image.new("RGBA", c.size, (0, 0, 0, 0)); ImageDraw.Draw(rg).ellipse((pad + 90, pad + 120, pad + W - 90, pad + 620), fill=col + (150,))
    rg = rg.filter(ImageFilter.GaussianBlur(70)); rg.putalpha(ImageChops.multiply(rg.split()[3], mask)); c.alpha_composite(rg)
    # rays
    rays = Image.new("RGBA", c.size, (0, 0, 0, 0)); rd = ImageDraw.Draw(rays); cx, cy = pad + W/2, pad + 370
    for i in range(16):
        a = i * math.pi / 8; a2 = a + 0.09
        rd.polygon([(cx, cy), (cx + 700*math.cos(a), cy + 700*math.sin(a)), (cx + 700*math.cos(a2), cy + 700*math.sin(a2))], fill=col + (26,))
    rays = rays.filter(ImageFilter.GaussianBlur(3)); rays.putalpha(ImageChops.multiply(rays.split()[3], mask)); c.alpha_composite(rays)
    # item, scaled to fit the art window with margin
    it = Image.open(raw).convert("RGBA"); it = it.crop(it.split()[3].getbbox())
    box = 470; s = min(box / it.width, box / it.height); it = it.resize((int(it.width*s), int(it.height*s)), Image.LANCZOS)
    sh = Image.new("RGBA", it.size, (0, 0, 0, 0)); sh.putalpha(it.split()[3].point(lambda a: int(a*0.45)))
    c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)), (int(cx - it.width/2) + 8, int(cy - it.height/2) + 14))
    c.alpha_composite(it, (int(cx - it.width/2), int(cy - it.height/2)))
    d = ImageDraw.Draw(c)
    # frame: double border
    d.rounded_rectangle(rr, 44, outline=col + (255,), width=8)
    d.rounded_rectangle((pad + 16, pad + 16, pad + W - 16, pad + H - 16), 32, outline=col + (110,), width=2)
    # rarity ribbon
    f1 = ImageFont.truetype(FS, 30); tw = d.textlength(rarity, font=f1)
    d.rounded_rectangle((cx - tw/2 - 26, pad + 34, cx + tw/2 + 26, pad + 84), 25, fill=col + (255,))
    d.text((cx, pad + 59), rarity, font=f1, fill=(24, 16, 32, 255), anchor="mm")
    # name plate
    d.rounded_rectangle((pad + 40, pad + 680, pad + W - 40, pad + 830), 22, fill=(16, 12, 26, 230), outline=col + (160,), width=2)
    f2 = ImageFont.truetype(FB, 40); f3 = ImageFont.truetype(FS, 24)
    d.text((cx, pad + 735), name, font=f2, fill=(250, 244, 230, 255), anchor="mm")
    d.text((cx, pad + 790), era, font=f3, fill=col + (255,), anchor="mm")
    c.save(D + "items/" + out)
card(D + "items/pirate_hat_raw.png", "card_pirate_hat.png", "Salt Captain's Tricorn", "AGE OF SAIL  ·  HAT", "EPIC", (182, 112, 255))
card(D + "items/sword_raw.png", "card_sword.png", "Oathkeeper Blade", "AGE OF KNIGHTS  ·  WEAPON", "LEGENDARY", (255, 196, 72))
both = Image.new("RGBA", (1480, 1000), (30, 33, 42, 255))
both.alpha_composite(Image.open(D + "items/card_pirate_hat.png"), (10, 20)); both.alpha_composite(Image.open(D + "items/card_sword.png"), (750, 20))
both.save(D + "items/item_cards_preview.png")
