import type { RevisionQuestionSchema } from "../types";

export const REVISION_QUESTION_SCHEMAS: RevisionQuestionSchema[] = [
  {
    id: "problem-solving-decomposition-abstraction",
    topicId: "problem-solving",
    subtopicId: "1.1",
    prompt:
      "Explain how decomposition and abstraction help when designing a solution to a complex programming problem.",
    maxScore: 6,
    rubricSummary: [
      "Explain that decomposition breaks a large problem into smaller parts.",
      "Explain that abstraction removes irrelevant detail and focuses on what matters.",
      "Link both techniques to easier design, testing, or maintenance.",
    ],
    concepts: [
      {
        id: "decomposition-breakdown",
        label: "Decomposition into manageable parts",
        weight: 2,
        feedback: "that decomposition splits the problem into smaller parts",
        requiredGroups: [
          { anyOf: ["decomposition", "break down", "split up"] },
          { anyOf: ["smaller parts", "smaller tasks", "manageable pieces", "sub problems"] },
        ],
      },
      {
        id: "abstraction-focus",
        label: "Abstraction focuses on relevant detail",
        weight: 2,
        feedback: "that abstraction focuses on relevant detail",
        requiredGroups: [
          { anyOf: ["abstraction", "abstract"] },
          { anyOf: ["ignore irrelevant detail", "remove unnecessary detail", "focus on relevant detail"] },
        ],
      },
      {
        id: "design-benefit",
        label: "Design or testing becomes easier",
        weight: 2,
        feedback: "the benefit to design, testing, or maintenance",
        requiredGroups: [
          { anyOf: ["easier to design", "easier to test", "easier to maintain", "more manageable"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "abstraction-adds-detail",
        label: "Abstraction adds extra detail",
        penalty: 1,
        explanation: "Abstraction removes irrelevant detail. It does not add extra detail to the model.",
        groups: [{ anyOf: ["abstraction adds detail", "abstraction includes every detail"] }],
      },
    ],
  },
  {
    id: "problem-solving-trace-tables",
    topicId: "problem-solving",
    subtopicId: "1.2",
    prompt:
      "Explain why trace tables are useful when checking an algorithm.",
    maxScore: 6,
    rubricSummary: [
      "Explain that a trace table follows each variable or step in order.",
      "Explain that it helps reveal logic errors or unexpected results.",
      "Link it to testing, debugging, or checking whether an algorithm works correctly.",
    ],
    concepts: [
      {
        id: "trace-follows-steps",
        label: "Trace tables follow steps and values in order",
        weight: 2,
        feedback: "that a trace table records each step or variable value in sequence",
        requiredGroups: [
          { anyOf: ["trace table", "trace tables"] },
          { anyOf: ["step by step", "each step", "in order", "variable values", "track values"] },
        ],
      },
      {
        id: "trace-finds-errors",
        label: "Trace tables help reveal logic errors",
        weight: 2,
        feedback: "that trace tables help spot logic mistakes or wrong results",
        requiredGroups: [
          { anyOf: ["find errors", "spot errors", "logic error", "mistake", "bug", "unexpected result", "wrong output"] },
        ],
      },
      {
        id: "trace-supports-testing",
        label: "Trace tables support testing or debugging",
        weight: 2,
        feedback: "the testing or debugging benefit",
        requiredGroups: [
          { anyOf: ["testing", "debugging", "check algorithm", "check whether it works", "verify the algorithm"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "trace-runs-code",
        label: "A trace table automatically runs the code",
        penalty: 1,
        explanation: "A trace table is a checking method used by a human. It helps simulate the logic, but it does not execute the program by itself.",
        groups: [{ anyOf: ["trace table runs the code", "trace table executes the program"] }],
      },
    ],
  },
  {
    id: "intro-programming-validation",
    topicId: "intro-programming",
    subtopicId: "2.6",
    prompt:
      "Explain why selection and iteration are useful in a program that validates user input.",
    maxScore: 6,
    rubricSummary: [
      "Explain that selection checks whether input meets a condition.",
      "Explain that iteration repeats the check until valid input is entered.",
      "Link this to preventing invalid data or improving robustness.",
    ],
    concepts: [
      {
        id: "selection-checks-condition",
        label: "Selection checks whether input is valid",
        weight: 2,
        feedback: "that selection is used to test a condition",
        requiredGroups: [
          { anyOf: ["selection", "if statement", "if else"] },
          { anyOf: ["check condition", "test input", "validate input", "is valid"] },
        ],
      },
      {
        id: "iteration-repeats",
        label: "Iteration repeats until valid input is given",
        weight: 2,
        feedback: "that iteration repeats the validation",
        requiredGroups: [
          { anyOf: ["iteration", "loop", "repeat"] },
          { anyOf: ["until valid", "until correct", "keep asking", "repeat input"] },
        ],
      },
      {
        id: "robustness-benefit",
        label: "Validation prevents invalid data",
        weight: 2,
        feedback: "the effect on robustness or data quality",
        requiredGroups: [
          { anyOf: ["prevent invalid data", "stop bad data", "improve robustness", "reduce errors"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "loop-runs-once",
        label: "Iteration only runs once",
        penalty: 1,
        explanation: "Iteration means repeating a block while a condition still applies. It is not the same as a one-off check.",
        groups: [{ anyOf: ["loop runs once", "iteration happens once"] }],
      },
    ],
  },
  {
    id: "intro-programming-validation-error-handling",
    topicId: "intro-programming",
    subtopicId: "2.6",
    prompt:
      "Explain why validation and error handling both matter in a program that accepts user input.",
    maxScore: 6,
    rubricSummary: [
      "Explain that validation checks whether input is acceptable before it is used.",
      "Explain that error handling deals with unexpected problems while the program is running.",
      "Link both to robustness, fewer crashes, or better data quality.",
    ],
    concepts: [
      {
        id: "validation-checks-input",
        label: "Validation checks input before processing",
        weight: 2,
        feedback: "that validation checks whether input is acceptable",
        requiredGroups: [
          { anyOf: ["validation", "validate", "validation check"] },
          { anyOf: ["check input", "acceptable input", "correct format", "before processing", "before use"] },
        ],
      },
      {
        id: "error-handling-manages-problems",
        label: "Error handling deals with unexpected problems",
        weight: 2,
        feedback: "that error handling manages unexpected runtime problems",
        requiredGroups: [
          { anyOf: ["error handling", "exception handling", "try except", "catch errors"] },
          { anyOf: ["unexpected problem", "runtime problem", "stop crash", "handle errors"] },
        ],
      },
      {
        id: "robustness-data-quality",
        label: "Together they improve robustness or data quality",
        weight: 2,
        feedback: "the combined benefit to robustness or data quality",
        requiredGroups: [
          { anyOf: ["robustness", "fewer crashes", "prevent bad data", "data quality", "reliable", "reduce errors"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "validation-equals-error-handling",
        label: "Validation and error handling are the same thing",
        penalty: 1,
        explanation: "Validation checks whether input should be accepted. Error handling deals with unexpected problems while the program is running. They work together but are not the same.",
        groups: [{ anyOf: ["validation is the same as error handling", "error handling just means validation"] }],
      },
    ],
  },
  {
    id: "emerging-issues-ai",
    topicId: "emerging-issues",
    subtopicId: "3.2",
    prompt:
      "Explain one benefit and one ethical risk of using AI in an organisation.",
    maxScore: 6,
    rubricSummary: [
      "Explain one realistic benefit such as automation, efficiency, or improved decision support.",
      "Explain one ethical risk such as bias, privacy, accountability, or job displacement.",
      "Show that organisations need oversight or responsible use.",
    ],
    concepts: [
      {
        id: "ai-benefit",
        label: "AI can improve efficiency or automation",
        weight: 2,
        feedback: "a realistic benefit of AI",
        requiredGroups: [
          { anyOf: ["ai", "artificial intelligence"] },
          { anyOf: ["automation", "efficiency", "faster decisions", "decision support", "save time"] },
        ],
      },
      {
        id: "ethical-risk",
        label: "AI introduces an ethical risk",
        weight: 2,
        feedback: "an ethical risk such as bias or privacy",
        requiredGroups: [
          { anyOf: ["bias", "privacy", "accountability", "job loss", "job displacement", "surveillance"] },
        ],
      },
      {
        id: "oversight",
        label: "Responsible oversight is needed",
        weight: 2,
        feedback: "the need for oversight or human review",
        requiredGroups: [
          { anyOf: ["human oversight", "monitoring", "review outputs", "responsible use", "policies"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "ai-no-risk",
        label: "AI has no ethical risk",
        penalty: 1,
        explanation: "AI systems can create ethical issues such as bias, privacy problems, or poor accountability if they are left unchecked.",
        groups: [{ anyOf: ["ai has no risk", "ai is always fair", "ai is unbiased by default"] }],
      },
    ],
  },
  {
    id: "emerging-issues-biometrics",
    topicId: "emerging-issues",
    subtopicId: "3.1",
    prompt:
      "Discuss whether biometrics are a safe and fair way to control access to a system.",
    maxScore: 6,
    rubricSummary: [
      "Explain one benefit such as convenience, stronger identity checks, or harder credential sharing.",
      "Explain one risk such as privacy loss, false matches, exclusion, or bias.",
      "Reach a balanced conclusion about when biometrics are or are not a good choice.",
    ],
    concepts: [
      {
        id: "biometric-benefit",
        label: "Biometrics can improve security or convenience",
        weight: 2,
        feedback: "a realistic benefit of biometrics",
        requiredGroups: [
          { anyOf: ["biometric", "biometrics", "fingerprint", "face recognition"] },
          { anyOf: ["convenient", "harder to share", "stronger identity check", "faster login", "more secure"] },
        ],
      },
      {
        id: "biometric-risk",
        label: "Biometrics can create fairness or privacy risks",
        weight: 2,
        feedback: "a genuine privacy, fairness, or accuracy risk",
        requiredGroups: [
          { anyOf: ["privacy", "bias", "false match", "false rejection", "exclusion", "surveillance", "sensitive data"] },
        ],
      },
      {
        id: "balanced-judgement",
        label: "The answer reaches a balanced judgement",
        weight: 2,
        feedback: "a balanced conclusion about when biometrics are suitable",
        requiredGroups: [
          { anyOf: ["depends", "balanced", "in some cases", "good choice if", "only if", "judgement", "conclusion"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "biometrics-perfect",
        label: "Biometrics are always accurate and impossible to misuse",
        penalty: 1,
        explanation: "Biometric systems can still produce errors, exclude some users, or create privacy concerns if they are poorly chosen or badly managed.",
        groups: [{ anyOf: ["biometrics are always accurate", "biometrics cannot be abused", "biometrics are always fair"] }],
      },
    ],
  },
  {
    id: "legislation-data-protection",
    topicId: "legislation",
    subtopicId: "4.1",
    prompt:
      "A company stores customer details online. Explain two responsibilities it has under data protection law.",
    maxScore: 6,
    rubricSummary: [
      "Explain that personal data must be processed lawfully and fairly.",
      "Explain that data must be kept secure and access-controlled.",
      "Explain another valid responsibility such as accuracy, retention limits, or limited sharing.",
    ],
    concepts: [
      {
        id: "lawful-processing",
        label: "Personal data must be processed lawfully",
        weight: 2,
        feedback: "lawful and fair processing of personal data",
        requiredGroups: [
          { anyOf: ["personal data", "customer details", "customer data"] },
          { anyOf: ["lawfully", "fairly", "legal basis", "consent"] },
        ],
      },
      {
        id: "secure-storage",
        label: "Data must be kept secure",
        weight: 2,
        feedback: "secure storage and controlled access",
        requiredGroups: [
          { anyOf: ["secure", "protected", "restricted access", "access control", "encrypted"] },
        ],
      },
      {
        id: "retention-accuracy",
        label: "Data should be accurate and not kept longer than needed",
        weight: 2,
        feedback: "accuracy or retention responsibilities",
        requiredGroups: [
          { anyOf: ["accurate", "up to date", "not kept longer than necessary", "retention", "delete when no longer needed"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "internal-exemption",
        label: "Internal storage is exempt from data protection law",
        penalty: 1,
        explanation: "Data protection responsibilities still apply when a company stores personal data internally or in the cloud.",
        groups: [{ anyOf: ["internal data does not count", "law does not apply inside company"] }],
      },
    ],
  },
  {
    id: "legislation-copyright-licensing",
    topicId: "legislation",
    subtopicId: "4.1",
    prompt:
      "Explain why a company must think about copyright and licensing before using third-party code or media.",
    maxScore: 6,
    rubricSummary: [
      "Explain that code, images, audio, and similar assets are protected by copyright or licensing terms.",
      "Explain that permission, attribution, or the correct licence may be required before use.",
      "Link this to legal risk, removal of content, cost, or reputational damage if the rules are ignored.",
    ],
    concepts: [
      {
        id: "third-party-protected",
        label: "Third-party code and media are protected by rights or licence terms",
        weight: 2,
        feedback: "that third-party assets are protected by copyright or licence terms",
        requiredGroups: [
          { anyOf: ["copyright", "licence", "licensing", "intellectual property", "protected"] },
          { anyOf: ["third party code", "third party media", "code from someone else", "images", "audio", "assets"] },
        ],
      },
      {
        id: "permission-or-attribution",
        label: "Permission or the correct licence terms may be needed",
        weight: 2,
        feedback: "that the team needs permission, attribution, or the right licence",
        requiredGroups: [
          { anyOf: ["permission", "authorisation", "correct licence", "licence terms", "attribution", "credit the creator"] },
        ],
      },
      {
        id: "legal-business-risk",
        label: "Ignoring the rules creates legal or business risk",
        weight: 2,
        feedback: "the legal, cost, or reputation risk",
        requiredGroups: [
          { anyOf: ["legal action", "fine", "removed", "take down", "cost", "reputation", "reputational damage"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "internet-free-to-use",
        label: "Anything found online is free to use",
        penalty: 1,
        explanation: "Material being easy to find online does not remove copyright or licensing obligations.",
        groups: [{ anyOf: ["everything online is free to use", "if it is online it is public domain"] }],
      },
    ],
  },
  {
    id: "business-change-training",
    topicId: "business",
    subtopicId: "5.3",
    prompt:
      "Explain why staff training matters during a digital change rollout.",
    maxScore: 6,
    rubricSummary: [
      "Explain that training helps staff use the new system correctly.",
      "Explain that training reduces resistance, mistakes, or downtime.",
      "Link training to adoption, productivity, or business continuity.",
    ],
    concepts: [
      {
        id: "correct-usage",
        label: "Training helps staff use the system correctly",
        weight: 2,
        feedback: "that training supports correct system use",
        requiredGroups: [
          { anyOf: ["training", "staff training", "user training"] },
          { anyOf: ["use correctly", "use the system", "understand the system", "learn how to use"] },
        ],
      },
      {
        id: "reduce-errors-resistance",
        label: "Training reduces mistakes or resistance",
        weight: 2,
        feedback: "that training reduces errors or resistance",
        requiredGroups: [
          { anyOf: ["reduce errors", "fewer mistakes", "less resistance", "more confidence", "less disruption"] },
        ],
      },
      {
        id: "adoption-benefit",
        label: "Training improves rollout success",
        weight: 2,
        feedback: "the business benefit from stronger adoption",
        requiredGroups: [
          { anyOf: ["better adoption", "higher productivity", "business continuity", "smoother rollout", "less downtime"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "training-wastes-time",
        label: "Training is unnecessary overhead",
        penalty: 1,
        explanation: "Skipping training usually increases confusion, mistakes, and resistance during a rollout.",
        groups: [{ anyOf: ["training is a waste of time", "users should just figure it out"] }],
      },
    ],
  },
  {
    id: "business-change-rollback",
    topicId: "business",
    subtopicId: "5.3",
    prompt:
      "Explain why rollback or fallback planning matters during a system change.",
    maxScore: 6,
    rubricSummary: [
      "Explain that a rollback or fallback plan gives the team a safe option if the release fails.",
      "Explain that it reduces downtime, disruption, or data loss.",
      "Link the plan to business continuity, user confidence, or safer change management.",
    ],
    concepts: [
      {
        id: "rollback-safe-option",
        label: "Rollback or fallback gives the team a safe recovery option",
        weight: 2,
        feedback: "that rollback or fallback gives the team a way back if the change fails",
        requiredGroups: [
          { anyOf: ["rollback", "roll back", "fallback", "revert", "return to previous version"] },
          { anyOf: ["if it fails", "if release fails", "recovery option", "safe option"] },
        ],
      },
      {
        id: "reduced-disruption",
        label: "Rollback planning reduces disruption or data loss",
        weight: 2,
        feedback: "that rollback planning reduces downtime, disruption, or data loss",
        requiredGroups: [
          { anyOf: ["downtime", "disruption", "data loss", "service outage", "fewer problems", "less impact"] },
        ],
      },
      {
        id: "continuity-confidence",
        label: "Rollback planning protects continuity and confidence",
        weight: 2,
        feedback: "the business continuity or trust benefit",
        requiredGroups: [
          { anyOf: ["business continuity", "keep service running", "user confidence", "customer trust", "safer release", "change management"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "rollback-no-testing",
        label: "Rollback planning means the team can skip careful testing",
        penalty: 1,
        explanation: "Rollback planning is a safety measure. It does not remove the need for proper testing, communication, and controlled release.",
        groups: [{ anyOf: ["no need to test if you can roll back", "rollback replaces testing"] }],
      },
    ],
  },
  {
    id: "data-keys-relationships",
    topicId: "data",
    subtopicId: "6.3",
    prompt:
      "Explain why a relational database uses primary keys and foreign keys.",
    maxScore: 6,
    rubricSummary: [
      "Explain that a primary key uniquely identifies each record.",
      "Explain that a foreign key links related tables together.",
      "Link keys to integrity, consistency, or reduced duplication.",
    ],
    concepts: [
      {
        id: "primary-key-unique",
        label: "Primary keys uniquely identify records",
        weight: 2,
        feedback: "the role of a primary key",
        requiredGroups: [
          { anyOf: ["primary key"] },
          { anyOf: ["unique", "uniquely identify", "one record", "single record"] },
        ],
      },
      {
        id: "foreign-key-links",
        label: "Foreign keys connect related tables",
        weight: 2,
        feedback: "the role of a foreign key",
        requiredGroups: [
          { anyOf: ["foreign key"] },
          { anyOf: ["link tables", "connect tables", "relationship", "related tables"] },
        ],
      },
      {
        id: "integrity-benefit",
        label: "Keys support integrity and consistency",
        weight: 2,
        feedback: "the integrity or consistency benefit",
        requiredGroups: [
          { anyOf: ["integrity", "consistency", "avoid duplication", "reduce duplication", "accurate relationships"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "foreign-key-unique",
        label: "A foreign key must be unique like a primary key",
        penalty: 1,
        explanation: "A foreign key links related records. It does not need to be unique in the same way as a primary key.",
        groups: [{ anyOf: ["foreign key is unique", "foreign key uniquely identifies every record"] }],
      },
    ],
  },
  {
    id: "data-validation-backups",
    topicId: "data",
    subtopicId: "6.4",
    prompt:
      "Explain why validation and backups are both important in a data system.",
    maxScore: 6,
    rubricSummary: [
      "Explain that validation helps stop incorrect or badly formatted data entering the system.",
      "Explain that backups allow recovery after failure, deletion, or attack.",
      "Link both to accuracy, reliability, or business continuity.",
    ],
    concepts: [
      {
        id: "validation-protects-quality",
        label: "Validation protects data quality at input",
        weight: 2,
        feedback: "that validation stops incorrect or badly formatted data",
        requiredGroups: [
          { anyOf: ["validation", "validate", "validation check"] },
          { anyOf: ["incorrect data", "bad data", "wrong format", "invalid input", "data quality"] },
        ],
      },
      {
        id: "backups-enable-recovery",
        label: "Backups allow recovery after loss or failure",
        weight: 2,
        feedback: "that backups restore data after failure, deletion, or attack",
        requiredGroups: [
          { anyOf: ["backup", "backups", "backup copy", "recovery copy"] },
          { anyOf: ["restore", "recover", "failure", "deletion", "attack", "data loss"] },
        ],
      },
      {
        id: "reliability-continuity",
        label: "Together they improve reliability or continuity",
        weight: 2,
        feedback: "the combined benefit to reliability or continuity",
        requiredGroups: [
          { anyOf: ["reliable", "reliability", "business continuity", "accurate system", "keep running", "trustworthy"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "backup-fixes-quality",
        label: "Backups solve poor data quality on their own",
        penalty: 1,
        explanation: "Backups help recovery after loss, but they do not prevent bad data from entering the system in the first place.",
        groups: [{ anyOf: ["backup stops invalid data", "backups replace validation"] }],
      },
    ],
  },
  {
    id: "digital-environments-virtualization-cloud",
    topicId: "digital-environments",
    subtopicId: "7.4",
    prompt:
      "Explain one benefit of virtualization and one benefit of cloud scalability.",
    maxScore: 6,
    rubricSummary: [
      "Explain that virtualization allows multiple isolated systems to share hardware efficiently.",
      "Explain that cloud scalability allows resources to expand or shrink with demand.",
      "Link each benefit to cost, flexibility, testing, or performance.",
    ],
    concepts: [
      {
        id: "virtualization-benefit",
        label: "Virtualization improves hardware usage or isolation",
        weight: 2,
        feedback: "a genuine benefit of virtualization",
        requiredGroups: [
          { anyOf: ["virtualization", "virtual machine", "vm"] },
          { anyOf: ["share hardware", "better resource use", "isolation", "run multiple systems", "testing"] },
        ],
      },
      {
        id: "cloud-scalability",
        label: "Cloud scalability matches resources to demand",
        weight: 2,
        feedback: "how cloud scalability works",
        requiredGroups: [
          { anyOf: ["cloud scalability", "scalability", "scale up", "scale down"] },
          { anyOf: ["demand", "more users", "traffic", "resources", "capacity"] },
        ],
      },
      {
        id: "cost-flexibility",
        label: "The benefit is cost efficiency or flexibility",
        weight: 2,
        feedback: "the practical business benefit",
        requiredGroups: [
          { anyOf: ["cost", "flexibility", "pay for what you use", "efficient", "performance"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "cloud-infinite",
        label: "Cloud capacity is automatically infinite",
        penalty: 1,
        explanation: "Cloud platforms are scalable, but capacity, design, and cost still need to be managed properly.",
        groups: [{ anyOf: ["cloud is infinite", "cloud has unlimited resources for free"] }],
      },
    ],
  },
  {
    id: "digital-environments-load-balancing-failover",
    topicId: "digital-environments",
    subtopicId: "7.5",
    prompt:
      "Explain why load balancing and failover improve the resilience of an online service.",
    maxScore: 6,
    rubricSummary: [
      "Explain that load balancing spreads work or traffic across more than one server or service.",
      "Explain that failover keeps the service running if one part fails.",
      "Link both to uptime, performance, or reduced single points of failure.",
    ],
    concepts: [
      {
        id: "load-balancing-distributes-work",
        label: "Load balancing distributes traffic or workload",
        weight: 2,
        feedback: "that load balancing spreads traffic or workload across systems",
        requiredGroups: [
          { anyOf: ["load balancing", "load balancer"] },
          { anyOf: ["spread traffic", "share workload", "across servers", "across systems", "distribute requests"] },
        ],
      },
      {
        id: "failover-protects-service",
        label: "Failover keeps the service running during failure",
        weight: 2,
        feedback: "that failover switches to another system if one fails",
        requiredGroups: [
          { anyOf: ["failover", "switch to another server", "backup server", "secondary system", "standby system"] },
          { anyOf: ["if one fails", "during failure", "keep service running", "continue service"] },
        ],
      },
      {
        id: "resilience-uptime",
        label: "Together they improve resilience, uptime, or performance",
        weight: 2,
        feedback: "the resilience, uptime, or performance benefit",
        requiredGroups: [
          { anyOf: ["resilience", "uptime", "high availability", "performance", "single point of failure", "less downtime"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "same-thing",
        label: "Load balancing and failover are the same thing",
        penalty: 1,
        explanation: "Load balancing shares work during normal operation. Failover focuses on keeping the service available when a component fails.",
        groups: [{ anyOf: ["load balancing is failover", "they are exactly the same"] }],
      },
    ],
  },
  {
    id: "security-mfa-patching",
    topicId: "security",
    subtopicId: "8.2",
    prompt:
      "Explain how multi-factor authentication and patching reduce security risk in an organisation.",
    maxScore: 6,
    rubricSummary: [
      "Explain that multi-factor authentication adds an extra proof of identity.",
      "Explain that patching fixes known vulnerabilities.",
      "Link both to reducing unauthorised access or successful attacks.",
    ],
    concepts: [
      {
        id: "mfa-extra-factor",
        label: "Multi-factor authentication adds extra identity checks",
        weight: 2,
        feedback: "how multi-factor authentication reduces login risk",
        requiredGroups: [
          { anyOf: ["multi factor authentication", "mfa", "two factor authentication", "2fa"] },
          { anyOf: ["extra factor", "second factor", "second check", "extra check", "proof of identity"] },
        ],
      },
      {
        id: "patching-fixes-vulnerabilities",
        label: "Patching removes known vulnerabilities",
        weight: 2,
        feedback: "how patching closes vulnerabilities",
        requiredGroups: [
          { anyOf: ["patching", "patching fixes", "patches", "update software", "security updates"] },
          { anyOf: ["fix vulnerabilities", "close exploits", "known weakness", "security flaw"] },
        ],
      },
      {
        id: "reduced-risk",
        label: "Together they reduce successful attacks",
        weight: 2,
        feedback: "the overall risk reduction",
        requiredGroups: [
          { anyOf: ["reduce unauthorised access", "reduce attacks", "stop attackers", "lower security risk", "protect accounts", "stolen password is not enough", "cannot exploit"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "mfa-replaces-patching",
        label: "MFA removes the need for patching",
        penalty: 1,
        explanation: "MFA protects authentication, but systems still need patching to close software vulnerabilities.",
        groups: [{ anyOf: ["mfa means patching is unnecessary", "patching is not needed if 2fa is enabled"] }],
      },
    ],
  },
  {
    id: "security-least-privilege-audit-logs",
    topicId: "security",
    subtopicId: "8.2",
    prompt:
      "Explain why least-privilege access and audit logs help protect an organisation.",
    maxScore: 6,
    rubricSummary: [
      "Explain that least privilege means users only get the access they need.",
      "Explain that audit logs record who did what and when.",
      "Link both to reducing misuse, spotting incidents, or improving accountability.",
    ],
    concepts: [
      {
        id: "least-privilege-limits-access",
        label: "Least privilege limits each user to the access they need",
        weight: 2,
        feedback: "that least privilege limits access to what each user actually needs",
        requiredGroups: [
          { anyOf: ["least privilege", "minimum access", "role based access", "permissions"] },
          { anyOf: ["only what they need", "limited access", "only required access", "not full access"] },
        ],
      },
      {
        id: "audit-logs-record-actions",
        label: "Audit logs record actions and changes",
        weight: 2,
        feedback: "that audit logs record who did what and when",
        requiredGroups: [
          { anyOf: ["audit log", "audit logs", "audit trail", "log actions"] },
          { anyOf: ["who did what", "who changed what", "when it happened", "record actions", "record changes"] },
        ],
      },
      {
        id: "detection-accountability",
        label: "Together they reduce misuse and improve accountability",
        weight: 2,
        feedback: "the detection, accountability, or misuse-reduction benefit",
        requiredGroups: [
          { anyOf: ["reduce misuse", "spot incidents", "detect problems", "accountability", "trace actions", "investigate"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "admin-for-everyone",
        label: "Everyone can have broad access as long as logs exist",
        penalty: 1,
        explanation: "Audit logs help investigation, but they do not justify giving every user more access than they need.",
        groups: [{ anyOf: ["everyone can have admin access if it is logged", "logs mean broad permissions are safe"] }],
      },
    ],
  },
  {
    id: "problem-solving-pattern-recognition",
    topicId: "problem-solving",
    subtopicId: "1.1",
    prompt:
      "Explain how pattern recognition helps when solving a new problem.",
    maxScore: 6,
    rubricSummary: [
      "Explain that pattern recognition looks for similarities, trends, or repeated features.",
      "Explain that recognised patterns help reuse methods, rules, or known solutions.",
      "Link this to faster design, more reliable algorithms, or less wasted effort.",
    ],
    concepts: [
      {
        id: "patterns-spotted",
        label: "Pattern recognition spots similarities or repeated features",
        weight: 2,
        feedback: "that pattern recognition means looking for repeated features or trends",
        requiredGroups: [
          { anyOf: ["pattern recognition", "patterns", "recognise patterns"] },
          { anyOf: ["similarities", "common features", "repeated features", "trends", "things in common"] },
        ],
      },
      {
        id: "reuse-solution",
        label: "Recognised patterns help reuse ideas or methods",
        weight: 2,
        feedback: "that recognised patterns help reuse a method, rule, or known solution",
        requiredGroups: [
          { anyOf: ["reuse", "apply the same method", "known solution", "existing solution", "similar approach", "rule"] },
        ],
      },
      {
        id: "efficiency-benefit",
        label: "This improves speed, accuracy, or design quality",
        weight: 2,
        feedback: "the practical problem-solving benefit",
        requiredGroups: [
          { anyOf: ["save time", "faster", "more efficient", "more accurate", "fewer errors", "better design", "more reliable"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "pattern-guessing",
        label: "Pattern recognition is just guessing",
        penalty: 1,
        explanation: "Pattern recognition is evidence-based. It looks for meaningful similarities or trends, not random guesses.",
        groups: [{ anyOf: ["just guess", "random guess", "guessing without evidence"] }],
      },
    ],
  },
  {
    id: "problem-solving-flowcharts-pseudocode",
    topicId: "problem-solving",
    subtopicId: "1.2",
    prompt:
      "Explain why flowcharts or pseudocode are useful before writing final code.",
    maxScore: 6,
    rubricSummary: [
      "Explain that flowcharts or pseudocode help plan the logic before coding.",
      "Explain that they make sequence, decisions, and repetition easier to check or communicate.",
      "Link this to finding errors early, clearer collaboration, or more accurate code.",
    ],
    concepts: [
      {
        id: "planning-logic",
        label: "Flowcharts or pseudocode help plan logic before coding",
        weight: 2,
        feedback: "that these representations help plan the logic first",
        requiredGroups: [
          { anyOf: ["flowchart", "pseudocode", "algorithm design"] },
          { anyOf: ["plan", "before coding", "design the logic", "outline steps", "work out the logic"] },
        ],
      },
      {
        id: "check-communicate",
        label: "They make logic easier to check or communicate",
        weight: 2,
        feedback: "that they help explain or check sequence, decisions, or loops",
        requiredGroups: [
          { anyOf: ["sequence", "decision", "selection", "iteration", "loop", "steps"] },
          { anyOf: ["check", "spot errors", "communicate", "share with others", "understand"] },
        ],
      },
      {
        id: "better-code-outcome",
        label: "This leads to fewer mistakes or better final code",
        weight: 2,
        feedback: "the final coding benefit",
        requiredGroups: [
          { anyOf: ["fewer errors", "less debugging", "clearer code", "better code", "more accurate", "save time"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "flowchart-executes",
        label: "A flowchart or pseudocode directly runs as the finished program",
        penalty: 1,
        explanation: "Flowcharts and pseudocode are planning representations. They help design the solution, but they are not the final executable program.",
        groups: [{ anyOf: ["flowchart runs the program", "pseudocode executes directly", "the flowchart is the final code"] }],
      },
    ],
  },
  {
    id: "emerging-issues-digital-inclusion",
    topicId: "emerging-issues",
    subtopicId: "3.1",
    prompt:
      "Explain why digital inclusion and accessibility matter when designing a digital service.",
    maxScore: 6,
    rubricSummary: [
      "Explain that services should work for a wide range of users, including people with disabilities or limited access.",
      "Explain that inclusive design reduces exclusion and improves fair access.",
      "Link this to usability, legal or ethical responsibilities, or wider service reach.",
    ],
    concepts: [
      {
        id: "wide-range-of-users",
        label: "Inclusion means designing for a wide range of users",
        weight: 2,
        feedback: "that digital services should work for a broad range of users",
        requiredGroups: [
          { anyOf: ["digital inclusion", "accessibility", "inclusive design", "accessible design"] },
          { anyOf: ["wide range of users", "different users", "disabled users", "people with disabilities", "different needs", "limited access"] },
        ],
      },
      {
        id: "reduces-exclusion",
        label: "Inclusive design reduces exclusion or unfair barriers",
        weight: 2,
        feedback: "that inclusion reduces exclusion or unfair barriers",
        requiredGroups: [
          { anyOf: ["reduce exclusion", "avoid exclusion", "remove barriers", "fair access", "equal access", "not leave people out"] },
        ],
      },
      {
        id: "service-and-compliance-benefit",
        label: "There is a practical service, legal, or ethical benefit",
        weight: 2,
        feedback: "the practical impact on service quality or responsibility",
        requiredGroups: [
          { anyOf: ["usability", "more users", "wider reach", "better service", "ethical", "legal", "compliance"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "accessibility-only-small-group",
        label: "Accessibility only matters for a small group of users",
        penalty: 1,
        explanation: "Accessibility improves access for many users, not only a small specialist group. It often improves usability more broadly.",
        groups: [{ anyOf: ["only a few users need accessibility", "accessibility only matters for blind users", "most users do not need accessible design"] }],
      },
    ],
  },
  {
    id: "emerging-issues-iot-benefit-risk",
    topicId: "emerging-issues",
    subtopicId: "3.2",
    prompt:
      "Explain one benefit and one risk of using IoT devices in an organisation.",
    maxScore: 6,
    rubricSummary: [
      "Explain one realistic benefit such as automation, monitoring, or real-time data collection.",
      "Explain one realistic risk such as security exposure, privacy loss, or unreliable data.",
      "Show why organisations need controls or careful implementation.",
    ],
    concepts: [
      {
        id: "iot-benefit",
        label: "IoT provides a practical monitoring or automation benefit",
        weight: 2,
        feedback: "a realistic benefit of IoT use",
        requiredGroups: [
          { anyOf: ["iot", "internet of things", "connected device", "sensor"] },
          { anyOf: ["monitoring", "real time data", "automation", "track conditions", "live data", "efficiency"] },
        ],
      },
      {
        id: "iot-risk",
        label: "IoT introduces a genuine security, privacy, or reliability risk",
        weight: 2,
        feedback: "a realistic IoT risk",
        requiredGroups: [
          { anyOf: ["security risk", "privacy risk", "weak security", "data leak", "hacked", "unreliable data", "faulty readings"] },
        ],
      },
      {
        id: "iot-controls",
        label: "Controls or careful implementation are needed",
        weight: 2,
        feedback: "the need for controls, security, or careful rollout",
        requiredGroups: [
          { anyOf: ["controls", "security updates", "monitor devices", "careful implementation", "manage devices", "policies", "encryption"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "iot-no-overheads",
        label: "IoT devices add value without creating extra risk or management work",
        penalty: 1,
        explanation: "IoT can create new security, privacy, maintenance, and data-quality issues that still need to be managed.",
        groups: [{ anyOf: ["iot has no risk", "iot runs itself", "iot does not need managing"] }],
      },
    ],
  },
  {
    id: "legislation-computer-misuse-act",
    topicId: "legislation",
    subtopicId: "4.1",
    prompt:
      "Explain how the Computer Misuse Act affects what staff can do on organisational systems.",
    maxScore: 6,
    rubricSummary: [
      "Explain that unauthorised access or unauthorised modification is illegal.",
      "Explain that staff must stay within the permissions and systems they are allowed to use.",
      "Link this to protecting data, systems, or professional responsibility.",
    ],
    concepts: [
      {
        id: "unauthorised-access-illegal",
        label: "Unauthorised access or modification is illegal",
        weight: 2,
        feedback: "that the law prohibits unauthorised access or change",
        requiredGroups: [
          { anyOf: ["computer misuse act", "cma"] },
          { anyOf: ["unauthorised access", "unauthorized access", "unauthorised modification", "not allowed to access", "not allowed to change"] },
        ],
      },
      {
        id: "staff-follow-permissions",
        label: "Staff must stay within authorised permissions",
        weight: 2,
        feedback: "that staff must only use the systems and permissions they are authorised for",
        requiredGroups: [
          { anyOf: ["permissions", "authorised", "authorised access", "approved access", "their role", "their own account"] },
        ],
      },
      {
        id: "protection-and-responsibility",
        label: "This protects systems and reinforces responsibility",
        weight: 2,
        feedback: "the protective or professional reason this matters",
        requiredGroups: [
          { anyOf: ["protect systems", "protect data", "prevent misuse", "prevent damage", "professional responsibility", "legal consequences"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "employee-can-look",
        label: "Employees can access anything inside the company if they are curious",
        penalty: 1,
        explanation: "Being an employee does not make all access lawful. Staff still need proper authorisation for the systems and data they use.",
        groups: [{ anyOf: ["employees can access anything", "it is allowed if you work there", "looking is fine if nothing is changed"] }],
      },
    ],
  },
  {
    id: "legislation-accessibility-codes",
    topicId: "legislation",
    subtopicId: "4.2",
    prompt:
      "Explain why accessibility guidance and professional codes of conduct matter when developing software.",
    maxScore: 6,
    rubricSummary: [
      "Explain that accessibility guidance helps teams design software people can actually use.",
      "Explain that professional codes of conduct shape responsible and ethical behaviour.",
      "Link this to trust, quality, inclusive practice, or reduced legal and reputational risk.",
    ],
    concepts: [
      {
        id: "guidance-supports-access",
        label: "Accessibility guidance supports inclusive and usable design",
        weight: 2,
        feedback: "that guidance helps teams create accessible and usable software",
        requiredGroups: [
          { anyOf: ["accessibility guidance", "accessibility standard", "wcag", "guidance"] },
          { anyOf: ["inclusive", "usable", "people can use it", "accessible", "different needs"] },
        ],
      },
      {
        id: "codes-shape-behaviour",
        label: "Codes of conduct shape professional behaviour",
        weight: 2,
        feedback: "that codes of conduct support responsible professional behaviour",
        requiredGroups: [
          { anyOf: ["code of conduct", "professional code", "bcs", "professional standards"] },
          { anyOf: ["responsible behaviour", "ethical behaviour", "best practice", "professional behaviour"] },
        ],
      },
      {
        id: "trust-quality-risk",
        label: "They improve trust, quality, or reduce risk",
        weight: 2,
        feedback: "the wider trust, quality, or risk-reduction benefit",
        requiredGroups: [
          { anyOf: ["trust", "quality", "inclusive practice", "reduce risk", "reputation", "legal risk", "better product"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "codes-irrelevant",
        label: "Professional codes do not matter because they are not the same as law",
        penalty: 1,
        explanation: "Professional codes are still important because they guide responsible practice, quality, and ethical decision-making even when they are not laws themselves.",
        groups: [{ anyOf: ["codes do not matter", "ignore codes if not law", "professional guidance is optional and useless"] }],
      },
    ],
  },
  {
    id: "data-json-xml-exchange",
    topicId: "data",
    subtopicId: "6.2",
    prompt:
      "Explain how JSON and XML can be identified from a data snippet and why organisations use them for data exchange.",
    maxScore: 6,
    rubricSummary: [
      "Explain that JSON is identified by key-value pairs, braces, or arrays.",
      "Explain that XML is identified by tags, elements, or attributes.",
      "Link both to structured, self-describing exchange between systems or services.",
    ],
    concepts: [
      {
        id: "json-clues",
        label: "JSON can be identified from its structure",
        weight: 2,
        feedback: "the structural clues that identify JSON",
        requiredGroups: [
          { anyOf: ["json"] },
          { anyOf: ["curly braces", "key value", "key-value", "arrays", "objects"] },
        ],
      },
      {
        id: "xml-clues",
        label: "XML can be identified from tags or attributes",
        weight: 2,
        feedback: "the structural clues that identify XML",
        requiredGroups: [
          { anyOf: ["xml"] },
          { anyOf: ["tags", "elements", "angle brackets", "attributes", "nested tags"] },
        ],
      },
      {
        id: "data-exchange-purpose",
        label: "Both are used for structured exchange between systems",
        weight: 2,
        feedback: "why organisations use structured formats like JSON or XML",
        requiredGroups: [
          { anyOf: ["data exchange", "between systems", "between applications", "apis", "structured data", "self describing", "interoperable"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "json-xml-visual-only",
        label: "JSON and XML are just visual layout formats",
        penalty: 1,
        explanation: "JSON and XML are structured data formats used to represent and exchange data, not just to make information look tidy on screen.",
        groups: [{ anyOf: ["just for display", "visual format only", "for layout not data"] }],
      },
    ],
  },
  {
    id: "data-big-data-velocity",
    topicId: "data",
    subtopicId: "6.1",
    prompt:
      "For a stock market feed that updates every second, explain which big data V is most relevant and why.",
    maxScore: 6,
    rubricSummary: [
      "Identify velocity as the most relevant V.",
      "Explain that the data arrives or changes very quickly and often needs real-time handling.",
      "Link this to system design, fast processing, or timely decisions.",
    ],
    concepts: [
      {
        id: "identify-velocity",
        label: "Velocity is identified as the best-fit big-data V",
        weight: 2,
        feedback: "that velocity is the correct big-data V here",
        requiredGroups: [
          { anyOf: ["velocity"] },
        ],
      },
      {
        id: "rapid-updates",
        label: "The answer explains the importance of rapid or continuous updates",
        weight: 2,
        feedback: "that the data is arriving or changing very quickly",
        requiredGroups: [
          { anyOf: ["updates every second", "real time", "very quickly", "fast moving", "continuous updates", "high speed"] },
        ],
      },
      {
        id: "processing-consequence",
        label: "Fast processing or timely action is linked to the scenario",
        weight: 2,
        feedback: "the processing or decision-making consequence",
        requiredGroups: [
          { anyOf: ["fast processing", "timely decisions", "real time analysis", "process quickly", "react quickly", "up to date decisions"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "volume-over-speed",
        label: "It is mainly volume just because there is a lot of data",
        penalty: 1,
        explanation: "There may be a large amount of data, but this scenario mainly emphasises the speed at which data arrives and needs to be handled, which is velocity.",
        groups: [{ anyOf: ["mainly volume because there is lots of data", "the key v is volume not speed"] }],
      },
    ],
  },
  {
    id: "data-wrangling-pipeline",
    topicId: "data",
    subtopicId: "6.4",
    prompt:
      "Explain why data wrangling includes structuring, cleaning, validating, and enriching data before analysis.",
    maxScore: 6,
    rubricSummary: [
      "Explain that raw data is often messy, incomplete, or inconsistent.",
      "Explain what the wrangling stages do to make data usable.",
      "Link this to more reliable analysis, reporting, or decision-making.",
    ],
    concepts: [
      {
        id: "raw-data-messy",
        label: "Raw data is often messy or inconsistent",
        weight: 2,
        feedback: "that raw data often starts incomplete, inconsistent, or messy",
        requiredGroups: [
          { anyOf: ["raw data", "messy data", "inconsistent", "incomplete", "errors", "dirty data"] },
        ],
      },
      {
        id: "wrangling-stages",
        label: "Wrangling stages make data structured, clean, valid, and richer",
        weight: 2,
        feedback: "what structuring, cleaning, validating, and enriching actually do",
        requiredGroups: [
          { anyOf: ["structure", "structuring", "clean", "cleaning", "validate", "validating", "enrich", "enriching"] },
          { anyOf: ["usable", "consistent", "accurate", "complete", "ready for analysis"] },
        ],
      },
      {
        id: "analysis-benefit",
        label: "Wrangling improves the quality of analysis or reporting",
        weight: 2,
        feedback: "the analysis or reporting benefit",
        requiredGroups: [
          { anyOf: ["better analysis", "reliable analysis", "better decisions", "better reporting", "trustworthy results", "accurate results"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "wrangling-only-delete",
        label: "Data wrangling only means deleting bad rows",
        penalty: 1,
        explanation: "Data wrangling is broader than deleting errors. It includes structuring, cleaning, validating, enriching, and preparing data for useful output.",
        groups: [{ anyOf: ["just delete bad data", "only remove rows", "wrangling just means deleting errors"] }],
      },
    ],
  },
  {
    id: "data-network-model-social-media",
    topicId: "data",
    subtopicId: "6.3",
    prompt:
      "A social media platform lets users follow many other users. Explain why a network data model could suit this better than a hierarchical model.",
    maxScore: 6,
    rubricSummary: [
      "Explain that user relationships are many-to-many and highly interconnected.",
      "Explain that network models handle multiple links more naturally than a strict hierarchy.",
      "Link this to flexibility or a better fit for the scenario.",
    ],
    concepts: [
      {
        id: "many-to-many-links",
        label: "The scenario involves many-to-many relationships",
        weight: 2,
        feedback: "that the social graph contains many interconnected links",
        requiredGroups: [
          { anyOf: ["many to many", "multiple relationships", "interconnected", "many links", "users follow many users"] },
        ],
      },
      {
        id: "network-model-fit",
        label: "A network model handles multiple links naturally",
        weight: 2,
        feedback: "why the network model suits the relationship pattern",
        requiredGroups: [
          { anyOf: ["network model"] },
          { anyOf: ["multiple links", "flexible relationships", "interconnected records", "supports many relationships"] },
        ],
      },
      {
        id: "hierarchical-too-rigid",
        label: "A hierarchical model is too rigid for this scenario",
        weight: 2,
        feedback: "why a hierarchical model is a weaker fit",
        requiredGroups: [
          { anyOf: ["hierarchical model", "hierarchy"] },
          { anyOf: ["too rigid", "tree structure", "parent child", "single parent", "not flexible enough"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "hierarchy-fits-all",
        label: "Hierarchical models handle complex many-to-many links just as well",
        penalty: 1,
        explanation: "Hierarchical models are better for tree-like parent-child structures. Interconnected many-to-many relationships are a stronger fit for a network model.",
        groups: [{ anyOf: ["hierarchical is just as good for many to many", "hierarchy handles any relationship equally well"] }],
      },
    ],
  },
  {
    id: "data-role-based-access-control",
    topicId: "data",
    subtopicId: "6.3",
    prompt:
      "Explain why role-based access control helps protect data across a business.",
    maxScore: 6,
    rubricSummary: [
      "Explain that permissions are assigned based on job role.",
      "Explain that this supports least privilege and consistent access decisions.",
      "Link this to reduced unauthorised access, fewer mistakes, or easier administration.",
    ],
    concepts: [
      {
        id: "permissions-by-role",
        label: "Permissions are assigned by role",
        weight: 2,
        feedback: "that RBAC assigns access based on a user's role",
        requiredGroups: [
          { anyOf: ["role based access control", "rbac", "permissions by role", "role based permissions"] },
        ],
      },
      {
        id: "least-privilege-consistency",
        label: "RBAC supports least privilege or consistent access decisions",
        weight: 2,
        feedback: "that role-based access supports least privilege or consistent rules",
        requiredGroups: [
          { anyOf: ["least privilege", "only what they need", "consistent access", "same rules for the same role", "appropriate access"] },
        ],
      },
      {
        id: "business-protection-benefit",
        label: "This reduces unauthorised access or admin mistakes",
        weight: 2,
        feedback: "the protective or administrative benefit",
        requiredGroups: [
          { anyOf: ["reduce unauthorised access", "reduce mistakes", "easier to manage", "easier administration", "protect data", "reduce accidental change"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "same-access-for-all",
        label: "Everyone should have the same access so work is faster",
        penalty: 1,
        explanation: "Giving everyone the same access increases the risk of unauthorised viewing, accidental changes, and misuse. Different roles usually need different permissions.",
        groups: [{ anyOf: ["everyone should have same access", "broad access is best for efficiency", "all staff need admin rights"] }],
      },
    ],
  },
  {
    id: "data-visualisation-audience-purpose",
    topicId: "data",
    subtopicId: "6.1",
    prompt:
      "Explain why the audience and purpose matter when choosing a data visualisation.",
    maxScore: 6,
    rubricSummary: [
      "Explain that different audiences need different levels of detail, complexity, or presentation.",
      "Explain that the purpose affects which chart, table, dashboard, or report is most suitable.",
      "Link this to clarity, accurate interpretation, or better decision-making.",
    ],
    concepts: [
      {
        id: "audience-needs",
        label: "Different audiences need different presentation choices",
        weight: 2,
        feedback: "that audience needs affect how data should be shown",
        requiredGroups: [
          { anyOf: ["audience", "different users", "stakeholders", "managers", "public", "analysts"] },
          { anyOf: ["detail", "complexity", "presentation", "level of detail", "easy to understand"] },
        ],
      },
      {
        id: "purpose-shapes-format",
        label: "The purpose shapes which visualisation is suitable",
        weight: 2,
        feedback: "that the purpose of the visualisation affects the format choice",
        requiredGroups: [
          { anyOf: ["purpose", "goal", "what you need to show", "compare", "trend", "distribution", "performance"] },
          { anyOf: ["chart", "graph", "table", "dashboard", "report", "infographic"] },
        ],
      },
      {
        id: "clarity-and-decisions",
        label: "A good fit improves clarity and decision-making",
        weight: 2,
        feedback: "the clarity or decision-making benefit",
        requiredGroups: [
          { anyOf: ["clarity", "easy to interpret", "avoid misleading", "better decisions", "understand quickly", "accurate interpretation"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "one-chart-fits-all",
        label: "One chart type works equally well for every audience and purpose",
        penalty: 1,
        explanation: "Visualisations should be chosen to fit both the intended audience and what the data needs to communicate. One format does not suit every case.",
        groups: [{ anyOf: ["same chart for everything", "one graph suits all", "audience does not matter"] }],
      },
    ],
  },
  {
    id: "data-warehouse-vs-lake",
    topicId: "data",
    subtopicId: "6.3",
    prompt:
      "Explain one difference between a data warehouse and a data lake, and why an organisation might use both.",
    maxScore: 6,
    rubricSummary: [
      "Explain that a data warehouse usually stores structured, prepared data for reporting.",
      "Explain that a data lake can hold raw or varied data types at scale.",
      "Link this to organisations using both for flexible storage plus analysis-ready reporting.",
    ],
    concepts: [
      {
        id: "warehouse-structured",
        label: "A data warehouse stores structured or prepared data",
        weight: 2,
        feedback: "what makes a data warehouse different",
        requiredGroups: [
          { anyOf: ["data warehouse", "warehouse"] },
          { anyOf: ["structured", "prepared data", "cleaned data", "historical reporting", "reporting"] },
        ],
      },
      {
        id: "lake-raw-varied",
        label: "A data lake stores raw or varied data",
        weight: 2,
        feedback: "what makes a data lake different",
        requiredGroups: [
          { anyOf: ["data lake", "lake"] },
          { anyOf: ["raw data", "unstructured", "varied data", "mixed formats", "large scale"] },
        ],
      },
      {
        id: "use-both-benefit",
        label: "Using both supports flexible storage and reporting",
        weight: 2,
        feedback: "why an organisation might use both together",
        requiredGroups: [
          { anyOf: ["use both", "together", "store raw first", "later reporting", "flexibility", "analysis and reporting"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "lake-and-warehouse-same",
        label: "A data lake and a data warehouse are basically the same thing",
        penalty: 1,
        explanation: "They serve different roles. Warehouses focus on structured, prepared reporting data, while lakes can hold raw and varied data for broader later use.",
        groups: [{ anyOf: ["same thing", "no real difference", "warehouse and lake are identical"] }],
      },
    ],
  },
  {
    id: "security-cia-triad-balance",
    topicId: "security",
    subtopicId: "8.1",
    prompt:
      "Explain why confidentiality, integrity, and availability must all be considered together in a secure system.",
    maxScore: 6,
    rubricSummary: [
      "Explain what confidentiality protects.",
      "Explain what integrity and availability each contribute.",
      "Link this to the idea that security is weaker if one of the three is missing.",
    ],
    concepts: [
      {
        id: "confidentiality-protects",
        label: "Confidentiality protects against unauthorised access",
        weight: 2,
        feedback: "what confidentiality means in a secure system",
        requiredGroups: [
          { anyOf: ["confidentiality"] },
          { anyOf: ["unauthorised access", "privacy", "only authorised people", "restricted access"] },
        ],
      },
      {
        id: "integrity-availability",
        label: "Integrity and availability are both explained",
        weight: 2,
        feedback: "what integrity and availability contribute",
        requiredGroups: [
          { anyOf: ["integrity", "accurate", "not tampered with", "correct data"] },
          { anyOf: ["availability", "available when needed", "uptime", "accessible when required"] },
        ],
      },
      {
        id: "balanced-security",
        label: "The answer explains that security needs all three together",
        weight: 2,
        feedback: "why all three parts are needed together",
        requiredGroups: [
          { anyOf: ["all three", "together", "balanced security", "if one is missing", "not secure if one fails", "complete security"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "confidentiality-only-enough",
        label: "Security is fine as long as data is confidential",
        penalty: 1,
        explanation: "A system can still fail if data is unavailable or inaccurate, even if unauthorised people cannot see it. Security depends on all three parts of the CIA triad.",
        groups: [{ anyOf: ["only confidentiality matters", "privacy alone is enough", "availability does not matter if data is secret"] }],
      },
    ],
  },
  {
    id: "security-phishing-human-threat",
    topicId: "security",
    subtopicId: "8.1",
    prompt:
      "Explain how phishing is a human security threat and one way an organisation can reduce the risk.",
    maxScore: 6,
    rubricSummary: [
      "Explain that phishing manipulates users into clicking, revealing details, or trusting a fake message.",
      "Explain why this is a human or social-engineering threat.",
      "Explain one realistic mitigation such as training, MFA, filtering, or reporting processes.",
    ],
    concepts: [
      {
        id: "phishing-tricks-users",
        label: "Phishing tricks users into revealing information or clicking malicious links",
        weight: 2,
        feedback: "what phishing does to users",
        requiredGroups: [
          { anyOf: ["phishing"] },
          { anyOf: ["trick users", "fake email", "fake message", "reveal information", "click malicious link", "credentials"] },
        ],
      },
      {
        id: "human-threat-angle",
        label: "The answer recognises phishing as a human or social-engineering threat",
        weight: 2,
        feedback: "why phishing is a human threat",
        requiredGroups: [
          { anyOf: ["human threat", "social engineering", "human error", "manipulates people", "targets staff"] },
        ],
      },
      {
        id: "phishing-mitigation",
        label: "A realistic mitigation is given",
        weight: 2,
        feedback: "a realistic way to reduce phishing risk",
        requiredGroups: [
          { anyOf: ["training", "awareness", "email filtering", "report suspicious emails", "multi factor authentication", "mfa", "verification process"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "antivirus-solves-phishing",
        label: "Antivirus alone solves phishing",
        penalty: 1,
        explanation: "Technical tools help, but phishing is a social-engineering threat that also needs user awareness, good processes, and layered controls.",
        groups: [{ anyOf: ["antivirus completely stops phishing", "only antivirus is needed for phishing"] }],
      },
    ],
  },
  {
    id: "security-layered-controls",
    topicId: "security",
    subtopicId: "8.2",
    prompt:
      "Explain why a secure system should use layered controls instead of relying on one security measure.",
    maxScore: 6,
    rubricSummary: [
      "Explain that one control can fail, be bypassed, or be misused.",
      "Explain that layered controls combine different protections such as prevention, detection, and recovery.",
      "Link this to defence in depth, resilience, or reduced overall risk.",
    ],
    concepts: [
      {
        id: "single-control-can-fail",
        label: "One control can fail or be bypassed",
        weight: 2,
        feedback: "that relying on a single control is risky",
        requiredGroups: [
          { anyOf: ["one control can fail", "single control", "bypassed", "not enough on its own", "one measure can fail"] },
        ],
      },
      {
        id: "layers-combine-protection",
        label: "Layered controls combine different protections",
        weight: 2,
        feedback: "that layered controls combine multiple types of protection",
        requiredGroups: [
          { anyOf: ["layered controls", "layers", "defence in depth", "multiple controls"] },
          { anyOf: ["prevention", "detection", "recovery", "backups", "training", "firewall", "mfa"] },
        ],
      },
      {
        id: "resilience-risk-reduction",
        label: "This improves resilience or reduces overall risk",
        weight: 2,
        feedback: "the resilience or risk-reduction benefit",
        requiredGroups: [
          { anyOf: ["resilience", "reduce overall risk", "stronger security", "less likely to succeed", "better protection"] },
        ],
      },
    ],
    misconceptions: [
      {
        id: "best-single-control-enough",
        label: "The strongest single control is always enough on its own",
        penalty: 1,
        explanation: "Even strong controls can fail or be bypassed. Layered security reduces dependence on one point of protection.",
        groups: [{ anyOf: ["one strong control is enough", "best control alone is sufficient", "only one security measure is needed"] }],
      },
    ],
  },
];
