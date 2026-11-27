import { createClient } from 'jsr:@supabase/supabase-js@2';
import { MAIL_FROM, NOTIFY_TO, sendMail, accessMail, notesMail } from './mail.ts';

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
    if (error) return J({ ok: false, msg: 'Smudge cannot reach the city right now. Try again in a minute.' }, 500);
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

  // send both letters to the owner's own address, to see them in a real inbox
  if (b.op === 'test') {
    const { data: me } = await asUser.auth.getUser(auth.slice(7));
    const to = me?.user?.email;
    if (!to) return J({ ok: false, msg: 'No email on this account.' }, 400);
    let latest: any = null; try { latest = (await (await fetch('https://oversummoned.com/data/notes.json?t=' + Date.now())).json())[0]; } catch { /* the invite alone */ }
    const sent = [await sendMail(to, accessMail(to))]; if (latest) { await new Promise((r) => setTimeout(r, 700)); sent.push(await sendMail(to, notesMail(latest))); }
    return J({ ok: sent.every(Boolean), to, msg: sent.every(Boolean) ? '' : 'The email did not send. Check the Resend key and that the sending domain is verified.' });
  }

  if (b.op === 'invite') {
    const { data, error } = await sb.rpc('os2_beta_invite_email', { p_email: String(b.email || '').slice(0, 200) });
    if (error) return J({ ok: false, msg: 'That did not save.' }, 500);
    if (!data.ok) return J({ ok: false, msg: 'That does not look like an email address.' }, 400);
    const to = data.email as string;
    const mailed = await sendMail(to, accessMail(to));
    if (mailed) await sb.from('os2_beta_invite').update({ mailed: true }).eq('email', to);
    return J({ ok: true, mailed });
  }
  // Email one version's update notes to everyone who ticked "Email me update notes". dry: just count. A version is sent once.
  if (b.op === 'notes') {
    let all: any[] = [];
    try { all = await (await fetch('https://oversummoned.com/data/notes.json?t=' + Date.now())).json(); } catch { return J({ ok: false, msg: 'Could not read the notes from the site.' }, 502); }
    const n = (b.v ? all.find((x) => x.v === String(b.v)) : all[0]); if (!n) return J({ ok: false, msg: 'No notes for that version.' }, 404);
    const { data: subs, error: sErr } = await sb.rpc('os2_update_subscribers'); if (sErr) return J({ ok: false, msg: 'Could not read the list.' }, 500);
    const list: string[] = (subs || []).map((x: any) => x.email).filter(Boolean);
    const { data: done } = await sb.from('os2_notes_sent').select('v,sent_at,sent').eq('v', n.v).maybeSingle();
    if (b.dry) return J({ ok: true, v: n.v, title: n.title || '', count: list.length, already: done || null });
    if (done) return J({ ok: false, msg: 'Beta ' + n.v + ' was already emailed.' }, 409);
    if (!list.length) return J({ ok: true, v: n.v, sent: 0, count: 0 });
    const { error: iErr } = await sb.from('os2_notes_sent').insert({ v: n.v }); if (iErr) return J({ ok: false, msg: 'Beta ' + n.v + ' was already emailed.' }, 409);
    let sent = 0; const letter = notesMail(n);
    for (const to of list.slice(0, 180)) { if (await sendMail(to, letter)) sent++; await new Promise((r) => setTimeout(r, 600)); }
    await sb.from('os2_notes_sent').update({ sent }).eq('v', n.v);
    return J({ ok: true, v: n.v, sent, count: list.length });
  }
  return J({ ok: false, msg: 'Unknown request.' }, 400);
});
