import { LibraryView } from "@/components/library-view";
import { loadLibraryResources } from "@/lib/content/loaders";

export default function LibraryPage() {
  const resources = loadLibraryResources();

  return <LibraryView resources={resources} />;
}
