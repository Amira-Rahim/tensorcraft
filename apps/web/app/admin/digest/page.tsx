import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient, isAdmin } from "@tensorcraft/supabase";
import { isoWeek } from "@/lib/iso-week";
import { setNewsItemStatus } from "./actions";

export const metadata: Metadata = {
  title: "Digest Curation | Admin",
  robots: { index: false, follow: false },
};

type StatusFilter = "pending" | "shortlisted" | "rejected" | "all" | "gap";

interface MatchedLesson {
  themeId: string;
  moduleId: string;
  slug: string;
  title: string;
  score: number;
  rationale?: string;
}

interface NewsItemRow {
  id: string;
  source: string;
  url: string;
  title: string;
  summary: string;
  published_at: string | null;
  matched_concepts: string[];
  matched_lessons: MatchedLesson[];
  status: "pending" | "shortlisted" | "published" | "rejected";
  week_iso: string | null;
  scraped_at: string;
  is_content_gap: boolean;
  gap_concept: string | null;
  gap_rationale: string | null;
}

export default async function DigestAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Auth gate.
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/admin/digest");
  if (!(await isAdmin(user.id))) redirect("/");

  const params = await searchParams;
  const filter = ((params.status as StatusFilter) || "pending") as StatusFilter;

  const admin = getSupabaseAdminClient();
  let query = admin
    .from("news_items")
    .select("*")
    .order("scraped_at", { ascending: false })
    .limit(200);
  if (filter === "gap") {
    query = query.eq("is_content_gap", true);
  } else if (filter !== "all") {
    query = query.eq("status", filter);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const items: NewsItemRow[] = (data ?? []) as NewsItemRow[];

  const counts = await getCounts(admin);
  const currentWeek = isoWeek();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Digest Curation</h1>
        <p className="mt-2 text-sm opacity-70">
          Pick news items for the {currentWeek} digest. Shortlisted items get
          drafted by <code>scripts/news/draft.mjs</code>.
        </p>
      </header>

      <nav className="mb-6 flex gap-2 text-sm">
        {(
          ["pending", "shortlisted", "gap", "rejected", "all"] as StatusFilter[]
        ).map((s) => (
          <a
            key={s}
            href={`/admin/digest?status=${s}`}
            className={`rounded border px-3 py-1 capitalize ${
              filter === s
                ? "border-text-primary bg-text-primary text-page"
                : s === "gap"
                  ? "border-warning text-warning"
                  : "border-border"
            }`}
          >
            {s === "gap" ? `gaps` : s} ({counts[s] ?? 0})
          </a>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="opacity-60">No items.</p>
      ) : (
        <ul className="space-y-6">
          {items.map((it) => (
            <NewsItemCard key={it.id} item={it} />
          ))}
        </ul>
      )}
    </main>
  );
}

function NewsItemCard({ item }: { item: NewsItemRow }) {
  return (
    <li className="rounded border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide opacity-60">
            {item.source}
            {item.published_at
              ? ` · ${new Date(item.published_at).toISOString().slice(0, 10)}`
              : ""}
            {item.week_iso ? ` · ${item.week_iso}` : ""}
          </p>
          <h2 className="mt-1 text-lg font-semibold">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {item.title}
            </a>
          </h2>
          {item.summary && (
            <p className="mt-2 text-sm opacity-80 line-clamp-3">
              {item.summary}
            </p>
          )}
        </div>
        <StatusActions id={item.id} status={item.status} />
      </div>

      {item.is_content_gap ? (
        <div className="mt-4 rounded border border-warning bg-warning/10 p-3">
          <p className="font-mono text-xs uppercase tracking-wider text-warning">
            Content gap detected
          </p>
          {item.gap_concept && (
            <p className="mt-1 text-sm font-semibold text-text-primary">
              {item.gap_concept}
            </p>
          )}
          {item.gap_rationale && (
            <p className="mt-1 text-xs text-text-muted">{item.gap_rationale}</p>
          )}
        </div>
      ) : item.matched_lessons.length > 0 ? (
        <ol className="mt-4 space-y-1 text-sm">
          {item.matched_lessons.map((m) => (
            <li key={`${m.themeId}/${m.moduleId}/${m.slug}`}>
              <span className="font-mono text-xs opacity-60">[{m.score}]</span>{" "}
              <a
                // Lesson routes live under /themes — the old /learn/... form
                // predates the route rename and 404'd (register §6 "broken
                // admin link"; /learn is now a single marketing page).
                href={`/themes/${m.themeId}/${m.moduleId}/${m.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {m.title}
              </a>{" "}
              <span className="opacity-50">
                ({m.themeId}/{m.moduleId})
              </span>
              {m.rationale && (
                <p className="ml-4 text-xs opacity-70">{m.rationale}</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm opacity-60">No matched lessons yet.</p>
      )}

      {item.matched_concepts.length > 0 && (
        <p className="mt-3 text-xs opacity-50">
          concepts: {item.matched_concepts.slice(0, 12).join(", ")}
        </p>
      )}
    </li>
  );
}

function StatusActions({
  id,
  status,
}: {
  id: string;
  status: NewsItemRow["status"];
}) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <form action={shortlistAction.bind(null, id)}>
        <button
          type="submit"
          disabled={status === "shortlisted"}
          className="w-full rounded border border-success bg-success/10 px-3 py-1 text-sm font-medium text-success disabled:opacity-40"
        >
          Shortlist
        </button>
      </form>
      <form action={rejectAction.bind(null, id)}>
        <button
          type="submit"
          disabled={status === "rejected"}
          className="w-full rounded border border-error bg-error/10 px-3 py-1 text-sm text-error disabled:opacity-40"
        >
          Reject
        </button>
      </form>
      {status !== "pending" && (
        <form action={resetAction.bind(null, id)}>
          <button
            type="submit"
            className="w-full rounded border border-border px-3 py-1 text-xs"
          >
            Reset
          </button>
        </form>
      )}
    </div>
  );
}

async function shortlistAction(id: string) {
  "use server";
  await setNewsItemStatus(id, "shortlisted");
}
async function rejectAction(id: string) {
  "use server";
  await setNewsItemStatus(id, "rejected");
}
async function resetAction(id: string) {
  "use server";
  await setNewsItemStatus(id, "pending");
}

async function getCounts(admin: ReturnType<typeof getSupabaseAdminClient>) {
  const statuses = ["pending", "shortlisted", "rejected"] as const;
  const counts: Record<string, number> = {};
  await Promise.all(
    statuses.map(async (s) => {
      const { count } = await admin
        .from("news_items")
        .select("*", { count: "exact", head: true })
        .eq("status", s);
      counts[s] = count ?? 0;
    }),
  );
  const [{ count: total }, { count: gapCount }] = await Promise.all([
    admin.from("news_items").select("*", { count: "exact", head: true }),
    admin
      .from("news_items")
      .select("*", { count: "exact", head: true })
      .eq("is_content_gap", true),
  ]);
  counts.all = total ?? 0;
  counts.gap = gapCount ?? 0;
  return counts;
}
