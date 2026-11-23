-- Security hardening. Safe to re-run. Does not replace any game function.
-- 1. Table privileges: the browser only reads through RLS SELECT policies and
--    writes through SECURITY DEFINER RPCs, so anon gets nothing and signed-in
--    users keep SELECT only. RLS stays on everywhere.
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r','p','v','m') loop
    execute format('revoke all on public.%I from anon', t.relname);
    execute format('revoke insert, update, delete, truncate, references, trigger on public.%I from authenticated', t.relname);
  end loop;
end $$;

-- 2. Trigger function should never be callable over the API.
revoke execute on function public.den_block_signup() from public, anon, authenticated;

-- 3. Pure helper, no reason for signed-out callers.
revoke execute on function public.os_sellval(text) from public, anon;

-- 4. Waitlist: one row per address, plus a hit log for rate limiting.
create unique index if not exists den_waitlist_email_lower_uq on public.den_waitlist (lower(email));

create table if not exists public.den_waitlist_hit (
  id bigserial primary key,
  ip_hash text not null,
  at timestamptz not null default now()
);
create index if not exists den_waitlist_hit_ip_at on public.den_waitlist_hit (ip_hash, at);
create index if not exists den_waitlist_hit_at on public.den_waitlist_hit (at);
alter table public.den_waitlist_hit enable row level security;
revoke all on public.den_waitlist_hit from anon, authenticated;
revoke all on sequence public.den_waitlist_hit_id_seq from anon, authenticated;

create or replace function public.den_waitlist_join(p_email text, p_ip_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  e text := lower(btrim(coalesce(p_email, '')));
  ip text := left(coalesce(nullif(p_ip_hash, ''), 'unknown'), 128);
begin
  if length(e) > 200 or e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    return jsonb_build_object('ok', false, 'code', 'bad_email');
  end if;
  delete from public.den_waitlist_hit where at < now() - interval '1 day';
  if (select count(*) from public.den_waitlist_hit where ip_hash = ip and at > now() - interval '10 minutes') >= 5
     or (select count(*) from public.den_waitlist_hit where at > now() - interval '1 hour') >= 300 then
    return jsonb_build_object('ok', false, 'code', 'slow_down');
  end if;
  insert into public.den_waitlist_hit(ip_hash) values (ip);
  insert into public.den_waitlist(email) values (e) on conflict do nothing;
  if not found then
    return jsonb_build_object('ok', true, 'dupe', true);
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.den_waitlist_join(text, text) from public, anon, authenticated;
grant execute on function public.den_waitlist_join(text, text) to service_role;
