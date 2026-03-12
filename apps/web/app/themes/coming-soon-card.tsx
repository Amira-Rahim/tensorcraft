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
}

export function ComingSoonCard({
  slug,
  displayName,
  specialization,
  description,
  accentColor,
  surfaceColor,
  mutedColor,
}: ComingSoonCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="rounded-2xl p-6 flex flex-col text-left transition-all hover:scale-[1.01] cursor-pointer"
        style={{
          background: surfaceColor,
          border: "1px solid rgba(255,255,255,0.06)",
          opacity: 0.6,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-medium"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: mutedColor,
            }}
          >
            Coming Soon
          </span>
        </div>

        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--tc-text, #FFFFFF)" }}
        >
          {displayName}
        </h2>
        <p className="text-sm mb-2" style={{ color: accentColor }}>
          {specialization}
        </p>
        <p
          className="text-sm leading-relaxed mb-4 flex-1"
          style={{ color: mutedColor }}
        >
          {description}
        </p>

        <span
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium transition-colors hover:bg-white/[0.03]"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            color: mutedColor,
          }}
        >
          Learn More
        </span>
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
