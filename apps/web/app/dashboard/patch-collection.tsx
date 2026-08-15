"use client";

import { ModulePatch } from "@tensorcraft/ui/module-patch";
import type { DashboardModule } from "./dashboard-view";

/**
 * Earned mission patches as a collection (docs/patch-bible.md), sibling of
 * BridgeCollection. Unlike the module map's earned-only rows, this panel
 * shows an empty dashed slot per unearned module: every module is launched
 * content, so a slot promises nothing unbuyable, and a collection is the
 * one framing where absence reads as "not yet" rather than "broken".
 *
 * Renders nothing when no module resolves patch art (worlds without
 * patches keep today's dashboard). Earned = status "done", the same
 * predicate the count uses; a done module without art falls back to a
 * dashed slot, which the all-or-none coverage gate makes unreachable in
 * practice.
 */
export function PatchCollection({ modules }: { modules: DashboardModule[] }) {
  if (!modules.some((m) => m.patchSrc)) return null;

  const earned = modules.filter((m) => m.status === "done" && m.patchSrc);

  return (
    <section className="mb-10" data-testid="patch-collection">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-xs font-bold text-text-muted tracking-wider uppercase">
          Mission Patches
        </div>
        <div
          className="font-mono text-xs text-text-muted"
          data-testid="patch-collection-count"
        >
          <span className="text-primary font-bold">{earned.length}</span>
          <span>/{modules.length}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {modules.map((m) => (
          <div key={m.slug} className="flex flex-col items-center gap-1">
            {m.status === "done" && m.patchSrc ? (
              <ModulePatch src={m.patchSrc} size={48} />
            ) : (
              <div
                data-testid={`patch-slot-empty-${m.slug}`}
                aria-hidden="true"
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  border: "1px dashed var(--tc-border)",
                }}
              />
            )}
            <span
              className={`font-mono text-[9px] tracking-wider ${
                m.status === "done" ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {m.number}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
