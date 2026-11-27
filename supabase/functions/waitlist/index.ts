import { createClient } from 'jsr:@supabase/supabase-js@2';
import { NOTIFY_TO, sendMail, accessMail, ownerMail } from './mail.ts';

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
    return J({ ok: false, msg: 'Smudge cannot send an invite there. Check the address and try again.' }, 400);
  }

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || 'unknown';
  const ipHash = await sha256('oversummoned-waitlist:' + ip);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data, error } = await sb.rpc('den_waitlist_join', { p_email: email, p_ip_hash: ipHash });
  if (error) return J({ ok: false, msg: 'Smudge dropped that one. Try again in a minute.' }, 500);
  if (data && data.code === 'slow_down') return J({ ok: false, msg: 'Easy there. Try again in a few minutes.' }, 429);
  if (data && data.code === 'bad_email') return J({ ok: false, msg: 'Smudge cannot send an invite there. Check the address and try again.' }, 400);
  // every address that signs up is invited at once
  const { error: inErr } = await sb.rpc('os2_beta_instant', { p_email: email });
  if (inErr) return J({ ok: false, msg: 'Smudge dropped that one. Try again in a minute.' }, 500);
  if (data && data.dupe) return J({ ok: true, dupe: true, open: true });

  // first time: the invite to them, and a note to the owner
  const [welcome] = await Promise.allSettled([sendMail(email, accessMail(email)), sendMail(NOTIFY_TO, ownerMail(email))]);
  const mailed = welcome.status === 'fulfilled' && welcome.value === true;
  if (mailed) await sb.from('den_waitlist').update({ mailed_at: new Date().toISOString() }).eq('email', email);
  return J({ ok: true, mailed, open: true });
});
