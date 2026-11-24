create or replace function public.os_ok()
returns boolean language sql security definer set search_path to public
as $function$ select exists(select 1 from public.den_allow where lower(email)=lower(coalesce(auth.jwt()->>'email',''))) $function$;

