-- Additive metadata-only API. No question content, keys or student data is exposed.
begin;
create function private.arena_catalogue()
returns table(exam text,difficulty text,verified_count integer,required_count integer,race_seconds integer)
language sql stable security definer set search_path='' as $$
  select modes.exam,modes.difficulty,
    (select count(*)::integer from private.arena_bank q where q.exam=modes.exam and q.difficulty=modes.difficulty and q.verified),
    cfg.question_count,cfg.race_seconds
  from (values('TMUA','Foundation'),('TMUA','Intermediate'),('TMUA','Challenge'),('ESAT','Foundation'),('ESAT','Intermediate'),('ESAT','Challenge')) modes(exam,difficulty)
  cross join private.arena_config cfg
  where (select auth.uid()) is not null;
$$;
revoke all on function private.arena_catalogue() from public,anon;
grant execute on function private.arena_catalogue() to authenticated;
create function public.arena_catalogue()
returns table(exam text,difficulty text,verified_count integer,required_count integer,race_seconds integer)
language sql stable security invoker set search_path='' as $$ select * from private.arena_catalogue() $$;
revoke all on function public.arena_catalogue() from public,anon;
grant execute on function public.arena_catalogue() to authenticated;
commit;
