-- Harden OverSummoned RPCs. No table drops, no data deletes, no auth trigger changes.
-- Client RPCs os_act and os_admin keep EXECUTE for authenticated only.
-- Helpers are only called from SECURITY DEFINER functions owned by postgres
-- (os_tick: os_act, os_state; os_pack: os_act, os_state; os_give: os_act, os_tick;
--  os_node: os_tick; os_feed_post: os_act, os_admin, os_claim; os_admin_audit: os_admin),
-- so EXECUTE is revoked from public, anon, and authenticated.

revoke all on function public.os_act(text, jsonb) from public, anon;
grant execute on function public.os_act(text, jsonb) to authenticated;

revoke all on function public.os_admin(text, jsonb) from public, anon;
grant execute on function public.os_admin(text, jsonb) to authenticated;

revoke all on function public.os_admin_audit(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.os_tick(uuid) from public, anon, authenticated;
revoke all on function public.os_pack(uuid) from public, anon, authenticated;
revoke all on function public.os_give(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.os_node(text, text) from public, anon, authenticated;
revoke all on function public.os_feed_post(text, text) from public, anon, authenticated;

alter function public.os_sellval(text) set search_path to public;
alter function public.os_node(text, text) set search_path to public;
