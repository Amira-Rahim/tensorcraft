import { getApiUrl } from "./api-url";
import {
  clearConsentAfterAccountChange,
  getConsentChoiceId,
  hasAnalyticsConsent,
  type ConsentChoice,
} from "./consent";

export const CONSENT_SYNC_KEY = "tc-account-consent-sync";
export const CONSENT_WITHDRAWAL_PREFIX = "tc-account-consent-withdrawal:";
export const CONSENT_SYNC_CHANGED_EVENT = "tc-account-consent-sync-changed";
export const CONSENT_SYNC_RETRY_EVENT = "tc-account-consent-sync-retry";

export type ConsentSession = { userId: string; accessToken: string };
export type AccountConsent = {
  granted: boolean;
  revision: number;
  updatedAt: string | null;
};
export type ConsentSyncStatus = {
  message: string | null;
  canAccept: boolean;
  canRetry: boolean;
};

type PendingConsent = {
  anonymousGrantId?: string;
  anonymousWithdrawalId?: string;
  withdrawals: Record<string, string>;
};
let status: ConsentSyncStatus = {
  message: null,
  canAccept: true,
  canRetry: false,
};

export function getConsentSyncStatus(): ConsentSyncStatus {
  return status;
}

function publishStatus(next: ConsentSyncStatus): void {
  status = next;
  window.dispatchEvent(new Event(CONSENT_SYNC_CHANGED_EVENT));
}

export function onConsentSyncStatusChange(handler: () => void): () => void {
  handler();
  window.addEventListener(CONSENT_SYNC_CHANGED_EVENT, handler);
  return () => window.removeEventListener(CONSENT_SYNC_CHANGED_EVENT, handler);
}

export function retryConsentSync(): void {
  window.dispatchEvent(new Event(CONSENT_SYNC_RETRY_EVENT));
}

function withdrawalKey(userId: string): string {
  return `${CONSENT_WITHDRAWAL_PREFIX}${encodeURIComponent(userId)}`;
}

function readPending(): PendingConsent {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONSENT_SYNC_KEY) ?? "null");
    const withdrawals: Record<string, string> = {};
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(CONSENT_WITHDRAWAL_PREFIX)) continue;
      const value = localStorage.getItem(key);
      if (value)
        withdrawals[
          decodeURIComponent(key.slice(CONSENT_WITHDRAWAL_PREFIX.length))
        ] = value;
    }
    return {
      anonymousWithdrawalId:
        typeof parsed?.anonymousWithdrawalId === "string"
          ? parsed.anonymousWithdrawalId
          : undefined,
      anonymousGrantId:
        typeof parsed?.anonymousGrantId === "string"
          ? parsed.anonymousGrantId
          : undefined,
      withdrawals,
    };
  } catch {
    return { withdrawals: {} };
  }
}

function writePending(pending: PendingConsent): void {
  // Account withdrawals use separate keys. A tab cannot erase another
  // account's pending operation by rewriting an old snapshot of a map.
  localStorage.setItem(
    CONSENT_SYNC_KEY,
    JSON.stringify({
      anonymousGrantId: pending.anonymousGrantId,
      anonymousWithdrawalId: pending.anonymousWithdrawalId,
    }),
  );
}

function parseAccountConsent(value: unknown): AccountConsent {
  const data = value as Partial<AccountConsent> | null;
  if (
    !data ||
    typeof data.granted !== "boolean" ||
    !Number.isSafeInteger(data.revision) ||
    (data.revision ?? -1) < 0 ||
    !(data.updatedAt === null || typeof data.updatedAt === "string")
  )
    throw new Error("Invalid consent response");
  return data as AccountConsent;
}

/**
 * One queue handles local writes. Database revisions protect competing tabs
 * and devices. Only withdrawals survive a failed account write.
 */
export function createConsentSynchronizer(
  request: typeof fetch = fetch,
  report: (next: ConsentSyncStatus) => void = publishStatus,
) {
  let session: ConsentSession | null | undefined;
  let observed: AccountConsent | null = null;
  let queue = Promise.resolve();
  let disposed = false;
  const memoryWithdrawals: Record<string, string> = {};
  let memoryAnonymousWithdrawal: string | undefined;
  const pendingState = (): PendingConsent => {
    const saved = readPending();
    return {
      ...saved,
      anonymousWithdrawalId:
        memoryAnonymousWithdrawal ?? saved.anonymousWithdrawalId,
      withdrawals: { ...memoryWithdrawals, ...saved.withdrawals },
    };
  };

  function rememberWithdrawal(userId: string, operationId: string): void {
    memoryWithdrawals[userId] = operationId;
    try {
      localStorage.setItem(withdrawalKey(userId), operationId);
      delete memoryWithdrawals[userId];
    } catch {
      /* Retry in memory while this page remains open. */
    }
  }

  const current = (target: ConsentSession) =>
    !disposed && session?.userId === target.userId;
  const idle = () => {
    const outstanding = Object.keys(pendingState().withdrawals);
    report(
      outstanding.length > 0
        ? {
            message:
              "A previous account withdrawal is still pending. Sign in to that account to finish saving it.",
            canAccept: false,
            canRetry: true,
          }
        : { message: null, canAccept: true, canRetry: false },
    );
  };
  const failed = (withdrawal: boolean) =>
    report({
      message: withdrawal
        ? `Analytics is off in this browser. Your account withdrawal is still pending. ${
            Object.keys(memoryWithdrawals).length > 0 ||
            memoryAnonymousWithdrawal
              ? "Keep this page open and retry when connected."
              : "Retry when connected."
          }`
        : "Your account analytics choice could not be checked. Retry before accepting analytics.",
      canAccept: false,
      canRetry: true,
    });

  function enqueue(work: () => Promise<void>): Promise<void> {
    queue = queue
      .then(async () => {
        if (disposed) return;
        if (navigator.locks) {
          await navigator.locks.request("tc-account-consent-sync", async () => {
            if (!disposed) await work();
          });
        } else await work();
      })
      .catch(() => {
        if (!disposed)
          failed(
            Boolean(session && pendingState().withdrawals[session.userId]),
          );
      });
    return queue;
  }

  async function api(
    target: ConsentSession,
    update?: { granted: boolean; expectedRevision: number },
  ) {
    const response = await request(`${getApiUrl()}/api/analytics-consent`, {
      method: update ? "PUT" : "GET",
      headers: {
        Authorization: `Bearer ${target.accessToken}`,
        ...(update ? { "Content-Type": "application/json" } : {}),
      },
      ...(update ? { body: JSON.stringify(update) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok && response.status !== 409)
      throw new Error("Consent request failed");
    return {
      conflict: response.status === 409,
      consent: parseAccountConsent(await response.json()),
    };
  }

  async function withdraw(
    target: ConsentSession,
    operationId: string,
  ): Promise<AccountConsent> {
    const { consent } = await api(target, {
      granted: false,
      expectedRevision: observed?.revision ?? 0,
    });
    if (consent.granted) throw new Error("Withdrawal not acknowledged");
    if (memoryWithdrawals[target.userId] === operationId)
      delete memoryWithdrawals[target.userId];
    try {
      const key = withdrawalKey(target.userId);
      // An older response must not acknowledge a newer action from another tab.
      if (localStorage.getItem(key) === operationId)
        localStorage.removeItem(key);
    } catch {
      /* The server acknowledged withdrawal. A later retry is harmless. */
    }
    return consent;
  }

  async function grant(
    target: ConsentSession,
    choiceId: string,
    expectedRevision: number,
  ) {
    if (
      !current(target) ||
      getConsentChoiceId() !== choiceId ||
      !hasAnalyticsConsent()
    )
      return;
    if (pendingState().withdrawals[target.userId]) {
      clearConsentAfterAccountChange();
      return;
    }
    report({
      message: "Saving your account analytics choice…",
      canAccept: false,
      canRetry: false,
    });
    try {
      const result = await api(target, { granted: true, expectedRevision });
      if (!current(target)) return;
      observed = result.consent;
      if (result.conflict || !result.consent.granted) {
        // Never obtain a newer revision and retry an old acceptance.
        if (getConsentChoiceId() === choiceId) clearConsentAfterAccountChange();
        report({
          message:
            "Your account choice changed. Analytics stays off in this browser until you choose again.",
          canAccept: true,
          canRetry: false,
        });
      } else idle();
    } catch {
      // A failed grant may have reached the server. Do not replay it. Queue
      // a withdrawal so an uncertain grant cannot remain silently enabled.
      const pending = pendingState();
      pending.withdrawals[target.userId] = crypto.randomUUID();
      rememberWithdrawal(target.userId, pending.withdrawals[target.userId]);
      try {
        writePending(pending);
      } catch {
        /* Retry while this page stays open. */
      }
      if (current(target)) {
        if (getConsentChoiceId() === choiceId) clearConsentAfterAccountChange();
        failed(true);
      }
    }
  }

  async function reconcile() {
    const target = session;
    if (!target) {
      if (target === null) idle();
      return;
    }
    const pending = pendingState();
    if (pending.anonymousWithdrawalId) {
      pending.withdrawals[target.userId] = pending.anonymousWithdrawalId;
      rememberWithdrawal(target.userId, pending.anonymousWithdrawalId);
      delete pending.anonymousWithdrawalId;
      memoryAnonymousWithdrawal = undefined;
      try {
        writePending(pending);
      } catch {
        /* Keep the in-memory withdrawal. */
      }
    }
    report({
      message: pending.withdrawals[target.userId]
        ? "Saving your account withdrawal…"
        : null,
      canAccept: false,
      canRetry: false,
    });
    try {
      const account = pending.withdrawals[target.userId]
        ? await withdraw(target, pending.withdrawals[target.userId])
        : (await api(target)).consent;
      if (!current(target)) return;
      observed = account;
      const latest = pendingState();
      const anonymousChoice = latest.anonymousGrantId;
      if (anonymousChoice) {
        // Consume once. An existing account needs a new, signed-in choice.
        delete latest.anonymousGrantId;
        writePending(latest);
        if (
          account.revision === 0 &&
          hasAnalyticsConsent() &&
          getConsentChoiceId() === anonymousChoice
        ) {
          await grant(target, anonymousChoice, 0);
          return;
        }
      }
      if (!account.granted && hasAnalyticsConsent())
        clearConsentAfterAccountChange();
      idle();
    } catch {
      if (current(target))
        failed(Boolean(pendingState().withdrawals[target.userId]));
    }
  }

  return {
    setSession(next: ConsentSession | null): Promise<void> {
      const changed = session?.userId !== next?.userId;
      session = next;
      if (changed) observed = null;
      return enqueue(reconcile);
    },
    choose(choice: ConsentChoice, choiceId: string): Promise<void> {
      const pending = pendingState();
      delete pending.anonymousGrantId;
      delete pending.anonymousWithdrawalId;
      memoryAnonymousWithdrawal = undefined;
      if (choice !== "accepted") {
        if (session) {
          pending.withdrawals[session.userId] = choiceId;
          rememberWithdrawal(session.userId, choiceId);
        } else {
          pending.anonymousWithdrawalId = choiceId;
          memoryAnonymousWithdrawal = choiceId;
        }
        try {
          writePending(pending);
        } catch {
          failed(true);
        }
        const target = session;
        return enqueue(async () => {
          if (!target) return reconcile();
          report({
            message: "Saving your account withdrawal…",
            canAccept: false,
            canRetry: false,
          });
          try {
            const account = await withdraw(target, choiceId);
            if (current(target)) observed = account;
            idle();
          } catch {
            failed(true);
          }
        });
      }
      if (!hasAnalyticsConsent()) {
        failed(false);
        return Promise.resolve();
      }
      if (session === null) {
        pending.anonymousGrantId = choiceId;
        try {
          writePending(pending);
          idle();
        } catch {
          clearConsentAfterAccountChange();
          failed(false);
        }
        return Promise.resolve();
      }
      if (!session || !observed) {
        clearConsentAfterAccountChange();
        failed(false);
        return enqueue(reconcile);
      }
      const target = session;
      const expectedRevision = observed.revision;
      return enqueue(() => grant(target, choiceId, expectedRevision));
    },
    reconcile: () => enqueue(reconcile),
    settled: () => queue,
    dispose: () => {
      disposed = true;
    },
  };
}
