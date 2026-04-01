import { redirect } from "next/navigation";

function paperFromSlug(slug: string): "paper1" | "paper2" {
  if (slug === "p2" || slug === "paper2") {
    return "paper2";
  }
  return "paper1";
}

export default function LegacyLibraryNodePage({
  params,
}: {
  params: { paper: string; topic: string };
}) {
  const paper = paperFromSlug(params.paper);
  const node = decodeURIComponent(params.topic);
  redirect(`/library?paper=${paper}&node=${encodeURIComponent(node)}`);
}

