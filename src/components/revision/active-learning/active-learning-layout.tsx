"use client";

import { LearningRail } from "./learning-rail";
import { MobileLearningRail } from "./mobile-learning-rail";
import { TaskActionBar } from "./task-action-bar";
import type { ActiveLearningLayoutProps } from "./types";

export function ActiveLearningLayout({
  backHref,
  railTitle,
  railSubtitle,
  railIcon,
  railItems,
  railSummary,
  mobileSummaryLabel,
  contextStrip,
  task,
  response,
  feedback,
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: ActiveLearningLayoutProps) {
  return (
    <div className="al-shell">
      <MobileLearningRail
        backHref={backHref}
        railTitle={railTitle}
        railSubtitle={railSubtitle}
        railIcon={railIcon}
        railItems={railItems}
        railSummary={railSummary}
        mobileSummaryLabel={mobileSummaryLabel}
      />

      <div className="al-shell-grid">
        <LearningRail
          backHref={backHref}
          railTitle={railTitle}
          railSubtitle={railSubtitle}
          railIcon={railIcon}
          railItems={railItems}
          railSummary={railSummary}
        />

        <main className="al-task-column">
          {contextStrip}
          {task}
          {response}
          {feedback ?? null}

          <TaskActionBar
            primaryAction={primaryAction}
            secondaryAction={secondaryAction}
            tertiaryAction={tertiaryAction}
          />
        </main>
      </div>
    </div>
  );
}
