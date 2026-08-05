"use client";
import { useCallback, useRef, useState } from "react";
import { CharacterAvatar } from "./character-avatar";
import { useImgSettled } from "./use-img-settled";

/* ── AnimatedAvatar: expression-state portrait for the screenplay ─────
   Layered crossfade over the CharacterAvatar contract: the neutral portrait
   is always the base layer, an annotated expression variant sits above it
   and fades in only once its own onLoad fires (both imgs are in the DOM
   from first paint, so the browser fetches eagerly and the reveal never
   shows a half-decoded frame). Every 404 collapses one layer down:
   expression fails, neutral stays; neutral fails, the monogram placeholder
   takes over. Art is therefore optional at every level, matching the
   drop-in asset convention (docs/character-bible.md).

   Motion is deliberately minimal: the avatar itself never idles (a dossier
   photo does not breathe). The hidden .tc-avatar-scan span is a styling
   hook the host app's lesson CSS opts in during script playback, exactly
   like Dialogue's .tc-cut-to divider; it stays inert for every other
   consumer of this package. */

export interface AnimatedAvatarProps {
  name: string;
  /** Neutral portrait, the base layer and fallback for the expression. */
  src?: string;
  /** Annotated expression variant, crossfaded in over the base. */
  expressionSrc?: string;
  accentColor?: string;
  size?: number;
}

export function AnimatedAvatar({
  name,
  src,
  expressionSrc,
  accentColor = "var(--tc-primary)",
  size = 44,
}: AnimatedAvatarProps) {
  // States are keyed by the src they refer to, so a prop swap to a
  // different expression can never reuse a stale loaded/failed verdict.
  const [failedBase, setFailedBase] = useState<string | null>(null);
  const [loadedExpression, setLoadedExpression] = useState<string | null>(null);
  const [failedExpression, setFailedExpression] = useState<string | null>(null);

  // SSR'd layers can settle before hydration attaches onLoad/onError;
  // recover the lost verdicts from the DOM (see use-img-settled.ts). The
  // expression layer needs the success verdict too: a pre-hydration load
  // would otherwise leave the crossfade waiting forever.
  const baseRef = useRef<HTMLImageElement | null>(null);
  const settleBase = useCallback(
    (ok: boolean) => {
      if (!ok && src) setFailedBase(src);
    },
    [src],
  );
  useImgSettled(baseRef, src, settleBase);
  const expressionRef = useRef<HTMLImageElement | null>(null);
  const settleExpression = useCallback(
    (ok: boolean) => {
      if (!expressionSrc) return;
      if (ok) setLoadedExpression(expressionSrc);
      else setFailedExpression(expressionSrc);
    },
    [expressionSrc],
  );
  useImgSettled(expressionRef, expressionSrc, settleExpression);

  if (!src || failedBase === src) {
    return (
      <CharacterAvatar name={name} accentColor={accentColor} size={size} />
    );
  }

  const showExpression =
    expressionSrc !== undefined && failedExpression !== expressionSrc;

  return (
    <div
      data-testid="animated-avatar"
      role="img"
      aria-label={name}
      className="shrink-0 select-none relative overflow-hidden"
      style={{
        width: size,
        height: size,
        border: `2px solid ${accentColor}`,
        background: "var(--tc-surface)",
        borderRadius: 0,
      }}
    >
      <img
        ref={baseRef}
        data-testid="animated-avatar-base"
        src={src}
        alt=""
        aria-hidden="true"
        onError={() => setFailedBase(src)}
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: "cover" }}
      />
      {showExpression && (
        <img
          ref={expressionRef}
          data-testid="animated-avatar-expression"
          src={expressionSrc}
          alt=""
          aria-hidden="true"
          onLoad={() => setLoadedExpression(expressionSrc)}
          onError={() => setFailedExpression(expressionSrc)}
          className="absolute inset-0 h-full w-full"
          style={{
            objectFit: "cover",
            opacity: loadedExpression === expressionSrc ? 1 : 0,
            // The reduced-motion global backstop nulls this duration.
            transition: "opacity 240ms ease",
          }}
        />
      )}
      {/* Script-playback "talking" indicator; hidden until the host app's
          lesson CSS reveals it (see comment on Dialogue's .tc-cut-to). */}
      <span
        className="tc-avatar-scan hidden"
        aria-hidden="true"
        data-decorative="true"
      />
    </div>
  );
}
