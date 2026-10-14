import type { ReactNode } from "react";
import Link from "next/link";
import { getModules } from "@tensorcraft/content";
import { worlds } from "@tensorcraft/worlds";
import { isLaunched, PRICING } from "@tensorcraft/shared";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { surfacePlateSrc } from "@/lib/location-art";
import "./purchase-success.css";

export interface PurchaseReceipt {
  plan_id: string;
  world_ids: string[];
  amount: number;
  created_at: string;
  stripe_session_id: string | null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatReceiptDate(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  const day = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hourCycle: "h23",
  }).format(date);
  return `${day} at ${time} UTC`;
}

function planLabel(id: string) {
  return Object.hasOwn(PRICING, id)
    ? PRICING[id as keyof typeof PRICING].label
    : id;
}

function StatusIcon({ state }: { state: string }) {
  return (
    <span className="purchase-status-icon" aria-hidden="true">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {state === "confirmed" ? (
          <path d="m8 16 5 5 11-11" />
        ) : state === "failed" ? (
          <>
            <path d="M16 8v10" />
            <path d="M16 23h.01" />
          </>
        ) : (
          <>
            <circle cx="16" cy="16" r="10" />
            <path d="M16 10v7l4 2" />
          </>
        )}
      </svg>
    </span>
  );
}

/** Presentation shared by the real receipt and the development preview. */
export function PurchaseSuccessView({
  purchase,
  paymentFailed = false,
  pendingContent,
}: {
  purchase: PurchaseReceipt | null;
  paymentFailed?: boolean;
  pendingContent?: ReactNode;
}) {
  const state = purchase ? "confirmed" : paymentFailed ? "failed" : "pending";
  const accessWorlds = (purchase?.world_ids ?? [])
    .filter(isLaunched)
    .map((slug) => ({ slug, manifest: worlds[slug] }))
    .filter((entry) => Boolean(entry.manifest));
  const firstWorld = accessWorlds[0];
  const moduleCount = firstWorld ? getModules(firstWorld.slug).length : 0;
  const art =
    firstWorld && surfacePlateSrc(firstWorld.slug, "purchase-success");
  const reference = purchase?.stripe_session_id
    ? `TC-${purchase.stripe_session_id.slice(-8)}`
    : "Not available";
  return (
    <main className="purchase-page" data-purchase-state={state}>
      <div className="purchase-frame">
        <Link className="purchase-back" href="/dashboard">
          <span aria-hidden="true">←</span> Dashboard
        </Link>
        <header className="purchase-header">
          <div className="purchase-status" data-state={state}>
            <StatusIcon state={state} />
            <span>
              {purchase
                ? "Purchase confirmed"
                : paymentFailed
                  ? "Payment unsuccessful"
                  : "Checking your payment"}
            </span>
          </div>
          <h1>
            {purchase
              ? accessWorlds.length === 1
                ? `${firstWorld.manifest.displayName} is yours.`
                : "Your purchase is confirmed."
              : paymentFailed
                ? "Payment wasn’t completed."
                : "Confirming your payment."}
          </h1>
          <p className="purchase-introduction">
            {purchase
              ? firstWorld
                ? `All ${moduleCount} modules are open. You have lifetime access with no subscription.`
                : "Your receipt is below. Your dashboard shows the courses available to you."
              : paymentFailed
                ? "We couldn’t confirm this payment. You can try again with a different payment method."
                : "We’re waiting for payment confirmation. This page checks automatically for about a minute."}
          </p>
          <div className="purchase-actions">
            {purchase && firstWorld ? (
              <Link
                className="purchase-button"
                data-testid="cta-first-lesson"
                href={`/worlds/${firstWorld.slug}`}
              >
                <span
                  data-testid={
                    accessWorlds.length === 1
                      ? `access-start-${firstWorld.slug}`
                      : undefined
                  }
                >
                  Open mission map
                </span>
              </Link>
            ) : paymentFailed ? (
              <Link
                className="purchase-button"
                data-testid="payment-failed-retry"
                href="/pricing"
              >
                Back to pricing
              </Link>
            ) : purchase ? (
              <Link className="purchase-button" href="/dashboard">
                Go to dashboard
              </Link>
            ) : null}
          </div>
        </header>
        {state === "pending" && pendingContent}
        {purchase && art && (
          <figure className="purchase-art">
            <ArtPlate
              src={art}
              loading="eager"
              alt="The engineering bay aboard the Archimedes, with signal displays glowing beside the ship’s control console."
            />
          </figure>
        )}
        {purchase && accessWorlds.length > 1 && (
          <section
            className="purchase-access"
            aria-labelledby="access-card-heading"
          >
            <h2 id="access-card-heading">Your courses are open</h2>
            <ul>
              {accessWorlds.map(({ slug, manifest }) => (
                <li key={slug}>
                  <div>
                    <h3>{manifest.displayName}</h3>
                    <p>
                      {getModules(slug).length} modules with lifetime access
                    </p>
                  </div>
                  <Link
                    className="purchase-button purchase-button-secondary"
                    data-testid={`access-start-${slug}`}
                    href={`/worlds/${slug}`}
                  >
                    Open {manifest.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {purchase && (
          <section
            className="purchase-receipt"
            aria-labelledby="receipt-heading"
            data-testid="purchase-receipt"
          >
            <h2 id="receipt-heading">Your receipt</h2>
            <dl>
              <div>
                <dt>Amount paid</dt>
                <dd
                  className="purchase-receipt-amount"
                  data-testid="receipt-amount"
                >
                  {formatCurrency(purchase.amount)} <span>USD</span>
                </dd>
              </div>
              <div>
                <dt>Purchase</dt>
                <dd
                  data-testid="receipt-worlds"
                  data-world-ids={purchase.world_ids.join(", ")}
                >
                  {purchase.world_ids.length
                    ? purchase.world_ids
                        .map((slug) => worlds[slug]?.displayName ?? slug)
                        .join(", ")
                    : "Not available"}
                </dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd data-plan={purchase.plan_id}>
                  {planLabel(purchase.plan_id)}
                </dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd data-testid="receipt-date">
                  <time dateTime={purchase.created_at}>
                    {formatReceiptDate(purchase.created_at)}
                  </time>
                </dd>
              </div>
              <div>
                <dt>Order reference</dt>
                <dd
                  className="purchase-reference"
                  data-testid="receipt-session"
                >
                  {reference}
                </dd>
              </div>
            </dl>
            <p className="purchase-receipt-note">
              Keep these payment details for your records.
            </p>
          </section>
        )}
        <footer className="purchase-help">
          <p>Have a question about your purchase?</p>
          <a href="mailto:support@tensorcraft.app">support@tensorcraft.app</a>
        </footer>
      </div>
    </main>
  );
}
