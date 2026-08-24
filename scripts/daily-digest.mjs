#!/usr/bin/env node
/**
 * Daily operator digest: the absence detector.
 *
 * Every other alert in this system fires when something HAPPENS. Nothing fires
 * when something STOPS. Signups going to zero, purchases drying up, the
 * webhook falling silent: all invisible, because there is no event to hang an
 * alert on. That is the classic hole in event-driven monitoring, and this
 * closes it in the cheapest way that works.
 *
 * The numbers are half the point. The other half is that a MISSING email is
 * itself the signal. If this stops arriving, either the job died or the
 * infrastructure it queries did, and both are things you want to know.
 *
 * It also does the one reconciliation nothing else does: Stripe's count of
 * paid sessions against our purchases table. A drift means a customer paid and
 * we did not record it, which is the single most expensive silent failure in
 * the product.
 *
 *   node scripts/daily-digest.mjs            # query and send
 *   node scripts/daily-digest.mjs --dry-run  # query and print, send nothing
 *
 * Reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY,
 * RESEND_API_KEY, OPERATOR_ALERT_EMAIL. Exits non-zero when it cannot do its
 * job, so the workflow goes red AND withholds its heartbeat.
 */

const DRY_RUN = process.argv.includes("--dry-run");

function required(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Missing ${name}. Refusing to report partial numbers.`);
    process.exit(2);
  }
  return v;
}

const SUPABASE_URL = required("SUPABASE_URL");
const SERVICE_KEY = required("SUPABASE_SERVICE_ROLE_KEY");

const sinceIso = (hours) =>
  new Date(Date.now() - hours * 3600 * 1000).toISOString();

/** Count rows created since a timestamp, using PostgREST's exact count. */
async function countSince(table, column, since) {
  const url =
    `${SUPABASE_URL}/rest/v1/${table}` +
    `?select=${column}&${column}=gte.${encodeURIComponent(since)}`;
  const res = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      // head+exact gives the count in a header without shipping the rows.
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  if (!res.ok) {
    throw new Error(`${table} count failed: HTTP ${res.status}`);
  }
  // Content-Range looks like "0-0/12"; the tail is the total.
  const total = res.headers.get("content-range")?.split("/")?.[1];
  return Number.parseInt(total ?? "0", 10) || 0;
}

/** Paid Stripe sessions in a window, for reconciliation against our own rows. */
async function stripePaidSessions(sinceUnix) {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null; // Reconciliation is optional; the rest still works.
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions?limit=100&created[gte]=${sinceUnix}`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) throw new Error(`Stripe query failed: HTTP ${res.status}`);
  const body = await res.json();
  return (body.data ?? []).filter((s) => s.payment_status === "paid").length;
}

async function main() {
  const day = sinceIso(24);
  const week = sinceIso(24 * 7);
  const dayUnix = Math.floor((Date.now() - 24 * 3600 * 1000) / 1000);

  const [
    signups24,
    signups7d,
    purchases24,
    purchases7d,
    waitlist24,
    waitlist7d,
    progress24,
  ] = await Promise.all([
    countSince("profiles", "created_at", day),
    countSince("profiles", "created_at", week),
    countSince("purchases", "created_at", day),
    countSince("purchases", "created_at", week),
    countSince("waitlist", "created_at", day),
    countSince("waitlist", "created_at", week),
    countSince("world_progress", "created_at", day),
  ]);

  let stripePaid24 = null;
  let reconciliation = "skipped (no STRIPE_SECRET_KEY)";
  try {
    stripePaid24 = await stripePaidSessions(dayUnix);
    if (stripePaid24 !== null) {
      reconciliation =
        stripePaid24 === purchases24
          ? `OK (${stripePaid24} paid, ${purchases24} recorded)`
          : `** DRIFT ** Stripe ${stripePaid24} paid vs ${purchases24} recorded. ` +
            `Someone may have paid without being granted access.`;
    }
  } catch (err) {
    reconciliation = `could not check: ${err.message}`;
  }

  const lines = [
    `Signups            ${signups24} today   ${signups7d} this week`,
    `Purchases          ${purchases24} today   ${purchases7d} this week`,
    `Waitlist           ${waitlist24} today   ${waitlist7d} this week`,
    `Lessons started    ${progress24} today`,
    ``,
    `Stripe vs database ${reconciliation}`,
    ``,
    `A zero is information. A missing digest means this job or its`,
    `infrastructure died: check the workflow before assuming a quiet day.`,
  ];
  const text = lines.join("\n");

  // Drift is the one thing worth seeing without opening the mail.
  const drift = reconciliation.startsWith("** DRIFT **");
  const subject = drift
    ? `[Tensorcraft] DIGEST: payment drift detected`
    : `[Tensorcraft] Daily: ${signups24} signups, ${purchases24} purchases`;

  if (DRY_RUN) {
    console.log(subject);
    console.log("-".repeat(subject.length));
    console.log(text);
    return;
  }

  const resendKey = required("RESEND_API_KEY");
  const to =
    process.env.OPERATOR_ALERT_EMAIL?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    "support@tensorcraft.app";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Tensorcraft <noreply@tensorcraft.app>",
      to,
      subject,
      text,
    }),
  });
  if (!res.ok) {
    // Failing loudly matters more here than anywhere else: a digest that
    // silently stops sending looks exactly like a quiet week.
    throw new Error(
      `Resend rejected the digest: HTTP ${res.status} ${await res.text()}`,
    );
  }
  console.log(`Digest sent to ${to}: ${subject}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
