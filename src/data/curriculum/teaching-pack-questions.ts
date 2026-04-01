import type { QuestionMetadata } from "./types";

const DATA_TOPIC: QuestionMetadata["legacyTopicIds"] = ["data"];
const DATA_AND_SECURITY_TOPICS: QuestionMetadata["legacyTopicIds"] = ["data", "security"];
const PROBLEM_SOLVING_TOPIC: QuestionMetadata["legacyTopicIds"] = ["problem-solving"];
const EMERGING_TOPIC: QuestionMetadata["legacyTopicIds"] = ["emerging-issues"];
const LEGISLATION_TOPIC: QuestionMetadata["legacyTopicIds"] = ["legislation"];
const SECURITY_TOPIC: QuestionMetadata["legacyTopicIds"] = ["security"];

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function shorten(value: string, maxLength = 80) {
  const compact = compactText(value);

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildQuestion({
  id,
  sourceId,
  sourceLabel,
  title,
  summary,
  expectation,
  practicePrompt,
  curriculumPointIds,
  legacyTopicIds,
  questionType = "scenario",
  marks,
}: {
  id: string;
  sourceId: string;
  sourceLabel: string;
  title: string;
  summary: string;
  expectation: string;
  practicePrompt: string;
  curriculumPointIds: string[];
  legacyTopicIds: QuestionMetadata["legacyTopicIds"];
  questionType?: QuestionMetadata["questionType"];
  marks?: number;
}): QuestionMetadata {
  return {
    id,
    sourceId,
    title,
    sourceLabel,
    year: 2025,
    questionType,
    marks,
    summary,
    expectation,
    curriculumPointIds,
    legacyTopicIds,
    practicePrompt,
    markSchemeConceptIds: [],
  };
}

const DATA_FORMAT_ROWS = [
  { snippet: '{ "name": "Alice", "age": 30 }', format: "JSON", clues: "Curly braces, key-value pairs", use: "Web APIs" },
  { snippet: "<user><name>Alice</name><age>30</age></user>", format: "XML", clues: "Angle brackets, nested tags", use: "Data exchange in enterprise systems" },
  { snippet: '"Name","Age" "Alice",30', format: "CSV", clues: "Commas separate values, line-based", use: "Spreadsheet import/export" },
  { snippet: "Alice|30|Engineer", format: "Text (Pipe-delimited)", clues: "Pipes separate fields", use: "Log file export" },
  { snippet: "Alice 30 Engineer", format: "Plain Text", clues: "Newlines separate fields, no structure", use: "Basic notes or descriptions" },
  { snippet: '[{"name": "Bob", "active": true}]', format: "JSON", clues: "Array of objects with keys", use: "App user data" },
  { snippet: '<items><item id="1"/></items>', format: "XML", clues: "Self-closing tags", use: "Inventory systems" },
  { snippet: "Bob,35,True", format: "CSV", clues: "Comma-separated fields, plain text", use: "Quick data storage" },
  { snippet: '{"products": [{"id": 1, "price": 10.5}]}', format: "JSON", clues: "Nested structure with objects", use: "E-commerce APIs" },
  { snippet: "<product><id>1</id><price>10.5</price></product>", format: "XML", clues: "Deeply nested tags", use: "Product databases" },
  { snippet: "Name;Age;Country Alice;30;UK", format: "Text (Semicolon-delimited)", clues: "Semicolons as delimiters", use: "European spreadsheet standards" },
  { snippet: '{"values": [1, 2, 3]}', format: "JSON", clues: "Array inside object", use: "Data series in APIs" },
  { snippet: "<root><value>Test</value></root>", format: "XML", clues: "Tag hierarchy and opening/closing tags", use: "Config files" },
  { snippet: "ID,Value 001,Test", format: "CSV", clues: "Header row with simple structure", use: "Basic data entry" },
  { snippet: '{"temperature": 22.5}', format: "JSON", clues: "Single key-value", use: "IoT data feeds" },
  { snippet: '<data temp="22.5"/>', format: "XML", clues: "Attribute in tag", use: "Sensor data" },
  { snippet: "Temp: 22.5 degrees C", format: "Plain Text", clues: "Human-readable format", use: "Weather reports" },
  { snippet: "true", format: "Boolean (in JSON)", clues: 'Lowercase, plain "true"', use: "JSON configuration" },
  { snippet: "False", format: "Boolean (Python-style)", clues: "Capitalized False", use: "Scripting languages" },
  { snippet: "2023-06-01", format: "Date (ISO)", clues: "YYYY-MM-DD format", use: "Standard timestamping" },
  { snippet: "01/06/2023", format: "Date (UK format)", clues: "DD/MM/YYYY format", use: "Local user input" },
  { snippet: "Alice's phone", format: "UTF-8 Encoded Text", clues: "Unicode escape sequence", use: "Encoded user data" },
  { snippet: "Alice's phone", format: "UTF-8 Text", clues: "Smart quotes (non-ASCII)", use: "International characters" },
  { snippet: "Alices phone", format: "ASCII Corrupted", clues: "Mojibake, corrupted symbol", use: "Encoding mismatch" },
  { snippet: "name,score bob,85", format: "CSV", clues: "Comma-separated, numeric values", use: "Grading systems" },
];

const BIG_DATA_SCENARIOS = [
  { scenario: "A telecom company collects call data records from millions of users daily.", answer: "Volume" },
  { scenario: "Facebook stores hundreds of petabytes of images, videos, and messages.", answer: "Volume" },
  { scenario: "Sensors on a smart grid generate continuous readings across an entire city.", answer: "Volume" },
  { scenario: "Stock market data updates multiple times per second.", answer: "Velocity" },
  { scenario: "Social media posts stream live and are analyzed in real-time.", answer: "Velocity" },
  { scenario: "Clickstream data is captured instantly from user activity on websites.", answer: "Velocity" },
  { scenario: "A business collects video, audio, and text data from customer feedback.", answer: "Variety" },
  { scenario: "Different formats like XML, JSON, and CSV are integrated into one system.", answer: "Variety" },
  { scenario: "Weather data is collected from images, text, and satellite feeds.", answer: "Variety" },
  { scenario: "User-entered data may include spelling mistakes or missing fields.", answer: "Veracity" },
  { scenario: "Social media posts might be sarcastic or fake news.", answer: "Veracity" },
  { scenario: "Sensors sometimes send faulty readings due to malfunction.", answer: "Veracity" },
  { scenario: "Retail data is analyzed to identify profitable customer segments.", answer: "Value" },
  { scenario: "Healthcare records are used to find cost-effective treatments.", answer: "Value" },
  { scenario: "Logistics data helps reduce fuel costs through optimized routes.", answer: "Value" },
  { scenario: "Traffic patterns vary based on time of day, weather, or events.", answer: "Variability" },
  { scenario: "Customer sentiment changes daily on social media.", answer: "Variability" },
  { scenario: "Website traffic surges during holidays or promotions.", answer: "Variability" },
];

const DATA_MODEL_SCENARIOS = [
  {
    scenario: "A company's org chart with departments and sub-teams",
    expectation:
      "Strong answers usually select a hierarchical model and justify it using tree-like parent-child structure and nested levels.",
  },
  {
    scenario: "A social media platform where users can follow each other",
    expectation:
      "Strong answers usually select a network model because the relationships are highly connected rather than a single tree.",
  },
  {
    scenario: "An e-commerce site cataloguing products, categories, suppliers",
    expectation:
      "Strong answers usually select a relational model and justify it with structured entities, attributes, and joinable relationships.",
  },
  {
    scenario: "Representing a book's table of contents (chapters, sections, subsections)",
    expectation:
      "Strong answers usually select a hierarchical model because the content naturally nests into levels.",
  },
  {
    scenario: "Assigning multiple tasks to multiple employees",
    expectation:
      "Strong answers justify a model that handles many-to-many links clearly, often network or a strongly justified relational design.",
  },
];

const ACCESS_CONTROL_SCENARIOS = [
  { role: "Data Analyst", asset: "Customer Database" },
  { role: "HR Manager", asset: "Employee HR Files" },
  { role: "Intern", asset: "Sales Performance Dashboard" },
  { role: "IT Administrator", asset: "Payroll Records" },
  { role: "External Vendor", asset: "Audit Logs" },
  { role: "Finance Officer", asset: "Marketing Campaign Results" },
  { role: "Marketing Executive", asset: "Server Configuration Files" },
  { role: "Customer Support Agent", asset: "System Access Logs" },
  { role: "Project Manager", asset: "Product Feedback Data" },
  { role: "Sales Lead", asset: "Vendor Contracts" },
  { role: "CEO", asset: "Executive Summary Reports" },
  { role: "Junior Developer", asset: "CRM System" },
  { role: "Security Officer", asset: "Business Intelligence Platform" },
  { role: "Compliance Manager", asset: "Internal Messaging Logs" },
  { role: "BI Developer", asset: "Cloud Storage Buckets" },
];

const WRANGLING_TASKS = [
  { stage: "Structure", prompt: "split full names into first and last names" },
  { stage: "Structure", prompt: "ensure all columns are present and logically grouped" },
  { stage: "Clean", prompt: "fix capitalization" },
  { stage: "Clean", prompt: "correct malformed emails" },
  { stage: "Clean", prompt: "standardize date formats" },
  { stage: "Validate", prompt: "check that age is numeric and within a valid range, for example 18-100" },
  { stage: "Validate", prompt: "ensure email contains @ and a valid domain" },
  { stage: "Validate", prompt: "confirm salary is numeric" },
  { stage: "Enrich", prompt: "fill missing names or countries with 'Unknown'" },
  { stage: "Enrich", prompt: "infer or approximate missing values if justified" },
  { stage: "Output", prompt: "export cleaned data to CSV format" },
  { stage: "Output", prompt: "review the output for consistency and documentation" },
];

const PROBLEM_SOLVING_QUESTIONS = [
  {
    title: "Lesson plan: compare top-down, bottom-up, and modularisation",
    summary:
      "Problem-solving lesson-plan coverage asking students to solve a problem using top-down, bottom-up, and modularisation approaches.",
    expectation:
      "Strong answers compare how each approach breaks up or builds a solution and justify where each method helps.",
    practicePrompt:
      "Compare top-down, bottom-up, and modularisation as ways to solve a software problem.",
  },
  {
    title: "Lesson plan: identify the main features of a problem",
    summary:
      "Pattern-recognition lesson-plan coverage focused on identifying and describing the main features of a problem or process.",
    expectation:
      "Good answers isolate the important elements first instead of jumping straight to code or a finished solution.",
    practicePrompt:
      "Identify the main features of a problem or process before you start designing a solution.",
  },
  {
    title: "Lesson plan: identify trends and similarities",
    summary:
      "Pattern-recognition lesson-plan coverage asking students to identify and describe trends and similarities within and between problems.",
    expectation:
      "Strong answers spot repeatable features and explain how these patterns can guide a solution.",
    practicePrompt:
      "Identify trends and similarities within and between problems, then explain how those patterns help.",
  },
  {
    title: "Lesson plan: filter out unnecessary detail",
    summary:
      "Abstraction lesson-plan coverage focused on identifying needed information and filtering out unnecessary detail.",
    expectation:
      "Good answers explain what information matters to the solution and what can be safely ignored at this stage.",
    practicePrompt:
      "Explain how abstraction helps you keep the information that matters and ignore unnecessary detail.",
  },
  {
    title: "Lesson plan: define inputs, outputs, and processes",
    summary:
      "Abstraction lesson-plan coverage asking students to define inputs, outputs, and the core process of a solution.",
    expectation:
      "Strong answers separate the solution into what goes in, what happens, and what comes out.",
    practicePrompt:
      "Define the inputs, outputs, and core process for a simple digital solution.",
  },
  {
    title: "Lesson plan: explain what makes an algorithm valid",
    summary:
      "Algorithms lesson-plan coverage focused on sequences of unambiguous steps used to achieve a specified outcome.",
    expectation:
      "Good answers explain that an algorithm is a clear, ordered process and why ambiguity causes errors.",
    practicePrompt:
      "Explain why an algorithm must be a clear sequence of unambiguous steps.",
  },
];

const EMERGING_ISSUES_QUESTIONS = [
  {
    title: "Slides: compare the impact of digital change across groups",
    summary:
      "Emerging-issues slide coverage asking students to compare whether the same digital issue creates the same challenge for different groups.",
    expectation:
      "Strong answers compare the impact on individuals, society, and organisations instead of treating all groups as identical.",
    practicePrompt:
      "Compare how one digital issue affects different groups, such as individuals, society, and organisations.",
  },
  {
    title: "Slides: discuss workplace monitoring",
    summary:
      "Emerging-issues slide coverage asking students to discuss reactions to statements about workplace monitoring and related rights.",
    expectation:
      "Good answers balance benefits such as oversight or safety against privacy, trust, and fairness concerns.",
    practicePrompt:
      "Discuss the benefits and concerns linked to workplace monitoring in digital organisations.",
  },
  {
    title: "Slides: balance automation with human skills",
    summary:
      "Emerging-issues slide coverage asking students to suggest how organisations can balance automation with the need for human skills and knowledge.",
    expectation:
      "Strong answers weigh efficiency gains against deskilling, oversight, and the continuing need for human judgement.",
    practicePrompt:
      "Suggest how an organisation can balance automation with the need for human skills and knowledge.",
  },
  {
    title: "Slides: present a digital change case study",
    summary:
      "Emerging-issues slide coverage asking students to present a case study showing how a digital change affects individuals, society, or organisations.",
    expectation:
      "Good answers describe the change, explain its impact, and keep the response grounded in a realistic case study.",
    practicePrompt:
      "Choose one digital change and present a short case study explaining its impact.",
  },
];

const LEGISLATION_QUESTIONS = [
  {
    title: "Slides: explain the principles of the Computer Misuse Act",
    summary:
      "Legislation slide coverage asking students to discuss the different features and principles of the Computer Misuse Act.",
    expectation:
      "Strong answers explain unauthorised access or modification clearly and connect the law to workplace behaviour.",
    practicePrompt:
      "Explain the main principles of the Computer Misuse Act and how they affect staff behaviour.",
  },
  {
    title: "Slides: discuss consequences for misuse",
    summary:
      "Legislation slide coverage asking students to discuss what sentence or consequence would be appropriate within the boundaries of the law.",
    expectation:
      "Good answers stay within legal context and justify the consequence using seriousness, intent, or harm.",
    practicePrompt:
      "Discuss what consequences could be appropriate in a Computer Misuse Act case and justify your view.",
  },
  {
    title: "Slides: explain why industry standards are needed",
    summary:
      "Legislation and guidance slide coverage asking students to explain what industry standards are and why they are needed.",
    expectation:
      "Strong answers connect standards to quality, consistency, safety, professionalism, or trust.",
    practicePrompt:
      "Explain why industry standards are needed in digital work.",
  },
  {
    title: "Slides: create a code of conduct",
    summary:
      "Legislation and guidance slide coverage asking students to create a code of conduct that reflects best practice in a digital organisation.",
    expectation:
      "Good answers show professional, ethical, and user-focused behaviours that match the chosen organisation or service.",
    practicePrompt:
      "Create a short code of conduct for a digital organisation and explain the best-practice principles behind it.",
  },
];

const SECURITY_QUESTIONS = [
  {
    title: "Slides: identify confidential information",
    summary:
      "Security slide coverage asking students to identify examples of confidential information held by digital organisations.",
    expectation:
      "Strong answers name realistic categories of sensitive data and explain why those examples matter.",
    practicePrompt:
      "Identify examples of confidential information that a digital organisation might hold.",
  },
  {
    title: "Slides: explain the consequences of a breach",
    summary:
      "Security slide coverage asking students to research or explain the consequences of breaches involving confidential information.",
    expectation:
      "Good answers connect the breach to privacy harm, trust, legal exposure, or operational impact.",
    practicePrompt:
      "Explain what could happen if an organisation loses control of confidential information.",
  },
  {
    title: "Slides: identify threats and vulnerabilities in a scenario",
    summary:
      "Security slide coverage asking students to read a scenario and identify the threats and vulnerabilities affecting the organisation.",
    expectation:
      "Strong answers separate the threat itself from the weakness that makes the attack easier.",
    practicePrompt:
      "Read a security scenario and identify the threats and vulnerabilities involved.",
  },
  {
    title: "Slides: explain how mitigation techniques reduce risk",
    summary:
      "Security slide coverage asking students to discuss mitigation techniques and explain why they reduce risk.",
    expectation:
      "Good answers link the control to a specific risk reduction instead of naming a control without explanation.",
    practicePrompt:
      "Explain how one or more security mitigation techniques reduce risk in an organisation.",
  },
];

const DATA_FORMAT_QUESTION_METADATA = DATA_FORMAT_ROWS.map((row, index) =>
  buildQuestion({
    id: `teach-pack-format-snippet-${String(index + 1).padStart(2, "0")}`,
    sourceId: "teach-csv-data-formats-worksheet",
    sourceLabel: "Data formats worksheet",
    title: `Data formats prompt ${index + 1}`,
    summary: `Identify the format, clue, and use case for the snippet "${shorten(row.snippet, 70)}".`,
    expectation: `Strong answers identify ${row.format}, mention clues such as ${row.clues.toLowerCase()}, and suggest a real-world use such as ${row.use}.`,
    practicePrompt: `Identify the format for this snippet: ${row.snippet}. Describe the clues and suggest a real-world use.`,
    curriculumPointIds: ["dsd-4.3", "dsd-6.3"],
    legacyTopicIds: DATA_TOPIC,
    marks: 3,
  })
);

const BIG_DATA_QUESTION_METADATA = BIG_DATA_SCENARIOS.map((item, index) =>
  buildQuestion({
    id: `teach-pack-big-data-v-${String(index + 1).padStart(2, "0")}`,
    sourceId: "teach-pack-big-data-worksheet",
    sourceLabel: "Six Vs worksheet",
    title: `Big data V scenario ${index + 1}`,
    summary: item.scenario,
    expectation: `Strong answers identify ${item.answer} as the best-fit V and justify the choice using the scenario detail.`,
    practicePrompt: `Which of the 6 Vs best fits this scenario: ${item.scenario} Explain why.`,
    curriculumPointIds: ["dsd-3.2", "dsd-4.3"],
    legacyTopicIds: DATA_TOPIC,
    questionType: "short-open",
    marks: 2,
  })
);

const DATA_MODEL_QUESTION_METADATA = DATA_MODEL_SCENARIOS.map((item, index) =>
  buildQuestion({
    id: `teach-pack-data-model-scenario-${String(index + 1).padStart(2, "0")}`,
    sourceId: "teach-pack-data-models-worksheet",
    sourceLabel: "Data models worksheet",
    title: `Data model scenario ${index + 1}`,
    summary: item.scenario,
    expectation: item.expectation,
    practicePrompt: `Choose the most suitable data model for this scenario: ${item.scenario}. Justify your choice.`,
    curriculumPointIds: ["dsd-4.1", "dsd-4.3"],
    legacyTopicIds: DATA_TOPIC,
    marks: 3,
  })
);

const ACCESS_CONTROL_QUESTION_METADATA = ACCESS_CONTROL_SCENARIOS.map((item, index) =>
  buildQuestion({
    id: `teach-pack-access-control-${String(index + 1).padStart(2, "0")}`,
    sourceId: "teach-pack-access-control-worksheet",
    sourceLabel: "Access control worksheet",
    title: `Access-control scenario ${index + 1}`,
    summary: `Decide what access ${item.role} should have to ${item.asset}.`,
    expectation:
      "Strong answers assign Read, Write, Admin, or No Access using least privilege, data sensitivity, and what the role actually needs to do.",
    practicePrompt: `What access should ${item.role} have to ${item.asset}: Read, Write, Admin, or No Access? Justify your decision.`,
    curriculumPointIds: ["dsd-2.2", "dsd-6.1", "dsd-6.3"],
    legacyTopicIds: DATA_AND_SECURITY_TOPICS,
    marks: 3,
  })
);

const WRANGLING_QUESTION_METADATA = WRANGLING_TASKS.map((item, index) =>
  buildQuestion({
    id: `teach-pack-wrangling-stage-${String(index + 1).padStart(2, "0")}`,
    sourceId: "teach-pack-wrangling-stages-pdf",
    sourceLabel: "Data wrangling worksheet",
    title: `${item.stage} stage: ${item.prompt.charAt(0).toUpperCase()}${item.prompt.slice(1)}`,
    summary: `Data-wrangling prompt from the ${item.stage.toLowerCase()} stage: ${item.prompt}.`,
    expectation:
      "Good answers explain how this step improves structure, consistency, validity, completeness, or trust in the final dataset.",
    practicePrompt: `During the ${item.stage.toLowerCase()} stage of data wrangling, explain why you would ${item.prompt}.`,
    curriculumPointIds: ["dsd-3.2", "dsd-4.3", "dsd-6.3"],
    legacyTopicIds: DATA_TOPIC,
    questionType: "medium-open",
    marks: 4,
  })
);

const PROBLEM_SOLVING_QUESTION_METADATA = PROBLEM_SOLVING_QUESTIONS.map((item, index) =>
  buildQuestion({
    id: `teach-pack-problem-solving-${String(index + 1).padStart(2, "0")}`,
    sourceId: "teach-pack-problem-solving-lesson-plans",
    sourceLabel: "Problem solving lesson plans",
    title: item.title,
    summary: item.summary,
    expectation: item.expectation,
    practicePrompt: item.practicePrompt,
    curriculumPointIds: ["dsd-1.1", "dsd-4.1", "dsd-4.3", "dsd-7.3"],
    legacyTopicIds: PROBLEM_SOLVING_TOPIC,
    questionType: "question-bank-section",
  })
);

const EMERGING_QUESTION_METADATA = EMERGING_ISSUES_QUESTIONS.map((item, index) =>
  buildQuestion({
    id: `teach-pack-emerging-${String(index + 1).padStart(2, "0")}`,
    sourceId: "teach-pack-emerging-slides",
    sourceLabel: "Emerging issues slides",
    title: item.title,
    summary: item.summary,
    expectation: item.expectation,
    practicePrompt: item.practicePrompt,
    curriculumPointIds: ["dsd-1.5", "dsd-2.1", "dsd-2.2", "dsd-8.1"],
    legacyTopicIds: EMERGING_TOPIC,
    questionType: "question-bank-section",
  })
);

const LEGISLATION_QUESTION_METADATA = LEGISLATION_QUESTIONS.map((item, index) =>
  buildQuestion({
    id: `teach-pack-legislation-${String(index + 1).padStart(2, "0")}`,
    sourceId: "teach-pack-legislation-slides",
    sourceLabel: "Legislation slides",
    title: item.title,
    summary: item.summary,
    expectation: item.expectation,
    practicePrompt: item.practicePrompt,
    curriculumPointIds: ["dsd-2.1", "dsd-2.2"],
    legacyTopicIds: LEGISLATION_TOPIC,
    questionType: "question-bank-section",
  })
);

const SECURITY_QUESTION_METADATA = SECURITY_QUESTIONS.map((item, index) =>
  buildQuestion({
    id: `teach-pack-security-${String(index + 1).padStart(2, "0")}`,
    sourceId: "teach-pack-security-slides",
    sourceLabel: "Security slides",
    title: item.title,
    summary: item.summary,
    expectation: item.expectation,
    practicePrompt: item.practicePrompt,
    curriculumPointIds: ["dsd-1.4", "dsd-2.2", "dsd-6.1", "dsd-7.1", "dsd-8.1", "dsd-8.2"],
    legacyTopicIds: SECURITY_TOPIC,
    questionType: "question-bank-section",
  })
);

export const TEACHING_PACK_QUESTION_METADATA: QuestionMetadata[] = [
  ...PROBLEM_SOLVING_QUESTION_METADATA,
  ...EMERGING_QUESTION_METADATA,
  ...LEGISLATION_QUESTION_METADATA,
  ...SECURITY_QUESTION_METADATA,
  ...DATA_FORMAT_QUESTION_METADATA,
  ...BIG_DATA_QUESTION_METADATA,
  ...DATA_MODEL_QUESTION_METADATA,
  ...ACCESS_CONTROL_QUESTION_METADATA,
  ...WRANGLING_QUESTION_METADATA,
];
