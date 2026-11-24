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

