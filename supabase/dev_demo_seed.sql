-- Demo app-state seed for one existing Supabase auth user.
-- Run this after full_site_bootstrap.sql or after full_site_schema.sql + full_site_seed.sql.
-- Replace demo_user_id with an existing auth.users id before running.

do $$
declare
  demo_user_id uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  demo_email text := 'demo.student@example.com';
  demo_nickname text := 'Demo Student';
  demo_attempt_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  demo_session_id uuid := '22222222-2222-2222-2222-222222222222'::uuid;
begin
  if demo_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'Replace demo_user_id in dev_demo_seed.sql with an existing auth.users id before running this seed.';
  end if;

  if not exists (select 1 from auth.users where id = demo_user_id) then
    raise exception 'No auth.users row exists for the chosen demo_user_id. Create/sign in the user first, then rerun the seed.';
  end if;

  if not exists (select 1 from public.curriculum_sources limit 1) then
    raise exception 'Shared curriculum data is missing. Run full_site_seed.sql or full_site_bootstrap.sql before this demo seed.';
  end if;

  delete from public.topic_coaching_memory where user_id = demo_user_id;
  delete from public.activity_history where user_id = demo_user_id;
  delete from public.revision_progress where user_id = demo_user_id;
  delete from public.focus_breakdown_entries where user_id = demo_user_id;
  delete from public.diagnostic_attempts where user_id = demo_user_id;

  insert into public.profiles (id, nickname, email, onboarding_completed_at)
  values (demo_user_id, demo_nickname, demo_email, '2026-04-05T17:13:37.804Z'::timestamptz)
  on conflict (id) do update set
    nickname = excluded.nickname,
    email = excluded.email,
    onboarding_completed_at = excluded.onboarding_completed_at;

  insert into public.user_onboarding (user_id, weak_areas, global_focus_note, completed_at)
  values (
    demo_user_id,
    array['security', 'legislation', 'business']::text[],
    'Focus on security, legislation and business evaluation before the next written-answer round.',
    '2026-04-05T17:13:37.804Z'::timestamptz
  )
  on conflict (user_id) do update set
    weak_areas = excluded.weak_areas,
    global_focus_note = excluded.global_focus_note,
    completed_at = excluded.completed_at;

  insert into public.focus_breakdown_entries (user_id, topic_id, selected_subtopics, free_text_note)
  values
  (demo_user_id, 'security', array['8.1', '8.2']::text[], 'Need cleaner threat vs control explanations and better examples.'),
  (demo_user_id, 'legislation', array['4.1', '4.2']::text[], 'Keep mixing up the purpose of GDPR, the DPA and the CMA.'),
  (demo_user_id, 'business', array['5.2', '5.3']::text[], 'Need stronger evaluate answers about digital change and rollout trade-offs.')
  on conflict (user_id, topic_id) do update set
    selected_subtopics = excluded.selected_subtopics,
    free_text_note = excluded.free_text_note;

  insert into public.revision_progress (
    user_id,
    topic_id,
    entity_id,
    entity_type,
    status,
    progress_percent,
    last_interacted_at,
    completed_at
  )
  values
  (demo_user_id, 'security', 'resource-teach-access-control', 'material', 'in-progress', 75, '2026-04-10T11:13:37.804Z'::timestamptz, null),
  (demo_user_id, 'business', 'resource-paper2-2023', 'material', 'in-progress', 50, '2026-04-09T13:13:37.804Z'::timestamptz, null),
  (demo_user_id, 'data', 'resource-teach-csv-formats-ws', 'material', 'completed', 100, '2026-04-08T14:13:37.804Z'::timestamptz, '2026-04-08T14:13:37.804Z'::timestamptz),
  (demo_user_id, 'security', '8.1', 'subtopic', 'completed', 100, '2026-04-10T11:13:37.804Z'::timestamptz, '2026-04-10T11:13:37.804Z'::timestamptz),
  (demo_user_id, 'business', '5.2', 'subtopic', 'completed', 100, '2026-04-09T13:13:37.804Z'::timestamptz, '2026-04-09T13:13:37.804Z'::timestamptz),
  (demo_user_id, 'security', 'practice:recall:security', 'practice-set', 'completed', 100, '2026-04-10T16:13:37.804Z'::timestamptz, '2026-04-10T16:13:37.804Z'::timestamptz),
  (demo_user_id, 'security', 'practice:exam-drill:security', 'practice-set', 'in-progress', 68, '2026-04-11T09:13:37.804Z'::timestamptz, null),
  (demo_user_id, 'business', 'practice:quiz:business', 'practice-set', 'in-progress', 82, '2026-04-09T16:13:37.804Z'::timestamptz, null),
  (demo_user_id, 'data', 'practice:exam-drill:data', 'practice-set', 'completed', 100, '2026-04-08T11:13:37.804Z'::timestamptz, '2026-04-08T11:13:37.804Z'::timestamptz),
  (demo_user_id, 'digital-environments', 'practice:recall:digital-environments', 'practice-set', 'in-progress', 55, '2026-04-07T12:13:37.804Z'::timestamptz, null)
  on conflict (user_id, topic_id, entity_id, entity_type) do update set
    status = excluded.status,
    progress_percent = excluded.progress_percent,
    last_interacted_at = excluded.last_interacted_at,
    completed_at = excluded.completed_at;

  insert into public.activity_history (
    user_id,
    activity_type,
    title,
    topic_id,
    metadata,
    minutes_spent,
    occurred_at
  )
  values
  (demo_user_id, 'practice', 'Ran a security exam drill', 'security', '{"entityId":"practice:exam-drill:security","entityType":"practice-set","progressPercent":68}'::jsonb, 14, '2026-04-11T09:13:37.804Z'::timestamptz),
  (demo_user_id, 'review', 'Reviewed Library: access control scenario + answers', 'security', '{"entityId":"resource-teach-access-control","entityType":"material","progressPercent":75}'::jsonb, 12, '2026-04-10T11:13:37.804Z'::timestamptz),
  (demo_user_id, 'practice', 'Completed security recall set', 'security', '{"entityId":"practice:recall:security","entityType":"practice-set","progressPercent":100}'::jsonb, 10, '2026-04-10T16:13:37.804Z'::timestamptz),
  (demo_user_id, 'diagnostic', 'Completed adaptive diagnostic, weakest in Security', 'security', '{"latestTopicId":"security"}'::jsonb, 25, '2026-04-09T11:13:37.804Z'::timestamptz),
  (demo_user_id, 'practice', 'Completed data exam drill set', 'data', '{"entityId":"practice:exam-drill:data","entityType":"practice-set","progressPercent":100}'::jsonb, 16, '2026-04-08T11:13:37.804Z'::timestamptz),
  (demo_user_id, 'practice', 'Updated business quiz progress', 'business', '{"entityId":"practice:quiz:business","entityType":"practice-set","progressPercent":82}'::jsonb, 11, '2026-04-09T16:13:37.804Z'::timestamptz),
  (demo_user_id, 'review', 'Reviewed Paper 2 2023', 'business', '{"entityId":"resource-paper2-2023","entityType":"material","progressPercent":50}'::jsonb, 9, '2026-04-09T13:13:37.804Z'::timestamptz);

  insert into public.diagnostic_attempts (
    id, user_id, overall_score, question_count, version, diagnostic_snapshot, completed_at
  )
  values (
    demo_attempt_id,
    demo_user_id,
    58,
    16,
    2,
    '{"version":2,"latestTopicId":"security","assessedTopicIds":["problem-solving","intro-programming","emerging-issues","legislation","business","data","digital-environments","security"],"unassessedTopicIds":["esp"],"recommendedTopicIds":["security","legislation","business"],"topicDiagnostics":[{"topicId":"security","topicLabel":"Security","topicIcon":"🔒","assessedAt":"2026-04-09T11:13:37.804Z","freeformResponse":"Phishing is a security problem because attackers trick users into revealing credentials. Training helps, but I also need to mention access control and patching more clearly.","curriculumPoints":[{"pointId":"8.1","label":"8.1 Security risks","status":"partial","confidence":0.46,"matchedTerms":["phishing","credentials","social engineering"],"missingTerms":["malware","brute force","sql injection"],"evidence":["Mentions phishing and stolen credentials."],"notes":"Good identification of the threat, but the range of risks is still narrow."},{"pointId":"8.2","label":"8.2 Threat mitigation","status":"partial","confidence":0.41,"matchedTerms":["training","access control"],"missingTerms":["patching","multi-factor authentication","backup"],"evidence":["Hints that user training helps reduce risk."],"notes":"Needs sharper explanation of technical controls and layered defence."}],"keyTermsMatched":["phishing","credentials","social engineering","training","access control"],"misconceptions":[],"confidence":0.435,"suggestedNextTargets":["8.1 Security risks","8.2 Threat mitigation"],"recommendedMaterialIds":["resource-teach-access-control","resource-teach-legislation-slides"],"followUps":[{"id":"demo-security-followup-1","targetedPointId":"8.1","question":"Give one other security risk besides phishing and explain how it could affect an organisation.","answer":"Brute-force attacks can repeatedly guess passwords until an attacker gets into an account, which could expose sensitive data or let them misuse systems.","reason":"weak-point"},{"id":"demo-security-followup-2","targetedPointId":"8.2","question":"What technical control would you add alongside staff training to reduce phishing damage?","answer":"Multi-factor authentication adds another check even if a password is stolen, so a phishing attack is less likely to lead to account access.","reason":"missing-point"}]}]}'::jsonb,
    '2026-04-09T11:13:37.804Z'::timestamptz
  )
  on conflict (id) do update set
    overall_score = excluded.overall_score,
    question_count = excluded.question_count,
    version = excluded.version,
    diagnostic_snapshot = excluded.diagnostic_snapshot,
    completed_at = excluded.completed_at;

  insert into public.diagnostic_topic_scores (
    attempt_id, user_id, topic_id, topic_label, score, max_score
  )
  values
  (demo_attempt_id, demo_user_id, 'problem-solving', 'Problem Solving', 17, 25),
  (demo_attempt_id, demo_user_id, 'intro-programming', 'Intro to Programming', 21, 25),
  (demo_attempt_id, demo_user_id, 'emerging-issues', 'Emerging Issues & Digital Impact', 14, 25),
  (demo_attempt_id, demo_user_id, 'legislation', 'Legislation & Regulatory', 10, 25),
  (demo_attempt_id, demo_user_id, 'business', 'Business Environment', 12, 25),
  (demo_attempt_id, demo_user_id, 'data', 'Data', 18, 25),
  (demo_attempt_id, demo_user_id, 'digital-environments', 'Digital Environments', 15, 25),
  (demo_attempt_id, demo_user_id, 'security', 'Security', 9, 25)
  on conflict (attempt_id, topic_id) do update set
    topic_label = excluded.topic_label,
    score = excluded.score,
    max_score = excluded.max_score;

  insert into public.diagnostic_sessions (
    id, attempt_id, user_id, topic_id, topic_label, topic_icon, confidence, engine_version, started_at, completed_at
  )
  values (
    demo_session_id,
    demo_attempt_id,
    demo_user_id,
    'security',
    'Security',
    '🔒',
    0.435,
    2,
    '2026-04-09T11:13:37.804Z'::timestamptz,
    '2026-04-09T11:13:37.804Z'::timestamptz
  )
  on conflict (id) do update set
    confidence = excluded.confidence,
    completed_at = excluded.completed_at,
    started_at = excluded.started_at;

  insert into public.diagnostic_freeform_inputs (session_id, user_id, answer_text)
  values (
    demo_session_id,
    demo_user_id,
    'Phishing is a security problem because attackers trick users into revealing credentials. Training helps, but I also need to mention access control and patching more clearly.'
  )
  on conflict (session_id) do update set
    answer_text = excluded.answer_text;

  insert into public.diagnostic_followup_questions (
    session_id, user_id, sequence_number, targeted_subtopic_id, reason, question_text, asked_at
  )
  values
  (demo_session_id, demo_user_id, 1, '8.1', 'weak-point', 'Give one other security risk besides phishing and explain how it could affect an organisation.', '2026-04-09T11:13:37.804Z'::timestamptz),
  (demo_session_id, demo_user_id, 2, '8.2', 'missing-point', 'What technical control would you add alongside staff training to reduce phishing damage?', '2026-04-09T11:13:37.804Z'::timestamptz)
  on conflict (session_id, sequence_number) do update set
    targeted_subtopic_id = excluded.targeted_subtopic_id,
    reason = excluded.reason,
    question_text = excluded.question_text,
    asked_at = excluded.asked_at;

  insert into public.diagnostic_followup_responses (
    session_id, user_id, sequence_number, response_text, responded_at
  )
  values
  (demo_session_id, demo_user_id, 1, 'Brute-force attacks can repeatedly guess passwords until an attacker gets into an account, which could expose sensitive data or let them misuse systems.', '2026-04-09T11:13:37.804Z'::timestamptz),
  (demo_session_id, demo_user_id, 2, 'Multi-factor authentication adds another check even if a password is stolen, so a phishing attack is less likely to lead to account access.', '2026-04-09T11:13:37.804Z'::timestamptz)
  on conflict (session_id, sequence_number) do update set
    response_text = excluded.response_text,
    responded_at = excluded.responded_at;

  insert into public.diagnostic_point_assessments (
    session_id, user_id, subtopic_id, point_label, status, confidence, matched_terms, missing_terms, evidence, notes
  )
  values
  (demo_session_id, demo_user_id, '8.1', '8.1 Security risks', 'partial', 0.46, array['phishing', 'credentials', 'social engineering']::text[], array['malware', 'brute force', 'sql injection']::text[], array['Mentions phishing and stolen credentials.']::text[], 'Good identification of the threat, but the range of risks is still narrow.'),
  (demo_session_id, demo_user_id, '8.2', '8.2 Threat mitigation', 'partial', 0.41, array['training', 'access control']::text[], array['patching', 'multi-factor authentication', 'backup']::text[], array['Hints that user training helps reduce risk.']::text[], 'Needs sharper explanation of technical controls and layered defence.')
  on conflict (session_id, subtopic_id) do update set
    point_label = excluded.point_label,
    status = excluded.status,
    confidence = excluded.confidence,
    matched_terms = excluded.matched_terms,
    missing_terms = excluded.missing_terms,
    evidence = excluded.evidence,
    notes = excluded.notes;

  insert into public.diagnostic_recommendations (
    session_id, user_id, sequence_number, recommendation_type, target_subtopic_id, target_material_id, label, metadata
  )
  values
  (demo_session_id, demo_user_id, 1, 'curriculum-point', '8.1', null, '8.1 Security risks', '{"source":"demo-seed","targetType":"curriculum-point"}'::jsonb),
  (demo_session_id, demo_user_id, 2, 'curriculum-point', '8.2', null, '8.2 Threat mitigation', '{"source":"demo-seed","targetType":"curriculum-point"}'::jsonb),
  (demo_session_id, demo_user_id, 3, 'material', null, 'resource-teach-access-control', 'resource-teach-access-control', '{"source":"demo-seed","materialId":"resource-teach-access-control"}'::jsonb),
  (demo_session_id, demo_user_id, 4, 'material', null, 'resource-teach-legislation-slides', 'resource-teach-legislation-slides', '{"source":"demo-seed","materialId":"resource-teach-legislation-slides"}'::jsonb)
  on conflict (session_id, sequence_number) do update set
    recommendation_type = excluded.recommendation_type,
    target_subtopic_id = excluded.target_subtopic_id,
    target_material_id = excluded.target_material_id,
    label = excluded.label,
    metadata = excluded.metadata;

  insert into public.topic_coaching_memory (user_id, topic_id, memory_snapshot, updated_at)
  values
  (demo_user_id, 'security', '{"topicId":"security","updatedAt":"2026-04-11T11:13:37.804Z","lastActivityKind":"answer-check","lastRecommendedAction":"Need a hint","lastRecommendedHref":"/revision/security/ask?intent=hint","lastWeakPointId":"8.1","lastSuccessfulPointId":"8.2","lastQuestionId":"paper2-2023-q2b-cia-patient-records","lastDrillId":"8.1","lastAskIntent":"hint","latestAnswerCheckBand":"fail","latestAnswerCheckScorePercent":44,"latestExamDrillReadiness":68,"latestRecallMastery":82,"latestQuizScorePercent":0,"failStreak":2,"distinctionStreak":0,"drillReadyStreak":0,"drillNeedsWorkStreak":1,"recentActivityCount":6,"misconceptionCounts":{"phishing":2,"access control":2},"repeatedMisconceptions":["phishing","access control"]}'::jsonb, '2026-04-11T11:13:37.804Z'::timestamptz),
  (demo_user_id, 'business', '{"topicId":"business","updatedAt":"2026-04-10T15:13:37.804Z","lastActivityKind":"quiz","lastRecommendedAction":"Move to answer-check","lastRecommendedHref":"/revision/business/answer-check?questionId=paper2-2023-q2a-ui-end-users","lastWeakPointId":"5.3","lastSuccessfulPointId":"5.2","lastQuestionId":"paper2-2023-q2a-ui-end-users","lastAskIntent":"local-answer","latestAnswerCheckBand":"merit","latestAnswerCheckScorePercent":71,"latestExamDrillReadiness":74,"latestRecallMastery":0,"latestQuizScorePercent":82,"failStreak":0,"distinctionStreak":0,"drillReadyStreak":2,"drillNeedsWorkStreak":0,"recentActivityCount":4,"misconceptionCounts":{"stakeholders":1},"repeatedMisconceptions":[]}'::jsonb, '2026-04-10T15:13:37.804Z'::timestamptz),
  (demo_user_id, 'digital-environments', '{"topicId":"digital-environments","updatedAt":"2026-04-08T09:13:37.804Z","lastActivityKind":"ask","lastRecommendedAction":"Try a question","lastRecommendedHref":"/revision/digital-environments/answer-check?questionId=paper2-2023-q4c-firewall","lastWeakPointId":"7.2","lastSuccessfulPointId":"7.3","lastQuestionId":"paper2-2023-q4c-firewall","lastAskIntent":"local-answer","latestAnswerCheckBand":"merit","latestAnswerCheckScorePercent":76,"latestExamDrillReadiness":55,"latestRecallMastery":55,"latestQuizScorePercent":0,"failStreak":0,"distinctionStreak":0,"drillReadyStreak":0,"drillNeedsWorkStreak":1,"recentActivityCount":3,"misconceptionCounts":{"virtualization":1},"repeatedMisconceptions":[]}'::jsonb, '2026-04-08T09:13:37.804Z'::timestamptz)
  on conflict (user_id, topic_id) do update set
    memory_snapshot = excluded.memory_snapshot,
    updated_at = excluded.updated_at;
end $$;
