-- Using up the last of something (selling all of it, or a craft that takes the last ingredient) empties the slot
-- instead of tripping the rule that a bag slot always holds at least one.
do $g$ begin
  if (select md5(prosrc) from pg_proc where proname = 'os_give' and pronamespace = 'public'::regnamespace) not in ('f250ad14dcb3e5411583e3cd23217cdb') then
    if not exists(select 1 from os_config where key = 'give_last') then raise exception 'os_give changed since this file was written.'; end if;
  end if;
end $g$;
create or replace function public.os_give(p_uid uuid, p_item text, p_qty integer)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  if p_qty is null or p_qty = 0 or p_item is null then return; end if;
  if p_qty > 0 and exists(select 1 from os_item_def where id = p_item and owner_uid is not null and owner_uid is distinct from p_uid) then return; end if;
  if p_item = 'summon_sigil' then
    update os_player set sigils = sigils + p_qty where uid = p_uid;
    return;
  end if;
  if p_qty > 0 then
    insert into os_bag(uid, item_id, qty) values (p_uid, p_item, p_qty)
    on conflict (uid, item_id) do update set qty = os_bag.qty + excluded.qty;
  else
    delete from os_bag where uid = p_uid and item_id = p_item and qty + p_qty <= 0;
    update os_bag set qty = qty + p_qty where uid = p_uid and item_id = p_item;
  end if;
end $function$;
insert into os_config(key, value) values ('give_last', jsonb_build_object('at', now())) on conflict (key) do nothing;
