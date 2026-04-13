-- Constrain preferred_theme_id to valid theme slugs
ALTER TABLE profiles
ADD CONSTRAINT chk_valid_theme_id
CHECK (preferred_theme_id IS NULL OR preferred_theme_id IN (
  'deep-orbit',
  'neon-protocol',
  'signal-ward',
  'nova-canvas',
  'terra-grid'
));
