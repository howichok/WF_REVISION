"use client";

import { useParams, useSearchParams } from "next/navigation";
import { TopicRouteShell } from "@/components/revision/topic-route-shell";
import { useAppData } from "@/components/providers/app-data-provider";
import { ExamDrillPanel } from "@/components/revision/topic-learning-modes";
import { getPracticeSetId, getTopicPracticeBundle } from "@/lib/practice";
import { getPracticeSetProgress } from "@/lib/progress";
import { getTopicById } from "@/lib/types";

export default function TopicExamDrillPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topicId = typeof params.topicId === "string" ? params.topicId : "";
  const preferredDrillId = searchParams.get("drillId") ?? undefined;
  const topicInfo = getTopicById(topicId);
  const { revisionProgress, trackPracticeSetProgress, sharedCurriculum } = useAppData();

  if (!topicInfo) {
    return null;
  }

  const bundle = getTopicPracticeBundle(topicId, sharedCurriculum);
  const practiceSetId = getPracticeSetId(topicId, "exam-drill");
  const examProgress =
    getPracticeSetProgress(revisionProgress, topicId, practiceSetId)?.progressPercent ?? 0;

  return (
    <TopicRouteShell
      topicId={topicId}
      activeMode="exam-drill"
      eyebrow="Exam conditions"
      title={topicInfo.label}
      description="Step 1 of the exam route: plan the answer, use hints only if needed, then move into the final written response."
    >
      <ExamDrillPanel
        topicId={topicId}
        topicLabel={topicInfo.label}
        topicIcon={topicInfo.icon}
        drills={bundle.examDrills}
        progressPercent={examProgress}
        revisionProgress={revisionProgress}
        preferredDrillId={preferredDrillId}
        onComplete={(progressPercent) =>
          trackPracticeSetProgress({
            practiceSetId,
            topicId,
            title: `${topicInfo.label} exam drill`,
            progressPercent,
            minutesSpent: Math.max(12, bundle.examDrills.length * 4),
          })
        }
      />
    </TopicRouteShell>
  );
}
