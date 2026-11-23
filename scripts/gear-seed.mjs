// Prints the SQL that loads js/gear.js into the database (items, sets, hero stats).
import { GEAR, ERA_SETS, HERO_BASE } from '../js/gear.js';
const q = (v) => v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const j = (v) => v == null ? 'null' : `${q(JSON.stringify(v))}::jsonb`;
const out = [];
for (const [id, it] of Object.entries(GEAR)) {
  const use = it.use ? Object.assign({}, it.use, {name: it.name}) : null;
  out.push(`insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values (${q(id)}, ${q(it.name)}, ${q(it.rarity)}, ${q(it.slot)}, ${q(it.hero || null)}, ${it.pool ? 'true' : `coalesce((select found from public.os_hero_def where id = ${q(it.hero || '')}), false)`}, ${it.ilvl || 1}, ${q(it.bind || null)}, ${!!it.unique}, ${q(it.hand || null)}, ${q(it.type || null)}, ${it.armor || 0}, ${it.block || 0}, ${it.dmg ? it.dmg[0] : 'null'}, ${it.dmg ? it.dmg[1] : 'null'}, ${it.speed || 'null'}, ${j(it.stats || {})}, ${j(it.equip || [])}, ${j(it.fx || {})}, ${j(use)}, ${q(it.set || null)}, ${it.req || 1}, ${it.sell == null ? 'null' : it.sell}, ${it.stack || 'null'}, ${q(it.flavor || null)}, ${q(it.icon || null)})
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or ${it.pool ? 'true' : 'false'}, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;`);
}
for (const [id, s] of Object.entries(ERA_SETS)) {
  out.push(`insert into public.os_set (id, hero_id, name, bonus_name, bonus_text, stats, fx) values (${q(id)}, ${q(id)}, ${q(s.name)}, ${q(s.bonus)}, ${q(s.text)}, ${j(s.stats)}, ${j(s.fx)})
on conflict (id) do update set name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text, stats = excluded.stats, fx = excluded.fx;`);
}
const extra = {office_worker:['inflatable_tube_man'], legionary:['hobnailed_caligae']};
for (const [id, h] of Object.entries(HERO_BASE)) {
  const items = (ERA_SETS[id] ? ERA_SETS[id].items : []).concat(extra[id] || []);
  out.push(`update public.os_hero_def set base = ${j(h.base)}, fx = ${j(h.fx)}, short = ${q(h.short)}, items = array[${items.map(q).join(',')}]::text[] where id = ${q(id)};`);
}
console.log(out.join('\n'));
