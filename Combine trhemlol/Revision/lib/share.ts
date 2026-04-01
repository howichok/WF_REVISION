import { getTopicTitle } from "@/lib/content";
import type { PersistedAppState } from "@/lib/types";

function masteryBar(value: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const filled = Math.round(clamped / 20);
  return Array.from({ length: 5 }, (_, index) => (index < filled ? "??" : "?")).join("");
}

function overallMastery(state: PersistedAppState, filterPaper?: "paper1" | "paper2"): number {
  const values = Object.values(state.topicProgress)
    .filter((topic) => !filterPaper || topic.paperId === filterPaper)
    .map((topic) => topic.mastery);

  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, item) => sum + item, 0);
  return Math.round(total / values.length);
}

export function createDailyShare(state: PersistedAppState, dayNumber: number, todayMinutes: number): string {
  const paper1Mastery = overallMastery(state, "paper1");
  const paper2Mastery = overallMastery(state, "paper2");

  return [
    `T-Level Prep ?? Day ${dayNumber}`,
    `Paper 1 Mastery: ${masteryBar(paper1Mastery)} (${paper1Mastery}%)`,
    `Paper 2 Mastery: ${masteryBar(paper2Mastery)} (${paper2Mastery}%)`,
    `Streak: ?? ${state.streak.current}`,
    `Time: ${todayMinutes}m`,
  ].join("\n");
}

export function createExamShare(state: PersistedAppState, paperLabel: string, score: number, weakTopics: string[]): string {
  const weakLine = weakTopics.length
    ? weakTopics.map((topicId) => getTopicTitle(topicId)).slice(0, 3).join(", ")
    : "No critical weak topics";

  return [
    `T-Level Exam Drill ?? ${paperLabel}`,
    `Score: ${score}%`,
    `Weak Spots: ${weakLine}`,
    `Streak: ?? ${state.streak.current}`,
  ].join("\n");
}
