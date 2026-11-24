create or replace function public.os_node(p_skill text, p_node text)
returns jsonb language sql immutable as $$
  select case p_skill||':'||p_node
    when 'mining:copper' then '{"sec":2.0,"xp":5,"item":"copper_ore","qty":1}'::jsonb
    when 'mining:iron' then '{"sec":2.6,"xp":14,"item":"iron_ore","qty":1}'::jsonb
    when 'mining:moonsilver' then '{"sec":3.0,"xp":38,"item":"moonsilver_ore","qty":1}'::jsonb
    when 'mining:ember' then '{"sec":4.2,"xp":70,"item":"ember_ore","qty":1}'::jsonb
    when 'mining:void' then '{"sec":5.2,"xp":110,"item":"void_ore","qty":1}'::jsonb
    when 'mining:starfall' then '{"sec":6.4,"xp":180,"item":"gem_violet","qty":1}'::jsonb
    when 'woodcutting:ash' then '{"sec":2.2,"xp":6,"item":"ash_log","qty":1}'::jsonb
    when 'woodcutting:ironbark' then '{"sec":3.0,"xp":16,"item":"ash_log","qty":2}'::jsonb
    when 'woodcutting:moonwood' then '{"sec":3.6,"xp":34,"item":"ash_log","qty":2}'::jsonb
    when 'fishing:eel' then '{"sec":2.4,"xp":6,"item":"raw_eel","qty":1}'::jsonb
    when 'fishing:lantern' then '{"sec":3.2,"xp":20,"item":"raw_eel","qty":2}'::jsonb
    when 'cooking:stew' then '{"sec":3.0,"xp":18,"item":"eel_stew","qty":1,"use":{"raw_eel":1}}'::jsonb
    when 'cooking:feast' then '{"sec":4.0,"xp":40,"item":"eel_stew","qty":2,"use":{"raw_eel":2}}'::jsonb
    when 'smithing:iron' then '{"sec":3.2,"xp":16,"item":"iron_bar","qty":1,"use":{"iron_ore":2}}'::jsonb
    when 'smithing:moon' then '{"sec":4.0,"xp":36,"item":"moonsilver_bar","qty":1,"use":{"moonsilver_ore":2}}'::jsonb
    when 'smithing:gladius' then '{"sec":4.0,"xp":120,"item":"moonsilver_gladius","qty":1,"use":{"moonsilver_bar":4,"ash_log":2}}'::jsonb
    when 'alchemy:draught' then '{"sec":3.4,"xp":20,"item":"potion_pink","qty":1}'::jsonb
    when 'alchemy:oil' then '{"sec":3.8,"xp":28,"item":"potion_cyan","qty":1}'::jsonb
    when 'summoning:whisper' then '{"sec":4.0,"xp":22,"item":"card_shard","qty":1}'::jsonb
    when 'summoning:sigil' then '{"sec":8.0,"xp":60,"item":"summon_sigil","qty":1}'::jsonb
    else null end;
$$;

