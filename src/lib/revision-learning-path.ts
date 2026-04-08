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
    description: "Open one topic and decide whether you need Simple revision first or full Exam conditions.",
    href: "/revision/topics?mode=simple",
  },
  {
    title: "Simple revision",
    description: "Use Ask DSD, recall, and quick Q/A to warm up the content before you write longer answers.",
    href: "/revision/topics?mode=simple",
  },
  {
    title: "Exam conditions",
    description: "Move into exam drill, then finish with one fuller written answer that the AI checks.",
    href: "/revision/topics?mode=simple",
  },
  {
    title: "Progress",
    description: "See how revision activity is adding up over time.",
    href: "/revision/progress",
  },
];
