"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import type { QuickQuizStage } from "@/components/revision/quick-quiz";

const QuickQuiz = dynamic(
  () => import("@/components/revision/quick-quiz").then((m) => ({ default: m.QuickQuiz })),
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

export default function QuickQuizPage() {
  const [stage, setStage] = useState<QuickQuizStage>("launcher");

  return (
    <PageContainer size="lg">
      <div className={stage === "launcher" ? "space-y-6" : undefined}>
        {stage === "launcher" ? <RevisionSubnav activeRoute="quick-quiz" /> : null}
        <QuickQuiz onStageChange={setStage} />
      </div>
    </PageContainer>
  );
}
