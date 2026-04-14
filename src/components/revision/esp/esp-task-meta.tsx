"use client";

import {
  ClipboardCheck,
  ClipboardList,
  Code2,
  PencilRuler,
  SearchCheck,
  Wrench,
} from "lucide-react";
import type { EspTask, QuestionMetadata } from "@/data/curriculum";

export type StepTone = "accent" | "success" | "warning" | "danger";

export interface EspStep {
  id: EspTask;
  label: string;
  action: string;
  time: string;
  deliverable: string;
  evidence: string[];
  avoid: string;
  tone: StepTone;
  icon: typeof SearchCheck;
}

export interface GuideScene {
  title: string;
  instruction: string;
  artefact: string[];
  prompt: string;
}

export interface TaskGuide {
  heading: string;
  artefactLabel: string;
  scenes: GuideScene[];
}

export const ESP_TASK_STEPS: EspStep[] = [
  {
    id: "pre_release",
    label: "Brief read",
    action: "Find what the client needs",
    time: "Before timed work",
    deliverable: "Brief triage note",
    evidence: ["client need", "constraints", "files", "risks"],
    avoid: "Starting a plan before the facts are sorted.",
    tone: "accent",
    icon: SearchCheck,
  },
  {
    id: "task_1",
    label: "Task 1",
    action: "Plan the project",
    time: "Planning task",
    deliverable: "Plan and rationale",
    evidence: ["sequence", "staff", "cost", "testing"],
    avoid: "A list of tasks with no reason for the order.",
    tone: "success",
    icon: ClipboardList,
  },
  {
    id: "task_2",
    label: "Task 2",
    action: "Fix defects",
    time: "Code repair",
    deliverable: "Corrected code and test log",
    evidence: ["fault", "fix", "test data", "actual result"],
    avoid: "Changing code without recording tests.",
    tone: "warning",
    icon: Wrench,
  },
  {
    id: "task_3",
    label: "Task 3",
    action: "Design before build",
    time: "Design task",
    deliverable: "Algorithm or flow design",
    evidence: ["inputs", "validation", "processing", "outputs"],
    avoid: "Writing code instead of a design.",
    tone: "accent",
    icon: PencilRuler,
  },
  {
    id: "task_4a",
    label: "Task 4a",
    action: "Develop the solution",
    time: "Build task",
    deliverable: "Working code evidence",
    evidence: ["code", "CSV handling", "output", "tests"],
    avoid: "Submitting output without proof it works.",
    tone: "danger",
    icon: Code2,
  },
  {
    id: "task_4b",
    label: "Task 4b",
    action: "Evaluate the result",
    time: "Reflection task",
    deliverable: "Evidence-led evaluation",
    evidence: ["requirements", "test proof", "limits", "improvements"],
    avoid: "Changing the solution instead of reflecting on it.",
    tone: "success",
    icon: ClipboardCheck,
  },
];

export const ESP_TASK_SLUGS: Record<EspTask, string> = {
  pre_release: "pre-release",
  task_1: "task-1",
  task_2: "task-2",
  task_3: "task-3",
  task_4a: "task-4a",
  task_4b: "task-4b",
};

export function getEspTaskHref(taskId: EspTask) {
  return `/revision/esp/${ESP_TASK_SLUGS[taskId]}`;
}

export const espToneStyles: Record<
  StepTone,
  { text: string; border: string; bg: string; softBg: string; ring: string }
> = {
  accent: {
    text: "text-accent",
    border: "border-accent/25",
    bg: "bg-accent/12",
    softBg: "bg-accent/8",
    ring: "ring-accent/25",
  },
  success: {
    text: "text-success",
    border: "border-success/25",
    bg: "bg-success/12",
    softBg: "bg-success/8",
    ring: "ring-success/25",
  },
  warning: {
    text: "text-warning",
    border: "border-warning/30",
    bg: "bg-warning/12",
    softBg: "bg-warning/8",
    ring: "ring-warning/25",
  },
  danger: {
    text: "text-danger",
    border: "border-danger/25",
    bg: "bg-danger/10",
    softBg: "bg-danger/8",
    ring: "ring-danger/20",
  },
};

export const ESP_TASK_GUIDES: Record<EspTask, TaskGuide> = {
  pre_release: {
    heading: "Brief triage guide",
    artefactLabel: "brief-notes.md",
    scenes: [
      {
        title: "Separate the facts",
        instruction: "Read the brief once for the client aim, then again for files, constraints, and risks.",
        artefact: [
          "# Client need",
          "- Who will use the solution?",
          "- What decision or service must improve?",
          "",
          "# Evidence to collect",
          "- Provided datasets",
          "- Existing code or templates",
          "- Any deadlines, formats, or accessibility needs",
        ],
        prompt: "Before planning, write only facts from the brief. Do not design the solution yet.",
      },
      {
        title: "Name the deliverables",
        instruction: "Turn the brief into a short list of outputs that a marker can actually see.",
        artefact: [
          "deliverables = [",
          "  'project plan with dependencies',",
          "  'defect log and corrected code',",
          "  'design with inputs, processes, outputs',",
          "  'tested working solution',",
          "  'evaluation linked to evidence',",
          "]",
        ],
        prompt: "If a deliverable cannot be evidenced, rewrite it until it can be checked.",
      },
      {
        title: "Spot risk early",
        instruction: "Mark where data, code, timing, or user needs could make the task harder.",
        artefact: [
          "| Risk | Why it matters | Control |",
          "| --- | --- | --- |",
          "| Missing values | Output may be wrong | Validate before processing |",
          "| Tight deadline | Testing may be rushed | Test after each feature |",
          "| Existing defect | Fix may break another area | Regression test |",
        ],
        prompt: "Good ESP work explains what you will protect, not just what you will build.",
      },
    ],
  },
  task_1: {
    heading: "Planning guide",
    artefactLabel: "project-plan.csv",
    scenes: [
      {
        title: "Build the task chain",
        instruction: "Plan in dependency order: brief, data, design, build, test, review.",
        artefact: [
          "Task,Depends on,Reason",
          "Confirm requirements,None,Prevents wrong scope",
          "Inspect data,Requirements,Finds validation needs",
          "Design algorithm,Data inspection,Defines processing",
          "Implement feature,Design,Reduces rework",
          "Test and fix,Implementation,Provides evidence",
        ],
        prompt: "A strong plan says why the order is right for the project.",
      },
      {
        title: "Add resources",
        instruction: "Link people, tools, and files to each stage so the plan is vocational.",
        artefact: [
          "resource_plan = {",
          "  'data': 'provided CSV or spreadsheet',",
          "  'tooling': 'Python editor, spreadsheet software',",
          "  'people': 'developer, tester, client contact',",
          "  'evidence': 'screenshots, test log, plan updates',",
          "}",
        ],
        prompt: "Avoid a generic study timetable. Make it look like a small software project.",
      },
      {
        title: "Make testing visible",
        instruction: "Put testing into the plan before the build is finished.",
        artefact: [
          "| Stage | Test evidence |",
          "| --- | --- |",
          "| Data import | valid and invalid rows load safely |",
          "| Calculation | expected output checked by hand |",
          "| Interface | user can complete the task |",
          "| Final review | requirement-by-requirement check |",
        ],
        prompt: "Testing is part of Task 1 planning, not a surprise at the end.",
      },
    ],
  },
  task_2: {
    heading: "Defect-fixing guide",
    artefactLabel: "repair-and-test.py",
    scenes: [
      {
        title: "Reproduce the defect",
        instruction: "Run or trace the broken behaviour before changing anything.",
        artefact: [
          "test_case = {'input': 'A12, 3, 4', 'expected': 12}",
          "actual = calculate_total(test_case['input'])",
          "print(actual)  # record the wrong result first",
        ],
        prompt: "The marker needs to see the fault you found, not just the final code.",
      },
      {
        title: "Fix one cause",
        instruction: "Change the smallest part that explains the defect.",
        artefact: [
          "def calculate_total(quantity, price):",
          "    quantity = int(quantity)",
          "    price = float(price)",
          "    return quantity * price",
          "",
          "# Fix: convert text input before calculation",
        ],
        prompt: "Do not rewrite the whole program unless the brief requires it.",
      },
      {
        title: "Log proof",
        instruction: "Use normal, boundary, and invalid test data after the fix.",
        artefact: [
          "| Test | Data | Expected | Actual | Outcome |",
          "| --- | --- | --- | --- | --- |",
          "| normal | 3, 4.00 | 12.00 | 12.00 | pass |",
          "| boundary | 0, 4.00 | 0.00 | 0.00 | pass |",
          "| invalid | three, 4.00 | error message | error message | pass |",
        ],
        prompt: "A defect fix without a test log is weak evidence.",
      },
    ],
  },
  task_3: {
    heading: "Design guide",
    artefactLabel: "solution-design.pseudo",
    scenes: [
      {
        title: "Design the data flow",
        instruction: "Show inputs, validation, processing, and outputs before coding.",
        artefact: [
          "INPUT csv_file",
          "FOR each row IN csv_file",
          "  VALIDATE required fields",
          "  IF row is valid THEN",
          "    CALCULATE category summary",
          "  ELSE",
          "    ADD row to error report",
          "OUTPUT summary table and error report",
        ],
        prompt: "This is a design task. Pseudocode, flowcharts, or structured diagrams beat raw code.",
      },
      {
        title: "Plan validation",
        instruction: "Add checks that match the brief and the dataset.",
        artefact: [
          "validation_rules = [",
          "  'required fields are present',",
          "  'numeric values are in range',",
          "  'dates use the expected format',",
          "  'duplicate IDs are flagged',",
          "]",
        ],
        prompt: "Validation decisions should be justified by the scenario, not copied from a generic list.",
      },
      {
        title: "Choose evidence format",
        instruction: "Select the design artefact that makes your logic easiest to mark.",
        artefact: [
          "| Requirement | Design evidence |",
          "| --- | --- |",
          "| import data | input/output table |",
          "| calculate totals | pseudocode block |",
          "| handle errors | decision branch |",
          "| report results | annotated output sketch |",
        ],
        prompt: "Use annotations so the examiner can connect your design to the client need.",
      },
    ],
  },
  task_4a: {
    heading: "Development guide",
    artefactLabel: "working-solution.py",
    scenes: [
      {
        title: "Start with file handling",
        instruction: "Load the provided data and fail clearly when it is missing or malformed.",
        artefact: [
          "import csv",
          "",
          "def load_rows(path):",
          "    with open(path, newline='') as file:",
          "        return list(csv.DictReader(file))",
        ],
        prompt: "Use the provided assets. Do not invent data that avoids the hard part.",
      },
      {
        title: "Build one feature",
        instruction: "Implement a small requirement, then test it before adding the next one.",
        artefact: [
          "def total_by_category(rows):",
          "    totals = {}",
          "    for row in rows:",
          "        category = row['category']",
          "        totals[category] = totals.get(category, 0) + float(row['value'])",
          "    return totals",
        ],
        prompt: "Keep the code readable enough for evidence screenshots and explanation.",
      },
      {
        title: "Prove it works",
        instruction: "Capture outputs that match the requirements and show edge cases.",
        artefact: [
          "rows = load_rows('client-data.csv')",
          "totals = total_by_category(rows)",
          "assert 'Retail' in totals",
          "print(totals)",
        ],
        prompt: "Development evidence should include code, output, and test results.",
      },
    ],
  },
  task_4b: {
    heading: "Reflection guide",
    artefactLabel: "evaluation.md",
    scenes: [
      {
        title: "Start with requirements",
        instruction: "Evaluate against the brief, not against whether the work felt easy.",
        artefact: [
          "## Requirement met",
          "The solution imports the supplied CSV and produces a summary by category.",
          "",
          "## Evidence",
          "Test 3 shows normal data produced the expected category totals.",
        ],
        prompt: "Every judgement needs evidence from planning, design, code, or tests.",
      },
      {
        title: "Discuss limits",
        instruction: "Name realistic weaknesses without pretending the whole solution failed.",
        artefact: [
          "## Limitation",
          "The validation catches blank numeric values but does not check unusual date formats.",
          "",
          "## Impact",
          "This could reduce reliability if the client imports older records.",
        ],
        prompt: "A strong evaluation is honest and specific.",
      },
      {
        title: "Recommend improvements",
        instruction: "Suggest next steps that follow from the evidence.",
        artefact: [
          "## Improvement",
          "Add a date parser and an error report export.",
          "",
          "## Justification",
          "This would help the client correct source data before using the summary.",
        ],
        prompt: "Do not add new code in Task 4b. Explain what should happen next and why.",
      },
    ],
  },
};

export function groupEspQuestionsByTask(questions: QuestionMetadata[]) {
  return questions.reduce<Record<EspTask, QuestionMetadata[]>>(
    (acc, question) => {
      const task = question.examMetadata?.espTask;
      if (task) {
        acc[task].push(question);
      }
      return acc;
    },
    {
      pre_release: [],
      task_1: [],
      task_2: [],
      task_3: [],
      task_4a: [],
      task_4b: [],
    }
  );
}

export function getEspQuestionContext(question: QuestionMetadata) {
  return question.examMetadata?.vocationalContext ?? question.summary;
}

export function getEspChecklist(question: QuestionMetadata) {
  return question.examMetadata?.indicativeMarkScheme?.points ?? [];
}
