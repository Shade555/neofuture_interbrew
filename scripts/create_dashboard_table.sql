-- Create a user_dashboards table to store per-user dashboard data
-- Run this in Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.user_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  readiness_score jsonb DEFAULT '{}'::jsonb,
  streak integer DEFAULT 0,
  favourite_questions jsonb DEFAULT '[]'::jsonb,
  this_week jsonb DEFAULT '{}'::jsonb,
  graph_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- one dashboard per user (user_id may be NULL for seeded/test rows)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dashboards_user_id ON public.user_dashboards(user_id);

-- Optional foreign key to auth.users (requires proper privileges)
-- ALTER TABLE public.user_dashboards
--   ADD CONSTRAINT fk_user_dashboards_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
