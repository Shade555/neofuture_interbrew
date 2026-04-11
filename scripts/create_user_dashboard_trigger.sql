-- Create a trigger that upserts a user_dashboard row when a new auth user signs up.
-- Run this in the Supabase SQL editor. After creating the function, set its owner
-- to a privileged role (for example `postgres` or `supabase_admin`) so the
-- SECURITY DEFINER has sufficient rights. Example:
--   ALTER FUNCTION public.create_user_dashboard() OWNER TO postgres;

-- Function: create_user_dashboard()
CREATE OR REPLACE FUNCTION public.create_user_dashboard()
RETURNS trigger AS $$
BEGIN
  -- Insert a default dashboard row for the new user. Use ON CONFLICT DO NOTHING
  -- so re-running the seed/upserts won't fail.
  INSERT INTO public.user_dashboards (
    user_id, streak, readiness_score, favourite_questions, this_week, graph_data, created_at, updated_at
  ) VALUES (
    NEW.id,
    0,
    '{}'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ) ON CONFLICT (user_id) DO UPDATE SET updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for AFTER INSERT
DROP TRIGGER IF EXISTS user_dashboard_on_auth ON auth.users;
CREATE TRIGGER user_dashboard_on_auth
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_dashboard();

-- IMPORTANT: Set function owner to a privileged role in Supabase SQL editor.
-- Example (run as supabase SQL admin):
--   ALTER FUNCTION public.create_user_dashboard() OWNER TO postgres;
