"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PracticeHub } from "@/components/revision/practice-hub";
import { RevisionLearningPath } from "@/components/revision/revision-learning-path";
import { RevisionSubnav } from "@/components/revision/revision-subnav";

export default function RevisionPage() {
  return (
    <PageContainer size="md">
      <div className="space-y-6">
        <div className="perf-fade-up" style={{ animationDelay: "0ms" }}>
          <RevisionSubnav activeRoute="hub" />
        </div>

        <div className="perf-fade-up" style={{ animationDelay: "60ms" }}>
          <RevisionLearningPath />
        </div>

        <div className="perf-fade-up" style={{ animationDelay: "120ms" }}>
          <PracticeHub />
        </div>
      </div>
    </PageContainer>
  );
}
