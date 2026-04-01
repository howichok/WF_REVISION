"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const modeItems = [
  { href: "/revision", label: "Revision" },
  { href: "/library", label: "Library" },
];

const revisionItems = [
  { href: "/revision", label: "Dashboard" },
  { href: "/paper-1", label: "Core Paper 1" },
  { href: "/paper-2", label: "Core Paper 2" },
  { href: "/esp", label: "Employer Set Project" },
  { href: "/os", label: "Occupational Specialism" },
  { href: "/question-bank", label: "Question Bank" },
  { href: "/mock-exams", label: "Mock Exams" },
  { href: "/mistakes", label: "Mistakes & Retries" },
  { href: "/progress", label: "Progress Diagnostics" },
  { href: "/planner", label: "Planner" },
  { href: "/weak-topics", label: "Weak Topics" },
];

const libraryItems = [
  { href: "/library", label: "Library Home" },
  { href: "/past-papers", label: "Past Papers" },
];

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between rounded-xl px-3 py-2 text-[15px] font-medium transition-all",
        active
          ? "bg-accent/10 text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-accent/20"
          : "text-muted hover:bg-white/5 hover:text-white",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-transform",
          active ? "scale-100 bg-accent shadow-[0_0_8px_rgba(59,130,246,0.8)]" : "scale-0 bg-transparent",
        )}
      />
    </Link>
  );
}

export function SidebarNav() {
  const auth = useAuth();
  const pathname = usePathname();
  const isReady = Boolean(auth.currentUser?.profile.onboardingCompleted);
  const isLibraryMode = pathname.startsWith("/library") || pathname.startsWith("/past-papers");

  return (
    <aside className="sticky top-0 flex h-screen w-full max-w-[19rem] flex-col border-r border-line/70 bg-slate-950/75 p-4 backdrop-blur xl:max-w-[18rem]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">T Level DSD</p>
        <h1 className="mt-2 text-2xl font-semibold text-text">Revision OS</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {isReady ? "Personalised revision and resource workspace." : "A softer first-run setup with saved local progress."}
        </p>
      </div>

      <div className="mt-8">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Modes</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {modeItems.map((section) => {
            const active = section.href === "/library" ? isLibraryMode : !isLibraryMode;

            return (
              <Link
                key={section.href}
                href={section.href}
                className={cn(
                  "rounded-xl border px-3 py-3 text-center text-sm font-semibold transition",
                  active
                    ? "border-accent/30 bg-accent/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-muted hover:text-white",
                )}
              >
                {section.label}
              </Link>
            );
          })}
        </div>
      </div>

      {isReady ? (
        <nav className="mt-8 flex flex-col gap-6 overflow-y-auto pb-4 pr-2">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Revision</p>
            {revisionItems.map((section) => {
              const active =
                pathname === section.href ||
                (section.href !== "/revision" && section.href !== "/" && pathname.startsWith(`${section.href}/`)) ||
                (section.href === "/revision" && (pathname === "/" || pathname === "/revision"));

              return <NavLink key={section.href} href={section.href} label={section.label} active={active} />;
            })}
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Library</p>
            {libraryItems.map((section) => {
              const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
              return <NavLink key={section.href} href={section.href} label={section.label} active={active} />;
            })}
          </div>
        </nav>
      ) : (
        <div className="mt-8 space-y-3">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-muted">Locked until setup</p>
          <div className="rounded-2xl border border-white/5 bg-panel/30 p-4">
            <p className="text-sm font-semibold text-white">1. Pick your study path</p>
            <p className="mt-2 text-sm text-muted">Choose the papers or routes you want the workspace to focus on.</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-panel/30 p-4">
            <p className="text-sm font-semibold text-white">2. Finish onboarding</p>
            <p className="mt-2 text-sm text-muted">Study path, weak areas, placement burst, and exam priority.</p>
          </div>
        </div>
      )}

      <div className="mt-auto rounded-2xl border border-white/5 bg-panel/30 p-4 shadow-inner">
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Profile state</p>
        <p className="mt-2 text-xs leading-5 text-muted">
          {auth.currentUser ? "Saved locally for this device and this browser." : "Preparing local profile."}
        </p>
      </div>
    </aside>
  );
}
