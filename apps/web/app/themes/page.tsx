import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { BRIDGES } from "@tensorcraft/shared";
import { ComingSoonCard } from "./coming-soon-card";
import { AmbientBackground } from "@/app/components/ambient-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Themes | Tensorcraft",
  description:
    "Choose your learning path — 5 themed courses from frontend to ML.",
};

/** Map theme slugs to display icons */
const themeIcons: Record<string, string> = {
  "deep-orbit": "🛸",
  "neon-protocol": "🌆",
  "signal-ward": "🩺",
  "nova-canvas": "🎨",
  "terra-grid": "⚡",
};

export default function ThemesPage() {
  const themeList = Object.values(themes);
  const featured = themeList.find((t) => t.status === "launched");
  const comingSoon = themeList.filter((t) => t.status === "coming-soon");

  return (
    <main className="min-h-screen bg-surface px-6 py-20 relative overflow-hidden">
      <AmbientBackground count={240} />
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Hero */}
        <p className="font-mono text-sm text-text-muted mb-2">
          {"// FIVE THEMED WORLDS"}
        </p>
        <h1 className="text-4xl md:text-5xl font-mono font-bold text-text-primary mb-3">
          Choose Your World
        </h1>
        <p className="text-lg text-text-muted mb-14 max-w-2xl">
          Each theme teaches ML through a unique story, domain specialization,
          and the model you build along the way.
        </p>

        {/* Featured card — Deep Orbit */}
        {featured && (
          <div className="border-2 border-primary mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Art panel */}
              <div
                className="relative flex items-center justify-center p-10 md:p-14"
                style={{
                  background: `
                    linear-gradient(rgba(107,170,138,0.06) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(107,170,138,0.06) 1px, transparent 1px),
                    #1A1A1A
                  `,
                  backgroundSize: "24px 24px, 24px 24px, 100% 100%",
                }}
              >
                <div className="text-center">
                  <span className="text-6xl md:text-7xl block mb-4">
                    {themeIcons[featured.slug] ?? "🚀"}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-primary">
                    {featured.displayName}
                  </span>
                </div>
              </div>

              {/* Info panel */}
              <div className="bg-surface-raised p-8 md:p-10 flex flex-col">
                {/* Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                    <span className="w-1.5 h-1.5 bg-primary" />
                    Available Now
                  </span>
                </div>

                <p className="text-xs font-mono uppercase tracking-widest text-text-muted mb-1">
                  {featured.specialization}
                </p>
                <h2 className="text-2xl md:text-3xl font-mono font-bold text-primary mb-3">
                  {featured.displayName}
                </h2>
                <p className="text-sm leading-relaxed text-text-muted mb-4">
                  {featured.description}
                </p>

                {/* Build info */}
                <p className="text-xs font-mono text-text-muted mb-4">
                  <span className="text-text-primary">You&apos;ll build:</span>{" "}
                  {featured.modelBuilt}
                </p>

                {/* Characters */}
                <p className="text-xs text-text-muted mb-5">
                  <span className="font-mono text-text-primary">Crew: </span>
                  {featured.characters.map((c) => c.name).join(", ")}
                </p>

                {/* Stats row */}
                <div className="flex gap-6 mb-6 text-xs font-mono text-text-muted">
                  <span>
                    <span className="text-text-primary font-semibold">11</span>{" "}
                    Modules
                  </span>
                  <span>
                    <span className="text-text-primary font-semibold">55</span>{" "}
                    Lessons
                  </span>
                  <span>
                    <span className="text-text-primary font-semibold">
                      {BRIDGES.length}
                    </span>{" "}
                    FE Bridges
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href={`/themes/${featured.slug}`}
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-mono font-semibold bg-primary text-black transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                  style={{
                    boxShadow: "4px 4px 0px rgba(107,170,138,0.4)",
                  }}
                >
                  Begin Learning &rarr;
                </Link>
              </div>
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
                icon={themeIcons[theme.slug] ?? "📦"}
                modelBuilt={theme.modelBuilt}
                characters={theme.characters.map((c) => c.name)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
