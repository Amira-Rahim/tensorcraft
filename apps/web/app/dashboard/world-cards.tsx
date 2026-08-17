import Link from "next/link";
import { NotifyMeButton } from "./notify-me-button";

const MONO = "var(--font-mono), 'JetBrains Mono', monospace";

export interface WorldCardData {
  slug: string;
  displayName: string;
  tagline: string;
  specialization: string;
  primary: string;
  /** Light-scheme primary (world.paletteLight.primary). Falls back to `primary` when absent. */
  primaryLight?: string;
  owned: boolean;
  isActive: boolean;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  /**
   * When true, render as an inert "Coming soon" card: no link, not-allowed
   * cursor (matches worlds/world-cards-grid.tsx and the landing strip).
   * The Notify me CTA opens the shared newsletter modal.
   */
  comingSoon: boolean;
}

export interface WorldCardsProps {
  cards: WorldCardData[];
  hasFullBundle: boolean;
}

/**
 * World grid shown on the dashboard. One card per world, rendered in the same
 * order the worlds object exposes them. Owned worlds link into the world
 * landing page; locked worlds link to pricing with the locked world
 * pre-selected so the paywall flow has context; coming-soon worlds render
 * inert until launch.
 */
export function WorldCards({ cards, hasFullBundle }: WorldCardsProps) {
  return (
    <section
      aria-labelledby="dashboard-worlds-heading"
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
          id="dashboard-worlds-heading"
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
          Your Worlds
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
              ? "You own all available worlds"
              : `${ownedLaunched} of ${launched.length} owned · ${cards.filter((c) => c.comingSoon).length} coming soon`;
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
            <WorldCard card={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function WorldCard({ card }: { card: WorldCardData }) {
  const shellStyle = {
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
    // Server component: no useScheme() hook available here, so both
    // schemes' hues ride along as local custom props and a CSS rule
    // (`.tc-world-card` / `[data-scheme="light"] .tc-world-card` in
    // globals.css) picks between them into --card-active-primary,
    // which every `card.primary`-driven style below reads instead.
    // worlds/world-cards-grid.tsx rides the same CSS mechanism.
    "--card-primary": card.primary,
    "--card-primary-light": card.primaryLight ?? card.primary,
  } as React.CSSProperties;

  const body = (
    <>
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
              color: card.owned
                ? "var(--card-active-primary)"
                : "var(--tc-muted)",
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
          primary="var(--card-active-primary)"
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
            <span>Updates by email</span>
            <NotifyMeButton
              style={{
                fontFamily: MONO,
                fontSize: 12,
                color: "var(--card-active-primary)",
                fontWeight: 700,
                letterSpacing: "0.05em",
                background: "none",
                border: "none",
                padding: 0,
              }}
            >
              Notify me &rarr;
            </NotifyMeButton>
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
                  background: "var(--card-active-primary)",
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
                style={{ color: "var(--card-active-primary)", fontWeight: 700 }}
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
              Get access &rarr;
            </span>
          </div>
        )}
      </div>
    </>
  );

  // Inert until launch: no link, not-allowed cursor (matches
  // worlds/world-cards-grid.tsx and the landing strip). The card's one
  // tab stop is the NotifyMeButton client island inside the body.
  if (card.comingSoon) {
    return (
      <div
        className="tc-world-card"
        style={{ ...shellStyle, cursor: "not-allowed" }}
      >
        {body}
      </div>
    );
  }

  const href = card.owned
    ? `/worlds/${card.slug}`
    : `/pricing?locked=${card.slug}`;

  const label = card.owned
    ? `${card.displayName}, ${card.progressPercent}% complete, open world`
    : `${card.displayName} locked, view pricing`;

  return (
    <Link
      href={href}
      aria-label={label}
      className="tc-world-card"
      style={shellStyle}
    >
      {body}
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
