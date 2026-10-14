import type { ReactNode } from "react";
import { ScenePortrait } from "@tensorcraft/ui";
import { LessonCompleteBanner } from "./lesson-complete-banner";

interface LessonEpilogueProps {
  outcome: string;
  scene?: { src: string; alt?: string; location: string };
  children: ReactNode;
  award?: ReactNode;
  guestCapture?: ReactNode;
}

/** A lesson close with the same reading scale and frame as its takeaways. */
export function LessonEpilogue({
  outcome,
  scene,
  children,
  award,
  guestCapture,
}: LessonEpilogueProps) {
  return (
    <div className="orbit-epilogue">
      <LessonCompleteBanner outcome={outcome} lessonTerm="Mission" />
      {award}
      <div className="orbit-epilogue-scene">
        {scene && (
          <aside className="orbit-epilogue-art" aria-label="Closing scene">
            <ScenePortrait
              src={scene.src}
              alt={scene.alt}
              aspectRatio="3 / 2"
              className="orbit-epilogue-portrait"
            />
          </aside>
        )}
        <div className="orbit-epilogue-story lesson-prose">{children}</div>
      </div>
      {guestCapture && (
        <div className="orbit-epilogue-guest">{guestCapture}</div>
      )}
    </div>
  );
}
