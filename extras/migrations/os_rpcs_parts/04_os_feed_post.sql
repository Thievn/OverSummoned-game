create or replace function public.os_feed_post(p_tag text, p_msg text)
returns void language plpgsql security definer set search_path to public as $$
begin
  if p_msg ~* '(new card|hero found|was summoned|pulled an |pulled a |unhinged card|slapton|marcellus|vincenzo|edith crane|maya washington)' then
    return;
  end if;
  insert into public.os_feed(tag, msg) values (coalesce(nullif(p_tag,''),'Streets'), left(p_msg, 280));
end $$;

