import { DrillView } from "@/components/drill-view";
import { loadQuestionBank } from "@/lib/content/loaders";

export default async function Paper2DrillPage({
  searchParams,
}: {
  searchParams: Promise<{ time?: string }>;
}) {
  const { time } = await searchParams;
  const minutes = Math.max(5, Number(time) || 10);
  const questions = loadQuestionBank()
    .filter((question) => question.paper === "paper-2")
    .slice(0, minutes <= 10 ? 3 : 6);

  return <DrillView paper="paper-2" minutes={minutes} questions={questions} />;
}
