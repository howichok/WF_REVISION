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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
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
