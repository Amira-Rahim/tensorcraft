import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { PRICING, THEME_CONTENT } from "@tensorcraft/shared";
import { ComingSoonCard } from "./coming-soon-card";
import { AmbientBackground } from "@/app/components/ambient-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Themes | Tensorcraft",
  description:
    "Choose your learning path — 5 themed courses from frontend to ML.",
};

export default function ThemesPage() {
  const themeList = Object.values(themes);
  const featured = themeList.find((t) => t.status === "launched");
  const comingSoon = themeList.filter((t) => t.status === "coming-soon");

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
        <p className="text-lg text-text-muted mb-14 max-w-2xl">
          Each theme teaches a different ML specialization through a unique
          narrative. Same depth, different career outcomes.
        </p>

        {/* Featured card — Deep Orbit */}
        {featured && (
          <div className="border-2 border-primary mb-10 bg-surface-raised">
            {/* Top bar */}
            <div className="flex items-center justify-between px-7 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                  <span className="w-1.5 h-1.5 bg-primary" />
                  Available Now
                </span>
                <span className="font-mono text-[11px] text-text-muted uppercase tracking-wider">
                  {featured.specialization}
                </span>
              </div>
              <span className="font-mono text-sm text-text-muted">
                ${PRICING.single.price}
              </span>
            </div>

            {/* Body */}
            <div className="px-7 py-8 md:px-10 md:py-10">
              {/* Name + hook */}
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-primary mb-3 tracking-tight">
                {featured.displayName}
              </h2>
              <p className="text-base text-text-muted mb-6 max-w-xl leading-relaxed">
                Build a real-time signal classifier entirely in JavaScript.
                Train, test, and deploy a neural network that runs at 60fps in
                the browser.
              </p>

              {/* Career paths — the primary motivator */}
              <div className="mb-6">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
                  Career paths this unlocks
                </p>
                <div className="flex flex-wrap gap-2">
                  {featured.careerPaths.map((path) => (
                    <span
                      key={path}
                      className="inline-flex px-3 py-1.5 text-xs font-mono border border-primary/30 text-primary bg-primary/5"
                    >
                      {path}
                    </span>
                  ))}
                </div>
              </div>

              {/* What you'll build — concrete, one line */}
              <p className="text-sm font-mono text-text-muted mb-6">
                <span className="text-text-primary font-semibold">
                  Final project:
                </span>{" "}
                {featured.modelBuilt}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 mb-8 text-sm font-mono text-text-muted">
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
                  <span className="text-text-primary font-bold">~25</span> hours
                </span>
              </div>

              {/* Dual CTA */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/themes/${featured.slug}`}
                  className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-mono font-bold bg-primary text-[#1C1C1C] border-2 border-primary transition-all hover:shadow-[4px_4px_0_var(--tc-primary)] hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  Try Module 1 Free &rarr;
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-mono font-bold text-primary border-2 border-primary transition-all hover:bg-primary hover:text-[#1C1C1C]"
                >
                  ${PRICING.single.price} &mdash; Full Access
                </Link>
              </div>

              {/* Story teaser — secondary, for immersion-curious users */}
              <p className="mt-8 pt-6 border-t border-border text-xs text-text-muted leading-relaxed max-w-xl">
                <span className="font-mono text-text-primary text-[10px] uppercase tracking-wider">
                  The story:{" "}
                </span>
                {featured.description}
              </p>
            </div>
          </div>
        )}

        {/* Coming Soon — 2x2 grid */}
        {comingSoon.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comingSoon.map((theme) => (
              <ComingSoonCard
                key={theme.slug}
                slug={theme.slug}
                displayName={theme.displayName}
                specialization={theme.specialization}
                description={theme.description}
                accentColor={theme.palette.accent}
                surfaceColor={theme.palette.surface}
                mutedColor={theme.palette.muted}
                modelBuilt={theme.modelBuilt}
                careerPaths={theme.careerPaths}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
