-- Alter readiness_score column from numeric to jsonb
-- Run this in Supabase SQL editor (or via psql) before seeding per-skill readiness

BEGIN;

-- Drop the existing default (numeric) so the type change can proceed
ALTER TABLE public.user_dashboards
  ALTER COLUMN readiness_score DROP DEFAULT;

-- Convert numeric readiness_score values to jsonb
ALTER TABLE public.user_dashboards
  ALTER COLUMN readiness_score TYPE jsonb USING to_jsonb(readiness_score);

-- Set a sensible jsonb default for new rows
ALTER TABLE public.user_dashboards
  ALTER COLUMN readiness_score SET DEFAULT '{}'::jsonb;

COMMIT;

-- Note: If the column is already jsonb, dropping the default and setting the same default is safe.
