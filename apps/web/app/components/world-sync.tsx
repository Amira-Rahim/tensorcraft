"use client";

import { useEffect } from "react";
import { useWorld } from "./world-provider";
import type { WorldSlug } from "@tensorcraft/shared";

/**
 * Drop this inside a world route layout to sync the global world
 * with the current route's world slug.
 */
export function WorldSync({ slug }: { slug: WorldSlug }) {
  const { setWorld } = useWorld();

  useEffect(() => {
    setWorld(slug);
  }, [slug, setWorld]);

  return null;
}
