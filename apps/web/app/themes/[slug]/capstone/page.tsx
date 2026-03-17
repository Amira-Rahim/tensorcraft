import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import {
  getModules,
  getModuleLessons,
  getThemeLessons,
  getLessonsWithBridges,
} from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUserProgress } from "@/lib/progress";
import { AmbientBackground } from "@/app/components/ambient-background";
import { CapstoneClient } from "./capstone-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const theme = themes[slug];
  if (!theme) return {};
  return {
    title: `Mission Complete — ${theme.displayName} | Tensorcraft`,
    description: `You've completed every module of ${theme.displayName}. View your certificate and stats.`,
    openGraph: {
      images: [
        `/api/og?title=${encodeURIComponent("Mission Complete")}&theme=${slug}&subtitle=${encodeURIComponent(theme.displayName)}`,
      ],
    },
  };
}

export default async function CapstonePage({ params }: Props) {
  const { slug } = await params;
  const theme = themes[slug];
  if (!theme) notFound();

  // Auth guard
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  // Fetch all data
  const modules = getModules(slug);
  const allLessons = getThemeLessons(slug);
  const bridges = getLessonsWithBridges(slug);
  const progress = await getUserProgress(user.id, slug);
  const completedLessons = progress.filter((p) => p.status === "completed");

  // Group completed lessons by module
  const completedByModule = new Map<string, number>();
  for (const p of completedLessons) {
    completedByModule.set(
      p.module_id,
      (completedByModule.get(p.module_id) ?? 0) + 1,
    );
  }

  // Check if theme is fully complete
  const completedModuleCount = modules.filter((mod) => {
    const modLessons = getModuleLessons(slug, mod.slug);
    return (completedByModule.get(mod.slug) ?? 0) >= modLessons.length;
  }).length;

  const isThemeComplete = completedModuleCount === modules.length;
  if (!isThemeComplete) redirect(`/themes/${slug}`);

  // Fetch user profile for name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // Compute stats
  const completedLessonSlugs = new Set(
    completedLessons.map((p) => p.lesson_id),
  );
  const bridgesMastered = bridges.filter((b) =>
    completedLessonSlugs.has(b.lessonSlug),
  ).length;

  const scores = completedLessons
    .filter((p) => p.score != null)
    .map((p) => p.score as number);
  const avgScore =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : null;

  // Time invested — sum estimated minutes from content for completed lessons
  const lessonMinutesMap = new Map(
    allLessons.map((l) => [l.slug, l.estimatedMinutes]),
  );
  const totalMinutes = completedLessons.reduce(
    (sum, p) => sum + (lessonMinutesMap.get(p.lesson_id) ?? 0),
    0,
  );
  const totalHours = Math.round(totalMinutes / 60);

  // Completion date — latest completed_at
  const completionDate = completedLessons.reduce((latest, p) => {
    if (!p.completed_at) return latest;
    return !latest || p.completed_at > latest ? p.completed_at : latest;
  }, "" as string);

  const formattedDate = completionDate
    ? new Date(completionDate).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "2026";

  // Next theme teaser — find a launched theme that isn't the current one
  const otherThemes = Object.values(themes).filter(
    (t) => t.slug !== slug && t.status === "launched",
  );
  const nextTheme = otherThemes[0] ?? null;

  // Coming soon themes
  const comingSoonThemes = Object.values(themes).filter(
    (t) => t.status === "coming-soon",
  );
  const teaserTheme = nextTheme ?? comingSoonThemes[0] ?? null;

  const displayName = profile?.display_name ?? "Engineer";
  const P = theme.palette;

  // Journey data for client component
  const journey = modules.map((mod, i) => ({
    id: `M${String(i + 1).padStart(2, "0")}`,
    name: mod.title.replace(/^Capstone:\s*/, ""),
    slug: mod.slug,
  }));

  return (
    <main
      style={{
        background: P.bg,
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <AmbientBackground count={260} />

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8"
        style={{
          height: 60,
          background: P.bg,
          borderBottom: `1px solid ${P.border}`,
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-medium tracking-wider"
          style={{ color: P.text }}
        >
          <span
            className="px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: P.primary, color: P.bg }}
          >
            T_
          </span>
          TENSORCRAFT
        </Link>
        <CapstoneClient.DashboardButton primary={P.primary} bg={P.bg} />
      </nav>

      {/* Hero */}
      <div
        className="relative z-[1] text-center"
        style={{
          padding: "80px 32px 60px",
          borderBottom: `1px solid ${P.border}`,
        }}
      >
        <div
          className="font-mono leading-none mb-5"
          style={{ fontSize: 64, color: P.primary }}
        >
          &#x25CE;
        </div>
        <div
          className="font-mono mb-3.5"
          style={{
            fontSize: 9,
            color: P.primary,
            letterSpacing: "0.2em",
          }}
        >
          // MISSION COMPLETE &middot; {theme.displayName.toUpperCase()}
        </div>
        <h1
          className="font-mono font-bold mb-4"
          style={{
            fontSize: 44,
            color: P.text,
            letterSpacing: "-0.02em",
          }}
        >
          All Systems Mapped
        </h1>
        <p
          className="mx-auto mb-10"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            color: P.muted,
            lineHeight: 1.7,
            maxWidth: 500,
          }}
        >
          You&apos;ve completed every module of {theme.displayName}. You built
          the {theme.modelBuilt.split("—")[0].trim()}. You mastered{" "}
          {bridgesMastered} frontend bridges to ML.
        </p>
        <CapstoneClient.ShareButton border={P.border} text={P.text} />
      </div>

      {/* Stats */}
      <div
        className="relative z-[1]"
        style={{ borderBottom: `1px solid ${P.border}` }}
      >
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            [
              `${completedModuleCount} / ${modules.length}`,
              `${theme.terminology.module}s`,
            ],
            [
              `${completedLessons.length} / ${allLessons.length}`,
              `${theme.terminology.lesson}s`,
            ],
            [String(bridgesMastered), "Bridges Mastered"],
            [`${totalHours} h`, "Time Invested"],
          ].map(([val, label], i) => (
            <div
              key={label}
              className="text-center"
              style={{
                padding: "40px 32px",
                borderRight: i < 3 ? `1px solid ${P.border}` : "none",
              }}
            >
              <div
                className="font-mono font-bold mb-2"
                style={{ fontSize: 28, color: P.primary }}
              >
                {val}
              </div>
              <div
                className="font-mono"
                style={{ fontSize: 10, color: P.muted }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Journey timeline */}
      <div
        className="relative z-[1] max-w-[900px] mx-auto"
        style={{ padding: "56px 32px 80px" }}
      >
        <div
          className="font-mono mb-2"
          style={{
            fontSize: 9,
            color: P.muted,
            letterSpacing: "0.15em",
          }}
        >
          // YOUR JOURNEY
        </div>
        <h2
          className="font-mono font-bold mb-10"
          style={{
            fontSize: 22,
            color: P.text,
            letterSpacing: "-0.01em",
          }}
        >
          All Systems Mapped
        </h2>

        {/* Timeline row */}
        <div className="flex mb-14 overflow-x-auto">
          {journey.map((m, i) => (
            <div
              key={m.id}
              className="flex flex-col items-center relative"
              style={{ flex: 1, minWidth: 70 }}
            >
              <div
                className="flex items-center justify-center mb-1"
                style={{
                  width: 28,
                  height: 28,
                  background: P.primary,
                  border: `2px solid ${P.primary}`,
                }}
              >
                <span
                  className="font-mono font-bold"
                  style={{ fontSize: 10, color: P.bg }}
                >
                  &#10003;
                </span>
              </div>
              {i < journey.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    height: 2,
                    background: P.primary,
                    top: 13,
                    left: "calc(50% + 14px)",
                    right: "calc(-50% + 14px)",
                  }}
                />
              )}
              <span
                className="font-mono"
                style={{ fontSize: 9, color: P.primary }}
              >
                {m.id}
              </span>
              <span
                className="font-mono text-center mt-1"
                style={{
                  fontSize: 9,
                  color: P.muted,
                  lineHeight: 1.3,
                }}
              >
                {m.name}
              </span>
            </div>
          ))}
        </div>

        {/* Certificate card */}
        <div
          className="relative overflow-hidden"
          style={{
            border: `2px solid ${P.primary}`,
            background: P.surface,
            padding: "40px 48px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              background: `${P.primary}0A`,
              borderRadius: "50%",
            }}
          />
          <div
            className="font-mono mb-5"
            style={{
              fontSize: 9,
              color: P.primary,
              letterSpacing: "0.15em",
            }}
          >
            // CERTIFICATE OF COMPLETION
          </div>
          <div
            className="font-mono font-bold mb-1.5"
            style={{ fontSize: 20, color: P.text }}
          >
            {theme.displayName} &mdash; {theme.specialization}
          </div>
          <div
            className="font-mono mb-6"
            style={{ fontSize: 12, color: P.muted }}
          >
            Issued to: {displayName} &middot; {formattedDate} &middot;
            Tensorcraft
          </div>
          <div className="flex gap-8">
            {[
              [
                String(completedLessons.length),
                `${theme.terminology.lesson}s Completed`,
              ],
              [String(bridgesMastered), "FE Bridges Mastered"],
              ...(avgScore ? [[avgScore, "Average Score"]] : []),
            ].map(([v, l]) => (
              <div key={l}>
                <div
                  className="font-mono font-bold"
                  style={{ fontSize: 18, color: P.primary }}
                >
                  {v}
                </div>
                <div
                  className="font-mono mt-0.5"
                  style={{ fontSize: 9, color: P.muted }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next theme teaser */}
        {teaserTheme && (
          <Link
            href={
              teaserTheme.status === "launched"
                ? `/themes/${teaserTheme.slug}`
                : "/themes"
            }
            className="flex items-center gap-6 mt-8"
            style={{
              border: `2px solid ${P.border}`,
              background: P.surface,
              padding: "28px 32px",
            }}
          >
            <div className="flex-1">
              <div
                className="font-mono mb-2"
                style={{
                  fontSize: 9,
                  color: P.muted,
                  letterSpacing: "0.1em",
                }}
              >
                // NEXT MISSION
              </div>
              <div
                className="font-mono font-bold mb-1"
                style={{ fontSize: 14, color: P.text }}
              >
                {teaserTheme.displayName} &mdash; {teaserTheme.specialization}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: P.muted,
                }}
              >
                {teaserTheme.description.slice(0, 120)}
                {teaserTheme.description.length > 120 ? "..." : ""}
              </div>
            </div>
            <div
              className="font-mono flex-shrink-0"
              style={{
                fontSize: 10,
                color: P.muted,
                border: `1px solid ${P.border}`,
                padding: "6px 14px",
              }}
            >
              {teaserTheme.status === "launched" ? "Explore →" : "Coming Soon"}
            </div>
          </Link>
        )}
      </div>
    </main>
  );
}
