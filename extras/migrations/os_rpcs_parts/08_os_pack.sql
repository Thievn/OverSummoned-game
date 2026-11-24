create or replace function public.os_pack(p_uid uuid)
returns jsonb language plpgsql security definer set search_path to public as $$
declare p public.os_player; welcome jsonb;
begin
  select * into p from os_player where uid = p_uid;
  if p.pending is not null and p.pending->'items' is not null then
    select jsonb_build_object(
      'away', coalesce(p.pending->>'away','a while'),
      'lines', coalesce(jsonb_agg(jsonb_build_object(
        'icon','chest','text', i.name || ' came in','value','+' || e.value,'cls','lm')), '[]'::jsonb)
    ) into welcome
    from jsonb_each_text(p.pending->'items') e
    join os_item_def i on i.id = e.key;
  end if;
  return jsonb_build_object(
    'now', now(),
    'player', (select to_jsonb(x) from os_player x where x.uid = p_uid),
    'heroes', coalesce((select jsonb_agg(to_jsonb(h)) from os_hero h where h.uid = p_uid), '[]'::jsonb),
    'bag', coalesce((select jsonb_agg(jsonb_build_object('id', b.item_id, 'qty', b.qty)) from os_bag b where b.uid = p_uid), '[]'::jsonb),
    'delve', (select to_jsonb(d) from os_delve d where d.uid = p_uid),
    'known', coalesce((select jsonb_agg(hd.id) from os_hero_def hd where hd.found), '[]'::jsonb),
    'feed', coalesce((select jsonb_agg(f.msg) from (select msg from os_feed order by id desc limit 8) f), '[]'::jsonb),
    'crier', coalesce((select jsonb_agg(jsonb_build_object('tag', coalesce(c.tag,'Streets'), 'msg', c.msg, 'at', c.at) order by c.id desc) from (select * from os_feed order by id desc limit 20) c), '[]'::jsonb),
    'welcome', welcome,
    'market', jsonb_build_object(
      'listings', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'item', l.item_id, 'price', l.price, 'qty', l.qty, 'today', 0, 'kind', l.kind, 'hero_id', l.hero_id)) from os_listing l where l.kind = 'item'), '[]'::jsonb),
      'cards', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'hero', l.hero_id, 'level', coalesce(l.hero_level,1), 'seller', coalesce(sp.name,'a trader'), 'price', l.price)) from os_listing l left join os_player sp on sp.uid = l.seller where l.kind = 'card'), '[]'::jsonb),
      'orders', coalesce((select jsonb_agg(jsonb_build_object('text','Selling '||l.qty||' '||coalesce(i.name,l.item_id),'meta','Listed','good', true)) from os_listing l left join os_item_def i on i.id = l.item_id where l.seller = p_uid), '[]'::jsonb)
    ),
    'config', coalesce((select jsonb_object_agg(key, value) from os_config), '{}'::jsonb),
    'infirmary', coalesce((select jsonb_agg(jsonb_build_object('id', hero_id, 'name', hero_id, 'reason', reason, 'until', until)) from os_infirmary where uid = p_uid and until > now()), '[]'::jsonb),
    'crew', (
      select jsonb_build_object(
        'name', c.name, 'rank', 1, 'members', (select count(*) from os_crew_member mm where mm.crew_id = c.id),
        'max', 25, 'online', 1, 'perk', '+5% XP', 'vaultOre', coalesce((c.vault->>'moonsilver_ore')::int, c.goal_have),
        'goal', c.goal_need, 'youGave', c.goal_have, 'motto', coalesce(c.motto,''), 'code', c.code,
        'roster', coalesce((select jsonb_agg(jsonb_build_object('name', pp.name, 'role', mm.role, 'line', 'In the city', 'on', true, 'face', 'engineer')) from os_crew_member mm join os_player pp on pp.uid = mm.uid where mm.crew_id = c.id), '[]'::jsonb),
        'chat', coalesce((select jsonb_agg(jsonb_build_object('who', coalesce(pp.name,'Crew'), 'face', 'engineer', 'color', 'cy', 't', to_char(ch.created_at, 'HH12:MI PM'), 'text', ch.body) order by ch.id) from os_chat ch left join os_player pp on pp.uid = ch.uid where ch.crew_id = c.id), '[]'::jsonb),
        'cup', coalesce((select jsonb_agg(jsonb_build_array(cc.name, cc.cup) order by cc.cup desc) from os_crew cc), '[]'::jsonb),
        'raid', 'The Hollow Bishop', 'raidN', 0
      )
      from os_crew c
      join os_crew_member me on me.crew_id = c.id and me.uid = p_uid
    )
  );
end $$;

