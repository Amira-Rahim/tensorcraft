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
}

export interface ThemeCardsGridProps {
  cards: ThemeCardData[];
}

/**
 * ThemeCardsGrid — equal 5-card grid for the `/themes` page. Each card wraps
 * a per-theme <ParticleField> atmosphere (CSS-var driven so each canvas
 * inherits the theme's primary color). Renders a newsletter modal trigger +
 * dialog for "Get updates" CTA.
 *
 * Responsive layout:
 *   - base:  1 column (stacked)
 *   - md:    2 columns
 *   - lg:    3 columns (3 + 2 on the bottom row)
 *   - xl:    5 equal columns
 */
export function ThemeCardsGrid({ cards }: ThemeCardsGridProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5"
        data-testid="themes-grid"
      >
        {cards.map((card) => (
          <div
            key={card.slug}
            data-theme={card.slug}
            data-testid={`theme-card-${card.slug}`}
            className="theme-card-wrapper"
          >
            <Link
              href={`/themes/${card.slug}`}
              aria-label={`${card.displayName} — ${card.tagline}`}
              className="group relative flex flex-col h-full border-2 border-border bg-surface-raised rounded-none overflow-hidden brutalist-hover focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              style={
                {
                  ["--tc-primary" as string]: card.primary,
                } as React.CSSProperties
              }
            >
              {/* Per-theme particle atmosphere — low density (0.15) so 5
                  canvases on-screen stay cheap. ParticleField internally
                  pauses via IntersectionObserver when off-viewport. */}
              <div
                className="absolute inset-0 pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity"
                aria-hidden="true"
              >
                <ParticleField
                  density={0.15}
                  colorToken="var(--tc-primary)"
                  className="h-full w-full"
                />
              </div>

              {/* Header strip — specialization only (no LIVE/coming-soon
                  labels; all themes launch simultaneously). */}
              <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-surface-raised/80 backdrop-blur-[1px]">
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.15em] font-semibold"
                  style={{ color: card.primary }}
                >
                  {card.specialization}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-muted">
                  ${card.price}
                </span>
              </div>

              {/* Body */}
              <div className="relative z-10 px-4 py-5 flex flex-col flex-1">
                <h2
                  className="text-xl font-mono font-bold mb-2 tracking-tight"
                  style={{ color: card.primary }}
                >
                  {card.displayName}
                </h2>
                <p className="text-sm text-text-muted mb-4 leading-relaxed font-sans">
                  {card.tagline}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/60">
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">
                    <span className="text-text-primary font-bold">
                      {card.modulesCount}
                    </span>{" "}
                    mod ·{" "}
                    <span className="text-text-primary font-bold">
                      {card.lessonsCount}
                    </span>{" "}
                    lessons
                  </span>
                  <span
                    data-testid={`theme-cta-${card.slug}`}
                    className="font-mono text-xs uppercase tracking-[0.15em] font-semibold"
                    style={{ color: card.primary }}
                  >
                    {card.owned ? "Continue →" : "Start →"}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Newsletter CTA */}
      <div className="mt-16 flex flex-col items-center text-center">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted mb-3">
          // stay in the loop
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
