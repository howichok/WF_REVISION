import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCurriculumSeedPayload,
  type ContentResource,
  type ContentSource,
  type CurriculumArea,
  type CurriculumPoint,
  type GlossaryTerm,
  type LegacyTopicMapping,
  type QuestionMetadata,
} from "@/data/curriculum";
import type { TopicId } from "@/lib/types";
import {
  getLocalSharedCurriculumSnapshot,
  type SharedCurriculumSnapshot,
} from "./shared-curriculum";

type CurriculumSupabaseClient = SupabaseClient;

type SourceRow = {
  id: string;
  title: string;
  kind: ContentSource["kind"];
  classification: ContentSource["classification"];
  file_path: string;
  year: number | null;
  duplicate_of_id: string | null;
  caution: string | null;
  notes: string;
};

type PointRow = {
  id: string;
  code: string;
  title: string;
  summary: string;
  parent_point_id: string | null;
  depth: number;
  sort_order: number;
};

type TopicPointRow = {
  topic_id: TopicId;
  point_id: string;
  sort_order: number;
};

type TermRow = {
  id: string;
  term: string;
  definition: string;
  aliases: string[];
  legacy_topic_ids: TopicId[];
};

type PointTermRow = {
  point_id: string;
  term_id: string;
};

type MaterialRow = {
  id: string;
  source_id: string;
  title: string;
  kind: ContentResource["kind"];
  display_type: ContentResource["displayType"];
  file_path: string;
  summary: string;
  year: number | null;
  tags: string[];
  legacy_topic_ids: TopicId[];
  estimated_minutes: number | null;
};

type PointMaterialRow = {
  point_id: string;
  material_id: string;
};

type QuestionRow = {
  id: string;
  source_id: string;
  title: string;
  source_label: string;
  year: number | null;
  paper: string | null;
  question_type: QuestionMetadata["questionType"];
  marks: number | null;
  summary: string;
  expectation: string;
  practice_prompt: string | null;
  legacy_topic_ids: TopicId[];
  exam_metadata?: QuestionMetadata["examMetadata"] | null;
  reviewed?: boolean | null;
  active?: boolean | null;
};

type QuestionPointRow = {
  question_id: string;
  point_id: string;
};

type PracticePromptRow = {
  id: string;
  point_id: string | null;
  subtopic_id: string | null;
  prompt_text: string;
  sort_order: number;
};

export interface SharedCurriculumDatabaseTables {
  sources: SourceRow[];
  points: PointRow[];
  topicPoints: TopicPointRow[];
  terms: TermRow[];
  pointTerms: PointTermRow[];
  materials: MaterialRow[];
  pointMaterials: PointMaterialRow[];
  questions: QuestionRow[];
  questionPoints: QuestionPointRow[];
  practicePrompts: PracticePromptRow[];
}

function assertSeedWriteError(error: { message: string } | null, tableName: string) {
  if (error) {
    throw new Error(`Unable to sync ${tableName}: ${error.message}`);
  }
}

function sortByText(left: string, right: string) {
  return left.localeCompare(right);
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}

function compareByYearThenTitle(
  left: { year?: number | null; title: string },
  right: { year?: number | null; title: string }
) {
  const yearDiff = (right.year ?? 0) - (left.year ?? 0);
  if (yearDiff !== 0) {
    return yearDiff;
  }

  return sortByText(left.title, right.title);
}

function comparePoints(left: CurriculumPoint, right: CurriculumPoint) {
  return sortByText(left.code, right.code);
}

function mergeLocalAndRemote<T extends { id: string }>(
  localValues: T[],
  remoteValues: T[],
  compareExtra: (left: T, right: T) => number
) {
  const remoteById = new Map(remoteValues.map((value) => [value.id, value]));
  const merged = localValues.map((value) => remoteById.get(value.id) ?? value);
  const localIds = new Set(localValues.map((value) => value.id));
  const remoteOnly = remoteValues
    .filter((value) => !localIds.has(value.id))
    .sort(compareExtra);

  return [...merged, ...remoteOnly];
}

function mapById<T extends { id: string }>(values: T[]) {
  return new Map(values.map((value) => [value.id, value]));
}

function groupStringsByKey<T extends string>(
  pairs: Array<{ key: string; value: T }>,
  comparator?: (left: T, right: T) => number
) {
  const grouped = new Map<string, T[]>();

  for (const pair of pairs) {
    const current = grouped.get(pair.key) ?? [];
    current.push(pair.value);
    grouped.set(pair.key, current);
  }

  if (comparator) {
    for (const [key, values] of grouped.entries()) {
      grouped.set(key, [...values].sort(comparator));
    }
  }

  return grouped;
}

function buildLegacyTopicMappings(
  topicPoints: TopicPointRow[],
  localMappings: LegacyTopicMapping[]
) {
  const topicPointMap = new Map<TopicId, string[]>();

  topicPoints
    .sort((left, right) => left.sort_order - right.sort_order)
    .forEach((row) => {
      const current = topicPointMap.get(row.topic_id) ?? [];
      current.push(row.point_id);
      topicPointMap.set(row.topic_id, current);
    });

  return localMappings.map((mapping) => ({
    ...mapping,
    officialPointIds:
      topicPointMap.get(mapping.topicId)?.length
        ? topicPointMap.get(mapping.topicId) ?? mapping.officialPointIds
        : mapping.officialPointIds,
  }));
}

export function buildSharedCurriculumSnapshotFromDatabaseTables(
  tables: SharedCurriculumDatabaseTables
): SharedCurriculumSnapshot {
  const localSnapshot = getLocalSharedCurriculumSnapshot();

  if (
    tables.sources.length === 0 ||
    tables.points.length === 0 ||
    tables.terms.length === 0 ||
    tables.materials.length === 0 ||
    tables.questions.length === 0
  ) {
    return localSnapshot;
  }

  const localSourcesById = mapById(localSnapshot.sources);
  const localAreasById = mapById(localSnapshot.areas);
  const localPointsById = mapById(localSnapshot.points);
  const localTermsById = mapById(localSnapshot.terms);
  const localResourcesById = mapById(localSnapshot.resources);
  const localQuestionsById = mapById(localSnapshot.questions);

  const pointIdsByTermId = groupStringsByKey(
    tables.pointTerms.map((row) => ({ key: row.term_id, value: row.point_id })),
    sortByText
  );
  const termIdsByPointId = groupStringsByKey(
    tables.pointTerms.map((row) => ({ key: row.point_id, value: row.term_id })),
    sortByText
  );
  const pointIdsByMaterialId = groupStringsByKey(
    tables.pointMaterials.map((row) => ({ key: row.material_id, value: row.point_id })),
    sortByText
  );
  const pointIdsByQuestionId = groupStringsByKey(
    tables.questionPoints.map((row) => ({ key: row.question_id, value: row.point_id })),
    sortByText
  );
  const promptRowsByPointId = new Map<string, PracticePromptRow[]>();

  tables.practicePrompts
    .filter((row) => row.point_id)
    .sort((left, right) => left.sort_order - right.sort_order)
    .forEach((row) => {
      const pointId = row.point_id as string;
      const current = promptRowsByPointId.get(pointId) ?? [];
      current.push(row);
      promptRowsByPointId.set(pointId, current);
    });

  const terms = mergeLocalAndRemote(
    localSnapshot.terms,
    tables.terms.map((row) => {
      const local = localTermsById.get(row.id);

      return {
        id: row.id,
        term: row.term,
        definition: row.definition,
        aliases: row.aliases,
        curriculumPointIds:
          pointIdsByTermId.get(row.id)?.length
            ? pointIdsByTermId.get(row.id) ?? []
            : local?.curriculumPointIds ?? [],
        legacyTopicIds:
          row.legacy_topic_ids.length > 0
            ? row.legacy_topic_ids
            : local?.legacyTopicIds ?? [],
      } satisfies GlossaryTerm;
    }),
    (left, right) => sortByText(left.term, right.term)
  );

  const termById = mapById(terms);

  const points = mergeLocalAndRemote(
    localSnapshot.points,
    tables.points
      .filter((row) => row.parent_point_id !== null)
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((row) => {
        const local = localPointsById.get(row.id);
        const pointTerms = (termIdsByPointId.get(row.id) ?? [])
          .map((termId) => termById.get(termId)?.term)
          .filter(Boolean) as string[];
        const practicePrompts =
          promptRowsByPointId.get(row.id)?.map((promptRow) => promptRow.prompt_text) ??
          [];
        const areaId = row.parent_point_id ?? local?.areaId ?? "";
        const area = localAreasById.get(areaId);

        return {
          id: row.id,
          code: row.code,
          title: row.title,
          summary: row.summary,
          areaId,
          areaCode: local?.areaCode ?? area?.code ?? "",
          relatedTerms: pointTerms.length > 0 ? pointTerms : local?.relatedTerms ?? [],
          relatedConcepts: local?.relatedConcepts ?? [],
          markSchemeIdeas: local?.markSchemeIdeas ?? [],
          practicePrompts:
            practicePrompts.length > 0 ? practicePrompts : local?.practicePrompts ?? [],
        } satisfies CurriculumPoint;
      }),
    comparePoints
  );

  const pointsByAreaId = groupStringsByKey(
    points.map((point) => ({ key: point.areaId, value: point.id })),
    sortByText
  );
  const pointById = mapById(points);
  const areaRowsById = new Map(
    tables.points
      .filter((row) => row.parent_point_id === null)
      .map((row) => [row.id, row])
  );

  const areas = mergeLocalAndRemote(
    localSnapshot.areas,
    [...areaRowsById.values()].map((row) => {
      const local = localAreasById.get(row.id);
      const pointIds = pointsByAreaId.get(row.id) ?? [];

      return {
        id: row.id,
        code: row.code,
        title: row.title,
        summary: row.summary,
        officialSourceId: local?.officialSourceId ?? "dsd-spec-2025",
        points: pointIds
          .map((pointId) => pointById.get(pointId))
          .filter((point): point is CurriculumPoint => Boolean(point)),
      } satisfies CurriculumArea;
    }),
    (left, right) => sortByText(left.code, right.code)
  ).map((area) => ({
    ...area,
    points: points.filter((point) => point.areaId === area.id),
  }));

  const sources = mergeLocalAndRemote(
    localSnapshot.sources,
    tables.sources.map((row) => ({
      id: row.id,
      title: row.title,
      kind: row.kind,
      classification: row.classification,
      filePath: row.file_path,
      year: row.year ?? undefined,
      duplicateOfId: row.duplicate_of_id ?? undefined,
      caution: row.caution ?? undefined,
      notes: row.notes,
    })),
    compareByYearThenTitle
  );

  const resources = mergeLocalAndRemote(
    localSnapshot.resources,
    tables.materials.map((row) => {
      const local = localResourcesById.get(row.id);

      return {
        id: row.id,
        title: row.title,
        kind: row.kind,
        displayType: row.display_type,
        sourceId: row.source_id,
        filePath: row.file_path,
        summary: row.summary,
        year: row.year ?? undefined,
        curriculumPointIds:
          pointIdsByMaterialId.get(row.id)?.length
            ? pointIdsByMaterialId.get(row.id) ?? []
            : local?.curriculumPointIds ?? [],
        legacyTopicIds:
          row.legacy_topic_ids.length > 0
            ? row.legacy_topic_ids
            : local?.legacyTopicIds ?? [],
        tags: row.tags,
        estimatedMinutes: row.estimated_minutes ?? undefined,
      } satisfies ContentResource;
    }),
    compareByYearThenTitle
  );

  const questions = mergeLocalAndRemote(
    localSnapshot.questions,
    tables.questions.map((row) => {
      const local = localQuestionsById.get(row.id);

      return {
        id: row.id,
        sourceId: row.source_id,
        title: row.title,
        sourceLabel: row.source_label,
        year: row.year ?? undefined,
        paper: row.paper ?? undefined,
        marks: row.marks ?? undefined,
        questionType: row.question_type,
        summary: row.summary,
        expectation: row.expectation,
        curriculumPointIds:
          pointIdsByQuestionId.get(row.id)?.length
            ? pointIdsByQuestionId.get(row.id) ?? []
            : local?.curriculumPointIds ?? [],
        legacyTopicIds:
          row.legacy_topic_ids.length > 0
            ? row.legacy_topic_ids
            : local?.legacyTopicIds ?? [],
        practicePrompt: row.practice_prompt ?? local?.practicePrompt ?? row.title,
        markSchemeConceptIds: local?.markSchemeConceptIds ?? [],
        evaluationProfile: local?.evaluationProfile,
        examMetadata:
          row.exam_metadata && Object.keys(row.exam_metadata).length > 0
            ? row.exam_metadata
            : local?.examMetadata,
        reviewed: row.reviewed ?? local?.reviewed,
        active: row.active ?? local?.active,
      } satisfies QuestionMetadata;
    }),
    compareByYearThenTitle
  );

  return {
    origin: "supabase",
    sources,
    areas,
    points,
    terms,
    resources,
    questions,
    legacyTopicMappings: buildLegacyTopicMappings(
      tables.topicPoints,
      localSnapshot.legacyTopicMappings
    ),
  };
}

export async function loadSharedCurriculumSnapshotFromDatabase(
  supabase: CurriculumSupabaseClient
): Promise<SharedCurriculumSnapshot> {
  const fallbackSnapshot = getLocalSharedCurriculumSnapshot();

  try {
    const [
      sourcesResult,
      pointsResult,
      topicPointsResult,
      termsResult,
      pointTermsResult,
      materialsResult,
      pointMaterialsResult,
      questionsResult,
      questionPointsResult,
      practicePromptsResult,
    ] = await Promise.all([
      supabase.from("curriculum_sources").select("*"),
      supabase.from("curriculum_points").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("curriculum_topic_points")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase.from("curriculum_terms").select("*"),
      supabase.from("curriculum_point_terms").select("*"),
      supabase.from("curriculum_materials").select("*"),
      supabase.from("curriculum_point_materials").select("*"),
      supabase.from("curriculum_questions").select("*"),
      supabase.from("curriculum_question_points").select("*"),
      supabase
        .from("curriculum_practice_prompts")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    const errors = [
      sourcesResult.error,
      pointsResult.error,
      topicPointsResult.error,
      termsResult.error,
      pointTermsResult.error,
      materialsResult.error,
      pointMaterialsResult.error,
      questionsResult.error,
      questionPointsResult.error,
      practicePromptsResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      return fallbackSnapshot;
    }

    return buildSharedCurriculumSnapshotFromDatabaseTables({
      sources: (sourcesResult.data ?? []) as SourceRow[],
      points: (pointsResult.data ?? []) as PointRow[],
      topicPoints: (topicPointsResult.data ?? []) as TopicPointRow[],
      terms: (termsResult.data ?? []) as TermRow[],
      pointTerms: (pointTermsResult.data ?? []) as PointTermRow[],
      materials: (materialsResult.data ?? []) as MaterialRow[],
      pointMaterials: (pointMaterialsResult.data ?? []) as PointMaterialRow[],
      questions: (questionsResult.data ?? []) as QuestionRow[],
      questionPoints: (questionPointsResult.data ?? []) as QuestionPointRow[],
      practicePrompts: (practicePromptsResult.data ?? []) as PracticePromptRow[],
    });
  } catch {
    return fallbackSnapshot;
  }
}

export function getCurriculumSeedPayload() {
  return buildCurriculumSeedPayload();
}

export async function syncCurriculumSeed(supabase: CurriculumSupabaseClient) {
  const seed = buildCurriculumSeedPayload();

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_sources")
        .upsert(seed.sources, { onConflict: "id" })
    ).error,
    "curriculum_sources"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_topics")
        .upsert(seed.topics, { onConflict: "id" })
    ).error,
    "curriculum_topics"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_subtopics")
        .upsert(seed.subtopics, { onConflict: "id" })
    ).error,
    "curriculum_subtopics"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_points")
        .upsert(seed.points, { onConflict: "id" })
    ).error,
    "curriculum_points"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_topic_points")
        .upsert(seed.topicPointMappings, { onConflict: "topic_id,point_id" })
    ).error,
    "curriculum_topic_points"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_terms")
        .upsert(seed.terms, { onConflict: "id" })
    ).error,
    "curriculum_terms"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_point_terms")
        .upsert(seed.pointTerms, { onConflict: "point_id,term_id" })
    ).error,
    "curriculum_point_terms"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_materials")
        .upsert(seed.materials, { onConflict: "id" })
    ).error,
    "curriculum_materials"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_point_materials")
        .upsert(seed.pointMaterials, { onConflict: "point_id,material_id" })
    ).error,
    "curriculum_point_materials"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_questions")
        .upsert(seed.questions, { onConflict: "id" })
    ).error,
    "curriculum_questions"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_question_points")
        .upsert(seed.questionPoints, { onConflict: "question_id,point_id" })
    ).error,
    "curriculum_question_points"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_concepts")
        .upsert(seed.concepts, { onConflict: "id" })
    ).error,
    "curriculum_concepts"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_misconceptions")
        .upsert(seed.misconceptions, { onConflict: "id" })
    ).error,
    "curriculum_misconceptions"
  );

  assertSeedWriteError(
    (
      await supabase
        .from("curriculum_practice_prompts")
        .upsert(seed.practicePrompts, { onConflict: "id" })
    ).error,
    "curriculum_practice_prompts"
  );

  return seed;
}

export async function loadCurriculumTopicsFromDatabase(
  supabase: CurriculumSupabaseClient
) {
  const { data, error } = await supabase
    .from("curriculum_topics")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
