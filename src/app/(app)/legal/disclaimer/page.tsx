import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disclaimer | DSD revision hub",
  description: "Independence, non-affiliation, and limitation of liability.",
};

export default function DisclaimerPage() {
  return (
    <article className="mx-auto max-w-2xl py-10 sm:py-14">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Link href="/revision" className="text-accent hover:underline">
          Back to revision
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">Disclaimer</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Please read this page carefully. It sets out who operates this site and what you should not rely on it for.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground">Independence from Waltham Forest College</h2>
          <p className="mt-3 text-foreground/90">
            This website is a private, student-led initiative. It is{" "}
            <span className="font-semibold text-foreground">not</span> officially affiliated with, endorsed by, or
            managed by Waltham Forest College, its staff, or its governing bodies. The college is not responsible for
            the content, accuracy, or availability of this platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Purpose of the materials</h2>
          <p className="mt-3">
            All tools, prompts, and supporting text on this site are offered for general revision, practice, and
            collaborative study only. They may contain errors, outdated wording, or interpretations that do not match
            your current specification or classroom emphasis.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">No warranty and limitation of liability</h2>
          <p className="mt-3">
            The site is provided as-is, without warranties of any kind, to the fullest extent permitted by law. While reasonable effort is made to keep features working and content reasonable, the creators and
            contributors assume no responsibility or liability for any errors, omissions, downtime, data loss, or
            outcomes such as coursework marks or exam results. Any reliance you place on the site is strictly at your
            own risk.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Where to get authoritative guidance</h2>
          <p className="mt-3">
            Always follow your official tutors, internal policies, and learning platform (for example Moodle or
            Canvas) for assessed work, deadlines, and examination rules. Exam boards and awarding organisations publish the
            definitive requirements; this site is only a supplementary aid.
          </p>
        </section>
      </div>
    </article>
  );
}
