import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsert = vi.fn();
vi.mock("../supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({ insert: (...a: unknown[]) => mockInsert(...a) }),
  }),
}));

import { submitWaitlist } from "../waitlist";

/**
 * `submitWaitlist` must never throw.
 *
 * Both callers (`theme-waitlist-form.tsx`, `newsletter-modal.tsx`) do
 * `setStatus("submitting")` then `setStatus(await submitWaitlist(...))` with no
 * try/catch. An exception skipped the second setStatus and left the form stuck
 * on "submitting" forever — with a working error state rendered just below
 * that the throw made unreachable. Returning "error" is what makes those call
 * sites correct by construction.
 */
describe("submitWaitlist", () => {
  beforeEach(() => {
    mockInsert.mockReset();
  });

  it("returns done on a successful insert", async () => {
    mockInsert.mockResolvedValue({ error: null });
    await expect(submitWaitlist("a@b.com", "deep-orbit", "form")).resolves.toBe(
      "done",
    );
  });

  it("treats a duplicate as done — already on the list is success to the visitor", async () => {
    mockInsert.mockResolvedValue({ error: { code: "23505" } });
    await expect(submitWaitlist("a@b.com", "deep-orbit", "form")).resolves.toBe(
      "done",
    );
  });

  it("returns error on a returned error rather than throwing", async () => {
    mockInsert.mockResolvedValue({ error: { code: "500" } });
    await expect(submitWaitlist("a@b.com", "deep-orbit", "form")).resolves.toBe(
      "error",
    );
  });

  it("returns error instead of throwing when the insert rejects", async () => {
    // The regression: a network failure used to propagate out and strand the
    // form on "submitting".
    mockInsert.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(submitWaitlist("a@b.com", "deep-orbit", "form")).resolves.toBe(
      "error",
    );
  });

  it("returns error instead of throwing when the client itself throws", async () => {
    // e.g. blocked site data while constructing the browser client.
    mockInsert.mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });
    await expect(submitWaitlist("a@b.com", "deep-orbit", "form")).resolves.toBe(
      "error",
    );
  });
});
