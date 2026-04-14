import { Navbar } from "@/components/layout/navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl min-h-0 flex-1 px-4 pb-12 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
