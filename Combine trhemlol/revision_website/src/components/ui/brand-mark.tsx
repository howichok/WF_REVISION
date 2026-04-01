import { cn } from "@/lib/utils";

export function BrandMark({
  label = "Revision",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-9 w-9 shrink-0">
        <span className="absolute left-0 top-1 h-5 w-6 rounded-[0.7rem] bg-[linear-gradient(180deg,#5f93d4,#2f69b5)] shadow-[0_12px_18px_-12px_rgba(47,105,181,0.9)]" />
        <span className="absolute bottom-0 left-1 h-4 w-5 rounded-[0.6rem] bg-[linear-gradient(180deg,#eb9b55,#d97b2f)] shadow-[0_12px_18px_-12px_rgba(217,123,47,0.85)]" />
        <span className="absolute right-0 top-2 h-4 w-4 rounded-[0.55rem] bg-[#f6f3ee] ring-1 ring-[#e0d6cb]" />
      </div>
      <span className="text-[1.85rem] font-semibold tracking-tight text-slate-800">{label}</span>
    </div>
  );
}
