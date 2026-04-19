"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionFocusNav } from "@/components/features/revision/revision-focus-nav";
import type { QuickQuizStage } from "@/components/features/revision/quick-quiz";

const QuickQuiz = dynamic(
  () => import("@/components/features/revision/quick-quiz").then((m) => ({ default: m.QuickQuiz })),
  {
    loading: () => (
      <div
        className="min-h-[280px] rounded-2xl border border-border bg-card/50 animate-pulse"
        aria-hidden
      />
    ),
    ssr: false,
  }
);

function QuickQuizPageInner() {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<QuickQuizStage>("launcher");

  const topicsParam = searchParams.get("topics");
  const topicIds = useMemo(() => {
    if (!topicsParam?.trim()) return undefined;
    const ids = topicsParam
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return ids.length ? ids : undefined;
  }, [topicsParam]);
  const autoStart = searchParams.get("autoStart") === "1";

  return (
    <div className={stage === "launcher" ? "space-y-6" : undefined}>
      {stage === "launcher" ? <RevisionFocusNav activeMode="simple" /> : null}
      <QuickQuiz topicIds={topicIds} autoStart={autoStart} onStageChange={setStage} />
    </div>
  );
}

export default function QuickQuizPage() {
  return (
    <PageContainer size="lg">
      <Suspense fallback={null}>
        <QuickQuizPageInner />
      </Suspense>
    </PageContainer>
  );
}
