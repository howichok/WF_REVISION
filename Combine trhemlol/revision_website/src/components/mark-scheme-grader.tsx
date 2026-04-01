"use client";

import { useState } from "react";
import { AttemptEvaluation, MarkScheme } from "@/lib/domain/types";
import { Card } from "@/components/ui/card";
import { Check, AlertOctagon, Scale, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkSchemeGraderProps {
    markScheme: MarkScheme;
    writtenResponse: string;
    timeSpentSeconds: number;
    onGradeFinalized: (evaluation: AttemptEvaluation) => void;
}

export function MarkSchemeGrader({ markScheme, writtenResponse, timeSpentSeconds, onGradeFinalized }: MarkSchemeGraderProps) {
    // Gap Analysis Local State
    const [missingPoints, setMissingPoints] = useState<string[]>(markScheme.linkedPoints.map(p => p.primaryPoint));
    const [weakApplication, setWeakApplication] = useState(markScheme.applicationToScenarioRequired);
    const [poorCommand, setPoorCommand] = useState(true);
    const [lackEvaluation, setLackEvaluation] = useState(markScheme.evaluationRequirements.conclusionRequired);

    const [score, setScore] = useState(0);

    const totalPossible = markScheme.partialCreditBreakdown.reduce((sum, b) => sum + b.marks, 0) ||
        markScheme.linkedPoints.length * 2; // Rough fallback if explicit marks aren't mapped

    const handleFinalize = () => {
        const isMistake = score < totalPossible;
        const evaluation: AttemptEvaluation = {
            id: "attempt-" + Date.now(),
            questionId: markScheme.questionId,
            answeredAt: new Date().toISOString(),
            timeSpentSeconds,
            scoreAchieved: score,
            maxScore: totalPossible,
            writtenResponse,
            missingKnowledgePoints: missingPoints,
            weakApplicationToScenario: weakApplication,
            poorCommandWordFulfillment: poorCommand,
            lackOfEvaluationOrConclusion: lackEvaluation,
            retryState: isMistake ? "pending" : "resolved",
        };
        onGradeFinalized(evaluation);
    };

    const togglePoint = (pointText: string) => {
        setMissingPoints(prev =>
            prev.includes(pointText) ? prev.filter(p => p !== pointText) : [...prev, pointText]
        );
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto pb-24">

            <header className="space-y-4">
                <h1 className="text-2xl md:text-3xl font-black text-white px-2">Examiner Rubric Review</h1>
                <p className="text-muted text-sm px-2">Evaluate your response strictly against the official marking criteria below to train the gap-analysis engine.</p>

                <Card className="p-6 bg-slate-950 border-white/5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Your Submitted Response</p>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg text-sm font-mono text-white/80 leading-relaxed max-h-64 overflow-y-auto w-full break-words">
                        {writtenResponse || "No response provided."}
                    </div>
                </Card>
            </header>

            {/* ===== GAP ANALYSIS: KNOWLEDGE & APPLICATION ===== */}
            <section className="space-y-4">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent flex items-center gap-2 px-2">
                    Phase 1: Knowledge & Expansion Requirements
                </h2>
                <div className="grid gap-3">
                    {markScheme.linkedPoints.map((point, idx) => {
                        const checked = !missingPoints.includes(point.primaryPoint);
                        return (
                            <Card
                                key={idx}
                                onClick={() => togglePoint(point.primaryPoint)}
                                className={cn(
                                    "p-5 border border-white/5 transition-all cursor-pointer flex gap-4 group select-none",
                                    checked ? "bg-accent/[0.08] border-accent/20" : "bg-panel/30 hover:bg-panel/50"
                                )}
                            >
                                <div className={cn(
                                    "flex-shrink-0 mt-1 h-6 w-6 rounded flex items-center justify-center border transition-colors",
                                    checked ? "bg-accent border-accent text-white" : "border-white/20 text-transparent"
                                )}>
                                    <Check className="h-4 w-4" strokeWidth={3} />
                                </div>
                                <div className="space-y-2">
                                    <p className={cn("text-sm font-semibold transition-colors", checked ? "text-white" : "text-white/80")}>
                                        {point.primaryPoint}
                                    </p>
                                    {point.explanatoryExpansion && (
                                        <div className="flex items-start gap-2 text-xs text-muted">
                                            <ChevronRight className="h-3 w-3 mt-0.5 text-accent shrink-0" />
                                            <span><strong className="text-white/60">Expansion Required:</strong> {point.explanatoryExpansion}</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </section>

            {/* ===== GAP ANALYSIS: EXAM TECHNIQUE ===== */}
            <section className="space-y-4">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-400 flex items-center gap-2 px-2">
                    Phase 2: Execution Technique Penalties
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {markScheme.applicationToScenarioRequired && (
                        <Card
                            onClick={() => setWeakApplication(!weakApplication)}
                            className={cn(
                                "p-5 border cursor-pointer transition-all",
                                !weakApplication ? "bg-emerald-500/10 border-emerald-500/20" : "bg-panel/30 border-white/5 hover:bg-panel/50"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn("mt-1 shrink-0", !weakApplication ? "text-emerald-400" : "text-muted")}>
                                    <Scale className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className={cn("text-sm font-bold", !weakApplication ? "text-emerald-400" : "text-white")}>Applied to Scenario</h4>
                                    <p className="text-xs text-muted mt-1 leading-relaxed">Did you explicitly link your facts back to the given context?</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card
                        onClick={() => setPoorCommand(!poorCommand)}
                        className={cn(
                            "p-5 border cursor-pointer transition-all",
                            !poorCommand ? "bg-emerald-500/10 border-emerald-500/20" : "bg-panel/30 border-white/5 hover:bg-panel/50"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div className={cn("mt-1 shrink-0", !poorCommand ? "text-emerald-400" : "text-muted")}>
                                <AlertOctagon className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className={cn("text-sm font-bold", !poorCommand ? "text-emerald-400" : "text-white")}>Fulfilled Command Word</h4>
                                <p className="text-xs text-muted mt-1 leading-relaxed">Action: {markScheme.commandWordFulfillment.expectedAction}</p>
                            </div>
                        </div>
                    </Card>

                    {markScheme.evaluationRequirements.conclusionRequired && (
                        <Card
                            onClick={() => setLackEvaluation(!lackEvaluation)}
                            className={cn(
                                "p-5 border cursor-pointer transition-all",
                                !lackEvaluation ? "bg-emerald-500/10 border-emerald-500/20" : "bg-panel/30 border-white/5 hover:bg-panel/50"
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn("mt-1 shrink-0", !lackEvaluation ? "text-emerald-400" : "text-muted")}>
                                    <Check className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className={cn("text-sm font-bold", !lackEvaluation ? "text-emerald-400" : "text-white")}>Conclusion Reached</h4>
                                    <p className="text-xs text-muted mt-1 leading-relaxed">Did you provide a final justified judgment?</p>
                                </div>
                            </div>
                        </Card>
                    )}

                </div>
            </section>

            {/* ===== FINAL SCORING ===== */}
            <Card className="mt-8 p-8 border-accent/30 bg-accent/5 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 flex-1">
                    <h3 className="text-xl font-bold text-white">Final Assessed Mark</h3>
                    <p className="text-sm text-muted max-w-lg leading-relaxed">
                        Based on the rubric checks above, assign your final score. If this is below {totalPossible}, it will automatically inject this question into your targeted retry queue.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4 shrink-0 border-l border-white/10 pl-8">
                    <div className="flex items-baseline gap-2">
                        <input
                            type="number"
                            min={0}
                            max={totalPossible}
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            className="w-20 h-16 bg-slate-950 text-3xl font-black text-center text-white border-2 border-accent/50 rounded-lg focus:outline-none focus:border-accent"
                        />
                        <span className="text-xl font-bold text-muted">/ {totalPossible}</span>
                    </div>

                    <button
                        onClick={handleFinalize}
                        className="w-full h-10 bg-white hover:bg-gray-200 text-black font-bold text-xs uppercase tracking-widest rounded transition-colors"
                    >
                        Confirm Grade
                    </button>
                </div>
            </Card>

        </div>
    );
}
