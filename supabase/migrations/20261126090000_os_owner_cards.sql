-- Cards that belong to one account. A card, its set and its gear can carry an owner. Owned rows are
-- invisible to every other account (row security and the catalog functions), never enter a summon pool,
-- loot table, pack or market, and are handed to the owner once, already worn, on their next visit.
-- Stop if someone changed these functions since this file was written, so nobody's work is overwritten.
do $g$
begin
  if false
     or md5((select prosrc from pg_proc where oid = 'public.os_claim()'::regprocedure)) not in ('e7018ec0355762c1fda67a0f67d067e6', '7178cf1a60e1da1cd37effd1c22866a3')
     or md5((select prosrc from pg_proc where oid = 'public.os_act(text,jsonb)'::regprocedure)) not in ('620ac1255f6f0835795999234a3057a4', 'dc8da6497ca0c40097148be6a46fe54e')
     or md5((select prosrc from pg_proc where oid = 'public.os_pack(uuid)'::regprocedure)) not in ('600709acff67afa55e30f9bb0c5953f5', 'f41657ecd67626f1299a21a0dd9694e6')
     or md5((select prosrc from pg_proc where oid = 'public.os_grant_hero(uuid,text)'::regprocedure)) not in ('a76506f1f4ab206395882bd3ab234225', '817429535c8d8171ef3ab049ce708820')
     or md5((select prosrc from pg_proc where oid = 'public.os_give(uuid,text,integer)'::regprocedure)) not in ('ee65ec659a12de0a9b0da6bd63cfd26e', 'f250ad14dcb3e5411583e3cd23217cdb')
     or md5((select prosrc from pg_proc where oid = 'public.os_sell(text,integer)'::regprocedure)) not in ('d888dce7cf7d2fca2f2285d815b01666', 'fe200f0af7441998561080a04eecdbcd')
     or md5((select prosrc from pg_proc where oid = 'public.os_state()'::regprocedure)) not in ('66ccde1ad7fbe2fae8815e180ccb0e2a', 'e45335fe5c666974f88f4e55a1c146e6') then
    raise exception 'A game function changed since this file was written. Rebuild it on the new definitions.';
  end if;
end $g$;

do $g$
begin
  if md5((select prosrc from pg_proc where oid = 'public.os_defs()'::regprocedure)) not in ('3b5278979621ab61fb4255e200475a56', '30e0837699b485de95acf44f0bbdf073') then
    raise exception 'os_defs changed since this file was written. Rebuild it on the new definitions.';
  end if;
end $g$;

alter table public.os_hero_def add column if not exists owner_uid uuid;
alter table public.os_item_def add column if not exists owner_uid uuid;
alter table public.os_set add column if not exists owner_uid uuid;
create index if not exists os_hero_def_owner on public.os_hero_def(owner_uid) where owner_uid is not null;
create index if not exists os_item_def_owner on public.os_item_def(owner_uid) where owner_uid is not null;

-- Card text and art for owned cards. Read only through os_defs / os_owner_art, and only by the owner.
create table if not exists public.os_owner_card (
  hero_id text primary key references public.os_hero_def(id) on delete cascade,
  owner_uid uuid not null,
  card jsonb not null default '{}'::jsonb,
  art jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.os_owner_card enable row level security;
revoke all on public.os_owner_card from public, anon, authenticated;
drop policy if exists os_owner_card_own on public.os_owner_card;
create policy os_owner_card_own on public.os_owner_card for select to authenticated using (owner_uid = auth.uid());

-- Catalog rows: everyone sees the shared ones, only the owner sees an owned one.
drop policy if exists os_hd_r on public.os_hero_def;
create policy os_hd_r on public.os_hero_def for select to authenticated using (owner_uid is null or owner_uid = auth.uid());
drop policy if exists os_id_r on public.os_item_def;
create policy os_id_r on public.os_item_def for select to authenticated using (owner_uid is null or owner_uid = auth.uid());
drop policy if exists os_set_read on public.os_set;
create policy os_set_read on public.os_set for select to authenticated using (owner_uid is null or owner_uid = auth.uid());

-- Last line of defence: an owned card or item can never land on another account, whatever function tries.
create or replace function public.os_owner_guard()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare o uuid;
begin
  if tg_table_name = 'os_hero' then
    select owner_uid into o from os_hero_def where id = new.hero_id;
  else
    select owner_uid into o from os_item_def where id = new.item_id;
  end if;
  if o is not null and new.uid is distinct from o then return null; end if;
  return new;
end $function$;
drop trigger if exists os_owner_guard on public.os_hero;
create trigger os_owner_guard before insert or update on public.os_hero for each row execute function public.os_owner_guard();
drop trigger if exists os_owner_guard on public.os_bag;
create trigger os_owner_guard before insert or update on public.os_bag for each row execute function public.os_owner_guard();
drop trigger if exists os_owner_guard on public.os_gear;
create trigger os_owner_guard before insert or update on public.os_gear for each row execute function public.os_owner_guard();

create or replace function public.os_owner_noshop()
 returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  if exists(select 1 from os_item_def where id = new.item_id and owner_uid is not null)
     or exists(select 1 from os_hero_def where id = new.hero_id and owner_uid is not null) then
    raise exception 'That one stays with you.';
  end if;
  return new;
end $function$;
drop trigger if exists os_owner_noshop on public.os_listing;
create trigger os_owner_noshop before insert or update on public.os_listing for each row execute function public.os_owner_noshop();
revoke all on function public.os_owner_guard() from public, anon, authenticated;
revoke all on function public.os_owner_noshop() from public, anon, authenticated;

-- Hand an owned card to its owner once, with its gear already on. Safe to call on every visit.
create or replace function public.os_owner_kit(u uuid)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare h record; it record; sl text; n int;
begin
  if u is null then return; end if;
  for h in select d.id from os_hero_def d
           where d.owner_uid = u
             and not exists(select 1 from os_event e where e.uid = u and e.kind = 'kit' and e.ref = d.id) loop
    insert into os_hero(uid, hero_id) values (u, h.id) on conflict do nothing;
    insert into os_event(uid, kind, qty, ref) values (u, 'kit', 1, h.id), (u, 'card', 1, h.id);
    for it in select i.id, i.slot from os_item_def i where i.owner_uid = u and i.hero_id = h.id and i.slot <> 'mat' order by i.id loop
      sl := case it.slot when 'ring' then 'ring1' when 'trinket' then 'trinket1' else it.slot end;
      if sl in ('head','neck','chest','hands','legs','feet','ring1','main','off','trinket1')
         and not exists(select 1 from os_gear g where g.uid = u and g.hero_id = h.id and g.slot = sl) then
        insert into os_gear(uid, hero_id, slot, item_id) values (u, h.id, sl, it.id);
      else
        perform os_give(u, it.id, 1);
      end if;
      insert into os_event(uid, kind, qty, ref) values (u, 'item', 1, it.id);
    end loop;
    -- A belt of red draughts to start.
    select count(*) into n from os_gear g where g.uid = u and g.hero_id = h.id and g.slot like 'belt%';
    if n = 0 then
      insert into os_gear(uid, hero_id, slot, item_id) values (u, h.id, 'belt1', 'potion_pink'), (u, h.id, 'belt2', 'potion_pink') on conflict do nothing;
      perform os_give(u, 'potion_pink', 3);
    end if;
  end loop;
end $function$;
revoke all on function public.os_owner_kit(uuid) from public, anon, authenticated;

-- Art for the caller's own cards, as data URLs. Nobody else gets a byte of it.
create or replace function public.os_owner_art()
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
begin
  if auth.uid() is null or not os_ok() then raise exception 'not allowed'; end if;
  return coalesce((select jsonb_object_agg(c.hero_id, c.art || jsonb_build_object('v', md5(c.art::text)))
                   from os_owner_card c where c.owner_uid = auth.uid()), '{}'::jsonb);
end $function$;
revoke all on function public.os_owner_art() from public, anon;
grant execute on function public.os_owner_art() to authenticated;

-- The catalog the game loads: shared rows for everyone, plus the caller's own cards with their card text.
create or replace function public.os_defs()
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'items', coalesce((select jsonb_object_agg(id, jsonb_strip_nulls(jsonb_build_object('name', name, 'rarity', rarity, 'slot', slot, 'ilvl', ilvl, 'bind', bind, 'unique', uniq, 'hand', hand, 'type', itype,
        'armor', nullif(armor, 0), 'block', nullif(block, 0), 'dmg', case when dmg_lo is not null then jsonb_build_array(dmg_lo, dmg_hi) end, 'speed', speed, 'stats', stats, 'equip', equip, 'fx', fx,
        'use', use, 'set', set_id, 'hero', hero_id, 'req', req_level, 'sell', sell_copper, 'stack', stack, 'flavor', flavor, 'icon', icon, 'own', case when owner_uid is not null then true end)))
      from os_item_def where slot not in ('mat') and (owner_uid is null or owner_uid = me)), '{}'::jsonb),
    'sets', coalesce((select jsonb_object_agg(s.id, jsonb_strip_nulls(jsonb_build_object('name', s.name, 'bonus', s.bonus_name, 'text', s.bonus_text, 'stats', s.stats, 'fx', s.fx, 'hero', s.hero_id,
        'own', case when s.owner_uid is not null then true end,
        'items', coalesce((select jsonb_agg(i.id order by i.slot) from os_item_def i where i.set_id = s.id and (i.owner_uid is null or i.owner_uid = me)), '[]'::jsonb))))
      from os_set s where s.owner_uid is null or s.owner_uid = me), '{}'::jsonb),
    'heroes', coalesce((select jsonb_object_agg(d.id, jsonb_build_object('base', d.base, 'fx', d.fx, 'short', d.short)
        || case when d.owner_uid is not null then jsonb_build_object('own', jsonb_build_object('name', d.name, 'title', d.title, 'rarity', d.rarity, 'era', d.era, 'items', to_jsonb(d.items))
             || coalesce((select c.card from os_owner_card c where c.hero_id = d.id and c.owner_uid = me), '{}'::jsonb)) else '{}'::jsonb end)
      from os_hero_def d where d.owner_uid is null or d.owner_uid = me), '{}'::jsonb)
  );
end $function$;

CREATE OR REPLACE FUNCTION public.os_claim()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      select id into it from os_item_def where rarity = tiers[k] and in_pool and owner_uid is null order by random() limit 1;
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
      select id into hid from os_hero_def where owner_uid is null order by random() limit 1;
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
end $function$;

CREATE OR REPLACE FUNCTION public.os_act(op text, payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    elsif payload->>'op' = 'hero' then
      if coalesce(payload->>'skill', '') not in ('mining','woodcutting','fishing','cooking','smithing','alchemy','summoning') then raise exception 'No such skill.'; end if;
    else
      if public.os_node(payload->>'skill', payload->>'node') is null then raise exception 'You cannot work there yet.'; end if;
      if public.os_skill_level(coalesce((p.skill->(payload->>'skill')->>'xp')::int, 0)) < public.os_node_lv(payload->>'skill', payload->>'node') then
        raise exception 'Your level is too low for that.';
      end if;
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
      if job = 'dice' and random() < 0.25 then perform os_give(u, 'card_shard', 1); insert into os_event(uid, kind, qty, ref) values (u, 'item', 1, 'card_shard'); end if;
      if job = 'duke' and random() < 0.4 then perform os_give(u, 'gem_violet', 1); insert into os_event(uid, kind, qty, ref) values (u, 'item', 1, 'gem_violet'); end if;
      insert into os_hustle_log(uid, result, detail, gold) values (u, 'Won', job, v_gold);
      perform os_feed_post('Streets', 'A hustle paid out in the Night Market.');
    else
      if job in ('dice','smuggle') then
        update os_player set stocks_until = now() + case job when 'dice' then interval '10 minutes' else interval '25 minutes' end where uid = u;
      end if;
      if job = 'duke' and coalesce(array_length(p.party, 1), 0) > 0 then
        insert into os_infirmary(uid, hero_id, until, reason) values (u, p.party[1], now() + interval '60 minutes', 'Hurt on a job')
        on conflict (uid, hero_id) do update set until = greatest(os_infirmary.until, excluded.until), reason = excluded.reason;
      end if;
      insert into os_hustle_log(uid, result, detail, gold) values (u, 'Caught', job, 0);
      perform os_feed_post('Streets', 'The guards closed a hustle in the market.');
    end if;

  elsif op = 'travel' then
    dest := payload->>'dest';
    if dest not in ('aldermere','sable','emberfall','frost','rome') then raise exception 'No such road.'; end if;
    if p.travel_until is not null and p.travel_until > now() then raise exception 'You are already on the road.'; end if;
    if dest = p.city then raise exception 'You are already there.'; end if;
    update os_player set travel_to = dest, travel_until = now() + interval '25 minutes' where uid = u;
    if dest = 'emberfall' and random() < 0.25 then
      update os_player set gold = gold - round(gold * 0.08)::int where uid = u;
    end if;

  elsif op = 'choice' then
    if coalesce(payload->>'choice', '') not in ('kick','shield','eat') then raise exception 'No such choice.'; end if;
    if not exists(select 1 from os_delve where uid = u) then raise exception 'You are not on a delve.'; end if;
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
    select id into hid from os_hero_def where owner_uid is null order by random() limit 1;
    perform os_grant_hero(u, hid);

  elsif op = 'collect' then
    if p.pending is not null and p.pending->'items' is not null then
      for v_item, v_qty in select key, value::integer from jsonb_each_text(p.pending->'items') loop
        perform os_give(u, v_item, v_qty);
        if v_qty > 0 then insert into os_event(uid, kind, qty, ref) values (u, 'item', v_qty, v_item); end if;
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
      v_qty := least(v_qty, 999);
      select price into v_price from os_listing where item_id = v_item and kind = 'item' and seller is null order by id limit 1;
      if v_price is null or v_item = 'summon_sigil' then raise exception 'That is not for sale.'; end if;
      v_price := v_price * v_qty;
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
    insert into os_event(uid, kind, qty, ref) values (u, 'item', 1, 'moonsilver_gladius');

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
end $function$;

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
end $function$;

CREATE OR REPLACE FUNCTION public.os_grant_hero(u uuid, h text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare isnew boolean:=false; seen boolean;
begin
  -- A card that belongs to one account is never handed to anyone else.
  if exists(select 1 from os_hero_def where id = h and owner_uid is not null and owner_uid is distinct from u) then return false; end if;
  insert into os_hero(uid,hero_id) values(u,h) on conflict do nothing;
  if found then isnew:=true; else update os_hero set dupes=dupes+1 where uid=u and hero_id=h; end if;
  select d.found or d.owner_uid is not null into seen from os_hero_def d where d.id=h;
  if not seen then
    update os_hero_def set found=true where id=h;
    update os_item_def set in_pool=true where hero_id=h;
  end if;
  insert into public.os_event(uid, kind, qty, ref) values (u, 'card', 1, h);
  return isnew;
end $function$;

CREATE OR REPLACE FUNCTION public.os_give(p_uid uuid, p_item text, p_qty integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_qty is null or p_qty = 0 or p_item is null then return; end if;
  if p_qty > 0 and exists(select 1 from os_item_def where id = p_item and owner_uid is not null and owner_uid is distinct from p_uid) then return; end if;
  if p_item = 'summon_sigil' then
    update os_player set sigils = sigils + p_qty where uid = p_uid;
    return;
  end if;
  if p_qty > 0 then
    insert into os_bag(uid, item_id, qty) values (p_uid, p_item, p_qty)
    on conflict (uid, item_id) do update set qty = os_bag.qty + excluded.qty;
  else
    update os_bag set qty = qty + p_qty where uid = p_uid and item_id = p_item;
    delete from os_bag where uid = p_uid and item_id = p_item and qty <= 0;
  end if;
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
end $function$;

CREATE OR REPLACE FUNCTION public.os_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  perform os_owner_kit(u);
  perform os_tick(u);
  perform os_refresh_life(u);
  return os_pack(u);
end $function$;

