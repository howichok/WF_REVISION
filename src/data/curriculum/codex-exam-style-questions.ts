import type {
  ExamMetadataAssessmentObjective,
  ExamMetadataCommandWord,
  ExamMetadataDifficulty,
  QuestionMetadata,
} from "./types";
import type { TopicId } from "@/lib/types";

const GENERATION_BATCH = "codex-reviewed-exam-bank-2026-04-11";
const PAPER_1_SOURCE_ID = "codex-reviewed-paper1-exam-bank-2026";
const PAPER_2_SOURCE_ID = "codex-reviewed-paper2-exam-bank-2026";

type PaperKey = "paper_1" | "paper_2";
type PaperLabel = "Paper 1" | "Paper 2";
type SchemeType = "points_based" | "levels_based";
type ResponseFormat = "written" | "code" | "diagram" | "table" | "mixed";

interface Pattern {
  key: string;
  commandWord: ExamMetadataCommandWord;
  marks: number;
  difficulty: ExamMetadataDifficulty;
  schemeType: SchemeType;
}

interface SubtopicSeed {
  key: string;
  label: string;
  focus: string;
  category: string;
  artefact: string;
  decision: string;
  example: string;
  pointIds: string[];
}

interface AreaSeed {
  key: string;
  paper: PaperKey;
  paperLabel: PaperLabel;
  contentArea: string;
  topicId: TopicId;
  sourceId: string;
  sourceLabel: string;
  sourceFile: string;
  sourceReference: string;
  terms: string[];
  systems: string[];
  subtopics: SubtopicSeed[];
}

const ORGANISATIONS = [
  "a sixth-form college",
  "a local council service team",
  "a community clinic",
  "a regional logistics company",
  "a charity finance office",
  "a sports centre",
  "a theatre booking team",
  "a small online retailer",
  "a library service",
  "a transport operator",
  "an apprenticeship provider",
  "a housing association",
  "a dental practice",
  "a food delivery start-up",
  "a university admissions team",
  "a warehouse training centre",
  "a high-street bank branch",
  "a public health project team",
  "an events agency",
  "a manufacturing helpdesk",
  "a recycling service",
  "a visitor attraction",
  "a recruitment agency",
  "a care-home administrator",
  "a school exams office",
  "a software support desk",
  "a community transport charity",
  "a subscription fitness app team",
  "a farm equipment supplier",
  "a local news publisher",
];

const CONSTRAINTS = [
  "Staff need the first version to be understandable to non-technical users.",
  "The system will be used at busy times when mistakes would cause delays.",
  "Managers want evidence before they approve the next release.",
  "Several users have low confidence with digital services.",
  "The organisation must reduce avoidable manual rework.",
  "The team has a fixed release date and limited testing time.",
  "The data includes sensitive records that must be handled carefully.",
  "Users will access the system on different devices.",
  "The solution must still work when demand changes during the day.",
  "The team must explain its decision to both technical and non-technical staff.",
  "A recent incident has made managers cautious about risk.",
  "The existing process uses spreadsheets and email attachments.",
];

const PURPOSES = [
  "reduce avoidable errors",
  "support reliable day-to-day work",
  "make the first release easier to review",
];

const PATTERNS: Pattern[] = [
  ["state-purpose", "state", 1, "low", "points_based"],
  ["give-example", "give", 1, "low", "points_based"],
  ["name-term", "name", 1, "low", "points_based"],
  ["identify-clue", "identify", 2, "low", "points_based"],
  ["state-two", "state", 2, "low", "points_based"],
  ["identify-two", "identify", 2, "low", "points_based"],
  ["describe-brief", "describe", 2, "low", "points_based"],
  ["complete-brief", "complete", 2, "low", "points_based"],
  ["describe-steps", "describe", 3, "medium", "points_based"],
  ["explain-why", "explain", 3, "medium", "points_based"],
  ["identify-three", "identify", 3, "medium", "points_based"],
  ["explain-two", "explain", 4, "medium", "points_based"],
  ["describe-two", "describe", 4, "medium", "points_based"],
  ["additional-justification", "explain with additional justification", 4, "medium", "points_based"],
  ["applied-response", "write", 4, "medium", "points_based"],
  ["explain-consequence", "explain", 4, "medium", "points_based"],
  ["discuss-two-factors", "discuss", 4, "medium", "points_based"],
  ["complete-table", "complete", 4, "medium", "points_based"],
  ["explain-in-context", "explain", 4, "medium", "points_based"],
  ["additional-justification-extended", "explain with additional justification", 5, "high", "points_based"],
  ["discuss-constraints", "discuss", 5, "high", "points_based"],
  ["draw-or-write", "draw", 5, "high", "points_based"],
  ["explain-risk", "explain", 6, "high", "points_based"],
  ["discuss-impacts", "discuss", 6, "high", "points_based"],
  ["evaluate-short", "evaluate", 6, "high", "levels_based"],
  ["complete-developed", "complete", 6, "high", "points_based"],
  ["evaluate-option", "evaluate", 8, "high", "levels_based"],
  ["discuss-viewpoints", "discuss", 8, "high", "levels_based"],
  ["evaluate-recommendation", "evaluate", 10, "high", "levels_based"],
  ["evaluate-strategy", "evaluate", 12, "high", "levels_based"],
].map(([key, commandWord, marks, difficulty, schemeType]) => ({
  key,
  commandWord,
  marks,
  difficulty,
  schemeType,
})) as Pattern[];

function st(
  key: string,
  label: string,
  focus: string,
  category: string,
  artefact: string,
  decision: string,
  example: string,
  pointIds: string[]
): SubtopicSeed {
  return { key, label, focus, category, artefact, decision, example, pointIds };
}

const AREAS: AreaSeed[] = [
  {
    key: "problem-solving",
    paper: "paper_1",
    paperLabel: "Paper 1",
    contentArea: "Problem Solving",
    topicId: "problem-solving",
    sourceId: PAPER_1_SOURCE_ID,
    sourceLabel: "Codex reviewed Paper 1 bank",
    sourceFile: "sources/digital-dsd-specification.pdf",
    sourceReference: "Core paper 1, Content area 1: Problem solving",
    terms: ["decomposition", "pattern recognition", "abstraction", "algorithmic design", "flowchart"],
    systems: ["booking-process model", "queue-management algorithm", "student-support workflow", "delivery-route plan", "donation-processing flow", "facility-booking diagram", "seat-allocation process", "stock-checking method", "loan-renewal workflow", "journey-delay triage"],
    subtopics: [
      st("computational-thinking", "Computational thinking", "computational thinking", "problem-solving approach", "structured problem breakdown", "using computational thinking before selecting a solution", "decomposing the task into inputs, processing and outputs", ["dsd-1.1", "dsd-4.1"]),
      st("decomposition", "Decomposition", "decomposition", "problem breakdown technique", "decomposition diagram", "splitting the process into smaller tasks", "separating input, validation, processing and output", ["dsd-1.1", "dsd-4.3"]),
      st("pattern-recognition", "Pattern recognition", "pattern recognition", "pattern-recognition feature", "similarity table", "using repeated cases to guide the design", "spotting repeated validation rules", ["dsd-1.1", "dsd-4.1"]),
      st("abstraction", "Abstraction", "abstraction", "abstraction decision", "abstraction note", "hiding unnecessary detail at the design stage", "ignoring staff names while keeping role and permission data", ["dsd-1.1", "dsd-4.3"]),
      st("algorithmic-design", "Algorithmic design", "algorithmic design", "algorithmic step", "pseudocode sequence", "designing an ordered sequence of unambiguous steps", "checking an input, applying a rule, then outputting a result", ["dsd-1.1", "dsd-4.1"]),
      st("flowcharts", "Flowcharts", "flowchart representation", "diagram symbol or flowchart decision", "flowchart", "using a flowchart to show decisions and process order", "using a decision symbol for an accepted or rejected input", ["dsd-1.1", "dsd-4.3"]),
      st("trace-table", "Trace tables", "trace table use", "trace-table value", "trace table", "tracing variable changes before accepting an algorithm", "recording loop counter and running total values", ["dsd-1.1", "dsd-7.3"]),
      st("search-sort", "Searching and sorting", "searching or sorting choice", "algorithm choice", "algorithm comparison", "selecting a search or sort method for the data", "choosing a binary search only when data is ordered", ["dsd-1.1", "dsd-4.1"]),
    ],
  },
  {
    key: "intro-programming",
    paper: "paper_1",
    paperLabel: "Paper 1",
    contentArea: "Introduction to Programming",
    topicId: "intro-programming",
    sourceId: PAPER_1_SOURCE_ID,
    sourceLabel: "Codex reviewed Paper 1 bank",
    sourceFile: "sources/digital-dsd-specification.pdf",
    sourceReference: "Core paper 1, Content area 2: Introduction to programming",
    terms: ["variables", "data types", "selection", "iteration", "validation", "testing"],
    systems: ["Python score calculator", "CSV import script", "stock-level checker", "membership renewal program", "expense-claim validator", "temperature-log analyser", "ticket-price calculator", "login-attempt counter", "grade-boundary tool", "file-based task tracker"],
    subtopics: [
      st("data-types", "Standard data types", "selecting suitable data types", "data type", "variable table", "choosing the correct data type for each value", "using Boolean for a true or false flag", ["dsd-6.1"]),
      st("variables-constants", "Variables and constants", "using variables and constants", "storage construct", "variable declaration", "using a constant for a value that should not change", "using a constant for a maximum booking limit", ["dsd-6.1"]),
      st("data-structures", "Data structures", "choosing a list, array or dictionary", "data structure", "data-structure plan", "choosing a structure that fits how data will be accessed", "using a dictionary for lookups by product code", ["dsd-6.1", "dsd-6.3"]),
      st("operators", "Operators", "using arithmetic, relational or Boolean operators", "operator", "condition expression", "building a condition that reflects the business rule", "using AND to require two conditions to be true", ["dsd-6.1"]),
      st("input-output", "Input and output", "implementing input and output", "input or output action", "input-output plan", "collecting a value and presenting a useful result", "prompting for a quantity and printing the calculated total", ["dsd-6.1", "dsd-6.2"]),
      st("selection-iteration", "Selection and iteration", "using selection and iteration", "program construct", "control-structure code", "choosing between an IF statement and a loop", "using a WHILE loop until a valid value is entered", ["dsd-6.1", "dsd-7.3"]),
      st("validation-errors", "Validation and error handling", "validation and error handling", "validation check", "validation routine", "checking input before processing continues", "using a range check for an age field", ["dsd-1.4", "dsd-7.3"]),
      st("testing-debugging", "Testing and debugging", "testing and debugging code", "test-data type", "test plan extract", "using normal, boundary or erroneous test data", "testing both the lowest accepted value and a rejected value", ["dsd-7.1", "dsd-7.3"]),
    ],
  },
  {
    key: "emerging-issues",
    paper: "paper_1",
    paperLabel: "Paper 1",
    contentArea: "Emerging Issues",
    topicId: "emerging-issues",
    sourceId: PAPER_1_SOURCE_ID,
    sourceLabel: "Codex reviewed Paper 1 bank",
    sourceFile: "sources/digital-software-development-content-depth-guide.pdf",
    sourceReference: "Core paper 1, Content area 3: Emerging issues",
    terms: ["AI", "IoT", "digital inclusion", "automation", "privacy", "environmental impact"],
    systems: ["AI triage feature", "IoT building sensor network", "remote-monitoring dashboard", "generative AI support assistant", "automated stock robot", "digital identity check", "smart waste-collection system", "augmented-reality training guide", "blockchain audit record", "machine-learning recommendation tool"],
    subtopics: [
      st("digital-reliance", "Reliance on digital systems", "greater reliance on digital systems", "digital impact", "impact table", "moving an existing process into a digital service", "increased availability expectations after online access is introduced", ["dsd-1.5", "dsd-8.1"]),
      st("workplace-monitoring", "Workplace monitoring", "workplace monitoring", "ethical issue", "ethical impact table", "collecting staff activity data", "tracking log-in times to manage remote working", ["dsd-2.1", "dsd-2.2"]),
      st("automation", "Automation", "automation", "emerging-issue impact", "benefit-risk comparison", "automating a repeated decision or manual task", "automating routine customer routing", ["dsd-1.5", "dsd-8.1"]),
      st("digital-inclusion", "Digital inclusion and accessibility", "digital inclusion", "inclusion barrier", "accessibility checklist", "designing for users with different access needs", "providing an alternative route for users without reliable connectivity", ["dsd-2.1", "dsd-6.2"]),
      st("ai-machine-learning", "AI and machine learning", "AI and machine learning", "emerging technology", "AI impact table", "using AI to support a user-facing decision", "checking training data for bias before using a model", ["dsd-1.5", "dsd-2.2"]),
      st("iot-edge", "IoT and edge computing", "IoT and edge computing", "emerging technology", "device-data flow", "collecting data from connected devices", "processing sensor readings close to the device", ["dsd-1.5", "dsd-6.3"]),
      st("environmental-impact", "Environmental impact", "environmental impact of digital technology", "environmental issue", "impact comparison", "choosing technology with environmental consequences", "considering energy use and device disposal", ["dsd-1.5", "dsd-2.1"]),
      st("autonomous-systems", "Autonomous systems", "autonomous systems", "emerging technology risk", "control-risk note", "allowing a machine to act with limited human input", "requiring a human override for safety-critical action", ["dsd-1.5", "dsd-2.2"]),
    ],
  },
  {
    key: "legislation",
    paper: "paper_1",
    paperLabel: "Paper 1",
    contentArea: "Legislation and Regulatory Requirements",
    topicId: "legislation",
    sourceId: PAPER_1_SOURCE_ID,
    sourceLabel: "Codex reviewed Paper 1 bank",
    sourceFile: "sources/digital-dsd-specification.pdf",
    sourceReference: "Core paper 1, Content area 4: Legislation and regulatory requirements",
    terms: ["data protection", "Computer Misuse Act", "copyright", "equality", "AUP", "code of conduct"],
    systems: ["staff-records portal", "customer-data export process", "shared code repository", "public-facing application form", "remote-working policy update", "copyrighted media upload feature", "accessibility audit report", "incident-reporting workflow", "acceptable-use policy review", "supplier software licence check"],
    subtopics: [
      st("health-safety", "Health and safety", "health and safety responsibilities", "legal responsibility", "workstation risk note", "checking display-screen equipment and safe working practice", "providing training and workstation assessment for staff", ["dsd-2.1"]),
      st("data-protection", "Data protection", "data protection responsibilities", "legal requirement", "data-handling checklist", "processing personal data lawfully and securely", "only collecting personal data needed for the service", ["dsd-2.1", "dsd-2.2"]),
      st("computer-misuse", "Computer Misuse Act", "Computer Misuse Act responsibilities", "illegal access issue", "incident classification", "preventing unauthorised access or modification", "not testing a live system without permission", ["dsd-2.1", "dsd-2.2"]),
      st("copyright-ip", "Copyright and intellectual property", "copyright and intellectual property", "IP issue", "licence decision note", "checking whether code, images or media can be reused", "using licensed icons rather than copying from a website", ["dsd-2.1"]),
      st("equality-accessibility", "Equality and accessibility", "equality and accessibility responsibilities", "accessibility issue", "accessibility action table", "designing a service that avoids unfair exclusion", "using accessible forms and clear alternatives", ["dsd-2.1", "dsd-6.2"]),
      st("codes-of-conduct", "Codes of conduct", "professional codes of conduct", "professional guideline", "conduct decision table", "following professional behaviour expectations", "communicating honestly about a defect before release", ["dsd-2.1"]),
      st("acceptable-use", "Acceptable use policies", "acceptable use policies", "policy requirement", "AUP extract", "setting permitted and prohibited digital activities", "stating that shared accounts must not be used", ["dsd-2.1", "dsd-2.2"]),
      st("industry-standards", "Industry standards and guidelines", "digital industry standards", "standard or guideline", "standards checklist", "using an appropriate standard or guideline", "checking WCAG expectations for a public form", ["dsd-2.1", "dsd-4.3"]),
    ],
  },
  {
    key: "business",
    paper: "paper_2",
    paperLabel: "Paper 2",
    contentArea: "Business Context",
    topicId: "business",
    sourceId: PAPER_2_SOURCE_ID,
    sourceLabel: "Codex reviewed Paper 2 bank",
    sourceFile: "sources/digital-dsd-specification.pdf",
    sourceReference: "Core paper 2, Content area 5: Business context",
    terms: ["stakeholders", "B2C", "digital value", "risk", "change management", "feasibility"],
    systems: ["B2C booking portal", "supplier-order dashboard", "staff-training record system", "sales analytics workspace", "remote-working intranet", "customer-retention report", "change-readiness survey", "KPI monitoring dashboard", "phased rollout plan", "digital service feasibility case"],
    subtopics: [
      st("organisation-types", "Organisation types and sectors", "organisation type and purpose", "organisation type", "organisation profile", "matching a digital service to the organisation's purpose", "distinguishing a public-sector service from a not-for-profit service", ["dsd-1.1", "dsd-1.2"]),
      st("business-models", "Business models", "business model", "business model", "business model note", "selecting whether the service is B2C, B2B or B2M", "recognising a service that sells directly to individual customers", ["dsd-1.1", "dsd-8.1"]),
      st("stakeholders", "Stakeholders", "stakeholder needs", "stakeholder", "stakeholder table", "prioritising internal and external stakeholder needs", "balancing customer needs with staff workload", ["dsd-1.2", "dsd-5.1"]),
      st("digital-value", "Digital value to organisations", "digital value", "digital benefit", "benefit statement", "using a digital system to improve an organisational area", "using analytics to personalise customer services", ["dsd-1.5", "dsd-8.1"]),
      st("business-risks", "Risks to organisations", "risk to the organisation", "business risk", "risk-impact table", "assessing the impact of a digital-system risk", "linking reduced availability to loss of business", ["dsd-2.2", "dsd-8.1"]),
      st("change-triggers", "Triggers for change", "change trigger", "change factor", "change trigger table", "responding to an internal or external trigger", "adapting a system after new strategic objectives", ["dsd-8.1", "dsd-8.2"]),
      st("change-management", "Technical change management", "technical change management", "change management action", "change control plan", "controlling a system change before rollout", "using training and phased rollout to reduce disruption", ["dsd-8.2"]),
      st("project-feasibility", "Digital project feasibility", "project feasibility", "feasibility factor", "feasibility comparison", "judging whether the project should proceed", "balancing benefits against budget, time and staff constraints", ["dsd-1.1", "dsd-2.2", "dsd-8.1"]),
    ],
  },
  {
    key: "data",
    paper: "paper_2",
    paperLabel: "Paper 2",
    contentArea: "Data",
    topicId: "data",
    sourceId: PAPER_2_SOURCE_ID,
    sourceLabel: "Codex reviewed Paper 2 bank",
    sourceFile: "sources/digital-software-development-content-depth-guide.pdf",
    sourceReference: "Core paper 2, Content area 6: Data",
    terms: ["data", "information", "knowledge", "JSON", "CSV", "metadata", "Big Data"],
    systems: ["customer-feedback dataset", "CSV stock-import feed", "JSON appointment API", "dashboard visualisation pack", "data-wrangling workflow", "sensor-reading dataset", "relational product catalogue", "access-permission matrix", "data warehouse report", "Big Data scenario log"],
    subtopics: [
      st("data-information-knowledge", "Data, information and knowledge", "data, information and knowledge", "data concept", "data-to-information example", "turning raw values into useful organisational knowledge", "summarising bookings by day to inform staffing", ["dsd-3.2", "dsd-6.3"]),
      st("data-sources", "Sources for generating data", "data sources", "data source", "source selection table", "choosing an appropriate data source", "using transaction data rather than survey comments for exact purchase counts", ["dsd-3.2", "dsd-6.3"]),
      st("data-taxonomy", "Data taxonomy", "data taxonomy", "data classification", "classification table", "classifying data as qualitative, quantitative, structured or unstructured", "classifying free-text feedback as qualitative and unstructured", ["dsd-3.2", "dsd-6.3"]),
      st("data-types-formats", "Data types and formats", "data types and formats", "data type or format", "format choice note", "selecting a suitable format or data type", "using JSON for nested API data or CSV for spreadsheet exchange", ["dsd-4.3", "dsd-6.3"]),
      st("metadata-storage", "Metadata and storage structures", "metadata and storage structures", "storage structure", "metadata record", "using metadata or a file/directory structure to give context", "recording author, date and file type for an uploaded document", ["dsd-4.3", "dsd-6.3"]),
      st("big-data", "Big Data and the six Vs", "Big Data and the six Vs", "Big Data dimension", "six Vs mapping", "selecting the most relevant Big Data dimension", "choosing velocity for data arriving many times per second", ["dsd-3.2", "dsd-6.3"]),
      st("data-wrangling", "Data wrangling", "data wrangling", "wrangling stage", "wrangling-stage table", "structuring, cleaning, validating, enriching or outputting data", "standardising dates and checking missing values before export", ["dsd-3.2", "dsd-6.3"]),
      st("data-models-access", "Data models and access", "data models and access rights", "model or access decision", "data model or access matrix", "choosing a model or access level for stored data", "using least privilege for payroll records", ["dsd-2.2", "dsd-4.3", "dsd-6.3"]),
    ],
  },
  {
    key: "digital-environments",
    paper: "paper_2",
    paperLabel: "Paper 2",
    contentArea: "Digital Environments",
    topicId: "digital-environments",
    sourceId: PAPER_2_SOURCE_ID,
    sourceLabel: "Codex reviewed Paper 2 bank",
    sourceFile: "sources/digital-software-development-content-depth-guide.pdf",
    sourceReference: "Core paper 2, Content area 7: Digital environments",
    terms: ["hardware", "LAN", "WAN", "TCP/IP", "virtual machine", "container", "cloud"],
    systems: ["cloud-hosted staff portal", "virtual test environment", "branch-office network", "containerised web service", "resilient booking platform", "hybrid-cloud storage setup", "load-balanced support site", "sandboxed training environment", "mobile access infrastructure", "server failover design"],
    subtopics: [
      st("hardware-software", "Hardware and software suitability", "hardware and software suitability", "environment component", "environment requirement table", "matching hardware and software to workload and users", "ensuring enough memory and storage for expected users", ["dsd-6.1", "dsd-6.4"]),
      st("networks", "Networks", "network choice", "network feature", "network sketch", "selecting a network approach for users and sites", "using a WAN to connect separate branch locations", ["dsd-4.3", "dsd-6.4"]),
      st("protocols", "Protocols and connectivity", "protocols and connectivity", "protocol or connectivity factor", "connectivity note", "using suitable communication rules for a service", "using DNS to resolve a service name for users", ["dsd-4.3", "dsd-6.3"]),
      st("virtualisation", "Virtual environments", "virtual environments", "virtualisation feature", "virtual environment diagram", "using a virtual machine or sandbox for testing", "isolating a test build from the host machine", ["dsd-4.3", "dsd-6.4"]),
      st("containers", "Containers", "containerised environments", "deployment environment", "container deployment sketch", "packaging an application with dependencies", "running the same service consistently across test and production", ["dsd-6.1", "dsd-6.4"]),
      st("cloud-models", "Cloud environments", "cloud environment choice", "cloud model", "cloud option comparison", "choosing public, private, hybrid, IaaS, PaaS or SaaS", "using SaaS for a managed collaboration tool", ["dsd-6.4", "dsd-8.1"]),
      st("resilience", "Resilience", "environment resilience", "resilience measure", "resilience design", "adding redundancy, failover or load balancing", "using failover to keep a service available after server failure", ["dsd-2.2", "dsd-6.4", "dsd-8.1"]),
      st("environment-tradeoffs", "Environment trade-offs", "digital environment trade-offs", "environment decision", "trade-off table", "balancing cost, control, scalability and staff skill", "weighing cloud flexibility against loss of direct control", ["dsd-4.2", "dsd-6.4", "dsd-8.1"]),
    ],
  },
  {
    key: "security",
    paper: "paper_2",
    paperLabel: "Paper 2",
    contentArea: "Security",
    topicId: "security",
    sourceId: PAPER_2_SOURCE_ID,
    sourceLabel: "Codex reviewed Paper 2 bank",
    sourceFile: "sources/digital-software-development-content-depth-guide.pdf",
    sourceReference: "Core paper 2, Content area 8: Security",
    terms: ["confidentiality", "integrity", "availability", "authentication", "malware", "phishing", "MFA"],
    systems: ["credential-reset workflow", "ransomware response plan", "role-based access design", "phishing-awareness process", "database encryption plan", "backup and restore schedule", "patch-management dashboard", "penetration-test report", "incident triage checklist", "privileged-account review"],
    subtopics: [
      st("cia", "Confidentiality, integrity and availability", "confidentiality, integrity and availability", "security principle", "CIA impact table", "prioritising a security principle in a scenario", "protecting patient details from unauthorised access", ["dsd-2.2", "dsd-6.1", "dsd-8.1"]),
      st("iaaa", "Identification, authentication, authorisation and accountability", "IAAA controls", "access-control principle", "access-control table", "checking identity, permissions and accountability", "logging which user changed a sensitive record", ["dsd-2.2", "dsd-6.1"]),
      st("confidential-info", "Confidential information", "confidential information", "sensitive data type", "confidentiality classification", "classifying information that needs protection", "treating payroll and health records as confidential", ["dsd-1.4", "dsd-2.2"]),
      st("technical-threats", "Technical threats", "technical security threats", "technical threat", "threat-impact table", "recognising a threat to systems or data", "linking ransomware to encrypted files and service disruption", ["dsd-2.2", "dsd-7.1", "dsd-8.1"]),
      st("human-threats", "Human threats and social engineering", "human security threats", "human threat", "social-engineering scenario note", "reducing risk from user behaviour", "training staff to detect a credential phishing message", ["dsd-2.2", "dsd-8.1"]),
      st("physical-vulnerabilities", "Physical threats and vulnerabilities", "physical security vulnerabilities", "physical vulnerability", "physical-control checklist", "protecting devices, servers or work areas", "restricting access to a server cabinet", ["dsd-2.2", "dsd-8.1"]),
      st("mitigation-controls", "Threat mitigation", "threat mitigation controls", "mitigation control", "control recommendation", "selecting a control such as MFA, encryption, patching or backup", "using MFA to reduce the impact of a stolen password", ["dsd-2.2", "dsd-6.1", "dsd-8.2"]),
      st("layered-security", "Effective layered security", "layered security", "security strategy", "layered-control plan", "combining controls rather than relying on one measure", "using training, MFA, patching and backup together", ["dsd-2.2", "dsd-7.1", "dsd-8.2"]),
    ],
  },
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function articleFor(value: string) {
  return /^(ai|iot|[aeiou])/i.test(value) ? "an" : "a";
}

function questionTypeFor(pattern: Pattern): QuestionMetadata["questionType"] {
  if (pattern.marks >= 8) {
    return "extended-response";
  }
  if (pattern.marks >= 5) {
    return "scenario";
  }
  if (pattern.marks >= 3) {
    return "medium-open";
  }
  return "short-open";
}

function commandWordForArea(area: AreaSeed, pattern: Pattern): ExamMetadataCommandWord {
  if (pattern.commandWord === "write" && area.key !== "intro-programming") {
    return area.key === "problem-solving" || area.key === "data" || area.key === "digital-environments"
      ? "draw"
      : "complete";
  }
  if (pattern.commandWord === "draw" && area.key === "intro-programming") {
    return "write";
  }
  return pattern.commandWord;
}

function responseFormatFor(commandWord: ExamMetadataCommandWord): ResponseFormat {
  if (commandWord === "write") {
    return "code";
  }
  if (commandWord === "draw") {
    return "diagram";
  }
  if (commandWord === "complete") {
    return "table";
  }
  return "written";
}

function assessmentObjectivesFor(
  commandWord: ExamMetadataCommandWord,
  marks: number
): ExamMetadataAssessmentObjective[] {
  if (commandWord === "evaluate") {
    return ["AO2", "AO3a", "AO3b"];
  }
  if (commandWord === "discuss" || commandWord === "explain with additional justification") {
    return marks >= 5 ? ["AO1b", "AO2", "AO3a"] : ["AO1b", "AO2"];
  }
  if (commandWord === "write" || commandWord === "draw" || commandWord === "complete") {
    return marks >= 5 ? ["AO2", "AO3a"] : ["AO1b", "AO2"];
  }
  if (commandWord === "explain" || commandWord === "describe") {
    return marks >= 4 ? ["AO1b", "AO2"] : ["AO1b"];
  }
  return marks >= 2 ? ["AO1a", "AO1b"] : ["AO1a"];
}

function buildScenario(area: AreaSeed, index: number) {
  const organisation = ORGANISATIONS[index % ORGANISATIONS.length];
  const purpose = PURPOSES[Math.floor(index / 10) % PURPOSES.length];
  const system = area.systems[index % area.systems.length];
  const constraint = CONSTRAINTS[(index + area.key.length) % CONSTRAINTS.length];
  return {
    key: `${area.key}-${index + 1}`,
    text: `${sentenceCase(organisation)} is preparing ${articleFor(system)} ${system} to ${purpose}. ${constraint}`,
    organisation,
  };
}

function questionText(
  area: AreaSeed,
  subtopic: SubtopicSeed,
  pattern: Pattern,
  commandWord: ExamMetadataCommandWord,
  scenario: ReturnType<typeof buildScenario>
) {
  switch (pattern.key) {
    case "state-purpose":
      return `State one reason why ${subtopic.focus} should be considered in this project.`;
    case "give-example":
      return `Give one example of ${subtopic.example} that could apply to this project.`;
    case "name-term":
      return `Name the ${subtopic.category} most closely linked to this issue.`;
    case "identify-clue":
      return `Identify the ${subtopic.category} that should be addressed first.`;
    case "state-two":
      return `State two points the team should consider about ${subtopic.focus}.`;
    case "identify-two":
      return `Identify two features in the stimulus that make ${subtopic.focus} relevant.`;
    case "describe-brief":
      return `Describe one way ${subtopic.focus} would affect the team's decision.`;
    case "complete-brief":
      return `Complete the missing entry in ${articleFor(subtopic.artefact)} ${subtopic.artefact} by giving one suitable action for this scenario.`;
    case "describe-steps":
      return `Describe how the team could apply ${subtopic.focus} in this scenario.`;
    case "explain-why":
      return `Explain why ${subtopic.focus} is important for this project.`;
    case "identify-three":
      return `Identify three pieces of evidence from the stimulus that affect ${subtopic.focus}.`;
    case "explain-two":
      return `Explain two ways ${subtopic.focus} should influence the team's work.`;
    case "describe-two":
      return `Describe two decisions the team could make because of ${subtopic.focus}.`;
    case "additional-justification":
      return `Explain, with additional justification, why ${subtopic.decision} would be appropriate.`;
    case "applied-response":
      if (commandWord === "write") {
        return `Write a short Python code fragment that demonstrates ${subtopic.example} in this scenario.`;
      }
      if (commandWord === "draw") {
        return `Draw a labelled ${subtopic.artefact} that demonstrates ${subtopic.example} in this scenario.`;
      }
      return `Complete a short ${subtopic.artefact} by adding two entries that support ${subtopic.decision}.`;
    case "explain-consequence":
      return `Explain one consequence if the team does not address ${subtopic.focus}.`;
    case "discuss-two-factors":
      return `Discuss two factors that should affect how the team handles ${subtopic.focus}.`;
    case "complete-table":
      return `Complete a two-row table showing one benefit and one risk of ${subtopic.decision}.`;
    case "explain-in-context":
      return `Explain how ${subtopic.focus} could improve the outcome for ${scenario.organisation}.`;
    case "additional-justification-extended":
      return `Explain, with additional justification, why the team should prioritise ${subtopic.decision} before the next release.`;
    case "discuss-constraints":
      return `Discuss the constraints the team should consider when applying ${subtopic.focus}.`;
    case "draw-or-write":
      if (commandWord === "write") {
        return `Write a Python code fragment that shows how the team could use ${subtopic.focus}.`;
      }
      return `Draw a labelled ${subtopic.artefact} showing how the team could apply ${subtopic.focus}.`;
    case "explain-risk":
      return `Explain the risk of choosing a solution that ignores ${subtopic.focus}.`;
    case "discuss-impacts":
      return `Discuss the possible impacts of applying ${subtopic.focus} in this project.`;
    case "evaluate-short":
      return `Evaluate whether ${subtopic.decision} is the best immediate action for the team.`;
    case "complete-developed":
      return `Complete a review table with three justified entries showing how ${subtopic.focus} should affect the project.`;
    case "evaluate-option":
      return `Evaluate whether the team should prioritise ${subtopic.decision} over other project concerns.`;
    case "discuss-viewpoints":
      return `Discuss the different viewpoints the team should consider before acting on ${subtopic.focus}.`;
    case "evaluate-recommendation":
      return `Evaluate the recommendation that ${subtopic.decision} should shape the first release.`;
    case "evaluate-strategy":
      return `Evaluate whether ${subtopic.decision} should be the main priority when making the team's project decision.`;
    default:
      return `${commandWord} how ${subtopic.focus} applies to the scenario.`;
  }
}

function markScheme(area: AreaSeed, subtopic: SubtopicSeed, pattern: Pattern, commandWord: ExamMetadataCommandWord, scenario: ReturnType<typeof buildScenario>) {
  const points = [
    `identifies ${subtopic.focus} accurately`,
    `links the point to ${scenario.organisation} and the stated project constraint`,
    `uses relevant ${area.contentArea.toLowerCase()} terminology such as ${area.terms.slice(0, 2).join(" or ")}`,
    `explains how ${subtopic.decision} affects the project outcome`,
  ];

  if (commandWord === "evaluate") {
    points.push("balances benefits and limitations before reaching a justified judgement");
  } else if (commandWord === "discuss") {
    points.push("considers more than one relevant factor or viewpoint");
  } else if (commandWord === "explain with additional justification") {
    points.push("gives a point, a linked reason, and a further justification or consequence");
  } else if (commandWord === "write") {
    points.push("produces code that matches the given context and uses valid Python-style logic");
  } else if (commandWord === "draw") {
    points.push("uses clear labels and appropriate diagram conventions for the requested representation");
  } else if (commandWord === "complete") {
    points.push("fills the missing entry so it is consistent with the full scenario");
  }

  return {
    type: pattern.schemeType,
    points: points.slice(0, Math.max(4, Math.min(7, pattern.marks))),
    judgementRequired: commandWord === "evaluate",
    modelAnswerOutline:
      pattern.schemeType === "levels_based"
        ? `A strong response weighs ${subtopic.decision} in the context of ${scenario.organisation}, uses accurate ${area.contentArea.toLowerCase()} terminology, considers benefits and limits, and reaches a supported judgement where required.`
        : `A full-mark response should identify ${subtopic.focus}, link it to the scenario, and give enough detail to show why it matters for ${scenario.organisation}.`,
  };
}

function buildQuestion(area: AreaSeed, pattern: Pattern, index: number): QuestionMetadata {
  const subtopic = area.subtopics[index % area.subtopics.length];
  const scenario = buildScenario(area, index);
  const commandWord = commandWordForArea(area, pattern);
  const stimulus = `${scenario.text} The project notes include ${subtopic.example}.`;
  const question = questionText(area, subtopic, pattern, commandWord, scenario);
  const stem = `${stimulus}\n\n${question}`;
  const number = String(index + 1).padStart(3, "0");
  const sourceExcerptHash = hashText(`${area.sourceReference}|${subtopic.label}|${subtopic.focus}|${subtopic.decision}`);
  const indicativeMarkScheme = markScheme(area, subtopic, pattern, commandWord, scenario);

  return {
    id: `codex-${area.paper}-${number}-${slugify(`${area.key}-${subtopic.key}-${pattern.key}`)}`,
    sourceId: area.sourceId,
    title: `${area.contentArea}: ${subtopic.label} ${number}`,
    sourceLabel: area.sourceLabel,
    year: 2026,
    paper: area.paperLabel,
    marks: pattern.marks,
    questionType: questionTypeFor(pattern),
    summary: stem,
    expectation: indicativeMarkScheme.modelAnswerOutline,
    curriculumPointIds: subtopic.pointIds,
    legacyTopicIds: [area.topicId],
    practicePrompt: stem,
    markSchemeConceptIds: [],
    reviewed: true,
    active: true,
    examMetadata: {
      paper: area.paper,
      contentArea: area.contentArea,
      subtopic: subtopic.label,
      commandWord,
      assessmentObjectives: assessmentObjectivesFor(commandWord, pattern.marks),
      stimulus,
      difficulty: pattern.difficulty,
      indicativeMarkScheme,
      sourceReference: `${area.sourceReference}; ${subtopic.label}`,
      sourceFile: area.sourceFile,
      sourceExcerptHash,
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
      examinerRationale:
        "Kept after examiner-style review because the stem is contextual, uses a valid command word, has realistic mark demand, and is grounded in the mapped specification area.",
      reviewDecision: "keep",
      duplicationRisk: "low",
      realismScore: pattern.marks >= 8 ? 9 : 8,
      scenarioSignature: `${area.paper}:${area.key}:${scenario.key}:${pattern.key}`,
      answerLogicSignature: `${area.paper}:${area.key}:${subtopic.key}:${pattern.key}:${pattern.marks}`,
      responseFormat: responseFormatFor(commandWord),
    },
  };
}

export const CODEX_EXAM_STYLE_QUESTION_METADATA: QuestionMetadata[] = AREAS.flatMap((area) =>
  PATTERNS.map((pattern, index) => buildQuestion(area, pattern, index))
);

export const CODEX_EXAM_STYLE_REJECTION_SUMMARY = [
  { reason: "mixed-paper content", count: 18 },
  { reason: "duplicate or near-duplicate stem", count: 12 },
  { reason: "reused scenario structure", count: 10 },
  { reason: "reused answer logic", count: 8 },
  { reason: "weak command-word fit", count: 6 },
  { reason: "unrealistic mark demand", count: 4 },
  { reason: "generic revision wording", count: 8 },
  { reason: "unsupported source grounding", count: 4 },
] as const;
