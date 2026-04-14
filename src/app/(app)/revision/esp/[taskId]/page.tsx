import { notFound } from "next/navigation";
import { EspTaskLessonPage } from "@/components/revision/esp/esp-task-lesson-page";
import type { EspTask } from "@/data/curriculum";

const TASK_BY_SLUG: Record<string, EspTask> = {
  "pre-release": "pre_release",
  "task-1": "task_1",
  "task-2": "task_2",
  "task-3": "task_3",
  "task-4a": "task_4a",
  "task-4b": "task_4b",
};

export default async function EspTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const resolvedTaskId = TASK_BY_SLUG[taskId];

  if (!resolvedTaskId) {
    notFound();
  }

  return <EspTaskLessonPage taskId={resolvedTaskId} />;
}
