-- Global serve counts for exam-style questions (shared across all site users).
-- Clients read counts for weighted shuffling; increments go through SECURITY DEFINER RPC.

create table if not exists public.exam_question_global_exposure (
  question_id text primary key,
  serve_count bigint not null default 0 check (serve_count >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists exam_question_global_exposure_updated_idx
  on public.exam_question_global_exposure (updated_at desc);

alter table public.exam_question_global_exposure enable row level security;

drop policy if exists "exam_question_exposure_select_all" on public.exam_question_global_exposure;
create policy "exam_question_exposure_select_all"
on public.exam_question_global_exposure
for select
to anon, authenticated
using (true);

-- Writes: no insert/update policies for anon/authenticated — only
-- public.bump_exam_question_exposure (security definer) mutates rows.

create or replace function public.bump_exam_question_exposure(p_question_ids text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  qid text;
begin
  if p_question_ids is null or cardinality(p_question_ids) = 0 then
    return;
  end if;
  if cardinality(p_question_ids) > 64 then
    raise exception 'too many question ids (max 64)';
  end if;

  foreach qid in array p_question_ids
  loop
    if qid is null or length(trim(qid)) = 0 or length(qid) > 200 then
      continue;
    end if;

    insert into public.exam_question_global_exposure (question_id, serve_count, updated_at)
    values (qid, 1, timezone('utc', now()))
    on conflict (question_id) do update
      set serve_count = public.exam_question_global_exposure.serve_count + 1,
          updated_at = timezone('utc', now());
  end loop;
end;
$$;

revoke all on function public.bump_exam_question_exposure(text[]) from public;
grant execute on function public.bump_exam_question_exposure(text[]) to anon, authenticated;
