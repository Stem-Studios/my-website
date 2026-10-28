-- Apply only after inspecting the live schema and applying 0001 if absent.
-- No existing study data is deleted. No public revision-data policies are added.
begin;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to authenticated;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
create unique index if not exists profiles_unique_username on public.profiles(lower(username)) where username is not null;
alter table public.profiles add constraint valid_username check(username is null or username ~ '^[a-z0-9_]{3,24}$');
grant select on public.profiles to authenticated;
revoke insert,delete,update on public.profiles from anon,authenticated;
grant update(name,username,avatar_url,exam,modules,target_score,exam_date,weekly_hours,assessment) on public.profiles to authenticated;
create table public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  revision bigint not null default 1 check(revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.user_progress enable row level security;
create policy own_progress_read on public.user_progress for select to authenticated using(user_id=(select auth.uid()));
grant select on public.user_progress to authenticated;
revoke insert,update,delete on public.user_progress from anon,authenticated;

create function private.save_user_progress(expected_revision bigint,new_state jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare result bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if pg_column_size(new_state)>2000000 or jsonb_typeof(new_state)<>'object' then raise exception 'Invalid workspace'; end if;
  -- A per-user transaction lock makes initial creation and updates atomic.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  if expected_revision=0 then
    insert into public.user_progress(user_id,state) values(auth.uid(),new_state) returning revision into result;
  else
    update public.user_progress set state=new_state, revision=revision+1,updated_at=now()
    where user_id=auth.uid() and revision=expected_revision returning revision into result;
    if result is null then raise exception 'Progress changed on another device'; end if;
  end if;
  -- Keep public-identity source fields aligned with the private workspace.
  if new_state ? 'profile' then
    update public.profiles set name=left(coalesce(new_state->'profile'->>'name',name),60),
    exam=coalesce(new_state->'profile'->>'exam',exam),
    modules=coalesce(new_state->'profile'->'modules',modules),
    assessment=assessment||jsonb_build_object('currentScore',new_state->'profile'->'currentScore','targetScore',new_state->'profile'->'targetScore'),
    weekly_hours=coalesce((new_state->'profile'->>'weeklyHours')::integer,weekly_hours)
    where user_id=auth.uid();
  end if;
  return result;
end $$;
revoke all on function private.save_user_progress(bigint,jsonb) from public,anon;
grant execute on function private.save_user_progress(bigint,jsonb) to authenticated;
create function public.save_user_progress(expected_revision bigint,new_state jsonb) returns bigint
language sql security invoker set search_path='' as $$ select private.save_user_progress(expected_revision,new_state) $$;
revoke all on function public.save_user_progress(bigint,jsonb) from public,anon;
grant execute on function public.save_user_progress(bigint,jsonb) to authenticated;

create function private.create_student_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare handle text;
begin
  handle:=lower(new.raw_user_meta_data->>'username');
  if handle is null or handle !~ '^[a-z0-9_]{3,24}$' then raise exception 'Invalid username'; end if;
  insert into public.app_users(id) values(new.id);
  insert into public.profiles(user_id,name,username,exam,modules,target_score,exam_date,weekly_hours,assessment)
  values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),handle),60),handle,'TMUA','["Mathematics"]',7,to_char(current_date+90,'YYYY-MM-DD'),5,'{}');
  return new;
end $$;
revoke all on function private.create_student_profile() from public,anon,authenticated;
create trigger create_student_profile after insert on auth.users for each row execute function private.create_student_profile();
-- Preserve every existing profile; provision only missing rows for older users.
insert into public.app_users(id) select id from auth.users on conflict(id) do nothing;
insert into public.profiles(user_id,name,exam,modules,target_score,exam_date,weekly_hours,assessment)
select id,left(coalesce(nullif(raw_user_meta_data->>'display_name',''),'Student'),60),'TMUA','["Mathematics"]',7,to_char(current_date+90,'YYYY-MM-DD'),5,'{}'
from auth.users on conflict(user_id) do nothing;
commit;
