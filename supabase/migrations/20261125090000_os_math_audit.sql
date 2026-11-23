-- Math audit: every skill spot from the game list, no lost work between checks, full Vigor and Daring refill,
-- hustle drops and injuries, one road at a time, and a record of every find for Collections.
-- Stop if someone changed these functions since this file was written, so nobody's work is overwritten.
do $g$
begin
  if md5((select prosrc from pg_proc where oid = 'public.os_act(text,jsonb)'::regprocedure)) not in ('3ac596726d23521be5e6efbcc7ccba4d', '620ac1255f6f0835795999234a3057a4')
     or md5((select prosrc from pg_proc where oid = 'public.os_tick(uuid)'::regprocedure)) not in ('f4630fdc09e523cd1831ee0cd1e2b532', '7a6624041b1adf309f21f10e9ddb0afe') then
    raise exception 'os_act or os_tick changed since this file was written. Rebuild it on the new definitions.';
  end if;
end $g$;

create or replace function public.os_node(p_skill text, p_node text)
 returns jsonb language sql immutable set search_path to 'public' as $function$
  select case p_skill||':'||p_node
    when 'mining:copper' then '{"sec":2,"xp":5,"item":"copper_ore","qty":1}'::jsonb
    when 'mining:iron' then '{"sec":2.6,"xp":14,"item":"iron_ore","qty":1}'::jsonb
    when 'mining:moonsilver' then '{"sec":3,"xp":38,"item":"moonsilver_ore","qty":1}'::jsonb
    when 'mining:ember' then '{"sec":4.2,"xp":70,"item":"ember_ore","qty":1}'::jsonb
    when 'mining:void' then '{"sec":5.2,"xp":110,"item":"void_ore","qty":1}'::jsonb
    when 'mining:starfall' then '{"sec":6.4,"xp":180,"item":"gem_violet","qty":1}'::jsonb
    when 'woodcutting:ash' then '{"sec":2.2,"xp":6,"item":"ash_log","qty":1}'::jsonb
    when 'woodcutting:ironbark' then '{"sec":3,"xp":16,"item":"ash_log","qty":2}'::jsonb
    when 'woodcutting:moonwood' then '{"sec":3.6,"xp":34,"item":"ash_log","qty":2}'::jsonb
    when 'woodcutting:emberroot' then '{"sec":4.4,"xp":72,"item":"ash_log","qty":3}'::jsonb
    when 'woodcutting:voidtrunk' then '{"sec":5.5,"xp":120,"item":"ash_log","qty":3}'::jsonb
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
    when 'alchemy:draught' then '{"sec":3.4,"xp":20,"item":"potion_pink","qty":1}'::jsonb
    when 'alchemy:oil' then '{"sec":3.8,"xp":28,"item":"potion_cyan","qty":1}'::jsonb
    when 'alchemy:violet' then '{"sec":6,"xp":140,"item":"gem_violet","qty":1,"use":{"potion_pink":1,"potion_cyan":1}}'::jsonb
    when 'summoning:whisper' then '{"sec":4,"xp":22,"item":"card_shard","qty":1}'::jsonb
    when 'summoning:sigil' then '{"sec":8,"xp":60,"item":"summon_sigil","qty":1}'::jsonb
    when 'summoning:name' then '{"sec":7,"xp":120,"item":"card_shard","qty":2}'::jsonb
    else null end;
$function$;
create or replace function public.os_node_lv(p_skill text, p_node text)
 returns integer language sql immutable set search_path to '' as $function$
  select case p_skill || ':' || p_node
    when 'mining:copper' then 1
    when 'mining:iron' then 10
    when 'mining:moonsilver' then 25
    when 'mining:ember' then 55
    when 'mining:void' then 70
    when 'mining:starfall' then 85
    when 'woodcutting:ash' then 1
    when 'woodcutting:ironbark' then 15
    when 'woodcutting:moonwood' then 30
    when 'woodcutting:emberroot' then 55
    when 'woodcutting:voidtrunk' then 75
    when 'fishing:eel' then 1
    when 'fishing:lantern' then 20
    when 'fishing:ashpond' then 40
    when 'fishing:deep' then 65
    when 'cooking:stew' then 1
    when 'cooking:feast' then 25
    when 'cooking:broth' then 45
    when 'smithing:iron' then 1
    when 'smithing:moon' then 20
    when 'smithing:gladius' then 35
    when 'alchemy:draught' then 1
    when 'alchemy:oil' then 18
    when 'alchemy:violet' then 50
    when 'summoning:whisper' then 1
    when 'summoning:sigil' then 20
    when 'summoning:name' then 60
    else 999 end
$function$;
revoke all on function public.os_node(text, text) from public, anon, authenticated;
revoke all on function public.os_node_lv(text, text) from public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.os_tick(p_uid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  carry numeric := 0;
  chunks integer;
  every numeric;
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
      -- Keep the part of a swing that was already under way, so short checks never lose work.
      if (usej is null or actions < coalesce(afford, 1000000)) and elapsed < cap then
        carry := least(iv, greatest(0, elapsed - actions * iv));
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
  -- Vigor and Daring refill one step per interval, every step that has passed, and keep the leftover time.
  every := greatest(1, coalesce((cfg->>'vigorEvery')::numeric, 300));
  if p.vigor >= 100 then p.vigor_at := now();
  else
    chunks := floor(extract(epoch from (now() - coalesce(p.vigor_at, now()))) / every)::int;
    if chunks > 0 then
      p.vigor := least(100, p.vigor + chunks * coalesce((cfg->>'vigorChunk')::integer, 5));
      p.vigor_at := case when p.vigor >= 100 then now() else p.vigor_at + make_interval(secs => (chunks * every)::double precision) end;
    end if;
  end if;
  every := greatest(1, coalesce((cfg->>'daringEvery')::numeric, 240));
  if p.daring >= 25 then p.daring_at := now();
  else
    chunks := floor(extract(epoch from (now() - coalesce(p.daring_at, now()))) / every)::int;
    if chunks > 0 then
      p.daring := least(25, p.daring + chunks);
      p.daring_at := case when p.daring >= 25 then now() else p.daring_at + make_interval(secs => (chunks * every)::double precision) end;
    end if;
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
    last_tick = now() - make_interval(secs => carry::double precision),
    seen_at = now()
  where uid = p_uid;
end $function$;
revoke all on function public.os_tick(uuid) from public, anon, authenticated;

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
    select id into hid from os_hero_def order by random() limit 1;
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
revoke all on function public.os_act(text, jsonb) from public, anon;
grant execute on function public.os_act(text, jsonb) to authenticated;

-- What this player has ever found: every item that reached their bank, and every card they hold.
create or replace function public.os_collection()
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare u uuid := auth.uid();
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'items', coalesce((select jsonb_agg(distinct x) from (
        select ref x from os_event where uid = u and kind = 'item' and ref is not null
        union select item_id from os_bag where uid = u
        union select item_id from os_gear where uid = u) s), '[]'::jsonb),
    'heroes', coalesce((select jsonb_agg(hero_id) from os_hero where uid = u), '[]'::jsonb));
end $function$;
revoke all on function public.os_collection() from public, anon;
grant execute on function public.os_collection() to authenticated;

create index if not exists os_event_uid_kind_ref on public.os_event (uid, kind, ref);

-- Items already in a bank or on a card count as found.
insert into os_event(uid, kind, qty, ref)
select b.uid, 'item', 0, b.item_id from os_bag b
where not exists (select 1 from os_event e where e.uid = b.uid and e.kind = 'item' and e.ref = b.item_id);

-- The Corner Office set had three trinkets and only two trinket slots. The Black Ledger is held in the off hand now.
update public.os_item_def set slot = 'off', itype = 'Held In Off-hand' where id = 'black_ledger';
with moved as (delete from public.os_gear where item_id = 'black_ledger' and slot like 'trinket%' returning uid, item_id)
insert into public.os_bag(uid, item_id, qty) select uid, item_id, count(*) from moved group by uid, item_id
on conflict (uid, item_id) do update set qty = os_bag.qty + excluded.qty;
