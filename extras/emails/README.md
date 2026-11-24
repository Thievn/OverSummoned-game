# OverSummoned transactional emails

Dark, table-based, inline-CSS, 600px templates for Supabase Auth. Logo is the gold crowned O at `https://oversummoned.com/icon-192.png` (absolute URL; the wordmark is live text so the name still reads with images off). Palette from the site: night `#07040d` / `#0a0618`, panel `#130a24` / `#1a0f31`, gold `#fff1bf` `#e9c26a` `#b9822f`, violet `#9b5cff`, ink `#f3ecff`. A pixel city skyline sits over a gold street line. Fonts: Georgia (headings/body), Arial (UI), Courier New (codes). `color-scheme: dark` is declared so Apple Mail / Gmail don't re-invert. Mobile rules kick in under 620px.

## Auth templates (each has `.html` + `.txt`)

Supabase Auth only sends the HTML part. The `.txt` files are a plain-text reference (and ready if Resend sends are added later). Go template vars are exact:

| File | Supabase key | Subject | Vars |
|---|---|---|---|
| `confirm-signup` | confirmation | Confirm your email, and Aldermere will leave a light on | `{{ .ConfirmationURL }}` `{{ .Email }}` |
| `magic-link` | magic_link | Your way back into Aldermere | `{{ .ConfirmationURL }}` `{{ .Token }}` `{{ .Email }}` |
| `reset-password` | recovery | Let’s make you a new key | `{{ .ConfirmationURL }}` |
| `change-email` | email_change | Confirm your new OverSummoned email | `{{ .Email }}` `{{ .NewEmail }}` `{{ .ConfirmationURL }}` |
| `invite` | invite | You’re invited to OverSummoned | `{{ .ConfirmationURL }}` `{{ .Email }}` |
| `reauthentication` | reauthentication | Your OverSummoned confirmation code | `{{ .Token }}` |

Subjects also live in `subjects.json`. Rebuild with `python3 build.py`. Previews: `python3 render.py` (PNG in `previews/`, contact sheet `preview-sheet.jpg`; sample values only; sends nothing).

## What was applied to Supabase (2026-11-23, America/New_York)

Project `eresamyqxarlrdgudgrw` (dashboard name `thievns-den`, `site_url` `https://oversummoned.com`). The Management API token on the box can read/write auth config. The six subjects and HTML bodies were PATCHed successfully. SMTP was **not** changed.

## SMTP — prepared, not applied

Current live SMTP (leave as-is until `oversummoned.com` is verified on Resend):

- Host `smtp.resend.com`, port `465`, user `resend`, password already set
- From name/address is still the previous Thievn's Den sender, **not** `hello@oversummoned.com`

Desired settings (in `supabase-smtp.payload.template.json`):

- Host `smtp.resend.com`, port `465`, user `resend`
- Password = sending-only Resend API key named `oversummoned-supabase-smtp`, scoped to `oversummoned.com`
- Admin email `hello@oversummoned.com`, sender name `OverSummoned`

Do not switch the From address before the domain is verified, or auth mail will fail. No test or real emails have been sent.

## Resend domain — blocked by plan limit

The connected Resend account is on the Free plan (3/3 domains): thievnsden.com, thirstcheck.com, lustforge.app, all verified in us-east-1. Creating `oversummoned.com` returned 403: domain limit. No domain, no DKIM value, and no scoped API key was created. See `dns-records.md`.

To finish sending from `hello@oversummoned.com`, Dean needs to either:

1. Upgrade that Resend account to Pro ($20/mo, 10 domains), then create `oversummoned.com` in us-east-1 with return-path subdomain `send`, or
2. Open a separate Resend account for OverSummoned (Free still allows 3 domains) so this brand has its own quota and reputation.

Do not delete the three existing verified domains, and do not touch IONOS root MX/SPF. After the domain exists: add the DNS records, verify, create the scoped key, store it at `/workspace/secrets/oversummoned_resend_smtp.key` (chmod 600), then PATCH SMTP.
