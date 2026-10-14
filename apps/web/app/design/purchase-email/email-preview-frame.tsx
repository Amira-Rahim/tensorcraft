"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function EmailPreviewFrame({
  html,
  width,
}: {
  html: string;
  width: number;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const [height, setHeight] = useState(1);
  const syncFrame = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.body?.childElementCount) return;
    observer.current?.disconnect();
    const resize = () => {
      const bodyStyle = doc.defaultView?.getComputedStyle(doc.body);
      const marginTop = parseFloat(bodyStyle?.marginTop ?? "0") || 0;
      const marginBottom = parseFloat(bodyStyle?.marginBottom ?? "0") || 0;
      const nextHeight = Math.ceil(
        doc.body.getBoundingClientRect().height + marginTop + marginBottom,
      );
      setHeight((current) => (current === nextHeight ? current : nextHeight));
    };
    resize();
    observer.current = new ResizeObserver(resize);
    observer.current.observe(doc.body);
  }, []);

  useEffect(() => {
    // A server-rendered srcDoc can finish loading before hydration attaches onLoad.
    syncFrame();
    return () => observer.current?.disconnect();
  }, [html, syncFrame]);

  return (
    <div className="lesson-frame pb-8">
      <iframe
        ref={frame}
        title={`Purchase receipt email at ${width}px`}
        srcDoc={html}
        sandbox="allow-same-origin"
        style={{
          width,
          height,
          maxWidth: "calc(100% - 2px)",
          boxSizing: "content-box",
          border: "1px solid var(--tc-border)",
          display: "block",
        }}
        onLoad={syncFrame}
      />
    </div>
  );
}
