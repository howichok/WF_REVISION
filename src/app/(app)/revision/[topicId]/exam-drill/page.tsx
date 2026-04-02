import { redirect } from "next/navigation";

export default async function TopicExamDrillRedirectPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  redirect(`/revision/${topicId}/exam-conditions`);
}
