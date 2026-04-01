import type { MarkSchemeConceptMetadata } from "./types";

export const MARK_SCHEME_CONCEPTS: MarkSchemeConceptMetadata[] = [
  {
    id: "ms-paper2-2023-q2b-healthcare-cia",
    sourceId: "mark-scheme-summer-2022",
    title: "Healthcare confidentiality and integrity controls",
    summary:
      "Credit answers that explain what confidentiality and integrity mean in patient-record systems, who should have authorised access, how accuracy is maintained, and why poor control could harm care or privacy.",
    conceptTargets: [
      "confidentiality protects sensitive patient data from unauthorised access",
      "only authorised staff should access the parts of the record they need",
      "integrity means records stay accurate, complete, and protected from improper change",
      "validation, audit trails, and controlled editing help maintain integrity",
      "poor record control can cause privacy breaches, unsafe treatment, or loss of trust",
    ],
    curriculumPointIds: ["dsd-1.4", "dsd-2.2", "dsd-6.1"],
    legacyTopicIds: ["security", "legislation"],
  },
  {
    id: "ms-aut22-q2b-remote-working-threats",
    sourceId: "mark-scheme-autumn-2022",
    title: "Remote working security threats",
    summary:
      "Accepted risks include botnets, DDoS, hacking, ransomware, social engineering, insecure APIs, open networks, and eavesdropping, provided the answer links each risk to a realistic impact.",
    conceptTargets: [
      "botnets hijack compromised devices",
      "DDoS overwhelms servers",
      "malware or ransomware damages files or operations",
      "social engineering tricks users into revealing sensitive information",
      "insecure APIs expose backdoor access",
      "eavesdropping enables data interception",
    ],
    curriculumPointIds: ["dsd-2.2", "dsd-7.1", "dsd-8.1"],
    legacyTopicIds: ["security"],
  },
  {
    id: "ms-aut22-q4-virtual-environment-benefits",
    sourceId: "mark-scheme-autumn-2022",
    title: "Benefits of virtual environments",
    summary:
      "Mark-credit patterns emphasise emulation, isolation, and security when explaining why virtual environments help testing and development.",
    conceptTargets: [
      "emulation supports testing across platforms",
      "isolation protects the host system when failures occur",
      "virtual environments can hide host-machine details and improve security",
    ],
    curriculumPointIds: ["dsd-4.3", "dsd-6.4"],
    legacyTopicIds: ["digital-environments", "security"],
  },
  {
    id: "ms-aut22-q6-business-risks",
    sourceId: "mark-scheme-autumn-2022",
    title: "Business risks in a digital product context",
    summary:
      "Accepted evaluative risk patterns include cyberattack, compliance failure, system failure, audience exclusion, rival services, and rapid technology change, each linked to a business consequence.",
    conceptTargets: [
      "cyberattack compromises data or degrades performance",
      "non-compliance leads to fines or reputational damage",
      "system failure causes lost business",
      "audience exclusion harms reach or sales",
      "technology change demands reinvestment",
    ],
    curriculumPointIds: ["dsd-2.2", "dsd-8.1"],
    legacyTopicIds: ["business", "security"],
  },
  {
    id: "ms-aut22-q7-data-tools",
    sourceId: "mark-scheme-autumn-2022",
    title: "Data warehousing, lakes, mining, and reporting",
    summary:
      "Mark-scheme concepts distinguish raw versus structured storage, storage scale, data wrangling, pattern finding, and turning data into meaningful reports.",
    conceptTargets: [
      "data warehouses store historical relational data",
      "data lakes hold raw or unstructured data",
      "data mining finds patterns in stored data",
      "reporting turns raw data into decision-ready output",
    ],
    curriculumPointIds: ["dsd-1.5", "dsd-3.2", "dsd-6.3"],
    legacyTopicIds: ["data", "business"],
  },
  {
    id: "ms-general-linked-explanation",
    sourceId: "mark-scheme-autumn-2022",
    title: "Linked explanation pattern",
    summary:
      "Across short and medium open questions, marks are often awarded first for identification and then for an explicitly linked explanation or expansion.",
    conceptTargets: [
      "identify the correct concept clearly",
      "link the concept to context or outcome",
      "expand with a consequence, purpose, or impact",
    ],
    curriculumPointIds: ["dsd-1.4", "dsd-2.2", "dsd-4.3", "dsd-8.2"],
    legacyTopicIds: ["business", "data", "security", "digital-environments"],
  },
  {
    id: "ms-paper2-2023-q3-service-quality",
    sourceId: "mark-scheme-summer-2022",
    title: "Keeping a digital service useful for its users",
    summary:
      "Credit answers that identify one practical feedback or monitoring method, explain how the team uses that evidence to understand changing user needs, and show how that leads to useful service improvements.",
    conceptTargets: [
      "collect user feedback or usability evidence regularly",
      "analyze how users behave or what they report",
      "identify changing user needs, pain points, or valuable improvements",
      "prioritize updates or refinements based on the evidence",
      "keep the service useful, relevant, usable, or valuable for users",
    ],
    curriculumPointIds: ["dsd-1.4", "dsd-4.3", "dsd-6.2"],
    legacyTopicIds: ["business"],
  },
];
