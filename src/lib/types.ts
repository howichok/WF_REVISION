export interface UserProfile {
  id: string;
  nickname: string;
  email?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OnboardingData {
  weakAreas: string[];
  focusBreakdown?: FocusBreakdownData;
  completedAt: string;
}

export interface DiagnosticResult {
  id?: string;
  completedAt: string;
  overallScore: number;
  questionCount?: number;
  topicScores: TopicScore[];
  version?: number;
  latestTopicId?: string;
  assessedTopicIds?: string[];
  unassessedTopicIds?: string[];
  recommendedTopicIds?: string[];
  topicDiagnostics?: TopicDiagnosticReport[];
}

export interface TopicScore {
  topic: string;
  score: number;
  maxScore: number;
  category: string;
}

export type DiagnosticPointStatus =
  | "covered"
  | "partial"
  | "unassessed"
  | "misconception";

export type DiagnosticFollowUpReason =
  | "missing-point"
  | "weak-point"
  | "misconception"
  | "low-confidence";

export interface DiagnosticPointAssessment {
  pointId: string;
  label: string;
  status: DiagnosticPointStatus;
  confidence: number;
  matchedTerms: string[];
  missingTerms: string[];
  evidence: string[];
  notes?: string;
}

export interface DiagnosticMisconceptionFinding {
  id: string;
  pointId?: string;
  label: string;
  explanation: string;
}

export interface DiagnosticFollowUpEntry {
  id: string;
  targetedPointId: string;
  question: string;
  answer: string;
  reason: DiagnosticFollowUpReason;
}

export interface TopicDiagnosticReport {
  topicId: string;
  topicLabel: string;
  topicIcon: string;
  assessedAt: string;
  freeformResponse: string;
  curriculumPoints: DiagnosticPointAssessment[];
  keyTermsMatched: string[];
  misconceptions: DiagnosticMisconceptionFinding[];
  confidence: number;
  suggestedNextTargets: string[];
  recommendedMaterialIds: string[];
  followUps: DiagnosticFollowUpEntry[];
}

export interface StudyResource {
  id: string;
  title: string;
  type: "past-paper" | "notes" | "video" | "worksheet" | "slides";
  topic: string;
  category: string;
  year?: number;
  description?: string;
}

export type AppState = {
  user: UserProfile | null;
  onboarding: OnboardingData | null;
  diagnostic: DiagnosticResult | null;
};

export interface RevisionProgressEntry {
  id: string;
  topicId: string;
  entityId: string;
  entityType: "subtopic" | "material" | "practice-set";
  status: "not-started" | "in-progress" | "completed";
  progressPercent: number;
  completedAt: string | null;
  updatedAt: string;
  lastInteractedAt: string;
}

export interface ActivityLog {
  id: string;
  type: string;
  title: string;
  topicId: string | null;
  occurredAt: string;
  minutesSpent: number;
  metadata: Record<string, unknown>;
}

export interface AppBootstrapState extends AppState {
  revisionProgress: RevisionProgressEntry[];
  activityHistory: ActivityLog[];
}

// ─── T-Level Digital Software Development (Year 1) Topics ───

export const TOPICS = [
  { id: "problem-solving", label: "Problem Solving", shortLabel: "1", icon: "🧩" },
  { id: "intro-programming", label: "Intro to Programming", shortLabel: "2", icon: "💻" },
  { id: "emerging-issues", label: "Emerging Issues & Digital Impact", shortLabel: "3", icon: "🌐" },
  { id: "legislation", label: "Legislation & Regulatory", shortLabel: "4", icon: "⚖️" },
  { id: "business", label: "Business Environment", shortLabel: "5", icon: "📋" },
  { id: "data", label: "Data", shortLabel: "6", icon: "🗄️" },
  { id: "digital-environments", label: "Digital Environments", shortLabel: "7", icon: "🖥️" },
  { id: "security", label: "Security", shortLabel: "8", icon: "🔒" },
  { id: "esp", label: "ESP", shortLabel: "ESP", icon: "📝" },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];

export function getTopicLabel(id: string): string {
  return TOPICS.find((t) => t.id === id)?.label ?? id;
}

export function getTopicById(id: string) {
  return TOPICS.find((t) => t.id === id);
}

// ─── Subtopic tree (Year 1 spec structure) ───

export interface Subtopic {
  id: string;
  label: string;
  keywords: string[];
}

export interface TopicTree {
  topicId: TopicId;
  description: string;
  subtopics: Subtopic[];
}

export const TOPIC_TREES: TopicTree[] = [
  {
    topicId: "problem-solving",
    description: "Breaking down problems, designing solutions with flowcharts and pseudocode.",
    subtopics: [
      { id: "1.1", label: "Computational thinking", keywords: ["decomposition", "abstraction", "pattern recognition", "algorithmic thinking", "flowchart", "pseudocode", "trace table"] },
      { id: "1.2", label: "Algorithms", keywords: ["searching", "sorting", "efficiency", "bubble sort", "linear search", "binary search", "merge sort"] },
    ],
  },
  {
    topicId: "intro-programming",
    description: "Writing, testing, and maintaining code — variables, loops, functions, all of it.",
    subtopics: [
      { id: "2.1", label: "Program data", keywords: ["variables", "constants", "data types", "integer", "string", "boolean", "float", "casting"] },
      { id: "2.2", label: "Operators", keywords: ["arithmetic", "comparison", "logical", "assignment", "modulus", "AND", "OR", "NOT"] },
      { id: "2.3", label: "File handling", keywords: ["read", "write", "append", "CSV", "text file", "open", "close"] },
      { id: "2.4", label: "Program structure", keywords: ["sequence", "selection", "iteration", "if", "else", "while", "for", "loops", "functions", "procedures", "parameters"] },
      { id: "2.5", label: "Built-in functions", keywords: ["len", "range", "print", "input", "type", "int", "str", "round", "string methods"] },
      { id: "2.6", label: "Validation and error handling", keywords: ["try", "except", "validation", "range check", "type check", "presence check", "length check", "error handling"] },
      { id: "2.7", label: "Maintainable code", keywords: ["comments", "naming conventions", "indentation", "readability", "modular", "documentation"] },
      { id: "2.8", label: "Testing", keywords: ["test plan", "test data", "normal", "boundary", "erroneous", "unit testing", "integration testing", "debugging"] },
    ],
  },
  {
    topicId: "emerging-issues",
    description: "How digital tech is changing the world — AI, IoT, ethics, and accessibility.",
    subtopics: [
      { id: "3.1", label: "Moral and ethical issues", keywords: ["ethics", "privacy", "surveillance", "bias", "accessibility", "digital divide", "environmental impact", "autonomy"] },
      { id: "3.2", label: "Emerging trends and technologies", keywords: ["AI", "machine learning", "IoT", "blockchain", "VR", "AR", "automation", "quantum computing", "big data"] },
    ],
  },
  {
    topicId: "legislation",
    description: "Laws and rules that govern how we build and use digital systems.",
    subtopics: [
      { id: "4.1", label: "Legislation", keywords: ["GDPR", "DPA", "Data Protection Act", "Computer Misuse Act", "Copyright", "Freedom of Information", "employee monitoring", "PECR", "intellectual property"] },
      { id: "4.2", label: "Guidelines and codes of conduct", keywords: ["BCS", "code of conduct", "professional standards", "acceptable use", "whistleblowing", "professional body"] },
    ],
  },
  {
    topicId: "business",
    description: "How businesses work, the value of digital, and managing change.",
    subtopics: [
      { id: "5.1", label: "The business environment", keywords: ["stakeholders", "organisational structure", "roles", "departments", "hierarchy", "flat structure"] },
      { id: "5.2", label: "Digital value to business", keywords: ["digital transformation", "efficiency", "customer experience", "competitive advantage", "automation", "data-driven"] },
      { id: "5.3", label: "Technical change management", keywords: ["change management", "implementation", "training", "migration", "rollout", "parallel running", "phased"] },
      { id: "5.4", label: "Risks in a business context", keywords: ["risk assessment", "contingency", "disaster recovery", "business continuity", "downtime", "vendor lock-in"] },
    ],
  },
  {
    topicId: "data",
    description: "How data is stored, structured, managed, and used in organisations.",
    subtopics: [
      { id: "6.1", label: "Data and information in organisations", keywords: ["data", "information", "knowledge", "primary", "secondary", "qualitative", "quantitative"] },
      { id: "6.2", label: "Data formats", keywords: ["CSV", "JSON", "XML", "binary", "text", "data interchange", "file format"] },
      { id: "6.3", label: "Data systems", keywords: ["database", "SQL", "relational", "table", "record", "field", "primary key", "foreign key", "normalisation", "query"] },
      { id: "6.4", label: "Data management", keywords: ["backup", "archive", "retention", "disposal", "integrity", "redundancy", "data lifecycle"] },
    ],
  },
  {
    topicId: "digital-environments",
    description: "Networks, cloud, VMs, hardware — the systems software runs on.",
    subtopics: [
      { id: "7.1", label: "Physical environments", keywords: ["hardware", "CPU", "RAM", "storage", "server", "workstation", "peripheral", "motherboard"] },
      { id: "7.2", label: "Networks", keywords: ["LAN", "WAN", "TCP/IP", "protocol", "router", "switch", "bandwidth", "topology", "DNS", "DHCP", "firewall"] },
      { id: "7.3", label: "Virtual environments", keywords: ["virtual machine", "hypervisor", "container", "sandbox", "emulation", "snapshot"] },
      { id: "7.4", label: "Cloud environments", keywords: ["IaaS", "PaaS", "SaaS", "public cloud", "private cloud", "hybrid cloud", "scalability", "AWS", "Azure"] },
      { id: "7.5", label: "Resilience of environment", keywords: ["redundancy", "failover", "load balancing", "disaster recovery", "uptime", "SLA", "RAID"] },
    ],
  },
  {
    topicId: "security",
    description: "Threats to digital systems and how to defend against them.",
    subtopics: [
      { id: "8.1", label: "Security risks", keywords: ["malware", "phishing", "social engineering", "brute force", "SQL injection", "DDoS", "ransomware", "insider threat", "zero-day"] },
      { id: "8.2", label: "Threat mitigation", keywords: ["encryption", "firewall", "antivirus", "authentication", "two-factor", "access control", "penetration testing", "patching", "backup"] },
    ],
  },
  {
    topicId: "esp",
    description: "Synoptic employer-set project work: reading the brief, planning a solution, building evidence, and evaluating the final outcome.",
    subtopics: [
      { id: "esp.1", label: "Brief analysis", keywords: ["brief", "requirements", "client needs", "constraints", "scope", "acceptance criteria"] },
      { id: "esp.2", label: "Planning and design", keywords: ["planning", "wireframe", "algorithm", "flowchart", "prototype", "design decisions"] },
      { id: "esp.3", label: "Implementation evidence", keywords: ["implementation", "code evidence", "database", "testing evidence", "screenshots", "iteration"] },
      { id: "esp.4", label: "Evaluation and justification", keywords: ["evaluation", "justification", "reflection", "improvements", "user feedback", "success criteria"] },
    ],
  },
];

export function getTopicTree(topicId: string): TopicTree | undefined {
  return TOPIC_TREES.find((t) => t.topicId === topicId);
}

// ─── Focus breakdown data (stored from onboarding step 3) ───

export interface FocusBreakdownData {
  selectedSubtopics: Record<string, string[]>; // topicId -> subtopic ids
  freeTextNotes: Record<string, string>;        // topicId -> user typed text
  globalNote?: string;
  completedAt: string;
}

// ─── Mock diagnostic for T-Level DSD ───

export const MOCK_DIAGNOSTIC: DiagnosticResult = {
  completedAt: new Date().toISOString(),
  overallScore: 58,
  topicScores: [
    { topic: "Problem Solving", score: 17, maxScore: 25, category: "problem-solving" },
    { topic: "Intro to Programming", score: 21, maxScore: 25, category: "intro-programming" },
    { topic: "Emerging Issues & Digital Impact", score: 14, maxScore: 25, category: "emerging-issues" },
    { topic: "Legislation & Regulatory", score: 10, maxScore: 25, category: "legislation" },
    { topic: "Business Environment", score: 12, maxScore: 25, category: "business" },
    { topic: "Data", score: 18, maxScore: 25, category: "data" },
    { topic: "Digital Environments", score: 15, maxScore: 25, category: "digital-environments" },
    { topic: "Security", score: 9, maxScore: 25, category: "security" },
  ],
};

// ─── Mock library resources ───

export const MOCK_RESOURCES: StudyResource[] = [
  // Past papers
  { id: "1", title: "2024 Core Exam Paper", type: "past-paper", topic: "problem-solving", category: "Past Papers", year: 2024, description: "Full Year 1 exam paper with mark scheme" },
  { id: "2", title: "2023 Core Exam Paper", type: "past-paper", topic: "problem-solving", category: "Past Papers", year: 2023, description: "Full Year 1 exam paper with mark scheme" },
  { id: "3", title: "2024 ESP Practice Brief", type: "past-paper", topic: "esp", category: "Past Papers", year: 2024, description: "Employer Set Project sample brief and guidance" },

  // Notes
  { id: "4", title: "Problem Solving — Flowcharts & Pseudocode", type: "notes", topic: "problem-solving", category: "Notes", description: "Decomposition, flowcharts, pseudocode, trace tables" },
  { id: "5", title: "Programming Basics — Variables & Loops", type: "notes", topic: "intro-programming", category: "Notes", description: "Key constructs, data types, iteration, selection" },
  { id: "6", title: "Legislation Overview", type: "notes", topic: "legislation", category: "Notes", description: "DPA, GDPR, Computer Misuse Act, Copyright" },
  { id: "7", title: "Security Threats & Measures", type: "notes", topic: "security", category: "Notes", description: "Social engineering, malware, encryption, firewalls" },
  { id: "8", title: "Data Types & Structures", type: "notes", topic: "data", category: "Notes", description: "SQL basics, data models, validation, databases" },
  { id: "9", title: "Digital Environments Cheat Sheet", type: "notes", topic: "digital-environments", category: "Notes", description: "Cloud, VMs, networking, hardware vs software" },

  // Worksheets
  { id: "10", title: "Business Environment Practice Qs", type: "worksheet", topic: "business", category: "Worksheets", description: "Stakeholders, project management, business roles" },
  { id: "11", title: "Emerging Issues Mini-Quiz", type: "worksheet", topic: "emerging-issues", category: "Worksheets", description: "AI, IoT, ethical issues, accessibility" },
  { id: "12", title: "Security Scenario Questions", type: "worksheet", topic: "security", category: "Worksheets", description: "Practice identifying threats and countermeasures" },

  // Slides
  { id: "13", title: "Networking Fundamentals Slides", type: "slides", topic: "digital-environments", category: "Slides", description: "LAN, WAN, TCP/IP, protocols and topology" },
  { id: "14", title: "Data Management Overview Slides", type: "slides", topic: "data", category: "Slides", description: "Backup, archiving, retention, disposal best practices" },
  { id: "15", title: "Programming Constructs Slides", type: "slides", topic: "intro-programming", category: "Slides", description: "Selection, iteration, and function patterns" },

  // Additional past papers
  { id: "16", title: "2022 Core Exam Paper", type: "past-paper", topic: "problem-solving", category: "Past Papers", year: 2022, description: "Full Year 1 exam paper with mark scheme" },
  { id: "17", title: "2023 ESP Practice Brief", type: "past-paper", topic: "esp", category: "Past Papers", year: 2023, description: "Employer Set Project practice brief" },
];

// ─── Mock revision materials ───

import type { MaterialCardData } from "@/components/ui/material-card";

export const MOCK_MATERIALS: MaterialCardData[] = [
  { id: "m1", title: "Security Threats Deep Dive", description: "Malware types, social engineering, and how to spot them in exam questions.", topic: "Security", topicIcon: "🔒", type: "notes", difficulty: "hard", estimatedMinutes: 20, progress: 0 },
  { id: "m2", title: "Legislation Quick Review", description: "GDPR, DPA, Computer Misuse Act — the key facts you need.", topic: "Legislation", topicIcon: "⚖️", type: "review", difficulty: "medium", estimatedMinutes: 12, progress: 35 },
  { id: "m3", title: "SQL & Database Practice", description: "Write SELECT, INSERT, UPDATE queries. Practice normalisation.", topic: "Data", topicIcon: "🗄️", type: "practice", difficulty: "medium", estimatedMinutes: 25, progress: 0 },
  { id: "m4", title: "Business Environment Flashcards", description: "Stakeholders, org structures, digital transformation terms.", topic: "Business", topicIcon: "📋", type: "flashcards", difficulty: "easy", estimatedMinutes: 8, progress: 60 },
  { id: "m5", title: "Programming Constructs Guide", description: "Variables, loops, selection, functions — everything in one place.", topic: "Programming", topicIcon: "💻", type: "guide", difficulty: "medium", estimatedMinutes: 18, progress: 80 },
  { id: "m6", title: "Network Protocols Explained", description: "TCP/IP, DNS, DHCP, HTTP — what they do and how they connect.", topic: "Digital Env", topicIcon: "🖥️", type: "notes", difficulty: "hard", estimatedMinutes: 15, progress: 0 },
  { id: "m7", title: "Emerging Tech Trends", description: "AI, IoT, blockchain, VR/AR — current trends and exam angles.", topic: "Emerging", topicIcon: "🌐", type: "review", difficulty: "easy", estimatedMinutes: 10, progress: 45 },
  { id: "m8", title: "Problem Solving Practice Set", description: "Flowcharts, pseudocode, trace tables — timed practice questions.", topic: "Problem Solving", topicIcon: "🧩", type: "practice", difficulty: "medium", estimatedMinutes: 30, progress: 0 },
];

// ─── Mock activity data ───

export const MOCK_WEEK_ACTIVITY = [3, 5, 2, 4, 6, 1, 0]; // Mon-Sun (hours-like)

export const MOCK_RECENT_ACTIVITY = [
  { label: "Completed Security Threats review", time: "2 hours ago", type: "review" as const },
  { label: "Practiced SQL queries", time: "Yesterday", type: "practice" as const },
  { label: "Read Legislation overview", time: "Yesterday", type: "notes" as const },
  { label: "Finished Business flashcards", time: "2 days ago", type: "flashcards" as const },
];
