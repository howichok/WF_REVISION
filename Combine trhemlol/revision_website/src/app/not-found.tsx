import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-[#ddd5ca] bg-[#f7f3ed] p-10">
      <p className="text-xs uppercase tracking-[0.25em] text-[#2f69b5]">Not found</p>
      <h1 className="mt-3 text-4xl font-semibold text-slate-900">This revision surface does not exist.</h1>
      <p className="mt-3 text-sm text-slate-600">Return to the dashboard or reopen the question bank from the navigation.</p>
      <Link href="/" className="app-button-blue mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
