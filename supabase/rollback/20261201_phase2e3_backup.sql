create table if not exists public.os_bak_phase2e3_listing as select * from public.os_listing;
create table if not exists public.os_bak_phase2e3_fair as select * from public.os_fair;
alter table public.os_bak_phase2e3_listing enable row level security; alter table public.os_bak_phase2e3_fair enable row level security;
revoke all on public.os_bak_phase2e3_listing, public.os_bak_phase2e3_fair from anon, authenticated;
