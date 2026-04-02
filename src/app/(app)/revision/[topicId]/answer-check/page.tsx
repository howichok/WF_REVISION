import { redirect } from "next/navigation";

export default async function TopicAnswerCheckRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ questionId?: string }>;
}) {
  const { topicId } = await params;
  const { questionId } = await searchParams;
  const nextSearch = new URLSearchParams();

  if (questionId) {
    nextSearch.set("questionId", questionId);
  }

  const href = nextSearch.size
    ? `/revision/${topicId}/exam-conditions?${nextSearch.toString()}`
    : `/revision/${topicId}/exam-conditions`;

  redirect(href);
}
