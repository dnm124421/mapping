-- =========================================================
-- Roadmap Planner schema (Supabase / Postgres)
-- =========================================================

create extension if not exists pgcrypto;

-- Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'Asia/Kolkata',
  preferred_ai text not null default 'chatgpt'
    check (preferred_ai in ('chatgpt','claude','gemini','other')),
  settings jsonb not null default '{}'::jsonb,   -- onboarded, rest_days, tone, buffer, custom_instructions...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Skills table
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  level text check (level in ('beginner','intermediate','advanced')),
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

-- Roadmaps table
create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  version int not null default 1,
  schema_version int not null default 1,
  data jsonb not null,                -- validated Roadmap JSON (Section 10)
  daily_minutes int,
  created_at timestamptz not null default now()
);

-- Topic Progress table
create table if not exists public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  topic_id text not null,
  done boolean not null default false,
  done_at timestamptz,
  notes text,
  updated_at timestamptz not null default now(),
  unique (roadmap_id, topic_id)
);

-- Plans table
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  start_date date not null,
  deadline date not null,
  daily_minutes int not null default 120,
  rest_days int[] not null default '{}',     -- 0=Sun ... 6=Sat
  status text not null default 'active' check (status in ('active','paused','completed','archived')),
  created_at timestamptz not null default now(),
  check (deadline >= start_date)
);

-- Plan Chunks (30-day sprints)
create table if not exists public.plan_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  number int not null,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('active','completed')),
  summary jsonb,            -- stats snapshot written at chunk end
  reflection text,
  created_at timestamptz not null default now(),
  unique (plan_id, number)
);

-- Plan Days
create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chunk_id uuid not null references public.plan_chunks(id) on delete cascade,
  day_number int not null,
  date date not null,
  focus text,
  unique (chunk_id, day_number)
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  day_id uuid references public.plan_days(id) on delete cascade,
  title text not null,
  description text,
  est_minutes int not null default 30 check (est_minutes between 1 and 600),
  roadmap_ref text,
  kind text,
  checklist jsonb not null default '[]'::jsonb,   -- [{ "text": "...", "done": false }]
  status text not null default 'todo' check (status in ('todo','done','moved')),
  scheduled_date date not null,
  original_date date,
  completed_at timestamptz,
  notes text,
  position int not null default 0,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

-- Focus Sessions
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  planned_minutes int,
  actual_minutes int
);

-- Daily Logs & Scratchpads
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  note text,
  scratchpad text,
  unique (user_id, log_date)
);

-- Indexes for high performance
create index if not exists idx_skills_user on public.skills (user_id);
create index if not exists idx_roadmaps_user_skill on public.roadmaps (user_id, skill_id);
create index if not exists idx_topic_progress_user_roadmap on public.topic_progress (user_id, roadmap_id);
create index if not exists idx_plans_user_status on public.plans (user_id, status);
create index if not exists idx_plan_chunks_plan_status on public.plan_chunks (plan_id, status);
create index if not exists idx_plan_days_chunk_date on public.plan_days (chunk_id, date);
create index if not exists idx_tasks_user_date on public.tasks (user_id, scheduled_date);
create index if not exists idx_tasks_plan_date on public.tasks (plan_id, scheduled_date);
create index if not exists idx_focus_sessions_user_time on public.focus_sessions (user_id, started_at);

-- =========================================================
-- Row Level Security (RLS)
-- =========================================================

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (id = (select auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare t text;
begin
  foreach t in array array['skills','roadmaps','topic_progress','plans','plan_chunks',
                           'plan_days','tasks','focus_sessions','daily_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s_own_all" on public.%1$I', t);
    execute format(
      'create policy "%1$s_own_all" on public.%1$I for all
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- =========================================================
-- Create a profile automatically on first sign-in
-- =========================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Atomic import of one 30-day chunk (runs with caller RLS)
-- =========================================================
create or replace function public.import_plan_chunk(p_plan_id uuid, p_payload jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_chunk_id uuid; v_day_id uuid;
  v_day jsonb; v_task jsonb; v_pos int;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.plans where id = p_plan_id and user_id = v_user) then
    raise exception 'plan not found';
  end if;

  update public.plan_chunks set status = 'completed'
   where plan_id = p_plan_id and user_id = v_user and status = 'active';

  insert into public.plan_chunks (user_id, plan_id, number, start_date, end_date, status)
  values (v_user, p_plan_id,
          (p_payload->'chunk'->>'number')::int,
          (p_payload->'days'->0->>'date')::date,
          (p_payload->'days'->-1->>'date')::date,
          'active')
  returning id into v_chunk_id;

  for v_day in select value from jsonb_array_elements(p_payload->'days') loop
    insert into public.plan_days (user_id, chunk_id, day_number, date, focus)
    values (v_user, v_chunk_id, (v_day->>'day')::int, (v_day->>'date')::date, v_day->>'focus')
    returning id into v_day_id;

    v_pos := 0;
    for v_task in select value from jsonb_array_elements(v_day->'tasks') loop
      insert into public.tasks (user_id, plan_id, day_id, title, description, est_minutes,
                                roadmap_ref, kind, checklist, scheduled_date, position)
      values (v_user, p_plan_id, v_day_id, v_task->>'title', v_task->>'description',
              coalesce((v_task->>'est_minutes')::int, 30), v_task->>'roadmap_ref', v_task->>'kind',
              coalesce(v_task->'checklist', '[]'::jsonb), (v_day->>'date')::date, v_pos);
      v_pos := v_pos + 1;
    end loop;
  end loop;

  return v_chunk_id;
end $$;
