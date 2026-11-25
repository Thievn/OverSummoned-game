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
  let b: any = {};
  try { b = JSON.parse((await req.text()).slice(0, 2048)); } catch { return J({ ok: false, msg: 'Bad request.' }, 400); }
  if (!b || typeof b !== 'object') return J({ ok: false, msg: 'Bad request.' }, 400);

  const url = Deno.env.get('SUPABASE_URL')!;
  const sb = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // ---- anyone: turn a beta code into a place on the list
  if (b.op === 'redeem') {
    if (b.company) return J({ ok: true });
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || 'unknown';
    const { data, error } = await sb.rpc('os2_beta_redeem', { p_code: String(b.code || '').slice(0, 40), p_email: String(b.email || '').slice(0, 200), p_ip_hash: await sha256('oversummoned-waitlist:' + ip) });
    if (error) return J({ ok: false, msg: 'The city is not answering. Try again in a minute.' }, 500);
    if (data.code === 'slow_down') return J({ ok: false, msg: 'Easy there. Try again in a few minutes.' }, 429);
    if (data.code === 'bad_email') return J({ ok: false, msg: 'That does not look like an email address.' }, 400);
    if (data.code === 'bad_code') return J({ ok: false, msg: 'That code is not on the list. Check it and try again.' }, 400);
    return J({ ok: true, already: !!data.already });
  }

  // ---- owner only from here: the caller's own sign-in decides
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return J({ ok: false, msg: 'Sign in first.' }, 401);
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: isAdmin, error: adminErr } = await asUser.rpc('os2_is_admin');
  if (adminErr || isAdmin !== true) return J({ ok: false, msg: 'Owner only.' }, 403);

  if (b.op === 'check') return J({ ok: true, key: !!Deno.env.get('RESEND_API_KEY'), from: MAIL_FROM, notify: NOTIFY_TO });

  if (b.op === 'invite') {
    const { data, error } = await sb.rpc('os2_beta_invite_email', { p_email: String(b.email || '').slice(0, 200) });
    if (error) return J({ ok: false, msg: 'That did not save.' }, 500);
    if (!data.ok) return J({ ok: false, msg: 'That does not look like an email address.' }, 400);
    const to = data.email as string;
    const mailed = await sendMail(to, 'Your seat in OverSummoned is open',
      "Your seat is open.\n\nMake your account at https://oversummoned.com/login using this email address (" + to + "). It is the one on the list, so another address will not get in.\n\nYou are one of the first people in. Things will break. There is an \"Ideas or feedback?\" button at the top of the game; anything you send there comes straight to the person who makes it.\n\nEveryone who joins during the beta keeps the Founding Clerk title for good.",
      page('Your seat is open.', [
        'Make your account at <a href="https://oversummoned.com/login">oversummoned.com/login</a> using this email address (<b>' + esc(to) + '</b>). It is the one on the list, so another address will not get in.',
        'You are one of the first people in. Things will break. There is an <b>Ideas or feedback?</b> button at the top of the game; anything you send there comes straight to the person who makes it.',
        'Everyone who joins during the beta keeps the <b>Founding Clerk</b> title for good.']));
    if (mailed) await sb.from('os2_beta_invite').update({ mailed: true }).eq('email', to);
    return J({ ok: true, mailed });
  }
  return J({ ok: false, msg: 'Unknown request.' }, 400);
});
