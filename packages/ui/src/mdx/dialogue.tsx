import type { ReactNode } from "react";
import { CharacterAvatar } from "../character-avatar";

interface DialogueProps {
  speaker: string;
  direction?: string;
  /** Label for the scene-transition divider; the divider is hidden unless
   *  the host app's CSS reveals it (see comment on the element below). */
  cutTo?: string;
  avatarSrc?: string;
  avatarName?: string;
  isAI?: boolean;
  /** Canonical expression id for this line (validated against the world
   *  manifest by the packages/content gate). The component itself does not
   *  consume it; the host app's wrapper reads it to build `avatarSlot`. */
  expression?: string;
  /** Fully-built avatar element from the host app (AnimatedAvatar or the
   *  ARIA waveform). Takes precedence over the avatarSrc/avatarName path,
   *  which stays for consumers without an app-side resolver. */
  avatarSlot?: ReactNode;
  /**
   * "stack": avatar centred above the name and line, 440 px wide (the
   * default, used for mid-lesson beats and the epilogue). "row": a 44 px
   * avatar slot beside the line, name over the line, full width (the
   * Briefing story grid, spec 2026-09-23). The root stays a block element
   * in both so the cut-to divider remains its last direct child, which the
   * host stylesheet selects with a child combinator.
   */
  layout?: "stack" | "row";
  children: ReactNode;
}

export function Dialogue({
  speaker,
  direction,
  cutTo = "Briefing",
  avatarSrc,
  avatarName,
  isAI,
  avatarSlot,
  layout = "stack",
  children,
}: DialogueProps) {
  // `||`, not `??`: a falsy slot (false, "") still falls back to the
  // avatarName path, as it did before the row layout.
  const avatar =
    avatarSlot ||
    (avatarName ? (
      <CharacterAvatar
        name={avatarName}
        src={avatarSrc}
        isAI={isAI}
        size={44}
      />
    ) : null);
  const row = layout === "row";
  return (
    <div
      className={row ? "mb-4" : "mb-7 mx-auto max-w-[440px]"}
      data-dialogue="true"
      data-layout={layout}
    >
      {row ? (
        <div
          data-dialogue-row=""
          className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-3 items-start"
        >
          <div>{avatar}</div>
          <div>
            <div
              className="font-mono text-xs font-bold uppercase tracking-[2px] mb-1"
              style={{ color: "var(--tc-primary, #E0E0E0)" }}
            >
              {speaker}
            </div>
            {direction && (
              <div
                className="text-[13px] italic mb-1"
                style={{ color: "var(--tc-muted, #A0A0A0)" }}
                data-testid="direction"
              >
                ({direction})
              </div>
            )}
            <div
              className="text-[15px] leading-relaxed"
              style={{ color: "var(--tc-text, #c8c8c8)" }}
            >
              {children}
            </div>
          </div>
        </div>
      ) : (
        <>
          {avatar ? (
            <div className="flex justify-center mb-2">{avatar}</div>
          ) : null}
          <div
            className="font-mono text-xs font-bold uppercase tracking-[2px] mb-1.5 text-center"
            style={{ color: "var(--tc-primary, #E0E0E0)" }}
          >
            {speaker}
          </div>
          {direction && (
            <div
              className="text-[13px] italic mb-1 text-center"
              style={{ color: "var(--tc-muted, #A0A0A0)" }}
              data-testid="direction"
            >
              ({direction})
            </div>
          )}
          <div
            className="text-[15px] leading-relaxed"
            style={{ color: "var(--tc-text, #c8c8c8)" }}
          >
            {children}
          </div>
        </>
      )}
      {/* Shown only on the last dialogue of a Briefing story zone; the web
          app's lesson CSS opts it in under [data-story-register]. Hidden by
          default so other consumers of @tensorcraft/ui never see it. Must
          stay the root's last direct child. */}
      <div
        className="tc-cut-to hidden items-center gap-3 mt-8"
        aria-hidden="true"
      >
        <span
          className="h-px flex-1"
          style={{ background: "var(--tc-border, #2a2a2a)" }}
        />
        <span
          className="font-mono text-[9px] uppercase tracking-[3px]"
          style={{ color: "var(--tc-muted, #777777)" }}
        >
          Cut to: {cutTo}
        </span>
        <span
          className="h-px flex-1"
          style={{ background: "var(--tc-border, #2a2a2a)" }}
        />
      </div>
    </div>
  );
}
