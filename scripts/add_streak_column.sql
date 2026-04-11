-- Adds a 'streak' integer column to user_dashboards if the table already exists
ALTER TABLE IF EXISTS public.user_dashboards
  ADD COLUMN IF NOT EXISTS streak integer DEFAULT 0;

-- Update existing rows to set a default streak if needed (optional)
UPDATE public.user_dashboards SET streak = 0 WHERE streak IS NULL;
