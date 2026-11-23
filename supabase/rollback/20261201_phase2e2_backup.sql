create table if not exists public.os_bak_phase2e2_player as select p.uid, p.gold, p.copper, (select jsonb_object_agg(b.item_id, b.qty) from public.os_bag b where b.uid = p.uid) bag from public.os_player p;
alter table public.os_bak_phase2e2_player enable row level security;
revoke all on public.os_bak_phase2e2_player from anon, authenticated;
