import Link from "next/link";
import { notFound } from "next/navigation";
import { themes } from "@tensorcraft/themes";
import {
  getModules,
  getModuleLessons,
  isFoundationsModule,
} from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasThemePurchase, getUserProgress } from "@/lib/progress";
import { AmbientBackground } from "@/app/components/ambient-background";
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
    openGraph: {
      images: [
        `/api/og?title=${encodeURIComponent(theme.displayName)}&theme=${slug}&subtitle=${encodeURIComponent(theme.specialization)}`,
      ],
    },
  };
}

export default async function ThemeDetailPage({ params }: Props) {
  const { slug } = await params;
  const theme = themes[slug];
  if (!theme) notFound();

  const themeModules = getModules(slug);

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasPurchased = user ? await hasThemePurchase(user.id, slug) : false;

  // Check if all modules are complete (for capstone banner)
  let isThemeComplete = false;
  if (user && hasPurchased) {
    const progress = await getUserProgress(user.id, slug);
    const completedByModule = new Map<string, number>();
    for (const p of progress) {
      if (p.status === "completed") {
        completedByModule.set(
          p.module_id,
          (completedByModule.get(p.module_id) ?? 0) + 1,
        );
      }
    }
    isThemeComplete = themeModules.every((mod) => {
      const modLessons = getModuleLessons(slug, mod.slug);
      return (completedByModule.get(mod.slug) ?? 0) >= modLessons.length;
    });
  }

  return (
    <main className="min-h-screen px-6 py-20 bg-surface relative overflow-hidden">
      <AmbientBackground />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Capstone banner */}
        {isThemeComplete && (
          <Link
            href={`/themes/${slug}/capstone`}
            className="flex items-center justify-between p-5 mb-8 border-2 brutalist-hover"
            style={{
              borderColor: theme.palette.primary,
              background: theme.palette.surface,
            }}
          >
            <div>
              <span
                className="text-xs font-mono uppercase tracking-widest"
                style={{ color: theme.palette.primary }}
              >
                // Mission Complete
              </span>
              <p
                className="text-sm font-mono font-semibold mt-1"
                style={{ color: theme.palette.text }}
              >
                All {theme.terminology.module.toLowerCase()}s completed — view
                your capstone &rarr;
              </p>
            </div>
            <span style={{ color: theme.palette.primary, fontSize: 24 }}>
              &#x25CE;
            </span>
          </Link>
        )}

        {/* Theme header */}
        <div className="mb-12">
          <Link
            href="/themes"
            className="text-sm mb-4 inline-block text-text-muted hover:text-text-primary transition-colors"
          >
            ← All Themes
          </Link>
          <h1 className="text-4xl font-bold font-mono mb-2 text-text-primary">
            {theme.displayName}
          </h1>
          <p className="text-lg mb-2" style={{ color: theme.palette.primary }}>
            {theme.specialization}
          </p>
          <p className="text-base leading-relaxed max-w-2xl text-text-muted">
            {theme.description}
          </p>
        </div>

        {/* Characters */}
        <div className="mb-12">
          <h2 className="text-sm font-mono uppercase tracking-widest mb-4 text-text-muted">
            Your Crew
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {theme.characters.map((char) => (
              <div
                key={char.name}
                className="p-3 text-center bg-surface-raised border border-border"
              >
                <p className="text-sm font-medium text-text-primary">
                  {char.name}
                </p>
                <p className="text-[11px] text-text-muted">{char.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-sm font-mono uppercase tracking-widest mb-4 text-text-muted">
            {theme.terminology.module}s
          </h2>
          <div className="flex flex-col gap-4">
            {themeModules.map((mod) => {
              const isFree = isFoundationsModule(mod);
              const isLocked = !isFree && !hasPurchased;

              const cardClass = `p-5 flex items-center justify-between transition-colors border border-border bg-surface-raised ${
                isLocked ? "opacity-60 cursor-default" : "brutalist-hover"
              }`;

              const cardContent = (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: isLocked
                            ? theme.palette.muted
                            : theme.palette.primary,
                        }}
                      >
                        {theme.terminology.module} {mod.order}
                      </span>
                      {isFree && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-primary/10 text-primary">
                          Foundations
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 flex items-center gap-1 bg-surface-overlay text-text-muted">
                          &#128274; Locked
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-lg font-semibold font-mono"
                      style={{
                        color: isLocked
                          ? theme.palette.muted
                          : theme.palette.text,
                      }}
                    >
                      {mod.title}
                    </h3>
                    <p className="text-sm mt-1 text-text-muted">
                      {mod.description}
                    </p>
                    {isLocked && (
                      <Link
                        href="/pricing"
                        className="inline-flex text-xs mt-2 underline underline-offset-2 text-primary"
                      >
                        Purchase to unlock
                      </Link>
                    )}
                  </div>
                  {!isLocked && <span className="text-text-muted">→</span>}
                </>
              );

              return isLocked ? (
                <div key={mod.slug} className={cardClass}>
                  {cardContent}
                </div>
              ) : (
                <Link
                  key={mod.slug}
                  href={`/themes/${slug}/${mod.slug}`}
                  className={cardClass}
                >
                  {cardContent}
                </Link>
              );
            })}

            {themeModules.length === 0 && (
              <p className="text-sm py-8 text-center text-text-muted">
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
