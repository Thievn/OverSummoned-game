-- Owner-only numbers for the admin panel. Every function checks os2_is_admin() first.
create or replace function public.os2_admin_stats() returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare out jsonb;
begin
  if not public.os2_is_admin() then raise exception 'not allowed'; end if;
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'accounts', (select count(*) from auth.users),
      'players', (select count(*) from os2_profile),
      'views_today', (select count(*) from os2_hit where day = (now() at time zone 'utc')::date),
      'visitors_today', (select count(distinct sid) from os2_hit where day = (now() at time zone 'utc')::date),
      'views_7d', (select count(*) from os2_hit where day > (now() at time zone 'utc')::date - 7),
      'visitors_7d', (select count(distinct sid) from os2_hit where day > (now() at time zone 'utc')::date - 7),
      'active_24h', (select count(*) from os2_save where updated_at > now() - interval '24 hours'),
      'summons', (select coalesce(sum(summons),0) from os2_save),
      'gold', (select coalesce(sum(gold),0) from os2_save),
      'ink', (select coalesce(sum(ink),0) from os2_save)),
    'days', (select jsonb_agg(jsonb_build_object('d', d::date,
        'views', (select count(*) from os2_hit h where h.day = d::date),
        'visitors', (select count(distinct sid) from os2_hit h where h.day = d::date),
        'signups', (select count(*) from auth.users u where (u.created_at at time zone 'utc')::date = d::date),
        'summons', (select count(*) from os2_event e where e.kind = 'summon' and (e.created_at at time zone 'utc')::date = d::date),
        'active', (select count(distinct uid) from os2_event e where (e.created_at at time zone 'utc')::date = d::date)) order by d)
      from generate_series((now() at time zone 'utc')::date - 29, (now() at time zone 'utc')::date, interval '1 day') d),
    'paths', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select path k, count(*) n from os2_hit where day > (now() at time zone 'utc')::date - 7 group by 1 order by 2 desc limit 8) x),
    'refs', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select coalesce(ref, 'direct') k, count(*) n from os2_hit where day > (now() at time zone 'utc')::date - 7 group by 1 order by 2 desc limit 8) x),
    'events', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select kind k, count(*) n from os2_event where created_at > now() - interval '7 days' group by 1 order by 2 desc) x),
    'owned', (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb) from (select key k, count(*) n from os2_save s, jsonb_object_keys(coalesce(s.data->'roster', '{}'::jsonb)) key group by 1) x),
    'players', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select p.username, u.email, p.created_at, s.updated_at, s.total_level, s.heroes, s.gold, s.ink, s.summons, p.steam_id is not null steam
        from os2_profile p join auth.users u on u.id = p.id left join os2_save s on s.user_id = p.id order by s.updated_at desc nulls last limit 200) x)
  ) into out;
  return out;
end $$;
revoke execute on function public.os2_admin_stats() from anon, public;
grant execute on function public.os2_admin_stats() to authenticated;
