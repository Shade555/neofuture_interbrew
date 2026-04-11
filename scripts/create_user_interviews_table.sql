-- Create a table to store per-user scheduled interviews
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.user_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  interview_date date NOT NULL,
  subject text,
  difficulty text,
  round text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_interviews_user_date ON public.user_interviews(user_id, interview_date);

-- Optionally add a foreign key to auth.users if desired:
-- ALTER TABLE public.user_interviews ADD CONSTRAINT fk_user_interviews_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
