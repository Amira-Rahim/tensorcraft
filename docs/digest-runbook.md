# Digest Pipeline — Runbook

Browser-ML news → curated weekly digest → LLM idea briefs → hand-written
blog post + RSS + newsletter + social.
Plan: `.claude/plans/we-need-to-make-precious-summit.md` (local Claude plan
file in the owner's home directory; not tracked in this repo).

## Where state lives

- **`public.news_items`** (Supabase) — every scraped item. Status flow:
  `pending → shortlisted → published`, or `→ rejected`.
- **`public.waitlist.{subscribed, unsubscribe_token}`** — newsletter recipients.
- **`packages/content/.velite/concept-index.json`** — reverse index of 1599 concept tokens
  built from 296 lesson MDX files. Regenerate after content changes.
- **`packages/content/content/blog/*.mdx`** — hand-written posts, rendered on `/blog/[slug]`.
- **`dist/drafts/<weekIso>-*.md`** — LLM idea briefs, raw material for the hand-written posts.
- **`dist/social/<weekIso>.md`** — manually-pasted X / LinkedIn copy.

## Components

| File | Role |
|---|---|
| `scripts/news/scrape.mjs` | Pulls GitHub releases × 6, RSS × 4, HN, ArXiv → `news_items`. Editorial filter dedupes + drops noise. |
| `.github/workflows/news-scrape.yml` | Runs scrape Mondays 09:00 UTC + manual dispatch. |
| `scripts/news/match.mjs` | Two-stage retrieval: concept-index pass → Haiku 4.5 LLM rerank. Writes `matched_concepts` + `matched_lessons`. |
| `apps/web/app/admin/digest/page.tsx` | Curator UI, gated by admin role. Shortlist / reject / reset. |
| `scripts/news/draft.mjs` | LLM-drafts an idea brief per shortlisted item + a weekly digest brief into `dist/drafts/`. Leaves rows at `shortlisted`; a human writes the post. |
| `scripts/news/social.mjs` | LLM-drafts X thread + LinkedIn post. Manual paste (no API auth). |
| `scripts/news/send-newsletter.mjs` | Calls admin API → `apps/api/src/lib/newsletter.ts` → Resend. |
| `apps/web/app/blog/{page,[slug]/page,rss.xml/route}.{tsx,ts}` | Blog index, post detail (with click-tracker `LessonLink`), RSS feed. |
| `apps/web/app/unsubscribe/page.tsx` | Token-based opt-out. |
| `apps/web/app/api/og/route.tsx` | OG card with `kind=digest` variant (news + lesson split). |
| `apps/web/lib/iso-week.ts` | `isoWeek()` helper. |

## Required env

| Var | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | api .env, web Vercel, GH secrets | DB |
| `SUPABASE_SERVICE_ROLE_KEY` | api .env, web Vercel, GH secrets | DB writes via service role |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | web .env.local, web Vercel | Auth |
| `ANTHROPIC_API_KEY` | local shell (or api .env) for matcher / draft / social | LLM rerank + drafting |
| `RESEND_API_KEY` | api .env, GH secrets | Email send |
| `NEWSLETTER_FROM` | api .env, GH secrets | e.g. `The Bridge <bridge@tensorcraft.app>` |
| `ADMIN_API_KEY` | api .env, GH secrets | `send-newsletter.mjs` auth |
| `NEXT_PUBLIC_SITE_URL` | api .env, GH secrets | Used in email + social URLs |

Domain `tensorcraft.app` already verified in Resend (eu-west-1).

---

## Weekly run — happy path

### 0. Pre-flight (only if content changed)

```bash
pnpm turbo build:content
pnpm --filter @tensorcraft/content build:concept-index
git add packages/content/.velite  # only if checking in (currently gitignored)
```

### 1. Scrape (auto Mondays, or manual)

GH → Actions → "News Scrape" → Run workflow.

- First run with `dry_run=true` to verify secrets + sources.
- Re-run with `dry_run=false` to write rows.
- Idempotent on URL: re-running same week is safe.

Expected: ~16 items. Mostly GitHub releases + Chrome dev blog + 1-2 HF posts + occasional ArXiv.

Verify rows:
```sql
select count(*), status from public.news_items group by status;
```

### 2. Match (local, manual)

Needs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.

```bash
set -a; source apps/api/.env; set +a
export ANTHROPIC_API_KEY=<your-key>
node scripts/news/match.mjs --all-pending
```

Flags:
- `--all-pending` — match every `pending` row regardless of week.
- `--week=2026-W18` — filter by week_iso (rarely useful pre-shortlist).
- `--no-llm` — skip LLM rerank, deterministic top-3 only. Fast, no API key needed.
- `--fixture=path.json` — local-only dry-run with sample items.

Cost: Haiku 4.5 ≈ $0.0015 per item × ~16 ≈ **~$0.025/week**.

Output: writes `matched_concepts` (text[]) + `matched_lessons` (jsonb with rationale) on each row.

### 3. Curate

`https://tensorcraft.app/admin/digest` (sign in as admin).

Drop:
- Patch releases with no narrative (`Patch release v5.6.x`, scoreless content).
- Items with top-match score < ~10 (no real lesson teaches that concept).
- Off-topic blog posts that slipped past `shouldKeep`.

Shortlist 3–5 strong items. UI sets `week_iso = isoWeek(now)` + `status = shortlisted`.

### 4. Draft idea briefs (local)

```bash
set -a; source apps/api/.env; set +a
export ANTHROPIC_API_KEY=<your-key>
node scripts/news/draft.mjs --week=2026-W18              # writes briefs
node scripts/news/draft.mjs --week=2026-W18 --dry-run    # print to stdout
```

Writes an idea brief per item to `dist/drafts/<weekIso>-<slug>.md`, plus
`<weekIso>-digest.md` aggregating the week. Briefs are raw material only
(owner decision 2026-08-14: every published post is written by hand).
They carry no velite frontmatter, never land in
`packages/content/content/blog/`, and leave the news_item rows at
`shortlisted`.

Write the real post by hand at `packages/content/content/blog/<slug>.mdx`
(frontmatter per the `posts` schema in `velite.config.ts`; internal lesson
links use `/worlds/...`, enforced by `blog-links.test.ts`). Once the post
is deployed, mark the source rows so the newsletter and social copy can
link it: on `/admin/digest`, each shortlisted item has a "Mark published"
form that takes the post slug (or its URL) and rejects slugs with no built
post. SQL fallback:

```sql
update news_items
set status = 'published', published_blog_slug = '<slug>'
where id in (/* item ids the post covers */);
```

After writing the post:
```bash
pnpm turbo build:content   # picks up new posts
pnpm dev                   # preview /blog and /blog/<slug>
```

### 5. Commit content

```bash
git add packages/content/content/blog/<slug>.mdx
git commit -m "blog: <slug>"
git push   # triggers Vercel deploy
```

### 6. Social copy

```bash
set -a; source apps/api/.env; set +a
export ANTHROPIC_API_KEY=<your-key>
node scripts/news/social.mjs --week=2026-W18
```

Writes `dist/social/<weekIso>.md`. Open, copy each block, paste manually
into X / LinkedIn. UTMs are pre-baked (`utm_source=x|linkedin&utm_campaign=<weekIso>`).

### 7. Newsletter

Dry-run first:
```bash
node scripts/news/send-newsletter.mjs --week=2026-W18 --dry-run
```

Live:
```bash
node scripts/news/send-newsletter.mjs --week=2026-W18
```

Wraps `POST /api/admin/newsletter/send` with `x-admin-key`. Per-recipient
Resend send (each gets own `unsubscribe_token`). Emits `List-Unsubscribe`
headers for one-click unsubscribe in Gmail/Outlook.

Verify recipients:
```sql
select count(*) from waitlist where subscribed = true;
```

### 8. Track conversion

PostHog dashboard cohort:
- Source = `digest_link_clicked` event with `weekIso = "2026-W18"`
- Funnel: `digest_link_clicked → lesson_started → paywall_hit → payment_completed`

UTM params on every internal link: `utm_source ∈ {blog,newsletter,x,linkedin}`,
`utm_medium`, `utm_campaign = <weekIso>`, `utm_content = <postSlug or itemIndex>`.

---

## Common breakages

| Symptom | Cause | Fix |
|---|---|---|
| `frozen-lockfile` build fail in Vercel | Dep added to `package.json` without committing `pnpm-lock.yaml` | `pnpm install`, commit lockfile |
| `/admin/digest` 500 | Web env missing `SUPABASE_SERVICE_ROLE_KEY` | Set in Vercel project env, redeploy |
| Matcher returns 0 candidates for an item | Empty summary + sparse title (e.g. RSS that drops description) | Title-only match, low-score top-3. Curator decides. |
| LLM rerank fails for an item | Rate limit / parse error | Pipeline falls back to deterministic top-3 (`fallbackTopK`). Logs warn, doesn't block. |
| Velite build fails on lesson pattern | Added new top-level dir under `packages/content/content/` | Update `lessons` collection pattern in `velite.config.ts` to allowlist or exclude |
| Blog post body renders as fallback "Error rendering" | MDX compile failure or runtime mismatch | Check `pnpm turbo build:content` output; ensure `body: s.mdx()` ran clean |
| Newsletter send returns 0 sent / 0 failed | List has 0 subscribed rows | Check `waitlist where subscribed=true`. Backfill or wait. |
| Resend 403 / 422 | `From` domain not verified, or `From` local-part on wrong domain | Check `https://resend.com/domains`. Use only verified domain in `NEWSLETTER_FROM`. |
| ArXiv item doesn't match any lesson | Curriculum genuinely doesn't teach the concept | Curator rejects. Don't force a match. |

---

## Content gaps

When the LLM rerank step returns `picks: []` for an item, the matcher sets
`is_content_gap=true` and writes `gap_concept` + `gap_rationale` (curriculum-
placement suggestion). This signals a concept the audience reads about but
Tensorcraft does not yet teach.

Surface: `/admin/digest?status=gap`. Yellow panel on each card replaces the
matched-lessons list and shows the extracted concept + rationale.

How to use it:

- **Backlog source.** Concepts that appear repeatedly across weeks (e.g.
  WebTransport, soft navigations, on-device LoRA) indicate where new lessons
  would have audience pull. Track concept frequency manually for V1; aggregate
  view is V2.
- **Curator workflow.** From the Gaps tab, "Reject" leaves the item out of
  the digest queue but keeps `is_content_gap=true` for future review. There
  is no separate "acknowledge" action — the gap flag persists regardless of
  status, so a rejected gap still appears under `?status=gap`.
- **Detection requires LLM.** Running matcher with `--no-llm` never sets the
  gap flag (deterministic top-3 always populates `matched_lessons`). Re-run
  with the LLM enabled to populate gaps on existing rows.

Example items expected to flag from the first scrape (post LLM rerank):

- *Final Soft Navigations origin trial in Chrome 147* — no lesson teaches
  navigation lifecycle as an ML primitive.
- *Physical Foundation Models* (ArXiv) — paper concerns hardware FMs; we
  teach browser ML, not silicon-level model architecture.
- *ONNX Runtime v1.25* — closest lesson covers ONNX Runtime Web at a high
  level only.

Costs nothing extra: gap detection rides on the existing rerank call.

---

## Cost ceiling (per week, V1 scale)

| Item | Cost |
|---|---|
| GitHub Action runner (~1 min/run, 1 run/wk) | free tier |
| Anthropic Haiku 4.5 — matcher (~16 items) | ~$0.025 |
| Anthropic Sonnet 4.6 — drafts + social (~6 calls) | ~$0.50 |
| Resend (per-recipient send) | $0.001/email free up to 3k/mo |
| Supabase | already on free/pro tier |

Total: **< $1/week** for V1.

---

## Defer / V2

- **Auto-publish without curator review** — revisit after 4 clean weeks.
- **X / LinkedIn auto-post** — manual paste keeps platform risk zero. Switch when volume justifies.
- **Per-item posts** (not just weekly digest) — only after baseline cadence is established.
- **Resend Broadcasts** instead of per-recipient — switch when list > ~10k.
- **Multilingual digests** — keep monolingual until user demand.
- **HF blog title fallback** — re-scrape with HTML body fetch when summary is empty.

---

## Resume from interrupted state

If you stopped mid-week and want to pick up later:

```sql
-- Where am I?
select status, count(*) from news_items where scraped_at > now() - interval '14 days' group by status;
select * from news_items where status='shortlisted' and week_iso='<current>';
```

- All `pending` and no `shortlisted` → restart at step 3 (Curate).
- `shortlisted` items but no MDX in `packages/content/content/blog/<weekIso>-*.mdx` → step 4 (Draft).
- MDX present, `status` still `shortlisted` → draft was dry-run, re-run without `--dry-run` to flip status.
- `published` items, no social file in `dist/social/<weekIso>.md` → step 6.
- Social present, no recipients yet → step 7.
