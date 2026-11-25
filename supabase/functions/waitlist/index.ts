import { createClient } from 'jsr:@supabase/supabase-js@2';

const ALLOWED = new Set([
  'https://oversummoned.com',
  'https://www.oversummoned.com',
  'https://thievns-den.vercel.app',
]);

function cors(origin: string | null) {
  const ok = origin && (ALLOWED.has(origin) || /^https:\/\/thievns-[a-z0-9-]+-thievns-projects\.vercel\.app$/.test(origin));
  return {
    'Access-Control-Allow-Origin': ok ? origin! : 'https://oversummoned.com',
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

async function sha256(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---- mail (Resend). Missing key or a failed send never breaks the request: it is reported, not thrown.
const MAIL_FROM = Deno.env.get('BETA_MAIL_FROM') || 'Smudge at OverSummoned <hello@oversummoned.com>';
const NOTIFY_TO = Deno.env.get('BETA_NOTIFY_TO') || 'hello@oversummoned.com';
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
function page(title: string, lines: string[]) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1e2a47">
<h1 style="font-size:22px;margin:0 0 14px">${title}</h1>${lines.map((l) => `<p style="font-size:15px;line-height:1.55;margin:0 0 12px">${l}</p>`).join('')}
<p style="font-size:12px;color:#7a849c;margin:22px 0 0">OverSummoned · <a href="https://oversummoned.com" style="color:#7a849c">oversummoned.com</a></p></div>`;
}
async function sendMail(to: string, subject: string, text: string, html: string): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) { console.error('mail not sent: RESEND_API_KEY is not set'); return false; }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], reply_to: 'hello@oversummoned.com', subject, text, html }),
    });
    if (!r.ok) { console.error('mail not sent:', r.status, (await r.text()).slice(0, 300)); return false; }
    return true;
  } catch (e) { console.error('mail not sent:', String(e)); return false; }
}

Deno.serve(async (req) => {
  const h = cors(req.headers.get('origin'));
  const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...h, 'content-type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response(null, { headers: h });
  if (req.method !== 'POST') return J({ ok: false, msg: 'POST only.' }, 405);

  const len = Number(req.headers.get('content-length') || '0');
  if (len > 2048) return J({ ok: false, msg: 'Bad request.' }, 413);
  let b: any = {};
  try { b = JSON.parse((await req.text()).slice(0, 2048)); } catch { return J({ ok: false, msg: 'Bad request.' }, 400); }
  if (!b || typeof b !== 'object') return J({ ok: false, msg: 'Bad request.' }, 400);
  if (b.company) return J({ ok: true });

  const email = String(b.email || '').trim().toLowerCase();
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return J({ ok: false, msg: "That's not an email. That's a cry for help." }, 400);
  }

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || 'unknown';
  const ipHash = await sha256('oversummoned-waitlist:' + ip);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data, error } = await sb.rpc('den_waitlist_join', { p_email: email, p_ip_hash: ipHash });
  if (error) return J({ ok: false, msg: "The Den coughed and didn't catch it. Try again in a minute." }, 500);
  if (data && data.code === 'slow_down') return J({ ok: false, msg: 'Easy there. Try again in a few minutes.' }, 429);
  if (data && data.code === 'bad_email') return J({ ok: false, msg: "That's not an email. That's a cry for help." }, 400);
  if (data && data.dupe) return J({ ok: true, dupe: true });

  // first time on the list: a note to them, and a note to the owner
  await Promise.allSettled([
    sendMail(email, "You're on the OverSummoned wishlist",
      "You're on the list.\n\nOverSummoned is in closed beta. When a seat opens for you, Smudge will send one more email to this address with your way in. That is the only thing we will email you about.\n\nIf this wasn't you, ignore this message and nothing else will arrive.\n\nhttps://oversummoned.com",
      page("You're on the list.", [
        'OverSummoned is in closed beta. When a seat opens for you, Smudge will send one more email to this address with your way in. That is the only thing we will email you about.',
        "If this wasn't you, ignore this message and nothing else will arrive."])),
    sendMail(NOTIFY_TO, 'Wishlist: ' + email, email + ' joined the OverSummoned wishlist.\n\nInvite them from https://oversummoned.com/admin (Beta tab).',
      page('New wishlist signup', [esc(email) + ' joined the wishlist.', 'Invite them from the <a href="https://oversummoned.com/admin">owner\'s office</a>, Beta tab.'])),
  ]);
  return J({ ok: true });
});
