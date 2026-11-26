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
    const body0 = await req.json();
    // {list: 'image-to-3d' | 'multi-image-to-3d' | 'text-to-3d' | 'remesh' | 'rigging'}: read-only, spends nothing
    if (body0.list) {
      const kind = String(body0.list).replace(/[^a-z0-9-]/g, '');
      const r = await fetch(`${M}/${kind}?page_size=30&sort_by=-created_at`, { headers: H });
      const out = await r.json().catch(() => ({}));
      const rows = Array.isArray(out) ? out : (out.result || out.data || []);
      return json({ ok: r.ok, status: r.status, n: rows.length, tasks: rows.map((t: any) => ({ id: t.id, status: t.status, created_at: t.created_at,
        name: t.name || null, prompt: (t.prompt || t.texture_prompt || '').slice(0, 80), thumb: t.thumbnail_url, formats: Object.keys(t.model_urls || {}), credits: t.consumed_credits })) });
    }
    // {vendor: [path]}: copies files of one pinned three.js release from jsDelivr to art/vendor/three/, for the repo.
    if (Array.isArray(body0.vendor)) {
      const saved: string[] = [], V = 'https://cdn.jsdelivr.net/npm/three@0.170.0/';
      for (const f of body0.vendor.slice(0, 12)) {
        const rel = String(f).replace(/\.\./g, '').replace(/^\/+/, ''); if (!/^(build|examples\/jsm)\/[\w\/.-]+\.js$/.test(rel)) continue;
        const r = await fetch(V + rel); if (!r.ok) { saved.push(`${rel}: ${r.status}`); continue; }
        const bytes = new Uint8Array(await r.arrayBuffer()), p = `art/vendor/three/${rel}`;
        const ex = await fetch(`${GH}/repos/${REPO}/contents/${p}?ref=${BRANCH}`, { headers: { Authorization: `Bearer ${Deno.env.get('GITHUB_TOKEN')}`, 'User-Agent': 'oversummoned-mesh' } });
        const w = await fetch(`${GH}/repos/${REPO}/contents/${p}`, { method: 'PUT', headers: { Authorization: `Bearer ${Deno.env.get('GITHUB_TOKEN')}`, 'User-Agent': 'oversummoned-mesh' },
          body: JSON.stringify({ message: `vendor three 0.170.0 ${rel}`, content: b64(bytes), branch: BRANCH, sha: ex.ok ? (await ex.json()).sha : undefined }) });
        saved.push(`${p} ${bytes.length} ${w.status}`);
      }
      return json({ ok: true, saved });
    }
    // {pull: {path, part}}: copies one 6 MB piece of a file in the mesh bucket to art/raw/mesh/<path>.partNN on the
    // art branch, so the workspace (which can reach GitHub but not this project) can put it back together.
    if (body0.pull) {
      const path = String(body0.pull.path).replace(/\.\./g, ''), part = Number(body0.pull.part) | 0, SZ = 6 * 1024 * 1024;
      const { data: sg } = await db.storage.from('mesh').createSignedUrl(path, 600);
      if (!sg) return json({ ok: false, why: 'no such file' }, 404);
      const r = await fetch(sg.signedUrl, { headers: { Range: `bytes=${part * SZ}-${part * SZ + SZ - 1}` } });
      const total = Number((r.headers.get('content-range') || '').split('/')[1] || 0);
      const bytes = new Uint8Array(await r.arrayBuffer()), gp = `art/raw/mesh/${path}.part${String(part).padStart(2, '0')}`;
      let st = 0;
      for (let a = 0; a < 6; a++) {
        const ex = await fetch(`${GH}/repos/${REPO}/contents/${gp}?ref=${BRANCH}`, { headers: { Authorization: `Bearer ${Deno.env.get('GITHUB_TOKEN')}`, 'User-Agent': 'oversummoned-mesh' } });
        const w = await fetch(`${GH}/repos/${REPO}/contents/${gp}`, { method: 'PUT', headers: { Authorization: `Bearer ${Deno.env.get('GITHUB_TOKEN')}`, 'User-Agent': 'oversummoned-mesh' },
          body: JSON.stringify({ message: `mesh part ${gp}`, content: b64(bytes), branch: BRANCH, sha: ex.ok ? (await ex.json()).sha : undefined }) });
        st = w.status; if (w.ok) break; await new Promise(z => setTimeout(z, 800 + 900 * a));
      }
      return json({ ok: st < 300, status: st, part, bytes: bytes.length, total, parts: total ? Math.ceil(total / SZ) : null });
    }
    // {thumbs: [{kind, id}]}: copies each task's preview images to the art branch, art/raw/meshy/<id>_*.png. Spends nothing.
    if (Array.isArray(body0.thumbs)) {
      const saved: string[] = [];
      for (const x of body0.thumbs.slice(0, 8)) {
        const kind = String(x.kind || 'image-to-3d').replace(/[^a-z0-9-]/g, ''), tid = String(x.id).replace(/[^a-f0-9-]/g, '');
        const t = await (await fetch(`${M}/${kind}/${tid}`, { headers: H })).json();
        const urls: Record<string, string> = { main: t.thumbnail_url, ...(t.thumbnail_urls || {}) };
        for (const [k, u] of Object.entries(urls)) {
          if (!u) continue;
          const bytes = new Uint8Array(await (await fetch(u)).arrayBuffer()), p = `art/raw/meshy/${tid}_${k}.png`;
          for (let a = 0; a < 6; a++) {
            const ex = await fetch(`${GH}/repos/${REPO}/contents/${p}?ref=${BRANCH}`, { headers: { Authorization: `Bearer ${Deno.env.get('GITHUB_TOKEN')}`, 'User-Agent': 'oversummoned-mesh' } });
            const sha = ex.ok ? (await ex.json()).sha : undefined;
            const r = await fetch(`${GH}/repos/${REPO}/contents/${p}`, { method: 'PUT', headers: { Authorization: `Bearer ${Deno.env.get('GITHUB_TOKEN')}`, 'User-Agent': 'oversummoned-mesh', Accept: 'application/vnd.github+json' },
              body: JSON.stringify({ message: `meshy preview ${tid} ${k}`, content: b64(bytes), branch: BRANCH, sha }) });
            if (r.ok) { saved.push(p); break; }
            await new Promise(z => setTimeout(z, 500 + 700 * a));
          }
        }
        const fc = (t.face_count ?? t.metadata?.face_count ?? null), vc = (t.vertex_count ?? t.metadata?.vertex_count ?? null);
        saved.push(`${tid}: faces ${fc} verts ${vc} keys ${Object.keys(t).join(',').slice(0, 300)}`);
      }
      return json({ ok: true, saved });
    }
    id = Number(body0.job);
    const { data: job } = await db.from('os_mesh_job').select().eq('id', id).maybeSingle();
    if (!job) return json({ ok: false, why: 'no such job' }, 404);
    const base = `${M}/${({ rig: 'rigging', remesh: 'remesh', multi: 'multi-image-to-3d' } as Record<string, string>)[job.kind]}`;

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
        const want: Record<string, string | undefined> = job.kind === 'remesh'
          ? { 'model.glb': t.model_urls?.glb, 'model.fbx': t.model_urls?.fbx, 'thumbnail.png': t.thumbnail_url, 'alpha.png': t.alpha_thumbnail_url,
              ...Object.fromEntries((t.texture_urls || []).flatMap((m: any, i: number) => Object.entries(m).map(([k, v]) => [`tex${i}_${k}.png`, v as string]))) }
          : job.kind === 'rig'
          ? { 'rigged.glb': t.result?.rigged_character_glb_url, 'rigged.fbx': t.result?.rigged_character_fbx_url,
              'walking.glb': t.result?.basic_animations?.walking_glb_url, 'running.glb': t.result?.basic_animations?.running_glb_url }
          : { 'model.glb': t.model_urls?.glb, 'model.fbx': t.model_urls?.fbx, 'model.obj': t.model_urls?.obj, 'model.mtl': t.model_urls?.mtl,
              'thumbnail.png': t.thumbnail_url, ...Object.fromEntries(Object.entries(t.thumbnail_urls || {}).map(([k, v]) => [`view_${k}.png`, v as string])) };
        // One file per call: an edge worker has little memory, and models plus textures run to tens of MB.
        // The game only needs GLB (the web loads it, Godot imports it), so FBX/OBJ are left on Meshy.
        for (const k of Object.keys(want)) if (!want[k] || /\.(fbx|obj|mtl)$/.test(k)) delete want[k];
        const files: Record<string, any> = { ...((job.result || {}).files || {}) };
        const next = Object.keys(want).find(k => !files[k]);
        if (next) {
          const u = want[next]!, buf = await (await fetch(u)).arrayBuffer(), p = `${job.path}/${next}`;
          const type = next.endsWith('.png') ? 'image/png' : next.endsWith('.glb') ? 'model/gltf-binary' : 'application/octet-stream';
          const up = await db.storage.from('mesh').upload(p, buf, { upsert: true, contentType: type });
          if (up.error) throw new Error(`store ${next}: ${up.error.message}`);
          const { data: sg } = await db.storage.from('mesh').createSignedUrl(p, WEEK);
          files[next] = { path: p, bytes: buf.byteLength, url: sg?.signedUrl };
          if ((next === 'thumbnail.png' || next === 'alpha.png') && buf.byteLength < 4e6) {
            const gp = `art/raw/meshy/job${id}_${next}`;
            const ex = await fetch(`${GH}/repos/${REPO}/contents/${gp}?ref=${BRANCH}`, { headers: { Authorization: `Bearer ${Deno.env.get('GITHUB_TOKEN')}`, 'User-Agent': 'oversummoned-mesh' } });
            await fetch(`${GH}/repos/${REPO}/contents/${gp}`, { method: 'PUT', headers: { Authorization: `Bearer ${Deno.env.get('GITHUB_TOKEN')}`, 'User-Agent': 'oversummoned-mesh' },
              body: JSON.stringify({ message: `mesh job ${id} preview`, content: b64(new Uint8Array(buf)), branch: BRANCH, sha: ex.ok ? (await ex.json()).sha : undefined }) });
          }
        }
        const left = Object.keys(want).filter(k => !files[k]);
        await db.from('os_mesh_job').update({ status: left.length ? 'running' : 'done', result: { files, left, credits: t.consumed_credits ?? null, task: job.task_id }, updated_at: now() }).eq('id', id);
        return json({ ok: true, status: left.length ? 'copying' : 'done', copied: next, left });
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
