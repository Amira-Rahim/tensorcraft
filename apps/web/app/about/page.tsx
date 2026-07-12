import Link from "next/link";
import type { Metadata } from "next";
import { THEME_CONTENT, THEME_SLUGS } from "@tensorcraft/shared";

export const metadata: Metadata = {
  title: "About Tensorcraft | Why this course exists",
  description:
    "Why Tensorcraft was built, the bridge-tier method, and what we deliberately left out. Honest authorship, not a marketing manifesto.",
  alternates: { canonical: "https://tensorcraft.app/about" },
};

export const revalidate = 86400;

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-page px-6 md:px-10 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About Tensorcraft",
            description:
              "Why Tensorcraft was built, the bridge-tier method, and what we deliberately left out.",
            url: "https://tensorcraft.app/about",
            mainEntity: {
              "@type": "EducationalOrganization",
              name: "Tensorcraft",
              url: "https://tensorcraft.app",
              description: `Browser-based machine learning course for frontend developers. JavaScript / TensorFlow.js. ${THEME_CONTENT.totalLessonsPerTheme} lessons live in the first of ${THEME_SLUGS.length} planned themes.`,
            },
          }),
        }}
      />
      <article className="max-w-3xl mx-auto prose-invert">
        <p className="font-mono text-xs text-primary tracking-[0.18em] uppercase mb-3">
          ABOUT
        </p>
        <h1 className="text-4xl md:text-5xl font-mono font-black tracking-tight text-text-primary mb-8">
          Why this course exists.
        </h1>

        <section className="space-y-6 text-base text-text-muted leading-relaxed font-sans">
          <p>
            Most ML courses teach you ML. Tensorcraft teaches you ML by mapping
            it to the frontend code you already write:{" "}
            <code className="font-mono text-text-primary text-sm">
              useState
            </code>{" "}
            becomes model parameters,{" "}
            <code className="font-mono text-text-primary text-sm">
              Array.reduce
            </code>{" "}
            becomes a neuron,{" "}
            <code className="font-mono text-text-primary text-sm">
              Math.max(0, x)
            </code>{" "}
            literally is ReLU. The bridges aren&apos;t marketing. They&apos;re
            the curriculum.
          </p>

          <p>
            Every analogy ships with a label that names where it stops being
            literal. We call this the bridge-tier system: identity (literally
            the same), structural (same shape, different domain), intuition
            (same mental model, different math). Structural and intuition
            bridges include a note on where the analogy ends so you stop
            carrying the wrong model into production.
          </p>

          <p>
            Every exercise grades against real TensorFlow.js, not a mock. 80
            exercises live today at 100% solution-passes-all-tests, all running
            in a worker in your browser, with 315 authored across the five-theme
            roadmap and held to the same bar. If a test fails, the model
            behavior is actually wrong; not a string-match heuristic.
          </p>

          <p>
            Five themes (Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas,
            Terra Grid) wrap the curriculum in narrative. Each one builds toward
            a working browser-side ML system, assembled piece by piece across
            the modules; connect GitHub and every solved exercise pushes to your
            repo. The story keeps you on the page; understanding every layer of
            what you built is what you take to interviews.
          </p>

          <h2 className="text-2xl font-mono font-bold text-text-primary mt-12 mb-4">
            What we deliberately left out
          </h2>
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <span className="text-text-primary font-mono text-sm">
                Python ecosystem coverage.
              </span>{" "}
              If you want PyTorch / Hugging Face / pandas mastery, fast.ai and
              the Hugging Face NLP Course are excellent and free.
            </li>
            <li>
              <span className="text-text-primary font-mono text-sm">
                GPU training pipelines.
              </span>{" "}
              Browser ML lives within the inference budget the user&apos;s
              device gives you. Distributed GPU training is a different sport.
            </li>
            <li>
              <span className="text-text-primary font-mono text-sm">
                Paper-grade math derivations.
              </span>{" "}
              Chain rule, softmax, KL, cross-entropy. All derived. Beyond that,
              Karpathy&apos;s Zero-to-Hero is the right course.
            </li>
            <li>
              <span className="text-text-primary font-mono text-sm">
                Research methodology.
              </span>{" "}
              We teach engineering practice, not novel research design.
            </li>
          </ul>

          <h2 className="text-2xl font-mono font-bold text-text-primary mt-12 mb-4">
            The audit trail
          </h2>
          <p>
            We publish our own audits.{" "}
            <Link
              href="/blog"
              className="text-primary underline underline-offset-4"
            >
              The blog
            </Link>{" "}
            includes the bridge-tier audit (every lesson, classified), the
            fast.ai comparison (where they win, where we win), and the exercise
            mlContent audit (what each exercise actually exercises vs. what its
            badge claims). If you find something we got wrong, the source is on
            GitHub.
          </p>

          <h2 className="text-2xl font-mono font-bold text-text-primary mt-12 mb-4">
            Built by FE devs who shipped ML
          </h2>
          <p>
            Tensorcraft is authored by frontend engineers who shipped ML in
            production web apps before writing the curriculum. We built the
            course we wanted when we started. Every analogy was tested against
            our own missed-it-the-first-time mistakes.
          </p>
        </section>

        <div className="mt-16 flex flex-wrap items-center gap-4">
          <Link
            href="/themes"
            className="rounded-none inline-flex items-center px-8 py-4 bg-primary text-page font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
          >
            Start Module 1 →
          </Link>
        </div>
      </article>
    </main>
  );
}
