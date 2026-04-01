"use client";

import Link from "next/link";
import { BookOpenText, ChevronRight, FileArchive, FileText, FolderOpen, GraduationCap } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { BrandMark } from "@/components/ui/brand-mark";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { groupResourcesByCategory, getPaperLabel } from "@/lib/domain/personalisation";
import type { LibraryResource } from "@/lib/domain/types";

const categoryMeta: Record<
  LibraryResource["category"],
  { icon: typeof FileArchive; label: string; description: string }
> = {
  "Past Papers": {
    icon: FileArchive,
    label: "Past Papers",
    description: "Timed paper packs and exam material that stay separate from guided question flow.",
  },
  "Mark Schemes": {
    icon: GraduationCap,
    label: "Mark Schemes",
    description: "Examiner-side references for checking answers, mark distribution, and expected points.",
  },
  PDFs: {
    icon: FileText,
    label: "PDF Resources",
    description: "Specifications, support PDFs, and longer-form reference material.",
  },
  "Revision Notes": {
    icon: BookOpenText,
    label: "Revision Notes",
    description: "Notes, summaries, and browse-oriented support content for calmer study sessions.",
  },
  "Teacher Resources": {
    icon: FolderOpen,
    label: "Teacher Resources",
    description: "Course packs, planning assets, and classroom support materials.",
  },
};

export function LibraryView({ resources }: { resources: LibraryResource[] }) {
  const auth = useAuth();
  const grouped = groupResourcesByCategory(resources);
  const selectedPapers = auth.currentUser?.profile.selectedPapers ?? [];
  const recommendedResources = resources.filter((resource) =>
    resource.tags.some((tag) => selectedPapers.map((paper) => getPaperLabel(paper)).includes(tag)),
  );

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-col gap-7 pb-24">
      <section className="rounded-[2rem] border border-[#ddd5ca] bg-[#f7f3ed] p-6 shadow-[0_30px_70px_-44px_rgba(15,35,72,0.5)]">
        <div className="flex flex-col gap-4 border-b border-[#e4dbd0] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <BrandMark />
            <div className="flex items-center gap-2">
              <Link href="/revision" className="rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600">
                Revision
              </Link>
              <span className="rounded-full bg-[#edf4fd] px-4 py-2 text-sm font-semibold text-[#2f69b5]">Library</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill>{resources.length} resources indexed</Pill>
            <Pill variant="accent">Browse mode</Pill>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.55rem] bg-[linear-gradient(135deg,#6e9bdd,#2f69b5)] px-5 py-6 text-white shadow-[0_28px_48px_-34px_rgba(47,105,181,0.8)]">
            <h1 className="text-[2.2rem] font-semibold tracking-tight">Library</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-blue-50">
              This is the calmer side of the platform: past papers, mark schemes, PDFs, revision notes, and resource
              packs you can browse without being forced into an active question flow.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { label: "Past papers", value: grouped["Past Papers"].length },
                { label: "Mark schemes", value: grouped["Mark Schemes"].length },
                { label: "Notes + PDFs", value: grouped["Revision Notes"].length + grouped.PDFs.length },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.2rem] bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-sm text-blue-100">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-white/72 p-5">
            <h2 className="text-[1.6rem] font-semibold tracking-tight text-slate-900">Recommended for your path</h2>
            <div className="mt-4 space-y-3">
              {(recommendedResources.length ? recommendedResources.slice(0, 4) : resources.slice(0, 4)).map((resource) => (
                <Link key={resource.id} href={resource.href} target="_blank" className="app-list-row">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{resource.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{resource.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="bg-[#f7f3ed] p-0">
          <div className="border-b border-[#e4dbd0] px-6 py-4">
            <BrandMark label="Library" className="[&>span]:text-[1.9rem]" />
            <div className="mt-3 h-1.5 w-24 rounded-full bg-[#2f69b5]" />
          </div>

          <div className="px-6 py-6">
            <h2 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">Resource Library</h2>
            <div className="mt-5 space-y-3">
              {Object.entries(grouped).map(([category, items]) => {
                const meta = categoryMeta[category as LibraryResource["category"]];
                const Icon = meta.icon;

                return (
                  <div key={category} className="app-list-row">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4fd] text-[#2f69b5]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{meta.label}</p>
                        <p className="text-xs text-slate-500">{items.length} resources ready</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => {
            const meta = categoryMeta[category as LibraryResource["category"]];
            const Icon = meta.icon;

            return (
              <Card key={category} className="bg-[#f7f3ed] p-6">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4fd] text-[#2f69b5]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{meta.label}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{meta.description}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {items.map((resource) => (
                    <Link key={resource.id} href={resource.href} target="_blank" className="app-list-row">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{resource.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{resource.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
