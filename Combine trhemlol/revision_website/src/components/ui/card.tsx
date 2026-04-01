import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<"section">) {
  return (
    <section
      {...props}
      className={cn(
        "relative overflow-hidden rounded-[1.8rem] border border-[#ddd5ca] bg-[#f7f3ed] p-6 text-slate-800 shadow-[0_28px_60px_-38px_rgba(15,35,72,0.45)] transition-colors",
        className,
      )}
    >
      <div className="relative z-10">{children}</div>
    </section>
  );
}
