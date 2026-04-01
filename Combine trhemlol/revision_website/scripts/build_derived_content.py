from __future__ import annotations

import csv
import json
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[1]
DERIVED_DIR = ROOT / "docs" / "derived"


QUALIFICATION = {
    "id": "tlevel-digital-software-development",
    "title": "T Level Technical Qualification in Digital Software Development (Level 3)",
    "awarding_body": "Pearson",
    "version": "1.0",
    "publication_date": "2025-05",
    "first_teaching": "2025-09",
    "qualification_number": "610/5801/4",
    "guided_learning_hours": 1260,
    "total_qualification_time": 1740,
    "source_pdf": "docs/source-pdfs/digital-dsd-specification.pdf",
    "source_priority_note": "Specification and exam papers in docs/source-pdfs are the active source of truth because AGENTS.md and PRODUCT_SPEC.md are empty.",
}


PAPER_1_TOPICS = [
    {
        "id": "problem-solving",
        "paper": "paper-1",
        "content_area": 1,
        "title": "Problem solving",
        "page_start": 10,
        "page_end": 12,
        "summary": "Computational thinking, algorithmic design, and structured approaches to solving programming and process problems.",
        "subtopics": [
            {
                "id": "computational-thinking",
                "title": "Computational thinking",
                "page": 10,
                "outcomes": [
                    "Define computational thinking and justify when it should be used.",
                    "Apply decomposition, pattern recognition, abstraction, and algorithmic design.",
                    "Represent decomposition with flowcharts, code, diagrams, and written descriptions.",
                ],
            },
            {
                "id": "algorithmic-design",
                "title": "Algorithmic design",
                "page": 11,
                "outcomes": [
                    "Interpret, debug, and translate algorithms across flowcharts, written descriptions, and code.",
                    "Use sequence, selection, and iteration correctly.",
                    "Design algorithms that produce correct outputs for given inputs.",
                ],
            },
            {
                "id": "problem-solving-strategies",
                "title": "Problem-solving strategies",
                "page": 12,
                "outcomes": [
                    "Compare top-down, bottom-up, and modular approaches.",
                    "Apply root-cause analysis techniques such as five whys, FMEA, and ETA.",
                    "Use a high-level strategy from problem definition through review.",
                ],
            },
        ],
    },
    {
        "id": "introduction-to-programming",
        "paper": "paper-1",
        "content_area": 2,
        "title": "Introduction to programming",
        "page_start": 13,
        "page_end": 19,
        "summary": "Python 3.10+ programming fundamentals, practical code development, debugging, validation, algorithms, and testing.",
        "subtopics": [
            {
                "id": "standard-data-types",
                "title": "Standard data types",
                "page": 13,
                "outcomes": [
                    "Use integers, floats, strings, and Booleans appropriately.",
                    "Choose the correct type for a variable or constant in context.",
                ],
            },
            {
                "id": "variables-constants-scope",
                "title": "Variables, constants, and scope",
                "page": 13,
                "outcomes": [
                    "Declare variables and constants using standard data types.",
                    "Apply local and global scope appropriately.",
                    "Use type conversion functions when moving between representations.",
                ],
            },
            {
                "id": "data-structures",
                "title": "Data structures",
                "page": 13,
                "outcomes": [
                    "Interpret and develop code using lists, arrays, and dictionaries.",
                    "Debug programs that use structured collections.",
                ],
            },
            {
                "id": "operators",
                "title": "Operators",
                "page": 14,
                "outcomes": [
                    "Use arithmetic, relational, and Boolean operators in Python.",
                    "Interpret and debug operator-heavy expressions.",
                ],
            },
            {
                "id": "input-output",
                "title": "Input and output",
                "page": 14,
                "outcomes": [
                    "Handle input via keyboard, screen, and text files.",
                    "Open, read, write, and close text files safely.",
                ],
            },
            {
                "id": "actions-sequence-selection-iteration",
                "title": "Actions: sequence, selection, and iteration",
                "page": 15,
                "outcomes": [
                    "Interpret, develop, and debug sequence, selection, and loops.",
                    "Use if, else if, else, match/case, for, and while appropriately.",
                ],
            },
            {
                "id": "functions-procedures",
                "title": "Functions and procedures",
                "page": 16,
                "outcomes": [
                    "Distinguish functions from procedures.",
                    "Use user-written, built-in, library, and third-party code.",
                    "Interpret, develop, and debug modular code.",
                ],
            },
            {
                "id": "validation",
                "title": "Validation",
                "page": 16,
                "outcomes": [
                    "Apply presence, length, range, type, format, and check digit validation.",
                    "Interpret, develop, and debug validation logic.",
                ],
            },
            {
                "id": "programming-practices",
                "title": "Programming practices and design decisions",
                "page": 17,
                "outcomes": [
                    "Choose data structures and action order for efficiency and maintainability.",
                    "Use meaningful names and readable code style conventions.",
                ],
            },
            {
                "id": "robust-code-debugging",
                "title": "Robust code and debugging",
                "page": 17,
                "outcomes": [
                    "Handle unexpected input and termination cleanly.",
                    "Locate and correct logic and runtime errors.",
                ],
            },
            {
                "id": "common-algorithms",
                "title": "Common algorithms",
                "page": 17,
                "outcomes": [
                    "Explain linear and binary search.",
                    "Explain bubble, insertion, and merge sort.",
                    "Judge algorithm suitability using execution time, memory use, and comparisons.",
                ],
            },
            {
                "id": "testing",
                "title": "Testing",
                "page": 18,
                "outcomes": [
                    "Select testing methods including unit, system, acceptance, usability, and performance testing.",
                    "Create valid, invalid, boundary, and erroneous test data.",
                    "Produce structured test plans with expected and actual results.",
                ],
            },
        ],
    },
    {
        "id": "emerging-issues",
        "paper": "paper-1",
        "content_area": 3,
        "title": "Emerging issues and the impact of digital",
        "page_start": 19,
        "page_end": 21,
        "summary": "How digital technologies change organisations, society, inclusion, working practices, and the use of AI and emerging platforms.",
        "subtopics": [
            {
                "id": "impact-of-digital-technologies",
                "title": "Impact of digital technologies",
                "page": 19,
                "outcomes": [
                    "Evaluate organisational, societal, and inclusion impacts of digital dependence.",
                    "Consider end-user characteristics, accessibility, and digital inclusion.",
                ],
            },
            {
                "id": "emerging-technologies",
                "title": "Emerging technologies",
                "page": 20,
                "outcomes": [
                    "Assess technologies such as IoT, AI, XR, blockchain, quantum computing, and autonomous systems.",
                    "Judge organisational, societal, and individual impacts in context.",
                ],
            },
        ],
    },
    {
        "id": "legislation-and-regulation",
        "paper": "paper-1",
        "content_area": 4,
        "title": "Legislation and regulatory requirements",
        "page_start": 21,
        "page_end": 23,
        "summary": "Health and safety, data protection, computer misuse, equality, intellectual property, and professional conduct.",
        "subtopics": [
            {
                "id": "legislation",
                "title": "Legislation",
                "page": 21,
                "outcomes": [
                    "Explain implications of health and safety, DPA/GDPR, CMA, equality, and intellectual property law.",
                    "Make judgements about legal impacts on organisations, society, and individuals.",
                ],
            },
            {
                "id": "guidelines-and-standards",
                "title": "Guidelines, standards, and policy",
                "page": 23,
                "outcomes": [
                    "Apply codes of conduct, acceptable use policies, whistleblowing, and industry standards.",
                    "Link professional behaviour to quality, confidentiality, accessibility, and compliance.",
                ],
            },
        ],
    },
]


PAPER_2_TOPICS = [
    {
        "id": "business-context",
        "paper": "paper-2",
        "content_area": 5,
        "title": "Business context",
        "page_start": 24,
        "page_end": 30,
        "summary": "Organisation types, digital value, business risk, technical change, and project feasibility.",
        "subtopics": [
            {
                "id": "business-environment",
                "title": "Business environment",
                "page": 24,
                "outcomes": [
                    "Identify organisation types, sectors, business models, and stakeholders.",
                ],
            },
            {
                "id": "digital-value",
                "title": "Digital value to organisations",
                "page": 25,
                "outcomes": [
                    "Explain how digital systems support operations, HR, finance, sales, and management.",
                    "Relate system design decisions to user needs and service quality.",
                ],
            },
            {
                "id": "organisational-risk",
                "title": "Risk to organisations",
                "page": 26,
                "outcomes": [
                    "Explain risks including security, privacy, legal non-compliance, bias, and technical failure.",
                    "Assess impact such as fines, reputational harm, and loss of business.",
                ],
            },
            {
                "id": "change-management",
                "title": "Technical change management",
                "page": 27,
                "outcomes": [
                    "Explain internal and external change triggers.",
                    "Use CAB, SMARTER objectives, implementation methods, rollback, and monitoring.",
                ],
            },
            {
                "id": "project-feasibility",
                "title": "Digital project feasibility",
                "page": 30,
                "outcomes": [
                    "Assess benefits, costs, constraints, and risks when judging feasibility.",
                ],
            },
        ],
    },
    {
        "id": "data",
        "paper": "paper-2",
        "content_area": 6,
        "title": "Data",
        "page_start": 30,
        "page_end": 36,
        "summary": "Data generation, transformation, quality, storage, models, analysis, and cross-platform access.",
        "subtopics": [
            {
                "id": "data-information-knowledge",
                "title": "Data, information, and knowledge",
                "page": 30,
                "outcomes": [
                    "Distinguish data from information and knowledge.",
                    "Explain how humans, sensors, AI, IoT, and transactions generate data.",
                ],
            },
            {
                "id": "data-transformation-and-taxonomy",
                "title": "Data transformation and taxonomy",
                "page": 31,
                "outcomes": [
                    "Explain manipulation, analysis, and processing.",
                    "Compare quantitative/qualitative and structured/unstructured data.",
                ],
            },
            {
                "id": "data-types-and-formats",
                "title": "Data types and formats",
                "page": 32,
                "outcomes": [
                    "Use data types and formats such as JSON, CSV, XML, UTF-8, and ASCII in context.",
                ],
            },
            {
                "id": "storage-quality-and-maintenance",
                "title": "Storage, quality, and maintenance",
                "page": 32,
                "outcomes": [
                    "Explain metadata, file and directory structures, Big Data dimensions, and quality assurance methods.",
                ],
            },
            {
                "id": "data-systems-and-entry",
                "title": "Data systems and data entry",
                "page": 33,
                "outcomes": [
                    "Explain data wrangling, core data system functions, and methods to reduce entry errors.",
                ],
            },
            {
                "id": "visualisation-models-and-access",
                "title": "Visualisation, models, and access",
                "page": 34,
                "outcomes": [
                    "Choose graphs, charts, tables, dashboards, and models appropriately.",
                    "Explain hierarchical, network, and relational models plus RBAC, RuBAC, and APIs.",
                ],
            },
            {
                "id": "analysis-tools",
                "title": "Data analysis tools",
                "page": 36,
                "outcomes": [
                    "Explain data warehouses, lakes, marts, mining, reporting, and business intelligence use.",
                ],
            },
        ],
    },
    {
        "id": "digital-environments",
        "paper": "paper-2",
        "content_area": 7,
        "title": "Digital environments",
        "page_start": 36,
        "page_end": 42,
        "summary": "Hardware, software, networking, virtualisation, cloud, and resilience in technical environments.",
        "subtopics": [
            {
                "id": "hardware",
                "title": "Hardware",
                "page": 36,
                "outcomes": [
                    "Explain devices, processors, memory, storage, motherboards, GPUs, NICs, cooling, and sensors.",
                ],
            },
            {
                "id": "software-and-tools",
                "title": "Software and development tools",
                "page": 37,
                "outcomes": [
                    "Explain OS types, utilities, IDEs, compilers, interpreters, and common application software.",
                ],
            },
            {
                "id": "networks",
                "title": "Networks",
                "page": 38,
                "outcomes": [
                    "Explain network types, media, topologies, models, components, packets, protocols, and OSI/TCP-IP.",
                ],
            },
            {
                "id": "virtual-environments",
                "title": "Virtual environments",
                "page": 40,
                "outcomes": [
                    "Explain virtual machines, hypervisors, benefits, drawbacks, and use cases.",
                ],
            },
            {
                "id": "cloud-environments",
                "title": "Cloud environments",
                "page": 41,
                "outcomes": [
                    "Compare public and private cloud plus IaaS, PaaS, and SaaS.",
                ],
            },
            {
                "id": "resilience",
                "title": "Resilient digital environments",
                "page": 42,
                "outcomes": [
                    "Explain updates, redundancy, backup strategies, hardening, and hot/cold/warm sites.",
                ],
            },
        ],
    },
    {
        "id": "security",
        "paper": "paper-2",
        "content_area": 8,
        "title": "Security",
        "page_start": 42,
        "page_end": 48,
        "summary": "Confidentiality, threats, vulnerabilities, mitigation techniques, and security models.",
        "subtopics": [
            {
                "id": "confidentiality-and-impact",
                "title": "Confidential information and impact",
                "page": 42,
                "outcomes": [
                    "Identify confidential information and explain organisational impact when confidentiality fails.",
                ],
            },
            {
                "id": "threats-and-vulnerabilities",
                "title": "Threats and vulnerabilities",
                "page": 44,
                "outcomes": [
                    "Explain technical, human, and physical threats and vulnerabilities.",
                ],
            },
            {
                "id": "threat-mitigation",
                "title": "Threat mitigation",
                "page": 46,
                "outcomes": [
                    "Explain anti-malware, encryption, access control, training, backups, VPNs, MFA, and testing.",
                ],
            },
            {
                "id": "cia-and-iaaa",
                "title": "CIA and IAAA security models",
                "page": 47,
                "outcomes": [
                    "Explain how confidentiality, integrity, and availability interrelate.",
                    "Explain identification, authentication, authorisation, and accountability.",
                ],
            },
        ],
    },
]


ESP_FRAMEWORK = {
    "id": "employer-set-project",
    "title": "Employer Set Project",
    "duration_minutes": 870,
    "marks": 100,
    "weighting_core_percent": 40,
    "weighting_qualification_percent": 20,
    "page_start": 49,
    "page_end": 58,
    "tasks": [
        {
            "id": "esp-task-1",
            "title": "Planning a project",
            "focus": "Project planning tools, Gantt chart, resource and cost plan, rationale.",
            "evidence": [
                "Task sequencing and milestone planning",
                "Resource allocation and cost calculation",
                "Decision rationale with risks, benefits, time, and cost impact",
            ],
        },
        {
            "id": "esp-task-2",
            "title": "Identifying and fixing defects in existing code",
            "focus": "Testing, defect diagnosis, remediation, and evidence capture.",
            "evidence": [
                "Test selection and test data",
                "Expected versus actual results",
                "Corrective actions and refinement",
            ],
        },
        {
            "id": "esp-task-3",
            "title": "Designing a solution",
            "focus": "Decomposition, algorithms, conventions, and communication of design intent.",
            "evidence": [
                "Breakdown of the problem into computational parts",
                "Appropriate notation including flowcharts or code",
                "Audience-aware design communication",
            ],
        },
        {
            "id": "esp-task-4a",
            "title": "Developing a solution",
            "focus": "Code organisation, technical skill, user experience, and implementation quality.",
            "evidence": [
                "Readable, modular, convention-led code",
                "Appropriate handling of data, security, and exceptions",
                "Evidence that the solution meets the brief",
            ],
        },
        {
            "id": "esp-task-4b",
            "title": "Reflective evaluation",
            "focus": "Review how well the product meets requirements and user needs.",
            "evidence": [
                "Success criteria review",
                "Testing-informed evaluation",
                "Improvements if the problem were revisited",
            ],
        },
    ],
    "assessment_objectives": [
        {"id": "AO1", "title": "Planning", "proportion_percent": 12},
        {"id": "AO2", "title": "Application", "proportion_percent": 41},
        {"id": "AO3", "title": "Selecting relevant techniques and resources", "proportion_percent": 9},
        {"id": "AO4", "title": "English, maths, and digital communication skills", "proportion_percent": 3},
        {"id": "AO5a", "title": "Project outcome", "proportion_percent": 26},
        {"id": "AO5b", "title": "Review", "proportion_percent": 9},
    ],
}


OS_FRAMEWORK = {
    "id": "occupational-specialism-digital-software-development",
    "title": "Occupational Specialism: Digital Software Development",
    "duration_minutes": 3030,
    "marks": 144,
    "weighting_qualification_percent": 50,
    "page_start": 59,
    "page_end": 81,
    "performance_outcomes": [
        "PO1 Analyse a problem to define requirements and acceptance criteria, aligned to user needs.",
        "PO2 Design, implement and test software.",
        "PO3 Change, maintain and support software.",
        "PO4 Create solutions in a social and collaborative environment.",
        "PO5 Discover, evaluate and apply reliable sources of knowledge.",
        "PO6 Apply ethical principles and manage risks in line with legal and regulatory requirements when developing software.",
    ],
    "content_areas": [
        {
            "id": "os-requirements-and-acceptance-criteria",
            "title": "Analyse a problem to define requirements and acceptance criteria aligned to user needs",
            "page_start": 59,
            "page_end": 64,
            "focus": [
                "Software development lifecycle",
                "Roles and responsibilities",
                "Project methodologies",
                "Functional and non-functional requirements",
                "KPIs, constraints, and acceptance criteria",
                "Emerging technologies and training needs",
            ],
        },
        {
            "id": "os-ethics-risk-legal",
            "title": "Apply ethical principles and manage risks in line with legal and regulatory requirements",
            "page_start": 65,
            "page_end": 66,
            "focus": [
                "Legal and regulatory requirements",
                "Standards and ethical implications",
                "Risk identification, mitigation, contingency, and monitoring",
            ],
        },
        {
            "id": "os-research-and-evidence",
            "title": "Discover, evaluate and apply reliable sources of knowledge",
            "page_start": 67,
            "page_end": 67,
            "focus": [
                "Reliability of websites, blogs, papers, forums, and repositories",
                "Triangulation, bias, recency, and credibility",
                "Qualitative and quantitative evidence gathering",
            ],
        },
        {
            "id": "os-design",
            "title": "Design",
            "page_start": 68,
            "page_end": 71,
            "focus": [
                "Function-oriented, object-oriented, data model, TDD, BDD, and functional design",
                "Source/content management platforms and workflows",
                "UX/UI design principles, CMS features, databases, and network integration points",
            ],
        },
        {
            "id": "os-collaboration",
            "title": "Create solutions in a social and collaborative environment",
            "page_start": 72,
            "page_end": 72,
            "focus": [
                "Collaborative techniques, code review, paired programming, version control, IDEs, and teamwork",
            ],
        },
        {
            "id": "os-implementation",
            "title": "Implement a solution using at least two appropriate languages",
            "page_start": 73,
            "page_end": 76,
            "focus": [
                "Front-end and back-end languages",
                "APIs, packages, modules, libraries, and CI/CD",
                "Data sources, responsive UI, deployment methods, and 12-factor principles",
            ],
        },
        {
            "id": "os-testing",
            "title": "Testing a software solution",
            "page_start": 77,
            "page_end": 78,
            "focus": [
                "Functional, non-functional, front-end, security, manual, and automated testing",
                "Test data, expected results, retests, and regression testing",
            ],
        },
        {
            "id": "os-maintain-and-support",
            "title": "Change, maintain and support software",
            "page_start": 79,
            "page_end": 80,
            "focus": [
                "Maintenance drivers, change management, coding principles, and user support",
            ],
        },
    ],
}


TOPIC_SKILL_MAP = {
    "problem-solving": {
        "skills": [
            "decompose a problem into smaller computational parts",
            "trace and debug algorithms",
            "translate between flowchart, prose, and code",
            "justify a suitable problem-solving strategy",
        ],
        "practice_modes": ["quick-practice", "topic-practice", "debug-lab"],
        "question_shapes": ["algorithm trace", "flowchart critique", "short explanation", "strategy judgement"],
    },
    "introduction-to-programming": {
        "skills": [
            "write and debug Python 3.10+ code",
            "choose data types, structures, and control flow",
            "create validation and test data",
            "compare search and sort algorithms",
        ],
        "practice_modes": ["quick-practice", "topic-practice", "timed-practice", "debug-lab"],
        "question_shapes": ["code completion", "predict output", "fix the bug", "test design"],
    },
    "emerging-issues": {
        "skills": [
            "evaluate impact on organisations, society, and users",
            "assess inclusion, bias, accessibility, and future technologies",
        ],
        "practice_modes": ["quick-practice", "paper-practice"],
        "question_shapes": ["evaluate", "discuss", "scenario response"],
    },
    "legislation-and-regulation": {
        "skills": [
            "apply legislation and professional standards to scenarios",
            "distinguish legal duty from best practice",
        ],
        "practice_modes": ["quick-practice", "paper-practice"],
        "question_shapes": ["explain", "judge impact", "compare duties"],
    },
    "business-context": {
        "skills": [
            "connect system design to business value and user need",
            "assess organisational risk and project feasibility",
            "reason about change management decisions",
        ],
        "practice_modes": ["topic-practice", "timed-practice", "paper-practice"],
        "question_shapes": ["explain", "evaluate", "discuss feasibility"],
    },
    "data": {
        "skills": [
            "classify data and formats",
            "select visualisation and storage approaches",
            "explain access control and analysis tooling",
        ],
        "practice_modes": ["topic-practice", "timed-practice", "paper-practice"],
        "question_shapes": ["state", "describe", "evaluate"],
    },
    "digital-environments": {
        "skills": [
            "reason about hardware, networking, virtualisation, cloud, and resilience",
            "link technical components to performance and reliability outcomes",
        ],
        "practice_modes": ["topic-practice", "timed-practice", "paper-practice"],
        "question_shapes": ["describe", "explain", "compare"],
    },
    "security": {
        "skills": [
            "identify threats and vulnerabilities",
            "select mitigations and justify them",
            "apply CIA and IAAA to scenario questions",
        ],
        "practice_modes": ["topic-practice", "timed-practice", "paper-practice"],
        "question_shapes": ["identify", "explain", "evaluate"],
    },
    "employer-set-project": {
        "skills": [
            "plan a response to a vocational brief",
            "collect evidence of testing, design, development, and reflection",
            "justify decisions with cost, risk, and user need in view",
        ],
        "practice_modes": ["project-prep", "portfolio-drill"],
        "question_shapes": ["portfolio task", "rationale", "annotated evidence"],
    },
    "occupational-specialism-digital-software-development": {
        "skills": [
            "define requirements and acceptance criteria",
            "design, implement, test, maintain, and support software",
            "work across research, risk, collaboration, and deployment",
        ],
        "practice_modes": ["scenario-prep", "portfolio-drill", "design-clinic"],
        "question_shapes": ["scenario plan", "design choice", "implementation critique"],
    },
}


MARK_SCHEME_RULES = [
    {
        "id": "points-identify",
        "title": "Points-based identification",
        "shape": "short response",
        "description": "Award one mark per valid item or completed table entry. Used for command words such as state, name, give, or complete.",
        "feedback_checks": [
            "Did the answer supply the requested number of distinct items?",
            "Were the items specific enough to match the syllabus language?",
        ],
    },
    {
        "id": "points-linked-explanation",
        "title": "Linked explanation",
        "shape": "short to medium response",
        "description": "Marks are split between identifying a valid point and expanding it with a linked reason, consequence, or contextual explanation.",
        "feedback_checks": [
            "Is there a valid point?",
            "Is it connected to why, how, or what impact it has?",
            "Does the explanation stay in the scenario rather than drifting generic?",
        ],
    },
    {
        "id": "levels-evaluate",
        "title": "Levels-based evaluation",
        "shape": "extended response",
        "description": "Use a best-fit approach. Strong answers balance breadth of relevant points, depth of explanation, and a justified judgement or conclusion.",
        "feedback_checks": [
            "Has the response covered both benefits and drawbacks or multiple sides?",
            "Are claims supported with scenario-relevant consequences?",
            "Is there a clear overall judgement?",
        ],
    },
    {
        "id": "code-trace",
        "title": "Code trace and debugging",
        "shape": "practical short response",
        "description": "Reward correct identification of output, defect, or missing construct, plus a fix that preserves intended logic.",
        "feedback_checks": [
            "Was the code traced accurately in order?",
            "Was the real defect identified rather than a surface symptom?",
            "Would the proposed fix actually work?",
        ],
    },
    {
        "id": "test-design",
        "title": "Testing evidence",
        "shape": "planning/practical response",
        "description": "Reward correct choice of test type, suitable test data, and expected results aligned to the stated requirement.",
        "feedback_checks": [
            "Is the chosen test type appropriate?",
            "Does the test data include normal and edge cases when needed?",
            "Are expected results measurable and specific?",
        ],
    },
    {
        "id": "esp-rationale",
        "title": "ESP rationale and reflection",
        "shape": "portfolio evidence",
        "description": "Strong answers justify decisions, show evidence of planning or review, and link back to user needs, constraints, and brief requirements.",
        "feedback_checks": [
            "Did the student explain why they chose the approach?",
            "Did they reference user needs, risk, time, cost, or quality?",
            "Did they evaluate outcomes honestly and propose sensible improvements?",
        ],
    },
]


COMMAND_WORDS = [
    {
        "word": "state",
        "meaning": "Provide a concise factual answer with no developed explanation unless explicitly asked.",
        "response_pattern": "short factual point",
        "observed_in": ["Paper 2 Autumn 2021 Q1(a)", "Paper 2 Autumn 2021 Q1(c)"],
    },
    {
        "word": "name",
        "meaning": "Identify the correct term or item only.",
        "response_pattern": "label or term",
        "observed_in": ["Paper 2 Autumn 2022 Q1(b)", "Paper 2 Autumn 2022 Q2(a)"],
    },
    {
        "word": "give",
        "meaning": "Supply one or more correct examples or items.",
        "response_pattern": "brief itemised answer",
        "observed_in": ["Paper 2 2023 Q1(b)"],
    },
    {
        "word": "complete",
        "meaning": "Fill the missing information accurately, often in a table or diagram.",
        "response_pattern": "precise completion",
        "observed_in": ["Paper 2 2023 Q1(a)", "Paper 2 Autumn 2021 Q1(b)"],
    },
    {
        "word": "describe",
        "meaning": "Set out features or process steps clearly, without needing a full judgement.",
        "response_pattern": "what it is or how it works",
        "observed_in": ["Paper 2 Autumn 2022 Q3(a)", "Paper 2 2023 Q5"],
    },
    {
        "word": "explain",
        "meaning": "Give a valid point and link it to a reason, effect, or consequence.",
        "response_pattern": "point plus because/so that",
        "observed_in": ["Paper 2 Autumn 2022 Q2(b)", "Paper 2 2023 Q2(a)"],
    },
    {
        "word": "compare",
        "meaning": "Show similarities, differences, or relative suitability between options.",
        "response_pattern": "balanced contrast",
        "observed_in": ["Specification Paper 1 algorithm suitability outcomes"],
    },
    {
        "word": "discuss",
        "meaning": "Explore multiple relevant factors in a balanced way, usually without a fully evaluative conclusion requirement.",
        "response_pattern": "developed multi-factor response",
        "observed_in": ["Paper 2 2023 Section B Q8(d)"],
    },
    {
        "word": "evaluate",
        "meaning": "Weigh strengths, weaknesses, impacts, or trade-offs and reach a supported judgement.",
        "response_pattern": "balanced argument plus judgement",
        "observed_in": ["Paper 2 Autumn 2022 Q7", "Paper 2 2023 Q7"],
    },
    {
        "word": "justify",
        "meaning": "Support a decision with clear reasoning tied to context and criteria.",
        "response_pattern": "decision plus defensible rationale",
        "observed_in": ["ESP planning rationale", "OS risk and design decisions"],
    },
]


QUESTION_BANK = [
    {
        "id": "p1-ct-001",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification pages 10-12",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "topic-practice",
        "topic_id": "problem-solving",
        "subtopic_id": "computational-thinking",
        "command_word": "explain",
        "marks": 4,
        "difficulty": "secure",
        "answer_type": "short-open",
        "estimated_minutes": 5,
        "title": "Decompose a cinema kiosk problem",
        "prompt": "A cinema kiosk must let a user choose a film, seat type, and payment method before printing a ticket. Explain how decomposition would help design the solution and identify one benefit of showing the logic as a flowchart.",
        "mark_scheme_points": [
            "Break the problem into smaller parts such as input capture, validation, pricing, and ticket output.",
            "State that decomposition reduces complexity or makes implementation and testing easier.",
            "Identify a valid flowchart benefit such as visual clarity of sequence and decisions.",
            "Link the flowchart benefit to debugging, planning, or communication.",
        ],
        "common_pitfalls": [
            "Listing features without explaining how decomposition helps.",
            "Describing a flowchart generally without linking it to this task.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-1", "problem-solving", "flowcharts", "computational-thinking"],
    },
    {
        "id": "p1-ad-002",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification pages 11-12",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "quick-practice",
        "topic_id": "problem-solving",
        "subtopic_id": "algorithmic-design",
        "command_word": "complete",
        "marks": 3,
        "difficulty": "foundation",
        "answer_type": "code-trace",
        "estimated_minutes": 4,
        "title": "Trace a simple algorithm",
        "prompt": "A program starts with total = 0, then repeats three times: total = total + 2. After the loop, it prints total. State the output and identify the control structure being used.",
        "mark_scheme_points": [
            "Output is 6.",
            "The algorithm uses iteration.",
            "It is specifically a count-controlled loop or repetition that runs three times.",
        ],
        "common_pitfalls": [
            "Adding 2 once instead of three times.",
            "Naming sequence rather than iteration.",
        ],
        "feedback_rule_id": "code-trace",
        "tags": ["paper-1", "algorithm-trace", "iteration"],
    },
    {
        "id": "p1-vc-003",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification pages 13-14",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "topic-practice",
        "topic_id": "introduction-to-programming",
        "subtopic_id": "variables-constants-scope",
        "command_word": "explain",
        "marks": 4,
        "difficulty": "secure",
        "answer_type": "short-open",
        "estimated_minutes": 5,
        "title": "Scope and type conversion",
        "prompt": "Explain why a Python program might use a local variable for a temporary calculation and a type conversion function when reading age from keyboard input.",
        "mark_scheme_points": [
            "A local variable limits visibility to the function or block where it is needed.",
            "Using local scope reduces accidental changes elsewhere in the program.",
            "Keyboard input is read as text/string.",
            "Type conversion is needed to treat the input as a number for arithmetic or comparison.",
        ],
        "common_pitfalls": [
            "Calling the input an integer by default.",
            "Confusing local scope with constant values.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-1", "scope", "type-conversion", "python"],
    },
    {
        "id": "p1-ds-004",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification pages 13-17",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "topic-practice",
        "topic_id": "introduction-to-programming",
        "subtopic_id": "data-structures",
        "command_word": "justify",
        "marks": 5,
        "difficulty": "secure",
        "answer_type": "scenario-response",
        "estimated_minutes": 6,
        "title": "Choose a data structure",
        "prompt": "A school app stores each student's ID number, name, and current attendance percentage. Justify whether a dictionary or a list is the better primary structure for looking up one student quickly by ID.",
        "mark_scheme_points": [
            "A dictionary is more suitable when the student ID is used as the key.",
            "Direct key-based access is faster or simpler than searching a list item by item.",
            "The value can store multiple fields such as name and attendance.",
            "A list would usually require linear search unless already indexed by position in a meaningful way.",
            "A justified conclusion selects the structure that best fits the lookup requirement.",
        ],
        "common_pitfalls": [
            "Saying lists are always better because they are simpler.",
            "Ignoring the lookup-by-ID requirement.",
        ],
        "feedback_rule_id": "levels-evaluate",
        "tags": ["paper-1", "data-structures", "dictionaries", "lists"],
    },
    {
        "id": "p1-act-005",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification page 15",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "debug-lab",
        "topic_id": "introduction-to-programming",
        "subtopic_id": "actions-sequence-selection-iteration",
        "command_word": "identify",
        "marks": 4,
        "difficulty": "secure",
        "answer_type": "fix-the-bug",
        "estimated_minutes": 6,
        "title": "Fix the off-by-one loop",
        "prompt": "A loop is meant to print numbers 1 to 5 inclusive but instead prints 1 to 4. Identify the likely bug and describe a fix.",
        "mark_scheme_points": [
            "The loop boundary is wrong, so it stops one iteration too early.",
            "A correct fix adjusts the end value or loop condition so 5 is included.",
            "The explanation recognises this as an iteration/control-flow issue.",
            "The fix preserves the intended order of outputs.",
        ],
        "common_pitfalls": [
            "Changing the start value instead of the end condition.",
            "Offering a fix without explaining why the original fails.",
        ],
        "feedback_rule_id": "code-trace",
        "tags": ["paper-1", "loops", "debugging"],
    },
    {
        "id": "p1-fp-006",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification page 16",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "topic-practice",
        "topic_id": "introduction-to-programming",
        "subtopic_id": "functions-procedures",
        "command_word": "compare",
        "marks": 4,
        "difficulty": "foundation",
        "answer_type": "short-open",
        "estimated_minutes": 5,
        "title": "Function versus procedure",
        "prompt": "Compare a function and a procedure in Python when building a reusable program.",
        "mark_scheme_points": [
            "A function returns a value.",
            "A procedure performs an action without returning a result.",
            "Both can take parameters.",
            "Reusable modular code improves maintainability or clarity.",
        ],
        "common_pitfalls": [
            "Saying procedures cannot take parameters.",
            "Treating every Python function as a procedure.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-1", "functions", "procedures", "modularity"],
    },
    {
        "id": "p1-val-007",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification page 16",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "topic-practice",
        "topic_id": "introduction-to-programming",
        "subtopic_id": "validation",
        "command_word": "describe",
        "marks": 4,
        "difficulty": "secure",
        "answer_type": "scenario-response",
        "estimated_minutes": 5,
        "title": "Validation for student registration",
        "prompt": "Describe two validation checks that should be used when a student enters an email address and age into a registration form.",
        "mark_scheme_points": [
            "A format check can confirm the email follows an expected pattern.",
            "A presence or length check can ensure the email field is not empty or unreasonably long.",
            "A range check can ensure age falls within an acceptable interval.",
            "A type check can ensure age is numeric before processing.",
        ],
        "common_pitfalls": [
            "Naming verification methods instead of validation checks.",
            "Describing generic security controls rather than input validation.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-1", "validation", "forms"],
    },
    {
        "id": "p1-rb-008",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification page 17",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "debug-lab",
        "topic_id": "introduction-to-programming",
        "subtopic_id": "robust-code-debugging",
        "command_word": "explain",
        "marks": 5,
        "difficulty": "stretch",
        "answer_type": "scenario-response",
        "estimated_minutes": 7,
        "title": "Robust error handling",
        "prompt": "Explain how robust code should respond when a program expects a number but the user enters text and then closes the program unexpectedly.",
        "mark_scheme_points": [
            "The program should validate or safely convert input before use.",
            "It should handle unexpected input without crashing.",
            "It should provide a clear and meaningful error message or prompt for re-entry.",
            "Unexpected termination should be handled cleanly, for example by saving state or closing resources safely.",
            "The explanation links these behaviours to reliability or user experience.",
        ],
        "common_pitfalls": [
            "Only saying 'use try/except' with no explanation of behaviour.",
            "Ignoring the unexpected termination part of the question.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-1", "robust-code", "debugging", "errors"],
    },
    {
        "id": "p1-alg-009",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification pages 17-18",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "topic-practice",
        "topic_id": "introduction-to-programming",
        "subtopic_id": "common-algorithms",
        "command_word": "justify",
        "marks": 6,
        "difficulty": "stretch",
        "answer_type": "scenario-response",
        "estimated_minutes": 8,
        "title": "Search algorithm choice",
        "prompt": "A dataset of customer IDs is stored in sorted order. Justify whether linear search or binary search is the better algorithm when fast lookup matters.",
        "mark_scheme_points": [
            "Binary search is appropriate because the data is sorted.",
            "It reduces the search space by half each step.",
            "This generally needs fewer comparisons than linear search on larger datasets.",
            "Linear search does not rely on sorted data but checks each item in sequence.",
            "A strong answer notes that binary search is unsuitable if the data is not sorted or indexing is not possible.",
            "A justified conclusion clearly selects binary search in this scenario.",
        ],
        "common_pitfalls": [
            "Choosing binary search without mentioning the sorted prerequisite.",
            "Confusing search with sort.",
        ],
        "feedback_rule_id": "levels-evaluate",
        "tags": ["paper-1", "algorithms", "binary-search", "linear-search"],
    },
    {
        "id": "p1-sort-010",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification page 18",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "quick-practice",
        "topic_id": "introduction-to-programming",
        "subtopic_id": "common-algorithms",
        "command_word": "state",
        "marks": 3,
        "difficulty": "foundation",
        "answer_type": "short-open",
        "estimated_minutes": 3,
        "title": "Sort comparison basics",
        "prompt": "State one valid metric that can be used to compare sorting algorithms and give one reason why it matters.",
        "mark_scheme_points": [
            "Valid metrics include execution time, memory use, or number of comparisons.",
            "The reason links the metric to efficiency or suitability.",
            "The response is concise and correct.",
        ],
        "common_pitfalls": [
            "Naming a sort algorithm rather than a comparison metric.",
            "Giving a vague reason such as 'it is better'.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-1", "sorting", "algorithm-metrics"],
    },
    {
        "id": "p1-test-011",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification pages 18-19",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "topic-practice",
        "topic_id": "introduction-to-programming",
        "subtopic_id": "testing",
        "command_word": "create",
        "marks": 6,
        "difficulty": "secure",
        "answer_type": "test-design",
        "estimated_minutes": 8,
        "title": "Build a mini test plan",
        "prompt": "Create three test cases for a function that accepts a mark from 0 to 100 and returns Pass when the mark is 40 or more. Include valid, boundary, and invalid data with expected results.",
        "mark_scheme_points": [
            "One valid test case such as 65 returning Pass.",
            "One boundary test such as 40 returning Pass or 39 returning Fail.",
            "One invalid test such as 120 or text input that should be rejected.",
            "Expected results are explicit.",
            "The cases are clearly labelled by type.",
            "The answer aligns tests to the stated requirement.",
        ],
        "common_pitfalls": [
            "Using only valid data.",
            "Failing to state the expected result.",
        ],
        "feedback_rule_id": "test-design",
        "tags": ["paper-1", "testing", "boundary-testing", "test-data"],
    },
    {
        "id": "p1-ei-012",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification pages 19-21",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "paper-practice",
        "topic_id": "emerging-issues",
        "subtopic_id": "impact-of-digital-technologies",
        "command_word": "evaluate",
        "marks": 6,
        "difficulty": "stretch",
        "answer_type": "extended-open",
        "estimated_minutes": 8,
        "title": "Digital inclusion and AI",
        "prompt": "Evaluate the impact of increased use of generative AI in public digital services on citizens and organisations.",
        "mark_scheme_points": [
            "Benefits may include faster service, wider access, automation, or improved availability.",
            "Risks may include bias, exclusion, privacy concerns, reduced empathy, or over-reliance on AI.",
            "A strong answer considers both organisational and user impact.",
            "The response uses context such as accessibility, fairness, and trust.",
            "There is a reasoned overall judgement.",
        ],
        "common_pitfalls": [
            "Listing only positives or only negatives.",
            "Ignoring inclusion and bias.",
        ],
        "feedback_rule_id": "levels-evaluate",
        "tags": ["paper-1", "emerging-issues", "ai", "digital-inclusion"],
    },
    {
        "id": "p1-leg-013",
        "source_type": "curriculum-authored",
        "source_name": "Derived from specification pages 21-23",
        "component": "core",
        "paper": "paper-1",
        "year": "",
        "season": "",
        "section": "paper-practice",
        "topic_id": "legislation-and-regulation",
        "subtopic_id": "legislation",
        "command_word": "explain",
        "marks": 5,
        "difficulty": "secure",
        "answer_type": "scenario-response",
        "estimated_minutes": 6,
        "title": "Law in a software company",
        "prompt": "Explain how the Data Protection Act/GDPR and the Computer Misuse Act affect the work of a company developing an online employee portal.",
        "mark_scheme_points": [
            "DPA/GDPR requires lawful handling of personal data and appropriate protection.",
            "The company should collect only necessary data and keep it secure.",
            "The Computer Misuse Act makes unauthorised access or malicious actions illegal.",
            "The organisation must prevent misuse by staff and external attackers.",
            "A strong answer links the laws to design, access control, or organisational procedures.",
        ],
        "common_pitfalls": [
            "Confusing DPA/GDPR with copyright.",
            "Describing generic ethics without naming legal impact.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-1", "legislation", "gdpr", "cma"],
    },
    {
        "id": "p2-2021-001",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2021",
        "component": "core",
        "paper": "paper-2",
        "year": "2021",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "data",
        "subtopic_id": "data-information-knowledge",
        "command_word": "state",
        "marks": 2,
        "difficulty": "foundation",
        "answer_type": "short-open",
        "estimated_minutes": 2,
        "title": "Ways data is generated",
        "prompt": "State two ways data may be generated.",
        "mark_scheme_points": [
            "Valid answers include humans, AI or machine learning, sensors, IoT devices, or transactional systems.",
            "Two distinct methods are needed for full marks.",
        ],
        "common_pitfalls": [
            "Giving examples of data rather than methods of generation.",
        ],
        "feedback_rule_id": "points-identify",
        "tags": ["paper-2", "official", "data-generation"],
    },
    {
        "id": "p2-2021-002",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2021",
        "component": "core",
        "paper": "paper-2",
        "year": "2021",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "digital-environments",
        "subtopic_id": "networks",
        "command_word": "complete",
        "marks": 2,
        "difficulty": "foundation",
        "answer_type": "table-completion",
        "estimated_minutes": 2,
        "title": "Complete the OSI model",
        "prompt": "Complete the 7-layer OSI model by naming the missing layers 1 and 4.",
        "mark_scheme_points": [
            "Layer 1 is Application.",
            "Layer 4 is Transport.",
        ],
        "common_pitfalls": [
            "Using TCP/IP layer names in the wrong positions.",
        ],
        "feedback_rule_id": "points-identify",
        "tags": ["paper-2", "official", "osi", "networks"],
    },
    {
        "id": "p2-2021-003",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2021",
        "component": "core",
        "paper": "paper-2",
        "year": "2021",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "business-context",
        "subtopic_id": "change-management",
        "command_word": "state",
        "marks": 2,
        "difficulty": "foundation",
        "answer_type": "short-open",
        "estimated_minutes": 2,
        "title": "Triggers for organisational change",
        "prompt": "State two factors that can trigger change in organisations.",
        "mark_scheme_points": [
            "Valid answers include competition, legislation, market demand, new technologies, system failures, or restructuring.",
            "Two distinct factors are required.",
        ],
        "common_pitfalls": [
            "Giving project tasks rather than change triggers.",
        ],
        "feedback_rule_id": "points-identify",
        "tags": ["paper-2", "official", "change-management"],
    },
    {
        "id": "p2-2021-004",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2021",
        "component": "core",
        "paper": "paper-2",
        "year": "2021",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "data",
        "subtopic_id": "visualisation-models-and-access",
        "command_word": "describe",
        "marks": 2,
        "difficulty": "foundation",
        "answer_type": "short-open",
        "estimated_minutes": 3,
        "title": "Linking tables in a relational database",
        "prompt": "Describe how data from two different tables in a relational database may be linked together.",
        "mark_scheme_points": [
            "Tables can be linked using a common field or key.",
            "The linked field usually acts as a primary key in one table and a foreign key in another.",
        ],
        "common_pitfalls": [
            "Saying the tables are linked because they are stored in the same database.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-2", "official", "databases", "relational-model"],
    },
    {
        "id": "p2-2021-005",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2021",
        "component": "core",
        "paper": "paper-2",
        "year": "2021",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "data",
        "subtopic_id": "visualisation-models-and-access",
        "command_word": "explain",
        "marks": 3,
        "difficulty": "foundation",
        "answer_type": "short-open",
        "estimated_minutes": 4,
        "title": "Why use a graph for sales summary",
        "prompt": "Explain why an accountant would choose to use a graph to present a summary of monthly sales data to business owners.",
        "mark_scheme_points": [
            "A graph makes trends or changes over time easier to see.",
            "It allows quicker interpretation than raw rows of figures for many audiences.",
            "The explanation links the visual choice to decision-making or clarity.",
        ],
        "common_pitfalls": [
            "Only saying 'graphs look better'.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-2", "official", "data-visualisation", "graphs"],
    },
    {
        "id": "p2-2021-006",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2021",
        "component": "core",
        "paper": "paper-2",
        "year": "2021",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "business-context",
        "subtopic_id": "project-feasibility",
        "command_word": "explain",
        "marks": 4,
        "difficulty": "secure",
        "answer_type": "scenario-response",
        "estimated_minutes": 5,
        "title": "Feasibility factors",
        "prompt": "Explain two factors that can determine the feasibility of a digital project.",
        "mark_scheme_points": [
            "Valid factors include budget, time, staffing, technology, productivity impact, disruption, support, or resistance to change.",
            "Each factor needs a linked explanation of how it affects viability.",
        ],
        "common_pitfalls": [
            "Naming generic project goals instead of feasibility factors.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-2", "official", "feasibility", "business-context"],
    },
    {
        "id": "p2-2022-001",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2022",
        "component": "core",
        "paper": "paper-2",
        "year": "2022",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "digital-environments",
        "subtopic_id": "networks",
        "command_word": "name",
        "marks": 2,
        "difficulty": "foundation",
        "answer_type": "short-open",
        "estimated_minutes": 2,
        "title": "Name two TCP/IP layers",
        "prompt": "Name two layers of the four-layer TCP/IP model.",
        "mark_scheme_points": [
            "Valid answers include application, transport, internet, and network access.",
            "Two correct layers are required.",
        ],
        "common_pitfalls": [
            "Using OSI-only names such as presentation.",
        ],
        "feedback_rule_id": "points-identify",
        "tags": ["paper-2", "official", "tcp-ip", "networks"],
    },
    {
        "id": "p2-2022-002",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2022",
        "component": "core",
        "paper": "paper-2",
        "year": "2022",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "security",
        "subtopic_id": "threats-and-vulnerabilities",
        "command_word": "explain",
        "marks": 4,
        "difficulty": "secure",
        "answer_type": "short-open",
        "estimated_minutes": 5,
        "title": "Technical threats to digital systems",
        "prompt": "Explain two technical threats to digital systems.",
        "mark_scheme_points": [
            "Valid threats include botnets, DDoS, hacking, malware, social engineering, insecure APIs, open networks, or man-in-the-middle attacks.",
            "Each threat needs a linked explanation of what it does or why it is harmful.",
        ],
        "common_pitfalls": [
            "Naming a threat without saying what impact it has.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-2", "official", "security-threats"],
    },
    {
        "id": "p2-2022-003",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2022",
        "component": "core",
        "paper": "paper-2",
        "year": "2022",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "data",
        "subtopic_id": "data-information-knowledge",
        "command_word": "describe",
        "marks": 2,
        "difficulty": "foundation",
        "answer_type": "short-open",
        "estimated_minutes": 3,
        "title": "Transforming data into information",
        "prompt": "Describe how data may be transformed into information.",
        "mark_scheme_points": [
            "Raw data is processed, analysed, or organised.",
            "The transformed output becomes meaningful or useful in context.",
        ],
        "common_pitfalls": [
            "Defining data only, without mentioning transformation.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-2", "official", "data-transformation"],
    },
    {
        "id": "p2-2022-004",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2022",
        "component": "core",
        "paper": "paper-2",
        "year": "2022",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "digital-environments",
        "subtopic_id": "virtual-environments",
        "command_word": "explain",
        "marks": 4,
        "difficulty": "secure",
        "answer_type": "scenario-response",
        "estimated_minutes": 5,
        "title": "Why use virtual environments",
        "prompt": "Explain two reasons why a cyber security company would use virtual environments to develop and test a new anti-virus tool.",
        "mark_scheme_points": [
            "Isolation helps protect the host system while testing malicious or risky code.",
            "Virtual environments are easier to reset, duplicate, or configure for testing.",
            "They can be cost-effective and support multiple environments on shared hardware.",
            "Each reason needs a linked benefit to development or testing.",
        ],
        "common_pitfalls": [
            "Talking about cloud computing instead of virtual environments.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-2", "official", "virtualisation", "testing"],
    },
    {
        "id": "p2-2022-005",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 Autumn 2022",
        "component": "core",
        "paper": "paper-2",
        "year": "2022",
        "season": "Autumn",
        "section": "section-a",
        "topic_id": "data",
        "subtopic_id": "analysis-tools",
        "command_word": "evaluate",
        "marks": 9,
        "difficulty": "stretch",
        "answer_type": "extended-open",
        "estimated_minutes": 12,
        "title": "Evaluate data analysis tools in business",
        "prompt": "Evaluate the use of data analysis tools and their use in business.",
        "mark_scheme_points": [
            "Relevant tools include data warehouses, data lakes, data marts, data mining, and reporting.",
            "Strong answers explain how businesses use them for planning, CRM, or insight generation.",
            "Balanced answers consider benefits such as better decisions and drawbacks such as cost, skills, or data quality risks.",
            "A reasoned judgement is needed for top marks.",
        ],
        "common_pitfalls": [
            "Listing tools with no business application.",
            "Ignoring drawbacks or limits.",
        ],
        "feedback_rule_id": "levels-evaluate",
        "tags": ["paper-2", "official", "data-analysis", "business-intelligence"],
    },
    {
        "id": "p2-2023-001",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 2023",
        "component": "core",
        "paper": "paper-2",
        "year": "2023",
        "season": "Summer",
        "section": "section-a",
        "topic_id": "business-context",
        "subtopic_id": "digital-value",
        "command_word": "explain",
        "marks": 4,
        "difficulty": "secure",
        "answer_type": "scenario-response",
        "estimated_minutes": 5,
        "title": "UI design for end users",
        "prompt": "A digital system is being developed for use in doctors' surgeries to help prescribe medicines. Explain two ways the UI design should consider end-user characteristics.",
        "mark_scheme_points": [
            "Valid characteristics include age, digital skill, accessibility needs, or literacy.",
            "Each point links the characteristic to a UI decision such as font size, contrast, simple navigation, or clear wording.",
        ],
        "common_pitfalls": [
            "Describing medical features rather than user characteristics.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-2", "official", "user-needs", "ui", "accessibility"],
    },
    {
        "id": "p2-2023-002",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 2023",
        "component": "core",
        "paper": "paper-2",
        "year": "2023",
        "season": "Summer",
        "section": "section-a",
        "topic_id": "security",
        "subtopic_id": "cia-and-iaaa",
        "command_word": "describe",
        "marks": 4,
        "difficulty": "secure",
        "answer_type": "short-open",
        "estimated_minutes": 5,
        "title": "Confidentiality and integrity",
        "prompt": "Describe how the relationship between confidentiality and integrity of patient records can be applied in a new system.",
        "mark_scheme_points": [
            "Confidentiality keeps records private from unauthorised users.",
            "Integrity ensures records are accurate and not tampered with.",
            "A strong answer links access control to protecting integrity.",
            "The application is tied to patient records rather than security in general.",
        ],
        "common_pitfalls": [
            "Explaining availability instead of integrity.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-2", "official", "cia", "health-data"],
    },
    {
        "id": "p2-2023-003",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 2023",
        "component": "core",
        "paper": "paper-2",
        "year": "2023",
        "season": "Summer",
        "section": "section-a",
        "topic_id": "business-context",
        "subtopic_id": "change-management",
        "command_word": "describe",
        "marks": 4,
        "difficulty": "secure",
        "answer_type": "short-open",
        "estimated_minutes": 5,
        "title": "Unforeseen change triggers",
        "prompt": "Describe two unforeseen factors that could trigger change in an organisation.",
        "mark_scheme_points": [
            "Valid unforeseen factors include system failure, zero-day vulnerabilities, data corruption, cyber-attacks, or natural disasters.",
            "Each factor needs a linked description of why it forces change.",
        ],
        "common_pitfalls": [
            "Giving planned strategic changes instead of unforeseen triggers.",
        ],
        "feedback_rule_id": "points-linked-explanation",
        "tags": ["paper-2", "official", "change-triggers"],
    },
    {
        "id": "p2-2023-004",
        "source_type": "official-past-paper",
        "source_name": "Paper 2 2023",
        "component": "core",
        "paper": "paper-2",
        "year": "2023",
        "season": "Summer",
        "section": "section-a",
        "topic_id": "data",
        "subtopic_id": "visualisation-models-and-access",
        "command_word": "evaluate",
        "marks": 9,
        "difficulty": "stretch",
        "answer_type": "extended-open",
        "estimated_minutes": 12,
        "title": "Evaluate data access permissions",
        "prompt": "Evaluate the impact of data access permissions on an organisation.",
        "mark_scheme_points": [
            "Relevant points include authorisation, privileges, access rights, RBAC, and API access management.",
            "Benefits may include security, compliance, and reduced misuse.",
            "Drawbacks or challenges may include administration overhead, poor user experience, or blocked productivity if badly configured.",
            "Top-level answers balance impact and reach a judgement.",
        ],
        "common_pitfalls": [
            "Discussing network protocols rather than permission control.",
        ],
        "feedback_rule_id": "levels-evaluate",
        "tags": ["paper-2", "official", "access-control", "permissions"],
    },
    {
        "id": "esp-001",
        "source_type": "curriculum-authored",
        "source_name": "Derived from ESP pages 49-58",
        "component": "core",
        "paper": "employer-set-project",
        "year": "",
        "season": "",
        "section": "project-prep",
        "topic_id": "employer-set-project",
        "subtopic_id": "planning",
        "command_word": "justify",
        "marks": 8,
        "difficulty": "stretch",
        "answer_type": "portfolio-task",
        "estimated_minutes": 12,
        "title": "Plan a project response",
        "prompt": "A client needs a dashboard product in six weeks. Outline the key sections of a project plan and justify two major scheduling or resource decisions you would include.",
        "mark_scheme_points": [
            "A strong plan includes tasks, subtasks, milestones, resources, costs, and deadlines.",
            "Decisions are justified with staffing, risk, dependency, or budget reasoning.",
            "The response links planning choices to the brief and delivery window.",
            "Resource and schedule choices are internally coherent.",
        ],
        "common_pitfalls": [
            "Listing headings only with no rationale.",
            "Ignoring task dependencies or realistic resourcing.",
        ],
        "feedback_rule_id": "esp-rationale",
        "tags": ["esp", "planning", "gantt", "resources"],
    },
    {
        "id": "esp-002",
        "source_type": "curriculum-authored",
        "source_name": "Derived from ESP pages 50-52",
        "component": "core",
        "paper": "employer-set-project",
        "year": "",
        "season": "",
        "section": "project-prep",
        "topic_id": "employer-set-project",
        "subtopic_id": "defect-fixing",
        "command_word": "describe",
        "marks": 6,
        "difficulty": "secure",
        "answer_type": "portfolio-task",
        "estimated_minutes": 9,
        "title": "Testing evidence for defect fixing",
        "prompt": "Describe the evidence you should capture when testing existing code to identify and fix defects in the ESP.",
        "mark_scheme_points": [
            "Tests to be carried out",
            "Purpose of each test",
            "Test data including valid and invalid cases",
            "Expected results",
            "Actual results",
            "Further actions or refinement after testing",
        ],
        "common_pitfalls": [
            "Only mentioning the bug fix and not the evidence trail.",
        ],
        "feedback_rule_id": "esp-rationale",
        "tags": ["esp", "testing", "defects", "evidence"],
    },
    {
        "id": "esp-003",
        "source_type": "curriculum-authored",
        "source_name": "Derived from ESP pages 50-52",
        "component": "core",
        "paper": "employer-set-project",
        "year": "",
        "season": "",
        "section": "project-prep",
        "topic_id": "employer-set-project",
        "subtopic_id": "design",
        "command_word": "explain",
        "marks": 8,
        "difficulty": "stretch",
        "answer_type": "portfolio-task",
        "estimated_minutes": 12,
        "title": "Communicate a solution design",
        "prompt": "Explain what makes a strong design submission for the ESP when you are presenting algorithms and solution structure to a client and a third-party developer.",
        "mark_scheme_points": [
            "The design should decompose the problem into clear sub-systems.",
            "Algorithms should be logically correct and use suitable constructs.",
            "Conventions should be applied consistently in code or flowchart notation.",
            "The design should communicate clearly to both technical and non-technical audiences.",
            "There should be enough detail for informed decisions and onward implementation.",
        ],
        "common_pitfalls": [
            "Treating design as only screen sketches.",
            "Ignoring audience.",
        ],
        "feedback_rule_id": "esp-rationale",
        "tags": ["esp", "design", "algorithms", "communication"],
    },
    {
        "id": "esp-004",
        "source_type": "curriculum-authored",
        "source_name": "Derived from ESP pages 52 and 56-57",
        "component": "core",
        "paper": "employer-set-project",
        "year": "",
        "season": "",
        "section": "project-prep",
        "topic_id": "employer-set-project",
        "subtopic_id": "evaluation",
        "command_word": "evaluate",
        "marks": 8,
        "difficulty": "stretch",
        "answer_type": "portfolio-task",
        "estimated_minutes": 12,
        "title": "Reflective evaluation",
        "prompt": "Evaluate how you would show that an ESP product meets the brief and explain what you would include in a reflective review.",
        "mark_scheme_points": [
            "Measure outcomes against success criteria and user needs.",
            "Use testing evidence to support claims.",
            "Discuss strengths and limitations honestly.",
            "Suggest practical improvements if the product were revisited.",
        ],
        "common_pitfalls": [
            "Only saying the product works without evidence.",
            "Giving vague improvements disconnected from the brief.",
        ],
        "feedback_rule_id": "esp-rationale",
        "tags": ["esp", "evaluation", "review", "success-criteria"],
    },
    {
        "id": "os-001",
        "source_type": "curriculum-authored",
        "source_name": "Derived from OS pages 59-64",
        "component": "occupational-specialism",
        "paper": "occupational-specialism",
        "year": "",
        "season": "",
        "section": "scenario-prep",
        "topic_id": "occupational-specialism-digital-software-development",
        "subtopic_id": "requirements-and-acceptance-criteria",
        "command_word": "define",
        "marks": 8,
        "difficulty": "stretch",
        "answer_type": "scenario-response",
        "estimated_minutes": 12,
        "title": "Functional and non-functional requirements",
        "prompt": "A client wants a booking platform for community events. Define suitable functional requirements, non-functional requirements, and user acceptance criteria for the solution.",
        "mark_scheme_points": [
            "Functional requirements describe what the system must do.",
            "Non-functional requirements cover areas such as security, accessibility, scalability, and performance.",
            "Acceptance criteria are measurable and tied to user outcomes or KPIs.",
            "A strong answer keeps the requirements aligned to the brief and user needs.",
        ],
        "common_pitfalls": [
            "Writing vague aims instead of measurable requirements.",
            "Confusing features with acceptance criteria.",
        ],
        "feedback_rule_id": "esp-rationale",
        "tags": ["os", "requirements", "acceptance-criteria", "kpis"],
    },
    {
        "id": "os-002",
        "source_type": "curriculum-authored",
        "source_name": "Derived from OS pages 61-63",
        "component": "occupational-specialism",
        "paper": "occupational-specialism",
        "year": "",
        "season": "",
        "section": "scenario-prep",
        "topic_id": "occupational-specialism-digital-software-development",
        "subtopic_id": "methodology-and-team",
        "command_word": "justify",
        "marks": 8,
        "difficulty": "stretch",
        "answer_type": "scenario-response",
        "estimated_minutes": 12,
        "title": "Choose a methodology",
        "prompt": "Justify whether Agile, Waterfall, or RAD is more suitable for a small software team building a product with evolving user requirements.",
        "mark_scheme_points": [
            "The chosen methodology should match changing requirements and team size.",
            "Agile or RAD may suit incremental feedback and iteration; Waterfall may be less suitable if requirements are unstable.",
            "A high-mark answer compares alternatives and justifies a final choice.",
            "The response links methodology to user involvement, documentation, pace, and risk.",
        ],
        "common_pitfalls": [
            "Naming a methodology with no contextual reasoning.",
        ],
        "feedback_rule_id": "levels-evaluate",
        "tags": ["os", "methodologies", "agile", "waterfall", "rad"],
    },
    {
        "id": "os-003",
        "source_type": "curriculum-authored",
        "source_name": "Derived from OS pages 67-68",
        "component": "occupational-specialism",
        "paper": "occupational-specialism",
        "year": "",
        "season": "",
        "section": "design-clinic",
        "topic_id": "occupational-specialism-digital-software-development",
        "subtopic_id": "research-and-evidence",
        "command_word": "evaluate",
        "marks": 6,
        "difficulty": "secure",
        "answer_type": "scenario-response",
        "estimated_minutes": 8,
        "title": "Reliable sources of knowledge",
        "prompt": "Evaluate the reliability of two different sources you might use when researching how to implement a new feature for a software project.",
        "mark_scheme_points": [
            "A strong answer considers credibility, bias, evidence, recency, and triangulation.",
            "It compares source types such as official docs, forums, academic papers, or blogs.",
            "The evaluation leads to a justified judgement about which source is more dependable for the task.",
        ],
        "common_pitfalls": [
            "Calling a source reliable simply because it is online.",
        ],
        "feedback_rule_id": "levels-evaluate",
        "tags": ["os", "research", "source-reliability"],
    },
    {
        "id": "os-004",
        "source_type": "curriculum-authored",
        "source_name": "Derived from OS pages 73-80",
        "component": "occupational-specialism",
        "paper": "occupational-specialism",
        "year": "",
        "season": "",
        "section": "scenario-prep",
        "topic_id": "occupational-specialism-digital-software-development",
        "subtopic_id": "implementation-testing-support",
        "command_word": "discuss",
        "marks": 10,
        "difficulty": "stretch",
        "answer_type": "extended-open",
        "estimated_minutes": 14,
        "title": "Implement, test, and support",
        "prompt": "Discuss how you would implement, test, deploy, and support a software product that uses a front end, a back end, and a database.",
        "mark_scheme_points": [
            "Implementation should reference at least two languages or layers plus suitable tools and modules.",
            "Testing should include functional and non-functional methods with valid test data.",
            "Deployment should match context, such as web, cloud, local, or containerised release.",
            "Support should include communication, issue resolution, documentation, and maintenance.",
            "The answer is strongest when it connects choices to user needs, risk, and scale.",
        ],
        "common_pitfalls": [
            "Focusing on coding only and ignoring testing or support.",
        ],
        "feedback_rule_id": "levels-evaluate",
        "tags": ["os", "implementation", "testing", "deployment", "support"],
    },
]


def build_curriculum_map() -> dict:
    return {
        "qualification": QUALIFICATION,
        "components": [
            {
                "id": "core",
                "title": "Core component",
                "weighting_qualification_percent": 50,
                "assessments": [
                    {
                        "id": "paper-1",
                        "title": "Core Paper 1",
                        "duration_minutes": 135,
                        "marks": 90,
                        "weighting_core_percent": 30,
                        "weighting_qualification_percent": 15,
                        "page_start": 10,
                        "page_end": 24,
                        "content_areas": PAPER_1_TOPICS,
                        "assessment_objectives": {
                            "AO1a": {"marks": 3, "percent": 3.3},
                            "AO1b": {"marks": 27, "percent": 30.0},
                            "AO2": {"marks": 39, "percent": 43.3},
                            "AO3a": {"marks": 12, "percent": 13.3},
                            "AO3b": {"marks": 9, "percent": 10.0},
                        },
                    },
                    {
                        "id": "paper-2",
                        "title": "Core Paper 2",
                        "duration_minutes": 135,
                        "marks": 90,
                        "weighting_core_percent": 30,
                        "weighting_qualification_percent": 15,
                        "page_start": 24,
                        "page_end": 49,
                        "content_areas": PAPER_2_TOPICS,
                        "assessment_objectives": {
                            "AO1a": {"marks": 10, "percent": 11.1},
                            "AO1b": {"marks": 21, "percent": 23.3},
                            "AO2": {"marks": 38, "percent": 42.2},
                            "AO3a": {"marks": 12, "percent": 13.3},
                            "AO3b": {"marks": 9, "percent": 10.0},
                        },
                    },
                    ESP_FRAMEWORK,
                ],
            },
            {
                "id": "occupational-specialism",
                "title": "Occupational Specialism",
                "weighting_qualification_percent": 50,
                "assessment": OS_FRAMEWORK,
            },
        ],
    }


def build_content_taxonomy() -> dict:
    return {
        "navigation": [
            {"id": "dashboard", "title": "Dashboard", "type": "workspace"},
            {"id": "paper-1", "title": "Paper 1", "type": "paper"},
            {"id": "paper-2", "title": "Paper 2", "type": "paper"},
            {"id": "employer-set-project", "title": "Employer Set Project", "type": "project"},
            {"id": "occupational-specialism", "title": "Occupational Specialism", "type": "project"},
            {"id": "past-papers", "title": "Past Papers", "type": "assessment-surface"},
            {"id": "question-bank", "title": "Question Bank", "type": "assessment-surface"},
            {"id": "planner", "title": "Planner", "type": "workflow"},
            {"id": "weak-topics", "title": "Weak Topics", "type": "diagnostics"},
            {"id": "mock-exams", "title": "Mock Exams", "type": "assessment-surface"},
            {"id": "progress", "title": "Progress", "type": "analytics"},
        ],
        "content_entities": [
            "component",
            "paper",
            "topic",
            "subtopic",
            "lesson",
            "key_term",
            "question",
            "mark_scheme_point",
            "attempt",
            "study_session",
            "revision_plan",
            "bookmark",
            "recommendation",
            "weak_topic_signal",
            "mock_exam",
        ],
    }


def build_question_bank_csv_rows() -> list[dict]:
    rows: list[dict] = []
    for question in QUESTION_BANK:
        row = {
            "question_id": question["id"],
            "source_type": question["source_type"],
            "source_name": question["source_name"],
            "component": question["component"],
            "paper": question["paper"],
            "year": question["year"],
            "season": question["season"],
            "section": question["section"],
            "topic_id": question["topic_id"],
            "subtopic_id": question["subtopic_id"],
            "command_word": question["command_word"],
            "marks": question["marks"],
            "difficulty": question["difficulty"],
            "answer_type": question["answer_type"],
            "estimated_minutes": question["estimated_minutes"],
            "title": question["title"],
            "prompt": question["prompt"],
            "feedback_rule_id": question["feedback_rule_id"],
            "mark_scheme_points": " | ".join(question["mark_scheme_points"]),
            "common_pitfalls": " | ".join(question["common_pitfalls"]),
            "tags": "|".join(question["tags"]),
        }
        rows.append(row)
    return rows


def render_qualification_map_md() -> str:
    paper_1_titles = ", ".join(topic["title"] for topic in PAPER_1_TOPICS)
    paper_2_titles = ", ".join(topic["title"] for topic in PAPER_2_TOPICS)
    os_titles = "\n".join(
        f"- {area['title']} (pp. {area['page_start']}-{area['page_end']})"
        for area in OS_FRAMEWORK["content_areas"]
    )
    return dedent(
        f"""
        # Qualification map

        Source basis:
        - `docs/source-pdfs/digital-dsd-specification.pdf` (primary)
        - `docs/source-pdfs/core-paper-2- november 21.pdf`
        - `docs/source-pdfs/core-paper-2- autumn-22.pdf`
        - `docs/source-pdfs/Paper 2 2023.pdf`
        - matching mark schemes in `docs/source-pdfs/`

        Qualification:
        - Title: {QUALIFICATION["title"]}
        - QN: {QUALIFICATION["qualification_number"]}
        - First teaching: {QUALIFICATION["first_teaching"]}
        - GLH / TQT: {QUALIFICATION["guided_learning_hours"]} / {QUALIFICATION["total_qualification_time"]}

        Core component:
        - Paper 1: 2h 15m, 90 marks, 30% of core, 15% of qualification
        - Paper 2: 2h 15m, 90 marks, 30% of core, 15% of qualification
        - Employer Set Project: 14h 30m, 100 marks, 40% of core, 20% of qualification

        Occupational Specialism:
        - Digital Software Development project: 50h 30m, 144 marks, 50% of qualification

        Paper 1 content areas:
        - {paper_1_titles}

        Paper 2 content areas:
        - {paper_2_titles}

        Employer Set Project task spine:
        - Task 1: Planning a project
        - Task 2: Identifying and fixing defects in existing code
        - Task 3: Designing a solution
        - Task 4a: Developing a solution
        - Task 4b: Reflective evaluation

        Occupational Specialism content areas:
        {os_titles}
        """
    ).strip() + "\n"


def render_mark_scheme_rules_md() -> str:
    sections = []
    for rule in MARK_SCHEME_RULES:
        checks = "\n".join(f"- {item}" for item in rule["feedback_checks"])
        sections.append(
            dedent(
                f"""
                ## {rule["title"]}

                Shape: {rule["shape"]}

                {rule["description"]}

                Feedback checks:
                {checks}
                """
            ).strip()
        )
    return "# Mark scheme rules\n\n" + "\n\n".join(sections) + "\n"


def render_command_words_md() -> str:
    rows = []
    for item in COMMAND_WORDS:
        observed = ", ".join(item["observed_in"])
        rows.append(
            f"| {item['word']} | {item['meaning']} | {item['response_pattern']} | {observed} |"
        )
    return dedent(
        """
        # Command words

        | Command word | Expected behaviour | Response pattern | Seen in source material |
        | --- | --- | --- | --- |
        """
    ).strip() + "\n" + "\n".join(rows) + "\n"


def render_esp_skill_framework_md() -> str:
    task_lines = []
    for task in ESP_FRAMEWORK["tasks"]:
        evidence = "\n".join(f"  - {item}" for item in task["evidence"])
        task_lines.append(
            dedent(
                f"""
                - {task["title"]}: {task["focus"]}
                {evidence}
                """
            ).strip()
        )
    ao_lines = "\n".join(
        f"- {objective['id']}: {objective['title']} ({objective['proportion_percent']}%)"
        for objective in ESP_FRAMEWORK["assessment_objectives"]
    )
    return dedent(
        f"""
        # Employer Set Project skill framework

        Assessment footprint:
        - Duration: {ESP_FRAMEWORK["duration_minutes"]} minutes
        - Marks: {ESP_FRAMEWORK["marks"]}
        - Weighting: {ESP_FRAMEWORK["weighting_core_percent"]}% of core, {ESP_FRAMEWORK["weighting_qualification_percent"]}% of qualification

        Task model:
        {chr(10).join(task_lines)}

        Assessment objectives:
        {ao_lines}
        """
    ).strip() + "\n"


def render_os_map_md() -> str:
    po_lines = "\n".join(f"- {item}" for item in OS_FRAMEWORK["performance_outcomes"])
    area_lines = []
    for area in OS_FRAMEWORK["content_areas"]:
        focus = "\n".join(f"  - {item}" for item in area["focus"])
        area_lines.append(
            dedent(
                f"""
                - {area["title"]} (pp. {area["page_start"]}-{area["page_end"]})
                {focus}
                """
            ).strip()
        )
    return dedent(
        f"""
        # Occupational specialism map

        Performance outcomes:
        {po_lines}

        Content areas:
        {chr(10).join(area_lines)}
        """
    ).strip() + "\n"


def render_data_contracts_md() -> str:
    return dedent(
        """
        # Data contracts

        Core entities:
        - Component: `id`, `title`, `weighting_qualification_percent`
        - Paper: `id`, `title`, `duration_minutes`, `marks`, `content_areas`
        - Topic: `id`, `title`, `summary`, `subtopics`
        - Subtopic: `id`, `title`, `outcomes`
        - Question: `id`, `paper`, `topic_id`, `subtopic_id`, `command_word`, `marks`, `difficulty`, `answer_type`, `prompt`
        - MarkSchemePoint: ordered bullet attached to a question
        - Attempt: `questionId`, `startedAt`, `submittedAt`, `score`, `maxScore`, `confidence`, `timeSpentSeconds`, `selfAssessment`
        - UserTopicMastery: `topicId`, `masteryPercent`, `attemptCount`, `recentTrend`, `weakSignal`
        - WeakTopicSignal: `topicId`, `strength`, `drivers`, `lastObservedAt`
        - Recommendation: `id`, `reason`, `targetType`, `targetId`, `estimatedMinutes`
        - RevisionPlan: `id`, `date`, `slots`, `targets`
        - MockExam: `id`, `paperScope`, `questionIds`, `timeLimitMinutes`

        Content loading direction:
        - `curriculum-map.json` is the authoritative topic/paper tree.
        - `question-bank.json` is the authoritative practice source for the current app slice.
        - `feedback-rules.json` and `mark-scheme-rules.md` define reusable examiner-style feedback patterns.
        - Runtime progress data should stay user-specific and separate from source content.
        """
    ).strip() + "\n"


def render_recommendation_logic_md() -> str:
    return dedent(
        """
        # Recommendation logic

        Inputs:
        - Accuracy by topic and subtopic
        - Recency of practice
        - Repeated mistakes against mark-scheme points
        - Time spent relative to expected time
        - User confidence
        - Upcoming exam focus (Paper 1, Paper 2, ESP, OS)

        Weak-topic signal heuristic:
        - Start from inverse accuracy.
        - Add weight for recent incorrect attempts.
        - Add weight when confidence is high but score is low.
        - Add weight when the same subtopic fails multiple times in a short window.
        - Reduce weight when recent attempts show improvement.

        Recommendation priority:
        1. High-signal weak subtopics with low recent practice.
        2. Near-exam papers with below-threshold readiness.
        3. Mixed revision sets that combine a weak area with a previously strong area.
        4. Short five-minute drills when the learner has little time available.

        Readiness model:
        - Topic mastery rolls into paper readiness.
        - Paper readiness rolls into component readiness.
        - ESP and OS readiness use coverage of framework areas plus scenario performance rather than raw recall alone.
        """
    ).strip() + "\n"


def render_ui_navigation_map_md() -> str:
    return dedent(
        """
        # UI navigation map

        Top-level routes:
        - Dashboard
        - Paper 1
        - Paper 2
        - Employer Set Project
        - Occupational Specialism
        - Past Papers
        - Question Bank
        - Planner
        - Weak Topics
        - Mock Exams
        - Progress

        Route intent:
        - Dashboard: next actions, readiness, weak topics, and session restart point.
        - Paper pages: topic-first revision with subtopic drill-down, question linkage, and mastery context.
        - Question Bank: high-control filtering and practice entry point.
        - Planner: translates weak-topic signals into session-sized targets.
        - Weak Topics: diagnostic view that prioritises revisits.
        - Progress: trend and coverage analytics.
        """
    ).strip() + "\n"


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


def write_csv(path: Path, rows: list[dict]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    DERIVED_DIR.mkdir(parents=True, exist_ok=True)

    curriculum_map = build_curriculum_map()
    content_taxonomy = build_content_taxonomy()

    write_text(DERIVED_DIR / "qualification-map.md", render_qualification_map_md())
    write_json(DERIVED_DIR / "curriculum-map.json", curriculum_map)
    write_json(DERIVED_DIR / "topic-skill-map.json", TOPIC_SKILL_MAP)
    write_csv(DERIVED_DIR / "question-bank.csv", build_question_bank_csv_rows())
    write_json(DERIVED_DIR / "question-bank.json", QUESTION_BANK)
    write_text(DERIVED_DIR / "mark-scheme-rules.md", render_mark_scheme_rules_md())
    write_json(DERIVED_DIR / "feedback-rules.json", MARK_SCHEME_RULES)
    write_text(DERIVED_DIR / "command-words.md", render_command_words_md())
    write_text(DERIVED_DIR / "esp-skill-framework.md", render_esp_skill_framework_md())
    write_text(DERIVED_DIR / "occupational-specialism-map.md", render_os_map_md())
    write_json(DERIVED_DIR / "content-taxonomy.json", content_taxonomy)
    write_text(DERIVED_DIR / "data-contracts.md", render_data_contracts_md())
    write_text(DERIVED_DIR / "recommendation-logic.md", render_recommendation_logic_md())
    write_text(DERIVED_DIR / "ui-navigation-map.md", render_ui_navigation_map_md())


if __name__ == "__main__":
    main()
