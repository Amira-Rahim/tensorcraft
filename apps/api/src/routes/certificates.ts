import { Hono } from "hono";
import { createHash } from "node:crypto";
import {
  getSupabaseServerClient,
  getSupabaseAdminClient,
} from "@tensorcraft/supabase";
import {
  isValidWorldSlug,
  isLaunched,
  getWorldTotalLessons,
} from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import { logger } from "../lib/logger";
import type { AppEnv } from "../types";

/**
 * Completion certificates.
 *
 * POST /api/certificates   , auth, issues a certificate (idempotent).
 * GET  /api/certificates/:id, public, minimal fields for share page.
 *
 * The `cert_hash` is a deterministic SHA-256 of
 *   `${user_id}:${world_id}:${issued_at_iso}:${CERT_SIGNING_SECRET}`
 * so the share page can verify authenticity without exposing the user
 * UUID. `CERT_SIGNING_SECRET` acts as a server-side salt, rotating it
 * invalidates every previously-issued hash, so treat it like a secret.
 */
const certificates = new Hono<AppEnv>();

function computeCertHash(
  userId: string,
  worldId: string,
  issuedAt: string,
  secret: string,
): string {
  return createHash("sha256")
    .update(`${userId}:${worldId}:${issuedAt}:${secret}`)
    .digest("hex");
}

// ──────────────────────────────────────────────────────────────
// POST /api/certificates, issue (or return existing) certificate
// ──────────────────────────────────────────────────────────────

certificates.use("/", authMiddleware);
certificates.post("/", async (c) => {
  const userId = c.get("userId");
  const accessToken = c.get("accessToken");

  let body: { worldId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const worldId = body.worldId;
  if (!worldId || typeof worldId !== "string" || !isValidWorldSlug(worldId)) {
    return c.json({ error: "worldId must be a valid world slug" }, 400);
  }
  if (!isLaunched(worldId)) {
    return c.json({ error: "World is not yet launched" }, 400);
  }

  const secret = process.env.CERT_SIGNING_SECRET;
  if (!secret) {
    logger.error(
      { route: "certificates.issue" },
      "CERT_SIGNING_SECRET is not set, refusing to issue a certificate",
    );
    return c.json(
      {
        error: "Certificate signing is not configured on this server",
      },
      500,
    );
  }

  // Check user's progress for this world via the user-scoped client so
  // RLS is exercised (service-role client is reserved for the INSERT).
  const userClient = getSupabaseServerClient(accessToken);

  // The certificate is a PAID deliverable: every marketing surface sells it
  // behind the wall. Progress alone cannot gate it, because world_progress
  // is client-writable by design (the lesson page records completions
  // directly), so any authenticated user could write 56 "completed" rows
  // and self-issue. Require a purchase whose world_ids contain this world
  // and whose status still grants access (audit run #7, 2026-07-16).
  const { data: entitlements, error: entitlementErr } = await userClient
    .from("purchases")
    .select("world_ids, status")
    .eq("user_id", userId)
    .in("status", ["completed", "partially_refunded"]);

  if (entitlementErr) {
    return c.json(
      {
        error: "Failed to read purchases",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  const ownsWorld = (entitlements ?? []).some(
    (p: { world_ids: string[] | null }) =>
      Array.isArray(p.world_ids) && p.world_ids.includes(worldId),
  );

  if (!ownsWorld) {
    return c.json({ error: "world_not_purchased" }, 403);
  }

  const { data: progressRows, error: progressErr } = await userClient
    .from("world_progress")
    .select("status")
    .eq("user_id", userId)
    .eq("world_id", worldId);

  if (progressErr) {
    return c.json(
      {
        error: "Failed to read progress",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  const rows = (progressRows ?? []) as Array<{ status: string }>;
  const completed = rows.filter((r) => r.status === "completed").length;
  const expected = getWorldTotalLessons(worldId);

  // World must be fully completed. We check against the canonical
  // expected lesson count rather than comparing `completed === total`
  // because a user might never have seeded "not_started" rows.
  if (completed < expected) {
    return c.json(
      {
        error: "world_not_complete",
        completed,
        expected,
      },
      403,
    );
  }

  // Idempotent: if a row already exists for this (user, world), return it.
  const admin = getSupabaseAdminClient();
  const { data: existing, error: existingErr } = await admin
    .from("certificates")
    .select("id, world_id, issued_at, cert_hash")
    .eq("user_id", userId)
    .eq("world_id", worldId)
    .maybeSingle();

  if (existingErr) {
    return c.json(
      {
        error: "Failed to read certificates",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  if (existing) {
    return c.json({
      id: existing.id,
      world_id: existing.world_id,
      issued_at: existing.issued_at,
      cert_hash: existing.cert_hash,
    });
  }

  const issuedAt = new Date().toISOString();
  const certHash = computeCertHash(userId, worldId, issuedAt, secret);

  const { data: inserted, error: insertErr } = await admin
    .from("certificates")
    .insert({
      user_id: userId,
      world_id: worldId,
      issued_at: issuedAt,
      cert_hash: certHash,
    })
    .select("id, world_id, issued_at, cert_hash")
    .single();

  if (insertErr || !inserted) {
    return c.json(
      {
        error: "Failed to issue certificate",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({
    id: inserted.id,
    world_id: inserted.world_id,
    issued_at: inserted.issued_at,
    cert_hash: inserted.cert_hash,
  });
});

// ──────────────────────────────────────────────────────────────
// GET /api/certificates/:id, public share page endpoint
// ──────────────────────────────────────────────────────────────
//
// Intentionally NOT behind authMiddleware. Uses the public
// `get_shared_certificate` SECURITY DEFINER function (see migration
// 019) to expose the minimum fields a share page needs.

certificates.get("/:id", async (c) => {
  const id = c.req.param("id");
  // Basic UUID shape check to avoid blowing up the RPC call with
  // obviously-invalid input.
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    return c.json({ error: "Invalid certificate id" }, 400);
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("get_shared_certificate", {
    p_id: id,
  });

  if (error) {
    return c.json(
      {
        error: "Failed to read certificate",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  const rows = (data ?? []) as Array<{
    id: string;
    world_id: string;
    issued_at: string;
    cert_hash: string;
    user_display_name: string | null;
    user_avatar_url: string | null;
  }>;

  if (rows.length === 0) {
    return c.json({ error: "Certificate not found" }, 404);
  }

  const row = rows[0];
  return c.json({
    id: row.id,
    world_id: row.world_id,
    issued_at: row.issued_at,
    cert_hash: row.cert_hash,
    user_display_name: row.user_display_name,
    user_avatar_url: row.user_avatar_url,
  });
});

export { certificates };
