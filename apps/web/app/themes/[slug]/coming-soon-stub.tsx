import Link from "next/link";
import type { ThemeManifest } from "@tensorcraft/themes";
import { PRICING } from "@tensorcraft/shared";
import { AmbientBackground } from "@/app/components/ambient-background";
import { ThemeWaitlistForm } from "./theme-waitlist-form";

interface Props {
  theme: ThemeManifest;
}

/**
 * Coming-soon stub for unlaunched themes. Server-rendered with theme palette,
 * narrative metadata, and an inline waitlist capture. JSON-LD ships
 * `availability: PreOrder` so search engines surface the right rich snippet.
 */
export function ComingSoonStub({ theme }: Props) {
  const slug = theme.slug;

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${theme.displayName} — ${theme.specialization}`,
    description: theme.description,
    provider: {
      "@type": "Organization",
      name: "Tensorcraft",
      url: "https://tensorcraft.app",
    },
    url: `https://tensorcraft.app/themes/${slug}`,
    educationalLevel: "Intermediate",
    programmingLanguage: ["JavaScript", "TypeScript"],
    teaches: theme.specialization,
    offers: {
      "@type": "Offer",
      price: String(PRICING.single.price),
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      url: `https://tensorcraft.app/themes/${slug}`,
    },
  };

  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{ background: theme.palette.bg }}
      data-testid={`coming-soon-stub-${slug}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <AmbientBackground count={120} />

      <header
        className="relative z-10 px-12 pt-16 pb-10"
        style={{
          borderBottom: `1px solid ${theme.palette.border}`,
          background: `color-mix(in srgb, ${theme.palette.bg} 70%, transparent)`,
        }}
      >
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="font-mono text-xs uppercase tracking-[0.2em] px-3 py-1 border-2"
              style={{
                color: theme.palette.accent,
                borderColor: theme.palette.accent,
                background: `color-mix(in srgb, ${theme.palette.accent} 10%, transparent)`,
              }}
            >
              Coming soon
            </span>
            <span
              className="font-mono text-xs uppercase tracking-[0.15em]"
              style={{ color: theme.palette.muted }}
            >
              // {theme.specialization}
            </span>
          </div>

          <h1
            className="font-mono text-5xl font-bold mb-4 leading-tight"
            style={{ color: theme.palette.text, letterSpacing: "-0.02em" }}
          >
            {theme.displayName}
          </h1>
          <p
            className="text-xl leading-relaxed mb-2"
            style={{ color: theme.palette.text }}
          >
            {theme.tagline}
          </p>
          <p
            className="text-base leading-relaxed max-w-[640px]"
            style={{ color: theme.palette.muted }}
          >
            {theme.description}
          </p>
        </div>
      </header>

      <section className="relative z-10 max-w-[900px] mx-auto px-12 py-12 grid gap-12 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2
            className="font-mono text-xs uppercase tracking-[0.2em] mb-4"
            style={{ color: theme.palette.primary }}
          >
            // What you&rsquo;ll build
          </h2>
          <p
            className="text-lg leading-relaxed mb-8"
            style={{ color: theme.palette.text }}
          >
            {theme.modelBuilt}
          </p>

          <h2
            className="font-mono text-xs uppercase tracking-[0.2em] mb-4"
            style={{ color: theme.palette.primary }}
          >
            // Cast
          </h2>
          <ul className="space-y-3">
            {theme.characters.map((c) => (
              <li
                key={c.name}
                className="border-2 p-4 rounded-none"
                style={{
                  borderColor: theme.palette.border,
                  background: theme.palette.surface,
                }}
              >
                <div
                  className="font-mono text-sm font-bold"
                  style={{ color: theme.palette.text }}
                >
                  {c.name}
                </div>
                <div
                  className="font-mono text-xs mt-0.5"
                  style={{ color: theme.palette.muted }}
                >
                  {c.role}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside>
          <div
            className="border-2 p-6 rounded-none"
            style={{
              borderColor: theme.palette.primary,
              background: theme.palette.surface,
            }}
          >
            <ThemeWaitlistForm
              themeSlug={slug}
              themeName={theme.displayName}
              palette={theme.palette}
            />
          </div>

          <Link
            href="/themes/deep-orbit"
            className="block mt-6 font-mono text-sm underline"
            style={{ color: theme.palette.primary }}
          >
            Or start with Deep Orbit (live now) &rarr;
          </Link>
        </aside>
      </section>
    </main>
  );
}
