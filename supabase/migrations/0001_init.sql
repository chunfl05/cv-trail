-- CV Trail — initial schema (Module 3: 数据模型)
-- Personal single-user app: every table is scoped to auth.uid() via RLS.

create extension if not exists "pgcrypto";

create type experience_type as enum ('internship', 'job', 'project', 'education');
create type application_status as enum ('applied', 'screening', 'interview', 'offer', 'closed');
create type application_event_type as enum ('applied', 'response', 'interview', 'rejection', 'offer', 'followup');
create type application_event_source as enum ('manual', 'gmail');

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- profile: single row per user, main profile
create table profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  links jsonb not null default '{}'::jsonb, -- {linkedin, github, portfolio}
  work_authorization text,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create trigger profile_set_updated_at
  before update on profile
  for each row execute function set_updated_at();

-- experiences: experience library, the AI's memory
create table experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  org text not null,
  role text not null,
  type experience_type not null,
  start_date date,
  end_date date,
  location text,
  summary text,
  tech_stack text[] not null default '{}',
  bullets jsonb not null default '[]'::jsonb, -- [{text, tags}]
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- resumes: resume versions
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null,
  is_base boolean not null default false,
  file_url text,
  content jsonb,
  created_at timestamptz not null default now()
);

-- applications
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null,
  role_title text not null,
  jd_text text,
  jd_url text,
  source text,
  status application_status not null default 'applied',
  applied_date date,
  resume_id uuid references resumes (id) on delete set null,
  match_score int,
  location text,
  salary_range text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger applications_set_updated_at
  before update on applications
  for each row execute function set_updated_at();

-- application_events: timeline
create table application_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  application_id uuid not null references applications (id) on delete cascade,
  type application_event_type not null,
  event_date date not null default current_date,
  note text,
  source application_event_source not null default 'manual',
  created_at timestamptz not null default now()
);

-- tailoring_runs: AI tailoring history
create table tailoring_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  application_id uuid not null references applications (id) on delete cascade,
  jd_keywords jsonb,
  match_score int,
  suggestions jsonb,
  generated_text text,
  created_at timestamptz not null default now()
);

-- email_sync: Gmail sync log
create table email_sync (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  message_id text not null,
  from_addr text,
  subject text,
  received_at timestamptz,
  matched_application_id uuid references applications (id) on delete set null,
  classification text,
  snippet text,
  processed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, message_id)
);

-- Helpful indexes
create index experiences_user_id_idx on experiences (user_id);
create index resumes_user_id_idx on resumes (user_id);
create index applications_user_id_idx on applications (user_id);
create index applications_status_idx on applications (user_id, status);
create index application_events_application_id_idx on application_events (application_id);
create index tailoring_runs_application_id_idx on tailoring_runs (application_id);
create index email_sync_matched_application_id_idx on email_sync (matched_application_id);

-- Row Level Security: every table only allows access to its own user_id
alter table profile enable row level security;
alter table experiences enable row level security;
alter table resumes enable row level security;
alter table applications enable row level security;
alter table application_events enable row level security;
alter table tailoring_runs enable row level security;
alter table email_sync enable row level security;

create policy "own rows only" on profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on experiences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on application_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on tailoring_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows only" on email_sync
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
