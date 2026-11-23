-- Skill scenes: new fish and meals, and the skill spots that use them.
-- Node ids stay the same so existing mastery is kept.
-- Mirrors js/catalog.js ITEMS and NODES.

insert into public.os_item_def(id, name, rarity, slot, in_pool, sell_copper, flavor, icon) values
  ('ash_perch', 'Ash perch', 'common', 'food', true, 3600, 'A quiet pond fish, silver-green.', 'ash_perch'),
  ('moon_trout', 'Moon trout', 'uncommon', 'food', true, 8000, 'It shines a little, even in a bucket.', 'moon_trout'),
  ('deep_pike', 'Deep pike', 'rare', 'food', true, 16000, 'Long, dark, and it does not give up easily.', 'deep_pike'),
  ('perch_supper', 'Perch supper', 'uncommon', 'food', true, 10000, 'Crisp skin, herbs from the garden.', 'perch_supper'),
  ('moon_bake', 'Moon bake', 'rare', 'food', true, 22000, 'It shines a little even after the oven.', 'moon_bake'),
  ('pike_feast', 'Pike feast', 'epic', 'food', true, 45000, 'Enough for the whole squad, and then some.', 'pike_feast')
on conflict (id) do update set
  name = excluded.name,
  rarity = excluded.rarity,
  slot = excluded.slot,
  sell_copper = excluded.sell_copper,
  flavor = excluded.flavor,
  icon = excluded.icon;

insert into public.os_fair(item_id, anchor, fair, day_fair) values
  ('ash_perch', 3600, 3600, 3600),
  ('moon_trout', 8000, 8000, 8000),
  ('deep_pike', 16000, 16000, 16000),
  ('perch_supper', 10000, 10000, 10000),
  ('moon_bake', 22000, 22000, 22000),
  ('pike_feast', 45000, 45000, 45000)
on conflict (item_id) do nothing;

create or replace function public.os_node(p_skill text, p_node text)
 returns jsonb language sql immutable set search_path to 'public' as $function$
  select case p_skill||':'||p_node
    when 'mining:copper' then '{"sec":2,"xp":5,"item":"copper_ore","qty":1}'::jsonb
    when 'mining:iron' then '{"sec":2.6,"xp":14,"item":"iron_ore","qty":1}'::jsonb
    when 'mining:moonsilver' then '{"sec":3,"xp":38,"item":"moonsilver_ore","qty":1}'::jsonb
    when 'mining:ember' then '{"sec":4.2,"xp":70,"item":"ember_ore","qty":1}'::jsonb
    when 'mining:void' then '{"sec":5.2,"xp":110,"item":"void_ore","qty":1}'::jsonb
    when 'mining:starfall' then '{"sec":6.4,"xp":180,"item":"gem_violet","qty":1,"every":6}'::jsonb
    when 'woodcutting:ash' then '{"sec":2.2,"xp":6,"item":"ash_log","qty":1}'::jsonb
    when 'woodcutting:ironbark' then '{"sec":3,"xp":16,"item":"ironbark_log","qty":2}'::jsonb
    when 'woodcutting:moonwood' then '{"sec":3.6,"xp":34,"item":"moonwood_log","qty":2}'::jsonb
    when 'woodcutting:emberroot' then '{"sec":4.4,"xp":72,"item":"emberroot_log","qty":3}'::jsonb
    when 'woodcutting:voidtrunk' then '{"sec":5.5,"xp":120,"item":"voidtrunk_log","qty":3}'::jsonb
    when 'fishing:eel' then '{"sec":2.4,"xp":6,"item":"raw_eel","qty":1}'::jsonb
    when 'fishing:lantern' then '{"sec":3.2,"xp":20,"item":"ash_perch","qty":1}'::jsonb
    when 'fishing:ashpond' then '{"sec":4,"xp":48,"item":"moon_trout","qty":1}'::jsonb
    when 'fishing:deep' then '{"sec":5.4,"xp":100,"item":"deep_pike","qty":1}'::jsonb
    when 'cooking:stew' then '{"sec":3,"xp":18,"item":"eel_stew","qty":1,"use":{"raw_eel":1}}'::jsonb
    when 'cooking:feast' then '{"sec":4,"xp":40,"item":"eel_stew","qty":2,"use":{"raw_eel":2}}'::jsonb
    when 'cooking:perch' then '{"sec":3.6,"xp":28,"item":"perch_supper","qty":1,"use":{"ash_perch":1}}'::jsonb
    when 'cooking:moonbake' then '{"sec":4.6,"xp":60,"item":"moon_bake","qty":1,"use":{"moon_trout":1}}'::jsonb
    when 'cooking:broth' then '{"sec":5,"xp":80,"item":"potion_pink","qty":1,"use":{"raw_eel":1,"gem_violet":1}}'::jsonb
    when 'cooking:pike' then '{"sec":5.6,"xp":110,"item":"pike_feast","qty":1,"use":{"deep_pike":1}}'::jsonb
    when 'smithing:iron' then '{"sec":3.2,"xp":16,"item":"iron_bar","qty":1,"use":{"iron_ore":2}}'::jsonb
    when 'smithing:moon' then '{"sec":4,"xp":36,"item":"moonsilver_bar","qty":1,"use":{"moonsilver_ore":2}}'::jsonb
    when 'smithing:gladius' then '{"sec":4,"xp":120,"item":"moonsilver_gladius","qty":1,"use":{"moonsilver_bar":4,"ash_log":2}}'::jsonb
    when 'alchemy:draught' then '{"sec":3.4,"xp":20,"item":"potion_pink","qty":1,"use":{"raw_eel":1,"ash_log":1}}'::jsonb
    when 'alchemy:oil' then '{"sec":3.8,"xp":28,"item":"potion_cyan","qty":1,"use":{"ash_log":2,"copper_ore":1}}'::jsonb
    when 'alchemy:violet' then '{"sec":6,"xp":140,"item":"gem_violet","qty":1,"use":{"potion_pink":1,"potion_cyan":1},"every":10}'::jsonb
    when 'summoning:whisper' then '{"sec":4,"xp":22,"item":"card_shard","qty":1}'::jsonb
    when 'summoning:sigil' then '{"sec":8,"xp":60,"item":"summon_sigil","qty":1,"every":4}'::jsonb
    when 'summoning:name' then '{"sec":7,"xp":120,"item":"card_shard","qty":2}'::jsonb
    else null end;
$function$;
create or replace function public.os_node_lv(p_skill text, p_node text)
 returns integer language sql immutable set search_path to '' as $function$
  select case p_skill || ':' || p_node
    when 'mining:copper' then 1
    when 'mining:iron' then 10
    when 'mining:moonsilver' then 25
    when 'mining:ember' then 55
    when 'mining:void' then 70
    when 'mining:starfall' then 85
    when 'woodcutting:ash' then 1
    when 'woodcutting:ironbark' then 15
    when 'woodcutting:moonwood' then 30
    when 'woodcutting:emberroot' then 55
    when 'woodcutting:voidtrunk' then 75
    when 'fishing:eel' then 1
    when 'fishing:lantern' then 20
    when 'fishing:ashpond' then 40
    when 'fishing:deep' then 65
    when 'cooking:stew' then 1
    when 'cooking:feast' then 25
    when 'cooking:perch' then 20
    when 'cooking:moonbake' then 40
    when 'cooking:broth' then 45
    when 'cooking:pike' then 65
    when 'smithing:iron' then 1
    when 'smithing:moon' then 20
    when 'smithing:gladius' then 35
    when 'alchemy:draught' then 1
    when 'alchemy:oil' then 18
    when 'alchemy:violet' then 50
    when 'summoning:whisper' then 1
    when 'summoning:sigil' then 20
    when 'summoning:name' then 60
    else 999 end
$function$;
revoke all on function public.os_node(text, text) from public, anon, authenticated;
revoke all on function public.os_node_lv(text, text) from public, anon, authenticated;
