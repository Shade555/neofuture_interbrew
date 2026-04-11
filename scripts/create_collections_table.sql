-- Create a collections table to store collection cards
-- Run this in Supabase SQL editor or psql

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  section text,
  "order" int DEFAULT 0,
  image_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: grant select/insert/update/delete to anon (if desired)
-- GRANT SELECT ON public.collections TO anon;
