-- Puts back the old os_give (update, then delete). Not recommended: the old one fails when the last of an item is used.
CREATE OR REPLACE FUNCTION public.os_give(p_uid uuid, p_item text, p_qty integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    update os_bag set qty = qty + p_qty where uid = p_uid and item_id = p_item;
    delete from os_bag where uid = p_uid and item_id = p_item and qty <= 0;
  end if;
end $function$;

delete from os_config where key = 'give_last';
