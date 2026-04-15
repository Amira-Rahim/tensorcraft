import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { PRICING, THEME_CONTENT } from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "5 ML Courses for Frontend Developers | Tensorcraft",
  description:
    "Choose your learning path — 5 themed courses from frontend to ML.",
};

export const revalidate = 3600;

export default function ThemesPage() {
  const themeList = Object.values(themes);

  return (
    <main className="min-h-screen bg-surface px-6 py-20 relative overflow-hidden">
      <AmbientBackground count={240} />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Hero */}
        <p className="font-mono text-sm text-text-muted mb-2">
          {"// FIVE THEMED WORLDS"}
        </p>
        <h1 className="text-4xl md:text-5xl font-mono font-bold text-text-primary mb-3">
          Choose Your World
        </h1>
        <p className="text-lg text-text-muted mb-6 max-w-2xl">
          Each theme teaches a different ML specialization through a unique
          narrative. Same depth, different career outcomes.
        </p>
        <p className="text-base text-text-muted mb-14 max-w-2xl leading-relaxed">
          Whether you&apos;re a React developer exploring neural networks or a
          Vue engineer building computer vision, each theme teaches a complete
          ML specialization through JavaScript and TensorFlow.js — no Python
          required.
        </p>

        {/* All themes grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {themeList.map((theme) => (
            <Link
              key={theme.slug}
              href={`/themes/${theme.slug}`}
              className="group border-2 border-border bg-surface-raised hover:border-primary/50 hover:shadow-[4px_4px_0_var(--tc-primary)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold uppercase tracking-wider"
                  style={{
                    color: theme.palette.primary,
                    background: `${theme.palette.primary}15`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5"
                    style={{ background: theme.palette.primary }}
                  />
                  LIVE
                </span>
                <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
                  {theme.specialization}
                </span>
              </div>
              <div className="px-6 py-6">
                <h2
                  className="text-xl font-mono font-bold mb-2 tracking-tight group-hover:text-text-primary transition-colors"
                  style={{ color: theme.palette.primary }}
                >
                  {theme.displayName}
                </h2>
                <p className="text-sm text-text-muted mb-4 leading-relaxed line-clamp-2">
                  {theme.description}
                </p>
                <p className="text-xs font-mono text-text-muted mb-4">
                  <span className="text-text-primary font-semibold">
                    Final project:
                  </span>{" "}
                  {theme.modelBuilt}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs font-mono text-text-muted">
                  <span>
                    <span className="text-text-primary font-bold">
                      {THEME_CONTENT.modulesPerTheme}
                    </span>{" "}
                    modules
                  </span>
                  <span>
                    <span className="text-text-primary font-bold">
                      {THEME_CONTENT.totalLessonsPerTheme}
                    </span>{" "}
                    lessons
                  </span>
                  <span>
                    <span className="text-text-primary font-bold">
                      ${PRICING.single.price}
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Why 5 Themes? */}
        <section className="mt-20">
          <h2 className="text-2xl font-mono font-bold text-text-primary mb-4 tracking-tight">
            Why 5 Themes?
          </h2>
          <p className="text-base text-text-muted leading-relaxed max-w-2xl mb-4">
            Machine learning is not one skill — it&apos;s a family of
            specializations. Time-series analysis, computer vision, NLP,
            generative AI, and edge deployment each demand different mental
            models, architectures, and tooling. One course can&apos;t cover them
            all with the depth you need.
          </p>
          <p className="text-base text-text-muted leading-relaxed max-w-2xl">
            Each Tensorcraft theme maps to a different ML career path. Deep
            Orbit prepares you for signal processing roles. Neon Protocol covers
            the vision pipeline from convolutions to real-time object detection.
            Signal Ward builds NLP skills from tokenization to transformers.
            Nova Canvas explores multimodal and generative models. Terra Grid
            focuses on deploying and optimizing models at the edge. Pick the
            path that matches where you want to go.
          </p>
        </section>
      </div>
    </main>
  );
}
