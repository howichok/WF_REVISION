"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { RevisionSubnav } from "@/components/revision/revision-subnav";
import { CODEX_ESP_PRACTICE_METADATA } from "@/data/curriculum";
import type { EspTask } from "@/data/curriculum";
import { getEspTaskExplainerScenes } from "@/data/esp/esp-task-lessons";
import { EspExplainerPlayer } from "@/components/revision/esp/esp-explainer-player";
import {
  ESP_TASK_STEPS,
  getEspChecklist,
  getEspQuestionContext,
  getEspTaskHref,
  groupEspQuestionsByTask,
} from "@/components/revision/esp/esp-task-meta";
import { cn } from "@/lib/utils";

export interface EspTaskLessonPageProps {
  taskId: EspTask;
}

export function EspTaskLessonPage({ taskId }: EspTaskLessonPageProps) {
  const scenes = getEspTaskExplainerScenes(taskId);
  const stepMeta = ESP_TASK_STEPS.find((s) => s.id === taskId) ?? ESP_TASK_STEPS[1]!;
  const questionsByTask = useMemo(() => groupEspQuestionsByTask(CODEX_ESP_PRACTICE_METADATA), []);
  const selectedQuestions = questionsByTask[taskId];
  const [questionIndex, setQuestionIndex] = useState(0);
  const [checkedPoints, setCheckedPoints] = useState<Set<number>>(() => new Set());
  const [draft, setDraft] = useState("");

  const questionPool =
    selectedQuestions.length > 0
      ? selectedQuestions
      : CODEX_ESP_PRACTICE_METADATA.filter((question) => question.examMetadata?.espTask === taskId);
  const selectedQuestion = questionPool.length > 0 ? questionPool[questionIndex % questionPool.length] : undefined;
  const checklist = selectedQuestion ? getEspChecklist(selectedQuestion) : [];
  const otherTasks = ESP_TASK_STEPS.filter((task) => task.id !== taskId);

  function loadNextQuestion() {
    if (questionPool.length === 0) return;
    setQuestionIndex((index) => (index + 1) % questionPool.length);
    setCheckedPoints(new Set());
    setDraft("");
  }

  function togglePoint(index: number) {
    setCheckedPoints((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <PageContainer size="xl" className="py-6 sm:py-8">
      <div className="space-y-6">
        <RevisionSubnav activeRoute="esp" />

        <div className="flex flex-col gap-4 border-b border-border/50 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/revision/esp"
              className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={14} />
              ESP intro
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
              {stepMeta.label}: {stepMeta.action}
            </h1>
          </div>

          <nav aria-label="Other ESP task lessons" className="flex flex-wrap gap-2 text-xs">
            {otherTasks.map((task) => (
              <Link
                key={task.id}
                href={getEspTaskHref(task.id)}
                className={cn(
                  "rounded-md border border-border/70 px-3 py-2 text-muted-foreground transition-colors hover:border-border-light hover:text-foreground",
                  task.id === "pre_release" ? "border-[#2dd4bf]/35 text-muted" : ""
                )}
              >
                {task.label}
              </Link>
            ))}
          </nav>
        </div>

        <EspExplainerPlayer
          scenes={scenes}
          taskLabel={stepMeta.label}
          taskAction={stepMeta.action}
          practice={{
            question: selectedQuestion,
            questionCount: questionPool.length,
            context: selectedQuestion ? getEspQuestionContext(selectedQuestion) : "",
            checklist,
            checkedPoints,
            draft,
            onTogglePoint: togglePoint,
            onDraftChange: setDraft,
            onLoadNext: loadNextQuestion,
          }}
        />
      </div>
    </PageContainer>
  );
}
