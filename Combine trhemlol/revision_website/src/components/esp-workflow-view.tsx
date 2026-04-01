import { ArrowRight, Briefcase, CheckCircle2, Circle, Lock } from "lucide-react";

import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

const ESP_STEPS = [
  { id: "brief", title: "Understanding the Brief", status: "completed" },
  { id: "requirements", title: "Requirements (Functional & Non-Functional)", status: "current" },
  { id: "acceptance-criteria", title: "Acceptance Criteria", status: "locked" },
  { id: "kpis", title: "KPIs", status: "locked" },
  { id: "constraints", title: "Constraints", status: "locked" },
  { id: "risks", title: "Risks", status: "locked" },
  { id: "planning", title: "Planning / Resources / Costs", status: "locked" },
  { id: "design", title: "Design", status: "locked" },
  { id: "implementation", title: "Implementation", status: "locked" },
  { id: "testing", title: "Testing", status: "locked" },
  { id: "deployment", title: "Deployment / Support", status: "locked" },
  { id: "evaluation", title: "Reflection / Evaluation", status: "locked" },
];

export function ESPWorkflowView() {
  const progressPercent = (ESP_STEPS.filter((step) => step.status === "completed").length / ESP_STEPS.length) * 100;

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 pb-24">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <Pill variant="accent" icon={Briefcase}>
            Employer Set Project
          </Pill>
          <span className="rounded-full border border-[#bdd3ef] bg-[#edf4fd] px-3 py-1 text-xs font-mono font-medium text-[#2f69b5]">
            {Math.round(progressPercent)}% delivery
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Project Lifecycle Workflow</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
          Work through the business brief, requirements, planning, design, implementation, testing, and evaluation in a
          clear project sequence.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {ESP_STEPS.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";

          return (
            <div
              key={step.id}
              className={cn(
                "relative flex items-center gap-4 rounded-[1.2rem] border p-5 transition",
                isCompleted
                  ? "border-[#d4e5cb] bg-[#edf7ef]"
                  : isCurrent
                    ? "border-[#bdd3ef] bg-[#edf4fd]"
                    : "border-[#ddd5ca] bg-[#f7f3ed]",
              )}
            >
              {index % 2 === 0 && index < ESP_STEPS.length - 1 ? (
                <div className="absolute -right-2 top-1/2 hidden h-px w-4 bg-[#d9d0c4] lg:block" />
              ) : null}

              <div className="shrink-0">
                {isCompleted ? <CheckCircle2 className="h-6 w-6 text-[#4b8f60]" /> : null}
                {isCurrent ? <Circle className="h-6 w-6 text-[#2f69b5]" /> : null}
                {!isCompleted && !isCurrent ? <Lock className="h-6 w-6 text-slate-400" /> : null}
              </div>

              <div className="flex-1 space-y-1">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                  Phase {index + 1}
                </span>
                <h4 className={cn("text-base font-bold", isCurrent ? "text-[#2f69b5]" : "text-slate-900")}>{step.title}</h4>
              </div>

              <div className="shrink-0 rounded-full bg-white/80 p-2 text-slate-400">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
