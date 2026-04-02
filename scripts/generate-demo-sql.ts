import { promises as fs } from "node:fs";
import path from "node:path";
import { buildCurriculumSeedPayload } from "@/data/curriculum";
import { getPracticeSetId } from "@/lib/practice";
import { TOPICS, TOPIC_TREES } from "@/lib/types";

const OUTPUT_DIR = path.join(process.cwd(), "supabase");
const DEMO_SEED_FILE = path.join(OUTPUT_DIR, "dev_demo_seed.sql");
const DEMO_BOOTSTRAP_FILE = path.join(OUTPUT_DIR, "dev_demo_bootstrap.sql");
const FULL_BOOTSTRAP_FILE = path.join(OUTPUT_DIR, "full_site_bootstrap.sql");

const DEMO_USER_PLACEHOLDER = "00000000-0000-0000-0000-000000000000";

type DemoTopicId =
  | "security"
  | "business"
  | "digital-environments"
  | "data"
  | "legislation";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue | undefined }
  | JsonValue[];

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNullableString(value: string | null | undefined) {
  return value ? sqlString(value) : "null";
}

function sqlTextArray(values: string[]) {
  if (values.length === 0) {
    return "'{}'::text[]";
  }

  return `array[${values.map((value) => sqlString(value)).join(", ")}]::text[]`;
}

function sqlJson(value: JsonValue) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function topicLabel(topicId: string) {
  return TOPICS.find((topic) => topic.id === topicId)?.label ?? topicId;
}

function topicIcon(topicId: string) {
  return TOPICS.find((topic) => topic.id === topicId)?.icon ?? "•";
}

function subtopicIds(topicId: string) {
  return TOPIC_TREES.find((topic) => topic.topicId === topicId)?.subtopics.map(
    (subtopic) => subtopic.id
  ) ?? [];
}

function pickTopicMaterials(
  materials: ReturnType<typeof buildCurriculumSeedPayload>["materials"],
  topicId: DemoTopicId,
  count: number
) {
  return materials
    .filter((material) => material.legacy_topic_ids.includes(topicId))
    .sort((left, right) => {
      const specificityDelta =
        left.legacy_topic_ids.length - right.legacy_topic_ids.length;

      if (specificityDelta !== 0) {
        return specificityDelta;
      }

      return (left.estimated_minutes ?? 0) - (right.estimated_minutes ?? 0);
    })
    .slice(0, count);
}

function pickPreferredMaterials(
  materials: ReturnType<typeof buildCurriculumSeedPayload>["materials"],
  topicId: DemoTopicId,
  preferredIds: string[],
  count: number
) {
  const byId = new Map(materials.map((material) => [material.id, material]));
  const preferred = preferredIds
    .map((id) => byId.get(id))
    .filter(
      (material): material is ReturnType<typeof buildCurriculumSeedPayload>["materials"][number] =>
        Boolean(material && material.legacy_topic_ids.includes(topicId))
    );

  const fallback = pickTopicMaterials(materials, topicId, count + preferred.length).filter(
    (material) => !preferred.some((preferredMaterial) => preferredMaterial.id === material.id)
  );

  return [...preferred, ...fallback].slice(0, count);
}

function pickTopicQuestions(
  questions: ReturnType<typeof buildCurriculumSeedPayload>["questions"],
  topicId: DemoTopicId,
  count: number
) {
  return questions
    .filter((question) => question.legacy_topic_ids.includes(topicId))
    .slice(0, count);
}

function formatInsertRows(rows: string[]) {
  return rows.join(",\n");
}

async function main() {
  const seed = buildCurriculumSeedPayload();
  const now = new Date();
  const daysAgo = (days: number, hours = 0) =>
    new Date(now.getTime() - (days * 24 + hours) * 60 * 60 * 1000).toISOString();

  const securityMaterials = pickPreferredMaterials(
    seed.materials,
    "security",
    ["resource-teach-access-control", "resource-dpdd-core-book-data-security"],
    2
  );
  const businessMaterials = pickPreferredMaterials(
    seed.materials,
    "business",
    ["resource-paper2-2023", "resource-mark-scheme-summer-2022"],
    2
  );
  const dataMaterials = pickPreferredMaterials(
    seed.materials,
    "data",
    ["resource-teach-csv-formats-ws", "resource-paper1-question-bank"],
    2
  );
  const legislationMaterials = pickPreferredMaterials(
    seed.materials,
    "legislation",
    ["resource-teach-legislation-slides"],
    1
  );
  const digitalEnvironmentMaterials = pickPreferredMaterials(
    seed.materials,
    "digital-environments",
    ["resource-dpdd-core-book-data-security", "resource-paper2-2023"],
    1
  );

  const securityQuestions = pickTopicQuestions(seed.questions, "security", 2);
  const businessQuestions = pickTopicQuestions(seed.questions, "business", 1);
  const digitalEnvironmentQuestions = pickTopicQuestions(
    seed.questions,
    "digital-environments",
    1
  );

  if (
    securityMaterials.length < 2 ||
    businessMaterials.length < 2 ||
    dataMaterials.length < 1 ||
    legislationMaterials.length < 1 ||
    digitalEnvironmentMaterials.length < 1 ||
    securityQuestions.length < 2 ||
    businessQuestions.length < 1 ||
    digitalEnvironmentQuestions.length < 1
  ) {
    throw new Error("Unable to build demo seed because one or more demo resources/questions are missing.");
  }

  const timestamps = {
    onboardingCompletedAt: daysAgo(6),
    securityMaterialTouchedAt: daysAgo(1, 6),
    businessMaterialTouchedAt: daysAgo(2, 4),
    dataMaterialTouchedAt: daysAgo(3, 3),
    securityRecallTouchedAt: daysAgo(1, 1),
    securityDrillTouchedAt: daysAgo(0, 8),
    businessQuizTouchedAt: daysAgo(2, 1),
    dataDrillTouchedAt: daysAgo(3, 6),
    digitalEnvRecallTouchedAt: daysAgo(4, 5),
    diagnosticCompletedAt: daysAgo(2, 6),
    coachingSecurityUpdatedAt: daysAgo(0, 6),
    coachingBusinessUpdatedAt: daysAgo(1, 2),
    coachingDigitalUpdatedAt: daysAgo(3, 8),
  };

  const diagnosticSnapshot = {
    version: 2,
    latestTopicId: "security",
    assessedTopicIds: TOPICS.filter((topic) => topic.id !== "esp").map((topic) => topic.id),
    unassessedTopicIds: ["esp"],
    recommendedTopicIds: ["security", "legislation", "business"],
    topicDiagnostics: [
      {
        topicId: "security",
        topicLabel: topicLabel("security"),
        topicIcon: topicIcon("security"),
        assessedAt: timestamps.diagnosticCompletedAt,
        freeformResponse:
          "Phishing is a security problem because attackers trick users into revealing credentials. Training helps, but I also need to mention access control and patching more clearly.",
        curriculumPoints: [
          {
            pointId: "8.1",
            label: "8.1 Security risks",
            status: "partial",
            confidence: 0.46,
            matchedTerms: ["phishing", "credentials", "social engineering"],
            missingTerms: ["malware", "brute force", "sql injection"],
            evidence: ["Mentions phishing and stolen credentials."],
            notes: "Good identification of the threat, but the range of risks is still narrow.",
          },
          {
            pointId: "8.2",
            label: "8.2 Threat mitigation",
            status: "partial",
            confidence: 0.41,
            matchedTerms: ["training", "access control"],
            missingTerms: ["patching", "multi-factor authentication", "backup"],
            evidence: ["Hints that user training helps reduce risk."],
            notes: "Needs sharper explanation of technical controls and layered defence.",
          },
        ],
        keyTermsMatched: [
          "phishing",
          "credentials",
          "social engineering",
          "training",
          "access control",
        ],
        misconceptions: [],
        confidence: 0.435,
        suggestedNextTargets: ["8.1 Security risks", "8.2 Threat mitigation"],
        recommendedMaterialIds: [
          securityMaterials[0].id,
          legislationMaterials[0].id,
        ],
        followUps: [
          {
            id: "demo-security-followup-1",
            targetedPointId: "8.1",
            question:
              "Give one other security risk besides phishing and explain how it could affect an organisation.",
            answer:
              "Brute-force attacks can repeatedly guess passwords until an attacker gets into an account, which could expose sensitive data or let them misuse systems.",
            reason: "weak-point",
          },
          {
            id: "demo-security-followup-2",
            targetedPointId: "8.2",
            question:
              "What technical control would you add alongside staff training to reduce phishing damage?",
            answer:
              "Multi-factor authentication adds another check even if a password is stolen, so a phishing attack is less likely to lead to account access.",
            reason: "missing-point",
          },
        ],
      },
    ],
  } satisfies JsonValue;

  const focusBreakdownRows = [
    ["security", ["8.1", "8.2"], "Need cleaner threat vs control explanations and better examples."],
    ["legislation", ["4.1", "4.2"], "Keep mixing up the purpose of GDPR, the DPA and the CMA."],
    ["business", ["5.2", "5.3"], "Need stronger evaluate answers about digital change and rollout trade-offs."],
  ] as const;

  const revisionProgressRows = [
    {
      topicId: "security",
      entityId: securityMaterials[0].id,
      entityType: "material",
      status: "in-progress",
      progressPercent: 75,
      lastInteractedAt: timestamps.securityMaterialTouchedAt,
      completedAt: null,
    },
    {
      topicId: "business",
      entityId: businessMaterials[0].id,
      entityType: "material",
      status: "in-progress",
      progressPercent: 50,
      lastInteractedAt: timestamps.businessMaterialTouchedAt,
      completedAt: null,
    },
    {
      topicId: "data",
      entityId: dataMaterials[0].id,
      entityType: "material",
      status: "completed",
      progressPercent: 100,
      lastInteractedAt: timestamps.dataMaterialTouchedAt,
      completedAt: timestamps.dataMaterialTouchedAt,
    },
    {
      topicId: "security",
      entityId: "8.1",
      entityType: "subtopic",
      status: "completed",
      progressPercent: 100,
      lastInteractedAt: timestamps.securityMaterialTouchedAt,
      completedAt: timestamps.securityMaterialTouchedAt,
    },
    {
      topicId: "business",
      entityId: "5.2",
      entityType: "subtopic",
      status: "completed",
      progressPercent: 100,
      lastInteractedAt: timestamps.businessMaterialTouchedAt,
      completedAt: timestamps.businessMaterialTouchedAt,
    },
    {
      topicId: "security",
      entityId: getPracticeSetId("security", "recall"),
      entityType: "practice-set",
      status: "completed",
      progressPercent: 100,
      lastInteractedAt: timestamps.securityRecallTouchedAt,
      completedAt: timestamps.securityRecallTouchedAt,
    },
    {
      topicId: "security",
      entityId: getPracticeSetId("security", "exam-drill"),
      entityType: "practice-set",
      status: "in-progress",
      progressPercent: 68,
      lastInteractedAt: timestamps.securityDrillTouchedAt,
      completedAt: null,
    },
    {
      topicId: "business",
      entityId: getPracticeSetId("business", "quiz"),
      entityType: "practice-set",
      status: "in-progress",
      progressPercent: 82,
      lastInteractedAt: timestamps.businessQuizTouchedAt,
      completedAt: null,
    },
    {
      topicId: "data",
      entityId: getPracticeSetId("data", "exam-drill"),
      entityType: "practice-set",
      status: "completed",
      progressPercent: 100,
      lastInteractedAt: timestamps.dataDrillTouchedAt,
      completedAt: timestamps.dataDrillTouchedAt,
    },
    {
      topicId: "digital-environments",
      entityId: getPracticeSetId("digital-environments", "recall"),
      entityType: "practice-set",
      status: "in-progress",
      progressPercent: 55,
      lastInteractedAt: timestamps.digitalEnvRecallTouchedAt,
      completedAt: null,
    },
  ] as const;

  const activityHistoryRows = [
    {
      type: "practice",
      title: "Ran a security exam drill",
      topicId: "security",
      minutesSpent: 14,
      occurredAt: timestamps.securityDrillTouchedAt,
      metadata: {
        entityId: getPracticeSetId("security", "exam-drill"),
        entityType: "practice-set",
        progressPercent: 68,
      },
    },
    {
      type: "review",
      title: `Reviewed ${securityMaterials[0].title}`,
      topicId: "security",
      minutesSpent: 12,
      occurredAt: timestamps.securityMaterialTouchedAt,
      metadata: {
        entityId: securityMaterials[0].id,
        entityType: "material",
        progressPercent: 75,
      },
    },
    {
      type: "practice",
      title: "Completed security recall set",
      topicId: "security",
      minutesSpent: 10,
      occurredAt: timestamps.securityRecallTouchedAt,
      metadata: {
        entityId: getPracticeSetId("security", "recall"),
        entityType: "practice-set",
        progressPercent: 100,
      },
    },
    {
      type: "diagnostic",
      title: "Completed adaptive diagnostic, weakest in Security",
      topicId: "security",
      minutesSpent: 25,
      occurredAt: timestamps.diagnosticCompletedAt,
      metadata: {
        latestTopicId: "security",
      },
    },
    {
      type: "practice",
      title: "Completed data exam drill set",
      topicId: "data",
      minutesSpent: 16,
      occurredAt: timestamps.dataDrillTouchedAt,
      metadata: {
        entityId: getPracticeSetId("data", "exam-drill"),
        entityType: "practice-set",
        progressPercent: 100,
      },
    },
    {
      type: "practice",
      title: "Updated business quiz progress",
      topicId: "business",
      minutesSpent: 11,
      occurredAt: timestamps.businessQuizTouchedAt,
      metadata: {
        entityId: getPracticeSetId("business", "quiz"),
        entityType: "practice-set",
        progressPercent: 82,
      },
    },
    {
      type: "review",
      title: `Reviewed ${businessMaterials[0].title}`,
      topicId: "business",
      minutesSpent: 9,
      occurredAt: timestamps.businessMaterialTouchedAt,
      metadata: {
        entityId: businessMaterials[0].id,
        entityType: "material",
        progressPercent: 50,
      },
    },
  ] as const;

  const coachingEntries = [
    {
      topicId: "security",
      updatedAt: timestamps.coachingSecurityUpdatedAt,
      lastActivityKind: "answer-check",
      lastRecommendedAction: "Need a hint",
      lastRecommendedHref: "/revision/security/ask?intent=hint",
      lastWeakPointId: "8.1",
      lastSuccessfulPointId: "8.2",
      lastQuestionId: securityQuestions[0].id,
      lastDrillId: "8.1",
      lastAskIntent: "hint",
      latestAnswerCheckBand: "fail",
      latestAnswerCheckScorePercent: 44,
      latestExamDrillReadiness: 68,
      latestRecallMastery: 82,
      latestQuizScorePercent: 0,
      failStreak: 2,
      distinctionStreak: 0,
      drillReadyStreak: 0,
      drillNeedsWorkStreak: 1,
      recentActivityCount: 6,
      misconceptionCounts: {
        phishing: 2,
        "access control": 2,
      },
      repeatedMisconceptions: ["phishing", "access control"],
    },
    {
      topicId: "business",
      updatedAt: timestamps.coachingBusinessUpdatedAt,
      lastActivityKind: "quiz",
      lastRecommendedAction: "Move to answer-check",
      lastRecommendedHref: `/revision/business/answer-check?questionId=${businessQuestions[0].id}`,
      lastWeakPointId: "5.3",
      lastSuccessfulPointId: "5.2",
      lastQuestionId: businessQuestions[0].id,
      lastAskIntent: "local-answer",
      latestAnswerCheckBand: "merit",
      latestAnswerCheckScorePercent: 71,
      latestExamDrillReadiness: 74,
      latestRecallMastery: 0,
      latestQuizScorePercent: 82,
      failStreak: 0,
      distinctionStreak: 0,
      drillReadyStreak: 2,
      drillNeedsWorkStreak: 0,
      recentActivityCount: 4,
      misconceptionCounts: {
        stakeholders: 1,
      },
      repeatedMisconceptions: [],
    },
    {
      topicId: "digital-environments",
      updatedAt: timestamps.coachingDigitalUpdatedAt,
      lastActivityKind: "ask",
      lastRecommendedAction: "Try a question",
      lastRecommendedHref: `/revision/digital-environments/answer-check?questionId=${digitalEnvironmentQuestions[0].id}`,
      lastWeakPointId: "7.2",
      lastSuccessfulPointId: "7.3",
      lastQuestionId: digitalEnvironmentQuestions[0].id,
      lastAskIntent: "local-answer",
      latestAnswerCheckBand: "merit",
      latestAnswerCheckScorePercent: 76,
      latestExamDrillReadiness: 55,
      latestRecallMastery: 55,
      latestQuizScorePercent: 0,
      failStreak: 0,
      distinctionStreak: 0,
      drillReadyStreak: 0,
      drillNeedsWorkStreak: 1,
      recentActivityCount: 3,
      misconceptionCounts: {
        virtualization: 1,
      },
      repeatedMisconceptions: [],
    },
  ] as const;

  const diagnosticScoreRows = [
    { topicId: "problem-solving", topicLabel: topicLabel("problem-solving"), score: 17, maxScore: 25 },
    { topicId: "intro-programming", topicLabel: topicLabel("intro-programming"), score: 21, maxScore: 25 },
    { topicId: "emerging-issues", topicLabel: topicLabel("emerging-issues"), score: 14, maxScore: 25 },
    { topicId: "legislation", topicLabel: topicLabel("legislation"), score: 10, maxScore: 25 },
    { topicId: "business", topicLabel: topicLabel("business"), score: 12, maxScore: 25 },
    { topicId: "data", topicLabel: topicLabel("data"), score: 18, maxScore: 25 },
    { topicId: "digital-environments", topicLabel: topicLabel("digital-environments"), score: 15, maxScore: 25 },
    { topicId: "security", topicLabel: topicLabel("security"), score: 9, maxScore: 25 },
  ] as const;

  const demoSeedSql = [
    "-- Demo app-state seed for one existing Supabase auth user.",
    "-- Run this after full_site_bootstrap.sql or after full_site_schema.sql + full_site_seed.sql.",
    "-- Replace demo_user_id with an existing auth.users id before running.",
    "",
    "do $$",
    "declare",
    `  demo_user_id uuid := '${DEMO_USER_PLACEHOLDER}'::uuid;`,
    "  demo_email text := 'demo.student@example.com';",
    "  demo_nickname text := 'Demo Student';",
    "  demo_attempt_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;",
    "  demo_session_id uuid := '22222222-2222-2222-2222-222222222222'::uuid;",
    "begin",
    `  if demo_user_id = '${DEMO_USER_PLACEHOLDER}'::uuid then`,
    "    raise exception 'Replace demo_user_id in dev_demo_seed.sql with an existing auth.users id before running this seed.';",
    "  end if;",
    "",
    "  if not exists (select 1 from auth.users where id = demo_user_id) then",
    "    raise exception 'No auth.users row exists for the chosen demo_user_id. Create/sign in the user first, then rerun the seed.';",
    "  end if;",
    "",
    "  if not exists (select 1 from public.curriculum_sources limit 1) then",
    "    raise exception 'Shared curriculum data is missing. Run full_site_seed.sql or full_site_bootstrap.sql before this demo seed.';",
    "  end if;",
    "",
    "  delete from public.topic_coaching_memory where user_id = demo_user_id;",
    "  delete from public.activity_history where user_id = demo_user_id;",
    "  delete from public.revision_progress where user_id = demo_user_id;",
    "  delete from public.focus_breakdown_entries where user_id = demo_user_id;",
    "  delete from public.diagnostic_attempts where user_id = demo_user_id;",
    "",
    "  insert into public.profiles (id, nickname, email, onboarding_completed_at)",
    "  values (demo_user_id, demo_nickname, demo_email, " +
      sqlString(timestamps.onboardingCompletedAt) +
      "::timestamptz)",
    "  on conflict (id) do update set",
    "    nickname = excluded.nickname,",
    "    email = excluded.email,",
    "    onboarding_completed_at = excluded.onboarding_completed_at;",
    "",
    "  insert into public.user_onboarding (user_id, weak_areas, global_focus_note, completed_at)",
    "  values (",
    "    demo_user_id,",
    `    ${sqlTextArray(["security", "legislation", "business"])},`,
    "    " +
      sqlString(
        "Focus on security, legislation and business evaluation before the next written-answer round."
      ) +
      ",",
    "    " + sqlString(timestamps.onboardingCompletedAt) + "::timestamptz",
    "  )",
    "  on conflict (user_id) do update set",
    "    weak_areas = excluded.weak_areas,",
    "    global_focus_note = excluded.global_focus_note,",
    "    completed_at = excluded.completed_at;",
    "",
    "  insert into public.focus_breakdown_entries (user_id, topic_id, selected_subtopics, free_text_note)",
    "  values",
    formatInsertRows(
      focusBreakdownRows.map(
        ([topicId, selectedSubtopics, freeTextNote]) =>
          `  (demo_user_id, ${sqlString(topicId)}, ${sqlTextArray(
            selectedSubtopics as unknown as string[]
          )}, ${sqlString(freeTextNote)})`
      )
    ) +
      "",
    "  on conflict (user_id, topic_id) do update set",
    "    selected_subtopics = excluded.selected_subtopics,",
    "    free_text_note = excluded.free_text_note;",
    "",
    "  insert into public.revision_progress (",
    "    user_id,",
    "    topic_id,",
    "    entity_id,",
    "    entity_type,",
    "    status,",
    "    progress_percent,",
    "    last_interacted_at,",
    "    completed_at",
    "  )",
    "  values",
    formatInsertRows(
      revisionProgressRows.map(
        (row) =>
          `  (demo_user_id, ${sqlString(row.topicId)}, ${sqlString(
            row.entityId
          )}, ${sqlString(row.entityType)}, ${sqlString(row.status)}, ${row.progressPercent}, ${sqlString(
            row.lastInteractedAt
          )}::timestamptz, ${row.completedAt ? `${sqlString(row.completedAt)}::timestamptz` : "null"})`
      )
    ),
    "  on conflict (user_id, topic_id, entity_id, entity_type) do update set",
    "    status = excluded.status,",
    "    progress_percent = excluded.progress_percent,",
    "    last_interacted_at = excluded.last_interacted_at,",
    "    completed_at = excluded.completed_at;",
    "",
    "  insert into public.activity_history (",
    "    user_id,",
    "    activity_type,",
    "    title,",
    "    topic_id,",
    "    metadata,",
    "    minutes_spent,",
    "    occurred_at",
    "  )",
    "  values",
    formatInsertRows(
      activityHistoryRows.map(
        (row) =>
          `  (demo_user_id, ${sqlString(row.type)}, ${sqlString(row.title)}, ${sqlNullableString(
            row.topicId
          )}, ${sqlJson(row.metadata as JsonValue)}, ${row.minutesSpent}, ${sqlString(
            row.occurredAt
          )}::timestamptz)`
      )
    ) +
      ";",
    "",
    "  insert into public.diagnostic_attempts (",
    "    id, user_id, overall_score, question_count, version, diagnostic_snapshot, completed_at",
    "  )",
    "  values (",
    "    demo_attempt_id,",
    "    demo_user_id,",
    "    58,",
    "    16,",
    "    2,",
    `    ${sqlJson(diagnosticSnapshot)},`,
    `    ${sqlString(timestamps.diagnosticCompletedAt)}::timestamptz`,
    "  )",
    "  on conflict (id) do update set",
    "    overall_score = excluded.overall_score,",
    "    question_count = excluded.question_count,",
    "    version = excluded.version,",
    "    diagnostic_snapshot = excluded.diagnostic_snapshot,",
    "    completed_at = excluded.completed_at;",
    "",
    "  insert into public.diagnostic_topic_scores (",
    "    attempt_id, user_id, topic_id, topic_label, score, max_score",
    "  )",
    "  values",
    formatInsertRows(
      diagnosticScoreRows.map(
        (row) =>
          `  (demo_attempt_id, demo_user_id, ${sqlString(row.topicId)}, ${sqlString(
            row.topicLabel
          )}, ${row.score}, ${row.maxScore})`
      )
    ),
    "  on conflict (attempt_id, topic_id) do update set",
    "    topic_label = excluded.topic_label,",
    "    score = excluded.score,",
    "    max_score = excluded.max_score;",
    "",
    "  insert into public.diagnostic_sessions (",
    "    id, attempt_id, user_id, topic_id, topic_label, topic_icon, confidence, engine_version, started_at, completed_at",
    "  )",
    "  values (",
    "    demo_session_id,",
    "    demo_attempt_id,",
    "    demo_user_id,",
    "    'security',",
    `    ${sqlString(topicLabel("security"))},`,
    `    ${sqlString(topicIcon("security"))},`,
    "    0.435,",
    "    2,",
    `    ${sqlString(timestamps.diagnosticCompletedAt)}::timestamptz,`,
    `    ${sqlString(timestamps.diagnosticCompletedAt)}::timestamptz`,
    "  )",
    "  on conflict (id) do update set",
    "    confidence = excluded.confidence,",
    "    completed_at = excluded.completed_at,",
    "    started_at = excluded.started_at;",
    "",
    "  insert into public.diagnostic_freeform_inputs (session_id, user_id, answer_text)",
    "  values (",
    "    demo_session_id,",
    "    demo_user_id,",
    "    " +
      sqlString(
        "Phishing is a security problem because attackers trick users into revealing credentials. Training helps, but I also need to mention access control and patching more clearly."
      ),
    "  )",
    "  on conflict (session_id) do update set",
    "    answer_text = excluded.answer_text;",
    "",
    "  insert into public.diagnostic_followup_questions (",
    "    session_id, user_id, sequence_number, targeted_subtopic_id, reason, question_text, asked_at",
    "  )",
    "  values",
    formatInsertRows(
      diagnosticSnapshot.topicDiagnostics[0].followUps.map((followUp, index) =>
        `  (demo_session_id, demo_user_id, ${index + 1}, ${sqlString(
          followUp.targetedPointId
        )}, ${sqlString(followUp.reason)}, ${sqlString(followUp.question)}, ${sqlString(
          timestamps.diagnosticCompletedAt
        )}::timestamptz)`
      )
    ),
    "  on conflict (session_id, sequence_number) do update set",
    "    targeted_subtopic_id = excluded.targeted_subtopic_id,",
    "    reason = excluded.reason,",
    "    question_text = excluded.question_text,",
    "    asked_at = excluded.asked_at;",
    "",
    "  insert into public.diagnostic_followup_responses (",
    "    session_id, user_id, sequence_number, response_text, responded_at",
    "  )",
    "  values",
    formatInsertRows(
      diagnosticSnapshot.topicDiagnostics[0].followUps.map((followUp, index) =>
        `  (demo_session_id, demo_user_id, ${index + 1}, ${sqlString(
          followUp.answer
        )}, ${sqlString(timestamps.diagnosticCompletedAt)}::timestamptz)`
      )
    ),
    "  on conflict (session_id, sequence_number) do update set",
    "    response_text = excluded.response_text,",
    "    responded_at = excluded.responded_at;",
    "",
    "  insert into public.diagnostic_point_assessments (",
    "    session_id, user_id, subtopic_id, point_label, status, confidence, matched_terms, missing_terms, evidence, notes",
    "  )",
    "  values",
    formatInsertRows(
      diagnosticSnapshot.topicDiagnostics[0].curriculumPoints.map(
        (point) =>
          `  (demo_session_id, demo_user_id, ${sqlString(point.pointId)}, ${sqlString(
            point.label
          )}, ${sqlString(point.status)}, ${point.confidence}, ${sqlTextArray(
            point.matchedTerms
          )}, ${sqlTextArray(point.missingTerms)}, ${sqlTextArray(
            point.evidence
          )}, ${sqlNullableString(point.notes)})`
      )
    ),
    "  on conflict (session_id, subtopic_id) do update set",
    "    point_label = excluded.point_label,",
    "    status = excluded.status,",
    "    confidence = excluded.confidence,",
    "    matched_terms = excluded.matched_terms,",
    "    missing_terms = excluded.missing_terms,",
    "    evidence = excluded.evidence,",
    "    notes = excluded.notes;",
    "",
    "  insert into public.diagnostic_recommendations (",
    "    session_id, user_id, sequence_number, recommendation_type, target_subtopic_id, target_material_id, label, metadata",
    "  )",
    "  values",
    formatInsertRows([
      `  (demo_session_id, demo_user_id, 1, 'curriculum-point', '8.1', null, '8.1 Security risks', ${sqlJson({
        source: "demo-seed",
        targetType: "curriculum-point",
      })})`,
      `  (demo_session_id, demo_user_id, 2, 'curriculum-point', '8.2', null, '8.2 Threat mitigation', ${sqlJson({
        source: "demo-seed",
        targetType: "curriculum-point",
      })})`,
      `  (demo_session_id, demo_user_id, 3, 'material', null, ${sqlString(
        securityMaterials[0].id
      )}, ${sqlString(securityMaterials[0].id)}, ${sqlJson({
        source: "demo-seed",
        materialId: securityMaterials[0].id,
      })})`,
      `  (demo_session_id, demo_user_id, 4, 'material', null, ${sqlString(
        legislationMaterials[0].id
      )}, ${sqlString(legislationMaterials[0].id)}, ${sqlJson({
        source: "demo-seed",
        materialId: legislationMaterials[0].id,
      })})`,
    ]),
    "  on conflict (session_id, sequence_number) do update set",
    "    recommendation_type = excluded.recommendation_type,",
    "    target_subtopic_id = excluded.target_subtopic_id,",
    "    target_material_id = excluded.target_material_id,",
    "    label = excluded.label,",
    "    metadata = excluded.metadata;",
    "",
    "  insert into public.topic_coaching_memory (user_id, topic_id, memory_snapshot, updated_at)",
    "  values",
    formatInsertRows(
      coachingEntries.map(
        (entry) =>
          `  (demo_user_id, ${sqlString(entry.topicId)}, ${sqlJson(
            entry as unknown as JsonValue
          )}, ${sqlString(entry.updatedAt)}::timestamptz)`
      )
    ),
    "  on conflict (user_id, topic_id) do update set",
    "    memory_snapshot = excluded.memory_snapshot,",
    "    updated_at = excluded.updated_at;",
    "end $$;",
    "",
  ].join("\n");

  await fs.writeFile(DEMO_SEED_FILE, demoSeedSql, "utf8");

  const fullBootstrapSql = await fs.readFile(FULL_BOOTSTRAP_FILE, "utf8");
  const demoBootstrapSql = [
    fullBootstrapSql.trimEnd(),
    "",
    "-- ============================================================================",
    "-- Demo app-state seed",
    "-- Source: dev_demo_seed.sql",
    "-- ============================================================================",
    "",
    demoSeedSql.trimStart(),
    "",
  ].join("\n");

  await fs.writeFile(DEMO_BOOTSTRAP_FILE, demoBootstrapSql, "utf8");

  console.log(
    JSON.stringify(
      {
        demoSeedFile: path.relative(process.cwd(), DEMO_SEED_FILE),
        demoBootstrapFile: path.relative(process.cwd(), DEMO_BOOTSTRAP_FILE),
        weakAreas: ["security", "legislation", "business"],
        revisionProgressEntries: revisionProgressRows.length,
        activityHistoryEntries: activityHistoryRows.length,
        diagnosticScores: diagnosticScoreRows.length,
        coachingEntries: coachingEntries.length,
        securityQuestionId: securityQuestions[0].id,
        businessQuestionId: businessQuestions[0].id,
        digitalEnvironmentQuestionId: digitalEnvironmentQuestions[0].id,
      },
      null,
      2
    )
  );
}

void main();
