import type { ReactNode } from "react";
import { tfjsApiReference } from "@tensorcraft/content/documentation";

/** Keep executable text intact when selecting/copying an example. */
export function TensorFlowApiLink({
  symbol,
  children,
}: {
  symbol: string;
  children?: ReactNode;
}) {
  const reference = tfjsApiReference(symbol);
  if (!reference) return <>{children ?? symbol}</>;
  return (
    <a
      href={reference.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${symbol}, TensorFlow.js documentation (opens in a new tab)`}
      title={`${symbol}: TensorFlow.js documentation (opens in a new tab)`}
      className="iv-api-link"
    >
      {children ?? symbol}
    </a>
  );
}

export function TensorFlowCode({ code }: { code: string }) {
  return (
    <>
      {code
        .split(/(\btf\.[A-Za-z]\w*(?:\.[A-Za-z]\w*)*)/g)
        .map((part, index) =>
          part.startsWith("tf.") ? (
            <TensorFlowApiLink key={index} symbol={part} />
          ) : (
            part
          ),
        )}
    </>
  );
}
