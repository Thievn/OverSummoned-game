-- Where visits come from (country, city, the city's coordinates rounded to 0.1 degree; never an IP address),
-- the owner's map query, and removing an email from the wishlist.
-- Applied 25 Nov.

alter table public.os2_hit
  add column if not exists country text,
  add column if not exists region  text,
  add column if not exists city    text,
  add column if not exists lat     real,
  add column if not exists lon     real;

create or replace function public.os2_track_geo(p_path text, p_ref text, p_sid text,
  p_country text default null, p_region text default null, p_city text default null,
  p_lat real default null, p_lon real default null) returns void
language plpgsql security definer set search_path to 'public' as $$
declare c text := upper(left(coalesce(p_country, ''), 2));
begin
  if length(coalesce(p_path,'')) between 1 and 80
     and (select count(*) from os2_hit where sid = left(p_sid,40) and created_at > now() - interval '1 minute') < 30 then
    insert into os2_hit(path, ref, sid, uid, country, region, city, lat, lon)
    values (left(p_path,80), nullif(left(coalesce(p_ref,''),120),''), left(p_sid,40), auth.uid(),
      case when c ~ '^[A-Z]{2}$' then c end,
      nullif(left(coalesce(p_region,''),12),''),
      nullif(left(coalesce(p_city,''),80),''),
      case when p_lat between -90 and 90 then round(p_lat::numeric, 1)::real end,
      case when p_lon between -180 and 180 then round(p_lon::numeric, 1)::real end);
  end if;
end $$;
grant execute on function public.os2_track_geo(text,text,text,text,text,text,real,real) to anon, authenticated;

create or replace function public.os2_admin_geo(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path to 'public' as $$
declare since date := (now() at time zone 'utc')::date - least(365, greatest(1, coalesce(p_days, 30)));
begin
  if not public.os2_is_admin() then raise exception 'not allowed'; end if;
  return jsonb_build_object(
    'days', least(365, greatest(1, coalesce(p_days, 30))),
    'located', (select count(distinct sid) from os2_hit where day > since and country is not null),
    'unknown', (select count(distinct sid) from os2_hit where day > since and country is null),
    'places', coalesce((select jsonb_agg(p order by (p->>'visitors')::int desc) from (
        select jsonb_build_object('country', country, 'city', city, 'lat', lat, 'lon', lon,
          'visitors', count(distinct sid), 'views', count(*), 'last', max(created_at)) p
        from os2_hit where day > since and country is not null and lat is not null and lon is not null
        group by country, city, lat, lon order by count(distinct sid) desc limit 400) q), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(p order by (p->>'visitors')::int desc) from (
        select jsonb_build_object('country', country, 'visitors', count(distinct sid), 'views', count(*)) p
        from os2_hit where day > since and country is not null group by country) q), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(p) from (
        select jsonb_build_object('country', country, 'city', city, 'lat', lat, 'lon', lon, 'path', path, 'at', created_at) p
        from os2_hit where country is not null order by created_at desc limit 30) q), '[]'::jsonb));
end $$;
revoke all on function public.os2_admin_geo(int) from public, anon;
grant execute on function public.os2_admin_geo(int) to authenticated;

-- os2_admin_beta gains one op, 'wait_delete': see the full function in the migration applied with this file.
