import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PurchaseSuccessLoading from "@/app/dashboard/purchase-success/loading";
import { PendingHelp } from "@/app/dashboard/purchase-success/pending-poller";
import {
  PurchaseSuccessView,
  type PurchaseReceipt,
} from "@/app/dashboard/purchase-success/purchase-success-view";
import { ResponsiveLessonPreview } from "../deep-orbit/responsive-preview";

export const metadata: Metadata = {
  title: "Purchase confirmation preview | Tensorcraft",
  robots: { index: false, follow: false },
};

const states = [
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Confirming payment" },
  { value: "timed-out", label: "Confirmation delayed" },
  { value: "failed", label: "Payment failed" },
  { value: "loading", label: "Loading" },
] as const;

const sampleReceipt: PurchaseReceipt = {
  plan_id: "single",
  world_ids: ["deep-orbit"],
  amount: 50,
  created_at: "2026-10-14T10:00:00Z",
  stripe_session_id: "cs_test_design_preview_12345678",
};

/** A development-only gallery renders UI states without querying a purchase. */
export default async function PurchaseSuccessDesignPreview({
  searchParams,
}: {
  searchParams: Promise<{
    state?: string;
    viewport?: string;
    embedded?: string;
  }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  const state =
    states.find((item) => item.value === query.state)?.value ?? "confirmed";
  const width = [320, 768].find((size) => String(size) === query.viewport);
  const embedded = query.embedded === "1";
  const frameQuery = new URLSearchParams({ state, embedded: "1" });
  const retryQuery = new URLSearchParams({ state: "pending" });
  if (embedded) retryQuery.set("embedded", "1");
  else if (width) retryQuery.set("viewport", String(width));

  return (
    <>
      {!embedded && (
        <form
          action="/design/purchase-success"
          className="lesson-frame mb-6 flex flex-wrap items-end gap-4 border-b border-border py-6"
          aria-label="Purchase confirmation preview"
        >
          <label className="grid min-w-0 max-w-full gap-2 text-sm text-text-muted">
            Payment state
            <select
              name="state"
              defaultValue={state}
              className="min-h-11 max-w-full border border-border bg-surface p-2 text-text-primary"
            >
              {states.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-text-muted">
            Viewport
            <select
              name="viewport"
              defaultValue={width ? String(width) : "full"}
              className="min-h-11 border border-border bg-surface p-2 text-text-primary"
            >
              <option value="full">Full width</option>
              <option value="320">Phone: 320px</option>
              <option value="768">Tablet: 768px</option>
            </select>
          </label>
          <button
            type="submit"
            className="min-h-11 bg-primary px-6 text-on-primary"
          >
            Preview purchase page
          </button>
          <p className="basis-full text-sm text-text-muted">
            Sample purchase data. This preview does not process a payment.
          </p>
        </form>
      )}
      {width && !embedded ? (
        <ResponsiveLessonPreview
          key={`${state}:${width}`}
          src={`/design/purchase-success?${frameQuery}`}
          width={width}
          title={`Purchase confirmation at ${width}px`}
        />
      ) : state === "loading" ? (
        <PurchaseSuccessLoading />
      ) : (
        <PurchaseSuccessView
          purchase={state === "confirmed" ? sampleReceipt : null}
          paymentFailed={state === "failed"}
          pendingContent={
            state === "timed-out" ? (
              <PendingHelp
                sessionId={sampleReceipt.stripe_session_id ?? undefined}
              >
                <Link
                  className="purchase-button"
                  href={`/design/purchase-success?${retryQuery}`}
                >
                  Check again
                </Link>
              </PendingHelp>
            ) : undefined
          }
        />
      )}
    </>
  );
}
