create or replace function public.os_sell(i text, q integer)
returns integer language plpgsql security definer set search_path to public as $$
declare u uuid := auth.uid(); have int; r text; v int; fee numeric; price int;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select qty into have from os_bag where uid = u and item_id = i;
  if have is null or q < 1 then raise exception 'nothing to sell'; end if;
  q := least(q, have);
  select rarity into r from os_item_def where id = i;
  select price into price from os_listing where item_id = i and kind = 'item' order by id limit 1;
  v := coalesce(price, os_sellval(r)) * q;
  select coalesce((value->>'marketFee')::numeric, 0) into fee from os_config where key = 'game';
  v := greatest(1, v - round(v * coalesce(fee, 0))::int);
  if have - q <= 0 then delete from os_bag where uid = u and item_id = i; else update os_bag set qty = qty - q where uid = u and item_id = i; end if;
  update os_player set gold = gold + v where uid = u;
  insert into os_trade(item_id, price, qty) values (i, coalesce(price, os_sellval(r)), q);
  insert into os_event(uid, kind, qty, ref) values (u, 'trade', v, i);
  return v;
end $$;

