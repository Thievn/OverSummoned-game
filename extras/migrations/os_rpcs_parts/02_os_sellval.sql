create or replace function public.os_sellval(r text)
returns integer language sql immutable
as $function$ select case r when 'common' then 3 when 'uncommon' then 8 when 'rare' then 25 when 'epic' then 80 when 'legendary' then 250 when 'absurd' then 600 else 1000 end $function$;

