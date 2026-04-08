"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  Sparkles,
  Target,
  Brain,
  TrendingUp,
  User,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useAppData } from "@/components/providers/app-data-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { buildAuthRedirectUrl } from "@/lib/supabase/urls";
import { clearLegacySnapshot, getLegacySnapshot } from "@/lib/storage";

type Mode = "login" | "register";
type ViewState = "form" | "loading" | "success" | "forgot" | "verify";
type PendingAction = "login" | "register" | "forgot";

/* ── Easing presets ────────────────────────────────────────── */
const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_BACK = [0.34, 1.56, 0.64, 1] as const;

/* ── Feature cards data ────────────────────────────────────── */
const features = [
  {
    icon: Target,
    title: "Spot the gaps",
    description:
      "A short diagnostic — no guesswork, just which topics are actually letting you down.",
  },
  {
    icon: Brain,
    title: "Not random PDF roulette",
    description:
      "Weak areas, quizzes, and past-paper style practice in one place — no midnight folder archaeology.",
  },
  {
    icon: TrendingUp,
    title: "See yourself improve",
    description:
      "Progress and scores by topic — clearer what's stuck and what still needs a push.",
  },
];

/* ── Auth error helper ─────────────────────────────────────── */
function getFriendlyAuthError(error: string) {
  const lower = error.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Email or password is incorrect.";
  if (lower.includes("password should be at least")) return "Password needs to be at least 8 characters.";
  if (lower.includes("already registered")) return "That email already has an account. Try signing in instead.";
  return error;
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function WelcomePage() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [nextPathParam, setNextPathParam] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* ── Auth state ──────────────────────────────────────────── */
  const {
    configError,
    refreshAppState,
    saveDiagnosticResult,
    saveFocusBreakdown,
    saveWeakAreas,
    signIn,
    signUp,
  } = useAppData();

  const [mode, setMode] = useState<Mode>("register");
  const [viewState, setViewState] = useState<ViewState>("form");
  const [pendingAction, setPendingAction] = useState<PendingAction>("register");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  /* ── Entrance trigger ────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setHasEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get("next");
    setNextPathParam(nextPath);
    const callbackError = params.get("error");
    if (nextPath || callbackError) setMode("login");
    if (callbackError) {
      setError(getFriendlyAuthError(callbackError));
      setViewState("form");
    }
  }, []);

  useEffect(() => {
    if (configError) setError((c) => c || configError);
  }, [configError]);

  /* ── Handlers ────────────────────────────────────────────── */
  function handleJumpIn() {
    setShowAuth(true);
  }

  function handleBackToLanding() {
    setShowAuth(false);
    setViewState("form");
    setError("");
  }

  async function migrateLegacyData(remoteState: Awaited<ReturnType<typeof refreshAppState>>) {
    const legacy = getLegacySnapshot();
    if (legacy.onboarding?.weakAreas?.length && (!remoteState?.onboarding || remoteState.onboarding.weakAreas.length === 0)) {
      await saveWeakAreas(legacy.onboarding.weakAreas);
    }
    if (legacy.onboarding?.weakAreas?.length && legacy.focusBreakdown && (!remoteState?.onboarding || !remoteState.onboarding.completedAt)) {
      await saveFocusBreakdown({ weakAreas: legacy.onboarding.weakAreas, selectedSubtopics: legacy.focusBreakdown.selectedSubtopics, freeTextNotes: legacy.focusBreakdown.freeTextNotes, globalNote: legacy.focusBreakdown.globalNote });
    }
    if (legacy.diagnostic && !remoteState?.diagnostic) {
      await saveDiagnosticResult({ ...legacy.diagnostic, completedAt: legacy.diagnostic.completedAt || new Date().toISOString() });
    }
    clearLegacySnapshot();
    await refreshAppState();
  }

  function getRedirectPath(nextPath: string) {
    if (
      (nextPath === "/home" || nextPath === "/revision") &&
      nextPathParam?.startsWith("/") &&
      !nextPathParam.startsWith("//")
    ) {
      return nextPathParam;
    }
    return nextPath;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (configError) { setError(configError); return; }
    if (mode === "register") { if (nickname.trim().length < 2) { setError("Nickname needs to be at least 2 characters."); return; } }
    if (!email.trim()) { setError("Enter your email to continue."); return; }
    if (!password.trim()) { setError("Enter your password to continue."); return; }
    setPendingAction(mode);
    setViewState("loading");
    try {
      const result = mode === "register"
        ? await signUp({ nickname: nickname.trim(), email: email.trim(), password })
        : await signIn({ email: email.trim(), password });
      if (result.requiresEmailVerification) { setViewState("verify"); return; }
      const remoteState = await refreshAppState();
      await migrateLegacyData(remoteState);
      setViewState("success");
      setTimeout(() => { router.push(getRedirectPath(result.nextPath)); router.refresh(); }, 900);
    } catch (submitError) {
      setError(getFriendlyAuthError(submitError instanceof Error ? submitError.message : "Unable to continue."));
      setViewState("form");
    }
  }

  async function handleForgotSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.trim()) { setError("Enter your email first."); return; }
    setPendingAction("forgot");
    setViewState("loading");
    try {
      const supabase = getBrowserSupabaseClient();
      const redirectTo = buildAuthRedirectUrl("/auth/callback?next=/auth/update-password");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (resetError) throw resetError;
      setViewState("verify");
    } catch (resetError) {
      setError(getFriendlyAuthError(resetError instanceof Error ? resetError.message : "Unable to send reset email."));
      setViewState("forgot");
    }
  }

  const titleText = viewState === "forgot" ? "Forgot your password?" : mode === "register" ? "Create your account" : "Welcome back";
  const subtitleText = viewState === "forgot" ? "Enter your email and we'll send you a reset link." : mode === "register" ? "Join the revision hub — sync your progress across devices." : "Sign in to pick up your revision plan across devices.";

  /* ── Headline words for per-word animation ───────────────── */
  const line1Words = ["Revise", "together,"];
  const line2Words = ["stress", "a", "bit", "less."];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[800px] h-[600px] bg-accent/4 rounded-full blur-[80px]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-accent/2 rounded-full blur-[80px]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
        />
      </div>

      {/* ─── HEADER ─────────────────────────────────────────── */}
      <motion.header
        className="relative z-20 max-w-6xl mx-auto px-6 py-6 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.1 }}
      >
        <motion.div
          className="landing-logo-wrap flex items-center gap-2.5 cursor-default"
          initial={{ opacity: 0, x: -20, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE_BACK, delay: 0.2 }}
        >
          <motion.div
            className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center"
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          >
            <span className="text-accent font-bold text-[10px] leading-none">DSD</span>
          </motion.div>
          <span className="font-semibold text-foreground text-sm tracking-tight">Revision hub</span>
        </motion.div>

        <AnimatePresence mode="wait">
          {showAuth ? (
            <motion.button
              key="back"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: EASE_EXPO }}
              onClick={handleBackToLanding}
              className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back
            </motion.button>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: EASE_EXPO, delay: 0.4 }}
            >
              <Button variant="ghost" size="sm" className="landing-cta-outline" onClick={() => { setMode("login"); handleJumpIn(); }}>
                Log in
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ─── MAIN CONTENT ───────────────────────────────────── */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {!showAuth ? (
            /* ═══════════════════════════════════════════════════
               LANDING — DRAMATIC ENTRANCE
               ═══════════════════════════════════════════════════ */
            <motion.div
              key="landing"
              exit={{
                opacity: 0,
                transition: { duration: 0.5, ease: EASE_EXPO },
              }}
            >
              <section className="max-w-4xl mx-auto px-6 pt-24 pb-32 text-center">
                <div className="space-y-8">
                  {/* Badge — drops in with bounce */}
                  <motion.div
                    className="landing-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 cursor-default"
                    initial={{ opacity: 0, y: -30, scale: 0.6 }}
                    animate={hasEntered ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
                  >
                    <Sparkles size={14} className="text-accent landing-sparkle shrink-0" />
                    <span className="text-xs font-medium text-accent">
                      For our group · Digital Software Development
                    </span>
                  </motion.div>

                  {/* Headline — word by word reveal */}
                  <div>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                      {/* Line 1: "Revise together," */}
                      <span className="block">
                        {line1Words.map((word, i) => (
                          <motion.span
                            key={`l1-${i}`}
                            className="inline-block mr-[0.25em]"
                            initial={{ opacity: 0, y: 40, rotateX: 90, filter: "blur(8px)" }}
                            animate={hasEntered ? { opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" } : {}}
                            transition={{
                              duration: 0.7,
                              ease: EASE_EXPO,
                              delay: 0.7 + i * 0.12,
                            }}
                          >
                            {word}
                          </motion.span>
                        ))}
                      </span>
                      {/* Line 2: gradient text "stress a bit less." — gradient per word to avoid clip conflicts */}
                      <span className="block">
                        {line2Words.map((word, i) => (
                          <motion.span
                            key={`l2-${i}`}
                            className="inline-block mr-[0.25em] landing-gradient-live"
                            initial={{ opacity: 0, y: 50, scale: 0.5 }}
                            animate={hasEntered ? { opacity: 1, y: 0, scale: 1 } : {}}
                            transition={{
                              duration: 0.8,
                              ease: EASE_EXPO,
                              delay: 1.0 + i * 0.1,
                            }}
                          >
                            {word}
                          </motion.span>
                        ))}
                      </span>
                    </h1>
                  </div>

                  {/* Subtitle — slides up from blur */}
                  <motion.p
                    className="text-lg sm:text-xl text-muted max-w-xl mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
                    animate={hasEntered ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
                    transition={{ duration: 0.8, ease: EASE_EXPO, delay: 1.4 }}
                  >
                    Diagnostics, topics, quizzes, and resources in one place — so classmates can prep without the corporate
                    vibe or last-minute chaos.
                  </motion.p>

                  {/* CTA Button — scales in with glow burst */}
                  <motion.div
                    className="flex items-center justify-center gap-4 pt-4"
                    initial={{ opacity: 0, y: 30, scale: 0.7 }}
                    animate={hasEntered ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ type: "spring", stiffness: 150, damping: 18, delay: 1.6 }}
                  >
                    <div className="relative">
                      {/* Glow pulse behind button on entrance */}
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-accent/30 blur-[20px]"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={hasEntered ? {
                          opacity: [0, 0.6, 0],
                          scale: [0.5, 1.5, 1.2],
                        } : {}}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 1.8 }}
                      />
                      <Button
                        ref={buttonRef}
                        size="lg"
                        className="landing-cta group relative"
                        onClick={handleJumpIn}
                      >
                        Jump in and learn
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* Feature cards — staggered cascade from below */}
              <section className="max-w-5xl mx-auto px-6 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {features.map((feature, i) => (
                    <motion.div
                      key={feature.title}
                      className="landing-card bg-card/50 border border-border rounded-2xl p-6 hover:bg-card-hover cursor-default"
                      initial={{ opacity: 0, y: 60, scale: 0.85, filter: "blur(4px)" }}
                      animate={hasEntered ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } : {}}
                      transition={{
                        duration: 0.7,
                        ease: EASE_EXPO,
                        delay: 1.9 + i * 0.15,
                      }}
                    >
                      <motion.div
                        className="landing-card-icon w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4"
                        initial={{ rotate: -90, scale: 0 }}
                        animate={hasEntered ? { rotate: 0, scale: 1 } : {}}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 2.1 + i * 0.15 }}
                      >
                        <feature.icon size={20} className="text-accent" />
                      </motion.div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Bottom CTA card */}
              <motion.section
                className="max-w-3xl mx-auto px-6 pb-24 text-center"
                initial={{ opacity: 0, y: 40 }}
                animate={hasEntered ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: EASE_EXPO, delay: 2.5 }}
              >
                <div className="landing-bottom-card bg-card border border-border rounded-3xl p-10 relative overflow-hidden cursor-default">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent" />
                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-3">Ready when you are</h2>
                    <p className="text-muted text-sm mb-6 max-w-md mx-auto">
                      Quick sign-in — then run the diagnostic and see where to start.
                    </p>
                    <Button size="lg" className="landing-cta group" onClick={handleJumpIn}>
                      Get started
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </motion.section>

              <footer className="border-t border-border">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                  <span>Not the official college site — just a shared revision hub for the course.</span>
                  <span className="sm:text-right">&copy; {new Date().getFullYear()}</span>
                </div>
              </footer>
            </motion.div>
          ) : (
            /* ═══════════════════════════════════════════════════
               AUTH FORM — DRAMATIC MATERIALISATION
               ═══════════════════════════════════════════════════ */
            <motion.div
              key="auth"
              className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: EASE_EXPO }}
            >
              <motion.div className="w-full max-w-md relative">
                {/* Explosion particles */}
                {[...Array(12)].map((_, i) => {
                  const angle = (i / 12) * Math.PI * 2;
                  const dist = 120 + Math.random() * 80;
                  return (
                    <motion.div
                      key={i}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: 3 + Math.random() * 4,
                        height: 3 + Math.random() * 4,
                        left: "50%",
                        top: "50%",
                        background: `rgba(139, 92, 246, ${0.3 + Math.random() * 0.4})`,
                      }}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{
                        x: Math.cos(angle) * dist,
                        y: Math.sin(angle) * dist,
                        scale: [0, 1.5, 0],
                        opacity: [0, 0.8, 0],
                      }}
                      transition={{
                        duration: 1.2 + Math.random() * 0.6,
                        ease: "easeOut",
                        delay: 0.1 + i * 0.04,
                      }}
                    />
                  );
                })}

                {/* Expanding glow ring */}
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  initial={{ width: 0, height: 0, opacity: 0 }}
                  animate={{
                    width: [0, 600, 500],
                    height: [0, 600, 500],
                    opacity: [0, 0.15, 0.04],
                  }}
                  transition={{ duration: 1.2, ease: EASE_EXPO, delay: 0.05 }}
                >
                  <div className="w-full h-full rounded-full bg-accent blur-[80px]" />
                </motion.div>

                {/* The form card */}
                <motion.div
                  className="relative bg-card border border-border rounded-2xl overflow-hidden"
                  initial={{
                    scale: 0.3,
                    opacity: 0,
                    y: 80,
                    rotateX: 15,
                    boxShadow: "0 0 0px 0px rgba(139, 92, 246, 0)",
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    boxShadow: [
                      "0 0 0px 0px rgba(139, 92, 246, 0)",
                      "0 0 80px 12px rgba(139, 92, 246, 0.2)",
                      "0 4px 30px 0px rgba(139, 92, 246, 0.06)",
                    ],
                  }}
                  transition={{
                    duration: 0.8,
                    ease: EASE_EXPO,
                    delay: 0.15,
                    boxShadow: { duration: 1.4, ease: EASE_EXPO, delay: 0.3 },
                  }}
                  style={{ perspective: 1000, transformStyle: "preserve-3d" }}
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none z-20"
                    initial={{ x: "-100%" }}
                    animate={{ x: "250%" }}
                    transition={{ duration: 0.9, ease: EASE_EXPO, delay: 0.6 }}
                  >
                    <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent skew-x-[-12deg]" />
                  </motion.div>

                  {/* Top accent line */}
                  <motion.div
                    className="h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.7, ease: EASE_EXPO, delay: 0.4 }}
                  />

                  {/* Border flash */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                    initial={{ boxShadow: "inset 0 0 0 1px rgba(139, 92, 246, 0)" }}
                    animate={{
                      boxShadow: [
                        "inset 0 0 0 1px rgba(139, 92, 246, 0)",
                        "inset 0 0 0 2px rgba(139, 92, 246, 0.5)",
                        "inset 0 0 0 1px rgba(139, 92, 246, 0.1)",
                      ],
                    }}
                    transition={{ duration: 1.2, ease: EASE_EXPO, delay: 0.3 }}
                  />

                  <div className="p-8">
                    <AnimatePresence mode="wait">
                      {viewState === "loading" && (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex flex-col items-center justify-center py-12"
                        >
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <Loader2 size={32} className="text-accent mb-4" />
                          </motion.div>
                          <p className="text-sm text-muted">
                            {pendingAction === "register" ? "Setting up your account..." : pendingAction === "forgot" ? "Sending reset link..." : "Signing you in..."}
                          </p>
                        </motion.div>
                      )}

                      {viewState === "success" && (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex flex-col items-center justify-center py-12"
                        >
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 12 }}
                          >
                            <CheckCircle2 size={48} className="text-success mb-4" />
                          </motion.div>
                          <h2 className="text-lg font-semibold mb-1">You&apos;re in!</h2>
                          <p className="text-sm text-muted">Redirecting you now...</p>
                        </motion.div>
                      )}

                      {viewState === "verify" && (
                        <motion.div
                          key="verify"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col items-center text-center py-8"
                        >
                          <motion.div
                            className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                          >
                            <MailCheck size={28} className="text-accent" />
                          </motion.div>
                          <h2 className="text-lg font-semibold mb-2">{pendingAction === "register" ? "Check your inbox" : "Reset email sent"}</h2>
                          <p className="text-sm text-muted mb-6 leading-relaxed">
                            {pendingAction === "register" ? "Confirm your email to finish creating the account, then sign in to continue." : "If that email exists, you'll receive a link to choose a new password."}
                          </p>
                          <Button variant="ghost" onClick={() => { setMode("login"); setViewState("form"); }}>Back to sign in</Button>
                        </motion.div>
                      )}

                      {(viewState === "form" || viewState === "forgot") && (
                        <motion.div key={viewState} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {/* Tabs */}
                          {viewState === "form" && (
                            <motion.div
                              className="flex bg-surface rounded-xl p-1 mb-8"
                              initial={{ opacity: 0, y: -15, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.5, ease: EASE_BACK, delay: 0.5 }}
                            >
                              {(["register", "login"] as Mode[]).map((nextMode) => (
                                <button
                                  key={nextMode}
                                  onClick={() => { setMode(nextMode); setError(""); }}
                                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${mode === nextMode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-muted"}`}
                                >
                                  {nextMode === "register" ? "New Here" : "Welcome Back"}
                                </button>
                              ))}
                            </motion.div>
                          )}

                          <form onSubmit={viewState === "forgot" ? handleForgotSubmit : handleSubmit} className="space-y-5">
                            {/* Title */}
                            <motion.div
                              initial={{ opacity: 0, x: -25, filter: "blur(4px)" }}
                              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                              transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.55 }}
                            >
                              <h2 className="text-xl font-semibold mb-1">{titleText}</h2>
                              <p className="text-sm text-muted">{subtitleText}</p>
                            </motion.div>

                            {/* Fields — staggered cascade */}
                            <div className="space-y-3">
                              <AnimatePresence>
                                {viewState === "form" && mode === "register" && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -8, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -8, height: 0 }}
                                    transition={{ duration: 0.35, ease: EASE_EXPO }}
                                    className="overflow-hidden"
                                  >
                                    <motion.div
                                      className="relative"
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.5, delay: 0.65 }}
                                    >
                                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                      <Input placeholder="Your nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="pl-11" autoFocus />
                                    </motion.div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <motion.div
                                className="relative"
                                initial={{ opacity: 0, x: -20, filter: "blur(3px)" }}
                                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                transition={{ duration: 0.5, ease: EASE_EXPO, delay: 0.7 }}
                              >
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" autoFocus={mode === "login" || viewState === "forgot"} />
                              </motion.div>

                              {viewState === "form" && (
                                <motion.div
                                  className="relative"
                                  initial={{ opacity: 0, x: -20, filter: "blur(3px)" }}
                                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                  transition={{ duration: 0.5, ease: EASE_EXPO, delay: 0.8 }}
                                >
                                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                  <Input placeholder="Password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11" />
                                  <button type="button" onClick={() => setShowPassword((c) => !c)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted transition-colors cursor-pointer">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                </motion.div>
                              )}
                            </div>

                            {/* Error */}
                            {error && (
                              <motion.div
                                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5"
                              >
                                <AlertCircle size={14} className="shrink-0" />
                                {error}
                              </motion.div>
                            )}

                            {/* Submit */}
                            {viewState === "form" ? (
                              <>
                                <motion.div
                                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{ duration: 0.5, ease: EASE_BACK, delay: 0.9 }}
                                >
                                  <Button type="submit" size="lg" className="w-full group landing-cta">
                                    {mode === "register" ? "Create Account" : "Sign In"}
                                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5 shrink-0" />
                                  </Button>
                                </motion.div>
                                <motion.button
                                  type="button"
                                  onClick={() => { setViewState("forgot"); setError(""); }}
                                  className="text-sm text-muted-foreground hover:text-muted transition-colors cursor-pointer w-full text-center"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 1.0 }}
                                >
                                  Forgot password?
                                </motion.button>
                              </>
                            ) : (
                              <>
                                <Button type="submit" size="lg" className="w-full">Send Reset Link</Button>
                                <button type="button" onClick={() => { setMode("login"); setViewState("form"); setError(""); }} className="text-sm text-muted-foreground hover:text-muted transition-colors cursor-pointer w-full text-center">Back to sign in</button>
                              </>
                            )}
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Bottom hint */}
                <motion.p
                  className="text-center text-xs text-muted-foreground mt-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                >
                  Your profile, onboarding, diagnostics, and progress now sync to your account.
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
