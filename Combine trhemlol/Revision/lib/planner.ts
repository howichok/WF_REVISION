import { assessableTopics } from "@/lib/content";
import { EXAM_DATES } from "@/lib/constants";
import type { PersistedAppState, PaperId, TopicProgress, TopicWorkload } from "@/lib/types";

export interface PlanTask {
  topicId: string;
  title: string;
  paperId: PaperId;
  minutes: number;
  reason: string;
}

export interface WeekPlanDay {
  isoDate: string;
  label: string;
  tasks: PlanTask[];
}

export interface RevisionPlan {
  phase: "before-paper1" | "between-papers" | "after-paper2";
  paperFocus: Record<PaperId, number>;
  daysUntilPaper1: number;
  daysUntilPaper2: number;
  recommendedMinutesPerDay: number;
  workloads: TopicWorkload[];
  todayTasks: PlanTask[];
  weekPlan: WeekPlanDay[];
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysBetween(from: Date, to: Date): number {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diff = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.max(0, Math.ceil(diff / oneDayMs));
}

function inferPhase(now: Date): RevisionPlan["phase"] {
  if (now < EXAM_DATES.paper1) {
    return "before-paper1";
  }
  if (now < EXAM_DATES.paper2) {
    return "between-papers";
  }
  return "after-paper2";
}

function getPaperFocus(phase: RevisionPlan["phase"]): Record<PaperId, number> {
  if (phase === "before-paper1") {
    return { paper1: 0.7, paper2: 0.3 };
  }
  if (phase === "between-papers") {
    return { paper1: 0.15, paper2: 0.85 };
  }
  return { paper1: 0.4, paper2: 0.6 };
}

function baseMinutesPerDay(state: PersistedAppState): number {
  const { minutesPerDay, hoursPerWeek, daysPerWeek } = state.settings;

  if (minutesPerDay && minutesPerDay > 0) {
    return Math.round(minutesPerDay);
  }

  if (hoursPerWeek && hoursPerWeek > 0) {
    const activeDays = Math.max(1, daysPerWeek || 5);
    return Math.max(20, Math.round((hoursPerWeek * 60) / activeDays));
  }

  return 45;
}

function buildWorkload(topicProgress: Record<string, TopicProgress>, paperFocus: Record<PaperId, number>): TopicWorkload[] {
  return assessableTopics
    .map((topic) => {
      const progress = topicProgress[topic.id];
      const mastery = progress?.mastery ?? 50;
      const weakBonus = progress?.weakBonus ?? 0;
      const weaknessWeight = Math.max(5, (100 - mastery) + weakBonus);
      const paperWeight = weaknessWeight * paperFocus[topic.paperId as PaperId];

      return {
        topicId: topic.id,
        title: topic.title,
        paperId: topic.paperId as PaperId,
        mastery,
        weakManual: progress?.weakManual ?? false,
        weight: Number(paperWeight.toFixed(2)),
      };
    })
    .sort((a, b) => b.weight - a.weight);
}

function allocateMinutes(topics: TopicWorkload[], targetMinutes: number): PlanTask[] {
  if (topics.length === 0 || targetMinutes <= 0) {
    return [];
  }

  const topSlice = topics.slice(0, Math.min(3, topics.length));
  const totalWeight = topSlice.reduce((sum, item) => sum + item.weight, 0);

  return topSlice.map((topic, index) => {
    const raw = totalWeight > 0 ? (targetMinutes * topic.weight) / totalWeight : targetMinutes / topSlice.length;
    const minutes = index === topSlice.length - 1
      ? Math.max(10, targetMinutes - topSlice.slice(0, index).reduce((sum, item) => sum + Math.max(10, Math.round((targetMinutes * item.weight) / totalWeight)), 0))
      : Math.max(10, Math.round(raw));

    const reason = topic.weakManual
      ? "Marked weak manually + low mastery"
      : topic.mastery < 60
      ? "Low mastery detected"
      : "Scheduled for maintenance";

    return {
      topicId: topic.topicId,
      title: topic.title,
      paperId: topic.paperId,
      minutes,
      reason,
    };
  });
}

function recommendedMinutes(state: PersistedAppState, phase: RevisionPlan["phase"], workloads: TopicWorkload[], now: Date): number {
  const base = baseMinutesPerDay(state);
  const targetExamDate = phase === "before-paper1" ? EXAM_DATES.paper1 : EXAM_DATES.paper2;
  const daysLeft = Math.max(1, daysBetween(now, targetExamDate));
  const weightedLoad = workloads.reduce((sum, item) => sum + item.weight, 0);
  const catchup = Math.ceil((weightedLoad * 1.8) / daysLeft);

  return Math.max(base, Math.min(180, catchup));
}

function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function buildWeekPlan(workloads: TopicWorkload[], minutesPerDay: number, now: Date): WeekPlanDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() + index);

    const shift = index % Math.max(1, workloads.length);
    const rotated = workloads.length > 0
      ? [...workloads.slice(shift), ...workloads.slice(0, shift)]
      : [];

    return {
      isoDate: date.toISOString(),
      label: formatDayLabel(date),
      tasks: allocateMinutes(rotated, minutesPerDay),
    };
  });
}

export function buildRevisionPlan(state: PersistedAppState, now = new Date()): RevisionPlan {
  const phase = inferPhase(now);
  const paperFocus = getPaperFocus(phase);
  const workloads = buildWorkload(state.topicProgress, paperFocus);
  const recommendedMinutesPerDay = recommendedMinutes(state, phase, workloads, now);

  return {
    phase,
    paperFocus,
    daysUntilPaper1: daysBetween(now, EXAM_DATES.paper1),
    daysUntilPaper2: daysBetween(now, EXAM_DATES.paper2),
    recommendedMinutesPerDay,
    workloads,
    todayTasks: allocateMinutes(workloads, recommendedMinutesPerDay),
    weekPlan: buildWeekPlan(workloads, recommendedMinutesPerDay, now),
  };
}
