import test from "node:test";
import assert from "node:assert/strict";
import { buildSharedCurriculumSnapshotFromDatabaseTables } from "./curriculum-database";
import { getLocalSharedCurriculumSnapshot } from "./shared-curriculum";

test("shared curriculum snapshot falls back to local data when database tables are empty", () => {
  const snapshot = buildSharedCurriculumSnapshotFromDatabaseTables({
    sources: [],
    points: [],
    topicPoints: [],
    terms: [],
    pointTerms: [],
    materials: [],
    pointMaterials: [],
    questions: [],
    questionPoints: [],
    practicePrompts: [],
  });

  assert.equal(snapshot.origin, "local");
  assert.equal(snapshot.questions.length, getLocalSharedCurriculumSnapshot().questions.length);
});

test("shared curriculum snapshot merges Supabase rows with local enrichment", () => {
  const localSnapshot = getLocalSharedCurriculumSnapshot();
  const localPoint = localSnapshot.points.find((point) => point.practicePrompts.length > 0);
  assert.ok(localPoint, "Expected a local curriculum point with practice prompts.");

  const localArea = localSnapshot.areas.find((area) => area.id === localPoint.areaId);
  assert.ok(localArea, "Expected the local area for the chosen point.");

  const localTerm = localSnapshot.terms.find((term) =>
    term.curriculumPointIds.includes(localPoint.id)
  );
  assert.ok(localTerm, "Expected a local glossary term for the chosen point.");

  const localMaterial = localSnapshot.resources.find((resource) =>
    resource.curriculumPointIds.includes(localPoint.id)
  );
  assert.ok(localMaterial, "Expected a local resource for the chosen point.");

  const localQuestion = localSnapshot.questions.find((question) =>
    question.curriculumPointIds.includes(localPoint.id)
  );
  assert.ok(localQuestion, "Expected a local question for the chosen point.");

  const localSource = localSnapshot.sources.find(
    (source) => source.id === localMaterial.sourceId || source.id === localQuestion.sourceId
  );
  assert.ok(localSource, "Expected a local source row for the chosen content.");

  const snapshot = buildSharedCurriculumSnapshotFromDatabaseTables({
    sources: [
      {
        id: localSource.id,
        title: `${localSource.title} (Supabase)`,
        kind: localSource.kind,
        classification: localSource.classification,
        file_path: localSource.filePath,
        year: localSource.year ?? null,
        duplicate_of_id: null,
        caution: localSource.caution ?? null,
        notes: localSource.notes,
      },
    ],
    points: [
      {
        id: localArea.id,
        code: localArea.code,
        title: localArea.title,
        summary: `${localArea.summary} (Supabase)`,
        parent_point_id: null,
        depth: 1,
        sort_order: 1,
      },
      {
        id: localPoint.id,
        code: localPoint.code,
        title: `${localPoint.title} (Supabase)`,
        summary: `${localPoint.summary} (Supabase)`,
        parent_point_id: localPoint.areaId,
        depth: localPoint.code.split(".").length,
        sort_order: 10,
      },
    ],
    topicPoints: [
      {
        topic_id: localSnapshot.legacyTopicMappings[0].topicId,
        point_id: localPoint.id,
        sort_order: 1,
      },
    ],
    terms: [
      {
        id: localTerm.id,
        term: localTerm.term,
        definition: `${localTerm.definition} (Supabase)`,
        aliases: localTerm.aliases ?? [],
        legacy_topic_ids: localTerm.legacyTopicIds,
      },
    ],
    pointTerms: [
      {
        point_id: localPoint.id,
        term_id: localTerm.id,
      },
    ],
    materials: [
      {
        id: localMaterial.id,
        source_id: localMaterial.sourceId,
        title: `${localMaterial.title} (Supabase)`,
        kind: localMaterial.kind,
        display_type: localMaterial.displayType,
        file_path: localMaterial.filePath,
        summary: `${localMaterial.summary} (Supabase)`,
        year: localMaterial.year ?? null,
        tags: localMaterial.tags,
        legacy_topic_ids: localMaterial.legacyTopicIds,
        estimated_minutes: localMaterial.estimatedMinutes ?? null,
      },
    ],
    pointMaterials: [
      {
        point_id: localPoint.id,
        material_id: localMaterial.id,
      },
    ],
    questions: [
      {
        id: localQuestion.id,
        source_id: localQuestion.sourceId,
        title: `${localQuestion.title} (Supabase)`,
        source_label: localQuestion.sourceLabel,
        year: localQuestion.year ?? null,
        paper: localQuestion.paper ?? null,
        question_type: localQuestion.questionType,
        marks: localQuestion.marks ?? null,
        summary: `${localQuestion.summary} (Supabase)`,
        expectation: `${localQuestion.expectation} (Supabase)`,
        practice_prompt: `Explain ${localPoint.title} in one focused paragraph.`,
        legacy_topic_ids: localQuestion.legacyTopicIds,
        exam_metadata: {
          assessmentTrack: "esp",
          espTask: "task_1",
          contentArea: "Employer Set Project",
          reviewDecision: "keep",
        },
        reviewed: true,
        active: true,
      },
    ],
    questionPoints: [
      {
        question_id: localQuestion.id,
        point_id: localPoint.id,
      },
    ],
    practicePrompts: [
      {
        id: `${localPoint.id}::prompt::1`,
        point_id: localPoint.id,
        subtopic_id: null,
        prompt_text: `Describe how ${localPoint.title} applies in a scenario.`,
        sort_order: 1,
      },
    ],
  });

  const mergedPoint = snapshot.points.find((point) => point.id === localPoint.id);
  const mergedMaterial = snapshot.resources.find((resource) => resource.id === localMaterial.id);
  const mergedQuestion = snapshot.questions.find((question) => question.id === localQuestion.id);

  assert.equal(snapshot.origin, "supabase");
  assert.ok(mergedPoint);
  assert.equal(mergedPoint.title, `${localPoint.title} (Supabase)`);
  assert.deepEqual(mergedPoint.relatedConcepts, localPoint.relatedConcepts);
  assert.deepEqual(mergedPoint.practicePrompts, [
    `Describe how ${localPoint.title} applies in a scenario.`,
  ]);

  assert.ok(mergedMaterial);
  assert.equal(mergedMaterial.summary, `${localMaterial.summary} (Supabase)`);
  assert.deepEqual(mergedMaterial.curriculumPointIds, [localPoint.id]);

  assert.ok(mergedQuestion);
  assert.equal(mergedQuestion.practicePrompt, `Explain ${localPoint.title} in one focused paragraph.`);
  assert.deepEqual(mergedQuestion.markSchemeConceptIds, localQuestion.markSchemeConceptIds);
  assert.equal(mergedQuestion.examMetadata?.assessmentTrack, "esp");
  assert.equal(mergedQuestion.reviewed, true);
  assert.equal(mergedQuestion.active, true);
});
