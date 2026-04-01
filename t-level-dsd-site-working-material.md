# T Level Digital Software Development: source extraction for revision website

Important note:
- `digital-dsd-specification.pdf` and `digital-software-development-content-depth-guide.pdf` are the authority sources for syllabus and assessment.
- Several teaching decks still use older Pearson branding (`Digital Production, Design and Development`, 2020-era pack). They are still useful for topic content and activity design, but the website should normalise wording back to the 2025 Digital Software Development specification.
- The curriculum planner PDFs contain a marks conflict for the core papers: page 2 says `100`, but the 2025 specification and the planner summary table give `90`. Use `90 marks` in website data.

## 1. File-by-file breakdown

| File | What it contains | Topic(s) | Useful for | Decision |
| --- | --- | --- | --- | --- |
| `3-10-data-models-worksheet.pdf` | Scenario worksheet: choose data model, explain rationale, sketch model, identify entities and relationships | Data, Data Models | revision, written answers, command word helper | KEEP |
| `3-11-access-control-answers.xlsx` | Answer key for role/data-asset permission grid | Data, Data Access Across Platforms, Security | revision, written answers | KEEP |
| `3-11-access-control-worksheet.pdf` | Scenario worksheet: assign read/write/admin/no-access and justify | Data, Data Access Across Platforms, Security | revision, written answers, command word helper | KEEP |
| `3-2-messy-data-set.xlsx` | Raw messy dataset for transformation/manipulation task | Data, Methods of Transforming Data | revision, library | KEEP |
| `3-4-data-cards.pptx` | Drag/drop style structured vs unstructured card activity | Data, Data Taxonomy, Data Types | revision | MAYBE |
| `3-4-data-cards.xlsx` | Same card content in easy-to-ingest flat format | Data, Data Taxonomy, Data Types | revision, library | KEEP |
| `3-5-data-format-answers.csv` | Answer set for identifying formats/snippets | Data, Data Formats | revision | KEEP |
| `3-5-data-format-worksheet.csv` | Raw format-snippet exercise data | Data, Data Formats | revision, library | KEEP |
| `3-5-data-format-worksheet.pdf` | Worksheet: identify format, describe clues, suggest use case | Data, Data Formats | revision, written answers, command word helper | KEEP |
| `3-7-big-data-answers.pdf` | Answer sheet mapping scenarios to 6 Vs | Data, Big Data | revision | KEEP |
| `3-7-big-data-worksheet.pdf` | Worksheet: identify the V and explain why | Data, Big Data | revision, written answers, command word helper | KEEP |
| `3-8-2-data-wrangling-complete.csv` | Cleaned output dataset | Data, Data Wrangling | revision, library | KEEP |
| `3-8-2-data-wrangling-raw-data.csv` | Raw wrangling dataset paired with cleaned version | Data, Data Wrangling | revision, library | KEEP |
| `3-8-data-wrangling-dataset-answers.csv` | Answer/cleaned version of wrangling dataset | Data, Data Wrangling | revision | KEEP |
| `3-8-data-wrangling-dataset.csv` | Raw wrangling dataset with errors and inconsistencies | Data, Data Wrangling | revision, library | KEEP |
| `3-8-data-wrangling-dataset.pdf` | Guided worksheet for 5 stages: structure, clean, validate, enrich, output | Data, Data Wrangling, Data Systems | revision, written answers, exam tips | KEEP |
| `3-9-visualisation-dataset.csv` | Dataset for creating charts/dashboards/visuals | Data, Data Visualisation | revision, library | KEEP |
| `curriculum-planner-option-1-may-exams-dsd.pdf` | Year plan, exam windows, revision pacing, references to SAM/past papers/ESP tasks; useful but contains conflicting core-paper mark figure | Whole qualification | exam tips, past paper practice | MAYBE |
| `curriculum-planner-option-2-november-exams-dsd.pdf` | Same as above for November route; useful but contains conflicting core-paper mark figure | Whole qualification | exam tips, past paper practice | MAYBE |
| `digital-dsd-specification.pdf` | Full 2025 qualification spec: structure, content, assessment, command words, AOs, grading | Whole qualification | library, revision, written answers, command word helper, exam tips, past paper practice | KEEP |
| `digital-software-development-3-1-data.pptx` | Data vs information vs knowledge; organisational use of data | Data | library, revision | KEEP |
| `digital-software-development-3-10-data.pptx` | Data models, techniques, hierarchical/network/relational representation | Data, Data Models | library, revision, written answers | KEEP |
| `digital-software-development-3-11-data.pptx` | Access controls, permissions, authorisation, privileges, RBAC/RuBAC/APIs | Data, Data Access Across Platforms, Security | library, revision, written answers | KEEP |
| `digital-software-development-3-12-data.pptx` | Data warehouses, lakes, marts, mining, reporting, BI use | Data, Data Analysis Tools | library, revision | KEEP |
| `digital-software-development-3-2-data.pptx` | Transforming data: manipulation, analysis, processing; messy dataset activity | Data | library, revision | KEEP |
| `digital-software-development-3-3-data.pptx` | Data taxonomy: qualitative/quantitative, structured/unstructured, discrete/continuous/categorical | Data | library, revision | KEEP |
| `digital-software-development-3-4-data.pptx` | Data types and links between structure, type and transformation | Data | library, revision | KEEP |
| `digital-software-development-3-5-data.pptx` | Data formats: JSON, text, CSV, UTF-8, ASCII, XML | Data | library, revision, written answers | KEEP |
| `digital-software-development-3-6-data.pptx` | Metadata, file/directory/hierarchy structures, storage vs transformation | Data | library, revision, written answers | KEEP |
| `digital-software-development-3-7-data.pptx` | 6 Vs, Big Data, maintenance dimensions | Data, Big Data | library, revision, written answers | KEEP |
| `digital-software-development-3-8-data.pptx` | Data wrangling, data systems, data entry, error reduction | Data, Data Systems | library, revision, written answers, exam tips | KEEP |
| `digital-software-development-3-9-data.pptx` | Visualisation formats, audience/brief/benefits/drawbacks | Data, Data Visualisation | library, revision, written answers | KEEP |
| `digital-software-development-content-depth-guide.pdf` | Best curriculum map of topic-by-topic depth and assessment intent | Whole qualification | library, revision, written answers, exam tips | KEEP |
| `digital-software-development-emerging-issues-3-1.pptx` | Impact of digital technologies, inclusion, accessibility, reliance on systems | Emerging Issues | library, revision, written answers | KEEP |
| `digital-software-development-emerging-issues-3-2.pptx` | Emerging technologies: storage media, quantum, IoT, AI/ML/gen AI, XR, blockchain, environmental, autonomous machines | Emerging Issues | library, revision, written answers | KEEP |
| `digital-software-development-legislation-4-1.pptx` | Legislation: H&S, DPA/GDPR, CMA, equality and related responsibilities | Legislation and Regulatory Requirements | library, revision, written answers, exam tips | KEEP |
| `digital-software-development-legislation-4-2.pptx` | Guidelines and codes of conduct, BCS, accessibility/best-practice framing | Legislation and Regulatory Requirements | library, revision, written answers, exam tips | KEEP |
| `digital-software-development-security-8-1.pptx` | CIA, IAAA, confidential information, why confidentiality matters | Security | library, revision, written answers | KEEP |
| `digital-software-development-security-8-2.pptx` | Threats and vulnerabilities: technical, human, physical | Security | library, revision, written answers, exam tips | KEEP |
| `digital-software-development-security-8-3.pptx` | Threat mitigation methods and trade-offs | Security | library, revision, written answers, exam tips | KEEP |
| `digital-software-development-security-8-4.pptx` | Interrelationships between security components; effective security systems | Security | library, revision, written answers | KEEP |
| `esp-tracker.zip` | Teacher/admin tracker workbook for Employer Set Project | Assessment admin | exam tips | DISCARD |
| `how-to-use-the-resources.pptx` | Teacher onboarding for Pearson delivery pack | Admin, pack orientation | exam tips | DISCARD |
| `occupational-specialism-tracker.zip` | Teacher/admin tracker for occupational specialism | Assessment admin | exam tips | DISCARD |
| `problem-solving-industry-resource-links.pdf` | External enrichment links for problem solving topic | Problem Solving | library | MAYBE |
| `problem-solving-introduction.pptx` | Topic introduction: computational thinking, decomposition, pattern recognition, abstraction, algorithms, flowcharts | Problem Solving | library, revision, written answers | KEEP |
| `problem-solving-topic-lesson-plans.pdf` | Best source for activity patterns, prompts, formative question styles, algorithm/flowchart tasks | Problem Solving | revision, written answers, command word helper, exam tips | KEEP |
| `qualification-description-t-level-qualification-in-digital-software-development.pdf` | Qualification overview, progression, high-level structure | Whole qualification | library, exam tips | MAYBE |

## 2. Consolidated syllabus map

| Topic | Subtopic | Key concepts |
| --- | --- | --- |
| Problem Solving | Computational thinking | definition, purpose, when to use, benefits/drawbacks, decomposition, pattern recognition, abstraction, algorithmic design |
| Problem Solving | Representing solutions | algorithms, pseudocode, flowcharts, sequencing, output tracing, error spotting, correction |
| Introduction to Programming | Core programming fundamentals | standard data types, variables/constants, conversion, scope, file handling, structure, built-in functions, validation, error handling, testing, maintainable code |
| Emerging Issues | Impact of digital technologies | organisational culture, communication change, productivity expectations, monitoring, automation, job displacement, privacy, digital identity, access to services, isolation, globalisation |
| Emerging Issues | Digital inclusion and accessibility | fair access, connectivity, hardware/software suitability, dataset bias, accessibility regulations, inclusive service design |
| Emerging Issues | Emerging technologies | storage media, quantum computing, IoT, edge computing, AI, generative AI, machine learning, AR/VR, open source, blockchain, environmental impact, autonomous systems |
| Legislation and Regulatory Requirements | Legislation | Health and Safety at Work Act, DPA/GDPR, Computer Misuse Act, equality/discrimination, intellectual property, accessibility obligations |
| Legislation and Regulatory Requirements | Guidelines and codes | BCS, codes of conduct, organisational policy, best practice, ethical/professional responsibility |
| Business Context | Business environment | organisation types, sectors, business models, stakeholders |
| Business Context | Digital value, risk, change | value of digital systems, risk to organisations, triggers for change, change management responses |
| Data | Data, information and knowledge | definitions, differences, organisational use, business decision support |
| Data | Methods of transforming data | manipulation, analysis, processing |
| Data | Data taxonomy | quantitative, qualitative, structured, unstructured, discrete, continuous, categorical, properties of qualitative data |
| Data | Data types | integer, real, character, string, Boolean, date, Blob; suitability and transformation implications |
| Data | Data formats | JSON, text, CSV, UTF-8, ASCII, XML; storage/transfer/processing implications |
| Data | Structures for storing data | metadata, file-based, directory-based, hierarchy-based structures |
| Data | Data dimensions and maintenance | Big Data, 6 Vs, QA methods, validation, verification, reliability, consistency, integrity, redundancy, time/skills/cost |
| Data | Data systems | data wrangling, structuring, cleaning, validating, enriching, outputting, input/search/save/integrate/index/output/feedback loop |
| Data | Data entry and error reduction | transcription errors, transposition errors, validation, verification, drop-down menus, pre-filled fields, screen design, expertise/time effects |
| Data | Data visualisation | graphs, charts, tables, reports, dashboards, infographics; audience/brief/benefits/drawbacks |
| Data | Data models | hierarchical, network, relational; efficiency, storage, implementation complexity; drawing/representation |
| Data | Data access across platforms | permissions, authorisation, privileges, access rights, rules, RBAC, RuBAC, APIs |
| Data | Data analysis tools | data warehouse, data lake, data mart, data mining, reporting, BI uses |
| Digital Environments | Hardware and software | devices, processors, memory, storage, operating systems, suitability |
| Digital Environments | Networks and environments | network types, TCP/IP, protocols, bandwidth/latency, virtual environments, cloud, resilience |
| Security | Security risks | confidential information, privacy, confidentiality impact, CIA, IAAA |
| Security | Threats and vulnerabilities | malware, botnets, phishing, insecure APIs, DNS attacks, MITM, human threats, physical threats, outdated systems, weak processes |
| Security | Threat mitigation | security settings, anti-malware, hardening, backups, MFA, access control, training, policies |
| Security | Effective security | interrelationships between CIA, IAAA and security controls |
| Occupational Specialism | Digital Software Development | requirements and acceptance criteria, design, implementation, testing, maintenance/support, collaboration, evaluation of sources, ethics and risk management |

Coverage reality from `/sources`:
- Strong teaching-content coverage: Problem Solving, Data, Emerging Issues, Legislation, Security.
- Weak direct teaching-content coverage: Introduction to Programming, Business Context, Digital Environments.
- Occupational Specialism appears as assessment/admin context, not as a full teaching library.

## 3. Exam and assessment extraction

### Exam structure

| Component | Duration | Marks | Weighting | What the sources say |
| --- | --- | --- | --- | --- |
| Core Paper 1 | 2h 15m | 90 | 30% of core | Written exam on topics 1-4: Problem Solving, Introduction to Programming, Emerging Issues, Legislation |
| Core Paper 2 | 2h 15m | 90 | 30% of core | Written exam on topics 5-8: Business Context, Data, Digital Environments, Security |
| Employer Set Project (ESP) | 14h 30m | 100 | 40% of core | Pre-release plus Task 1 planning, Task 2 defect fixing, Task 3 design, Task 4a development, Task 4b reflective evaluation |
| Occupational Specialism project | 50h 30m | 144 | 100% of OS | Synoptic scenario-based project with Task 1 analysing/designing, Task 2 developing, Task 3a gathering feedback, Task 3b evaluating feedback |

### Question styles evidenced

- Core papers are explicitly described as two-section written exams with:
  - short open response items
  - medium open response items
  - extended open response questions
- Students answer all questions in both sections.
- Demand ramps up through each section.
- Section B carries most application, analysis and evaluation.
- Materials repeatedly train scenario-to-concept matching:
  - identify the correct Big Data V from a scenario
  - choose the right data model for a scenario
  - assign suitable access rights to a role/data-asset scenario
  - decide suitable visualisation/model/format for a brief
- Worksheet prompts show practical written-response patterns:
  - explain why
  - justify your decision
  - describe clues
  - suggest a use case
  - complete the model/table
  - draw a diagram

### Answer expectations and marking clues

- Official command words are standardised in the specification, so the website helper should mirror Pearson wording exactly.
- `Identify` expects selection from context/stimulus, not open brainstorming.
- `Describe` expects linked points in logical order.
- `Explain` expects a point plus linked justification.
- `Explain with additional justification` expects a point, a linked reason, then a further reason.
- `Discuss` expects balanced consideration of factors in context; no conclusion required.
- `Evaluate` expects judgement supported by evidence, usually ending in a conclusion.
- `Draw` and `Complete` matter for diagrams, data models and process flows, not just prose answers.
- Core exam AO balance is not memory-heavy only:
  - Paper 1: AO2 application is 43.3%; AO3a analyse 13.3%; AO3b evaluate 10%.
  - Paper 2: AO2 application is 42.2%; AO3a analyse 13.3%; AO3b evaluate 10%.
- ESP outputs expected by the spec:
  - planning documentation
  - annotated digital portfolio
  - prototype digital product
  - testing evidence
  - evaluation
- Core ESP conditions matter:
  - supervised conditions
  - no internet access
  - no AI or other response-generation tools
- OS task evidence expected:
  - scenario response
  - portfolio evidence
  - application of skills rather than isolated knowledge recall
- Occupational Specialism conditions differ from the core ESP:
  - internet access is permitted for all OS tasks except task `3b`
  - the OS spec explicitly expects generative AI use in Task 1 Activity C for short code snippets only, not for producing one full end-to-end solution

### Revision relevance for the site

- The website should not be built around pure flashcards only.
- The assessment model strongly favours:
  - context application
  - structured reasoning
  - judgement with evidence
  - diagram/model construction
  - project-style response habits
- There is no evidence in the provided sources that multiple choice is a core Pearson format for this qualification.
- There is no evidence in the provided sources of fixed `6-mark / 9-mark / 12-mark` branding, even though extended responses clearly exist.

## 4. Command word system

| Command word | What the student is expected to do | What weak answers usually miss | Website helper tooltip |
| --- | --- | --- | --- |
| Give / State / Name | Provide the required fact, feature, use, characteristic or justification directly | Adding waffle instead of the exact item; giving a related idea instead of the requested one | `Answer directly. Usually one short, precise point is enough unless the stem asks for more.` |
| Identify | Select the correct answer from the context or stimulus | Ignoring the scenario and giving a generic textbook term | `Pick from the evidence in the question, not from memory alone.` |
| Write | Produce code from the given context/stimulus | Writing generic code not tied to the stated inputs/output or syntax errors | `Match the code to the scenario. Make inputs, outputs and logic explicit.` |
| Describe | Give linked points in a sensible order | Listing disconnected facts; no sequence or connection | `Use connected sentences. Show what it is or how it works in order.` |
| Explain | Make a point and link it to a reason | Naming the point only; no because-clause; no link to context | `Use the pattern: point -> because -> impact in this scenario.` |
| Explain with additional justification | Make the point, justify it, then deepen the justification | Stopping after one reason | `Use three steps: point -> reason -> further reason / consequence.` |
| Discuss | Consider factors on more than one side in context | One-sided answers; forced conclusion; no contextual factors | `Consider both sides or multiple factors. A final judgement is optional.` |
| Evaluate | Weigh strengths/weaknesses or pros/cons, then judge | Description without judgement; generic pros/cons; no final conclusion | `Judge the best option for this context. End with a supported conclusion.` |
| Draw | Produce a model/diagram/flow representation from the scenario | Missing labels, wrong notation, unclear relationships | `Show the structure visually. Label clearly and use the right conventions.` |
| Complete | Fill missing parts so the model/table/diagram becomes correct | Filling some gaps only; inconsistent or contradictory entries | `Every missing part must fit the full structure, not just one local box.` |
| Justify | Defend a choice using a reason tied to the scenario | Stating preference with no evidence | `Say why this choice fits this user, task or risk better than alternatives.` |
| Suggest | Offer a plausible and relevant option | Random ideas not grounded in the case | `Make a realistic proposal that solves the specific issue in the stem.` |
| Choose / Assign / Classify | Match a concept/category/permission/model to a given example | Correct label without rationale when rationale is required | `Match first, then support the match if the question asks why.` |

File evidence:
- Official taxonomy: `digital-dsd-specification.pdf`
- Strong worksheet verbs: `3-5-data-format-worksheet.pdf`, `3-7-big-data-worksheet.pdf`, `3-10-data-models-worksheet.pdf`, `3-11-access-control-worksheet.pdf`, `problem-solving-topic-lesson-plans.pdf`

## 5. Question type system

### Quick Q&A

- Scenario classification
  - Example: choose the correct Big Data V for a scenario.
  - Evidence: `3-7-big-data-worksheet.pdf`
  - Website use: timed classification cards with instant feedback.
- Format identification
  - Example: identify whether a snippet is JSON/XML/CSV/text.
  - Evidence: `3-5-data-format-worksheet.pdf`, `3-5-data-format-worksheet.csv`
  - Website use: quick recognition drills.
- Structured vs unstructured sorting
  - Example: drag items into the correct category.
  - Evidence: `3-4-data-cards.pptx`, `3-4-data-cards.xlsx`
  - Website use: drag/drop or tap-to-sort.
- Permission assignment
  - Example: assign read/write/admin/no-access.
  - Evidence: `3-11-access-control-worksheet.pdf`
  - Website use: matrix-fill exercises.
- Data cleaning / spotting issues
  - Example: find malformed emails, bad dates, bad casing, missing values.
  - Evidence: `3-2-messy-data-set.xlsx`, `3-8-data-wrangling-dataset.csv`, `3-8-2-data-wrangling-raw-data.csv`
  - Website use: fix-the-row microtasks.
- One-word / two-word retrieval
  - Supported by official `give/state/name/identify` wording and many classification prompts.
  - Evidence: `digital-dsd-specification.pdf`
  - Website use: glossary recall, definition-to-term drills.

### Written Answers

- Explain-from-scenario
  - Example: explain why the scenario matches a data model or Big Data V.
  - Evidence: `3-7-big-data-worksheet.pdf`, `3-10-data-models-worksheet.pdf`
- Describe clues / use case answers
  - Example: identify format, describe clues, suggest a real-world use.
  - Evidence: `3-5-data-format-worksheet.pdf`
- Justified decision responses
  - Example: justify access level decisions.
  - Evidence: `3-11-access-control-worksheet.pdf`
- Compare / discuss / evaluate responses
  - Supported by official command taxonomy and content areas that ask for suitability judgements.
  - Evidence: `digital-dsd-specification.pdf`, `digital-software-development-content-depth-guide.pdf`
- Draw / complete model answers
  - Example: draw a data model, complete a diagram, create a flowchart.
  - Evidence: `3-10-data-models-worksheet.pdf`, `problem-solving-topic-lesson-plans.pdf`
- Write-code / algorithm responses
  - Explicitly supported by `Write` command word and problem-solving/OS materials.
  - Evidence: `digital-dsd-specification.pdf`, `problem-solving-topic-lesson-plans.pdf`
- Reflective evaluation
  - Explicit ESP and OS task type.
  - Evidence: `digital-dsd-specification.pdf`, planners

### Past Paper Practice

- Core paper practice by section style
  - short open response
  - medium open response
  - extended open response
  - Evidence: `digital-dsd-specification.pdf`
- Scenario/context-based paper practice
  - match, judge, justify, evaluate against business/technical context
  - Evidence: spec + worksheets
- ESP practice mode
  - Task 1 planning
  - Task 2 defect fixing
  - Task 3 design
  - Task 4a development
  - Task 4b reflective evaluation
  - Evidence: `digital-dsd-specification.pdf`, curriculum planners
- Occupational Specialism practice mode
  - analyse/design, develop, gather feedback, evaluate feedback
  - Evidence: `digital-dsd-specification.pdf`, curriculum planners

Coverage gaps:
- Multiple choice: not evidenced in the provided sources.
- Fixed 6-mark / 9-mark / 12-mark branding: not evidenced in the provided sources.
- Actual SAM or past paper files: referenced by planners, not present in `/sources`.

## 6. Product translation

### Sidebar structure

- Overview
- How This Qualification Works
- Exam Structure
- Command Words
- Core Topics
- Problem Solving
- Introduction to Programming
- Emerging Issues
- Legislation and Regulatory Requirements
- Business Context
- Data
- Digital Environments
- Security
- Employer Set Project
- Occupational Specialism
- Practice
- Quick Q&A
- Written Answers
- Scenario Practice
- Past Paper Mode
- Library

Implementation note:
- Only Problem Solving, Data, Emerging Issues, Legislation and Security should launch with deep content.
- Introduction to Programming, Business Context and Digital Environments should exist as shell sections populated from spec/content-guide summaries first, then expanded later.

### Library structure

- Source of truth
  - Specification summary
  - Content depth guide summary
  - Assessment structure summary
- Topic libraries
  - Problem Solving
  - Data
  - Emerging Issues
  - Legislation
  - Security
- Exercise assets
  - datasets
  - answer keys
  - worksheets
  - scenario banks
- Assessment library
  - core papers overview
  - ESP task breakdown
  - OS task breakdown

### Revision modes

- Learn mode
  - topic notes rewritten from spec + slide decks
- Quick drill mode
  - identify / classify / sort / define
- Scenario mode
  - choose + justify + explain
- Written answer mode
  - describe / explain / discuss / evaluate
- Diagram mode
  - flowcharts, data models, table completion
- Data practice mode
  - wrangling, cleaning, format recognition, visualisation choice
- Project mode
  - ESP workflow and OS workflow practice

### Command word helper structure

- Official Pearson command words first
- Each helper card should include:
  - plain-English expectation
  - answer frame
  - common weak-answer mistake
  - 1 mini example
- Additional non-taxonomy helpers should sit under `Worksheet verbs`
  - justify
  - suggest
  - choose / assign / classify

### Past paper mode structure

- Core Paper 1 mode
  - topics 1-4
  - short, medium, extended open response
- Core Paper 2 mode
  - topics 5-8
  - short, medium, extended open response
- Scenario bank mode
  - use worksheet scenarios as pseudo-paper items
- ESP mode
  - task-by-task practice with response templates
- OS mode
  - scenario, build, feedback, evaluation sequence

Constraint:
- Do not market this as true past-paper mode until real SAM/past-paper files are added.
- Current materials support `past-paper-style` practice, not authenticated past-paper content.

## 7. Final extraction for implementation

### Must become sidebar items

- Exam Structure
- Command Words
- Problem Solving
- Data
- Emerging Issues
- Legislation and Regulatory Requirements
- Security
- Employer Set Project
- Occupational Specialism
- Practice

### Must become library content

- Specification summary
- Content depth topic summaries
- Data topic library from 3.1 to 3.12
- Problem solving concept library
- Security threats/mitigation library
- Legislation and emerging issues summaries

### Must become revision exercises

- Format identification drills
- Big Data V scenario matching
- Data model selection and sketching
- Access control matrix decisions
- Data wrangling cleanup tasks
- Visualisation choice tasks
- Flowchart / algorithm construction tasks

### Must become helper/tooltips

- Official command word definitions
- `point -> because -> impact` explain scaffold
- `pros/cons -> judgement` evaluate scaffold
- diagram conventions for flowcharts/data models
- common mistakes for justify / discuss / identify

### Must be ignored for now

- Teacher/admin trackers in zip files
- delivery-pack onboarding deck
- external resource-links pack as core revision content
- any assumption that the sources include real past papers
- any assumption that multiple choice is a main official exam format
