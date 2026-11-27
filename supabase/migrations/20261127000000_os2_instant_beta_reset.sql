-- 27 Nov 2026: instant beta access, and an owner's reset button for any account.

-- 1. Instant access. The landing-page sign-up now lets the email straight in: the same three writes an invite makes
--    (allow list, invite record, waitlist stamp), with source 'instant'. Called only by the waitlist edge function
--    with the service role, after den_waitlist_join has done its rate limiting. Old invite codes still work.
create or replace function public.os2_beta_instant(p_email text) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare e text := lower(btrim(coalesce(p_email, '')));
begin
  if length(e) > 200 or e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    return jsonb_build_object('ok', false, 'code', 'bad_email');
  end if;
  insert into public.den_allow(email) values (e) on conflict do nothing;
  insert into public.os2_beta_invite(email, source) values (e, 'instant') on conflict do nothing;
  update public.den_waitlist set invited_at = coalesce(invited_at, now()) where lower(email) = e;
  return jsonb_build_object('ok', true, 'email', e);
end $$;
revoke all on function public.os2_beta_instant(text) from public, anon, authenticated;

-- 2. Owner's reset. Blanks a player's ledger in place (an empty save loads as a fresh start) and bumps the page
--    number, so a tab still open on the old ledger is told it is stale and reloads the fresh one instead of
--    writing the old one back. Keeps the account, name, Founding Clerk mark, friends and guild. Clears their
--    cheat flags. Owner only.
create or replace function public.os2_admin_reset(p_user uuid) returns jsonb
language plpgsql security definer set search_path to '' as $$
declare n int;
begin
  if not public.os2_is_admin() then raise exception 'owner only'; end if;
  update public.os2_save set data = '{}'::jsonb, heroes = 0, total_level = 4, gold = 0, ink = 0, summons = 0,
         rev = rev + 1, budget = null, checked_at = null, updated_at = now() where user_id = p_user;
  get diagnostics n = row_count;
  delete from public.os2_flag where user_id = p_user;
  return jsonb_build_object('ok', true, 'had_save', n > 0);
end $$;
revoke all on function public.os2_admin_reset(uuid) from public, anon;
grant execute on function public.os2_admin_reset(uuid) to authenticated;
