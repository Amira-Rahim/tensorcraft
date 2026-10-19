import Link from "next/link";
import type { Metadata } from "next";
import {
  WORLD_CONTENT,
  WORLD_SLUGS,
  EXERCISE_CONTENT,
} from "@tensorcraft/shared";

export const metadata: Metadata = {
  title: "About Tensorcraft, Why this course exists",
  description:
    "Why we built Tensorcraft, how it maps ML onto JavaScript, and what we deliberately left out.",
  alternates: { canonical: "https://tensorcraft.app/about" },
  // Per-route openGraph/twitter. Without these the route inherited the root
  // layout's block, so og:url pointed at the homepage and every share of
  // this page presented as the site root - wrong title, wrong image, wrong
  // destination preview. Matters most during a distribution push.
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/about",
    title: "About Tensorcraft, Tensorcraft",
    images: [
      "/api/og?title=About%20Tensorcraft&world=deep-orbit&subtitle=Why%20this%20course%20exists",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Tensorcraft, Tensorcraft",
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
              "Why we built Tensorcraft, how it maps ML onto JavaScript, and what we deliberately left out.",
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
            We’re a group of JavaScript engineers who wanted to learn ML through
            code we already understood. We built Tensorcraft to make that
            possible.
          </p>

          <p>
            The lessons start with familiar code:{" "}
            <code className="font-mono text-text-primary text-sm">
              useState
            </code>{" "}
            helps introduce the idea of changing model state,{" "}
            <code className="font-mono text-text-primary text-sm">
              Array.reduce
            </code>{" "}
            can calculate a neuron’s weighted sum, and{" "}
            <code className="font-mono text-text-primary text-sm">
              Math.max(0, x)
            </code>{" "}
            is ReLU for a single number.
          </p>

          <p>
            Each comparison explains how far it holds. Some are exact, like
            ReLU. Others share a structure or offer a way to picture the idea.
            We label those differences and explain where an analogy stops
            working.
          </p>

          <p>
            Exercises run your code and check what it does.{" "}
            {EXERCISE_CONTENT.liveExercises} exercises are live today. They run
            in a browser worker with TensorFlow.js available, and we check their
            reference solutions in CI. We have written{" "}
            {EXERCISE_CONTENT.authoredFiveWorlds} exercises across the five
            planned worlds. We have completed release checks for the published
            exercises. Some use tensors and models directly. Others cover the
            data preparation, validation, and deployment code around them.
          </p>

          <p>
            We plan five worlds (Deep Orbit, Neon Protocol, Signal Ward, Nova
            Canvas, Terra Grid), each with its own story and ML curriculum. Deep
            Orbit is the one open today. Across its modules you assemble a
            working browser-side ML system, piece by piece. Connect GitHub and
            every solved exercise pushes to your repo. The crew’s task gives you
            a reason to use each concept. Your saved work gives you code to
            revisit, explain, and share.
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
              A model running in a browser shares the device’s memory and
              processing power with the rest of the app. Distributed GPU
              training is outside this course.
            </li>
            <li>
              <span className="text-text-primary font-mono text-sm">
                Research-level mathematics.
              </span>{" "}
              We derive the math the course needs (chain rule, softmax, KL,
              cross-entropy) when we first introduce it. Beyond that,
              Karpathy&apos;s Zero-to-Hero is the right course.
            </li>
            <li>
              <span className="text-text-primary font-mono text-sm">
                Research methodology.
              </span>{" "}
              We teach engineering practice. Designing novel research
              experiments falls outside this course.
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
            fast.ai comparison, and a review of what each exercise actually
            teaches. CI checks the counts on this page against the course files.
            If you find something we got wrong, email{" "}
            <a
              href="mailto:support@tensorcraft.app"
              className="text-primary underline underline-offset-4"
            >
              support@tensorcraft.app
            </a>{" "}
            and we&apos;ll publish the correction.
          </p>

          <h2 className="text-2xl font-mono font-bold text-text-primary mt-12 mb-4">
            Our experience with ML
          </h2>
          <p>
            Before writing the curriculum, we shipped ML in production, in
            browsers and on Node servers. We built the course we wish we&apos;d
            had when we started. The explanations draw on concepts we struggled
            with when we were learning.
          </p>
        </section>

        <div className="mt-16 flex flex-wrap items-center gap-4">
          <Link
            href="/worlds"
            className="rounded-none inline-flex items-center px-8 py-4 bg-primary text-on-primary font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover"
          >
            Start Module 1
          </Link>
        </div>
      </article>
    </main>
  );
}
