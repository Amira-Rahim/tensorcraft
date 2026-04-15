"use client";

import { useEffect } from "react";
import { useTheme } from "./theme-provider";
import type { ThemeSlug } from "@tensorcraft/shared";

/**
 * Drop this inside a theme route layout to sync the global theme
 * with the current route's theme slug.
 */
export function ThemeSync({ slug }: { slug: ThemeSlug }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(slug);
  }, [slug, setTheme]);

  return null;
}
