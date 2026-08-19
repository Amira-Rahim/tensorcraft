import Link from "next/link";
import type { Metadata } from "next";
import { worlds } from "@tensorcraft/worlds";
import { WORLD_SLUGS, WORLD_CONTENT, isLaunched } from "@tensorcraft/shared";

export const metadata: Metadata = {
  title: "Learn Machine Learning with JavaScript | Tensorcraft",
  description:
    "A JavaScript developer's guide to machine learning. Learn ML through code you already know: useState becomes model weights, Array.map becomes tensor ops. No Python required.",
  alternates: {
    canonical: "https://tensorcraft.app/learn",
  },
  // An images-only openGraph REPLACES the root block (Next shallow-merges
  // metadata objects), silently dropping og:url/type/siteName and inheriting
  // the homepage twitter card - every share of this page presented as the
  // site root (R3-7). Declare the full block.
  openGraph: {
    type: "website",
    url: "https://tensorcraft.app/learn",
    title: "Learn Machine Learning with JavaScript | Tensorcraft",
    images: [
      "/api/og?title=Learn%20ML%20with%20JavaScript&world=deep-orbit&subtitle=A%20JavaScript%20developer%27s%20guide",
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn Machine Learning with JavaScript | Tensorcraft",
    images: [
      "/api/og?title=Learn%20ML%20with%20JavaScript&world=deep-orbit&subtitle=A%20JavaScript%20developer%27s%20guide",
    ],
  },
};

export const revalidate = 3600;

export default function LearnPage() {
  const liveWorlds = WORLD_SLUGS.filter((slug) => isLaunched(slug));
  const comingWorlds = WORLD_SLUGS.filter((slug) => !isLaunched(slug));

  return (
    <main className="min-h-screen bg-page px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-text-primary mb-6 font-mono tracking-tight">
          Learn Machine Learning with JavaScript
        </h1>

        <p className="text-lg text-text-muted font-sans leading-relaxed mb-8">
          You already think in arrays, state, and async. Machine learning uses
          the same patterns, just with different names. Tensorcraft bridges the
          gap with {WORLD_CONTENT.lessonBridges} analogies that map the
          JavaScript you know to ML concepts.
        </p>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          You Already Know More ML Than You Think
        </h2>
        <p className="text-base text-text-muted font-sans leading-relaxed mb-6">
          If you understand{" "}
          <code className="text-primary font-mono">useState()</code>, you
          understand model weights. If you can write{" "}
          <code className="text-primary font-mono">array.map()</code>, you can
          do tensor operations. If you&apos;ve used{" "}
          <code className="text-primary font-mono">fetch()</code>, you already
          know how inference APIs work.
        </p>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          How Tensorcraft Works
        </h2>
        <ul className="space-y-3 mb-8 text-base text-text-muted font-sans">
          <li className="flex gap-3">
            <span className="text-primary shrink-0">1.</span>
            <span>
              Start in Deep Orbit, the live course: time-series and signals,
              told as one story across 11 modules
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary shrink-0">2.</span>
            <span>
              Learn through bridges: {WORLD_CONTENT.lessonBridges} analogies map
              ML concepts to JavaScript concepts you know, each labeled where it
              breaks
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary shrink-0">3.</span>
            <span>
              Code in the browser: write real TensorFlow.js code in interactive
              exercises
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary shrink-0">4.</span>
            <span>
              Build a real project: each course culminates in a capstone ML
              model running live in the browser
            </span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          No Python Required
        </h2>
        <p className="text-base text-text-muted font-sans leading-relaxed mb-8">
          The lessons run TensorFlow.js in the browser, so there is nothing to
          install. You write TypeScript, test in real time, and ship a model
          that runs on any device with a browser. The same TensorFlow.js code
          runs under Node when you want the model on a server. You skip the
          Jupyter notebooks, pip installs, and GPU setup entirely.
        </p>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          Start Free
        </h2>
        <p className="text-base text-text-muted font-sans leading-relaxed mb-6">
          Module 1 of Deep Orbit is completely free, no account, no credit card.
          Just open a lesson and start learning.
        </p>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          Available Now
        </h2>
        <ul className="space-y-2 mb-6 text-base text-text-muted font-sans">
          {liveWorlds.map((slug) => (
            <li key={slug}>
              <Link
                href={`/worlds/${slug}`}
                className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                {worlds[slug]?.displayName ?? slug}
              </Link>
              : {worlds[slug]?.specialization}
            </li>
          ))}
        </ul>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          Coming Soon
        </h2>
        <p className="text-base text-text-muted font-sans leading-relaxed mb-3">
          {comingWorlds.length} more courses ship in waves:
        </p>
        {/* Names only, no links: coming-soon worlds are inert everywhere
            (worlds/world-cards-grid.tsx precedent). The stubs stay in the
            sitemap for crawlers; the notify path is /worlds. */}
        <ul className="space-y-2 mb-8 text-base text-text-muted font-sans">
          {comingWorlds.map((slug) => (
            <li key={slug}>
              <span className="text-text-primary">
                {worlds[slug]?.displayName ?? slug}
              </span>
              : {worlds[slug]?.specialization} (coming soon)
            </li>
          ))}
        </ul>

        <p className="text-base text-text-muted font-sans leading-relaxed mb-8">
          Check out our{" "}
          <Link
            href="/pricing"
            className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            pricing
          </Link>{" "}
          to see what each plan includes.
        </p>

        <Link
          href="/worlds"
          className="inline-flex items-center px-8 py-4 bg-primary text-on-primary font-mono font-bold text-sm uppercase tracking-wider transition-all hover:shadow-[4px_4px_0_var(--tc-primary)] hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          See All 5 Courses →
        </Link>
      </div>
    </main>
  );
}
