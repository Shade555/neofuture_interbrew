-- Add readiness_breakdown jsonb column to user_dashboards
ALTER TABLE IF EXISTS public.user_dashboards
  ADD COLUMN IF NOT EXISTS readiness_breakdown jsonb DEFAULT '{}'::jsonb;

-- Ensure existing rows get a default breakdown if desired
UPDATE public.user_dashboards
SET readiness_breakdown = COALESCE(readiness_breakdown, jsonb_build_object('verbal', 0, 'aptitude', 0, 'coding', 0, 'critical_thinking', 0))
WHERE readiness_breakdown IS NULL OR readiness_breakdown = '{}';
