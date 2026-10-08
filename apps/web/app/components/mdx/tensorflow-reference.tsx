import type { ReactNode } from "react";
import { DocumentationLink } from "@tensorcraft/ui";
import {
  findTensorFlowReferences,
  tfjsApiReference,
} from "@tensorcraft/content/documentation";

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

export function TensorFlowReferences({ code }: { code: string }) {
  const references = findTensorFlowReferences(code);
  if (references.length === 0) return null;
  return (
    <details
      className="border-t border-border px-5 py-2 text-xs"
      data-testid="code-documentation"
    >
      <summary className="min-h-11 cursor-pointer py-3 text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        TensorFlow.js API reference
      </summary>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 pb-2">
        {references.map((reference) => (
          <li key={reference.href}>
            <DocumentationLink
              reference={reference}
              className="inline-block py-2 font-mono"
            >
              {reference.title}
            </DocumentationLink>
          </li>
        ))}
      </ul>
    </details>
  );
}
