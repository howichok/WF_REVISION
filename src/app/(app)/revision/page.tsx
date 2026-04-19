"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PracticeHub } from "@/components/features/revision/practice-hub";

export default function RevisionPage() {
  return (
    <PageContainer size="xl" className="py-10 sm:py-14">
      <PracticeHub />
    </PageContainer>
  );
}
