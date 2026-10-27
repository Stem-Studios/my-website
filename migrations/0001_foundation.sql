-- Optional future Supabase migration. Never run automatically in demo mode.
-- Scoring must use a trusted backend before activating this adapter.
create table public.app_users (id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table public.profiles (user_id uuid primary key references public.app_users(id) on delete cascade, name text not null, exam text not null check (exam in ('TMUA','ESAT')), modules jsonb not null, target_score integer not null check (target_score between 1 and 9), exam_date text not null, weekly_hours integer not null check (weekly_hours between 1 and 40), assessment jsonb not null);
create table public.syllabus_topics (id text primary key, exam text not null, module text not null, name text not null);
create index topics_exam_idx on public.syllabus_topics(exam,module);
create table public.exam_configurations (id uuid primary key default gen_random_uuid(), name text not null, version integer not null, definition jsonb not null, official boolean not null default false, source_url text, verified_at timestamptz, unique(name,version));
create table public.questions (id text primary key, topic_id text references public.syllabus_topics(id), exam text not null, module text not null, difficulty text not null, content jsonb not null, provenance text not null, verified boolean not null default false, version integer not null default 1);
create index question_filter_idx on public.questions(exam,module,difficulty);
create table public.question_options (id uuid primary key default gen_random_uuid(), question_id text not null references public.questions(id) on delete cascade, position integer not null, content text not null, unique(question_id,position));
create table public.question_solutions (question_id text primary key references public.questions(id) on delete cascade, correct_index integer not null, solution text not null, hints jsonb not null);
create table public.practice_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, mode text not null, state jsonb not null, deadline timestamptz, finished boolean not null default false, created_at timestamptz not null default now());
create index session_owner_idx on public.practice_sessions(user_id,created_at);
create table public.question_attempts (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, session_id uuid not null references public.practice_sessions(id) on delete cascade, question_id text not null references public.questions(id), selected integer not null, correct boolean not null, seconds integer not null check(seconds>=0), created_at timestamptz not null default now(), unique(session_id,question_id));
create index attempt_owner_topic_idx on public.question_attempts(user_id,question_id);
create table public.study_plans (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, configuration jsonb not null, created_at timestamptz not null default now());
create table public.study_tasks (id uuid primary key default gen_random_uuid(), plan_id uuid not null references public.study_plans(id) on delete cascade, user_id uuid not null references public.app_users(id) on delete cascade, title text not null, topic text not null, minutes integer not null, date text not null, done boolean not null default false);
create index tasks_owner_date_idx on public.study_tasks(user_id,date);
create table public.topic_mastery (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade, topic_id text not null references public.syllabus_topics(id), evidence jsonb not null, unique(user_id,topic_id));
create table public.resources (id uuid primary key default gen_random_uuid(), user_id uuid references public.app_users(id) on delete cascade, title text not null, description text not null, exam text, topic text, type text not null, url text, attribution text not null, verified_at timestamptz);
alter table public.app_users enable row level security;
create policy self_user on public.app_users for select to authenticated using(id=auth.uid());
alter table public.profiles enable row level security;
create policy self_profile on public.profiles for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table public.practice_sessions enable row level security;
create policy read_sessions on public.practice_sessions for select to authenticated using(user_id=auth.uid());
alter table public.question_attempts enable row level security;
create policy read_attempts on public.question_attempts for select to authenticated using(user_id=auth.uid());
-- Sessions and attempts have no client write policies. A trusted API owns scoring.
alter table public.study_plans enable row level security;
create policy self_plans on public.study_plans for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
alter table public.study_tasks enable row level security;
create policy self_tasks on public.study_tasks for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.study_plans p where p.id=plan_id and p.user_id=auth.uid()));
alter table public.topic_mastery enable row level security;
create policy read_mastery on public.topic_mastery for select to authenticated using(user_id=auth.uid());
alter table public.questions enable row level security;
create policy verified_questions on public.questions for select to authenticated using(verified);
alter table public.question_options enable row level security;
create policy verified_options on public.question_options for select to authenticated using(exists(select 1 from public.questions q where q.id=question_id and q.verified));
alter table public.question_solutions enable row level security;
-- No solution read policy: hints and post-submission feedback need a trusted API.
alter table public.syllabus_topics enable row level security;
create policy read_topics on public.syllabus_topics for select to authenticated using(true);
alter table public.exam_configurations enable row level security;
create policy read_formats on public.exam_configurations for select to authenticated using(true);
alter table public.resources enable row level security;
create policy read_resources on public.resources for select to authenticated using(user_id=auth.uid() or (user_id is null and verified_at is not null));
create policy own_resources on public.resources for insert to authenticated with check(user_id=auth.uid());
