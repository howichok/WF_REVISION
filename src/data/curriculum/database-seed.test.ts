import assert from "node:assert/strict";
import test from "node:test";
import { buildCurriculumSeedPayload } from "./database-seed";

test("every seeded question source id exists in curriculum_sources", () => {
  const seed = buildCurriculumSeedPayload();
  const sourceIds = new Set(seed.sources.map((source) => source.id));
  const missingSourceIds = [
    ...new Set(
      seed.questions
        .map((question) => question.source_id)
        .filter((sourceId) => !sourceIds.has(sourceId))
    ),
  ];

  assert.deepEqual(
    missingSourceIds,
    [],
    `Missing curriculum_sources rows for question source ids: ${missingSourceIds.join(", ")}`
  );
});

test("generated official-point sources are materialized for generated questions", () => {
  const seed = buildCurriculumSeedPayload();
  const generatedSource = seed.sources.find(
    (source) => source.id === "generated-official-point-dsd-8-1"
  );

  assert.ok(generatedSource, "Expected a generated source row for dsd-8.1.");
  assert.equal(generatedSource.kind, "question-bank");
  assert.match(
    generatedSource.file_path,
    /^generated:\/\/official-point-question-factory\//
  );
});
