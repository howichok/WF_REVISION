import { REVISION_QUESTION_SCHEMAS } from "@/lib/intelligence/rules/revision";
import { TOPICS, TOPIC_TREES } from "@/lib/types";
import {
  CONTENT_RESOURCES,
  CONTENT_SOURCES,
  DSD_CURRICULUM_AREAS,
  DSD_CURRICULUM_POINTS,
  GLOSSARY_TERMS,
  LEGACY_TOPIC_MAPPINGS,
  QUESTION_METADATA,
} from ".";

function getSortOrderFromCode(code: string) {
  return Number(
    code
      .split(".")
      .map((part) => part.padStart(2, "0"))
      .join("")
  );
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

export function buildCurriculumSeedPayload() {
  const schemaBySubtopicId = new Map(
    REVISION_QUESTION_SCHEMAS.filter((schema) => schema.subtopicId).map((schema) => [
      schema.subtopicId as string,
      schema,
    ])
  );

  const sources = CONTENT_SOURCES.map((source) => ({
    id: source.id,
    title: source.title,
    kind: source.kind,
    classification: source.classification,
    file_path: source.filePath,
    year: source.year ?? null,
    duplicate_of_id: source.duplicateOfId ?? null,
    caution: source.caution ?? null,
    notes: source.notes,
  }));

  const topics = TOPICS.map((topic, index) => ({
    id: topic.id,
    label: topic.label,
    short_label: topic.shortLabel,
    icon: topic.icon,
    description:
      TOPIC_TREES.find((tree) => tree.topicId === topic.id)?.description ??
      `${topic.label} curriculum topic.`,
    mapping_note:
      LEGACY_TOPIC_MAPPINGS.find((mapping) => mapping.topicId === topic.id)?.note ??
      null,
    sort_order: index + 1,
  }));

  const subtopics = TOPIC_TREES.flatMap((tree) =>
    tree.subtopics.map((subtopic, index) => {
      const schema = schemaBySubtopicId.get(subtopic.id);

      return {
        id: subtopic.id,
        topic_id: tree.topicId,
        label: subtopic.label,
        summary: schema ? schema.rubricSummary.join(" ") : null,
        keywords: uniqueStrings(subtopic.keywords),
        sort_order: index + 1,
      };
    })
  );

  const pointRows = [
    ...DSD_CURRICULUM_AREAS.map((area, index) => ({
      id: area.id,
      code: area.code,
      title: area.title,
      summary: area.summary,
      source_id: area.officialSourceId,
      parent_point_id: null,
      depth: 1,
      sort_order: index + 1,
    })),
    ...DSD_CURRICULUM_POINTS.map((point) => ({
      id: point.id,
      code: point.code,
      title: point.title,
      summary: point.summary,
      source_id: "dsd-spec-2025",
      parent_point_id: point.areaId,
      depth: point.code.split(".").length,
      sort_order: getSortOrderFromCode(point.code),
    })),
  ];

  const topicPointMappings = LEGACY_TOPIC_MAPPINGS.flatMap((mapping) =>
    mapping.officialPointIds.map((pointId, index) => ({
      topic_id: mapping.topicId,
      point_id: pointId,
      sort_order: index + 1,
    }))
  );

  const terms = GLOSSARY_TERMS.map((term) => ({
    id: term.id,
    term: term.term,
    definition: term.definition,
    aliases: term.aliases ?? [],
    legacy_topic_ids: term.legacyTopicIds,
  }));

  const pointTerms = GLOSSARY_TERMS.flatMap((term) =>
    term.curriculumPointIds.map((pointId) => ({
      point_id: pointId,
      term_id: term.id,
    }))
  );

  const materials = CONTENT_RESOURCES.map((resource) => ({
    id: resource.id,
    source_id: resource.sourceId,
    title: resource.title,
    kind: resource.kind,
    display_type: resource.displayType,
    file_path: resource.filePath,
    summary: resource.summary,
    year: resource.year ?? null,
    tags: resource.tags,
    legacy_topic_ids: resource.legacyTopicIds,
    estimated_minutes: resource.estimatedMinutes ?? null,
  }));

  const pointMaterials = CONTENT_RESOURCES.flatMap((resource) =>
    resource.curriculumPointIds.map((pointId) => ({
      point_id: pointId,
      material_id: resource.id,
    }))
  );

  const questions = QUESTION_METADATA.map((question) => ({
    id: question.id,
    source_id: question.sourceId,
    title: question.title,
    source_label: question.sourceLabel,
    year: question.year ?? null,
    paper: question.paper ?? null,
    question_type: question.questionType,
    marks: question.marks ?? null,
    summary: question.summary,
    expectation: question.expectation,
    practice_prompt: question.practicePrompt,
    legacy_topic_ids: question.legacyTopicIds,
  }));

  const questionPoints = QUESTION_METADATA.flatMap((question) =>
    question.curriculumPointIds.map((pointId) => ({
      question_id: question.id,
      point_id: pointId,
    }))
  );

  const concepts = REVISION_QUESTION_SCHEMAS.flatMap((schema) =>
    schema.concepts.map((concept) => ({
      id: `${schema.subtopicId ?? schema.id}::${concept.id}`,
      topic_id: schema.topicId,
      subtopic_id: schema.subtopicId ?? schema.id,
      question_schema_id: schema.id,
      label: concept.label,
      weight: concept.weight,
      feedback: concept.feedback,
      required_groups: concept.requiredGroups,
    }))
  );

  const misconceptions = REVISION_QUESTION_SCHEMAS.flatMap((schema) =>
    schema.misconceptions.map((misconception) => ({
      id: `${schema.subtopicId ?? schema.id}::${misconception.id}`,
      topic_id: schema.topicId,
      subtopic_id: schema.subtopicId ?? schema.id,
      question_schema_id: schema.id,
      label: misconception.label,
      explanation: misconception.explanation,
      penalty: misconception.penalty,
      signal_groups: misconception.groups,
    }))
  );

  const practicePrompts = [
    ...DSD_CURRICULUM_POINTS.flatMap((point) =>
      point.practicePrompts.map((prompt, index) => ({
        id: `${point.id}::prompt::${index + 1}`,
        point_id: point.id,
        subtopic_id: null,
        prompt_source: "official-point",
        prompt_text: prompt,
        sort_order: index + 1,
      }))
    ),
    ...REVISION_QUESTION_SCHEMAS.map((schema) => ({
      id: `${schema.id}::prompt`,
      point_id: null,
      subtopic_id: schema.subtopicId ?? null,
      prompt_source: "diagnostic-schema",
      prompt_text: schema.prompt,
      sort_order: 1,
    })),
  ];

  return {
    sources,
    topics,
    subtopics,
    points: pointRows,
    topicPointMappings,
    terms,
    pointTerms,
    materials,
    pointMaterials,
    questions,
    questionPoints,
    concepts,
    misconceptions,
    practicePrompts,
  };
}

export type CurriculumSeedPayload = ReturnType<typeof buildCurriculumSeedPayload>;
