import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn Machine Learning with JavaScript | Tensorcraft",
  description:
    "A frontend developer's guide to machine learning. Learn ML through code you already know — useState becomes model weights, Array.map becomes tensor ops. No Python required.",
  alternates: {
    canonical: "https://tensorcraft.app/learn",
  },
  openGraph: {
    images: [
      "/api/og?title=Learn%20ML%20with%20JavaScript&theme=deep-orbit&subtitle=A%20frontend%20developer%27s%20guide",
    ],
  },
};

export const revalidate = 3600;

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-surface px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-text-primary mb-6 font-mono tracking-tight">
          Learn Machine Learning with JavaScript
        </h1>

        <p className="text-lg text-text-muted font-sans leading-relaxed mb-8">
          You already think in arrays, state, and components. Machine learning
          uses the same patterns — just with different names. Tensorcraft
          bridges the gap with 50+ analogies that map your frontend knowledge to
          ML concepts.
        </p>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          Why Frontend Developers Make Great ML Engineers
        </h2>
        <p className="text-base text-text-muted font-sans leading-relaxed mb-6">
          If you understand{" "}
          <code className="text-primary font-mono">useState()</code>, you
          understand model weights. If you can write{" "}
          <code className="text-primary font-mono">array.map()</code>, you can
          do tensor operations. If you&apos;ve used{" "}
          <code className="text-primary font-mono">fetch()</code>, you already
          know how inference APIs work. The leap from frontend to ML is smaller
          than you think.
        </p>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          How Tensorcraft Works
        </h2>
        <ul className="space-y-3 mb-8 text-base text-text-muted font-sans">
          <li className="flex gap-3">
            <span className="text-primary shrink-0">1.</span>
            <span>
              Pick a theme — each teaches a different ML specialization through
              a unique story
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary shrink-0">2.</span>
            <span>
              Learn through bridges — every ML concept is mapped to a frontend
              concept you know
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary shrink-0">3.</span>
            <span>
              Code in the browser — write real TensorFlow.js code in interactive
              exercises
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary shrink-0">4.</span>
            <span>
              Build a real project — each theme culminates in a capstone ML
              model that runs at 60fps
            </span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          No Python Required
        </h2>
        <p className="text-base text-text-muted font-sans leading-relaxed mb-8">
          Everything runs in the browser using TensorFlow.js. You write
          TypeScript, test in real-time, and deploy models that work on any
          device with a web browser. No Jupyter notebooks, no pip install, no
          GPU setup.
        </p>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          Start Free
        </h2>
        <p className="text-base text-text-muted font-sans leading-relaxed mb-6">
          Module 1 of every theme is completely free — no account, no credit
          card. Just open a lesson and start learning.
        </p>

        <h2 className="text-2xl font-bold text-text-primary mb-4 font-mono">
          5 Themed Learning Paths
        </h2>
        <p className="text-base text-text-muted font-sans leading-relaxed mb-4">
          Each theme teaches a different ML specialization through an immersive
          narrative. Pick the one that matches your interests:
        </p>
        <ul className="space-y-2 mb-8 text-base text-text-muted font-sans">
          <li>
            <Link
              href="/themes/deep-orbit"
              className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Deep Orbit
            </Link>{" "}
            — Time-Series &amp; Signals
          </li>
          <li>
            <Link
              href="/themes/neon-protocol"
              className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Neon Protocol
            </Link>{" "}
            — Computer Vision
          </li>
          <li>
            <Link
              href="/themes/signal-ward"
              className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Signal Ward
            </Link>{" "}
            — NLP &amp; Text Intelligence
          </li>
          <li>
            <Link
              href="/themes/nova-canvas"
              className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Nova Canvas
            </Link>{" "}
            — Multimodal &amp; Generative AI
          </li>
          <li>
            <Link
              href="/themes/terra-grid"
              className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Terra Grid
            </Link>{" "}
            — Edge AI &amp; Production ML
          </li>
        </ul>

        <p className="text-base text-text-muted font-sans leading-relaxed mb-8">
          Browse our{" "}
          <Link
            href="/glossary"
            className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            ML Glossary
          </Link>{" "}
          for quick definitions of every concept, or check out our{" "}
          <Link
            href="/pricing"
            className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
          >
            pricing
          </Link>{" "}
          to see what each plan includes.
        </p>

        <Link
          href="/themes"
          className="inline-flex items-center px-8 py-4 bg-primary text-[#1C1C1C] font-mono font-bold text-sm uppercase tracking-wider transition-all hover:shadow-[4px_4px_0_var(--tc-primary)] hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          Explore All Themes →
        </Link>
      </div>
    </main>
  );
}
