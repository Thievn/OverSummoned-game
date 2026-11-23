-- Phase 2e step 3: city traders, and fair prices that follow real sales.
--  * Traders buy from you at 85% of the fair price, up to a daily amount per good (about two hours of work at the
--    best spot for it). They sell at 125%. They step back as more players trade in the Hall.
--  * The fair price blends the price we set with what players really pay in the Hall, once at least three different
--    buyers and three different sellers have traded it this week. It moves at most 10% a day.
--  * The old stall goes away; the traders take its place.
alter table public.os_fair add column if not exists cap int;
alter table public.os_fair add column if not exists sells boolean not null default false;

create table if not exists public.os_fair_day (
  item_id text not null references public.os_item_def(id) on delete cascade,
  day date not null,
  fair bigint not null,
  primary key (item_id, day)
);
alter table public.os_fair_day enable row level security;
revoke all on public.os_fair_day from anon, authenticated;

create table if not exists public.os_trader_day (
  uid uuid not null references public.os_player(uid) on delete cascade,
  item_id text not null,
  day date not null default current_date,
  sold int not null default 0,
  primary key (uid, item_id, day)
);
alter table public.os_trader_day enable row level security;
revoke all on public.os_trader_day from anon, authenticated;

-- Daily amounts: about two hours of steady work at the best spot for each good.
update os_fair f set cap = v.cap, sells = true from (values
  ('copper_ore', 3600), ('iron_ore', 2770), ('moonsilver_ore', 2400), ('ember_ore', 1710), ('void_ore', 1380), ('gem_violet', 190),
  ('ash_log', 3270), ('ironbark_log', 4800), ('moonwood_log', 4000), ('emberroot_log', 4900), ('voidtrunk_log', 3930),
  ('raw_eel', 4500), ('eel_stew', 3600), ('potion_pink', 2120), ('potion_cyan', 1900), ('iron_bar', 2250), ('moonsilver_bar', 1800)
) v(id, cap) where f.item_id = v.id;

-- Start a new day for every price: today's starting point is yesterday's close.
create or replace function public.os_fair_roll() returns void
language plpgsql security definer set search_path to 'public' as $f$
begin
  update os_fair set day = current_date, day_fair = fair where day < current_date;
  insert into os_fair_day(item_id, day, fair) select item_id, current_date, fair from os_fair
  on conflict (item_id, day) do nothing;
end $f$;
revoke all on function public.os_fair_roll() from public, anon, authenticated;

-- How much traders still want from you today. They step back as more players sell in the Hall.
create or replace function public.os_trader_left(p_uid uuid, p_item text) returns int
language sql stable security definer set search_path to 'public' as $f$
  select greatest(0, floor(coalesce(f.cap, 0) * greatest(0.25, 1 - (select count(distinct t.seller) from os_trade t where t.source = 'hall' and t.created_at > now() - interval '7 days') / 100.0))::int
    - coalesce((select sold from os_trader_day d where d.uid = p_uid and d.item_id = p_item and d.day = current_date), 0))
  from os_fair f where f.item_id = p_item;
$f$;
revoke all on function public.os_trader_left(uuid, text) from public, anon, authenticated;

create or replace function public.os_fair_update(p_item text) returns void
language plpgsql security definer set search_path to 'public' as $f$
declare f os_fair; nb int; ns int; mkt numeric; w numeric; target numeric; nf bigint;
begin
  perform os_fair_roll();
  select * into f from os_fair where item_id = p_item for update;
  if not found then return; end if;
  select count(distinct buyer), count(distinct seller) into nb, ns
    from os_trade where item_id = p_item and source = 'hall' and flag is null and created_at > now() - interval '7 days';
  if nb >= 3 and ns >= 3 then
    -- One vote per buyer: each buyer's middle price, then the middle of those.
    select percentile_cont(0.5) within group (order by m) into mkt from (
      select percentile_cont(0.5) within group (order by unit) m from os_trade
      where item_id = p_item and source = 'hall' and flag is null and created_at > now() - interval '7 days' group by buyer) b;
    w := least(0.8, nb / 20.0);
    target := f.anchor * (1 - w) + mkt * w;
  else
    target := f.anchor;
  end if;
  nf := greatest(1, round(least(f.day_fair * 1.1, greatest(f.day_fair * 0.9, target))))::bigint;
  update os_fair set fair = nf, updated_at = now() where item_id = p_item;
  insert into os_fair_day(item_id, day, fair) values (p_item, current_date, nf)
  on conflict (item_id, day) do update set fair = excluded.fair;
end $f$;
revoke all on function public.os_fair_update(text) from public, anon, authenticated;

create or replace function public.os_trader_act(op text, payload jsonb) returns jsonb
language plpgsql security definer set search_path to 'public' as $f$
declare u uuid := auth.uid(); f os_fair; v_item text := payload->>'item'; v_qty int; v_have int; v_left int; v_unit bigint;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  perform os_tick(u);
  perform os_fair_roll();
  select * into f from os_fair where item_id = v_item;
  if f.item_id is null or not f.sells then raise exception 'The traders do not deal in that.'; end if;
  v_qty := greatest(1, coalesce((payload->>'qty')::int, 1));
  if op = 'sell' then
    select qty into v_have from os_bag where uid = u and item_id = v_item for update;
    v_left := os_trader_left(u, v_item);
    if v_left < 1 then raise exception 'The traders have all they want from you today. The shop floor still buys.'; end if;
    v_qty := least(v_qty, coalesce(v_have, 0), v_left);
    if v_qty < 1 then raise exception 'You do not have any.'; end if;
    v_unit := greatest(1, floor(f.fair * 0.85))::bigint;
    perform os_give(u, v_item, -v_qty);
    perform os_wallet(u, v_unit * v_qty);
    insert into os_trader_day(uid, item_id, day, sold) values (u, v_item, current_date, v_qty)
    on conflict (uid, item_id, day) do update set sold = os_trader_day.sold + excluded.sold;
    insert into os_trade(item_id, price, qty, source, seller, unit) values (v_item, greatest(1, round(v_unit / 10000.0))::int, v_qty, 'trader', u, v_unit);
    insert into os_event(uid, kind, qty, ref) values (u, 'trade', least(v_unit * v_qty, 2147483647)::int, v_item);
  elsif op = 'buy' then
    v_qty := least(v_qty, 999);
    v_unit := ceil(f.fair * 1.25)::bigint;
    perform os_wallet(u, -(v_unit * v_qty));
    perform os_give(u, v_item, v_qty);
    insert into os_trade(item_id, price, qty, source, buyer, unit) values (v_item, greatest(1, round(v_unit / 10000.0))::int, v_qty, 'trader', u, v_unit);
    insert into os_event(uid, kind, qty, ref) values (u, 'trade', least(v_unit * v_qty, 2147483647)::int, v_item);
  else
    raise exception 'not allowed';
  end if;
  return os_pack(u);
end $f$;
revoke all on function public.os_trader_act(text, jsonb) from public, anon;
grant execute on function public.os_trader_act(text, jsonb) to authenticated;

create or replace function public.os_price_history(i text) returns jsonb
language plpgsql security definer set search_path to 'public' as $f$
begin
  if auth.uid() is null or not os_ok() then raise exception 'not allowed'; end if;
  perform os_fair_roll();
  return jsonb_build_object(
    'item', i,
    'fair', (select fair from os_fair where item_id = i),
    'low', (select min(unit) from os_hall where item_id = i and status = 'open' and expires_at > now()),
    'days', coalesce((select jsonb_agg(jsonb_build_object('day', g.d::date, 'avg', x.avg, 'sold', coalesce(x.sold, 0),
        'fair', (select fd.fair from os_fair_day fd where fd.item_id = i and fd.day <= g.d::date order by fd.day desc limit 1)) order by g.d)
      from generate_series(current_date - 6, current_date, interval '1 day') g(d)
      left join (select created_at::date d, round(sum(unit * qty)::numeric / nullif(sum(qty), 0))::bigint avg, sum(qty)::int sold
                 from os_trade where item_id = i and source = 'hall' and flag is null and created_at > current_date - 7 group by 1) x on x.d = g.d::date
      ), '[]'::jsonb),
    'avg', (select round(sum(unit * qty)::numeric / nullif(sum(qty), 0))::bigint from os_trade where item_id = i and source = 'hall' and flag is null and created_at > now() - interval '7 days'),
    'sold', (select coalesce(sum(qty), 0) from os_trade where item_id = i and source = 'hall' and flag is null and created_at > now() - interval '7 days')
  );
end $f$;
revoke all on function public.os_price_history(text) from public, anon;
grant execute on function public.os_price_history(text) to authenticated;

create or replace function public.os_market_pack(p_uid uuid)
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select jsonb_build_object(
    'fair', coalesce((select jsonb_object_agg(f.item_id, f.fair) from os_fair f), '{}'::jsonb),
    'traders', coalesce((select jsonb_agg(jsonb_build_object('item', f.item_id, 'fair', f.fair, 'buys', greatest(1, floor(f.fair * 0.85))::bigint, 'sells', ceil(f.fair * 1.25)::bigint,
        'today', round(100.0 * (f.fair - f.day_fair) / greatest(1, f.day_fair), 1), 'left', public.os_trader_left(p_uid, f.item_id)) order by f.fair)
      from os_fair f where f.sells), '[]'::jsonb),
    'listings', '[]'::jsonb,
    'cards', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'hero', l.hero_id, 'level', coalesce(l.hero_level,1), 'seller', coalesce(sp.name,'a trader'), 'price', l.price)) from os_listing l left join os_player sp on sp.uid = l.seller where l.kind = 'card'), '[]'::jsonb),
    'hall', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'item', h.item_id, 'qty', h.left_qty, 'unit', h.unit, 'seller', coalesce(sp.name, 'a trader'), 'until', h.expires_at, 'mine', h.seller = p_uid) order by h.item_id, h.unit, h.id)
      from (select * from os_hall where status = 'open' and expires_at > now() order by unit limit 200) h left join os_player sp on sp.uid = h.seller), '[]'::jsonb),
    'mine', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'item', h.item_id, 'qty', h.qty, 'left', h.left_qty, 'unit', h.unit, 'until', h.expires_at, 'status', h.status, 'deposit', h.deposit) order by h.id desc)
      from (select * from os_hall where seller = p_uid and (status = 'open' or created_at > now() - interval '2 days') order by id desc limit 30) h), '[]'::jsonb),
    'trade', public.os_can_trade(p_uid)
  );
$function$;
revoke all on function public.os_market_pack(uuid) from public, anon, authenticated;

-- The old stall's goods are now the traders' business.
delete from os_listing where kind = 'item' and seller is null;
select public.os_fair_roll();

insert into os_config(key, value) values ('phase2e3', jsonb_build_object('at', now(), 'buy', 0.85, 'sell', 1.25, 'dayMove', 0.1))
on conflict (key) do nothing;
