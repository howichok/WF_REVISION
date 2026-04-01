import type { ExamGuide } from "./types";

export const DSD_EXAM_GUIDE_2026: ExamGuide = {
  id: "dsd-exam-guide-2026",
  title: "Digital Software Development 2026 exam guide",
  summary:
    "Official 2026 Pearson key dates and route framing for Digital Software Development. Use this as the live exam-timeline layer for the site, then route learners into topic practice, Paper 1, Paper 2, and weak-area review.",
  caution:
    "Dates are taken from the official Pearson key dates material and should still be treated as operational dates that schools and centres must re-check before final entry and delivery.",
  sourceLabel: "Pearson key dates and qualification guidance",
  entries: [
    {
      id: "summer-2026-paper-1",
      title: "Core exam: Paper 1",
      series: "Summer 2026",
      dateLabel: "Tuesday 2 June 2026 · morning",
      isoDate: "2026-06-02",
      duration: "2h 15m",
      summary:
        "Theory-heavy externally assessed paper. Best supported by fast retrieval, terminology precision, concept recall, and broad topic coverage.",
      routeHint: "/revision/paper-1",
      sourceId: "pearson-dsd-qualification-page",
      emphasis: "paper-1",
    },
    {
      id: "summer-2026-paper-2",
      title: "Core exam: Paper 2",
      series: "Summer 2026",
      dateLabel: "Tuesday 9 June 2026 · morning",
      isoDate: "2026-06-09",
      duration: "2h 15m",
      summary:
        "Applied written-response paper. Best supported by scenario practice, explanation quality, design reasoning, and mark-scheme-aware answer checking.",
      routeHint: "/revision/paper-2",
      sourceId: "pearson-dsd-qualification-page",
      emphasis: "paper-2",
    },
    {
      id: "summer-2026-occupational-specialism",
      title: "Occupational specialism assessment window",
      series: "Summer 2026",
      dateLabel: "Monday 9 March 2026 to Friday 20 March 2026",
      isoDate: "2026-03-09",
      duration: "15 hours total",
      summary:
        "The occupational specialism still matters alongside core revision. It is project-like, applied, and closer to software delivery than pure exam recall.",
      sourceId: "pearson-dsd-qualification-description",
      emphasis: "project",
    },
    {
      id: "summer-2026-esp-prerelease",
      title: "Employer-set project pre-release window",
      series: "Summer 2026",
      dateLabel: "Monday 11 May 2026 to Tuesday 12 May 2026",
      isoDate: "2026-05-11",
      summary:
        "The pre-release stage gives learners project context before the controlled employer-set project tasks begin.",
      sourceId: "pearson-dsd-qualification-page",
      emphasis: "project",
    },
    {
      id: "summer-2026-results",
      title: "Summer 2026 results day",
      series: "Summer 2026",
      dateLabel: "Thursday 13 August 2026",
      isoDate: "2026-08-13",
      summary:
        "Use this as the endpoint for the summer exam cycle when planning revision intensity and the final practice ramp.",
      sourceId: "pearson-dsd-qualification-page",
      emphasis: "results",
    },
    {
      id: "autumn-2026-paper-1",
      title: "Autumn 2026 Paper 1 resit",
      series: "Autumn 2026",
      dateLabel: "Tuesday 1 December 2026 · morning",
      isoDate: "2026-12-01",
      duration: "2h 15m",
      summary:
        "Autumn resit window for the first core paper. Useful when building a separate resit-focused path later.",
      routeHint: "/revision/paper-1",
      sourceId: "pearson-dsd-qualification-page",
      emphasis: "resit",
    },
    {
      id: "autumn-2026-paper-2",
      title: "Autumn 2026 Paper 2 resit",
      series: "Autumn 2026",
      dateLabel: "Tuesday 8 December 2026 · morning",
      isoDate: "2026-12-08",
      duration: "2h 15m",
      summary:
        "Autumn resit window for the applied written paper. The same Paper 2 practice route can later support this path as well.",
      routeHint: "/revision/paper-2",
      sourceId: "pearson-dsd-qualification-page",
      emphasis: "resit",
    },
  ],
};
