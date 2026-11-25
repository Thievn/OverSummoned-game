-- Closed beta: invites, shareable codes, feedback, and the founder mark.
-- The gate itself is unchanged: den_allow is still the list den_block_signup and os2_allowed() read.

alter table public.den_waitlist add column if not exists invited_at timestamptz;
alter table public.os2_profile  add column if not exists founder boolean not null default false;
update public.os2_profile set founder = true where not founder;   -- everyone here before the doors open

create table if not exists public.os2_beta_code (
  code       text primary key,
  note       text not null default '',
  max_uses   int  not null default 1 check (max_uses between 1 and 1000),
  uses       int  not null default 0,
  revoked    boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.os2_beta_invite (
  email      text primary key,
  source     text not null check (source in ('invite','code')),
  code       text references public.os2_beta_code(code),
  invited_at timestamptz not null default now(),
  mailed     boolean not null default false
);
create table if not exists public.os2_feedback (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('idea','bug','other')),
  body       text not null check (char_length(body) between 3 and 2000),
  status     text not null default 'new' check (status in ('new','seen','done')),
  created_at timestamptz not null default now()
);
alter table public.os2_beta_code   enable row level security;
alter table public.os2_beta_invite enable row level security;
alter table public.os2_feedback    enable row level security;
-- no policies: these tables are reached only through the functions below

-- founder is set by the server when a profile is made, and nobody can change it from the client
create or replace function public.os2_profile_founder() returns trigger
language plpgsql security definer set search_path to '' as $$
begin
  if tg_op = 'INSERT' then
    new.founder := not coalesce((select (value)::text = 'true' from public.os_config where key = 'os2_open'), false);
  else
    new.founder := old.founder;
  end if;
  return new;
end $$;
drop trigger if exists os2_profile_founder on public.os2_profile;
create trigger os2_profile_founder before insert or update on public.os2_profile
  for each row execute function public.os2_profile_founder();

-- a code turned into a place on the allow list (called by the beta edge function only)
create or replace function public.os2_beta_redeem(p_code text, p_email text, p_ip_hash text) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare
  e  text := lower(btrim(coalesce(p_email, '')));
  c  text := upper(btrim(coalesce(p_code, '')));
  ip text := left(coalesce(nullif(p_ip_hash, ''), 'unknown'), 128);
  r  public.os2_beta_code;
begin
  if length(e) > 200 or e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    return jsonb_build_object('ok', false, 'code', 'bad_email');
  end if;
  if (select count(*) from public.den_waitlist_hit where ip_hash = ip and at > now() - interval '10 minutes') >= 5 then
    return jsonb_build_object('ok', false, 'code', 'slow_down');
  end if;
  insert into public.den_waitlist_hit(ip_hash) values (ip);
  if exists (select 1 from public.den_allow a where lower(a.email) = e) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  select * into r from public.os2_beta_code where code = c for update;
  if not found or r.revoked or r.uses >= r.max_uses then
    return jsonb_build_object('ok', false, 'code', 'bad_code');
  end if;
  update public.os2_beta_code set uses = uses + 1 where code = c;
  insert into public.den_allow(email) values (e) on conflict do nothing;
  insert into public.os2_beta_invite(email, source, code) values (e, 'code', c) on conflict do nothing;
  update public.den_waitlist set invited_at = coalesce(invited_at, now()) where lower(email) = e;
  return jsonb_build_object('ok', true);
end $$;

-- one email let in by the owner (called by the beta edge function after it has checked the caller is the owner)
create or replace function public.os2_beta_invite_email(p_email text) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare e text := lower(btrim(coalesce(p_email, '')));
begin
  if length(e) > 200 or e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    return jsonb_build_object('ok', false, 'code', 'bad_email');
  end if;
  insert into public.den_allow(email) values (e) on conflict do nothing;
  insert into public.os2_beta_invite(email, source) values (e, 'invite') on conflict do nothing;
  update public.den_waitlist set invited_at = coalesce(invited_at, now()) where lower(email) = e;
  return jsonb_build_object('ok', true, 'email', e);
end $$;

-- the owner's beta desk
create or replace function public.os2_admin_beta(op text, payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path to 'public', 'auth' as $$
declare c text;
begin
  if not public.os2_is_admin() then raise exception 'not allowed'; end if;
  if op = 'code_new' then
    c := 'SMUDGE-' || upper(substr(md5(gen_random_uuid()::text), 1, 4)) || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 4));
    insert into os2_beta_code(code, note, max_uses)
      values (c, left(coalesce(payload->>'note', ''), 120), least(1000, greatest(1, coalesce((payload->>'max_uses')::int, 1))));
  elsif op = 'code_revoke' then
    update os2_beta_code set revoked = true where code = payload->>'code';
  elsif op = 'feedback_status' then
    update os2_feedback set status = payload->>'status' where id = (payload->>'id')::bigint;
  elsif op <> 'list' then
    raise exception 'unknown op';
  end if;
  return jsonb_build_object(
    'made', c,
    'waitlist', coalesce((select jsonb_agg(jsonb_build_object('email', w.email, 'at', w.created_at, 'invited_at', w.invited_at,
        'allowed', exists (select 1 from den_allow a where lower(a.email) = lower(w.email)),
        'joined', exists (select 1 from auth.users u where lower(u.email) = lower(w.email))) order by w.created_at desc)
      from den_waitlist w), '[]'::jsonb),
    'invites', coalesce((select jsonb_agg(jsonb_build_object('email', i.email, 'source', i.source, 'code', i.code, 'at', i.invited_at, 'mailed', i.mailed,
        'joined', exists (select 1 from auth.users u where lower(u.email) = lower(i.email))) order by i.invited_at desc)
      from os2_beta_invite i), '[]'::jsonb),
    'codes', coalesce((select jsonb_agg(to_jsonb(k) order by k.created_at desc) from os2_beta_code k), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'kind', f.kind, 'body', f.body, 'status', f.status, 'at', f.created_at,
        'username', (select p.username from os2_profile p where p.id = f.user_id),
        'email', (select u.email from auth.users u where u.id = f.user_id)) order by f.created_at desc)
      from os2_feedback f), '[]'::jsonb));
end $$;

-- a player's note to the owner
create or replace function public.os2_feedback_send(p_kind text, p_body text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare b text := btrim(coalesce(p_body, ''));
begin
  if auth.uid() is null or not public.os2_allowed() then raise exception 'not allowed'; end if;
  if p_kind not in ('idea','bug','other') or char_length(b) < 3 or char_length(b) > 2000 then
    return jsonb_build_object('ok', false, 'why', 'Write a little more than that, and under 2000 characters.');
  end if;
  if (select count(*) from os2_feedback where user_id = auth.uid() and created_at > now() - interval '1 day') >= 10 then
    return jsonb_build_object('ok', false, 'why', 'That is ten today. Smudge needs to catch up. Try again tomorrow.');
  end if;
  insert into os2_feedback(user_id, kind, body) values (auth.uid(), p_kind, b);
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.os2_beta_redeem(text, text, text)  from public, anon, authenticated;
revoke all on function public.os2_beta_invite_email(text)       from public, anon, authenticated;
revoke all on function public.os2_admin_beta(text, jsonb)        from public, anon;
revoke all on function public.os2_feedback_send(text, text)      from public, anon;
grant execute on function public.os2_beta_redeem(text, text, text) to service_role;
grant execute on function public.os2_beta_invite_email(text)      to service_role;
grant execute on function public.os2_admin_beta(text, jsonb)       to authenticated;
grant execute on function public.os2_feedback_send(text, text)     to authenticated;
