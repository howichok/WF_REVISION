import { redirect } from "next/navigation";
import { mapLegacyTopicTabToRoute } from "@/lib/revision-routes";

export default async function TopicRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { topicId } = await params;
  const resolvedSearchParams = await searchParams;
  const tabValue = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab;

  redirect(mapLegacyTopicTabToRoute(topicId, tabValue));
}

