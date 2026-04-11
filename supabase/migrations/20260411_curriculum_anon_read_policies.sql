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
