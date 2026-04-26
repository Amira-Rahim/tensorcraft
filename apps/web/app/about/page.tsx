import Link from "next/link";
import type { Metadata } from "next";

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
      <article className="max-w-3xl mx-auto prose-invert">
        <p className="font-mono text-xs text-primary tracking-[0.18em] uppercase mb-3">
          // ABOUT
        </p>
        <h1 className="text-4xl md:text-5xl font-mono font-black tracking-tight text-text-primary mb-8">
          Why this course exists.
        </h1>

        <section className="space-y-6 text-base text-text-muted leading-relaxed font-sans">
          <p>
            Most ML courses teach you ML. Tensorcraft teaches you ML by mapping
            it to the frontend code you already write — `useState` becomes model
            parameters, `Array.reduce` becomes a neuron, `Math.max(0, x)`
            literally is ReLU. The bridges aren&apos;t marketing. They&apos;re
            the curriculum.
          </p>

          <p>
            Every analogy ships with a label that names where it stops being
            literal. We call this the{" "}
            <Link
              href="/bridges"
              className="text-primary underline underline-offset-4"
            >
              bridge-tier system
            </Link>{" "}
            — identity (literally the same), structural (same shape, different
            domain), intuition (same mental model, different math). Structural
            and intuition bridges include a &ldquo;where this breaks&rdquo;
            statement so you stop carrying the wrong model into production.
          </p>

          <p>
            Every exercise grades against real TensorFlow.js, not a mock.
            295&plus; exercises, 100% solution-passes-all-tests, all running in
            a worker in your browser. If a test fails, the model behavior is
            actually wrong; not a string-match heuristic.
          </p>

          <p>
            Five themes (Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas,
            Terra Grid) wrap the curriculum in narrative. Each one ends with a
            deployable browser-side ML application. The story keeps you on the
            page; the deployable artifact is what you take to interviews.
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
              Chain rule, softmax, KL, cross-entropy — all derived. Beyond that,
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
          <Link
            href="/compare"
            className="rounded-none inline-flex items-center px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all"
          >
            Compare to other courses
          </Link>
        </div>
      </article>
    </main>
  );
}
