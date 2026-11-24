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

