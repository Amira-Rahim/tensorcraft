import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { isValidThemeSlug, THEME_SLUGS, isLaunched } from "@tensorcraft/shared";
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
import { CapstoneEmailTag } from "./capstone-email-tag";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

// Only launched themes have a capstone route; everything else 404s at the
// router level (real 404 status, the page body's notFound() would fire
// after the segment's loading.tsx already streamed a 200 shell).
export function generateStaticParams() {
  return THEME_SLUGS.filter((slug) => isLaunched(slug)).map((slug) => ({
    slug,
  }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const theme = themes[slug];
  // notFound() here so the response carries a real 404 status for unknown
  // and coming-soon themes, the page body's notFound() fires after the
  // segment's loading.tsx has streamed a 200 shell (soft-404 otherwise).
  if (!isLaunched(slug) || !theme) notFound();
  return {
    title: `Mission Complete: ${theme.displayName} | Tensorcraft`,
    description: `You've completed every module of ${theme.displayName}. View your certificate and stats.`,
    alternates: {
      canonical: `https://tensorcraft.app/themes/${slug}/capstone`,
    },
    openGraph: {
      images: [
        `/api/og?title=${encodeURIComponent("Mission Complete")}&theme=${slug}&subtitle=${encodeURIComponent(theme.displayName)}`,
      ],
    },
  };
}

export default async function CapstonePage({ params }: Props) {
  const { slug } = await params;
  if (!isLaunched(slug)) notFound();
  const theme = themes[slug];
  if (!theme) notFound();

  // Auth guard
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Content
  const modules = getModules(slug);
  const allLessons = getThemeLessons(slug);
  const bridges = getLessonsWithBridges(slug);

  // Progress
  const progress = await getUserProgress(user.id, slug);
  const completedLessons = progress.filter((p) => p.status === "completed");

  // Group completed lessons by module + latest completion per module
  const completedByModule = new Map<string, number>();
  const lastCompletedAtByModule = new Map<string, string>();
  for (const p of completedLessons) {
    completedByModule.set(
      p.module_id,
      (completedByModule.get(p.module_id) ?? 0) + 1,
    );
    if (p.completed_at) {
      const prev = lastCompletedAtByModule.get(p.module_id);
      if (!prev || p.completed_at > prev) {
        lastCompletedAtByModule.set(p.module_id, p.completed_at);
      }
    }
  }

  // Gate: theme must be fully complete to view the capstone
  const completedModuleCount = modules.filter((mod) => {
    const modLessons = getModuleLessons(slug, mod.slug);
    return (
      modLessons.length > 0 &&
      (completedByModule.get(mod.slug) ?? 0) >= modLessons.length
    );
  }).length;

  const isThemeComplete = completedModuleCount === modules.length;
  if (!isThemeComplete) redirect(`/themes/${slug}`);

  // Parallel: profile, certificate, exercise attempts, purchases
  const [
    { data: profile },
    { data: certRow },
    { data: exerciseAttemptRows },
    { data: purchaseRows },
  ] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase
      .from("certificates")
      .select("id, issued_at, cert_hash, pdf_url")
      .eq("user_id", user.id)
      .eq("theme_id", slug)
      .maybeSingle(),
    supabase
      .from("exercise_attempts")
      .select("passed, hints_used")
      .eq("user_id", user.id)
      .eq("theme_id", slug)
      .limit(1000),
    supabase
      .from("purchases")
      .select("theme_ids")
      .eq("user_id", user.id)
      .in("status", ["completed", "partially_refunded"]),
  ]);

  const attempts = exerciseAttemptRows ?? [];
  const exercisesPassed = attempts.filter((a) => a.passed).length;
  const hintsUsed = attempts.reduce((sum, a) => sum + (a.hints_used ?? 0), 0);

  // Bridges explored, bridges that belong to lessons the user completed.
  const completedLessonSlugs = new Set(
    completedLessons.map((p) => p.lesson_id),
  );
  const bridgesExplored = bridges.filter((b) =>
    completedLessonSlugs.has(b.lessonSlug),
  ).length;

  // Average score (used in certificate footer)
  const scores = completedLessons
    .filter((p) => p.score != null)
    .map((p) => p.score as number);
  const avgScore =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : null;

  // Derive owned themes for the "next theme" teaser.
  const ownedThemes = new Set<string>();
  for (const row of purchaseRows ?? []) {
    if (!Array.isArray(row.theme_ids)) continue;
    for (const t of row.theme_ids) {
      if (isValidThemeSlug(t)) ownedThemes.add(t);
    }
  }

  // Next theme: first **launched** theme (in canonical order) the user has not
  // purchased and is not the current one. Coming-soon themes intentionally
  // excluded, V1 ships Deep Orbit only, so the teaser will be empty until
  // a second theme launches. The "ownsAll" flag mirrors the same scope so
  // the placeholder fires once the user owns every launched theme.
  const launchedSlugs = THEME_SLUGS.filter((t) => isLaunched(t));
  const nextThemeSlug = launchedSlugs.find(
    (t) => t !== slug && !ownedThemes.has(t),
  );
  const nextTheme = nextThemeSlug ? themes[nextThemeSlug] : null;
  const ownsAll = launchedSlugs.every((t) => ownedThemes.has(t));

  const displayName = profile?.display_name ?? "Engineer";
  // Light-mode migration (Task 7): P used to alias theme.palette (dark-only
  // hexes), which rendered dark regardless of data-scheme. Every P.x site
  // below (and every color prop threaded into CapstoneClient.*) now resolves
  // through the CSS cascade instead, so the cert card, nav and timeline all
  // follow the active scheme with no JS branching.
  const P = {
    bg: "var(--tc-bg)",
    primary: "var(--tc-primary)",
    accent: "var(--tc-accent)",
    surface: "var(--tc-surface)",
    surfaceOverlay: "var(--tc-surface-overlay)",
    text: "var(--tc-text)",
    muted: "var(--tc-muted)",
    border: "var(--tc-border)",
    codeBg: "var(--tc-code-bg)",
  };

  // Timeline data, numbered nodes with titles, completion dates, and
  // per-module bridge titles pulled from content.
  const bridgesByModule = new Map<string, Array<{ fe: string; ml: string }>>();
  for (const b of bridges) {
    const existing = bridgesByModule.get(b.moduleSlug) ?? [];
    existing.push({ fe: b.feTitle, ml: b.mlTitle });
    bridgesByModule.set(b.moduleSlug, existing);
  }

  const journey = modules.map((mod, i) => {
    const rawDate = lastCompletedAtByModule.get(mod.slug);
    const formatted = rawDate
      ? new Date(rawDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : null;
    const modBridges = bridgesByModule.get(mod.slug) ?? [];
    const keyBridge = modBridges[0] ?? null;
    return {
      id: `M${String(i + 1).padStart(2, "0")}`,
      name: mod.title.replace(/^Capstone:\s*/, ""),
      slug: mod.slug,
      completedOn: formatted,
      keyBridgeFe: keyBridge?.fe ?? null,
      keyBridgeMl: keyBridge?.ml ?? null,
    };
  });

  // Certificate initial state (server). The client component will POST
  // `/api/certificates` on mount if no row exists yet.
  const initialCertificate = certRow
    ? {
        id: certRow.id as string,
        issued_at: certRow.issued_at as string,
        cert_hash: certRow.cert_hash as string,
        pdf_url: (certRow.pdf_url as string | null) ?? null,
      }
    : null;

  // Stats cards, 4-card brutalist grid.
  const statsCards = [
    {
      value: `${completedLessons.length} / ${allLessons.length}`,
      label: "Lessons Completed",
    },
    {
      value: String(bridgesExplored),
      label: "Bridges Explored",
    },
    {
      value: String(hintsUsed),
      label: "Hints Used",
    },
    {
      value: String(exercisesPassed),
      label: "Exercises Passed",
    },
  ];

  // Certificate card stats (internal to the cert).
  const certificateStats = [
    {
      value: String(completedLessons.length),
      label: `${theme.terminology.lesson}s Completed`,
    },
    {
      value: String(bridgesExplored),
      label: "FE Bridges Mastered",
    },
    ...(avgScore ? [{ value: avgScore, label: "Average Score" }] : []),
  ];

  return (
    <main
      style={{
        background: P.bg,
        // 100svh sits on the smallest viewport (URL bar shown), prevents
        // iOS Safari reflow when the address bar collapses on scroll.
        minHeight: "100svh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @media print {
          nav, footer, .ambient-bg, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-certificate {
            border: 2px solid #333 !important;
            background: white !important;
            color: black !important;
            padding: 48px !important;
            box-shadow: none !important;
          }
          .print-certificate * { color: black !important; }
          .print-certificate .cert-accent { color: #6BAA8A !important; }
          @page { size: landscape; margin: 1cm; }
        }
      `}</style>
      <AmbientBackground count={260} />
      <CapstoneEmailTag themeSlug={slug} />

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
          className="flex items-center gap-2 font-mono text-sm font-medium tracking-wider rounded-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          style={{ color: P.text }}
        >
          <span
            className="px-1.5 py-0.5 text-xs font-bold"
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
        className="relative z-[1] text-center no-print"
        style={{
          padding: "80px 32px 60px",
          borderBottom: `1px solid ${P.border}`,
        }}
      >
        <div
          className="font-mono leading-none mb-5"
          style={{ fontSize: 64, color: P.primary }}
          aria-hidden="true"
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
          MISSION COMPLETE &middot; {theme.displayName.toUpperCase()}
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
            maxWidth: 520,
          }}
        >
          You&apos;ve completed every module of {theme.displayName}. You built
          the {theme.modelBuilt.split(/\u2014|\u2013|:|;|\s-\s/)[0].trim()}. You
          explored {bridgesExplored} frontend bridges to ML.
        </p>
        {/* Share the PUBLIC certificate page (or the public theme page
            pre-claim), never this auth-gated capstone URL. */}
        <CapstoneClient.ShareButton
          border={P.border}
          text={P.text}
          themeSlug={slug}
          shareUrl={
            initialCertificate
              ? `https://tensorcraft.app/certificates/${initialCertificate.id}`
              : `https://tensorcraft.app/themes/${slug}`
          }
        />
      </div>

      {/* Stats, 4-card brutalist grid */}
      <div
        className="relative z-[1] no-print"
        style={{ borderBottom: `1px solid ${P.border}` }}
        data-testid="capstone-stats"
      >
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4">
          {statsCards.map((s, i) => (
            <div
              key={s.label}
              className="text-center"
              data-testid={`stat-card-${i}`}
              style={{
                padding: "40px 32px",
                borderRight: i < 3 ? `1px solid ${P.border}` : "none",
              }}
            >
              <div
                className="font-mono font-bold mb-2"
                style={{ fontSize: 28, color: P.primary }}
              >
                {s.value}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: P.muted,
                  letterSpacing: "0.1em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Journey timeline, brutalist numbered boxes with connectors */}
      <div
        className="relative z-[1] max-w-[980px] mx-auto"
        style={{ padding: "56px 32px 40px" }}
      >
        <div
          className="font-mono mb-2 no-print"
          style={{
            fontSize: 9,
            color: P.muted,
            letterSpacing: "0.15em",
          }}
        >
          MISSION RECORD
        </div>
        <h2
          className="font-mono font-bold mb-10 no-print"
          style={{
            fontSize: 22,
            color: P.text,
            letterSpacing: "-0.01em",
          }}
        >
          All {modules.length} Modules Completed
        </h2>

        {/* Timeline (horizontal for desktop; wraps naturally) */}
        <ol
          className="flex flex-wrap gap-y-6 no-print"
          data-testid="capstone-timeline"
        >
          {journey.map((m, i) => (
            <li
              key={m.id}
              data-testid={`timeline-node-${i}`}
              className="relative flex flex-col items-stretch"
              style={{ flex: "1 1 160px", minWidth: 160 }}
            >
              {/* Node box */}
              <div
                className="rounded-none flex items-center justify-between"
                style={{
                  border: `2px solid ${P.primary}`,
                  background: P.surface,
                  padding: "14px 14px",
                  height: 48,
                }}
              >
                <span
                  className="font-mono font-bold"
                  style={{ fontSize: 11, color: P.primary }}
                >
                  {m.id}
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ fontSize: 12, color: P.primary }}
                  aria-label="completed"
                >
                  &#10003;
                </span>
              </div>

              {/* Connector line */}
              {i < journey.length - 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 23,
                    right: -10,
                    width: 10,
                    height: 2,
                    background: P.primary,
                  }}
                />
              )}

              {/* Title */}
              <div
                className="font-mono mt-2"
                style={{
                  fontSize: 11,
                  color: P.text,
                  lineHeight: 1.4,
                  paddingRight: 8,
                }}
              >
                {m.name}
              </div>
              {/* Completion date */}
              <div
                className="font-mono mt-1"
                style={{
                  fontSize: 9,
                  color: P.muted,
                  letterSpacing: "0.05em",
                }}
              >
                {m.completedOn ? `Completed ${m.completedOn}` : "Completed"}
              </div>
              {/* Key bridge */}
              {m.keyBridgeFe && m.keyBridgeMl && (
                <div
                  className="font-mono mt-1"
                  style={{
                    fontSize: 9,
                    color: P.primary,
                    letterSpacing: "0.03em",
                  }}
                >
                  {m.keyBridgeFe} &rarr; {m.keyBridgeMl}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Certificate card + teaser */}
      <div
        className="relative z-[1] max-w-[980px] mx-auto"
        style={{ padding: "24px 32px 80px" }}
      >
        <CapstoneClient.CertificateCard
          themeSlug={slug}
          themeDisplayName={theme.displayName}
          themeSpecialization={theme.specialization}
          displayName={displayName}
          initialCertificate={initialCertificate}
          primary={P.primary}
          text={P.text}
          muted={P.muted}
          surface={P.surface}
          bg={P.bg}
          stats={certificateStats}
        />

        {/* Next theme teaser */}
        {nextTheme ? (
          <Link
            href={`/themes/${nextTheme.slug}`}
            data-testid="next-theme-teaser"
            className="flex items-center gap-6 mt-8 no-print rounded-none brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
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
                NEXT MISSION
              </div>
              <div
                className="font-mono font-bold mb-1"
                style={{ fontSize: 14, color: P.text }}
              >
                {nextTheme.displayName}: {nextTheme.specialization}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: P.muted,
                }}
              >
                {nextTheme.description.slice(0, 140)}
                {nextTheme.description.length > 140 ? "..." : ""}
              </div>
            </div>
            <div
              className="font-mono flex-shrink-0 rounded-none"
              style={{
                fontSize: 10,
                color: P.muted,
                border: `1px solid ${P.border}`,
                padding: "6px 14px",
              }}
            >
              Explore &rarr;
            </div>
          </Link>
        ) : ownsAll ? (
          <div
            data-testid="next-theme-placeholder"
            className="mt-8 no-print rounded-none"
            style={{
              border: `2px dashed ${P.border}`,
              background: P.surface,
              padding: "28px 32px",
            }}
          >
            <div
              className="font-mono mb-2"
              style={{
                fontSize: 9,
                color: P.muted,
                letterSpacing: "0.1em",
              }}
            >
              NEXT MISSION
            </div>
            <div
              className="font-mono font-bold mb-1"
              style={{ fontSize: 14, color: P.text }}
            >
              V1.0 coming
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: P.muted,
              }}
            >
              You&apos;ve completed every mission in every theme. New V1.0
              content lands on the roadmap; watch your inbox.
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
