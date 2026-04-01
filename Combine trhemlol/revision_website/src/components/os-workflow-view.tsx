import { ArrowRight, CheckCircle2, Circle, Lock, Terminal } from "lucide-react";

import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

const OS_STEPS = [
  { id: "requirements", title: "Requirements Analysis", status: "completed" },
  { id: "ethics", title: "Ethics / Risk / Legal", status: "completed" },
  { id: "research", title: "Research Quality", status: "current" },
  { id: "design", title: "UCD / Design", status: "locked" },
  { id: "implementation", title: "Implementation (Algorithms & DB)", status: "locked" },
  { id: "testing", title: "Testing & Trace Matrices", status: "locked" },
  { id: "maintenance", title: "Maintenance / Support", status: "locked" },
];

export function OSWorkflowView() {
  const progressPercent = (OS_STEPS.filter((step) => step.status === "completed").length / OS_STEPS.length) * 100;

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-10 pb-24">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <Pill variant="accent" icon={Terminal}>
            Occupational Specialism
          </Pill>
          <span className="rounded-full border border-[#bdd3ef] bg-[#edf4fd] px-3 py-1 text-xs font-mono font-medium text-[#2f69b5]">
            {Math.round(progressPercent)}% lab ready
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Software Lab & Implementation</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
          Move through requirements, ethics, research, design, implementation, testing, and support in a clearer
          practical workflow.
        </p>
      </header>

      <div className="relative flex flex-col gap-3">
        <div className="absolute bottom-10 left-6 top-10 z-0 w-px bg-[#d9d0c4] lg:left-8" />

        {OS_STEPS.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";

          return (
            <div
              key={step.id}
              className={cn(
                "relative z-10 flex items-center gap-6 rounded-[1.2rem] border p-5 transition",
                isCompleted
                  ? "border-[#d4e5cb] bg-[#edf7ef]"
                  : isCurrent
                    ? "border-[#bdd3ef] bg-[#edf4fd]"
                    : "border-[#ddd5ca] bg-[#f7f3ed]",
              )}
            >
              <div className="shrink-0 bg-white/70 p-1">
                {isCompleted ? <CheckCircle2 className="h-6 w-6 text-[#4b8f60]" /> : null}
                {isCurrent ? <Circle className="h-6 w-6 text-[#2f69b5]" /> : null}
                {!isCompleted && !isCurrent ? <Lock className="h-6 w-6 text-slate-400" /> : null}
              </div>

              <div className="flex-1 space-y-1">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                  Lab phase {index + 1}
                </span>
                <h4 className={cn("text-lg font-bold", isCurrent ? "text-[#2f69b5]" : "text-slate-900")}>{step.title}</h4>
              </div>

              <div className="shrink-0 rounded-xl bg-white/80 p-3 text-slate-400">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
