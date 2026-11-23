-- Sigil rite: one sigil for every 4 actions, on the server as in the game list. The leftover actions
-- carry over between checks (skill.<name>.part), so nothing is lost and nothing is doubled.
do $g$
begin
  if md5((select prosrc from pg_proc where oid = 'public.os_tick(uuid)'::regprocedure)) not in ('7a6624041b1adf309f21f10e9ddb0afe', '580bfbdc14a845cdf758131ee10f4e90') then
    raise exception 'os_tick changed since this file was written. Rebuild it on the new definitions.';
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
        -- Slow finds (one per N actions) keep the leftover actions, so nothing is lost between checks.
        if spec ? 'every' then
          need := greatest(1, (spec->>'every')::integer);
          have := coalesce((p.skill->active->>'part')::integer, 0) + actions;
          qty := (have / need) * coalesce((spec->>'qty')::integer, 1);
          p.skill := jsonb_set(coalesce(p.skill,'{}'::jsonb), array[active,'part'], to_jsonb(have % need), true);
        end if;
        p.skill := jsonb_set(coalesce(p.skill,'{}'::jsonb), array[active,'xp'], to_jsonb(coalesce((p.skill->active->>'xp')::integer,0) + case when hold then 0 else xp end), true);
        if qty <= 0 then
          null;
        elsif hold then
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
