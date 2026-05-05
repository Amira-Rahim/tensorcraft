import Link from "next/link";

const MONO = "var(--font-mono), 'JetBrains Mono', monospace";

export interface ThemeCardData {
  slug: string;
  displayName: string;
  tagline: string;
  specialization: string;
  primary: string;
  owned: boolean;
  isActive: boolean;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  /** When true, render as "Coming soon" — link routes to the per-theme stub. */
  comingSoon: boolean;
}

export interface ThemeCardsProps {
  cards: ThemeCardData[];
  hasFullBundle: boolean;
}

/**
 * Theme grid shown on the dashboard. One card per theme, rendered in the same
 * order the themes object exposes them. Owned themes link into the theme
 * landing page; locked themes link to pricing with the locked theme
 * pre-selected so the paywall flow has context.
 */
export function ThemeCards({ cards, hasFullBundle }: ThemeCardsProps) {
  return (
    <section
      aria-labelledby="dashboard-themes-heading"
      style={{ borderTop: "1px solid var(--tc-border)" }}
    >
      <div
        style={{
          padding: "20px 40px",
          borderBottom: "1px solid var(--tc-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <h2
          id="dashboard-themes-heading"
          style={{
            fontFamily: MONO,
            fontSize: 12,
            fontWeight: 700,
            color: "var(--tc-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Your Themes
        </h2>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 12,
            color: "var(--tc-muted)",
          }}
        >
          {(() => {
            const launched = cards.filter((c) => !c.comingSoon);
            const ownedLaunched = launched.filter((c) => c.owned).length;
            return hasFullBundle
              ? "All available themes unlocked"
              : `${ownedLaunched} of ${launched.length} unlocked · ${cards.filter((c) => c.comingSoon).length} coming soon`;
          })()}
        </span>
      </div>

      <ul
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 0,
          padding: 0,
          margin: 0,
          listStyle: "none",
        }}
      >
        {cards.map((card, i) => (
          <li
            key={card.slug}
            style={{
              borderRight:
                (i + 1) % 5 === 0 ? "none" : "1px solid var(--tc-border)",
              borderBottom: "1px solid var(--tc-border)",
            }}
          >
            <ThemeCard card={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ThemeCard({ card }: { card: ThemeCardData }) {
  const href = card.comingSoon
    ? `/themes/${card.slug}`
    : card.owned
      ? `/themes/${card.slug}`
      : `/pricing?locked=${card.slug}`;

  const label = card.comingSoon
    ? `${card.displayName} coming soon, join waitlist`
    : card.owned
      ? `${card.displayName}, ${card.progressPercent}% complete, open theme`
      : `${card.displayName} locked, view pricing`;

  return (
    <Link
      href={href}
      aria-label={label}
      className="tc-theme-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "24px 28px",
        minHeight: 176,
        textDecoration: "none",
        color: "inherit",
        background: card.isActive
          ? "color-mix(in srgb, var(--tc-primary) 3%, transparent)"
          : "transparent",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: 700,
              color: card.owned ? card.primary : "var(--tc-muted)",
              letterSpacing: "0.08em",
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            {card.specialization}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: card.owned ? "var(--tc-text)" : "var(--tc-muted)",
              letterSpacing: "-0.01em",
            }}
          >
            {card.displayName}
          </div>
        </div>
        <LockBadge
          owned={card.owned}
          active={card.isActive}
          comingSoon={card.comingSoon}
          primary={card.primary}
        />
      </div>

      <p
        style={{
          fontFamily: MONO,
          fontSize: 12,
          color: "var(--tc-muted)",
          lineHeight: 1.5,
          margin: 0,
          minHeight: 36,
        }}
      >
        {card.tagline}
      </p>

      <div style={{ marginTop: "auto" }}>
        {card.comingSoon ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: MONO,
              fontSize: 12,
              color: "var(--tc-muted)",
            }}
          >
            <span>Waitlist open</span>
            <span
              style={{
                color: card.primary,
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              Notify me &rarr;
            </span>
          </div>
        ) : card.owned ? (
          <>
            <div
              role="progressbar"
              aria-valuenow={card.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${card.displayName} progress`}
              style={{
                height: 4,
                background: "var(--tc-border)",
                marginBottom: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${card.progressPercent}%`,
                  background: card.primary,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: MONO,
                fontSize: 12,
                color: "var(--tc-muted)",
              }}
            >
              <span>
                {card.completedLessons} / {card.totalLessons} lessons
              </span>
              <span
                style={{ color: card.primary, fontWeight: 700 }}
              >{`${card.progressPercent}%`}</span>
            </div>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: MONO,
              fontSize: 12,
              color: "var(--tc-muted)",
            }}
          >
            <span>{card.totalLessons} lessons locked</span>
            <span
              style={{
                color: "var(--tc-text)",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              Unlock &rarr;
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function LockBadge({
  owned,
  active,
  comingSoon,
  primary,
}: {
  owned: boolean;
  active: boolean;
  comingSoon: boolean;
  primary: string;
}) {
  if (comingSoon) {
    return (
      <span
        style={{
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 700,
          color: primary,
          border: `1px solid ${primary}`,
          padding: "2px 8px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        Coming soon
      </span>
    );
  }
  if (active) {
    return (
      <span
        style={{
          fontFamily: MONO,
          fontSize: 12,
          fontWeight: 700,
          color: "var(--tc-primary)",
          border: "1px solid var(--tc-primary)",
          padding: "2px 8px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        Active
      </span>
    );
  }
  if (owned) {
    return (
      <span
        style={{
          fontFamily: MONO,
          fontSize: 12,
          fontWeight: 700,
          color: "var(--tc-muted)",
          border: "1px solid var(--tc-border)",
          padding: "2px 8px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        Owned
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        fontFamily: MONO,
        fontSize: 12,
        fontWeight: 700,
        color: "var(--tc-muted)",
        border: "1px dashed var(--tc-border)",
        padding: "2px 8px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      Locked
    </span>
  );
}
