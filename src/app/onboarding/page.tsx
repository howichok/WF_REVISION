"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle } from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button, Chip } from "@/components/ui";
import { TOPICS } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { onboarding, saveWeakAreas } = useAppData();
  const [selected, setSelected] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (onboarding?.weakAreas?.length) {
      setSelected(onboarding.weakAreas);
    }
  }, [onboarding]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleContinue() {
    if (selected.length === 0) return;

    setError("");
    setIsSaving(true);

    try {
      await saveWeakAreas(selected);
      router.push("/onboarding/focus");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your weak areas."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/2 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-10 justify-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={16} className="text-accent" />
            <span className="text-xs text-accent font-medium">Profile</span>
          </div>
          <div className="w-6 h-px bg-accent/30" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">2</span>
            </div>
            <span className="text-xs text-foreground font-medium">Weak Areas</span>
          </div>
          <div className="w-6 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-border flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground font-bold">3</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Focus</span>
          </div>
          <div className="w-6 h-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-border flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground font-bold">4</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Dashboard</span>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            Which topics are you struggling with?
          </h1>
          <p className="text-muted text-sm max-w-md mx-auto">
            Pick the ones you find hardest. We&apos;ll use this to shape
            your revision — you can always change it later.
          </p>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {TOPICS.map((topic) => (
            <motion.div
              key={topic.id}
              whileTap={{ scale: 0.97 }}
            >
              <Chip
                label={topic.label}
                icon={topic.icon}
                selected={selected.includes(topic.id)}
                onClick={() => toggle(topic.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={selected.length === 0 || isSaving}
            className="group"
            isLoading={isSaving}
          >
            Continue
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Button>
          <p className="text-xs text-muted-foreground">
            {selected.length === 0
              ? "Select at least one topic"
              : `${selected.length} topic${selected.length > 1 ? "s" : ""} selected`}
          </p>
          {error && (
            <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
