create table if not exists public.os_bak_phase2e1_item as select id, sell_copper from public.os_item_def;
create table if not exists public.os_bak_phase2e1_player as select p.uid, p.gold, p.copper, p.pending, p.skill, (select jsonb_object_agg(b.item_id, b.qty) from public.os_bag b where b.uid = p.uid) bag from public.os_player p;
create table if not exists public.os_bak_phase2e1_listing as select * from public.os_listing;
alter table public.os_bak_phase2e1_item enable row level security; alter table public.os_bak_phase2e1_player enable row level security; alter table public.os_bak_phase2e1_listing enable row level security;
revoke all on public.os_bak_phase2e1_item, public.os_bak_phase2e1_player, public.os_bak_phase2e1_listing from anon, authenticated;
