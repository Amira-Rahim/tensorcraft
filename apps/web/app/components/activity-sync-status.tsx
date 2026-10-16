"use client";
import { useEffect, useRef, useState } from "react";
import {
  activityEvidenceLabel,
  LEARNING_ACTIVITIES,
  type ActivityPhase,
  type ActivitySnapshot,
  type ActivitySummary,
  type LearningActivityId,
} from "@tensorcraft/shared";
import { readActivities, saveActivity } from "@/lib/learning-activity-client";
import { useActivityUser } from "./learning-activity-scope";

export interface LocalActivityRecord {
  phase: ActivityPhase;
  count: number;
  first: ActivitySnapshot["first"];
  latest: ActivitySnapshot["latest"];
  assistance: boolean;
}
interface SyncMeta {
  streamId: string;
  completed: Partial<Record<ActivityPhase, string>>;
}
const memoryMeta = new Map<string, SyncMeta>();
const volatileMeta = new Set<string>();
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function loadMeta(key: string): SyncMeta {
  const known = memoryMeta.get(key);
  if (known && volatileMeta.has(key)) return known;
  try {
    const raw = sessionStorage.getItem(`${key}:sync`);
    if (raw && raw.length < 1000) {
      const parsed = JSON.parse(raw) as SyncMeta;
      if (
        uuid.test(parsed.streamId) &&
        parsed.completed &&
        Object.values(parsed.completed).every(
          (t) => typeof t === "string" && Number.isFinite(Date.parse(t)),
        )
      ) {
        memoryMeta.set(key, parsed);
        return parsed;
      }
    }
  } catch {
    if (known) return known;
  }
  const meta = { streamId: crypto.randomUUID(), completed: {} };
  if (memoryMeta.size >= 128) {
    const oldest = memoryMeta.keys().next().value!;
    memoryMeta.delete(oldest);
    volatileMeta.delete(oldest);
  }
  memoryMeta.set(key, meta);
  try {
    sessionStorage.setItem(`${key}:sync`, JSON.stringify(meta));
  } catch {
    volatileMeta.add(key);
  }
  return meta;
}
export function ActivitySyncStatus({
  activityId,
  storageKey,
  guestKey,
  ready,
  records,
  readGuest,
}: {
  activityId: LearningActivityId;
  storageKey: string;
  guestKey: string;
  ready: boolean;
  records: LocalActivityRecord[];
  readGuest: (raw: string) => LocalActivityRecord[];
}) {
  const userId = useActivityUser(),
    signature = JSON.stringify(records);
  const contentVersion = LEARNING_ACTIVITIES[activityId].version;
  const meta = useRef<SyncMeta | null>(null);
  const [retry, setRetry] = useState(0),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]),
    [guestAvailable, setGuestAvailable] = useState(false);
  const [importing, setImporting] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (!meta.current) meta.current = loadMeta(storageKey);
    const rows: LocalActivityRecord[] = JSON.parse(signature);
    for (const r of rows)
      if (r.latest?.correct && !meta.current.completed[r.phase])
        meta.current.completed[r.phase] = new Date().toISOString();
    try {
      sessionStorage.setItem(
        `${storageKey}:sync`,
        JSON.stringify(meta.current),
      );
    } catch {
      /* in-memory retry identity */
    }
    if (!userId) return;
    try {
      setGuestAvailable(sessionStorage.getItem(guestKey) !== null);
    } catch {
      setGuestAvailable(false);
    }
    let cancelled = false;
    const syncMeta = meta.current;
    const timer = setTimeout(async () => {
      setStatus("Saving account summary…");
      setError("");
      try {
        for (const r of rows.filter((r) => r.count > 0 || r.assistance)) {
          if (cancelled) return;
          await saveActivity(userId, {
            activityId,
            version: contentVersion,
            phase: r.phase,
            streamId: syncMeta.streamId,
            count: r.count,
            first: r.first,
            latest: r.latest,
            assistance: r.assistance,
            completedAt: syncMeta.completed[r.phase] ?? null,
          });
        }
        const remote = await readActivities(userId, activityId);
        if (!cancelled) {
          setSummaries(remote);
          setStatus("Account summary saved.");
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Practice sync failed. Retry when connected.",
          );
          setStatus("");
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    activityId,
    contentVersion,
    guestKey,
    ready,
    retry,
    signature,
    storageKey,
    userId,
  ]);
  async function importGuest() {
    if (!userId || importing) return;
    setImporting(true);
    setError("");
    try {
      const raw = sessionStorage.getItem(guestKey);
      if (!raw) throw new Error("No guest draft is available in this tab.");
      const rows = readGuest(raw),
        guestMeta = loadMeta(guestKey);
      for (const r of rows.filter((r) => r.count > 0 || r.assistance))
        await saveActivity(userId, {
          activityId,
          version: contentVersion,
          phase: r.phase,
          streamId: guestMeta.streamId,
          count: r.count,
          first: r.first,
          latest: r.latest,
          assistance: r.assistance,
          completedAt: guestMeta.completed[r.phase] ?? null,
        });
      const remote = await readActivities(userId, activityId);
      if (active.current) {
        setStatus(
          "Guest summary imported. Existing account first attempts are preserved.",
        );
        setGuestAvailable(false);
        setSummaries(remote);
      }
    } catch (e) {
      if (active.current)
        setError(e instanceof Error ? e.message : "Guest import failed.");
    } finally {
      if (active.current) setImporting(false);
    }
  }
  if (!userId)
    return (
      <p className="mt-4 text-sm text-text-muted">
        This tab keeps the practice record. Sign in to save a summary across
        devices. Answers stay in this browser.
      </p>
    );
  return (
    <div className="mt-4 space-y-2 border border-border p-3 text-sm">
      <p role="status" aria-live="polite">
        {error || status}
      </p>
      {error && (
        <button
          type="button"
          className="min-h-11 border border-interactive px-3 py-2"
          onClick={() => setRetry((n) => n + 1)}
        >
          Retry account sync
        </button>
      )}
      {guestAvailable && (
        <button
          type="button"
          disabled={importing}
          className="min-h-11 border border-interactive px-3 py-2"
          onClick={importGuest}
        >
          {importing ? "Importing…" : "Import this tab’s guest practice"}
        </button>
      )}
      <details>
        <summary className="cursor-pointer py-2 font-medium">
          What the account record means
        </summary>
        <p>
          Only outcomes, attempt counts, observed help and recorded completion
          time sync. These are browser-reported practice, not independently
          verified grades. The first account attempt is preserved across
          devices. Controls and answers stay in this tab; a new device starts a
          new local draft.
        </p>
        {summaries.length === 0 ? (
          <p>No account attempt recorded for this activity yet.</p>
        ) : (
          <ul>
            {summaries.map((r) => (
              <li key={`${r.phase}:${r.content_version}`}>
                {r.phase === "changed_case"
                  ? "Changed case"
                  : r.phase === "application"
                    ? "External application"
                    : "Prediction"}
                : {activityEvidenceLabel(r)}. {r.attempt_count} recorded
                attempts. First:{" "}
                {r.first_correct === null
                  ? "not recorded"
                  : r.first_correct
                    ? r.phase === "application"
                      ? "run reported"
                      : "matched"
                    : r.phase === "application"
                      ? "run not yet reported"
                      : "did not match"}
                {r.first_assisted === null
                  ? "; assistance unknown"
                  : r.first_assisted
                    ? " with help"
                    : " before help"}
                .
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
