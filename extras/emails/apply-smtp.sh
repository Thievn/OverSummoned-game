#!/usr/bin/env bash
# NOT RUN. Apply Resend SMTP for hello@oversummoned.com after the domain is verified
# and /workspace/secrets/oversummoned_resend_smtp.key exists (chmod 600).
# Does not send mail. Review before running. Needs SUPABASE_PAT_DEN (or another
# token with auth_config_write) in the environment.
set -euo pipefail
REF=eresamyqxarlrdgudgrw
KEY_FILE=/workspace/secrets/oversummoned_resend_smtp.key
if [[ ! -f "$KEY_FILE" ]]; then
  echo "missing $KEY_FILE" >&2
  exit 1
fi
# Build JSON without printing the key.
python3 - "$KEY_FILE" << 'PY' > /tmp/os-smtp-payload.json
import json, sys
from pathlib import Path
key = Path(sys.argv[1]).read_text().strip()
if not key or key.startswith("<"):
    raise SystemExit("refusing to use empty or placeholder key")
json.dump({
    "external_email_enabled": True,
    "smtp_host": "smtp.resend.com",
    "smtp_port": "465",
    "smtp_user": "resend",
    "smtp_pass": key,
    "smtp_admin_email": "hello@oversummoned.com",
    "smtp_sender_name": "OverSummoned",
}, sys.stdout)
PY
curl -sS -X PATCH "https://api.supabase.com/v1/projects/$REF/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_PAT_DEN:?set SUPABASE_PAT_DEN}" \
  -H "Content-Type: application/json" \
  --data @/tmp/os-smtp-payload.json -o /tmp/os-smtp-result.json -w "HTTP %{http_code}\n"
rm -f /tmp/os-smtp-payload.json
# Do not cat the result (it can include smtp_pass). Report status only via the curl write-out.
python3 - << 'PY'
import json
from pathlib import Path
p = Path("/tmp/os-smtp-result.json")
if p.exists() and p.stat().st_size:
    data = json.loads(p.read_text())
    print("smtp_admin_email", data.get("smtp_admin_email"))
    print("smtp_sender_name", data.get("smtp_sender_name"))
    print("smtp_host", data.get("smtp_host"))
    print("smtp_port", data.get("smtp_port"))
    print("smtp_user", data.get("smtp_user"))
    print("smtp_pass_set", bool(data.get("smtp_pass")))
p.unlink(missing_ok=True)
PY
