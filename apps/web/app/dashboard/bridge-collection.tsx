"use client";
import { useState } from "react";
import Link from "next/link";
interface BridgeItem {
  lessonSlug: string;
  moduleSlug: string;
  jsTitle: string;
  mlTitle: string;
  tier: "identity" | "structural" | "intuition";
  collected: boolean;
}
const LABELS = {
  identity: "Identity",
  structural: "Structural",
  intuition: "Intuition",
};
export function BridgeCollection({
  bridges,
  worldSlug = "deep-orbit",
}: {
  bridges: BridgeItem[];
  worldSlug?: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const earned = bridges.filter((b) => b.collected);
  if (!earned.length) return null;
  return (
    <section className="mb-8" aria-labelledby="bridges-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 id="bridges-heading" className="font-medium">
          Bridges collected
        </h3>
        <p className="text-sm text-text-muted">
          {earned.length} of {bridges.length} collected
        </p>
      </div>
      <ul className="grid list-none gap-3 sm:grid-cols-2">
        {earned.map((b) => {
          const key = `${b.moduleSlug}/${b.lessonSlug}`;
          const open = expanded === key;
          return (
            <li key={key} className="min-w-0 bg-surface-raised">
              <button
                type="button"
                aria-label={`${LABELS[b.tier]} bridge: ${b.jsTitle} to ${b.mlTitle}`}
                aria-expanded={open}
                aria-controls={open ? `bridge-${b.lessonSlug}` : undefined}
                onClick={() => setExpanded(open ? null : key)}
                className="min-h-11 w-full p-4 text-left focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="block break-words">
                  {b.jsTitle} → {b.mlTitle}
                </span>
                <span className="mt-1 block text-sm text-text-muted">
                  {LABELS[b.tier]} bridge
                </span>
              </button>
              {open && (
                <div id={`bridge-${b.lessonSlug}`} className="px-4 pb-4">
                  <Link
                    href={`/worlds/${worldSlug}/${b.moduleSlug}/${b.lessonSlug}`}
                    className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                  >
                    Revisit this connection →
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
