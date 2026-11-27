-- 27 Nov 2026 (applied): profile picture, update-email opt-in, who gets update emails, which versions were sent.
alter table public.os2_beta_invite drop constraint if exists os2_beta_invite_source_check;
alter table public.os2_beta_invite add constraint os2_beta_invite_source_check check (source = any (array['invite','code','instant']));
alter table public.os2_profile add column if not exists avatar text check (avatar is null or avatar ~ '^[a-z0-9_]{1,40}$');
alter table public.os2_profile add column if not exists email_updates boolean not null default false;
grant update (avatar, email_updates) on public.os2_profile to authenticated;
create or replace function public.os2_update_subscribers() returns table(email text)
language sql stable security definer set search_path = public, auth as $$
  select u.email::text from os2_profile p join auth.users u on u.id = p.id where p.email_updates and u.email is not null
$$;
revoke all on function public.os2_update_subscribers() from public, anon, authenticated;
grant execute on function public.os2_update_subscribers() to service_role;
create table if not exists public.os2_notes_sent (v text primary key, sent_at timestamptz not null default now(), sent int not null default 0);
alter table public.os2_notes_sent enable row level security;
-- os2_social and os2_peek: 'avatar', p.avatar added beside every 'username', p.username.
do $$ declare f text; d text; begin
  foreach f in array array['os2_social','os2_peek'] loop
    d := pg_get_functiondef(('public.'||f)::regproc);
    if position('''avatar'', p.avatar' in d) = 0 then execute replace(d, '''username'', p.username,', '''username'', p.username, ''avatar'', p.avatar,'); end if;
  end loop; end $$;
