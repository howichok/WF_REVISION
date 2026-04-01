import { TOPICS, TOPIC_TREES } from "./types";
import type { MaterialCardData } from "@/components/ui";
import type {
  ActivityLog,
  DiagnosticResult,
  OnboardingData,
  RevisionProgressEntry,
} from "./types";

export function getWeakestTopics(diagnostic: DiagnosticResult | null, count = 3) {
  if (!diagnostic) {
    return [];
  }

  return [...diagnostic.topicScores]
    .sort((left, right) => left.score / left.maxScore - right.score / right.maxScore)
    .slice(0, count);
}

export function formatRelativeTime(isoString: string) {
  const timestamp = new Date(isoString).getTime();
  const now = Date.now();
  const diffInMinutes = Math.max(1, Math.round((now - timestamp) / (1000 * 60)));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  if (diffInDays === 1) {
    return "Yesterday";
  }

  return `${diffInDays} days ago`;
}

export function getWeekActivity(activityHistory: ActivityLog[]) {
  const output = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const startOfWeek = new Date(now);
  const offset = (now.getDay() + 6) % 7;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - offset);

  activityHistory.forEach((entry) => {
    const date = new Date(entry.occurredAt);
    if (date < startOfWeek) {
      return;
    }
    const dayIndex = (date.getDay() + 6) % 7;
    output[dayIndex] += entry.minutesSpent > 0 ? entry.minutesSpent / 60 : 1;
  });

  return output;
}

export function getThisWeekMinutes(activityHistory: ActivityLog[]) {
  const now = new Date();
  const startOfWeek = new Date(now);
  const offset = (now.getDay() + 6) % 7;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - offset);

  return activityHistory
    .filter((entry) => new Date(entry.occurredAt) >= startOfWeek)
    .reduce((sum, entry) => sum + entry.minutesSpent, 0);
}

export function getStudiedTopicCount(diagnostic: DiagnosticResult | null) {
  if (!diagnostic) {
    return 0;
  }

  return diagnostic.topicScores.filter(
    (topic) => (topic.score / topic.maxScore) * 100 >= 50
  ).length;
}

export function getSubtopicProgressForTopic(
  revisionProgress: RevisionProgressEntry[],
  topicId: string
) {
  const totalSubtopics =
    TOPIC_TREES.find((tree) => tree.topicId === topicId)?.subtopics.length ?? 0;
  const completed = revisionProgress.filter(
    (entry) =>
      entry.topicId === topicId &&
      entry.entityType === "subtopic" &&
      entry.status === "completed"
  ).length;

  const progressPercent =
    totalSubtopics === 0 ? 0 : Math.round((completed / totalSubtopics) * 100);

  return {
    totalSubtopics,
    completed,
    progressPercent,
  };
}

export function hydrateMaterialsWithProgress(
  materials: MaterialCardData[],
  revisionProgress: RevisionProgressEntry[]
) {
  const materialProgress = new Map(
    revisionProgress
      .filter((entry) => entry.entityType === "material")
      .map((entry) => [entry.entityId, entry.progressPercent])
  );

  return materials.map((material) => ({
    ...material,
    progress: materialProgress.get(material.id) ?? material.progress ?? 0,
  }));
}

export function getPracticeSetProgress(
  revisionProgress: RevisionProgressEntry[],
  topicId: string,
  practiceSetId: string
) {
  return (
    revisionProgress.find(
      (entry) =>
        entry.topicId === topicId &&
        entry.entityType === "practice-set" &&
        entry.entityId === practiceSetId
    ) ?? null
  );
}

export interface RevisitQueueItem {
  topicId: string;
  topicLabel: string;
  topicIcon: string;
  diagnosticPercent: number | null;
  practicePercent: number;
  urgency: "due-now" | "revisit-soon" | "keep-warm";
  reasons: string[];
  nextAction: string;
  suggestedTab: "practice" | "weak-areas";
  priority: number;
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getDaysSince(isoString: string) {
  const timestamp = new Date(isoString).getTime();
  const diff = Date.now() - timestamp;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function getRevisitQueue(
  diagnostic: DiagnosticResult | null,
  onboarding: OnboardingData | null,
  revisionProgress: RevisionProgressEntry[],
  activityHistory: ActivityLog[],
  count = 3
): RevisitQueueItem[] {
  const weakAreas = new Set(onboarding?.weakAreas ?? []);

  return TOPICS.filter((topic) => topic.id !== "esp")
    .map((topic) => {
      const diagnosticScore = diagnostic?.topicScores.find(
        (entry) => entry.category === topic.id
      );
      const diagnosticPercent = diagnosticScore
        ? Math.round((diagnosticScore.score / diagnosticScore.maxScore) * 100)
        : null;
      const topicPracticeEntries = revisionProgress.filter(
        (entry) => entry.topicId === topic.id && entry.entityType === "practice-set"
      );
      const practicePercent = average(
        topicPracticeEntries.map((entry) => entry.progressPercent)
      );
      const lastTopicActivity = activityHistory.find(
        (entry) => entry.topicId === topic.id
      );
      const completedSubtopics = revisionProgress.filter(
        (entry) =>
          entry.topicId === topic.id &&
          entry.entityType === "subtopic" &&
          entry.status === "completed"
      ).length;
      const totalSubtopics =
        TOPIC_TREES.find((tree) => tree.topicId === topic.id)?.subtopics.length ?? 0;
      const reviewCoverage =
        totalSubtopics > 0
          ? Math.round((completedSubtopics / totalSubtopics) * 100)
          : 0;
      const reasons: string[] = [];
      let priority = 0;

      if (diagnosticPercent !== null) {
        priority += Math.max(0, 100 - diagnosticPercent);

        if (diagnosticPercent < 50) {
          reasons.push(`Diagnostic score is still low at ${diagnosticPercent}%`);
        } else if (diagnosticPercent < 70) {
          reasons.push(`Diagnostic score is only partially secure at ${diagnosticPercent}%`);
        }
      } else {
        priority += 18;
        reasons.push("No structured diagnostic evidence has been saved yet");
      }

      if (weakAreas.has(topic.id)) {
        priority += 24;
        reasons.push("You marked this as a weak topic");
      }

      if (practicePercent === 0) {
        priority += 28;
        reasons.push("The practice sets for this topic have not been started");
      } else if (practicePercent < 50) {
        priority += 18;
        reasons.push(`Practice progress is still low at ${practicePercent}%`);
      } else if (practicePercent < 80) {
        priority += 8;
        reasons.push(`Practice is underway but not locked in yet at ${practicePercent}%`);
      }

      if (reviewCoverage < 50 && totalSubtopics > 0) {
        priority += 10;
        reasons.push(`Only ${reviewCoverage}% of subtopics are marked reviewed`);
      }

      if (!lastTopicActivity) {
        priority += 16;
        reasons.push("There is no recent activity on this topic");
      } else {
        const daysSince = getDaysSince(lastTopicActivity.occurredAt);

        if (daysSince >= 7) {
          priority += 14;
          reasons.push(`You have not revisited it for ${daysSince} days`);
        } else if (daysSince >= 3) {
          priority += 6;
          reasons.push(`It has been ${daysSince} days since your last attempt`);
        }
      }

      const urgency: RevisitQueueItem["urgency"] =
        priority >= 95 ? "due-now" : priority >= 55 ? "revisit-soon" : "keep-warm";
      const nextAction =
        practicePercent < 40
          ? "Run the recall and quiz cycle"
          : diagnosticPercent !== null && diagnosticPercent < 60
            ? "Re-check weak points with exam drill"
            : weakAreas.has(topic.id)
              ? "Tighten your weak-area practice"
              : "Refresh retrieval before the topic cools off";
      const suggestedTab: RevisitQueueItem["suggestedTab"] = weakAreas.has(topic.id)
        ? "weak-areas"
        : "practice";

      return {
        topicId: topic.id,
        topicLabel: topic.label,
        topicIcon: topic.icon,
        diagnosticPercent,
        practicePercent,
        urgency,
        reasons: reasons.slice(0, 3),
        nextAction,
        suggestedTab,
        priority,
      };
    })
    .filter((item) => item.priority > 0)
    .sort((left, right) => right.priority - left.priority)
    .slice(0, count);
}

export function resolveMaterialTopicId(material: Pick<MaterialCardData, "topic" | "topicId">) {
  if (material.topicId) {
    return material.topicId;
  }

  const normalizedTopic = material.topic.trim().toLowerCase();
  const match = TOPICS.find((topic) => {
    const normalizedLabel = topic.label.toLowerCase();
    const firstWord = normalizedLabel.split(" ")[0];

    return (
      normalizedLabel.includes(normalizedTopic) ||
      normalizedTopic.includes(firstWord)
    );
  });

  return match?.id ?? null;
}
