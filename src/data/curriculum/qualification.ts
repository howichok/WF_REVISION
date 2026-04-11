import type { QualificationOverview } from "./types";

export const DIGITAL_SOFTWARE_DEVELOPMENT_QUALIFICATION: QualificationOverview = {
  id: "pearson-dsd-qualification",
  title: "T Level Technical Qualification in Digital Software Development",
  level: "Level 3",
  duration: "Two-year programme",
  industryPlacement: "Minimum 315-hour industry placement",
  summary:
    "The current Pearson T Level in Digital Software Development combines core digital knowledge with occupational specialism skills in software design, development, testing, and deployment. The core route still matters for broad revision, but the wider qualification also expects applied project delivery and workplace readiness.",
  coreTopics: [
    "business context and project thinking",
    "problem solving and computational thinking",
    "programming foundations",
    "data and digital environments",
    "security, legal, and ethical practice",
  ],
  occupationalSpecialismTopics: [
    "requirements analysis",
    "software design and architecture",
    "coding and implementation",
    "testing and debugging",
    "deployment and maintenance",
    "collaborative software delivery",
  ],
  assessmentComponents: [
    {
      id: "core-exam-1",
      title: "Core exam route",
      summary:
        "Official qualification information describes the core component as externally assessed and supported by broad digital knowledge across problem solving, programming, data, environments, security, and legislation. Per the 2025 Digital Software Development specification, each written core paper is 90 marks (not 100 where older planner PDFs disagree).",
      focus:
        "Best used for theory retrieval, terminology, definitions, and shorter knowledge checks.",
      routeHint: "/revision/paper-1",
    },
    {
      id: "core-exam-2",
      title: "Applied exam route (Paper 2 style)",
      summary:
        "The applied exam-style element emphasises context, scenario reasoning, design choices, quality, user needs, and justified written responses. Align timing and marks expectations with the 2025 spec: 90 marks per core paper.",
      focus:
        "Best used for scenario analysis, design reasoning, and structured written explanations.",
      routeHint: "/revision/paper-2",
    },
    {
      id: "occupational-specialism",
      title: "Occupational specialism (DSD)",
      summary:
        "The qualification also expects project-based software delivery skills: turning requirements into tested, usable, secure solutions that match user and business needs.",
      focus:
        "Best reinforced through topic workspaces, answer checking, exam drills, and applied practice rather than pure retrieval alone.",
    },
  ],
};
