import { redirect } from "next/navigation";

/** Legacy URL: timed exam workspace moved to `/revision/.../exam-questions`. */
export default async function LegacyExamConditionsRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { topicId } = await params;
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        q.append(key, v);
      }
    } else {
      q.set(key, value);
    }
  }
  const suffix = q.size > 0 ? `?${q.toString()}` : "";
  redirect(`/revision/${topicId}/exam-questions${suffix}`);
}
