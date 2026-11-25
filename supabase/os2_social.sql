-- OverSummoned: friends, visiting ledgers, gifts, guilds (weekly goal + chat), the market, per-skill boards.
-- Every table is closed (row security on, no policies). All access is through the functions below,
-- each of which checks the caller is signed in and on the allow-list.
create table if not exists public.os2_friend (a uuid not null references auth.users on delete cascade, b uuid not null references auth.users on delete cascade, status text not null default 'pending', created_at timestamptz not null default now(), primary key (a, b), check (a <> b));
create table if not exists public.os2_mail (id bigserial primary key, to_id uuid not null references auth.users on delete cascade, from_name text not null, kind text not null, payload jsonb not null, created_at timestamptz not null default now(), claimed_at timestamptz);
create index if not exists os2_mail_to on public.os2_mail (to_id) where claimed_at is null;
create table if not exists public.os2_guild (id uuid primary key default gen_random_uuid(), name citext not null unique, owner uuid not null references auth.users on delete cascade, created_at timestamptz not null default now());
create table if not exists public.os2_guild_member (user_id uuid primary key references auth.users on delete cascade, guild_id uuid not null references public.os2_guild on delete cascade, joined_at timestamptz not null default now());
create index if not exists os2_guild_member_g on public.os2_guild_member (guild_id);
create table if not exists public.os2_guild_haul (guild_id uuid not null references public.os2_guild on delete cascade, week int not null, user_id uuid not null references auth.users on delete cascade, hauls bigint not null default 0, primary key (guild_id, week, user_id));
create table if not exists public.os2_chat (id bigserial primary key, guild_id uuid not null references public.os2_guild on delete cascade, user_id uuid not null references auth.users on delete cascade, username text not null, body text not null, created_at timestamptz not null default now());
create index if not exists os2_chat_g on public.os2_chat (guild_id, id desc);
create table if not exists public.os2_listing (id bigserial primary key, seller uuid not null references auth.users on delete cascade, seller_name text not null, item text not null, qty int not null check (qty between 1 and 99), price int not null check (price between 1 and 100000), created_at timestamptz not null default now(), buyer uuid, closed_at timestamptz);
create index if not exists os2_listing_open on public.os2_listing (item, price) where closed_at is null;
alter table public.os2_friend enable row level security; alter table public.os2_mail enable row level security; alter table public.os2_guild enable row level security;
alter table public.os2_guild_member enable row level security; alter table public.os2_guild_haul enable row level security; alter table public.os2_chat enable row level security; alter table public.os2_listing enable row level security;

create or replace function public.os2_week() returns int language sql stable as $$ select floor((extract(epoch from now()) / 86400 + 3) / 7)::int $$;
create or replace function public.os2_uid() returns uuid language plpgsql stable security definer set search_path = public, auth as $$
begin if auth.uid() is null or not public.os2_allowed() then raise exception 'not allowed'; end if; return auth.uid(); end $$;
create or replace function public.os2_name(u uuid) returns text language sql stable security definer set search_path = public as $$ select username::text from os2_profile where id = u $$;
create or replace function public.os2_who(n text) returns uuid language sql stable security definer set search_path = public as $$ select id from os2_profile where username = n::citext $$;

-- everything the City screen needs in one call
create or replace function public.os2_social() returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); g uuid; wk int := public.os2_week();
begin
  select guild_id into g from os2_guild_member where user_id = me;
  return jsonb_build_object(
    'friends', (select coalesce(jsonb_agg(x order by x->>'username'), '[]'::jsonb) from (
        select jsonb_build_object('username', p.username, 'status', f.status, 'mine', f.a = me, 'total_level', coalesce(s.total_level, 0), 'heroes', coalesce(s.heroes, 0), 'seen', s.updated_at) x
        from os2_friend f join os2_profile p on p.id = case when f.a = me then f.b else f.a end left join os2_save s on s.user_id = p.id where f.a = me or f.b = me) q),
    'mail', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'from', from_name, 'kind', kind, 'payload', payload, 'at', created_at) order by id), '[]'::jsonb) from os2_mail where to_id = me and claimed_at is null),
    'guild', case when g is null then null else (select jsonb_build_object('name', gd.name, 'owner', public.os2_name(gd.owner), 'week', wk,
        'hauls', (select coalesce(sum(hauls), 0) from os2_guild_haul where guild_id = g and week = wk),
        'members', (select jsonb_agg(jsonb_build_object('username', p.username, 'total_level', coalesce(s.total_level, 0), 'hauls', coalesce(h.hauls, 0)) order by coalesce(h.hauls, 0) desc)
            from os2_guild_member m join os2_profile p on p.id = m.user_id left join os2_save s on s.user_id = m.user_id left join os2_guild_haul h on h.guild_id = g and h.week = wk and h.user_id = m.user_id where m.guild_id = g),
        'chat', (select coalesce(jsonb_agg(c order by (c->>'id')::bigint), '[]'::jsonb) from (select jsonb_build_object('id', id, 'username', username, 'body', body, 'at', created_at) c from os2_chat where guild_id = g order by id desc limit 40) q))
      from os2_guild gd where gd.id = g) end,
    'guilds', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select gd.name, (select count(*) from os2_guild_member m where m.guild_id = gd.id) members,
        (select coalesce(sum(hauls), 0) from os2_guild_haul h where h.guild_id = gd.id and h.week = wk) hauls from os2_guild gd order by 3 desc, 2 desc limit 20) x));
end $$;

create or replace function public.os2_friend_add(n text) returns text language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); them uuid := public.os2_who(n);
begin
  if them is null then return 'Nobody by that name.'; end if;
  if them = me then return 'That is you.'; end if;
  if exists (select 1 from os2_friend where a = them and b = me) then update os2_friend set status = 'ok' where a = them and b = me; return 'Friends now.'; end if;
  if (select count(*) from os2_friend where a = me) >= 100 then return 'That is enough friends.'; end if;
  insert into os2_friend (a, b) values (me, them) on conflict do nothing; return 'Asked.';
end $$;
create or replace function public.os2_friend_drop(n text) returns void language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); them uuid := public.os2_who(n);
begin delete from os2_friend where (a = me and b = them) or (a = them and b = me); end $$;

-- look at somebody else's ledger (read only, summary)
create or replace function public.os2_peek(n text) returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); them uuid := public.os2_who(n);
begin
  if them is null then return null; end if;
  return (select jsonb_build_object('username', p.username, 'joined', p.created_at, 'seen', s.updated_at, 'total_level', coalesce(s.total_level, 0), 'heroes', coalesce(s.heroes, 0), 'summons', coalesce(s.summons, 0),
      'roster', coalesce(s.data->'roster', '{}'::jsonb), 'xp', coalesce(s.data->'xp', '{}'::jsonb), 'rebirth', coalesce(s.data->'rebirth', '{}'::jsonb), 'crew', coalesce(s.data->'crew', '[]'::jsonb),
      'cabinet', (select count(*) from jsonb_object_keys(coalesce(s.data->'cabinet', '{}'::jsonb))),
      'guild', (select gd.name from os2_guild_member m join os2_guild gd on gd.id = m.guild_id where m.user_id = them),
      'friend', (select status from os2_friend where (a = me and b = them) or (a = them and b = me)))
    from os2_profile p left join os2_save s on s.user_id = p.id where p.id = them);
end $$;

-- gifts and market money arrive as mail, which the game collects
create or replace function public.os2_gift(n text, p_item text, p_qty int) returns text language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); them uuid := public.os2_who(n);
begin
  if them is null or not exists (select 1 from os2_friend where status = 'ok' and ((a = me and b = them) or (a = them and b = me))) then return 'You can only send things to friends.'; end if;
  if p_qty < 1 or p_qty > 99 or length(p_item) > 40 then return 'No.'; end if;
  if (select count(*) from os2_mail where from_name = public.os2_name(me) and kind = 'gift' and created_at > now() - interval '1 day') >= 20 then return 'Twenty gifts a day is plenty.'; end if;
  insert into os2_mail (to_id, from_name, kind, payload) values (them, public.os2_name(me), 'gift', jsonb_build_object('item', p_item, 'qty', p_qty)); return 'ok';
end $$;
create or replace function public.os2_mail_claim(p_id bigint) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); r jsonb;
begin update os2_mail set claimed_at = now() where id = p_id and to_id = me and claimed_at is null returning jsonb_build_object('kind', kind, 'from', from_name, 'payload', payload) into r; return r; end $$;

-- guilds
create or replace function public.os2_guild_create(n text) returns text language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); g uuid;
begin
  n := btrim(n); if n !~ '^[A-Za-z0-9 ]{3,24}$' then return 'Three to 24 letters, numbers or spaces.'; end if;
  if exists (select 1 from os2_guild_member where user_id = me) then return 'Leave your guild first.'; end if;
  if exists (select 1 from os2_guild where name = n::citext) then return 'That name is taken.'; end if;
  insert into os2_guild (name, owner) values (n, me) returning id into g; insert into os2_guild_member (user_id, guild_id) values (me, g); return 'ok';
end $$;
create or replace function public.os2_guild_join(n text) returns text language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); g uuid;
begin
  select id into g from os2_guild where name = n::citext; if g is null then return 'No such guild.'; end if;
  if exists (select 1 from os2_guild_member where user_id = me) then return 'Leave your guild first.'; end if;
  if (select count(*) from os2_guild_member where guild_id = g) >= 30 then return 'That guild is full.'; end if;
  insert into os2_guild_member (user_id, guild_id) values (me, g); return 'ok';
end $$;
create or replace function public.os2_guild_leave() returns void language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); g uuid;
begin
  delete from os2_guild_member where user_id = me returning guild_id into g; if g is null then return; end if;
  if not exists (select 1 from os2_guild_member where guild_id = g) then delete from os2_guild where id = g;
  else update os2_guild set owner = (select user_id from os2_guild_member where guild_id = g order by joined_at limit 1) where id = g and owner = me; end if;
end $$;
create or replace function public.os2_guild_haul_add(p_n int) returns void language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); g uuid;
begin
  select guild_id into g from os2_guild_member where user_id = me; if g is null or p_n < 1 then return; end if;
  insert into os2_guild_haul (guild_id, week, user_id, hauls) values (g, public.os2_week(), me, least(p_n, 3000))
  on conflict (guild_id, week, user_id) do update set hauls = os2_guild_haul.hauls + least(excluded.hauls, 3000);
end $$;
create or replace function public.os2_guild_say(p_body text) returns text language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); g uuid;
begin
  select guild_id into g from os2_guild_member where user_id = me; if g is null then return 'Join a guild first.'; end if;
  p_body := btrim(p_body); if length(p_body) < 1 or length(p_body) > 200 then return 'One to 200 letters.'; end if;
  if exists (select 1 from os2_chat where user_id = me and created_at > now() - interval '3 seconds') then return 'Slow down.'; end if;
  insert into os2_chat (guild_id, user_id, username, body) values (g, me, public.os2_name(me), p_body); return 'ok';
end $$;

-- the market
create or replace function public.os2_market() returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid();
begin
  return jsonb_build_object(
    'open', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select id, seller_name seller, item, qty, price, created_at at from os2_listing where closed_at is null and seller <> me order by created_at desc limit 150) x),
    'mine', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select id, item, qty, price, created_at at from os2_listing where closed_at is null and seller = me order by created_at desc) x));
end $$;
create or replace function public.os2_market_list(p_item text, p_qty int, p_price int) returns text language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid();
begin
  if p_qty < 1 or p_qty > 99 or p_price < 1 or p_price > 100000 or length(p_item) > 40 then return 'No.'; end if;
  if (select count(*) from os2_listing where seller = me and closed_at is null) >= 10 then return 'Ten things on the stall at a time.'; end if;
  insert into os2_listing (seller, seller_name, item, qty, price) values (me, public.os2_name(me), p_item, p_qty, p_price); return 'ok';
end $$;
create or replace function public.os2_market_cancel(p_id bigint) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); r jsonb;
begin update os2_listing set closed_at = now() where id = p_id and seller = me and closed_at is null returning jsonb_build_object('item', item, 'qty', qty) into r; return r; end $$;
create or replace function public.os2_market_buy(p_id bigint) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); l os2_listing;
begin
  update os2_listing set closed_at = now(), buyer = me where id = p_id and closed_at is null and seller <> me returning * into l;
  if l.id is null then return null; end if;
  -- the stall keeps one coin in twenty, so gold leaves the world a little with every sale
  insert into os2_mail (to_id, from_name, kind, payload) values (l.seller, public.os2_name(me), 'sale', jsonb_build_object('item', l.item, 'qty', l.qty, 'gold', l.price - ceil(l.price * 0.05)::int));
  return jsonb_build_object('item', l.item, 'qty', l.qty, 'price', l.price);
end $$;

-- boards per skill
create or replace function public.os2_board_skill(p_skill text) returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid();
begin
  return (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select p.username, coalesce((s.data->'xp'->>p_skill)::numeric, 0) xp, coalesce((s.data->'rebirth'->>p_skill)::int, 0) rebirth
    from os2_save s join os2_profile p on p.id = s.user_id where coalesce((s.data->'xp'->>p_skill)::numeric, 0) > 0 order by 3 desc, 2 desc limit 50) x);
end $$;

do $$ declare f text; begin
  foreach f in array array['os2_week()', 'os2_uid()', 'os2_name(uuid)', 'os2_who(text)', 'os2_social()', 'os2_friend_add(text)', 'os2_friend_drop(text)', 'os2_peek(text)', 'os2_gift(text,text,int)', 'os2_mail_claim(bigint)',
    'os2_guild_create(text)', 'os2_guild_join(text)', 'os2_guild_leave()', 'os2_guild_haul_add(int)', 'os2_guild_say(text)', 'os2_market()', 'os2_market_list(text,int,int)', 'os2_market_cancel(bigint)', 'os2_market_buy(bigint)', 'os2_board_skill(text)'] loop
    execute format('revoke execute on function public.%s from anon, public', f); execute format('grant execute on function public.%s to authenticated', f);
  end loop; end $$;
