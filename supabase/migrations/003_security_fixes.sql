-- ============================================================
-- Security fixes — applied 2026-03-25
-- ============================================================

-- 1. Enable RLS on field_maps (was fully public — no RLS at all)
ALTER TABLE public.field_maps ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to read field mappings
-- The extension needs to read these without a user session
CREATE POLICY "Public read field_maps"
    ON public.field_maps FOR SELECT
    USING (true);

-- Only service_role can INSERT / UPDATE / DELETE
-- (No policy for anon/authenticated means those operations are blocked by default)
CREATE POLICY "Service role write field_maps"
    ON public.field_maps FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
