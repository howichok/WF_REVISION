import { promises as fs } from "node:fs";
import path from "node:path";
import { buildCurriculumSeedPayload } from "@/data/curriculum";

type SeedConfigEntry = {
  tableName: string;
  rows: Record<string, unknown>[];
  conflictColumns: string[];
  jsonColumns?: string[];
};

const OUTPUT_DIR = path.join(process.cwd(), "supabase");
const SCHEMA_FILE = path.join(OUTPUT_DIR, "full_site_schema.sql");
const SEED_FILE = path.join(OUTPUT_DIR, "full_site_seed.sql");
const BOOTSTRAP_FILE = path.join(OUTPUT_DIR, "full_site_bootstrap.sql");

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlTextArray(values: unknown[]) {
  if (values.length === 0) {
    return "'{}'::text[]";
  }

  return `array[${values.map((value) => sqlString(String(value))).join(", ")}]::text[]`;
}

function sqlJson(value: unknown) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function sqlValue(value: unknown, options?: { isJson?: boolean }) {
  if (value === null || value === undefined) {
    return "null";
  }

  if (options?.isJson) {
    return sqlJson(value);
  }

  if (Array.isArray(value)) {
    return sqlTextArray(value);
  }

  if (typeof value === "string") {
    return sqlString(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "null";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return sqlJson(value);
}

function buildUpsertStatement(config: SeedConfigEntry) {
  if (config.rows.length === 0) {
    return `-- ${config.tableName}: no rows\n`;
  }

  const columns = Object.keys(config.rows[0]);
  const jsonColumns = new Set(config.jsonColumns ?? []);
  const updateColumns = columns.filter(
    (column) => !config.conflictColumns.includes(column)
  );

  const valuesSql = config.rows
    .map((row) => {
      const rowValues = columns.map((column) =>
        sqlValue(row[column], { isJson: jsonColumns.has(column) })
      );
      return `  (${rowValues.join(", ")})`;
    })
    .join(",\n");

  const updateSql =
    updateColumns.length === 0
      ? "do nothing"
      : `do update set\n${updateColumns
          .map((column) => `  ${column} = excluded.${column}`)
          .join(",\n")}`;

  return [
    `-- ${config.tableName} (${config.rows.length} rows)`,
    `insert into public.${config.tableName} (${columns.join(", ")})`,
    "values",
    valuesSql,
    `on conflict (${config.conflictColumns.join(", ")}) ${updateSql};`,
    "",
  ].join("\n");
}

async function main() {
  const seed = buildCurriculumSeedPayload();

  const configs: SeedConfigEntry[] = [
    {
      tableName: "curriculum_sources",
      rows: seed.sources,
      conflictColumns: ["id"],
    },
    {
      tableName: "curriculum_topics",
      rows: seed.topics,
      conflictColumns: ["id"],
    },
    {
      tableName: "curriculum_subtopics",
      rows: seed.subtopics,
      conflictColumns: ["id"],
    },
    {
      tableName: "curriculum_points",
      rows: seed.points,
      conflictColumns: ["id"],
    },
    {
      tableName: "curriculum_topic_points",
      rows: seed.topicPointMappings,
      conflictColumns: ["topic_id", "point_id"],
    },
    {
      tableName: "curriculum_terms",
      rows: seed.terms,
      conflictColumns: ["id"],
    },
    {
      tableName: "curriculum_point_terms",
      rows: seed.pointTerms,
      conflictColumns: ["point_id", "term_id"],
    },
    {
      tableName: "curriculum_materials",
      rows: seed.materials,
      conflictColumns: ["id"],
    },
    {
      tableName: "curriculum_point_materials",
      rows: seed.pointMaterials,
      conflictColumns: ["point_id", "material_id"],
    },
    {
      tableName: "curriculum_questions",
      rows: seed.questions,
      conflictColumns: ["id"],
    },
    {
      tableName: "curriculum_question_points",
      rows: seed.questionPoints,
      conflictColumns: ["question_id", "point_id"],
    },
    {
      tableName: "curriculum_concepts",
      rows: seed.concepts,
      conflictColumns: ["id"],
      jsonColumns: ["required_groups"],
    },
    {
      tableName: "curriculum_misconceptions",
      rows: seed.misconceptions,
      conflictColumns: ["id"],
      jsonColumns: ["signal_groups"],
    },
    {
      tableName: "curriculum_practice_prompts",
      rows: seed.practicePrompts,
      conflictColumns: ["id"],
    },
  ];

  const seedHeader = [
    "-- Full shared content seed for the Walthamforest Revision Website.",
    "-- This seeds the shared curriculum/content tables only.",
    "-- User-specific tables such as profiles, onboarding, progress, activity, diagnostics, and coaching memory are intentionally excluded.",
    "",
    "begin;",
    "",
  ].join("\n");

  const seedBody = configs.map((config) => buildUpsertStatement(config)).join("\n");
  const seedFooter = ["commit;", ""].join("\n");
  const seedSql = `${seedHeader}${seedBody}${seedFooter}`;

  await fs.writeFile(SEED_FILE, seedSql, "utf8");

  const [schemaSql] = await Promise.all([
    fs.readFile(SCHEMA_FILE, "utf8"),
  ]);

  const bootstrapSql = [
    schemaSql.trimEnd(),
    "",
    "-- ============================================================================",
    "-- Shared content seed",
    "-- Source: full_site_seed.sql",
    "-- ============================================================================",
    "",
    seedSql.trimStart(),
    "",
  ].join("\n");

  await fs.writeFile(BOOTSTRAP_FILE, bootstrapSql, "utf8");

  console.log(
    JSON.stringify(
      {
        seedFile: path.relative(process.cwd(), SEED_FILE),
        bootstrapFile: path.relative(process.cwd(), BOOTSTRAP_FILE),
        sources: seed.sources.length,
        topics: seed.topics.length,
        subtopics: seed.subtopics.length,
        points: seed.points.length,
        topicPointMappings: seed.topicPointMappings.length,
        terms: seed.terms.length,
        pointTerms: seed.pointTerms.length,
        materials: seed.materials.length,
        pointMaterials: seed.pointMaterials.length,
        questions: seed.questions.length,
        questionPoints: seed.questionPoints.length,
        concepts: seed.concepts.length,
        misconceptions: seed.misconceptions.length,
        practicePrompts: seed.practicePrompts.length,
      },
      null,
      2
    )
  );
}

void main();
