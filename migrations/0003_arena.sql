-- Requires 0001 and 0002. Review live schema before applying. No data deletion.
begin;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to authenticated;
create table private.arena_config (
 singleton boolean primary key default true check(singleton), question_count integer not null default 10 check(question_count between 1 and 50),
 race_seconds integer not null default 300 check(race_seconds between 30 and 3600), elo_k integer not null default 24 check(elo_k between 1 and 64)
);
insert into private.arena_config default values;
create table private.arena_rate(user_id uuid primary key,window_start timestamptz not null,hits integer not null);
create function private.arena_limit(uid uuid) returns void language plpgsql security definer set search_path='' as $$
declare hits integer;
begin
 insert into private.arena_rate values(uid,now(),1) on conflict(user_id) do update set
 hits=case when arena_rate.window_start<now()-interval '1 minute' then 1 else arena_rate.hits+1 end,
 window_start=case when arena_rate.window_start<now()-interval '1 minute' then now() else arena_rate.window_start end
 returning arena_rate.hits into hits;
 if hits>120 then raise exception 'Arena rate limit. Please wait a minute.';end if;
end $$;
revoke all on function private.arena_limit(uuid) from public,anon,authenticated;
create table private.arena_bank (
 id uuid primary key default gen_random_uuid(), exam text not null check(exam in ('TMUA','ESAT')),
 difficulty text not null check(difficulty in ('Foundation','Intermediate','Challenge')),
 content jsonb not null, correct_index integer not null check(correct_index between 0 and 4),
 solution text not null, verified boolean not null default false
);
-- content must contain text, options (exactly five strings), topic, and optional math.
alter table private.arena_bank add constraint arena_content_shape check(
 jsonb_typeof(content->'options')='array' and jsonb_array_length(content->'options')=5
 and content ? 'text' and not(content ? 'correct') and not(content ? 'solution'));
create table public.player_ratings (
 user_id uuid primary key references auth.users(id), rating integer not null default 1000,
 wins integer not null default 0, losses integer not null default 0, draws integer not null default 0,
 streak integer not null default 0, best_streak integer not null default 0, best_points integer not null default 0
);
alter table public.player_ratings enable row level security;
create policy own_rating on public.player_ratings for select to authenticated using(user_id=(select auth.uid()));
grant select on public.player_ratings to authenticated;
revoke insert,update,delete on public.player_ratings from anon,authenticated;
create table public.multiplayer_matches (
 id uuid primary key default gen_random_uuid(), room_code text unique,
 player_one uuid not null references auth.users(id), player_two uuid references auth.users(id),
 names jsonb not null default '{}', exam text not null, difficulty text not null, ranked boolean not null,
 status text not null default 'lobby' check(status in ('lobby','countdown','playing','finished','cancelled')),
 ready uuid[] not null default '{}', question_count integer not null default 10 check(question_count>0),
 scores jsonb not null default '{}', correct_counts jsonb not null default '{}', positions jsonb not null default '{}',
 heartbeats jsonb not null default '{}', completed_at jsonb not null default '{}',
 starts_at timestamptz, deadline timestamptz, winner uuid references auth.users(id), result_reason text,
 created_at timestamptz not null default now(), check(player_one<>player_two)
);
alter table public.multiplayer_matches enable row level security;
create policy arena_members on public.multiplayer_matches for select to authenticated using((select auth.uid()) in (player_one,player_two));
revoke select on public.multiplayer_matches from public,anon,authenticated;
grant select(id,room_code,player_one,player_two,names,exam,difficulty,ranked,status,ready,scores,correct_counts,positions,heartbeats,completed_at,starts_at,deadline,winner,result_reason,created_at,question_count) on public.multiplayer_matches to authenticated;
revoke insert,update,delete on public.multiplayer_matches from anon,authenticated;
create index arena_history on public.multiplayer_matches(player_one,player_two,created_at desc);
create index arena_history_opponent on public.multiplayer_matches(player_two,created_at desc);
create table public.matchmaking_queue (
 user_id uuid primary key references auth.users(id), exam text not null, difficulty text not null,
 ranked boolean not null, joined_at timestamptz not null default now(), seen_at timestamptz not null default now()
);
alter table public.matchmaking_queue enable row level security;
create policy own_queue on public.matchmaking_queue for select to authenticated using(user_id=(select auth.uid()));
grant select on public.matchmaking_queue to authenticated;
revoke insert,update,delete on public.matchmaking_queue from anon,authenticated;
create table private.arena_answers (
 match_id uuid not null references public.multiplayer_matches(id), user_id uuid not null references auth.users(id),
 question_index integer not null, selected integer not null, correct boolean not null,
 points integer not null, received_at timestamptz not null default now(), primary key(match_id,user_id,question_index)
);
create table private.arena_question_keys (
 match_id uuid not null references public.multiplayer_matches(id), position integer not null,
 correct_index integer not null, solution text not null, content jsonb not null, primary key(match_id,position)
);

create function private.arena_create(a uuid,b uuid,ex text,diff text,is_ranked boolean,is_private boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare ids uuid[]; payload jsonb; mid uuid; names jsonb; total integer;
begin
 select question_count into total from private.arena_config;
 select array_agg(id order by ord), jsonb_agg(content order by ord) into ids,payload
 from (select id,content,row_number() over() ord from (select * from private.arena_bank where exam=ex and difficulty=diff and verified order by random() limit total) q) ordered;
 if coalesce(array_length(ids,1),0)<>total then raise exception 'This mode needs % verified server-only questions. Contact the administrator.',total; end if;
 select jsonb_build_object(a::text,coalesce((select username from public.profiles where user_id=a),'Student')) into names;
 if b is not null then names:=names||jsonb_build_object(b::text,coalesce((select username from public.profiles where user_id=b),'Student')); end if;
 insert into public.multiplayer_matches(player_one,player_two,names,exam,difficulty,ranked,question_count,room_code,heartbeats)
 values(a,b,names,ex,diff,is_ranked,total,case when is_private then upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)) end,
 jsonb_build_object(a::text,now(),coalesce(b,a)::text,now())) returning id into mid;
 insert into private.arena_question_keys select mid,i-1,k.correct_index,k.solution,k.content from unnest(ids) with ordinality v(id,i) join private.arena_bank k on k.id=v.id;
 return mid;
end $$;
revoke all on function private.arena_create(uuid,uuid,text,text,boolean,boolean) from public,anon,authenticated;

create function private.arena_lobby(action text,exam_choice text default 'TMUA',difficulty_choice text default 'Intermediate',ranked_choice boolean default false,code text default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); opponent uuid; mid uuid; m public.multiplayer_matches; active_count integer;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 perform private.arena_limit(uid);
 if exam_choice not in ('TMUA','ESAT') or difficulty_choice not in ('Foundation','Intermediate','Challenge') then raise exception 'Invalid mode'; end if;
 -- Serialize queue claims, room joining and duplicate active-match checks.
 perform pg_advisory_xact_lock(7190042);
 if action='cancel' then
   delete from public.matchmaking_queue where user_id=uid;
   select id into mid from public.multiplayer_matches where uid in(player_one,player_two) and status not in('finished','cancelled') and created_at>now()-interval '15 minutes' order by created_at desc limit 1;
   return mid;
 end if;
 select * into m from public.multiplayer_matches where uid in(player_one,player_two) and status not in('finished','cancelled') and created_at>now()-interval '15 minutes' order by created_at desc limit 1;
 if found then return m.id; end if;
 if action='join' then
   select * into m from public.multiplayer_matches where room_code=upper(trim(code)) for update;
   if not found or m.player_two is not null or m.player_one=uid or m.status<>'lobby' or m.created_at<now()-interval '10 minutes' then raise exception 'Room unavailable'; end if;
   update public.multiplayer_matches set player_two=uid,names=names||jsonb_build_object(uid::text,coalesce((select username from public.profiles where user_id=uid),'Student')),
   heartbeats=heartbeats||jsonb_build_object(uid::text,now()) where id=m.id;
   delete from public.matchmaking_queue where user_id=uid;
   return m.id;
 end if;
 select count(*) into active_count from public.multiplayer_matches where player_one=uid and created_at>now()-interval '1 minute';
 if active_count>=3 then raise exception 'Please wait before creating another room'; end if;
 if action='create' then
   delete from public.matchmaking_queue where user_id=uid;
   return private.arena_create(uid,null,exam_choice,difficulty_choice,ranked_choice,true);
 end if;
 if action<>'queue' then raise exception 'Invalid action'; end if;
 -- Expired entries cannot claim a player; cleanup is lazy and transaction-safe.
 delete from public.matchmaking_queue where seen_at<now()-interval '20 seconds' or joined_at<now()-interval '2 minutes';
 select user_id into opponent from public.matchmaking_queue where user_id<>uid and exam=exam_choice and difficulty=difficulty_choice and ranked=ranked_choice order by joined_at limit 1 for update skip locked;
 if opponent is not null then
   mid:=private.arena_create(opponent,uid,exam_choice,difficulty_choice,ranked_choice,false);
   delete from public.matchmaking_queue where user_id in(opponent,uid); return mid;
 end if;
 insert into public.matchmaking_queue(user_id,exam,difficulty,ranked) values(uid,exam_choice,difficulty_choice,ranked_choice)
 on conflict(user_id) do update set seen_at=now();
 return null;
end $$;
revoke all on function private.arena_lobby(text,text,text,boolean,text) from public,anon;
grant execute on function private.arena_lobby(text,text,text,boolean,text) to authenticated;
create function public.arena_lobby(action text,exam_choice text default 'TMUA',difficulty_choice text default 'Intermediate',ranked_choice boolean default false,code text default null) returns uuid
language sql security invoker set search_path='' as $$ select private.arena_lobby(action,exam_choice,difficulty_choice,ranked_choice,code) $$;
revoke all on function public.arena_lobby(text,text,text,boolean,text) from public,anon;
grant execute on function public.arena_lobby(text,text,text,boolean,text) to authenticated;

create function private.arena_settle(mid uuid,forfeiter uuid default null) returns void
language plpgsql security definer set search_path='' as $$
declare m public.multiplayer_matches; a uuid; b uuid; ca integer; cb integer; sa integer; sb integer;
 ra integer; rb integer; delta integer; outcome numeric; winning uuid; ta timestamptz; tb timestamptz;
begin
 select * into m from public.multiplayer_matches where id=mid for update;
 if m.status in('finished','cancelled') then return; end if;
 a:=m.player_one;b:=m.player_two;
 if b is null or m.starts_at is null then
   if forfeiter is not null then update public.multiplayer_matches set status='cancelled',result_reason='Lobby closed' where id=mid; end if;
   return;
 end if;
 if forfeiter is null and now()<m.deadline and not(m.completed_at ? a::text and m.completed_at ? b::text) then return; end if;
 ca:=coalesce((m.correct_counts->>a::text)::integer,0);cb:=coalesce((m.correct_counts->>b::text)::integer,0);
 sa:=coalesce((m.scores->>a::text)::integer,0);sb:=coalesce((m.scores->>b::text)::integer,0);
 ta:=date_trunc('second',coalesce((m.completed_at->>a::text)::timestamptz,m.deadline));
 tb:=date_trunc('second',coalesce((m.completed_at->>b::text)::timestamptz,m.deadline));
 if forfeiter is not null then winning:=case when forfeiter=a then b else a end;
 elsif ca<>cb then winning:=case when ca>cb then a else b end;
 elsif sa<>sb then winning:=case when sa>sb then a else b end;
 elsif abs(extract(epoch from ta-tb))>2 then winning:=case when ta<tb then a else b end;
 else winning:=null; end if;
 -- Ordered rating locks avoid cross-match deadlocks. Match lock makes results idempotent.
 insert into public.player_ratings(user_id) values(a),(b) on conflict do nothing;
 perform 1 from public.player_ratings where user_id in(a,b) order by user_id for update;
 select rating into ra from public.player_ratings where user_id=a;
 select rating into rb from public.player_ratings where user_id=b;
 outcome:=case when winning=a then 1 when winning=b then 0 else 0.5 end;
 delta:=case when m.ranked then round((select elo_k from private.arena_config)*(outcome-1/(1+power(10::numeric,(rb-ra)/400.0))))::integer else 0 end;
 update public.player_ratings set rating=greatest(0,rating+case when user_id=a then delta else -delta end),
 wins=wins+case when user_id=winning then 1 else 0 end,
 losses=losses+case when winning is not null and user_id<>winning then 1 else 0 end,
 draws=draws+case when winning is null then 1 else 0 end,
 best_streak=greatest(best_streak,case when user_id=winning then streak+1 else 0 end),
 streak=case when user_id=winning then streak+1 else 0 end,
 best_points=greatest(best_points,case when user_id=a then sa else sb end) where user_id in(a,b);
 update public.multiplayer_matches set status='finished',winner=winning,result_reason=case when forfeiter is not null then 'Forfeit' else 'Score, points, then completion time (2-second tie window)' end where id=mid;
end $$;
revoke all on function private.arena_settle(uuid,uuid) from public,anon,authenticated;

create function private.arena_play(mid uuid,action text,question_index integer default null,choice integer default null) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); m public.multiplayer_matches; opponent uuid; idx integer; answer integer; pts integer; last_answer timestamptz; good boolean;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 perform private.arena_limit(uid);
 select * into m from public.multiplayer_matches where id=mid for update;
 if not found or uid not in(m.player_one,coalesce(m.player_two,m.player_one)) then raise exception 'Match unavailable'; end if;
 if m.status in('finished','cancelled') then return; end if;
 opponent:=case when uid=m.player_one then m.player_two else m.player_one end;
 if action='leave' then perform private.arena_settle(mid,uid);return;end if;
 update public.multiplayer_matches set heartbeats=heartbeats||jsonb_build_object(uid::text,now()) where id=mid;
 if m.starts_at is not null and now()>=m.starts_at then
   update public.multiplayer_matches set status='playing' where id=mid;
   if opponent is not null and coalesce((m.heartbeats->>opponent::text)::timestamptz,m.starts_at)<now()-interval '90 seconds' then
     -- Never let a simultaneously stale player claim a forfeit win.
     if coalesce((m.heartbeats->>uid::text)::timestamptz,m.starts_at)>=now()-interval '90 seconds' then perform private.arena_settle(mid,opponent);return;end if;
   end if;
   if now()>=m.deadline then perform private.arena_settle(mid);return;end if;
 end if;
 if action='heartbeat' then return;end if;
 if action='ready' then
   if m.status<>'lobby' then return;end if;
   if not uid=any(m.ready) then m.ready:=array_append(m.ready,uid);end if;
   update public.multiplayer_matches set ready=m.ready,
    status=case when array_length(m.ready,1)=2 and player_two is not null then 'countdown' else 'lobby' end,
    starts_at=case when array_length(m.ready,1)=2 and player_two is not null then now()+interval '5 seconds' end,
    deadline=case when array_length(m.ready,1)=2 and player_two is not null then now()+interval '5 seconds'+(select race_seconds from private.arena_config)*interval '1 second' end where id=mid;
   return;
 end if;
 if action<>'answer' or m.starts_at is null or now()<m.starts_at or now()>=m.deadline then raise exception 'Match is not accepting answers';end if;
 if choice is null or choice not between 0 and 4 then raise exception 'Invalid answer';end if;
 -- A duplicate submission cannot change or add points, including concurrent requests.
 if exists(select 1 from private.arena_answers a where a.match_id=mid and a.user_id=uid and a.question_index=arena_play.question_index) then return;end if;
 idx:=coalesce((m.positions->>uid::text)::integer,0);
 if question_index is null or question_index<>idx or idx>=m.question_count then raise exception 'Answer the current question';end if;
 select max(received_at) into last_answer from private.arena_answers where match_id=mid and user_id=uid;
 if last_answer>now()-interval '750 milliseconds' then raise exception 'Please wait before submitting';end if;
 select correct_index into answer from private.arena_question_keys where match_id=mid and position=idx;
 good:=choice=answer;
 -- A small coarse speed bonus; no client clock or timestamp is trusted.
 pts:=case when good then 100+greatest(0,5-floor(extract(epoch from(now()-coalesce(last_answer,m.starts_at)))/10)::integer) else 0 end;
 insert into private.arena_answers values(mid,uid,idx,choice,good,pts,now());
 update public.multiplayer_matches set
 scores=scores||jsonb_build_object(uid::text,coalesce((scores->>uid::text)::integer,0)+pts),
 correct_counts=correct_counts||jsonb_build_object(uid::text,coalesce((correct_counts->>uid::text)::integer,0)+case when good then 1 else 0 end),
 positions=positions||jsonb_build_object(uid::text,idx+1),
 completed_at=case when idx+1=question_count then completed_at||jsonb_build_object(uid::text,now()) else completed_at end where id=mid;
 perform private.arena_settle(mid);
end $$;
revoke all on function private.arena_play(uuid,text,integer,integer) from public,anon;
grant execute on function private.arena_play(uuid,text,integer,integer) to authenticated;
create function public.arena_play(mid uuid,action text,question_index integer default null,choice integer default null) returns void
language sql security invoker set search_path='' as $$ select private.arena_play(mid,action,question_index,choice) $$;
revoke all on function public.arena_play(uuid,text,integer,integer) from public,anon;
grant execute on function public.arena_play(uuid,text,integer,integer) to authenticated;

create function private.arena_leaderboard() returns table(username text,rating integer,wins integer,losses integer,draws integer)
language sql security definer set search_path='' as $$
 select coalesce(p.username,'Student'),r.rating,r.wins,r.losses,r.draws from public.player_ratings r
 join public.profiles p on p.user_id=r.user_id where auth.uid() is not null and r.wins+r.losses+r.draws>0
 order by r.rating desc,r.wins desc,r.user_id limit 100;
$$;
revoke all on function private.arena_leaderboard() from public,anon;
grant execute on function private.arena_leaderboard() to authenticated;
create function public.arena_leaderboard() returns table(username text,rating integer,wins integer,losses integer,draws integer)
language sql security invoker set search_path='' as $$ select * from private.arena_leaderboard() $$;
revoke all on function public.arena_leaderboard() from public,anon;
grant execute on function public.arena_leaderboard() to authenticated;
-- This publication exists on standard Supabase projects. Apply once via migrations.
alter publication supabase_realtime add table public.multiplayer_matches;
create function public.arena_clock() returns timestamptz language sql stable set search_path='' as $$ select now() where auth.uid() is not null $$;
revoke all on function public.arena_clock() from public,anon;
grant execute on function public.arena_clock() to authenticated;
create function private.arena_question(mid uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.multiplayer_matches; idx integer; q jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 select * into m from public.multiplayer_matches where id=mid;
 if not found or auth.uid() not in(m.player_one,coalesce(m.player_two,m.player_one)) then raise exception 'Match unavailable';end if;
 if m.starts_at is null or now()<m.starts_at or now()>=m.deadline or m.status in('finished','cancelled') then return null;end if;
 idx:=coalesce((m.positions->>auth.uid()::text)::integer,0);
 select content into q from private.arena_question_keys where match_id=mid and position=idx;
 return jsonb_build_object('index',idx,'question',q);
end $$;
revoke all on function private.arena_question(uuid) from public,anon;
grant execute on function private.arena_question(uuid) to authenticated;
create function public.arena_question(mid uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.arena_question(mid) $$;
revoke all on function public.arena_question(uuid) from public,anon;
grant execute on function public.arena_question(uuid) to authenticated;
revoke all on all tables in schema private from public,anon,authenticated;
alter table private.arena_config enable row level security;
alter table private.arena_rate enable row level security;
alter table private.arena_bank enable row level security;
alter table private.arena_answers enable row level security;
alter table private.arena_question_keys enable row level security;
commit;
