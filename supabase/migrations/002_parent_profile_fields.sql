-- ============================================================
-- Migration: Parent / Family Profile Fields
-- Add father_status, mother_status, father_income, mother_income, mother_profession
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS father_status    TEXT CHECK (father_status IN ('alive', 'deceased', 'shaheed')),
    ADD COLUMN IF NOT EXISTS mother_status    TEXT CHECK (mother_status IN ('alive', 'deceased', 'shaheed')),
    ADD COLUMN IF NOT EXISTS father_income    NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS mother_income    NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS mother_profession TEXT,
    ADD COLUMN IF NOT EXISTS domicile_district TEXT;
