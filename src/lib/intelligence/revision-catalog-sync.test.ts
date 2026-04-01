import test from "node:test";
import assert from "node:assert/strict";
import { PUBLIC_REVISION_QUESTIONS } from "./catalog";
import { REVISION_QUESTION_SCHEMAS } from "./rules/revision";

test("PUBLIC_REVISION_QUESTIONS ids match REVISION_QUESTION_SCHEMAS ids", () => {
  const publicIds = new Set(PUBLIC_REVISION_QUESTIONS.map((q) => q.id));
  const schemaIds = new Set(REVISION_QUESTION_SCHEMAS.map((s) => s.id));

  const onlyPublic = [...publicIds].filter((id) => !schemaIds.has(id));
  const onlySchema = [...schemaIds].filter((id) => !publicIds.has(id));

  assert.deepEqual(
    onlyPublic,
    [],
    `Questions in catalog without schema: ${onlyPublic.join(", ") || "(none)"}`
  );
  assert.deepEqual(
    onlySchema,
    [],
    `Schemas without public catalog entry: ${onlySchema.join(", ") || "(none)"}`
  );
  assert.equal(publicIds.size, schemaIds.size, "Catalog and schema sets should be the same size");
});
