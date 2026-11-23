-- Replace live os_* functions in place. Signatures and return types stay the same.
-- os_state keeps now, player, heroes, bag, delve, known, feed, and adds fields.
-- Hero finds are never written to os_feed. Heirlooms still enter the pool inside os_grant_hero.

create or replace function public.os_ok()
returns boolean language sql security definer set search_path to public
as $function$ select exists(select 1 from public.den_allow where lower(email)=lower(coalesce(auth.jwt()->>'email',''))) $function$;

create or replace function public.os_sellval(r text)
returns integer language sql immutable
as $function$ select case r when 'common' then 3 when 'uncommon' then 8 when 'rare' then 25 when 'epic' then 80 when 'legendary' then 250 when 'absurd' then 600 else 1000 end $function$;

create or replace function public.os_node(p_skill text, p_node text)
returns jsonb language sql immutable as $$
  select case p_skill||':'||p_node
    when 'mining:copper' then '{"sec":2.0,"xp":5,"item":"copper_ore","qty":1}'::jsonb
    when 'mining:iron' then '{"sec":2.6,"xp":14,"item":"iron_ore","qty":1}'::jsonb
    when 'mining:moonsilver' then '{"sec":3.0,"xp":38,"item":"moonsilver_ore","qty":1}'::jsonb
    when 'mining:ember' then '{"sec":4.2,"xp":70,"item":"ember_ore","qty":1}'::jsonb
    when 'mining:void' then '{"sec":5.2,"xp":110,"item":"void_ore","qty":1}'::jsonb
    when 'mining:starfall' then '{"sec":6.4,"xp":180,"item":"gem_violet","qty":1}'::jsonb
    when 'woodcutting:ash' then '{"sec":2.2,"xp":6,"item":"ash_log","qty":1}'::jsonb
    when 'woodcutting:ironbark' then '{"sec":3.0,"xp":16,"item":"ash_log","qty":2}'::jsonb
    when 'woodcutting:moonwood' then '{"sec":3.6,"xp":34,"item":"ash_log","qty":2}'::jsonb
    when 'fishing:eel' then '{"sec":2.4,"xp":6,"item":"raw_eel","qty":1}'::jsonb
    when 'fishing:lantern' then '{"sec":3.2,"xp":20,"item":"raw_eel","qty":2}'::jsonb
    when 'cooking:stew' then '{"sec":3.0,"xp":18,"item":"eel_stew","qty":1,"use":{"raw_eel":1}}'::jsonb
    when 'cooking:feast' then '{"sec":4.0,"xp":40,"item":"eel_stew","qty":2,"use":{"raw_eel":2}}'::jsonb
    when 'smithing:iron' then '{"sec":3.2,"xp":16,"item":"iron_bar","qty":1,"use":{"iron_ore":2}}'::jsonb
    when 'smithing:moon' then '{"sec":4.0,"xp":36,"item":"moonsilver_bar","qty":1,"use":{"moonsilver_ore":2}}'::jsonb
    when 'smithing:gladius' then '{"sec":4.0,"xp":120,"item":"moonsilver_gladius","qty":1,"use":{"moonsilver_bar":4,"ash_log":2}}'::jsonb
    when 'alchemy:draught' then '{"sec":3.4,"xp":20,"item":"potion_pink","qty":1}'::jsonb
    when 'alchemy:oil' then '{"sec":3.8,"xp":28,"item":"potion_cyan","qty":1}'::jsonb
    when 'summoning:whisper' then '{"sec":4.0,"xp":22,"item":"card_shard","qty":1}'::jsonb
    when 'summoning:sigil' then '{"sec":8.0,"xp":60,"item":"summon_sigil","qty":1}'::jsonb
    else null end;
$$;

create or replace function public.os_feed_post(p_tag text, p_msg text)
returns void language plpgsql security definer set search_path to public as $$
begin
  if p_msg ~* '(new card|hero found|was summoned|pulled an |pulled a |unhinged card|slapton|marcellus|vincenzo|edith crane|maya washington)' then
    return;
  end if;
  insert into public.os_feed(tag, msg) values (coalesce(nullif(p_tag,''),'Streets'), left(p_msg, 280));
end $$;

create or replace function public.os_grant_hero(u uuid, h text)
returns boolean language plpgsql security definer set search_path to public as $$
declare isnew boolean:=false; seen boolean;
begin
  insert into os_hero(uid,hero_id) values(u,h) on conflict do nothing;
  if found then isnew:=true; else update os_hero set dupes=dupes+1 where uid=u and hero_id=h; end if;
  select d.found into seen from os_hero_def d where d.id=h;
  if not seen then
    update os_hero_def set found=true where id=h;
    update os_item_def set in_pool=true where hero_id=h;
  end if;
  insert into public.os_event(uid, kind, qty, ref) values (u, 'card', 1, h);
  return isnew;
end $$;

create or replace function public.os_give(p_uid uuid, p_item text, p_qty integer)
returns void language plpgsql security definer set search_path to public as $$
begin
  if p_qty is null or p_qty = 0 or p_item is null then return; end if;
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
  pending jsonb;
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
  pending := coalesce(p.pending, '{"items":{},"xp":{}}'::jsonb);
  if pending->'items' is null then pending := jsonb_set(pending, '{items}', '{}'::jsonb); end if;
  active := nullif(p.skill->>'active','');
  if active is not null and elapsed >= 1 then
    spec := public.os_node(active, p.skill->active->>'node');
    if spec is not null then
      iv := greatest(0.4, (spec->>'sec')::numeric);
      actions := floor(elapsed / iv)::integer;
      usej := spec->'use';
      if usej is not null then
        afford := 1000000;
        for k, need in select key, value::integer from jsonb_each_text(usej) loop
          select coalesce(qty,0) into have from os_bag where uid = p_uid and item_id = k;
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
          pending := jsonb_set(pending, array['items', item], to_jsonb(coalesce((pending#>>array['items',item])::integer,0) + qty), true);
          pending := jsonb_set(pending, array['xp', active], to_jsonb(coalesce((pending#>>array['xp',active])::integer,0) + xp), true);
          pending := jsonb_set(pending, '{away}', to_jsonb(floor(elapsed/60)::text || 'm'), true);
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
    pending = case when hold and actions > 0 then pending else os_player.pending end,
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
    insert into os_bag(uid, item_id, qty) values (u,'stained_mug',1),(u,'delivery_bag',1) on conflict do nothing;
  end if;
  perform os_tick(u);
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
end $$;

create or replace function public.os_set_rules(r jsonb)
returns void language plpgsql security definer set search_path to public as $$
begin
  if auth.uid() is null or not os_ok() then raise exception 'not allowed'; end if;
  update os_player set rules = jsonb_build_object(
    'heal', least(90, greatest(0, coalesce((r->>'heal')::int, 40))),
    'retreat', least(90, greatest(0, coalesce((r->>'retreat')::int, 25))),
    'loot', case when r->>'loot' in ('loot','fight','balanced') then r->>'loot' else 'balanced' end
  ) where uid = auth.uid();
end $$;

create or replace function public.os_start_delve(f integer, m integer)
returns void language plpgsql security definer set search_path to public as $$
declare u uuid := auth.uid(); p os_player; allowed int[]; cost int; mins numeric;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select * into p from os_player where uid = u;
  if p.uid is null then raise exception 'no player'; end if;
  if coalesce(p.banned,false) then raise exception 'The city has closed its door to you.'; end if;
  allowed := array[1,15,60,240,480];
  select array(select jsonb_array_elements_text(value->'delveMinutes')::int) into allowed from os_config where key = 'game' and value ? 'delveMinutes';
  if allowed is null or cardinality(allowed) = 0 then allowed := array[1,15,60,240,480]; end if;
  if not (m = any(allowed)) then raise exception 'bad length'; end if;
  if f < 1 or f > p.deepest then raise exception 'floor locked'; end if;
  if coalesce(array_length(p.party,1),0) < 1 then raise exception 'empty party'; end if;
  if exists(select 1 from os_delve where uid = u) then raise exception 'already delving'; end if;
  cost := case m when 1 then 6 when 15 then 12 when 60 then 20 when 240 then 35 when 480 then 50 else 12 end + greatest(0, f - 1);
  if p.vigor < cost then raise exception 'Not enough Vigor.'; end if;
  mins := m;
  if 'delivery_rider' = any(p.party) then mins := mins * 0.9; end if;
  update os_player set vigor = vigor - cost where uid = u;
  insert into os_delve(uid, party, floor, minutes, ends_at, seed)
  values (u, p.party, f, m, now() + make_interval(secs => (mins * 60)::int), floor(random()*1000000000));
  insert into os_event(uid, kind, qty, ref) values (u, 'delve', 1, f::text);
end $$;

create or replace function public.os_claim()
returns jsonb language plpgsql security definer set search_path to public as $$
declare
  u uuid := auth.uid(); d os_delve; mult numeric; n int; i int; r numeric; rar text; it text;
  loot jsonb := '{}'::jsonb; g int; hid text; isnew boolean; hres jsonb := null;
  tiers text[] := array['unhinged','absurd','legendary','epic','rare','uncommon','common']; k int;
  rates jsonb; hc numeric;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select * into d from os_delve where uid = u;
  if not found then raise exception 'nothing to claim'; end if;
  if now() < d.ends_at then raise exception 'not done'; end if;
  select value into rates from os_config where key = 'drop_rates';
  mult := 1 + (d.floor - 1) * 0.08;
  if d.choice = 'kick' then mult := mult * 1.15; elsif d.choice = 'shield' then mult := mult * 0.95; end if;
  n := greatest(2, d.minutes / 4 + 1) + (coalesce(array_length(d.party,1),1) - 1);
  for i in 1..n loop
    r := random();
    if rates is null then
      rar := case
        when r < 0.003 * mult then 'unhinged'
        when r < 0.010 * mult then 'absurd'
        when r < 0.030 * mult then 'legendary'
        when r < 0.080 * mult then 'epic'
        when r < 0.200 * mult then 'rare'
        when r < 0.450 then 'uncommon'
        else 'common' end;
    else
      declare
        w_common numeric := coalesce((rates->>'common')::numeric, 50);
        w_uncommon numeric := coalesce((rates->>'uncommon')::numeric, 25);
        w_rare numeric := coalesce((rates->>'rare')::numeric, 14);
        w_epic numeric := coalesce((rates->>'epic')::numeric, 7);
        w_legendary numeric := coalesce((rates->>'legendary')::numeric, 3);
        w_absurd numeric := coalesce((rates->>'absurd')::numeric, 0.8) * mult;
        w_unhinged numeric := coalesce((rates->>'unhinged')::numeric, 0.2) * mult;
        w_tot numeric;
      begin
        w_tot := w_common + w_uncommon + w_rare + w_epic + w_legendary + w_absurd + w_unhinged;
        r := r * w_tot;
        rar := case
          when r < w_unhinged then 'unhinged'
          when r < w_unhinged + w_absurd then 'absurd'
          when r < w_unhinged + w_absurd + w_legendary then 'legendary'
          when r < w_unhinged + w_absurd + w_legendary + w_epic then 'epic'
          when r < w_unhinged + w_absurd + w_legendary + w_epic + w_rare then 'rare'
          when r < w_unhinged + w_absurd + w_legendary + w_epic + w_rare + w_uncommon then 'uncommon'
          else 'common' end;
      end;
    end if;
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
  g := ((d.minutes * d.floor * 2) + floor(random() * (d.minutes + 5)))::int;
  update os_player set gold = gold + g, deepest = case when d.floor = deepest and d.minutes >= 15 then deepest + 1 else deepest end where uid = u;
  select coalesce((value->>d.minutes::text)::numeric, 0.02) into hc from os_config where key = 'hero_chance';
  hc := coalesce(hc, 0.02);
  if random() < hc * (1 + d.floor * 0.05) then
    select id into hid from os_hero_def order by random() limit 1;
    if hid is not null then
      isnew := os_grant_hero(u, hid);
      hres := jsonb_build_object('id', hid, 'new', isnew);
    end if;
  end if;
  perform os_feed_post('Streets', 'A party came up from floor ' || d.floor || ' with a heavy pack.');
  delete from os_delve where uid = u;
  return jsonb_build_object('gold', g, 'loot', loot, 'hero', hres, 'floor', d.floor, 'minutes', d.minutes);
end $$;

create or replace function public.os_sell(i text, q integer)
returns integer language plpgsql security definer set search_path to public as $$
declare u uuid := auth.uid(); have int; r text; v int; fee numeric; price int;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select qty into have from os_bag where uid = u and item_id = i;
  if have is null or q < 1 then raise exception 'nothing to sell'; end if;
  q := least(q, have);
  select rarity into r from os_item_def where id = i;
  select price into price from os_listing where item_id = i and kind = 'item' order by id limit 1;
  v := coalesce(price, os_sellval(r)) * q;
  select coalesce((value->>'marketFee')::numeric, 0) into fee from os_config where key = 'game';
  v := greatest(1, v - round(v * coalesce(fee, 0))::int);
  if have - q <= 0 then delete from os_bag where uid = u and item_id = i; else update os_bag set qty = qty - q where uid = u and item_id = i; end if;
  update os_player set gold = gold + v where uid = u;
  insert into os_trade(item_id, price, qty) values (i, coalesce(price, os_sellval(r)), q);
  insert into os_event(uid, kind, qty, ref) values (u, 'trade', v, i);
  return v;
end $$;

create or replace function public.os_act(op text, payload jsonb)
returns jsonb language plpgsql security definer set search_path to public as $$
declare
  u uuid := auth.uid();
  p os_player;
  job text;
  chance int;
  gold int;
  dest text;
  item text;
  qty int;
  price int;
  cid uuid;
  hid text;
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
      gold := case job when 'pockets' then 12 + floor(random()*29) when 'dice' then 150 when 'smuggle' then 600 else 2500 end;
      update os_player set gold = gold + gold where uid = u;
      insert into os_hustle_log(uid, result, detail, gold) values (u, 'Won', job, gold);
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
      for item, qty in select key, value::integer from jsonb_each_text(p.pending->'items') loop
        perform os_give(u, item, qty);
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
    item := payload->>'item';
    qty := greatest(1, coalesce((payload->>'qty')::int, 1));
    if payload->>'op' = 'buy' then
      select price into price from os_listing where item_id = item and kind = 'item' order by id limit 1;
      price := coalesce(price, 10) * qty;
      if p.gold < price then raise exception 'Not enough gold.'; end if;
      update os_player set gold = gold - price where uid = u;
      perform os_give(u, item, qty);
      insert into os_trade(item_id, price, qty) values (item, price, qty);
      insert into os_event(uid, kind, qty, ref) values (u, 'trade', price, item);
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
      where uid = u and hero_id = payload->>'hero' and dupes > 0;
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
      qty := least(coalesce((payload->>'qty')::int, 1), coalesce((select qty from os_bag where uid=u and item_id='moonsilver_ore'),0));
      if qty > 0 then
        perform os_give(u, 'moonsilver_ore', -qty);
        update os_crew set goal_have = goal_have + qty, cup = cup + qty
        where id = (select crew_id from os_crew_member where uid = u);
      end if;
    end if;
  end if;

  return os_pack(u);
end $$;

grant execute on function public.os_ok() to authenticated;
grant execute on function public.os_state() to authenticated;
grant execute on function public.os_set_party(text[]) to authenticated;
grant execute on function public.os_set_rules(jsonb) to authenticated;
grant execute on function public.os_start_delve(integer, integer) to authenticated;
grant execute on function public.os_claim() to authenticated;
grant execute on function public.os_sell(text, integer) to authenticated;
grant execute on function public.os_act(text, jsonb) to authenticated;
grant execute on function public.os_sellval(text) to authenticated;

revoke all on function public.os_grant_hero(uuid, text) from public, anon, authenticated;
revoke all on function public.os_tick(uuid) from public, anon, authenticated;
revoke all on function public.os_pack(uuid) from public, anon, authenticated;
revoke all on function public.os_give(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.os_feed_post(text, text) from public, anon, authenticated;
