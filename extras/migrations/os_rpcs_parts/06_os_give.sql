create or replace function public.os_give(p_uid uuid, p_item text, p_qty integer)
returns void language plpgsql security definer set search_path to public as $$
begin
  if p_qty is null or p_qty = 0 or p_item is null then return; end if;
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
end $$;

