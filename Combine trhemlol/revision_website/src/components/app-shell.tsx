import { TopBar } from "@/components/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-slate-900">
      <main className="mx-auto max-w-[1360px] px-4 py-5 sm:px-6 lg:px-8">
        <TopBar />
        <div className="mt-5">{children}</div>
      </main>
    </div>
  );
}
