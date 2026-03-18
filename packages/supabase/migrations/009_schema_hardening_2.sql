-- Tensorcraft: Schema Hardening Round 2
-- M9: Add NOT NULL constraints on notification columns
-- M8: Drop dead columns (total_lessons_completed, last_active_at)
-- L13: Add CHECK constraints on waitlist.source and achievement_type

-- M9: Ensure notification columns can't be null
ALTER TABLE profiles ALTER COLUMN email_alerts SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN weekly_digest SET NOT NULL;

-- M8: Drop dead columns that are never read or written by the app
ALTER TABLE profiles DROP COLUMN IF EXISTS total_lessons_completed;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_active_at;

-- L13: Add CHECK constraints for known enum-like text columns
-- waitlist.source should be a known value when provided
ALTER TABLE waitlist ADD CONSTRAINT chk_waitlist_source
  CHECK (source IS NULL OR source IN ('landing', 'pricing', 'blog', 'referral', 'social'));

-- L5: Add updated_at to purchases for tracking status changes
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE TRIGGER purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
