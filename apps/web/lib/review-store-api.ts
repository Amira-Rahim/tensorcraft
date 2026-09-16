"use client";

import type { ReviewItem, ReviewOutcome } from "@tensorcraft/shared";
import { getApiUrl } from "./api-url";
import { getSupabaseBrowserClient } from "./supabase/client";
import {
  enqueueGuestReviews,
  recordGuestReview,
  getGuestReviews,
  removeGuestReviews,
} from "./review-store-guest";
import { reportDataError } from "./report-data-error";

type Enqueue = {
  kind: "enqueue";
  worldId: string;
  moduleId: string;
  lessonId: string;
  promptIndices: number[];
};
type RecordReview = {
  kind: "record";
  item: ReviewItem;
  outcome: ReviewOutcome;
};
type Operation = (Enqueue | RecordReview) & {
  id: string;
  userId: string | null;
  at: string;
};
const OUTBOX = "tc_review_outbox_v1";

function readOutbox(): Operation[] {
  try {
    const value = JSON.parse(localStorage.getItem(OUTBOX) ?? "[]");
    return Array.isArray(value)
      ? value.filter(
          (op) =>
            op &&
            typeof op.id === "string" &&
            (op.kind === "enqueue" || op.kind === "record") &&
            typeof op.at === "string",
        )
      : [];
  } catch {
    return [];
  }
}
function writeOutbox(operations: Operation[]): void {
  try {
    localStorage.setItem(OUTBOX, JSON.stringify(operations));
  } catch {
    reportDataError("review.outbox.write", {
      message: "Could not save pending reviews",
    });
  }
}

async function send(operation: Operation): Promise<void> {
  if (!operation.userId) {
    const ok =
      operation.kind === "enqueue"
        ? enqueueGuestReviews(
            operation.worldId,
            operation.moduleId,
            operation.lessonId,
            operation.promptIndices,
            new Date(operation.at),
          )
        : recordGuestReview(
            operation.item.worldId,
            operation.item.moduleId,
            operation.item.lessonId,
            operation.item.promptIndex,
            operation.outcome,
            new Date(operation.at),
          );
    if (!ok) throw new Error("Guest review write failed");
    return;
  }
  const {
    data: { session },
  } = await getSupabaseBrowserClient().auth.getSession();
  // An outbox belongs to its original account, even on a shared browser.
  if (!session || session.user.id !== operation.userId)
    throw new Error("Review account is not signed in");
  const body =
    operation.kind === "enqueue"
      ? {
          worldId: operation.worldId,
          moduleId: operation.moduleId,
          lessonId: operation.lessonId,
          promptIndices: operation.promptIndices,
        }
      : {
          worldId: operation.item.worldId,
          lessonId: operation.item.lessonId,
          promptIndex: operation.item.promptIndex,
          outcome: operation.outcome,
          expectedLastReviewedAt: operation.item.lastReviewedAt,
        };
  const response = await fetch(
    `${getApiUrl()}/api/review${operation.kind === "enqueue" ? "/enqueue" : ""}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    // Invalid/deleted keys will never succeed on retry. Report and discard.
    if ([400, 403, 404].includes(response.status)) {
      reportDataError("review.write.rejected", {
        message: `Review request rejected (${response.status})`,
      });
      return;
    }
    throw new Error(`Review request failed (${response.status})`);
  }
}

async function save(operation: Operation): Promise<void> {
  try {
    await send(operation);
  } catch {
    writeOutbox([...readOutbox(), operation]);
    reportDataError("review.write", {
      message: "Review save failed; queued for retry",
    });
  }
}

export function enqueueReviews(
  userId: string | null,
  worldId: string,
  moduleId: string,
  lessonId: string,
  promptIndices: number[],
): Promise<void> {
  if (!promptIndices.length) return Promise.resolve();
  return save({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    userId,
    kind: "enqueue",
    worldId,
    moduleId,
    lessonId,
    promptIndices,
  });
}
export function recordReview(
  userId: string | null,
  item: ReviewItem,
  outcome: ReviewOutcome,
): Promise<void> {
  return save({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    userId,
    kind: "record",
    // The caller holds a ResolvedReviewItem. Persist keys and schedule only,
    // never the resolved question/answer that structural typing permits.
    item: {
      worldId: item.worldId,
      moduleId: item.moduleId,
      lessonId: item.lessonId,
      promptIndex: item.promptIndex,
      pulls: item.pulls,
      successes: item.successes,
      lastReviewedAt: item.lastReviewedAt,
      nextReviewAt: item.nextReviewAt,
    },
    outcome,
  });
}

let flushing: Promise<void> | undefined;
export function flushReviewOutbox(): Promise<void> {
  if (flushing) return flushing;
  flushing = (async () => {
    const pending = readOutbox();
    if (!pending.length) return;
    const {
      data: { session },
    } = await getSupabaseBrowserClient().auth.getSession();
    for (const operation of pending) {
      if (operation.userId && operation.userId !== session?.user.id) continue;
      try {
        await send(operation);
        writeOutbox(readOutbox().filter((op) => op.id !== operation.id));
      } catch {
        reportDataError("review.outbox.retry", {
          message: "Pending review retry failed",
        });
      }
    }
  })()
    .catch(() => {
      reportDataError("review.outbox.retry", {
        message: "Could not retry pending reviews",
      });
    })
    .finally(() => {
      flushing = undefined;
    });
  return flushing;
}

export async function mergeGuestReviews(userId: string): Promise<boolean> {
  const items = getGuestReviews();
  if (!items.length) return false;
  try {
    const { error } = await getSupabaseBrowserClient()
      .from("review_queue")
      .upsert(
        items.map((item) => ({
          user_id: userId,
          world_id: item.worldId,
          module_id: item.moduleId,
          lesson_id: item.lessonId,
          prompt_index: item.promptIndex,
          pulls: item.pulls,
          successes: item.successes,
          last_reviewed_at: item.lastReviewedAt,
          next_review_at: item.nextReviewAt,
        })),
        {
          onConflict: "user_id,world_id,lesson_id,prompt_index",
          ignoreDuplicates: true,
        },
      );
    if (error) {
      reportDataError("review.guest.merge", error);
      return false;
    }
    removeGuestReviews(items);
    return true;
  } catch {
    reportDataError("review.guest.merge", {
      message: "Could not migrate guest reviews",
    });
    return false;
  }
}
