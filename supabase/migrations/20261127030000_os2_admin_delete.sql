-- Delete a player for good: everything they own, then the sign-in itself. Owner only, never the owner's own row.
-- For test accounts and for anyone who asks to be removed. A reset (os2_admin_reset) only blanks the save.
create or replace function public.os2_admin_delete(p_user uuid) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare nm text; em text;
begin
  if not public.os2_is_admin() then raise exception 'owner only'; end if;
  if p_user = auth.uid() then return jsonb_build_object('ok', false, 'why', 'That is your own account.'); end if;
  select p.username into nm from os2_profile p where p.id = p_user;
  select u.email into em from auth.users u where u.id = p_user;
  if nm is null and em is null then return jsonb_build_object('ok', false, 'why', 'No such player.'); end if;
  delete from os2_chat where user_id = p_user;
  delete from os2_guild_haul where user_id = p_user;
  delete from os2_guild_claim where user_id = p_user;
  delete from os2_guild_member where user_id = p_user;
  update os2_guild set owner = null where owner = p_user;
  delete from os2_listing where seller = p_user or buyer = p_user;
  delete from os2_mail where to_id = p_user;
  delete from os2_friend where a = p_user or b = p_user;
  delete from os2_flag where user_id = p_user;
  delete from os2_feedback where user_id = p_user;
  delete from os2_device where user_id = p_user;
  delete from os2_pair where user_id = p_user;
  delete from os2_save where user_id = p_user;
  delete from os2_profile where id = p_user;
  if em is not null then
    delete from os2_beta_invite where email = em;
    delete from den_allow where email = em;
    delete from den_waitlist where email = em;
  end if;
  delete from auth.users where id = p_user;
  return jsonb_build_object('ok', true, 'username', nm, 'email', em);
end $$;
revoke all on function public.os2_admin_delete(uuid) from public, anon;
grant execute on function public.os2_admin_delete(uuid) to authenticated;
