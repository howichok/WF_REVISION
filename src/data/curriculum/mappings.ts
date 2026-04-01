import type { LegacyTopicMapping } from "./types";

export const LEGACY_TOPIC_MAPPINGS: LegacyTopicMapping[] = [
  {
    topicId: "problem-solving",
    officialPointIds: ["dsd-1.1", "dsd-1.3", "dsd-1.4", "dsd-4.1", "dsd-4.3", "dsd-7.3"],
    note:
      "The current app topic covers older core problem-solving content. It aligns most closely with DSD analysis, design, and test planning rather than a single official content area.",
  },
  {
    topicId: "intro-programming",
    officialPointIds: ["dsd-1.1", "dsd-4.1", "dsd-6.1", "dsd-6.2", "dsd-7.1", "dsd-7.2"],
    note:
      "Legacy programming theory maps mainly to DSD implementation, UI creation, and testing practice.",
  },
  {
    topicId: "emerging-issues",
    officialPointIds: ["dsd-1.5", "dsd-2.1", "dsd-2.2", "dsd-8.1"],
    note:
      "Emerging issues remains a legacy core-exam topic, so it is mapped to DSD technology impact, ethics, risk, and change drivers.",
  },
  {
    topicId: "legislation",
    officialPointIds: ["dsd-2.1", "dsd-2.2"],
    note:
      "Legacy legislation content maps directly to DSD legal, regulatory, ethical, and risk-management coverage.",
  },
  {
    topicId: "business",
    officialPointIds: ["dsd-1.1", "dsd-1.2", "dsd-1.3", "dsd-1.4", "dsd-5.1", "dsd-8.1", "dsd-8.2"],
    note:
      "Business context overlaps with planning, team roles, methodologies, collaborative delivery, and change management in DSD.",
  },
  {
    topicId: "data",
    officialPointIds: ["dsd-3.2", "dsd-4.3", "dsd-6.3"],
    note:
      "Legacy data theory maps most strongly to feedback data collection, database design, and data source integration.",
  },
  {
    topicId: "digital-environments",
    officialPointIds: ["dsd-4.3", "dsd-5.2", "dsd-6.1", "dsd-6.4"],
    note:
      "Digital environments maps to target platform decisions, collaborative tooling, implementation environment choices, and deployment methods.",
  },
  {
    topicId: "security",
    officialPointIds: ["dsd-1.4", "dsd-2.2", "dsd-6.1", "dsd-7.1", "dsd-8.1", "dsd-8.2"],
    note:
      "Security aligns with secure-by-design requirements, risk management, secure implementation, security testing, and maintenance after vulnerabilities appear.",
  },
  {
    topicId: "esp",
    officialPointIds: ["dsd-1.1", "dsd-4.3", "dsd-6.1", "dsd-7.1", "dsd-8.2"],
    note:
      "ESP is synoptic in the current app, so it maps to planning, design, implementation, testing, and controlled change.",
  },
];
