-- Full Supabase schema snapshot for the Walthamforest Revision Website.
-- This file consolidates the current migrations into one idempotent script
-- so a fresh Supabase project can be provisioned from the SQL editor.

-- ============================================================================
-- Base app schema
-- Source: 20260310_init.sql
-- ============================================================================

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

-- ============================================================================
-- Diagnostic snapshot columns
-- Source: 20260310_add_diagnostic_snapshot.sql
-- ============================================================================

alter table public.diagnostic_attempts
add column if not exists version integer not null default 1 check (version >= 1);

alter table public.diagnostic_attempts
add column if not exists diagnostic_snapshot jsonb not null default '{}'::jsonb;

-- ============================================================================
-- Curriculum + diagnostic foundation
-- Source: 20260311_curriculum_diagnostic_foundation.sql
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'curriculum_source_kind'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.curriculum_source_kind as enum (
      'specification',
      'textbook',
      'question-bank',
      'past-paper',
      'mark-scheme'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'curriculum_display_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.curriculum_display_type as enum (
      'past-paper',
      'notes',
      'video',
      'worksheet',
      'slides'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'curriculum_question_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.curriculum_question_type as enum (
      'short-open',
      'medium-open',
      'extended-response',
      'scenario',
      'question-bank-section'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'diagnostic_point_status'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.diagnostic_point_status as enum (
      'covered',
      'partial',
      'unassessed',
      'misconception'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'diagnostic_followup_reason'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.diagnostic_followup_reason as enum (
      'missing-point',
      'weak-point',
      'misconception',
      'low-confidence'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'diagnostic_recommendation_type'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.diagnostic_recommendation_type as enum (
      'curriculum-point',
      'material'
    );
  end if;
end
$$;

alter table public.diagnostic_attempts
  add column if not exists version integer not null default 1,
  add column if not exists diagnostic_snapshot jsonb not null default '{}'::jsonb;

alter table public.diagnostic_attempts
  drop constraint if exists diagnostic_attempts_version_positive,
  add constraint diagnostic_attempts_version_positive check (version > 0);

create table if not exists public.curriculum_sources (
  id text primary key,
  title text not null,
  kind public.curriculum_source_kind not null,
  classification text not null check (
    classification in ('primary', 'secondary', 'legacy', 'duplicate')
  ),
  file_path text not null,
  year integer,
  duplicate_of_id text references public.curriculum_sources (id) on delete set null,
  caution text,
  notes text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.curriculum_topics (
  id text primary key,
  label text not null,
  short_label text not null,
  icon text not null,
  description text not null,
  mapping_note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.curriculum_subtopics (
  id text primary key,
  topic_id text not null references public.curriculum_topics (id) on delete cascade,
  label text not null,
  summary text,
  keywords text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.curriculum_points (
  id text primary key,
  code text not null unique,
  title text not null,
  summary text not null,
  source_id text not null references public.curriculum_sources (id) on delete restrict,
  parent_point_id text references public.curriculum_points (id) on delete cascade,
  depth integer not null check (depth between 1 and 5),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.curriculum_topic_points (
  topic_id text not null references public.curriculum_topics (id) on delete cascade,
  point_id text not null references public.curriculum_points (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (topic_id, point_id)
);

create table if not exists public.curriculum_terms (
  id text primary key,
  term text not null unique,
  definition text not null,
  aliases text[] not null default '{}',
  legacy_topic_ids text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.curriculum_point_terms (
  point_id text not null references public.curriculum_points (id) on delete cascade,
  term_id text not null references public.curriculum_terms (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (point_id, term_id)
);

create table if not exists public.curriculum_materials (
  id text primary key,
  source_id text not null references public.curriculum_sources (id) on delete restrict,
  title text not null,
  kind public.curriculum_source_kind not null,
  display_type public.curriculum_display_type not null,
  file_path text not null,
  summary text not null,
  year integer,
  tags text[] not null default '{}',
  legacy_topic_ids text[] not null default '{}',
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.curriculum_point_materials (
  point_id text not null references public.curriculum_points (id) on delete cascade,
  material_id text not null references public.curriculum_materials (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (point_id, material_id)
);

create table if not exists public.curriculum_questions (
  id text primary key,
  source_id text not null references public.curriculum_sources (id) on delete restrict,
  title text not null,
  source_label text not null,
  year integer,
  paper text,
  question_type public.curriculum_question_type not null,
  marks integer check (marks is null or marks >= 0),
  summary text not null,
  expectation text not null,
  practice_prompt text,
  legacy_topic_ids text[] not null default '{}',
  exam_metadata jsonb not null default '{}'::jsonb,
  reviewed boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint curriculum_questions_exam_metadata_object
    check (jsonb_typeof(exam_metadata) = 'object'),
  constraint curriculum_questions_exam_metadata_paper
    check (
      not (exam_metadata ? 'paper')
      or exam_metadata ->> 'paper' in ('paper_1', 'paper_2')
    ),
  constraint curriculum_questions_exam_metadata_command_word
    check (
      not (exam_metadata ? 'commandWord')
      or exam_metadata ->> 'commandWord' in (
        'give',
        'state',
        'name',
        'identify',
        'write',
        'describe',
        'explain',
        'explain with additional justification',
        'discuss',
        'evaluate',
        'draw',
        'complete'
      )
    )
);

create table if not exists public.curriculum_question_points (
  question_id text not null references public.curriculum_questions (id) on delete cascade,
  point_id text not null references public.curriculum_points (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (question_id, point_id)
);

create table if not exists public.curriculum_concepts (
  id text primary key,
  topic_id text not null references public.curriculum_topics (id) on delete cascade,
  subtopic_id text not null references public.curriculum_subtopics (id) on delete cascade,
  question_schema_id text not null,
  label text not null,
  weight integer not null check (weight > 0),
  feedback text not null,
  required_groups jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.curriculum_misconceptions (
  id text primary key,
  topic_id text not null references public.curriculum_topics (id) on delete cascade,
  subtopic_id text not null references public.curriculum_subtopics (id) on delete cascade,
  question_schema_id text not null,
  label text not null,
  explanation text not null,
  penalty integer not null default 0 check (penalty >= 0),
  signal_groups jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.curriculum_practice_prompts (
  id text primary key,
  point_id text references public.curriculum_points (id) on delete cascade,
  subtopic_id text references public.curriculum_subtopics (id) on delete cascade,
  prompt_source text not null,
  prompt_text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint curriculum_practice_prompts_target_check check (
    point_id is not null or subtopic_id is not null
  )
);

create table if not exists public.diagnostic_sessions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic_id text not null references public.curriculum_topics (id) on delete restrict,
  topic_label text not null,
  topic_icon text not null,
  session_mode text not null default 'adaptive-topic' check (
    session_mode in ('adaptive-topic')
  ),
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  engine_version integer not null default 1 check (engine_version > 0),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint diagnostic_sessions_id_user_unique unique (id, user_id),
  constraint diagnostic_sessions_attempt_topic_unique unique (attempt_id, topic_id),
  constraint diagnostic_sessions_attempt_user_fkey
    foreign key (attempt_id, user_id)
    references public.diagnostic_attempts (id, user_id)
    on delete cascade
);

create table if not exists public.diagnostic_freeform_inputs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  answer_text text not null check (char_length(trim(answer_text)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint diagnostic_freeform_inputs_session_unique unique (session_id),
  constraint diagnostic_freeform_inputs_session_user_fkey
    foreign key (session_id, user_id)
    references public.diagnostic_sessions (id, user_id)
    on delete cascade
);

create table if not exists public.diagnostic_followup_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  targeted_subtopic_id text not null references public.curriculum_subtopics (id) on delete restrict,
  reason public.diagnostic_followup_reason not null,
  question_text text not null,
  asked_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint diagnostic_followup_questions_session_sequence_unique unique (session_id, sequence_number),
  constraint diagnostic_followup_questions_session_user_fkey
    foreign key (session_id, user_id)
    references public.diagnostic_sessions (id, user_id)
    on delete cascade
);

create table if not exists public.diagnostic_followup_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  response_text text not null check (char_length(trim(response_text)) > 0),
  responded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint diagnostic_followup_responses_session_sequence_unique unique (session_id, sequence_number),
  constraint diagnostic_followup_responses_session_user_fkey
    foreign key (session_id, user_id)
    references public.diagnostic_sessions (id, user_id)
    on delete cascade,
  constraint diagnostic_followup_responses_question_fkey
    foreign key (session_id, sequence_number)
    references public.diagnostic_followup_questions (session_id, sequence_number)
    on delete cascade
);

create table if not exists public.diagnostic_point_assessments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  subtopic_id text not null references public.curriculum_subtopics (id) on delete restrict,
  point_label text not null,
  status public.diagnostic_point_status not null,
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  matched_terms text[] not null default '{}',
  missing_terms text[] not null default '{}',
  evidence text[] not null default '{}',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint diagnostic_point_assessments_session_point_unique unique (session_id, subtopic_id),
  constraint diagnostic_point_assessments_session_user_fkey
    foreign key (session_id, user_id)
    references public.diagnostic_sessions (id, user_id)
    on delete cascade
);

create table if not exists public.diagnostic_session_misconceptions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  subtopic_id text not null references public.curriculum_subtopics (id) on delete restrict,
  curriculum_misconception_id text not null references public.curriculum_misconceptions (id) on delete restrict,
  label text not null,
  explanation text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint diagnostic_session_misconceptions_session_key_unique unique (
    session_id,
    subtopic_id,
    curriculum_misconception_id
  ),
  constraint diagnostic_session_misconceptions_session_user_fkey
    foreign key (session_id, user_id)
    references public.diagnostic_sessions (id, user_id)
    on delete cascade
);

create table if not exists public.diagnostic_recommendations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  sequence_number integer not null check (sequence_number > 0),
  recommendation_type public.diagnostic_recommendation_type not null,
  target_subtopic_id text references public.curriculum_subtopics (id) on delete restrict,
  target_material_id text references public.curriculum_materials (id) on delete restrict,
  label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint diagnostic_recommendations_session_sequence_unique unique (
    session_id,
    sequence_number
  ),
  constraint diagnostic_recommendations_target_check check (
    (recommendation_type = 'curriculum-point' and target_subtopic_id is not null and target_material_id is null) or
    (recommendation_type = 'material' and target_material_id is not null and target_subtopic_id is null)
  ),
  constraint diagnostic_recommendations_session_user_fkey
    foreign key (session_id, user_id)
    references public.diagnostic_sessions (id, user_id)
    on delete cascade
);

create index if not exists curriculum_topics_sort_idx
  on public.curriculum_topics (sort_order);

create index if not exists curriculum_subtopics_topic_sort_idx
  on public.curriculum_subtopics (topic_id, sort_order);

create index if not exists curriculum_points_parent_sort_idx
  on public.curriculum_points (parent_point_id, sort_order);

create index if not exists curriculum_topic_points_point_idx
  on public.curriculum_topic_points (point_id, topic_id);

create index if not exists curriculum_point_terms_term_idx
  on public.curriculum_point_terms (term_id, point_id);

create index if not exists curriculum_materials_kind_year_idx
  on public.curriculum_materials (kind, year desc);

create index if not exists curriculum_point_materials_material_idx
  on public.curriculum_point_materials (material_id, point_id);

create index if not exists curriculum_questions_year_type_idx
  on public.curriculum_questions (year desc, question_type);

create index if not exists curriculum_question_points_point_idx
  on public.curriculum_question_points (point_id, question_id);

create index if not exists curriculum_concepts_subtopic_idx
  on public.curriculum_concepts (subtopic_id, question_schema_id);

create index if not exists curriculum_misconceptions_subtopic_idx
  on public.curriculum_misconceptions (subtopic_id, question_schema_id);

create index if not exists curriculum_practice_prompts_point_idx
  on public.curriculum_practice_prompts (point_id, subtopic_id, sort_order);

create index if not exists diagnostic_sessions_user_completed_idx
  on public.diagnostic_sessions (user_id, completed_at desc);

create index if not exists diagnostic_sessions_attempt_idx
  on public.diagnostic_sessions (attempt_id, topic_id);

create index if not exists diagnostic_followup_questions_session_idx
  on public.diagnostic_followup_questions (session_id, sequence_number);

create index if not exists diagnostic_followup_responses_session_idx
  on public.diagnostic_followup_responses (session_id, sequence_number);

create index if not exists diagnostic_point_assessments_subtopic_idx
  on public.diagnostic_point_assessments (user_id, subtopic_id);

create index if not exists diagnostic_recommendations_type_idx
  on public.diagnostic_recommendations (user_id, recommendation_type);

drop trigger if exists curriculum_sources_set_updated_at on public.curriculum_sources;
create trigger curriculum_sources_set_updated_at
before update on public.curriculum_sources
for each row execute function public.set_updated_at();

drop trigger if exists curriculum_topics_set_updated_at on public.curriculum_topics;
create trigger curriculum_topics_set_updated_at
before update on public.curriculum_topics
for each row execute function public.set_updated_at();

drop trigger if exists curriculum_subtopics_set_updated_at on public.curriculum_subtopics;
create trigger curriculum_subtopics_set_updated_at
before update on public.curriculum_subtopics
for each row execute function public.set_updated_at();

drop trigger if exists curriculum_points_set_updated_at on public.curriculum_points;
create trigger curriculum_points_set_updated_at
before update on public.curriculum_points
for each row execute function public.set_updated_at();

drop trigger if exists curriculum_terms_set_updated_at on public.curriculum_terms;
create trigger curriculum_terms_set_updated_at
before update on public.curriculum_terms
for each row execute function public.set_updated_at();

drop trigger if exists curriculum_materials_set_updated_at on public.curriculum_materials;
create trigger curriculum_materials_set_updated_at
before update on public.curriculum_materials
for each row execute function public.set_updated_at();

drop trigger if exists curriculum_questions_set_updated_at on public.curriculum_questions;
create trigger curriculum_questions_set_updated_at
before update on public.curriculum_questions
for each row execute function public.set_updated_at();

drop trigger if exists curriculum_concepts_set_updated_at on public.curriculum_concepts;
create trigger curriculum_concepts_set_updated_at
before update on public.curriculum_concepts
for each row execute function public.set_updated_at();

drop trigger if exists curriculum_misconceptions_set_updated_at on public.curriculum_misconceptions;
create trigger curriculum_misconceptions_set_updated_at
before update on public.curriculum_misconceptions
for each row execute function public.set_updated_at();

drop trigger if exists diagnostic_sessions_set_updated_at on public.diagnostic_sessions;
create trigger diagnostic_sessions_set_updated_at
before update on public.diagnostic_sessions
for each row execute function public.set_updated_at();

alter table public.curriculum_sources enable row level security;
alter table public.curriculum_topics enable row level security;
alter table public.curriculum_subtopics enable row level security;
alter table public.curriculum_points enable row level security;
alter table public.curriculum_topic_points enable row level security;
alter table public.curriculum_terms enable row level security;
alter table public.curriculum_point_terms enable row level security;
alter table public.curriculum_materials enable row level security;
alter table public.curriculum_point_materials enable row level security;
alter table public.curriculum_questions enable row level security;
alter table public.curriculum_question_points enable row level security;
alter table public.curriculum_concepts enable row level security;
alter table public.curriculum_misconceptions enable row level security;
alter table public.curriculum_practice_prompts enable row level security;
alter table public.diagnostic_sessions enable row level security;
alter table public.diagnostic_freeform_inputs enable row level security;
alter table public.diagnostic_followup_questions enable row level security;
alter table public.diagnostic_followup_responses enable row level security;
alter table public.diagnostic_point_assessments enable row level security;
alter table public.diagnostic_session_misconceptions enable row level security;
alter table public.diagnostic_recommendations enable row level security;

drop policy if exists "curriculum_sources_read_authenticated" on public.curriculum_sources;
create policy "curriculum_sources_read_authenticated"
on public.curriculum_sources
for select
to authenticated
using (true);

drop policy if exists "curriculum_topics_read_authenticated" on public.curriculum_topics;
create policy "curriculum_topics_read_authenticated"
on public.curriculum_topics
for select
to authenticated
using (true);

drop policy if exists "curriculum_subtopics_read_authenticated" on public.curriculum_subtopics;
create policy "curriculum_subtopics_read_authenticated"
on public.curriculum_subtopics
for select
to authenticated
using (true);

drop policy if exists "curriculum_points_read_authenticated" on public.curriculum_points;
create policy "curriculum_points_read_authenticated"
on public.curriculum_points
for select
to authenticated
using (true);

drop policy if exists "curriculum_topic_points_read_authenticated" on public.curriculum_topic_points;
create policy "curriculum_topic_points_read_authenticated"
on public.curriculum_topic_points
for select
to authenticated
using (true);

drop policy if exists "curriculum_terms_read_authenticated" on public.curriculum_terms;
create policy "curriculum_terms_read_authenticated"
on public.curriculum_terms
for select
to authenticated
using (true);

drop policy if exists "curriculum_point_terms_read_authenticated" on public.curriculum_point_terms;
create policy "curriculum_point_terms_read_authenticated"
on public.curriculum_point_terms
for select
to authenticated
using (true);

drop policy if exists "curriculum_materials_read_authenticated" on public.curriculum_materials;
create policy "curriculum_materials_read_authenticated"
on public.curriculum_materials
for select
to authenticated
using (true);

drop policy if exists "curriculum_point_materials_read_authenticated" on public.curriculum_point_materials;
create policy "curriculum_point_materials_read_authenticated"
on public.curriculum_point_materials
for select
to authenticated
using (true);

drop policy if exists "curriculum_questions_read_authenticated" on public.curriculum_questions;
create policy "curriculum_questions_read_authenticated"
on public.curriculum_questions
for select
to authenticated
using (true);

drop policy if exists "curriculum_question_points_read_authenticated" on public.curriculum_question_points;
create policy "curriculum_question_points_read_authenticated"
on public.curriculum_question_points
for select
to authenticated
using (true);

drop policy if exists "curriculum_concepts_read_authenticated" on public.curriculum_concepts;
create policy "curriculum_concepts_read_authenticated"
on public.curriculum_concepts
for select
to authenticated
using (true);

drop policy if exists "curriculum_misconceptions_read_authenticated" on public.curriculum_misconceptions;
create policy "curriculum_misconceptions_read_authenticated"
on public.curriculum_misconceptions
for select
to authenticated
using (true);

drop policy if exists "curriculum_practice_prompts_read_authenticated" on public.curriculum_practice_prompts;
create policy "curriculum_practice_prompts_read_authenticated"
on public.curriculum_practice_prompts
for select
to authenticated
using (true);

-- Shared curriculum content is non-user-specific and is loaded through a
-- cookie-less anon Supabase client for cacheability.
drop policy if exists "curriculum_sources_read_anon" on public.curriculum_sources;
create policy "curriculum_sources_read_anon"
on public.curriculum_sources
for select
to anon
using (true);

drop policy if exists "curriculum_topics_read_anon" on public.curriculum_topics;
create policy "curriculum_topics_read_anon"
on public.curriculum_topics
for select
to anon
using (true);

drop policy if exists "curriculum_subtopics_read_anon" on public.curriculum_subtopics;
create policy "curriculum_subtopics_read_anon"
on public.curriculum_subtopics
for select
to anon
using (true);

drop policy if exists "curriculum_points_read_anon" on public.curriculum_points;
create policy "curriculum_points_read_anon"
on public.curriculum_points
for select
to anon
using (true);

drop policy if exists "curriculum_topic_points_read_anon" on public.curriculum_topic_points;
create policy "curriculum_topic_points_read_anon"
on public.curriculum_topic_points
for select
to anon
using (true);

drop policy if exists "curriculum_terms_read_anon" on public.curriculum_terms;
create policy "curriculum_terms_read_anon"
on public.curriculum_terms
for select
to anon
using (true);

drop policy if exists "curriculum_point_terms_read_anon" on public.curriculum_point_terms;
create policy "curriculum_point_terms_read_anon"
on public.curriculum_point_terms
for select
to anon
using (true);

drop policy if exists "curriculum_materials_read_anon" on public.curriculum_materials;
create policy "curriculum_materials_read_anon"
on public.curriculum_materials
for select
to anon
using (true);

drop policy if exists "curriculum_point_materials_read_anon" on public.curriculum_point_materials;
create policy "curriculum_point_materials_read_anon"
on public.curriculum_point_materials
for select
to anon
using (true);

drop policy if exists "curriculum_questions_read_anon" on public.curriculum_questions;
create policy "curriculum_questions_read_anon"
on public.curriculum_questions
for select
to anon
using (true);

drop policy if exists "curriculum_question_points_read_anon" on public.curriculum_question_points;
create policy "curriculum_question_points_read_anon"
on public.curriculum_question_points
for select
to anon
using (true);

drop policy if exists "curriculum_concepts_read_anon" on public.curriculum_concepts;
create policy "curriculum_concepts_read_anon"
on public.curriculum_concepts
for select
to anon
using (true);

drop policy if exists "curriculum_misconceptions_read_anon" on public.curriculum_misconceptions;
create policy "curriculum_misconceptions_read_anon"
on public.curriculum_misconceptions
for select
to anon
using (true);

drop policy if exists "curriculum_practice_prompts_read_anon" on public.curriculum_practice_prompts;
create policy "curriculum_practice_prompts_read_anon"
on public.curriculum_practice_prompts
for select
to anon
using (true);

drop policy if exists "diagnostic_sessions_manage_own" on public.diagnostic_sessions;
create policy "diagnostic_sessions_manage_own"
on public.diagnostic_sessions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diagnostic_freeform_inputs_manage_own" on public.diagnostic_freeform_inputs;
create policy "diagnostic_freeform_inputs_manage_own"
on public.diagnostic_freeform_inputs
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diagnostic_followup_questions_manage_own" on public.diagnostic_followup_questions;
create policy "diagnostic_followup_questions_manage_own"
on public.diagnostic_followup_questions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diagnostic_followup_responses_manage_own" on public.diagnostic_followup_responses;
create policy "diagnostic_followup_responses_manage_own"
on public.diagnostic_followup_responses
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diagnostic_point_assessments_manage_own" on public.diagnostic_point_assessments;
create policy "diagnostic_point_assessments_manage_own"
on public.diagnostic_point_assessments
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diagnostic_session_misconceptions_manage_own" on public.diagnostic_session_misconceptions;
create policy "diagnostic_session_misconceptions_manage_own"
on public.diagnostic_session_misconceptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "diagnostic_recommendations_manage_own" on public.diagnostic_recommendations;
create policy "diagnostic_recommendations_manage_own"
on public.diagnostic_recommendations
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ============================================================================
-- Practice-set progress support
-- Source: 20260312_add_practice_set_progress.sql
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'practice-set'
      and enumtypid = 'public.revision_entity_type'::regtype
  ) then
    alter type public.revision_entity_type add value 'practice-set';
  end if;
end
$$;

-- ============================================================================
-- Topic coaching memory
-- Source: 20260402_add_topic_coaching_memory.sql
-- ============================================================================

create table if not exists public.topic_coaching_memory (
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic_id text not null,
  memory_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint topic_coaching_memory_pkey primary key (user_id, topic_id)
);

create index if not exists topic_coaching_memory_user_updated_idx
  on public.topic_coaching_memory (user_id, updated_at desc);

drop trigger if exists topic_coaching_memory_set_updated_at on public.topic_coaching_memory;
create trigger topic_coaching_memory_set_updated_at
before update on public.topic_coaching_memory
for each row execute function public.set_updated_at();

alter table public.topic_coaching_memory enable row level security;

drop policy if exists "topic_coaching_memory_manage_own" on public.topic_coaching_memory;
create policy "topic_coaching_memory_manage_own"
on public.topic_coaching_memory
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ============================================================================
-- Practice analytics (events, SRS, rollups, weekly MV)
-- Source: 20260411_revision_practice_analytics.sql
-- ============================================================================

create table if not exists public.revision_practice_tags (
  id uuid primary key default gen_random_uuid(),
  topic_id text,
  code text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists revision_practice_tags_global_code_unique
  on public.revision_practice_tags (code)
  where topic_id is null;

create unique index if not exists revision_practice_tags_scoped_code_unique
  on public.revision_practice_tags (topic_id, code)
  where topic_id is not null;

create index if not exists revision_practice_tags_topic_idx
  on public.revision_practice_tags (topic_id, sort_order);

create table if not exists public.revision_practice_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  occurred_at timestamptz not null default timezone('utc', now()),
  topic_id text not null,
  question_id text not null,
  question_kind text not null,
  session_id uuid not null,
  source text not null default 'quick_quiz',
  correct boolean not null,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  verdict text,
  tag_codes text[] not null default '{}'::text[],
  is_revision_attempt boolean not null default false,
  weekly_plan_id uuid,
  srs_snapshot jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb
);

create index if not exists revision_practice_events_user_occurred_idx
  on public.revision_practice_events (user_id, occurred_at desc);

create index if not exists revision_practice_events_user_topic_occurred_idx
  on public.revision_practice_events (user_id, topic_id, occurred_at desc);

create index if not exists revision_practice_events_session_idx
  on public.revision_practice_events (session_id);

create table if not exists public.revision_srs_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  deck text not null,
  item_key text not null,
  ease real not null default 2.5,
  interval_days real not null default 0,
  repetitions integer not null default 0,
  due_on date not null default (timezone('utc', now()))::date,
  last_grade smallint,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint revision_srs_items_pkey primary key (user_id, deck, item_key),
  constraint revision_srs_items_ease_positive check (ease > 0),
  constraint revision_srs_items_interval_non_negative check (interval_days >= 0),
  constraint revision_srs_items_reps_non_negative check (repetitions >= 0)
);

drop trigger if exists revision_srs_items_set_updated_at on public.revision_srs_items;
create trigger revision_srs_items_set_updated_at
before update on public.revision_srs_items
for each row execute function public.set_updated_at();

create index if not exists revision_srs_items_user_due_idx
  on public.revision_srs_items (user_id, due_on);

create table if not exists public.revision_historical_rollup (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  topic_id text not null,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint revision_historical_rollup_period_unique unique (user_id, period_start, topic_id)
);

create index if not exists revision_historical_rollup_user_idx
  on public.revision_historical_rollup (user_id, period_start desc);

drop materialized view if exists public.revision_user_week_stats;
create materialized view public.revision_user_week_stats as
select
  e.user_id,
  (date_trunc('week', e.occurred_at at time zone 'UTC') at time zone 'UTC')::date as week_start,
  e.topic_id,
  count(*)::bigint as event_count,
  count(*) filter (where e.correct)::bigint as correct_count,
  count(*) filter (where not e.correct)::bigint as wrong_count,
  count(*) filter (where e.is_revision_attempt)::bigint as revision_attempt_count
from public.revision_practice_events e
group by e.user_id, (date_trunc('week', e.occurred_at at time zone 'UTC') at time zone 'UTC')::date, e.topic_id;

create unique index if not exists revision_user_week_stats_unique_idx
  on public.revision_user_week_stats (user_id, week_start, topic_id);

refresh materialized view public.revision_user_week_stats;

revoke all on public.revision_user_week_stats from public;

create or replace function public.refresh_revision_user_week_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.revision_user_week_stats;
end;
$$;

create or replace function public.archive_revision_practice_events_before(p_cutoff timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted bigint;
  v_deleted bigint;
begin
  insert into public.revision_historical_rollup (user_id, period_start, period_end, topic_id, stats)
  select
    e.user_id,
    (date_trunc('month', e.occurred_at at time zone 'UTC') at time zone 'UTC')::date as period_start,
    ((date_trunc('month', e.occurred_at at time zone 'UTC') + interval '1 month - 1 day')
      at time zone 'UTC')::date as period_end,
    e.topic_id,
    jsonb_build_object(
      'event_count', count(*),
      'correct_count', count(*) filter (where e.correct),
      'wrong_count', count(*) filter (where not e.correct),
      'revision_attempt_count', count(*) filter (where e.is_revision_attempt),
      'source', 'archive_revision_practice_events_before'
    )
  from public.revision_practice_events e
  where e.occurred_at < p_cutoff
  group by
    e.user_id,
    (date_trunc('month', e.occurred_at at time zone 'UTC') at time zone 'UTC')::date,
    ((date_trunc('month', e.occurred_at at time zone 'UTC') + interval '1 month - 1 day')
      at time zone 'UTC')::date,
    e.topic_id
  on conflict (user_id, period_start, topic_id) do update
  set
    period_end = excluded.period_end,
    stats = public.revision_historical_rollup.stats || excluded.stats;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  with deleted as (
    delete from public.revision_practice_events e
    where e.occurred_at < p_cutoff
    returning 1
  )
  select count(*) into v_deleted from deleted;

  return jsonb_build_object(
    'inserted_or_merged_monthly_rows', coalesce(v_inserted, 0),
    'deleted_events', coalesce(v_deleted, 0),
    'cutoff', p_cutoff
  );
end;
$$;

create or replace function public.get_revision_user_week_stats()
returns setof public.revision_user_week_stats
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.revision_user_week_stats
  where user_id = auth.uid();
$$;

revoke all on function public.refresh_revision_user_week_stats() from public;
revoke all on function public.archive_revision_practice_events_before(timestamptz) from public;
revoke all on function public.get_revision_user_week_stats() from public;

grant execute on function public.refresh_revision_user_week_stats() to service_role;
grant execute on function public.archive_revision_practice_events_before(timestamptz) to service_role;
grant execute on function public.get_revision_user_week_stats() to authenticated;

insert into public.revision_practice_tags (topic_id, code, label, description, sort_order)
select v.topic_id, v.code, v.label, v.description, v.sort_order
from (
  values
    (null::text, 'stable_retrieval'::text, 'Stable retrieval'::text, 'Answer matched expected retrieval.'::text, 10),
    (null, 'minor_gap', 'Minor gap', 'Mostly correct with small omissions.', 20),
    (null, 'retrieval_gap', 'Retrieval gap', 'Partial recall or incomplete answer.', 30),
    (null, 'misconception', 'Misconception', 'Incorrect or misleading understanding.', 40),
    (null, 'terminology', 'Terminology', 'Vocabulary / definition precision.', 50),
    (null, 'applied_reasoning', 'Applied reasoning', 'Paper 2 style application.', 60)
) as v(topic_id, code, label, description, sort_order)
where not exists (
  select 1
  from public.revision_practice_tags t
  where t.code = v.code
    and t.topic_id is not distinct from v.topic_id
);

alter table public.revision_practice_tags enable row level security;

drop policy if exists "revision_practice_tags_select_all" on public.revision_practice_tags;
create policy "revision_practice_tags_select_all"
on public.revision_practice_tags
for select
to authenticated
using (true);

alter table public.revision_practice_events enable row level security;

drop policy if exists "revision_practice_events_select_own" on public.revision_practice_events;
create policy "revision_practice_events_select_own"
on public.revision_practice_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "revision_practice_events_insert_own" on public.revision_practice_events;
create policy "revision_practice_events_insert_own"
on public.revision_practice_events
for insert
to authenticated
with check (auth.uid() = user_id);

alter table public.revision_srs_items enable row level security;

drop policy if exists "revision_srs_items_manage_own" on public.revision_srs_items;
create policy "revision_srs_items_manage_own"
on public.revision_srs_items
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.revision_historical_rollup enable row level security;

drop policy if exists "revision_historical_rollup_select_own" on public.revision_historical_rollup;
create policy "revision_historical_rollup_select_own"
on public.revision_historical_rollup
for select
to authenticated
using (auth.uid() = user_id);

