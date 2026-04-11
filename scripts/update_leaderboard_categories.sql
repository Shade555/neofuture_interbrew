-- Add category and metrics columns to leaderboard table
ALTER TABLE public.leaderboard
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'XP',
ADD COLUMN IF NOT EXISTS streaks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS certificates INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_leaderboard_category_year_month 
ON public.leaderboard(category, year, month, total_score DESC);

-- Drop old view if it exists
DROP VIEW IF EXISTS public.leaderboard_view CASCADE;

-- Create new view with category support
CREATE VIEW public.leaderboard_view AS
SELECT
  l.id,
  l.user_id,
  u.email as user_name,
  c.name as company,
  l.category,
  l.total_score as score,
  l.challenges_completed as challenges,
  l.accuracy,
  l.streaks,
  l.badges,
  l.certificates,
  l.xp,
  l.month,
  l.year,
  l.recorded_at,
  CASE 
    WHEN l.category = 'Streaks' THEN RANK() OVER (
      PARTITION BY l.category, l.month, l.year 
      ORDER BY l.streaks DESC NULLS LAST
    )
    WHEN l.category = 'Badges' THEN RANK() OVER (
      PARTITION BY l.category, l.month, l.year 
      ORDER BY l.badges DESC NULLS LAST
    )
    WHEN l.category = 'Certificates' THEN RANK() OVER (
      PARTITION BY l.category, l.month, l.year 
      ORDER BY l.certificates DESC NULLS LAST
    )
    ELSE RANK() OVER (
      PARTITION BY l.category, l.month, l.year 
      ORDER BY l.xp DESC NULLS LAST
    )
  END as rank
FROM
  public.leaderboard l
  LEFT JOIN auth.users u ON u.id = l.user_id
  LEFT JOIN public.companies c ON c.id = l.company_id;
