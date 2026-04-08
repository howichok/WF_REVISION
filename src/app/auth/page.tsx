"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  User,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button, Input } from "@/components/ui";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { buildAuthRedirectUrl } from "@/lib/supabase/urls";
import { clearLegacySnapshot, getLegacySnapshot } from "@/lib/storage";

type Mode = "login" | "register";
type ViewState = "form" | "loading" | "success" | "forgot" | "verify";
type PendingAction = "login" | "register" | "forgot";

const EASE_PREMIUM = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

function getFriendlyAuthError(error: string) {
  const lower = error.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (lower.includes("password should be at least")) {
    return "Password needs to be at least 8 characters.";
  }

  if (lower.includes("already registered")) {
    return "That email already has an account. Try signing in instead.";
  }

  return error;
}

export default function AuthPage() {
  const router = useRouter();
  const [nextPathParam, setNextPathParam] = useState<string | null>(null);
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const nextPath = params.get("next");
    setNextPathParam(nextPath);

    const callbackError = params.get("error");

    if (nextPath || callbackError) {
      setMode("login");
    }

    if (callbackError) {
      setError(getFriendlyAuthError(callbackError));
      setViewState("form");
    }
  }, []);

  useEffect(() => {
    if (configError) {
      setError((current) => current || configError);
    }
  }, [configError]);

  async function migrateLegacyData(remoteState: Awaited<ReturnType<typeof refreshAppState>>) {
    const legacy = getLegacySnapshot();

    if (
      legacy.onboarding?.weakAreas?.length &&
      (!remoteState?.onboarding || remoteState.onboarding.weakAreas.length === 0)
    ) {
      await saveWeakAreas(legacy.onboarding.weakAreas);
    }

    if (
      legacy.onboarding?.weakAreas?.length &&
      legacy.focusBreakdown &&
      (!remoteState?.onboarding || !remoteState.onboarding.completedAt)
    ) {
      await saveFocusBreakdown({
        weakAreas: legacy.onboarding.weakAreas,
        selectedSubtopics: legacy.focusBreakdown.selectedSubtopics,
        freeTextNotes: legacy.focusBreakdown.freeTextNotes,
        globalNote: legacy.focusBreakdown.globalNote,
      });
    }

    if (legacy.diagnostic && !remoteState?.diagnostic) {
      await saveDiagnosticResult({
        ...legacy.diagnostic,
        completedAt: legacy.diagnostic.completedAt || new Date().toISOString(),
      });
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

    if (configError) {
      setError(configError);
      return;
    }

    if (mode === "register") {
      const trimmedNickname = nickname.trim();

      if (trimmedNickname.length < 2) {
        setError("Nickname needs to be at least 2 characters.");
        return;
      }
    }

    if (!email.trim()) {
      setError("Enter your email to continue.");
      return;
    }

    if (!password.trim()) {
      setError("Enter your password to continue.");
      return;
    }

    setPendingAction(mode);
    setViewState("loading");

    try {
      const result =
        mode === "register"
          ? await signUp({
              nickname: nickname.trim(),
              email: email.trim(),
              password,
            })
          : await signIn({
              email: email.trim(),
              password,
            });

      if (result.requiresEmailVerification) {
        setViewState("verify");
        return;
      }

      const remoteState = await refreshAppState();
      await migrateLegacyData(remoteState);

      setViewState("success");

      setTimeout(() => {
        router.push(getRedirectPath(result.nextPath));
        router.refresh();
      }, 900);
    } catch (submitError) {
      setError(
        getFriendlyAuthError(
          submitError instanceof Error ? submitError.message : "Unable to continue."
        )
      );
      setViewState("form");
    }
  }

  async function handleForgotSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setPendingAction("forgot");
    setViewState("loading");

    try {
      const supabase = getBrowserSupabaseClient();
      const redirectTo = buildAuthRedirectUrl(
        "/auth/callback?next=/auth/update-password"
      );

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setViewState("verify");
    } catch (resetError) {
      setError(
        getFriendlyAuthError(
          resetError instanceof Error ? resetError.message : "Unable to send reset email."
        )
      );
      setViewState("forgot");
    }
  }

  const titleText =
    viewState === "forgot"
      ? "Forgot your password?"
      : mode === "register"
        ? "Create your account"
        : "Welcome back";

  const subtitleText =
    viewState === "forgot"
      ? "Enter your email and we’ll send you a reset link."
      : mode === "register"
        ? "Keep the same polished flow, now with real account sync and persistence."
        : "Sign in to pick up your revision plan across devices.";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-[-30%] left-[50%] -translate-x-1/2 w-[600px] h-[500px] bg-accent/3 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-[10px] leading-none">DSD</span>
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">Revision hub</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {viewState === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Loader2 size={32} className="text-accent animate-spin mb-4" />
                <p className="text-sm text-muted">
                  {pendingAction === "register"
                    ? "Setting up your account..."
                    : pendingAction === "forgot"
                      ? "Sending reset link..."
                      : "Signing you in..."}
                </p>
              </motion.div>
            )}

            {viewState === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
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
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
                  <MailCheck size={28} className="text-accent" />
                </div>
                <h2 className="text-lg font-semibold mb-2">
                  {pendingAction === "register" ? "Check your inbox" : "Reset email sent"}
                </h2>
                <p className="text-sm text-muted mb-6 leading-relaxed">
                  {pendingAction === "register"
                    ? "Confirm your email to finish creating the account, then sign in to continue."
                    : "If that email exists, you’ll receive a link to choose a new password."}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMode("login");
                    setViewState("form");
                  }}
                >
                  Back to sign in
                </Button>
              </motion.div>
            )}

            {(viewState === "form" || viewState === "forgot") && (
              <motion.div
                key={viewState}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {viewState === "form" && (
                  <div className="flex bg-surface rounded-xl p-1 mb-8">
                    {(["register", "login"] as Mode[]).map((nextMode) => (
                      <button
                        key={nextMode}
                        onClick={() => {
                          setMode(nextMode);
                          setError("");
                        }}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                          mode === nextMode
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-muted"
                        }`}
                      >
                        {nextMode === "register" ? "New Here" : "Welcome Back"}
                      </button>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={viewState === "forgot" ? handleForgotSubmit : handleSubmit}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-1">{titleText}</h2>
                    <p className="text-sm text-muted">{subtitleText}</p>
                  </div>

                  <div className="space-y-3">
                    <AnimatePresence>
                      {viewState === "form" && mode === "register" && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -8, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="relative">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <Input
                              placeholder="Your nickname"
                              value={nickname}
                              onChange={(event) => setNickname(event.target.value)}
                              className="pl-11"
                              autoFocus
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="pl-11"
                        autoFocus={mode === "login" || viewState === "forgot"}
                      />
                    </div>

                    {viewState === "form" && (
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="pl-11 pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5"
                    >
                      <AlertCircle size={14} className="shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {viewState === "form" ? (
                    <>
                      <Button type="submit" size="lg" className="w-full group">
                        {mode === "register" ? "Create Account" : "Sign In"}
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5 shrink-0" />
                      </Button>

                      <button
                        type="button"
                        onClick={() => {
                          setViewState("forgot");
                          setError("");
                        }}
                        className="text-sm text-muted-foreground hover:text-muted transition-colors cursor-pointer w-full text-center"
                      >
                        Forgot password?
                      </button>
                    </>
                  ) : (
                    <>
                      <Button type="submit" size="lg" className="w-full">
                        Send Reset Link
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setViewState("form");
                          setError("");
                        }}
                        className="text-sm text-muted-foreground hover:text-muted transition-colors cursor-pointer w-full text-center"
                      >
                        Back to sign in
                      </button>
                    </>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your profile, onboarding, diagnostics, and progress now sync to your account.
        </p>
      </div>
    </div>
  );
}
