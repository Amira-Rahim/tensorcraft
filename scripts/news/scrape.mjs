#!/usr/bin/env node
/**
 * Browser-ML news scraper.
 *
 * Pulls from GitHub Releases, RSS feeds, HN Algolia, and ArXiv. Normalizes
 * every hit into a common Item shape, applies the editorial `shouldKeep`
 * filter, and upserts rows into the public.news_items Supabase table.
 *
 * Run:
 *   pnpm tsx scripts/news/scrape.mjs              # write to Supabase
 *   pnpm tsx scripts/news/scrape.mjs --dry-run    # print to stdout, no DB writes
 *
 * Required env (set in .env or via shell):
 *   SUPABASE_URL - project URL
 *   SUPABASE_SERVICE_ROLE_KEY - service-role key (bypasses RLS)
 *   GITHUB_TOKEN - optional; raises GitHub rate limit from 60 → 5000/hr
 */
const DRY_RUN = process.argv.includes("--dry-run");
const RECENT_DAYS = 14; // discard items older than this

/* ------------------------------------------------------------------ */
/* Sources                                                              */
/* ------------------------------------------------------------------ */

const GITHUB_REPOS = [
  "tensorflow/tfjs",
  "xenova/transformers.js",
  "microsoft/onnxruntime",
  "google/mediapipe",
  "mlc-ai/web-llm",
  "huggingface/transformers",
];

const RSS_FEEDS = [
  { source: "rss:web.dev", url: "https://web.dev/feed.xml" },
  {
    source: "rss:developer.chrome.com",
    url: "https://developer.chrome.com/static/blog/feed.xml",
  },
  {
    source: "rss:blog.tensorflow.org",
    url: "https://blog.tensorflow.org/feeds/posts/default",
  },
  {
    source: "rss:huggingface.co/blog",
    url: "https://huggingface.co/blog/feed.xml",
  },
];

const HN_QUERY =
  'WebGPU OR transformers.js OR "browser ML" OR WebNN OR tfjs OR onnxruntime OR "on-device"';
const ARXIV_QUERY = "cat:cs.LG"; // filter locally for browser/edge keywords

/* ------------------------------------------------------------------ */
/* Editorial filter - USER CONTRIBUTION                                 */
/* ------------------------------------------------------------------ */

/**
 * Decide whether a scraped item should be saved for curation.
 *
 * Called once per Item after normalization. Return false to drop the item.
 * This encodes editorial taste - what counts as a quality lead for the
 * digest. Examples of decisions to encode:
 *   - HN items below N points: drop?
 *   - Items with title length < 15 chars: drop (likely tag-only releases)?
 *   - Items mentioning unrelated terms (mobile-only, hardware-only)?
 *   - GitHub patch releases (e.g. "v4.21.1") with no meaningful body?
 *   - ArXiv papers without "browser", "edge", "wasm", "webgpu" in summary?
 *
 * @param {Item} item
 * @returns {boolean}
 */
function shouldKeep(item) {
  // Drop tag-only release entries (no body, just "Patch release v5.6.1").
  if (/patch release/i.test(item.title) && item.summary.length < 200)
    return false;

  // GitHub releases need a meaningful body so the matcher has signal to work with.
  if (item.source.startsWith("github:") && item.summary.length < 80)
    return false;

  // RSS / HN must mention something browser-ML adjacent in title or summary.
  const haystack = `${item.title} ${item.summary}`.toLowerCase();
  const browserSignals =
    /\b(browser|webgpu|webgl|wasm|webassembly|on[- ]?device|edge|tfjs|tensorflow\.?js|transformers\.?js|onnx|mediapipe|web-?llm|chrome|firefox|safari|webnn)\b/;
  if (
    (item.source.startsWith("rss:") || item.source === "hn") &&
    !browserSignals.test(haystack)
  ) {
    return false;
  }

  // ArXiv was already filtered locally upstream; pass through.
  return true;
}

/* ------------------------------------------------------------------ */
/* Adapters                                                             */
/* ------------------------------------------------------------------ */

const headers = process.env.GITHUB_TOKEN
  ? {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "User-Agent": "tensorcraft-scraper",
    }
  : { "User-Agent": "tensorcraft-scraper" };

async function fetchGithubReleases(repo) {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases?per_page=10`,
    {
      headers,
    },
  );
  if (!res.ok) {
    console.warn(`[github:${repo}] HTTP ${res.status} - skipping`);
    return [];
  }
  const data = await res.json();
  return data
    .filter((r) => !r.draft && !r.prerelease)
    .map((r) => ({
      source: `github:${repo}`,
      url: r.html_url,
      title: `${repo} ${r.tag_name}: ${r.name || r.tag_name}`.trim(),
      summary: (r.body || "").slice(0, 1500),
      published_at: r.published_at,
      raw: {
        tag: r.tag_name,
        name: r.name,
        draft: r.draft,
        prerelease: r.prerelease,
      },
    }));
}

async function fetchRss({ source, url }) {
  const res = await fetch(url, {
    headers: { "User-Agent": "tensorcraft-scraper" },
  });
  if (!res.ok) {
    console.warn(`[${source}] HTTP ${res.status} - skipping`);
    return [];
  }
  const xml = await res.text();
  // Minimal RSS/Atom parser - extracts <item>/<entry> blocks.
  const itemBlocks =
    xml.match(/<(item|entry)\b[\s\S]*?<\/(item|entry)>/g) || [];
  return itemBlocks.map((block) => {
    const pick = (tag) => {
      const m = block.match(
        new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
      );
      if (!m) return "";
      return m[1]
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
        .replace(/<[^>]+>/g, "")
        .trim();
    };
    const linkMatch =
      block.match(/<link[^>]*href="([^"]+)"/i) ||
      block.match(/<link>([^<]+)<\/link>/i);
    return {
      source,
      url: linkMatch ? linkMatch[1] : "",
      title: pick("title"),
      summary: (
        pick("description") ||
        pick("summary") ||
        pick("content")
      ).slice(0, 1500),
      published_at:
        pick("pubDate") || pick("published") || pick("updated") || null,
      raw: {},
    };
  });
}

async function fetchHackerNews() {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
    HN_QUERY,
  )}&tags=story&numericFilters=points>30,created_at_i>${
    Math.floor(Date.now() / 1000) - RECENT_DAYS * 86400
  }&hitsPerPage=50`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[hn] HTTP ${res.status}`);
    return [];
  }
  const data = await res.json();
  return (data.hits || []).map((h) => ({
    source: "hn",
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    title: h.title || h.story_title || "",
    summary: (h.story_text || "").slice(0, 1500),
    published_at: h.created_at,
    raw: { points: h.points, comments: h.num_comments, hn_id: h.objectID },
  }));
}

async function fetchArxiv() {
  // ArXiv API uses Atom; query for recent cs.LG, filter title/abstract locally.
  const url = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(
    ARXIV_QUERY,
  )}&sortBy=submittedDate&sortOrder=descending&max_results=50`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`[arxiv] HTTP ${res.status}`);
    return [];
  }
  const xml = await res.text();
  const entries = xml.match(/<entry\b[\s\S]*?<\/entry>/g) || [];
  const browserKeywords =
    /\b(browser|webgpu|webgl|wasm|webassembly|on-?device|edge|tfjs|tensorflow\.?js|transformers\.?js|onnx)\b/i;
  return entries
    .map((e) => {
      const pick = (tag) => {
        const m = e.match(
          new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
        );
        return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
      };
      const linkMatch = e.match(/<id>([^<]+)<\/id>/i);
      return {
        source: "arxiv:cs.LG",
        url: linkMatch ? linkMatch[1].trim() : "",
        title: pick("title"),
        summary: pick("summary").slice(0, 1500),
        published_at: pick("published"),
        raw: {},
      };
    })
    .filter((it) => browserKeywords.test(`${it.title} ${it.summary}`));
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                             */
/* ------------------------------------------------------------------ */

function recentEnough(it) {
  if (!it.published_at) return true;
  const ts = Date.parse(it.published_at);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts <= RECENT_DAYS * 86400 * 1000;
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    if (!it.url) continue;
    if (seen.has(it.url)) continue;
    seen.add(it.url);
    out.push(it);
  }
  return out;
}

async function gatherAll() {
  const tasks = [
    ...GITHUB_REPOS.map((r) =>
      fetchGithubReleases(r).catch((e) => (console.warn(e), [])),
    ),
    ...RSS_FEEDS.map((f) => fetchRss(f).catch((e) => (console.warn(e), []))),
    fetchHackerNews().catch((e) => (console.warn(e), [])),
    fetchArxiv().catch((e) => (console.warn(e), [])),
  ];
  const groups = await Promise.all(tasks);
  return groups.flat();
}

async function main() {
  console.log(`[scrape] starting (dry-run=${DRY_RUN})`);
  const raw = await gatherAll();
  const recent = raw.filter(recentEnough);
  const filtered = recent.filter(shouldKeep);
  const items = dedupe(filtered);

  console.log(
    `[scrape] gathered=${raw.length} recent=${recent.length} kept=${filtered.length} unique=${items.length}`,
  );

  if (DRY_RUN) {
    for (const it of items.slice(0, 30)) {
      console.log(`  [${it.source}] ${it.title}\n    ${it.url}`);
    }
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[scrape] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = items.map((it) => ({
    source: it.source,
    url: it.url,
    title: it.title,
    summary: it.summary,
    published_at: it.published_at || null,
    raw_json: it.raw || {},
  }));

  const { error, count } = await supabase.from("news_items").upsert(rows, {
    onConflict: "url",
    ignoreDuplicates: true,
    count: "exact",
  });

  if (error) {
    console.error("[scrape] upsert failed:", error);
    process.exit(1);
  }
  console.log(`[scrape] upserted ${count ?? rows.length} rows`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/* ------------------------------------------------------------------ */
/* @typedef {{                                                          */
/*   source: string,                                                    */
/*   url: string,                                                       */
/*   title: string,                                                     */
/*   summary: string,                                                   */
/*   published_at: string | null,                                       */
/*   raw: Record<string, unknown>                                       */
/* }} Item                                                              */
/* ------------------------------------------------------------------ */
