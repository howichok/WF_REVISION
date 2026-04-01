import type { GlossaryTerm } from "./types";

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "term-sdlc",
    term: "Software development lifecycle",
    aliases: ["SDLC"],
    definition:
      "A structured sequence of stages used to research, plan, design, build, test, deploy, and maintain software.",
    curriculumPointIds: ["dsd-1.1"],
    legacyTopicIds: ["problem-solving", "business", "intro-programming"],
  },
  {
    id: "term-acceptance-criteria",
    term: "Acceptance criteria",
    definition:
      "Specific conditions a solution must meet before a user or client can accept it as fit for purpose.",
    curriculumPointIds: ["dsd-1.1", "dsd-1.4"],
    legacyTopicIds: ["problem-solving", "business"],
  },
  {
    id: "term-agile",
    term: "Agile",
    definition:
      "An iterative development approach that delivers value in increments and adapts requirements over time.",
    curriculumPointIds: ["dsd-1.3"],
    legacyTopicIds: ["business", "problem-solving"],
  },
  {
    id: "term-secure-by-design",
    term: "Secure by design",
    definition:
      "Designing a solution so security requirements are built in early rather than patched on later.",
    curriculumPointIds: ["dsd-1.4", "dsd-2.2"],
    legacyTopicIds: ["security", "legislation"],
  },
  {
    id: "term-kpi",
    term: "KPI",
    aliases: ["key performance indicator"],
    definition:
      "A measurable indicator used to judge how well a solution is meeting performance or business goals.",
    curriculumPointIds: ["dsd-1.1", "dsd-1.4"],
    legacyTopicIds: ["business"],
  },
  {
    id: "term-triangulation",
    term: "Triangulation",
    definition:
      "Checking information against multiple sources to improve confidence that it is reliable.",
    curriculumPointIds: ["dsd-3.1"],
    legacyTopicIds: ["business", "data"],
  },
  {
    id: "term-wireframe",
    term: "Wireframe",
    definition:
      "A simplified design representation that shows layout, structure, and user flow before full visual build.",
    curriculumPointIds: ["dsd-4.3"],
    legacyTopicIds: ["business", "intro-programming"],
  },
  {
    id: "term-erd",
    term: "Entity relationship diagram",
    aliases: ["ERD"],
    definition:
      "A data-model diagram used to show entities, attributes, and relationships in a database design.",
    curriculumPointIds: ["dsd-1.1", "dsd-4.1", "dsd-4.3"],
    legacyTopicIds: ["data"],
  },
  {
    id: "term-version-control",
    term: "Version control",
    definition:
      "A system for tracking changes to code and coordinating development work across versions and contributors.",
    curriculumPointIds: ["dsd-1.1", "dsd-4.2", "dsd-5.2", "dsd-6.1"],
    legacyTopicIds: ["intro-programming", "business"],
  },
  {
    id: "term-api",
    term: "API",
    aliases: ["application programming interface"],
    definition:
      "A defined interface that allows software systems to request or exchange data and functionality.",
    curriculumPointIds: ["dsd-6.1", "dsd-6.3"],
    legacyTopicIds: ["data", "digital-environments", "intro-programming"],
  },
  {
    id: "term-cicd",
    term: "CI/CD",
    definition:
      "Continuous integration and continuous deployment: a pipeline approach for building, testing, and releasing software changes regularly.",
    curriculumPointIds: ["dsd-6.1"],
    legacyTopicIds: ["intro-programming", "business"],
  },
  {
    id: "term-accessibility",
    term: "Accessibility",
    definition:
      "Designing software so a wide range of users can perceive, navigate, and use it effectively.",
    curriculumPointIds: ["dsd-1.4", "dsd-4.3", "dsd-6.2"],
    legacyTopicIds: ["emerging-issues", "business", "legislation"],
  },
  {
    id: "term-vulnerability-scanning",
    term: "Vulnerability scanning",
    definition:
      "A security testing activity that checks a system for known weaknesses that could be exploited.",
    curriculumPointIds: ["dsd-7.1"],
    legacyTopicIds: ["security"],
  },
  {
    id: "term-regression-testing",
    term: "Regression testing",
    definition:
      "Re-running tests after a change to check that existing functionality still works as expected.",
    curriculumPointIds: ["dsd-7.3", "dsd-8.2"],
    legacyTopicIds: ["intro-programming", "security"],
  },
  {
    id: "term-business-continuity",
    term: "Business continuity",
    definition:
      "Planning and preparation that keeps critical services running when disruption or incidents occur.",
    curriculumPointIds: ["dsd-2.2"],
    legacyTopicIds: ["business", "security"],
  },
  {
    id: "term-zero-day",
    term: "Zero day",
    definition:
      "A newly discovered vulnerability that is exploited before a fix is available.",
    curriculumPointIds: ["dsd-8.1"],
    legacyTopicIds: ["security"],
  },
  {
    id: "term-six-vs-big-data",
    term: "Six Vs of big data",
    aliases: ["6 Vs", "big data dimensions"],
    definition:
      "Common lens for big data: Volume (scale), Velocity (speed), Variety (mixed formats), Veracity (trust/quality), Value (useful insight), Variability (changing patterns over time).",
    curriculumPointIds: ["dsd-3.2", "dsd-4.3"],
    legacyTopicIds: ["data"],
  },
  {
    id: "term-rbac",
    term: "Role-based access control",
    aliases: ["RBAC"],
    definition:
      "Access decisions based on a user’s role (e.g. analyst, admin): which assets they may read, write, or administer, often shown in a permission matrix.",
    curriculumPointIds: ["dsd-2.2", "dsd-6.1", "dsd-6.3"],
    legacyTopicIds: ["data", "security"],
  },
  {
    id: "term-data-wrangling",
    term: "Data wrangling",
    aliases: ["data cleaning pipeline"],
    definition:
      "Preparing raw data through structuring, cleaning, validating, enriching, and outputting consistent datasets ready for analysis or storage.",
    curriculumPointIds: ["dsd-3.2", "dsd-4.3", "dsd-6.3"],
    legacyTopicIds: ["data"],
  },
  {
    id: "term-mojibake",
    term: "Mojibake",
    aliases: ["encoding corruption"],
    definition:
      "Garbled text when bytes are interpreted with the wrong character encoding (e.g. smart quotes or symbols showing as replacement characters).",
    curriculumPointIds: ["dsd-4.3", "dsd-6.3"],
    legacyTopicIds: ["data"],
  },
  {
    id: "term-pattern-recognition",
    term: "Pattern recognition",
    definition:
      "Identifying similarities, trends, or repeated structures so a known rule or solution can be reused in a new problem.",
    curriculumPointIds: ["dsd-4.1"],
    legacyTopicIds: ["problem-solving"],
  },
  {
    id: "term-digital-inclusion",
    term: "Digital inclusion",
    definition:
      "Designing and delivering digital services so people are not excluded by disability, connectivity, cost, language, confidence, or device limitations.",
    curriculumPointIds: ["dsd-1.4", "dsd-2.1", "dsd-6.2"],
    legacyTopicIds: ["emerging-issues", "legislation", "business"],
  },
  {
    id: "term-data-warehouse",
    term: "Data warehouse",
    definition:
      "A store of structured, prepared, often historical data used for reporting, analysis, and business intelligence.",
    curriculumPointIds: ["dsd-1.5", "dsd-6.3"],
    legacyTopicIds: ["data", "business"],
  },
  {
    id: "term-data-lake",
    term: "Data lake",
    definition:
      "A large store that can hold raw, semi-structured, and unstructured data before it is refined for later analysis.",
    curriculumPointIds: ["dsd-1.5", "dsd-6.3"],
    legacyTopicIds: ["data", "business"],
  },
  {
    id: "term-confidentiality",
    term: "Confidentiality",
    definition:
      "Keeping information hidden from unauthorised people so only approved users can access it.",
    curriculumPointIds: ["dsd-2.2", "dsd-8.1"],
    legacyTopicIds: ["security", "legislation"],
  },
  {
    id: "term-integrity",
    term: "Integrity",
    definition:
      "Keeping data accurate, complete, and protected from improper or unauthorised change.",
    curriculumPointIds: ["dsd-2.2", "dsd-8.1"],
    legacyTopicIds: ["security", "data"],
  },
  {
    id: "term-availability",
    term: "Availability",
    definition:
      "Making sure systems and data are accessible when authorised users need them.",
    curriculumPointIds: ["dsd-2.2", "dsd-8.1"],
    legacyTopicIds: ["security", "digital-environments"],
  },
  {
    id: "term-network-data-model",
    term: "Network data model",
    definition:
      "A data model that represents highly interconnected records and supports many-to-many relationships more naturally than a strict hierarchy.",
    curriculumPointIds: ["dsd-4.1", "dsd-4.3"],
    legacyTopicIds: ["data"],
  },
  {
    id: "term-phishing",
    term: "Phishing",
    definition:
      "A social-engineering attack that tricks users into revealing information, opening malicious content, or trusting a fake message or site.",
    curriculumPointIds: ["dsd-2.2", "dsd-8.1"],
    legacyTopicIds: ["security"],
  },
  {
    id: "term-defence-in-depth",
    term: "Defence in depth",
    definition:
      "A layered security approach that combines multiple controls so the system is still protected if one measure fails.",
    curriculumPointIds: ["dsd-2.2", "dsd-8.1"],
    legacyTopicIds: ["security"],
  },
];
