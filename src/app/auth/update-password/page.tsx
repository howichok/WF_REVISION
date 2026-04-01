"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

const EASE_PREMIUM = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function verifyRecoverySession() {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isActive) {
          return;
        }

        if (!user) {
          setError("This recovery link is invalid or has expired. Request a new reset email.");
          setHasRecoverySession(false);
        } else {
          setHasRecoverySession(true);
        }
      } catch {
        if (isActive) {
          setError("Unable to verify your recovery session. Request a new reset email.");
          setHasRecoverySession(false);
        }
      } finally {
        if (isActive) {
          setIsCheckingSession(false);
        }
      }
    }

    void verifyRecoverySession();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password needs to be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!hasRecoverySession) {
      setError("This recovery link is invalid or has expired. Request a new reset email.");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.signOut();
      setIsComplete(true);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update password."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute top-[-30%] left-[50%] -translate-x-1/2 w-[600px] h-[500px] bg-accent/3 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_PREMIUM }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card border border-border rounded-2xl p-8">
          {isCheckingSession ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted">Checking your recovery session...</p>
            </div>
          ) : isComplete ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 size={48} className="text-success mb-4" />
              <h1 className="text-xl font-semibold mb-2">Password updated</h1>
              <p className="text-sm text-muted mb-6">
                You can sign in now with your new password.
              </p>
              <Button
                onClick={() => {
                  router.push("/auth");
                  router.refresh();
                }}
              >
                Back to sign in
                <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h1 className="text-xl font-semibold mb-1">Choose a new password</h1>
                <p className="text-sm text-muted">
                  Set a new password for your Kosti account.
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-11 pr-11"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="pl-11"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isSaving}
                disabled={!hasRecoverySession}
              >
                Update Password
              </Button>
              {!hasRecoverySession && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    router.push("/auth");
                    router.refresh();
                  }}
                >
                  Back to sign in
                </Button>
              )}
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
