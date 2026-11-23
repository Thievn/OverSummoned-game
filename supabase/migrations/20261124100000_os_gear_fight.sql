-- OverSummoned: gear, era sets, hero stats and real fights.
alter table public.os_item_def
  add column if not exists ilvl integer not null default 1,
  add column if not exists bind text,
  add column if not exists uniq boolean not null default false,
  add column if not exists hand text,
  add column if not exists itype text,
  add column if not exists armor integer not null default 0,
  add column if not exists block integer not null default 0,
  add column if not exists dmg_lo integer,
  add column if not exists dmg_hi integer,
  add column if not exists speed double precision,
  add column if not exists stats jsonb not null default '{}'::jsonb,
  add column if not exists equip jsonb not null default '[]'::jsonb,
  add column if not exists fx jsonb not null default '{}'::jsonb,
  add column if not exists use jsonb,
  add column if not exists set_id text,
  add column if not exists req_level integer not null default 1,
  add column if not exists sell_copper bigint,
  add column if not exists stack integer,
  add column if not exists flavor text,
  add column if not exists icon text;

alter table public.os_hero_def
  add column if not exists base jsonb not null default '{"atk":8,"def":8,"hp":104,"spd":10,"crit":5,"luck":2}'::jsonb,
  add column if not exists fx jsonb not null default '{}'::jsonb,
  add column if not exists short text;

alter table public.os_player add column if not exists copper integer not null default 0;
alter table public.os_delve add column if not exists fight jsonb;

create table if not exists public.os_set (
  id text primary key,
  hero_id text not null,
  name text not null,
  bonus_name text not null,
  bonus_text text not null,
  stats jsonb not null default '{}'::jsonb,
  fx jsonb not null default '{}'::jsonb
);

create table if not exists public.os_gear (
  uid uuid not null references auth.users(id) on delete cascade,
  hero_id text not null,
  slot text not null check (slot in ('head','neck','chest','hands','legs','feet','ring1','ring2','main','off','trinket1','trinket2','belt1','belt2','belt3','belt4')),
  item_id text not null references public.os_item_def(id),
  primary key (uid, hero_id, slot)
);

alter table public.os_set enable row level security;
alter table public.os_gear enable row level security;
revoke all on public.os_set from anon;
revoke all on public.os_gear from anon;
revoke insert, update, delete, truncate on public.os_set from authenticated;
revoke insert, update, delete, truncate on public.os_gear from authenticated;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='os_set_read') then
    create policy os_set_read on public.os_set for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and policyname='os_gear_own') then
    create policy os_gear_own on public.os_gear for select to authenticated using (uid = auth.uid());
  end if;
end $$;

-- Slots everyone understands: food and potions go on the belt, everything else is a material.
update public.os_item_def set slot = 'mat' where slot = 'food' and id not in ('eel_stew','potion_pink','potion_cyan','night_tonic');
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('duelling_rapier', 'Duelling Rapier', 'legendary', 'main', null, true, 72, 'pickup', false, 'One-Hand', 'Sword', 0, 0, 88, 131, 1.6, '{"atk":14,"hp":40,"spd":9,"crit":3}'::jsonb, '["Your first strike in every fight hits twice."]'::jsonb, '{"first_double":1}'::jsonb, null, null, 6, 184210, null, 'It has won more arguments than any lawyer in London.', 'items/duelling_rapier')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or true, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('flint_spear', 'Flint Spear', 'uncommon', 'main', 'hunter', coalesce((select found from public.os_hero_def where id = 'hunter'), false), 20, 'equip', false, 'Two-Hand', 'Spear', 0, 0, 38, 64, 3, '{"atk":6,"hp":20}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'hunter', 2, 960, null, 'Sharpened by hand, one careful chip at a time.', 'items/flint_spear')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('rusty_gladius', 'Rusty Gladius', 'rare', 'main', 'legionary', coalesce((select found from public.os_hero_def where id = 'legionary'), false), 34, 'pickup', false, 'One-Hand', 'Sword', 0, 0, 41, 62, 1.8, '{"atk":6,"def":3}'::jsonb, '["Hits have a 2% chance to knock the enemy''s shield aside, lowering their Defense by 20 for 6 sec."]'::jsonb, '{"shred":2}'::jsonb, null, 'legionary', 3, 3320, null, 'Rusty on the outside. Still very Roman on the inside.', 'items/rusty_gladius')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('moonsilver_gladius', 'Moonsilver Gladius', 'epic', 'main', null, coalesce((select found from public.os_hero_def where id = ''), false), 40, 'equip', false, 'One-Hand', 'Sword', 0, 0, 52, 80, 1.8, '{"atk":8,"crit":2}'::jsonb, '["Deals 25% more damage to the undead."]'::jsonb, '{"undead":25}'::jsonb, null, null, 2, 5200, null, 'Cold to the touch. Ghosts can feel it coming.', 'items/rusty_gladius')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('violin_case', 'The Violin Case', 'epic', 'main', 'gangster', coalesce((select found from public.os_hero_def where id = 'gangster'), false), 54, 'pickup', false, 'Two-Hand', 'Gun', 0, 0, 96, 178, 3.2, '{"atk":12,"crit":3}'::jsonb, '["Your first shot in every fight hits every enemy."]'::jsonb, '{"first_aoe":1}'::jsonb, null, 'gangster', 5, 11200, null, 'There is no violin in it. There never was.', 'items/violin_case')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('pocket_trebuchet', 'Pocket Trebuchet', 'epic', 'main', 'engineer', coalesce((select found from public.os_hero_def where id = 'engineer'), false), 50, 'pickup', false, 'Two-Hand', 'Siege Engine', 0, 0, 70, 140, 3.5, '{"atk":10,"spd":2}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'engineer', 5, 9400, null, 'Small enough for a pocket, loud enough for a castle.', 'items/pocket_trebuchet')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('defib_paddles', 'Defibrillator Paddles', 'epic', 'main', 'paramedic', coalesce((select found from public.os_hero_def where id = 'paramedic'), false), 46, 'pickup', false, 'One-Hand', 'Paddles', 0, 0, 44, 70, 2, '{"atk":5,"hp":30}'::jsonb, '["Once per delve, brings a fallen ally back with 30% Health."]'::jsonb, '{"revive_once":30}'::jsonb, null, 'paramedic', 4, 8100, null, 'Charged, steady, and ready to bring someone back.', 'items/defib_paddles')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('shield_lost_ninth', 'Shield of the Lost Ninth', 'legendary', 'off', 'legionary', coalesce((select found from public.os_hero_def where id = 'legionary'), false), 70, 'pickup', false, null, 'Shield', 1840, 62, null, null, null, '{"atk":4,"def":14,"hp":120}'::jsonb, '["When an ally falls, your Defense rises by 25 for the rest of the fight."]'::jsonb, '{"ally_down_def":25}'::jsonb, null, 'legionary', 6, 172000, null, 'Nine thousand marched north. This is what came home.', 'items/shield_lost_ninth')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('trench_lantern', 'Trench Lantern', 'rare', 'off', null, true, 36, 'equip', false, null, 'Held In Off-hand', 0, 0, null, null, null, '{"spd":4,"luck":3}'::jsonb, '["Finds one hidden chest for every 3 rooms you clear."]'::jsonb, '{"chest_find":1}'::jsonb, null, null, 3, 4100, null, 'It has seen darker nights than this one, and it kept burning.', 'items/trench_lantern')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or true, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('medic_bag', 'Medic Bag', 'uncommon', 'off', 'paramedic', coalesce((select found from public.os_hero_def where id = 'paramedic'), false), 28, 'equip', false, null, 'Held In Off-hand', 0, 0, null, null, null, '{"def":2,"hp":40}'::jsonb, '["Potions you drink heal 10% more."]'::jsonb, '{"potion_plus":10}'::jsonb, null, 'paramedic', 2, 1380, null, 'Everything you need for a very bad day.', 'items/medic_bag')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('inflatable_tube_man', 'Inflatable Tube Man', 'absurd', 'off', 'office_worker', coalesce((select found from public.os_hero_def where id = 'office_worker'), false), 70, 'pickup', true, null, 'Held In Off-hand', 0, 0, null, null, null, '{"hp":40,"spd":12,"luck":8}'::jsonb, '["Enemies swing at it instead of you 10% of the time."]'::jsonb, '{"dodge":10}'::jsonb, null, null, 6, 240000, null, 'It waves at everyone. It never, ever stops waving.', 'items/inflatable_tube_man')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('pinstripe_fedora', 'Pinstripe Fedora', 'uncommon', 'head', 'gangster', coalesce((select found from public.os_hero_def where id = 'gangster'), false), 24, 'equip', false, null, 'Leather', 64, 0, null, null, null, '{"def":4,"luck":3}'::jsonb, '["Hustles pay 3% more gold."]'::jsonb, '{"hustle_gold":3}'::jsonb, null, 'gangster', 2, 1240, null, 'Tilted just enough to say the boss sent him.', 'items/pinstripe_fedora')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('brass_goggles', 'Brass Goggles', 'rare', 'head', 'engineer', coalesce((select found from public.os_hero_def where id = 'engineer'), false), 38, 'equip', false, null, 'Leather', 92, 0, null, null, null, '{"def":3,"hp":30,"crit":2}'::jsonb, '["Mining is 5% faster."]'::jsonb, '{"mining":5}'::jsonb, null, 'engineer', 3, 4875, null, 'Built to see through smoke, sparks and bad ideas.', 'items/brass_goggles')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('galea_helmet', 'Galea Helmet', 'rare', 'head', 'legionary', coalesce((select found from public.os_hero_def where id = 'legionary'), false), 34, 'pickup', false, null, 'Plate', 188, 0, null, null, null, '{"def":6,"hp":40}'::jsonb, '["Increases your chance to dodge an attack by 1%."]'::jsonb, '{"dodge":1}'::jsonb, null, 'legionary', 3, 3410, null, 'The red crest says follow me into the fight.', 'items/galea_helmet')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('beak_mask', 'Beak Mask', 'rare', 'head', 'plague_doctor', coalesce((select found from public.os_hero_def where id = 'plague_doctor'), false), 34, 'equip', false, null, 'Leather', 86, 0, null, null, null, '{"def":4,"hp":40}'::jsonb, '["You take 5% less damage from every hit."]'::jsonb, '{"dr":5}'::jsonb, null, 'plague_doctor', 3, 3300, null, 'The beak is stuffed with herbs. The smell is the point.', 'items/beak_mask')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('courier_helmet', 'Courier Helmet', 'common', 'head', 'delivery_rider', coalesce((select found from public.os_hero_def where id = 'delivery_rider'), false), 6, null, false, null, 'Plate', 40, 0, null, null, null, '{"def":2,"spd":2}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'delivery_rider', 1, 90, null, 'Scuffed from a thousand late-night deliveries.', 'items/courier_helmet')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('item_red_carpet_tux', 'Red Carpet Tux', 'epic', 'chest', 'will_slapton', coalesce((select found from public.os_hero_def where id = 'will_slapton'), false), 52, 'pickup', false, null, 'Cloth', 140, 0, null, null, null, '{"def":6,"hp":60,"spd":5}'::jsonb, '["Enemies attack you first. You look too good to ignore."]'::jsonb, '{"aggro":1}'::jsonb, null, 'will_slapton', 5, 9850, null, 'Pressed, steamed, and ready for its close-up.', 'items/item_red_carpet_tux')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('pinstripe_vest', 'Pinstripe Vest', 'epic', 'chest', 'gangster', coalesce((select found from public.os_hero_def where id = 'gangster'), false), 50, 'pickup', false, null, 'Leather', 160, 0, null, null, null, '{"def":7,"hp":40,"luck":4}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'gangster', 5, 9100, null, 'Sharp lines, deep pockets, and a watch that isn''t his.', 'items/pinstripe_vest')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('hi_vis_vest', 'Hi-Vis Vest', 'common', 'chest', 'delivery_rider', coalesce((select found from public.os_hero_def where id = 'delivery_rider'), false), 8, null, false, null, 'Cloth', 38, 0, null, null, null, '{"def":2,"hp":15}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'delivery_rider', 1, 112, null, 'Bright enough to be seen from the next century.', 'items/hi_vis_vest')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('mammoth_cloak', 'Mammoth Cloak', 'rare', 'chest', 'hunter', coalesce((select found from public.os_hero_def where id = 'hunter'), false), 32, 'equip', false, null, 'Leather', 120, 0, null, null, null, '{"def":5,"hp":60}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'hunter', 3, 3050, null, 'Warm, heavy, and still a little bit angry.', 'items/mammoth_cloak')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('waxed_coat', 'Waxed Coat', 'rare', 'chest', 'plague_doctor', coalesce((select found from public.os_hero_def where id = 'plague_doctor'), false), 32, 'equip', false, null, 'Leather', 124, 0, null, null, null, '{"def":5,"hp":50}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'plague_doctor', 3, 3100, null, 'Rain, blood and worse all roll right off it.', 'items/waxed_coat')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('hobnailed_caligae', 'Hobnailed Caligae', 'uncommon', 'feet', 'legionary', coalesce((select found from public.os_hero_def where id = 'legionary'), false), 26, 'equip', false, null, 'Plate', 96, 0, null, null, null, '{"def":4,"spd":3}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, null, 2, 1520, null, 'Thousands of miles of empire, one hobnail at a time.', 'items/hobnailed_caligae')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('open_palm', 'The Open Palm', 'absurd', 'hands', 'will_slapton', coalesce((select found from public.os_hero_def where id = 'will_slapton'), false), 75, 'pickup', true, null, 'Cloth', 72, 0, null, null, null, '{"atk":18,"crit":5}'::jsonb, '["Your slaps stun for 1 extra turn."]'::jsonb, '{"stun_plus":1}'::jsonb, null, 'will_slapton', 7, 260000, null, 'Still tingling from the last one.', 'items/open_palm_glove')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('steam_gauntlet', 'Steam Gauntlet', 'epic', 'hands', 'engineer', coalesce((select found from public.os_hero_def where id = 'engineer'), false), 48, 'pickup', false, null, 'Plate', 210, 0, null, null, null, '{"atk":6,"def":6}'::jsonb, '["Hits have a 5% chance to vent steam, burning the enemy for 30 damage."]'::jsonb, '{"steam":5}'::jsonb, null, 'engineer', 4, 8700, null, 'Runs on coal, steam and a strong right hook.', 'items/steam_gauntlet')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('bone_necklace', 'Bone Necklace', 'rare', 'neck', 'hunter', coalesce((select found from public.os_hero_def where id = 'hunter'), false), 30, 'equip', false, null, 'Amulet', 0, 0, null, null, null, '{"atk":4,"crit":1}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'hunter', 3, 2900, null, 'Every tooth on it comes with a story Brokk will tell twice.', 'items/bone_necklace')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('herb_pomander', 'Herb Pomander', 'uncommon', 'neck', 'plague_doctor', coalesce((select found from public.os_hero_def where id = 'plague_doctor'), false), 22, 'equip', false, null, 'Amulet', 0, 0, null, null, null, '{"hp":30,"luck":2}'::jsonb, '["Potions you drink heal 10% more."]'::jsonb, '{"potion_plus":10}'::jsonb, null, 'plague_doctor', 2, 1100, null, 'Lavender, clove and a lot of hope.', 'items/herb_pomander')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('second_moon', 'Second Moon', 'unhinged', 'ring', null, true, 80, 'pickup', true, null, 'Ring', 0, 0, null, null, null, '{"hp":50,"luck":12}'::jsonb, '["Rare loot drops 10% more often while it is night in Aldermere."]'::jsonb, '{"night_rare":10}'::jsonb, null, null, 9, 420000, null, 'Look up tonight and count the moons again.', 'items/second_moon')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or true, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('item_golden_statuette', 'Golden Statuette', 'legendary', 'trinket', 'will_slapton', coalesce((select found from public.os_hero_def where id = 'will_slapton'), false), 66, 'pickup', true, null, 'Trinket', 0, 0, null, null, null, '{"atk":8,"luck":6}'::jsonb, '[]'::jsonb, '{}'::jsonb, '{"text":"Raise it high. Your squad deals 20% more damage for 15 sec.","cd":"2 Min Cooldown","k":"rally","v":20,"cds":120,"name":"Golden Statuette"}'::jsonb, 'will_slapton', 6, 150000, null, 'He would like to thank the Academy, his mother, and his right hand.', 'items/item_golden_statuette')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('stained_mug', 'Stained Mug', 'common', 'trinket', 'office_worker', coalesce((select found from public.os_hero_def where id = 'office_worker'), false), 6, null, false, null, 'Trinket', 0, 0, null, null, null, '{"luck":1}'::jsonb, '[]'::jsonb, '{}'::jsonb, '{"text":"Take a sip. Restores 15 Health.","cd":"1 Min Cooldown","k":"heal","v":15,"cds":60,"name":"Stained Mug"}'::jsonb, 'office_worker', 1, 35, null, 'It says World''s Okayest Hero, and he wears it proudly.', 'items/stained_mug')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('black_ledger', 'Black Ledger', 'epic', 'trinket', 'office_worker', coalesce((select found from public.os_hero_def where id = 'office_worker'), false), 44, 'pickup', false, null, 'Trinket', 0, 0, null, null, null, '{"luck":8}'::jsonb, '["Every delve brings home 5% more gold."]'::jsonb, '{"delve_gold":5}'::jsonb, null, 'office_worker', 4, 7700, null, 'Every name in it owes somebody something.', 'items/black_ledger')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('group_chat', 'The Group Chat', 'rare', 'trinket', 'office_worker', coalesce((select found from public.os_hero_def where id = 'office_worker'), false), 30, 'equip', false, null, 'Trinket', 0, 0, null, null, null, '{"spd":4,"luck":2}'::jsonb, '[]'::jsonb, '{}'::jsonb, '{"text":"Send one message. Your squad acts sooner for 10 sec.","cd":"3 Min Cooldown","k":"haste","v":30,"cds":180,"name":"The Group Chat"}'::jsonb, 'office_worker', 3, 2600, null, '47 unread, and every one of them says urgent.', 'items/group_chat')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('trauma_shears', 'Trauma Shears', 'uncommon', 'trinket', 'paramedic', coalesce((select found from public.os_hero_def where id = 'paramedic'), false), 26, 'equip', false, null, 'Trinket', 0, 0, null, null, null, '{"atk":3,"spd":3}'::jsonb, '[]'::jsonb, '{}'::jsonb, null, 'paramedic', 2, 1300, null, 'They cut through jeans, boots and excuses.', 'items/trauma_shears')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('delivery_bag', 'Delivery Bag', 'common', 'trinket', 'delivery_rider', coalesce((select found from public.os_hero_def where id = 'delivery_rider'), false), 6, null, false, null, 'Trinket', 0, 0, null, null, null, '{"luck":2}'::jsonb, '["Room for one more find in every delve."]'::jsonb, '{"extra_roll":1}'::jsonb, null, 'delivery_rider', 1, 80, null, 'Insulated, waterproof, and somehow always smells like fries.', 'items/delivery_bag')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('potion_pink', 'Healing Draught', 'rare', 'belt', null, coalesce((select found from public.os_hero_def where id = ''), false), 30, null, false, null, 'Potion', 0, 0, null, null, null, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, '{"text":"Restores 70 Health to the hero who drinks it.","cd":"30 Sec Cooldown","k":"heal","v":70,"cds":30,"name":"Healing Draught"}'::jsonb, null, 1, 640000, 20, 'Thick, pink, and it fixes most of what a delve breaks.', 'gen/potion_pink')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('potion_cyan', 'Guard Oil', 'rare', 'belt', null, coalesce((select found from public.os_hero_def where id = ''), false), 30, null, false, null, 'Potion', 0, 0, null, null, null, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, '{"text":"Rub it on your armor. +25 Defense for one fight.","cd":"1 Min Cooldown","k":"guard","v":25,"cds":60,"name":"Guard Oil"}'::jsonb, null, 1, 640000, 20, 'Blades slide off it like rain off a window.', 'gen/potion_cyan')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('night_tonic', 'Night Tonic', 'epic', 'belt', null, true, 48, null, false, null, 'Potion', 0, 0, null, null, null, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, '{"text":"Restores 4 Health every 3 sec for the rest of the delve.","cd":"Once per delve","k":"hot","v":4,"cds":100000,"name":"Night Tonic"}'::jsonb, null, 4, 1200000, 5, 'Brewed under the second moon. Tastes like plums and courage.', 'gen/flask')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or true, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_item_def as d (id, name, rarity, slot, hero_id, in_pool, ilvl, bind, uniq, hand, itype, armor, block, dmg_lo, dmg_hi, speed, stats, equip, fx, use, set_id, req_level, sell_copper, stack, flavor, icon)
values ('eel_stew', 'Eel Stew', 'uncommon', 'belt', null, coalesce((select found from public.os_hero_def where id = ''), false), 12, null, false, null, 'Food', 0, 0, null, null, null, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, '{"text":"Restores 28 Health. Your hero has to sit down to eat it.","cd":"10 Sec Cooldown","k":"heal","v":28,"cds":10,"name":"Eel Stew"}'::jsonb, null, 1, 90000, 20, 'Hot, salty, and straight from the river.', 'gen/eel_stew')
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, slot = excluded.slot, hero_id = excluded.hero_id, in_pool = d.in_pool or false, ilvl = excluded.ilvl, bind = excluded.bind, uniq = excluded.uniq, hand = excluded.hand, itype = excluded.itype, armor = excluded.armor, block = excluded.block, dmg_lo = excluded.dmg_lo, dmg_hi = excluded.dmg_hi, speed = excluded.speed, stats = excluded.stats, equip = excluded.equip, fx = excluded.fx, use = excluded.use, set_id = excluded.set_id, req_level = excluded.req_level, sell_copper = excluded.sell_copper, stack = excluded.stack, flavor = excluded.flavor, icon = excluded.icon;
insert into public.os_set (id, hero_id, name, bonus_name, bonus_text, stats, fx) values ('will_slapton', 'will_slapton', 'Award Night', 'Standing Ovation', 'Once per delve, your first slap hits every enemy in the room. +10 Attack.', '{"atk":10}'::jsonb, '{"slap_aoe_once":1}'::jsonb)
on conflict (id) do update set name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text, stats = excluded.stats, fx = excluded.fx;
insert into public.os_set (id, hero_id, name, bonus_name, bonus_text, stats, fx) values ('legionary', 'legionary', 'The Lost Ninth', 'Testudo', 'The first enemy hit in every room does half damage. +15 Defense.', '{"def":15}'::jsonb, '{"testudo":1}'::jsonb)
on conflict (id) do update set name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text, stats = excluded.stats, fx = excluded.fx;
insert into public.os_set (id, hero_id, name, bonus_name, bonus_text, stats, fx) values ('gangster', 'gangster', 'Prohibition Row', 'Made Man', 'Every hustle pays 15% more gold. +8 Luck.', '{"luck":8}'::jsonb, '{"hustle_gold":15}'::jsonb)
on conflict (id) do update set name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text, stats = excluded.stats, fx = excluded.fx;
insert into public.os_set (id, hero_id, name, bonus_name, bonus_text, stats, fx) values ('engineer', 'engineer', 'Crane and Daughters', 'Full Steam', 'Mining runs 20% faster, and 1 in 5 of her attacks fires twice. +6 Speed.', '{"spd":6}'::jsonb, '{"mining":20,"double_shot":20}'::jsonb)
on conflict (id) do update set name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text, stats = excluded.stats, fx = excluded.fx;
insert into public.os_set (id, hero_id, name, bonus_name, bonus_text, stats, fx) values ('paramedic', 'paramedic', 'Night Shift', 'Golden Hour', 'The first hero to fall in a delve gets back up with half Health. +60 Health.', '{"hp":60}'::jsonb, '{"revive_first":50}'::jsonb)
on conflict (id) do update set name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text, stats = excluded.stats, fx = excluded.fx;
insert into public.os_set (id, hero_id, name, bonus_name, bonus_text, stats, fx) values ('office_worker', 'office_worker', 'Corner Office', 'Circle Back', 'Reply All lasts 1 extra turn. +5% Crit Chance.', '{"crit":5}'::jsonb, '{"mark_plus":1}'::jsonb)
on conflict (id) do update set name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text, stats = excluded.stats, fx = excluded.fx;
insert into public.os_set (id, hero_id, name, bonus_name, bonus_text, stats, fx) values ('hunter', 'hunter', 'First Fire', 'Hot Coals', 'His first hit in every room burns for 20 extra damage. +10 Attack.', '{"atk":10}'::jsonb, '{"first_fire":20}'::jsonb)
on conflict (id) do update set name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text, stats = excluded.stats, fx = excluded.fx;
insert into public.os_set (id, hero_id, name, bonus_name, bonus_text, stats, fx) values ('plague_doctor', 'plague_doctor', 'The Black Year', 'Quarantine', 'Potions heal the squad 20% more. +40 Health.', '{"hp":40}'::jsonb, '{"potion_plus":20}'::jsonb)
on conflict (id) do update set name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text, stats = excluded.stats, fx = excluded.fx;
insert into public.os_set (id, hero_id, name, bonus_name, bonus_text, stats, fx) values ('delivery_rider', 'delivery_rider', 'Last Mile', 'Express Route', 'Delves finish 10% sooner. +5 Speed.', '{"spd":5}'::jsonb, '{"delve_speed":10}'::jsonb)
on conflict (id) do update set name = excluded.name, bonus_name = excluded.bonus_name, bonus_text = excluded.bonus_text, stats = excluded.stats, fx = excluded.fx;
update public.os_hero_def set base = '{"atk":16,"def":9,"hp":112,"spd":13,"crit":8,"luck":2}'::jsonb, fx = '{"slap":2}'::jsonb, short = 'Will', items = array['item_red_carpet_tux','item_golden_statuette','open_palm']::text[] where id = 'will_slapton';
update public.os_hero_def set base = '{"atk":12,"def":15,"hp":160,"spd":8,"crit":5,"luck":1}'::jsonb, fx = '{"formation":2}'::jsonb, short = 'Gaius', items = array['galea_helmet','rusty_gladius','shield_lost_ninth','hobnailed_caligae']::text[] where id = 'legionary';
update public.os_hero_def set base = '{"atk":13,"def":9,"hp":112,"spd":15,"crit":7,"luck":5}'::jsonb, fx = '{}'::jsonb, short = 'Vincenzo', items = array['pinstripe_fedora','pinstripe_vest','violin_case']::text[] where id = 'gangster';
update public.os_hero_def set base = '{"atk":8,"def":9,"hp":112,"spd":16,"crit":6,"luck":3}'::jsonb, fx = '{}'::jsonb, short = 'Edith', items = array['brass_goggles','steam_gauntlet','pocket_trebuchet']::text[] where id = 'engineer';
update public.os_hero_def set base = '{"atk":8,"def":10,"hp":120,"spd":15,"crit":5,"luck":2}'::jsonb, fx = '{}'::jsonb, short = 'Albrecht', items = array['beak_mask','waxed_coat','herb_pomander']::text[] where id = 'plague_doctor';
update public.os_hero_def set base = '{"atk":7,"def":10,"hp":120,"spd":14,"crit":5,"luck":3}'::jsonb, fx = '{"triage":18}'::jsonb, short = 'Maya', items = array['defib_paddles','medic_bag','trauma_shears']::text[] where id = 'paramedic';
update public.os_hero_def set base = '{"atk":16,"def":11,"hp":128,"spd":6,"crit":6,"luck":1}'::jsonb, fx = '{}'::jsonb, short = 'Brokk', items = array['flint_spear','mammoth_cloak','bone_necklace']::text[] where id = 'hunter';
update public.os_hero_def set base = '{"atk":7,"def":8,"hp":104,"spd":12,"crit":5,"luck":4}'::jsonb, fx = '{"reply_all":2}'::jsonb, short = 'Kevin', items = array['stained_mug','group_chat','black_ledger','inflatable_tube_man']::text[] where id = 'office_worker';
update public.os_hero_def set base = '{"atk":9,"def":8,"hp":104,"spd":11,"crit":5,"luck":3}'::jsonb, fx = '{}'::jsonb, short = 'Marco', items = array['courier_helmet','hi_vis_vest','delivery_bag']::text[] where id = 'delivery_rider';
create or replace function public.os__rn(s bigint) returns bigint language sql immutable set search_path to public as $f$ select ($1 * 48271) % 2147483647 $f$;
create or replace function public.os__fx(fx jsonb, k text) returns double precision language sql immutable set search_path to public as $f$ select coalesce(($1->>$2)::double precision, 0) $f$;
create or replace function public.os__r0(x double precision) returns integer language sql immutable set search_path to public as $f$ select floor($1 + 0.5::float8)::int $f$;

create or replace function public.os_fight_sim(p_party jsonb, p_floor integer, p_minutes integer, p_seed bigint, p_rules jsonb, p_stock jsonb, p_uses jsonb)
returns jsonb language plpgsql stable set search_path to public as $$
declare
  s bigint; x float8;
  rr int; r int; nh int; nf int; i int; j int; k int; n int; sw int; tgi int; bi int; bh boolean;
  t float8 := 0; cleared int := 0; result text := 'won';
  heal float8; retreat float8; st jsonb; used jsonb := '{}'::jsonb; lg jsonb := '[]'::jsonb; lgn int := 0; rooms jsonb := '[]'::jsonb;
  slap_aoe_used boolean := false; revive_first_used boolean := false;
  hn text[]; hatk int[]; hdef int[]; hmax int[]; hhp int[]; hspd int[]; hcrit int[]; harm int[]; hlo int[]; hhi int[]; hsw float8[]; hfx jsonb[]; huses jsonb[]; hbelt jsonb[]; hcd jsonb[]; hhot float8[]; hhott float8[]; hacts int[]; hrev boolean[]; htn float8[];
  fname text[]; fund boolean[]; fhp int[]; fmax int[]; fatk int[]; fdef int[]; fspd int[]; flo int[]; fhi int[]; fshr float8[]; fmark int[]; fstun int[]; ftn float8[];
  rfirst boolean[]; rfhit boolean[]; rguard int[]; rdown int[]; rtest boolean; rally_until float8; rally_v float8; haste_until float8;
  lvl float8; kind int; kinds text[] := array['Cellar Rat','Ash Ghoul','Skeleton','Mushroom Brute','Tunnel Goblin','Drip Slime']; kund boolean[] := array[false,true,true,false,false,false];
  actions int; endk text; bt float8; bspd int; id text; u jsonb; pick text; from_belt boolean; pp float8; amt int; gain int; low int; turns int;
  first boolean; aoe boolean; targets int[]; swings int; tg int; mult float8; raw int; mit float8; crit boolean; v float8; d int; dEff int; half boolean; nalive int; alive int[]; rv int; sh int; sm int; foes_r jsonb;
  lowest int; fi int;
begin
  s := abs(coalesce(p_seed, 1)) % 2147483647; if s <= 0 then s := s + 2147483646; end if;
  rr := case p_minutes when 1 then 1 when 15 then 3 when 60 then 5 when 240 then 8 when 480 then 12 else 3 end;
  heal := greatest(0, least(100, coalesce((p_rules->>'heal')::float8, 0)));
  retreat := greatest(0, least(100, coalesce((p_rules->>'retreat')::float8, 0)));
  st := coalesce(p_stock, '{}'::jsonb);
  nh := jsonb_array_length(p_party);
  for i in 1..nh loop
    u := p_party->(i-1);
    hn[i] := u->>'name'; hatk[i] := (u->>'atk')::int; hdef[i] := (u->>'def')::int; hmax[i] := (u->>'hp')::int; hhp[i] := hmax[i];
    hspd[i] := (u->>'spd')::int; hcrit[i] := (u->>'crit')::int; harm[i] := coalesce((u->>'armor')::int, 0); hlo[i] := (u->>'lo')::int; hhi[i] := (u->>'hi')::int;
    hsw[i] := (u->>'swing')::float8; hfx[i] := coalesce(u->'fx', '{}'::jsonb); huses[i] := coalesce(u->'uses', '[]'::jsonb); hbelt[i] := coalesce(u->'belt', '[]'::jsonb);
    hcd[i] := '{}'::jsonb; hhot[i] := 0; hhott[i] := 0; hacts[i] := 0; hrev[i] := false; htn[i] := 0;
  end loop;

  for r in 1..rr loop
    -- foes
    fname := '{}'; fund := '{}'; fhp := '{}'; fmax := '{}'; fatk := '{}'; fdef := '{}'; fspd := '{}'; flo := '{}'; fhi := '{}'; fshr := '{}'; fmark := '{}'; fstun := '{}'; ftn := '{}';
    lvl := p_floor + (r - 1) * 0.25::float8;
    if p_floor % 10 = 0 and r = rr then
      nf := 1; fname[1] := 'Hollow Bishop'; fund[1] := true;
    else
      if p_floor >= 5 then s := os__rn(s); nf := 1 + floor((s::float8 / 2147483647) * 3)::int;
      else s := os__rn(s); nf := 1 + floor((s::float8 / 2147483647) * 2)::int; end if;
      for j in 1..nf loop
        s := os__rn(s); kind := floor((s::float8 / 2147483647) * 6)::int + 1;
        fname[j] := kinds[kind]; fund[j] := kund[kind];
      end loop;
    end if;
    for j in 1..nf loop
      fhp[j] := os__r0(30 + 18 * lvl); fatk[j] := os__r0(2 + 2.2::float8 * lvl); fdef[j] := os__r0(2 + 2 * lvl); fspd[j] := os__r0(5 + lvl);
      flo[j] := os__r0(1 + lvl); fhi[j] := os__r0(3 + 1.5::float8 * lvl);
      if fname[j] = 'Hollow Bishop' and nf = 1 and p_floor % 10 = 0 and r = rr then fhp[j] := fhp[j] * 4; fatk[j] := os__r0(fatk[j] * 1.3::float8); fdef[j] := os__r0(fdef[j] * 1.2::float8); end if;
      fmax[j] := fhp[j]; fshr[j] := -1; fmark[j] := 0; fstun[j] := 0;
    end loop;
    foes_r := '[]'::jsonb;
    for j in 1..nf loop foes_r := foes_r || jsonb_build_object('name', fname[j], 'max', fmax[j]); end loop;
    rooms := rooms || jsonb_build_array(foes_r);
    lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', '', 'x', case when nf = 1 then 'Room '||r||'. '||case when fname[1] ~ '^[AEIOU]' then 'An' else 'A' end||' '||fname[1]||' steps out of the dark.' else 'Room '||r||'. '||case when nf = 2 then 'Two' else 'Three' end||' shapes step out of the dark.' end, 'v', '', 'c', 'room', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1;

    rfirst := array_fill(true, array[nh]); rfhit := array_fill(false, array[nh]); rguard := array_fill(0, array[nh]); rdown := array_fill(0, array[nh]);
    rtest := false; rally_until := -1; rally_v := 0; haste_until := -1;
    for i in 1..nh loop
      if hhp[i] <= 0 then continue; end if;
      for k in 0..jsonb_array_length(huses[i]) - 1 loop
        id := huses[i]->>k; u := p_uses->id;
        if u is null or (u->>'k') not in ('rally','haste') then continue; end if;
        if coalesce((hcd[i]->>id)::float8, -1) > t then continue; end if;
        hcd[i] := hcd[i] || jsonb_build_object(id, t + (u->>'cds')::float8);
        if u->>'k' = 'rally' then
          rally_until := t + 15; rally_v := (u->>'v')::float8;
          if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[i], 'x', hn[i]||' raises the '||(u->>'name')||'. The squad hits harder.', 'v', '', 'c', 'buff', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
        else
          haste_until := t + 10;
          if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[i], 'x', hn[i]||' sends one message. Everyone moves faster.', 'v', '', 'c', 'buff', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
        end if;
      end loop;
    end loop;
    for i in 1..nh loop htn[i] := t + (hsw[i] / (1 + hspd[i]::float8 / 100)) / (case when t < haste_until then 1.3::float8 else 1::float8 end); end loop;
    for j in 1..nf loop ftn[j] := t + 2.2::float8 / (1 + fspd[j]::float8 / 100); end loop;

    actions := 0; endk := '';
    loop
      if not exists (select 1 from unnest(fhp) z where z > 0) then endk := 'clear'; exit; end if;
      if not exists (select 1 from unnest(hhp) z where z > 0) then endk := 'wipe'; exit; end if;
      if actions >= 400 then endk := 'stall'; exit; end if;
      bi := 0; bh := true; bt := 0; bspd := 0;
      for i in 1..nh loop
        if hhp[i] > 0 and (bi = 0 or htn[i] < bt or (htn[i] = bt and hspd[i] > bspd)) then bi := i; bh := true; bt := htn[i]; bspd := hspd[i]; end if;
      end loop;
      for j in 1..nf loop
        if fhp[j] > 0 and (bi = 0 or ftn[j] < bt or (ftn[j] = bt and fspd[j] > bspd)) then bi := j; bh := false; bt := ftn[j]; bspd := fspd[j]; end if;
      end loop;
      t := bt; actions := actions + 1;
      if bh then
        i := bi;
        if hhot[i] > 0 then gain := floor(hhot[i] * (t - hhott[i]))::int; if gain > 0 then hhp[i] := least(hmax[i], hhp[i] + gain); hhott[i] := t; end if; end if;
        pp := 1 + os__fx(hfx[i], 'potion_plus') / 100;
        if hhp[i] < heal / 100 * hmax[i] then
          pick := null; from_belt := false;
          for k in 0..jsonb_array_length(hbelt[i]) - 1 loop
            id := hbelt[i]->>k; u := case when id is null then null else p_uses->id end;
            if u is null or coalesce((st->>id)::int, 0) <= 0 or coalesce((hcd[i]->>id)::float8, -1) > t then continue; end if;
            if u->>'k' = 'heal' or (u->>'k' = 'hot' and hhot[i] = 0) then pick := id; from_belt := true; exit; end if;
          end loop;
          if pick is null then
            for k in 0..jsonb_array_length(huses[i]) - 1 loop
              id := huses[i]->>k; u := p_uses->id;
              if u is not null and u->>'k' = 'heal' and coalesce((hcd[i]->>id)::float8, -1) <= t then pick := id; exit; end if;
            end loop;
          end if;
          if pick is null then
            for k in 0..jsonb_array_length(hbelt[i]) - 1 loop
              id := hbelt[i]->>k; u := case when id is null then null else p_uses->id end;
              if u is not null and u->>'k' = 'guard' and coalesce((st->>id)::int, 0) > 0 and coalesce((hcd[i]->>id)::float8, -1) <= t and rguard[i] = 0 then pick := id; from_belt := true; exit; end if;
            end loop;
          end if;
          if pick is not null then
            u := p_uses->pick;
            if from_belt then st := st || jsonb_build_object(pick, (st->>pick)::int - 1); used := used || jsonb_build_object(pick, coalesce((used->>pick)::int, 0) + 1); end if;
            hcd[i] := hcd[i] || jsonb_build_object(pick, t + (u->>'cds')::float8);
            if u->>'k' = 'heal' then
              amt := os__r0((u->>'v')::float8 * pp); hhp[i] := least(hmax[i], hhp[i] + amt);
              if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[i], 'x', hn[i]||' uses the '||(u->>'name')||'.', 'v', '+'||amt, 'c', 'heal', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
            elsif u->>'k' = 'hot' then
              hhot[i] := (u->>'v')::float8 / 3 * pp; hhott[i] := t;
              if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[i], 'x', hn[i]||' drinks a '||(u->>'name')||'. Warmth spreads slowly.', 'v', '', 'c', 'heal', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
            else
              rguard[i] := (u->>'v')::int;
              if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[i], 'x', hn[i]||' rubs '||(u->>'name')||' on their armor.', 'v', '+'||(u->>'v')||' Defense', 'c', 'buff', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
            end if;
            htn[i] := htn[i] + (hsw[i] / (1 + hspd[i]::float8 / 100)) / (case when t < haste_until then 1.3::float8 else 1::float8 end);
            continue;
          end if;
        end if;
        if os__fx(hfx[i], 'triage') > 0 and hacts[i] % 3 = 2 then
          low := 0;
          for k in 1..nh loop
            if hhp[k] > 0 and hhp[k] < 0.6::float8 * hmax[k] and (low = 0 or hhp[k]::float8 / hmax[k] < hhp[low]::float8 / hmax[low]) then low := k; end if;
          end loop;
          if low > 0 then
            amt := os__r0(os__fx(hfx[i], 'triage') / 100 * hmax[low]); hhp[low] := least(hmax[low], hhp[low] + amt); hacts[i] := hacts[i] + 1;
            if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[i], 'x', case when low = i then hn[i]||' patches herself up.' else hn[i]||' patches up '||hn[low]||'.' end, 'v', '+'||amt, 'c', 'heal', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
            htn[i] := htn[i] + (hsw[i] / (1 + hspd[i]::float8 / 100)) / (case when t < haste_until then 1.3::float8 else 1::float8 end);
            continue;
          end if;
        end if;
        if os__fx(hfx[i], 'reply_all') > 0 and rfirst[i] then
          turns := (os__fx(hfx[i], 'reply_all') + os__fx(hfx[i], 'mark_plus'))::int;
          for j in 1..nf loop if fhp[j] > 0 then fmark[j] := turns; end if; end loop;
          rfirst[i] := false; hacts[i] := hacts[i] + 1;
          if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[i], 'x', hn[i]||' hits Reply All. Every enemy is marked.', 'v', turns||' turns', 'c', 'buff', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
          htn[i] := htn[i] + (hsw[i] / (1 + hspd[i]::float8 / 100)) / (case when t < haste_until then 1.3::float8 else 1::float8 end);
          continue;
        end if;
        first := rfirst[i];
        aoe := first and (os__fx(hfx[i], 'first_aoe') > 0 or (os__fx(hfx[i], 'slap_aoe_once') > 0 and not slap_aoe_used));
        targets := '{}';
        if aoe then
          if os__fx(hfx[i], 'first_aoe') = 0 then slap_aoe_used := true; end if;
          for j in 1..nf loop if fhp[j] > 0 then targets := targets || j; end if; end loop;
        else
          lowest := 0; for j in 1..nf loop if fhp[j] > 0 and (lowest = 0 or fhp[j] < fhp[lowest]) then lowest := j; end if; end loop;
          targets := array[lowest];
        end if;
        swings := case when first and os__fx(hfx[i], 'first_double') > 0 then 2 else 1 end;
        -- strike loop; the extra contraption hit runs with targets = {lowest}, sw = -1
        for n in 1..array_length(targets, 1) + 1 loop
          if n <= array_length(targets, 1) then fi := targets[n];
          else
            -- slap and double shot after normal strikes
            if os__fx(hfx[i], 'slap') > 0 and first and targets[1] > 0 and fhp[targets[1]] > 0 then
              fstun[targets[1]] := (os__fx(hfx[i], 'slap') + os__fx(hfx[i], 'stun_plus'))::int;
              if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[i], 'x', hn[i]||' slaps the '||fname[targets[1]]||' silly.', 'v', fstun[targets[1]]||' turns', 'c', 'buff', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
            end if;
            fi := 0;
            if os__fx(hfx[i], 'double_shot') > 0 then
              s := os__rn(s);
              if (s::float8 / 2147483647) < os__fx(hfx[i], 'double_shot') / 100 then
                lowest := 0; for j in 1..nf loop if fhp[j] > 0 and (lowest = 0 or fhp[j] < fhp[lowest]) then lowest := j; end if; end loop;
                if lowest > 0 then
                  fi := lowest;
                  if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[i], 'x', hn[i]||'''s contraption fires again.', 'v', '', 'c', 'buff', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
                end if;
              end if;
            end if;
            if fi = 0 then exit; end if;
          end if;
          for sw in 1..(case when n <= array_length(targets, 1) then swings else 1 end) loop
            if fi = 0 or fhp[fi] <= 0 then exit; end if;
            mult := (case when t < rally_until then 1 + rally_v / 100 else 1::float8 end) * (case when fmark[fi] > 0 then 1.15::float8 else 1::float8 end) * (case when fund[fi] and os__fx(hfx[i], 'undead') > 0 then 1 + os__fx(hfx[i], 'undead') / 100 else 1::float8 end);
            s := os__rn(s); raw := hlo[i] + floor((s::float8 / 2147483647) * (hhi[i] - hlo[i] + 1))::int + hatk[i];
            mit := (raw * 100)::float8 / (100 + greatest(0, fdef[fi] - (case when t < fshr[fi] then 20 else 0 end)));
            s := os__rn(s); crit := (s::float8 / 2147483647) < least(60, hcrit[i])::float8 / 100;
            s := os__rn(s); v := 0.95::float8 + (s::float8 / 2147483647) * 0.10::float8;
            d := greatest(1, os__r0(mit * (case when crit then 1.5::float8 else 1::float8 end) * mult * v));
            if n <= array_length(targets, 1) and os__fx(hfx[i], 'first_fire') > 0 and not rfhit[i] then d := d + os__fx(hfx[i], 'first_fire')::int; end if;
            rfhit[i] := true;
            if os__fx(hfx[i], 'steam') > 0 then s := os__rn(s); if (s::float8 / 2147483647) < os__fx(hfx[i], 'steam') / 100 then d := d + 30; end if; end if;
            if os__fx(hfx[i], 'shred') > 0 then s := os__rn(s); if (s::float8 / 2147483647) < os__fx(hfx[i], 'shred') / 100 then fshr[fi] := t + 6; end if; end if;
            fhp[fi] := greatest(0, fhp[fi] - d);
            if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[i], 'x', case when crit then hn[i]||' lands a huge hit on the '||fname[fi]||'.' else hn[i]||' hits the '||fname[fi]||'.' end, 'v', d||' damage'||case when crit then '!' else '' end, 'c', case when crit then 'crit' else 'hit' end, 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
            if fhp[fi] <= 0 and lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', '', 'x', 'The '||fname[fi]||' goes down.', 'v', '', 'c', 'down', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
          end loop;
          if n > array_length(targets, 1) then exit; end if;
        end loop;
        rfirst[i] := false; hacts[i] := hacts[i] + 1;
        htn[i] := htn[i] + (hsw[i] / (1 + hspd[i]::float8 / 100)) / (case when t < haste_until then 1.3::float8 else 1::float8 end);
      else
        j := bi;
        if fstun[j] > 0 then
          fstun[j] := fstun[j] - 1;
          if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', '', 'x', 'The '||fname[j]||' is still seeing stars.', 'v', '', 'c', 'miss', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
          ftn[j] := ftn[j] + 2.2::float8 / (1 + fspd[j]::float8 / 100); continue;
        end if;
        if fmark[j] > 0 then fmark[j] := fmark[j] - 1; end if;
        alive := '{}'; for k in 1..nh loop if hhp[k] > 0 then alive := alive || k; end if; end loop;
        nalive := array_length(alive, 1);
        tg := 0; for k in 1..nalive loop if os__fx(hfx[alive[k]], 'aggro') > 0 then tg := alive[k]; exit; end if; end loop;
        if tg = 0 then s := os__rn(s); tg := alive[floor((s::float8 / 2147483647) * nalive)::int + 1]; end if;
        if os__fx(hfx[tg], 'dodge') > 0 then
          s := os__rn(s);
          if (s::float8 / 2147483647) < os__fx(hfx[tg], 'dodge') / 100 then
            if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[tg], 'x', hn[tg]||' slips the '||fname[j]||'''s swing.', 'v', 'Miss', 'c', 'miss', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
            ftn[j] := ftn[j] + 2.2::float8 / (1 + fspd[j]::float8 / 100); continue;
          end if;
        end if;
        dEff := hdef[tg] + floor(harm[tg]::float8 / 20)::int + (os__fx(hfx[tg], 'formation') * (nalive - 1))::int + rguard[tg] + rdown[tg];
        half := false;
        if not rtest then for k in 1..nh loop if hhp[k] > 0 and os__fx(hfx[k], 'testudo') > 0 then half := true; end if; end loop; end if;
        mult := (case when half then 0.5::float8 else 1::float8 end) * (case when os__fx(hfx[tg], 'dr') > 0 then 1 - os__fx(hfx[tg], 'dr') / 100 else 1::float8 end);
        if half then rtest := true; end if;
        s := os__rn(s); raw := flo[j] + floor((s::float8 / 2147483647) * (fhi[j] - flo[j] + 1))::int + fatk[j];
        mit := (raw * 100)::float8 / (100 + greatest(0, dEff));
        s := os__rn(s); crit := (s::float8 / 2147483647) < 5::float8 / 100;
        s := os__rn(s); v := 0.95::float8 + (s::float8 / 2147483647) * 0.10::float8;
        d := greatest(1, os__r0(mit * (case when crit then 1.5::float8 else 1::float8 end) * mult * v));
        hhp[tg] := greatest(0, hhp[tg] - d);
        if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', fname[j], 'x', case when crit then 'The '||fname[j]||' catches '||hn[tg]||' hard.' else 'The '||fname[j]||' hits '||hn[tg]||'.' end, 'v', '-'||d, 'c', 'hurt', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
        if hhp[tg] <= 0 then
          if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[tg], 'x', hn[tg]||' is down.', 'v', '', 'c', 'down', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
          rv := 0; for k in 1..nh loop if hhp[k] > 0 and os__fx(hfx[k], 'revive_first') > 0 then rv := k; exit; end if; end loop;
          if rv > 0 and not revive_first_used then
            revive_first_used := true; hhp[tg] := os__r0(os__fx(hfx[rv], 'revive_first') / 100 * hmax[tg]);
            if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[tg], 'x', 'Golden Hour. '||hn[tg]||' gets back up.', 'v', '+'||hhp[tg], 'c', 'heal', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
          else
            rv := 0; for k in 1..nh loop if hhp[k] > 0 and os__fx(hfx[k], 'revive_once') > 0 and not hrev[k] then rv := k; exit; end if; end loop;
            if rv > 0 then
              hrev[rv] := true; hhp[tg] := os__r0(os__fx(hfx[rv], 'revive_once') / 100 * hmax[tg]);
              if lgn < 260 then lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', hn[rv], 'x', hn[rv]||' shocks '||hn[tg]||' back to life.', 'v', '+'||hhp[tg], 'c', 'heal', 'hp', to_jsonb(hhp), 'fh', to_jsonb(fhp)); lgn := lgn + 1; end if;
            end if;
          end if;
          if hhp[tg] <= 0 then for k in 1..nh loop if hhp[k] > 0 and os__fx(hfx[k], 'ally_down_def') > 0 then rdown[k] := rdown[k] + os__fx(hfx[k], 'ally_down_def')::int; end if; end loop; end if;
        end if;
        ftn[j] := ftn[j] + 2.2::float8 / (1 + fspd[j]::float8 / 100);
      end if;
    end loop;

    if endk = 'clear' then
      cleared := cleared + 1;
      if r < rr then
        for k in 1..nh loop if hhp[k] > 0 then hhp[k] := least(hmax[k], hhp[k] + os__r0(0.1::float8 * hmax[k])); end if; end loop;
        select sum(z) into sh from unnest(hhp) z; select sum(z) into sm from unnest(hmax) z;
        if sh * 100 < retreat * sm then
          result := 'retreat';
          lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', '', 'x', 'Health is low. The squad backs out with what they carry.', 'v', '', 'c', 'end', 'hp', to_jsonb(hhp), 'fh', '[]'::jsonb); lgn := lgn + 1;
          exit;
        end if;
      end if;
    elsif endk = 'wipe' then
      result := 'wiped';
      lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', '', 'x', 'The whole squad is down. Someone carries them out.', 'v', '', 'c', 'end', 'hp', to_jsonb(hhp), 'fh', '[]'::jsonb); lgn := lgn + 1;
      exit;
    else
      result := 'retreat';
      lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', r, 'a', '', 'x', 'Nobody is winning this one. The squad backs out.', 'v', '', 'c', 'end', 'hp', to_jsonb(hhp), 'fh', '[]'::jsonb); lgn := lgn + 1;
      exit;
    end if;
  end loop;
  if result = 'won' then
    lg := lg || jsonb_build_object('t', floor(t*10+0.5::float8)/10, 'r', rr, 'a', '', 'x', case when p_floor % 10 = 0 then 'The Hollow Bishop falls. The floor is clear.' else 'The floor is clear. Time to head home.' end, 'v', '', 'c', 'end', 'hp', to_jsonb(hhp), 'fh', '[]'::jsonb);
  end if;
  return jsonb_build_object('rooms', rr, 'cleared', cleared, 'result', result, 't', floor(t*10+0.5::float8)/10,
    'hp', to_jsonb(hhp), 'max', to_jsonb(hmax), 'names', to_jsonb(hn),
    'ids', (select coalesce(jsonb_agg(e->'id' order by o), '[]'::jsonb) from jsonb_array_elements(p_party) with ordinality q(e, o)),
    'downed', (select coalesce(jsonb_agg(p_party->((o-1)::int)->'id' order by o), '[]'::jsonb) from unnest(hhp) with ordinality q(z, o) where z <= 0),
    'used', used, 'log', lg, 'foes', rooms);
end $$;
-- Card totals: floor(base x (1 + 0.05 x (level - 1))) + worn gear + era set (all three on their own hero).
create or replace function public.os_hero_stats(p_uid uuid, p_hero text)
returns jsonb language plpgsql stable set search_path to public as $$
declare
  lv int; hd record; m float8; b jsonb; gs record; w record; st record; fx jsonb; set_n int := 0; set_have int := 0; set_on boolean := false;
  uses jsonb; belt jsonb;
begin
  select level into lv from os_hero where uid = p_uid and hero_id = p_hero;
  lv := greatest(1, coalesce(lv, 1));
  select * into hd from os_hero_def where id = p_hero;
  if not found then return null; end if;
  b := hd.base; m := 1 + 0.05::float8 * (lv - 1);
  select coalesce(sum((i.stats->>'atk')::int), 0) atk, coalesce(sum((i.stats->>'def')::int), 0) def, coalesce(sum((i.stats->>'hp')::int), 0) hp,
         coalesce(sum((i.stats->>'spd')::int), 0) spd, coalesce(sum((i.stats->>'crit')::int), 0) crit, coalesce(sum((i.stats->>'luck')::int), 0) luck,
         coalesce(sum(i.armor), 0) armor
    into gs from os_gear g join os_item_def i on i.id = g.item_id
   where g.uid = p_uid and g.hero_id = p_hero and g.slot not like 'belt%';
  select i.dmg_lo, i.dmg_hi, i.speed into w from os_gear g join os_item_def i on i.id = g.item_id
   where g.uid = p_uid and g.hero_id = p_hero and g.slot = 'main' and i.dmg_lo is not null;
  select * into st from os_set s where s.hero_id = p_hero limit 1;
  if st.id is not null then
    select count(*) into set_n from os_item_def where set_id = st.id;
    select count(distinct g.item_id) into set_have from os_gear g join os_item_def i on i.id = g.item_id
     where g.uid = p_uid and g.hero_id = p_hero and g.slot not like 'belt%' and i.set_id = st.id;
    set_on := set_n > 0 and set_have = set_n;
  end if;
  select coalesce(jsonb_object_agg(k, v), '{}'::jsonb) into fx from (
    select e.key k, sum(e.value::float8) v from (
      select hd.fx f
      union all select i.fx from os_gear g join os_item_def i on i.id = g.item_id where g.uid = p_uid and g.hero_id = p_hero and g.slot not like 'belt%'
      union all select st.fx where set_on
    ) x, jsonb_each_text(coalesce(x.f, '{}'::jsonb)) e group by e.key) y;
  select coalesce(jsonb_agg(g.item_id order by g.slot), '[]'::jsonb) into uses from os_gear g join os_item_def i on i.id = g.item_id
   where g.uid = p_uid and g.hero_id = p_hero and g.slot in ('trinket1','trinket2') and i.use is not null;
  select jsonb_agg((select g.item_id from os_gear g where g.uid = p_uid and g.hero_id = p_hero and g.slot = s) order by o) into belt
    from unnest(array['belt1','belt2','belt3','belt4']) with ordinality q(s, o);
  return jsonb_build_object(
    'id', p_hero, 'name', coalesce(hd.short, split_part(hd.name, ' ', 1)), 'level', lv,
    'atk', floor((b->>'atk')::int * m)::int + gs.atk + case when set_on then coalesce((st.stats->>'atk')::int, 0) else 0 end,
    'def', floor((b->>'def')::int * m)::int + gs.def + case when set_on then coalesce((st.stats->>'def')::int, 0) else 0 end,
    'hp', floor((b->>'hp')::int * m)::int + gs.hp + case when set_on then coalesce((st.stats->>'hp')::int, 0) else 0 end,
    'spd', floor((b->>'spd')::int * m)::int + gs.spd + case when set_on then coalesce((st.stats->>'spd')::int, 0) else 0 end,
    'crit', (b->>'crit')::int + gs.crit + case when set_on then coalesce((st.stats->>'crit')::int, 0) else 0 end,
    'luck', (b->>'luck')::int + gs.luck + case when set_on then coalesce((st.stats->>'luck')::int, 0) else 0 end,
    'armor', gs.armor, 'lo', coalesce(w.dmg_lo, 1), 'hi', coalesce(w.dmg_hi, 3), 'swing', coalesce(w.speed, 2.0),
    'fx', fx, 'uses', uses, 'belt', belt, 'setOn', set_on, 'setCount', set_have);
end $$;

create or replace function public.os_party_snapshot(p_uid uuid, p_party text[])
returns jsonb language sql stable set search_path to public as $$
  select coalesce(jsonb_agg(public.os_hero_stats(p_uid, h) order by o), '[]'::jsonb) from unnest(p_party) with ordinality q(h, o)
$$;

create or replace function public.os_uses()
returns jsonb language sql stable set search_path to public as $$
  select coalesce(jsonb_object_agg(id, use || jsonb_build_object('name', name)), '{}'::jsonb) from os_item_def where use is not null
$$;

create or replace function public.os_fx_sum(p_snapshot jsonb, p_key text)
returns double precision language sql immutable set search_path to public as $$
  select coalesce(sum((e->'fx'->>p_key)::float8), 0) from jsonb_array_elements(coalesce(p_snapshot, '[]'::jsonb)) e
$$;

create or replace function public.os_refresh_life(p_uid uuid)
returns void language plpgsql set search_path to public as $$
declare mx int;
begin
  select coalesce(sum((e->>'hp')::int), 0) into mx from jsonb_array_elements(os_party_snapshot(p_uid, (select party from os_player where uid = p_uid))) e;
  update os_player set life_max = mx, life = case when exists(select 1 from os_delve where uid = p_uid) then least(coalesce(life, mx), mx) else mx end where uid = p_uid;
end $$;

-- Percent faster for a gathering skill: hero perk + gear + set, capped at 60.
create or replace function public.os_skill_mult(p_uid uuid, p_skill text, p_hero text)
returns numeric language plpgsql stable set search_path to public as $$
declare pct float8 := 0; s jsonb;
begin
  if p_hero is null or p_hero = '' or not exists(select 1 from os_hero where uid = p_uid and hero_id = p_hero) then return 1; end if;
  s := os_hero_stats(p_uid, p_hero);
  pct := coalesce((s->'fx'->>p_skill)::float8, 0)
    + case when p_hero = 'engineer' and p_skill = 'mining' then 15 when p_hero = 'legionary' and p_skill = 'smithing' then 15 else 0 end;
  return (1 - least(60, greatest(0, pct)) / 100)::numeric;
end $$;

create or replace function public.os_defs()
returns jsonb language plpgsql stable security definer set search_path to public as $$
begin
  if auth.uid() is null then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'items', coalesce((select jsonb_object_agg(id, jsonb_strip_nulls(jsonb_build_object('name', name, 'rarity', rarity, 'slot', slot, 'ilvl', ilvl, 'bind', bind, 'unique', uniq, 'hand', hand, 'type', itype,
        'armor', nullif(armor, 0), 'block', nullif(block, 0), 'dmg', case when dmg_lo is not null then jsonb_build_array(dmg_lo, dmg_hi) end, 'speed', speed, 'stats', stats, 'equip', equip, 'fx', fx,
        'use', use, 'set', set_id, 'hero', hero_id, 'req', req_level, 'sell', sell_copper, 'stack', stack, 'flavor', flavor, 'icon', icon)))
      from os_item_def where slot not in ('mat')), '{}'::jsonb),
    'sets', coalesce((select jsonb_object_agg(s.id, jsonb_build_object('name', s.name, 'bonus', s.bonus_name, 'text', s.bonus_text, 'stats', s.stats, 'fx', s.fx,
        'items', coalesce((select jsonb_agg(i.id order by i.slot) from os_item_def i where i.set_id = s.id), '[]'::jsonb))) from os_set s), '{}'::jsonb),
    'heroes', coalesce((select jsonb_object_agg(id, jsonb_build_object('base', base, 'fx', fx, 'short', short)) from os_hero_def), '{}'::jsonb)
  );
end $$;

create or replace function public.os_equip(p_hero text, p_slot text, p_item text)
returns jsonb language plpgsql security definer set search_path to public as $$
declare
  u uuid := auth.uid(); p os_player; lv int; it record; kind text; cur text; mainit record;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select * into p from os_player where uid = u for update;
  if p.uid is null then raise exception 'no player'; end if;
  if coalesce(p.banned, false) then raise exception 'The city has closed its door to you.'; end if;
  select level into lv from os_hero where uid = u and hero_id = p_hero;
  if lv is null then raise exception 'You do not have that hero.'; end if;
  if p_slot not in ('head','neck','chest','hands','legs','feet','ring1','ring2','main','off','trinket1','trinket2','belt1','belt2','belt3','belt4') then raise exception 'No such slot.'; end if;
  if exists(select 1 from os_delve d where d.uid = u and p_hero = any(d.party)) then raise exception 'That hero is out on a delve.'; end if;
  kind := regexp_replace(p_slot, '\d+$', '');
  select item_id into cur from os_gear where uid = u and hero_id = p_hero and slot = p_slot;

  if p_item is null or p_item = '' then
    if cur is not null then
      delete from os_gear where uid = u and hero_id = p_hero and slot = p_slot;
      if kind <> 'belt' then perform os_give(u, cur, 1); end if;
    end if;
  else
    select * into it from os_item_def where id = p_item;
    if not found then raise exception 'That is not something you can wear.'; end if;
    if it.slot <> kind then raise exception 'That does not go there.'; end if;
    if coalesce(it.req_level, 1) > lv then raise exception 'Needs card level %.', it.req_level; end if;
    if coalesce((select qty from os_bag where uid = u and item_id = p_item), 0) < 1 then raise exception 'You do not have one of those.'; end if;
    if kind = 'off' then
      select i.hand into mainit from os_gear g join os_item_def i on i.id = g.item_id where g.uid = u and g.hero_id = p_hero and g.slot = 'main';
      if mainit.hand = 'Two-Hand' then raise exception 'Both hands are busy with a two-handed weapon.'; end if;
    end if;
    if kind <> 'belt' and it.uniq and exists(select 1 from os_gear where uid = u and hero_id = p_hero and item_id = p_item and slot <> p_slot) then
      raise exception 'You can only wear one of these.';
    end if;
    if kind = 'main' and it.hand = 'Two-Hand' then
      select item_id into cur from os_gear where uid = u and hero_id = p_hero and slot = 'off';
      if cur is not null then delete from os_gear where uid = u and hero_id = p_hero and slot = 'off'; perform os_give(u, cur, 1); end if;
      select item_id into cur from os_gear where uid = u and hero_id = p_hero and slot = p_slot;
    end if;
    if kind <> 'belt' then
      if cur is not null then perform os_give(u, cur, 1); end if;
      perform os_give(u, p_item, -1);
    end if;
    insert into os_gear(uid, hero_id, slot, item_id) values (u, p_hero, p_slot, p_item)
    on conflict (uid, hero_id, slot) do update set item_id = excluded.item_id;
  end if;
  perform os_refresh_life(u);
  return os_pack(u);
end $$;

create or replace function public.os_admin_items(op text, payload jsonb)
returns jsonb language plpgsql security definer set search_path to public as $$
declare pt jsonb; iid text;
begin
  if auth.uid() is null or not public.os_is_admin() then raise exception 'not allowed'; end if;
  if op = 'item' then
    iid := payload->>'id'; pt := coalesce(payload->'patch', '{}'::jsonb);
    if not exists(select 1 from os_item_def where id = iid) then raise exception 'No such item.'; end if;
    if pt ? 'rarity' and pt->>'rarity' not in ('common','uncommon','rare','epic','legendary','absurd','unhinged') then raise exception 'Bad rarity.'; end if;
    if pt ? 'slot' and pt->>'slot' not in ('head','neck','chest','hands','legs','feet','ring','main','off','trinket','belt','mat') then raise exception 'Bad slot.'; end if;
    if pt ? 'set_id' and nullif(pt->>'set_id', '') is not null and not exists(select 1 from os_set where id = pt->>'set_id') then raise exception 'No such set.'; end if;
    update os_item_def set
      name = coalesce(nullif(pt->>'name', ''), name),
      rarity = coalesce(pt->>'rarity', rarity),
      slot = coalesce(pt->>'slot', slot),
      ilvl = coalesce((pt->>'ilvl')::int, ilvl),
      req_level = least(10, greatest(1, coalesce((pt->>'req_level')::int, req_level))),
      armor = greatest(0, coalesce((pt->>'armor')::int, armor)),
      block = greatest(0, coalesce((pt->>'block')::int, block)),
      dmg_lo = case when pt ? 'dmg_lo' then nullif(pt->>'dmg_lo', '')::int else dmg_lo end,
      dmg_hi = case when pt ? 'dmg_hi' then nullif(pt->>'dmg_hi', '')::int else dmg_hi end,
      speed = case when pt ? 'speed' then nullif(pt->>'speed', '')::float8 else speed end,
      stats = case when pt ? 'stats' then (select coalesce(jsonb_object_agg(key, value::int), '{}'::jsonb) from jsonb_each_text(pt->'stats') where key in ('atk','def','hp','spd','crit','luck') and value ~ '^-?\d+$' and value::int <> 0) else stats end,
      fx = case when pt ? 'fx' and jsonb_typeof(pt->'fx') = 'object' then pt->'fx' else fx end,
      equip = case when pt ? 'equip' and jsonb_typeof(pt->'equip') = 'array' then pt->'equip' else equip end,
      set_id = case when pt ? 'set_id' then nullif(pt->>'set_id', '') else set_id end,
      sell_copper = case when pt ? 'sell_copper' then greatest(0, nullif(pt->>'sell_copper', '')::bigint) else sell_copper end,
      flavor = case when pt ? 'flavor' then pt->>'flavor' else flavor end,
      in_pool = coalesce((pt->>'in_pool')::boolean, in_pool)
    where id = iid;
    perform public.os_admin_audit('item', iid, pt);
  elsif op = 'set' then
    iid := payload->>'id'; pt := coalesce(payload->'patch', '{}'::jsonb);
    if not exists(select 1 from os_set where id = iid) then raise exception 'No such set.'; end if;
    update os_set set
      name = coalesce(nullif(pt->>'name', ''), name),
      bonus_name = coalesce(nullif(pt->>'bonus_name', ''), bonus_name),
      bonus_text = coalesce(nullif(pt->>'bonus_text', ''), bonus_text),
      stats = case when pt ? 'stats' then (select coalesce(jsonb_object_agg(key, value::int), '{}'::jsonb) from jsonb_each_text(pt->'stats') where key in ('atk','def','hp','spd','crit','luck') and value ~ '^-?\d+$' and value::int <> 0) else stats end,
      fx = case when pt ? 'fx' and jsonb_typeof(pt->'fx') = 'object' then pt->'fx' else fx end
    where id = iid;
    perform public.os_admin_audit('set', iid, pt);
  end if;
  return public.os_defs();
end $$;
create or replace function public.os_tick(p_uid uuid)
returns void language plpgsql security definer set search_path to public as $$
declare
  p public.os_player;
  elapsed numeric;
  cap numeric;
  active text;
  spec jsonb;
  iv numeric;
  actions integer := 0;
  afford integer;
  xp integer := 0;
  qty integer := 0;
  item text;
  usej jsonb;
  k text;
  need integer;
  have integer;
  cfg jsonb;
  hold boolean;
  pend jsonb;
begin
  select * into p from os_player where uid = p_uid for update;
  if not found then return; end if;
  if coalesce(p.banned, false) then
    raise exception 'The city has closed its door to you.';
  end if;
  select value into cfg from os_config where key = 'game';
  cfg := coalesce(cfg, '{}'::jsonb);
  cap := coalesce((cfg->>'offlineHours')::numeric, 24) * 3600;
  elapsed := least(cap, greatest(0, extract(epoch from (now() - coalesce(p.last_tick, now())))));
  hold := elapsed > 600;
  pend := coalesce(p.pending, '{"items":{},"xp":{}}'::jsonb);
  if pend->'items' is null then pend := jsonb_set(pend, '{items}', '{}'::jsonb); end if;
  active := nullif(p.skill->>'active','');
  if active is not null and elapsed >= 1 then
    spec := public.os_node(active, p.skill->active->>'node');
    if spec is not null then
      iv := greatest(0.4, (spec->>'sec')::numeric * public.os_skill_mult(p_uid, active, p.skill->active->>'hero'));
      actions := floor(elapsed / iv)::integer;
      usej := spec->'use';
      if usej is not null then
        afford := 1000000;
        for k, need in select key, value::integer from jsonb_each_text(usej) loop
          select coalesce(os_bag.qty,0) into have from os_bag where uid = p_uid and item_id = k;
          afford := least(afford, floor(coalesce(have,0)::numeric / greatest(need,1)));
        end loop;
        actions := least(actions, coalesce(afford,0));
      end if;
      if actions > 0 then
        if usej is not null then
          for k, need in select key, value::integer from jsonb_each_text(usej) loop
            perform public.os_give(p_uid, k, -(need * actions));
          end loop;
        end if;
        xp := round(actions * (spec->>'xp')::numeric * coalesce((cfg->>'xpRate')::numeric, 1))::integer;
        item := spec->>'item';
        qty := actions * coalesce((spec->>'qty')::integer, 1);
        p.skill := jsonb_set(coalesce(p.skill,'{}'::jsonb), array[active,'xp'], to_jsonb(coalesce((p.skill->active->>'xp')::integer,0) + case when hold then 0 else xp end), true);
        if hold then
          pend := jsonb_set(pend, array['items', item], to_jsonb(coalesce((pend#>>array['items',item])::integer,0) + qty), true);
          pend := jsonb_set(pend, array['xp', active], to_jsonb(coalesce((pend#>>array['xp',active])::integer,0) + xp), true);
          pend := jsonb_set(pend, '{away}', to_jsonb(floor(elapsed/60)::text || 'm'), true);
        else
          perform public.os_give(p_uid, item, qty);
          insert into os_event(uid, kind, qty, ref) values (p_uid, 'item', qty, item);
        end if;
      end if;
    end if;
  end if;
  if extract(epoch from (now() - coalesce(p.vigor_at, now()))) >= coalesce((cfg->>'vigorEvery')::numeric, 300) and p.vigor < 100 then
    p.vigor := least(100, p.vigor + coalesce((cfg->>'vigorChunk')::integer, 5));
    p.vigor_at := now();
  end if;
  if extract(epoch from (now() - coalesce(p.daring_at, now()))) >= coalesce((cfg->>'daringEvery')::numeric, 240) and p.daring < 25 then
    p.daring := least(25, p.daring + 1);
    p.daring_at := now();
  end if;
  if p.travel_until is not null and p.travel_until <= now() then
    p.city := coalesce(p.travel_to, p.city);
    p.travel_to := null;
    p.travel_until := null;
  end if;
  update os_player set
    skill = p.skill,
    vigor = p.vigor,
    daring = p.daring,
    vigor_at = coalesce(p.vigor_at, now()),
    daring_at = coalesce(p.daring_at, now()),
    city = p.city,
    travel_to = p.travel_to,
    travel_until = p.travel_until,
    pending = case when hold and actions > 0 then pend else os_player.pending end,
    last_tick = now(),
    seen_at = now()
  where uid = p_uid;
end $$;

create or replace function public.os_pack(p_uid uuid)
returns jsonb language plpgsql security definer set search_path to public as $$
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
    'known', coalesce((select jsonb_agg(hd.id) from os_hero_def hd where hd.found), '[]'::jsonb),
    'feed', coalesce((select jsonb_agg(f.msg) from (select msg from os_feed order by id desc limit 8) f), '[]'::jsonb),
    'crier', coalesce((select jsonb_agg(jsonb_build_object('tag', coalesce(c.tag,'Streets'), 'msg', c.msg, 'at', c.at) order by c.id desc) from (select * from os_feed order by id desc limit 20) c), '[]'::jsonb),
    'welcome', welcome,
    'gear', coalesce((select jsonb_object_agg(x.hero_id, x.g) from (select g.hero_id, jsonb_object_agg(g.slot, g.item_id) g from os_gear g where g.uid = p_uid group by g.hero_id) x), '{}'::jsonb),
    'stats', coalesce((select jsonb_object_agg(h.hero_id, public.os_hero_stats(p_uid, h.hero_id)) from os_hero h where h.uid = p_uid), '{}'::jsonb),
    'market', jsonb_build_object(
      'listings', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'item', l.item_id, 'price', l.price, 'qty', l.qty, 'today', 0, 'kind', l.kind, 'hero_id', l.hero_id)) from os_listing l where l.kind = 'item'), '[]'::jsonb),
      'cards', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'hero', l.hero_id, 'level', coalesce(l.hero_level,1), 'seller', coalesce(sp.name,'a trader'), 'price', l.price)) from os_listing l left join os_player sp on sp.uid = l.seller where l.kind = 'card'), '[]'::jsonb),
      'orders', coalesce((select jsonb_agg(jsonb_build_object('text','Selling '||l.qty||' '||coalesce(i.name,l.item_id),'meta','Listed','good', true)) from os_listing l left join os_item_def i on i.id = l.item_id where l.seller = p_uid), '[]'::jsonb)
    ),
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
end $$;

create or replace function public.os_state()
returns jsonb language plpgsql security definer set search_path to public as $$
declare u uuid := auth.uid(); p os_player;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select * into p from os_player where uid = u;
  if not found then
    insert into os_player(uid, name, gold)
    values (u, coalesce(auth.jwt()->'user_metadata'->>'full_name', split_part(coalesce(auth.jwt()->>'email','Summoned'),'@',1)), 100)
    returning * into p;
    perform os_grant_hero(u, 'office_worker');
    perform os_grant_hero(u, 'delivery_rider');
    update os_player set party = array['office_worker','delivery_rider'] where uid = u;
    insert into os_bag(uid, item_id, qty) values (u,'stained_mug',1),(u,'delivery_bag',1),(u,'eel_stew',3) on conflict do nothing;
  end if;
  perform os_tick(u);
  perform os_refresh_life(u);
  return os_pack(u);
end $$;

create or replace function public.os_set_party(p text[])
returns void language plpgsql security definer set search_path to public as $$
declare u uuid := auth.uid();
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  if coalesce(array_length(p,1),0) > 3 then raise exception 'max 3'; end if;
  if exists(select 1 from unnest(p) x where not exists(select 1 from os_hero where uid = u and hero_id = x)) then raise exception 'not owned'; end if;
  if exists(select 1 from os_delve where uid = u) then raise exception 'delving'; end if;
  if exists(select 1 from unnest(p) x join os_infirmary i on i.uid = u and i.hero_id = x and i.until > now()) then
    raise exception 'That hero is resting.';
  end if;
  update os_player set party = p where uid = u;
  perform os_refresh_life(u);
end $$;

create or replace function public.os_sell(i text, q integer)
returns integer language plpgsql security definer set search_path to public as $$
declare u uuid := auth.uid(); have int; r text; v bigint; fee numeric; price int; unit bigint; sc bigint; tot bigint;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select b.qty into have from os_bag b where b.uid = u and b.item_id = i;
  if have is null or q < 1 then raise exception 'nothing to sell'; end if;
  q := least(q, have);
  select rarity, sell_copper into r, sc from os_item_def where id = i;
  select l.price into price from os_listing l where l.item_id = i and kind = 'item' order by id limit 1;
  unit := case when price is not null then price::bigint * 10000 when sc is not null then sc else os_sellval(r)::bigint * 10000 end;
  v := unit * q;
  select coalesce((value->>'marketFee')::numeric, 0) into fee from os_config where key = 'game';
  v := greatest(1, v - round(v * coalesce(fee, 0))::bigint);
  if have - q <= 0 then delete from os_bag where uid = u and item_id = i; else update os_bag set qty = qty - q where uid = u and item_id = i; end if;
  select copper::bigint + v into tot from os_player where uid = u;
  update os_player set gold = gold + (tot / 10000)::int, copper = (tot % 10000)::int where uid = u;
  insert into os_trade(item_id, price, qty) values (i, greatest(1, round(unit / 10000.0))::int, q);
  insert into os_event(uid, kind, qty, ref) values (u, 'trade', least(v, 2147483647)::int, i);
  return least(v, 2147483647)::int;
end $$;

create or replace function public.os_act(op text, payload jsonb)
returns jsonb language plpgsql security definer set search_path to public as $$
declare
  u uuid := auth.uid();
  p os_player;
  job text;
  chance int;
  v_gold int;
  dest text;
  v_item text;
  v_qty int;
  v_price int;
  cid uuid;
  hid text;
  hg float8;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  perform os_tick(u);
  select * into p from os_player where uid = u;
  if coalesce(p.banned,false) then raise exception 'The city has closed its door to you.'; end if;

  if op = 'skill' then
    if payload->>'op' = 'stop' then
      update os_player set skill = skill - 'active' where uid = u;
    else
      update os_player set skill =
        coalesce(skill,'{}'::jsonb)
        || jsonb_build_object('active', payload->>'skill')
        || jsonb_build_object(payload->>'skill', coalesce(skill->(payload->>'skill'), '{}'::jsonb) || jsonb_build_object('node', payload->>'node', 'xp', coalesce((skill->(payload->>'skill')->>'xp')::int, 0)))
      where uid = u;
    end if;
    if payload ? 'hero' then
      if nullif(payload->>'hero', '') is not null and not exists(select 1 from os_hero where uid = u and hero_id = payload->>'hero') then raise exception 'You do not have that hero.'; end if;
      update os_player set skill = jsonb_set(coalesce(skill, '{}'::jsonb), array[payload->>'skill'], coalesce(skill->(payload->>'skill'), '{}'::jsonb) || jsonb_build_object('hero', nullif(payload->>'hero', '')), true) where uid = u;
    end if;

  elsif op = 'hustle' then
    if p.stocks_until is not null and p.stocks_until > now() then raise exception 'You are in the Stocks.'; end if;
    job := payload->>'job';
    chance := case job when 'pockets' then 92 when 'dice' then 72 when 'smuggle' then 54 when 'duke' then 31 else 0 end;
    if exists(select 1 from os_hero where uid = u and hero_id = 'gangster') then chance := least(95, chance + 15); end if;
    if p.daring < (case job when 'pockets' then 2 when 'dice' then 5 when 'smuggle' then 10 when 'duke' then 15 else 99 end) then
      raise exception 'Not enough Daring.';
    end if;
    update os_player set daring = daring - case job when 'pockets' then 2 when 'dice' then 5 when 'smuggle' then 10 else 15 end, hustle_xp = hustle_xp + 20 where uid = u;
    if random() * 100 < chance then
      v_gold := case job when 'pockets' then 12 + floor(random()*29) when 'dice' then 150 when 'smuggle' then 600 else 2500 end;
      hg := public.os_fx_sum(public.os_party_snapshot(u, p.party), 'hustle_gold');
      v_gold := floor(v_gold * (1 + least(100, hg) / 100))::int;
      update os_player set gold = gold + v_gold where uid = u;
      insert into os_hustle_log(uid, result, detail, gold) values (u, 'Won', job, v_gold);
      perform os_feed_post('Streets', 'A hustle paid out in the Night Market.');
    else
      if job in ('dice','smuggle') then
        update os_player set stocks_until = now() + case job when 'dice' then interval '10 minutes' else interval '25 minutes' end where uid = u;
      end if;
      insert into os_hustle_log(uid, result, detail, gold) values (u, 'Caught', job, 0);
      perform os_feed_post('Streets', 'The guards closed a hustle in the market.');
    end if;

  elsif op = 'travel' then
    dest := payload->>'dest';
    if dest not in ('aldermere','sable','emberfall','frost','rome') then raise exception 'No such road.'; end if;
    update os_player set travel_to = dest, travel_until = now() + interval '25 minutes' where uid = u;

  elsif op = 'choice' then
    if payload->>'choice' = 'eat' then
      if coalesce((select qty from os_bag where uid = u and item_id = 'eel_stew'), 0) < 1 then raise exception 'There is no stew in the bank.'; end if;
      if coalesce((select choice from os_delve where uid = u), '') <> 'eat' then perform os_give(u, 'eel_stew', -1); end if;
    end if;
    update os_delve set choice = payload->>'choice' where uid = u;

  elsif op = 'bail' then
    if p.gold < 900 or p.stocks_until is null or p.stocks_until <= now() then raise exception 'Bail is not waiting.'; end if;
    update os_player set gold = gold - 900, stocks_until = null where uid = u;

  elsif op = 'summon' then
    if p.sigils < 1 then raise exception 'You need a sigil.'; end if;
    update os_player set sigils = sigils - 1 where uid = u;
    perform os_grant_hero(u, 'will_slapton');

  elsif op = 'pack' then
    if p.gold < 1250 then raise exception 'A pack costs 1,250 gold.'; end if;
    update os_player set gold = gold - 1250 where uid = u;
    select id into hid from os_hero_def order by random() limit 1;
    perform os_grant_hero(u, hid);

  elsif op = 'collect' then
    if p.pending is not null and p.pending->'items' is not null then
      for v_item, v_qty in select key, value::integer from jsonb_each_text(p.pending->'items') loop
        perform os_give(u, v_item, v_qty);
      end loop;
    end if;
    if p.pending is not null and p.pending->'xp' is not null then
      update os_player set skill = skill
        || jsonb_build_object('mining', coalesce(skill->'mining','{}'::jsonb) || jsonb_build_object('xp', coalesce((skill#>>'{mining,xp}')::int,0) + coalesce((p.pending#>>'{xp,mining}')::int,0)))
        || jsonb_build_object('woodcutting', coalesce(skill->'woodcutting','{}'::jsonb) || jsonb_build_object('xp', coalesce((skill#>>'{woodcutting,xp}')::int,0) + coalesce((p.pending#>>'{xp,woodcutting}')::int,0)))
        || jsonb_build_object('fishing', coalesce(skill->'fishing','{}'::jsonb) || jsonb_build_object('xp', coalesce((skill#>>'{fishing,xp}')::int,0) + coalesce((p.pending#>>'{xp,fishing}')::int,0)))
        || jsonb_build_object('cooking', coalesce(skill->'cooking','{}'::jsonb) || jsonb_build_object('xp', coalesce((skill#>>'{cooking,xp}')::int,0) + coalesce((p.pending#>>'{xp,cooking}')::int,0)))
        || jsonb_build_object('smithing', coalesce(skill->'smithing','{}'::jsonb) || jsonb_build_object('xp', coalesce((skill#>>'{smithing,xp}')::int,0) + coalesce((p.pending#>>'{xp,smithing}')::int,0)))
        || jsonb_build_object('alchemy', coalesce(skill->'alchemy','{}'::jsonb) || jsonb_build_object('xp', coalesce((skill#>>'{alchemy,xp}')::int,0) + coalesce((p.pending#>>'{xp,alchemy}')::int,0)))
        || jsonb_build_object('summoning', coalesce(skill->'summoning','{}'::jsonb) || jsonb_build_object('xp', coalesce((skill#>>'{summoning,xp}')::int,0) + coalesce((p.pending#>>'{xp,summoning}')::int,0)))
      where uid = u;
    end if;
    update os_player set pending = null where uid = u;

  elsif op = 'market' then
    v_item := payload->>'item';
    v_qty := greatest(1, coalesce((payload->>'qty')::int, 1));
    if payload->>'op' = 'buy' then
      select price into v_price from os_listing where item_id = v_item and kind = 'item' order by id limit 1;
      v_price := coalesce(v_price, 10) * v_qty;
      if p.gold < v_price then raise exception 'Not enough gold.'; end if;
      update os_player set gold = gold - v_price where uid = u;
      perform os_give(u, v_item, v_qty);
      insert into os_trade(item_id, price, qty) values (v_item, v_price, v_qty);
      insert into os_event(uid, kind, qty, ref) values (u, 'trade', v_price, v_item);
    end if;

  elsif op = 'forge' then
    if coalesce((select qty from os_bag where uid=u and item_id='moonsilver_bar'),0) < 4
       or coalesce((select qty from os_bag where uid=u and item_id='ash_log'),0) < 2 then
      raise exception 'Not enough bars and wood.';
    end if;
    perform os_give(u, 'moonsilver_bar', -4);
    perform os_give(u, 'ash_log', -2);
    perform os_give(u, 'moonsilver_gladius', 1);

  elsif op = 'card' then
    if payload->>'op' = 'level' then
      update os_hero set dupes = dupes - 1, level = level + 1
      where uid = u and hero_id = payload->>'hero' and dupes > 0 and level < 10;
      perform os_refresh_life(u);
    end if;

  elsif op = 'crew' then
    if payload->>'op' = 'create' then
      insert into os_crew(name, code, owner, motto)
      values (left(coalesce(payload->>'name','Crew'), 32), substr(md5(u::text||clock_timestamp()::text), 1, 6), u, 'Show up. Share the haul.')
      returning id into cid;
      insert into os_crew_member(crew_id, uid, role) values (cid, u, 'leader');
    elsif payload->>'op' = 'chat' then
      insert into os_chat(crew_id, uid, body)
      select crew_id, u, left(payload->>'text', 240) from os_crew_member where uid = u;
    elsif payload->>'op' = 'give' then
      v_qty := least(coalesce((payload->>'qty')::int, 1), coalesce((select qty from os_bag where uid=u and item_id='moonsilver_ore'),0));
      if v_qty > 0 then
        perform os_give(u, 'moonsilver_ore', -v_qty);
        update os_crew set goal_have = goal_have + v_qty, cup = cup + v_qty
        where id = (select crew_id from os_crew_member where uid = u);
      end if;
    end if;
  end if;

  return os_pack(u);
end $$;
create or replace function public.os_start_delve(f integer, m integer)
returns void language plpgsql security definer set search_path to public as $$
declare u uuid := auth.uid(); p os_player; allowed int[]; cost int; mins numeric; snap jsonb; stock jsonb; sd bigint; fight jsonb;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select * into p from os_player where uid = u for update;
  if p.uid is null then raise exception 'no player'; end if;
  if coalesce(p.banned,false) then raise exception 'The city has closed its door to you.'; end if;
  allowed := array[1,15,60,240,480];
  select array(select jsonb_array_elements_text(value->'delveMinutes')::int) into allowed from os_config where key = 'game' and value ? 'delveMinutes';
  if allowed is null or cardinality(allowed) = 0 then allowed := array[1,15,60,240,480]; end if;
  if not (m = any(allowed)) then raise exception 'bad length'; end if;
  if f < 1 or f > p.deepest then raise exception 'floor locked'; end if;
  if coalesce(array_length(p.party,1),0) < 1 then raise exception 'empty party'; end if;
  if exists(select 1 from os_delve where uid = u) then raise exception 'already delving'; end if;
  if exists(select 1 from unnest(p.party) x join os_infirmary i on i.uid = u and i.hero_id = x and i.until > now()) then
    raise exception 'That hero is resting.';
  end if;
  cost := case m when 1 then 6 when 15 then 12 when 60 then 20 when 240 then 35 when 480 then 50 else 12 end + greatest(0, f - 1);
  if p.vigor < cost then raise exception 'Not enough Vigor.'; end if;
  snap := os_party_snapshot(u, p.party);
  select coalesce(jsonb_object_agg(b.item_id, b.qty), '{}'::jsonb) into stock from os_bag b
   where b.uid = u and b.item_id in (select distinct g.item_id from os_gear g where g.uid = u and g.hero_id = any(p.party) and g.slot like 'belt%');
  sd := 1 + floor(random() * 2147483000)::bigint;
  fight := os_fight_sim(snap, f, m, sd, coalesce(p.rules, '{"heal":40,"retreat":25}'::jsonb), stock, os_uses());
  mins := m;
  if 'delivery_rider' = any(p.party) then mins := mins * 0.9; end if;
  mins := mins * (1 - least(60, os_fx_sum(snap, 'delve_speed')) / 100)::numeric;
  update os_player set vigor = vigor - cost, life_max = (select coalesce(sum((e->>'hp')::int), 0) from jsonb_array_elements(snap) e), life = (select coalesce(sum((e->>'hp')::int), 0) from jsonb_array_elements(snap) e) where uid = u;
  insert into os_delve(uid, party, floor, minutes, ends_at, seed, fight)
  values (u, p.party, f, m, now() + make_interval(secs => greatest(20, (mins * 60)::int)), sd, fight || jsonb_build_object('party', snap));
  insert into os_event(uid, kind, qty, ref) values (u, 'delve', 1, f::text);
end $$;

create or replace function public.os_claim()
returns jsonb language plpgsql security definer set search_path to public as $$
declare
  u uuid := auth.uid(); d os_delve; mult numeric; n int; nb int; i int; r numeric; rar text; it text;
  loot jsonb := '{}'::jsonb; g int; hid text; isnew boolean; hres jsonb := null;
  tiers text[] := array['unhinged','absurd','legendary','epic','rare','uncommon','common']; k int;
  rates jsonb; hc numeric; fight jsonb; snap jsonb; rooms int; cl int; res text; luck float8; lm float8; nr float8; ny int;
  w_common float8; w_uncommon float8; w_rare float8; w_epic float8; w_legendary float8; w_absurd float8; w_unhinged float8; w_tot float8;
  rec record; have int; downed jsonb; rest numeric;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select * into d from os_delve where uid = u for update;
  if not found then raise exception 'nothing to claim'; end if;
  if now() < d.ends_at then raise exception 'not done'; end if;
  fight := d.fight;
  snap := coalesce(fight->'party', os_party_snapshot(u, d.party));
  rooms := coalesce((fight->>'rooms')::int, 1); cl := coalesce((fight->>'cleared')::int, rooms); res := coalesce(fight->>'result', 'won');
  select value into rates from os_config where key = 'drop_rates';
  rates := coalesce(rates, '{"common":50,"uncommon":25,"rare":14,"epic":7,"legendary":3,"absurd":0.8,"unhinged":0.2}'::jsonb);
  mult := 1 + (d.floor - 1) * 0.08;
  if d.choice = 'kick' then mult := mult * 1.15; elsif d.choice = 'shield' then mult := mult * 0.95; end if;
  -- Luck: 1 + party Luck / 100, Luck counts up to 100.
  select coalesce(sum((e->>'luck')::int), 0) into luck from jsonb_array_elements(snap) e;
  lm := 1 + least(100, greatest(0, luck)) / 100;
  ny := extract(hour from (now() at time zone 'America/New_York'))::int;
  nr := case when (ny >= 20 or ny < 6) then 1 + least(100, os_fx_sum(snap, 'night_rare')) / 100 else 1 end;
  w_common := coalesce((rates->>'common')::float8, 50);
  w_uncommon := coalesce((rates->>'uncommon')::float8, 25) * sqrt(lm);
  w_rare := coalesce((rates->>'rare')::float8, 14) * lm * nr;
  w_epic := coalesce((rates->>'epic')::float8, 7) * lm * nr;
  w_legendary := coalesce((rates->>'legendary')::float8, 3) * lm * nr;
  w_absurd := coalesce((rates->>'absurd')::float8, 0.8) * lm * mult::float8 * nr;
  w_unhinged := coalesce((rates->>'unhinged')::float8, 0.2) * lm * mult::float8 * nr;
  w_tot := w_common + w_uncommon + w_rare + w_epic + w_legendary + w_absurd + w_unhinged;
  -- Finds scale with the rooms you cleared.
  nb := greatest(2, d.minutes / 4 + 1) + (coalesce(array_length(d.party,1),1) - 1);
  n := case when cl > 0 then greatest(1, round(nb * cl::numeric / greatest(1, rooms))::int) else 0 end;
  if cl > 0 then n := n + os_fx_sum(snap, 'extra_roll')::int + (os_fx_sum(snap, 'chest_find')::int * (cl / 3)); end if;
  for i in 1..n loop
    r := random() * w_tot;
    rar := case
      when r < w_unhinged then 'unhinged'
      when r < w_unhinged + w_absurd then 'absurd'
      when r < w_unhinged + w_absurd + w_legendary then 'legendary'
      when r < w_unhinged + w_absurd + w_legendary + w_epic then 'epic'
      when r < w_unhinged + w_absurd + w_legendary + w_epic + w_rare then 'rare'
      when r < w_unhinged + w_absurd + w_legendary + w_epic + w_rare + w_uncommon then 'uncommon'
      else 'common' end;
    it := null;
    for k in array_position(tiers, rar)..7 loop
      select id into it from os_item_def where rarity = tiers[k] and in_pool order by random() limit 1;
      exit when it is not null;
    end loop;
    if it is not null then
      loot := jsonb_set(loot, array[it], to_jsonb(coalesce((loot->>it)::int,0) + 1));
      insert into os_bag(uid, item_id, qty) values (u, it, 1) on conflict (uid, item_id) do update set qty = os_bag.qty + 1;
      insert into os_event(uid, kind, qty, ref) values (u, 'item', 1, it);
    end if;
  end loop;
  -- Gold: scaled by rooms cleared, plus gold gear. A full wipe drops half of it.
  g := floor(((d.minutes * d.floor * 2) + floor(random() * (d.minutes + 5))) * cl::numeric / greatest(1, rooms) * (1 + least(100, os_fx_sum(snap, 'delve_gold')) / 100)::numeric)::int;
  if res = 'wiped' then g := floor(g * 0.5)::int; end if;
  update os_player set gold = gold + g, deepest = case when res = 'won' and d.floor = deepest and d.minutes >= 15 then deepest + 1 else deepest end where uid = u;
  -- Potions and food drunk in the fight come out of the bank.
  for rec in select key, value::int q from jsonb_each_text(coalesce(fight->'used', '{}'::jsonb)) loop
    select qty into have from os_bag where uid = u and item_id = rec.key;
    if coalesce(have, 0) > 0 then perform os_give(u, rec.key, -least(have, rec.q)); end if;
  end loop;
  -- Heroes who went down rest in the Infirmary.
  downed := coalesce(fight->'downed', '[]'::jsonb);
  rest := 10 * d.floor * case when d.choice = 'eat' then 0.5 else 1 end;
  insert into os_infirmary(uid, hero_id, until, reason)
  select u, x, now() + make_interval(secs => (rest * 60)::int), 'Hurt on floor ' || d.floor from jsonb_array_elements_text(downed) x
  on conflict (uid, hero_id) do update set until = excluded.until, reason = excluded.reason;
  if cl > 0 then
    select coalesce((value->>d.minutes::text)::numeric, 0.02) into hc from os_config where key = 'hero_chance';
    hc := coalesce(hc, 0.02);
    if random() < hc * (1 + d.floor * 0.05) then
      select id into hid from os_hero_def order by random() limit 1;
      if hid is not null then
        isnew := os_grant_hero(u, hid);
        hres := jsonb_build_object('id', hid, 'new', isnew);
      end if;
    end if;
  end if;
  perform os_feed_post('Streets', case when res = 'won' then 'A party came up from floor ' || d.floor || ' with a heavy pack.' when res = 'wiped' then 'A party was carried up from floor ' || d.floor || '. They will be back.' else 'A party backed out of floor ' || d.floor || ' with what they could carry.' end);
  delete from os_delve where uid = u;
  perform os_refresh_life(u);
  return jsonb_build_object('gold', g, 'loot', loot, 'hero', hres, 'floor', d.floor, 'minutes', d.minutes, 'result', res, 'cleared', cl, 'rooms', rooms, 'downed', downed, 'used', coalesce(fight->'used', '{}'::jsonb));
end $$;
revoke all on function public.os__rn(bigint) from public, anon;
revoke all on function public.os__fx(jsonb, text) from public, anon;
revoke all on function public.os__r0(double precision) from public, anon;
revoke all on function public.os_fight_sim(jsonb, integer, integer, bigint, jsonb, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.os_hero_stats(uuid, text) from public, anon, authenticated;
revoke all on function public.os_party_snapshot(uuid, text[]) from public, anon, authenticated;
revoke all on function public.os_uses() from public, anon, authenticated;
revoke all on function public.os_fx_sum(jsonb, text) from public, anon, authenticated;
revoke all on function public.os_refresh_life(uuid) from public, anon, authenticated;
revoke all on function public.os_skill_mult(uuid, text, text) from public, anon, authenticated;
revoke all on function public.os_defs() from public, anon;
revoke all on function public.os_equip(text, text, text) from public, anon;
revoke all on function public.os_admin_items(text, jsonb) from public, anon;
grant execute on function public.os_defs() to authenticated;
grant execute on function public.os_equip(text, text, text) to authenticated;
grant execute on function public.os_admin_items(text, jsonb) to authenticated;
