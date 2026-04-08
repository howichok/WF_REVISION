/**
 * Typical May/June milestone layout for core papers + ESP (illustrative dates).
 * Routes point at this app’s revision areas (ported from revision_website planner concept).
 */
export type ExamPlanPaper = "paper-1" | "paper-2" | "esp" | "os";

export interface ExamMilestone {
  paper: ExamPlanPaper;
  title: string;
  shortTitle: string;
  kind: "task" | "exam" | "milestone";
  /** Calendar month (1–12), illustrative */
  month: number;
  day: number;
  focusLabel: string;
  href: string;
}

export const PAPER_LABELS: Record<ExamPlanPaper, string> = {
  "paper-1": "Paper 1",
  "paper-2": "Paper 2",
  esp: "ESP",
  os: "Occupational specialism",
};

export const EXAM_MILESTONES: ExamMilestone[] = [
  {
    paper: "esp",
    title: "ESP Task 1",
    shortTitle: "Task 1",
    kind: "task",
    month: 5,
    day: 11,
    focusLabel: "Project brief, requirements, and scenario framing",
    href: "/revision/topics?mode=simple",
  },
  {
    paper: "esp",
    title: "ESP Task 2",
    shortTitle: "Task 2",
    kind: "task",
    month: 5,
    day: 13,
    focusLabel: "Requirements, acceptance criteria, and planning",
    href: "/revision/topics?mode=simple",
  },
  {
    paper: "esp",
    title: "ESP Task 3 (Design)",
    shortTitle: "Task 3",
    kind: "task",
    month: 5,
    day: 15,
    focusLabel: "Design decisions, structure, and solution communication",
    href: "/revision/topics?mode=simple",
  },
  {
    paper: "esp",
    title: "ESP Task 4A",
    shortTitle: "Task 4A",
    kind: "task",
    month: 5,
    day: 18,
    focusLabel: "Implementation, testing evidence, and defect fixing",
    href: "/revision/topics?mode=simple",
  },
  {
    paper: "esp",
    title: "ESP Task 4B",
    shortTitle: "Task 4B",
    kind: "task",
    month: 5,
    day: 20,
    focusLabel: "Evaluation, evidence, and final justification",
    href: "/revision/topics?mode=simple",
  },
  {
    paper: "paper-1",
    title: "Paper 1",
    shortTitle: "Paper 1",
    kind: "exam",
    month: 5,
    day: 22,
    focusLabel: "Problem solving, algorithms, and programming fundamentals",
    href: "/revision/paper-1",
  },
  {
    paper: "paper-2",
    title: "Paper 2",
    shortTitle: "Paper 2",
    kind: "exam",
    month: 6,
    day: 2,
    focusLabel: "Data, security, legislation, and business context",
    href: "/revision/paper-2",
  },
  {
    paper: "os",
    title: "Next milestone",
    shortTitle: "OS",
    kind: "milestone",
    month: 6,
    day: 9,
    focusLabel: "Occupational specialism planning and practical extension",
    href: "/revision",
  },
];
