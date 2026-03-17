-- Add notification preference columns to profiles
-- These are referenced by the settings page but were never added to the schema

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS weekly_digest BOOLEAN DEFAULT TRUE;

-- Also add stripe_payment_intent to purchases for refund webhook lookups
-- The refund event (charge.refunded) provides a payment_intent ID, not session ID

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;

-- Index for fast refund lookups by payment_intent
CREATE INDEX IF NOT EXISTS idx_purchases_payment_intent
  ON purchases (stripe_payment_intent)
  WHERE stripe_payment_intent IS NOT NULL;
