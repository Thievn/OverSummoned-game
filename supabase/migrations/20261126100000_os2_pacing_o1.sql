-- O1 pacing (approved by Dean, 26 Nov 2026): new XP curve, Summoning-level odds, slower ink.
-- Levels players already have are kept: their xp is moved onto the new curve at the same level and the same way through it.
create or replace function public.os2_lvl(x numeric) returns int language sql immutable as $$
  select 1 + (select count(*) from unnest(array[0,200,500,900,1380,1900,2460,3180,4090,5220,6580,8210,10200,12400,15000,17800,20800,24100,27800,31800,36300,41400,47200,53700,61000,69600,79100,90200,103000,117000,134000,152000,173000,196000,222000,250000,280000,314000,349000,383000,418000,453000,488000,523000,558000,593000,628000,664000,699000,734000,770000,806000,843000,882000,923000,967000,1010000,1060000,1110000,1160000,1220000,1280000,1340000,1400000,1470000,1540000,1610000,1690000,1770000,1860000,1950000,2050000,2150000,2250000,2360000,2480000,2600000,2730000,2860000,3010000,3160000,3320000,3470000,3630000,3780000,3940000,4090000,4250000,4410000,4560000,4720000,4880000,5040000,5200000,5360000,5520000,5680000,5840000,6000000]::numeric[]) with ordinality t(v, i) where i between 2 and 99 and x >= v)::int $$;

create or replace function public.os2_tmp_remap(x numeric) returns numeric language plpgsql immutable as $$
declare o numeric[] := array[0,83,174,276,388,512,650,801,969,1154,1358,1584,1833,2107,2411,2746,3115,3523,3973,4470,5018,5624,6291,7028,7842,8740,9730,10824,12031,13363,14833,16456,18247,20224,22406,24815,27473,30408,33648,37224,41171,45529,50339,55649,61512,67983,75127,83014,91721,101333,111945,123660,136594,150872,166636,184040,203254,224466,247886,273742,302288,333804,368599,407015,449428,496254,547953,605032,668051,737627,814445,899257,992895,1096278,1210421,1336443,1475581,1629200,1798808,1986068,2192818,2421087,2673114,2951373,3258594,3597792,3972294,4385776,4842295,5346332,5902831,6517253,7195629,7944614,8771558,9684577,10692629,11805606,13034431]::numeric[]; n numeric[] := array[0,200,500,900,1380,1900,2460,3180,4090,5220,6580,8210,10200,12400,15000,17800,20800,24100,27800,31800,36300,41400,47200,53700,61000,69600,79100,90200,103000,117000,134000,152000,173000,196000,222000,250000,280000,314000,349000,383000,418000,453000,488000,523000,558000,593000,628000,664000,699000,734000,770000,806000,843000,882000,923000,967000,1010000,1060000,1110000,1160000,1220000,1280000,1340000,1400000,1470000,1540000,1610000,1690000,1770000,1860000,1950000,2050000,2150000,2250000,2360000,2480000,2600000,2730000,2860000,3010000,3160000,3320000,3470000,3630000,3780000,3940000,4090000,4250000,4410000,4560000,4720000,4880000,5040000,5200000,5360000,5520000,5680000,5840000,6000000]::numeric[]; l int := 1;
begin
  if x is null or x <= 0 then return coalesce(x, 0); end if;
  while l < 99 and x >= o[l + 1] loop l := l + 1; end loop;
  if l >= 99 then return n[99] + (x - o[99]) * (n[99] / o[99]); end if;
  return round(n[l] + (x - o[l]) / (o[l + 1] - o[l]) * (n[l + 1] - n[l]));
end $$;

update public.os2_save s set
  data = s.data
    || jsonb_build_object('xp', (select coalesce(jsonb_object_agg(k, public.os2_tmp_remap(v::numeric)), '{}'::jsonb) from jsonb_each_text(public.os2_o(s.data->'xp')) x(k, v)))
    || jsonb_build_object('mastery', (select coalesce(jsonb_object_agg(h, (select coalesce(jsonb_object_agg(k, public.os2_tmp_remap(v::numeric)), '{}'::jsonb) from jsonb_each_text(public.os2_o(hv)) y(k, v))), '{}'::jsonb) from jsonb_each(public.os2_o(s.data->'mastery')) m(h, hv))),
  rev = s.rev + 1;
drop function public.os2_tmp_remap(numeric);

do $$ begin
  execute replace(pg_get_functiondef('public.os2_save_core(uuid,jsonb,bigint)'::regprocedure), '13034431', '6000000');
  execute replace(pg_get_functiondef('public.os2_summon_core(uuid,integer)'::regprocedure),
    'select key, sum(value::numeric) over (order by key) c, sum(value::numeric) over () t from jsonb_each_text(cfg->''weights'')',
    'select key, sum(wv) over (order by key) c, sum(wv) over () t from (select key, value::numeric * case when key in (''common'', ''uncommon'') then 1 else 1 + coalesce((cfg->>''luck_per_10'')::numeric, 0) * floor(public.os2_lvl(xp) / 10) end wv from jsonb_each_text(cfg->''weights'')) ww');
end $$;

update public.os2_cfg set value = '{"base_ink": 3000, "per_unique": 400, "xp_per_ink": 0.25, "weights": {"common": 50, "uncommon": 28, "rare": 14, "epic": 6, "legendary": 1.6, "absurd": 0.35, "unhinged": 0.05}, "luck_per_level": 0.0, "luck_per_10": 0.03}'::jsonb where key = 'summon';
update public.os2_cfg set value = '{"xp_mult": 0.25, "loot_chance": 0.5, "ink_mult": 0.2, "stamp_ink": 5}'::jsonb where key = 'web';

-- O3: potions are brewed like tonics, so they are kind 'tonic' to the server
insert into public.os2_item (id, kind, rarity, sell) values ('x_potion_heal', 'tonic', 'uncommon', 0), ('x_potion_shield', 'tonic', 'uncommon', 0), ('x_potion_fury', 'tonic', 'uncommon', 0) on conflict (id) do nothing;
