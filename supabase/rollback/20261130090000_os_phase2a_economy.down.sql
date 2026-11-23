-- Roll back Phase 2a: old functions, then the saved player progress, sell values and stall prices.
begin;
create or replace function public.os_skill_level(p_xp integer)
returns integer language plpgsql immutable set search_path = '' as $f$
declare lv int := 1; rest bigint := greatest(0, coalesce(p_xp, 0)); need bigint;
begin
  while lv < 99 loop
    need := floor(40 * power(lv, 1.55) + 20 * lv + 0.5)::bigint;
    if rest < need then return lv; end if;
    rest := rest - need; lv := lv + 1;
  end loop;
  return 99;
end $f$;
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
    when 'summoning:sigil' then '{"sec":8,"xp":60,"item":"summon_sigil","qty":1,"every":4}'::jsonb
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

update public.os_player p set skill = b.skill, pending = b.pending, hustle_xp = b.hustle_xp from public.os_bak_phase2a_player b where b.uid = p.uid;
update public.os_item_def d set sell_copper = b.sell_copper from public.os_bak_phase2a_item b where b.id = d.id;
update public.os_listing l set price = b.price from public.os_bak_phase2a_listing b where b.id = l.id;
delete from public.os_config where key = 'phase2a';
drop function if exists public.os_hustle_level(integer);
commit;
