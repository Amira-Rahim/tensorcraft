import type Stripe from "stripe";
import { logger } from "./logger";

/**
 * Optional "How did you find Tensorcraft?" question on Stripe Checkout
 * (docs/marketing-first-1000-paid.md §9 item 5).
 *
 * PostHog only records visitors who accept analytics, so a buyer who declines
 * leaves no acquisition source. Stripe stores the buyer's own answer on the
 * Checkout Session (`custom_fields`), where the Dashboard and the API both
 * show it. The question is optional, so it never stands between a buyer and
 * the payment button.
 */

export interface SourceOption {
  /** Shown to the buyer: 1 to 100 characters, unique in the list. */
  label: string;
  /** Stored on the session: 1 to 100 letters or digits, unique in the list. */
  value: string;
}

/**
 * The answers a buyer can pick, in display order. Checkout skips the
 * question while this list is empty.
 */
export const ACQUISITION_SOURCES: readonly SourceOption[] = [
  // Empty until the owner picks the channels, in display order
  // (docs/post-launch-backlog.md, "First-1,000 funnel follow-ups"). The
  // privacy changes listed there ship first.
];

const FIELD_KEY = "source";
const FIELD_LABEL = "How did you find Tensorcraft?";

// Limits from the stripe@23.0.1 SessionCreateParams.CustomField types, all
// confirmed against Stripe test mode on 2026-11-02. That run also found an
// undocumented rule: every option label must be unique.
const MAX_OPTIONS = 200;
const MAX_TEXT = 100;
const VALUE_PATTERN = /^[A-Za-z0-9]+$/;

/**
 * Lists every way `options` breaks Stripe's dropdown limits. Stripe rejects
 * the whole Checkout Session on any of them, which would stop every purchase,
 * so acquisitionSourceFields leaves the question out.
 */
export function sourceOptionProblems(
  options: readonly SourceOption[],
): string[] {
  const problems: string[] = [];
  if (options.length > MAX_OPTIONS) {
    problems.push(
      `Stripe allows at most ${MAX_OPTIONS} options, and the list has ${options.length}.`,
    );
  }
  const seen = new Set<string>();
  const seenLabels = new Set<string>();
  for (const { label, value } of options) {
    if (value.length > MAX_TEXT || !VALUE_PATTERN.test(value)) {
      problems.push(
        `"${label}": the value "${value}" must be 1 to ${MAX_TEXT} letters or digits.`,
      );
    } else if (seen.has(value)) {
      problems.push(`"${label}": the value "${value}" is already in the list.`);
    }
    seen.add(value);
    // Stripe compares labels after trimming outer spaces, case-sensitively.
    const shown = label.trim();
    if (shown.length === 0 || label.length > MAX_TEXT) {
      problems.push(
        `The label for "${value}" must have 1 to ${MAX_TEXT} characters.`,
      );
    } else if (seenLabels.has(shown)) {
      problems.push(`The label "${shown}" is already in the list.`);
    }
    seenLabels.add(shown);
  }
  return problems;
}

/**
 * The `custom_fields` entry for checkout: one optional dropdown, or nothing
 * when the list is empty or breaks Stripe's limits. With a broken list,
 * checkout opens without the question. The ACQUISITION_SOURCES test catches
 * the list before a push, and the warning below logs it if one ships anyway.
 */
export function acquisitionSourceFields(
  options: readonly SourceOption[] = ACQUISITION_SOURCES,
): Stripe.Checkout.SessionCreateParams.CustomField[] {
  if (options.length === 0) return [];
  const problems = sourceOptionProblems(options);
  if (problems.length > 0) {
    logger.warn(
      { route: "payments.checkout", problems },
      "Checkout source question dropped: the option list breaks Stripe's limits",
    );
    return [];
  }
  return [
    {
      key: FIELD_KEY,
      label: { type: "custom", custom: FIELD_LABEL },
      type: "dropdown",
      optional: true,
      dropdown: {
        options: options.map(({ label, value }) => ({ label, value })),
      },
    },
  ];
}
