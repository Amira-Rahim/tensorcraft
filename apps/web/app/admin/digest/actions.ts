"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient, isAdmin } from "@tensorcraft/supabase";
import type { Database } from "@tensorcraft/supabase";
import { getPosts } from "@tensorcraft/content";
import { isoWeek } from "@/lib/iso-week";
import { resolvePublishSlug, type PublishSlugResult } from "./publish-slug";

type NewsItemUpdate = Database["public"]["Tables"]["news_items"]["Update"];

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user.id))) {
    throw new Error("Forbidden");
  }
  return user.id;
}

export async function setNewsItemStatus(
  id: string,
  status: "pending" | "shortlisted" | "rejected",
) {
  await requireAdmin();
  const admin = getSupabaseAdminClient();
  const update: NewsItemUpdate = {
    status,
    curated_at: new Date().toISOString(),
    // Every status this action sets is a non-published one, so a slug left
    // over from an earlier publish would be stale; only
    // markNewsItemPublished sets it.
    published_blog_slug: null,
  };
  if (status === "shortlisted") {
    update.week_iso = isoWeek();
  }
  const { error } = await admin.from("news_items").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/digest");
}

/**
 * Mark a news item as covered by a shipped, hand-written blog post.
 * Validation failures (typo, post not built yet) come back as a result
 * value so the page can show them; only infrastructure errors throw.
 */
export async function markNewsItemPublished(
  id: string,
  slugInput: string,
): Promise<PublishSlugResult> {
  await requireAdmin();
  const knownSlugs = new Set(getPosts().map((p) => p.slug));
  const resolved = resolvePublishSlug(slugInput, knownSlugs);
  if (!resolved.ok) return resolved;

  const admin = getSupabaseAdminClient();
  const update: NewsItemUpdate = {
    status: "published",
    published_blog_slug: resolved.slug,
    curated_at: new Date().toISOString(),
  };
  const { error } = await admin.from("news_items").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/digest");
  return resolved;
}
