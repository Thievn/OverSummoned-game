# Resend DNS records for oversummoned.com

Domain id: `66cd803c-b053-4f4d-bfb6-c6578fe1c13d`  
Status: `not_started` (created 2026-11-23, America/New_York)  
Region: `us-east-1`  
Return-path subdomain: `send`  
Sending: enabled · Receiving: disabled · Open/click tracking: off · TLS: opportunistic

These are the **exact** records Resend returned at create time. Add them in IONOS. Enter the Host relative to `oversummoned.com` (do not append `.oversummoned.com` if IONOS already adds the zone name). TTL: Auto.

Do **not** change root MX, root SPF, or `_dmarc`. IONOS already hosts mail and forwarding for the root domain (`mx00`/`mx01.ionos.com`, `v=spf1 include:_spf-us.ionos.com ~all`, `_dmarc` CNAME to `dmarc.ionos.com`). A second DMARC record cannot coexist with that CNAME. hello@ / support@ forwarding stays as it is.

| Type | Host (IONOS) | Value | Priority |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC7/KPUyZQ42m6FxbF1YvEY5Wf4hVly8GN5P83WL6bIzWcJa/ttlos8fjwCFVWr6lWEgxUvUJniv/as2w2v0A3ejPrHzw9gG80UdGWQbY2EIDhh/qmyVBrljFWvCNdH7SKq7iqSQboGCn8BSgpgACEZJh3CCaXm9oKa1KWV+NuI0wIDAQAB` | — |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| CNAME | `rsend` | `send.forge.rmta.net` | — |

After the records propagate, trigger domain verification in Resend. Do not switch Supabase SMTP to `hello@oversummoned.com` until the domain status is verified.
