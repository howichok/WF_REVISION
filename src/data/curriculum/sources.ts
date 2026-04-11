import type { ContentSource } from "./types";
import { TEACHING_PACK_SOURCES } from "./teaching-pack";

export const CONTENT_SOURCES: ContentSource[] = [
  {
    id: "dsd-spec-2025",
    title: "T Level Technical Qualification in Digital Software Development Specification",
    kind: "specification",
    classification: "primary",
    filePath: "docs/raw/spec/digital-dsd-specification.pdf",
    year: 2025,
    notes:
      "Canonical curriculum source for Digital Software Development. Content area structure and scope should be taken from here first.",
  },
  {
    id: "dsd-spec-2025-copy",
    title: "Digital Software Development Specification Copy",
    kind: "specification",
    classification: "duplicate",
    filePath: "docs/raw/exams/digital-dsd-specification-1.pdf",
    year: 2025,
    duplicateOfId: "dsd-spec-2025",
    notes:
      "Duplicate copy of the 2025 Digital Software Development specification kept in the exams folder.",
  },
  {
    id: "pearson-dsd-qualification-page",
    title: "Pearson Qualification Page: Digital Software Development",
    kind: "specification",
    classification: "primary",
    filePath:
      "https://qualifications.pearson.com/en/qualifications/t-levels/digital-software-development.html",
    year: 2025,
    notes:
      "Official qualification landing page for the Pearson T Level in Digital Software Development. Useful for the live qualification overview and official web context alongside the specification PDF.",
  },
  {
    id: "pearson-dsd-qualification-description",
    title: "Pearson Qualification Description PDF",
    kind: "specification",
    classification: "primary",
    filePath:
      "https://qualifications.pearson.com/content/dam/pdf/T%20Levels/Digital%20Software%20Development/Technical%20Qualification/Pearson-TQ-Digital-Software-Development_Qualification-Description.pdf",
    year: 2025,
    notes:
      "Official qualification description PDF covering the programme shape, core component context, occupational specialism expectations, and qualification overview.",
  },
  {
    id: "tlevels-student-dsd-page",
    title: "T Levels Student Page: Digital Software Development",
    kind: "specification",
    classification: "secondary",
    filePath:
      "https://www.tlevels.gov.uk/students/subjects/digital-software-development",
    year: 2025,
    notes:
      "Student-facing overview of the Digital Software Development T Level, including the broad qualification shape, progression context, and high-level route explanation.",
  },
  {
    id: "tlevels-support-dsd-page",
    title: "T Levels Support: Digital Software Development",
    kind: "textbook",
    classification: "secondary",
    filePath:
      "https://support.tlevels.gov.uk/hc/en-gb/articles/13813213896210-Digital-Production-Design-and-Development-now-T-Level-in-Digital-Software-Development",
    year: 2025,
    notes:
      "Official provider-support article explaining the Digital Software Development naming update and linking out to teaching, learning, and support materials.",
  },
  {
    id: "tlevels-update-march-2025",
    title: "T Level Update March 2025",
    kind: "textbook",
    classification: "secondary",
    filePath:
      "https://support.tlevels.gov.uk/hc/en-gb/articles/25130056060434-T-Level-update-March-2025",
    year: 2025,
    notes:
      "Official update article explaining the March 2025 transition messaging and streamlining around the Digital Software Development route.",
  },
  {
    id: "pearson-dsd-course-materials",
    title: "Pearson Course Materials Page: Digital Software Development",
    kind: "textbook",
    classification: "secondary",
    filePath:
      "https://qualifications.pearson.com/en/qualifications/t-levels/digital-software-development.coursematerials.html",
    year: 2025,
    notes:
      "Official course materials page. Useful operationally because it currently indicates that course materials are not yet listed there, which affects where support content must be sourced from.",
  },
  {
    id: "dpdd-core-book-2023",
    title: "Digital Production, Design and Development T Level: Core",
    kind: "textbook",
    classification: "legacy",
    filePath: "docs/raw/core-book/Digital Production, Design and Development T Level_ Core.pdf",
    year: 2023,
    caution:
      "This is aligned to the older Digital Production, Design and Development core structure, not the 2025 DSD occupational specification.",
    notes:
      "Useful for legacy numbered topic detail, terminology, explanations, and practice prompts where it aligns conceptually with the current app topics.",
  },
  {
    id: "paper1-q-and-a",
    title: "Paper 1 Q and A",
    kind: "question-bank",
    classification: "legacy",
    filePath: "docs/raw/exams/Paper 1 Q and A.pdf",
    notes:
      "Compiled question bank aligned to older core topics such as variables, validation, decomposition, abstraction, flowcharts, and sorting/searching.",
    caution:
      "Use as an enrichment source for practice coverage and common question patterns, not as the canonical curriculum structure.",
  },
  {
    id: "curated-paper1-practice",
    title: "Curated Paper 1 Practice Set",
    kind: "question-bank",
    classification: "secondary",
    filePath: "internal://curated-paper1-practice",
    year: 2026,
    notes:
      "Internal practice set written in simpler exam language to increase Paper 1 retrieval coverage across requirements, testing, and core terminology.",
  },
  {
    id: "curated-paper2-practice",
    title: "Curated Paper 2 Practice Set",
    kind: "question-bank",
    classification: "secondary",
    filePath: "internal://curated-paper2-practice",
    year: 2026,
    notes:
      "Internal scenario-style question set written in clearer language to expand Paper 2 applied practice across UI, deployment, change, APIs, and collaboration.",
  },
  {
    id: "codex-reviewed-paper1-exam-bank-2026",
    title: "Codex Reviewed Paper 1 Exam-Style Bank 2026",
    kind: "question-bank",
    classification: "secondary",
    filePath: "internal://codex-reviewed-paper1-exam-bank-2026",
    year: 2026,
    notes:
      "Reviewed internal Paper 1 exam-style question bank generated from repository-held official/spec-aligned sources. Metadata records command word, assessment objective emphasis, paper boundary validation, and provenance.",
  },
  {
    id: "codex-reviewed-paper2-exam-bank-2026",
    title: "Codex Reviewed Paper 2 Exam-Style Bank 2026",
    kind: "question-bank",
    classification: "secondary",
    filePath: "internal://codex-reviewed-paper2-exam-bank-2026",
    year: 2026,
    notes:
      "Reviewed internal Paper 2 exam-style question bank generated from repository-held official/spec-aligned sources. Metadata records command word, assessment objective emphasis, paper boundary validation, and provenance.",
  },
  {
    id: "core-paper2-autumn-2022",
    title: "Core Paper 2 Autumn 2022",
    kind: "past-paper",
    classification: "legacy",
    filePath: "docs/raw/exams/core-paper-2- autumn-22.pdf",
    year: 2022,
    notes:
      "Older Digital Production, Design and Development paper covering business context, data, digital environments, and security.",
    caution:
      "Question coverage is valuable, but topic naming and scope must be mapped carefully to the 2025 DSD structure.",
  },
  {
    id: "core-paper2-november-2021",
    title: "Core Paper 2 November 2021",
    kind: "past-paper",
    classification: "legacy",
    filePath: "docs/raw/exams/core-paper-2- november 21.pdf",
    year: 2021,
    notes:
      "Legacy paper used for exam-style phrasing and topic coverage patterns.",
    caution:
      "Keep as enrichment only because it follows the older DPDD core assessment model.",
  },
  {
    id: "paper2-2023",
    title: "Paper 2 2023",
    kind: "past-paper",
    classification: "legacy",
    filePath: "docs/raw/exams/Paper 2 2023.pdf",
    year: 2023,
    notes:
      "Recent legacy paper with strong usable prompts around UI design, security, change, and virtual environments.",
    caution:
      "Still maps to the older core exam rather than the 2025 DSD occupational content areas.",
  },
  {
    id: "mark-scheme-autumn-2022",
    title: "Core Paper 2 Mark Scheme Autumn 2022",
    kind: "mark-scheme",
    classification: "legacy",
    filePath: "docs/raw/exams/core-paper-2-mark-scheme-autumn-2022.pdf",
    year: 2022,
    notes:
      "Useful source for concept targets, accepted answers, and evaluation patterns that can support answer-checking heuristics.",
    caution:
      "Mark-scheme concepts should enrich mappings and scoring logic, not override the canonical DSD structure.",
  },
  {
    id: "mark-scheme-summer-2022",
    title: "Mark Scheme Summer 2022",
    kind: "mark-scheme",
    classification: "legacy",
    filePath: "docs/raw/exams/mark scheme - summer 22.pdf",
    year: 2022,
    notes:
      "Additional legacy mark-scheme coverage for data, business, and security answer expectations.",
    caution:
      "Use carefully because the exam belongs to the older core model.",
  },
  {
    id: "mark-scheme-autumn-2021",
    title: "Paper 2 Mark Scheme Autumn 2021",
    kind: "mark-scheme",
    classification: "legacy",
    filePath: "docs/raw/exams/paper 2 mark scheme - autumn 21.pdf",
    year: 2021,
    notes:
      "Extra evidence for recurring concept targets and common explanation patterns in legacy paper 2 responses.",
    caution:
      "Should be used for concept enrichment only.",
  },
  ...TEACHING_PACK_SOURCES,
];
