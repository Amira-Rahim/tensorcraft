"use client";

import { useEffect, useRef, useState } from "react";

export function EmailPreviewFrame({
  html,
  width,
}: {
  html: string;
  width: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(1200);
  useEffect(() => () => observer.current?.disconnect(), []);

  return (
    <div className="lesson-frame flex justify-center pb-8">
      <iframe
        ref={frame}
        title={`Purchase receipt email at ${width}px`}
        srcDoc={html}
        sandbox="allow-same-origin"
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
            const nextHeight = Math.max(600, doc.documentElement.scrollHeight);
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
