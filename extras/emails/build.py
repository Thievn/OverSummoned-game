#!/usr/bin/env python3
"""Build OverSummoned Supabase Auth email templates (HTML + plain text)."""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent

# Brand (from oversummoned.com css/mocks.css + gold auth buttons)
BG = "#07040d"
BG2 = "#0a0618"
PANEL = "#130a24"
PANEL2 = "#1a0f31"
FRAME = "#3a2460"
GOLD = "#e9c26a"
GOLD_HI = "#fff1bf"
GOLD_LO = "#b9822f"
INK = "#f3ecff"
BODY = "#e4daf8"
MUT = "#c8bddf"
DIM = "#9b90b8"
VIOLET = "#9b5cff"
NAVY = "#1c1440"
BTN_FG = "#2a1700"
LOGO = "https://oversummoned.com/icon-192.png"
SITE = "https://oversummoned.com"

SERIF = "Georgia,'Iowan Old Style','Palatino Linotype',Palatino,'Times New Roman',serif"
SANS = "Arial,Helvetica,sans-serif"
MONO = "'Courier New',Courier,monospace"


def skyline() -> str:
    """Deterministic pixel city row. Feet sit on a gold street line."""
    # (width, height, color, window coords as (x_slot, y_from_top) in 4px cells — simplified as bands)
    buildings = [
        (10, 16, "#16102a"),
        (14, 28, "#1c1440"),
        (8, 18, "#140e28"),
        (18, 36, "#221548"),
        (11, 22, "#181230"),
        (15, 30, "#1a1238"),
        (9, 14, "#120c24"),
        (20, 40, "#251650"),
        (12, 24, "#1c1440"),
        (8, 18, "#140e28"),
        (16, 32, "#201444"),
        (10, 20, "#16102a"),
        (14, 26, "#1c1440"),
        (22, 38, "#221548"),
        (9, 16, "#140e28"),
        (13, 28, "#1a1238"),
        (11, 20, "#16102a"),
        (17, 34, "#251650"),
        (8, 14, "#120c24"),
        (15, 24, "#1c1440"),
        (12, 30, "#201444"),
        (10, 18, "#16102a"),
        (19, 36, "#221548"),
        (9, 22, "#181230"),
        (14, 28, "#1a1238"),
        (8, 16, "#140e28"),
        (16, 32, "#1c1440"),
        (11, 20, "#16102a"),
        (13, 26, "#201444"),
    ]
    # A few lit windows: (building_index, color)
    lit = {
        1: GOLD_LO,
        3: GOLD,
        5: VIOLET,
        7: GOLD,
        10: VIOLET,
        13: GOLD_LO,
        17: GOLD,
        20: VIOLET,
        22: GOLD,
        26: GOLD_LO,
    }
    cells = []
    # leading night sky + a tiny gold "moon"
    cells.append(
        '<td width="18" valign="top" bgcolor="#0a0618" style="width:18px;background-color:#0a0618;padding:6px 0 0 10px;line-height:0;font-size:0;">'
        f'<table role="presentation" width="10" cellpadding="0" cellspacing="0" border="0"><tr>'
        f'<td width="10" height="10" bgcolor="{GOLD_LO}" style="width:10px;height:10px;background-color:{GOLD_LO};font-size:0;line-height:0;border-radius:10px;">&nbsp;</td>'
        f"</tr></table></td>"
    )
    for i, (w, h, color) in enumerate(buildings):
        gap = 3 if i < len(buildings) - 1 else 0
        window = ""
        if i in lit:
            wc = lit[i]
            # a 4x4 window near the top of the building
            window = (
                f'<tr><td height="6" style="height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>'
                f'<tr><td align="center" style="padding:0;line-height:0;font-size:0;">'
                f'<table role="presentation" width="4" cellpadding="0" cellspacing="0" border="0"><tr>'
                f'<td width="4" height="4" bgcolor="{wc}" style="width:4px;height:4px;background-color:{wc};font-size:0;line-height:0;">&nbsp;</td>'
                f"</tr></table></td></tr>"
            )
        cells.append(
            f'<td width="{w}" valign="bottom" bgcolor="#0a0618" style="width:{w}px;background-color:#0a0618;padding:0;line-height:0;font-size:0;">'
            f'<table role="presentation" width="{w}" cellpadding="0" cellspacing="0" border="0" bgcolor="{color}" style="width:{w}px;background-color:{color};">'
            f'{window}'
            f'<tr><td width="{w}" height="{h}" bgcolor="{color}" style="width:{w}px;height:{h}px;background-color:{color};font-size:0;line-height:0;">&nbsp;</td></tr>'
            f"</table></td>"
        )
        if gap:
            cells.append(
                f'<td width="{gap}" valign="bottom" bgcolor="#0a0618" style="width:{gap}px;background-color:#0a0618;font-size:0;line-height:0;">&nbsp;</td>'
            )
    inner = "".join(cells)
    return f"""
<tr><td bgcolor="#0a0618" style="background-color:#0a0618;padding:0;line-height:0;font-size:0;border-bottom:2px solid {GOLD};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0618" style="background-color:#0a0618;">
<tr>
{inner}
<td valign="bottom" bgcolor="#0a0618" style="background-color:#0a0618;font-size:0;line-height:0;">&nbsp;</td>
</tr>
</table>
</td></tr>
""".strip()


EMAILS = {
    "confirm-signup": {
        "key": "confirmation",
        "title": "Confirm your email",
        "subject": "Confirm your email, and Aldermere will leave a light on",
        "preview": "One step and your place in the city is yours.",
        "eyebrow": "A new name at the gate",
        "heading": "The city is waiting for you.",
        "paras": [
            "Someone used {{ .Email }} to join OverSummoned. If that was you, confirm your email and we&rsquo;ll open the gate to Aldermere.",
        ],
        "button": "Confirm your email",
        "href": "{{ .ConfirmationURL }}",
        "fallback": True,
        "after": "If this wasn&rsquo;t you, you can ignore this. Nothing will change.",
        "footer_why": "You&rsquo;re getting this because {{ .Email }} was used to join OverSummoned.",
        "text": [
            "The city is waiting for you.",
            "",
            "Someone used {{ .Email }} to join OverSummoned. If that was you, confirm your email and we'll open the gate to Aldermere.",
            "",
            "Confirm your email:",
            "{{ .ConfirmationURL }}",
            "",
            "If this wasn't you, you can ignore this. Nothing will change.",
        ],
    },
    "magic-link": {
        "key": "magic_link",
        "title": "Your sign-in link",
        "subject": "Your way back into Aldermere",
        "preview": "A single-use door, just for you. It will not last long.",
        "eyebrow": "A door, one use",
        "heading": "Come back in.",
        "paras": [
            "Here is a one-time door back into OverSummoned for {{ .Email }}. It only works once, and it will not last long.",
        ],
        "button": "Step back in",
        "href": "{{ .ConfirmationURL }}",
        "fallback": True,
        "code": "{{ .Token }}",
        "code_label": "Or enter this code in the game:",
        "after": "If you did not ask for this, you can ignore it. Nobody gets in without you.",
        "footer_why": "You&rsquo;re getting this because a sign-in was requested for {{ .Email }} on OverSummoned.",
        "text": [
            "Come back in.",
            "",
            "Here is a one-time door back into OverSummoned for {{ .Email }}. It only works once, and it will not last long.",
            "",
            "Step back in:",
            "{{ .ConfirmationURL }}",
            "",
            "Or enter this code in the game:",
            "{{ .Token }}",
            "",
            "If you did not ask for this, you can ignore it. Nobody gets in without you.",
        ],
    },
    "reset-password": {
        "key": "recovery",
        "title": "Reset your password",
        "subject": "Let’s make you a new key",
        "preview": "A request came in to reset the password on your OverSummoned account.",
        "eyebrow": "Account key",
        "heading": "Need a new key?",
        "paras": [
            "We got a request to reset the password on your OverSummoned account. If that was you, use the button below. If it wasn&rsquo;t, you can ignore this and your old key still works.",
        ],
        "button": "Make a new key",
        "href": "{{ .ConfirmationURL }}",
        "fallback": True,
        "after": "This link does not last long. If it goes quiet, you can always ask for another.",
        "footer_why": "You&rsquo;re getting this because a password reset was requested for your OverSummoned account.",
        "text": [
            "Need a new key?",
            "",
            "We got a request to reset the password on your OverSummoned account. If that was you, open the link below. If it wasn't, you can ignore this and your old key still works.",
            "",
            "Make a new key:",
            "{{ .ConfirmationURL }}",
            "",
            "This link does not last long. If it goes quiet, you can always ask for another.",
        ],
    },
    "change-email": {
        "key": "email_change",
        "title": "Confirm your new email",
        "subject": "Confirm your new OverSummoned email",
        "preview": "One step to update the address we write to.",
        "eyebrow": "A new address",
        "heading": "New address, same city.",
        "paras": [
            "You asked to change your OverSummoned email from {{ .Email }} to {{ .NewEmail }}. Confirm the new one and we&rsquo;ll start writing there.",
        ],
        "button": "Confirm this email",
        "href": "{{ .ConfirmationURL }}",
        "fallback": True,
        "after": "If you did not ask to change this, you can ignore this email. Your current address stays as it is.",
        "footer_why": "You&rsquo;re getting this because a change was requested from {{ .Email }} to {{ .NewEmail }}.",
        "text": [
            "New address, same city.",
            "",
            "You asked to change your OverSummoned email from {{ .Email }} to {{ .NewEmail }}. Confirm the new one and we'll start writing there.",
            "",
            "Confirm this email:",
            "{{ .ConfirmationURL }}",
            "",
            "If you did not ask to change this, you can ignore this email. Your current address stays as it is.",
        ],
    },
    "invite": {
        "key": "invite",
        "title": "You’re invited",
        "subject": "You’re invited to OverSummoned",
        "preview": "Someone left a light on for you in Aldermere.",
        "eyebrow": "An open gate",
        "heading": "There’s a place for you here.",
        "paras": [
            "You&rsquo;ve been invited to OverSummoned{{#email}} for {{ .Email }}{{/email}}. The city of Aldermere keeps its lights on for the people who show up. This door is yours.",
        ],
        "button": "Accept the invite",
        "href": "{{ .ConfirmationURL }}",
        "fallback": True,
        "after": "If you were not expecting this, you can ignore it.",
        "footer_why": "You&rsquo;re getting this because {{ .Email }} was invited to OverSummoned.",
        "text": [
            "There's a place for you here.",
            "",
            "You've been invited to OverSummoned. The city of Aldermere keeps its lights on for the people who show up. This door is yours.",
            "",
            "Accept the invite:",
            "{{ .ConfirmationURL }}",
            "",
            "If you were not expecting this, you can ignore it.",
        ],
    },
    "reauthentication": {
        "key": "reauthentication",
        "title": "Your confirmation code",
        "subject": "Your OverSummoned confirmation code",
        "preview": "A short code to make sure it’s you. It will not last long.",
        "eyebrow": "A quick check",
        "heading": "Just to be sure it’s you.",
        "paras": [
            "Use this code in OverSummoned to keep going. It only lasts a little while, and you shouldn&rsquo;t share it with anyone.",
        ],
        "button": None,
        "href": None,
        "fallback": False,
        "code": "{{ .Token }}",
        "code_label": "Your code",
        "after": "If you did not ask for this, you can ignore it.",
        "footer_why": "You&rsquo;re getting this because OverSummoned needed to make sure it was you.",
        "text": [
            "Just to be sure it's you.",
            "",
            "Use this code in OverSummoned to keep going. It only lasts a little while, and you shouldn't share it with anyone.",
            "",
            "Your code: {{ .Token }}",
            "",
            "If you did not ask for this, you can ignore it.",
        ],
    },
}

# Fix invite paragraph — no handlebars. Supabase only has Go templates.
EMAILS["invite"]["paras"] = [
    "You&rsquo;ve been invited to OverSummoned. The city of Aldermere keeps its lights on for the people who show up. This door is yours."
]


def button_html(href: str, label: str) -> str:
    return f"""
<tr><td class="px" style="padding:8px 40px 22px 40px;" align="left">
<table role="presentation" class="btnwrap" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" bgcolor="{GOLD}" style="background-color:{GOLD};border:1px solid {GOLD_HI};border-radius:8px;">
<a href="{href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:{SANS};font-size:15px;font-weight:bold;line-height:1;color:{BTN_FG};text-decoration:none;border-radius:8px;mso-padding-alt:14px 28px;">{label}</a>
</td>
</tr>
</table>
</td></tr>
""".strip()


def fallback_html(href: str) -> str:
    return f"""
<tr><td class="px" style="padding:0 40px 16px 40px;font-family:{SERIF};font-size:13px;line-height:1.55;color:{MUT};" align="left">
If the button does not work, paste this into your browser:<br>
<a href="{href}" target="_blank" style="color:{GOLD};text-decoration:underline;word-break:break-all;">{href}</a>
</td></tr>
""".strip()


def code_html(token: str, label: str) -> str:
    return f"""
<tr><td class="px" style="padding:4px 40px 8px 40px;font-family:{SANS};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:{DIM};" align="left">{label}</td></tr>
<tr><td class="px" style="padding:0 40px 22px 40px;" align="left">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{BG2}" style="background-color:{BG2};border:1px solid {FRAME};border-radius:8px;">
<tr>
<td class="code" align="center" style="padding:18px 16px;font-family:{MONO};font-size:32px;line-height:1.2;font-weight:bold;letter-spacing:8px;color:{GOLD_HI};">
{token}
</td>
</tr>
</table>
</td></tr>
""".strip()


def render_html(name: str, spec: dict) -> str:
    paras = "".join(
        f'<tr><td class="px" style="padding:0 40px 16px 40px;font-family:{SERIF};font-size:16px;line-height:1.6;color:{BODY};" align="left">{p}</td></tr>'
        for p in spec["paras"]
    )
    mid = []
    if spec.get("button") and spec.get("href"):
        mid.append(button_html(spec["href"], spec["button"]))
    if spec.get("fallback") and spec.get("href"):
        mid.append(fallback_html(spec["href"]))
    if spec.get("code"):
        mid.append(code_html(spec["code"], spec.get("code_label") or "Your code"))
    if spec.get("after"):
        mid.append(
            f'<tr><td class="px" style="padding:6px 40px 16px 40px;font-family:{SERIF};font-size:13px;line-height:1.55;color:{MUT};" align="left">{spec["after"]}</td></tr>'
        )
    mid_html = "\n".join(mid)

    preview_pad = "&#847;&zwnj;&nbsp;" * 8
    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>{spec["title"]} · OverSummoned</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style type="text/css">
  :root {{ color-scheme: dark; supported-color-schemes: dark; }}
  body, table, td, a {{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }}
  table, td {{ mso-table-lspace:0pt; mso-table-rspace:0pt; }}
  img {{ -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }}
  body {{ margin:0 !important; padding:0 !important; width:100% !important; background-color:{BG}; }}
  a[x-apple-data-detectors] {{ color:inherit !important; text-decoration:none !important; }}
  u + #body a {{ color:inherit; text-decoration:none; }}
  #outlook a {{ padding:0; }}
  @media only screen and (max-width:620px) {{
    .wrap {{ width:100% !important; }}
    .px {{ padding-left:22px !important; padding-right:22px !important; }}
    .h1 {{ font-size:28px !important; line-height:1.2 !important; }}
    .btnwrap {{ width:100% !important; }}
    .btnwrap td {{ width:100% !important; }}
    .btnwrap a {{ display:block !important; text-align:center !important; }}
    .code {{ font-size:28px !important; letter-spacing:6px !important; }}
  }}
</style>
</head>
<body id="body" style="margin:0;padding:0;background-color:{BG};" bgcolor="{BG}">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">{spec["preview"]}{preview_pad}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{BG}" style="background-color:{BG};">
<tr><td align="center" style="padding:24px 12px 32px 12px;">
<!--[if mso]><table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border:1px solid {FRAME};">

{skyline()}

<!-- masthead -->
<tr><td class="px" bgcolor="{PANEL2}" style="background-color:{PANEL2};padding:18px 40px 16px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="56" valign="middle" style="width:56px;">
<a href="{SITE}" target="_blank" style="text-decoration:none;">
<img src="{LOGO}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border:0;">
</a>
</td>
<td valign="middle" style="padding-left:12px;">
<a href="{SITE}" target="_blank" style="font-family:{SERIF};font-size:20px;font-weight:bold;line-height:1.2;color:{GOLD};text-decoration:none;">OverSummoned</a><br>
<span style="font-family:{SANS};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:{DIM};">The city keeps its lights on</span>
</td>
</tr></table>
</td></tr>

<!-- card body -->
<tr><td bgcolor="{PANEL}" style="background-color:{PANEL};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td class="px" style="padding:28px 40px 6px 40px;font-family:{SANS};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:{VIOLET};" align="left">{spec["eyebrow"]}</td></tr>
<tr><td class="px h1" style="padding:0 40px 18px 40px;font-family:{SERIF};font-size:32px;line-height:1.15;font-weight:bold;color:{INK};" align="left">{spec["heading"]}</td></tr>
{paras}
{mid_html}
<tr><td height="8" style="height:8px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
</table>
</td></tr>

<!-- footer -->
<tr><td class="px" bgcolor="{BG2}" style="background-color:{BG2};padding:20px 40px 8px 40px;border-top:1px solid {FRAME};font-family:{SERIF};font-size:12px;line-height:1.6;color:{MUT};" align="left">
{spec["footer_why"]}<br><br>
<a href="{SITE}/story" target="_blank" style="color:{GOLD};text-decoration:none;">The story</a> &nbsp;&middot;&nbsp;
<a href="{SITE}/privacy" target="_blank" style="color:{GOLD};text-decoration:none;">Privacy</a> &nbsp;&middot;&nbsp;
<a href="{SITE}/terms" target="_blank" style="color:{GOLD};text-decoration:none;">Terms</a><br><br>
Questions? Write to <a href="mailto:hello@oversummoned.com" target="_blank" style="color:{GOLD};text-decoration:none;">hello@oversummoned.com</a>
</td></tr>
<tr><td class="px" bgcolor="{BG2}" style="background-color:{BG2};padding:0 40px 22px 40px;font-family:{SANS};font-size:11px;letter-spacing:0.04em;line-height:1.6;color:{DIM};" align="left">
&copy; 2026 OverSummoned &middot; <a href="{SITE}" target="_blank" style="color:{DIM};text-decoration:none;">oversummoned.com</a><br>
Your heroes never stop working.
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>
"""


FOOT_TXT = """
You're getting this because of your OverSummoned account.
The story: https://oversummoned.com/story
Privacy: https://oversummoned.com/privacy
Terms: https://oversummoned.com/terms
Questions? hello@oversummoned.com

© 2026 OverSummoned · oversummoned.com
Your heroes never stop working.
""".strip()


def render_txt(spec: dict) -> str:
    why = (
        spec["footer_why"]
        .replace("&rsquo;", "'")
        .replace("&#39;", "'")
        .replace("&amp;", "&")
    )
    body = "\n".join(spec["text"])
    return f"""OverSummoned
The city keeps its lights on

{body}

{why}

The story: https://oversummoned.com/story
Privacy: https://oversummoned.com/privacy
Terms: https://oversummoned.com/terms
Questions? hello@oversummoned.com

© 2026 OverSummoned · oversummoned.com
Your heroes never stop working.
"""


def build():
    subjects = {}
    payload = {}
    for name, spec in EMAILS.items():
        html = render_html(name, spec)
        txt = render_txt(spec)
        (OUT / f"{name}.html").write_text(html, encoding="utf-8")
        (OUT / f"{name}.txt").write_text(txt, encoding="utf-8")
        subjects[name] = spec["subject"]
        key = spec["key"]
        payload[f"mailer_subjects_{key}"] = spec["subject"]
        payload[f"mailer_templates_{key}_content"] = html
        print(f"wrote {name} html={len(html)} txt={len(txt)}")
    (OUT / "subjects.json").write_text(json.dumps(subjects, indent=2) + "\n", encoding="utf-8")
    (OUT / "supabase-auth-templates.payload.json").write_text(
        json.dumps(payload, indent=2) + "\n", encoding="utf-8"
    )
    smtp = {
        "external_email_enabled": True,
        "smtp_host": "smtp.resend.com",
        "smtp_port": "465",
        "smtp_user": "resend",
        "smtp_pass": "<READ FROM /workspace/secrets/oversummoned_resend_smtp.key — do not commit>",
        "smtp_admin_email": "hello@oversummoned.com",
        "smtp_sender_name": "OverSummoned",
    }
    (OUT / "supabase-smtp.payload.template.json").write_text(
        json.dumps(smtp, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    build()
