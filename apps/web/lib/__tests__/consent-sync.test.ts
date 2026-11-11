import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_KEY,
  getConsentChoiceId,
  hasAnalyticsConsent,
  setConsentChoice,
  type ConsentChoice,
} from "../consent";
import {
  CONSENT_WITHDRAWAL_PREFIX,
  createConsentSynchronizer,
  type AccountConsent,
  type ConsentSession,
} from "../consent-sync";

const alice: ConsentSession = { userId: "alice", accessToken: "alice-token" };
const bob: ConsentSession = { userId: "bob", accessToken: "bob-token" };
const account = (granted = false, revision = 0): AccountConsent => ({
  granted,
  revision,
  updatedAt: revision ? "2026-11-11T12:00:00Z" : null,
});
const response = (granted = false, revision = 0, status = 200) =>
  new Response(JSON.stringify(account(granted, revision)), { status });
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

function setup() {
  const request = vi.fn<typeof fetch>();
  const report = vi.fn();
  const sync = createConsentSynchronizer(request, report);
  const choose = (choice: ConsentChoice) => {
    setConsentChoice(choice);
    return sync.choose(choice, getConsentChoiceId() ?? crypto.randomUUID());
  };
  const writes = () =>
    request.mock.calls
      .filter(([, init]) => init?.method === "PUT")
      .map(([, init]) => ({
        body: JSON.parse(init!.body as string),
        authorization: (init!.headers as Record<string, string>).Authorization,
      }));
  return { sync, request, report, choose, writes };
}

beforeEach(() => {
  vi.restoreAllMocks();
  setConsentChoice(null);
  localStorage.clear();
});

describe("account analytics consent", () => {
  it("never imports an old browser acceptance into an account", async () => {
    const { sync, request, writes } = setup();
    localStorage.setItem(CONSENT_KEY, "accepted");
    request.mockResolvedValueOnce(response(false, 0));
    await sync.setSession(alice);
    expect(hasAnalyticsConsent()).toBe(false);
    expect(writes()).toEqual([]);
    expect(request.mock.calls[0][1]?.cache).toBe("no-store");
  });

  it("syncs an explicit anonymous acceptance only into a new account record", async () => {
    const { sync, request, choose, writes } = setup();
    await sync.setSession(null);
    await choose("accepted");
    request
      .mockResolvedValueOnce(response(false, 0))
      .mockResolvedValueOnce(response(true, 1));
    await sync.setSession(alice);
    expect(writes()).toEqual([
      {
        authorization: "Bearer alice-token",
        body: { granted: true, expectedRevision: 0 },
      },
    ]);
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("requires a new signed-in choice after an existing account withdrawal", async () => {
    const { sync, request, choose, writes } = setup();
    await sync.setSession(null);
    await choose("accepted");
    request.mockResolvedValueOnce(response(false, 4));
    await sync.setSession(alice);
    expect(writes()).toHaveLength(0);
    expect(hasAnalyticsConsent()).toBe(false);
    request.mockResolvedValueOnce(response(true, 5));
    await choose("accepted");
    expect(writes()[0].body).toEqual({ granted: true, expectedRevision: 4 });
  });

  it("discards a stale acceptance rather than retrying with a newer revision", async () => {
    const { sync, request, choose, writes, report } = setup();
    request.mockResolvedValueOnce(response(false, 3));
    await sync.setSession(alice);
    request.mockResolvedValueOnce(response(false, 4, 409));
    await choose("accepted");
    expect(hasAnalyticsConsent()).toBe(false);
    expect(report).toHaveBeenLastCalledWith(
      expect.objectContaining({ canAccept: true }),
    );
    request.mockResolvedValueOnce(response(false, 4));
    await sync.reconcile();
    expect(writes()).toHaveLength(1);
    expect(writes()[0].body.expectedRevision).toBe(3);
  });

  it("does not turn browser capture on when the account has consent", async () => {
    const { sync, request, writes } = setup();
    request.mockResolvedValueOnce(response(true, 7));
    await sync.setSession(alice);
    expect(hasAnalyticsConsent()).toBe(false);
    expect(writes()).toEqual([]);
  });

  it("stops browser capture when a later account read discovers withdrawal", async () => {
    const { sync, request } = setup();
    setConsentChoice("accepted");
    request
      .mockResolvedValueOnce(response(true, 7))
      .mockResolvedValueOnce(response(false, 8));
    await sync.setSession(alice);
    expect(hasAnalyticsConsent()).toBe(true);
    await sync.reconcile();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("keeps failed withdrawal bound to its account across reload and account switch", async () => {
    const first = setup();
    first.request.mockResolvedValueOnce(response(true, 1));
    await first.sync.setSession(alice);
    first.request.mockRejectedValueOnce(new Error("offline"));
    await first.choose(null);
    expect(hasAnalyticsConsent()).toBe(false);
    expect(first.report).toHaveBeenLastCalledWith(
      expect.objectContaining({ canRetry: true }),
    );
    first.sync.dispose();

    const second = setup();
    second.request.mockResolvedValueOnce(response(false, 0));
    await second.sync.setSession(bob);
    expect(second.writes()).toEqual([]);
    expect(second.report).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("previous account withdrawal"),
      }),
    );
    second.request.mockResolvedValueOnce(response(false, 2));
    await second.sync.setSession(alice);
    expect(second.writes()).toEqual([
      {
        authorization: "Bearer alice-token",
        body: { granted: false, expectedRevision: 0 },
      },
    ]);
    expect(
      localStorage.getItem(`${CONSENT_WITHDRAWAL_PREFIX}alice`),
    ).toBeNull();
  });

  it("serializes a withdrawal behind an in-flight acceptance", async () => {
    const { sync, request, choose, writes } = setup();
    request.mockResolvedValueOnce(response(false, 0));
    await sync.setSession(alice);
    const grant = deferred<Response>();
    request
      .mockReturnValueOnce(grant.promise)
      .mockResolvedValueOnce(response(false, 2));
    const accepting = choose("accepted");
    await Promise.resolve();
    const withdrawing = choose(null);
    expect(hasAnalyticsConsent()).toBe(false);
    grant.resolve(response(true, 1));
    await accepting;
    await withdrawing;
    expect(writes().map((write) => write.body.granted)).toEqual([true, false]);
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("still attempts the original account withdrawal if sign-out happens before the queue runs", async () => {
    const { sync, request, choose, writes } = setup();
    request.mockResolvedValueOnce(response(true, 1));
    await sync.setSession(alice);
    request.mockResolvedValueOnce(response(false, 2));
    const withdrawing = choose(null);
    const signingOut = sync.setSession(null);
    await withdrawing;
    await signingOut;
    expect(writes()).toEqual([
      {
        authorization: "Bearer alice-token",
        body: { granted: false, expectedRevision: 0 },
      },
    ]);
  });

  it("does not clear a newer persisted withdrawal when an older operation finishes", async () => {
    const { sync, request, choose } = setup();
    request.mockResolvedValueOnce(response(true, 1));
    await sync.setSession(alice);
    const first = deferred<Response>();
    request.mockReturnValueOnce(first.promise);
    const withdrawing = choose(null);
    await Promise.resolve();
    localStorage.setItem(
      `${CONSENT_WITHDRAWAL_PREFIX}alice`,
      "newer-tab-operation",
    );
    first.resolve(response(false, 2));
    await withdrawing;
    expect(localStorage.getItem(`${CONSENT_WITHDRAWAL_PREFIX}alice`)).toBe(
      "newer-tab-operation",
    );
    request.mockResolvedValueOnce(response(false, 3));
    await sync.reconcile();
    expect(
      localStorage.getItem(`${CONSENT_WITHDRAWAL_PREFIX}alice`),
    ).toBeNull();
  });

  it("withdraws an uncertain grant after a network failure without replaying acceptance", async () => {
    const { sync, request, choose, writes } = setup();
    request.mockResolvedValueOnce(response(false, 0));
    await sync.setSession(alice);
    request.mockRejectedValueOnce(new Error("response lost"));
    await choose("accepted");
    expect(hasAnalyticsConsent()).toBe(false);
    request.mockResolvedValueOnce(response(false, 2));
    await sync.reconcile();
    expect(writes().map((write) => write.body.granted)).toEqual([true, false]);
  });

  it("preserves a pre-auth withdrawal in memory when storage writes fail", async () => {
    const { sync, request, choose, writes } = setup();
    const write = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    await choose(null);
    request.mockResolvedValueOnce(response(false, 4));
    await sync.setSession(alice);
    expect(writes()[0]).toEqual({
      authorization: "Bearer alice-token",
      body: { granted: false, expectedRevision: 0 },
    });
    expect(hasAnalyticsConsent()).toBe(false);
    write.mockRestore();
  });

  it("does not reuse an old account response after switching accounts", async () => {
    const { sync, request, choose, writes } = setup();
    const slowAlice = deferred<Response>();
    request
      .mockReturnValueOnce(slowAlice.promise)
      .mockResolvedValueOnce(response(false, 9));
    const first = sync.setSession(alice);
    await Promise.resolve();
    const second = sync.setSession(bob);
    slowAlice.resolve(response(false, 2));
    await first;
    await second;
    request.mockResolvedValueOnce(response(true, 10));
    await choose("accepted");
    expect(writes()).toEqual([
      {
        authorization: "Bearer bob-token",
        body: { granted: true, expectedRevision: 9 },
      },
    ]);
  });
});
