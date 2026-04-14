/**
 * ESP lesson copy grounded in sources/espsource/review/codex-esp-reviewed-draft.txt
 * (esp-source-pattern-* notes). Used by lesson-first task pages — not imported at runtime from the txt file.
 */
import type { EspTask } from "@/data/curriculum";

export type LessonVisualSpec =
  | {
      kind: "flow";
      caption?: string;
      nodes: { id: string; label: string }[];
      edges: { from: string; to: string }[];
    }
  | { kind: "pipeline"; caption?: string; stages: { label: string; sub?: string }[] }
  | { kind: "timeline"; caption?: string; steps: { title: string; text: string }[] }
  | {
      kind: "beforeAfter";
      caption?: string;
      beforeLabel: string;
      afterLabel: string;
      before: string;
      after: string;
    }
  | { kind: "clickMap"; caption?: string; stages: { id: string; title: string; detail: string }[] };

/**
 * Vector “picture” drawn in code (SVG) for a do-now frame — replaces ASCII sketches.
 * Task 1 uses these; other tasks can add later.
 */
export type EspDoNowPicture =
  | { kind: "fourZones" }
  | { kind: "deliverableBars"; labels: string[] }
  | { kind: "dependencyChain"; steps: string[] }
  | { kind: "rolesUnderBars"; pairs: { bar: string; role: string }[] }
  | { kind: "testingTimeline"; segments: string[] }
  | { kind: "riskSplit"; risk: string; mitigation: string }
  | { kind: "rationaleLines" };

/** One “video beat”: what to literally do on paper / in the file before moving on. */
export interface EspLessonDoNowFrame {
  headline: string;
  /** Short imperative lines — each is something the learner does now */
  actions: string[];
  /** Programmatic illustration (SVG) — preferred over sketch */
  picture?: EspDoNowPicture;
  /** Optional ASCII fallback if picture is absent */
  sketch?: string;
}

export interface EspTaskLessonContent {
  taskId: EspTask;
  introTitle: string;
  introLead: string;
  whyItExists: string;
  whatYouAreGiven: string[];
  whatYouMustProduce: string[];
  processSteps: { title: string; body: string }[];
  commonMistakes: string[];
  strongResponse: string;
  workedExample: { title: string; setup: string; takeaway: string };
  recapChecklist: string[];
  /** Shown near clickMap / interactive blocks */
  interactiveHint?: string;
  primaryVisual: LessonVisualSpec;
  secondaryVisual?: LessonVisualSpec;
  practiceSectionLead: string;
  /**
   * When set, the lesson wizard shows these instead of generic “beat” slides:
   * one Next = one concrete on-screen action (video-lesson style).
   */
  doNowFrames?: EspLessonDoNowFrame[];
}

export type EspExplainerSceneKind =
  | "intro"
  | "processMap"
  | "guidedWalkthrough"
  | "artefact"
  | "mistakeCompare"
  | "recap"
  | "practicePrompt";

export interface EspExplainerStep {
  title: string;
  detail: string;
  artefact?: string;
}

export type EspExplainerArtefact =
  | {
      kind: "brief";
      title: string;
      facts: string[];
      callouts: string[];
    }
  | {
      kind: "plan";
      title: string;
      bars: { label: string; owner: string; note: string }[];
      callouts: string[];
    }
  | {
      kind: "code";
      title: string;
      beforeLines: string[];
      afterLines: string[];
      callouts: string[];
    }
  | {
      kind: "flow";
      title: string;
      nodes: string[];
      branches: string[];
      callouts: string[];
    }
  | {
      kind: "build";
      title: string;
      layers: { label: string; detail: string }[];
      output: string[];
      callouts: string[];
    }
  | {
      kind: "evaluation";
      title: string;
      sections: { label: string; evidence: string; judgement: string }[];
      callouts: string[];
    }
  | {
      kind: "table";
      title: string;
      headers: string[];
      rows: string[][];
      callouts: string[];
    };

export interface EspExplainerScene {
  id: string;
  kind: EspExplainerSceneKind;
  kicker: string;
  title: string;
  narration: string;
  focus: string;
  durationMs: number;
  steps?: EspExplainerStep[];
  artefact?: EspExplainerArtefact;
  compare?: {
    weakTitle: string;
    weak: string[];
    strongTitle: string;
    strong: string[];
    takeaway: string;
  };
  checklist?: string[];
}

const preRelease: EspTaskLessonContent = {
  taskId: "pre_release",
  introTitle: "Brief read — triage before you plan",
  introLead:
    "The brief layer gives the vocational scenario, facts, constraints, staff roles and file evidence. Your job is to sort that into decisions before Task 1 planning.",
  whyItExists:
    "Markers reward students who show they understood the client need, constraints, deliverables and risks before committing to a schedule. That is the pre-release / brief evidence layer (see reviewed pattern esp-source-pattern-pre-release).",
  whatYouAreGiven: [
    "A client brief (scenario, aim, deadlines).",
    "Lists of roles, files, templates or spreadsheets mentioned in the pack.",
    "Hints about data sensitivity, users, or quality expectations.",
  ],
  whatYouMustProduce: [
    "A structured triage note: aim, constraints, files to use, risks, assumptions to confirm.",
    "A clear line between facts from the brief and what you have not decided yet.",
  ],
  processSteps: [
    {
      title: "Read for the client aim",
      body: "Who benefits, what service improves, what “done” looks like for them.",
    },
    {
      title: "Harvest constraints and files",
      body: "Deadlines, formats, data rules, accessibility, security — tie each to evidence in the pack.",
    },
    {
      title: "Flag risks and open decisions",
      body: "What could block delivery? What must be confirmed before you sequence work?",
    },
    {
      title: "Only then hand off to planning",
      body: "Task 1 should inherit your triage: no surprise constraints invented mid-plan.",
    },
  ],
  commonMistakes: [
    "Jumping straight to a Gantt chart without naming deliverables you can evidence.",
    "Copying generic PM vocabulary that does not match this client.",
    "Ignoring sensitive data or user skill level stated in the brief.",
  ],
  strongResponse:
    "Short sections, bullet facts, explicit “evidence file: …” references, and risks with a one-line control idea. That matches useForGeneration in the reviewed draft.",
  workedExample: {
    title: "Council volunteering triage (pattern from draft)",
    setup:
      "Brief: coordinators match residents to verified roles; sensitive volunteer data; non-technical users; delivery window stated.",
    takeaway:
      "Your note should name the aim, list constraints (privacy, usability), list supplied files, then list risks (e.g. verification backlog) before any plan.",
  },
  recapChecklist: [
    "Client aim in one plain sentence.",
    "Constraints tied to the brief, not invented.",
    "File / evidence checklist.",
    "Risks + what you need decided before Task 1.",
  ],
  interactiveHint: "Tap each stage to see what you should produce there.",
  primaryVisual: {
    kind: "flow",
    caption: "From pack to plan-ready triage",
    nodes: [
      { id: "brief", label: "Read brief" },
      { id: "facts", label: "List facts & files" },
      { id: "risk", label: "Risks & assumptions" },
      { id: "gate", label: "Ready for Task 1" },
    ],
    edges: [
      { from: "brief", to: "facts" },
      { from: "facts", to: "risk" },
      { from: "risk", to: "gate" },
    ],
  },
  secondaryVisual: {
    kind: "clickMap",
    caption: "What each part of your triage note is for",
    stages: [
      {
        id: "aim",
        title: "Client aim",
        detail: "One outcome the service must improve — written so a non-developer marker agrees.",
      },
      {
        id: "evidence",
        title: "Evidence you will use",
        detail: "Files, templates, datasets named from the pack — not vague “the spreadsheet”.",
      },
      {
        id: "risks",
        title: "Risks + controls",
        detail: "Each risk has why it matters and what you check before planning dates.",
      },
    ],
  },
  practiceSectionLead:
    "Practise triage notes on varied vocational briefs — same structure, different clients.",
};

const task1: EspTaskLessonContent = {
  taskId: "task_1",
  introTitle: "Task 1 — plan the project like a real delivery",
  introLead:
    "You build a Gantt-style sequence, staff/cost judgement, testing points and a written rationale. Strong work explains sequencing, allocation, risks, time and cost impact (esp-source-pattern-task-1).",
  whyItExists:
    "ESP marks whether your plan could run as a small software project — not whether you memorised definitions. The plan is evidence that you understood dependencies and vocational constraints.",
  whatYouAreGiven: [
    "A scenario with roles, deadlines, sometimes a spreadsheet template.",
    "Often an adjusted situation (e.g. staff absence) where parallel vs sequential work matters.",
  ],
  whatYouMustProduce: [
    "A feasible task order with dependencies.",
    "Staff / role allocation tied to stages.",
    "Testing or regression time visible before “finished”.",
    "Short rationale: why this order, what risks, what cost/time impact.",
  ],
  processSteps: [
    { title: "Chain work in dependency order", body: "Data and design before build; test evidence before handover." },
    { title: "Attach people and tools", body: "Each stage has who does it and what artefact proves progress." },
    { title: "Expose testing early", body: "Markers look for test evidence planned in, not bolted on at the end." },
    { title: "Rationale, not jargon", body: "Every line should answer “so what for this client?”" },
  ],
  doNowFrames: [
    {
      headline: "Block your answer like the mark scheme expects",
      actions: [
        "Draw four labelled blocks: Schedule · Roles & ownership · Testing evidence · Rationale",
        "Leave horizontal space for bars and arrows — not one cramped paragraph",
        "Do not write dates until the dependency chain exists",
      ],
      picture: { kind: "fourZones" },
    },
    {
      headline: "Turn the brief into bar titles",
      actions: [
        "Re-read the brief: underline every deliverable the client will receive (screens, import, report…)",
        "Write each as a short bar title across the page — aim for 4–6, not twenty micro-tasks",
        "If the pack names a spreadsheet or template, copy that exact filename next to the bar it feeds",
      ],
      picture: { kind: "deliverableBars", labels: ["Data import", "UI", "Mgmt summary"] },
    },
    {
      headline: "Number and wire dependencies",
      actions: [
        "Decide which bar must finish before another can start — write 1, 2, 3… in dependency order",
        "Draw arrows from prerequisite → dependent (markers look for this logic)",
        "If two bars can overlap safely, bracket them and label “parallel” with a one-word reason",
      ],
      picture: { kind: "dependencyChain", steps: ["Data", "Design", "Build", "Test"] },
    },
    {
      headline: "Assign real roles from the scenario",
      actions: [
        "Under every bar, write one role from the brief (PM, Dev, Tester, DBA, UX…)",
        "If the brief says someone is absent, part-time, or shared, reflect that in length or a note on the bar",
        "Never leave a bar with no owner — that reads as generic filler",
      ],
      picture: {
        kind: "rolesUnderBars",
        pairs: [
          { bar: "Build", role: "Developer" },
          { bar: "Test", role: "Tester (shared)" },
        ],
      },
    },
    {
      headline: "Make testing visible before “finished”",
      actions: [
        "Insert at least one bar labelled Test / evidence before the final handover polish",
        "Mentally split: normal path, edge/invalid case, regression after fixes — you can annotate tiny sub-notes",
        "If tester capacity is tight in the brief, show waiting time or staggered test windows",
      ],
      picture: {
        kind: "testingTimeline",
        segments: ["Build", "Int. test", "Fix", "Regression", "Handover"],
      },
    },
    {
      headline: "Risks that move dates or cost",
      actions: [
        "Pick 2–3 risks that would genuinely delay this client (data, access, scope creep, hardware…)",
        "Beside each, one mitigation you actually schedule — not “be careful”",
        "Link at least one risk to a testing or data activity you already placed on the schedule",
      ],
      picture: {
        kind: "riskSplit",
        risk: "Bad import rows",
        mitigation: "Sample validation in week 1",
      },
    },
    {
      headline: "Rationale: three sentences, spoken plain English",
      actions: [
        "Sentence 1: why this order fits the deadline / dependencies in the brief",
        "Sentence 2: where testing protects the client outcome (name the risk it kills)",
        "Sentence 3: the time or cost trade-off you accept and why it is still safe",
      ],
      picture: { kind: "rationaleLines" },
    },
  ],
  commonMistakes: [
    "Generic task lists with no dependency arrows or reasons.",
    "Perfectly even weeks for every task — ignores testing or data risk.",
    "Rationale that repeats the brief without new planning decisions.",
  ],
  strongResponse:
    "Readable schedule, named roles, explicit testing milestones, risks with mitigations, and rationale sentences that reference the scenario.",
  workedExample: {
    title: "Clinic reporting tool (draft pattern)",
    setup:
      "Six weeks, PM + dev + DBA + tester + UX; need import, UI, management summary — sequencing must show where testing sits.",
    takeaway:
      "Strong plans show which work is parallel-safe, where tester capacity limits overlap, and where regression happens after fixes.",
  },
  recapChecklist: [
    "Dependencies explicit.",
    "Staff on the right stages.",
    "Testing / regression visible.",
    "Risks + response.",
    "Rationale linked to client constraints.",
  ],
  primaryVisual: {
    kind: "timeline",
    caption: "Typical planning spine (adapt dates to your brief)",
    steps: [
      { title: "Analyse brief & data", text: "Lock scope; inspect supplied files." },
      { title: "Design", text: "Structure solution before heavy build." },
      { title: "Build in slices", text: "Feature + test + small integration steps." },
      { title: "Test & fix", text: "Evidence normal, edge, regression." },
      { title: "Handover prep", text: "Docs, training, deployment risk." },
    ],
  },
  secondaryVisual: {
    kind: "flow",
    caption: "Dependency idea (simplified)",
    nodes: [
      { id: "req", label: "Requirements" },
      { id: "data", label: "Data inspect" },
      { id: "des", label: "Design" },
      { id: "bld", label: "Build" },
      { id: "tst", label: "Test" },
    ],
    edges: [
      { from: "req", to: "data" },
      { from: "data", to: "des" },
      { from: "des", to: "bld" },
      { from: "bld", to: "tst" },
    ],
  },
  practiceSectionLead: "Use the prompts below to rehearse plans and rationales under time pressure.",
};

const task2: EspTaskLessonContent = {
  taskId: "task_2",
  introTitle: "Task 2 — defect fixing with proof",
  introLead:
    "You get faulty Python and a test-log mindset. Diagnosis, minimal fix, then validation with described tests (esp-source-pattern-task-2).",
  whyItExists:
    "Employers need traceability: what was wrong, what changed, how you proved it. Recurring defect types include names, booleans, tuples/lists, dates, file handles, punctuation — your process should catch any class systematically.",
  whatYouAreGiven: ["Broken or fragile code.", "Sometimes a test-log template or expected columns."],
  whatYouMustProduce: [
    "Evidence you reproduced the fault.",
    "Corrected code (smallest change that fixes the cause).",
    "Test log: description, data, expected, actual, outcome.",
  ],
  processSteps: [
    { title: "Reproduce", body: "Run the case that fails; capture actual vs expected." },
    { title: "Locate one root cause", body: "Avoid rewriting unrelated lines." },
    { title: "Patch", body: "Change the smallest coherent unit." },
    { title: "Validate", body: "Normal, boundary, invalid — log each honestly." },
  ],
  commonMistakes: [
    "Showing only final code with no failing run.",
    "Changing five things at once when one caused the bug.",
    "Empty or vague test rows (“works fine”).",
  ],
  strongResponse:
    "Fault narrative → fix snippet → table of tests with real values and pass/fail that matches the narrative.",
  workedExample: {
    title: "Typed input bug",
    setup: "Function misparses text quantities — show wrong output first, then int/float conversion fix, then three logged tests.",
    takeaway: "The marker sees the story of the bug, not a magic perfect file.",
  },
  recapChecklist: [
    "Reproduce step recorded.",
    "Single coherent fix.",
    "Tests include invalid/edge.",
    "Log columns complete.",
  ],
  interactiveHint: "Follow the pipeline mentally before you touch the practice code.",
  primaryVisual: {
    kind: "pipeline",
    caption: "Defect pipeline you should be able to narrate",
    stages: [
      { label: "Observe fault", sub: "capture output" },
      { label: "Diagnose", sub: "one cause" },
      { label: "Fix", sub: "minimal diff" },
      { label: "Log tests", sub: "evidence" },
    ],
  },
  secondaryVisual: {
    kind: "beforeAfter",
    caption: "Evidence shape (illustrative)",
    beforeLabel: "Broken trace",
    afterLabel: "After fix + log",
    before: "print(mystery_total('3', 4))  # NameError or wrong value",
    after: "Logged: normal 12 | edge 0 | invalid → error path | all pass",
  },
  practiceSectionLead: "Rotate through defect packs — same process, different fault classes.",
};

const task3: EspTaskLessonContent = {
  taskId: "task_3",
  introTitle: "Task 3 — design before you code",
  introLead:
    "Design a data-backed solution: decomposition, validation, clear outputs — enough detail that another developer could implement it (esp-source-pattern-task-3).",
  whyItExists:
    "Marks reward algorithmic thinking tied to the supplied dataset, not a sneaky full program disguised as “design”.",
  whatYouAreGiven: ["Requirements and a dataset description or CSV.", "Constraints on outputs, users, or errors."],
  whatYouMustProduce: [
    "Structured design: inputs → validation → processing → outputs.",
    "Explicit handling for bad or edge data.",
    "Justification tied to brief language and fields in the data.",
  ],
  processSteps: [
    { title: "Map data flow", body: "Draw or pseudocode the journey of a row." },
    { title: "Choose validations", body: "Each rule should trace to a client risk." },
    { title: "Pick evidence format", body: "Table, pseudocode, or annotated diagram — whatever is clearest." },
    { title: "Self-check implementability", body: "Could a peer code this without guessing?" },
  ],
  commonMistakes: [
    "Pasting final Python instead of design notation.",
    "Validation rules copied from a generic list.",
    "Outputs that ignore columns actually in the CSV.",
  ],
  strongResponse:
    "Readable pseudocode or flow, validation table keyed to fields, and annotations linking decisions to the brief.",
  workedExample: {
    title: "CSV row journey",
    setup: "Invalid rows → error report branch; valid rows → aggregation path.",
    takeaway: "Both branches named; edge cases (blank numeric, duplicate ID) called out.",
  },
  recapChecklist: [
    "Inputs/outputs named.",
    "Validation justified.",
    "Error path described.",
    "Linked to dataset fields.",
  ],
  primaryVisual: {
    kind: "flow",
    caption: "Happy-path data flow (add a parallel error branch in your real design notes)",
    nodes: [
      { id: "in", label: "Inputs" },
      { id: "val", label: "Validate" },
      { id: "proc", label: "Process" },
      { id: "out", label: "Outputs" },
    ],
    edges: [
      { from: "in", to: "val" },
      { from: "val", to: "proc" },
      { from: "proc", to: "out" },
    ],
  },
  practiceSectionLead: "Practise explaining designs without writing executable solution code.",
};

const task4a: EspTaskLessonContent = {
  taskId: "task_4a",
  introTitle: "Task 4a — build on what you are given",
  introLead:
    "Starter or senior code plus data — extend features, keep structure coherent, capture implementation and test evidence (esp-source-pattern-task-4a).",
  whyItExists:
    "Shows you can work inside an existing product: menus, pandas-style transforms, charts, validation, screenshots or console evidence.",
  whatYouAreGiven: ["Codebase or partial solution.", "Data files.", "Feature brief slice."],
  whatYouMustProduce: [
    "Working change that meets the brief slice.",
    "Evidence: code excerpt, run output, tests or assertions.",
    "Respect for existing patterns (names, structure).",
  ],
  processSteps: [
    { title: "Load and respect assets", body: "Use provided paths and schemas." },
    { title: "Implement one vertical slice", body: "Feature + minimal test before the next feature." },
    { title: "Prove with output", body: "Capture normal and at least one edge." },
  ],
  commonMistakes: [
    "Replacing the whole scaffold.",
    "Silent failure on bad rows.",
    "No output capture — only code paste.",
  ],
  strongResponse:
    "Readable diff-style explanation, runnable path, and outputs that a marker can reconcile with requirements.",
  workedExample: {
    title: "Add reporting slice",
    setup: "Extend totals-by-category with a chart or export — show before/after run.",
    takeaway: "Evidence chain: requirement → code location → output snippet.",
  },
  recapChecklist: [
    "Uses provided data.",
    "Feature traceable in code.",
    "Output evidence.",
    "Tests or checks visible.",
  ],
  primaryVisual: {
    kind: "pipeline",
    caption: "Build loop for timed ESP",
    stages: [
      { label: "Understand starter", sub: "read interfaces" },
      { label: "Implement", sub: "small commit-sized step" },
      { label: "Run + capture", sub: "output / screenshot" },
      { label: "Regression", sub: "old paths still pass" },
    ],
  },
  practiceSectionLead: "Rotate prompts to practise feature adds under realistic constraints.",
};

const task4b: EspTaskLessonContent = {
  taskId: "task_4b",
  introTitle: "Task 4b — evaluate with evidence, not vibes",
  introLead:
    "You reflect on read-only Task 4a-style evidence: link product to requirements, tests, quality, constraints, client impact, improvements (esp-source-pattern-task-4b).",
  whyItExists:
    "Separates “did it work?” from “how do we know, what broke, what next?”. Strong answers quote or point to concrete evidence.",
  whatYouAreGiven: ["Description of what was built and test outcomes.", "Brief expectations (read-only)."],
  whatYouMustProduce: [
    "Judgements tied to requirements and tests.",
    "Honest limits with proportionate impact.",
    "Improvements justified by evidence — no new code here.",
  ],
  processSteps: [
    { title: "Anchor to requirements", body: "Each claim references a test or artefact." },
    { title: "State limits fairly", body: "No catastrophising; name real gaps." },
    { title: "Prioritise improvements", body: "What would help the client next, and why?" },
  ],
  commonMistakes: [
    "Generic self-review (“I worked hard”).",
    "Rewriting Task 4a instead of judging it.",
    "Improvements with no link to observed limits.",
  ],
  strongResponse:
    "Structured sections: met / partially met / evidence / limits / next steps — each paragraph cites a concrete artefact.",
  workedExample: {
    title: "Evaluation spine",
    setup: "Requirement: import CSV → summary. Evidence: test 3 output. Limit: date format edge case.",
    takeaway: "Improvement follows the limit (parser + export), justified by client data risk.",
  },
  recapChecklist: [
    "Requirements mapped to evidence.",
    "Limits specific.",
    "Improvements justified.",
    "No new implementation.",
  ],
  interactiveHint: "Tap each block — this is the shape of a strong evaluation outline.",
  primaryVisual: {
    kind: "clickMap",
    caption: "Evidence-led evaluation map",
    stages: [
      {
        id: "req",
        title: "Requirements check",
        detail: "What the brief asked vs what the solution demonstrates — cite tests or outputs.",
      },
      {
        id: "qual",
        title: "Quality & constraints",
        detail: "Usability, data handling, security or performance as relevant to the scenario.",
      },
      {
        id: "imp",
        title: "Improvements",
        detail: "Prioritised actions that follow from limits you proved above.",
      },
    ],
  },
  secondaryVisual: {
    kind: "timeline",
    caption: "Reading order for your evaluator",
    steps: [
      { title: "Skim evidence bundle", text: "Tests, outputs, key code paths." },
      { title: "Judge each requirement", text: "Met / partial / not met + why." },
      { title: "Synthesise", text: "One paragraph client impact; one risks/improvements." },
    ],
  },
  practiceSectionLead: "Use prompts that force citation-style reflection — no coding in this task.",
};

export const ESP_TASK_EXPLAINER_SCENES: Record<EspTask, EspExplainerScene[]> = {
  pre_release: [
    {
      id: "brief-intro",
      kind: "intro",
      kicker: "Opening",
      title: "Turn the pack into planning evidence",
      narration: "Before Task 1, the brief is not background reading. It is the source of the client aim, constraints, files, risks, and assumptions.",
      focus: "Separate facts from decisions before you plan.",
      durationMs: 6500,
      steps: [
        { title: "You receive", detail: "Scenario, client aim, files, roles, deadlines, and constraints.", artefact: "Brief pack" },
        { title: "You produce", detail: "A triage note that makes Task 1 ready to schedule.", artefact: "Plan-ready facts" },
      ],
    },
    {
      id: "brief-map",
      kind: "processMap",
      kicker: "Process map",
      title: "Read in layers, not in one rush",
      narration: "The same brief is read three times: first for the client aim, then for evidence files, then for blockers and decisions.",
      focus: "Layered reading prevents invented planning.",
      durationMs: 7000,
      steps: [
        { title: "Client aim", detail: "Name who benefits and what improves." },
        { title: "Evidence files", detail: "List datasets, templates, code, or logs named in the pack." },
        { title: "Constraints", detail: "Mark privacy, accessibility, staffing, deadline, and format limits." },
        { title: "Ready gate", detail: "Only now can Task 1 inherit a sensible plan." },
      ],
    },
    {
      id: "brief-walkthrough",
      kind: "guidedWalkthrough",
      kicker: "Guided walkthrough",
      title: "Watch the useful facts surface",
      narration: "Good triage feels like highlighting a client document on screen: every mark has a purpose.",
      focus: "Highlight facts that change the plan.",
      durationMs: 8000,
      artefact: {
        kind: "brief",
        title: "Brief triage note",
        facts: ["Client outcome", "Supplied files", "Sensitive data", "Deadline pressure", "Open assumption"],
        callouts: ["Aim drives scope", "Files become evidence", "Risks become controls"],
      },
      steps: [
        { title: "Underline deliverables", detail: "Find what the client will actually receive.", artefact: "dashboard, report, import, test log" },
        { title: "Circle constraints", detail: "Find what changes timing, cost, quality, or user success.", artefact: "privacy, deadline, skill level" },
        { title: "Flag assumptions", detail: "Record what must be confirmed instead of pretending it is solved.", artefact: "data access, owner sign-off" },
      ],
    },
    {
      id: "brief-mistakes",
      kind: "mistakeCompare",
      kicker: "Mistake vs strong approach",
      title: "Do not start with a generic plan",
      narration: "The weak version jumps to project-management vocabulary. The strong version lets the brief control the planning choices.",
      focus: "Evidence first, schedule second.",
      durationMs: 7500,
      compare: {
        weakTitle: "Weak",
        weak: ["Starts a Gantt chart immediately", "Lists generic tasks", "Ignores data sensitivity"],
        strongTitle: "Strong",
        strong: ["Names client aim", "Lists files and constraints", "Turns risks into controls"],
        takeaway: "Task 1 should feel inherited from the brief, not invented from memory.",
      },
    },
    {
      id: "brief-recap",
      kind: "recap",
      kicker: "End recap",
      title: "The brief is ready when it can feed a plan",
      narration: "A strong triage note makes the next task easier because the decisions are already visible.",
      focus: "Aim, evidence, constraints, risks.",
      durationMs: 6500,
      checklist: ["Client aim in one plain sentence", "Files and artefacts named", "Constraints tied to the pack", "Risks and assumptions separated"],
    },
    {
      id: "brief-practice",
      kind: "practicePrompt",
      kicker: "Try the process",
      title: "Apply the same reading sequence to a new brief",
      narration: "Use the prompt as a fresh source pack. Extract aim, evidence, constraints, and risks before you write any plan.",
      focus: "Practise triage without drifting into a plan.",
      durationMs: 9000,
    },
  ],
  task_1: [
    {
      id: "task1-intro",
      kind: "intro",
      kicker: "Opening",
      title: "Task 1 builds the project on screen",
      narration: "The brief becomes requirements, the requirements become milestones, and the milestones become a justified plan.",
      focus: "A plan is a chain of decisions, not a list.",
      durationMs: 6500,
      steps: [
        { title: "You receive", detail: "Scenario, deadline, roles, resources, and deliverables.", artefact: "Project brief" },
        { title: "You produce", detail: "A schedule with owners, testing, risks, resources, and rationale.", artefact: "Project plan" },
      ],
    },
    {
      id: "task1-map",
      kind: "processMap",
      kicker: "Animated process map",
      title: "Brief facts become a delivery sequence",
      narration: "Each stage unlocks the next one. The motion should feel like the project being assembled from left to right.",
      focus: "Order follows dependency.",
      durationMs: 7600,
      steps: [
        { title: "Read brief", detail: "Extract client outcome and constraints." },
        { title: "Requirements", detail: "Turn deliverables into visible plan bars." },
        { title: "Milestones", detail: "Sequence work and identify parallel-safe stages." },
        { title: "Resources", detail: "Attach owners, tools, and files." },
        { title: "Testing", detail: "Place validation before handover." },
        { title: "Rationale", detail: "Explain time, risk, and cost choices." },
      ],
    },
    {
      id: "task1-walkthrough",
      kind: "guidedWalkthrough",
      kicker: "Guided walkthrough",
      title: "Construct the plan one layer at a time",
      narration: "The plan gets stronger every time another layer is added: bars, arrows, owners, tests, risk controls, then rationale.",
      focus: "Build layers in the right order.",
      durationMs: 8500,
      steps: [
        { title: "Bars", detail: "Write 4 to 6 deliverable stages from the brief.", artefact: "Data import, interface, report" },
        { title: "Arrows", detail: "Show what must happen before another stage can start.", artefact: "Import -> design -> build" },
        { title: "Owners", detail: "Put the right role under the stage it owns.", artefact: "Developer, tester, client contact" },
        { title: "Tests", detail: "Add checks before the final handover.", artefact: "Normal, edge, regression" },
      ],
    },
    {
      id: "task1-artefact",
      kind: "artefact",
      kicker: "Artefact visualisation",
      title: "The schedule should reveal cause and effect",
      narration: "A strong project plan makes dependencies visible and explains why time and resources are placed where they are.",
      focus: "Show the marker what unlocks what.",
      durationMs: 8200,
      artefact: {
        kind: "plan",
        title: "Project plan under construction",
        bars: [
          { label: "Analyse brief", owner: "PM", note: "scope and risks" },
          { label: "Inspect data", owner: "Developer", note: "validation needs" },
          { label: "Design solution", owner: "UX + Dev", note: "structure first" },
          { label: "Build feature", owner: "Developer", note: "vertical slice" },
          { label: "Test and fix", owner: "Tester", note: "proof before handover" },
        ],
        callouts: ["Dependencies before dates", "Owners below work", "Testing before done"],
      },
    },
    {
      id: "task1-mistakes",
      kind: "mistakeCompare",
      kicker: "Mistake vs strong approach",
      title: "The weak plan hides the reasoning",
      narration: "The strong version makes the decision visible: why this order, why this owner, why this test point, and why this risk response.",
      focus: "Rationale is the markable difference.",
      durationMs: 7500,
      compare: {
        weakTitle: "Weak",
        weak: ["Even blocks with no dependencies", "Testing only at the end", "Risks say 'be careful'"],
        strongTitle: "Strong",
        strong: ["Arrows show dependency", "Regression after fixes", "Risks change timing or resource choices"],
        takeaway: "A project plan should look like delivery logic, not a neat timetable.",
      },
    },
    {
      id: "task1-recap",
      kind: "recap",
      kicker: "End recap",
      title: "Task 1 success looks like a buildable project",
      narration: "Before you stop, check the plan can be followed by someone else without guessing your logic.",
      focus: "Dependency, ownership, testing, rationale.",
      durationMs: 6500,
      checklist: ["Dependencies are explicit", "Roles sit on the correct stages", "Testing and regression are planned", "Risks have scheduled controls", "Rationale links to the scenario"],
    },
    {
      id: "task1-practice",
      kind: "practicePrompt",
      kicker: "Try the process",
      title: "Now plan a new project brief",
      narration: "Use the practice prompt as the brief and build the same chain: deliverables, dependencies, owners, tests, risks, rationale.",
      focus: "Practise building the plan, not describing planning.",
      durationMs: 9000,
    },
  ],
  task_2: [
    {
      id: "task2-intro",
      kind: "intro",
      kicker: "Opening",
      title: "Task 2 is a debugging story with proof",
      narration: "The page should feel like a bug investigation: observe the break, trace the clue, patch the cause, then prove the fix.",
      focus: "Fault -> cause -> fix -> validation.",
      durationMs: 6500,
      steps: [
        { title: "You receive", detail: "Broken or fragile code plus expected behaviour.", artefact: "Faulty program" },
        { title: "You produce", detail: "Corrected code and a test log that explains the evidence.", artefact: "Repair evidence" },
      ],
    },
    {
      id: "task2-map",
      kind: "processMap",
      kicker: "Animated process map",
      title: "Follow the evidence trail",
      narration: "Each movement should narrow the problem: from symptom, to clue, to root cause, to a retest that closes the loop.",
      focus: "Do not patch before you reproduce.",
      durationMs: 7600,
      steps: [
        { title: "Run failing case", detail: "Capture actual vs expected output." },
        { title: "Highlight clue", detail: "Find the line, variable, type, or branch that explains the fault." },
        { title: "Patch cause", detail: "Change the smallest coherent section." },
        { title: "Retest", detail: "Use normal, boundary, invalid, and regression checks." },
      ],
    },
    {
      id: "task2-walkthrough",
      kind: "guidedWalkthrough",
      kicker: "Guided walkthrough",
      title: "Let the bug explain the fix",
      narration: "The strong answer does not jump to perfect code. It shows what broke, why it broke, and why the fix is enough.",
      focus: "The test log is part of the explanation.",
      durationMs: 8500,
      steps: [
        { title: "Symptom", detail: "Write the failing input and wrong result.", artefact: "input '3', price 4 -> wrong total" },
        { title: "Clue", detail: "Highlight the variable or condition that causes it.", artefact: "quantity is text" },
        { title: "Fix", detail: "Convert or guard the value where the cause occurs.", artefact: "quantity = int(quantity)" },
        { title: "Proof", detail: "Add a row for the failing case and new edge cases.", artefact: "normal, boundary, invalid, regression" },
      ],
    },
    {
      id: "task2-artefact",
      kind: "artefact",
      kicker: "Artefact visualisation",
      title: "Code changes should look like a small repair",
      narration: "A clean fix is usually a tiny diff with a strong explanation and a matching test row.",
      focus: "Minimal change, maximum evidence.",
      durationMs: 8200,
      artefact: {
        kind: "code",
        title: "Repair diff",
        beforeLines: ["def total(quantity, price):", "    return quantity * price", "", "print(total('3', 4))  # '3333'"],
        afterLines: ["def total(quantity, price):", "    quantity = int(quantity)", "    return quantity * price", "", "print(total('3', 4))  # 12"],
        callouts: ["Reproduced fault", "Root cause: text input", "Retest with the original case"],
      },
    },
    {
      id: "task2-mistakes",
      kind: "mistakeCompare",
      kicker: "Mistake vs strong approach",
      title: "Do not make the fix look like magic",
      narration: "A marker needs the investigation path. Final code alone hides the reasoning that earns the evidence marks.",
      focus: "Show the bug's journey.",
      durationMs: 7500,
      compare: {
        weakTitle: "Weak",
        weak: ["Only pastes final code", "Changes several unrelated lines", "Writes 'works fine' in the log"],
        strongTitle: "Strong",
        strong: ["Shows failing run first", "Fixes one cause", "Logs expected and actual results"],
        takeaway: "The retest should prove the exact fault you claimed to fix.",
      },
    },
    {
      id: "task2-recap",
      kind: "recap",
      kicker: "End recap",
      title: "Task 2 success is traceability",
      narration: "If the marker can trace the fault from symptom to fix to passed test, the answer feels professional.",
      focus: "Reproduce, diagnose, patch, validate.",
      durationMs: 6500,
      checklist: ["Failing run is recorded", "Root cause is named", "Fix is minimal and relevant", "Normal, boundary, invalid, and regression tests are logged"],
    },
    {
      id: "task2-practice",
      kind: "practicePrompt",
      kicker: "Try the process",
      title: "Now repair a new defect scenario",
      narration: "Treat the practice prompt as the broken program. Record the fault before writing the fixed version.",
      focus: "Make the evidence trail visible.",
      durationMs: 9000,
    },
  ],
  task_3: [
    {
      id: "task3-intro",
      kind: "intro",
      kicker: "Opening",
      title: "Task 3 turns needs into a design",
      narration: "The design scene should show requirements becoming inputs, validation, processing, outputs, and justified trade-offs.",
      focus: "Design the route before writing code.",
      durationMs: 6500,
      steps: [
        { title: "You receive", detail: "Requirements, dataset shape, user needs, and constraints.", artefact: "Design brief" },
        { title: "You produce", detail: "A design another developer could implement without guessing.", artefact: "Flow, pseudocode, table" },
      ],
    },
    {
      id: "task3-map",
      kind: "processMap",
      kicker: "Animated process map",
      title: "Requirements become structures",
      narration: "Watch the brief transform into a system shape: input, validation, processing, output, and error handling.",
      focus: "Every design choice should trace to a requirement.",
      durationMs: 7600,
      steps: [
        { title: "User need", detail: "Name the person and decision the solution supports." },
        { title: "Data input", detail: "Identify fields, formats, and source files." },
        { title: "Validation", detail: "Protect the output from bad or missing data." },
        { title: "Processing", detail: "Describe calculations, filtering, grouping, or decision rules." },
        { title: "Output", detail: "Show what the user sees or receives." },
      ],
    },
    {
      id: "task3-walkthrough",
      kind: "guidedWalkthrough",
      kicker: "Guided walkthrough",
      title: "Follow one row through the design",
      narration: "A strong design makes the journey visible: raw row in, checks applied, valid rows processed, invalid rows diverted.",
      focus: "Show the happy path and the error path.",
      durationMs: 8500,
      steps: [
        { title: "Input row", detail: "Name the fields from the dataset.", artefact: "date, category, value, user" },
        { title: "Validation gate", detail: "Check required values and formats.", artefact: "blank value -> error report" },
        { title: "Processing path", detail: "Group, calculate, or filter valid records.", artefact: "summary by category" },
        { title: "Output path", detail: "Produce the report, table, screen, or export.", artefact: "summary plus rejected rows" },
      ],
    },
    {
      id: "task3-artefact",
      kind: "artefact",
      kicker: "Artefact visualisation",
      title: "A design should make data movement visible",
      narration: "The diagram is not decoration. It teaches how user needs become components, data flow, and validation decisions.",
      focus: "Requirements turn into structure.",
      durationMs: 8200,
      artefact: {
        kind: "flow",
        title: "Design flow",
        nodes: ["Requirement", "Input fields", "Validation gate", "Processing rule", "Output"],
        branches: ["Invalid row -> error report", "Duplicate ID -> flagged review", "Valid row -> summary"],
        callouts: ["User need drives output", "Validation protects trust", "Branches show decisions"],
      },
    },
    {
      id: "task3-mistakes",
      kind: "mistakeCompare",
      kicker: "Mistake vs strong approach",
      title: "Do not submit code disguised as design",
      narration: "The strong answer explains the intended structure and decisions before implementation.",
      focus: "Design is a blueprint.",
      durationMs: 7500,
      compare: {
        weakTitle: "Weak",
        weak: ["Pastes final Python", "Uses generic validation rules", "Forgets the error path"],
        strongTitle: "Strong",
        strong: ["Maps inputs to outputs", "Justifies validation from the scenario", "Shows normal and error branches"],
        takeaway: "A peer should be able to code from the design without inventing missing decisions.",
      },
    },
    {
      id: "task3-recap",
      kind: "recap",
      kicker: "End recap",
      title: "Task 3 success is implementable design",
      narration: "Before moving on, test the design with one valid row and one bad row in your head.",
      focus: "Inputs, validation, processing, outputs.",
      durationMs: 6500,
      checklist: ["Inputs and outputs are named", "Validation is scenario-specific", "Error handling is visible", "Trade-offs are justified", "Dataset fields appear in the design"],
    },
    {
      id: "task3-practice",
      kind: "practicePrompt",
      kicker: "Try the process",
      title: "Now design a new solution",
      narration: "Use the prompt to sketch the journey from user need to data flow to output before writing any code.",
      focus: "Practise design thinking, not implementation.",
      durationMs: 9000,
    },
  ],
  task_4a: [
    {
      id: "task4a-intro",
      kind: "intro",
      kicker: "Opening",
      title: "Task 4a turns the design into working output",
      narration: "This lesson should feel like implementation progress: understand the starter, build one slice, run it, capture evidence, then connect it back to the design.",
      focus: "Build, run, prove, connect.",
      durationMs: 6500,
      steps: [
        { title: "You receive", detail: "Starter code, data files, feature brief, and sometimes existing outputs.", artefact: "Scaffold" },
        { title: "You produce", detail: "Working code evidence, output evidence, and tests or checks.", artefact: "Implemented feature" },
      ],
    },
    {
      id: "task4a-map",
      kind: "processMap",
      kicker: "Animated process map",
      title: "Development moves in small vertical slices",
      narration: "The build should progress from design to feature to evidence, instead of a hidden burst of code.",
      focus: "One useful slice at a time.",
      durationMs: 7600,
      steps: [
        { title: "Read starter", detail: "Find entry points, data paths, and existing patterns." },
        { title: "Choose slice", detail: "Pick one feature that can be run and checked." },
        { title: "Implement", detail: "Change the smallest coherent part." },
        { title: "Run output", detail: "Capture visible evidence." },
        { title: "Regression", detail: "Check old behaviour still works." },
      ],
    },
    {
      id: "task4a-walkthrough",
      kind: "guidedWalkthrough",
      kicker: "Guided walkthrough",
      title: "Watch a design become a feature",
      narration: "A strong implementation keeps pointing back to the design: this function satisfies this requirement, this output proves this behaviour.",
      focus: "Trace requirement -> code -> output.",
      durationMs: 8500,
      steps: [
        { title: "Design cue", detail: "Select one requirement from the design.", artefact: "summary by category" },
        { title: "Code location", detail: "Find where the starter expects that logic.", artefact: "reporting function" },
        { title: "Working slice", detail: "Add enough code to make the feature demonstrable.", artefact: "load, group, print" },
        { title: "Evidence", detail: "Run it and capture matching output.", artefact: "terminal result or screenshot" },
      ],
    },
    {
      id: "task4a-artefact",
      kind: "artefact",
      kicker: "Artefact visualisation",
      title: "Implementation evidence is a stack",
      narration: "The marker should see the feature being assembled from data handling, logic, output, and checks.",
      focus: "Evidence is more than code.",
      durationMs: 8200,
      artefact: {
        kind: "build",
        title: "Build stack",
        layers: [
          { label: "Provided data", detail: "Use the file and fields from the brief." },
          { label: "Starter structure", detail: "Keep names and menu flow coherent." },
          { label: "Feature logic", detail: "Implement the required calculation or report." },
          { label: "Output evidence", detail: "Show the result a user or marker can check." },
          { label: "Regression check", detail: "Make sure old paths still behave." },
        ],
        output: ["Loaded client-data.csv", "Built category summary", "Printed management report", "Regression: existing menu still opens"],
        callouts: ["Use supplied assets", "Respect existing structure", "Show the run"],
      },
    },
    {
      id: "task4a-mistakes",
      kind: "mistakeCompare",
      kicker: "Mistake vs strong approach",
      title: "Do not replace the product to avoid the hard part",
      narration: "A strong build respects what was provided and proves progress with visible output.",
      focus: "Work inside the given solution.",
      durationMs: 7500,
      compare: {
        weakTitle: "Weak",
        weak: ["Rewrites the scaffold", "Invents easier data", "Shows code with no run evidence"],
        strongTitle: "Strong",
        strong: ["Uses provided files", "Adds one traceable feature", "Captures output and checks"],
        takeaway: "Implementation marks come from working evidence tied to the original design and brief.",
      },
    },
    {
      id: "task4a-recap",
      kind: "recap",
      kicker: "End recap",
      title: "Task 4a success is working, evidenced progress",
      narration: "The finished scene should let the student see the chain from design to code to output to validation.",
      focus: "Working feature plus proof.",
      durationMs: 6500,
      checklist: ["Starter code is respected", "Provided data is used", "Feature traces to the design", "Output evidence is captured", "Tests or checks are visible"],
    },
    {
      id: "task4a-practice",
      kind: "practicePrompt",
      kicker: "Try the process",
      title: "Now develop a new feature slice",
      narration: "Use the practice prompt to identify the slice, name the evidence, and plan the run/check sequence.",
      focus: "Practise implementation evidence, not just code writing.",
      durationMs: 9000,
    },
  ],
  task_4b: [
    {
      id: "task4b-intro",
      kind: "intro",
      kicker: "Opening",
      title: "Task 4b is an evidence-led reflection",
      narration: "The page should feel like a completed solution being examined: what worked, what was limited, what should improve, and why.",
      focus: "Evaluate with evidence, not vibes.",
      durationMs: 6500,
      steps: [
        { title: "You receive", detail: "A completed outcome, requirements, tests, outputs, and limits.", artefact: "Evidence bundle" },
        { title: "You produce", detail: "A judgement that links requirements, proof, weaknesses, trade-offs, and improvements.", artefact: "Evaluation" },
      ],
    },
    {
      id: "task4b-map",
      kind: "processMap",
      kicker: "Animated process map",
      title: "Move from artefact to judgement",
      narration: "Reflection is not a diary. It is a sequence of evidence checks that becomes a justified judgement.",
      focus: "Requirement -> evidence -> judgement -> improvement.",
      durationMs: 7600,
      steps: [
        { title: "Completed outcome", detail: "Identify the delivered feature or product." },
        { title: "Requirement check", detail: "Map each claim to what the brief asked for." },
        { title: "Evidence anchor", detail: "Point to tests, output, code, or design decisions." },
        { title: "Limit", detail: "Name the weakness in context." },
        { title: "Improvement", detail: "Recommend the next action because the evidence justifies it." },
      ],
    },
    {
      id: "task4b-walkthrough",
      kind: "guidedWalkthrough",
      kicker: "Guided walkthrough",
      title: "Break the finished solution into evaluative claims",
      narration: "The strong answer keeps returning to evidence: this requirement was met because this output proves it; this limit matters because this user risk remains.",
      focus: "Claims need proof.",
      durationMs: 8500,
      steps: [
        { title: "Strength", detail: "Name a requirement that is met.", artefact: "CSV import creates summary" },
        { title: "Evidence", detail: "Cite a test, screenshot, output, or code path.", artefact: "Test 3 expected = actual" },
        { title: "Weakness", detail: "Name a real limit without exaggeration.", artefact: "date format edge case" },
        { title: "Improvement", detail: "Suggest an action that follows from the limit.", artefact: "add parser and error export" },
      ],
    },
    {
      id: "task4b-artefact",
      kind: "artefact",
      kicker: "Artefact visualisation",
      title: "A strong evaluation paragraph has moving parts",
      narration: "Watch the reflection assemble from requirement, evidence, judgement, impact, and improvement.",
      focus: "Evaluation is structured judgement.",
      durationMs: 8200,
      artefact: {
        kind: "evaluation",
        title: "Evidence-led evaluation",
        sections: [
          { label: "Requirement", evidence: "Import supplied CSV", judgement: "Met for normal records" },
          { label: "Evidence", evidence: "Test 3 output matches expected totals", judgement: "Reliable for checked data" },
          { label: "Limit", evidence: "Unusual dates not tested", judgement: "Risk remains for older records" },
          { label: "Improvement", evidence: "Add date parser and error export", judgement: "Targets the proven weakness" },
        ],
        callouts: ["No new code in Task 4b", "Strengths and limits need proof", "Improvements must follow the evidence"],
      },
    },
    {
      id: "task4b-mistakes",
      kind: "mistakeCompare",
      kicker: "Mistake vs strong approach",
      title: "Do not describe what you did and stop",
      narration: "A description says what happened. An evaluation judges how well it worked and what should change next.",
      focus: "Move from description to judgement.",
      durationMs: 7500,
      compare: {
        weakTitle: "Weak",
        weak: ["Says 'I made the program'", "Claims everything worked", "Adds improvements with no evidence"],
        strongTitle: "Strong",
        strong: ["Maps requirements to proof", "Names proportionate limits", "Prioritises justified improvements"],
        takeaway: "The best reflections sound like a handover note to a client, not a personal diary.",
      },
    },
    {
      id: "task4b-recap",
      kind: "recap",
      kicker: "End recap",
      title: "Task 4b success is balanced judgement",
      narration: "A high-quality reflection is honest, specific, and anchored to artefacts the marker can see.",
      focus: "Evidence, limits, impact, improvement.",
      durationMs: 6500,
      checklist: ["Requirements are mapped to evidence", "Strengths are specific", "Weaknesses are proportionate", "Trade-offs are explained", "Improvements follow from proven limits"],
    },
    {
      id: "task4b-practice",
      kind: "practicePrompt",
      kicker: "Try the process",
      title: "Now evaluate a new completed outcome",
      narration: "Use the practice prompt to write claims that always point back to requirement evidence and realistic improvements.",
      focus: "Practise judgement, not description.",
      durationMs: 9000,
    },
  ],
};

export const ESP_TASK_LESSONS: Record<EspTask, EspTaskLessonContent> = {
  pre_release: preRelease,
  task_1: task1,
  task_2: task2,
  task_3: task3,
  task_4a: task4a,
  task_4b: task4b,
};

export function getEspTaskLesson(taskId: EspTask): EspTaskLessonContent {
  return ESP_TASK_LESSONS[taskId];
}

export function getEspTaskExplainerScenes(taskId: EspTask): EspExplainerScene[] {
  return ESP_TASK_EXPLAINER_SCENES[taskId];
}
