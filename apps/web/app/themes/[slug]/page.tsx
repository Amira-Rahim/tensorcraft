import Link from "next/link";
import { notFound } from "next/navigation";
import { themes } from "@tensorcraft/themes";
import { getModules } from "@tensorcraft/content";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const theme = themes[slug];
  if (!theme) return {};
  return {
    title: `${theme.displayName} | Tensorcraft`,
    description: theme.description,
  };
}

export default async function ThemeDetailPage({ params }: Props) {
  const { slug } = await params;
  const theme = themes[slug];
  if (!theme) notFound();

  const themeModules = getModules(slug);

  return (
    <main
      className="min-h-screen px-6 py-20"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Theme header */}
        <div className="mb-12">
          <Link
            href="/themes"
            className="text-sm mb-4 inline-block"
            style={{ color: "var(--tc-muted, #8B92A5)" }}
          >
            ← All Themes
          </Link>
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: theme.palette.text }}
          >
            {theme.displayName}
          </h1>
          <p className="text-lg mb-2" style={{ color: theme.palette.accent }}>
            {theme.specialization}
          </p>
          <p
            className="text-base leading-relaxed max-w-2xl"
            style={{ color: theme.palette.muted }}
          >
            {theme.description}
          </p>
        </div>

        {/* Characters */}
        <div className="mb-12">
          <h2
            className="text-sm uppercase tracking-widest mb-4"
            style={{ color: "var(--tc-muted, #8B92A5)" }}
          >
            Your Crew
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {theme.characters.map((char) => (
              <div
                key={char.name}
                className="rounded-xl p-3 text-center"
                style={{
                  background: theme.palette.surface,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: theme.palette.text }}
                >
                  {char.name}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: theme.palette.muted }}
                >
                  {char.role}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Modules */}
        <div>
          <h2
            className="text-sm uppercase tracking-widest mb-4"
            style={{ color: "var(--tc-muted, #8B92A5)" }}
          >
            {theme.terminology.module}s
          </h2>
          <div className="flex flex-col gap-4">
            {themeModules.map((mod) => {
              const isFree = mod.order === 1;
              return (
                <Link
                  key={mod.slug}
                  href={`/themes/${slug}/${mod.slug}`}
                  className="rounded-xl p-5 flex items-center justify-between transition-colors hover:bg-white/[0.02]"
                  style={{
                    background: theme.palette.surface,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-medium"
                        style={{ color: theme.palette.accent }}
                      >
                        {theme.terminology.module} {mod.order}
                      </span>
                      {isFree && (
                        <span
                          className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: "rgba(0,212,255,0.1)",
                            color: "#00D4FF",
                          }}
                        >
                          Free
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: theme.palette.text }}
                    >
                      {mod.title}
                    </h3>
                    <p
                      className="text-sm mt-1"
                      style={{ color: theme.palette.muted }}
                    >
                      {mod.description}
                    </p>
                  </div>
                  <span style={{ color: theme.palette.muted }}>→</span>
                </Link>
              );
            })}

            {themeModules.length === 0 && (
              <p
                className="text-sm py-8 text-center"
                style={{ color: "var(--tc-muted, #8B92A5)" }}
              >
                Content coming soon. Check back after building the content
                pipeline.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
