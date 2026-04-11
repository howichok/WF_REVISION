"use client";

import { LearningRail } from "./learning-rail";
import { MobileLearningRail } from "./mobile-learning-rail";
import { TaskActionBar } from "./task-action-bar";
import type { ActiveLearningLayoutProps } from "./types";

export function ActiveLearningLayout({
  hideRail = false,
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
    <div className={hideRail ? "al-shell al-shell--no-rail" : "al-shell"}>
      {hideRail ? null : (
        <MobileLearningRail
          backHref={backHref}
          railTitle={railTitle}
          railSubtitle={railSubtitle}
          railIcon={railIcon}
          railItems={railItems}
          railSummary={railSummary}
          mobileSummaryLabel={mobileSummaryLabel}
        />
      )}

      <div className={hideRail ? "al-shell-grid al-shell-grid--single" : "al-shell-grid"}>
        {hideRail ? null : (
          <LearningRail
            backHref={backHref}
            railTitle={railTitle}
            railSubtitle={railSubtitle}
            railIcon={railIcon}
            railItems={railItems}
            railSummary={railSummary}
          />
        )}

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
