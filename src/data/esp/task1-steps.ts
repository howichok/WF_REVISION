/**
 * Task 1 lesson steps. Every step drives an object-based scene (see
 * `components/features/revision/esp/scene-engine/`). Teaching copy is in the
 * left column of the lesson page; the scene is the right column.
 */
import type { SceneBeat, SceneDescriptor } from "@/components/features/revision/esp/scene-engine/types";
import { PLAN_LAYERS_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task1/plan-layers-scene";
import { BRIEF_TRIAGE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/brief-triage-scene";
import { SDLC_COMPARE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task1/sdlc-compare-scene";
import { GANTT_BUILD_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task1/gantt-build-scene";
import { DEP_ARROWS_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task1/dep-arrows-scene";
import { ROLES_MAP_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task1/roles-map-scene";
import { TESTING_LANE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task1/testing-lane-scene";
import { RISK_TABLE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task1/risk-table-scene";
import { RATIONALE_COMPARE_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task1/rationale-compare-scene";
import { MISTAKE_CARDS_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/task1/mistake-cards-scene";
import { PRACTICE_UPLOAD_BEATS } from "@/components/features/revision/esp/scene-engine/scenes/practice-upload-scene";

export type StepKind =
  | "intro"
  | "brief"
  | "methodology"
  | "stages"
  | "dependencies"
  | "roles"
  | "testing"
  | "risks"
  | "rationale"
  | "mistakes"
  | "practice";

export interface Task1Step {
  id: StepKind;
  number: number;
  label: string;
  emoji: string;
  duration: string;
  headline: string;
  lead: string;
  keyPoints: string[];
  weak?: { label: string; example: string };
  strong?: { label: string; example: string };
  takeaway: string;
  scene: SceneDescriptor;
  beats: SceneBeat[];
}

export const TASK1_STEPS: Task1Step[] = [
  {
    id: "intro",
    number: 1,
    label: "What is Task 1?",
    emoji: "📋",
    duration: "2 min",
    headline: "Task 1 is a 3-hour planning exam — not a coding task.",
    lead:
      "You receive a client brief, a team roster, and a spreadsheet template. Your job is to produce a Gantt-style project plan, resource/cost table, and a written rationale that justifies every decision.",
    keyPoints: [
      "3 hours exam time — planning, not building.",
      "Deliverable: Project Plan in Excel + written Rationale.",
      "Markers reward explanation of WHY — not just what.",
      "You are assessed on: sequencing, staff allocation, testing visibility, rationale depth, risk/cost awareness, and full project coverage.",
    ],
    takeaway: "A Gantt without a rationale scores half marks. A rationale without a Gantt scores nothing.",
    scene: { id: "task1-plan-layers" },
    beats: PLAN_LAYERS_BEATS,
  },
  {
    id: "brief",
    number: 2,
    label: "Read the brief",
    emoji: "📄",
    duration: "3 min",
    headline: "Read once for the client aim. Read again for constraints.",
    lead:
      "The brief gives you the client, the deadline, the team, and the files. Before touching the spreadsheet, triage it: underline aims, highlight constraints, circle risks.",
    keyPoints: [
      "Who is the client? What problem must be solved?",
      "What are the deliverables the client will actually receive?",
      "What roles and skills are available in the team?",
      "What constraints exist (deadline, budget, data sensitivity, absent staff)?",
    ],
    weak: {
      label: "Weak",
      example: "Started planning immediately without noting the tester is part-time in weeks 3–4.",
    },
    strong: {
      label: "Strong",
      example: "Noted: tester is shared 50% from week 3. Planned regression in week 5 instead.",
    },
    takeaway: "Every planning decision you make in the next steps should trace back to a fact in the brief.",
    scene: { id: "task1-brief-highlight", data: { wide: true } },
    beats: BRIEF_TRIAGE_BEATS,
  },
  {
    id: "methodology",
    number: 3,
    label: "Choose a methodology",
    emoji: "⚙️",
    duration: "2 min",
    headline: "Pick Agile or Waterfall — and justify it in the rationale.",
    lead:
      "Markers want to see you chose a methodology that fits the brief, not just the first one you remembered. If requirements are fixed and the deadline is tight, Waterfall works. If the client may change scope, lean towards Agile/iterative.",
    keyPoints: [
      "Waterfall: fixed requirements, clear phases, best when spec is locked.",
      "Agile/Iterative: changing requirements, early delivery, good for clients who may discover new needs.",
      "Never just write 'Agile' — say WHY it fits this client.",
      "Your methodology choice sets the stage sequence logic.",
    ],
    weak: {
      label: "Weak answer",
      example: "\"We will use Agile because it is flexible and good for development.\"",
    },
    strong: {
      label: "Strong answer",
      example:
        "\"Waterfall is appropriate because the clinic has fixed requirements and a hard go-live date of week 6.\"",
    },
    takeaway: "One sentence linking methodology to the client's specific situation is worth more than a definition.",
    scene: { id: "task1-sdlc-compare" },
    beats: SDLC_COMPARE_BEATS,
  },
  {
    id: "stages",
    number: 4,
    label: "Break into stages",
    emoji: "📊",
    duration: "4 min",
    headline: "Aim for 5–7 stages. Not 3 big blocks. Not 20 micro-tasks.",
    lead:
      "Turn the brief's deliverables into bar titles. One bar = one meaningful chunk of work that produces something a marker can verify (a document, a module, test evidence).",
    keyPoints: [
      "Start with requirements / brief analysis (always first).",
      "Add design before any build — data model, UI wireframes.",
      "Split build into slices if testing can happen in parallel.",
      "Always end with deployment prep / handover — not just 'done'.",
      "4–7 bars is the sweet spot for a 6-week project.",
    ],
    weak: {
      label: "Too few (3 blocks)",
      example: "Plan → Build → Test   (no design, no regression, no handover)",
    },
    strong: {
      label: "Good decomposition",
      example:
        "Requirements · Data design · UI design · Build import · Build UI · Integration test · Regression · Handover",
    },
    takeaway: "If a marker can't see where design ends and build begins, the plan looks generic.",
    scene: { id: "task1-gantt-build" },
    beats: GANTT_BUILD_BEATS,
  },
  {
    id: "dependencies",
    number: 5,
    label: "Wire dependencies",
    emoji: "🔗",
    duration: "3 min",
    headline: "Dependency arrows are worth marks on their own.",
    lead:
      "Once you have bars, decide what must finish before the next can start. This is what separates a real project plan from a list.",
    keyPoints: [
      "Requirements → Data design (can't design without knowing the data).",
      "Design → Build (can't build without the schema/mockup).",
      "Build → Integration test (can't test what isn't built).",
      "Integration test → Regression (can't retest without first running).",
      "Parallel OK: UI design and data design can overlap if different people.",
    ],
    weak: {
      label: "No dependencies shown",
      example: "All bars the same width, equally spaced, no arrows — looks like a guess.",
    },
    strong: {
      label: "Dependencies visible",
      example: "Data design ends before Build starts. Regression starts only after fixes from Integration test.",
    },
    takeaway: "At least 3 arrows or explicit 'cannot start until...' notes in the rationale.",
    scene: { id: "task1-dep-arrows" },
    beats: DEP_ARROWS_BEATS,
  },
  {
    id: "roles",
    number: 6,
    label: "Assign roles & calculate cost",
    emoji: "👥",
    duration: "3 min",
    headline: "Every bar must have a named owner. Every owner has a day-rate.",
    lead:
      "Pick roles from the brief — don't invent titles. Assign based on skills: the DBA does data design, not the UX specialist.",
    keyPoints: [
      "Use only the roles named in the brief.",
      "DBA → data stages. Developer → build. Tester → test stages. UX → design.",
      "If someone is part-time or absent, reflect that in the bar's length.",
      "Cost = days on stage × daily rate. Total at the bottom.",
      "A stage with no owner looks like an oversight.",
    ],
    weak: {
      label: "Wrong allocation",
      example: "PM assigned to Build — PM manages, doesn't code. DBA has no stages.",
    },
    strong: {
      label: "Skill-matched allocation",
      example: "DBA: weeks 1–2 data design. Dev: weeks 3–4 build. Tester (shared): weeks 4–5 test.",
    },
    takeaway: "If the tester is shared (brief says 50%), their bar covers fewer days — show it.",
    scene: { id: "task1-roles-map" },
    beats: ROLES_MAP_BEATS,
  },
  {
    id: "testing",
    number: 7,
    label: "Make testing visible",
    emoji: "🧪",
    duration: "3 min",
    headline: "Testing bolted on at the end = marks lost. Plan it in the middle.",
    lead:
      "Markers specifically look for test stages before the final handover. You should have at least: integration testing after the first build milestone, regression after fixes, and ideally user acceptance testing before go-live.",
    keyPoints: [
      "Integration test: after each major feature, before anything else depends on it.",
      "Regression test: after every significant fix — not optional.",
      "User acceptance test (UAT): client or representative verifies the system.",
      "If tester capacity is shared, stage test windows to avoid clashes.",
      "Mention what is tested: normal, boundary, and erroneous data.",
    ],
    weak: {
      label: "Test as last stage",
      example: "Build W1–W5, Test W6. No regression. Tester not even in the role column.",
    },
    strong: {
      label: "Testing woven in",
      example:
        "Int. test W4 (after import build). Regression W5 (after fixes). UAT W5–6 (client sign-off).",
    },
    takeaway: "One testing lane is a minimum. Two (integration + regression) is expected. Three (+ UAT) is strong.",
    scene: { id: "task1-testing-lane" },
    beats: TESTING_LANE_BEATS,
  },
  {
    id: "risks",
    number: 8,
    label: "Identify risks & costs",
    emoji: "⚠️",
    duration: "3 min",
    headline: "Pick real risks from the brief — not generic 'developers might be ill'.",
    lead:
      "The rationale section needs at least 2 risks with mitigations, and the cost table must be defensible.",
    keyPoints: [
      "Pick risks that are specific to this scenario (data import quality, shared tester, hard deadline).",
      "Each risk needs: probability/impact statement + what you did about it in the schedule.",
      "Cost = total staff days × day-rate. Add licence/tool costs if mentioned.",
      "Justify any expensive stages: 'Build takes 10 dev-days (£3,200) because the import module needs validation loops'.",
    ],
    weak: {
      label: "Generic risk",
      example: '"Risk: team member could be sick. Mitigation: have a backup developer." — could apply to any project.',
    },
    strong: {
      label: "Brief-specific risk",
      example:
        '"Risk: appointment CSV from clinic may have missing patient IDs. Mitigation: data audit in week 1; import blocked until clean sample confirmed."',
    },
    takeaway: "If your risk could appear on any plan for any client, it earns no marks.",
    scene: { id: "task1-risk-table" },
    beats: RISK_TABLE_BEATS,
  },
  {
    id: "rationale",
    number: 9,
    label: "Write the rationale",
    emoji: "✍️",
    duration: "4 min",
    headline: "The rationale justifies. It does not describe.",
    lead:
      "Most students lose marks by writing what the plan shows rather than why the decisions were made.",
    keyPoints: [
      "Sentence pattern: 'X comes before Y because Z.'",
      "Reference the brief: use the client's name, the constraints, the actual roles.",
      "Mention dependencies: 'Data design cannot start until the CSV has been inspected.'",
      "Mention cost trade-offs: 'Using the junior developer for build keeps the sprint cost at £3,200.'",
      "Mention testing protection: 'Regression in week 5 protects the client from import errors reaching go-live.'",
    ],
    weak: {
      label: "Describes the plan",
      example:
        '"The plan has eight stages. First we do requirements, then design, then build. Testing happens at the end."',
    },
    strong: {
      label: "Justifies decisions",
      example:
        '"Requirements precede data design because the clinic\'s CSV format must be confirmed before the DBA designs the schema — a missed field would require a rebuild."',
    },
    takeaway: "Read each sentence and ask 'so what for this client?' If you can't answer, the sentence is too generic.",
    scene: { id: "task1-rationale-compare" },
    beats: RATIONALE_COMPARE_BEATS,
  },
  {
    id: "mistakes",
    number: 10,
    label: "What kills your marks",
    emoji: "❌",
    duration: "2 min",
    headline: "These are the most common ways students lose marks in Task 1.",
    lead: "Before you practise, learn the patterns that examiners see most. Every card below costs marks.",
    keyPoints: [
      "Overly generic plan that could apply to any project.",
      "No testing stage, or testing only as the very last bar.",
      "Rationale that just re-describes the Gantt.",
      "Roles not matching skills (PM doing coding).",
      "No dependencies — all bars same width, no arrows.",
      "Risks are not specific to this brief.",
    ],
    takeaway: "Print this list. Before submitting, check every item.",
    scene: { id: "task1-mistake-cards" },
    beats: MISTAKE_CARDS_BEATS,
  },
  {
    id: "practice",
    number: 11,
    label: "Your turn",
    emoji: "🎯",
    duration: "Your time",
    headline: "Now build your own plan. AI will mark it when you're ready.",
    lead:
      "Apply everything from the lesson. Fill in all three sheets (Schedule, Cost plan, Rationale). When you're happy, hit 'Submit for AI marking' — Gemini will score each criterion and show you exactly what to improve.",
    keyPoints: [
      "Use the Download button to work in real Microsoft Excel if you prefer.",
      "Fill the Schedule, Cost plan, and Rationale sheets.",
      "AI marks 6 criteria: Sequencing, Staff, Testing, Rationale, Risk/Cost, Coverage.",
      "You'll see a score, band, per-criterion feedback, and a model answer for each weak area.",
    ],
    takeaway: "Treat this like a real 3-hour session. Use the criteria list as a checklist before submitting.",
    scene: { id: "practice-upload", data: { taskId: "task_1" } },
    beats: PRACTICE_UPLOAD_BEATS,
  },
];
