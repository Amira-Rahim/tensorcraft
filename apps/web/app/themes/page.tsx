import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { PRICING, THEME_CONTENT } from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Themes | Tensorcraft",
  description:
    "Choose your learning path — 5 themed courses from frontend to ML.",
};

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
        <p className="text-lg text-text-muted mb-14 max-w-2xl">
          Each theme teaches a different ML specialization through a unique
          narrative. Same depth, different career outcomes.
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider"
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
                <span className="font-mono text-[11px] text-text-muted uppercase tracking-wider">
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
      </div>
    </main>
  );
}
