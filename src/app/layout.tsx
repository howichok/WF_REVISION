import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { AiOverlayProvider } from "@/components/providers/ai-overlay-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { loadSharedCurriculumSnapshotFromDatabase } from "@/lib/curriculum-database";
import { loadAppState } from "@/lib/app-data";
import { getLocalSharedCurriculumSnapshot } from "@/lib/shared-curriculum";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppBootstrapState } from "@/lib/types";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DSD revision hub",
  description:
    "Shared revision for Digital Software Development: diagnostics, topics, quizzes, and resources.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialState: AppBootstrapState = {
    user: null,
    onboarding: null,
    diagnostic: null,
    sharedCurriculum: getLocalSharedCurriculumSnapshot(),
    revisionProgress: [],
    topicCoachingMemory: {},
    activityHistory: [],
  };

  if (getSupabaseConfig()) {
    try {
      const supabase = await createServerSupabaseClient();
      const sharedCurriculum = await loadSharedCurriculumSnapshotFromDatabase(supabase);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      initialState = {
        ...initialState,
        sharedCurriculum,
      };

      if (user) {
        initialState = await loadAppState(supabase, user, {
          sharedCurriculum,
        });
      }
    } catch {
      initialState = {
        ...initialState,
        sharedCurriculum: getLocalSharedCurriculumSnapshot(),
      };
    }
  }

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: set theme class before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("wf-revision-theme");if(t==="light"){document.documentElement.classList.remove("dark")}else if(!t&&window.matchMedia("(prefers-color-scheme:light)").matches){document.documentElement.classList.remove("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased relative bg-background text-foreground`}>
        {/* Ambient violet light — fixed, non-interactive */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
          <div
            className="absolute -top-[40%] -right-[20%] w-[68%] aspect-square rounded-full opacity-[0.09] blur-[150px]"
            style={{ background: "radial-gradient(circle, rgba(103, 92, 241, 0.22) 0%, transparent 72%)" }}
          />
          <div
            className="absolute -bottom-[30%] -left-[15%] w-[52%] aspect-square rounded-full opacity-[0.07] blur-[130px]"
            style={{ background: "radial-gradient(circle, rgba(245, 158, 11, 0.14) 0%, transparent 72%)" }}
          />
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/35 to-transparent dark:from-white/4" />
        </div>
        <div className="relative z-10">
          <ThemeProvider>
            <AppDataProvider initialState={initialState}>
              <AiOverlayProvider>
                <WebVitalsReporter />
                {children}
              </AiOverlayProvider>
            </AppDataProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
