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
  modelBuilt: string;
  careerPaths: string[];
}

export function ComingSoonCard({
  slug,
  displayName,
  specialization,
  description,
  accentColor,
  surfaceColor,
  mutedColor,
  modelBuilt,
  careerPaths,
}: ComingSoonCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex flex-col text-left transition-all cursor-pointer border border-border bg-surface-raised"
        style={{ opacity: 0.75 }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.transform = "translate(-2px, -2px)";
          e.currentTarget.style.boxShadow = `4px 4px 0px ${accentColor}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.75";
          e.currentTarget.style.transform = "translate(0, 0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between px-6 py-3 border-b border-border">
          <span
            className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: mutedColor,
            }}
          >
            Coming Soon
          </span>
          <span
            className="text-[10px] font-mono uppercase tracking-wider"
            style={{ color: mutedColor }}
          >
            {specialization}
          </span>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col flex-1">
          {/* Name */}
          <h2
            className="text-xl font-bold font-mono mb-2"
            style={{ color: accentColor }}
          >
            {displayName}
          </h2>

          {/* One-line hook from description */}
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: mutedColor }}
          >
            {description}
          </p>

          {/* Career Paths — the primary motivator */}
          <div className="mb-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1.5">
              Career paths this unlocks
            </p>
            <div className="flex flex-wrap gap-1.5">
              {careerPaths.map((path) => (
                <span
                  key={path}
                  className="inline-flex px-2 py-0.5 text-[10px] font-mono border border-border"
                  style={{ color: accentColor }}
                >
                  {path}
                </span>
              ))}
            </div>
          </div>

          {/* What you'll build */}
          <p className="text-xs font-mono text-text-muted mb-5">
            <span className="text-text-primary font-semibold">
              Final project:
            </span>{" "}
            {modelBuilt}
          </p>

          {/* Stats + CTA */}
          <div className="mt-auto flex items-center justify-between">
            <div
              className="flex gap-4 text-xs font-mono"
              style={{ color: mutedColor }}
            >
              <span>11 Modules</span>
              <span>55 Lessons</span>
            </div>
            <span
              className="inline-flex items-center px-4 py-2 text-xs font-medium font-mono transition-colors border border-border"
              style={{ color: accentColor }}
            >
              Notify Me &rarr;
            </span>
          </div>
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
