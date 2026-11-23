-- Display names: apostrophes are fine inside a name (O'Brien, Thievn's Den), at most two, never next to
-- another space, dot, dash or underscore. A curly apostrophe from a phone keyboard counts as a straight one.
-- Names that contain the site owner's handle stay reserved for everyone except the owner's own account.

create or replace function public.os_name_owner(p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_uid is not null and (
    exists (select 1 from os_owner_card o where o.owner_uid = p_uid)
    or exists (select 1 from auth.users au join den_allow a on lower(a.email) = lower(au.email) where au.id = p_uid and a.is_admin)
  )
$$;
revoke all on function public.os_name_owner(uuid) from public, anon, authenticated;

create or replace function public.os_name_norm(p_name text)
returns text language sql immutable set search_path = public as $$
  select btrim(replace(replace(coalesce(p_name, ''), chr(8217), ''''), chr(8216), ''''))
$$;

create or replace function public.os_name_check(p_name text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare u uuid := auth.uid(); n text := os_name_norm(p_name); mine text; l text;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select name into mine from os_player where uid = u;
  l := lower(n);
  if n = '' then return jsonb_build_object('ok', false, 'why', 'empty'); end if;
  if length(n) < 3 then return jsonb_build_object('ok', false, 'why', 'short'); end if;
  if length(n) > 16 then return jsonb_build_object('ok', false, 'why', 'long'); end if;
  if n !~ '^[A-Za-z0-9][A-Za-z0-9_ .''-]*[A-Za-z0-9]$' or n ~ '[ _.''-]{2,}'
     or length(n) - length(replace(n, '''', '')) > 2 then
    return jsonb_build_object('ok', false, 'why', 'chars');
  end if;
  if l = lower(coalesce(mine, '')) then return jsonb_build_object('ok', false, 'why', 'same'); end if;
  if exists (select 1 from blocked_terms b where length(btrim(b.term)) > 0 and position(lower(btrim(b.term)) in l) > 0) then
    return jsonb_build_object('ok', false, 'why', 'blocked');
  end if;
  if l ~ 'thievn' and os_name_owner(u) then
    -- the owner may carry their own handle; it still has to be free
    if exists (select 1 from os_player p where lower(p.name) = l and p.uid <> u) then
      return jsonb_build_object('ok', false, 'why', 'taken');
    end if;
    return jsonb_build_object('ok', true);
  end if;
  if os_username_taken(n) then return jsonb_build_object('ok', false, 'why', 'taken'); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.os_set_name(p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); n text := os_name_norm(p_name); c jsonb; last timestamptz;
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
      when 'blocked' then 'Pick a different name.' else 'Letters, numbers, spaces, dots, dashes, apostrophes and underscores only.' end;
  end if;
  begin
    update os_player set name = n, name_changed_at = now() where uid = u;
  exception when unique_violation then raise exception 'That name is taken.';
  end;
  return os_pack(u);
end $$;

revoke all on function public.os_name_check(text), public.os_set_name(text) from public, anon;
grant execute on function public.os_name_check(text), public.os_set_name(text) to authenticated;
revoke all on function public.os_name_norm(text) from public, anon, authenticated;
