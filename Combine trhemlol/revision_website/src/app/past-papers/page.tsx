import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { loadLibraryResources } from "@/lib/content/loaders";

export default function PastPapersPage() {
  const resources = loadLibraryResources().filter(
    (resource) => resource.category === "Past Papers" || resource.category === "Mark Schemes",
  );

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 pb-24">
      <header className="space-y-4">
        <Pill variant="accent">Library collection</Pill>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Past papers and mark schemes</h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          This area stays browse-led. Use it to open paper documents, compare them with mark schemes, and reference
          exam material without entering the active Revision flow.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {resources.map((resource) => (
          <Card key={resource.id} className="bg-[#f7f3ed] p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Pill>{resource.category}</Pill>
              {resource.tags.map((tag) => (
                <Pill key={`${resource.id}-${tag}`}>{tag}</Pill>
              ))}
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">{resource.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p>
            <Link
              href={resource.href}
              target="_blank"
              className="app-button-blue mt-5"
            >
              Open resource
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
