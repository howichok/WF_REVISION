import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy notice | DSD revision hub",
  description: "How this revision site handles data and privacy.",
};

export default function PrivacyNoticePage() {
  return (
    <article className="mx-auto max-w-2xl py-10 sm:py-14">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Link href="/revision" className="text-accent hover:underline">
          Back to revision
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Privacy notice</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        This website is an independent educational tool created by students, for students. We are committed to
        protecting your privacy and keeping the environment straightforward and safe to use.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground">Data collection</h2>
          <p className="mt-3">
            We do not use advertising trackers, third-party analytics for profiling, or sell personal data. We do not
            collect sensitive background information about you for its own sake.
          </p>
          <p className="mt-3">
            If you choose to sign in, your account is handled by our authentication provider (for example Supabase),
            which has its own privacy policy for credentials and account metadata. We only receive what is needed to run
            sign-in and sync your revision progress in the app.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">How your inputs are used</h2>
          <p className="mt-3">
            Text and answers you type into the site are processed to deliver revision features you asked for (for
            example quizzes, diagnostics, or optional AI feedback). They are used for your learning workflow, not for
            unrelated marketing.
          </p>
          <p className="mt-3">
            Optional AI-assisted features send only the content required for that request to the configured model
            provider. Under typical API terms, that traffic is not used to train public foundation models unless the
            provider states otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Security and connection</h2>
          <p className="mt-3">
            The live site is intended to be served over HTTPS so your connection to the app is encrypted in transit.
            Hosting and TLS are managed by the platform you deploy on (for example Netlify or Vercel), which also
            applies its own security practices.
          </p>
          <p className="mt-3">
            On private or preview deployments, we may configure standard signals (such as{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground/90">robots.txt</code> and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground/90">X-Robots-Tag</code>) to
            discourage search engines from indexing the site. That setting is controlled by the host; it is not a
            guarantee that every search engine will comply immediately.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Using this tool</h2>
          <p className="mt-3 text-foreground/90">
            By using this website, you acknowledge that it is provided to support your studies only. It does not
            replace official teaching, mark schemes, or exam-board rules.
          </p>
        </section>
      </div>
    </article>
  );
}
