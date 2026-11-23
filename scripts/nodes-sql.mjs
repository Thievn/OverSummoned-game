// Prints os_node and os_node_lv built from js/catalog.js NODES, so the server and the browser
// always agree on every skill spot. Usage: node scripts/nodes-sql.mjs > part.sql
import { NODES } from '../js/catalog.js';
const rows = [], lvs = [];
for (const [sk, list] of Object.entries(NODES)) for (const n of list) {
  const spec = {sec: n.sec, xp: n.xp, item: n.item, qty: n.qty || 1};
  if (n.use) spec.use = n.use;
  rows.push(`    when '${sk}:${n.id}' then '${JSON.stringify(spec)}'::jsonb`);
  lvs.push(`    when '${sk}:${n.id}' then ${n.lv}`);
}
console.log(`create or replace function public.os_node(p_skill text, p_node text)
 returns jsonb language sql immutable set search_path to 'public' as $function$
  select case p_skill||':'||p_node
${rows.join('\n')}
    else null end;
$function$;
create or replace function public.os_node_lv(p_skill text, p_node text)
 returns integer language sql immutable set search_path to '' as $function$
  select case p_skill || ':' || p_node
${lvs.join('\n')}
    else 999 end
$function$;
revoke all on function public.os_node(text, text) from public, anon, authenticated;
revoke all on function public.os_node_lv(text, text) from public, anon, authenticated;`);
