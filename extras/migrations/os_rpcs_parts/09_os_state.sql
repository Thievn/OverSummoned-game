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

