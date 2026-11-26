// meshy-studio: runs one os_mesh_job through Meshy, the same way art-studio runs os_art_job through Grok.
// POST {job} on a queued row starts it (the only call that spends credits). POST {job} on a running row checks
// it, and once Meshy is done copies the model into the private `mesh` bucket and leaves 7-day download links
// in the row's result. Meshy's own links expire, so the bucket copy is the one to keep.
// GET reports only whether the key is set. The key lives in the MESHY_API_KEY secret and never leaves here.
import { createClient } from 'npm:@supabase/supabase-js@2';

const REPO = 'Thievn/OverSummoned-game', BRANCH = 'art', GH = 'https://api.github.com', M = 'https://api.meshy.ai/openapi/v1';
const WEEK = 60 * 60 * 24 * 7;

function b64(u8: Uint8Array) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); }
async function refDataUri(path: string) {
  const r = await fetch(`${GH}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, { headers: { Authorization: `Bearer ${Deno.env.get('GITHUB_TOKEN')}`, Accept: 'application/vnd.github.raw', 'User-Agent': 'oversummoned-mesh' } });
  if (!r.ok) throw new Error(`ref ${path}: ${r.status}`);
  const mime = path.endsWith('.png') ? 'image/png' : path.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${b64(new Uint8Array(await r.arrayBuffer()))}`;
}

Deno.serve(async (req) => {
  const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
  const key = Deno.env.get('MESHY_API_KEY');
  if (req.method === 'GET') return json({ ok: true, key_set: !!key });
  if (!key) return json({ ok: false, why: 'MESHY_API_KEY is not set' }, 500);
  const H = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const now = () => new Date().toISOString();
  let id = 0;
  try {
    id = Number((await req.json()).job);
    const { data: job } = await db.from('os_mesh_job').select().eq('id', id).maybeSingle();
    if (!job) return json({ ok: false, why: 'no such job' }, 404);
    const base = job.kind === 'rig' ? `${M}/rigging` : `${M}/multi-image-to-3d`;

    if (job.status === 'queued') {
      const { data: mine } = await db.from('os_mesh_job').update({ status: 'starting', updated_at: now() }).eq('id', id).eq('status', 'queued').select().maybeSingle();
      if (!mine) return json({ ok: false, why: 'already started' }, 409);
      const body: Record<string, unknown> = { ...job.params };
      if (job.kind === 'multi') { const imgs = []; for (const p of job.refs.slice(0, 4)) imgs.push(await refDataUri(p)); body.image_urls = imgs; }
      const r = await fetch(base, { method: 'POST', headers: H, body: JSON.stringify(body) });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || !out.result) throw new Error(`meshy ${r.status}: ${JSON.stringify(out).slice(0, 400)}`);
      await db.from('os_mesh_job').update({ status: 'running', task_id: out.result, updated_at: now() }).eq('id', id);
      return json({ ok: true, status: 'running', task_id: out.result });
    }

    if (job.status === 'running') {
      const t = await (await fetch(`${base}/${job.task_id}`, { headers: H })).json();
      if (t.status === 'SUCCEEDED') {
        const want: Record<string, string | undefined> = job.kind === 'rig'
          ? { 'rigged.glb': t.result?.rigged_character_glb_url, 'rigged.fbx': t.result?.rigged_character_fbx_url,
              'walking.glb': t.result?.basic_animations?.walking_glb_url, 'running.glb': t.result?.basic_animations?.running_glb_url }
          : { 'model.glb': t.model_urls?.glb, 'model.fbx': t.model_urls?.fbx, 'model.obj': t.model_urls?.obj, 'model.mtl': t.model_urls?.mtl,
              'thumbnail.png': t.thumbnail_url, ...Object.fromEntries(Object.entries(t.thumbnail_urls || {}).map(([k, v]) => [`view_${k}.png`, v as string])) };
        const files: Record<string, unknown> = {};
        for (const [name, u] of Object.entries(want)) {
          if (!u) continue;
          const bytes = new Uint8Array(await (await fetch(u)).arrayBuffer()), p = `${job.path}/${name}`;
          const type = name.endsWith('.png') ? 'image/png' : name.endsWith('.glb') ? 'model/gltf-binary' : 'application/octet-stream';
          const up = await db.storage.from('mesh').upload(p, bytes, { upsert: true, contentType: type });
          if (up.error) throw new Error(`store ${name}: ${up.error.message}`);
          const { data: s } = await db.storage.from('mesh').createSignedUrl(p, WEEK);
          files[name] = { path: p, bytes: bytes.length, url: s?.signedUrl };
        }
        await db.from('os_mesh_job').update({ status: 'done', result: { files, credits: t.consumed_credits ?? null, task: job.task_id }, updated_at: now() }).eq('id', id);
        return json({ ok: true, status: 'done', files });
      }
      if (t.status === 'FAILED' || t.status === 'CANCELED') throw new Error(`meshy task ${t.status}: ${JSON.stringify(t.task_error || {}).slice(0, 300)}`);
      await db.from('os_mesh_job').update({ result: { progress: t.progress ?? 0, meshy: t.status }, updated_at: now() }).eq('id', id);
      return json({ ok: true, status: t.status, progress: t.progress ?? 0 });
    }
    return json({ ok: true, status: job.status, result: job.result });
  } catch (e) {
    if (id) await db.from('os_mesh_job').update({ status: 'failed', result: { error: String(e).slice(0, 800) }, updated_at: now() }).eq('id', id);
    return json({ ok: false, error: String(e) }, 500);
  }
});
