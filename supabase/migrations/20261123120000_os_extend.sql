-- OverSummoned extension. Idempotent. Does not drop or alter shop_*, story_*, or creature_* objects.
-- Does not replace den_block_signup. Existing os_* columns stay. New columns are added.

alter table public.den_allow add column if not exists is_admin boolean not null default false;

insert into public.den_allow (email)
select 'thievnsden@gmail.com'
where not exists (select 1 from public.den_allow where lower(email) = 'thievnsden@gmail.com');

update public.den_allow set is_admin = true where lower(email) = 'thievnsden@gmail.com';

alter table public.os_player add column if not exists sigils integer not null default 1;
alter table public.os_player add column if not exists vigor integer not null default 100;
alter table public.os_player add column if not exists daring integer not null default 10;
alter table public.os_player add column if not exists life integer not null default 100;
alter table public.os_player add column if not exists life_max integer not null default 100;
alter table public.os_player add column if not exists city text not null default 'aldermere';
alter table public.os_player add column if not exists travel_to text;
alter table public.os_player add column if not exists travel_until timestamptz;
alter table public.os_player add column if not exists stocks_until timestamptz;
alter table public.os_player add column if not exists banned boolean not null default false;
alter table public.os_player add column if not exists ban_reason text;
alter table public.os_player add column if not exists hustle_xp integer not null default 0;
alter table public.os_player add column if not exists seen_at timestamptz not null default now();
alter table public.os_player add column if not exists last_tick timestamptz not null default now();
alter table public.os_player add column if not exists vigor_at timestamptz not null default now();
alter table public.os_player add column if not exists daring_at timestamptz not null default now();
alter table public.os_player add column if not exists skill jsonb not null default '{}'::jsonb;
alter table public.os_player add column if not exists pending jsonb;

alter table public.os_delve add column if not exists choice text;
alter table public.os_delve add column if not exists seed bigint;

alter table public.os_feed add column if not exists tag text not null default 'news';

insert into public.os_hero_def (id, name, title, rarity, era, found, items)
values ('will_slapton','Will Slapton','Leading Man','absurd','Hollywood, 2022', false, array['item_red_carpet_tux','item_golden_statuette'])
on conflict (id) do nothing;

insert into public.os_item_def (id, name, rarity, slot, hero_id, in_pool) values
  ('copper_ore','Copper ore','common','mat',null,true),
  ('iron_ore','Iron ore','common','mat',null,true),
  ('moonsilver_ore','Moonsilver ore','rare','mat',null,true),
  ('ember_ore','Ember ore','epic','mat',null,false),
  ('void_ore','Void ore','epic','mat',null,false),
  ('gem_violet','Violet gem','epic','mat',null,false),
  ('ash_log','Ash log','common','mat',null,true),
  ('raw_eel','Raw eel','common','food',null,true),
  ('eel_stew','Eel stew','uncommon','food',null,true),
  ('potion_pink','Healing draught','rare','food',null,false),
  ('potion_cyan','Guard oil','rare','food',null,false),
  ('iron_bar','Iron bar','uncommon','mat',null,true),
  ('moonsilver_bar','Moonsilver bar','rare','mat',null,true),
  ('card_shard','Card shard','rare','mat',null,true),
  ('summon_sigil','Summoning sigil','legendary','mat',null,false),
  ('item_red_carpet_tux','Red Carpet Tux','epic','chest','will_slapton',false),
  ('item_golden_statuette','Golden Statuette','legendary','trinket','will_slapton',false),
  ('moonsilver_gladius','Moonsilver Gladius','epic','main',null,false)
on conflict (id) do nothing;

create table if not exists public.os_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.os_config (key, value) values
  ('game', '{"xpRate":1,"marketFee":0.05,"offlineHours":24,"vigorEvery":300,"vigorChunk":5,"daringEvery":240,"delveMinutes":[1,15,60,240,480]}'::jsonb),
  ('drop_rates', '{"common":50,"uncommon":25,"rare":14,"epic":7,"legendary":3,"absurd":0.8,"unhinged":0.2}'::jsonb),
  ('hero_chance', '{"1":0.004,"15":0.02,"60":0.06,"240":0.14,"480":0.22}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.os_event (
  id bigint generated always as identity primary key,
  uid uuid,
  kind text not null,
  qty integer not null default 1,
  ref text,
  created_at timestamptz not null default now()
);
create index if not exists os_event_created on public.os_event (created_at);
create index if not exists os_event_kind on public.os_event (kind);

create table if not exists public.os_listing (
  id bigint generated always as identity primary key,
  seller uuid,
  kind text not null default 'item',
  item_id text,
  hero_id text,
  hero_level integer,
  qty integer not null default 1,
  price integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.os_trade (
  id bigint generated always as identity primary key,
  item_id text,
  price integer not null,
  qty integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.os_crew (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  owner uuid,
  motto text,
  vault jsonb not null default '{}'::jsonb,
  goal_need integer not null default 50000,
  goal_have integer not null default 0,
  cup integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.os_crew_member (
  crew_id uuid not null references public.os_crew(id) on delete cascade,
  uid uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  primary key (uid)
);

create table if not exists public.os_chat (
  id bigint generated always as identity primary key,
  crew_id uuid not null references public.os_crew(id) on delete cascade,
  uid uuid,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.os_infirmary (
  uid uuid not null references auth.users(id) on delete cascade,
  hero_id text not null,
  until timestamptz not null,
  reason text,
  primary key (uid, hero_id)
);

create table if not exists public.os_hustle_log (
  id bigint generated always as identity primary key,
  uid uuid not null,
  result text not null,
  detail text not null,
  gold integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.os_listing (seller, kind, item_id, qty, price)
select null, 'item', x.item_id, x.qty, x.price
from (values
  ('moonsilver_bar',1204,41),
  ('ember_ore',310,88),
  ('eel_stew',8842,9),
  ('potion_pink',520,64),
  ('gem_violet',41,2400)
) as x(item_id, qty, price)
where not exists (select 1 from public.os_listing);

insert into public.os_feed (tag, msg)
select v.tag, v.msg from (values
  ('Breaking','Ghoul chef bursts out of the Ash Kitchen. Three crews are hunting it now.'),
  ('Market','Moonsilver hits a record 41 gold a bar. Miners are cheering.'),
  ('Streets','The Hollow Bishop''s chest cracked open. Moonsilver spilled across the tavern floor.'),
  ('Crews','The Crew Cup board is posted in the square.')
) as v(tag, msg)
where not exists (select 1 from public.os_feed);

alter table public.os_config enable row level security;
alter table public.os_event enable row level security;
alter table public.os_listing enable row level security;
alter table public.os_trade enable row level security;
alter table public.os_crew enable row level security;
alter table public.os_crew_member enable row level security;
alter table public.os_chat enable row level security;
alter table public.os_infirmary enable row level security;
alter table public.os_hustle_log enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='os_chat_read') then
    create policy os_chat_read on public.os_chat for select to authenticated
      using (crew_id in (select m.crew_id from public.os_crew_member m where m.uid = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='os_listing_read') then
    create policy os_listing_read on public.os_listing for select to authenticated using (true);
  end if;
end $$;

grant select on public.os_chat to authenticated;
grant select on public.os_listing to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='os_feed') then
    alter publication supabase_realtime add table public.os_feed;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='os_chat') then
    alter publication supabase_realtime add table public.os_chat;
  end if;
end $$;
