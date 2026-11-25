-- OverSummoned: the server keeps the ledger. Saves go through os2_save_put, which refuses anything that could not
-- have been earned in the time that passed; everything that moves between players changes the server's copy directly.
create table if not exists public.os2_item (id text primary key, kind text not null, rarity text not null);
alter table public.os2_item enable row level security;
delete from public.os2_item; insert into public.os2_item (id, kind, rarity) values ('kevin_weapon','gear','uncommon'),('kevin_armor','gear','uncommon'),('kevin_trinket','gear','uncommon'),('marco_weapon','gear','uncommon'),('marco_armor','gear','uncommon'),('marco_trinket','gear','uncommon'),('maya_weapon','gear','uncommon'),('maya_armor','gear','uncommon'),('maya_trinket','gear','uncommon'),('brokk_weapon','gear','uncommon'),('brokk_armor','gear','uncommon'),('brokk_trinket','gear','uncommon'),('gaius_weapon','gear','rare'),('gaius_armor','gear','rare'),('gaius_trinket','gear','rare'),('edith_weapon','gear','rare'),('edith_armor','gear','rare'),('edith_trinket','gear','rare'),('albrecht_weapon','gear','rare'),('albrecht_armor','gear','rare'),('albrecht_trinket','gear','rare'),('vincenzo_weapon','gear','epic'),('vincenzo_armor','gear','epic'),('vincenzo_trinket','gear','epic'),('slapton_weapon','gear','legendary'),('slapton_armor','gear','legendary'),('slapton_trinket','gear','legendary'),('napoleon_weapon','gear','epic'),('napoleon_armor','gear','epic'),('napoleon_trinket','gear','epic'),('cleocatra_weapon','gear','legendary'),('cleocatra_armor','gear','legendary'),('cleocatra_trinket','gear','legendary'),('blackbear_weapon','gear','epic'),('blackbear_armor','gear','epic'),('blackbear_trinket','gear','epic'),('astrid_weapon','gear','rare'),('astrid_armor','gear','rare'),('astrid_trinket','gear','rare'),('kenji_weapon','gear','rare'),('kenji_armor','gear','rare'),('kenji_trinket','gear','rare'),('emu_weapon','gear','absurd'),('emu_armor','gear','absurd'),('emu_trinket','gear','absurd'),('troffea_weapon','gear','uncommon'),('troffea_armor','gear','uncommon'),('troffea_trinket','gear','uncommon'),('joost_weapon','gear','uncommon'),('joost_armor','gear','uncommon'),('joost_trinket','gear','uncommon'),('chad_weapon','gear','uncommon'),('chad_armor','gear','uncommon'),('chad_trinket','gear','uncommon'),('bella_weapon','gear','rare'),('bella_armor','gear','rare'),('bella_trinket','gear','rare'),('florida_weapon','gear','absurd'),('florida_armor','gear','absurd'),('florida_trinket','gear','absurd'),('lola_weapon','gear','epic'),('lola_armor','gear','epic'),('lola_trinket','gear','epic'),('morwenna_weapon','gear','rare'),('morwenna_armor','gear','rare'),('morwenna_trinket','gear','rare'),('sable_weapon','gear','rare'),('sable_armor','gear','rare'),('sable_trinket','gear','rare'),('jacko_weapon','gear','uncommon'),('jacko_armor','gear','uncommon'),('jacko_trinket','gear','uncommon'),('raspawtin_weapon','gear','unhinged'),('raspawtin_armor','gear','unhinged'),('raspawtin_trinket','gear','unhinged'),('madjack_weapon','gear','unhinged'),('madjack_armor','gear','unhinged'),('madjack_trinket','gear','unhinged'),('e_kevin_weapon','gear','common'),('e_kevin_head','gear','uncommon'),('e_kevin_body','gear','rare'),('e_kevin_feet','gear','common'),('e_kevin_charm','gear','epic'),('e_marco_weapon','gear','common'),('e_marco_head','gear','uncommon'),('e_marco_body','gear','common'),('e_marco_feet','gear','rare'),('e_marco_charm','gear','epic'),('e_maya_weapon','gear','rare'),('e_maya_head','gear','uncommon'),('e_maya_body','gear','rare'),('e_maya_feet','gear','common'),('e_maya_charm','gear','legendary'),('e_brokk_weapon','gear','common'),('e_brokk_head','gear','rare'),('e_brokk_body','gear','uncommon'),('e_brokk_feet','gear','common'),('e_brokk_charm','gear','epic'),('e_gaius_weapon','gear','uncommon'),('e_gaius_head','gear','rare'),('e_gaius_body','gear','epic'),('e_gaius_feet','gear','common'),('e_gaius_charm','gear','legendary'),('e_edith_weapon','gear','common'),('e_edith_head','gear','uncommon'),('e_edith_body','gear','common'),('e_edith_feet','gear','uncommon'),('e_edith_charm','gear','absurd'),('e_albrecht_weapon','gear','common'),('e_albrecht_head','gear','rare'),('e_albrecht_body','gear','uncommon'),('e_albrecht_feet','gear','common'),('e_albrecht_charm','gear','epic'),('e_vincenzo_weapon','gear','uncommon'),('e_vincenzo_head','gear','common'),('e_vincenzo_body','gear','rare'),('e_vincenzo_feet','gear','uncommon'),('e_vincenzo_charm','gear','legendary'),('e_slapton_weapon','gear','uncommon'),('e_slapton_head','gear','rare'),('e_slapton_body','gear','epic'),('e_slapton_feet','gear','common'),('e_slapton_charm','gear','absurd'),('e_napoleon_weapon','gear','epic'),('e_napoleon_head','gear','rare'),('e_napoleon_body','gear','uncommon'),('e_napoleon_feet','gear','rare'),('e_napoleon_charm','gear','legendary'),('e_cleocatra_weapon','gear','rare'),('e_cleocatra_head','gear','epic'),('e_cleocatra_body','gear','uncommon'),('e_cleocatra_feet','gear','common'),('e_cleocatra_charm','gear','absurd'),('e_blackbear_weapon','gear','uncommon'),('e_blackbear_head','gear','rare'),('e_blackbear_body','gear','common'),('e_blackbear_feet','gear','uncommon'),('e_blackbear_charm','gear','legendary'),('e_astrid_weapon','gear','common'),('e_astrid_head','gear','rare'),('e_astrid_body','gear','epic'),('e_astrid_feet','gear','uncommon'),('e_astrid_charm','gear','absurd'),('e_kenji_weapon','gear','common'),('e_kenji_head','gear','uncommon'),('e_kenji_body','gear','common'),('e_kenji_feet','gear','common'),('e_kenji_charm','gear','legendary'),('e_emu_weapon','gear','uncommon'),('e_emu_head','gear','common'),('e_emu_body','gear','rare'),('e_emu_feet','gear','epic'),('e_emu_charm','gear','unhinged'),('e_troffea_weapon','gear','common'),('e_troffea_head','gear','common'),('e_troffea_body','gear','uncommon'),('e_troffea_feet','gear','epic'),('e_troffea_charm','gear','absurd'),('e_joost_weapon','gear','common'),('e_joost_head','gear','uncommon'),('e_joost_body','gear','rare'),('e_joost_feet','gear','common'),('e_joost_charm','gear','legendary'),('e_chad_weapon','gear','common'),('e_chad_head','gear','rare'),('e_chad_body','gear','uncommon'),('e_chad_feet','gear','epic'),('e_chad_charm','gear','unhinged'),('e_bella_weapon','gear','uncommon'),('e_bella_head','gear','common'),('e_bella_body','gear','rare'),('e_bella_feet','gear','uncommon'),('e_bella_charm','gear','legendary'),('e_florida_weapon','gear','common'),('e_florida_head','gear','rare'),('e_florida_body','gear','common'),('e_florida_feet','gear','uncommon'),('e_florida_charm','gear','unhinged'),('e_lola_weapon','gear','rare'),('e_lola_head','gear','epic'),('e_lola_body','gear','uncommon'),('e_lola_feet','gear','rare'),('e_lola_charm','gear','common'),('e_morwenna_weapon','gear','uncommon'),('e_morwenna_head','gear','rare'),('e_morwenna_body','gear','epic'),('e_morwenna_feet','gear','common'),('e_morwenna_charm','gear','absurd'),('e_sable_weapon','gear','common'),('e_sable_head','gear','uncommon'),('e_sable_body','gear','rare'),('e_sable_feet','gear','epic'),('e_sable_charm','gear','legendary'),('e_jacko_weapon','gear','uncommon'),('e_jacko_head','gear','common'),('e_jacko_body','gear','common'),('e_jacko_feet','gear','rare'),('e_jacko_charm','gear','epic'),('e_raspawtin_weapon','gear','rare'),('e_raspawtin_head','gear','uncommon'),('e_raspawtin_body','gear','epic'),('e_raspawtin_feet','gear','common'),('e_raspawtin_charm','gear','unhinged'),('e_madjack_weapon','gear','epic'),('e_madjack_head','gear','uncommon'),('e_madjack_body','gear','rare'),('e_madjack_feet','gear','common'),('e_madjack_charm','gear','unhinged'),('bath_carp','loot','common'),('bath_eel','loot','common'),('bath_coin','loot','common'),('bath_scroll','loot','common'),('bath_strigil','loot','uncommon'),('bath_lamp','loot','uncommon'),('bath_vial','loot','rare'),('bath_wreath','loot','rare'),('bath_nose','loot','epic'),('j_dock_1','loot','common'),('j_dock_2','loot','common'),('j_dock_3','loot','common'),('j_dock_4','loot','common'),('j_dock_5','loot','common'),('j_dock_6','loot','common'),('j_dock_7','loot','rare'),('j_rift_1','loot','common'),('j_rift_2','loot','common'),('j_rift_3','loot','common'),('j_rift_4','loot','uncommon'),('j_rift_5','loot','uncommon'),('j_rift_6','loot','common'),('j_rift_7','loot','rare'),('bondi_1','loot','common'),('bondi_2','loot','common'),('bondi_3','loot','common'),('bondi_4','loot','common'),('bondi_5','loot','uncommon'),('bondi_6','loot','uncommon'),('bondi_7','loot','rare'),('bondi_8','loot','epic'),('j_bondi_1','loot','common'),('j_bondi_2','loot','common'),('j_bondi_3','loot','common'),('j_bondi_4','loot','common'),('j_bondi_5','loot','common'),('j_bondi_6','loot','uncommon'),('j_bondi_7','loot','uncommon'),('fjord_1','loot','common'),('fjord_2','loot','common'),('fjord_3','loot','common'),('fjord_4','loot','uncommon'),('fjord_5','loot','uncommon'),('fjord_6','loot','rare'),('fjord_7','loot','rare'),('fjord_8','loot','epic'),('j_fjord_1','loot','common'),('j_fjord_2','loot','common'),('j_fjord_3','loot','common'),('j_fjord_4','loot','common'),('j_fjord_5','loot','common'),('j_fjord_6','loot','common'),('j_fjord_7','loot','rare'),('easy_chips','loot','common'),('easy_moonshine','loot','common'),('easy_bills','loot','common'),('easy_envelope','loot','common'),('easy_knuckles','loot','uncommon'),('easy_fedora','loot','uncommon'),('easy_watch','loot','rare'),('easy_pearls','loot','rare'),('easy_ring','loot','epic'),('j_speakeasy_1','loot','common'),('j_speakeasy_2','loot','common'),('j_speakeasy_3','loot','common'),('j_speakeasy_4','loot','common'),('j_speakeasy_5','loot','common'),('j_speakeasy_6','loot','common'),('j_speakeasy_7','loot','rare'),('vault_1','loot','common'),('vault_2','loot','common'),('vault_3','loot','common'),('vault_4','loot','common'),('vault_5','loot','uncommon'),('vault_6','loot','uncommon'),('vault_7','loot','rare'),('vault_8','loot','epic'),('j_vault_1','loot','common'),('j_vault_2','loot','common'),('j_vault_3','loot','common'),('j_vault_4','loot','common'),('j_vault_5','loot','common'),('j_vault_6','loot','common'),('j_vault_7','loot','rare'),('closet_1','loot','common'),('closet_2','loot','common'),('closet_3','loot','common'),('closet_4','loot','common'),('closet_5','loot','uncommon'),('closet_6','loot','uncommon'),('closet_7','loot','rare'),('closet_8','loot','epic'),('j_closet_1','loot','common'),('j_closet_2','loot','common'),('j_closet_3','loot','common'),('j_closet_4','loot','common'),('j_closet_5','loot','common'),('j_closet_6','loot','common'),('j_closet_7','loot','rare'),('outback_1','loot','common'),('outback_2','loot','common'),('outback_3','loot','common'),('outback_4','loot','common'),('outback_5','loot','uncommon'),('outback_6','loot','uncommon'),('outback_7','loot','rare'),('outback_8','loot','epic'),('j_outback_1','loot','common'),('j_outback_2','loot','common'),('j_outback_3','loot','common'),('j_outback_4','loot','common'),('j_outback_5','loot','common'),('j_outback_6','loot','common'),('j_outback_7','loot','rare'),('blackforest_1','loot','common'),('blackforest_2','loot','common'),('blackforest_3','loot','common'),('blackforest_4','loot','common'),('blackforest_5','loot','uncommon'),('blackforest_6','loot','uncommon'),('blackforest_7','loot','rare'),('blackforest_8','loot','epic'),('j_blackforest_1','loot','common'),('j_blackforest_2','loot','common'),('j_blackforest_3','loot','common'),('j_blackforest_4','loot','common'),('j_blackforest_5','loot','common'),('j_blackforest_6','loot','common'),('j_blackforest_7','loot','rare'),('x_crate','crate','rare'),('x_tonic_speed','tonic','uncommon'),('x_tonic_luck','tonic','uncommon'),('x_tonic_xp','tonic','uncommon'),('x_shard','loot','uncommon'),('kevin','hero','common'),('marco','hero','common'),('maya','hero','uncommon'),('brokk','hero','uncommon'),('gaius','hero','rare'),('edith','hero','rare'),('albrecht','hero','rare'),('vincenzo','hero','epic'),('slapton','hero','legendary'),('napoleon','hero','epic'),('cleocatra','hero','legendary'),('blackbear','hero','epic'),('astrid','hero','rare'),('kenji','hero','rare'),('emu','hero','absurd'),('troffea','hero','uncommon'),('joost','hero','uncommon'),('chad','hero','common'),('bella','hero','rare'),('florida','hero','absurd'),('lola','hero','epic'),('morwenna','hero','rare'),('sable','hero','rare'),('jacko','hero','uncommon'),('raspawtin','hero','unhinged'),('madjack','hero','unhinged');
alter table public.os2_save add column if not exists rev bigint not null default 0, add column if not exists budget jsonb, add column if not exists checked_at timestamptz;
create table if not exists public.os2_flag (id bigserial primary key, user_id uuid not null, why text not null, detail jsonb, created_at timestamptz not null default now());
alter table public.os2_flag enable row level security;
create table if not exists public.os2_guild_claim (user_id uuid not null references auth.users on delete cascade, week int not null, primary key (user_id, week));
alter table public.os2_guild_claim enable row level security;
-- players may read their own save; only the functions below may write it
drop policy if exists os2_save_own on public.os2_save;
drop policy if exists os2_save_read on public.os2_save;
create policy os2_save_read on public.os2_save for select using (user_id = auth.uid() and public.os2_allowed());
revoke insert, update, delete on public.os2_save from authenticated, anon;

create or replace function public.os2_n(j jsonb, k text) returns numeric language plpgsql immutable as $$
begin return coalesce((j->>k)::numeric, 0); exception when others then return 0; end $$;
create or replace function public.os2_o(j jsonb) returns jsonb language sql immutable as $$ select case when jsonb_typeof(j) = 'object' then j else '{}'::jsonb end $$;
create or replace function public.os2_lvl(x numeric) returns int language sql immutable as $$
  select 1 + (select count(*) from unnest(array[0,83,174,276,388,512,650,801,969,1154,1358,1584,1833,2107,2411,2746,3115,3523,3973,4470,5018,5624,6291,7028,7842,8740,9730,10824,12031,13363,14833,16456,18247,20224,22406,24815,27473,30408,33648,37224,41171,45529,50339,55649,61512,67983,75127,83014,91721,101333,111945,123660,136594,150872,166636,184040,203254,224466,247886,273742,302288,333804,368599,407015,449428,496254,547953,605032,668051,737627,814445,899257,992895,1096278,1210421,1336443,1475581,1629200,1798808,1986068,2192818,2421087,2673114,2951373,3258594,3597792,3972294,4385776,4842295,5346332,5902831,6517253,7195629,7944614,8771558,9684577,10692629,11805606,13034431]::numeric[]) with ordinality t(v, i) where i between 2 and 99 and x >= v)::int $$;
-- everything a ledger holds, wherever it is kept: bag, worn gear, signature gear, cabinet
create or replace function public.os2_hold(d jsonb) returns table (id text, n numeric) language sql immutable as $$
  select q.id, sum(q.n) from (
    select b.key id, public.os2_n(public.os2_o(d->'bag'), b.key) n from jsonb_each(public.os2_o(d->'bag')) b
    union all select v.value #>> '{}', 1 from jsonb_each(public.os2_o(d->'gear')) h, jsonb_each(public.os2_o(h.value)) v where jsonb_typeof(v.value) = 'string'
    union all select e.value #>> '{}', 1 from jsonb_each(public.os2_o(d->'equip')) h, jsonb_array_elements(case when jsonb_typeof(h.value) = 'array' then h.value else '[]'::jsonb end) e where jsonb_typeof(e.value) = 'string'
    union all select c.key, 1 from jsonb_each(public.os2_o(d->'cabinet')) c) q group by q.id $$;

create or replace function public.os2_save_put(p_data jsonb, p_rev bigint) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); r os2_save; old jsonb := '{}'::jsonb; bud jsonb; el numeric := 0; isnew boolean := false; bad text; k text; d numeric; b numeric; nb jsonb := '{}'::jsonb; g uuid; hauls numeric;
  -- what can be earned per second, and how much can arrive in one burst (a crate, a raid, a bench job)
  lim constant jsonb := '{"xp":[250,60000],"ink":[400,150000],"gold":[60,6000],"items":[1.5,150],"rare":[0.1,6],"top":[0.004,1],"roster":[0.15,8],"tophero":[0.004,1],"hauls":[1.25,200]}';
  dl jsonb;
begin
  if jsonb_typeof(p_data) <> 'object' or length(p_data::text) > 400000 then return jsonb_build_object('ok', false, 'why', 'size'); end if;
  select * into r from os2_save where user_id = me for update;
  if not found then isnew := true;
  else
    if r.rev <> coalesce(p_rev, -1) then return jsonb_build_object('ok', false, 'why', 'stale', 'data', r.data, 'rev', r.rev); end if;
    old := r.data; bud := r.budget; el := least(greatest(extract(epoch from now() - coalesce(r.checked_at, r.updated_at)), 0), 43200);
  end if;
  if isnew then old := jsonb_build_object('ink', 3400, 'roster', jsonb_build_object('kevin', 1)); end if;
  if exists (select 1 from jsonb_each(public.os2_o(p_data->'bag')) x where public.os2_n(public.os2_o(p_data->'bag'), x.key) < 0) then bad := 'negative'; end if;
  if bad is null and exists (select 1 from public.os2_hold(p_data) h left join os2_item i on i.id = h.id and i.kind <> 'hero' where h.n > 0 and i.id is null) then bad := 'unknown item'; end if;
  if bad is null and exists (select 1 from jsonb_each(public.os2_o(p_data->'roster')) x left join os2_item i on i.id = x.key and i.kind = 'hero' where i.id is null) then bad := 'unknown hero'; end if;
  if bad is null and exists (select 1 from jsonb_each(public.os2_o(p_data->'rebirth')) x where public.os2_n(public.os2_o(p_data->'rebirth'), x.key) > public.os2_n(public.os2_o(old->'rebirth'), x.key)
      and (public.os2_n(public.os2_o(p_data->'rebirth'), x.key) > public.os2_n(public.os2_o(old->'rebirth'), x.key) + 1 or public.os2_n(public.os2_o(old->'xp'), x.key) < 13034431)) then bad := 'rebirth'; end if;
  select jsonb_build_object(
    'xp', (select coalesce(sum(greatest(public.os2_n(public.os2_o(p_data->'xp'), x.key) - public.os2_n(public.os2_o(old->'xp'), x.key), 0)), 0) from jsonb_each(public.os2_o(p_data->'xp')) x),
    'ink', greatest(public.os2_n(p_data, 'ink') - public.os2_n(old, 'ink'), 0), 'gold', greatest(public.os2_n(p_data, 'gold') - public.os2_n(old, 'gold'), 0),
    'hauls', greatest(public.os2_n(p_data, 'actions') - public.os2_n(old, 'actions'), 0),
    'items', coalesce(sum(x.d), 0), 'rare', coalesce(sum(x.d) filter (where x.rarity in ('legendary', 'absurd', 'unhinged')), 0), 'top', coalesce(sum(x.d) filter (where x.rarity = 'unhinged'), 0))
  into dl from (select greatest(n.n - coalesce(o.n, 0), 0) d, i.rarity from public.os2_hold(p_data) n left join public.os2_hold(old) o on o.id = n.id left join os2_item i on i.id = n.id) x;
  select dl || jsonb_build_object('roster', coalesce(sum(x.d), 0), 'tophero', coalesce(sum(x.d) filter (where x.rarity in ('legendary', 'absurd', 'unhinged')), 0)) into dl
  from (select greatest(public.os2_n(public.os2_o(p_data->'roster'), y.key) - public.os2_n(public.os2_o(old->'roster'), y.key), 0) d, i.rarity from jsonb_each(public.os2_o(p_data->'roster')) y left join os2_item i on i.id = y.key) x;
  for k in select jsonb_object_keys(lim) loop
    d := public.os2_n(dl, k); b := least((lim->k->>1)::numeric + 43200 * (lim->k->>0)::numeric, coalesce((bud->>k)::numeric, (lim->k->>1)::numeric) + el * (lim->k->>0)::numeric) - d;
    if b < 0 and bad is null then bad := k; end if; nb := nb || jsonb_build_object(k, round(b, 3));
  end loop;
  if bad is not null then
    insert into os2_flag (user_id, why, detail) values (me, bad, jsonb_build_object('delta', dl, 'budget', bud, 'seconds', el));
    return jsonb_build_object('ok', false, 'why', 'limit', 'what', bad, 'data', case when isnew then null else r.data end, 'rev', case when isnew then 0 else r.rev end);
  end if;
  insert into os2_save (user_id, data, heroes, total_level, gold, ink, summons, updated_at, rev, budget, checked_at)
  values (me, p_data, (select count(*) from jsonb_object_keys(public.os2_o(p_data->'roster'))), (select coalesce(sum(public.os2_lvl(public.os2_n(public.os2_o(p_data->'xp'), s))), 4) from unnest(array['Summoning','Fishing','Lockpicking','Digging']) s),
    floor(public.os2_n(p_data, 'gold')), floor(public.os2_n(p_data, 'ink')), public.os2_n(p_data, 'summons')::int, now(), 1, nb, now())
  on conflict (user_id) do update set data = excluded.data, heroes = excluded.heroes, total_level = excluded.total_level, gold = excluded.gold, ink = excluded.ink, summons = excluded.summons, updated_at = now(), rev = os2_save.rev + 1, budget = excluded.budget, checked_at = now();
  -- hauls count toward the guild's week here, from the checked number, not from anything the browser claims
  hauls := public.os2_n(dl, 'hauls');
  if hauls > 0 then select guild_id into g from os2_guild_member where user_id = me;
    if g is not null then insert into os2_guild_haul (guild_id, week, user_id, hauls) values (g, public.os2_week(), me, hauls) on conflict (guild_id, week, user_id) do update set hauls = os2_guild_haul.hauls + excluded.hauls; end if; end if;
  return jsonb_build_object('ok', true, 'rev', (select rev from os2_save where user_id = me));
end $$;

-- change one player's server ledger: items (may be negative) and gold. Returns the new numbers, or null if they do not have enough.
create or replace function public.os2_move(u uuid, p_item text, p_qty int, p_gold numeric) returns jsonb language plpgsql security definer set search_path = public as $$
declare r os2_save; n numeric; gd numeric; dta jsonb; outp jsonb := '{}'::jsonb;
begin
  select * into r from os2_save where user_id = u for update; if not found then return null; end if; dta := r.data;
  if p_item is not null and p_qty <> 0 then
    if not exists (select 1 from os2_item where id = p_item and kind <> 'hero') then return null; end if;
    n := public.os2_n(public.os2_o(dta->'bag'), p_item) + p_qty; if n < 0 then return null; end if;
    dta := dta || jsonb_build_object('bag', public.os2_o(dta->'bag') || jsonb_build_object(p_item, n)); outp := outp || jsonb_build_object('bag', jsonb_build_object(p_item, n));
  end if;
  if coalesce(p_gold, 0) <> 0 then gd := public.os2_n(dta, 'gold') + p_gold; if gd < 0 then return null; end if; dta := dta || jsonb_build_object('gold', gd); outp := outp || jsonb_build_object('gold', gd); end if;
  update os2_save set data = dta, gold = floor(public.os2_n(dta, 'gold')), rev = rev + 1 where user_id = u;
  return jsonb_build_object('set', outp, 'rev', r.rev + 1);
end $$;
create or replace function public.os2_tradable(p_item text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from os2_item where id = p_item and kind in ('loot', 'gear', 'crate') and id not like 'j\_%') $$;

drop function if exists public.os2_gift(text, text, int); drop function if exists public.os2_market_list(text, int, int); drop function if exists public.os2_guild_haul_add(int);
create or replace function public.os2_gift(n text, p_item text, p_qty int) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); them uuid := public.os2_who(n); m jsonb;
begin
  if them is null or not exists (select 1 from os2_friend where status = 'ok' and ((a = me and b = them) or (a = them and b = me))) then return jsonb_build_object('r', 'You can only send things to friends.'); end if;
  if p_qty < 1 or p_qty > 99 or not public.os2_tradable(p_item) then return jsonb_build_object('r', 'That cannot be sent.'); end if;
  if (select count(*) from os2_mail where from_name = public.os2_name(me) and kind = 'gift' and created_at > now() - interval '1 day') >= 20 then return jsonb_build_object('r', 'Twenty gifts a day is plenty.'); end if;
  m := public.os2_move(me, p_item, -p_qty, 0); if m is null then return jsonb_build_object('r', 'You do not have that to give.'); end if;
  insert into os2_mail (to_id, from_name, kind, payload) values (them, public.os2_name(me), 'gift', jsonb_build_object('item', p_item, 'qty', p_qty)); return m || jsonb_build_object('r', 'ok');
end $$;
create or replace function public.os2_mail_claim(p_id bigint) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); ml os2_mail; m jsonb;
begin
  select * into ml from os2_mail where id = p_id and to_id = me and claimed_at is null for update; if not found then return null; end if;
  if ml.kind = 'sale' then m := public.os2_move(me, null, 0, public.os2_n(ml.payload, 'gold')); else m := public.os2_move(me, ml.payload->>'item', public.os2_n(ml.payload, 'qty')::int, 0); end if;
  if m is null then return jsonb_build_object('r', 'Play for a minute first so there is a ledger to put it in.'); end if;
  update os2_mail set claimed_at = now() where id = p_id; return m || jsonb_build_object('r', 'ok', 'kind', ml.kind, 'payload', ml.payload);
end $$;
create or replace function public.os2_market_list(p_item text, p_qty int, p_price int) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); m jsonb;
begin
  if p_qty < 1 or p_qty > 99 or p_price < 1 or p_price > 100000 or not public.os2_tradable(p_item) then return jsonb_build_object('r', 'That cannot be sold.'); end if;
  if (select count(*) from os2_listing where seller = me and closed_at is null) >= 10 then return jsonb_build_object('r', 'Ten things on the stall at a time.'); end if;
  m := public.os2_move(me, p_item, -p_qty, 0); if m is null then return jsonb_build_object('r', 'You do not have that to sell.'); end if;
  insert into os2_listing (seller, seller_name, item, qty, price) values (me, public.os2_name(me), p_item, p_qty, p_price); return m || jsonb_build_object('r', 'ok');
end $$;
create or replace function public.os2_market_cancel(p_id bigint) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); l os2_listing; m jsonb;
begin
  update os2_listing set closed_at = now() where id = p_id and seller = me and closed_at is null returning * into l; if l.id is null then return null; end if;
  m := public.os2_move(me, l.item, l.qty, 0); return coalesce(m, '{}'::jsonb) || jsonb_build_object('r', 'ok');
end $$;
create or replace function public.os2_market_buy(p_id bigint) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); l os2_listing; m jsonb;
begin
  select * into l from os2_listing where id = p_id and closed_at is null and seller <> me for update; if not found then return jsonb_build_object('r', 'Somebody got there first.'); end if;
  m := public.os2_move(me, l.item, l.qty, -l.price); if m is null then return jsonb_build_object('r', 'Not enough gold.'); end if;
  update os2_listing set closed_at = now(), buyer = me where id = p_id;
  insert into os2_mail (to_id, from_name, kind, payload) values (l.seller, public.os2_name(me), 'sale', jsonb_build_object('item', l.item, 'qty', l.qty, 'gold', l.price - ceil(l.price * 0.05)::int));
  return m || jsonb_build_object('r', 'ok', 'item', l.item);
end $$;
create or replace function public.os2_guild_claim_reward() returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); g uuid; wk int := public.os2_week(); m jsonb;
begin
  select guild_id into g from os2_guild_member where user_id = me; if g is null then return jsonb_build_object('r', 'Join a guild first.'); end if;
  if (select coalesce(sum(hauls), 0) from os2_guild_haul where guild_id = g and week = wk) < 1500 * (select count(*) from os2_guild_member where guild_id = g) then return jsonb_build_object('r', 'The goal is not reached yet.'); end if;
  if (select coalesce(sum(hauls), 0) from os2_guild_haul where guild_id = g and week = wk and user_id = me) < 100 then return jsonb_build_object('r', 'Bring in 100 hauls of your own this week first.'); end if;
  begin insert into os2_guild_claim (user_id, week) values (me, wk); exception when unique_violation then return jsonb_build_object('r', 'Already collected this week.'); end;
  perform public.os2_move(me, 'x_crate', 3, 0); m := public.os2_move(me, 'x_shard', 5, 0);
  if m is null then raise exception 'no ledger'; end if;
  return m || jsonb_build_object('r', 'ok', 'set', jsonb_build_object('bag', (select jsonb_build_object('x_crate', public.os2_n(data->'bag', 'x_crate'), 'x_shard', public.os2_n(data->'bag', 'x_shard')) from os2_save where user_id = me)));
end $$;

do $$ declare f text; begin
  foreach f in array array['os2_n(jsonb,text)', 'os2_o(jsonb)', 'os2_lvl(numeric)', 'os2_hold(jsonb)', 'os2_move(uuid,text,int,numeric)', 'os2_tradable(text)'] loop execute format('revoke execute on function public.%s from anon, public, authenticated', f); end loop;
  foreach f in array array['os2_save_put(jsonb,bigint)', 'os2_gift(text,text,int)', 'os2_mail_claim(bigint)', 'os2_market_list(text,int,int)', 'os2_market_cancel(bigint)', 'os2_market_buy(bigint)', 'os2_guild_claim_reward()'] loop
    execute format('revoke execute on function public.%s from anon, public', f); execute format('grant execute on function public.%s to authenticated', f); end loop; end $$;

-- Applied afterwards (migration os2_save_sell_credit): os2_item gained a `sell` price, filled from data/rules.json, and
-- os2_save_put credits gold from things sold or crates opened (sum of removed items x sell, 150 per crate) before checking the gold limit.
-- os2_item itself is loaded from data/rules.json on the fable branch; reload it whenever heroes or items are added.
