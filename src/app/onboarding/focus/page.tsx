"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  Sparkles,
  Target,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui";
import { TopicAccordion } from "@/components/onboarding/topic-accordion";
import { SmartInputPanel } from "@/components/onboarding/smart-input-panel";
import { TOPICS, getTopicTree, getTopicById } from "@/lib/types";
import {
  clearFocusBreakdownDraft,
  loadFocusBreakdownDraft,
  saveFocusBreakdownDraft,
  type FocusTopicOrigin,
} from "@/lib/focus-draft";
import type { TopicTree } from "@/lib/types";

const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const STEPS = [
  { label: "Profile", done: true },
  { label: "Weak Areas", done: true },
  { label: "Focus Breakdown", active: true },
  { label: "Dashboard", done: false },
];

const ORIGIN_PRIORITY: Record<FocusTopicOrigin, number> = {
  "auto-added": 1,
  confirmed: 2,
  "weak-area": 3,
};

function mergeTopicOrder(primary: string[], secondary: string[]) {
  return [...new Set([...primary, ...secondary])];
}

function mergeTopicOrigin(
  current: FocusTopicOrigin | undefined,
  next: FocusTopicOrigin
): FocusTopicOrigin {
  if (!current) {
    return next;
  }

  return ORIGIN_PRIORITY[next] > ORIGIN_PRIORITY[current] ? next : current;
}

export default function FocusBreakdownPage() {
  const router = useRouter();
  const { user, onboarding, saveFocusBreakdown } = useAppData();

  const [topicOrder, setTopicOrder] = useState<string[]>([]);
  const [topicOrigins, setTopicOrigins] = useState<Record<string, FocusTopicOrigin>>({});
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [selectedSubtopics, setSelectedSubtopics] = useState<Record<string, string[]>>({});
  const [freeTextNotes, setFreeTextNotes] = useState<Record<string, string>>({});
  const [globalFreeText, setGlobalFreeText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const initializedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !onboarding) {
      return;
    }

    if (initializedUserRef.current === user.id) {
      return;
    }

    const draft = loadFocusBreakdownDraft(user.id);
    const remoteTopicOrder = onboarding.weakAreas ?? [];
    const mergedTopicOrder = mergeTopicOrder(
      remoteTopicOrder,
      draft?.topicOrder ?? []
    );
    const mergedTopicOrigins = mergedTopicOrder.reduce<Record<string, FocusTopicOrigin>>(
      (accumulator, topicId) => {
        const remoteOrigin = remoteTopicOrder.includes(topicId)
          ? "weak-area"
          : undefined;
        const draftOrigin = draft?.topicOrigins?.[topicId];
        accumulator[topicId] = mergeTopicOrigin(
          remoteOrigin,
          draftOrigin ?? remoteOrigin ?? "auto-added"
        );
        return accumulator;
      },
      {}
    );

    setTopicOrder(mergedTopicOrder);
    setTopicOrigins(mergedTopicOrigins);
    setSelectedSubtopics({
      ...(onboarding.focusBreakdown?.selectedSubtopics ?? {}),
      ...(draft?.selectedSubtopics ?? {}),
    });
    setFreeTextNotes({
      ...(onboarding.focusBreakdown?.freeTextNotes ?? {}),
      ...(draft?.freeTextNotes ?? {}),
    });
    setGlobalFreeText(draft?.globalNote ?? onboarding.focusBreakdown?.globalNote ?? "");
    setOpenTopicId(
      draft?.openTopicId && mergedTopicOrder.includes(draft.openTopicId)
        ? draft.openTopicId
        : mergedTopicOrder[0] ?? null
    );
    initializedUserRef.current = user.id;
  }, [onboarding, user?.id]);

  useEffect(() => {
    if (!user?.id || initializedUserRef.current !== user.id) {
      return;
    }

    if (topicOrder.length === 0) {
      clearFocusBreakdownDraft(user.id);
      return;
    }

    saveFocusBreakdownDraft(user.id, {
      topicOrder,
      topicOrigins,
      selectedSubtopics,
      freeTextNotes,
      globalNote: globalFreeText,
      openTopicId,
    });
  }, [
    freeTextNotes,
    globalFreeText,
    openTopicId,
    selectedSubtopics,
    topicOrder,
    topicOrigins,
    user?.id,
  ]);

  useEffect(() => {
    if (!openTopicId && topicOrder.length > 0) {
      setOpenTopicId(topicOrder[0]);
      return;
    }

    if (openTopicId && !topicOrder.includes(openTopicId)) {
      setOpenTopicId(topicOrder[0] ?? null);
    }
  }, [openTopicId, topicOrder]);

  const handleAccordionToggle = useCallback((topicId: string) => {
    setOpenTopicId((prev) => (prev === topicId ? null : topicId));
  }, []);

  const handleSubtopicToggle = useCallback((topicId: string, subtopicId: string) => {
    setTopicOrigins((prev) => {
      if (prev[topicId] !== "auto-added") {
        return prev;
      }

      return { ...prev, [topicId]: "confirmed" };
    });
    setSelectedSubtopics((prev) => {
      const current = prev[topicId] || [];
      const updated = current.includes(subtopicId)
        ? current.filter((s) => s !== subtopicId)
        : [...current, subtopicId];
      return { ...prev, [topicId]: updated };
    });
  }, []);

  const handleFreeTextChange = useCallback((topicId: string, text: string) => {
    setFreeTextNotes((prev) => ({ ...prev, [topicId]: text }));
  }, []);

  const handleAutoTopicAdd = useCallback((topicId: string) => {
    setTopicOrder((prev) => {
      if (prev.includes(topicId)) return prev;
      return [...prev, topicId];
    });
    setTopicOrigins((prev) => ({
      ...prev,
      [topicId]: mergeTopicOrigin(prev[topicId], "auto-added"),
    }));
    setOpenTopicId((prev) => prev ?? topicId);
  }, []);

  const handleGlobalMatchSelect = useCallback((topicId: string, subtopicId: string) => {
    setTopicOrder((prev) => {
      if (prev.includes(topicId)) return prev;
      return [...prev, topicId];
    });
    setTopicOrigins((prev) => ({
      ...prev,
      [topicId]: mergeTopicOrigin(prev[topicId], "confirmed"),
    }));
    setOpenTopicId(topicId);
    setSelectedSubtopics((prev) => {
      const current = prev[topicId] || [];
      if (current.includes(subtopicId)) return prev;
      return { ...prev, [topicId]: [...current, subtopicId] };
    });
  }, []);

  async function handleContinue() {
    setError("");
    setIsSaving(true);
    try {
      await saveFocusBreakdown({
        weakAreas: topicOrder,
        selectedSubtopics,
        freeTextNotes,
        globalNote: globalFreeText,
      });
      if (user?.id) {
        clearFocusBreakdownDraft(user.id);
      }
      router.push("/home");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your focus breakdown."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleBack() {
    router.push("/onboarding");
  }

  const totalSelected = Object.values(selectedSubtopics).flat().length;
  const weakAreas = topicOrder;
  const activeTree: TopicTree | undefined = openTopicId ? getTopicTree(openTopicId) : undefined;
  const activeTopic = openTopicId ? getTopicById(openTopicId) : null;

  if (weakAreas.length === 0) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-[-20%] left-[55%] w-[700px] h-[600px] bg-accent/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[500px] h-[400px] bg-accent/2 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[300px] h-[300px] bg-accent/2 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8">
        {/* ── Progress stepper ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex items-center justify-center gap-0 mb-10"
        >
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20, delay: i * 0.08 }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    step.done
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : step.active
                        ? "bg-accent text-white shadow-[0_0_16px_-4px_rgba(139,92,246,0.5)]"
                        : "bg-surface border border-border text-muted-foreground"
                  }`}
                >
                  {step.done ? <Check size={13} strokeWidth={3} /> : i + 1}
                </motion.div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    step.active ? "text-foreground" : step.done ? "text-accent/70" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className={`w-10 sm:w-14 h-px mx-2 origin-left ${
                    step.done ? "bg-accent/30" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/8 border border-accent/15 mb-4">
            <Target size={12} className="text-accent" />
            <span className="text-[11px] font-medium text-accent">Step 3 of 4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
            Let&apos;s dig a bit deeper
          </h1>
          <p className="text-muted text-sm max-w-xl mx-auto leading-relaxed">
            Pick the specific bits that feel shaky, or type what&apos;s confusing you and
            we&apos;ll try to match it. This helps us focus your revision even more.
          </p>
        </motion.div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left column — Topic accordions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
            className="lg:col-span-5 space-y-3"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-surface border border-border flex items-center justify-center">
                  <Layers size={12} className="text-muted-foreground" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your weak topics
                </p>
              </div>
              {totalSelected > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20"
                >
                  <Sparkles size={10} className="text-accent" />
                  <span className="text-[10px] font-semibold text-accent tabular-nums">
                    {totalSelected} selected
                  </span>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {weakAreas.map((topicId, index) => {
                const tree = getTopicTree(topicId);
                const topic = TOPICS.find((t) => t.id === topicId);
                if (!tree || !topic) return null;
                return (
                  <motion.div
                    key={topicId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 28,
                      delay: 0.25 + index * 0.06,
                    }}
                  >
                    <TopicAccordion
                      tree={tree}
                      topicIcon={topic.icon}
                      topicLabel={topic.label}
                      topicOrigin={topicOrigins[topicId]}
                      isOpen={openTopicId === topicId}
                      onToggle={() => handleAccordionToggle(topicId)}
                      selectedSubtopics={selectedSubtopics[topicId] || []}
                      onSubtopicToggle={(subId) => handleSubtopicToggle(topicId, subId)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Right column — Smart input panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.25 }}
            className="lg:col-span-7"
          >
            <div className="lg:sticky lg:top-8 min-h-[520px] max-h-[calc(100vh-6rem)] flex flex-col">
              <SmartInputPanel
                key={activeTree?.topicId ?? "global"}
                activeTree={activeTree || null}
                topicLabel={activeTopic?.label ?? ""}
                topicIcon={activeTopic?.icon ?? ""}
                selectedSubtopics={openTopicId ? (selectedSubtopics[openTopicId] || []) : []}
                onSubtopicToggle={(subId) => {
                  if (openTopicId) handleSubtopicToggle(openTopicId, subId);
                }}
                noteText={openTopicId ? (freeTextNotes[openTopicId] || "") : globalFreeText}
                onNoteChange={(text) => {
                  if (openTopicId) handleFreeTextChange(openTopicId, text);
                  else setGlobalFreeText(text);
                }}
                weakAreas={weakAreas}
                topicOrigins={topicOrigins}
                onAutoTopicAdd={handleAutoTopicAdd}
                onGlobalMatchSelect={handleGlobalMatchSelect}
              />
            </div>
          </motion.div>
        </div>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, ease: EASE }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/60"
        >
          <Button variant="ghost" size="sm" onClick={handleBack} className="group">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            Back to topics
          </Button>

          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              {totalSelected > 0
                ? `${totalSelected} subtopic${totalSelected > 1 ? "s" : ""} selected`
                : "You can skip this or pick subtopics"}
            </p>
            <Button
              size="lg"
              onClick={handleContinue}
              className="group"
              disabled={isSaving}
              isLoading={isSaving}
            >
              Continue to Dashboard
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-xl px-4 py-3"
          >
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}
