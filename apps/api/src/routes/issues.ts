// apps/api/src/routes/issues.ts
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import {
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@tensorcraft/supabase";
import { getRedis } from "../lib/redis";
import { sendIssueNotification } from "../lib/email";
import { captureException } from "../lib/error-tracking";
import type { AppEnv } from "../types";

const VALID_CATEGORIES = [
  "bug",
  "feature_request",
  "content_issue",
  "payment_problem",
  "other",
] as const;
const VALID_SEVERITIES = ["low", "medium", "high", "critical"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5 MB

export const issues = new Hono<AppEnv>();

// Route-specific body limit: 8MB to allow 5MB screenshots + form overhead
issues.use("*", bodyLimit({ maxSize: 8 * 1024 * 1024 }));

// Route-specific rate limit: 5 per minute per IP (stricter than global 120/min)
const ISSUE_RATE_LIMIT = 5;
const ISSUE_RATE_WINDOW = 60_000;

issues.use("*", async (c, next) => {
  const ip =
    c.req.header("cf-connecting-ip") ||
    (c.req.header("x-forwarded-for") || "").split(",").pop()?.trim() ||
    "unknown";

  try {
    const redis = getRedis();
    const key = `rl:issues:${ip}`;
    const now = Date.now();

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, now - ISSUE_RATE_WINDOW);
    pipeline.zadd(key, { score: now, member: `${now}:${Math.random()}` });
    pipeline.zcard(key);
    pipeline.expire(key, 120);

    const results = await pipeline.exec();
    const count = results[2] as number;

    if (count > ISSUE_RATE_LIMIT) {
      c.header("Retry-After", "60");
      return c.json(
        { error: "Too many reports. Please try again later." },
        429,
      );
    }
  } catch {
    // Graceful degradation, allow request if Redis is unavailable
  }

  return next();
});

issues.post("/", async (c) => {
  // --- Parse multipart form ---
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "Invalid form data" }, 400);
  }

  const category = formData.get("category") as string | null;
  const description = formData.get("description") as string | null;
  const severity = formData.get("severity") as string | null;
  const emailField = formData.get("email") as string | null;
  const contextRaw = formData.get("context") as string | null;
  const screenshot = formData.get("screenshot") as File | null;

  // --- Resolve user identity (optional auth) ---
  let userId: string | null = null;
  let userEmail: string | null = null;

  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token) {
      try {
        const supabase = getSupabaseServerClient(token);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          userEmail = user.email ?? null;
        }
      } catch {
        // Non-fatal, treat as anonymous
      }
    }
  }

  const email = userEmail || emailField;

  // --- Validate fields ---
  if (
    !category ||
    !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])
  ) {
    return c.json({ error: "Invalid or missing category" }, 400);
  }

  if (!description || description.length < 10 || description.length > 2000) {
    return c.json(
      { error: "Description must be between 10 and 2000 characters" },
      400,
    );
  }

  if (
    !severity ||
    !VALID_SEVERITIES.includes(severity as (typeof VALID_SEVERITIES)[number])
  ) {
    return c.json({ error: "Invalid or missing severity" }, 400);
  }

  if (!userId && (!email || !EMAIL_REGEX.test(email))) {
    return c.json({ error: "Valid email is required" }, 400);
  }

  if (!contextRaw) {
    return c.json({ error: "Context is required" }, 400);
  }

  let context: { url?: string; userAgent?: string; viewport?: unknown };
  try {
    context = JSON.parse(contextRaw);
  } catch {
    return c.json({ error: "Invalid context JSON" }, 400);
  }

  // --- Screenshot upload ---
  let screenshotUrl: string | null = null;

  if (screenshot && screenshot.size > 0) {
    if (screenshot.size > MAX_SCREENSHOT_SIZE) {
      return c.json({ error: "Screenshot exceeds 5MB limit" }, 413);
    }

    if (!screenshot.type.startsWith("image/")) {
      return c.json({ error: "Screenshot must be an image" }, 400);
    }

    const supabase = getSupabaseAdminClient();
    const ext = screenshot.name.split(".").pop() || "png";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = await screenshot.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("issue-screenshots")
      .upload(path, buffer, { contentType: screenshot.type });

    if (uploadError) {
      captureException(uploadError, { source: "issues.screenshot-upload" });
      // Continue without screenshot, non-fatal
    } else {
      const {
        data: { publicUrl },
      } = supabase.storage.from("issue-screenshots").getPublicUrl(path);
      screenshotUrl = publicUrl;
    }
  }

  // --- Insert into database ---
  const supabase = getSupabaseAdminClient();

  const { data, error: dbError } = await supabase
    .from("issues")
    .insert({
      user_id: userId,
      category,
      description,
      severity,
      email,
      screenshot_url: screenshotUrl,
      page_url: context.url ?? "",
      user_agent: context.userAgent ?? "",
      viewport: (context.viewport as Record<string, unknown>) ?? null,
    })
    .select()
    .single();

  if (dbError) {
    captureException(dbError, { source: "issues.insert" });
    return c.json(
      {
        error: "Failed to submit issue",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  // --- Non-blocking email notification ---
  sendIssueNotification({
    id: data.id,
    category,
    severity,
    description,
    email: email || "",
    pageUrl: context.url ?? "",
    screenshotUrl,
  }).catch((err) => {
    captureException(err, { source: "issues.email" });
  });

  return c.json({ id: data.id, message: "Issue reported successfully" }, 201);
});
