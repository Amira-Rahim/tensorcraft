"use client";

import { useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

interface PostBodyProps {
  body: string;
}

/**
 * Render a velite-compiled MDX body. Same `new Function(...)` pattern used by
 * the lesson renderer (see lesson-content.tsx). Velite output is:
 *   const{Fragment,jsx,jsxs}=arguments[0]; ... return {default: fn}
 */
export function PostBody({ body }: PostBodyProps) {
  const Content = useMemo(() => {
    try {
      const fn = new Function(body);
      const mod = fn({ Fragment, jsx, jsxs }) as {
        default: (props: {
          components?: Record<string, unknown>;
        }) => React.ReactNode;
      };
      return mod.default;
    } catch {
      return function Fallback() {
        return <p>Error rendering post.</p>;
      };
    }
  }, [body]);

  return <Content />;
}
