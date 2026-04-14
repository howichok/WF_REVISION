/**
 * Prints question counts from the bundled curriculum (source of truth for Exam Questions),
 * not from Supabase row counts (the app does not store the full bank in Postgres).
 */
import { QUESTION_METADATA } from "@/data/curriculum";
import { getTopicContentBundle } from "@/lib/content";
import { getExamRawPoolForTopic } from "@/lib/exam-conditions";
import { TOPICS } from "@/lib/types";

function countByPaper(rows: { paper?: string }[]) {
  let paper1 = 0;
  let paper2 = 0;
  let other = 0;
  for (const row of rows) {
    if (row.paper === "Paper 1") {
      paper1 += 1;
    } else if (row.paper === "Paper 2") {
      paper2 += 1;
    } else {
      other += 1;
    }
  }
  return { paper1, paper2, other, total: rows.length };
}

const allMeta = countByPaper(QUESTION_METADATA);
console.log("QUESTION_METADATA (all bundled questions):");
console.log(`  Paper 1: ${allMeta.paper1}`);
console.log(`  Paper 2: ${allMeta.paper2}`);
console.log(`  No paper / other: ${allMeta.other}`);
console.log(`  Total: ${allMeta.total}\n`);

console.log("Exam-eligible pool per revision topic (legacyTopicIds + getExamRawPoolForTopic logic):");
let sumPool = 0;
let sumP1 = 0;
let sumP2 = 0;
for (const topic of TOPICS) {
  const bundle = getTopicContentBundle(topic.id);
  const pool = getExamRawPoolForTopic(topic.id, bundle.questions);
  const c = countByPaper(pool);
  sumPool += c.total;
  sumP1 += c.paper1;
  sumP2 += c.paper2;
  console.log(
    `  ${topic.id.padEnd(22)} pool=${String(c.total).padStart(3)}  P1=${c.paper1}  P2=${c.paper2}  other=${c.other}`
  );
}
console.log(
  `  ${"(sum per-topic rows)".padEnd(22)} pool=${String(sumPool).padStart(3)}  P1=${sumP1}  P2=${sumP2}  (multi-tag questions counted in several topics)`
);

const unionIds = new Map<string, { paper?: string }>();
for (const topic of TOPICS) {
  const bundle = getTopicContentBundle(topic.id);
  for (const q of getExamRawPoolForTopic(topic.id, bundle.questions)) {
    unionIds.set(q.id, q);
  }
}
const unionList = [...unionIds.values()];
const unionCounts = countByPaper(unionList);
console.log("\nExam-eligible union (unique question ids across all topics):");
console.log(`  Paper 1: ${unionCounts.paper1}`);
console.log(`  Paper 2: ${unionCounts.paper2}`);
console.log(`  No paper / other: ${unionCounts.other}`);
console.log(`  Unique total: ${unionCounts.total}`);
