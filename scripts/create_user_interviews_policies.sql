-- Enable row level security (if not already enabled)
ALTER TABLE IF EXISTS public.user_interviews ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT only their own interviews
CREATE POLICY select_user_interviews ON public.user_interviews
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to INSERT only rows where user_id = auth.uid()
CREATE POLICY insert_user_interviews ON public.user_interviews
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow users to UPDATE only their own rows, and ensure user_id remains their own
CREATE POLICY update_user_interviews ON public.user_interviews
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to DELETE only their own rows
CREATE POLICY delete_user_interviews ON public.user_interviews
  FOR DELETE
  USING (user_id = auth.uid());

-- Ensure `status` column exists to mark interviews
ALTER TABLE public.user_interviews
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled';

-- Notes:
-- 1) Run this file in the Supabase SQL editor as a project admin.
-- 2) Service role key (used in server-side scripts) bypasses RLS.
-- 3) If you also want public read access, change the SELECT policy accordingly.
