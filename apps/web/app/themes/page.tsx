import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Themes | Tensorcraft",
  description:
    "Choose your learning path — 5 themed courses from frontend to ML.",
};

export default function ThemesPage() {
  const themeList = Object.values(themes);

  return (
    <main
      className="min-h-screen px-6 py-20"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      <div className="max-w-5xl mx-auto">
        <h1
          className="text-4xl font-bold mb-3"
          style={{ color: "var(--tc-text, #fff)" }}
        >
          Choose Your World
        </h1>
        <p
          className="text-lg mb-12"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          Each theme teaches ML through a unique story and domain
          specialization.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themeList.map((theme) => {
            const isLaunched = theme.status === "launched";

            return (
              <div
                key={theme.slug}
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  background: theme.palette.surface,
                  border: `1px solid rgba(255,255,255,0.06)`,
                  opacity: isLaunched ? 1 : 0.6,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: isLaunched
                        ? "rgba(0,212,255,0.1)"
                        : "rgba(255,255,255,0.05)",
                      color: isLaunched
                        ? "#00D4FF"
                        : "var(--tc-muted, #8B92A5)",
                    }}
                  >
                    {isLaunched ? "Available" : "Coming Soon"}
                  </span>
                </div>

                <h2
                  className="text-xl font-bold mb-1"
                  style={{ color: theme.palette.text }}
                >
                  {theme.displayName}
                </h2>
                <p
                  className="text-sm mb-2"
                  style={{ color: theme.palette.accent }}
                >
                  {theme.specialization}
                </p>
                <p
                  className="text-sm leading-relaxed mb-4 flex-1"
                  style={{ color: theme.palette.muted }}
                >
                  {theme.description}
                </p>

                {isLaunched ? (
                  <Link
                    href={`/themes/${theme.slug}`}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ background: theme.palette.accent, color: "#000" }}
                  >
                    Start Learning
                  </Link>
                ) : (
                  <span
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: theme.palette.muted,
                    }}
                  >
                    Coming Soon
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
