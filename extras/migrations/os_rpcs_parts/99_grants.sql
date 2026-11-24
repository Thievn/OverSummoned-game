grant execute on function public.os_ok() to authenticated;
grant execute on function public.os_state() to authenticated;
grant execute on function public.os_set_party(text[]) to authenticated;
grant execute on function public.os_set_rules(jsonb) to authenticated;
grant execute on function public.os_start_delve(integer, integer) to authenticated;
grant execute on function public.os_claim() to authenticated;
grant execute on function public.os_sell(text, integer) to authenticated;
grant execute on function public.os_act(text, jsonb) to authenticated;
grant execute on function public.os_sellval(text) to authenticated;

revoke all on function public.os_grant_hero(uuid, text) from public, anon, authenticated;
revoke all on function public.os_tick(uuid) from public, anon, authenticated;
revoke all on function public.os_pack(uuid) from public, anon, authenticated;
revoke all on function public.os_give(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.os_feed_post(text, text) from public, anon, authenticated;
