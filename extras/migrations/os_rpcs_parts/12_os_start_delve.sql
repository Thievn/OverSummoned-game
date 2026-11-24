create or replace function public.os_start_delve(f integer, m integer)
returns void language plpgsql security definer set search_path to public as $$
declare u uuid := auth.uid(); p os_player; allowed int[]; cost int; mins numeric;
begin
  if u is null or not os_ok() then raise exception 'not allowed'; end if;
  select * into p from os_player where uid = u;
  if p.uid is null then raise exception 'no player'; end if;
  if coalesce(p.banned,false) then raise exception 'The city has closed its door to you.'; end if;
  allowed := array[1,15,60,240,480];
  select array(select jsonb_array_elements_text(value->'delveMinutes')::int) into allowed from os_config where key = 'game' and value ? 'delveMinutes';
  if allowed is null or cardinality(allowed) = 0 then allowed := array[1,15,60,240,480]; end if;
  if not (m = any(allowed)) then raise exception 'bad length'; end if;
  if f < 1 or f > p.deepest then raise exception 'floor locked'; end if;
  if coalesce(array_length(p.party,1),0) < 1 then raise exception 'empty party'; end if;
  if exists(select 1 from os_delve where uid = u) then raise exception 'already delving'; end if;
  cost := case m when 1 then 6 when 15 then 12 when 60 then 20 when 240 then 35 when 480 then 50 else 12 end + greatest(0, f - 1);
  if p.vigor < cost then raise exception 'Not enough Vigor.'; end if;
  mins := m;
  if 'delivery_rider' = any(p.party) then mins := mins * 0.9; end if;
  update os_player set vigor = vigor - cost where uid = u;
  insert into os_delve(uid, party, floor, minutes, ends_at, seed)
  values (u, p.party, f, m, now() + make_interval(secs => (mins * 60)::int), floor(random()*1000000000));
  insert into os_event(uid, kind, qty, ref) values (u, 'delve', 1, f::text);
end $$;

