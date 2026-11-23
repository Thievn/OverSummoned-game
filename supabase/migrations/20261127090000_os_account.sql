-- Account area: name change with a live availability check, profile pictures from collected cards,
-- and a few saved settings. Everything runs as the signed-in player; nothing here reads other players
-- beyond "is this name free".
alter table public.os_player
  add column if not exists avatar text,
  add column if not exists name_changed_at timestamptz,
  add column if not exists settings jsonb not null default '{}'::jsonb;

create unique index if not exists os_player_name_lower on public.os_player (lower(name));

create or replace function public.os_name_check(p_name text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare u uuid := auth.uid(); n text := btrim(coalesce(p_name, '')); mine text;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select name into mine from os_player where uid = u;
  if n = '' then return jsonb_build_object('ok', false, 'why', 'empty'); end if;
  if length(n) < 3 then return jsonb_build_object('ok', false, 'why', 'short'); end if;
  if length(n) > 16 then return jsonb_build_object('ok', false, 'why', 'long'); end if;
  if n !~ '^[A-Za-z0-9][A-Za-z0-9_ .-]*[A-Za-z0-9]$' or n ~ '[ _.-]{2,}' then return jsonb_build_object('ok', false, 'why', 'chars'); end if;
  if lower(n) = lower(coalesce(mine, '')) then return jsonb_build_object('ok', false, 'why', 'same'); end if;
  if exists (select 1 from blocked_terms b where length(btrim(b.term)) > 0 and position(lower(btrim(b.term)) in lower(n)) > 0) then
    return jsonb_build_object('ok', false, 'why', 'blocked');
  end if;
  if os_username_taken(n) then return jsonb_build_object('ok', false, 'why', 'taken'); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.os_set_name(p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); n text := btrim(coalesce(p_name, '')); c jsonb; last timestamptz;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select name_changed_at into last from os_player where uid = u for update;
  if not found then raise exception 'not allowed'; end if;
  if last is not null and last > now() - interval '7 days' then
    raise exception 'You can pick a new name again on %.', to_char(last + interval '7 days', 'FMMonth FMDD');
  end if;
  c := os_name_check(n);
  if not (c->>'ok')::boolean then
    raise exception '%', case c->>'why'
      when 'taken' then 'That name is taken.' when 'short' then 'Names need at least 3 characters.'
      when 'long' then 'Names can be up to 16 characters.' when 'same' then 'That is already your name.'
      when 'blocked' then 'Pick a different name.' else 'Letters, numbers, spaces, dots, dashes and underscores only.' end;
  end if;
  begin
    update os_player set name = n, name_changed_at = now() where uid = u;
  exception when unique_violation then raise exception 'That name is taken.';
  end;
  return os_pack(u);
end $$;

create or replace function public.os_set_avatar(p_hero text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); h text := nullif(btrim(coalesce(p_hero, '')), '');
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  if h is not null and not exists (select 1 from os_hero where uid = u and hero_id = h) then
    raise exception 'Collect that card first.';
  end if;
  update os_player set avatar = h where uid = u;
  return os_pack(u);
end $$;

create or replace function public.os_save_settings(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); s jsonb := '{}'::jsonb;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  if p ? 'motion' and p->>'motion' in ('full', 'reduced') then s := s || jsonb_build_object('motion', p->>'motion'); end if;
  if p ? 'updates' and jsonb_typeof(p->'updates') = 'boolean' then s := s || jsonb_build_object('updates', p->'updates'); end if;
  if p ? 'install' and jsonb_typeof(p->'install') = 'boolean' then s := s || jsonb_build_object('install', p->'install'); end if;
  update os_player set settings = coalesce(settings, '{}'::jsonb) || s where uid = u;
  return (select settings from os_player where uid = u);
end $$;

revoke all on function public.os_name_check(text), public.os_set_name(text), public.os_set_avatar(text), public.os_save_settings(jsonb) from public, anon;
grant execute on function public.os_name_check(text), public.os_set_name(text), public.os_set_avatar(text), public.os_save_settings(jsonb) to authenticated;
