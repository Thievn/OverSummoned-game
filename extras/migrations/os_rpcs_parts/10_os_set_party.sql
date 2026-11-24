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

