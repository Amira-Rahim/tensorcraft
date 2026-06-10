"use client";

import Link from "next/link";
import { useState } from "react";
import { ParticleField } from "@tensorcraft/ui/effects";
import { NewsletterModal } from "./newsletter-modal";

export interface ThemeCardData {
  slug: string;
  displayName: string;
  tagline: string;
  specialization: string;
  primary: string;
  owned: boolean;
  modulesCount: number;
  lessonsCount: number;
  price: number;
  /**
   * Launch status. `live` themes link to their module map; `coming-soon`
   * themes link to the per-theme stub (which hosts a waitlist form).
   */
  status: "live" | "coming-soon";
}

export interface ThemeCardsGridProps {
  cards: ThemeCardData[];
}

/**
 * ThemeCardsGrid, hero card for the launched theme + muted grid for
 * coming-soon themes. Each card wraps a per-theme <ParticleField> atmosphere
 * (CSS-var driven so each canvas inherits the theme's primary color).
 * Renders a newsletter modal trigger + dialog for "Get updates" CTA.
 *
 * Layout:
 *   - launched theme renders as a wide hero card on top
 *   - coming-soon themes render in a 2-column grid below, muted
 */
export function ThemeCardsGrid({ cards }: ThemeCardsGridProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const liveCards = cards.filter((c) => c.status === "live");
  const comingSoonCards = cards.filter((c) => c.status === "coming-soon");

  return (
    <>
      <div className="space-y-12" data-testid="themes-grid">
        {liveCards.length > 0 && (
          <div className="grid grid-cols-1 gap-5">
            {liveCards.map((card) => (
              <ThemeCard key={card.slug} card={card} variant="hero" />
            ))}
          </div>
        )}

        {comingSoonCards.length > 0 && (
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-muted mb-4">
              Coming soon
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {comingSoonCards.map((card) => (
                <ThemeCard key={card.slug} card={card} variant="muted" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Newsletter CTA */}
      <div className="mt-16 flex flex-col items-center text-center">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted mb-3">
          stay in the loop
        </p>
        <h3 className="text-xl sm:text-2xl font-mono font-bold text-text-primary mb-3 tracking-tight">
          New themes, launch discounts, bridge essays.
        </h3>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          data-testid="open-newsletter-modal"
          className="inline-flex items-center font-mono px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all bg-transparent text-text-primary border-2 border-border rounded-none brutalist-hover hover:border-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          Get updates
        </button>
      </div>

      <NewsletterModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

interface ThemeCardProps {
  card: ThemeCardData;
  variant: "hero" | "muted";
}

function ThemeCard({ card, variant }: ThemeCardProps) {
  const isHero = variant === "hero";
  const isComingSoon = card.status === "coming-soon";

  return (
    <div
      data-theme={card.slug}
      data-testid={`theme-card-${card.slug}`}
      data-status={card.status}
      className="theme-card-wrapper"
    >
      <Link
        href={`/themes/${card.slug}`}
        aria-label={`${card.displayName}, ${card.tagline}${isComingSoon ? " (coming soon)" : ""}`}
        className={`group relative flex flex-col h-full border-2 border-border bg-surface-raised rounded-none overflow-hidden brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${isComingSoon ? "opacity-80 hover:opacity-100 transition-opacity" : ""}`}
        style={
          {
            ["--tc-primary" as string]: card.primary,
          } as React.CSSProperties
        }
      >
        <div
          className={`absolute inset-0 pointer-events-none ${isComingSoon ? "opacity-25 group-hover:opacity-45" : "opacity-50 group-hover:opacity-80"} transition-opacity`}
          aria-hidden="true"
        >
          <ParticleField
            density={isHero ? 0.25 : 0.12}
            colorToken="var(--tc-primary)"
            className="h-full w-full"
          />
        </div>

        <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-surface-raised/80 backdrop-blur-[1px]">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.15em] font-semibold"
            style={{ color: card.primary }}
          >
            {card.specialization}
          </span>
          <span
            className="font-mono text-[11px] uppercase tracking-[0.15em]"
            style={{
              color: isComingSoon ? card.primary : "var(--text-muted)",
            }}
            data-testid={`theme-status-${card.slug}`}
          >
            {isComingSoon ? "Coming soon" : "Live"}
          </span>
        </div>

        <div
          className={`relative z-10 flex flex-col flex-1 ${isHero ? "px-6 py-7 md:px-10 md:py-10" : "px-4 py-5"}`}
        >
          <h2
            className={`font-mono font-bold mb-2 tracking-tight ${isHero ? "text-3xl md:text-4xl" : "text-xl"}`}
            style={{ color: card.primary }}
          >
            {card.displayName}
          </h2>
          <p
            className={`text-text-muted mb-4 leading-relaxed font-sans ${isHero ? "text-base md:text-lg max-w-[640px]" : "text-sm"}`}
          >
            {card.tagline}
          </p>

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/60">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">
              {isComingSoon ? (
                <>Per-theme waitlist below</>
              ) : (
                <>
                  <span className="text-text-primary font-bold">
                    {card.modulesCount}
                  </span>{" "}
                  mod ·{" "}
                  <span className="text-text-primary font-bold">
                    {card.lessonsCount}
                  </span>{" "}
                  lessons
                </>
              )}
            </span>
            <span
              data-testid={`theme-cta-${card.slug}`}
              className="font-mono text-xs uppercase tracking-[0.15em] font-semibold"
              style={{ color: card.primary }}
            >
              {isComingSoon
                ? "Notify me →"
                : card.owned
                  ? "Continue →"
                  : "Start →"}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
