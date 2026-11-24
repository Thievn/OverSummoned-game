create or replace function public.os_claim()
returns jsonb language plpgsql security definer set search_path to public as $$
declare
  u uuid := auth.uid(); d os_delve; mult numeric; n int; i int; r numeric; rar text; it text;
  loot jsonb := '{}'::jsonb; g int; hid text; isnew boolean; hres jsonb := null;
  tiers text[] := array['unhinged','absurd','legendary','epic','rare','uncommon','common']; k int;
  rates jsonb; hc numeric;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select * into d from os_delve where uid = u;
  if not found then raise exception 'nothing to claim'; end if;
  if now() < d.ends_at then raise exception 'not done'; end if;
  select value into rates from os_config where key = 'drop_rates';
  mult := 1 + (d.floor - 1) * 0.08;
  if d.choice = 'kick' then mult := mult * 1.15; elsif d.choice = 'shield' then mult := mult * 0.95; end if;
  n := greatest(2, d.minutes / 4 + 1) + (coalesce(array_length(d.party,1),1) - 1);
  for i in 1..n loop
    r := random();
    if rates is null then
      rar := case
        when r < 0.003 * mult then 'unhinged'
        when r < 0.010 * mult then 'absurd'
        when r < 0.030 * mult then 'legendary'
        when r < 0.080 * mult then 'epic'
        when r < 0.200 * mult then 'rare'
        when r < 0.450 then 'uncommon'
        else 'common' end;
    else
      declare
        w_common numeric := coalesce((rates->>'common')::numeric, 50);
        w_uncommon numeric := coalesce((rates->>'uncommon')::numeric, 25);
        w_rare numeric := coalesce((rates->>'rare')::numeric, 14);
        w_epic numeric := coalesce((rates->>'epic')::numeric, 7);
        w_legendary numeric := coalesce((rates->>'legendary')::numeric, 3);
        w_absurd numeric := coalesce((rates->>'absurd')::numeric, 0.8) * mult;
        w_unhinged numeric := coalesce((rates->>'unhinged')::numeric, 0.2) * mult;
        w_tot numeric;
      begin
        w_tot := w_common + w_uncommon + w_rare + w_epic + w_legendary + w_absurd + w_unhinged;
        r := r * w_tot;
        rar := case
          when r < w_unhinged then 'unhinged'
          when r < w_unhinged + w_absurd then 'absurd'
          when r < w_unhinged + w_absurd + w_legendary then 'legendary'
          when r < w_unhinged + w_absurd + w_legendary + w_epic then 'epic'
          when r < w_unhinged + w_absurd + w_legendary + w_epic + w_rare then 'rare'
          when r < w_unhinged + w_absurd + w_legendary + w_epic + w_rare + w_uncommon then 'uncommon'
          else 'common' end;
      end;
    end if;
    it := null;
    for k in array_position(tiers, rar)..7 loop
      select id into it from os_item_def where rarity = tiers[k] and in_pool order by random() limit 1;
      exit when it is not null;
    end loop;
    if it is not null then
      loot := jsonb_set(loot, array[it], to_jsonb(coalesce((loot->>it)::int,0) + 1));
      insert into os_bag(uid, item_id, qty) values (u, it, 1) on conflict (uid, item_id) do update set qty = os_bag.qty + 1;
      insert into os_event(uid, kind, qty, ref) values (u, 'item', 1, it);
    end if;
  end loop;
  g := ((d.minutes * d.floor * 2) + floor(random() * (d.minutes + 5)))::int;
  update os_player set gold = gold + g, deepest = case when d.floor = deepest and d.minutes >= 15 then deepest + 1 else deepest end where uid = u;
  select coalesce((value->>d.minutes::text)::numeric, 0.02) into hc from os_config where key = 'hero_chance';
  hc := coalesce(hc, 0.02);
  if random() < hc * (1 + d.floor * 0.05) then
    select id into hid from os_hero_def order by random() limit 1;
    if hid is not null then
      isnew := os_grant_hero(u, hid);
      hres := jsonb_build_object('id', hid, 'new', isnew);
    end if;
  end if;
  perform os_feed_post('Streets', 'A party came up from floor ' || d.floor || ' with a heavy pack.');
  delete from os_delve where uid = u;
  return jsonb_build_object('gold', g, 'loot', loot, 'hero', hres, 'floor', d.floor, 'minutes', d.minutes);
end $$;

