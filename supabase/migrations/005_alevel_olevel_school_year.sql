-- ============================================================
-- Migration: A-Level and O-Level school and year fields
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS alevel_school TEXT,
    ADD COLUMN IF NOT EXISTS alevel_year   INTEGER,
    ADD COLUMN IF NOT EXISTS olevel_school TEXT,
    ADD COLUMN IF NOT EXISTS olevel_year   INTEGER;
