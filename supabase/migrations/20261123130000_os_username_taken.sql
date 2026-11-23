-- Name check for the front page. Idempotent. Does not touch other objects.
-- Returns true when the name is already carried or sits on the reserved list.

create or replace function public.os_username_taken(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path to public
as $$
declare
  n text := lower(btrim(coalesce(p_name, '')));
  reserved text[] := array[
    'admin','administrator','root','system','staff','support','help','security',
    'official','moderator','mod','mods','owner','webmaster','postmaster','abuse',
    'noreply','null','undefined','anonymous','guest','user','account','login',
    'signin','signout','privacy','terms','cellar','crypt','oversummoned','tobias','wren'
  ];
begin
  if n = '' then
    return false;
  end if;
  if n = any (reserved) then
    return true;
  end if;
  if n ~ '(admin|moderator|thievn)' then
    return true;
  end if;
  return exists (
    select 1 from public.os_player p
    where lower(p.name) = n
  );
end;
$$;

revoke all on function public.os_username_taken(text) from public;
grant execute on function public.os_username_taken(text) to anon, authenticated;
