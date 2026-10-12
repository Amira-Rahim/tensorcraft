import type { ReactNode } from "react";
import { ScenePortrait } from "@tensorcraft/ui";
import { ProseText } from "@tensorcraft/ui/prose-text";

interface LessonEpilogueProps {
  title: string;
  outcome: string;
  scene?: { src: string; alt?: string; location: string };
  children: ReactNode;
  archive: ReactNode;
  award?: ReactNode;
  guestCapture?: ReactNode;
}

/** A lesson close with the same reading scale and frame as its takeaways. */
export function LessonEpilogue({
  title,
  outcome,
  scene,
  children,
  archive,
  award,
  guestCapture,
}: LessonEpilogueProps) {
  return (
    <div className="orbit-epilogue">
      <header className="orbit-epilogue-header">
        <p className="orbit-epilogue-status">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 3 3 5-6" />
          </svg>
          Mission complete
        </p>
        <h1>{title}</h1>
        <p className="orbit-epilogue-outcome">
          <ProseText>{outcome}</ProseText>
        </p>
      </header>
      {award}
      <div className="orbit-epilogue-scene">
        <div className="orbit-epilogue-story lesson-prose">{children}</div>
        {scene && (
          <aside className="orbit-epilogue-art" aria-label="Closing scene">
            <ScenePortrait
              src={scene.src}
              alt={scene.alt}
              aspectRatio="3 / 2"
              className="orbit-epilogue-portrait"
            />
            <p>{scene.location}</p>
          </aside>
        )}
      </div>
      <details className="orbit-epilogue-archive">
        <summary>
          <h2>From the DISPATCH archive</h2>
          <span aria-hidden="true" />
        </summary>
        <div className="orbit-epilogue-archive-body lesson-prose">
          {archive}
        </div>
      </details>
      {guestCapture && (
        <div className="orbit-epilogue-guest">{guestCapture}</div>
      )}
    </div>
  );
}
