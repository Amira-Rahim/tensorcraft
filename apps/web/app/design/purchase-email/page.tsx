import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderPurchaseReceipt } from "../../../../api/src/lib/purchase-receipt-template";
import { EmailPreviewFrame } from "./email-preview-frame";

export const metadata: Metadata = {
  title: "Purchase receipt email preview | Tensorcraft",
  robots: { index: false, follow: false },
};

export default async function PurchaseEmailDesignPreview({
  searchParams,
}: {
  searchParams: Promise<{ viewport?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  const width = query.viewport === "320" ? 320 : 640;
  const content = renderPurchaseReceipt({
    worldIds: ["deep-orbit"],
    amount: 50,
    sessionId: "cs_test_design_preview_12345678",
    purchasedAt: new Date("2026-10-14T10:00:00Z"),
  });

  return (
    <>
      <form
        action="/design/purchase-email"
        className="lesson-frame mb-6 flex flex-wrap items-end gap-4 border-b border-border py-6"
        aria-label="Purchase receipt email preview"
      >
        <label className="grid gap-2 text-sm text-text-muted">
          Email width
          <select
            name="viewport"
            defaultValue={String(width)}
            className="min-h-11 border border-border bg-surface p-2 text-text-primary"
          >
            <option value="640">Email: 640px</option>
            <option value="320">Phone: 320px</option>
          </select>
        </label>
        <button
          type="submit"
          className="min-h-11 bg-primary px-6 text-on-primary"
        >
          Preview receipt email
        </button>
        <p className="basis-full text-sm text-text-muted">
          Sample receipt. This preview does not send an email.
        </p>
      </form>
      <div className="lesson-frame mb-6 text-text-primary">
        Subject: {content.subject}
      </div>
      <EmailPreviewFrame key={width} html={content.html} width={width} />
    </>
  );
}
