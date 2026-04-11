-- Practice / quiz analytics: append-only events, tag ontology, SRS state,
-- historical rollups, weekly materialized stats, safe read RPCs.

-- ---------------------------------------------------------------------------
-- Tag ontology (global codes; optional topic_id for topic-scoped tags later)
-- ---------------------------------------------------------------------------
create table if not exists public.revision_practice_tags (
  id uuid primary key default gen_random_uuid(),
  topic_id text,
  code text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- PG treats NULLs as distinct in UNIQUE(topic_id, code); use partial indexes instead.
create unique index if not exists revision_practice_tags_global_code_unique
  on public.revision_practice_tags (code)
  where topic_id is null;

create unique index if not exists revision_practice_tags_scoped_code_unique
  on public.revision_practice_tags (topic_id, code)
  where topic_id is not null;

create index if not exists revision_practice_tags_topic_idx
  on public.revision_practice_tags (topic_id, sort_order);

-- ---------------------------------------------------------------------------
-- Append-only practice events
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- SRS / spaced repetition item state (per user, deck, item)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Historical aggregates (after cold storage / retention job)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Weekly aggregates (materialized; refresh CONCURRENTLY from cron / SQL)
-- ---------------------------------------------------------------------------
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

-- Initial populate (empty events → empty MV is fine)
refresh materialized view public.revision_user_week_stats;

revoke all on public.revision_user_week_stats from public;

-- ---------------------------------------------------------------------------
-- Maintenance functions (service_role / dashboard SQL only)
-- ---------------------------------------------------------------------------
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

-- Safe read paths for clients (MV has no RLS)
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

-- ---------------------------------------------------------------------------
-- Seed global taxonomy (extend via migrations or admin tooling)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- pg_cron (optional): enable in Supabase dashboard if available, then:
-- select cron.schedule(
--   'refresh-revision-user-week-stats',
--   '30 3 * * 0',
--   $$select public.refresh_revision_user_week_stats();$$
-- );
-- ---------------------------------------------------------------------------
