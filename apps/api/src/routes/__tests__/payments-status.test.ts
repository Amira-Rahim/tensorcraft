import { describe, it, expect } from "vitest";
import { purchaseStatusForSession } from "../payments";

/**
 * Delayed-payment gate (audit run #7, 2026-07-16).
 *
 * Stripe fires checkout.session.completed for delayed-notification payment
 * methods with payment_status "unpaid": the checkout finished, the money has
 * not moved. The webhook used to write status "completed" unconditionally,
 * granting lifetime access on an unpaid session; async_payment_failed then
 * only logged, so the access survived the bounced payment. These tests pin
 * the mapping that closes that hole. If this file goes red, someone has
 * reopened it.
 */
describe("purchaseStatusForSession", () => {
  it("grants access when the money has moved", () => {
    expect(purchaseStatusForSession("paid")).toBe("completed");
  });

  it("grants access when Stripe says no payment was required", () => {
    // 100%-off promotion codes and similar produce no_payment_required;
    // there is nothing left to settle asynchronously.
    expect(purchaseStatusForSession("no_payment_required")).toBe("completed");
  });

  it("records an unpaid session as pending, never completed", () => {
    expect(purchaseStatusForSession("unpaid")).toBe("pending");
  });

  it("fails closed on missing or unknown payment_status values", () => {
    // A new Stripe enum value or an absent field must never default to
    // granting access.
    expect(purchaseStatusForSession(null)).toBe("pending");
    expect(purchaseStatusForSession(undefined)).toBe("pending");
    expect(purchaseStatusForSession("some_future_status")).toBe("pending");
  });
});
