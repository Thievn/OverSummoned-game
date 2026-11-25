-- Second way to link a pet, with nothing to type: the pet makes up a long random request id and opens the website with it;
-- the signed-in player presses Yes; the pet, which has been asking, is handed its secret once.
create table if not exists public.os2_link_req (id text primary key, token text not null, username text, created_at timestamptz not null default now());
alter table public.os2_link_req enable row level security;

create or replace function public.os2_link_approve(p_req text, p_name text default 'Desktop pet') returns text language plpgsql security definer set search_path = public, auth as $$
declare me uuid := public.os2_uid(); tok text;
begin
  if coalesce(p_req, '') !~ '^[a-f0-9]{32,64}$' then return 'That link is not from a pet.'; end if;
  delete from os2_link_req where created_at < now() - interval '10 minutes';
  if exists (select 1 from os2_link_req where id = p_req) then return 'ok'; end if;
  if (select count(*) from os2_device where user_id = me) >= 5 then return 'Five pets are already linked. Unlink one first.'; end if;
  tok := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into os2_device (user_id, token_hash, name) values (me, encode(sha256(convert_to(tok, 'utf8')), 'hex'), left(coalesce(nullif(btrim(p_name), ''), 'Desktop pet'), 40));
  insert into os2_link_req (id, token, username) values (p_req, tok, (select username::text from os2_profile where id = me));
  return 'ok';
end $$;

create or replace function public.os2_link_poll(p_req text) returns jsonb language plpgsql security definer set search_path = public as $$
declare rq os2_link_req;
begin
  delete from os2_link_req where id = coalesce(p_req, '') and created_at > now() - interval '10 minutes' returning * into rq;
  if rq.id is null then return jsonb_build_object('r', 'wait'); end if;
  return jsonb_build_object('r', 'ok', 'token', rq.token, 'username', rq.username);
end $$;

revoke execute on function public.os2_link_approve(text, text) from anon, public; grant execute on function public.os2_link_approve(text, text) to authenticated;
revoke execute on function public.os2_link_poll(text) from public; grant execute on function public.os2_link_poll(text) to anon, authenticated;
