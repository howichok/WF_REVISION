create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'revision_entity_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.revision_entity_type as enum ('subtopic', 'material');
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'revision_progress_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.revision_progress_status as enum (
      'not-started',
      'in-progress',
      'completed'
    );
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(trim(nickname)) >= 2),
  email text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_onboarding (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  weak_areas text[] not null default '{}',
  global_focus_note text,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.focus_breakdown_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic_id text not null,
  selected_subtopics text[] not null default '{}',
  free_text_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint focus_breakdown_entries_user_topic_unique unique (user_id, topic_id)
);

create table if not exists public.diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  overall_score integer not null check (overall_score between 0 and 100),
  question_count integer not null default 0 check (question_count >= 0),
  completed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint diagnostic_attempts_id_user_unique unique (id, user_id)
);

create table if not exists public.diagnostic_topic_scores (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic_id text not null,
  topic_label text not null,
  score integer not null check (score >= 0),
  max_score integer not null check (max_score > 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint diagnostic_topic_scores_attempt_topic_unique unique (attempt_id, topic_id),
  constraint diagnostic_topic_scores_attempt_user_fkey
    foreign key (attempt_id, user_id)
    references public.diagnostic_attempts (id, user_id)
    on delete cascade,
  constraint diagnostic_topic_scores_score_within_bounds check (score <= max_score)
);

create table if not exists public.revision_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic_id text not null,
  entity_id text not null,
  entity_type public.revision_entity_type not null,
  status public.revision_progress_status not null default 'not-started',
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  last_interacted_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint revision_progress_user_entity_unique unique (user_id, topic_id, entity_id, entity_type),
  constraint revision_progress_state_consistent check (
    (status = 'not-started' and progress_percent = 0 and completed_at is null) or
    (status = 'in-progress' and progress_percent between 1 and 99 and completed_at is null) or
    (status = 'completed' and progress_percent = 100 and completed_at is not null)
  )
);

create table if not exists public.activity_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_type text not null,
  title text not null,
  topic_id text,
  metadata jsonb not null default '{}'::jsonb,
  minutes_spent integer not null default 0 check (minutes_spent >= 0),
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists diagnostic_attempts_user_completed_idx
  on public.diagnostic_attempts (user_id, completed_at desc);

create index if not exists diagnostic_topic_scores_user_topic_idx
  on public.diagnostic_topic_scores (user_id, topic_id);

create index if not exists revision_progress_user_updated_idx
  on public.revision_progress (user_id, updated_at desc);

create index if not exists activity_history_user_occurred_idx
  on public.activity_history (user_id, occurred_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_onboarding_set_updated_at on public.user_onboarding;
create trigger user_onboarding_set_updated_at
before update on public.user_onboarding
for each row execute function public.set_updated_at();

drop trigger if exists focus_breakdown_entries_set_updated_at on public.focus_breakdown_entries;
create trigger focus_breakdown_entries_set_updated_at
before update on public.focus_breakdown_entries
for each row execute function public.set_updated_at();

drop trigger if exists revision_progress_set_updated_at on public.revision_progress;
create trigger revision_progress_set_updated_at
before update on public.revision_progress
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_nickname text;
begin
  derived_nickname := nullif(trim(coalesce(new.raw_user_meta_data ->> 'nickname', split_part(coalesce(new.email, ''), '@', 1))), '');

  insert into public.profiles (id, nickname, email)
  values (
    new.id,
    coalesce(derived_nickname, 'Student'),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.user_onboarding (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_onboarding enable row level security;
alter table public.focus_breakdown_entries enable row level security;
alter table public.diagnostic_attempts enable row level security;
alter table public.diagnostic_topic_scores enable row level security;
alter table public.revision_progress enable row level security;
alter table public.activity_history enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "user_onboarding_manage_own" on public.user_onboarding;
create policy "user_onboarding_manage_own"
on public.user_onboarding
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "focus_breakdown_manage_own" on public.focus_breakdown_entries;
create policy "focus_breakdown_manage_own"
on public.focus_breakdown_entries
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diagnostic_attempts_manage_own" on public.diagnostic_attempts;
create policy "diagnostic_attempts_manage_own"
on public.diagnostic_attempts
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diagnostic_topic_scores_manage_own" on public.diagnostic_topic_scores;
create policy "diagnostic_topic_scores_manage_own"
on public.diagnostic_topic_scores
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "revision_progress_manage_own" on public.revision_progress;
create policy "revision_progress_manage_own"
on public.revision_progress
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "activity_history_manage_own" on public.activity_history;
create policy "activity_history_manage_own"
on public.activity_history
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
