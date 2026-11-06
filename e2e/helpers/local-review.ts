import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page, type Response } from "@playwright/test";

export const REVIEW_APP_URL = "http://localhost:3100";
export const REVIEW_SUPABASE_URL = "http://127.0.0.1:56321";
export const REVIEW_INBOX_URL = "http://127.0.0.1:56324";
export const REVIEW_ACCOUNTS = {
  alex: {
    id: "00000000-0000-0000-0000-000000000001",
    email: "alex@example.test",
  },
  jordan: {
    id: "00000000-0000-0000-0000-000000000002",
    email: "jordan@example.test",
  },
  sam: {
    id: "00000000-0000-0000-0000-000000000003",
    email: "sam@example.test",
  },
} as const;
type ReviewAccount = keyof typeof REVIEW_ACCOUNTS;
const exec = promisify(execFile);

/** Refuse auth and fixture access under a parallel or recording-enabled runner. */
function assertSafeReviewConfig() {
  let info;
  try {
    info = test.info();
  } catch {
    throw new Error(
      "Local review helpers require the dedicated Playwright runner.",
    );
  }
  const { config, project } = info;
  if (
    config.configFile !== resolve("e2e/signed-in-results.config.ts") ||
    config.workers !== 1 ||
    config.fullyParallel ||
    project.use.baseURL !== REVIEW_APP_URL ||
    project.use.trace !== "off" ||
    project.use.video !== "off" ||
    project.use.screenshot !== "off"
  ) {
    throw new Error(
      "Use signed-in-results.config.ts on localhost:3100 with one worker and trace, video, and automatic screenshots off.",
    );
  }
}

function localUrl(input: string, origin: string) {
  const url = new URL(input, origin);
  if (url.origin !== origin || url.username || url.password) {
    throw new Error("Review refused a request outside its local service.");
  }
  return url;
}

async function inboxJson(path: string): Promise<unknown> {
  try {
    const response = await fetch(localUrl(path, REVIEW_INBOX_URL), {
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error();
    return await response.json();
  } catch {
    throw new Error("The isolated review inbox is unavailable.");
  }
}

type MailSummary = { ID: string; To?: { Address?: string }[] };
async function messages(): Promise<MailSummary[]> {
  const result = await inboxJson("/api/v1/messages?limit=100");
  if (
    !result ||
    typeof result !== "object" ||
    !("messages" in result) ||
    !Array.isArray(result.messages)
  ) {
    throw new Error("The review inbox did not return a message list.");
  }
  return result.messages.filter(
    (message): message is MailSummary =>
      message !== null &&
      typeof message === "object" &&
      typeof message.ID === "string",
  );
}

export async function assertLocalReviewReady() {
  assertSafeReviewConfig();
  try {
    const response = await fetch(`${REVIEW_APP_URL}/auth`, {
      redirect: "error",
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) throw new Error();
    await messages();
  } catch {
    throw new Error(
      "Start the isolated localhost review app and Supabase stack before this test.",
    );
  }
}

/** Use the actual email UI and PKCE callback. Tokens stay in process memory. */
export async function loginReviewAccount(
  page: Page,
  account: ReviewAccount,
  redirectTo = "/dashboard",
) {
  assertSafeReviewConfig();
  if (!Object.hasOwn(REVIEW_ACCOUNTS, account))
    throw new Error("Unknown review account.");
  const destination = localUrl(redirectTo, REVIEW_APP_URL);
  if (
    !redirectTo.startsWith("/") ||
    redirectTo.startsWith("//") ||
    destination.search ||
    destination.hash
  ) {
    throw new Error(
      "Review sign-in requires a local path without query parameters.",
    );
  }
  const email = REVIEW_ACCOUNTS[account].email;
  const before = new Set((await messages()).map((message) => message.ID));
  // An incorrectly configured local frontend must not send the fixture address
  // to a hosted auth service. Other app assets remain under the caller's policy.
  await page.route("**/auth/v1/**", async (route) => {
    if (new URL(route.request().url()).origin !== REVIEW_SUPABASE_URL) {
      await route.abort("blockedbyclient");
    } else await route.continue();
  });
  await page.goto(
    `${REVIEW_APP_URL}/auth?redirectTo=${encodeURIComponent(redirectTo)}`,
  );
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page
    .getByRole("button", { name: "Send magic link", exact: true })
    .click();
  let messageId: string | undefined;
  await expect
    .poll(
      async () => {
        const message = (await messages()).find(
          (item) =>
            !before.has(item.ID) &&
            item.To?.some(
              (recipient) => recipient.Address?.toLowerCase() === email,
            ),
        );
        messageId = message?.ID;
        return Boolean(messageId);
      },
      {
        timeout: 30_000,
        message: "A fresh sign-in message reaches the local inbox",
      },
    )
    .toBe(true);
  const message = await inboxJson(
    `/api/v1/message/${encodeURIComponent(messageId!)}`,
  );
  if (!message || typeof message !== "object")
    throw new Error("The local sign-in message is unavailable.");
  const html =
    "HTML" in message && typeof message.HTML === "string" ? message.HTML : "";
  const links = [...html.matchAll(/href=["']([^"']+)["']/g)].map((match) =>
    match[1]!.replaceAll("&amp;", "&"),
  );
  const verify = links
    .map((link) => {
      try {
        return new URL(link);
      } catch {
        return null;
      }
    })
    .find(
      (url) =>
        url?.origin === REVIEW_SUPABASE_URL &&
        url.pathname === "/auth/v1/verify",
    );
  if (!verify || verify.username || verify.password)
    throw new Error("The local email has no supported sign-in link.");
  const callback = localUrl(
    verify.searchParams.get("redirect_to") ?? "",
    REVIEW_APP_URL,
  );
  if (callback.pathname !== "/auth/callback")
    throw new Error("The local email has an unexpected callback.");
  let authenticatedAsFixture = false;
  const verifyIdentity = async (response: Response) => {
    const url = new URL(response.url());
    if (
      url.origin !== REVIEW_SUPABASE_URL ||
      url.pathname !== "/auth/v1/user" ||
      response.status() !== 200
    )
      return;
    try {
      const user = await response.json();
      authenticatedAsFixture =
        user.id === REVIEW_ACCOUNTS[account].id && user.email === email;
    } catch {
      /* A failed identity response cannot establish sign-in. */
    }
  };
  page.on("response", verifyIdentity);
  try {
    await page.goto(verify.href);
    await page.waitForURL(
      (url) =>
        url.origin === REVIEW_APP_URL && url.pathname === destination.pathname,
      { timeout: 90_000 },
    );
    await expect
      .poll(() => authenticatedAsFixture, {
        timeout: 30_000,
        message: "Local auth confirms the expected fictional review account",
      })
      .toBe(true);
  } catch {
    // Never propagate Playwright's token-bearing goto call log.
    // A failure snapshot must not retain an auth callback URL or response.
    await page.goto("about:blank").catch(() => {});
    throw new Error(
      "The local sign-in callback did not reach the requested page.",
    );
  } finally {
    page.off("response", verifyIdentity);
  }
}

async function localAlexClient() {
  assertSafeReviewConfig();
  const socket =
    process.env.TENSORCRAFT_REVIEW_DOCKER_HOST ?? "unix:///var/run/docker.sock";
  const parsedSocket = new URL(socket);
  if (
    parsedSocket.protocol !== "unix:" ||
    parsedSocket.hostname ||
    parsedSocket.search ||
    parsedSocket.hash ||
    !parsedSocket.pathname.endsWith("/docker.sock")
  ) {
    throw new Error("Review requires an explicit local Docker socket.");
  }
  let status: { API_URL?: string; SERVICE_ROLE_KEY?: string };
  try {
    const { stdout } = await exec(
      "supabase",
      ["status", "--workdir", resolve(".review"), "-o", "json"],
      {
        env: {
          NODE_ENV: "development",
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          DOCKER_HOST: socket,
        },
        maxBuffer: 1024 * 1024,
      },
    );
    status = JSON.parse(stdout);
  } catch {
    throw new Error(
      "The dedicated local Supabase status is unavailable. Check the review Docker socket.",
    );
  }
  if (status.API_URL !== REVIEW_SUPABASE_URL || !status.SERVICE_ROLE_KEY)
    throw new Error(
      "Fixture setup requires the dedicated local review database.",
    );
  const client = createClient(REVIEW_SUPABASE_URL, status.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const url = localUrl(
          typeof input === "string" || input instanceof URL
            ? String(input)
            : input.url,
          REVIEW_SUPABASE_URL,
        );
        return fetch(url, { ...init, redirect: "error" });
      },
    },
  });
  const { data, error } = await client.auth.admin.getUserById(
    REVIEW_ACCOUNTS.alex.id,
  );
  if (error || data.user?.email !== REVIEW_ACCOUNTS.alex.email)
    throw new Error(
      "The Alex review fixture is missing or has changed identity.",
    );
  return client;
}

/** Complete only Alex's local prerequisite rows. No assessment score is fabricated. */
export async function completeAlexModule(
  moduleId: "foundations" | "neural-networks",
) {
  if (!["foundations", "neural-networks"].includes(moduleId))
    throw new Error("Unsupported review prerequisite module.");
  const client = await localAlexClient();
  const directory = resolve("packages/content/content/deep-orbit", moduleId);
  const files = (await readdir(directory)).filter((name) =>
    name.endsWith(".mdx"),
  );
  for (const filename of files) {
    const source = await readFile(resolve(directory, filename), "utf8");
    const lessonId = source.match(/^slug:\s*["']?([a-z0-9-]+)/m)?.[1];
    if (!lessonId)
      throw new Error("A review prerequisite source has no lesson slug.");
    const { data, error } = await client
      .from("world_progress")
      .select("id")
      .eq("user_id", REVIEW_ACCOUNTS.alex.id)
      .eq("world_id", "deep-orbit")
      .eq("lesson_id", lessonId)
      .maybeSingle();
    if (error)
      throw new Error("Could not read Alex's local prerequisite progress.");
    const values = {
      status: "completed",
      completed_at: new Date().toISOString(),
    };
    const result = data
      ? await client
          .from("world_progress")
          .update(values)
          .eq("id", data.id)
          .eq("user_id", REVIEW_ACCOUNTS.alex.id)
      : await client.from("world_progress").insert({
          user_id: REVIEW_ACCOUNTS.alex.id,
          world_id: "deep-orbit",
          module_id: moduleId,
          lesson_id: lessonId,
          ...values,
        });
    if (result.error)
      throw new Error("Could not set Alex's local prerequisite progress.");
  }
}

const PILOTS = {
  normalization: "foundations",
  "building-a-network": "neural-networks",
  "evaluating-deep-scan": "training-loop",
} as const;

/** Reset only one mock Alex pilot's progress and exercise attempts for a fresh walk. */
export async function resetAlexLesson(lessonId: keyof typeof PILOTS) {
  if (!Object.hasOwn(PILOTS, lessonId))
    throw new Error("Unsupported local review lesson.");
  const client = await localAlexClient();
  const removed = await client
    .from("exercise_attempts")
    .delete()
    .eq("user_id", REVIEW_ACCOUNTS.alex.id)
    .eq("world_id", "deep-orbit")
    .eq("lesson_id", lessonId);
  if (removed.error)
    throw new Error("Could not reset Alex's local exercise attempts.");
  const { error } = await client.from("world_progress").upsert(
    {
      user_id: REVIEW_ACCOUNTS.alex.id,
      world_id: "deep-orbit",
      module_id: PILOTS[lessonId],
      lesson_id: lessonId,
      status: "in_progress",
      score: null,
      hints_used: 0,
      attempts: 0,
      started_at: new Date().toISOString(),
      completed_at: null,
    },
    { onConflict: "user_id,world_id,lesson_id" },
  );
  if (error) throw new Error("Could not reset Alex's local pilot progress.");
}
