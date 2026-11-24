#!/usr/bin/env python3
"""Render PNG previews of OverSummoned emails with sample values only. Sends nothing."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

D = Path(__file__).resolve().parent
LOGO = Path("/workspace/os-seo/icon-192.png")
PREV = D / "previews"
PREV.mkdir(exist_ok=True)

SAMPLE = {
    "{{ .ConfirmationURL }}": "https://oversummoned.com/auth/confirm?token=sample",
    "{{ .Email }}": "you@email.com",
    "{{ .NewEmail }}": "new@email.com",
    "{{ .SiteURL }}": "https://oversummoned.com",
    "{{ .Token }}": "84729103",
}

ORDER = [
    "confirm-signup",
    "magic-link",
    "reset-password",
    "change-email",
    "invite",
    "reauthentication",
]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--disable-gpu"])
        for name in ORDER:
            html = (D / f"{name}.html").read_text(encoding="utf-8")
            for k, v in SAMPLE.items():
                html = html.replace(k, v)
            tmp = Path(f"/tmp/os-email-{name}.html")
            tmp.write_text(html, encoding="utf-8")
            for tag, width in (("desktop", 680), ("mobile", 390)):
                page = browser.new_page(
                    viewport={"width": width, "height": 900},
                    device_scale_factor=2,
                )
                page.route(
                    "https://oversummoned.com/icon-192.png",
                    lambda route: route.fulfill(path=str(LOGO), content_type="image/png"),
                )
                page.goto(tmp.as_uri(), wait_until="networkidle", timeout=60000)
                page.wait_for_timeout(300)
                page.screenshot(path=str(PREV / f"{name}-{tag}.png"), full_page=True)
                page.close()
                print("preview", name, tag)
        browser.close()

    # contact sheet of mobile previews
    W, pad = 280, 18
    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16
        )
    except Exception:
        font = ImageFont.load_default()
    thumbs = []
    for name in ORDER:
        im = Image.open(PREV / f"{name}-mobile.png").convert("RGB")
        r = W / im.width
        thumbs.append((name, im.resize((W, int(im.height * r)), Image.LANCZOS)))
    cols = 3
    rows = [thumbs[i : i + cols] for i in range(0, len(thumbs), cols)]
    row_h = [max(im.height for _, im in row) + 36 for row in rows]
    sheet = Image.new(
        "RGB",
        (cols * (W + pad) + pad, sum(row_h) + pad + 10),
        (7, 4, 13),
    )
    d = ImageDraw.Draw(sheet)
    y = pad
    for row, h in zip(rows, row_h):
        for c, (name, im) in enumerate(row):
            x = pad + c * (W + pad)
            d.text((x, y), name, fill=(233, 194, 106), font=font)
            sheet.paste(im, (x, y + 22))
        y += h
    sheet_path = D / "preview-sheet.jpg"
    sheet.save(sheet_path, quality=90)
    print("sheet", sheet.size, sheet_path)


if __name__ == "__main__":
    main()
