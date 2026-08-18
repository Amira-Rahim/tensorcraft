#!/usr/bin/env node
/**
 * One-off backfill for the 2026-08 rebrand (owner decision 2026-08-18).
 *
 * ensureWorldRepo() only writes the README template when a learner repo is
 * first created, so repos provisioned before the rebrand still carry the
 * old attribution line. This script rewrites exactly that line in each
 * connected learner's tensorcraft-<world> repos.
 *
 * It pushes a commit into learners' personal repositories. Run it
 * deliberately, once, after reviewing the dry-run output.
 *
 * Usage:
 *   node scripts/one-off/backfill-learner-readmes.mjs           # dry run
 *   node scripts/one-off/backfill-learner-readmes.mjs --apply   # write
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (same values the API uses).
 *
 * Behavior per (user, world) pair:
 *   - skips users without github_connected or without a stored token
 *   - skips repos that do not exist (404) or READMEs without the old line
 *   - expired tokens are reported and skipped, never retried
 */

const OLD_LINE =
  "an interactive, story-driven platform teaching frontend engineers browser-based ML.";
const NEW_LINE =
  "an interactive, story-driven platform teaching JavaScript engineers ML with TensorFlow.js.";
const WORLDS = [
  "deep-orbit",
  "neon-protocol",
  "signal-ward",
  "nova-canvas",
  "terra-grid",
];
const GITHUB_API = "https://api.github.com";
const APPLY = process.argv.includes("--apply");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function fetchConnectedProfiles() {
  const url = `${SUPABASE_URL}/rest/v1/profiles?github_connected=eq.true&select=id,github_username,github_token`;
  const res = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`profiles query failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function getReadme(token, owner, repo) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/README.md`,
    { headers: ghHeaders(token) },
  );
  if (res.status === 404) return null;
  if (res.status === 401 || res.status === 403) {
    throw Object.assign(new Error("token rejected"), { tokenDead: true });
  }
  if (!res.ok) throw new Error(`getReadme ${res.status}`);
  const data = await res.json();
  return {
    sha: data.sha,
    content: Buffer.from(data.content, "base64").toString("utf-8"),
  };
}

async function putReadme(token, owner, repo, content, sha) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/README.md`,
    {
      method: "PUT",
      headers: ghHeaders(token),
      body: JSON.stringify({
        message: "docs: update Tensorcraft attribution (2026-08 rebrand)",
        content: Buffer.from(content).toString("base64"),
        sha,
      }),
    },
  );
  if (!res.ok) throw new Error(`putReadme ${res.status} ${await res.text()}`);
}

const profiles = await fetchConnectedProfiles();
console.log(
  `${profiles.length} connected profile(s). Mode: ${APPLY ? "APPLY" : "dry run"}`,
);

let updated = 0;
let skipped = 0;
let deadTokens = 0;

for (const p of profiles) {
  if (!p.github_token || !p.github_username) {
    skipped++;
    continue;
  }
  for (const world of WORLDS) {
    const repo = `tensorcraft-${world}`;
    try {
      const readme = await getReadme(p.github_token, p.github_username, repo);
      if (!readme) continue;
      if (!readme.content.includes(OLD_LINE)) continue;
      const next = readme.content.replace(OLD_LINE, NEW_LINE);
      if (APPLY) {
        await putReadme(
          p.github_token,
          p.github_username,
          repo,
          next,
          readme.sha,
        );
        console.log(`updated ${p.github_username}/${repo}`);
      } else {
        console.log(`would update ${p.github_username}/${repo}`);
      }
      updated++;
    } catch (err) {
      if (err.tokenDead) {
        console.warn(`token expired for ${p.github_username}; skipping user`);
        deadTokens++;
        break;
      }
      console.warn(`${p.github_username}/${repo}: ${err.message}`);
    }
  }
}

console.log(
  `${APPLY ? "Updated" : "Would update"} ${updated} repo(s); ${skipped} profile(s) without token; ${deadTokens} expired token(s).`,
);
