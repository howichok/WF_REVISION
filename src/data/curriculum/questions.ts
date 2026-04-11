import type { QuestionMetadata } from "./types";
import { CODEX_EXAM_STYLE_QUESTION_METADATA } from "./codex-exam-style-questions";
import { GENERATED_POINT_QUESTION_METADATA } from "./generated-point-questions";
import { TEACHING_PACK_QUESTION_METADATA } from "./teaching-pack-questions";

export const QUESTION_METADATA: QuestionMetadata[] = [
  {
    id: "paper2-2023-q2a-ui-end-users",
    sourceId: "paper2-2023",
    title: "Design the UI around end-user characteristics",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain two ways a user interface for doctors' surgeries should take the characteristics of the end users into account.",
    expectation:
      "The answer should link user characteristics such as age, pace, expertise, accuracy needs, or accessibility to concrete UI choices.",
    curriculumPointIds: ["dsd-4.3", "dsd-6.2"],
    legacyTopicIds: ["business", "intro-programming"],
    practicePrompt:
      "Explain two interface choices that would help busy medical staff prescribe medicine accurately.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-2023-q2b-cia-patient-records",
    sourceId: "paper2-2023",
    title: "Apply confidentiality and integrity to patient records",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Describe how confidentiality and integrity of patient records apply in a new digital system.",
    expectation:
      "A strong answer explains what must be protected, who should access it, and how accuracy and unauthorised change are controlled.",
    curriculumPointIds: ["dsd-1.4", "dsd-2.2", "dsd-6.1"],
    legacyTopicIds: ["security", "legislation"],
    practicePrompt:
      "Explain how confidentiality and integrity should shape a digital patient records system.",
    markSchemeConceptIds: [
      "ms-paper2-2023-q2b-healthcare-cia",
      "ms-general-linked-explanation",
    ],
    evaluationProfile: {
      depthExpectation: "developed",
      strongAnswerGuidance:
        "A strong answer explains what must be protected, who should access it, how unauthorised access is controlled, how record accuracy and change control are maintained, and why this matters in a healthcare setting.",
      slots: [
        {
          id: "confidentiality-core",
          label: "Confidentiality protects sensitive patient information",
          weight: 2,
          minimumGroups: 2,
          groups: [
            { anyOf: ["confidentiality", "confidential", "privacy"] },
            {
              anyOf: [
                "patient data",
                "patient record",
                "medical record",
                "sensitive personal information",
                "healthcare record",
              ],
            },
            {
              anyOf: [
                "unauthorised access",
                "unauthorised viewing",
                "only the right people",
                "only authorised staff",
                "restricted access",
                "people who need it",
              ],
            },
          ],
          missingFeedback:
            "State clearly that confidentiality means protecting sensitive patient data from unauthorised access.",
        },
        {
          id: "integrity-core",
          label: "Integrity keeps records accurate and prevents improper change",
          weight: 2,
          minimumGroups: 2,
          groups: [
            { anyOf: ["integrity", "accurate records", "data stays accurate"] },
            {
              anyOf: [
                "accurate",
                "correct",
                "complete",
                "reliable",
                "up to date",
              ],
            },
            {
              anyOf: [
                "not changed improperly",
                "not tampered with",
                "prevent improper change",
                "prevent unauthorised change",
                "changed incorrectly",
              ],
            },
          ],
          missingFeedback:
            "Explain that integrity means keeping records correct and preventing incorrect or unauthorised changes.",
        },
        {
          id: "access-control-measures",
          label: "Authorised access is controlled through design measures",
          weight: 2,
          minimumGroups: 2,
          groups: [
            {
              anyOf: [
                "role based access",
                "role-based access",
                "access control",
                "permissions",
                "user accounts",
                "login",
              ],
            },
            {
              anyOf: [
                "strong password",
                "password policy",
                "authentication",
                "encryption",
                "two factor",
                "2fa",
              ],
            },
            {
              anyOf: [
                "doctor",
                "nurse",
                "administrator",
                "authorised staff",
                "relevant staff",
                "staff who need it",
              ],
            },
          ],
          missingFeedback:
            "Add who should have access and at least one concrete control such as role-based access, authentication, or encryption.",
        },
        {
          id: "change-control-measures",
          label: "Validation and traceability help maintain integrity",
          weight: 2,
          minimumGroups: 1,
          groups: [
            {
              anyOf: [
                "validation",
                "validation check",
                "input validation",
                "controlled editing",
              ],
            },
            {
              anyOf: [
                "audit trail",
                "audit log",
                "track who changed what",
                "who changed what and when",
                "change history",
              ],
            },
            {
              anyOf: ["backup", "backups", "restore", "recovery copy"],
            },
          ],
          missingFeedback:
            "Explain how the system keeps records trustworthy, for example with validation, audit trails, or backups.",
        },
        {
          id: "healthcare-consequence",
          label: "Healthcare consequences are explained",
          weight: 1,
          minimumGroups: 1,
          groups: [
            {
              anyOf: [
                "unsafe treatment",
                "wrong dosage",
                "allergy",
                "diagnosis changed",
                "patient harm",
              ],
            },
            {
              anyOf: [
                "privacy breach",
                "break the law",
                "legal issue",
                "trust in the record",
                "patient trust",
                "safeguard privacy",
              ],
            },
          ],
          missingFeedback:
            "Link the controls to a healthcare outcome, such as privacy harm, unsafe treatment, or accountability.",
        },
      ],
    },
  },
  {
    id: "paper2-2023-q3-quality-service",
    sourceId: "paper2-2023",
    title: "Meet user needs and provide quality service",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 3,
    questionType: "short-open",
    summary:
      "Explain one way to ensure a digital system provides a quality service that meets user needs.",
    expectation:
      "Good answers connect one design or support decision directly to user satisfaction, reliability, usability, or outcome quality.",
    curriculumPointIds: ["dsd-1.4", "dsd-4.3", "dsd-6.2"],
    legacyTopicIds: ["business"],
    practicePrompt:
      "Explain one practical way a team can keep a digital service useful for its users.",
    markSchemeConceptIds: [
      "ms-paper2-2023-q3-service-quality",
      "ms-general-linked-explanation",
    ],
    evaluationProfile: {
      depthExpectation: "explained",
      strongAnswerGuidance:
        "A strong answer names one practical way the team gathers evidence from users or service behaviour, explains how that evidence reveals changing needs, and links it to prioritising useful updates.",
      slots: [
        {
          id: "practical-method",
          label: "A practical method for gathering user evidence is identified",
          weight: 1.5,
          minimumGroups: 1,
          groups: [
            {
              anyOf: [
                "user feedback",
                "feedback loop",
                "continuous feedback loop",
                "collect feedback",
                "usability testing",
                "user testing",
                "user research",
                "survey users",
                "interview users",
                "analyze usage data",
                "analyse usage data",
                "analytics",
                "monitor usage",
                "support tickets",
                "customer feedback",
              ],
            },
          ],
          missingFeedback:
            "Name one practical method the team can use, such as feedback, usability testing, support tickets, or usage analytics.",
        },
        {
          id: "understand-needs",
          label: "The evidence is used to understand user needs or pain points",
          weight: 1.2,
          minimumGroups: 1,
          groups: [
            {
              anyOf: [
                "user needs",
                "changing user needs",
                "what users need",
                "what users think",
                "what users say",
                "user feedback",
                "pain point",
                "problem users face",
                "where users struggle",
                "how people use the service",
                "user behavior",
                "user behaviour",
                "identify needs",
                "identify problems",
                "review what users want",
              ],
            },
          ],
          missingFeedback:
            "Explain how the team uses that evidence to see what users need, where they struggle, or what has changed.",
        },
        {
          id: "turn-findings-into-updates",
          label: "Findings are turned into updates or improvements",
          weight: 1.3,
          minimumGroups: 1,
          groups: [
            {
              anyOf: [
                "prioritize updates",
                "prioritise updates",
                "make improvements",
                "improve the service",
                "update the service",
                "refine the service",
                "iterate",
                "deliver useful updates",
                "fix issues",
                "change the service",
                "make changes",
              ],
            },
          ],
          missingFeedback:
            "Show that the team acts on what it learns by prioritising updates, fixes, or improvements.",
        },
        {
          id: "service-usefulness-outcome",
          label: "The answer links the action to keeping the service useful",
          weight: 1,
          minimumGroups: 1,
          groups: [
            {
              anyOf: [
                "stays useful",
                "stay useful",
                "remains useful",
                "useful for its users",
                "meet user needs",
                "meets user needs",
                "stays relevant",
                "deliver value",
                "quality service",
                "better user experience",
                "keep users satisfied",
                "stays usable",
              ],
            },
          ],
          missingFeedback:
            "Link the practical method back to the outcome: the service stays useful, relevant, usable, or aligned with user needs.",
        },
      ],
    },
  },
  {
    id: "paper2-2023-q4c-firewall",
    sourceId: "paper2-2023",
    title: "Describe how a firewall improves security",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 3,
    questionType: "short-open",
    summary:
      "Describe how a firewall is used to improve security in an organisation.",
    expectation:
      "The answer should explain traffic filtering or blocking and link that control to risk reduction.",
    curriculumPointIds: ["dsd-2.2", "dsd-6.1", "dsd-7.1"],
    legacyTopicIds: ["security", "digital-environments"],
    practicePrompt:
      "Describe how a firewall cuts the risk of unauthorised access or harmful traffic.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-2023-q5-change-drivers",
    sourceId: "paper2-2023",
    title: "Unforeseen factors that trigger change",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Describe two unforeseen factors that could trigger change in an organisation.",
    expectation:
      "Better answers identify a realistic change trigger and explain why it forces the organisation or system to adapt.",
    curriculumPointIds: ["dsd-8.1", "dsd-8.2"],
    legacyTopicIds: ["business"],
    practicePrompt:
      "Describe two unexpected events that could force a software product or organisation to change.",
    markSchemeConceptIds: ["ms-aut22-q6-business-risks", "ms-general-linked-explanation"],
  },
  {
    id: "paper2-2023-q7-data-access-permissions",
    sourceId: "paper2-2023",
    title: "Evaluate the impact of data access permissions",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 9,
    questionType: "extended-response",
    summary:
      "Evaluate the impact of data access permissions on an organisation.",
    expectation:
      "High-scoring answers balance the benefits of restricting and controlling access against operational costs, efficiency, and user needs.",
    curriculumPointIds: ["dsd-1.4", "dsd-2.2", "dsd-6.1", "dsd-8.1"],
    legacyTopicIds: ["security", "data", "business"],
    practicePrompt:
      "Evaluate how data access permissions can help an organisation and also cause problems.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-2023-q8a-virtual-environments",
    sourceId: "paper2-2023",
    title: "Benefits of virtual environments in development",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain two benefits of using virtual environments to develop a multiplatform game.",
    expectation:
      "The answer should focus on emulation, isolation, testing flexibility, or host security and link each point back to development work.",
    curriculumPointIds: ["dsd-4.3", "dsd-6.4"],
    legacyTopicIds: ["digital-environments", "security"],
    practicePrompt:
      "Explain two ways virtual environments help a team build software for different platforms.",
    markSchemeConceptIds: ["ms-aut22-q4-virtual-environment-benefits"],
  },
  {
    id: "paper2-2023-q8b-human-error",
    sourceId: "paper2-2023",
    title: "Human error and development time",
    sourceLabel: "Paper 2 2023",
    year: 2023,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain two ways human error could increase the development time of a software project.",
    expectation:
      "A strong answer connects the mistake to rework, communication failure, testing delay, or wasted effort.",
    curriculumPointIds: ["dsd-1.2", "dsd-5.1", "dsd-8.2"],
    legacyTopicIds: ["business", "intro-programming"],
    practicePrompt:
      "Explain two ways human mistakes can slow down software delivery.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "aut22-q2b-remote-working-risks",
    sourceId: "core-paper2-autumn-2022",
    title: "Remote working cyber threats",
    sourceLabel: "Autumn 2022 Paper 2",
    year: 2022,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Identify and explain security threats that become relevant when staff work remotely.",
    expectation:
      "Answers should pair a specific threat with a clear explanation of how it affects systems, users, or data.",
    curriculumPointIds: ["dsd-2.2", "dsd-7.1", "dsd-8.1"],
    legacyTopicIds: ["security"],
    practicePrompt:
      "Explain two cyber threats that become more serious when staff work remotely.",
    markSchemeConceptIds: ["ms-aut22-q2b-remote-working-threats", "ms-general-linked-explanation"],
  },
  {
    id: "aut22-q4-virtual-environments",
    sourceId: "core-paper2-autumn-2022",
    title: "Use virtual environments to test safely",
    sourceLabel: "Autumn 2022 Paper 2",
    year: 2022,
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain how virtual environments support effective and safe development or testing.",
    expectation:
      "Answers should reference isolation, emulation, or security and link them to the scenario.",
    curriculumPointIds: ["dsd-4.3", "dsd-6.4"],
    legacyTopicIds: ["digital-environments", "security"],
    practicePrompt:
      "Explain how a virtual environment makes development safer or more flexible.",
    markSchemeConceptIds: ["ms-aut22-q4-virtual-environment-benefits", "ms-general-linked-explanation"],
  },
  {
    id: "aut22-q6-business-risk",
    sourceId: "core-paper2-autumn-2022",
    title: "Assess risks to a digital business service",
    sourceLabel: "Autumn 2022 Paper 2",
    year: 2022,
    paper: "Paper 2",
    marks: 3,
    questionType: "short-open",
    summary:
      "Identify a realistic business risk and explain the impact on the organisation.",
    expectation:
      "The answer should name a risk and show the business consequence rather than stopping at a label.",
    curriculumPointIds: ["dsd-2.2", "dsd-8.1"],
    legacyTopicIds: ["business", "security"],
    practicePrompt:
      "Identify one major risk to a digital service and explain its likely business impact.",
    markSchemeConceptIds: ["ms-aut22-q6-business-risks", "ms-general-linked-explanation"],
  },
  {
    id: "aut22-q7-data-tools",
    sourceId: "core-paper2-autumn-2022",
    title: "Compare data warehouses, lakes, mining, and reporting",
    sourceLabel: "Autumn 2022 Paper 2",
    year: 2022,
    paper: "Paper 2",
    marks: 9,
    questionType: "extended-response",
    summary:
      "Evaluate different data storage and analysis approaches in terms of structure, storage, processing, and decision support.",
    expectation:
      "Higher marks come from comparing the tools directly and weighing trade-offs rather than listing definitions.",
    curriculumPointIds: ["dsd-1.5", "dsd-3.2", "dsd-6.3"],
    legacyTopicIds: ["data", "business"],
    practicePrompt:
      "Evaluate how a data warehouse, a data lake, data mining, and reporting differ.",
    markSchemeConceptIds: ["ms-aut22-q7-data-tools"],
  },
  {
    id: "paper1-practice-requirements-attendance-app",
    sourceId: "curated-paper1-practice",
    title: "Separate functional and non-functional requirements",
    sourceLabel: "Paper 1 practice",
    paper: "Paper 1",
    marks: 3,
    questionType: "short-open",
    summary:
      "State one functional requirement and one non-functional requirement for a school attendance app.",
    expectation:
      "Strong answers clearly separate what the system must do from how well, how safely, or how quickly it must do it.",
    curriculumPointIds: ["dsd-1.4"],
    legacyTopicIds: ["problem-solving", "business", "security"],
    practicePrompt:
      "State one functional requirement and one non-functional requirement for a school attendance app.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper1-practice-test-data-login-field",
    sourceId: "curated-paper1-practice",
    title: "Choose suitable test data for a login field",
    sourceLabel: "Paper 1 practice",
    paper: "Paper 1",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Describe suitable test data for a login field that accepts 8 to 20 characters.",
    expectation:
      "Good answers include valid, invalid, and extreme examples, then explain what result each test should produce.",
    curriculumPointIds: ["dsd-7.3"],
    legacyTopicIds: ["intro-programming", "problem-solving"],
    practicePrompt:
      "Describe suitable test data for a login field that accepts 8 to 20 characters.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-practice-accessible-mobile-booking",
    sourceId: "curated-paper2-practice",
    title: "Design an accessible mobile booking interface",
    sourceLabel: "Paper 2 practice",
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain two interface choices that would help users book appointments accurately on a mobile device.",
    expectation:
      "Strong answers link each design choice to a real user benefit such as readability, reduced mistakes, accessibility, or faster completion.",
    curriculumPointIds: ["dsd-4.3", "dsd-6.2"],
    legacyTopicIds: ["business", "intro-programming"],
    practicePrompt:
      "Explain two interface choices that would help users book appointments accurately on a mobile device.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-practice-cloud-deployment-remote-team",
    sourceId: "curated-paper2-practice",
    title: "Evaluate cloud deployment for a distributed team",
    sourceLabel: "Paper 2 practice",
    paper: "Paper 2",
    marks: 6,
    questionType: "extended-response",
    summary:
      "Evaluate whether cloud deployment is a good choice for a software team working from several locations.",
    expectation:
      "Higher-scoring answers balance benefits such as access, scaling, and collaboration against cost, control, dependency, and security concerns before reaching a judgement.",
    curriculumPointIds: ["dsd-1.5", "dsd-6.4", "dsd-8.1"],
    legacyTopicIds: ["digital-environments", "business", "security"],
    practicePrompt:
      "Evaluate whether cloud deployment is a good choice for a software team working from several locations.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-practice-change-control-release",
    sourceId: "curated-paper2-practice",
    title: "Use change control to protect a live release",
    sourceLabel: "Paper 2 practice",
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain how change control can reduce problems when a new feature is released to live users.",
    expectation:
      "The answer should show that controlled documentation, approval, testing, scheduling, and communication reduce disruption and release risk.",
    curriculumPointIds: ["dsd-7.3", "dsd-8.2"],
    legacyTopicIds: ["business", "security"],
    practicePrompt:
      "Explain how change control can reduce problems when a new feature is released to live users.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-practice-api-credentials-errors",
    sourceId: "curated-paper2-practice",
    title: "Protect API credentials and handle failures safely",
    sourceLabel: "Paper 2 practice",
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain why an app that uses an external API should protect its credentials and handle errors carefully.",
    expectation:
      "Good answers explain how exposed credentials create risk and why graceful error handling protects users, data, or service quality when requests fail.",
    curriculumPointIds: ["dsd-2.2", "dsd-6.1", "dsd-6.3"],
    legacyTopicIds: ["security", "data", "digital-environments"],
    practicePrompt:
      "Explain why an app that uses an external API should protect its credentials and handle errors carefully.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-practice-feedback-methods-service",
    sourceId: "curated-paper2-practice",
    title: "Compare interviews and analytics for service improvement",
    sourceLabel: "Paper 2 practice",
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Compare interviews and usage analytics when improving an online service.",
    expectation:
      "Stronger answers compare the type of evidence each method provides, their limits, and when one method is more useful than the other.",
    curriculumPointIds: ["dsd-3.2", "dsd-4.3"],
    legacyTopicIds: ["business", "data"],
    practicePrompt:
      "Compare interviews and usage analytics when improving an online service.",
    markSchemeConceptIds: ["ms-paper2-2023-q3-service-quality", "ms-general-linked-explanation"],
  },
  {
    id: "paper2-practice-remote-team-tooling",
    sourceId: "curated-paper2-practice",
    title: "Use shared tools in a remote software team",
    sourceLabel: "Paper 2 practice",
    paper: "Paper 2",
    marks: 4,
    questionType: "medium-open",
    summary:
      "Explain how version control and shared documentation help a remote software team deliver safely.",
    expectation:
      "The answer should explain how traceable code changes, shared knowledge, and clearer collaboration reduce mistakes, duplication, or delivery risk.",
    curriculumPointIds: ["dsd-5.1", "dsd-5.2", "dsd-8.2"],
    legacyTopicIds: ["business", "digital-environments"],
    practicePrompt:
      "Explain how version control and shared documentation help a remote software team deliver safely.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "paper2-practice-risk-review-feature-launch",
    sourceId: "curated-paper2-practice",
    title: "Judge whether a risky feature should be launched",
    sourceLabel: "Paper 2 practice",
    paper: "Paper 2",
    marks: 6,
    questionType: "extended-response",
    summary:
      "Evaluate whether a high-reward feature should be released when it also introduces significant security and operational risk.",
    expectation:
      "High-mark answers weigh business benefit against security, reliability, and reputational risk, then justify a clear decision with mitigation or contingency ideas.",
    curriculumPointIds: ["dsd-2.2", "dsd-8.1", "dsd-8.2"],
    legacyTopicIds: ["business", "security"],
    practicePrompt:
      "Evaluate whether a high-reward feature should be released when it also introduces major security and operational risk.",
    markSchemeConceptIds: ["ms-aut22-q6-business-risks", "ms-general-linked-explanation"],
  },
  {
    id: "qb-decomposition-abstraction",
    sourceId: "paper1-q-and-a",
    title: "Question bank: decomposition, pattern recognition, and abstraction",
    sourceLabel: "Paper 1 Q&A",
    paper: "Paper 1",
    questionType: "question-bank-section",
    summary:
      "Legacy practice bank section covering decomposition, pattern recognition, and abstraction from the older core structure.",
    expectation:
      "Useful for short-answer practice on computational thinking terms, examples, and applied problem solving.",
    curriculumPointIds: ["dsd-1.1", "dsd-4.1", "dsd-4.3"],
    legacyTopicIds: ["problem-solving"],
    practicePrompt:
      "Explain how decomposition, pattern recognition, and abstraction work together when solving a problem.",
    markSchemeConceptIds: [],
  },
  {
    id: "qb-validation-and-data-types",
    sourceId: "paper1-q-and-a",
    title: "Question bank: data validation and data types",
    sourceLabel: "Paper 1 Q&A",
    paper: "Paper 1",
    questionType: "question-bank-section",
    summary:
      "Legacy question-bank coverage for validation, data types, and related programming basics.",
    expectation:
      "Good for retrieval practice around correct typing, validation checks, and basic program logic.",
    curriculumPointIds: ["dsd-1.4", "dsd-6.1", "dsd-7.3"],
    legacyTopicIds: ["intro-programming", "data"],
    practicePrompt:
      "Explain why data validation and correct data typing matter in a software solution.",
    markSchemeConceptIds: [],
  },
  {
    id: "teach-pack-q-data-model-scenarios",
    sourceId: "teach-pack-data-models-worksheet",
    title: "Teaching pack: choose a data model for four scenarios",
    sourceLabel: "Data models worksheet",
    year: 2025,
    questionType: "medium-open",
    summary:
      "For an org chart, a social follow graph, a product catalogue with suppliers, and many-to-many tasks for employees, choose hierarchical, network, or relational and justify.",
    expectation:
      "Each scenario needs a model choice plus at least one reason (cardinality, flexibility, query complexity, or redundancy).",
    curriculumPointIds: ["dsd-4.1", "dsd-4.3"],
    legacyTopicIds: ["data"],
    practicePrompt:
      "Pick hierarchical, network, or relational for each scenario and justify with relationships and query needs.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "teach-pack-q-big-data-v",
    sourceId: "teach-pack-big-data-worksheet",
    title: "Teaching pack: map scenarios to a big-data V",
    sourceLabel: "Six Vs worksheet",
    year: 2025,
    questionType: "short-open",
    summary:
      "Identify which of Volume, Velocity, Variety, Veracity, Value, or Variability best fits short scenarios (e.g. CDR scale, live sentiment, faulty sensors).",
    expectation:
      "Correct V plus one sentence of reasoning; accept close synonyms if the logic matches.",
    curriculumPointIds: ["dsd-3.2", "dsd-4.3"],
    legacyTopicIds: ["data"],
    practicePrompt: "Name the primary V and explain your choice in one or two sentences.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  {
    id: "teach-pack-q-access-matrix",
    sourceId: "teach-pack-access-control-worksheet",
    title: "Teaching pack: justify access levels in a matrix",
    sourceLabel: "Access control worksheet",
    year: 2025,
    questionType: "medium-open",
    summary:
      "Assign Read, Write, Admin, or No access for roles (e.g. intern, analyst, IT admin) against assets (customer DB, payroll) and justify least-privilege choices.",
    expectation:
      "Answers should reference sensitivity, segregation of duties, and why admin is rarely default for all staff.",
    curriculumPointIds: ["dsd-2.2", "dsd-6.1", "dsd-6.3"],
    legacyTopicIds: ["data", "security"],
    practicePrompt:
      "Complete two cells in the matrix and explain why those access levels follow least privilege.",
    markSchemeConceptIds: ["ms-general-linked-explanation"],
  },
  ...CODEX_EXAM_STYLE_QUESTION_METADATA,
  ...TEACHING_PACK_QUESTION_METADATA,
  ...GENERATED_POINT_QUESTION_METADATA,
];
