-- Roll back Phase 2e step 3 (city traders and moving fair prices).
-- Needs os_bak_phase2e3_listing and os_bak_phase2e3_fair taken before step 3.
begin;
drop function if exists public.os_trader_act(text, jsonb);
create or replace function public.os_fair_update(p_item text) returns void
language plpgsql security definer set search_path to 'public' as $f$ begin return; end $f$;
create or replace function public.os_price_history(i text) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $f$
begin
  if auth.uid() is null or not os_ok() then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'item', i,
    'fair', (select fair from os_fair where item_id = i),
    'low', (select min(unit) from os_hall where item_id = i and status = 'open' and expires_at > now()),
    'days', coalesce((select jsonb_agg(jsonb_build_object('day', g.d, 'avg', x.avg, 'sold', coalesce(x.sold, 0), 'fair', null) order by g.d)
      from generate_series(current_date - 6, current_date, interval '1 day') g(d)
      left join (select created_at::date d, round(sum(unit * qty)::numeric / nullif(sum(qty), 0))::bigint avg, sum(qty)::int sold
                 from os_trade where item_id = i and source in ('hall', 'trader') and flag is null and created_at > current_date - 7 group by 1) x on x.d = g.d::date
      ), '[]'::jsonb),
    'avg', (select round(sum(unit * qty)::numeric / nullif(sum(qty), 0))::bigint from os_trade where item_id = i and source in ('hall', 'trader') and flag is null and created_at > now() - interval '7 days'),
    'sold', (select coalesce(sum(qty), 0) from os_trade where item_id = i and source in ('hall', 'trader') and flag is null and created_at > now() - interval '7 days')
  );
end $f$;
create or replace function public.os_market_pack(p_uid uuid)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select jsonb_build_object(
    'fair', coalesce((select jsonb_object_agg(f.item_id, f.fair) from os_fair f), '{}'::jsonb),
    'listings', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'item', l.item_id, 'price', l.price, 'qty', l.qty, 'today', 0, 'kind', l.kind, 'hero_id', l.hero_id)) from os_listing l where l.kind = 'item'), '[]'::jsonb),
    'cards', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'hero', l.hero_id, 'level', coalesce(l.hero_level,1), 'seller', coalesce(sp.name,'a trader'), 'price', l.price)) from os_listing l left join os_player sp on sp.uid = l.seller where l.kind = 'card'), '[]'::jsonb),
    'hall', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'item', h.item_id, 'qty', h.left_qty, 'unit', h.unit, 'seller', coalesce(sp.name, 'a trader'), 'until', h.expires_at, 'mine', h.seller = p_uid) order by h.item_id, h.unit, h.id)
      from (select * from os_hall where status = 'open' and expires_at > now() order by unit limit 200) h left join os_player sp on sp.uid = h.seller), '[]'::jsonb),
    'mine', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'item', h.item_id, 'qty', h.qty, 'left', h.left_qty, 'unit', h.unit, 'until', h.expires_at, 'status', h.status, 'deposit', h.deposit) order by h.id desc)
      from (select * from os_hall where seller = p_uid and (status = 'open' or created_at > now() - interval '2 days') order by id desc limit 30) h), '[]'::jsonb),
    'trade', public.os_can_trade(p_uid)
  );
$function$;

drop function if exists public.os_trader_left(uuid, text);
drop function if exists public.os_fair_roll();
drop table if exists public.os_trader_day;
drop table if exists public.os_fair_day;
alter table public.os_fair drop column if exists cap, drop column if exists sells;
update os_fair f set fair = b.fair, day_fair = b.day_fair, day = b.day from os_bak_phase2e3_fair b where b.item_id = f.item_id;
insert into os_listing select * from os_bak_phase2e3_listing on conflict (id) do nothing;
delete from os_config where key = 'phase2e3';
commit;
