-- Phase 2e step 1: fair prices and the shop floor.
--  * Every good has a fair price (copper; 10,000 copper is 1 gold). The shop floor pays half of it, any amount, right away.
--  * Ash logs, healing draughts, moonsilver bars and eel stew come down to fair prices.
--  * Each tree drops its own wood: ironbark, moonwood, ember root and void trunk logs.
--  * Heroes and gear speed a skill up by at most 30%, so the best spot tops out near 8,000 gold an hour.
-- Mirrors js/catalog.js (ITEMS sell, NODES) and js/fight.js (fasterMult).
do $g$
declare want jsonb := '{"os_node":"bd84d7cbf0f8023630ba9aac0c466950","os_skill_mult":"af3534282136c6f6ea1110f51dff5051","os_sell":"530e528b512f4967db7137876ce588ab","os_pack":"f41657ecd67626f1299a21a0dd9694e6"}';
  k text; v text; have text;
begin
  if exists(select 1 from os_config where key = 'phase2e1') then return; end if;
  for k, v in select key, value from jsonb_each_text(want) loop
    select md5(prosrc) into have from pg_proc where proname = k and pronamespace = 'public'::regnamespace;
    if have is distinct from v then raise exception '% changed since this file was written. Rebuild it on the new definitions.', k; end if;
  end loop;
end $g$;

-- The new woods.
insert into os_item_def(id, name, rarity, slot, in_pool, sell_copper, flavor, icon) values
  ('ironbark_log', 'Ironbark log', 'common', 'mat', false, 2000, 'Heavy and grey. It rings when you drop it.', 'ironbark_log'),
  ('moonwood_log', 'Moonwood log', 'uncommon', 'mat', false, 4800, 'The grain glows a soft blue in the dark.', 'moonwood_log'),
  ('emberroot_log', 'Ember root log', 'rare', 'mat', false, 9600, 'Warm to the touch, even in winter.', 'emberroot_log'),
  ('voidtrunk_log', 'Void trunk log', 'epic', 'mat', false, 19400, 'No bird has ever sat on it.', 'voidtrunk_log')
on conflict (id) do nothing;

-- Fair prices. anchor is the price we set; fair is what the market says, and starts at the anchor.
create table if not exists public.os_fair (
  item_id text primary key references public.os_item_def(id) on delete cascade,
  anchor bigint not null check (anchor > 0),
  fair bigint not null check (fair > 0),
  day date not null default current_date,
  day_fair bigint not null,
  updated_at timestamptz not null default now()
);
alter table public.os_fair enable row level security;
revoke all on public.os_fair from anon, authenticated;

-- The sale log: every sale, who sold, who bought, and where.
alter table public.os_trade add column if not exists source text;
alter table public.os_trade add column if not exists seller uuid;
alter table public.os_trade add column if not exists buyer uuid;
alter table public.os_trade add column if not exists unit bigint;
alter table public.os_trade add column if not exists flag text;
create index if not exists os_trade_item_at on public.os_trade(item_id, created_at desc);

-- What the shop floor pays for one of something: half the fair price.
create or replace function public.os_shop_unit(p_item text) returns bigint
language sql stable security definer set search_path to 'public' as $f$
  select greatest(1, floor(coalesce(
    (select f.fair from os_fair f where f.item_id = p_item),
    (select d.sell_copper from os_item_def d where d.id = p_item),
    (select os_sellval(d.rarity)::bigint * 10000 from os_item_def d where d.id = p_item),
    2) / 2))::bigint;
$f$;
revoke all on function public.os_shop_unit(text) from public, anon;
grant execute on function public.os_shop_unit(text) to authenticated;

-- Add or take copper from a purse. Taking more than there is fails.
create or replace function public.os_wallet(p_uid uuid, p_delta bigint) returns bigint
language plpgsql security definer set search_path to 'public' as $f$
declare tot bigint;
begin
  select gold::bigint * 10000 + copper::bigint + p_delta into tot from os_player where uid = p_uid for update;
  if tot is null then raise exception 'not allowed'; end if;
  if tot < 0 then raise exception 'Not enough gold.'; end if;
  update os_player set gold = (tot / 10000)::int, copper = (tot % 10000)::int where uid = p_uid;
  return tot;
end $f$;
revoke all on function public.os_wallet(uuid, bigint) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.os_node(p_skill text, p_node text)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case p_skill||':'||p_node
    when 'mining:copper' then '{"sec":2,"xp":5,"item":"copper_ore","qty":1}'::jsonb
    when 'mining:iron' then '{"sec":2.6,"xp":14,"item":"iron_ore","qty":1}'::jsonb
    when 'mining:moonsilver' then '{"sec":3,"xp":38,"item":"moonsilver_ore","qty":1}'::jsonb
    when 'mining:ember' then '{"sec":4.2,"xp":70,"item":"ember_ore","qty":1}'::jsonb
    when 'mining:void' then '{"sec":5.2,"xp":110,"item":"void_ore","qty":1}'::jsonb
    when 'mining:starfall' then '{"sec":6.4,"xp":180,"item":"gem_violet","qty":1,"every":6}'::jsonb
    when 'woodcutting:ash' then '{"sec":2.2,"xp":6,"item":"ash_log","qty":1}'::jsonb
    when 'woodcutting:ironbark' then '{"sec":3,"xp":16,"item":"ironbark_log","qty":2}'::jsonb
    when 'woodcutting:moonwood' then '{"sec":3.6,"xp":34,"item":"moonwood_log","qty":2}'::jsonb
    when 'woodcutting:emberroot' then '{"sec":4.4,"xp":72,"item":"emberroot_log","qty":3}'::jsonb
    when 'woodcutting:voidtrunk' then '{"sec":5.5,"xp":120,"item":"voidtrunk_log","qty":3}'::jsonb
    when 'fishing:eel' then '{"sec":2.4,"xp":6,"item":"raw_eel","qty":1}'::jsonb
    when 'fishing:lantern' then '{"sec":3.2,"xp":20,"item":"raw_eel","qty":2}'::jsonb
    when 'fishing:ashpond' then '{"sec":4,"xp":48,"item":"raw_eel","qty":2}'::jsonb
    when 'fishing:deep' then '{"sec":5.4,"xp":100,"item":"raw_eel","qty":3}'::jsonb
    when 'cooking:stew' then '{"sec":3,"xp":18,"item":"eel_stew","qty":1,"use":{"raw_eel":1}}'::jsonb
    when 'cooking:feast' then '{"sec":4,"xp":40,"item":"eel_stew","qty":2,"use":{"raw_eel":2}}'::jsonb
    when 'cooking:broth' then '{"sec":5,"xp":80,"item":"potion_pink","qty":1,"use":{"raw_eel":1,"gem_violet":1}}'::jsonb
    when 'smithing:iron' then '{"sec":3.2,"xp":16,"item":"iron_bar","qty":1,"use":{"iron_ore":2}}'::jsonb
    when 'smithing:moon' then '{"sec":4,"xp":36,"item":"moonsilver_bar","qty":1,"use":{"moonsilver_ore":2}}'::jsonb
    when 'smithing:gladius' then '{"sec":4,"xp":120,"item":"moonsilver_gladius","qty":1,"use":{"moonsilver_bar":4,"ash_log":2}}'::jsonb
    when 'alchemy:draught' then '{"sec":3.4,"xp":20,"item":"potion_pink","qty":1,"use":{"raw_eel":1,"ash_log":1}}'::jsonb
    when 'alchemy:oil' then '{"sec":3.8,"xp":28,"item":"potion_cyan","qty":1,"use":{"ash_log":2,"copper_ore":1}}'::jsonb
    when 'alchemy:violet' then '{"sec":6,"xp":140,"item":"gem_violet","qty":1,"use":{"potion_pink":1,"potion_cyan":1},"every":10}'::jsonb
    when 'summoning:whisper' then '{"sec":4,"xp":22,"item":"card_shard","qty":1}'::jsonb
    when 'summoning:sigil' then '{"sec":8,"xp":60,"item":"summon_sigil","qty":1,"every":4}'::jsonb
    when 'summoning:name' then '{"sec":7,"xp":120,"item":"card_shard","qty":2}'::jsonb
    else null end;
$function$;

CREATE OR REPLACE FUNCTION public.os_skill_mult(p_uid uuid, p_skill text, p_hero text)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare pct float8 := 0; s jsonb;
begin
  if p_hero is null or p_hero = '' or not exists(select 1 from os_hero where uid = p_uid and hero_id = p_hero) then return 1; end if;
  s := os_hero_stats(p_uid, p_hero);
  pct := coalesce((s->'fx'->>p_skill)::float8, 0)
    + case when p_hero = 'engineer' and p_skill = 'mining' then 15 when p_hero = 'legionary' and p_skill = 'smithing' then 15 else 0 end;
  return (1 - least(30, greatest(0, pct)) / 100)::numeric;
end $function$;

create or replace function public.os_market_pack(p_uid uuid)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select jsonb_build_object(
      'fair', coalesce((select jsonb_object_agg(f.item_id, f.fair) from os_fair f), '{}'::jsonb),
      'listings', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'item', l.item_id, 'price', l.price, 'qty', l.qty, 'today', 0, 'kind', l.kind, 'hero_id', l.hero_id)) from os_listing l where l.kind = 'item'), '[]'::jsonb),
      'cards', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'hero', l.hero_id, 'level', coalesce(l.hero_level,1), 'seller', coalesce(sp.name,'a trader'), 'price', l.price)) from os_listing l left join os_player sp on sp.uid = l.seller where l.kind = 'card'), '[]'::jsonb),
      'orders', coalesce((select jsonb_agg(jsonb_build_object('text','Selling '||l.qty||' '||coalesce(i.name,l.item_id),'meta','Listed','good', true)) from os_listing l left join os_item_def i on i.id = l.item_id where l.seller = p_uid), '[]'::jsonb)
    );
$function$;

CREATE OR REPLACE FUNCTION public.os_pack(p_uid uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare p public.os_player; welcome jsonb;
begin
  select * into p from os_player where uid = p_uid;
  if p.pending is not null and p.pending->'items' is not null then
    select jsonb_build_object(
      'away', coalesce(p.pending->>'away','a while'),
      'lines', coalesce(jsonb_agg(jsonb_build_object(
        'icon','chest','text', i.name || ' came in','value','+' || e.value,'cls','lm')), '[]'::jsonb)
    ) into welcome
    from jsonb_each_text(p.pending->'items') e
    join os_item_def i on i.id = e.key;
  end if;
  return jsonb_build_object(
    'now', now(),
    'player', (select to_jsonb(x) from os_player x where x.uid = p_uid),
    'heroes', coalesce((select jsonb_agg(to_jsonb(h)) from os_hero h where h.uid = p_uid), '[]'::jsonb),
    'bag', coalesce((select jsonb_agg(jsonb_build_object('id', b.item_id, 'qty', b.qty)) from os_bag b where b.uid = p_uid), '[]'::jsonb),
    'delve', (select to_jsonb(d) from os_delve d where d.uid = p_uid),
    'known', coalesce((select jsonb_agg(hd.id) from os_hero_def hd where hd.found and hd.owner_uid is null), '[]'::jsonb),
    'feed', coalesce((select jsonb_agg(f.msg) from (select msg from os_feed order by id desc limit 8) f), '[]'::jsonb),
    'crier', coalesce((select jsonb_agg(jsonb_build_object('tag', coalesce(c.tag,'Streets'), 'msg', c.msg, 'at', c.at) order by c.id desc) from (select * from os_feed order by id desc limit 20) c), '[]'::jsonb),
    'welcome', welcome,
    'gear', coalesce((select jsonb_object_agg(x.hero_id, x.g) from (select g.hero_id, jsonb_object_agg(g.slot, g.item_id) g from os_gear g where g.uid = p_uid group by g.hero_id) x), '{}'::jsonb),
    'stats', coalesce((select jsonb_object_agg(h.hero_id, public.os_hero_stats(p_uid, h.hero_id)) from os_hero h where h.uid = p_uid), '{}'::jsonb),
    'market', public.os_market_pack(p_uid),
    'config', coalesce((select jsonb_object_agg(key, value) from os_config), '{}'::jsonb),
    'infirmary', coalesce((select jsonb_agg(jsonb_build_object('id', hero_id, 'name', hero_id, 'reason', reason, 'until', until)) from os_infirmary where uid = p_uid and until > now()), '[]'::jsonb),
    'crew', (
      select jsonb_build_object(
        'name', c.name, 'rank', 1, 'members', (select count(*) from os_crew_member mm where mm.crew_id = c.id),
        'max', 25, 'online', 1, 'perk', '+5% XP', 'vaultOre', coalesce((c.vault->>'moonsilver_ore')::int, c.goal_have),
        'goal', c.goal_need, 'youGave', c.goal_have, 'motto', coalesce(c.motto,''), 'code', c.code,
        'roster', coalesce((select jsonb_agg(jsonb_build_object('name', pp.name, 'role', mm.role, 'line', 'In the city', 'on', true, 'face', 'engineer')) from os_crew_member mm join os_player pp on pp.uid = mm.uid where mm.crew_id = c.id), '[]'::jsonb),
        'chat', coalesce((select jsonb_agg(jsonb_build_object('who', coalesce(pp.name,'Crew'), 'face', 'engineer', 'color', 'cy', 't', to_char(ch.created_at, 'HH12:MI PM'), 'text', ch.body) order by ch.id) from os_chat ch left join os_player pp on pp.uid = ch.uid where ch.crew_id = c.id), '[]'::jsonb),
        'cup', coalesce((select jsonb_agg(jsonb_build_array(cc.name, cc.cup) order by cc.cup desc) from os_crew cc), '[]'::jsonb),
        'raid', 'The Hollow Bishop', 'raidN', 0
      )
      from os_crew c
      join os_crew_member me on me.crew_id = c.id and me.uid = p_uid
    )
  );
end $function$;

CREATE OR REPLACE FUNCTION public.os_sell(i text, q integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid := auth.uid(); have int; r text; v bigint; fee numeric; price int; unit bigint; sc bigint; tot bigint;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select b.qty into have from os_bag b where b.uid = u and b.item_id = i for update;
  if have is null or q < 1 then raise exception 'nothing to sell'; end if;
  if exists(select 1 from os_item_def where id = i and owner_uid is not null) then raise exception 'That one stays with you.'; end if;
  if i in ('card_shard', 'summon_sigil') then raise exception 'The circle keeps those. They cannot be sold.'; end if;
  q := least(q, have);
  -- The shop floor pays half the fair price, any amount, right away.
  unit := public.os_shop_unit(i);
  v := greatest(1, unit * q);
  if have - q <= 0 then delete from os_bag where uid = u and item_id = i; else update os_bag set qty = qty - q where uid = u and item_id = i; end if;
  select copper::bigint + v into tot from os_player where uid = u;
  update os_player set gold = gold + (tot / 10000)::int, copper = (tot % 10000)::int where uid = u;
  insert into os_trade(item_id, price, qty, source, seller, unit) values (i, greatest(1, round(unit / 10000.0))::int, q, 'shop', u, unit);
  insert into os_event(uid, kind, qty, ref) values (u, 'trade', least(v, 2147483647)::int, i);
  return least(v, 2147483647)::int;
end $function$;

-- Fair prices, in copper. The shop floor pays half.
update os_item_def set sell_copper = v.c from (values
  ('ash_log', 1800), ('eel_stew', 5000), ('potion_pink', 8000), ('moonsilver_bar', 30000)
) v(id, c) where os_item_def.id = v.id;
insert into os_fair(item_id, anchor, fair, day_fair)
select d.id, d.sell_copper, d.sell_copper, d.sell_copper from os_item_def d
where d.owner_uid is null and d.hero_id is null and d.sell_copper is not null and d.sell_copper > 0
  and d.id not in ('card_shard', 'summon_sigil')
on conflict (item_id) do update set anchor = excluded.anchor, fair = excluded.fair, day_fair = excluded.day_fair, updated_at = now();

revoke all on function public.os_market_pack(uuid) from public, anon, authenticated;

insert into os_config(key, value) values ('phase2e1', jsonb_build_object('at', now(), 'shop', 0.5, 'heroCap', 30))
on conflict (key) do nothing;
