-- Premigration backup of public os_* and den_* functions
-- Project: eresamyqxarlrdgudgrw (thievns-den)
-- Taken: 2026-11-22 21:23:24 EST
-- Also records the existing auth.users trigger den_block_signup (not modified).
-- This file is a snapshot only. It does not contain secrets.

-- Trigger on auth.users:
-- CREATE TRIGGER den_block_signup BEFORE INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION den_block_signup();

-- function public.den_art_call(p_body jsonb)
CREATE OR REPLACE FUNCTION public.den_art_call(p_body jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare tok text := replace(gen_random_uuid()::text||gen_random_uuid()::text,'-',''); rid bigint;
begin
  insert into den_art_ticket(hash,expires_at) values (encode(digest(tok,'sha256'),'hex'), now()+interval '2 minutes');
  select net.http_post(url:='https://eresamyqxarlrdgudgrw.supabase.co/functions/v1/art', headers:=jsonb_build_object('content-type','application/json','x-art-ticket',tok), body:=p_body, timeout_milliseconds:=120000) into rid;
  return rid;
end $function$;

-- function public.den_award(pid uuid, g integer, x integer)
CREATE OR REPLACE FUNCTION public.den_award(pid uuid, g integer, x integer)
 RETURNS den_players
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.den_players;
begin
 update den_players set gold=greatest(0,gold+g), xp=xp+x where id=pid returning * into r;
 return r;
end $function$;

-- function public.den_block_signup()
CREATE OR REPLACE FUNCTION public.den_block_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (select 1 from public.den_allow where lower(email)=lower(new.email)) then
    raise exception 'The Den is not open yet.';
  end if;
  return new;
end $function$;

-- function public.den_boss_hit(k text, dmg integer, pid text, maxhp integer)
CREATE OR REPLACE FUNCTION public.den_boss_hit(k text, dmg integer, pid text, maxhp integer)
 RETURNS den_boss_state
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.den_boss_state;
begin
 insert into den_boss_state(bkey,hp,max_hp) values(k,maxhp,maxhp) on conflict do nothing;
 select * into r from den_boss_state where bkey=k for update;
 if r.respawn_at is not null and r.respawn_at<=now() then
  update den_boss_state set hp=maxhp,max_hp=maxhp,contrib='{}'::jsonb,respawn_at=null,slain_at=null,last_hit=null where bkey=k;
  select * into r from den_boss_state where bkey=k;
 end if;
 if r.respawn_at is not null then return r; end if;
 if r.last_hit is not null and r.last_hit<now()-interval '30 minutes' and r.hp<r.max_hp then r.hp:=r.max_hp; r.contrib:='{}'::jsonb; end if;
 if dmg>0 then
  r.hp:=greatest(0,r.hp-dmg); r.last_hit:=now();
  r.contrib:=jsonb_set(coalesce(r.contrib,'{}'::jsonb),array[pid],to_jsonb(coalesce((r.contrib->>pid)::int,0)+dmg));
  if r.hp=0 then r.slain_at:=now(); r.respawn_at:=now()+interval '6 hours'; r.kills:=r.kills+1; end if;
 end if;
 update den_boss_state set hp=r.hp,max_hp=maxhp,last_hit=r.last_hit,contrib=r.contrib,slain_at=r.slain_at,respawn_at=r.respawn_at,kills=r.kills where bkey=k;
 return r;
end $function$;

-- function public.den_ensure(p_pid uuid, x0 integer, y0 integer, x1 integer, y1 integer)
CREATE OR REPLACE FUNCTION public.den_ensure(p_pid uuid, x0 integer, y0 integer, x1 integer, y1 integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n integer;
begin
  insert into den_discovered(player_id, cx, cy, seed)
  select p_pid, c.cx, c.cy, true from world_chunks c where c.cx between x0 and x1 and c.cy between y0 and y1
  on conflict do nothing;
  get diagnostics n = row_count; return n;
end $function$;

-- function public.den_give(pid uuid, it text, q integer)
CREATE OR REPLACE FUNCTION public.den_give(pid uuid, it text, q integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 insert into den_inventory(player_id,item,qty) values(pid,it,greatest(q,0)) on conflict(player_id,item) do update set qty=den_inventory.qty+q;
 delete from den_inventory where player_id=pid and item=it and qty<=0;
end $function$;

-- function public.den_gm_stats()
CREATE OR REPLACE FUNCTION public.den_gm_stats()
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
select jsonb_build_object(
 'totals', (select jsonb_build_object('players',count(*),'accounts',count(user_id),'guests',count(*)-count(user_id),'banned',count(*) filter (where banned),'active24',count(*) filter (where last_seen>now()-interval '24 hours'),'active7',count(*) filter (where last_seen>now()-interval '7 days'),'gold',coalesce(sum(gold),0),'kills',coalesce(sum(kills),0),'deaths',coalesce(sum(deaths),0),'bossKills',coalesce(sum(boss_kills),0),'rolls',coalesce(sum(rolls),0),'avgLevel',coalesce(round(avg(level),1),0),'maxLevel',coalesce(max(level),0)) from den_players),
 'online', (select count(*) from world_presence where last_seen>now()-interval '2 minutes'),
 'chunks', (select count(*) from world_chunks),
 'signups', (select coalesce(jsonb_agg(jsonb_build_object('d',to_char(g,'MM-DD'),'n',coalesce(c.n,0)) order by g),'[]'::jsonb) from generate_series(current_date-13,current_date,'1 day') g left join (select created_at::date d,count(*) n from den_players group by 1) c on c.d=g),
 'activity', (select coalesce(jsonb_agg(jsonb_build_object('d',to_char(g,'MM-DD'),'n',coalesce(c.n,0)) order by g),'[]'::jsonb) from generate_series(current_date-13,current_date,'1 day') g left join (select last_seen::date d,count(*) n from den_players group by 1) c on c.d=g),
 'discovered', (select coalesce(jsonb_agg(jsonb_build_object('d',to_char(g,'MM-DD'),'n',coalesce(c.n,0)) order by g),'[]'::jsonb) from generate_series(current_date-13,current_date,'1 day') g left join (select discovered_at::date d,count(*) n from world_chunks group by 1) c on c.d=g),
 'levels', (select coalesce(jsonb_agg(jsonb_build_object('b',b,'n',n) order by b),'[]'::jsonb) from (select (level-1)/5*5+1 b,count(*) n from den_players group by 1) x),
 'top', (select coalesce(jsonb_agg(t),'[]'::jsonb) from (select name,level,gold,kills,boss_kills as "bossKills" from den_players where not banned order by level desc,xp desc limit 8) t),
 'rich', (select coalesce(jsonb_agg(t),'[]'::jsonb) from (select name,gold from den_players where not banned order by gold desc limit 5) t),
 'items', (select coalesce(jsonb_agg(t),'[]'::jsonb) from (select item,sum(qty) n from den_inventory group by 1 order by 2 desc limit 8) t),
 'orders', jsonb_build_object('count',0,'paid',0,'cents',0)
);
$function$;

-- function public.den_my_chunks(p_pid uuid, p_since text)
CREATE OR REPLACE FUNCTION public.den_my_chunks(p_pid uuid, p_since text DEFAULT NULL::text)
 RETURNS TABLE(cx integer, cy integer, crowd integer, salt integer, at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select d.cx, d.cy, c.crowd, c.salt, d.at
  from den_discovered d join world_chunks c on c.cx = d.cx and c.cy = d.cy
  where d.player_id = p_pid and (p_since is null or d.at > p_since::timestamptz)
  order by d.at asc, d.cx asc, d.cy asc
  limit 1500
$function$;

-- function public.den_seed_players()
CREATE OR REPLACE FUNCTION public.den_seed_players()
 RETURNS TABLE(player text, added integer, total bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; n integer;
begin
  for r in select id, name, gid, x, y, home_x, home_y from den_players loop
    n := 0;
    -- within 3 chunks of where they stand now
    n := n + den_ensure(r.id, floor(r.x/16.0)::int - 3, floor(r.y/16.0)::int - 3, floor(r.x/16.0)::int + 3, floor(r.y/16.0)::int + 3);
    -- within 2 chunks of spawn (spawn tile is in chunk 0,0)
    n := n + den_ensure(r.id, -2, -2, 2, 2);
    -- their home marker and its neighbours
    if r.home_x is not null then n := n + den_ensure(r.id, floor(r.home_x/16.0)::int - 1, floor(r.home_y/16.0)::int - 1, floor(r.home_x/16.0)::int + 1, floor(r.home_y/16.0)::int + 1); end if;
    -- chunks they opened themselves (by player id, by guest id, or by name)
    insert into den_discovered(player_id, cx, cy, seed)
      select r.id, c.cx, c.cy, true from world_chunks c
      where c.discovered_by = r.id::text or c.discovered_by = r.gid or lower(c.discoverer_name) = lower(r.name)
      on conflict do nothing;
    get diagnostics n = row_count; 
    return query select r.name, n, (select count(*) from den_discovered d where d.player_id = r.id);
  end loop;
end $function$;

-- function public.den_seed_waystones()
CREATE OR REPLACE FUNCTION public.den_seed_waystones()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; n integer := 0;
begin
  for r in select player_id, x, y from den_waystones loop
    n := n + den_ensure(r.player_id, floor(r.x/16.0)::int - 1, floor(r.y/16.0)::int - 1, floor(r.x/16.0)::int + 1, floor(r.y/16.0)::int + 1);
  end loop; return n;
end $function$;

-- function public.den_spend(pid uuid, cost integer)
CREATE OR REPLACE FUNCTION public.den_spend(pid uuid, cost integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n int;
begin
 update den_players set gold=gold-cost where id=pid and gold>=cost;
 get diagnostics n = row_count;
 return n>0;
end $function$;

-- function public.os_claim()
CREATE OR REPLACE FUNCTION public.os_claim()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid:=auth.uid(); d os_delve; mult numeric; n int; i int; r numeric; rar text; it text; loot jsonb:='{}'::jsonb; g int; hid text; isnew boolean; hres jsonb:=null; tiers text[]:=array['unhinged','absurd','legendary','epic','rare','uncommon','common']; k int; checks int;
begin
 if u is null or not os_ok() then raise exception 'not allowed'; end if;
 select * into d from os_delve where uid=u;
 if not found then raise exception 'nothing to claim'; end if;
 if now()<d.ends_at then raise exception 'not done'; end if;
 mult:=1+(d.floor-1)*0.08; n:=greatest(2,d.minutes/4+1)+(array_length(d.party,1)-1);
 for i in 1..n loop
  r:=random();
  rar:=case when r<0.003*mult then 'unhinged' when r<0.010*mult then 'absurd' when r<0.030*mult then 'legendary' when r<0.080*mult then 'epic' when r<0.200*mult then 'rare' when r<0.450 then 'uncommon' else 'common' end;
  it:=null;
  for k in array_position(tiers,rar)..7 loop
   select id into it from os_item_def where rarity=tiers[k] and in_pool order by random() limit 1;
   exit when it is not null;
  end loop;
  if it is not null then
   loot:=jsonb_set(loot,array[it],to_jsonb(coalesce((loot->>it)::int,0)+1));
   insert into os_bag(uid,item_id,qty) values(u,it,1) on conflict(uid,item_id) do update set qty=os_bag.qty+1;
  end if;
 end loop;
 g:=(d.minutes*d.floor*2)+floor(random()*(d.minutes+5))::int;
 update os_player set gold=gold+g,deepest=case when d.floor=deepest and d.minutes>=15 then deepest+1 else deepest end where uid=u;
 checks:=least(8,greatest(1,d.minutes/15));
 for i in 1..checks loop
  if random()<0.06*(1+d.floor*0.05) then
   select id into hid from os_hero_def order by -ln(1-random())/(case rarity when 'common' then 10 when 'uncommon' then 6 when 'rare' then 3 when 'epic' then 1 else 0.3 end) limit 1;
   isnew:=os_grant_hero(u,hid); hres:=jsonb_build_object('id',hid,'new',isnew); exit;
  end if;
 end loop;
 delete from os_delve where uid=u;
 return jsonb_build_object('gold',g,'loot',loot,'hero',hres,'floor',d.floor,'minutes',d.minutes);
end $function$;

-- function public.os_grant_hero(u uuid, h text)
CREATE OR REPLACE FUNCTION public.os_grant_hero(u uuid, h text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare isnew boolean:=false; seen boolean;
begin
 insert into os_hero(uid,hero_id) values(u,h) on conflict do nothing;
 if found then isnew:=true; else update os_hero set dupes=dupes+1 where uid=u and hero_id=h; end if;
 select d.found into seen from os_hero_def d where d.id=h;
 if not seen then
  update os_hero_def set found=true where id=h;
  update os_item_def set in_pool=true where hero_id=h;
 end if;
 return isnew;
end $function$;

-- function public.os_ok()
CREATE OR REPLACE FUNCTION public.os_ok()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ select exists(select 1 from public.den_allow where lower(email)=lower(coalesce(auth.jwt()->>'email',''))) $function$;

-- function public.os_sell(i text, q integer)
CREATE OR REPLACE FUNCTION public.os_sell(i text, q integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid:=auth.uid(); have int; r text; v int;
begin
 if u is null or not os_ok() then raise exception 'not allowed'; end if;
 select qty into have from os_bag where uid=u and item_id=i;
 if have is null or q<1 then raise exception 'nothing to sell'; end if;
 q:=least(q,have); select rarity into r from os_item_def where id=i; v:=os_sellval(r)*q;
 if have-q<=0 then delete from os_bag where uid=u and item_id=i; else update os_bag set qty=qty-q where uid=u and item_id=i; end if;
 update os_player set gold=gold+v where uid=u;
 return v;
end $function$;

-- function public.os_sellval(r text)
CREATE OR REPLACE FUNCTION public.os_sellval(r text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$ select case r when 'common' then 3 when 'uncommon' then 8 when 'rare' then 25 when 'epic' then 80 when 'legendary' then 250 when 'absurd' then 600 else 1000 end $function$;

-- function public.os_set_party(p text[])
CREATE OR REPLACE FUNCTION public.os_set_party(p text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid:=auth.uid();
begin
 if u is null or not os_ok() then raise exception 'not allowed'; end if;
 if coalesce(array_length(p,1),0)>3 then raise exception 'max 3'; end if;
 if exists(select 1 from unnest(p) x where not exists(select 1 from os_hero where uid=u and hero_id=x)) then raise exception 'not owned'; end if;
 if exists(select 1 from os_delve where uid=u) then raise exception 'delving'; end if;
 update os_player set party=p where uid=u;
end $function$;

-- function public.os_set_rules(r jsonb)
CREATE OR REPLACE FUNCTION public.os_set_rules(r jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
 if auth.uid() is null or not os_ok() then raise exception 'not allowed'; end if;
 update os_player set rules=jsonb_build_object('heal',least(90,greatest(0,coalesce((r->>'heal')::int,40))),'retreat',least(90,greatest(0,coalesce((r->>'retreat')::int,25))),'loot',case when r->>'loot' in('loot','fight','balanced') then r->>'loot' else 'balanced' end) where uid=auth.uid();
end $function$;

-- function public.os_start_delve(f integer, m integer)
CREATE OR REPLACE FUNCTION public.os_start_delve(f integer, m integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid:=auth.uid(); p os_player;
begin
 if u is null or not os_ok() then raise exception 'not allowed'; end if;
 select * into p from os_player where uid=u;
 if p.uid is null then raise exception 'no player'; end if;
 if m not in(1,15,60,240,480) then raise exception 'bad length'; end if;
 if f<1 or f>p.deepest then raise exception 'floor locked'; end if;
 if coalesce(array_length(p.party,1),0)<1 then raise exception 'empty party'; end if;
 if exists(select 1 from os_delve where uid=u) then raise exception 'already delving'; end if;
 insert into os_delve(uid,party,floor,minutes,ends_at) values(u,p.party,f,m,now()+make_interval(mins=>m));
end $function$;

-- function public.os_state()
CREATE OR REPLACE FUNCTION public.os_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid:=auth.uid(); p os_player;
begin
 if u is null or not os_ok() then raise exception 'not allowed'; end if;
 select * into p from os_player where uid=u;
 if not found then
  insert into os_player(uid,name,gold) values(u,split_part(coalesce(auth.jwt()->>'email','Summoner'),'@',1),100) returning * into p;
  perform os_grant_hero(u,'office_worker'); perform os_grant_hero(u,'delivery_rider');
  update os_player set party=array['office_worker','delivery_rider'] where uid=u;
  insert into os_bag(uid,item_id,qty) values(u,'stained_mug',1),(u,'delivery_bag',1) on conflict do nothing;
 end if;
 return jsonb_build_object(
  'now',now(),
  'player',(select to_jsonb(x) from os_player x where x.uid=u),
  'heroes',coalesce((select jsonb_agg(to_jsonb(h)) from os_hero h where h.uid=u),'[]'::jsonb),
  'bag',coalesce((select jsonb_agg(jsonb_build_object('id',b.item_id,'qty',b.qty)) from os_bag b where b.uid=u),'[]'::jsonb),
  'delve',(select to_jsonb(d) from os_delve d where d.uid=u),
  'known',coalesce((select jsonb_agg(hd.id) from os_hero_def hd where hd.found),'[]'::jsonb),
  'feed',coalesce((select jsonb_agg(f.msg) from (select msg from os_feed order by id desc limit 8) f),'[]'::jsonb));
end $function$;

