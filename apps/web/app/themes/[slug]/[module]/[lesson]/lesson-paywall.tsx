import Link from "next/link";

interface LessonPaywallProps {
  themeSlug: string;
  themeName: string;
  accentColor: string;
}

/**
 * Shown instead of lesson content when a user hasn't purchased
 * the theme and is trying to access Module 2+.
 */
export function LessonPaywall({
  themeSlug,
  themeName,
  accentColor,
}: LessonPaywallProps) {
  return (
    <div
      className="rounded-2xl p-10 text-center my-12"
      style={{
        background: "var(--tc-surface, #0F1320)",
        border: `1px solid ${accentColor}25`,
      }}
    >
      <div className="text-4xl mb-4" style={{ color: accentColor }}>
        &#128274;
      </div>
      <h2
        className="text-xl font-bold mb-3"
        style={{ color: "var(--tc-text, #FFFFFF)" }}
      >
        This lesson requires a purchase
      </h2>
      <p
        className="text-sm mb-6 max-w-md mx-auto leading-relaxed"
        style={{ color: "var(--tc-muted, #8B92A5)" }}
      >
        Module 1 is free for everyone. To continue learning {themeName} beyond
        Module 1, purchase access to unlock all 11 modules and 55 lessons.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center h-[44px] px-6 rounded-full text-sm font-medium transition-all"
          style={{
            border: `1px solid ${accentColor}50`,
            background: `${accentColor}12`,
            color: "#FFFFFF",
          }}
        >
          View Pricing &rarr;
        </Link>
        <Link
          href={`/themes/${themeSlug}`}
          className="inline-flex items-center justify-center h-[44px] px-6 rounded-full text-sm font-medium transition-all"
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
            color: "var(--tc-muted, #8B92A5)",
          }}
        >
          Back to {themeName}
        </Link>
      </div>
    </div>
  );
}
