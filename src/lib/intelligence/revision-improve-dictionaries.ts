export interface RevisionWeakPhraseRule {
  phrase: string;
  replacementHint: string;
  reason: string;
  microRewriteText?: string;
}

export const TOPIC_WEAK_PHRASE_DICTIONARIES: Record<string, RevisionWeakPhraseRule[]> = {
  "problem-solving": [
    {
      phrase: "solve it",
      replacementHint: "State the requirement, constraint, or user need the solution must address.",
      reason: "Problem-solving marks depend on defining the problem before proposing a solution.",
      microRewriteText: "meet the requirement",
    },
    {
      phrase: "what users want",
      replacementHint: "Turn this into a measurable requirement or acceptance criterion.",
      reason: "User needs should be testable, not loosely described.",
      microRewriteText: "user requirement",
    },
    {
      phrase: "best method",
      replacementHint: "Justify the method by change rate, risk, documentation, or feedback needs.",
      reason: "Methodology choices need context, not preference.",
      microRewriteText: "best-fit method",
    },
    {
      phrase: "good plan",
      replacementHint: "Name the milestone, dependency, or acceptance point that makes the plan useful.",
      reason: "Planning answers score better when they show control points.",
      microRewriteText: "controlled plan",
    },
    {
      phrase: "works for users",
      replacementHint: "State the exact user task, accessibility need, or workflow improvement.",
      reason: "User-fit claims need a named outcome.",
      microRewriteText: "fits user needs",
    },
  ],
  "intro-programming": [
    {
      phrase: "check it",
      replacementHint: "Name the exact validation rule or condition being checked.",
      reason: "Programming answers should name the specific validation logic.",
      microRewriteText: "validate it",
    },
    {
      phrase: "fix it",
      replacementHint: "State the handling step, such as retrying input or showing an error.",
      reason: "Error-handling answers need a concrete response, not a vague fix.",
      microRewriteText: "handle it safely",
    },
    {
      phrase: "stop errors",
      replacementHint: "Explain whether the code prevents invalid input, traps an exception, or prompts the user to correct the value.",
      reason: "Programming answers need a named control point, not a vague promise.",
      microRewriteText: "prevent invalid input",
    },
    {
      phrase: "test it",
      replacementHint: "Name the test type or test data being used and what it proves.",
      reason: "Testing marks usually depend on the method and evidence, not only the intention.",
      microRewriteText: "run test cases",
    },
    {
      phrase: "check if it works",
      replacementHint: "State the exact test data or success condition instead of a general check.",
      reason: "Programming answers need evidence of what is being verified.",
      microRewriteText: "verify expected output",
    },
    {
      phrase: "use a loop",
      replacementHint: "Explain why iteration fits the repeated logic better than a one-off structure.",
      reason: "Naming a construct alone does not justify the programming choice.",
      microRewriteText: "use iteration",
    },
    {
      phrase: "make it easier",
      replacementHint: "Explain whether the code becomes easier to test, maintain, read, or reuse.",
      reason: "Maintainability benefits need a named technical outcome.",
      microRewriteText: "improve maintainability",
    },
    {
      phrase: "use variables",
      replacementHint: "Explain what data the variable stores and why that matters to the logic.",
      reason: "Programming answers need a reason for using variables, not just a feature list.",
      microRewriteText: "store state",
    },
    {
      phrase: "use a function",
      replacementHint: "Explain whether the function improves reuse, readability, testing, or maintenance.",
      reason: "A function only earns marks when it is justified by structure or reuse.",
      microRewriteText: "reuse logic",
    },
  ],
  "emerging-issues": [
    {
      phrase: "new technology",
      replacementHint: "Name the exact technology and the capability or risk it creates.",
      reason: "Emerging-technology answers need the specific innovation, not a vague label.",
      microRewriteText: "emerging technology",
    },
    {
      phrase: "future proof",
      replacementHint: "Explain what future change or scaling need the design is prepared for.",
      reason: "Future-proofing claims need a named change driver.",
      microRewriteText: "support future change",
    },
    {
      phrase: "uses ai",
      replacementHint: "Explain what the AI does and one risk such as bias, opacity, or over-reliance.",
      reason: "AI references need both function and caution.",
      microRewriteText: "uses AI support",
    },
    {
      phrase: "smart devices",
      replacementHint: "Name the sensor, connectivity, or data flow that makes the device useful.",
      reason: "IoT-style answers need the mechanism, not only the label.",
      microRewriteText: "connected devices",
    },
    {
      phrase: "more innovative",
      replacementHint: "Replace this with a practical gain such as automation, insight, or responsiveness.",
      reason: "Innovation claims do not score unless the improvement is explained.",
      microRewriteText: "more adaptive",
    },
  ],
  legislation: [
    {
      phrase: "legal",
      replacementHint: "Name the regulation, standard, or licensing rule that applies.",
      reason: "Legal points need the exact framework, not a generic label.",
      microRewriteText: "regulatory",
    },
    {
      phrase: "ethical",
      replacementHint: "Explain the fairness, privacy, accessibility, or accountability issue involved.",
      reason: "Ethical claims need a clear value or impact statement.",
      microRewriteText: "fair and accountable",
    },
    {
      phrase: "protect data",
      replacementHint: "State the control or duty that protects data, such as minimisation, consent, or access control.",
      reason: "Data-protection answers need both a requirement and a control.",
      microRewriteText: "protect personal data",
    },
    {
      phrase: "allowed to use",
      replacementHint: "Explain the permission, licence, or ownership basis for using it.",
      reason: "Using third-party content or code requires a legal basis.",
      microRewriteText: "licensed to use",
    },
    {
      phrase: "accessible",
      replacementHint: "Name the design feature or standard that makes it accessible.",
      reason: "Accessibility should be shown through design action, not just intention.",
      microRewriteText: "standards-compliant",
    },
  ],
  business: [
    {
      phrase: "helps the business",
      replacementHint: "Replace this with a named business effect like continuity, trust, or productivity.",
      reason: "Business impact needs a clear operational effect.",
      microRewriteText: "supports continuity",
    },
    {
      phrase: "users like it",
      replacementHint: "Explain the adoption, confidence, or training outcome instead of generic approval.",
      reason: "User reaction is too vague without an adoption or productivity outcome.",
      microRewriteText: "improves adoption",
    },
    {
      phrase: "saves money",
      replacementHint: "State how cost is reduced, such as lower downtime, reduced support load, or less duplicated work.",
      reason: "Business value claims need the operational mechanism behind the saving.",
      microRewriteText: "reduces downtime cost",
    },
    {
      phrase: "better for the company",
      replacementHint: "Name the specific business gain, such as continuity, trust, compliance, or staff productivity.",
      reason: "Generic business praise does not show exam precision.",
      microRewriteText: "improves continuity",
    },
    {
      phrase: "roll it out",
      replacementHint: "Name the rollout method and justify it by continuity, disruption, or training risk.",
      reason: "Change-management answers need a specific rollout strategy.",
      microRewriteText: "phase the rollout",
    },
    {
      phrase: "train staff",
      replacementHint: "Explain what training prevents or improves, such as errors, confidence, or adoption.",
      reason: "Training only scores well when linked to a business outcome.",
      microRewriteText: "prepare staff",
    },
    {
      phrase: "less risky",
      replacementHint: "Name the risk reduced, such as downtime, resistance, data loss, or support overload.",
      reason: "Risk reduction needs the exact business risk, not a vague reassurance.",
      microRewriteText: "reduces disruption risk",
    },
    {
      phrase: "better for staff",
      replacementHint: "Explain the productivity, confidence, workload, or error-reduction effect on staff.",
      reason: "Staff benefit claims need the operational result.",
      microRewriteText: "reduces staff friction",
    },
    {
      phrase: "better for customers",
      replacementHint: "State the customer outcome, such as faster service, trust, or fewer failed interactions.",
      reason: "Customer impact should be concrete and measurable.",
      microRewriteText: "improves customer trust",
    },
  ],
  "digital-environments": [
    {
      phrase: "runs better",
      replacementHint: "Name the environment gain, such as scalability, resilience, or manageability.",
      reason: "Infrastructure answers should name the technical benefit precisely.",
      microRewriteText: "scales better",
    },
    {
      phrase: "stays online",
      replacementHint: "Link this to failover, redundancy, or load balancing explicitly.",
      reason: "Availability needs a named mechanism, not only the outcome.",
      microRewriteText: "maintains availability",
    },
    {
      phrase: "more reliable",
      replacementHint: "Explain whether reliability comes from redundancy, failover, monitoring, or controlled recovery.",
      reason: "Environment answers should identify the mechanism, not only the result.",
      microRewriteText: "more resilient",
    },
    {
      phrase: "works in the cloud",
      replacementHint: "Name the cloud characteristic that matters here, such as elasticity, managed services, or remote access.",
      reason: "Cloud statements need the property or trade-off that justifies the choice.",
      microRewriteText: "uses cloud elasticity",
    },
    {
      phrase: "connect devices",
      replacementHint: "Explain which component, service, or protocol provides the connection and why it matters.",
      reason: "Networking answers should name the mechanism, not just the outcome.",
      microRewriteText: "provide connectivity",
    },
    {
      phrase: "send data",
      replacementHint: "Name the protocol or service moving the data and the role it plays in the environment.",
      reason: "Environment answers need the actual network or platform mechanism.",
      microRewriteText: "transmit packets",
    },
    {
      phrase: "more powerful",
      replacementHint: "Replace this with a technical gain such as higher throughput, resilience, or scalability.",
      reason: "Infrastructure claims should point to a measurable environment benefit.",
      microRewriteText: "more scalable",
    },
    {
      phrase: "host it online",
      replacementHint: "Name the hosting model or managed platform and explain why it suits the workload.",
      reason: "Deployment answers need the platform rationale.",
      microRewriteText: "host on managed infrastructure",
    },
    {
      phrase: "backup system",
      replacementHint: "Explain whether you mean backup, redundancy, failover, or disaster recovery.",
      reason: "Environment answers often lose marks by merging different resilience ideas.",
      microRewriteText: "resilient backup plan",
    },
  ],
  data: [
    {
      phrase: "stores data",
      replacementHint: "State how the structure, format, or model stores it and why that matters.",
      reason: "Data answers need the mechanism behind the storage choice.",
      microRewriteText: "stores structured records",
    },
    {
      phrase: "keeps it accurate",
      replacementHint: "Name the control that protects integrity, such as validation, constraints, or permissions.",
      reason: "Accuracy claims score better when linked to a named control.",
      microRewriteText: "protects integrity",
    },
    {
      phrase: "big data",
      replacementHint: "Name the relevant V, scale issue, or processing challenge instead of using it loosely.",
      reason: "Big-data marks come from the characteristic or consequence, not the buzzword.",
      microRewriteText: "high-volume data",
    },
    {
      phrase: "clean the data",
      replacementHint: "Explain the wrangling step, such as deduplication, validation, or standardisation.",
      reason: "Data cleaning needs the actual operation, not just the goal.",
      microRewriteText: "standardise the data",
    },
    {
      phrase: "show trends",
      replacementHint: "State what metric, pattern, or comparison the visualisation reveals.",
      reason: "Visualisation answers need the decision-making value.",
      microRewriteText: "show patterns",
    },
    {
      phrase: "manage access",
      replacementHint: "Name the role-based rule, permission level, or least-privilege control.",
      reason: "Data-governance answers need the access model.",
      microRewriteText: "apply role-based access",
    },
  ],
  security: [
    {
      phrase: "keeps it safe",
      replacementHint: "Name the control, attack, or security property instead of a generic safety claim.",
      reason: "Security answers need the exact protection mechanism.",
      microRewriteText: "reduces attack risk",
    },
    {
      phrase: "stops hackers",
      replacementHint: "Explain which threat is reduced and how the control disrupts it.",
      reason: "Threat mitigation marks depend on attack-control linkage.",
      microRewriteText: "blocks unauthorised access",
    },
    {
      phrase: "log in",
      replacementHint: "Explain whether you mean authentication, authorisation, or both.",
      reason: "Security answers often lose precision by merging identity checks with permission checks.",
      microRewriteText: "authenticate users",
    },
    {
      phrase: "encrypted",
      replacementHint: "State whether the data is protected in transit or at rest and why that matters.",
      reason: "Encryption claims need the protection context.",
      microRewriteText: "encrypted in transit",
    },
    {
      phrase: "secure password",
      replacementHint: "Name the policy or control, such as length, hashing, MFA, or lockout.",
      reason: "Password-security answers need the actual control mechanism.",
      microRewriteText: "hashed password",
    },
  ],
  esp: [
    {
      phrase: "meet the brief",
      replacementHint: "Turn this into a specific requirement, deliverable, or acceptance criterion from the client brief.",
      reason: "Employer-set answers score better when they anchor to the stated brief.",
      microRewriteText: "meet the requirement",
    },
    {
      phrase: "good solution",
      replacementHint: "Explain what makes it fit for the users, data, workflow, or constraints.",
      reason: "Generic praise does not show project-specific understanding.",
      microRewriteText: "fit-for-purpose solution",
    },
    {
      phrase: "for the client",
      replacementHint: "State the client goal, operational benefit, or risk that matters here.",
      reason: "ESP answers should tie decisions to the client context.",
      microRewriteText: "for the client goal",
    },
    {
      phrase: "works well",
      replacementHint: "Support this with testing evidence, feedback, or a measurable outcome.",
      reason: "Performance claims need evidence in a project answer.",
      microRewriteText: "meets expected outcome",
    },
    {
      phrase: "change it later",
      replacementHint: "Explain how maintenance, change control, or iteration would be managed safely.",
      reason: "Future changes need process, not just intent.",
      microRewriteText: "manage later changes",
    },
  ],
};
