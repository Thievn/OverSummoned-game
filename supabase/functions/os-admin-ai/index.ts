// os-admin-ai: the owner's marketing studio. Checks the caller is the owner, then asks Grok
// for post copy or an image. The Grok key never leaves the server.
import { createClient } from 'npm:@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const RULES: Record<string, string> = {
  tiktok: 'Write a TikTok caption: a hook in the first six words, two or three short lines, then 4 to 6 hashtags. Also give a one-line idea for what the video shows.',
  x: 'Write a post for X: under 260 characters, one sharp joke or hook, at most two hashtags.',
  short: 'Write a 20 second voice-over script for a vertical video, 45 to 55 words, punchy, ending on the game name.',
};
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization') || '';
    const user = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
    const { data: ok } = await user.rpc('os2_is_admin');
    if (ok !== true) return json({ ok: false, why: 'owner only' }, 403);
    const b = await req.json();
    const key = Deno.env.get('XAI_API_KEY')!;
    if (b.mode === 'image') {
      const prompt = `${String(b.subject).slice(0, 600)}. Eye-catching social media promo art for the game OverSummoned, polished 2D cartoon game art, bold clean dark navy outlines, bright warm saturated colors, cel shading, dramatic teal magic glow. No text, no logos, no real people.`;
      const r = await fetch('https://api.x.ai/v1/images/generations', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'grok-imagine-image-2.0', prompt, n: 1, response_format: 'b64_json', aspect_ratio: b.platform === 'x' ? '16:9' : '9:16' }) });
      const out = await r.json();
      if (!r.ok || !out?.data?.[0]?.b64_json) return json({ ok: false, why: `grok ${r.status}: ${JSON.stringify(out).slice(0, 200)}` }, 502);
      return json({ ok: true, image: `data:${out.data[0].mime_type || 'image/jpeg'};base64,${out.data[0].b64_json}` });
    }
    const system = 'You write marketing for OverSummoned, a free desktop pet and idle game. Smudge, a sarcastic hooded otter apprentice, stamped the wrong name in a cursed ledger 300 years ago, and now strangers from history (all cartoon animals) keep getting summoned onto your desk while you type. Voice: dry, funny, confident, never corporate. Never invent features, prices or dates. Never mention real living people. ' + (RULES[b.platform] || RULES.x) + ' Give three different options, numbered.';
    const ask = `Subject: ${String(b.subject).slice(0, 1200)}\nTone: ${String(b.tone || 'salty and funny').slice(0, 80)}\n${b.extra ? 'Also: ' + String(b.extra).slice(0, 400) : ''}`;
    let text = '', last = '';
    for (const model of ['grok-4-1-fast-non-reasoning', 'grok-4', 'grok-3']) {
      const r = await fetch('https://api.x.ai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, max_tokens: 700, messages: [{ role: 'system', content: system }, { role: 'user', content: ask }] }) });
      const out = await r.json(); text = out?.choices?.[0]?.message?.content || ''; last = `grok ${r.status}: ${JSON.stringify(out).slice(0, 200)}`;
      if (text) break;
    }
    return text ? json({ ok: true, text }) : json({ ok: false, why: last }, 502);
  } catch (e) { return json({ ok: false, why: String(e).slice(0, 300) }, 500); }
});
