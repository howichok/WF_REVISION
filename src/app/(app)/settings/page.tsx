"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  Settings2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAppData } from "@/components/providers/app-data-provider";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { PageContainer } from "@/components/layout/page-container";

function getFriendlyMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function SettingsPage() {
  const router = useRouter();
  const {
    configError,
    isHydrating,
    sendPasswordReset,
    signOut,
    updateNickname,
    user,
  } = useAppData();
  const [nickname, setNickname] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (user?.nickname) {
      setNickname(user.nickname);
    }
  }, [user?.nickname]);

  useEffect(() => {
    if (!isHydrating && !user) {
      router.replace("/auth");
    }
  }, [isHydrating, router, user]);

  const trimmedNickname = nickname.trim();
  const isNicknameDirty = trimmedNickname !== (user?.nickname ?? "");
  const nicknameValidationError =
    trimmedNickname.length > 0 && trimmedNickname.length < 2
      ? "Nickname needs to be at least 2 characters."
      : "";
  const accountCreatedLabel = !user?.createdAt
    ? "Recently"
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(user.createdAt));

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (trimmedNickname.length < 2) {
      setProfileError("Nickname needs to be at least 2 characters.");
      return;
    }

    if (!isNicknameDirty) {
      setProfileSuccess("Nickname is already up to date.");
      return;
    }

    setIsSavingProfile(true);

    try {
      await updateNickname(trimmedNickname);
      setProfileSuccess("Nickname updated across your account.");
    } catch (error) {
      setProfileError(
        getFriendlyMessage(error, "Unable to update your nickname.")
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSendReset() {
    setSecurityError("");
    setSecuritySuccess("");
    setIsSendingReset(true);

    try {
      await sendPasswordReset();
      setSecuritySuccess(
        user?.email
          ? `Password reset link sent to ${user.email}.`
          : "Password reset link sent."
      );
    } catch (error) {
      setSecurityError(
        getFriendlyMessage(error, "Unable to send a password reset email.")
      );
    } finally {
      setIsSendingReset(false);
    }
  }

  async function handleSignOut() {
    setSecurityError("");
    setSecuritySuccess("");
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (error) {
      setIsSigningOut(false);
      setSecurityError(getFriendlyMessage(error, "Unable to sign out."));
    }
  }

  if (isHydrating && !user) {
    return (
      <PageContainer size="md">
        <div className="h-48" />
      </PageContainer>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageContainer size="md">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Settings2 size={15} className="text-accent" />
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Account
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
            <p className="text-sm text-muted mt-1">
              Keep your account details current without leaving the app flow.
            </p>
          </div>
          <Badge variant="accent" className="w-fit gap-1.5">
            <Sparkles size={12} />
            Synced with Supabase
          </Badge>
        </div>

        {configError && (
          <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5">
            <AlertCircle size={14} className="shrink-0" />
            {configError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <UserRound size={16} className="text-accent" />
                <CardTitle className="text-base">Profile</CardTitle>
              </div>
              <CardDescription>
                Your nickname appears in the navbar, dashboard, and account state.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-0">
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <Input
                  label="Nickname"
                  value={nickname}
                  onChange={(event) => {
                    setNickname(event.target.value);
                    setProfileError("");
                    setProfileSuccess("");
                  }}
                  error={profileError || nicknameValidationError}
                  hint="Minimum 2 characters."
                  maxLength={40}
                />

                {profileSuccess && !profileError && (
                  <div className="flex items-center gap-2 text-sm text-success bg-success/10 rounded-lg px-3 py-2.5">
                    <CheckCircle2 size={14} className="shrink-0" />
                    {profileSuccess}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Last synced nickname: <span className="text-foreground">{user.nickname}</span>
                  </p>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isSavingProfile}
                    disabled={!isNicknameDirty || Boolean(nicknameValidationError)}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Mail size={16} className="text-muted-foreground" />
                  <CardTitle className="text-base">Account Details</CardTitle>
                </div>
                <CardDescription>
                  Read-only account metadata pulled from your authenticated profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                  <p className="text-sm text-foreground mt-1">
                    {user.email ?? "No email available"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Account Created
                  </p>
                  <p className="text-sm text-foreground mt-1">{accountCreatedLabel}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound size={16} className="text-muted-foreground" />
                  <CardTitle className="text-base">Security</CardTitle>
                </div>
                <CardDescription>
                  Password changes stay in the existing email recovery flow.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {securityError && (
                  <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded-lg px-3 py-2.5">
                    <AlertCircle size={14} className="shrink-0" />
                    {securityError}
                  </div>
                )}
                {securitySuccess && !securityError && (
                  <div className="flex items-center gap-2 text-sm text-success bg-success/10 rounded-lg px-3 py-2.5">
                    <CheckCircle2 size={14} className="shrink-0" />
                    {securitySuccess}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => void handleSendReset()}
                  isLoading={isSendingReset}
                  disabled={!user.email}
                >
                  Send Password Reset Email
                </Button>
                <Button
                  variant="danger"
                  className="w-full justify-center"
                  onClick={() => void handleSignOut()}
                  isLoading={isSigningOut}
                >
                  <LogOut size={15} />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
