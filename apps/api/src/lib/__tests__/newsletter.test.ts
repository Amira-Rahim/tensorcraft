import { describe, it, expect, vi, beforeEach } from "vitest";

// Regression gate for the cross-stream opt-out (2026-07-13 P4 email
// audit): the digest sender reads the WAITLIST table, but the Settings
// weekly-digest toggle writes profiles.weekly_digest - the sender must
// exclude waitlist emails whose account profile opted out, case-
// insensitively.

const sendSpy = vi.fn().mockResolvedValue({ data: { id: "email_1" } });
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendSpy };
  },
}));

// Thenable chain builder: every query method returns the builder; awaiting
// it resolves to the preset result for its table.
function chain(result: { data: unknown; error: null }) {
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "in", "eq", "order", "update"]) {
    builder[m] = () => builder;
  }
  builder.then = (resolve: (v: { data: unknown; error: null }) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const tables: Record<string, ReturnType<typeof chain>> = {};
vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => tables[table],
  }),
}));

vi.mock("../logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../error-tracking", () => ({
  captureException: vi.fn(),
}));

import { sendDigestNewsletter } from "../newsletter";

beforeEach(() => {
  sendSpy.mockClear();
  process.env.RESEND_API_KEY = "test-key";
  // The sender fails closed without a postal address (CAN-SPAM). Existing
  // cases here assert send BEHAVIOUR, so give them a configured address;
  // the postal-address describe deletes it to exercise the refusal.
  process.env.NEWSLETTER_POSTAL_ADDRESS = "Tensorcraft, Wilmington, DE 19801";
  tables["news_items"] = chain({
    data: [
      {
        title: "Item",
        url: "https://example.com",
        source: "src",
        summary: "s",
        matched_lessons: [
          {
            worldId: "deep-orbit",
            moduleId: "anomaly-detection",
            slug: "threshold-tuning",
            title: "Threshold Tuning",
            rationale: "why it matters",
          },
        ],
        published_blog_slug: null,
      },
    ],
    error: null,
  });
  tables["waitlist"] = chain({
    data: [
      { email: "keeps@x.test", unsubscribe_token: "t1" },
      { email: "OptedOut@X.test", unsubscribe_token: "t2" },
    ],
    error: null,
  });
  tables["profiles"] = chain({
    data: [{ email: "optedout@x.test" }],
    error: null,
  });
});

describe("sendDigestNewsletter opt-out join", () => {
  it("skips waitlist emails whose profile has weekly_digest=false (case-insensitive)", async () => {
    const result = await sendDigestNewsletter("2026-W28");
    expect(result.sent).toBe(1);
    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: "keeps@x.test" }),
    );
  });

  it("sends to everyone when nobody opted out", async () => {
    tables["profiles"] = chain({ data: [], error: null });
    const result = await sendDigestNewsletter("2026-W28");
    expect(result.sent).toBe(2);
  });

  it("counts a Resend error result as failed, not sent (gap sweep F1)", async () => {
    // The Resend SDK does NOT throw: 429/4xx/5xx resolve {data:null, error}.
    // The old code ignored `error`, so result.failed was structurally
    // unreachable and a fully-429'd launch blast reported sent:N failed:0.
    tables["profiles"] = chain({ data: [], error: null });
    sendSpy
      .mockResolvedValueOnce({ data: { id: "email_ok" }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { name: "rate_limit_exceeded", message: "Too many requests" },
      });
    const result = await sendDigestNewsletter("2026-W28");
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
  });
});

describe("sendDigestNewsletter lesson links", () => {
  // Lessons live at /worlds/[slug]/[module]/[lesson]. The digest linked
  // /learn/... for months and every "Teaches:" link 404'd (P4 round 3).
  it("links matched lessons at their real /worlds route in text and HTML", async () => {
    await sendDigestNewsletter("2026-W28");
    const call = sendSpy.mock.calls[0][0];
    const expected =
      "https://tensorcraft.app/worlds/deep-orbit/anomaly-detection/threshold-tuning?utm_source=newsletter";
    expect(call.text).toContain(expected);
    expect(call.html).toContain(expected);
    expect(call.text).not.toContain("/learn/");
    expect(call.html).not.toContain("/learn/");
  });
});

/**
 * CAN-SPAM postal address.
 *
 * Every commercial message must carry a physical postal address. The digest
 * footer carried only an unsubscribe link, and nothing in the repo held an
 * address to inject. The owner has deferred getting one (2026-08-23), which
 * is safe ONLY because the digest never sends on a schedule: the weekly cron
 * scrapes news for curation, and a human triggers the send from /admin/digest.
 *
 * So the sender fails CLOSED instead of waiting for someone to remember. A
 * missing address stops the send rather than mailing without one.
 */
describe("digest postal address", () => {
  beforeEach(() => {
    delete process.env.NEWSLETTER_POSTAL_ADDRESS;
  });

  it("refuses to send when no postal address is configured", async () => {
    const result = await sendDigestNewsletter("2026-W35");

    expect(sendSpy).not.toHaveBeenCalled();
    expect(result.sent).toBe(0);
    expect(result.blockedReason).toBe("missing_postal_address");
  });

  it("puts the address in both the plaintext and HTML footers", async () => {
    process.env.NEWSLETTER_POSTAL_ADDRESS =
      "Tensorcraft, 1209 Orange St, Wilmington, DE 19801";

    await sendDigestNewsletter("2026-W35");

    expect(sendSpy).toHaveBeenCalled();
    const arg = sendSpy.mock.calls[0][0] as { text: string; html: string };
    expect(arg.text).toContain("Wilmington, DE 19801");
    expect(arg.html).toContain("Wilmington, DE 19801");
  });

  it("still sends on a dry run without an address, since nothing is mailed", async () => {
    const result = await sendDigestNewsletter("2026-W35", { dryRun: true });

    expect(sendSpy).not.toHaveBeenCalled();
    expect(result.blockedReason).toBeUndefined();
  });
});
