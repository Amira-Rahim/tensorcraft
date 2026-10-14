"use client";

import { useEffect, useRef, useState } from "react";

/** A real nested viewport keeps responsive review independent of browser size. */
export function ResponsiveLessonPreview({
  src,
  width,
  title,
}: {
  src: string;
  width: number;
  title?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(1000);
  useEffect(() => () => observer.current?.disconnect(), []);
  return (
    <div className="lesson-frame flex justify-center pb-8">
      <iframe
        ref={frame}
        src={src}
        title={title ?? `Deep Orbit lesson at ${width}px`}
        style={{
          width,
          height,
          maxWidth: "100%",
          boxSizing: "content-box",
          border: "1px solid var(--tc-border)",
        }}
        onLoad={() => {
          observer.current?.disconnect();
          const doc = frame.current?.contentDocument;
          if (!doc) return;
          const resize = () => {
            const nextHeight = Math.min(
              24000,
              Math.max(1000, doc.documentElement.scrollHeight),
            );
            setHeight((current) =>
              current === nextHeight ? current : nextHeight,
            );
          };
          resize();
          observer.current = new ResizeObserver(resize);
          observer.current.observe(doc.body);
        }}
      />
    </div>
  );
}
