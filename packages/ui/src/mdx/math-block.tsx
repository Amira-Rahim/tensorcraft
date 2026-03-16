import katex from "katex";
import "katex/dist/katex.min.css";

interface MathBlockProps {
  expression: string;
  display?: boolean;
}

export function MathBlock({ expression, display = true }: MathBlockProps) {
  const html = katex.renderToString(expression, {
    displayMode: display,
    throwOnError: false,
    output: "html",
  });

  if (!display) {
    return (
      <span
        className="inline-block align-middle mx-0.5"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border overflow-x-auto">
      <div
        className="text-center [&_.katex]:text-text-primary"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
