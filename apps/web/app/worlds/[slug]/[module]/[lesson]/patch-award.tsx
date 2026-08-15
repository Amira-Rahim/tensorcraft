"use client";

import { ModulePatch } from "@tensorcraft/ui/module-patch";

/**
 * The award moment (docs/patch-bible.md): the module's mission patch,
 * revealed on the Consequence step the session the module's last remaining
 * lesson completes. One object arriving is the celebration; no confetti.
 *
 * This is the one patch render that IS the content rather than decoration,
 * so it carries authored alt text. If the asset fails, ModulePatch removes
 * itself and the text stands alone: the words still say what was earned.
 */
export function PatchAward({
  src,
  moduleName,
  moduleTerm,
}: {
  src: string;
  moduleName: string;
  moduleTerm: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-2 mb-8 animate-fade-up"
      data-testid="patch-award"
    >
      <ModulePatch src={src} size={96} alt={`${moduleName} mission patch`} />
      <div
        className="font-mono text-[10px] uppercase tracking-[2px] mt-2"
        style={{ color: "var(--tc-primary)" }}
      >
        {moduleTerm} Complete
      </div>
      <div
        className="text-sm font-semibold"
        style={{ color: "var(--tc-text)" }}
      >
        {moduleName}
      </div>
      <div className="text-xs" style={{ color: "var(--tc-muted)" }}>
        Mission patch earned.
      </div>
    </div>
  );
}
