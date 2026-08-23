# Support runbook

Written 2026-08-23. `support@tensorcraft.app` was a mailbox with no process
behind it, which is fine at zero traffic and stops being fine in launch week.

This covers the cases that actually arrive: refunds, disputes, access
problems, and privacy requests. It assumes one operator.

## Response-time target

**One business day for a first reply, including "I am looking at it".**

Set that expectation because the alternative is worse: a buyer who has paid
and cannot get in will open a card dispute rather than wait, and a dispute
costs the fee plus the evidence work plus the access revocation, whether or
not you win it.

Refund requests get answered the same day where possible. A refund is cheaper
than a chargeback in every dimension.

## 1. Refunds

**The terms are unconditional 14 days.** There is no "less than 20% accessed"
condition any more; that clause was removed in 2026-07 because it was
unenforceable against EU and UK consumers without a waiver nobody collected.
Do not reintroduce it in an email. If someone asks inside 14 days, refund.

### Steps

1. Find the payment in the Stripe dashboard by the buyer's email or the order
   reference from their receipt (`cs_...`, the Checkout Session id).
2. Refund it in Stripe. Full refund unless they explicitly asked for partial.
3. **Do nothing in the database.** The `charge.refunded` webhook flips the
   purchase to `refunded` and access drops on its own.
4. Confirm to the buyer, and say when the money lands: card refunds typically
   show in 5 to 10 business days, which is the single most common follow-up
   question.

### What not to do

**Never run a bulk `update purchases set status = 'refunded'`.** The old
incident runbook at `docs/pre-launch-checklist.md` suggested it. It revokes
access from legitimate buyers, and since migration 038's terminal-status
trigger it is silently ignored on the corrective path anyway, so you get the
damage without the fix. Refund per Stripe event, never in SQL.

### If the webhook did not fire

Symptom: refunded in Stripe, but the learner still has access, or the
purchase row still reads `completed`.

Check the Stripe dashboard's webhook delivery log for that event first. The
handler 500s deliberately when it matches zero rows, so Stripe retries for
about three days. If it exhausted, resend the event from Stripe rather than
editing the row by hand.

## 2. Disputes and chargebacks

A dispute is not a refund. Stripe pulls the money immediately and charges a
fee, and you have a fixed window to submit evidence.

### On notification

1. Access is already revoked: the `charge.dispute.created` webhook sets the
   purchase to `disputed` automatically. Do not also refund, that pays twice.
2. Decide whether to contest. If the buyer is reachable and the complaint is
   really a refund request, offering the refund and asking them to withdraw
   the dispute is usually cheaper than fighting it.

### Evidence to submit

Assemble from what the product already records:

- The receipt email (proof of what was bought and when).
- The Checkout Session id and Stripe's own customer and billing details.
- Access and usage: lessons completed and exercise attempts for that account,
  which show the product was delivered and used.
- The terms in force at purchase, specifically the unconditional 14-day
  refund policy, which demonstrates a refund was available and unused.

### If you win

Access must be restored, and this one has a trap. Migration 038's trigger
clamps terminal statuses, so a manual `update` back to `completed` is silently
ignored: it reports success and changes nothing.

Use the sanctioned path:

```sql
select public.restore_purchase_after_dispute('pi_...');
```

The `charge.dispute.closed` webhook does this automatically on a `won`
outcome, so the manual call is only for when that did not land. It no-ops on
`lost`, which is correct.

## 3. Access problems

**"I paid and cannot get in."** The usual cause is a webhook that has not
landed yet, not a lost payment. Check the purchase row exists for their email
and reads `completed`. If Stripe shows the charge and the row is missing,
resend the `checkout.session.completed` event from Stripe rather than
inserting a row by hand.

**"I cannot buy from here."** Purchases are gated to the United States while
the business registration is outstanding. EU and UK visitors keep full free
access and can leave an email on the pricing page to be told when paid access
opens. Say that plainly; it is not a bug and they should not be told to retry.

**GitHub connection refused.** The token endpoint now rejects a token whose
GitHub account is not the caller's. If a learner hits this, they are almost
certainly signed in to a different GitHub account than the one they connected
originally. Disconnecting and reconnecting resolves it.

## 4. Privacy requests

Both are self-serve in Settings, so the first reply is usually a pointer:

- **Export**: Settings has a download button producing a JSON file of the
  account and every table keyed to it.
- **Deletion**: Settings has a typed-confirmation delete flow. Purchase and
  tax records survive it, unlinked from identity, because tax law requires
  keeping them. Say that explicitly if asked, it reads as a broken deletion
  otherwise.

**The 30-day clock is legal, not aspirational.** If a request arrives by email
rather than through Settings, treat the received date as day zero and do not
let it sit in the inbox.

## 5. Escalation and known traps

- **Anything touching the database on the money path** goes through a
  migration or the sanctioned RPC, never an ad-hoc `update`. Two triggers
  (038, 040) silently ignore writes that look like client updates, so "it
  said it worked" is not evidence that it worked.
- **Nothing currently alerts.** Sentry captures errors but no rule notifies
  anyone, so support email is presently the primary outage detector. Treat
  two unrelated reports of the same symptom as an incident.
- **Kit is not sending.** Lifecycle emails are dark until the Kit credentials
  are repaired. Purchase receipts are unaffected: those go through Resend.
