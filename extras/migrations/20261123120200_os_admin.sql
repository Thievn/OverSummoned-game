-- Owner-only books. Checks den_allow.is_admin or the existing den_owner app flag.
-- Writes the audit to den_admin_log. Reads den_waitlist. Does not touch shop_*, story_*, or creature_*.

create or replace function public.os_is_admin()
returns boolean language sql stable security definer set search_path to public as $$
  select
    coalesce(auth.jwt()->'app_metadata'->>'den_owner','') = 'true'
    or exists (
      select 1 from public.den_allow a
      where lower(a.email) = lower(coalesce(auth.jwt()->>'email',''))
        and a.is_admin
    );
$$;

create or replace function public.os_admin_audit(p_action text, p_target text, p_detail jsonb)
returns void language plpgsql security definer set search_path to public as $$
begin
  insert into public.den_admin_log(admin, action, target, detail)
  values (coalesce(auth.jwt()->>'email', 'owner'), p_action, p_target, coalesce(p_detail, '{}'::jsonb));
end $$;

create or replace function public.os_admin(op text, payload jsonb)
returns jsonb language plpgsql security definer set search_path to public as $$
declare
  days integer := greatest(1, least(90, coalesce((payload->>'days')::int, 14)));
  uid uuid;
  patch jsonb;
  result jsonb;
begin
  if auth.uid() is null or not public.os_is_admin() then
    raise exception 'not allowed';
  end if;

  if op = 'dash' then
    result := jsonb_build_object(
      'totals', jsonb_build_object(
        'players', (select count(*) from os_player),
        'waitlist', (select count(*) from den_waitlist),
        'delves', (select count(*) from os_event where kind = 'delve'),
        'cards', (select count(*) from os_event where kind = 'card'),
        'items', (select coalesce(sum(qty),0) from os_event where kind = 'item'),
        'volume', (select coalesce(sum(price * qty),0) from os_trade),
        'crews', (select count(*) from os_crew)
      ),
      'signups', coalesce((select jsonb_agg(jsonb_build_object('d', d::date, 'n', n) order by d) from (
        select date_trunc('day', created_at) d, count(*) n from den_waitlist
        where created_at > now() - make_interval(days => days) group by 1) s), '[]'::jsonb),
      'actives', coalesce((select jsonb_agg(jsonb_build_object('d', d::date, 'n', n) order by d) from (
        select date_trunc('day', seen_at) d, count(*) n from os_player
        where seen_at > now() - make_interval(days => days) group by 1) s), '[]'::jsonb),
      'delves', coalesce((select jsonb_agg(jsonb_build_object('d', d::date, 'n', n) order by d) from (
        select date_trunc('day', created_at) d, count(*) n from os_event
        where kind = 'delve' and created_at > now() - make_interval(days => days) group by 1) s), '[]'::jsonb),
      'items', coalesce((select jsonb_agg(jsonb_build_object('d', d::date, 'n', n) order by d) from (
        select date_trunc('day', created_at) d, coalesce(sum(qty),0) n from os_event
        where kind = 'item' and created_at > now() - make_interval(days => days) group by 1) s), '[]'::jsonb),
      'cards', coalesce((select jsonb_agg(jsonb_build_object('d', d::date, 'n', n) order by d) from (
        select date_trunc('day', created_at) d, count(*) n from os_event
        where kind = 'card' and created_at > now() - make_interval(days => days) group by 1) s), '[]'::jsonb),
      'volume', coalesce((select jsonb_agg(jsonb_build_object('d', d::date, 'n', n) order by d) from (
        select date_trunc('day', created_at) d, coalesce(sum(price * qty),0) n from os_trade
        where created_at > now() - make_interval(days => days) group by 1) s), '[]'::jsonb),
      'config', coalesce((select jsonb_object_agg(key, value) from os_config), '{}'::jsonb),
      'crier', coalesce((select jsonb_agg(jsonb_build_object('tag', coalesce(tag,'Streets'), 'msg', msg, 'at', at) order by id desc) from (select * from os_feed order by id desc limit 30) f), '[]'::jsonb),
      'listings', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'item', coalesce(item_id, hero_id, kind), 'qty', qty, 'price', price, 'seller', coalesce(seller::text, 'city'))) from os_listing), '[]'::jsonb),
      'crews', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'members', (select count(*) from os_crew_member m where m.crew_id = c.id), 'cup', c.cup)) from os_crew c), '[]'::jsonb),
      'audit', coalesce((select jsonb_agg(jsonb_build_object('at', at, 'admin', admin, 'action', action, 'target', target, 'detail', detail) order by id desc) from (select * from den_admin_log order by id desc limit 80) a), '[]'::jsonb),
      'users', coalesce((select jsonb_agg(jsonb_build_object('uid', p.uid, 'name', p.name, 'email', u.email, 'gold', p.gold, 'sigils', p.sigils, 'banned', p.banned, 'seen', p.seen_at)) from os_player p left join auth.users u on u.id = p.uid), '[]'::jsonb),
      'waitlist', coalesce((select jsonb_agg(jsonb_build_object('email', email, 'created_at', created_at) order by created_at desc) from den_waitlist), '[]'::jsonb)
    );
    return result;
  elsif op = 'users' then
    return jsonb_build_object('users', coalesce((
      select jsonb_agg(jsonb_build_object('uid', p.uid, 'name', p.name, 'email', u.email, 'gold', p.gold, 'sigils', p.sigils, 'vigor', p.vigor, 'daring', p.daring, 'banned', p.banned, 'seen', p.seen_at))
      from os_player p left join auth.users u on u.id = p.uid
      where coalesce(payload->>'q','') = ''
         or p.name ilike '%'||payload->>'q'||'%'
         or u.email ilike '%'||payload->>'q'||'%'
    ), '[]'::jsonb));
  elsif op = 'user' then
    uid := (payload->>'uid')::uuid;
    return jsonb_build_object('player', (
      select jsonb_build_object('uid', p.uid, 'name', p.name, 'email', u.email, 'gold', p.gold, 'sigils', p.sigils, 'vigor', p.vigor, 'daring', p.daring, 'banned', p.banned, 'skill', p.skill, 'stocks_until', p.stocks_until)
      from os_player p left join auth.users u on u.id = p.uid where p.uid = uid
    ));
  elsif op = 'set' then
    uid := (payload->>'uid')::uuid;
    patch := coalesce(payload->'patch', '{}'::jsonb);
    update os_player set
      gold = coalesce((patch->>'gold')::int, gold),
      sigils = coalesce((patch->>'sigils')::int, sigils),
      vigor = least(100, greatest(0, coalesce((patch->>'vigor')::int, vigor))),
      daring = least(25, greatest(0, coalesce((patch->>'daring')::int, daring))),
      banned = coalesce((patch->>'banned')::boolean, banned),
      ban_reason = coalesce(patch->>'ban_reason', ban_reason),
      stocks_until = case when patch ? 'stocks_minutes' then now() + make_interval(mins => greatest(0,(patch->>'stocks_minutes')::int)) else stocks_until end
    where uid = uid;
    if patch ? 'skill' and patch ? 'skill_xp' then
      update os_player set skill = jsonb_set(coalesce(skill,'{}'::jsonb), array[patch->>'skill','xp'], to_jsonb((patch->>'skill_xp')::int), true) where uid = uid;
    end if;
    if patch ? 'hero' and patch ? 'hero_level' then
      update os_hero set level = greatest(1, (patch->>'hero_level')::int) where uid = uid and hero_id = patch->>'hero';
    end if;
    perform public.os_admin_audit('set', uid::text, patch);
    return jsonb_build_object('ok', true);
  elsif op = 'config' then
    update os_config set value = coalesce(value,'{}'::jsonb) || coalesce(payload->'value','{}'::jsonb), updated_at = now() where key = 'game';
    if payload->'value' ? 'dropRates' then
      insert into os_config(key, value) values ('drop_rates', payload->'value'->'dropRates')
      on conflict (key) do update set value = excluded.value, updated_at = now();
    end if;
    perform public.os_admin_audit('config', 'game', payload->'value');
    return jsonb_build_object('ok', true);
  elsif op = 'crier' then
    if coalesce(payload->>'msg','') ~* '(new card|hero found|was summoned|pulled an |pulled a |unhinged card|slapton|marcellus)' then
      return jsonb_build_object('refused', true);
    end if;
    perform public.os_feed_post(payload->>'tag', payload->>'msg');
    perform public.os_admin_audit('crier', payload->>'tag', jsonb_build_object('msg', payload->>'msg'));
    return jsonb_build_object('ok', true);
  elsif op = 'market' then
    if payload->>'op' = 'remove' then
      delete from os_listing where id = (payload->>'id')::bigint;
      perform public.os_admin_audit('market-remove', payload->>'id', '{}'::jsonb);
    end if;
    return jsonb_build_object('listings', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'item', coalesce(item_id, hero_id, kind), 'qty', qty, 'price', price, 'seller', coalesce(seller::text,'city'))) from os_listing), '[]'::jsonb));
  elsif op = 'crews' then
    return jsonb_build_object('crews', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'members', (select count(*) from os_crew_member m where m.crew_id = c.id), 'cup', c.cup)) from os_crew c), '[]'::jsonb));
  elsif op = 'crew' then
    if payload->>'op' = 'disband' then
      delete from os_crew where id = (payload->>'id')::uuid;
      perform public.os_admin_audit('crew-disband', payload->>'id', '{}'::jsonb);
    elsif payload->>'op' = 'kick' then
      delete from os_crew_member where crew_id = (payload->>'id')::uuid and uid = (payload->>'uid')::uuid;
      perform public.os_admin_audit('crew-kick', payload->>'uid', payload);
    end if;
    return jsonb_build_object('ok', true);
  elsif op = 'audit' then
    return jsonb_build_object('audit', coalesce((select jsonb_agg(jsonb_build_object('at', at, 'admin', admin, 'action', action, 'target', target, 'detail', detail) order by id desc) from (select * from den_admin_log order by id desc limit 200) a), '[]'::jsonb));
  elsif op = 'waitlist' then
    return jsonb_build_object('waitlist', coalesce((select jsonb_agg(jsonb_build_object('email', email, 'created_at', created_at) order by created_at desc) from den_waitlist), '[]'::jsonb));
  end if;
  return jsonb_build_object('ok', false);
end $$;

revoke all on function public.os_is_admin() from public, anon;
revoke all on function public.os_admin_audit(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.os_is_admin() to authenticated;
grant execute on function public.os_admin(text, jsonb) to authenticated;
