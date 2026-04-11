-- Fix RLS policies for public.collection_resources
-- Run in Supabase SQL Editor

-- 1) Enable RLS
ALTER TABLE IF EXISTS public.collection_resources ENABLE ROW LEVEL SECURITY;

-- 2) Remove old policies if they exist
DROP POLICY IF EXISTS select_collection_resources ON public.collection_resources;
DROP POLICY IF EXISTS insert_collection_resources ON public.collection_resources;
DROP POLICY IF EXISTS update_collection_resources ON public.collection_resources;
DROP POLICY IF EXISTS delete_collection_resources ON public.collection_resources;

-- 3) Allow reads for authenticated users
CREATE POLICY select_collection_resources
ON public.collection_resources
FOR SELECT
TO authenticated
USING (true);

-- 4) Allow insert/update/delete for authenticated users
CREATE POLICY insert_collection_resources
ON public.collection_resources
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY update_collection_resources
ON public.collection_resources
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY delete_collection_resources
ON public.collection_resources
FOR DELETE
TO authenticated
USING (true);

-- Optional local/testing-only access for anon:
-- CREATE POLICY select_collection_resources_anon
-- ON public.collection_resources
-- FOR SELECT
-- TO anon
-- USING (true);
--
-- CREATE POLICY insert_collection_resources_anon
-- ON public.collection_resources
-- FOR INSERT
-- TO anon
-- WITH CHECK (true);
--
-- CREATE POLICY update_collection_resources_anon
-- ON public.collection_resources
-- FOR UPDATE
-- TO anon
-- USING (true)
-- WITH CHECK (true);
