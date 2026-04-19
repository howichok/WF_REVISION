import { CollapsibleSiteFooter } from "@/components/layout/collapsible-site-footer";
import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { AiOverlayProvider } from "@/components/providers/ai-overlay-provider";
import { getCachedSharedCurriculumSnapshot } from "@/lib/cached-shared-curriculum";
import { loadAppState } from "@/lib/app-data";
import { getLocalSharedCurriculumSnapshot } from "@/lib/shared-curriculum";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AppBootstrapState } from "@/lib/types";

/** Loads Supabase session (httpOnly cookies via SSR client) and hydrates {@link AppDataProvider}. */
export default async function AppBootstrap({ children }: { children: React.ReactNode }) {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [sharedCurriculum, loaded] = await Promise.all([
          getCachedSharedCurriculumSnapshot(),
          loadAppState(supabase, user, {
            sharedCurriculum: getLocalSharedCurriculumSnapshot(),
          }),
        ]);
        initialState = {
          ...loaded,
          sharedCurriculum,
        };
      } else {
        initialState = {
          ...initialState,
          sharedCurriculum: getLocalSharedCurriculumSnapshot(),
        };
      }
    } catch {
      initialState = {
        ...initialState,
        sharedCurriculum: getLocalSharedCurriculumSnapshot(),
      };
    }
  }

  return (
    <AppDataProvider initialState={initialState}>
      <AiOverlayProvider>
        <WebVitalsReporter />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <CollapsibleSiteFooter />
      </AiOverlayProvider>
    </AppDataProvider>
  );
}
