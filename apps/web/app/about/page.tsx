import Link from "next/link";
import type { Metadata } from "next";
import {
  WORLD_CONTENT,
  WORLD_SLUGS,
  EXERCISE_CONTENT,
} from "@tensorcraft/shared";

export const metadata: Metadata = {
  title: "About Tensorcraft | Why this course exists",
  description:
    "Why Tensorcraft was built, how it maps ML onto JavaScript, and what we deliberately left out.",
  alternates: { canonical: "https://tensorcraft.app/about" },
  // Per-route openGraph/twitter. Without these the route inherited the root
  // layout's block, so og:url pointed at the homepage and every share of
  // this page presented as the site root - wrong title, wrong image, wrong
  // destination preview. Matters most during a distribution push.
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/about",
    title: "About Tensorcraft | Tensorcraft",
    images: [
      "/api/og?title=About%20Tensorcraft&world=deep-orbit&subtitle=Why%20this%20course%20exists",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Tensorcraft | Tensorcraft",
    images: [
      "/api/og?title=About%20Tensorcraft&world=deep-orbit&subtitle=Why%20this%20course%20exists",
    ],
  },
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
              "Why Tensorcraft was built, how it maps ML onto JavaScript, and what we deliberately left out.",
            url: "https://tensorcraft.app/about",
            mainEntity: {
              "@type": "EducationalOrganization",
              name: "Tensorcraft",
              url: "https://tensorcraft.app",
              description: `Browser-based machine learning course for JavaScript developers. TensorFlow.js. ${WORLD_CONTENT.totalLessonsPerWorld} lessons live in the first of ${WORLD_SLUGS.length} planned courses.`,
            },
          }),
        }}
      />
      <article className="max-w-3xl mx-auto">
        <p className="font-mono text-xs text-primary tracking-[0.18em] uppercase mb-3">
          ABOUT
        </p>
        <h1 className="text-4xl md:text-5xl font-mono font-black tracking-tight text-text-primary mb-8">
          Why this course exists.
        </h1>

        <section className="space-y-6 text-base text-text-muted leading-relaxed font-sans">
          {/* Origin, kept collective by the owner's explicit choice
              (2026-07-25): Tensorcraft speaks as the group that built it, not
              as a named individual. Do not add a personal name or byline
              here without asking. */}
          <p>
            Tensorcraft was built by a group of JavaScript engineers who wanted
            an easy way into machine learning. We looked for a course that spoke
            our language and did not find one, so we took matters into our own
            hands.
          </p>

          <p>
            Most ML courses teach you ML. Tensorcraft teaches you ML by mapping
            it to the JavaScript you already write:{" "}
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
            Every exercise grades by executing your code, not by string-matching
            it. {EXERCISE_CONTENT.liveExercises} exercises are live today, each
            running against real TensorFlow.js in a worker in your browser, with
            a reference solution that passes its own tests in CI.{" "}
            {EXERCISE_CONTENT.authoredFiveWorlds} are authored across the
            five-world roadmap. Only the shipped set has been through our
            validation gates; we do not claim the rest meet that bar until they
            ship. Roughly half of the live exercises drive tensor and model APIs
            directly, and there, a failing test means the model behavior is
            actually wrong. The other half grade the data preparation and
            production plumbing around a model, and there, a failing test means
            that logic is wrong.
          </p>

          <p>
            Five worlds are planned (Deep Orbit, Neon Protocol, Signal Ward,
            Nova Canvas, Terra Grid), each wrapping the curriculum in a
            different story. Deep Orbit is the one open today. Across its
            modules you assemble a working browser-side ML system, piece by
            piece. Connect GitHub and every solved exercise pushes to your repo.
            The story keeps you on the page. What you take to interviews is the
            ability to explain every layer of what you built.
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
              Browser ML lives within the compute budget the user&apos;s device
              gives you when the model runs. Distributed GPU training is a
              different sport.
            </li>
            <li>
              <span className="text-text-primary font-mono text-sm">
                Paper-grade math derivations.
              </span>{" "}
              The math the course needs (chain rule, softmax, KL, cross-entropy)
              is all derived when it first appears. Beyond that, Karpathy&apos;s
              Zero-to-Hero is the right course.
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
            badge claims). Every count on this page is pinned to the content
            corpus by tests that run in CI. If you find something we got wrong,
            email{" "}
            <a
              href="mailto:support@tensorcraft.app"
              className="text-primary underline underline-offset-4"
            >
              support@tensorcraft.app
            </a>{" "}
            and we&apos;ll publish the correction.
          </p>

          <h2 className="text-2xl font-mono font-bold text-text-primary mt-12 mb-4">
            Built by JavaScript engineers who shipped ML
          </h2>
          <p>
            Before writing the curriculum, we shipped ML in production, in
            browsers and on Node servers. We built the course we wish we&apos;d
            had when we started. Every analogy was tested against our own
            missed-it-the-first-time mistakes.
          </p>
        </section>

        <div className="mt-16 flex flex-wrap items-center gap-4">
          <Link
            href="/worlds"
            className="rounded-none inline-flex items-center px-8 py-4 bg-primary text-on-primary font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
          >
            Start Module 1 →
          </Link>
        </div>
      </article>
    </main>
  );
}
