import { Navbar } from "@/components/layout/navbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-6 sm:px-8 pb-10">{children}</div>
    </div>
  );
}
