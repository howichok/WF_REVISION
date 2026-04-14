import type {
  EspBriefType,
  EspDeliverableType,
  EspTask,
  ExamMetadataDifficulty,
  QuestionMetadata,
  QuestionType,
} from "./types";

const ESP_SOURCE_ID = "codex-reviewed-esp-practice-bank-2026";
const SOURCE_LABEL = "Codex reviewed ESP practice bank";
const GENERATION_BATCH = "codex-reviewed-esp-practice-bank-2026-04-13";

interface EspPracticeSeed {
  id: string;
  espTask: EspTask;
  title: string;
  vocationalContext: string;
  brief: string;
  studentTask: string;
  expectedDeliverable: string;
  relatedContentAreas: string[];
  difficulty: ExamMetadataDifficulty;
  briefType: EspBriefType;
  deliverableType: EspDeliverableType;
  questionType: QuestionType;
  marks: number;
  sourceReference: string;
  sourceFile: string;
  sourceExcerptHash: string;
  curriculumPointIds: string[];
  realismScore: number;
  responseFormat: "written" | "code" | "diagram" | "table" | "mixed";
  indicativeMarkSchemeOutline: string[];
  examinerRationale: string;
}

const SOURCE_FILES = {
  preRelease:
    "sources/espsource/OneDrive_1_13.04.2026.zip :: Core Employer Set Project - Task1 - November 2021.pdf; DSD-SAM-ESP-Part1.zip",
  task1:
    "sources/espsource/OneDrive_1_13.04.2026.zip :: DSD ESP AUT-22 Task 1.zip; DSD-SAM-ESP-Part1.zip; DSD_ESP_Task1_Project_Plan_Grade_A_Fill_in_the_costs.xlsx; ESP 1 - Points for Rationale 2026.pptx",
  task2:
    "sources/espsource/OneDrive_1_13.04.2026.zip :: ESP Autumn 24 Task 2.zip; ESP Summer 24 Task 2.zip; ESP Task 2 Autumn 22.zip",
  task3:
    "sources/espsource/OneDrive_1_13.04.2026.zip :: ESP Autumn 24 Task 3.zip; ESP Task 3 2022.zip; drinks_data.csv; gym-data.csv",
  task4a:
    "sources/espsource/OneDrive_1_13.04.2026.zip :: ESP Autumn 24 Task 4a.zip; T Level Core Digital ESP 19538 TASK 4A Nov-2023.zip; Task4a_AnimalRescue.py; Task4a_data.csv",
  task4b:
    "sources/espsource/OneDrive_1_13.04.2026.zip :: t-level-core-digital-19538-employer-set-project-task-4b-november-2024.pdf; W76546 T Level Core Digital ESP 19538 ESP TASK 4B AB Nov-2023.pdf",
} as const;

const ESP_PRACTICE_SEEDS: EspPracticeSeed[] = [
  {
    id: "codex-esp-pre-release-brief-triage-001",
    espTask: "pre_release",
    title: "Triage the supplied project brief before planning",
    vocationalContext:
      "A council volunteering team needs a small digital service to match residents with verified volunteering opportunities.",
    brief:
      "You have received the client brief, evidence files and planning constraints before the timed task begins.",
    studentTask:
      "Identify the client need, likely deliverables, file evidence, key assumptions and risks that must be checked before writing the Task 1 plan.",
    expectedDeliverable:
      "A structured brief-analysis note with requirements, constraints, file/evidence checklist, assumptions and risk flags.",
    relatedContentAreas: ["requirements", "project planning", "risk", "evidence handling"],
    difficulty: "medium",
    briefType: "brief-analysis",
    deliverableType: "brief-note",
    questionType: "scenario",
    marks: 4,
    sourceReference: "Task 1 planning and specimen project brief patterns in the local ESP bundle.",
    sourceFile: SOURCE_FILES.preRelease,
    sourceExcerptHash: "fnv1a-101a9a11",
    curriculumPointIds: ["dsd-1.4", "dsd-2.2"],
    realismScore: 8.4,
    responseFormat: "table",
    indicativeMarkSchemeOutline: [
      "Separates client requirements from assumptions and constraints.",
      "Identifies relevant evidence files and why they matter.",
      "Flags risks that affect planning or deliverable quality.",
      "Keeps the response as pre-planning triage rather than a finished solution.",
    ],
    examinerRationale:
      "Keeps the pre-release layer distinct from Paper 1 and Paper 2 while reflecting how Task 1 materials expect students to read the brief before planning.",
  },
  {
    id: "codex-esp-task1-community-clinic-plan-001",
    espTask: "task_1",
    title: "Plan a phased clinic appointment-reporting project",
    vocationalContext:
      "A community clinic wants a web-based appointment reporting tool for reception staff and managers.",
    brief:
      "The client needs a first usable version within a short delivery window and has named staff roles with different daily rates.",
    studentTask:
      "Produce a staged plan and rationale that schedules analysis, design, development, testing and handover.",
    expectedDeliverable:
      "A Gantt-style plan plus a short rationale explaining sequencing, staff allocation, testing points, key risks and cost/time impact.",
    relatedContentAreas: ["project planning", "team roles", "testing", "risk"],
    difficulty: "high",
    briefType: "project-plan",
    deliverableType: "project-plan-rationale",
    questionType: "extended-response",
    marks: 8,
    sourceReference: "Task 1 planning packs, project-plan spreadsheets and rationale support decks.",
    sourceFile: SOURCE_FILES.task1,
    sourceExcerptHash: "fnv1a-1e23c4e2",
    curriculumPointIds: ["dsd-1.2", "dsd-1.3", "dsd-7.1"],
    realismScore: 8.9,
    responseFormat: "mixed",
    indicativeMarkSchemeOutline: [
      "Plan has coherent phases and dependencies.",
      "Staff allocation matches role responsibilities and cost constraints.",
      "Testing is scheduled at credible points, including integration or regression checks.",
      "Rationale links sequencing to client risk and delivery constraints.",
    ],
    examinerRationale:
      "Authentic Task 1 pattern: planning plus rationale, not a generic project-management definition question.",
  },
  {
    id: "codex-esp-task1-heritage-ticketing-plan-002",
    espTask: "task_1",
    title: "Replan a ticketing system around staff absence",
    vocationalContext:
      "A heritage venue wants a ticketing and visitor-capacity dashboard before its spring opening period.",
    brief:
      "One developer is unavailable for two days and the project manager asks for a revised sequence that protects testing time.",
    studentTask:
      "Amend the project plan and justify which tasks should move, which dependencies stay fixed and how the risk is controlled.",
    expectedDeliverable:
      "An amended planning note with task ordering, staff allocation, dependency explanation and risk response for absence/testing limits.",
    relatedContentAreas: ["project planning", "resource allocation", "risk", "testing"],
    difficulty: "high",
    briefType: "project-plan",
    deliverableType: "project-plan-rationale",
    questionType: "extended-response",
    marks: 8,
    sourceReference: "Task 1 planning packs, staff allocation spreadsheets and rationale support materials.",
    sourceFile: SOURCE_FILES.task1,
    sourceExcerptHash: "fnv1a-2a7d8923",
    curriculumPointIds: ["dsd-1.3", "dsd-2.2", "dsd-8.2"],
    realismScore: 8.6,
    responseFormat: "mixed",
    indicativeMarkSchemeOutline: [
      "Identifies affected tasks and realistic dependencies.",
      "Moves or reassigns work without removing essential testing.",
      "Explains risk impact and mitigation.",
      "Maintains a client-facing rationale rather than only listing dates.",
    ],
    examinerRationale:
      "Uses the project-plan and resource-plan pattern without copying any source scenario or staff table.",
  },
  {
    id: "codex-esp-task1-charity-grant-risk-003",
    espTask: "task_1",
    title: "Justify risk and cost choices for a grant dashboard",
    vocationalContext:
      "A charity finance office needs a dashboard to track grant applications, deadlines and evidence uploads.",
    brief:
      "The project has a fixed budget, a limited testing period and a client stakeholder who is not technical.",
    studentTask:
      "Write a rationale that explains the method, resource choices, risk controls and test timing for the planned build.",
    expectedDeliverable:
      "A rationale that justifies methodology, task sequencing, staff allocation, testing, cost trade-offs and the main risks.",
    relatedContentAreas: ["methodology", "cost planning", "risk", "stakeholder communication"],
    difficulty: "high",
    briefType: "project-plan",
    deliverableType: "project-plan-rationale",
    questionType: "extended-response",
    marks: 8,
    sourceReference: "Task 1 planning packs and rationale support presentations.",
    sourceFile: SOURCE_FILES.task1,
    sourceExcerptHash: "fnv1a-3d51b17c",
    curriculumPointIds: ["dsd-1.2", "dsd-1.3", "dsd-2.2"],
    realismScore: 8.7,
    responseFormat: "written",
    indicativeMarkSchemeOutline: [
      "Justifies a suitable methodology for the context.",
      "Connects task order to cost, risk and stakeholder needs.",
      "Allocates roles credibly and avoids unrealistic parallel work.",
      "Explains testing and communication decisions.",
    ],
    examinerRationale:
      "Matches the Task 1 rationale evidence style and avoids turning ESP into a conventional paper question.",
  },
  {
    id: "codex-esp-task1-retail-returns-schedule-004",
    espTask: "task_1",
    title: "Schedule a returns-management system build",
    vocationalContext:
      "A small online retailer needs a returns-management system that links customer requests, warehouse checks and refund decisions.",
    brief:
      "The client has asked for a plan showing how development, testing, deployment and user training will fit into the available time.",
    studentTask:
      "Build a concise schedule and explain one decision that protects quality when time is limited.",
    expectedDeliverable:
      "A sequenced project schedule with named stages, responsible roles, test phases and one justified risk response.",
    relatedContentAreas: ["project planning", "deployment", "testing", "change management"],
    difficulty: "medium",
    briefType: "project-plan",
    deliverableType: "project-plan-rationale",
    questionType: "scenario",
    marks: 6,
    sourceReference: "Task 1 planning spreadsheets and rationale support material.",
    sourceFile: SOURCE_FILES.task1,
    sourceExcerptHash: "fnv1a-4841da56",
    curriculumPointIds: ["dsd-1.3", "dsd-6.4", "dsd-7.1"],
    realismScore: 8.3,
    responseFormat: "mixed",
    indicativeMarkSchemeOutline: [
      "Schedule has sensible development and test stages.",
      "Roles are assigned to appropriate activities.",
      "Deployment or training is included before handover.",
      "Risk response is linked to the time constraint.",
    ],
    examinerRationale:
      "A shorter Task 1 practice item that still asks for schedule evidence rather than factual recall.",
  },
  {
    id: "codex-esp-task2-membership-code-fix-001",
    espTask: "task_2",
    title: "Diagnose membership-renewal code defects",
    vocationalContext:
      "A sports centre uses a Python script to calculate membership renewal fees and print a summary receipt.",
    brief:
      "The supplied script fails when a member selects a family membership and the receipt total is sometimes wrong.",
    studentTask:
      "Identify likely defects, describe the correction approach and state tests that would prove the repaired code works.",
    expectedDeliverable:
      "Corrected code evidence and a test log with test description, test data, expected outcome, actual outcome and intended action.",
    relatedContentAreas: ["defect fixing", "Python", "test logs", "validation"],
    difficulty: "medium",
    briefType: "defect-fix",
    deliverableType: "corrected-code-test-log",
    questionType: "scenario",
    marks: 6,
    sourceReference: "Task 2 packs with non-working code and test-log templates.",
    sourceFile: SOURCE_FILES.task2,
    sourceExcerptHash: "fnv1a-5db22010",
    curriculumPointIds: ["dsd-6.1", "dsd-7.2", "dsd-7.3"],
    realismScore: 8.5,
    responseFormat: "mixed",
    indicativeMarkSchemeOutline: [
      "Defects are diagnosed from symptoms, not guessed generically.",
      "Correction approach fits variables, conditions or calculation logic.",
      "Test log includes data, expected result and actual result.",
      "Retest or intended action is recorded where a test fails.",
    ],
    examinerRationale:
      "Grounded in Task 2 non-working-code and test-log structure, with a fresh vocational context.",
  },
  {
    id: "codex-esp-task2-adventure-booking-date-002",
    espTask: "task_2",
    title: "Fix booking-date and ticket-validation defects",
    vocationalContext:
      "An outdoor activity park needs a booking script for family tickets and visit dates.",
    brief:
      "The script accepts some invalid dates, rejects a valid child ticket quantity and prints the wrong total for group bookings.",
    studentTask:
      "Explain the defect fixes and specify tests for valid, boundary and erroneous data.",
    expectedDeliverable:
      "Corrected code snippets plus a completed test log covering normal, boundary and erroneous test data.",
    relatedContentAreas: ["defect fixing", "validation", "test data", "Python"],
    difficulty: "medium",
    briefType: "defect-fix",
    deliverableType: "corrected-code-test-log",
    questionType: "scenario",
    marks: 6,
    sourceReference: "Task 2 packs with non-working code and test-log templates.",
    sourceFile: SOURCE_FILES.task2,
    sourceExcerptHash: "fnv1a-644bb19d",
    curriculumPointIds: ["dsd-6.1", "dsd-7.2", "dsd-7.3"],
    realismScore: 8.4,
    responseFormat: "mixed",
    indicativeMarkSchemeOutline: [
      "Finds validation and calculation defects from the scenario.",
      "Uses appropriate valid, boundary and erroneous test data.",
      "Expected outcomes are specific and checkable.",
      "Evidence distinguishes original failure from the fixed result.",
    ],
    examinerRationale:
      "Uses authentic Task 2 evidence expectations while avoiding direct reuse of the supplied code packs.",
  },
  {
    id: "codex-esp-task2-maintenance-record-003",
    espTask: "task_2",
    title: "Repair a maintenance-record script",
    vocationalContext:
      "A drone maintenance company records service dates, fault categories and whether a drone can return to use.",
    brief:
      "The non-working script has a date parsing fault, a misspelled function call and a condition that marks unsafe drones as ready.",
    studentTask:
      "Summarise the defects, outline the corrected code changes and plan tests that would verify the fix.",
    expectedDeliverable:
      "A defect table, corrected code evidence and a test log for serial number, date and outcome-selection tests.",
    relatedContentAreas: ["defect fixing", "data validation", "test logs", "safety risk"],
    difficulty: "high",
    briefType: "defect-fix",
    deliverableType: "corrected-code-test-log",
    questionType: "extended-response",
    marks: 8,
    sourceReference: "Task 2 packs with non-working code and test-log templates.",
    sourceFile: SOURCE_FILES.task2,
    sourceExcerptHash: "fnv1a-733af40e",
    curriculumPointIds: ["dsd-6.1", "dsd-7.2", "dsd-7.3"],
    realismScore: 8.8,
    responseFormat: "mixed",
    indicativeMarkSchemeOutline: [
      "Defect table links each fault to its impact.",
      "Code changes are plausible and targeted.",
      "Tests cover normal, invalid and risk-sensitive outcomes.",
      "Retesting evidence shows the repaired script now behaves safely.",
    ],
    examinerRationale:
      "High realism because Task 2 often combines syntax faults with logic and evidence recording.",
  },
  {
    id: "codex-esp-task2-library-fines-log-004",
    espTask: "task_2",
    title: "Build a test log for a library fines fix",
    vocationalContext:
      "A library service has a Python script that calculates late-return charges and writes a user summary.",
    brief:
      "A corrected version of the script has been produced after faults in the day-count and charge-cap logic.",
    studentTask:
      "Create test-log entries that prove the fix works and explain one retest action if a result does not match the expected outcome.",
    expectedDeliverable:
      "A short fix summary and a test log with at least four tests, including one failed-test retest action.",
    relatedContentAreas: ["test logs", "regression testing", "defect fixing", "data validation"],
    difficulty: "medium",
    briefType: "defect-fix",
    deliverableType: "corrected-code-test-log",
    questionType: "scenario",
    marks: 6,
    sourceReference: "Task 2 test-log templates and non-working-code packs.",
    sourceFile: SOURCE_FILES.task2,
    sourceExcerptHash: "fnv1a-88a07731",
    curriculumPointIds: ["dsd-6.1", "dsd-7.3"],
    realismScore: 8.2,
    responseFormat: "table",
    indicativeMarkSchemeOutline: [
      "Test log contains test description, data, expected and actual outcome.",
      "Tests include normal, boundary or erroneous cases.",
      "Retest action is realistic and tied to a failed result.",
      "Summary explains how the evidence supports the fix.",
    ],
    examinerRationale:
      "Focuses on evidence logging, a recurring Task 2 deliverable in the inspected source packs.",
  },
  {
    id: "codex-esp-task3-car-sales-design-001",
    espTask: "task_3",
    title: "Design a sales-summary data service",
    vocationalContext:
      "A vehicle dealership wants a data service that summarises sales by model and salesperson.",
    brief:
      "A CSV file is available with sale type, model, salesperson and value fields; the client wants reliable summary outputs.",
    studentTask:
      "Design the algorithm and validation steps before development begins.",
    expectedDeliverable:
      "Pseudocode or flowchart-style algorithm designs with data inputs, processing steps, validation and output descriptions.",
    relatedContentAreas: ["solution design", "CSV data", "algorithm design", "data output"],
    difficulty: "high",
    briefType: "solution-design",
    deliverableType: "algorithm-design",
    questionType: "extended-response",
    marks: 8,
    sourceReference: "Task 3 design packs with supplied CSV datasets.",
    sourceFile: SOURCE_FILES.task3,
    sourceExcerptHash: "fnv1a-91e73b25",
    curriculumPointIds: ["dsd-4.3", "dsd-6.3", "dsd-7.3"],
    realismScore: 8.9,
    responseFormat: "diagram",
    indicativeMarkSchemeOutline: [
      "Design identifies required CSV fields and data checks.",
      "Algorithm steps show filtering, grouping and calculations.",
      "Outputs are described in a way a developer could implement.",
      "Design includes error or missing-data handling.",
    ],
    examinerRationale:
      "Reflects Task 3 design expectations around supplied data files and implementable algorithms.",
  },
  {
    id: "codex-esp-task3-property-trend-design-002",
    espTask: "task_3",
    title: "Design a property-trend comparison algorithm",
    vocationalContext:
      "A housing research team wants to compare property trend values across regions and property types.",
    brief:
      "A spreadsheet-derived CSV contains region, property type, year and average value fields.",
    studentTask:
      "Design how the solution should validate the chosen filters, calculate the comparison and present the result.",
    expectedDeliverable:
      "A structured algorithm design showing input, validation, filtering, calculation, output and exception-handling steps.",
    relatedContentAreas: ["solution design", "data filtering", "validation", "algorithm design"],
    difficulty: "high",
    briefType: "solution-design",
    deliverableType: "algorithm-design",
    questionType: "extended-response",
    marks: 8,
    sourceReference: "Task 3 design packs with supplied CSV datasets.",
    sourceFile: SOURCE_FILES.task3,
    sourceExcerptHash: "fnv1a-a0659c14",
    curriculumPointIds: ["dsd-4.3", "dsd-6.3", "dsd-7.3"],
    realismScore: 8.6,
    responseFormat: "diagram",
    indicativeMarkSchemeOutline: [
      "Inputs and validation rules are precise.",
      "Filtering and comparison steps are ordered logically.",
      "Output design is meaningful to the client.",
      "Exception handling covers missing or unmatched data.",
    ],
    examinerRationale:
      "A data-service design item derived from the Task 3 pattern without copying a source task.",
  },
  {
    id: "codex-esp-task3-gym-summary-design-003",
    espTask: "task_3",
    title: "Design a member workout summary",
    vocationalContext:
      "A gym wants members to see a summary of workout type, time spent and calories over a selected date range.",
    brief:
      "The supplied data file contains member ID, workout category, date, duration and energy estimate fields.",
    studentTask:
      "Create a design that a developer could use to build the member summary feature.",
    expectedDeliverable:
      "Algorithm steps, input validation rules, grouping/calculation design and output sketches or descriptions.",
    relatedContentAreas: ["solution design", "data grouping", "UX output", "validation"],
    difficulty: "medium",
    briefType: "solution-design",
    deliverableType: "algorithm-design",
    questionType: "scenario",
    marks: 6,
    sourceReference: "Task 3 design packs with supplied CSV datasets and gym-data examples.",
    sourceFile: SOURCE_FILES.task3,
    sourceExcerptHash: "fnv1a-bd3062e9",
    curriculumPointIds: ["dsd-4.3", "dsd-6.2", "dsd-6.3"],
    realismScore: 8.3,
    responseFormat: "diagram",
    indicativeMarkSchemeOutline: [
      "Inputs and date-range validation are clear.",
      "Grouping and calculation steps match the data fields.",
      "Output design fits member or trainer use.",
      "Design is detailed enough to implement.",
    ],
    examinerRationale:
      "Keeps Task 3 as design evidence rather than development, matching the separation in the inspected packs.",
  },
  {
    id: "codex-esp-task3-drinks-stock-design-004",
    espTask: "task_3",
    title: "Design a drinks-demand analysis workflow",
    vocationalContext:
      "A college canteen wants to understand daily drink demand by product and sugar category.",
    brief:
      "A CSV file contains sales date, product, quantity, price and sugar category fields.",
    studentTask:
      "Design the data-handling workflow and identify one risk that the developer should mitigate.",
    expectedDeliverable:
      "A data-design note with field mapping, transformations, calculations, outputs and one risk with mitigation.",
    relatedContentAreas: ["solution design", "data transformation", "risk", "CSV handling"],
    difficulty: "medium",
    briefType: "solution-design",
    deliverableType: "algorithm-design",
    questionType: "scenario",
    marks: 6,
    sourceReference: "Task 3 design packs and drinks_data.csv style data assets.",
    sourceFile: SOURCE_FILES.task3,
    sourceExcerptHash: "fnv1a-c3adfe52",
    curriculumPointIds: ["dsd-3.2", "dsd-4.3", "dsd-6.3"],
    realismScore: 8.2,
    responseFormat: "mixed",
    indicativeMarkSchemeOutline: [
      "Maps fields to the required outputs.",
      "Includes transformations or calculations needed for demand analysis.",
      "Identifies an implementation or data-quality risk.",
      "Gives a mitigation that protects output reliability.",
    ],
    examinerRationale:
      "Uses the CSV-led Task 3 design pattern and avoids duplicating any one dataset prompt.",
  },
  {
    id: "codex-esp-task4a-car-sales-feature-001",
    espTask: "task_4a",
    title: "Develop a new-and-used car sales feature",
    vocationalContext:
      "A vehicle dealership has starter Python code for a menu-driven sales analysis tool.",
    brief:
      "The client needs an extra feature that separates new and used car totals and displays a ranked summary.",
    studentTask:
      "Describe the development evidence needed and outline how the code should process the supplied CSV.",
    expectedDeliverable:
      "Working code evidence, output screenshots or text evidence, and a short note on the tests run after the feature was added.",
    relatedContentAreas: ["development", "Python", "CSV handling", "testing evidence"],
    difficulty: "high",
    briefType: "solution-development",
    deliverableType: "working-code-evidence",
    questionType: "extended-response",
    marks: 10,
    sourceReference: "Task 4a development packs with Python code and CSV assets.",
    sourceFile: SOURCE_FILES.task4a,
    sourceExcerptHash: "fnv1a-d24a1b01",
    curriculumPointIds: ["dsd-6.1", "dsd-6.3", "dsd-7.2"],
    realismScore: 9,
    responseFormat: "code",
    indicativeMarkSchemeOutline: [
      "Code reads and processes the correct CSV fields.",
      "Feature separates and summarises new and used car totals accurately.",
      "Output is meaningful for the dealership context.",
      "Testing evidence checks normal and edge cases after development.",
    ],
    examinerRationale:
      "Grounded in Task 4a code-and-data development packs while requiring a new feature pattern.",
  },
  {
    id: "codex-esp-task4a-animal-rescue-chart-002",
    espTask: "task_4a",
    title: "Add a social-media chart feature",
    vocationalContext:
      "An animal rescue charity has a Python tool for analysing social-media post interactions.",
    brief:
      "The client wants a chart or grouped output that compares interaction totals by post type.",
    studentTask:
      "Outline the development steps and testing evidence for adding the feature to the existing code.",
    expectedDeliverable:
      "Updated code, generated chart/output evidence and test notes for menu selection and data grouping.",
    relatedContentAreas: ["development", "data visualisation", "Python", "testing"],
    difficulty: "high",
    briefType: "solution-development",
    deliverableType: "working-code-evidence",
    questionType: "extended-response",
    marks: 10,
    sourceReference: "Task 4a development packs and Task4a_AnimalRescue.py style assets.",
    sourceFile: SOURCE_FILES.task4a,
    sourceExcerptHash: "fnv1a-e60e4290",
    curriculumPointIds: ["dsd-6.1", "dsd-6.2", "dsd-6.3"],
    realismScore: 8.7,
    responseFormat: "code",
    indicativeMarkSchemeOutline: [
      "Development steps fit the existing menu or function structure.",
      "Data is grouped accurately by post type.",
      "Chart or output evidence is client-readable.",
      "Tests check feature selection and grouping accuracy.",
    ],
    examinerRationale:
      "Reflects Task 4a starter-code extension without using source wording as the prompt.",
  },
  {
    id: "codex-esp-task4a-gym-member-summary-003",
    espTask: "task_4a",
    title: "Build a member workout summary report",
    vocationalContext:
      "A gym wants a Python reporting tool that helps trainers review member activity over a period of time.",
    brief:
      "Starter code can already load the workout CSV, but it does not yet generate a per-member summary.",
    studentTask:
      "Develop the missing reporting logic and record evidence that it works for valid and invalid member IDs.",
    expectedDeliverable:
      "Working code, evidence of output for at least two members, and tests for valid and invalid member IDs.",
    relatedContentAreas: ["development", "Python", "CSV handling", "test evidence"],
    difficulty: "high",
    briefType: "solution-development",
    deliverableType: "working-code-evidence",
    questionType: "extended-response",
    marks: 10,
    sourceReference: "Task 4a development packs with Python code and CSV assets.",
    sourceFile: SOURCE_FILES.task4a,
    sourceExcerptHash: "fnv1a-f38138cf",
    curriculumPointIds: ["dsd-6.1", "dsd-6.2", "dsd-7.3"],
    realismScore: 8.5,
    responseFormat: "code",
    indicativeMarkSchemeOutline: [
      "Code filters by member and date safely.",
      "Summary calculations are accurate and understandable.",
      "Invalid member IDs are handled without crashing.",
      "Evidence includes outputs and relevant tests.",
    ],
    examinerRationale:
      "Maintains the Task 4a development-and-evidence structure from the inspected Python/CSV packs.",
  },
  {
    id: "codex-esp-task4a-canteen-demand-report-004",
    espTask: "task_4a",
    title: "Develop a canteen demand report",
    vocationalContext:
      "A college canteen wants a weekly report to decide which drinks to restock.",
    brief:
      "The supplied CSV contains product, day, quantity and sugar category fields, but the current script only lists raw rows.",
    studentTask:
      "Add report logic that groups the data and produces a useful restocking output.",
    expectedDeliverable:
      "Working code, sample output, and a brief test note showing calculation checks against the CSV.",
    relatedContentAreas: ["development", "CSV handling", "data reporting", "testing"],
    difficulty: "high",
    briefType: "solution-development",
    deliverableType: "working-code-evidence",
    questionType: "extended-response",
    marks: 10,
    sourceReference: "Task 4a development packs and drinks_data.csv style data assets.",
    sourceFile: SOURCE_FILES.task4a,
    sourceExcerptHash: "fnv1a-0ce7a927",
    curriculumPointIds: ["dsd-6.1", "dsd-6.3", "dsd-7.3"],
    realismScore: 8.4,
    responseFormat: "code",
    indicativeMarkSchemeOutline: [
      "Code groups and totals data accurately.",
      "Restocking output is useful for the catering manager.",
      "Calculation checks are based on sample CSV rows.",
      "Development evidence includes output and tests.",
    ],
    examinerRationale:
      "A realistic Task 4a data-reporting extension, semantically distinct from the source datasets.",
  },
  {
    id: "codex-esp-task4b-car-sales-reflection-001",
    espTask: "task_4b",
    title: "Reflect on a completed car-sales feature",
    vocationalContext:
      "A dealership sales-analysis tool has been completed and is being handed over to the client.",
    brief:
      "You may refer to the completed Task 4a output and test evidence, but you must not change the submitted code.",
    studentTask:
      "Evaluate how well the solution meets the client requirements and justify improvements using evidence.",
    expectedDeliverable:
      "A reflective evaluation linked to requirements, testing evidence, output quality, limitations and next-step improvements.",
    relatedContentAreas: ["reflective evaluation", "testing evidence", "requirements", "improvement"],
    difficulty: "high",
    briefType: "reflective-evaluation",
    deliverableType: "reflective-evaluation",
    questionType: "extended-response",
    marks: 8,
    sourceReference: "Task 4b reflective evaluation booklets and duplicate task-year variants.",
    sourceFile: SOURCE_FILES.task4b,
    sourceExcerptHash: "fnv1a-19f4d104",
    curriculumPointIds: ["dsd-8.1", "dsd-8.2", "dsd-7.1"],
    realismScore: 9,
    responseFormat: "written",
    indicativeMarkSchemeOutline: [
      "Evaluation is evidence-led and refers to requirements or success criteria.",
      "Testing evidence is used to support judgements.",
      "Limitations are specific and linked to client impact.",
      "Improvements are justified and realistic.",
    ],
    examinerRationale:
      "Captures the Task 4b rule that reflection uses existing Task 4a evidence rather than making new changes.",
  },
  {
    id: "codex-esp-task4b-animal-rescue-reflection-002",
    espTask: "task_4b",
    title: "Evaluate an animal-rescue analysis tool",
    vocationalContext:
      "An animal rescue charity has received a completed social-media analysis tool.",
    brief:
      "The charity needs a reflective evaluation that explains whether the tool is useful for planning outreach activity.",
    studentTask:
      "Evaluate the finished solution, including data handling, usability, output usefulness and improvements.",
    expectedDeliverable:
      "An evaluation covering fitness for purpose, data handling, user usefulness, quality of implementation, constraints and improvements.",
    relatedContentAreas: ["reflective evaluation", "data handling", "usability", "improvement"],
    difficulty: "high",
    briefType: "reflective-evaluation",
    deliverableType: "reflective-evaluation",
    questionType: "extended-response",
    marks: 8,
    sourceReference: "Task 4b reflective evaluation booklets and Task 4a animal-rescue style assets.",
    sourceFile: SOURCE_FILES.task4b,
    sourceExcerptHash: "fnv1a-28fcb71d",
    curriculumPointIds: ["dsd-8.1", "dsd-8.2", "dsd-7.1"],
    realismScore: 8.7,
    responseFormat: "written",
    indicativeMarkSchemeOutline: [
      "Fitness for purpose is judged against the charity context.",
      "Data handling and output evidence are used in the evaluation.",
      "Usability strengths or limitations are specific.",
      "Improvements are prioritised and justified.",
    ],
    examinerRationale:
      "Task 4b practice with a fresh context and a clear evidence-based reflective demand.",
  },
  {
    id: "codex-esp-task4b-gym-dashboard-reflection-003",
    espTask: "task_4b",
    title: "Evaluate a gym member-summary dashboard",
    vocationalContext:
      "A gym training-data dashboard has been completed for trainers and members.",
    brief:
      "The evaluation should use the submitted outputs and test results rather than adding new features.",
    studentTask:
      "Judge how well the dashboard supports the client need and explain two improvements with evidence.",
    expectedDeliverable:
      "A reflective evaluation that links requirements, test results, usability, data accuracy and justified improvements.",
    relatedContentAreas: ["reflective evaluation", "testing evidence", "data accuracy", "usability"],
    difficulty: "high",
    briefType: "reflective-evaluation",
    deliverableType: "reflective-evaluation",
    questionType: "extended-response",
    marks: 8,
    sourceReference: "Task 4b reflective evaluation booklets and Task 4a Python/CSV evidence patterns.",
    sourceFile: SOURCE_FILES.task4b,
    sourceExcerptHash: "fnv1a-3fd1c890",
    curriculumPointIds: ["dsd-8.1", "dsd-8.2", "dsd-3.2"],
    realismScore: 8.6,
    responseFormat: "written",
    indicativeMarkSchemeOutline: [
      "Judges the outcome against client and user needs.",
      "Uses test results to support data accuracy claims.",
      "Discusses usability and evidence quality.",
      "Gives two realistic, justified improvements.",
    ],
    examinerRationale:
      "Reinforces that Task 4b is reflective evaluation, not more Task 4a development work.",
  },
  {
    id: "codex-esp-task4b-canteen-report-reflection-004",
    espTask: "task_4b",
    title: "Reflect on a canteen demand-report solution",
    vocationalContext:
      "A college canteen demand-reporting tool has been delivered to the catering manager.",
    brief:
      "The completed solution produces weekly summaries, but some source data has missing product categories.",
    studentTask:
      "Evaluate the solution's usefulness and explain limitations and improvements with reference to the evidence.",
    expectedDeliverable:
      "A reflective evaluation with supported judgement, two limitations and two justified improvements.",
    relatedContentAreas: ["reflective evaluation", "data quality", "testing evidence", "improvement"],
    difficulty: "high",
    briefType: "reflective-evaluation",
    deliverableType: "reflective-evaluation",
    questionType: "extended-response",
    marks: 8,
    sourceReference: "Task 4b reflective evaluation booklets and CSV-led Task 4a evidence patterns.",
    sourceFile: SOURCE_FILES.task4b,
    sourceExcerptHash: "fnv1a-4acde201",
    curriculumPointIds: ["dsd-8.1", "dsd-8.2", "dsd-6.3"],
    realismScore: 8.5,
    responseFormat: "written",
    indicativeMarkSchemeOutline: [
      "Makes a supported judgement about usefulness.",
      "Identifies data-quality or implementation limitations.",
      "Links evidence to client impact.",
      "Gives realistic improvements that follow from the limitations.",
    ],
    examinerRationale:
      "Suitable Task 4b practice because it requires evidence-led reflection and does not ask for new code.",
  },
];

export const CODEX_ESP_PRACTICE_METADATA: QuestionMetadata[] = ESP_PRACTICE_SEEDS.map(
  (seed) =>
    ({
    id: seed.id,
    sourceId: ESP_SOURCE_ID,
    title: seed.title,
    sourceLabel: SOURCE_LABEL,
    year: 2026,
    marks: seed.marks,
    questionType: seed.questionType,
    summary: `${seed.vocationalContext} ${seed.brief}`,
    expectation: seed.expectedDeliverable,
    curriculumPointIds: seed.curriculumPointIds,
    legacyTopicIds: ["esp"],
    practicePrompt: `${seed.brief}\n\n${seed.studentTask}`,
    markSchemeConceptIds: [],
    reviewed: true,
    active: true,
    examMetadata: {
      assessmentTrack: "esp",
      espTask: seed.espTask,
      vocationalContext: seed.vocationalContext,
      briefType: seed.briefType,
      deliverableType: seed.deliverableType,
      relatedContentAreas: seed.relatedContentAreas,
      contentArea: "Employer Set Project",
      subtopic: seed.espTask,
      stimulus: seed.brief,
      difficulty: seed.difficulty,
      indicativeMarkScheme: {
        type: seed.marks >= 8 ? "levels_based" : "points_based",
        points: seed.indicativeMarkSchemeOutline,
        judgementRequired:
          seed.espTask === "task_1" ||
          seed.espTask === "task_4b" ||
          seed.deliverableType === "reflective-evaluation",
        modelAnswerOutline: seed.expectedDeliverable,
      },
      sourceReference: seed.sourceReference,
      sourceFile: seed.sourceFile,
      sourceExcerptHash: seed.sourceExcerptHash,
      generationBatch: GENERATION_BATCH,
      validation: {
        fitsPaperBoundary: true,
        fitsCommandWord: true,
        fitsMarkDemand: true,
        specGrounded: true,
        sourceGrounded: true,
        notDuplicate: true,
        scenarioDistinct: true,
        answerLogicDistinct: true,
      },
      examinerRationale: seed.examinerRationale,
      reviewDecision: "keep",
      duplicationRisk: "low",
      realismScore: seed.realismScore,
      scenarioSignature: `esp:${seed.espTask}:${seed.id}`,
      answerLogicSignature: `esp:${seed.espTask}:${seed.deliverableType}:${seed.id}`,
      responseFormat: seed.responseFormat,
    },
  }) satisfies QuestionMetadata
);
