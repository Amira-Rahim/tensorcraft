"use client";

import { useState } from "react";
import { ComingSoonModal } from "./coming-soon-modal";

interface ComingSoonCardProps {
  slug: string;
  displayName: string;
  specialization: string;
  description: string;
  accentColor: string;
  surfaceColor: string;
  mutedColor: string;
  icon: string;
  modelBuilt: string;
  characters: string[];
}

export function ComingSoonCard({
  slug,
  displayName,
  specialization,
  description,
  accentColor,
  surfaceColor,
  mutedColor,
  icon,
  modelBuilt,
  characters,
}: ComingSoonCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex flex-col text-left transition-all cursor-pointer border border-border bg-surface-raised"
        style={{ opacity: 0.72 }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.95";
          e.currentTarget.style.transform = "translate(2px, 2px)";
          e.currentTarget.style.boxShadow = "none";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.72";
          e.currentTarget.style.transform = "translate(0, 0)";
          e.currentTarget.style.boxShadow = `4px 4px 0px ${accentColor}33`;
        }}
      >
        {/* Art header with grid texture */}
        <div
          className="w-full flex items-center justify-center py-8"
          style={{
            background: `
              linear-gradient(${accentColor}08 1px, transparent 1px),
              linear-gradient(90deg, ${accentColor}08 1px, transparent 1px),
              ${surfaceColor}
            `,
            backgroundSize: "20px 20px, 20px 20px, 100% 100%",
          }}
        >
          <span className="text-4xl">{icon}</span>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col flex-1">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: mutedColor,
              }}
            >
              Coming Soon
            </span>
          </div>

          <p
            className="text-xs font-mono uppercase tracking-widest mb-1"
            style={{ color: mutedColor }}
          >
            {specialization}
          </p>
          <h2
            className="text-xl font-bold font-mono mb-2"
            style={{ color: accentColor }}
          >
            {displayName}
          </h2>
          <p
            className="text-sm leading-relaxed mb-4 flex-1"
            style={{ color: mutedColor }}
          >
            {description}
          </p>

          {/* Build info */}
          <p className="text-xs font-mono text-text-muted mb-3">
            <span className="text-text-primary">You&apos;ll build:</span>{" "}
            {modelBuilt}
          </p>

          {/* Characters */}
          <p className="text-xs text-text-muted mb-4">
            <span className="font-mono text-text-primary">Crew: </span>
            {characters.join(", ")}
          </p>

          {/* Stats */}
          <div
            className="flex gap-5 mb-5 text-xs font-mono"
            style={{ color: mutedColor }}
          >
            <span>11 Modules</span>
            <span>55 Lessons</span>
          </div>

          {/* CTA */}
          <span
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium font-mono transition-colors border border-border"
            style={{ color: accentColor }}
          >
            Join Waitlist &rarr;
          </span>
        </div>
      </button>

      <ComingSoonModal
        themeId={slug}
        themeName={displayName}
        specialization={specialization}
        description={description}
        accentColor={accentColor}
        surfaceColor={surfaceColor}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
