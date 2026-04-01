export interface RevisionLearningPathStep {
  title: string;
  description: string;
  href: string;
}

export const REVISION_LEARNING_PATH_STEPS: RevisionLearningPathStep[] = [
  {
    title: "Diagnostic",
    description: "Establish a baseline so later practice targets the right gaps.",
    href: "/revision/diagnostic",
  },
  {
    title: "Weak areas",
    description: "Drill the topics the diagnostic flagged before moving on.",
    href: "/revision/weak-areas",
  },
  {
    title: "Choose a topic",
    description: "Work in depth inside one topic’s modes: recall, practice, answer check.",
    href: "/revision/topics",
  },
  {
    title: "Paper 1",
    description: "Shorter knowledge checks and theory-style prompts.",
    href: "/revision/paper-1",
  },
  {
    title: "Paper 2",
    description: "Applied scenarios and longer written reasoning.",
    href: "/revision/paper-2",
  },
  {
    title: "Progress",
    description: "See how revision activity is adding up over time.",
    href: "/revision/progress",
  },
];
