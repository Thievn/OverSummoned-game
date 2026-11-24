create or replace function public.os_set_rules(r jsonb)
returns void language plpgsql security definer set search_path to public as $$
begin
  if auth.uid() is null or not os_ok() then raise exception 'not allowed'; end if;
  update os_player set rules = jsonb_build_object(
    'heal', least(90, greatest(0, coalesce((r->>'heal')::int, 40))),
    'retreat', least(90, greatest(0, coalesce((r->>'retreat')::int, 25))),
    'loot', case when r->>'loot' in ('loot','fight','balanced') then r->>'loot' else 'balanced' end
  ) where uid = auth.uid();
end $$;

