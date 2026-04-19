"use client";

import dynamic from "next/dynamic";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/features/revision/revision-subnav";
import { useAppData } from "@/components/providers/app-data-provider";
import type { DiagnosticResult } from "@/lib/types";

const DiagnosticWorkspace = dynamic(
  () =>
    import("@/components/features/revision/diagnostic-workspace").then((m) => ({
      default: m.DiagnosticWorkspace,
    })),
  {
    loading: () => (
      <div
        className="min-h-[min(70vh,520px)] w-full rounded-2xl border border-border bg-card/40 animate-pulse"
        aria-busy
        aria-label="Loading diagnostic"
      />
    ),
    ssr: false,
  }
);

export default function DiagnosticPage() {
  const { diagnostic, saveDiagnosticResult } = useAppData();

  async function handleComplete(result: DiagnosticResult) {
    await saveDiagnosticResult(result);
  }

  return (
    <PageContainer size="lg" className="max-w-[88rem]">
      <div className="mb-6 space-y-6">
        <RevisionSubnav activeRoute="diagnostic" />
        <DiagnosticWorkspace diagnostic={diagnostic} onComplete={handleComplete} />
      </div>
    </PageContainer>
  );
}
